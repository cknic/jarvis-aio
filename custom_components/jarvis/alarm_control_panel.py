"""JARVIS alarm_control_panel platform (fork Phase 1).

``alarm_control_panel.jarvis_lockdown`` — headline: the formal lockdown.

* ``armed_away`` while ``coordinator.data["lockdown"]["active"]``;
* ``triggered`` while ``coordinator.data["intrusion"]`` reports a confirmed
  intrusion;
* ``disarmed`` otherwise.

Arming/disarming performs what the panel's ``jarvis/set_lockdown`` does:
``cognitive_core.request_lockdown(on, reason=..., hass=hass)`` followed by a
coordinator refresh. Only ARM_AWAY is supported and no code is required.

NOTE: this entity lives in the ``alarm_control_panel`` domain that
``cognitive_core`` sweeps (``_alarm_state_view``, ``_armed_mode``,
``*_alarm_armed``) to read the HOUSEHOLD alarm. It carries the state attribute
``jarvis_internal: True`` so those sweeps can exclude it; until they do, an
active lockdown reads back as "alarm armed (away)".
"""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.alarm_control_panel import (
    AlarmControlPanelEntity,
    AlarmControlPanelEntityFeature,
    AlarmControlPanelState,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DATA_COORDINATOR, DOMAIN
from .coordinator import JarvisCoordinator
from .entity import JarvisEntity

_LOGGER = logging.getLogger(__name__)

LOCKDOWN_REASON = "requested from Home Assistant"


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    coordinator: JarvisCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    async_add_entities([JarvisLockdownAlarm(coordinator)])


class JarvisLockdownAlarm(JarvisEntity, AlarmControlPanelEntity):
    """Headline alarm panel: JARVIS's formal lockdown."""

    _attr_name = "Lockdown"
    _attr_icon = "mdi:shield-lock-outline"
    _attr_supported_features = AlarmControlPanelEntityFeature.ARM_AWAY
    _attr_code_arm_required = False
    _attr_code_format = None

    def __init__(self, coordinator: JarvisCoordinator) -> None:
        super().__init__(coordinator, key="lockdown")

    @property
    def _lockdown(self) -> dict:
        return self.snapshot.get("lockdown") or {}

    @property
    def _intrusion(self) -> dict:
        return self.snapshot.get("intrusion") or {}

    @property
    def alarm_state(self) -> AlarmControlPanelState | None:
        if self._intrusion.get("confirmed"):
            return AlarmControlPanelState.TRIGGERED
        if self._lockdown.get("active"):
            return AlarmControlPanelState.ARMED_AWAY
        return AlarmControlPanelState.DISARMED

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        lockdown, intrusion = self._lockdown, self._intrusion
        return {
            # Marker: this panel MIRRORS the lockdown; it is not a household
            # alarm. cognitive_core's alarm sweeps must skip it (see module doc).
            "jarvis_internal": True,
            "since": lockdown.get("since"),
            "reason": lockdown.get("reason"),
            "auto": lockdown.get("auto"),
            "exempt_windows": lockdown.get("exempt_windows"),
            "intrusion_active": bool(intrusion.get("active")),
            "intrusion_confirmed": bool(intrusion.get("confirmed")),
            "breach_area": intrusion.get("breach_name") or intrusion.get("breach_area"),
        }

    async def _set_lockdown(self, on: bool) -> None:
        from . import cognitive_core
        ok = await cognitive_core.request_lockdown(on, reason=LOCKDOWN_REASON, hass=self.hass)
        if not ok:
            _LOGGER.warning("Lockdown %s request returned not-ok; status=%s",
                            "engage" if on else "lift", cognitive_core.lockdown_status())
            raise HomeAssistantError(
                f"JARVIS could not {'engage' if on else 'lift'} the lockdown")
        await self.coordinator.async_request_refresh()

    async def async_alarm_arm_away(self, code: str | None = None) -> None:
        await self._set_lockdown(True)

    async def async_alarm_disarm(self, code: str | None = None) -> None:
        await self._set_lockdown(False)
