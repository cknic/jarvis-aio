"""Import a floor-plan background from a vacuum-robot map or any dashboard image
entity, so the Residence floor-plan editor needs no manual upload (#405).

Home Assistant already surfaces a robot vacuum's cleaned-area map as an `image.*`
or `camera.*` entity (e.g. `image.cleaner_living_room_map_0`, Valetudo's
`camera.<robot>_map`), and dashboards often carry a floor-plan picture the same
way. This module:

  * `is_floorplan_source` / `list_sources` — find those entities, and
  * `async_import_to_floor` — fetch the entity's current image and store it as
    the `floor_plan_bg` background for a floor, exactly as the manual file upload
    does (a `data:` URL merged into the per-floor JSON map), and
  * `async_set_floor_background` — the one per-floor write behind both that
    import and the panel's `jarvis/set_floor_background` (upload, remove,
    alignment): validate, merge ONLY that floor into the runtime-aware value,
    persist through `config_apply.async_apply_many`. HA's websocket takes at
    most 4 MiB per incoming frame, so the old whole-dict write capped every
    floor's image together at that.

Everything is best-effort and defensive: a fetch failure raises a clear message
for the panel to show, and nothing else in JARVIS depends on this path.
"""
from __future__ import annotations

import base64
import json
import logging
import math
import re
from typing import Any, Optional

_LOGGER = logging.getLogger(__name__)

# Entity-id / name tokens that mark an image as a map or floor plan. Vacuum map
# entities and dashboard floor-plan pictures both land here.
_MAP_TOKENS = (
    "map", "floor", "plan", "vacuum", "cleaner", "roborock", "valetudo",
    "robot", "lidar", "mop", "neato", "dreame", "ecovacs", "rooms",
)

# Image bytes smaller than this are almost certainly an error/placeholder.
_MIN_IMAGE_SIZE = 1024

# floor_plan_bg = {"<floor>": "data:image/...", ..., "_align": {"<floor>": {x, y, w}}}:
# the alignment entry rides inside the same dict (the panel's import-layers.ts).
ALIGN_KEY = "_align"
# A floor key: a letter or digit first (so "_align" and any later "_" entry stay
# reserved), then word characters, space, dot or hyphen; at most 64 in all.
_FLOOR_RE = re.compile(r"[^\W_][\w .-]{0,63}")
# What a background may be: an inline image (the panel's isImportableImage test).
_DATA_IMAGE_RE = re.compile(r"^data:image/[a-z0-9.+-]+[;,]", re.IGNORECASE)
# "leave this part of the floor as it is" (None means remove it).
_KEEP: Any = object()


def is_floorplan_source(entity_id: str, friendly_name: Optional[str] = None) -> bool:
    """True when this entity looks like a usable floor-plan / vacuum-map image.

    Any ``image.*`` entity qualifies (that domain is essentially always a map,
    snapshot or plan), as does any ``image``/``camera`` entity whose id or name
    names a map/floor/vacuum. Pure and cheap."""
    if not entity_id:
        return False
    domain = entity_id.split(".", 1)[0].lower()
    if domain not in ("image", "camera"):
        return False
    if domain == "image":
        return True
    hay = f"{entity_id} {friendly_name or ''}".lower()
    return any(tok in hay for tok in _MAP_TOKENS)


def list_sources(hass) -> list[dict]:
    """Candidate floor-plan source entities, as ``{entity_id, name, domain}``.

    Image entities first (most likely), then matching cameras; both sorted by
    name so the panel dropdown is stable."""
    out: list[dict] = []
    try:
        for domain in ("image", "camera"):
            rows = []
            for st in hass.states.async_all(domain):
                name = st.attributes.get("friendly_name", st.entity_id)
                if is_floorplan_source(st.entity_id, name):
                    rows.append({"entity_id": st.entity_id,
                                 "name": str(name), "domain": domain})
            rows.sort(key=lambda r: r["name"].lower())
            out.extend(rows)
    except Exception as exc:  # noqa: BLE001 - discovery is best-effort
        _LOGGER.debug("floorplan sources enumeration failed: %s", exc)
    return out


async def _fetch_image_bytes(hass, entity_id: str) -> tuple[bytes, str]:
    """Return ``(content, content_type)`` for an image/camera entity's current
    frame.

    Prefers the domain's **in-process** helper (``image``/``camera``
    ``async_get_image``) — the canonical bytes straight from the entity, with no
    HTTP round-trip and no proxy access-token that can go stale. That is what
    lets official integrations import cleanly: a Roborock ``image.*`` map renders
    fine in the dashboard yet its cached ``entity_picture`` proxy fetch was
    failing here (#405), because ``image.*`` had no in-process fallback — only
    ``camera.*`` did. Falls back to fetching the entity's ``entity_picture`` proxy
    URL (covers entities HA serves only that way). Raises ValueError with a
    readable message on failure."""
    state = hass.states.get(entity_id)
    if state is None:
        raise ValueError(f"{entity_id} is not available")
    domain = entity_id.split(".", 1)[0].lower()

    # 1. In-process domain helper — no HTTP, no proxy token. image.* was the gap
    #    that made official vacuum-map imports (#405) fail; camera.* keeps the
    #    same canonical read it always had.
    _dom_get = None
    default_ctype = "image/png"
    try:
        if domain == "image":
            from homeassistant.components.image import async_get_image as _dom_get
        elif domain == "camera":
            from homeassistant.components.camera import async_get_image as _dom_get
            default_ctype = "image/jpeg"
    except Exception as exc:  # noqa: BLE001 - helper not importable; use the proxy
        _LOGGER.debug("floorplan helper import failed for %s: %s", entity_id, exc)
        _dom_get = None
    if _dom_get is not None:
        try:
            img = await _dom_get(hass, entity_id, timeout=15)
            content = getattr(img, "content", None)
            if content:
                return content, (getattr(img, "content_type", None) or default_ctype)
        except Exception as exc:  # noqa: BLE001 - fall through to the proxy URL
            _LOGGER.debug("floorplan in-process fetch failed for %s: %s", entity_id, exc)

    # 2. entity_picture proxy URL fallback — universal for image.* and camera.*.
    pic = state.attributes.get("entity_picture")
    if pic:
        try:
            from homeassistant.helpers.aiohttp_client import async_get_clientsession
            from homeassistant.helpers.network import get_url
            import aiohttp
            try:
                base = get_url(hass, allow_internal=True, prefer_external=False)
            except Exception:
                base = "http://127.0.0.1:8123"
            url = pic if pic.startswith("http") else f"{base}{pic}"
            session = async_get_clientsession(hass)
            async with session.get(
                url, timeout=aiohttp.ClientTimeout(total=15)
            ) as resp:
                if resp.status == 200:
                    data = await resp.read()
                    if data and len(data) >= _MIN_IMAGE_SIZE:
                        ctype = resp.headers.get("Content-Type", "image/png").split(";")[0]
                        return data, ctype
                _LOGGER.debug("floorplan fetch %s via picture: HTTP %s / %s bytes",
                              entity_id, resp.status, len(data) if 'data' in dir() else 0)
        except Exception as exc:  # noqa: BLE001 - fall through to the error below
            _LOGGER.debug("floorplan picture fetch failed for %s: %s", entity_id, exc)

    raise ValueError(f"couldn't read an image from {entity_id}")


def _parse_backgrounds(raw) -> dict:
    """The stored ``floor_plan_bg`` as a fresh dict. Tolerant of a str, dict or
    empty prior value (the vacuum import used to store JSON text)."""
    if isinstance(raw, dict):
        return dict(raw)
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
    return {}


def merge_floor_background(raw, floor: str, *, image=_KEEP, align=_KEEP) -> dict:
    """A copy of ``floor_plan_bg`` with only ``floor`` changed: ``image`` (a
    ``data:`` URL) replaces its image and ``align`` its ``_align`` entry; ``None``
    removes either, an omitted argument keeps it. Other floors, their alignments
    and unknown keys are carried over untouched; an empty ``_align`` is dropped."""
    bgs = _parse_backgrounds(raw)
    if image is not _KEEP:
        if image:
            bgs[floor] = image
        else:
            bgs.pop(floor, None)
    if align is not _KEEP:
        prior = bgs.get(ALIGN_KEY)
        al = dict(prior) if isinstance(prior, dict) else {}
        if align:
            al[floor] = dict(align)
        else:
            al.pop(floor, None)
        if al:
            bgs[ALIGN_KEY] = al
        else:
            bgs.pop(ALIGN_KEY, None)
    return bgs


def _merge_background(raw, floor: str, data_url: str) -> str:
    """Merge ``data_url`` into the ``floor_plan_bg`` JSON under ``floor`` and
    return the new JSON string (:func:`merge_floor_background` as text)."""
    return json.dumps(merge_floor_background(raw, floor, image=data_url))


def validate_floor(floor) -> str:
    """The floor key, or ValueError: a letter or digit first, then word
    characters / space / dot / hyphen, 64 at most; ``_align`` is reserved."""
    if not isinstance(floor, str) or floor == ALIGN_KEY or not _FLOOR_RE.fullmatch(floor):
        raise ValueError(f"'{str(floor)[:40]}' is not a floor key")
    return floor


def validate_image(image) -> Optional[str]:
    """A ``data:image/*`` URL, or ``None`` for null / "" (remove). Anything
    else (an external URL, an /api/ path, another data: type) is a ValueError:
    every admin's panel would load it."""
    if image is None or image == "":
        return None
    if not isinstance(image, str) or not _DATA_IMAGE_RE.match(image):
        raise ValueError("the image must be a data:image/... URL")
    return image


def validate_align(align) -> Optional[dict]:
    """``{x, y, w}`` in plan units as floats (finite, ``w`` > 0; other keys are
    dropped), or ``None`` to remove the floor's alignment. Else ValueError."""
    if align is None:
        return None
    if not isinstance(align, dict):
        raise ValueError("align must be {x, y, w} or null")
    out = {}
    for key in ("x", "y", "w"):
        v = align.get(key)
        if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
            raise ValueError(f"align.{key} must be a finite number")
        out[key] = float(v)
    if out["w"] <= 0:
        raise ValueError("align.w must be greater than 0")
    return out


async def async_set_floor_background(hass, entry, floor, *, image=_KEEP, align=_KEEP) -> dict:
    """Set or remove ONE floor's background image and/or alignment.

    Validates (:func:`validate_floor` / :func:`validate_image` /
    :func:`validate_align`), reads the current ``floor_plan_bg`` runtime-aware
    (runtime_config -> config.json -> entry), merges only ``floor`` and writes
    the dict through ``config_apply.async_apply_many`` (runtime_config,
    config.json, coordinator refresh, mirror signal). Returns ``{"floor",
    "bytes", "align"}``: the length of the floor's stored image (0 when it has
    none) and its alignment (or None). Raises ValueError for bad input or when
    neither ``image`` nor ``align`` is given."""
    floor = validate_floor(floor)
    if image is _KEEP and align is _KEEP:
        raise ValueError("nothing to change: pass image and/or align")
    if image is not _KEEP:
        image = validate_image(image)
    if align is not _KEEP:
        align = validate_align(align)
    from . import config_apply
    from .panel_data import _get_runtime_json
    current = _get_runtime_json(hass, entry, "floor_plan_bg", {})
    merged = merge_floor_background(current, floor, image=image, align=align)
    await config_apply.async_apply_many(hass, entry, {"floor_plan_bg": merged})
    stored = merged.get(floor)
    al = merged.get(ALIGN_KEY)
    return {
        "floor": floor,
        "bytes": len(stored) if isinstance(stored, str) else 0,
        "align": al.get(floor) if isinstance(al, dict) else None,
    }


async def async_import_to_floor(hass, entity_id: str, floor: str = "1f") -> dict:
    """Fetch ``entity_id``'s image and store it as the ``floor_plan_bg`` for
    ``floor``. Returns ``{"floor", "entity_id", "bytes"}``. Raises ValueError with
    a readable message on failure (no image, nothing to import)."""
    floor = str(floor or "1f")
    content, ctype = await _fetch_image_bytes(hass, entity_id)
    if not ctype.startswith("image/"):
        ctype = "image/png"
    data_url = f"data:{ctype};base64," + base64.b64encode(content).decode("ascii")

    # Merge only this floor into the runtime-aware value and persist it the way
    # the panel's own per-floor write does (runtime_config + config.json + the
    # coordinator signal), so it shows up at once and survives restarts.
    from .panel_data import _get_entry
    await async_set_floor_background(hass, _get_entry(hass), floor, image=data_url)

    _LOGGER.info("JARVIS: imported floor plan for %s from %s (%d bytes)",
                 floor, entity_id, len(content))
    return {"floor": floor, "entity_id": entity_id, "bytes": len(content)}
