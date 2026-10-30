/* JARVIS panel. Built from frontend/ with `npm run build`; do not edit by hand. */
var zv=Object.defineProperty;var Kv=Object.getOwnPropertyDescriptor;var h=(r,i,e,t)=>{for(var n=t>1?void 0:t?Kv(i,e):i,s=r.length-1,o;s>=0;s--)(o=r[s])&&(n=(t?o(i,e,n):o(n))||n);return t&&n&&zv(i,e,n),n};var vs=globalThis,ms=vs.ShadowRoot&&(vs.ShadyCSS===void 0||vs.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,po=Symbol(),jc=new WeakMap,wi=class{constructor(i,e,t){if(this._$cssResult$=!0,t!==po)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=i,this.t=e}get styleSheet(){let i=this.o,e=this.t;if(ms&&i===void 0){let t=e!==void 0&&e.length===1;t&&(i=jc.get(e)),i===void 0&&((this.o=i=new CSSStyleSheet).replaceSync(this.cssText),t&&jc.set(e,i))}return i}toString(){return this.cssText}},kc=r=>new wi(typeof r=="string"?r:r+"",void 0,po),S=(r,...i)=>{let e=r.length===1?r[0]:i.reduce((t,n,s)=>t+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+r[s+1],r[0]);return new wi(e,r,po)},Sc=(r,i)=>{if(ms)r.adoptedStyleSheets=i.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of i){let t=document.createElement("style"),n=vs.litNonce;n!==void 0&&t.setAttribute("nonce",n),t.textContent=e.cssText,r.appendChild(t)}},ho=ms?r=>r:r=>r instanceof CSSStyleSheet?(i=>{let e="";for(let t of i.cssRules)e+=t.cssText;return kc(e)})(r):r;var{is:Uv,defineProperty:qv,getOwnPropertyDescriptor:Wv,getOwnPropertyNames:Gv,getOwnPropertySymbols:Vv,getPrototypeOf:Yv}=Object,fs=globalThis,Ec=fs.trustedTypes,Xv=Ec?Ec.emptyScript:"",Zv=fs.reactiveElementPolyfillSupport,$i=(r,i)=>r,xi={toAttribute(r,i){switch(i){case Boolean:r=r?Xv:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,i){let e=r;switch(i){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},gs=(r,i)=>!Uv(r,i),Rc={attribute:!0,type:String,converter:xi,reflect:!1,useDefault:!1,hasChanged:gs};Symbol.metadata??=Symbol("metadata"),fs.litPropertyMetadata??=new WeakMap;var $n=class extends HTMLElement{static addInitializer(i){this._$Ei(),(this.l??=[]).push(i)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(i,e=Rc){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(i)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(i,e),!e.noAccessor){let t=Symbol(),n=this.getPropertyDescriptor(i,t,e);n!==void 0&&qv(this.prototype,i,n)}}static getPropertyDescriptor(i,e,t){let{get:n,set:s}=Wv(this.prototype,i)??{get(){return this[e]},set(o){this[e]=o}};return{get:n,set(o){let l=n?.call(this);s?.call(this,o),this.requestUpdate(i,l,t)},configurable:!0,enumerable:!0}}static getPropertyOptions(i){return this.elementProperties.get(i)??Rc}static _$Ei(){if(this.hasOwnProperty($i("elementProperties")))return;let i=Yv(this);i.finalize(),i.l!==void 0&&(this.l=[...i.l]),this.elementProperties=new Map(i.elementProperties)}static finalize(){if(this.hasOwnProperty($i("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($i("properties"))){let e=this.properties,t=[...Gv(e),...Vv(e)];for(let n of t)this.createProperty(n,e[n])}let i=this[Symbol.metadata];if(i!==null){let e=litPropertyMetadata.get(i);if(e!==void 0)for(let[t,n]of e)this.elementProperties.set(t,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(i){let e=[];if(Array.isArray(i)){let t=new Set(i.flat(1/0).reverse());for(let n of t)e.unshift(ho(n))}else i!==void 0&&e.push(ho(i));return e}static _$Eu(i,e){let t=e.attribute;return t===!1?void 0:typeof t=="string"?t:typeof i=="string"?i.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(i=>this.enableUpdating=i),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(i=>i(this))}addController(i){(this._$EO??=new Set).add(i),this.renderRoot!==void 0&&this.isConnected&&i.hostConnected?.()}removeController(i){this._$EO?.delete(i)}_$E_(){let i=new Map,e=this.constructor.elementProperties;for(let t of e.keys())this.hasOwnProperty(t)&&(i.set(t,this[t]),delete this[t]);i.size>0&&(this._$Ep=i)}createRenderRoot(){let i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Sc(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(i=>i.hostConnected?.())}enableUpdating(i){}disconnectedCallback(){this._$EO?.forEach(i=>i.hostDisconnected?.())}attributeChangedCallback(i,e,t){this._$AK(i,t)}_$ET(i,e){let t=this.constructor.elementProperties.get(i),n=this.constructor._$Eu(i,t);if(n!==void 0&&t.reflect===!0){let s=(t.converter?.toAttribute!==void 0?t.converter:xi).toAttribute(e,t.type);this._$Em=i,s==null?this.removeAttribute(n):this.setAttribute(n,s),this._$Em=null}}_$AK(i,e){let t=this.constructor,n=t._$Eh.get(i);if(n!==void 0&&this._$Em!==n){let s=t.getPropertyOptions(n),o=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:xi;this._$Em=n;let l=o.fromAttribute(e,s.type);this[n]=l??this._$Ej?.get(n)??l,this._$Em=null}}requestUpdate(i,e,t,n=!1,s){if(i!==void 0){let o=this.constructor;if(n===!1&&(s=this[i]),t??=o.getPropertyOptions(i),!((t.hasChanged??gs)(s,e)||t.useDefault&&t.reflect&&s===this._$Ej?.get(i)&&!this.hasAttribute(o._$Eu(i,t))))return;this.C(i,e,t)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(i,e,{useDefault:t,reflect:n,wrapped:s},o){t&&!(this._$Ej??=new Map).has(i)&&(this._$Ej.set(i,o??e??this[i]),s!==!0||o!==void 0)||(this._$AL.has(i)||(this.hasUpdated||t||(e=void 0),this._$AL.set(i,e)),n===!0&&this._$Em!==i&&(this._$Eq??=new Set).add(i))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let i=this.scheduleUpdate();return i!=null&&await i,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[n,s]of this._$Ep)this[n]=s;this._$Ep=void 0}let t=this.constructor.elementProperties;if(t.size>0)for(let[n,s]of t){let{wrapped:o}=s,l=this[n];o!==!0||this._$AL.has(n)||l===void 0||this.C(n,void 0,s,l)}}let i=!1,e=this._$AL;try{i=this.shouldUpdate(e),i?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(t){throw i=!1,this._$EM(),t}i&&this._$AE(e)}willUpdate(i){}_$AE(i){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(i)),this.updated(i)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(i){return!0}update(i){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(i){}firstUpdated(i){}};$n.elementStyles=[],$n.shadowRootOptions={mode:"open"},$n[$i("elementProperties")]=new Map,$n[$i("finalized")]=new Map,Zv?.({ReactiveElement:$n}),(fs.reactiveElementVersions??=[]).push("2.1.2");var mo=globalThis,Ac=r=>r,bs=mo.trustedTypes,Cc=bs?bs.createPolicy("lit-html",{createHTML:r=>r}):void 0,fo="$lit$",xn=`lit$${Math.random().toFixed(9).slice(2)}$`,go="?"+xn,Qv=`<${go}>`,ur=document,ki=()=>ur.createComment(""),Si=r=>r===null||typeof r!="object"&&typeof r!="function",bo=Array.isArray,Fc=r=>bo(r)||typeof r?.[Symbol.iterator]=="function",vo=`[ 	
\f\r]`,ji=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Tc=/-->/g,Mc=/>/g,cr=RegExp(`>|${vo}(?:([^\\s"'>=/]+)(${vo}*=${vo}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Pc=/'/g,Lc=/"/g,Oc=/^(?:script|style|textarea|title)$/i,yo=r=>(i,...e)=>({_$litType$:r,strings:i,values:e}),c=yo(1),K=yo(2),Nc=yo(3),Ke=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),Dc=new WeakMap,dr=ur.createTreeWalker(ur,129);function Ic(r,i){if(!bo(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Cc!==void 0?Cc.createHTML(i):i}var Hc=(r,i)=>{let e=r.length-1,t=[],n,s=i===2?"<svg>":i===3?"<math>":"",o=ji;for(let l=0;l<e;l++){let d=r[l],u,p,v=-1,f=0;for(;f<d.length&&(o.lastIndex=f,p=o.exec(d),p!==null);)f=o.lastIndex,o===ji?p[1]==="!--"?o=Tc:p[1]!==void 0?o=Mc:p[2]!==void 0?(Oc.test(p[2])&&(n=RegExp("</"+p[2],"g")),o=cr):p[3]!==void 0&&(o=cr):o===cr?p[0]===">"?(o=n??ji,v=-1):p[1]===void 0?v=-2:(v=o.lastIndex-p[2].length,u=p[1],o=p[3]===void 0?cr:p[3]==='"'?Lc:Pc):o===Lc||o===Pc?o=cr:o===Tc||o===Mc?o=ji:(o=cr,n=void 0);let g=o===cr&&r[l+1].startsWith("/>")?" ":"";s+=o===ji?d+Qv:v>=0?(t.push(u),d.slice(0,v)+fo+d.slice(v)+xn+g):d+xn+(v===-2?l:g)}return[Ic(r,s+(r[e]||"<?>")+(i===2?"</svg>":i===3?"</math>":"")),t]},Ei=class r{constructor({strings:i,_$litType$:e},t){let n;this.parts=[];let s=0,o=0,l=i.length-1,d=this.parts,[u,p]=Hc(i,e);if(this.el=r.createElement(u,t),dr.currentNode=this.el.content,e===2||e===3){let v=this.el.content.firstChild;v.replaceWith(...v.childNodes)}for(;(n=dr.nextNode())!==null&&d.length<l;){if(n.nodeType===1){if(n.hasAttributes())for(let v of n.getAttributeNames())if(v.endsWith(fo)){let f=p[o++],g=n.getAttribute(v).split(xn),y=/([.?@])?(.*)/.exec(f);d.push({type:1,index:s,name:y[2],strings:g,ctor:y[1]==="."?_s:y[1]==="?"?ws:y[1]==="@"?$s:hr}),n.removeAttribute(v)}else v.startsWith(xn)&&(d.push({type:6,index:s}),n.removeAttribute(v));if(Oc.test(n.tagName)){let v=n.textContent.split(xn),f=v.length-1;if(f>0){n.textContent=bs?bs.emptyScript:"";for(let g=0;g<f;g++)n.append(v[g],ki()),dr.nextNode(),d.push({type:2,index:++s});n.append(v[f],ki())}}}else if(n.nodeType===8)if(n.data===go)d.push({type:2,index:s});else{let v=-1;for(;(v=n.data.indexOf(xn,v+1))!==-1;)d.push({type:7,index:s}),v+=xn.length-1}s++}}static createElement(i,e){let t=ur.createElement("template");return t.innerHTML=i,t}};function pr(r,i,e=r,t){if(i===Ke)return i;let n=t!==void 0?e._$Co?.[t]:e._$Cl,s=Si(i)?void 0:i._$litDirective$;return n?.constructor!==s&&(n?._$AO?.(!1),s===void 0?n=void 0:(n=new s(r),n._$AT(r,e,t)),t!==void 0?(e._$Co??=[])[t]=n:e._$Cl=n),n!==void 0&&(i=pr(r,n._$AS(r,i.values),n,t)),i}var ys=class{constructor(i,e){this._$AV=[],this._$AN=void 0,this._$AD=i,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(i){let{el:{content:e},parts:t}=this._$AD,n=(i?.creationScope??ur).importNode(e,!0);dr.currentNode=n;let s=dr.nextNode(),o=0,l=0,d=t[0];for(;d!==void 0;){if(o===d.index){let u;d.type===2?u=new Ir(s,s.nextSibling,this,i):d.type===1?u=new d.ctor(s,d.name,d.strings,this,i):d.type===6&&(u=new xs(s,this,i)),this._$AV.push(u),d=t[++l]}o!==d?.index&&(s=dr.nextNode(),o++)}return dr.currentNode=ur,n}p(i){let e=0;for(let t of this._$AV)t!==void 0&&(t.strings!==void 0?(t._$AI(i,t,e),e+=t.strings.length-2):t._$AI(i[e])),e++}},Ir=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(i,e,t,n){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=i,this._$AB=e,this._$AM=t,this.options=n,this._$Cv=n?.isConnected??!0}get parentNode(){let i=this._$AA.parentNode,e=this._$AM;return e!==void 0&&i?.nodeType===11&&(i=e.parentNode),i}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(i,e=this){i=pr(this,i,e),Si(i)?i===m||i==null||i===""?(this._$AH!==m&&this._$AR(),this._$AH=m):i!==this._$AH&&i!==Ke&&this._(i):i._$litType$!==void 0?this.$(i):i.nodeType!==void 0?this.T(i):Fc(i)?this.k(i):this._(i)}O(i){return this._$AA.parentNode.insertBefore(i,this._$AB)}T(i){this._$AH!==i&&(this._$AR(),this._$AH=this.O(i))}_(i){this._$AH!==m&&Si(this._$AH)?this._$AA.nextSibling.data=i:this.T(ur.createTextNode(i)),this._$AH=i}$(i){let{values:e,_$litType$:t}=i,n=typeof t=="number"?this._$AC(i):(t.el===void 0&&(t.el=Ei.createElement(Ic(t.h,t.h[0]),this.options)),t);if(this._$AH?._$AD===n)this._$AH.p(e);else{let s=new ys(n,this),o=s.u(this.options);s.p(e),this.T(o),this._$AH=s}}_$AC(i){let e=Dc.get(i.strings);return e===void 0&&Dc.set(i.strings,e=new Ei(i)),e}k(i){bo(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,t,n=0;for(let s of i)n===e.length?e.push(t=new r(this.O(ki()),this.O(ki()),this,this.options)):t=e[n],t._$AI(s),n++;n<e.length&&(this._$AR(t&&t._$AB.nextSibling,n),e.length=n)}_$AR(i=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);i!==this._$AB;){let t=Ac(i).nextSibling;Ac(i).remove(),i=t}}setConnected(i){this._$AM===void 0&&(this._$Cv=i,this._$AP?.(i))}},hr=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(i,e,t,n,s){this.type=1,this._$AH=m,this._$AN=void 0,this.element=i,this.name=e,this._$AM=n,this.options=s,t.length>2||t[0]!==""||t[1]!==""?(this._$AH=Array(t.length-1).fill(new String),this.strings=t):this._$AH=m}_$AI(i,e=this,t,n){let s=this.strings,o=!1;if(s===void 0)i=pr(this,i,e,0),o=!Si(i)||i!==this._$AH&&i!==Ke,o&&(this._$AH=i);else{let l=i,d,u;for(i=s[0],d=0;d<s.length-1;d++)u=pr(this,l[t+d],e,d),u===Ke&&(u=this._$AH[d]),o||=!Si(u)||u!==this._$AH[d],u===m?i=m:i!==m&&(i+=(u??"")+s[d+1]),this._$AH[d]=u}o&&!n&&this.j(i)}j(i){i===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,i??"")}},_s=class extends hr{constructor(){super(...arguments),this.type=3}j(i){this.element[this.name]=i===m?void 0:i}},ws=class extends hr{constructor(){super(...arguments),this.type=4}j(i){this.element.toggleAttribute(this.name,!!i&&i!==m)}},$s=class extends hr{constructor(i,e,t,n,s){super(i,e,t,n,s),this.type=5}_$AI(i,e=this){if((i=pr(this,i,e,0)??m)===Ke)return;let t=this._$AH,n=i===m&&t!==m||i.capture!==t.capture||i.once!==t.once||i.passive!==t.passive,s=i!==m&&(t===m||n);n&&this.element.removeEventListener(this.name,this,t),s&&this.element.addEventListener(this.name,this,i),this._$AH=i}handleEvent(i){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,i):this._$AH.handleEvent(i)}},xs=class{constructor(i,e,t){this.element=i,this.type=6,this._$AN=void 0,this._$AM=e,this.options=t}get _$AU(){return this._$AM._$AU}_$AI(i){pr(this,i)}},Bc={M:fo,P:xn,A:go,C:1,L:Hc,R:ys,D:Fc,V:pr,I:Ir,H:hr,N:ws,U:$s,B:_s,F:xs},Jv=mo.litHtmlPolyfillSupport;Jv?.(Ei,Ir),(mo.litHtmlVersions??=[]).push("3.3.3");var zc=(r,i,e)=>{let t=e?.renderBefore??i,n=t._$litPart$;if(n===void 0){let s=e?.renderBefore??null;t._$litPart$=n=new Ir(i.insertBefore(ki(),s),s,void 0,e??{})}return n._$AI(r),n};var _o=globalThis,L=class extends $n{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let i=super.createRenderRoot();return this.renderOptions.renderBefore??=i.firstChild,i}update(i){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(i),this._$Do=zc(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Ke}};L._$litElement$=!0,L.finalized=!0,_o.litElementHydrateSupport?.({LitElement:L});var em=_o.litElementPolyfillSupport;em?.({LitElement:L});(_o.litElementVersions??=[]).push("4.2.2");var A=r=>(i,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(r,i)}):customElements.define(r,i)};var tm={attribute:!0,type:String,converter:xi,reflect:!1,hasChanged:gs},nm=(r=tm,i,e)=>{let{kind:t,metadata:n}=e,s=globalThis.litPropertyMetadata.get(n);if(s===void 0&&globalThis.litPropertyMetadata.set(n,s=new Map),t==="setter"&&((r=Object.create(r)).wrapped=!0),s.set(e.name,r),t==="accessor"){let{name:o}=e;return{set(l){let d=i.get.call(this);i.set.call(this,l),this.requestUpdate(o,d,r,!0,l)},init(l){return l!==void 0&&this.C(o,void 0,r,l),l}}}if(t==="setter"){let{name:o}=e;return function(l){let d=this[o];i.call(this,l),this.requestUpdate(o,d,r,!0,l)}}throw Error("Unsupported decorator location: "+t)};function $(r){return(i,e)=>typeof e=="object"?nm(r,i,e):((t,n,s)=>{let o=n.hasOwnProperty(s);return n.constructor.createProperty(s,t),o?Object.getOwnPropertyDescriptor(n,s):void 0})(r,i,e)}function b(r){return $({...r,state:!0,attribute:!1})}var vr=(r,i,e)=>(e.configurable=!0,e.enumerable=!0,Reflect.decorate&&typeof i!="object"&&Object.defineProperty(r,i,e),e);function me(r,i){return(e,t,n)=>{let s=o=>o.renderRoot?.querySelector(r)??null;if(i){let{get:o,set:l}=typeof t=="object"?e:n??(()=>{let d=Symbol();return{get(){return this[d]},set(u){this[d]=u}}})();return vr(e,t,{get(){let d=o.call(this);return d===void 0&&(d=s(this),(d!==null||this.hasUpdated)&&l.call(this,d)),d}})}return vr(e,t,{get(){return s(this)}})}}var wo=Symbol.for(""),rm=r=>{if(r?.r===wo)return r?._$litStatic$},Hr=r=>({_$litStatic$:r,r:wo}),Te=(r,...i)=>({_$litStatic$:i.reduce((e,t,n)=>e+(s=>{if(s._$litStatic$!==void 0)return s._$litStatic$;throw Error(`Value passed to 'literal' function must be a 'literal' result: ${s}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`)})(t)+r[n+1],r[0]),r:wo}),Kc=new Map,$o=r=>(i,...e)=>{let t=e.length,n,s,o=[],l=[],d,u=0,p=!1;for(;u<t;){for(d=i[u];u<t&&(s=e[u],(n=rm(s))!==void 0);)d+=n+i[++u],p=!0;u!==t&&l.push(s),o.push(d),u++}if(u===t&&o.push(i[t]),p){let v=o.join("$$lit$$");(i=Kc.get(v))===void 0&&(o.raw=o,Kc.set(v,i=o)),e=l}return r(i,...e)},ye=$o(c),$_=$o(K),x_=$o(Nc);var Uc=S`
  :host {
    /* ── typography ─────────────────────────────────────────────────── */
    --jv-font: var(
      --ha-font-family-body,
      var(--paper-font-body1_-_font-family, var(--mdc-typography-font-family, sans-serif))
    );
    --jv-font-code: var(--ha-font-family-code, var(--code-font-family, monospace));
    --jv-font-size-xs: var(--ha-font-size-xs, 11px);
    --jv-font-size-s: var(--ha-font-size-s, 12px);
    --jv-font-size-m: var(--ha-font-size-m, 14px);
    --jv-font-size-l: var(--ha-font-size-l, 16px);
    --jv-font-size-xl: var(--ha-font-size-xl, 20px);
    --jv-font-size-2xl: var(--ha-font-size-2xl, 24px);
    --jv-font-weight-normal: var(--ha-font-weight-normal, 400);
    --jv-font-weight-medium: var(--ha-font-weight-medium, 500);
    --jv-font-weight-bold: var(--ha-font-weight-bold, 700);
    --jv-line-height: var(--ha-line-height-normal, 1.5);

    /* ── surfaces & text ─────────────────────────────────────────────── */
    --jv-bg: var(--primary-background-color);
    --jv-bg-2: var(--secondary-background-color, var(--primary-background-color));
    --jv-surface: var(--ha-card-background, var(--card-background-color));
    --jv-text: var(--primary-text-color);
    --jv-text-2: var(--secondary-text-color);
    /* --jv-text-3 is HA's DISABLED colour (1.9:1 on a light card): disabled
       controls, placeholders and inactive dots only - never a readable label. */
    --jv-text-3: var(--disabled-text-color, var(--secondary-text-color));
    --jv-on-accent: var(--text-primary-color);
    --jv-on-danger: var(--ha-color-on-danger-loud, var(--white-color, var(--text-primary-color)));

    /* ── the app bar: everything drawn ON the header keys off these, never
       off the page palette (a theme may give the header its primary colour) */
    --jv-header-bg: var(--app-header-background-color, var(--primary-background-color));
    --jv-header-text: var(--app-header-text-color, var(--primary-text-color));
    --jv-header-indicator: var(--app-header-selection-bar-color, var(--jv-header-text));
    --jv-header-hover: color-mix(in srgb, var(--jv-header-text) 10%, transparent);
    --jv-header-border: var(--app-header-border-bottom, 1px solid var(--divider-color));

    /* ── accents & state colours ─────────────────────────────────────── */
    --jv-accent: var(--primary-color, var(--mdc-theme-primary));
    --jv-accent-2: var(--accent-color, var(--jv-accent));
    --jv-ok: var(--success-color, var(--state-active-color, var(--jv-accent)));
    --jv-warn: var(--warning-color, var(--jv-accent-2));
    --jv-danger: var(--error-color, var(--mdc-theme-error));
    --jv-info: var(--info-color, var(--jv-accent));
    --jv-neutral: var(--secondary-text-color);

    /* tints: use for chips, badges, highlighted rows - never raw colours */
    --jv-accent-soft: color-mix(in srgb, var(--jv-accent) 14%, transparent);
    --jv-ok-soft: color-mix(in srgb, var(--jv-ok) 16%, transparent);
    --jv-warn-soft: color-mix(in srgb, var(--jv-warn) 20%, transparent);
    --jv-danger-soft: color-mix(in srgb, var(--jv-danger) 14%, transparent);
    --jv-info-soft: color-mix(in srgb, var(--jv-info) 14%, transparent);
    --jv-neutral-soft: color-mix(in srgb, var(--jv-text) 8%, transparent);
    --jv-hover: color-mix(in srgb, var(--jv-text) 6%, transparent);
    --jv-pressed: color-mix(in srgb, var(--jv-text) 12%, transparent);
    --jv-surface-2: color-mix(in srgb, var(--jv-text) 4%, var(--jv-surface));
    --jv-skeleton: color-mix(in srgb, var(--jv-text) 8%, transparent);
    /* dialog backdrop: HA's scrim is always a dark dim (never derived from the
       text colour, which would be a white haze over a dark theme) */
    --jv-scrim: var(--mdc-dialog-scrim-color, color-mix(in srgb, var(--black-color, var(--primary-text-color)) 32%, transparent));

    /* readable state text (see the contrast note at the top): use these for
       any 11-14 px text that carries a state colour, on a card or on a tint */
    --jv-ok-text: color-mix(in srgb, var(--jv-ok) 55%, var(--jv-text));
    --jv-warn-text: color-mix(in srgb, var(--jv-warn) 45%, var(--jv-text));
    --jv-danger-text: color-mix(in srgb, var(--jv-danger) 60%, var(--jv-text));
    --jv-info-text: color-mix(in srgb, var(--jv-info) 55%, var(--jv-text));
    --jv-accent-text: color-mix(in srgb, var(--jv-accent) 55%, var(--jv-text));

    /* ── borders, radii, shadow, focus ───────────────────────────────── */
    --jv-border: var(--ha-card-border-color, var(--divider-color));
    --jv-border-width: var(--ha-card-border-width, 1px);
    --jv-divider: var(--divider-color);
    --jv-radius: var(--ha-card-border-radius, 12px);
    --jv-radius-sm: min(8px, var(--jv-radius));
    --jv-radius-pill: 999px;
    --jv-shadow: var(--ha-card-box-shadow, none);
    --jv-focus: var(--jv-accent);
    --jv-focus-ring: 0 0 0 2px var(--jv-surface), 0 0 0 4px var(--jv-focus);
    /* for controls inside a clipped box (overflow: hidden / auto) */
    --jv-focus-ring-inset: inset 0 0 0 2px var(--jv-surface), inset 0 0 0 4px var(--jv-focus);
    /* for controls on the app bar (the header's own colours, always inset) */
    --jv-header-focus-ring: inset 0 0 0 2px var(--jv-header-bg), inset 0 0 0 4px var(--jv-header-indicator);

    /* ── spacing scale (4 / 8 / 12 / 16 / 24) and tap size ───────────── */
    --jv-space-1: 4px;
    --jv-space-2: 8px;
    --jv-space-3: 12px;
    --jv-space-4: 16px;
    --jv-space-5: 24px;
    --jv-tap: 44px;
    --jv-header-height: var(--header-height, 56px);

    /* ── motion ──────────────────────────────────────────────────────── */
    --jv-ease: 160ms ease;
  }
`;var T=S`
  ${Uc}

  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--jv-font);
    font-size: var(--jv-font-size-m);
    line-height: var(--jv-line-height);
    color: var(--jv-text);
    -webkit-tap-highlight-color: transparent;
  }
  :host([hidden]) {
    display: none;
  }
  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  /* ── layout ───────────────────────────────────────────────────────── */
  .jv-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--jv-space-4);
    align-items: start;
  }
  @media (min-width: 600px) {
    .jv-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1100px) {
    .jv-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .jv-span-all {
    grid-column: 1 / -1;
  }
  .jv-stack {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-3);
  }
  .jv-row {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-width: 0;
  }
  .jv-row > .jv-grow {
    flex: 1 1 auto;
    min-width: 0;
  }
  .jv-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── card fallback (when ha-card is not yet defined) ──────────────── */
  .jv-card {
    background: var(--jv-surface);
    color: var(--jv-text);
    border-radius: var(--jv-radius);
    border: var(--jv-border-width) solid var(--jv-border);
    box-shadow: var(--jv-shadow);
  }

  /* ── typography helpers ───────────────────────────────────────────── */
  .jv-title {
    margin: 0;
    font-size: var(--jv-font-size-l);
    font-weight: var(--jv-font-weight-medium);
    line-height: 1.3;
  }
  .jv-subtitle,
  .jv-muted {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .jv-mono {
    font-family: var(--jv-font-code);
    font-variant-numeric: tabular-nums;
  }

  /* ── buttons & tap targets ────────────────────────────────────────── */
  .jv-tap {
    min-height: var(--jv-tap);
    min-width: var(--jv-tap);
  }
  .jv-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--jv-space-2);
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-4);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
    font-weight: var(--jv-font-weight-medium);
    cursor: pointer;
    transition: background-color var(--jv-ease);
  }
  .jv-btn:hover {
    background: var(--jv-hover);
  }
  .jv-btn:active {
    background: var(--jv-pressed);
  }
  .jv-btn[disabled],
  .jv-btn:disabled {
    cursor: default;
    opacity: 0.5;
  }
  .jv-btn.primary {
    background: var(--jv-accent);
    border-color: transparent;
    color: var(--jv-on-accent);
  }
  .jv-btn.danger {
    background: var(--jv-danger);
    border-color: transparent;
    color: var(--jv-on-danger);
  }
  .jv-btn.text {
    background: transparent;
    border-color: transparent;
    color: var(--jv-accent);
  }
  .jv-icon-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--jv-tap);
    height: var(--jv-tap);
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .jv-icon-btn:hover {
    background: var(--jv-hover);
  }

  /* ── focus: one ring everywhere ───────────────────────────────────── */
  :where(button, a, input, select, textarea, summary, [tabindex]):focus-visible {
    outline: none;
    box-shadow: var(--jv-focus-ring);
  }
  :where(button, a, input, select, textarea, summary, [tabindex]):focus:not(:focus-visible) {
    outline: none;
  }

  /* ── misc utilities ───────────────────────────────────────────────── */
  /* Extend a small control's hit box to the 44 px tap target without
     changing its visual size (chips, pills, text links). Not for <input>
     or <select> (replaced elements have no ::before): give those a
     min-height of var(--jv-tap) instead. */
  .jv-hit {
    position: relative;
  }
  .jv-hit::before {
    content: "";
    position: absolute;
    inset: calc((var(--jv-tap) - 100%) / -2) 0;
  }
  .visually-hidden {
    position: absolute !important;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
  .jv-divider {
    border: 0;
    border-top: 1px solid var(--jv-divider);
    margin: var(--jv-space-2) 0;
  }
  .jv-skeleton {
    background: var(--jv-skeleton);
    border-radius: var(--jv-radius-sm);
    min-height: 1em;
  }

  /* The ONE permitted animation: an occupancy pulse, motion-safe only. */
  @media (prefers-reduced-motion: no-preference) {
    @keyframes jv-pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.45;
      }
    }
    .jv-pulse {
      animation: jv-pulse 2s ease-in-out infinite;
    }
  }
`;var Y=class r extends Error{constructor(i,e,t,n){super(t),this.name="WsError",this.command=i,this.code=e,this.cause=n}static from(i,e){if(e instanceof r)return e;if(e&&typeof e=="object"){let t=e,n=String(t.code??t.error?.code??"unknown_error"),s=String(t.message??t.error?.message??`${i} failed`);return new r(i,n,s,e)}return new r(i,"unknown_error",e?String(e):`${i} failed`,e)}};async function X(r,i,e){if(!r||typeof r.callWS!="function")throw new Y(i,"no_connection","Home Assistant connection not available");try{return await r.callWS({...e??{},type:i})}catch(t){throw Y.from(i,t)}}var im=300,sm=24e4,qc=new Map;function Ri(r){return/^\/api\//.test(r)}async function Tt(r,i,e=im){if(!i)return"";if(!r||!Ri(i))return i;let t=qc.get(i),n=Date.now();if(t&&n-t.ts<sm)return t.url;try{let o=(await r.callWS({type:"auth/sign_path",path:i,expires:e}))?.path||i;return qc.set(i,{url:o,ts:n}),o}catch{return i}}var am="/jarvis_panel_static/i18n",jo=null,js="en",Ai=null,xo=new Map,ko=new Set;function a(r,i){let e=jo&&jo[r]||r;return i&&(e=e.replace(/\{(\w+)\}/g,(t,n)=>n in i?String(i[n]):t)),e}function Gc(){return js}function Br(r){return ko.add(r),()=>{ko.delete(r)}}async function Wc(r){if(xo.has(r))return xo.get(r)??null;let i=null;try{let e=await fetch(`${am}/${r}.json`);if(e.ok){let t=await e.json();t&&typeof t=="object"&&(i=t)}}catch{i=null}return xo.set(r,i),i}async function ks(r){let i=String(r||"en").toLowerCase();if(i===js&&!Ai||(Ai&&await Ai.catch(()=>!1),i===js))return!1;let e=(async()=>{let t=i.split("-")[0],n=null;t!=="en"&&(n=await Wc(i)||(i!==t?await Wc(t):null)),jo=n,js=i;for(let s of ko)try{s(i)}catch{}return!0})();Ai=e;try{return await e}finally{Ai=null}}function Ss(r,i){let e=typeof r=="string"?r.trim():"";return e&&e!=="auto"?e:typeof i=="string"&&i?i:"en"}function x(r){try{return typeof customElements<"u"&&!!customElements.get(r)}catch{return!1}}var Vc=new WeakMap;function P(r,i){if(typeof customElements>"u")return;let e=Vc.get(r);e||(e=new Set,Vc.set(r,e));for(let t of i)e.has(t)||x(t)||(e.add(t),customElements.whenDefined(t).then(()=>r.requestUpdate()).catch(()=>{}))}function Yc(r=window){r.dispatchEvent(new CustomEvent("hass-toggle-menu",{bubbles:!0,composed:!0}))}function Xc(r,i=!1){i?history.replaceState(null,"",r):history.pushState(null,"",r),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0,detail:{replace:i}}))}var de=class extends L{constructor(){super(...arguments);this.narrow=!1;this.data=null}get subPath(){return(this.route?.path||"").split("/").filter(Boolean).slice(1).join("/")}refresh(){this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}navigate(e,t){let n={view:e,path:t};this.dispatchEvent(new CustomEvent("jarvis-navigate",{bubbles:!0,composed:!0,detail:n}))}ws(e,t){return X(this.hass,e,t)}};h([$({attribute:!1})],de.prototype,"hass",2),h([$({type:Boolean,reflect:!0})],de.prototype,"narrow",2),h([$({attribute:!1})],de.prototype,"data",2),h([$({attribute:!1})],de.prototype,"route",2);function Zc(r){switch(r){case"live":case"ok":return"ok";case"warn":return"warn";case"danger":case"error":return"danger";case"info":return"info";case"accent":return"accent";default:return"neutral"}}var jn=class extends L{constructor(){super(...arguments);this.level="neutral";this.label="";this.pulse=!1;this.nodot=!1}render(){return c`
      <span class="pill">
        <span class="dot ${this.pulse?"jv-pulse":""}" aria-hidden="true"></span>
        <span class="text"><slot>${this.label}</slot></span>
      </span>
    `}};jn.styles=[T,S`
      :host {
        display: inline-flex;
        --_c: var(--jv-neutral);
        --_bg: var(--jv-neutral-soft);
      }
      :host([level="ok"]) {
        --_c: var(--jv-ok);
        --_bg: var(--jv-ok-soft);
      }
      :host([level="warn"]) {
        --_c: var(--jv-warn);
        --_bg: var(--jv-warn-soft);
      }
      :host([level="danger"]) {
        --_c: var(--jv-danger);
        --_bg: var(--jv-danger-soft);
      }
      :host([level="info"]) {
        --_c: var(--jv-info);
        --_bg: var(--jv-info-soft);
      }
      :host([level="accent"]) {
        --_c: var(--jv-accent);
        --_bg: var(--jv-accent-soft);
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
        padding: 2px var(--jv-space-2) 2px var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--_bg);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        line-height: 20px;
        white-space: nowrap;
      }
      .dot {
        flex: none;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--_c);
      }
      :host([nodot]) .dot {
        display: none;
      }
      .text {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `],h([$({type:String,reflect:!0})],jn.prototype,"level",2),h([$({type:String})],jn.prototype,"label",2),h([$({type:Boolean,reflect:!0})],jn.prototype,"pulse",2),h([$({type:Boolean,reflect:!0})],jn.prototype,"nodot",2),jn=h([A("jv-state-badge")],jn);var Qt=class extends L{constructor(){super(...arguments);this.icon="mdi:inbox-outline";this.heading="";this.message="";this.kind="empty";this.compact=!1}connectedCallback(){super.connectedCallback(),P(this,["ha-icon"])}render(){return this.kind==="loading"?c`
        <div class="skeleton" role="status" aria-live="polite" aria-label=${this.heading||this.message||"…"}>
          <div class="jv-skeleton"></div>
          <div class="jv-skeleton"></div>
        </div>
        ${this.message?c`<p class="message">${this.message}</p>`:m}
      `:c`
      <div class="icon" aria-hidden="true">
        ${x("ha-icon")?c`<ha-icon .icon=${this.icon}></ha-icon>`:m}
      </div>
      ${this.heading?c`<h3 class="heading">${this.heading}</h3>`:m}
      ${this.message?c`<p class="message">${this.message}</p>`:m}
      <slot name="action"></slot>
    `}};Qt.styles=[T,S`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: var(--jv-space-2);
        padding: var(--jv-space-5) var(--jv-space-4);
        color: var(--jv-text-2);
        min-height: 160px;
      }
      :host([compact]) {
        min-height: 0;
        padding: var(--jv-space-4);
      }
      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        --mdc-icon-size: 28px;
      }
      :host([kind="error"]) .icon {
        background: var(--jv-danger-soft);
        color: var(--jv-danger);
      }
      :host([compact]) .icon {
        width: 40px;
        height: 40px;
        --mdc-icon-size: 22px;
      }
      .heading {
        margin: 0;
        color: var(--jv-text);
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
      }
      .message {
        margin: 0;
        max-width: 42ch;
        font-size: var(--jv-font-size-m);
      }
      .skeleton {
        width: min(100%, 280px);
        display: grid;
        gap: var(--jv-space-2);
      }
      .skeleton .jv-skeleton:nth-child(2) {
        width: 70%;
      }
      ::slotted([slot="action"]) {
        margin-top: var(--jv-space-2);
      }
    `],h([$({type:String})],Qt.prototype,"icon",2),h([$({type:String})],Qt.prototype,"heading",2),h([$({type:String})],Qt.prototype,"message",2),h([$({type:String,reflect:!0})],Qt.prototype,"kind",2),h([$({type:Boolean,reflect:!0})],Qt.prototype,"compact",2),Qt=h([A("jv-empty")],Qt);var Jt=class extends L{constructor(){super(...arguments);this.heading="";this.subheading="";this.icon="";this.flush=!1;this.loading=!1}connectedCallback(){super.connectedCallback(),P(this,["ha-card","ha-icon"])}_inner(){let e=!!(this.heading||this.subheading||this.icon);return c`
      ${e?c`
            <div class="head">
              ${this.icon&&x("ha-icon")?c`<ha-icon .icon=${this.icon}></ha-icon>`:m}
              <div class="titles">
                ${this.heading?c`<h2>${this.heading}</h2>`:m}
                ${this.subheading?c`<p class="sub">${this.subheading}</p>`:m}
              </div>
              <div class="actions"><slot name="actions"></slot></div>
            </div>
          `:m}
      ${this.loading?c`<div class="progress" role="progressbar" aria-busy="true"></div>`:m}
      <div class="body"><slot></slot></div>
    `}render(){return x("ha-card")?c`<ha-card>${this._inner()}</ha-card>`:c`<div class="jv-card">${this._inner()}</div>`}};Jt.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      .head {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        padding: var(--jv-space-4) var(--jv-space-4) 0;
        min-height: 24px;
      }
      :host([flush]) .head {
        padding-bottom: var(--jv-space-3);
      }
      .head ha-icon {
        color: var(--jv-text-2);
        --mdc-icon-size: 22px;
        flex: none;
      }
      .titles {
        flex: 1 1 auto;
        min-width: 0;
      }
      h2 {
        margin: 0;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sub {
        margin: 2px 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .actions {
        display: flex;
        align-items: center;
        gap: var(--jv-space-1);
        margin-right: calc(-1 * var(--jv-space-2));
        flex: none;
      }
      .progress {
        height: 2px;
        margin: var(--jv-space-2) var(--jv-space-4) 0;
        background: var(--jv-accent-soft);
        overflow: hidden;
        border-radius: 1px;
      }
      .progress::after {
        content: "";
        display: block;
        width: 40%;
        height: 100%;
        background: var(--jv-accent);
      }
      .body {
        padding: var(--jv-space-3) var(--jv-space-4) var(--jv-space-4);
      }
      :host([flush]) .body {
        padding: 0;
      }
      .head:empty + .body {
        padding-top: var(--jv-space-4);
      }
    `],h([$({type:String})],Jt.prototype,"heading",2),h([$({type:String})],Jt.prototype,"subheading",2),h([$({type:String})],Jt.prototype,"icon",2),h([$({type:Boolean,reflect:!0})],Jt.prototype,"flush",2),h([$({type:Boolean,reflect:!0})],Jt.prototype,"loading",2),Jt=h([A("jv-section")],Jt);var kn=class extends L{constructor(){super(...arguments);this.label="";this.value="";this.mono=!1;this.stacked=!1}render(){return c`
      <span class="label">${this.label}</span>
      <span class="value"><slot>${this.value}</slot></span>
    `}};kn.styles=[T,S`
      :host {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-3);
        min-height: 40px;
        padding: var(--jv-space-1) 0;
        border-bottom: 1px solid var(--jv-divider);
      }
      :host(:last-of-type),
      :host([nodivider]) {
        border-bottom: 0;
      }
      :host([stacked]) {
        flex-direction: column;
        align-items: stretch;
        gap: 2px;
      }
      .label {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        flex: 1 1 auto;
        min-width: 0;
      }
      .value {
        color: var(--jv-text);
        text-align: right;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      :host([stacked]) .value {
        text-align: left;
      }
      :host([mono]) .value {
        font-family: var(--jv-font-code);
        font-variant-numeric: tabular-nums;
      }
    `],h([$({type:String})],kn.prototype,"label",2),h([$({type:String})],kn.prototype,"value",2),h([$({type:Boolean,reflect:!0})],kn.prototype,"mono",2),h([$({type:Boolean,reflect:!0})],kn.prototype,"stacked",2),kn=h([A("jv-kv")],kn);var lt=class extends L{constructor(){super(...arguments);this.heading="";this.message="";this.confirmLabel="";this.cancelLabel="";this.destructive=!1;this._open=!1;this._resolve=null}show(){return this._resolve&&this._finish(!1),this._open=!0,new Promise(e=>{this._resolve=e,this.updateComplete.then(()=>{let t=this._native;if(t&&!t.open)try{typeof t.showModal=="function"?t.showModal():t.setAttribute("open","")}catch{t.setAttribute("open","")}this.renderRoot.querySelector("[data-autofocus]")?.focus()})})}_finish(e){let t=this._resolve;this._resolve=null,this._open=!1;let n=this._native;n?.open&&(typeof n.close=="function"?n.close():n.removeAttribute("open")),this.dispatchEvent(new CustomEvent(e?"jv-confirm":"jv-cancel",{bubbles:!0,composed:!0})),t?.(e)}_onHaClosed(e){let t=e.detail?.action;this._resolve&&this._finish(t==="confirm")}_onNativeCancel(e){e.preventDefault(),this._finish(!1)}render(){if(!this._open)return m;let e=this.confirmLabel||a("Confirm"),t=this.cancelLabel||a("Cancel");return x("ha-dialog")?c`
        <ha-dialog open .heading=${this.heading} @closed=${this._onHaClosed} scrimClickAction="" escapeKeyAction="cancel">
          ${this.message?c`<p>${this.message}</p>`:m}
          <button class="jv-btn" slot="secondaryAction" dialogAction="cancel">${t}</button>
          <button
            class="jv-btn ${this.destructive?"danger":"primary"}"
            slot="primaryAction"
            dialogAction="confirm"
            data-autofocus
          >
            ${e}
          </button>
        </ha-dialog>
      `:c`
      <dialog aria-labelledby="h" @cancel=${this._onNativeCancel}>
        <div class="box">
          <h2 id="h">${this.heading}</h2>
          ${this.message?c`<p>${this.message}</p>`:m}
        </div>
        <div class="actions">
          <button class="jv-btn" type="button" @click=${()=>this._finish(!1)}>${t}</button>
          <button
            class="jv-btn ${this.destructive?"danger":"primary"}"
            type="button"
            data-autofocus
            @click=${()=>this._finish(!0)}
          >
            ${e}
          </button>
        </div>
      </dialog>
    `}disconnectedCallback(){super.disconnectedCallback(),this._resolve&&this._finish(!1),this._haDialog?.close?.()}};lt.styles=[T,S`
      :host {
        display: contents;
      }
      dialog {
        border: 0;
        padding: 0;
        max-width: min(92vw, 440px);
        width: 100%;
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius);
        box-shadow: var(--jv-shadow);
      }
      dialog::backdrop {
        background: var(--jv-scrim);
      }
      .box {
        padding: var(--jv-space-5) var(--jv-space-5) var(--jv-space-4);
      }
      h2 {
        margin: 0 0 var(--jv-space-2);
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
      }
      p {
        margin: 0;
        color: var(--jv-text-2);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--jv-space-2);
        padding: 0 var(--jv-space-3) var(--jv-space-3);
      }
      @media (max-width: 599px) {
        .actions {
          flex-direction: column-reverse;
        }
        .actions .jv-btn {
          width: 100%;
        }
      }
    `],h([$({type:String})],lt.prototype,"heading",2),h([$({type:String})],lt.prototype,"message",2),h([$({type:String,attribute:"confirm-label"})],lt.prototype,"confirmLabel",2),h([$({type:String,attribute:"cancel-label"})],lt.prototype,"cancelLabel",2),h([$({type:Boolean,reflect:!0})],lt.prototype,"destructive",2),h([b()],lt.prototype,"_open",2),h([me("dialog")],lt.prototype,"_native",2),h([me("ha-dialog")],lt.prototype,"_haDialog",2),lt=h([A("jv-confirm")],lt);async function U(r){let i=document.createElement("jv-confirm");i.heading=r.heading,i.message=r.message??"",i.confirmLabel=r.confirmLabel??"",i.cancelLabel=r.cancelLabel??"",i.destructive=!!r.destructive,document.body.appendChild(i);try{return await i.show()}finally{i.remove()}}var Bn=class extends L{constructor(){super(...arguments);this.open=!1;this.heading=""}connectedCallback(){super.connectedCallback(),P(this,["ha-dialog"])}updated(e){if(!e.has("open")||x("ha-dialog"))return;let t=this._native;if(t)if(this.open&&!t.open)try{t.showModal()}catch{t.setAttribute("open","")}else!this.open&&t.open&&t.close()}_requestClose(){this.open&&this.dispatchEvent(new CustomEvent("ov-close",{bubbles:!0,composed:!0}))}_onBackdrop(e){e.target===this._native&&this._requestClose()}render(){return this.open?x("ha-dialog")?c`
        <ha-dialog
          open
          .heading=${this.heading}
          scrimClickAction="close"
          escapeKeyAction="close"
          @closed=${e=>{e.stopPropagation(),this._requestClose()}}
        >
          <div class="content"><slot></slot></div>
          <slot name="actions" slot="primaryAction"></slot>
        </ha-dialog>
      `:c`
      <dialog
        aria-labelledby="h"
        @cancel=${e=>{e.preventDefault(),this._requestClose()}}
        @click=${this._onBackdrop}
      >
        <div class="box">
          <h2 id="h">${this.heading}</h2>
          <div class="content"><slot></slot></div>
        </div>
        <div class="actions"><slot name="actions"></slot></div>
      </dialog>
    `:m}disconnectedCallback(){super.disconnectedCallback();let e=this._native;e?.open&&e.close()}};Bn.styles=[T,S`
      :host {
        display: contents;
      }
      dialog {
        border: 0;
        padding: 0;
        width: 100%;
        max-width: min(92vw, 480px);
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius);
        box-shadow: var(--jv-shadow);
      }
      dialog::backdrop {
        background: var(--jv-scrim);
      }
      .box {
        padding: var(--jv-space-5) var(--jv-space-5) var(--jv-space-3);
      }
      h2 {
        margin: 0 0 var(--jv-space-3);
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        padding: 0 var(--jv-space-3) var(--jv-space-3);
      }
      ha-dialog {
        --mdc-dialog-max-width: 520px;
      }
      @media (max-width: 599px) {
        dialog {
          max-width: 100vw;
          margin: auto 0 0;
          border-radius: var(--jv-radius) var(--jv-radius) 0 0;
        }
        .actions ::slotted(*) {
          flex: 1 1 auto;
        }
      }
    `],h([$({type:Boolean,reflect:!0})],Bn.prototype,"open",2),h([$({type:String})],Bn.prototype,"heading",2),h([me("dialog")],Bn.prototype,"_native",2),Bn=h([A("jarvis-ov-dialog")],Bn);var Qc={sat:"mdi:microphone",spkr:"mdi:speaker",mmwave:"mdi:motion-sensor",cam:"mdi:cctv",light:"mdi:lightbulb",switch:"mdi:toggle-switch",lock:"mdi:lock",climate:"mdi:thermostat",door:"mdi:door",leak:"mdi:water-alert",alarm:"mdi:smoke-detector"},om={sat:"Satellite",spkr:"Speaker",mmwave:"Presence",cam:"Camera",light:"Lights",switch:"Switch",lock:"Lock",climate:"Climate",door:"Door",leak:"Leak",alarm:"Alarm"};function So(r){let i=om[r];return i?a(i):r}var Jc={active:!1,since:0,reason:"",auto:!1,exempt_windows:0};function Eo(r){let i=r&&typeof r=="object"?r:{};return{active:!!i.active,since:typeof i.since=="number"?i.since:0,reason:typeof i.reason=="string"?i.reason:"",auto:!!i.auto,arm_mode:typeof i.arm_mode=="string"?i.arm_mode:void 0,exempt_windows:typeof i.exempt_windows=="number"?i.exempt_windows:0}}function Ro(r){let i=r??{},e=Array.isArray(i.satellites)?i.satellites:[];return{lightControl:i.light_control_enabled!==!1,autoMode:i.operational_mode_auto!==!1,notifyService:typeof i.notify_service=="string"?i.notify_service:"",satelliteNames:e.map(t=>String(t?.name||t?.entity_id||"")).filter(Boolean)}}function Ao(r){return!r||typeof r.active!="string"||!Array.isArray(r.available)?null:{active:r.active,since:typeof r.since=="number"?r.since:0,reason:typeof r.reason=="string"?r.reason:"",description:typeof r.description=="string"?r.description:"",available:r.available.map(i=>typeof i=="string"?{name:i,description:""}:i).filter(i=>i&&typeof i.name=="string")}}function nt(r){if(r==null)return null;let i=String(r).trim();return!i||i==="—"?null:i}function Es(r){return r&&r.charAt(0).toUpperCase()+r.slice(1)}function Co(r,i=Date.now()){if(!r||!Number.isFinite(r))return"";let e=Math.max(0,Math.floor(i/1e3-r));return e<60?`${e}s`:e<3600?`${Math.floor(e/60)}m`:e<86400?`${Math.floor(e/3600)}h`:`${Math.floor(e/86400)}d`}function Sn(r){return r instanceof Y?r.code==="unauthorized"?a("Administrator privileges are required for this action"):r.message||r.code:r&&typeof r=="object"&&"message"in r?String(r.message):String(r??"")}function Ue(r,i){r.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:i},bubbles:!0,composed:!0}))}function Ci(r,i=0){let e=()=>r.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}));i>0?setTimeout(e,i):e()}var lm=/^(\d+) READY$/,cm=/^(\d+) \/ (\d+)$/;function zr(r){return r==="live"?"ok":r==="warn"?"warn":"off"}function ed(r,i,e){let t=r.status??{},n=[],s=(f,g,y,_,w="")=>n.push({key:f,label:g,value:y,level:_,secondary:w}),o=t.sleep;if(o){let f=o.state==="AWAKE"?a("Awake"):o.state==="ASLEEP"?a("Asleep"):o.state;s("sleep",a("Sleep"),f,zr(o.level),o.state==="ASLEEP"&&r.sleep_reason||"")}let l=t.observer;if(l){let f={RUNNING:a("Running"),READY:a("Ready"),DISABLED:a("Disabled")};s("observer",a("Observer"),f[l.state]??l.state,zr(l.level))}let d=t.llm_providers;if(d){let f=lm.exec(d.state),g=f?a("{n} ready",{n:f[1]}):d.state==="UNSET"?a("Not set"):d.state;s("llm",a("LLM Providers"),g,zr(d.level))}s("lockdown",a("Lockdown"),i.active?a("Engaged"):a("Off"),i.active?"danger":"off",i.active?i.reason:"");let u=t.satellites;if(u){let f=cm.exec(u.state),g=f?a("{a} / {b} online",{a:f[1],b:f[2]}):u.state==="NONE"?a("None"):u.state,y=e.satelliteNames,_=y.length?y.slice(0,3).join(", ")+(y.length>3?` +${y.length-3}`:""):"";s("satellites",a("Satellites"),g,zr(u.level),_)}let p=t.notify;if(p){let f=p.state==="READY"?e.notifyService||a("Ready"):p.state==="UNSET"?a("Not set"):p.state;s("notify",a("Notify target"),f,zr(p.level))}let v=t.broadcast;if(v){let f=v.state==="ONLINE"?a("Online"):v.state==="UNSET"?a("Not set"):v.state;s("broadcast",a("Broadcast"),f,zr(v.level))}return n}var td=new Set(["light","lock","cover","climate","sensor","binary_sensor","person","device_tracker","alarm_control_panel"]);var dm=5,nd=500,Mt=class extends L{constructor(){super(...arguments);this.areas=[];this.lightControl=!0;this._expandedId=null;this._lights=null;this._allOffBusy=!1}connectedCallback(){super.connectedCallback(),P(this,["ha-icon"])}willUpdate(e){e.has("areas")&&(this._expandedId&&!this._find(this._expandedId)&&(this._expandedId=null),this._lights&&!this._find(this._lights.areaId)&&(this._lights=null)),e.has("lightControl")&&!this.lightControl&&(this._lights=null)}openArea(e){this._find(e)&&(this._expandedId=e)}_find(e){return this.areas.find(t=>t.id===e)}_icon(e,t){return x("ha-icon")?c`<ha-icon .icon=${e} .title=${t} aria-label=${t} role="img"></ha-icon>`:c`<span aria-label=${t} title=${t}>${t}</span>`}async _openLights(e){if(this.lightControl){this._lights={areaId:e.id,name:e.name,loading:!0,items:[]};try{let t=await X(this.hass,"jarvis/area_lights",{area_id:e.id});if(this._lights?.areaId!==e.id)return;this._lights={areaId:e.id,name:t?.name||e.name,loading:!1,items:Array.isArray(t?.lights)?t.lights:[]}}catch(t){if(this._lights?.areaId!==e.id)return;this._lights={...this._lights,loading:!1,items:[]},Ue(this,`${a("Couldn't load lights —")} ${Sn(t)}`)}}}_callService(e,t,n,s){let o=this.hass;return!o||typeof o.callService!="function"?Promise.reject(new Error(a("Home Assistant connection not available"))):o.callService(e,t,n,s)}_setLight(e,t){this._lights&&(this._lights={...this._lights,items:this._lights.items.map(n=>n.entity_id===e?{...n,on:t}:n)})}async _toggleLight(e){let t=this._lights?.areaId;this._setLight(e.entity_id,!e.on);try{await this._callService("light",e.on?"turn_off":"turn_on",{entity_id:e.entity_id}),Ci(this,nd)}catch(n){this._lights?.areaId===t&&this._setLight(e.entity_id,e.on),Ue(this,`${a("Light failed —")} ${Sn(n)}`)}}async _allOff(){let e=this._lights;if(!(!e||this._allOffBusy)){this._allOffBusy=!0;try{await this._callService("light","turn_off",{},{area_id:e.areaId}),this._lights?.areaId===e.areaId&&(this._lights={...this._lights,items:this._lights.items.map(t=>({...t,on:!1}))}),Ue(this,a("{name} lights off",{name:e.name})),this._lights=null,Ci(this,nd)}catch(t){Ue(this,`${e.name} ${a("lights")} — ${Sn(t)}`)}finally{this._allOffBusy=!1}}}_pill(e,t=!1){let n=e.lights_on>0,s=`${e.lights_on}/${e.lights_total} ${a("lights on")}`,o=`pill ${n?"lit":""} ${t?"inline":""}`,l=x("ha-icon")?c`<ha-icon icon="mdi:lightbulb" aria-hidden="true"></ha-icon>`:m;if(!this.lightControl)return c`<span class=${o} title=${s} aria-label=${s}>${l}${e.lights_on}/${e.lights_total}</span>`;let d=`${s} ${a("— tap to toggle")}`;return c`
      <button
        type="button"
        class=${o}
        title=${d}
        aria-label=${d}
        @click=${u=>{u.stopPropagation(),this._openLights(e)}}
      >
        ${l}${e.lights_on}/${e.lights_total}
      </button>
    `}_tile(e){let t=e.caps??[],n=t.slice(0,dm),s=t.length-n.length,o=nt(e.temp),l=nt(e.humidity),d=[a("{name} details",{name:e.name}),e.active?a("Occupied"):a("Vacant"),e.bedroom?a("Bedroom"):"",o??"",l??""].filter(Boolean).join(", ");return c`
      <div class="tile ${e.active?"active":""}">
        <button
          type="button"
          class="open"
          aria-label=${d}
          @click=${()=>{this._expandedId=e.id}}
        >
          <div class="caps" aria-hidden="true">
            ${n.map(u=>c`<span class="cap">${this._icon(Qc[u]??"mdi:help-circle-outline",So(u))}</span>`)}
            ${s>0?c`<span class="cap">+${s}</span>`:m}
          </div>
          ${o||l?c`<div class="readings">${o?c`<span>${o}</span>`:m}${l?c`<span>${l}</span>`:m}</div>`:m}
          <div class="foot">
            <span class="dot ${e.active?"on jv-pulse":""}" aria-hidden="true"></span>
            <span class="name">${e.name}</span>
            ${e.bedroom&&x("ha-icon")?c`<span class="bed">${this._icon("mdi:bed",a("Bedroom"))}</span>`:m}
          </div>
        </button>
        ${e.lights_total>0?this._pill(e):m}
      </div>
    `}_detail(){let e=this._expandedId?this._find(this._expandedId):void 0,t=()=>{this._expandedId=null};return c`
      <jarvis-ov-dialog .open=${!!e} .heading=${e?.name??""} @ov-close=${t}>
        ${e?c`
              <div class="chips">
                <jv-state-badge
                  level=${e.active?"ok":"neutral"}
                  ?pulse=${e.active}
                  .label=${e.active?a("Occupied"):a("Vacant")}
                ></jv-state-badge>
                ${e.bedroom?c`<jv-state-badge level="info" nodot .label=${a("Bedroom")}></jv-state-badge>`:m}
              </div>
              ${nt(e.temp)?c`<jv-kv .label=${a("Temperature")} .value=${e.temp??""}></jv-kv>`:m}
              ${nt(e.humidity)?c`<jv-kv .label=${a("Humidity")} .value=${e.humidity??""}></jv-kv>`:m}
              ${e.lights_total>0?c`<jv-kv .label=${a("Lights")}>${this._pill(e,!0)}</jv-kv>`:m}
              ${nt(e.last_motion)?c`<jv-kv .label=${a("Last motion")} .value=${e.last_motion??""}></jv-kv>`:m}
              <jv-kv .label=${a("Capabilities")} .value=${(e.caps??[]).map(So).join(", ")||"—"}></jv-kv>
            `:m}
        <button slot="actions" type="button" class="jv-btn" @click=${t}>${a("Close")}</button>
      </jarvis-ov-dialog>
    `}_lightsDialog(){let e=this._lights,t=()=>{this._lights=null},n=!!e?.items.some(s=>s.on);return c`
      <jarvis-ov-dialog .open=${!!e} .heading=${e?.name??""} @ov-close=${t}>
        ${e?e.loading?c`<p class="msg" role="status" aria-live="polite">${a("Loading lights…")}</p>`:e.items.length===0?c`<p class="msg">${a("No controllable lights in this room.")}</p>`:c`
                  <ul class="lights">
                    ${e.items.map(s=>c`
                        <li>
                          <button type="button" aria-pressed=${s.on?"true":"false"} @click=${()=>{this._toggleLight(s)}}>
                            <span class="dot ${s.on?"on":""}" aria-hidden="true"></span>
                            <span class="jv-truncate" title=${s.entity_id}>${s.name}</span>
                            <span class="state">${s.on?a("On"):a("Off")}</span>
                          </button>
                        </li>
                      `)}
                  </ul>
                `:m}
        <button slot="actions" type="button" class="jv-btn" ?disabled=${!n||this._allOffBusy} @click=${()=>{this._allOff()}}>
          ${a("Turn all off")}
        </button>
        <button slot="actions" type="button" class="jv-btn" @click=${t}>${a("Close")}</button>
      </jarvis-ov-dialog>
    `}render(){return c`
      <div class="grid" role="list">
        ${this.areas.map(e=>c`<div role="listitem">${this._tile(e)}</div>`)}
      </div>
      ${this._detail()} ${this._lightsDialog()}
    `}};Mt.styles=[T,S`
      :host {
        display: block;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: var(--jv-space-2);
      }
      .tile {
        position: relative;
        min-width: 0;
      }
      .open {
        appearance: none;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
        width: 100%;
        min-height: 96px;
        padding: var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
        color: var(--jv-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: background-color var(--jv-ease);
      }
      .open:hover {
        background: var(--jv-hover);
      }
      .tile.active .open {
        border-color: var(--jv-ok);
        background: var(--jv-ok-soft);
      }
      .caps {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
        color: var(--jv-text-2);
        --mdc-icon-size: 18px;
        min-height: 18px;
      }
      .cap {
        display: inline-flex;
        align-items: center;
        font-size: var(--jv-font-size-xs);
      }
      .readings {
        display: flex;
        gap: var(--jv-space-3);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        font-variant-numeric: tabular-nums;
      }
      .foot {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin-top: auto;
        min-width: 0;
        width: 100%;
        padding-right: 52px;
      }
      .dot {
        flex: none;
        width: 8px;
        height: 8px;
        margin-top: 7px;
        border-radius: 50%;
        background: var(--jv-text-3);
      }
      .dot.on {
        background: var(--jv-ok);
      }
      .name {
        flex: 1 1 auto;
        min-width: 0;
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .bed {
        flex: 0 1 auto;
        margin-top: 2px;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
        --mdc-icon-size: 16px;
      }
      .pill {
        position: absolute;
        right: var(--jv-space-2);
        bottom: var(--jv-space-2);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 28px;
        padding: 0 var(--jv-space-2);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-variant-numeric: tabular-nums;
        --mdc-icon-size: 14px;
      }
      .pill.inline {
        position: relative;
      }
      button.pill {
        cursor: pointer;
      }
      /* the pill stays 28 px tall but its hit box is the 44 px tap target
         (it is layered over the tile button, so a thumb must not miss it) */
      button.pill::before {
        content: "";
        position: absolute;
        inset: calc((var(--jv-tap) - 100%) / -2) calc(-1 * var(--jv-space-1));
      }
      button.pill:hover {
        background: var(--jv-hover);
      }
      .pill.lit {
        border-color: var(--jv-warn);
        background: var(--jv-warn-soft);
        color: var(--jv-text);
      }
      /* dialog bodies */
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        margin-bottom: var(--jv-space-2);
      }
      .lights {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .lights button {
        appearance: none;
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-1);
        border: 0;
        border-bottom: 1px solid var(--jv-divider);
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .lights li:last-child button {
        border-bottom: 0;
      }
      .lights button:hover {
        background: var(--jv-hover);
      }
      .lights .state {
        margin-left: auto;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .lights .dot.on {
        background: var(--jv-warn);
      }
      p.msg {
        margin: 0;
        color: var(--jv-text-2);
      }
    `],h([$({attribute:!1})],Mt.prototype,"hass",2),h([$({attribute:!1})],Mt.prototype,"areas",2),h([$({type:Boolean})],Mt.prototype,"lightControl",2),h([b()],Mt.prototype,"_expandedId",2),h([b()],Mt.prototype,"_lights",2),h([b()],Mt.prototype,"_allOffBusy",2),Mt=h([A("jarvis-ov-areas")],Mt);var rd=S`
      .lockbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: var(--jv-space-2) var(--jv-space-4);
        margin-bottom: var(--jv-space-4);
      }
      .lockbar .text {
        display: flex;
        flex-direction: column;
        min-width: 0;
        text-align: right;
      }
      .lockbar .text .sub {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .lockbar.on .text .sub {
        color: var(--jv-danger-text);
      }
      .lockbar ha-icon {
        color: var(--jv-text-2);
      }
      .lockbar.on ha-icon {
        color: var(--jv-danger);
      }
      .switch {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        cursor: pointer;
      }
      .switch input {
        width: 20px;
        height: 20px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
      /* status tiles */
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: var(--jv-space-3);
      }
      .tile {
        display: grid;
        grid-template-columns: 10px 1fr;
        column-gap: var(--jv-space-2);
        align-items: start;
        min-width: 0;
      }
      .tile .dot {
        width: 10px;
        height: 10px;
        margin-top: 5px;
        border-radius: 50%;
        background: var(--jv-text-3);
      }
      .tile .dot[data-level="ok"] {
        background: var(--jv-ok);
      }
      .tile .dot[data-level="warn"] {
        background: var(--jv-warn);
      }
      .tile .dot[data-level="danger"] {
        background: var(--jv-danger);
      }
      .tile .label {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .tile .value {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .tile .sec {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
        overflow-wrap: anywhere;
      }
      .meta {
        margin: var(--jv-space-4) 0 0;
        padding-top: var(--jv-space-3);
        border-top: 1px solid var(--jv-divider);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      /* mode card */
      .desc {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        margin-bottom: var(--jv-space-3);
      }
      .chip {
        appearance: none;
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        cursor: pointer;
        transition: background-color var(--jv-ease);
      }
      .chip:hover {
        background: var(--jv-hover);
      }
      .chip[aria-pressed="true"] {
        background: var(--jv-accent);
        border-color: transparent;
        color: var(--jv-on-accent);
        font-weight: var(--jv-font-weight-medium);
      }
      .chip[disabled] {
        cursor: default;
        opacity: 0.6;
      }
      .toggle-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--jv-space-3);
        padding-top: var(--jv-space-2);
        border-top: 1px solid var(--jv-divider);
      }
      .toggle-row .help {
        margin: 2px 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      /* right now */
      .now {
        appearance: none;
        display: block;
        width: 100%;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
      }
      button.now {
        cursor: pointer;
        border-radius: var(--jv-radius-sm);
      }
      .now .big {
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
        line-height: 1.3;
        overflow-wrap: anywhere;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-top: var(--jv-space-3);
      }
      .stats .k {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      .stats .v {
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      /* quick actions */
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
      }
      .nap {
        margin: var(--jv-space-3) 0 0;
        color: var(--jv-warn-text);
        font-size: var(--jv-font-size-s);
      }
      /* skeletons */
      .sk {
        display: grid;
        gap: var(--jv-space-2);
      }
      .sk .jv-skeleton {
        height: 18px;
      }
      .sk .jv-skeleton:nth-child(2) {
        width: 70%;
      }
      .sk .jv-skeleton:nth-child(3) {
        width: 45%;
      }
      .tile .value.small {
        font-size: var(--jv-font-size-s);
      }
      /* narrow comes from HA; the viewport media queries in base.ts cover wide hosts */
      .narrow .jv-grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .narrow .tiles {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .narrow .lockbar {
        justify-content: space-between;
      }
`;var um=2e3,pm=500,hm=["ha-icon","ha-switch","ha-formfield","ha-card","ha-dialog"],mt=class extends de{constructor(){super(...arguments);this._mode=null;this._modeError=!1;this._lockdown=Jc;this._auto=!0;this._cfg=Ro(null);this._busy=new Set;this._modeInFlight=null;this._unsub=null}connectedCallback(){super.connectedCallback(),P(this,hm),this._subscribe()}disconnectedCallback(){super.disconnectedCallback(),this._nudgeTimer&&clearTimeout(this._nudgeTimer),this._nudgeTimer=void 0;let e=this._unsub;this._unsub=null,e?.then(t=>t?.()).catch(()=>{})}willUpdate(e){e.has("data")&&this.data&&(this._lockdown=Eo(this.data.lockdown),this._cfg=Ro(this.data.config),this._auto=this._cfg.autoMode,this._fetchMode()),e.has("hass")&&this.hass&&(this._subscribe(),!this._mode&&!this._modeError&&this._fetchMode())}_subscribe(){if(this._unsub||!this.isConnected)return;let e=this.hass?.connection;e?.subscribeEvents&&(this._unsub=e.subscribeEvents(t=>this._onStateChanged(t),"state_changed").catch(()=>{this._unsub=null}))}_onStateChanged(e){let t=e?.data?.entity_id;!t||!td.has(t.split(".")[0])||this._nudgeTimer||document.visibilityState!=="visible"||(this._nudgeTimer=setTimeout(()=>{this._nudgeTimer=void 0,this.isConnected&&this.refresh()},um))}_fetchMode(){return this.hass?this._modeInFlight?this._modeInFlight:(this._modeInFlight=(async()=>{try{let e=await this.ws("jarvis/mode",{action:"status"}),t=Ao(e);this._modeError=!t,t&&(this._mode=t)}catch{this._modeError=!0}finally{this._modeInFlight=null}})(),this._modeInFlight):Promise.resolve()}_setBusy(e,t){let n=new Set(this._busy);t?n.add(e):n.delete(e),this._busy=n}async _onLockToggle(e){let t=e.target,n=!!t.checked,s=this._lockdown.active;if(!(n===s||this._busy.has("lock"))){if(n&&!await U({heading:a("Engage lockdown?"),message:a("JARVIS will lock every lock and close every open door. Windows already open are left as they are."),confirmLabel:a("Engage"),cancelLabel:a("Cancel"),destructive:!0})){t.checked=s;return}this._setBusy("lock",!0);try{let o=await this.ws("jarvis/set_lockdown",{on:n});this._lockdown=o?.lockdown?Eo(o.lockdown):{...this._lockdown,active:n},o?.ok===!1?Ue(this,a("Lockdown request was not accepted")):Ue(this,n?a("Lockdown engaged"):a("Lockdown lifted")),this.refresh()}catch(o){Ue(this,`${a("Lockdown failed —")} ${Sn(o)}`)}finally{this._setBusy("lock",!1),t.checked=this._lockdown.active}}}async _setMode(e){if(!(this._busy.has("mode")||e===this._mode?.active)){this._setBusy("mode",!0);try{let t=await this.ws("jarvis/mode",{action:"set",mode:e,reason:"requested from panel"});if(t?.ok===!1){Ue(this,`${a("Mode change failed —")} ${t.error||""}`.trim());return}let n=Ao(t);n&&(this._mode=n),Ue(this,a("{mode} mode",{mode:Es(t?.mode||n?.active||e)})),this.refresh()}catch(t){Ue(this,`${a("Mode change failed —")} ${Sn(t)}`)}finally{this._setBusy("mode",!1)}}}async _onAutoToggle(e){let t=e.target,n=!!t.checked;if(!(n===this._auto||this._busy.has("auto"))){this._setBusy("auto",!0);try{let s=await this.ws("jarvis/update_config",{key:"operational_mode_auto",value:n});this._auto=typeof s?.value=="boolean"?s.value:n,Ue(this,this._auto?a("Automatic mode on"):a("Automatic mode off")),this.refresh()}catch(s){Ue(this,`${a("Couldn't save —")} ${Sn(s)}`)}finally{this._setBusy("auto",!1),t.checked=this._auto}}}async _service(e,t,n,s,o){if(this._busy.has(e))return;let l=this.hass;this._setBusy(e,!0);try{if(!l||typeof l.callService!="function")throw new Error(a("Home Assistant connection not available"));await l.callService("jarvis",t,n),Ue(this,s),Ci(this,pm)}catch(d){Ue(this,`${o} ${Sn(d)}`)}finally{this._setBusy(e,!1)}}_icon(e){return x("ha-icon")?c`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:m}_switch(e){if(x("ha-switch")){let t=c`
        <ha-switch
          .checked=${e.checked}
          .disabled=${e.disabled}
          aria-label=${e.label}
          title=${e.title??m}
          @change=${e.onChange}
        ></ha-switch>
      `;return!e.hideLabel&&x("ha-formfield")?c`<ha-formfield .label=${e.label}>${t}</ha-formfield>`:t}return c`
      <label class="switch" title=${e.title??m}>
        <input
          type="checkbox"
          role="switch"
          aria-label=${e.label}
          .checked=${e.checked}
          ?disabled=${e.disabled}
          @change=${e.onChange}
        />
        ${e.hideLabel?m:c`<span>${e.label}</span>`}
      </label>
    `}_renderLockbar(e){let t=this._lockdown,n=[];return t.active&&t.since&&n.push(a("since {time}",{time:Co(t.since)})),t.active&&t.auto&&n.push(a("engaged automatically (alarm armed)")),t.active&&t.reason&&n.push(t.reason),c`
      <div class="lockbar ${t.active?"on":""}" aria-live="polite">
        ${this._icon(t.active?"mdi:shield-lock":"mdi:shield-lock-open-outline")}
        <div class="text">
          <span>${a("Lockdown")}: <strong>${t.active?a("Engaged"):a("Off")}</strong></span>
          ${n.length?c`<span class="sub">${n.join(" · ")}</span>`:m}
        </div>
        ${this._switch({checked:t.active,disabled:!e||this._busy.has("lock"),label:a("Lockdown"),hideLabel:!0,title:t.active?a("Lockdown engaged — tap to lift"):a("Tap to engage lockdown"),onChange:s=>{this._onLockToggle(s)}})}
      </div>
    `}_renderStatus(e){let t=ed(e,this._lockdown,this._cfg),n=e.meta??{},s=[`${a("Bedrooms")} ${n.bedrooms??"—"}`,`${a("Areas Monitored")} ${n.areas_monitored??e.areas?.length??"—"}`,`${a("Announcements Today")} ${n.announcements_today??"—"}`,`${a("Uptime")} ${nt(n.uptime)??"—"}`,`v${e.version??"?"}`];return nt(n.est_cost)&&s.push(`${a("Est. cost")} ${n.est_cost}`),c`
      <jv-section .heading=${a("System Status")} icon="mdi:heart-pulse">
        <div class="tiles" aria-live="polite">
          ${t.map(o=>c`
              <div class="tile" data-key=${o.key}>
                <span class="dot" data-level=${o.level} aria-hidden="true"></span>
                <div>
                  <div class="label">${o.label}</div>
                  <div class="value ${o.key==="notify"?"jv-mono small":""}">${o.value}</div>
                  ${o.secondary?c`<div class="sec">${o.secondary}</div>`:m}
                </div>
              </div>
            `)}
        </div>
        <p class="meta">${s.join(" · ")}</p>
      </jv-section>
    `}_renderMode(){let e=this._mode,t=this._busy.has("mode"),n=e?.since?Co(e.since):"",s=[n?a("since {time}",{time:n}):"",e?.reason??""].filter(Boolean);return c`
      <jv-section .heading=${a("Operational Mode")} icon="mdi:tune-variant">
        ${e?c`<jv-state-badge slot="actions" level="accent" nodot .label=${Es(e.active)}></jv-state-badge>`:m}
        ${this._modeError?c`<p class="desc">${a("Couldn't load modes — restart Home Assistant after updating.")}</p>`:e?c`
                ${e.description?c`<p class="desc">${e.description}</p>`:m}
                ${s.length?c`<p class="desc">${s.join(" · ")}</p>`:m}
                <div class="chips" role="group" aria-label=${a("Mode")}>
                  ${e.available.map(o=>c`
                      <button
                        type="button"
                        class="chip jv-hit"
                        aria-pressed=${o.name===e.active?"true":"false"}
                        title=${o.description||m}
                        ?disabled=${t}
                        @click=${()=>{this._setMode(o.name)}}
                      >
                        ${Es(o.name)}
                      </button>
                    `)}
                </div>
              `:c`<jv-empty kind="loading" compact .message=${a("Loading...")}></jv-empty>`}
        <div class="toggle-row">
          <div>
            <div>${a("Follow occupancy automatically")}</div>
            <p class="help">
              ${a("Switches between Away and Normal as the home empties and fills. Party, Movie, Lab, Guest and Focus are always manual.")}
            </p>
          </div>
          ${this._switch({checked:this._auto,disabled:this._busy.has("auto"),label:a("Follow occupancy automatically"),hideLabel:!0,onChange:o=>{this._onAutoToggle(o)}})}
        </div>
      </jv-section>
    `}_renderNow(e){let t=e.dominant,n=!t||t.area_id===null||t.area_id===void 0,s=t?n?t.name==="AWAY"?a("Nobody home"):t.name==="AT HOME"?a("Someone is home"):t.name:t.name:"—",o=t?t.subtitle==="no presence detected"?a("No presence detected"):t.subtitle:"",l=[[a("Temperature"),nt(t?.temp)??"—"],[a("Humidity"),nt(t?.humidity)??"—"],[a("Lights"),nt(t?.lights)??"—"],[a("Last motion"),nt(t?.last_motion)??"—"]];nt(t?.satellite)&&l.push([a("Satellite"),t.satellite]);let d=c`
      <div class="big">${s}</div>
      ${o?c`<div class="jv-muted">${o}</div>`:m}
      <div class="stats">
        ${l.map(([u,p])=>c`<div><div class="k">${u}</div><div class="v">${p}</div></div>`)}
      </div>
    `;return c`
      <jv-section .heading=${a("Right now")} icon="mdi:map-marker-radius-outline">
        ${n?c`<div class="now">${d}</div>`:c`
              <button
                type="button"
                class="now"
                aria-label=${a("{name} details",{name:s})}
                @click=${()=>this._areasEl?.openArea(t.area_id)}
              >
                ${d}
              </button>
            `}
      </jv-section>
    `}_renderActions(e){let t=e.status?.sleep?.state==="ASLEEP"&&(e.sleep_reason||"").startsWith("manual nap"),n=s=>a("Mute JARVIS's non-critical announcements for {n} minutes. Does not change lights, covers or locks. Safety alerts still come through.",{n:s});return c`
      <jv-section .heading=${a("Quick Actions")} icon="mdi:gesture-tap-button">
        <div class="actions">
          <button type="button" class="jv-btn" title=${n(30)} ?disabled=${this._busy.has("nap30")}
            @click=${()=>{this._service("nap30","nap",{duration_minutes:30},a("Napping for 30 minutes"),a("Nap failed —"))}}>
            ${this._icon("mdi:sleep")} ${a("Nap 30 min")}
          </button>
          <button type="button" class="jv-btn" title=${n(60)} ?disabled=${this._busy.has("nap60")}
            @click=${()=>{this._service("nap60","nap",{duration_minutes:60},a("Napping for 60 minutes"),a("Nap failed —"))}}>
            ${this._icon("mdi:sleep")} ${a("Nap 60 min")}
          </button>
          <button type="button" class="jv-btn" title=${a("Cancel any active nap or shush and resume normal announcements.")}
            ?disabled=${this._busy.has("unshush")}
            @click=${()=>{this._service("unshush","unshush",{},a("Announcements resumed"),a("Unshush failed —"))}}>
            ${this._icon("mdi:volume-high")} ${a("Unshush All")}
          </button>
        </div>
        ${t?c`<p class="nap" role="status">${e.sleep_reason}</p>`:m}
      </jv-section>
    `}_renderAreas(e){let t=Array.isArray(e.areas)?e.areas:[],n=t.filter(s=>s.active).length;return c`
      <jv-section
        class="jv-span-all"
        .heading=${a("Areas")}
        icon="mdi:floor-plan"
        .subheading=${t.length?a("{occupied} occupied · {total}",{occupied:n,total:t.length}):""}
      >
        ${t.length===0?c`<jv-empty compact icon="mdi:home-search-outline" .heading=${a("No areas yet")}
              .message=${a("No areas with JARVIS-relevant devices yet. Assign satellites, speakers, presence sensors or lights to Home Assistant areas.")}></jv-empty>`:c`<jarvis-ov-areas .hass=${this.hass} .areas=${t} .lightControl=${this._cfg.lightControl}></jarvis-ov-areas>`}
      </jv-section>
    `}_renderSkeleton(){let e=c`<div class="sk" role="status" aria-label=${a("Loading...")}>
      <div class="jv-skeleton"></div><div class="jv-skeleton"></div><div class="jv-skeleton"></div>
    </div>`;return c`
      <div class="jv-grid">
        <jv-section .heading=${a("System Status")} loading>${e}</jv-section>
        <jv-section .heading=${a("Operational Mode")} loading>${e}</jv-section>
        <jv-section .heading=${a("Right now")} loading>${e}</jv-section>
        <jv-section class="jv-span-all" .heading=${a("Areas")} loading>${e}</jv-section>
      </div>
    `}render(){let e=this.data;return c`
      <div class=${this.narrow?"narrow":""}>
        ${this._renderLockbar(!!e)}
        ${e?c`
              <div class="jv-grid">
                ${this._renderStatus(e)} ${this._renderMode()} ${this._renderNow(e)} ${this._renderActions(e)} ${this._renderAreas(e)}
              </div>
            `:this._renderSkeleton()}
      </div>
    `}};mt.styles=[T,rd],h([b()],mt.prototype,"_mode",2),h([b()],mt.prototype,"_modeError",2),h([b()],mt.prototype,"_lockdown",2),h([b()],mt.prototype,"_auto",2),h([b()],mt.prototype,"_cfg",2),h([b()],mt.prototype,"_busy",2),h([me("jarvis-ov-areas")],mt.prototype,"_areasEl",2),mt=h([A("jarvis-view-overview")],mt);var Xe=class extends L{constructor(){super(...arguments);this.path="";this.caption="";this.alt="";this.variant="hero";this._src="";this._failed=!1;this._open=!1;this._openSrc="";this._signedFor="";this._seq=0}connectedCallback(){super.connectedCallback(),P(this,["ha-dialog","ha-icon","ha-icon-button"]),this._unsubLang=Br(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),this._unsubLang?.(),this._unsubLang=void 0,this._open=!1}willUpdate(e){if(e.has("path")&&!this.path){this._seq++,this._signedFor="",this._src="",this._failed=!1;return}(e.has("path")||e.has("hass"))&&this.hass&&this.path&&this.path!==this._signedFor&&this._sign()}updated(){if(this._open&&!x("ha-dialog")){let e=this._native;if(e&&!e.open)try{e.showModal()}catch{e.setAttribute("open","")}}}async _sign(){let e=this.path,t=++this._seq;if(this._signedFor=e,this._failed=!1,this._src="",!e||!this.hass)return;let n=await Tt(this.hass,e);t===this._seq&&(this._src=n)}_onError(){this._failed=!0,this._open=!1}async _openFull(){if(!this._src||this._failed)return;let e=this.hass?await Tt(this.hass,this.path):this._src;this._openSrc=e||this._src,this._open=!0}_close(){this._open=!1;let e=this._native;e?.open&&e.close()}_renderDialog(){if(!this._open||!this._openSrc)return m;let e=this.caption||a("Intrusion snapshot"),t=c`<img class="full" src=${this._openSrc} alt=${this.alt||a("Intrusion snapshot")} @error=${this._onError} />`;return x("ha-dialog")?c`
        <ha-dialog open hideActions .heading=${e} @closed=${this._close} escapeKeyAction="close" scrimClickAction="close">
          ${t}
        </ha-dialog>
      `:c`
      <dialog
        aria-labelledby="snap-h"
        @cancel=${n=>{n.preventDefault(),this._close()}}
        @click=${n=>{n.target===this._native&&this._close()}}
      >
        <div class="dlg-head">
          <h2 id="snap-h">${e}</h2>
          <button class="jv-icon-btn" type="button" aria-label=${a("Close")} @click=${this._close}>
            ${x("ha-icon")?c`<ha-icon icon="mdi:close" aria-hidden="true"></ha-icon>`:c`<span aria-hidden="true">×</span>`}
          </button>
        </div>
        ${t}
      </dialog>
    `}render(){if(!this.path)return m;if(this._failed)return c`<p class="gone">
        ${x("ha-icon")?c`<ha-icon icon="mdi:image-off-outline" aria-hidden="true"></ha-icon>`:m}
        <span>${a("Snapshot no longer available")}</span>
      </p>`;let e=this.alt||a("Intrusion snapshot");return c`
      <button
        class="frame"
        type="button"
        aria-label=${a("Open snapshot")}
        ?disabled=${!this._src}
        @click=${()=>{this._openFull()}}
      >
        ${this._src?c`<img src=${this._src} alt=${e} loading="lazy" @error=${this._onError} />`:c`<div class="jv-skeleton skeleton" role="img" aria-label=${a("Loading...")}></div>`}
      </button>
      ${this.caption?c`<p class="caption">${this.caption}</p>`:m}
      ${this._renderDialog()}
    `}};Xe.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      .frame {
        appearance: none;
        display: block;
        width: 100%;
        padding: 0;
        border: 0;
        background: var(--jv-bg-2);
        border-radius: var(--jv-radius-sm);
        overflow: hidden;
        cursor: zoom-in;
        color: inherit;
      }
      :host([variant="hero"]) .frame {
        aspect-ratio: 16 / 9;
        max-height: 280px;
      }
      /* the parent sets --jv-thumb-* when its column is too narrow for a side thumbnail */
      :host([variant="thumb"]) .frame {
        width: var(--jv-thumb-width, 160px);
        height: var(--jv-thumb-height, 120px);
        aspect-ratio: var(--jv-thumb-ratio, auto);
      }
      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .skeleton {
        width: 100%;
        height: 100%;
        min-height: 100%;
        border-radius: 0;
      }
      .caption {
        margin: var(--jv-space-1) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .gone {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      :host([variant="thumb"]) .gone {
        width: var(--jv-thumb-width, 160px);
        height: var(--jv-thumb-height, 120px);
        min-height: var(--jv-tap);
        justify-content: center;
        text-align: center;
        padding: var(--jv-space-2);
        background: var(--jv-bg-2);
        border-radius: var(--jv-radius-sm);
      }
      dialog {
        border: 0;
        padding: 0;
        max-width: min(96vw, 1100px);
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius);
        box-shadow: var(--jv-shadow);
      }
      dialog::backdrop {
        background: var(--jv-scrim);
      }
      .full {
        display: block;
        max-width: 96vw;
        max-height: 80vh;
        width: auto;
        height: auto;
        object-fit: contain;
        margin: 0 auto;
      }
      .dlg-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-3);
        padding: var(--jv-space-3) var(--jv-space-3) var(--jv-space-3) var(--jv-space-4);
      }
      .dlg-head h2 {
        margin: 0;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
        min-width: 0;
        overflow-wrap: anywhere;
      }
      ha-dialog img {
        max-height: 70vh;
      }
    `],h([$({attribute:!1})],Xe.prototype,"hass",2),h([$({type:String})],Xe.prototype,"path",2),h([$({type:String})],Xe.prototype,"caption",2),h([$({type:String})],Xe.prototype,"alt",2),h([$({type:String,reflect:!0})],Xe.prototype,"variant",2),h([b()],Xe.prototype,"_src",2),h([b()],Xe.prototype,"_failed",2),h([b()],Xe.prototype,"_open",2),h([b()],Xe.prototype,"_openSrc",2),h([me("dialog")],Xe.prototype,"_native",2),Xe=h([A("jv-intrusion-snapshot")],Xe);var To={events:0,labeled:0,patterns:{},damped_patterns:[],min_false_to_damp:3},id=[{value:60,label:"1 min"},{value:120,label:"2 min"},{value:180,label:"3 min"},{value:300,label:"5 min"},{value:600,label:"10 min"}];function Rs(r){return!r||typeof r!="object"?To:{events:Number(r.events)||0,labeled:Number(r.labeled)||0,patterns:r.patterns&&typeof r.patterns=="object"?r.patterns:{},damped_patterns:Array.isArray(r.damped_patterns)?r.damped_patterns:[],min_false_to_damp:Number(r.min_false_to_damp)||3}}function As(r,i){if(!i)return"";let e=r?.states?.[i]?.attributes?.friendly_name;return typeof e=="string"&&e.trim()?e:i.replace(/^camera\./,"").replace(/_/g," ")}function vm(r){let i=r?.locale?.language||r?.language;return typeof i=="string"&&i?i:void 0}function Kr(r,i){let e=Number(i)*1e3;if(!Number.isFinite(e)||e<=0)return"";try{return new Intl.DateTimeFormat(vm(r),{dateStyle:"medium",timeStyle:"short"}).format(new Date(e))}catch{return new Date(e).toISOString()}}function sd(r,i=Date.now()){let e=Number(r)*1e3;if(!Number.isFinite(e)||e<=0)return"";let t=Math.max(0,Math.round((i-e)/1e3));if(t<60)return a("just now");let n=Math.round(t/60);if(n<60)return a("{n} min ago",{n});let s=Math.round(n/60);return s<48?a("{n} h ago",{n:s}):a("{n} d ago",{n:Math.round(s/24)})}function ad(r){switch(r){case"confirmed":return"danger";case"unresolved":return"warn";case"investigating":return"info";case"false_alarm":return"neutral";default:return"neutral"}}function od(r){switch(r){case"confirmed":return a("CONFIRMED");case"unresolved":return a("UNRESOLVED");case"investigating":return a("INVESTIGATING");case"false_alarm":return a("FALSE ALARM");default:return String(r||"").replace(/_/g," ").toUpperCase()}}function zn(r,i){r.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:i},bubbles:!0,composed:!0}))}function En(r){if(r&&typeof r=="object"&&"message"in r){let i=r.message;if(typeof i=="string"&&i)return i}return String(r??a("Unknown error"))}var mm=40,ld=200,ft=class extends L{constructor(){super(...arguments);this._events=null;this._learning=To;this._loading=!1;this._error=null;this._limit=mm;this._pending=new Set;this._loaded=!1}connectedCallback(){super.connectedCallback(),P(this,["ha-icon","ha-icon-button"]),this._unsubLang=Br(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),this._unsubLang?.(),this._unsubLang=void 0}updated(e){e.has("hass")&&this.hass&&!this._loaded&&(this._loaded=!0,this.load())}async load(e=this._limit){if(!this._loading){this._loading=!0,this._error=null,this._limit=e;try{let t=await X(this.hass,"jarvis/intrusion",{action:"log",limit:e}),n=Array.isArray(t?.events)?t.events:[];this._events=n,this._learning=Rs(t?.learning),this.dispatchEvent(new CustomEvent("jv-intrusion-log",{detail:{events:n,learning:this._learning},bubbles:!0,composed:!0}))}catch(t){this._error=En(t)}finally{this._loading=!1}}}async _label(e,t){if(!this._pending.has(e.id)&&!(t===""&&e.label==null||t!==""&&e.label===t)){this._pending=new Set([...this._pending,e.id]);try{let n=await X(this.hass,"jarvis/intrusion",{action:"label",event_id:e.id,label:t});if(n&&n.ok===!1){zn(this,n.error||a("Could not save the label")),n.learning&&(this._learning=Rs(n.learning)),this.load();return}let s=n&&"label"in n&&(n.label==="real"||n.label==="false"||n.label===null)?n.label:t===""?null:t;this._events=(this._events??[]).map(o=>o.id===e.id?{...o,label:s,labeled_ts:Date.now()/1e3}:o),n?.learning?this._learning=Rs(n.learning):this._learning={...this._learning,labeled:this._events.filter(o=>o.label).length}}catch(n){zn(this,En(n))}finally{let n=new Set(this._pending);n.delete(e.id),this._pending=n}}}_renderRefresh(){let e=a("Refresh");return x("ha-icon-button")?c`
        <ha-icon-button slot="actions" .label=${e} ?disabled=${this._loading} @click=${()=>{this.load()}}>
          ${x("ha-icon")?c`<ha-icon icon="mdi:refresh"></ha-icon>`:m}
        </ha-icon-button>
      `:c`
      <button slot="actions" class="jv-icon-btn" type="button" aria-label=${e} ?disabled=${this._loading} @click=${()=>{this.load()}}>
        ${x("ha-icon")?c`<ha-icon icon="mdi:refresh"></ha-icon>`:c`<span aria-hidden="true">↻</span>`}
      </button>
    `}_renderEvent(e){let t=this._pending.has(e.id),n=As(this.hass,e.camera),s=e.breach||n||a("activity"),o=Kr(this.hass,e.ts),l=[];return Array.isArray(e.zones)&&e.zones.length&&l.push(e.zones.join(", ")),e.max_depth!=null&&Number.isFinite(Number(e.max_depth))&&l.push(a("depth {n}",{n:e.max_depth})),c`
      <li>
        <div class="meta">
          <jv-state-badge level=${ad(e.kind)} .label=${od(e.kind)}></jv-state-badge>
          <time class="time" datetime=${new Date(Number(e.ts)*1e3).toISOString()} title=${o}>${sd(e.ts)}</time>
        </div>
        ${e.snapshot_url?c`<jv-intrusion-snapshot
              class="thumb"
              variant="thumb"
              .hass=${this.hass}
              .path=${e.snapshot_url}
              .alt=${a("Intrusion snapshot")}
              .caption=${""}
            ></jv-intrusion-snapshot>`:m}
        <div>
          <p class="what">${s}${e.reason?c` — <span class="jv-muted">${e.reason}</span>`:m}</p>
          ${l.length?c`<p class="extra">${l.join(" · ")}</p>`:m}
        </div>
        <div class="labels" role="group" aria-label=${a("Label this event")}>
          <span class="seg">
            <button
              class="jv-btn real"
              type="button"
              aria-pressed=${e.label==="real"?"true":"false"}
              ?disabled=${t}
              @click=${()=>{this._label(e,"real")}}
            >
              ${a("REAL")}
            </button>
            <button
              class="jv-btn"
              type="button"
              aria-pressed=${e.label==="false"?"true":"false"}
              ?disabled=${t}
              @click=${()=>{this._label(e,"false")}}
            >
              ${a("FALSE ALARM")}
            </button>
          </span>
          ${e.label?c`<button class="jv-btn text" type="button" ?disabled=${t} @click=${()=>{this._label(e,"")}}>
                ${a("Clear label")}
              </button>`:m}
          ${e.labeled_ts&&e.label?c`<span class="labelled">${a("labelled {time}",{time:Kr(this.hass,e.labeled_ts)})}</span>`:m}
        </div>
      </li>
    `}_renderBody(){if(this._events===null)return this._error?c`
          <jv-empty compact kind="error" icon="mdi:alert-circle-outline" .heading=${a("Could not load the log.")} .message=${this._error}>
            <button slot="action" class="jv-btn" type="button" @click=${()=>{this.load()}}>${a("Retry")}</button>
          </jv-empty>
        `:c`
        <div role="status" aria-live="polite" aria-label=${a("Loading...")}>
          ${[0,1,2].map(()=>c`<div class="skeleton-row"><div class="jv-skeleton"></div><div class="jv-skeleton"></div></div>`)}
        </div>
      `;if(!this._events.length)return c`<jv-empty compact icon="mdi:shield-check-outline" .message=${a("No intrusion events recorded yet.")}></jv-empty>`;let e=this._events.length>=this._limit&&this._limit<ld;return c`
      ${this._error?c`<div class="banner" role="alert">${a("Could not load the log.")} ${this._error}</div>`:m}
      <ul>
        ${this._events.map(t=>this._renderEvent(t))}
      </ul>
      ${e?c`<div class="more">
            <button class="jv-btn text" type="button" ?disabled=${this._loading} @click=${()=>{this.load(ld)}}>
              ${a("Show more")}
            </button>
          </div>`:m}
    `}render(){let e=this._learning,t=this._events===null?this._error?"":"…":`${e.labeled}/${e.events} ${a("LABELLED")}`,n=e.damped_patterns.length;return c`
      <jv-section .heading=${a("Intrusion Log")} icon="mdi:format-list-bulleted-type" ?loading=${this._loading&&this._events!==null}>
        ${t?c`<span slot="actions" class="count" aria-live="polite">${t}</span>`:m}
        ${this._renderRefresh()}
        <p class="intro">
          ${a("Every intrusion event with its snapshot. Mark each one real or false alarm — JARVIS learns from your labels and stops firing the low-confidence alerts for patterns you keep calling false. A confirmed intrusion always alerts, no matter what it has learned.")}
        </p>
        ${n>0?c`<div class="banner" role="status">
              ${x("ha-icon")?c`<ha-icon icon="mdi:school-outline" aria-hidden="true"></ha-icon>`:m}
              <span>
                ${n===1?a("JARVIS has learned {n} benign pattern — low-confidence alerts for these stay quiet.",{n}):a("JARVIS has learned {n} benign patterns — low-confidence alerts for these stay quiet.",{n})}
              </span>
            </div>`:m}
        ${this._renderBody()}
      </jv-section>
    `}};ft.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      .intro {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .banner {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-2);
        margin: 0 0 var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-info-soft);
        font-size: var(--jv-font-size-s);
      }
      .banner ha-icon {
        color: var(--jv-info);
        flex: none;
        --mdc-icon-size: 18px;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        container-type: inline-size;
      }
      li {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-3) 0;
        border-top: 1px solid var(--jv-divider);
      }
      li:first-child {
        border-top: 0;
        padding-top: 0;
      }
      li .thumb {
        grid-column: 2;
        grid-row: 1 / span 2;
        align-self: start;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .time {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .what {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .extra {
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .labels {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        align-items: center;
      }
      /* no overflow: hidden here - it would clip the (outer) focus ring; the
         end buttons round their own corners instead */
      .seg {
        display: inline-flex;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
      }
      .seg .jv-btn {
        border: 0;
        border-radius: 0;
      }
      .seg .jv-btn:first-child {
        border-radius: calc(var(--jv-radius-sm) - var(--jv-border-width)) 0 0 calc(var(--jv-radius-sm) - var(--jv-border-width));
      }
      .seg .jv-btn:last-child {
        border-radius: 0 calc(var(--jv-radius-sm) - var(--jv-border-width)) calc(var(--jv-radius-sm) - var(--jv-border-width)) 0;
      }
      .seg .jv-btn + .jv-btn {
        border-left: var(--jv-border-width) solid var(--jv-border);
      }
      /* pressed: the state colour carries in the ring, the text stays readable */
      .seg .jv-btn[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        color: var(--jv-accent-text);
        box-shadow: inset 0 0 0 1px var(--jv-accent);
      }
      .seg .jv-btn[aria-pressed="true"].real {
        background: var(--jv-danger-soft);
        color: var(--jv-danger-text);
        box-shadow: inset 0 0 0 1px var(--jv-danger);
      }
      .seg .jv-btn[aria-pressed="true"]:focus-visible {
        box-shadow: var(--jv-focus-ring), inset 0 0 0 1px var(--jv-accent);
      }
      .seg .jv-btn[aria-pressed="true"].real:focus-visible {
        box-shadow: var(--jv-focus-ring), inset 0 0 0 1px var(--jv-danger);
      }
      .labelled {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      .more {
        margin-top: var(--jv-space-3);
        display: flex;
        justify-content: center;
      }
      .skeleton-row {
        display: grid;
        gap: var(--jv-space-2);
        padding: var(--jv-space-3) 0;
        border-top: 1px solid var(--jv-divider);
      }
      .skeleton-row:first-child {
        border-top: 0;
        padding-top: 0;
      }
      .skeleton-row .jv-skeleton:nth-child(2) {
        width: 60%;
      }
      .count {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      @container (max-width: 599px) {
        li {
          grid-template-columns: minmax(0, 1fr);
        }
        li .thumb {
          grid-column: 1;
          grid-row: auto;
          --jv-thumb-width: 100%;
          --jv-thumb-height: auto;
          --jv-thumb-ratio: 4 / 3;
        }
        .seg {
          width: 100%;
        }
        .seg .jv-btn {
          flex: 1 1 0;
        }
      }
    `],h([$({attribute:!1})],ft.prototype,"hass",2),h([b()],ft.prototype,"_events",2),h([b()],ft.prototype,"_learning",2),h([b()],ft.prototype,"_loading",2),h([b()],ft.prototype,"_error",2),h([b()],ft.prototype,"_limit",2),h([b()],ft.prototype,"_pending",2),ft=h([A("jv-intrusion-log")],ft);var Rn=class extends L{constructor(){super(...arguments);this.config=null;this._pending=new Set;this._override={}}connectedCallback(){super.connectedCallback(),P(this,["ha-switch","ha-formfield","ha-select","ha-list-item"]),this._unsubLang=Br(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),this._unsubLang?.(),this._unsubLang=void 0}willUpdate(e){if(e.has("config")&&this.config&&Object.keys(this._override).length){let t={...this._override},n=!1;for(let s of Object.keys(t))String(this.config[s])===String(t[s])&&(delete t[s],n=!0);n&&(this._override=t)}}_cfg(e){return e in this._override?this._override[e]:this.config?.[e]}async _write(e,t){if(!this._pending.has(e)){this._pending=new Set([...this._pending,e]),this._override={...this._override,[e]:t};try{let n=await X(this.hass,"jarvis/update_config",{key:e,value:t}),s=n&&typeof n=="object"&&"value"in n?n.value:t;this._override={...this._override,[e]:s??t},zn(this,a("Saved")),this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}catch(n){let s={...this._override};delete s[e],this._override=s,zn(this,`${e} — ${En(n)}`)}finally{let n=new Set(this._pending);n.delete(e),this._pending=n}}}_onTimeout(e){let t=e.target?.value,n=Number(t);if(!Number.isFinite(n)||n<=0)return;let s=Number(this._cfg("intrusion_response_timeout"))||120;n!==s&&this._write("intrusion_response_timeout",n)}_renderTimeout(e){let t=Number(this._cfg("intrusion_response_timeout"))||120,n=id.map(l=>({value:l.value,label:a(l.label)}));n.some(l=>l.value===t)||(n.push({value:t,label:a("{n} s",{n:t})}),n.sort((l,d)=>l.value-d.value));let s=a("Auto-escalate if no response after"),o=e||this._pending.has("intrusion_response_timeout");return x("ha-select")&&x("ha-list-item")?c`
        <ha-select
          .label=${s}
          .value=${String(t)}
          ?disabled=${o}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${this._onTimeout}
          @closed=${l=>l.stopPropagation()}
        >
          ${n.map(l=>c`<ha-list-item .value=${String(l.value)}>${l.label}</ha-list-item>`)}
        </ha-select>
      `:c`
      <label class="field">
        <span>${s}</span>
        <select ?disabled=${o} @change=${this._onTimeout}>
          ${n.map(l=>c`<option value=${String(l.value)} .selected=${l.value===t}>${l.label}</option>`)}
        </select>
      </label>
    `}_renderSwitch(e,t,n,s){let o=s||this._pending.has(e),l=d=>{let u=d.target;!u||!!u.checked===t||this._write(e,!!u.checked)};return x("ha-switch")&&x("ha-formfield")?c`
        <ha-formfield .label=${n}>
          <ha-switch .checked=${t} ?disabled=${o} @change=${l}></ha-switch>
        </ha-formfield>
      `:c`
      <label class="switch">
        <input type="checkbox" role="switch" .checked=${t} ?disabled=${o} @change=${l} />
        <span>${n}</span>
      </label>
    `}render(){let e=!this.config;return c`
      <fieldset>
        <legend>${a("Response settings")}</legend>
        ${this._renderTimeout(e)}
        ${this._renderSwitch("intrusion_vision_confirm",this._cfg("intrusion_vision_confirm")!==!1,a("Confirm Frigate person with JARVIS vision before alarming"),e)}
        ${this._renderSwitch("intrusion_vision_veto",this._cfg("intrusion_vision_veto")!==!1,a("Stay silent when JARVIS's own cameras clearly show no one (recommended) — turn OFF to stay ever-vigilant and alert on any unanswered activity"),e)}
        ${this._renderSwitch("intrusion_requires_confinement",this._cfg("intrusion_requires_confinement")===!0,a("Require confinement (Lockdown or armed alarm) for intrusion monitoring"),e)}
      </fieldset>
    `}};Rn.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      fieldset {
        border: 0;
        margin: var(--jv-space-3) 0 0;
        padding: var(--jv-space-3) 0 0;
        border-top: 1px solid var(--jv-divider);
        min-width: 0;
      }
      legend {
        padding: 0;
        margin-bottom: var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text-2);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        margin: 0 0 var(--jv-space-3);
      }
      .field > span {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      select {
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        max-width: 100%;
      }
      ha-select {
        display: block;
        margin: 0 0 var(--jv-space-3);
      }
      .switch {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-3);
        min-height: var(--jv-tap);
        padding: var(--jv-space-1) 0;
        cursor: pointer;
      }
      .switch input {
        flex: none;
        width: 20px;
        height: 20px;
        margin: 2px 0 0;
        accent-color: var(--jv-accent);
      }
      .switch span {
        font-size: var(--jv-font-size-s);
        line-height: 1.4;
      }
      ha-formfield {
        display: block;
        margin: 0 0 var(--jv-space-2);
        --ha-formfield-align-items: flex-start;
      }
    `],h([$({attribute:!1})],Rn.prototype,"hass",2),h([$({attribute:!1})],Rn.prototype,"config",2),h([b()],Rn.prototype,"_pending",2),h([b()],Rn.prototype,"_override",2),Rn=h([A("jv-intrusion-settings")],Rn);var fm=["ha-icon","ha-alert"],gm=5e3,Pt=class extends de{constructor(){super(...arguments);this._status=null;this._statusError=null;this._statusLoading=!1;this._pending=null;this._notice="";this._latestEventSnap=null;this._statusAt=0;this._started=!1;this._tick=null;this._noticeTimer=null;this._unsubs=[];this._onLogLoaded=e=>{let t=(e.detail?.events??[]).find(n=>n&&n.snapshot_url);this._latestEventSnap=t?{url:t.snapshot_url,camera:t.camera,ts:t.ts}:null}}connectedCallback(){super.connectedCallback(),P(this,fm),this.addEventListener("jv-intrusion-log",this._onLogLoaded)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("jv-intrusion-log",this._onLogLoaded),this._stopTick(),this._noticeTimer&&clearTimeout(this._noticeTimer);for(let e of this._unsubs)try{e()}catch{}this._unsubs=[]}updated(e){e.has("hass")&&this.hass&&!this._started&&(this._started=!0,this._loadStatus(),this._subscribe()),e.has("data")&&e.get("data")&&this.data&&this.hass&&Date.now()-this._statusAt>gm&&this._loadStatus(!0)}async _subscribe(){let e=this.hass?.connection,t=e?.subscribeEvents;if(!(!e||typeof t!="function"||this._unsubs.length))for(let n of["jarvis_intrusion_confirmed","jarvis_intrusion_unresolved"])try{let s=await t.call(e,()=>this._onBusEvent(),n);typeof s=="function"&&this._unsubs.push(s)}catch{}}_onBusEvent(){this._loadStatus(!0),this.renderRoot.querySelector("jv-intrusion-log")?.load(),this.refresh()}async _loadStatus(e=!1){if(!this._statusLoading){this._statusLoading=!0,e||(this._statusError=null);try{let t=await this.ws("jarvis/intrusion",{action:"status"});this._applyStatus(t),this._statusError=null}catch(t){(!e||!this._status)&&(this._statusError=En(t))}finally{this._statusLoading=!1}}}_applyStatus(e){let t=e&&typeof e=="object"?e:{};this._status={last_snapshot:t.last_snapshot&&t.last_snapshot.url?t.last_snapshot:null,called_off:!!t.called_off,acknowledged:!!t.acknowledged,suppressed_for:Math.max(0,Number(t.suppressed_for)||0),false_alarms_24h:Math.max(0,Number(t.false_alarms_24h)||0)},this._statusAt=Date.now(),this._status.called_off&&this._status.suppressed_for>0?this._startTick():this._stopTick()}_suppressedLeft(){return this._status?Math.max(0,this._status.suppressed_for-Math.floor((Date.now()-this._statusAt)/1e3)):0}_startTick(){this._tick||(this._tick=setInterval(()=>{this._suppressedLeft()<=0&&this._stopTick(),this.requestUpdate()},1e3))}_stopTick(){this._tick&&clearInterval(this._tick),this._tick=null}_say(e){zn(this,e),this._notice=e,this._noticeTimer&&clearTimeout(this._noticeTimer),this._noticeTimer=setTimeout(()=>{this._notice="",this._noticeTimer=null},5e3)}async _callOff(){if(!(this._pending||!await U({heading:a("Call off this intrusion as a false alarm?"),message:a("Escalation stays quiet for 10 minutes and the event is recorded as a false alarm."),confirmLabel:a("CALL OFF (FALSE ALARM)"),destructive:!0}))){this._pending="dismiss";try{let t=await this.ws("jarvis/intrusion",{action:"dismiss",reason:"panel"});this._applyStatus(t),this._say(a("Intrusion called off")),this.refresh(),this.renderRoot.querySelector("jv-intrusion-log")?.load()}catch(t){this._say(En(t))}finally{this._pending=null}}}async _acknowledge(){if(!this._pending){this._pending="acknowledge";try{let e=await this.ws("jarvis/intrusion",{action:"acknowledge",reason:"panel"});this._applyStatus(e),this._say(a("Acknowledged — holding escalation"))}catch(e){this._say(En(e))}finally{this._pending=null}}}_icon(e){return x("ha-icon")?c`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:m}_chip(){let e=this.data?.intrusion,t=this._status;if(e?.confirmed)return c`<jv-state-badge level="danger" pulse .label=${a("CONFIRMED")}></jv-state-badge>`;if(e?.active)return c`<jv-state-badge level="warn" pulse .label=${a("INVESTIGATING")}></jv-state-badge>`;if(t?.called_off){let n=this._suppressedLeft();return c`<jv-state-badge level="warn" .label=${n>0?`${a("CALLED OFF")} · ${n}s`:a("CALLED OFF")}></jv-state-badge>`}return t?c`<jv-state-badge level="ok" .label=${a("ARMED")}></jv-state-badge>`:this._statusError?c`<jv-state-badge level="neutral" label="—"></jv-state-badge>`:c`<jv-state-badge level="neutral" .label=${a("Loading...")}></jv-state-badge>`}_renderInvestigation(){let e=this.data?.intrusion;if(!e?.active)return m;let t=typeof e.breach_name=="string"&&e.breach_name?e.breach_name:e.breach_area||"",n=Array.isArray(e.zones)?e.zones:[],s=Array.isArray(e.path)?e.path:[],o=n.length?n:s;return c`
      <p class="line">
        ${this._icon("mdi:door-open")}
        <span><strong>${a("Breach")}:</strong> ${t||a("activity")}</span>
        ${o.length?c`<span class="zones jv-muted">${o.join(" → ")}</span>`:m}
      </p>
    `}_renderLockdown(){let e=this.data?.lockdown;if(!e?.active)return m;let t=Kr(this.hass,e.since),n=e.auto?a("Lockdown engaged automatically since {time}",{time:t}):a("Lockdown engaged since {time}",{time:t});return c`
      <div class="banner danger" role="status">
        ${this._icon("mdi:lock-alert-outline")}
        <span>${n}${e.reason?c` — ${e.reason}`:m}</span>
      </div>
    `}_renderHero(){let e=this._status?.last_snapshot??this._latestEventSnap;if(e?.url){let t=As(this.hass,e.camera),n=Kr(this.hass,e.ts);return c`
        <jv-intrusion-snapshot
          class="hero"
          variant="hero"
          .hass=${this.hass}
          .path=${e.url}
          .alt=${a("Intrusion snapshot")}
          .caption=${[t,n].filter(Boolean).join(" · ")}
        ></jv-intrusion-snapshot>
      `}return this._status?c`
      <jv-empty
        compact
        icon="mdi:camera-off-outline"
        .message=${a("No intrusion snapshots captured. This stays empty unless JARVIS confirms an intruder on camera.")}
      ></jv-empty>
    `:m}_renderStatusBody(){let e=this._status;if(!e&&this._statusError)return c`
        <div class="banner danger" role="alert">
          ${this._icon("mdi:alert-circle-outline")}
          <span>${a("Couldn't load — restart Home Assistant after updating.")} ${this._statusError}</span>
          <button class="jv-btn text" type="button" @click=${()=>{this._loadStatus()}}>${a("Retry")}</button>
        </div>
      `;if(!e)return c`<jv-empty compact kind="loading" .message=${a("Loading...")}></jv-empty>`;let t=e.false_alarms_24h;return c`
      ${e.acknowledged?c`<div class="banner ok" role="status">
            ${this._icon("mdi:check-circle-outline")}
            <span>${a("Acknowledged — automatic escalation held (you're handling it)")}</span>
          </div>`:m}
      ${this._renderHero()}
      ${t>0?c`<p class="count">
            ${t===1?a("{n} false alarm called off in the last 24h",{n:t}):a("{n} false alarms called off in the last 24h",{n:t})}
          </p>`:m}
    `}render(){if(!this.hass)return c`<jv-empty kind="loading" .message=${a("Loading...")}></jv-empty>`;let e=this._pending!==null;return c`
      <div class="layout">
        <jv-section .heading=${a("Intrusion")} icon="mdi:shield-home-outline" ?loading=${this._statusLoading&&!!this._status}>
          <span slot="actions" aria-live="polite">${this._chip()}</span>
          <p class="intro">
            ${a(`Last intrusion snapshot and false-alarm call-off. When JARVIS confirms an intruder on camera it grabs a still; if it's not real, call it off here or say "it's a false alarm".`)}
          </p>
          ${this._renderInvestigation()} ${this._renderLockdown()} ${this._renderStatusBody()}
          <div class="actions">
            <button class="jv-btn danger" type="button" ?disabled=${e} @click=${()=>{this._callOff()}}>
              ${this._icon("mdi:close-circle-outline")} ${a("CALL OFF (FALSE ALARM)")}
            </button>
            <button class="jv-btn" type="button" ?disabled=${e} @click=${()=>{this._acknowledge()}}>
              ${this._icon("mdi:eye-check-outline")} ${a("I'M LOOKING")}
            </button>
          </div>
          <p class="notice" role="status" aria-live="polite">${this._notice}</p>
          <jv-intrusion-settings .hass=${this.hass} .config=${this.data?.config??null}></jv-intrusion-settings>
        </jv-section>
        <jv-intrusion-log .hass=${this.hass}></jv-intrusion-log>
      </div>
    `}};Pt.styles=[T,S`
      :host {
        container-type: inline-size;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      /* container, not viewport: the harness phone frame and a docked HA sidebar both shrink the panel, not the window */
      @container (min-width: 1024px) {
        .layout {
          grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
        }
      }
      @container (max-width: 599px) {
        .actions {
          flex-direction: column;
        }
        .actions .jv-btn {
          width: 100%;
        }
      }
      .intro {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .line {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2);
        margin: 0 0 var(--jv-space-2);
        min-width: 0;
      }
      .line.muted {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .line ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }
      .banner {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-2);
        margin: 0 0 var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        font-size: var(--jv-font-size-s);
      }
      .banner.ok {
        background: var(--jv-ok-soft);
      }
      .banner.ok ha-icon {
        color: var(--jv-ok);
      }
      .banner.danger {
        background: var(--jv-danger-soft);
      }
      .banner.danger ha-icon {
        color: var(--jv-danger);
      }
      .banner.warn {
        background: var(--jv-warn-soft);
      }
      .banner.warn ha-icon {
        color: var(--jv-warn);
      }
      .banner ha-icon {
        flex: none;
        --mdc-icon-size: 18px;
      }
      .banner .jv-btn {
        margin-left: auto;
      }
      .hero {
        margin: var(--jv-space-2) 0 var(--jv-space-3);
      }
      .count {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        margin-top: var(--jv-space-3);
      }
      .actions .jv-btn {
        flex: 1 1 auto;
      }
      .notice {
        min-height: 1.5em;
        margin: var(--jv-space-2) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .zones {
        display: inline-flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
      }
    `],h([b()],Pt.prototype,"_status",2),h([b()],Pt.prototype,"_statusError",2),h([b()],Pt.prototype,"_statusLoading",2),h([b()],Pt.prototype,"_pending",2),h([b()],Pt.prototype,"_notice",2),h([b()],Pt.prototype,"_latestEventSnap",2),Pt=h([A("jarvis-view-intrusion")],Pt);function dd(r){let i=r??{},e=typeof i.entity_id=="string"?i.entity_id:"";if(!e)return null;let t=typeof i.confidence=="number"&&Number.isFinite(i.confidence)?Math.round(i.confidence):null;return{entity_id:e,label:typeof i.label=="string"&&i.label?i.label:"motion",confidence:t}}function ud(r){let i=r??{},e=typeof i.camera_entity=="string"?i.camera_entity:"";if(!e||i.is_confident!==!0)return null;let t=typeof i.confidence=="number"&&Number.isFinite(i.confidence)?Math.round(i.confidence):null;return{entity_id:e,label:typeof i.name=="string"&&i.name?i.name:"FACE",confidence:t}}function ve(r,i=""){return typeof r=="string"?r:r==null?i:String(r)}function gt(r){return r&&typeof r=="object"&&!Array.isArray(r)?r:{}}function Mo(r){let i={};for(let[e,t]of Object.entries(gt(r)))typeof t=="string"&&t&&(i[e]=t);return i}function pd(r){return Mo(r)}function Po(r){let i={};for(let[e,t]of Object.entries(gt(r))){let n=typeof t=="number"?t:Number(t);Number.isFinite(n)&&(i[e]=n)}return i}function bm(r){let i=r;if(typeof r=="string")try{i=JSON.parse(r)}catch{i=[]}return Array.isArray(i)?i.filter(e=>typeof e=="string"):[]}function Do(r,i){if(!Array.isArray(r))return[];let e=[];for(let t of r){let n=gt(t),s=ve(n.entity_id);if(!s)continue;let o=n.location_mode,l=ve(n.raw_name)||ve(n.name)||s;e.push({entity_id:s,name:ve(n.name)||l,raw_name:l,enabled:typeof n.enabled=="boolean"?n.enabled:!i.includes(s),outdoor:n.outdoor===!0,location_mode:o==="indoor"||o==="outdoor"?o:"auto"})}return e}function Fo(r){let i=gt(r?.config),e=bm(i.disabled_cameras);return{cameras:Do(i.cameras,e),overrides:Mo(i.camera_overrides),names:Mo(i.camera_names),disabled:e,values:i}}function ym(r){let i=gt(r),e=ve(i.ts),t=ve(i.entity_id);return!e&&!t?null:{ts:e,camera:ve(i.camera)||t,entity_id:t,image_source:ve(i.image_source)||"?",summary:ve(i.summary),analysis:ve(i.analysis),category:ve(i.category),notable:i.notable===!0}}function hd(r){let i=gt(r),e=gt(i.stats),t=typeof e.total=="number"&&Number.isFinite(e.total)?e.total:Number(e.total)||0,n=typeof e.notable=="number"&&Number.isFinite(e.notable)?e.notable:Number(e.notable)||0,s=(Array.isArray(i.recent)?i.recent:[]).map(ym).filter(o=>!!o);return{stats:{total:t,notable:n,by_category:Po(e.by_category),by_source:Po(e.by_source),first:typeof e.first=="string"&&e.first?e.first:null,last:typeof e.last=="string"&&e.last?e.last:null},recent:s.reverse()}}function _m(r){if(!r||typeof r!="object")return null;let i=gt(r),e=[];if(Array.isArray(i.tiers)){for(let n of i.tiers)if(Array.isArray(n))e.push({tier:ve(n[0],"?"),detail:ve(n[1])});else if(n&&typeof n=="object"){let s=gt(n);e.push({tier:ve(s.tier,"?"),detail:ve(s.detail)})}}let t=i.attrs&&typeof i.attrs=="object"?gt(i.attrs):null;return{entity_id:ve(i.entity_id),tiers:e,verdict:ve(i.verdict),override:ve(i.override),state:ve(i.state),available:typeof i.available=="boolean"?i.available:null,attrs:t?{brand:ve(t.brand),model:ve(t.model),supported_features:t.supported_features===null||t.supported_features===void 0?"":String(t.supported_features),frontend_stream_type:ve(t.frontend_stream_type)}:null,platform:ve(i.platform),elapsed_ms:typeof i.elapsed_ms=="number"&&Number.isFinite(i.elapsed_ms)?i.elapsed_ms:null}}function vd(r){let i=gt(r);return{summary:(Array.isArray(i.summary)?i.summary:[]).map(t=>{let n=gt(t);return{entity_id:ve(n.entity_id),state:ve(n.state),platform:ve(n.platform,"?")||"?"}}),platforms:Po(i.platforms),probe:_m(i.probe)}}function md(r,i,e){let t=i[r];return t&&t!==r&&e&&e[t]?t:r}function fd(r){let i=r.indexOf(".");return i>=0?r.slice(i+1):r}var Oo=10;function No(r){try{if(!r||!r.naturalWidth||!r.naturalHeight)return null;let i=document.createElement("canvas");i.width=32,i.height=32;let e=i.getContext("2d",{willReadFrequently:!0});if(!e)return null;e.drawImage(r,0,0,32,32);let t=e.getImageData(0,0,32,32).data,n=0;for(let s=0;s<t.length;s+=4)n+=.299*t[s]+.587*t[s+1]+.114*t[s+2];return n/(t.length/4)}catch{return null}}function Io(r,i=0){if(!r||i>6)return null;let e=!1;try{for(let t of r.querySelectorAll("video, img"))if(e=!0,t instanceof HTMLVideoElement&&(t.videoWidth>0||t.readyState>=2)||t instanceof HTMLImageElement&&t.naturalWidth>0)return!0;for(let t of r.querySelectorAll("*")){let n=t.shadowRoot;if(!n)continue;let s=Io(n,i+1);if(s===!0)return!0;s===!1&&(e=!0)}}catch{return null}return e?!1:null}function Ho(r,i=0){if(!r||i>6)return null;try{for(let e of r.querySelectorAll("video, img")){if(e instanceof HTMLVideoElement&&e.videoWidth>0)return{width:e.videoWidth,height:e.videoHeight};if(e instanceof HTMLImageElement&&e.naturalWidth>0)return{width:e.naturalWidth,height:e.naturalHeight}}for(let e of r.querySelectorAll("*")){let t=Ho(e.shadowRoot,i+1);if(t)return t}}catch{return null}return null}function Ti(r){return r===!0||r==="true"||r===1?a("On"):a("Off")}function cd(r){let i=typeof r=="number"?r:typeof r=="string"&&r.trim()!==""?Number(r):NaN;return Number.isFinite(i)?String(i):"—"}function gd(r){let i=n=>r[n]!==void 0&&r[n]!==null,e=(n,s)=>i(n)&&s[String(r[n])]?a(s[String(r[n])]):i(n)?String(r[n]):"—",t=()=>{if(!i("vision_min_interval"))return"—";let n=cd(r.vision_min_interval);return n==="—"?n:n==="0"?a("Off"):a("{n} s",{n})};return[{key:"recognition_source",label:a("Face recognition source"),value:e("recognition_source",{both:"Both (Double Take + Frigate)",frigate:"Frigate only (sub_label)",doubletake:"Double Take only"})},{key:"identity_min_confidence",label:a("Recognition confidence"),value:cd(r.identity_min_confidence)},{key:"camera_alert_level",label:a("Camera alerts"),value:e("camera_alert_level",{off:"Off — observe only",urgent:"Urgent only (default)",important:"Important — + deliveries",all:"Everything notable"})},{key:"camera_auto_analyze",label:a("Camera Watch (inspect doorbell presses)"),value:i("camera_auto_analyze")?Ti(r.camera_auto_analyze):"—"},{key:"camera_auto_analyze_motion",label:a("Also inspect Frigate detections"),value:i("camera_auto_analyze_motion")?Ti(r.camera_auto_analyze_motion):"—"},{key:"camera_motion_vision",label:a("Motion sensor → camera vision"),value:i("camera_motion_vision")?Ti(r.camera_motion_vision):"—"},{key:"package_detection",label:a("Package detection"),value:i("package_detection")?Ti(r.package_detection):"—"},{key:"llm_face_recognition",label:a("LLM face recognition"),value:i("llm_face_recognition")?Ti(r.llm_face_recognition):"—"},{key:"vision_min_interval",label:a("Minimum seconds between automatic analyses"),value:t()}]}function Cs(r){return r.outdoor?a("outdoor"):a("indoor")}function bd(r,i){if(!r)return"—";let e=new Date(r);if(Number.isNaN(e.getTime()))return r;try{return e.toLocaleString(i||void 0,{dateStyle:"medium",timeStyle:"short"})}catch{return e.toISOString().slice(0,16).replace("T"," ")}}function Bo(r,i){if(!r)return"—";let e=new Date(r);if(Number.isNaN(e.getTime()))return r;try{return e.toLocaleDateString(i||void 0,{dateStyle:"medium"})}catch{return e.toISOString().slice(0,10)}}function Lt(r){return r instanceof Y?r.code==="unauthorized"?a("Administrator privileges are required for this action"):r.message||r.code:r&&typeof r=="object"&&"message"in r?String(r.message):String(r??"")}function Mi(r){return r instanceof Y?r.code:r&&typeof r=="object"&&"code"in r?String(r.code):""}function Ze(r,i,e){r.dispatchEvent(new CustomEvent("jarvis-cam-toast",{detail:{message:i,link:e},bubbles:!0,composed:!0}))}function zo(r,i=0){let e=()=>r.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}));i>0?setTimeout(e,i):e()}function Pi(r){return!!r&&typeof r.callService=="function"}var Lo="jarvis_active_cam";function yd(){try{return localStorage.getItem(Lo)||""}catch{return""}}function _d(r){try{r?localStorage.setItem(Lo,r):localStorage.removeItem(Lo)}catch{}}function Ko(r){let i=typeof r=="number"?r:Number(String(r??"").trim());return!Number.isFinite(i)||i<1?40:Math.min(500,Math.max(1,Math.round(i)))}var wm=8e3,$m=6e3,xm=2e3,jm=5e3,km=30,wd=6e3,Sm=1500,Em=["ha-icon","ha-switch","ha-formfield","ha-alert","ha-camera-stream","ha-card"],$d=new Map,fe=class extends L{constructor(){super(...arguments);this.narrow=!1;this.cameras=[];this.overrides={};this.selected="";this.focusCamera=null;this._tier="none";this._src="";this._hasFrame=!1;this._snapNull=!1;this._snapError=null;this._diagOpen=!1;this._diagBusy=!1;this._diag=null;this._diagError=null;this._analyzing=!1;this._announce=!0;this._seq=0;this._chainKey="";this._snapInFlight=!1;this._onVis=()=>this._visibility()}connectedCallback(){super.connectedCallback(),P(this,Em);try{document.addEventListener("visibilitychange",this._onVis)}catch{}this._chainKey=""}disconnectedCallback(){super.disconnectedCallback();try{document.removeEventListener("visibilitychange",this._onVis)}catch{}this._seq++,this._clearTimers(),this._src=""}get shown(){return this.focusCamera?.entity_id||this.selected}_cam(e){return this.cameras.find(t=>t.entity_id===e)}_source(){return this.shown?md(this.shown,this.overrides,this.hass?.states):""}_stateObj(){let e=this._source();return e?this.hass?.states?.[e]:void 0}_available(){let e=this._stateObj();return!!e&&e.state!=="unavailable"}willUpdate(e){if(e.has("hass")||e.has("selected")||e.has("focusCamera")||e.has("cameras")||e.has("overrides")){let t=`${this.shown}|${this._source()}|${this._available()?1:0}|${this.hass?1:0}`;t!==this._chainKey&&(this._chainKey=t,this._restart())}}_clearTimers(){this._watchdog&&clearTimeout(this._watchdog),this._poll&&clearInterval(this._poll),this._tick&&clearTimeout(this._tick),this._watchdog=void 0,this._poll=void 0,this._tick=void 0}_restart(){this._clearTimers();let e=++this._seq;this._src="",this._hasFrame=!1,this._snapNull=!1,this._snapError=null,this._diag=null,this._diagError=null;let t=this.shown;if(!t||!this.hass){this._tier="none";return}if(!this._available()){this._tier="unavailable";return}if($d.get(t)==="jarvis"){this._startJarvis(e);return}if(x("ha-camera-stream")){this._tier="ha-stream",this._armFramePoll(e),this._watchdog=setTimeout(()=>this._decide(e),wm);return}this._startStream(e)}_stale(e){return e!==this._seq||!this.isConnected}async _startStream(e){this._tier="stream";let t=this._source(),n=await Tt(this.hass,`/api/camera_proxy_stream/${t}`);this._stale(e)||(this._src=n,this._armFramePoll(e),this._watchdog=setTimeout(()=>this._decide(e),$m))}_startStill(e){this._tier="still",this._src="",this._hasFrame=!1,this._stillTick(e,!0)}async _stillTick(e,t=!1){if(this._stale(e)||this._tier!=="still"||this._hidden())return;let s=`/api/camera_proxy/${this._source()}?_=${Date.now()}`,o=s;try{o=(await this.hass.callWS({type:"auth/sign_path",path:s,expires:km}))?.path||s}catch{o=s}this._stale(e)||this._tier!=="still"||(this._src=o,t&&(this._armFramePoll(e),this._watchdog=setTimeout(()=>this._decide(e),jm)),this._tick=setTimeout(()=>{this._stillTick(e)},xm))}_startJarvis(e){this._tier="jarvis",this._src="",this._hasFrame=!1,$d.set(this.shown,"jarvis"),this._snapTick(e)}async _snapTick(e){if(this._stale(e)||this._tier!=="jarvis"||this._hidden())return;if(this._snapInFlight){this._tick=setTimeout(()=>{this._snapTick(e)},wd);return}let t=this.shown;this._snapInFlight=!0;try{let n=await X(this.hass,"jarvis/camera_snapshot",{entity_id:t});if(this._stale(e))return;let s=typeof n?.image=="string"&&n.image?n.image:null;this._snapError=null,s?(this._src=`data:image/jpeg;base64,${s}`,this._hasFrame=!0,this._snapNull=!1):this._snapNull=!0}catch(n){if(this._stale(e))return;this._snapError=n}finally{this._snapInFlight=!1}this._stale(e)||this._tier!=="jarvis"||(this._tick=setTimeout(()=>{this._snapTick(e)},wd))}_armFramePoll(e){this._poll&&clearInterval(this._poll),this._poll=setInterval(()=>{if(this._stale(e)){this._poll&&clearInterval(this._poll),this._poll=void 0;return}!this._hasFrame&&this._decoded()===!0&&(this._hasFrame=!0)},Sm)}_decoded(){try{if(this._tier==="ha-stream")return Io(this._haStream?.shadowRoot??null);let e=this._img;return e?e.naturalWidth>0:!1}catch{return null}}_decide(e){if(this._stale(e))return;this._watchdog=void 0;let t=this._decoded();if(t===!1||t===null&&this._tier==="ha-stream"){this._escalate(e);return}if(t===!0&&this._tier!=="ha-stream"){let n=No(this._img);if(n!==null&&n<=Oo){this._escalate(e);return}}t===!0&&(this._hasFrame=!0)}_escalate(e){if(!this._stale(e))switch(this._clearTimers(),this._tier){case"ha-stream":this._startStill(e);break;case"stream":this._startStill(e);break;case"still":this._startJarvis(e);break;default:break}}_onImgLoad(){(this._tier==="stream"||this._tier==="still"||this._tier==="jarvis")&&this._decoded()===!0&&(this._hasFrame=!0)}_onImgError(){(this._tier==="stream"||this._tier==="still")&&this._escalate(this._seq)}_hidden(){try{return typeof document<"u"&&document.visibilityState==="hidden"}catch{return!1}}_visibility(){if(this._hidden()){this._tick&&clearTimeout(this._tick),this._tick=void 0;return}if(this._tick)return;let e=this._seq;this._tier==="still"?this._stillTick(e):this._tier==="jarvis"&&this._snapTick(e)}_pick(e){this.dispatchEvent(new CustomEvent("jarvis-cam-select",{detail:{entity_id:e},bubbles:!0,composed:!0}))}_onChipKey(e,t){let n=this.cameras.length;if(!n)return;let s=-1;if(e.key==="ArrowRight"||e.key==="ArrowDown"?s=(t+1)%n:e.key==="ArrowLeft"||e.key==="ArrowUp"?s=(t-1+n)%n:e.key==="Home"?s=0:e.key==="End"&&(s=n-1),s<0)return;e.preventDefault();let o=this.cameras[s];this._pick(o.entity_id),this.updateComplete.then(()=>{this.renderRoot.querySelectorAll(".chip")[s]?.focus()})}async _runDiag(){if(this._diagBusy)return;if(this._diagOpen){this._diagOpen=!1;return}let e=this.shown;if(!e){Ze(this,a("No camera selected"));return}this._diagOpen=!0,this._diagBusy=!0,this._diagError=null,this._diag=null;try{let t=await X(this.hass,"jarvis/camera_diagnostics",{entity_id:e});this._diag=vd(t)}catch(t){this._diagError=t}finally{this._diagBusy=!1}}async _analyze(){if(this._analyzing)return;let e=this.shown;if(!e){Ze(this,a("No camera selected"));return}let t=this._cam(e)?.name||e;if(!await U({heading:a("Analyze {name} now?",{name:t}),message:a("JARVIS runs one vision → reasoning pass on this camera. It uses LLM credits and takes a few seconds."),confirmLabel:a("Analyze now"),cancelLabel:a("Cancel")}))return;let s=this.hass;if(!Pi(s)){Ze(this,a("Home Assistant connection not available"));return}this._analyzing=!0;try{await s.callService("jarvis","analyze_camera",{entity_id:e,announce:this._announce}),Ze(this,a("Camera review ran — check Logs for the result"),"logs")}catch(o){Ze(this,`${a("Analysis failed —")} ${Lt(o)}`)}finally{this._analyzing=!1}}_onAnnounce(e){this._announce=!!e.target.checked}_nav(e,t){this.dispatchEvent(new CustomEvent("jarvis-navigate",{detail:{view:e,path:t},bubbles:!0,composed:!0}))}_icon(e){return x("ha-icon")?c`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:m}_badge(){let e=this._tier==="ha-stream"||this._tier==="stream"||this._tier==="still";return this._tier==="unavailable"?c`<jv-state-badge slot="actions" level="neutral" nodot .label=${a("Unavailable")}></jv-state-badge>`:this._tier==="none"?m:this.focusCamera?c`<jv-state-badge slot="actions" level="danger" pulse .label=${a("Event")}></jv-state-badge>`:this._tier==="jarvis"?this._snapNull||this._snapError?c`<jv-state-badge slot="actions" level="neutral" .label=${a("No signal")}></jv-state-badge>`:c`<jv-state-badge slot="actions" level="warn" .label=${a("Snapshot")}></jv-state-badge>`:e&&this._hasFrame?c`<jv-state-badge slot="actions" level="ok" pulse .label=${a("Live")}></jv-state-badge>`:c`<jv-state-badge slot="actions" level="neutral" nodot .label=${a("Connecting…")}></jv-state-badge>`}_placeholder(){switch(this._tier){case"none":return a("No camera selected");case"unavailable":return a("Unavailable in Home Assistant");case"jarvis":return this._src?"":this._snapError?Mi(this._snapError)==="unknown_command"?a("JARVIS snapshot unavailable — restart Home Assistant to load the updated integration, then refresh."):a("JARVIS snapshot error — {message}",{message:Lt(this._snapError).slice(0,120)}):this._snapNull?a("No frame — camera idle or unreachable. For Nest: verify the Google Nest integration is loaded and events are enabled."):a("Connecting…");default:return this._hasFrame?"":a("Connecting…")}}_tierLabel(){switch(this._tier){case"ha-stream":case"stream":return a("Stream");case"still":return a("Stills");case"jarvis":return a("JARVIS snapshot");default:return""}}_renderPicker(){let e=this.shown;return c`
      <div class="picker" role="radiogroup" aria-label=${a("Camera")}>
        ${this.cameras.map((t,n)=>c`
            <button
              type="button"
              class="chip jv-hit ${this.focusCamera?.entity_id===t.entity_id?"event":""}"
              role="radio"
              aria-checked=${t.entity_id===e?"true":"false"}
              tabindex=${t.entity_id===e||!e&&n===0?"0":"-1"}
              title=${t.entity_id}
              @click=${()=>this._pick(t.entity_id)}
              @keydown=${s=>this._onChipKey(s,n)}
            >
              ${t.name}
            </button>
          `)}
      </div>
    `}_renderTile(){let e=this.shown,n=this._cam(e)?.name||e,s=this._placeholder(),o=this._stateObj(),l=this.focusCamera;return c`
      <div class="tile">
        ${this._tier==="ha-stream"&&o?c`<ha-camera-stream .hass=${this.hass} .stateObj=${o} .muted=${!0} .controls=${!1} .allowExoPlayer=${!0}></ha-camera-stream>`:this._src?c`<img class="frame" src=${this._src} alt=${a("Live view of {name}",{name:n})} @load=${this._onImgLoad} @error=${this._onImgError} />`:m}
        ${e?c`<span class="pill id">${e}</span>`:m}
        ${l?c`<span class="pill event">${a("EVENT · {label}",{label:l.label})}${l.confidence!==null?` · ${l.confidence}%`:""}</span>`:m}
        ${s?c`<div class="placeholder" role="status">${s}</div>`:m}
      </div>
    `}_renderStrip(){let e=this.shown;if(!e)return m;let n=this._cam(e)?.name||e,s=this._source(),o=this.focusCamera;return c`
      <p class="strip" aria-live="polite">
        <span><span class="k">${a("Source")}</span> ${n}${s!==e?c` → <code>${fd(s)}</code>`:m}</span>
        ${this._tierLabel()?c`<span>${this._tierLabel()}</span>`:m}
        <span>
          ${o?c`<span class="k">${a("Target")}</span> ${o.label}${o.confidence!==null?` [${o.confidence}%]`:""}`:a("Streaming")}
        </span>
      </p>
    `}_renderAnnounce(){let e=a("Announce result");if(x("ha-switch")){let t=c`<ha-switch .checked=${this._announce} aria-label=${e} @change=${this._onAnnounce}></ha-switch>`;return x("ha-formfield")?c`<ha-formfield .label=${e}>${t}</ha-formfield>`:t}return c`
      <label class="switch">
        <input type="checkbox" role="switch" .checked=${this._announce} @change=${this._onAnnounce} />
        <span>${e}</span>
      </label>
    `}_renderActions(){let e=!this.shown;return c`
      <div class="actions">
        <button
          type="button"
          class="jv-btn"
          title=${a("Probe this camera's frame sources end-to-end")}
          aria-expanded=${this._diagOpen?"true":"false"}
          ?disabled=${this._diagBusy||e}
          @click=${()=>{this._runDiag()}}
        >
          ${this._icon("mdi:stethoscope")} ${a("DIAG")}
        </button>
        <button type="button" class="jv-btn primary" ?disabled=${this._analyzing||e} @click=${()=>{this._analyze()}}>
          ${this._icon("mdi:eye-check-outline")} ${this._analyzing?a("Analyzing…"):a("Analyze now")}
        </button>
        ${this._renderAnnounce()}
        <span class="spacer"></span>
        <button type="button" class="jv-btn text" @click=${()=>this._nav("settings","cameras")}>
          ${a("Open in Settings")} ${this._icon("mdi:chevron-right")}
        </button>
      </div>
    `}_renderDiag(){if(!this._diagOpen)return m;let e=this.shown,t=this._diagError,n=this._diag,s=m;if(this._diagBusy)s=c`<p>${a("Probing {entity}… may take up to 30 s (stream wake)",{entity:e})}</p>`;else if(t){let o=Mi(t)==="unknown_command"?a("Restart Home Assistant to load the updated integration, then refresh."):Lt(t);s=x("ha-alert")?c`<ha-alert alert-type="error" .title=${a("Diagnostics")}>${o}</ha-alert>`:c`<div class="alert" role="alert">${o}</div>`}else n&&(s=this._renderDiagLines(n));return c`
      <div class="diag" aria-live="polite">
        ${s}
        <p class="foot">
          ${a("Tap DIAG again to close · the verdict is also in the Logs view")}
          <button type="button" @click=${()=>this._nav("logs")}>${a("Logs")}</button>
        </p>
      </div>
    `}_probeHead(e){let t=[`state=${e.state||"?"}`,`platform=${e.platform||"?"}`];return e.attrs?.frontend_stream_type&&t.push(`stream=${e.attrs.frontend_stream_type}`),e.override&&t.push(`override=${e.override}`),`  ${t.join("  ")}`}_renderDiagLines(e){let t=this._tier==="ha-stream"?null:this._img,n=this._tier==="ha-stream"?Ho(this._haStream?.shadowRoot??null):null,s=n?.width??t?.naturalWidth??0,o=n?.height??t?.naturalHeight??0,l=No(t),d=[`mode=${this._tier}`,s&&o?a("decoded {width}×{height}",{width:s,height:o}):a("no decoded pixels"),l!==null?`lum ${l.toFixed(1)}${l<=Oo?` ${a("BLACK STREAM (decodes fine, shows nothing)")}`:""}`:""].filter(Boolean),u=Object.entries(e.platforms).map(([f,g])=>`${f}×${g}`).join("  "),p=Object.keys(e.platforms).some(f=>f.toLowerCase().includes("nest")),v=e.probe;return c`
      <p class="pre"><strong>${a("Tile")}</strong> ${d.join("  ")}</p>
      <p class="section pre"><strong>${a("HA cameras")}</strong> ${u||"—"}</p>
      ${p?m:c`<p class="bad">
            ${a("No nest-platform entities: the Google Nest integration isn't delivering cameras to HA. Fix that first (SDM credentials / integration setup); JARVIS can only consume what HA has.")}
          </p>`}
      ${v?c`<p class="section pre"><strong>${v.entity_id}</strong>${this._probeHead(v)}</p>
            ${v.tiers.map(f=>c`<p class="pre ${f.detail.startsWith("OK")?"ok":"bad"}">  ${f.tier}: ${f.detail}</p>`)}
            <p class="verdict">${v.verdict}${v.elapsed_ms!==null?` (${v.elapsed_ms} ms)`:""}</p>`:m}
    `}render(){let e=this.cameras.length===0;return c`
      <jv-section .heading=${a("Camera Watch")} icon="mdi:cctv">
        ${e?m:this._badge()}
        ${e?c`<slot name="empty"></slot>`:c`${this._renderPicker()} ${this._renderTile()} ${this._renderStrip()} ${this._renderActions()} ${this._renderDiag()}`}
      </jv-section>
    `}};fe.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      .picker {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        margin-bottom: var(--jv-space-3);
      }
      .chip {
        appearance: none;
        position: relative;
        min-height: 32px;
        max-width: 100%;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        cursor: pointer;
        transition: background-color var(--jv-ease);
        overflow-wrap: anywhere;
      }
      .chip:hover {
        background: var(--jv-hover);
      }
      .chip[aria-checked="true"] {
        background: var(--jv-accent);
        border-color: var(--jv-accent);
        color: var(--jv-on-accent);
      }
      .chip.event {
        box-shadow: 0 0 0 2px var(--jv-danger);
      }
      .chip.event:focus-visible {
        box-shadow:
          0 0 0 2px var(--jv-danger),
          var(--jv-focus-ring);
      }
      .tile {
        position: relative;
        width: 100%;
        max-width: 960px;
        margin: 0 auto;
        aspect-ratio: 16 / 9;
        background: var(--jv-surface-2);
        border-radius: var(--jv-radius-sm);
        overflow: hidden;
      }
      .tile img.frame,
      .tile ha-camera-stream {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .tile ha-camera-stream {
        --video-max-height: 100%;
      }
      .tile .placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--jv-space-4);
        text-align: center;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        pointer-events: none;
      }
      .pill {
        position: absolute;
        top: var(--jv-space-2);
        max-width: calc(100% - 2 * var(--jv-space-2));
        padding: 1px var(--jv-space-2);
        border: 1px solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        /* opaque: the backdrop is arbitrary camera pixels, not a surface */
        background: var(--jv-surface);
        color: var(--jv-text);
        font-size: var(--jv-font-size-xs);
        line-height: 18px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pill.id {
        left: var(--jv-space-2);
        font-family: var(--jv-font-code);
      }
      .pill.event {
        right: var(--jv-space-2);
        border-color: var(--jv-danger);
        box-shadow: inset 0 0 0 1px var(--jv-danger);
        font-weight: var(--jv-font-weight-medium);
      }
      .strip {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1) var(--jv-space-3);
        margin: var(--jv-space-2) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .strip .k {
        font-weight: var(--jv-font-weight-medium);
      }
      .strip code {
        font-family: var(--jv-font-code);
        font-size: inherit;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-top: var(--jv-space-3);
      }
      .actions .spacer {
        flex: 1 1 auto;
      }
      :host([narrow]) .actions .jv-btn {
        flex: 1 1 40%;
      }
      .switch {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        cursor: pointer;
      }
      .switch input {
        width: 20px;
        height: 20px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
      .diag {
        margin-top: var(--jv-space-3);
        padding: var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-s);
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .diag p {
        margin: 0;
      }
      .diag p.pre {
        white-space: pre-wrap;
      }
      .diag .ok {
        color: var(--jv-ok-text);
      }
      .diag .bad {
        color: var(--jv-danger-text);
      }
      .diag .verdict {
        font-weight: var(--jv-font-weight-bold);
        margin-top: var(--jv-space-1);
      }
      .diag .section {
        margin-top: var(--jv-space-2);
      }
      .diag .foot {
        margin-top: var(--jv-space-2);
        font-family: var(--jv-font);
        color: var(--jv-text-2);
      }
      .diag .foot button {
        appearance: none;
        border: 0;
        padding: 0;
        background: none;
        font: inherit;
        color: var(--jv-accent-text);
        text-decoration: underline;
        cursor: pointer;
      }
      .alert {
        margin: 0 0 var(--jv-space-2);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-left: 4px solid var(--jv-danger);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-danger-soft);
        font-family: var(--jv-font);
      }
      ha-alert {
        display: block;
        margin-bottom: var(--jv-space-2);
      }
    `],h([$({attribute:!1})],fe.prototype,"hass",2),h([$({type:Boolean,reflect:!0})],fe.prototype,"narrow",2),h([$({attribute:!1})],fe.prototype,"cameras",2),h([$({attribute:!1})],fe.prototype,"overrides",2),h([$({type:String})],fe.prototype,"selected",2),h([$({attribute:!1})],fe.prototype,"focusCamera",2),h([b()],fe.prototype,"_tier",2),h([b()],fe.prototype,"_src",2),h([b()],fe.prototype,"_hasFrame",2),h([b()],fe.prototype,"_snapNull",2),h([b()],fe.prototype,"_snapError",2),h([b()],fe.prototype,"_diagOpen",2),h([b()],fe.prototype,"_diagBusy",2),h([b()],fe.prototype,"_diag",2),h([b()],fe.prototype,"_diagError",2),h([b()],fe.prototype,"_analyzing",2),h([b()],fe.prototype,"_announce",2),h([me("img.frame")],fe.prototype,"_img",2),h([me("ha-camera-stream")],fe.prototype,"_haStream",2),fe=h([A("jarvis-cam-watch")],fe);var Dt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Kn=r=>(...i)=>({_$litDirective$:r,values:i}),en=class{constructor(i){}get _$AU(){return this._$AM._$AU}_$AT(i,e,t){this._$Ct=i,this._$AM=e,this._$Ci=t}_$AS(i,e){return this.update(i,e)}update(i,e){return this.render(...e)}};var{I:Rm}=Bc,xd=r=>r;var kd=r=>r.strings===void 0,jd=()=>document.createComment(""),Ur=(r,i,e)=>{let t=r._$AA.parentNode,n=i===void 0?r._$AB:i._$AA;if(e===void 0){let s=t.insertBefore(jd(),n),o=t.insertBefore(jd(),n);e=new Rm(s,o,r,r.options)}else{let s=e._$AB.nextSibling,o=e._$AM,l=o!==r;if(l){let d;e._$AQ?.(r),e._$AM=r,e._$AP!==void 0&&(d=r._$AU)!==o._$AU&&e._$AP(d)}if(s!==n||l){let d=e._$AA;for(;d!==s;){let u=xd(d).nextSibling;xd(t).insertBefore(d,n),d=u}}}return e},Un=(r,i,e=r)=>(r._$AI(i,e),r),Am={},qr=(r,i=Am)=>r._$AH=i,Sd=r=>r._$AH,Ts=r=>{r._$AR(),r._$AA.remove()};var I=Kn(class extends en{constructor(r){if(super(r),r.type!==Dt.PROPERTY&&r.type!==Dt.ATTRIBUTE&&r.type!==Dt.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!kd(r))throw Error("`live` bindings can only contain a single expression")}render(r){return r}update(r,[i]){if(i===Ke||i===m)return i;let e=r.element,t=r.name;if(r.type===Dt.PROPERTY){if(i===e[t])return Ke}else if(r.type===Dt.BOOLEAN_ATTRIBUTE){if(!!i===e.hasAttribute(t))return Ke}else if(r.type===Dt.ATTRIBUTE&&e.getAttribute(t)===i+"")return Ke;return qr(r),i}});var Cm=["ha-switch","ha-textfield","ha-icon"],Wr=["auto","indoor","outdoor"],bt=class extends L{constructor(){super(...arguments);this.narrow=!1;this.cameras=[];this.overrides={};this.names={};this.values={};this.rows={};this.bulkBusy=!1}connectedCallback(){super.connectedCallback(),P(this,Cm)}_emit(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}_commitName(e,t){let n=String(t.value??"").trim(),s=this.names[e.entity_id]??"";n!==s.trim()&&(this.rows[e.entity_id]?.saving||this._emit("jarvis-cam-rename",{entity_id:e.entity_id,name:n}))}_onNameKey(e,t){let n=e.currentTarget;e.key==="Enter"?(e.preventDefault(),this._commitName(t,n)):e.key==="Escape"&&(e.preventDefault(),n.value=this.names[t.entity_id]??"")}_setMode(e,t){t===e.location_mode||this.rows[e.entity_id]?.saving||this._emit("jarvis-cam-location",{entity_id:e.entity_id,mode:t})}_onSegKey(e,t,n){let s=-1;if(e.key==="ArrowRight"||e.key==="ArrowDown"?s=(n+1)%Wr.length:e.key==="ArrowLeft"||e.key==="ArrowUp"?s=(n-1+Wr.length)%Wr.length:e.key==="Home"?s=0:e.key==="End"&&(s=Wr.length-1),s<0)return;e.preventDefault();let o=e.currentTarget.parentElement;this._setMode(t,Wr[s]),o?.querySelectorAll("button")[s]?.focus()}_modeLabel(e,t){return t==="auto"?a("Auto ({resolved})",{resolved:Cs(e)}):t==="indoor"?a("Indoor"):a("Outdoor")}_renderSwitch(e,t){let n=a("Use {name}",{name:e.name}),s=o=>{let l=o.target;this._emit("jarvis-cam-toggle",{entity_id:e.entity_id,enabled:!!l.checked})};return x("ha-switch")?c`<ha-switch .checked=${I(e.enabled)} ?disabled=${t} aria-label=${n} title=${n} @change=${s}></ha-switch>`:c`
      <label class="sw" title=${n}>
        <input type="checkbox" role="switch" aria-label=${n} .checked=${I(e.enabled)} ?disabled=${t} @change=${s} />
      </label>
    `}_renderName(e,t){let n=this.names[e.entity_id]??"",s=e.raw_name||e.entity_id,o=a("JARVIS name for {entity}",{entity:e.entity_id}),l=v=>this._commitName(e,v.currentTarget),d=v=>this._onNameKey(v,e),u=x("ha-textfield")?c`<ha-textfield
          .value=${I(n)}
          .label=${a("Name")}
          .placeholder=${s}
          aria-label=${o}
          ?disabled=${!!t?.saving}
          @keydown=${d}
          @focusout=${l}
        ></ha-textfield>`:c`<input
          type="text"
          .value=${I(n)}
          placeholder=${s}
          aria-label=${o}
          ?disabled=${!!t?.saving}
          @keydown=${d}
          @blur=${l}
        />`,p=t?.saving?a("Saving…"):t?.saved?a("Saved"):"";return c`
      <div class="name-field">
        ${u}
        ${p?c`<span class="status ${t?.saved?"ok":""}" role="status">${p}</span>`:m}
      </div>
    `}_renderSeg(e,t){return c`
      <div class="seg" role="radiogroup" aria-label=${a("Location")}>
        ${Wr.map((n,s)=>{let o=e.location_mode===n;return c`
            <button
              type="button"
              role="radio"
              aria-checked=${o?"true":"false"}
              tabindex=${o?"0":"-1"}
              ?disabled=${!!t?.saving}
              @click=${()=>this._setMode(e,n)}
              @keydown=${l=>this._onSegKey(l,e,s)}
            >
              ${this._modeLabel(e,n)}
            </button>
          `})}
      </div>
    `}_renderRow(e){let t=this.rows[e.entity_id],n=this.overrides[e.entity_id];return c`
      <li class="cam ${e.enabled?"":"off"}">
        ${this._renderSwitch(e,this.bulkBusy||!!t?.saving)}
        <div class="ident">
          <div class="name">${e.name}</div>
          <div class="id">
            <span>${e.entity_id}</span>
            ${n&&n!==e.entity_id&&n.includes(".")?c`<span class="ovr" title=${a("Frames come from this entity (camera_overrides)")}>→ ${n}</span>`:m}
          </div>
        </div>
        <div class="fields">${this._renderName(e,t)} ${this._renderSeg(e,t)}</div>
        ${t?.error?c`<p class="err" role="alert">${t.error}</p>`:m}
      </li>
    `}_renderRelated(){let e=gd(this.values);return c`
      <h3>${a("Related settings")}</h3>
      <ul class="related">
        ${e.map(t=>c`
            <li>
              <button type="button" @click=${()=>this._emit("jarvis-navigate",{view:"settings",path:`cameras/${t.key}`})}>
                <jv-kv .label=${t.label} .value=${t.value}></jv-kv>
              </button>
            </li>
          `)}
      </ul>
    `}render(){let e=this.cameras.length,t=this.cameras.filter(n=>n.enabled).length;return e?c`
      <div class="head">
        <p class="count" aria-live="polite">${a("{n} of {total} cameras in use",{n:t,total:e})}</p>
        <div class="btns">
          <button type="button" class="jv-btn" ?disabled=${this.bulkBusy||t===e} @click=${()=>this._emit("jarvis-cam-all",{enabled:!0})}>
            ${a("Enable all")}
          </button>
          <button type="button" class="jv-btn" ?disabled=${this.bulkBusy||t===0} @click=${()=>this._emit("jarvis-cam-all",{enabled:!1})}>
            ${a("Disable all")}
          </button>
        </div>
      </div>
      <ul>
        ${this.cameras.map(n=>this._renderRow(n))}
      </ul>
      ${this._renderRelated()}
    `:c`
        <jv-empty
          icon="mdi:cctv-off"
          .heading=${a("No camera entities in Home Assistant.")}
          .message=${a("Add a camera integration (Nest, Frigate, UniFi, generic …) and it appears here.")}
        ></jv-empty>
        ${this._renderRelated()}
      `}};bt.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-bottom: var(--jv-space-3);
      }
      .head .count {
        flex: 1 1 auto;
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .head .btns {
        display: flex;
        gap: var(--jv-space-2);
        flex-wrap: wrap;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li.cam {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--jv-space-2) var(--jv-space-3);
        align-items: center;
        padding: var(--jv-space-3) 0;
        border-top: 1px solid var(--jv-divider);
      }
      li.cam:first-child {
        border-top: 0;
        padding-top: 0;
      }
      .ident {
        min-width: 0;
      }
      .ident .name {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .ident .id {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
        color: var(--jv-text-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        overflow-wrap: anywhere;
      }
      li.off .ident .name,
      li.off .ident .id {
        color: var(--jv-text-3);
      }
      .ovr {
        padding: 0 var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-info-soft);
        color: var(--jv-text);
      }
      .fields {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--jv-space-2) var(--jv-space-3);
        align-items: center;
      }
      :host([narrow]) .fields {
        grid-template-columns: minmax(0, 1fr);
      }
      .name-field {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .name-field ha-textfield,
      .name-field input {
        flex: 1 1 auto;
        min-width: 0;
        width: 100%;
      }
      .name-field input {
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
      }
      .name-field input::placeholder {
        color: var(--jv-text-3);
      }
      .status {
        flex: none;
        min-width: 4.5em;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      .status.ok {
        color: var(--jv-ok-text);
      }
      .seg {
        display: inline-flex;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        padding: 2px;
        gap: 2px;
        max-width: 100%;
      }
      :host([narrow]) .seg {
        display: flex;
      }
      .seg button {
        appearance: none;
        flex: 1 1 auto;
        min-height: 32px;
        padding: 0 var(--jv-space-3);
        border: 0;
        border-radius: var(--jv-radius-pill);
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        cursor: pointer;
        white-space: nowrap;
      }
      /* each segment is a live jarvis/camera_location write: full tap height on narrow */
      :host([narrow]) .seg button {
        min-height: var(--jv-tap);
      }
      .seg button:hover {
        background: var(--jv-hover);
      }
      .seg button[aria-checked="true"] {
        background: var(--jv-accent);
        color: var(--jv-on-accent);
      }
      .seg button:disabled {
        cursor: default;
        color: var(--jv-text-3);
      }
      .seg button[aria-checked="true"]:disabled {
        color: var(--jv-on-accent);
        opacity: 0.6;
      }
      .err {
        grid-column: 1 / -1;
        margin: 0;
        color: var(--jv-danger-text);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .sw {
        display: inline-flex;
        align-items: center;
        min-height: var(--jv-tap);
      }
      .sw input {
        width: 20px;
        height: 20px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
      h3 {
        margin: var(--jv-space-4) 0 var(--jv-space-1);
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
      }
      .related button {
        appearance: none;
        display: block;
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0;
        border: 0;
        border-top: 1px solid var(--jv-divider);
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .related li:first-child button {
        border-top: 0;
      }
      .related button:hover {
        background: var(--jv-hover);
      }
      .related jv-kv {
        pointer-events: none;
      }
    `],h([$({type:Boolean,reflect:!0})],bt.prototype,"narrow",2),h([$({attribute:!1})],bt.prototype,"cameras",2),h([$({attribute:!1})],bt.prototype,"overrides",2),h([$({attribute:!1})],bt.prototype,"names",2),h([$({attribute:!1})],bt.prototype,"values",2),h([$({attribute:!1})],bt.prototype,"rows",2),h([$({type:Boolean})],bt.prototype,"bulkBusy",2),bt=h([A("jarvis-cam-list")],bt);var Tm=["ha-textfield"],Mm=4e3;function Pm(r){return r==="live"?"ok":r==="event-media"?"info":"neutral"}var Ft=class extends L{constructor(){super(...arguments);this.narrow=!1;this.training=null;this._scanning=!1;this._diagRunning=!1;this._limit="40"}connectedCallback(){super.connectedCallback(),P(this,Tm)}disconnectedCallback(){super.disconnectedCallback(),this._timer&&clearTimeout(this._timer),this._timer=void 0}_lang(){return this.hass?.locale?.language||this.hass?.language}async _scan(){if(this._scanning)return;let e=this.hass;if(!Pi(e)){Ze(this,a("Home Assistant connection not available"));return}let t=Ko(this._limit);if(this._limit=String(t),!(!await U({heading:a("Scan the doorbell backlog?"),message:a("Analyse up to {limit} recorded doorbell events? Each one is a vision LLM call, so this uses LLM credits and can take minutes.",{limit:t}),confirmLabel:a("Scan backlog"),cancelLabel:a("Cancel")})||this._scanning)){this._scanning=!0,Ze(this,a("Scanning doorbell backlog (up to {limit})…",{limit:t}));try{await e.callService("jarvis","train_doorbell_backlog",{limit:t}),Ze(this,a("Backlog scan finished — see Logs for the report"),"logs")}catch(s){Mi(s)==="timeout"?Ze(this,a("Scan still running — the dataset updates when it finishes")):Ze(this,`${a("Backlog scan failed —")} ${Lt(s)}`)}finally{this._scanning=!1,zo(this),this._timer&&clearTimeout(this._timer),this._timer=setTimeout(()=>{this._timer=void 0,this.isConnected&&zo(this)},Mm)}}}async _diagnose(){if(this._diagRunning)return;let e=this.hass;if(!Pi(e)){Ze(this,a("Home Assistant connection not available"));return}this._diagRunning=!0;try{await e.callService("jarvis","diagnose_doorbell",{}),Ze(this,a("Doorbell diagnostics ran — see the Home Assistant log"))}catch(t){Ze(this,`${a("Doorbell diagnostics failed —")} ${Lt(t)}`)}finally{this._diagRunning=!1}}_onLimit(e){this._limit=String(e.target.value??"")}_onLimitBlur(){this._limit=String(Ko(this._limit))}_renderLimit(){let e=a("Max events");return x("ha-textfield")?c`<ha-textfield
        type="number"
        min="1"
        max="500"
        step="1"
        .value=${this._limit}
        .label=${e}
        ?disabled=${this._scanning}
        @input=${this._onLimit}
        @change=${this._onLimitBlur}
      ></ha-textfield>`:c`
      <label class="limit">
        <span>${e}</span>
        <input
          type="number"
          min="1"
          max="500"
          step="1"
          inputmode="numeric"
          .value=${this._limit}
          ?disabled=${this._scanning}
          @input=${this._onLimit}
          @change=${this._onLimitBlur}
        />
      </label>
    `}_renderStats(e){let t=e.stats,n=Object.entries(t.by_source).map(([o,l])=>`${o} ${l}`).join(" · "),s=this._lang();return c`
      <p class="stats" aria-live="polite">
        ${a("{total} analysed · {notable} notable",{total:t.total,notable:t.notable})} · ${n||a("none yet")}
        ${t.first&&t.last?c`<span class="muted">${Bo(t.first,s)} – ${Bo(t.last,s)}</span>`:m}
      </p>
    `}_renderList(e){if(!e.recent.length)return c`<jv-empty compact icon="mdi:doorbell-video" .message=${a("No analysed doorbell events yet. Run a backlog scan, or wait for the next doorbell press.")}></jv-empty>`;let t=this._lang();return c`
      <ul>
        ${e.recent.map(n=>{let s=n.summary||n.analysis;return c`
            <li>
              <div class="meta">
                <span class="ts">${bd(n.ts,t)}</span>
                <jv-state-badge nodot level=${Pm(n.image_source)} .label=${n.image_source}></jv-state-badge>
                ${n.category?c`<span class="cat">${n.category}</span>`:m}
                ${n.notable?c`<span class="notable">${a("Notable")}</span>`:m}
                ${n.camera?c`<span class="cam">${n.camera}</span>`:m}
              </div>
              ${s?c`<p class="text" title=${s}>${s}</p>`:m}
            </li>
          `})}
      </ul>
    `}render(){let e=this.training;return c`
      <div class="controls">
        <button type="button" class="jv-btn primary" ?disabled=${this._scanning} @click=${()=>{this._scan()}}>
          ${this._scanning?a("Scanning…"):a("Scan backlog")}
        </button>
        ${this._renderLimit()}
        <button type="button" class="jv-btn" ?disabled=${this._diagRunning} @click=${()=>{this._diagnose()}}>
          ${a("Run doorbell diagnostics")}
        </button>
      </div>
      ${e?c`${this._renderStats(e)} ${this._renderList(e)}`:m}
    `}};Ft.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
      }
      :host([narrow]) .controls .jv-btn {
        flex: 1 1 100%;
      }
      .limit {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-2);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .limit input {
        width: 6em;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-2);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
      }
      ha-textfield {
        width: 9em;
      }
      .stats {
        margin: var(--jv-space-3) 0 0;
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .stats .muted {
        display: block;
        color: var(--jv-text-2);
      }
      ul {
        list-style: none;
        margin: var(--jv-space-3) 0 0;
        padding: 0;
      }
      li {
        padding: var(--jv-space-2) 0;
        border-top: 1px solid var(--jv-divider);
        min-width: 0;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
      }
      .ts {
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .cat {
        padding: 0 var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-neutral-soft);
        font-size: var(--jv-font-size-xs);
        line-height: 20px;
      }
      .notable {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-1);
        font-size: var(--jv-font-size-xs);
        color: var(--jv-warn-text);
      }
      .notable::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--jv-warn);
      }
      .text {
        margin: var(--jv-space-1) 0 0;
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .cam {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
        overflow-wrap: anywhere;
      }
      jv-empty {
        margin-top: var(--jv-space-3);
      }
    `],h([$({attribute:!1})],Ft.prototype,"hass",2),h([$({type:Boolean,reflect:!0})],Ft.prototype,"narrow",2),h([$({attribute:!1})],Ft.prototype,"training",2),h([b()],Ft.prototype,"_scanning",2),h([b()],Ft.prototype,"_diagRunning",2),h([b()],Ft.prototype,"_limit",2),Ft=h([A("jarvis-cam-doorbell")],Ft);var Lm=25e3,Dm=2e3,Fm=5e3,Om=["jarvis_camera_event","jarvis_face_recognized"],yt=class extends de{constructor(){super(...arguments);this._selected="";this._focus=null;this._patch=null;this._rows={};this._bulkBusy=!1;this._toast="";this._toastLink=void 0;this._cfg=Fo(null);this._pending=0;this._unsubs=[];this._subscribedTo=null;this._savedTimers=new Map}connectedCallback(){super.connectedCallback(),this._subscribe()}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribe(),this._focusTimer&&clearTimeout(this._focusTimer),this._toastTimer&&clearTimeout(this._toastTimer),this._focusTimer=void 0,this._toastTimer=void 0,this._focus=null;for(let e of this._savedTimers.values())clearTimeout(e);this._savedTimers.clear()}willUpdate(e){e.has("data")&&this._pending===0&&(this._patch=null),(e.has("data")||e.has("_patch"))&&(this._cfg=this._effective()),this._ensureSelection()}updated(e){e.has("hass")&&this._subscribe()}_effective(){let e=Fo(this.data),t=this._patch;if(!t)return e;let n=t.disabled??e.disabled,s=t.cameras!==void 0?Do(t.cameras,n):e.cameras;return t.cameras===void 0&&!s.length&&(s=e.cameras),t.disabled&&(s=s.map(o=>({...o,enabled:!n.includes(o.entity_id)}))),{...e,cameras:s,disabled:n,names:t.names??e.names}}_applyPatch(e){this._patch={...this._patch??{},...e}}_enabled(){return this._cfg.cameras.filter(e=>e.enabled!==!1)}_ensureSelection(){let e=this._enabled();if(!e.length)this._selected&&(this._selected="");else if(!e.some(t=>t.entity_id===this._selected)){let t=yd();this._selected=e.some(n=>n.entity_id===t)?t:e[0].entity_id}this._focus&&!e.some(t=>t.entity_id===this._focus?.entity_id)&&this._clearFocus()}_subscribe(){if(!this.isConnected)return;let e=this.hass?.connection;if(!(!e?.subscribeEvents||this._subscribedTo===e)){this._unsubscribe(),this._subscribedTo=e;for(let t of Om){let n=e.subscribeEvents(s=>this._onBusEvent(t,s?.data),t).catch(()=>{});this._unsubs.push(n)}}}_unsubscribe(){for(let e of this._unsubs)e.then(t=>{try{t?.()}catch{}});this._unsubs=[],this._subscribedTo=null}_onBusEvent(e,t){if(!this.isConnected)return;let n=e==="jarvis_camera_event"?dd(t):ud(t);if(!n)return;let s=this._enabled().find(o=>o.entity_id===n.entity_id);s&&(this._focus=n,this._focusTimer&&clearTimeout(this._focusTimer),this._focusTimer=setTimeout(()=>{this._focusTimer=void 0,this._focus=null},Lm),this.narrow||this._showToast(a("Event · {camera} — camera focused",{camera:s.name})))}_clearFocus(){this._focusTimer&&clearTimeout(this._focusTimer),this._focusTimer=void 0,this._focus=null}_onSelect(e){let t=e.detail?.entity_id;t&&(e.stopPropagation(),this._clearFocus(),this._selected=t,_d(t))}_onToast(e){let t=e.detail;t?.message&&(e.stopPropagation(),this._showToast(t.message,t.link))}_showToast(e,t){if(x("home-assistant")){let n=t?{text:a("Logs"),action:()=>this.navigate(t)}:void 0;this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:e,action:n},bubbles:!0,composed:!0}));return}this._toast=e,this._toastLink=t,this._toastTimer&&clearTimeout(this._toastTimer),this._toastTimer=setTimeout(()=>{this._toastTimer=void 0,this._toast=""},Fm)}_setRow(e,t){let n={...this._rows};t?n[e]=t:delete n[e],this._rows=n}_flashSaved(e){this._setRow(e,{saved:!0});let t=this._savedTimers.get(e);t&&clearTimeout(t),this._savedTimers.set(e,setTimeout(()=>{this._savedTimers.delete(e),this._rows[e]?.saved&&this._setRow(e,null)},Dm))}async _write(e){this._pending++;try{return await e()}finally{this._pending--}}async _saveDisabled(e,t,n){this._applyPatch({disabled:e});try{return await this._write(()=>this.ws("jarvis/update_config",{key:"disabled_cameras",value:e})),this._showToast(n),this.refresh(),""}catch(s){let o=Lt(s)||a("Couldn't save —");return this._applyPatch({disabled:t}),this._showToast(`${a("Couldn't save —")} ${o}`),o}}async _onToggle(e){let{entity_id:t,enabled:n}=e.detail;if(e.stopPropagation(),this._rows[t]?.saving||this._bulkBusy)return;let s=this._cfg.disabled,o=n?s.filter(d=>d!==t):s.includes(t)?s:[...s,t];this._setRow(t,{saving:!0});let l=await this._saveDisabled(o,s,n?a("Camera enabled"):a("Camera disabled"));this._setRow(t,l?{error:l}:null)}async _onAll(e){let{enabled:t}=e.detail;if(e.stopPropagation(),this._bulkBusy||!t&&!await U({heading:a("Disable all cameras?"),message:a("JARVIS will stop watching every camera — doorbell analysis, package detection and intrusion confirmation go blind until you enable one again."),confirmLabel:a("Disable all"),cancelLabel:a("Cancel")}))return;let n=this._cfg.disabled,s=t?[]:this._cfg.cameras.map(o=>o.entity_id);this._bulkBusy=!0;try{await this._saveDisabled(s,n,t?a("All cameras enabled"):a("All cameras disabled"))}finally{this._bulkBusy=!1}}async _onRename(e){let{entity_id:t,name:n}=e.detail;if(e.stopPropagation(),this._rows[t]?.saving)return;let s=n.trim();this._setRow(t,{saving:!0});try{let o=await this._write(()=>this.ws("jarvis/rename_camera",{entity_id:t,name:s})),l={};if(Array.isArray(o?.cameras)&&(l.cameras=o.cameras),o?.camera_names&&typeof o.camera_names=="object")l.names=pd(o.camera_names);else{let d={...this._cfg.names};s?d[t]=s:delete d[t],l.names=d}this._applyPatch(l),this._flashSaved(t),this._showToast(s?a('Renamed to "{name}"',{name:s}):a("Name reverted")),this.refresh()}catch(o){let l=Lt(o);this._setRow(t,{error:l}),this.requestUpdate(),this._showToast(`${a("Rename failed —")} ${l}`)}}async _mirrorLocationLists(e,t){try{let s=(await this.ws("jarvis/config_schema"))?.values??{},o=p=>{let v=p;if(typeof v=="string"&&v.trim())try{v=JSON.parse(v)}catch{return[]}return Array.isArray(v)?v.map(f=>String(f).trim()).filter(Boolean):[]},l=e.toLowerCase().trim(),d=(p,v)=>{let f=p.filter(g=>g.toLowerCase()!==l);return v?[...f,l]:f},u=(p,v)=>p.length===v.length&&p.every((f,g)=>f===v[g]);for(let[p,v]of[["indoor_entities",t==="indoor"],["outdoor_entities",t==="outdoor"]]){let f=o(s[p]),g=d(f,v);u(f,g)||await this.ws("jarvis/update_config",{key:p,value:g})}}catch{}}async _onLocation(e){let{entity_id:t,mode:n}=e.detail;if(e.stopPropagation(),!this._rows[t]?.saving){this._setRow(t,{saving:!0});try{let s=await this._write(()=>this.ws("jarvis/camera_location",{entity_id:t,mode:n}));if(await this._write(()=>this._mirrorLocationLists(t,n)),Array.isArray(s?.cameras))this._applyPatch({cameras:s.cameras});else{let u=this._cfg.cameras.map(p=>p.entity_id===t?{...p,location_mode:n}:p);this._applyPatch({cameras:u})}this._setRow(t,null);let o=this._effective().cameras.find(u=>u.entity_id===t),l=o?.name||t,d=n==="auto"?a("auto ({resolved})",{resolved:o?Cs(o):a("indoor")}):n==="indoor"?a("indoor"):a("outdoor");this._showToast(a("{name} → {mode}",{name:l,mode:d})),this.refresh()}catch(s){let o=Lt(s);this._setRow(t,{error:o}),this._showToast(`${a("Couldn't save —")} ${o}`)}}}_renderLoading(){return c`
      <div class="layout">
        <jv-section class="watch" loading .heading=${a("Camera Watch")} icon="mdi:cctv">
          <jv-empty kind="loading" compact .heading=${a("Loading…")}></jv-empty>
        </jv-section>
        <jv-section loading .heading=${a("Cameras")} icon="mdi:camera-outline"></jv-section>
        <jv-section loading .heading=${a("Doorbell Training")} icon="mdi:doorbell-video"></jv-section>
      </div>
    `}_renderWatchEmpty(e){return e===0?c`<jv-empty
          slot="empty"
          icon="mdi:cctv-off"
          .heading=${a("No camera entities in Home Assistant.")}
          .message=${a("Add a camera integration (Nest, Frigate, UniFi, generic …) and it appears here.")}
        ></jv-empty>`:c`<jv-empty
          slot="empty"
          icon="mdi:cctv-off"
          .heading=${a("All cameras are disabled")}
          .message=${a("Enable at least one camera below to watch it here.")}
        ></jv-empty>`}render(){if(!this.data)return this._renderLoading();let e=this._cfg,t=this._enabled(),n=hd(this.data.doorbell_training);return c`
      <div
        class="layout"
        @jarvis-cam-toast=${this._onToast}
        @jarvis-cam-select=${this._onSelect}
        @jarvis-cam-toggle=${s=>{this._onToggle(s)}}
        @jarvis-cam-all=${s=>{this._onAll(s)}}
        @jarvis-cam-rename=${s=>{this._onRename(s)}}
        @jarvis-cam-location=${s=>{this._onLocation(s)}}
      >
        <jarvis-cam-watch
          class="watch"
          .hass=${this.hass}
          .narrow=${this.narrow}
          .cameras=${t}
          .overrides=${e.overrides}
          .selected=${this._selected}
          .focusCamera=${this._focus}
        >
          ${t.length?m:this._renderWatchEmpty(e.cameras.length)}
        </jarvis-cam-watch>
        <jv-section
          .heading=${a("Cameras")}
          icon="mdi:camera-outline"
          .subheading=${a("Names are JARVIS-only (HA untouched; blank reverts). Location governs intrusion + outdoor-event filtering — AUTO shows what the heuristics resolve.")}
        >
          <jarvis-cam-list
            .narrow=${this.narrow}
            .cameras=${e.cameras}
            .overrides=${e.overrides}
            .names=${e.names}
            .values=${e.values}
            .rows=${this._rows}
            .bulkBusy=${this._bulkBusy}
          ></jarvis-cam-list>
        </jv-section>
        <jv-section
          .heading=${a("Doorbell Training")}
          icon="mdi:doorbell-video"
          .subheading=${a("Analysed doorbell events — JARVIS's visitor training data. Each press is logged automatically; run a backlog scan to mine the Nest recorded-event history into the dataset.")}
        >
          <jarvis-cam-doorbell .hass=${this.hass} .narrow=${this.narrow} .training=${n}></jarvis-cam-doorbell>
        </jv-section>
      </div>
      <div class="toast" role="status" aria-live="polite" aria-atomic="true">${this._toast?c`<div>
            ${this._toast}
            ${this._toastLink?c`<button class="jv-btn text toast-link" type="button" @click=${()=>this.navigate(this._toastLink??"logs")}>${a("Logs")}</button>`:m}
          </div>`:m}</div>
    `}};yt.styles=[T,S`
      :host {
        display: block;
        container-type: inline-size;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      .watch {
        grid-column: 1 / -1;
        width: 100%;
        max-width: 960px;
        justify-self: center;
      }
      @container (min-width: 1100px) {
        .layout {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      .toast {
        position: sticky;
        bottom: var(--jv-space-3);
        margin-top: var(--jv-space-4);
        display: flex;
        justify-content: center;
        pointer-events: none;
      }
      .toast > div {
        pointer-events: auto;
        max-width: min(100%, 560px);
        padding: var(--jv-space-3) var(--jv-space-4);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        border: var(--jv-border-width) solid var(--jv-border);
        border-left: 4px solid var(--jv-info);
        box-shadow: var(--jv-shadow);
        overflow-wrap: anywhere;
      }
      .toast-link {
        margin-inline-start: var(--jv-space-2);
      }
      :host([narrow]) .toast {
        bottom: calc(var(--jv-tap) + var(--jv-space-3) + var(--jv-space-4) + env(safe-area-inset-bottom, 0px));
      }
    `],h([b()],yt.prototype,"_selected",2),h([b()],yt.prototype,"_focus",2),h([b()],yt.prototype,"_patch",2),h([b()],yt.prototype,"_rows",2),h([b()],yt.prototype,"_bulkBusy",2),h([b()],yt.prototype,"_toast",2),h([b()],yt.prototype,"_toastLink",2),yt=h([A("jarvis-view-cameras")],yt);var Li=1e8,qo=60;function tn(r){return String(r??"").trim().toLowerCase().split(/\s+/).join("_").replace(/[^a-z0-9_-]/g,"").slice(0,80)}function Wo(r){let i=Number(r);return r==null||!Number.isFinite(i)||i<0||i>=Li?"":i<60?a("{n}s ago",{n:Math.round(i)}):i<3600?a("{n}m ago",{n:Math.round(i/60)}):a("{n}h ago",{n:Math.round(i/3600)})}function Ed(r,i,e=Date.now()){let t=Number(r)*1e3;if(!Number.isFinite(t)||t<=0)return"";let n=Math.round((t-e)/1e3),s=Math.abs(n),o=[["year",31536e3],["month",2592e3],["day",86400],["hour",3600],["minute",60]];try{let l=new Intl.RelativeTimeFormat(i,{numeric:"auto"});for(let[d,u]of o)if(s>=u)return l.format(Math.round(n/u),d);return l.format(n,"second")}catch{return new Date(t).toLocaleString()}}function Rd(r){let i=r?.locale?.language||r?.language;return typeof i=="string"&&i?i:void 0}function Ms(r,i){let e=i.camera_entity||"",t=e?r?.states?.[e]?.attributes?.friendly_name:void 0;if(typeof t=="string"&&t.trim())return t;let n=i.camera||e.replace(/^camera\./,"");return String(n||"").replace(/_/g," ")}function Ad(r,i){return i?Ms(r,{camera_entity:i,camera:i.replace(/^camera\./,"")}):""}function Cd(r){let i=r?.states??{};return Object.keys(i).filter(e=>e.startsWith("camera.")).sort().map(e=>{let t=i[e]?.attributes?.friendly_name;return{entity:e,label:typeof t=="string"&&t.trim()?t:e}})}function Td(r){return Object.keys(r?.states??{}).filter(i=>i.startsWith("stt.")).sort()}function Fe(r,i=""){return typeof r=="string"?r:r==null?i:String(r)}function mr(r,i=0){let e=Number(r);return Number.isFinite(e)?e:i}function Nm(r){if(!r||typeof r!="object")return null;let i=r,e=Fe(i.name).trim(),t=Fe(i.relationship);return{name:e||a("Unknown"),camera_entity:Fe(i.camera_entity),camera:Fe(i.camera),confidence:mr(i.confidence),age_seconds:mr(i.age_seconds,Li*10),is_unknown:!!i.is_unknown,is_resident:!!i.is_resident,relationship:t==="resident"||t==="guest"?t:"unknown",snapshot_url:typeof i.snapshot_url=="string"&&i.snapshot_url?i.snapshot_url:null,is_low_confidence:!!i.is_low_confidence,source:Fe(i.source)}}function Md(r,i){let e=Array.isArray(r?.recent)?r.recent.map(Nm).filter(t=>!!t):[];return e.sort((t,n)=>t.age_seconds-n.age_seconds),{recent:e,residents:Array.isArray(r?.residents)?r.residents.map(t=>Fe(t)).filter(Boolean):[],references:Array.isArray(r?.references)?r.references.map(t=>Fe(t)).filter(Boolean):[],llmFaceRecognition:typeof r?.llm_face_recognition=="boolean"?r.llm_face_recognition:!!i?.llmFaceRecognition,recognitionSource:Fe(r?.recognition_source,i?.recognitionSource??"")}}function Pd(r){if(!r||typeof r!="object")return null;let i=r,e=Fe(i.name).trim();return e?{name:e,score:mr(i.score),similarity:mr(i.similarity),count:mr(i.count),trusted:!!i.trusted}:null}function Ld(r){return{profiles:Array.isArray(r?.profiles)?r.profiles.map(e=>{let t=e??{};return{name:Fe(t.name).trim(),count:Math.max(0,Math.round(mr(t.count))),updated:mr(t.updated)}}).filter(e=>!!e.name):[],current:Pd(r?.current),localEnabled:!!r?.local_enabled,delegateStt:Fe(r?.delegate_stt),modelPath:Fe(r?.model_path),backendAvailable:!!r?.backend_available}}function Dd(r){return!r||typeof r!="object"||!("match"in r)?null:Pd(r.match)}function Fd(r){let i=Array.isArray(r?.entities)?r.entities.map(e=>{let t=e??{};return{kind:Fe(t.kind),entity:Fe(t.entity),value:Fe(t.value),unit:Fe(t.unit),name:Fe(t.name)}}).filter(e=>!!e.entity):[];return{enabled:!!r?.enabled,found:Number.isFinite(Number(r?.found))?Number(r?.found):i.length,entities:i}}function Od(r){let i=new Map;for(let e of r){let t=e.kind||"other",n=i.get(t);n?n.push(e):i.set(t,[e])}return[...i.entries()]}function Nd(r,i){let e=i.trim().toLowerCase(),t=null;for(let n of r)n.name.trim().toLowerCase()===e&&(!t||n.age_seconds<t.age_seconds)&&(t=n);return t}function Se(r){if(r&&typeof r=="object"&&"message"in r){let i=r.message;if(typeof i=="string"&&i)return i}return String(r??a("Unknown error"))}function Ps(r){if(r&&typeof r=="object"&&"code"in r){let i=r.code;if(typeof i=="string"&&i)return i}return null}function te(r,i){r.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:i},bubbles:!0,composed:!0}))}var Uo="jarvis_faces_snap_cam";function Id(){try{return localStorage.getItem(Uo)||""}catch{return""}}function Hd(r){try{r?localStorage.setItem(Uo,r):localStorage.removeItem(Uo)}catch{}}var Im=["ha-icon","ha-textfield"],Qe=class extends L{constructor(){super(...arguments);this.residents=[];this.cameras=[];this.busy=!1;this._src=null;this._stage="avatar";this._label="";this._snapCam="";this._resolveKey="";this._seq=0}connectedCallback(){super.connectedCallback(),P(this,Im),this._snapCam||(this._snapCam=Id())}willUpdate(e){if(e.has("model")||e.has("hass")||e.has("cache")){let t=this.model,n=t&&this.cache?this.cache.referenceGeneration(t.name):0,s=t?`${t.name}|${t.snapshotUrl??""}|${t.hasReference?1:0}|${n}|${t.cameraEntity}`:"";s&&s!==this._resolveKey&&this.hass&&this.cache&&(this._resolveKey=s,this._resolve("pinned"))}}currentSrc(){return this._src}async _resolve(e){let t=++this._seq,n=this.model,s=this.cache,o=this.hass;if(!n||!s||!o)return;let l=["pinned","reference","camera","avatar"];for(let d of l.slice(l.indexOf(e))){let u=null;if(d==="pinned"){if(n.snapshotUrl&&!s.hasFailed(n.snapshotUrl)){let p=await s.signed(o,n.snapshotUrl);p&&(!Ri(p)||/[?&]authSig=/.test(p))&&(u=p)}}else d==="reference"?n.hasReference&&(u=await s.reference(o,n.name)):d==="camera"&&n.cameraEntity&&(u=await s.camera(o,n.cameraEntity));if(t!==this._seq)return;if(d==="avatar"||u){this._stage=d,this._src=u;return}}}_onImgError(){this._src&&this.cache?.markFailed(this._src);let e=this._stage==="pinned"?"reference":this._stage==="reference"?"camera":"avatar";this._src=null,this._resolve(e)}_emit(e){this.dispatchEvent(new CustomEvent("face-action",{detail:e,bubbles:!0,composed:!0}))}_onFile(e){let t=e.target,n=t.files?.[0];t.value="",n&&this._emit({action:"set_photo",name:this.model.name,file:n})}_submitLabel(){let e=this._label.trim();!e||this.busy||this._emit({action:"label",name:e,src:this._src,cameraEntity:this.model.cameraEntity})}clearLabel(){this._label=""}_enlarge(){let e=this.model,t=Wo(e.ageSeconds),n=[e.name,e.cameraLabel,t].filter(Boolean).join(" · ");this._emit({action:"enlarge",name:e.name,src:this._src,cameraEntity:e.cameraEntity,caption:n})}_icon(e){return x("ha-icon")?c`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:m}_badge(){let e=this.model,t="neutral",n=a("Unknown");return e.lowConf?(t="warn",n=a("LLM guess")):e.relation==="resident"?(t="accent",n=a("Resident")):e.relation==="guest"&&(t="info",n=a("Guest")),c`<jv-state-badge nodot .level=${t} .label=${n}></jv-state-badge>`}_meta(){let e=this.model,t=[];e.cameraLabel&&t.push(e.cameraLabel),e.relation!=="unknown"&&!e.lowConf&&e.confidence>0&&t.push(`${Math.round(e.confidence*10)/10}%`);let n=Wo(e.ageSeconds);return n&&t.push(n),!t.length&&e.relation==="resident"?a("Not seen recently"):t.join(" · ")}_renderControls(){let e=this.model,t=[];return e.actions.includes("make_resident")&&t.push(c`<button class="jv-btn jv-hit" type="button" @click=${()=>this._emit({action:"make_resident",name:e.name})}>
        ${this._icon("mdi:account-plus-outline")}${a("Make resident")}
      </button>`),e.relation==="resident"&&(t.push(c`<label class="file jv-hit">
        <input type="file" accept="image/*" @change=${this._onFile} aria-label=${e.hasReference?a("Change photo"):a("Set photo")} />
        <span class="jv-btn" aria-hidden="true">${this._icon("mdi:camera-outline")}${e.hasReference?a("Change photo"):a("Set photo")}</span>
      </label>`),e.canCaptureFromSighting&&t.push(c`<button
          class="jv-btn text jv-hit"
          type="button"
          @click=${()=>this._emit({action:"from_sighting",name:e.name,src:this._src,cameraEntity:e.cameraEntity})}
        >
          ${a("From sighting")}
        </button>`),e.hasReference&&t.push(c`<button class="jv-btn text danger-text jv-hit" type="button" @click=${()=>this._emit({action:"remove_photo",name:e.name})}>
          ${a("Remove photo")}
        </button>`)),e.actions.includes("remove_resident")&&t.push(c`<button class="jv-btn text danger-text jv-hit" type="button" @click=${()=>this._emit({action:"remove_resident",name:e.name})}>
        ${a("Remove")}
      </button>`),t.length?c`<div class="controls">${t}</div>`:m}_renderSnapshotRow(){let e=this.model;if(e.relation!=="resident"||!this.cameras.length)return m;let t=this.cameras.some(n=>n.entity===this._snapCam)?this._snapCam:"";return c`
      <div class="row">
        <select
          aria-label=${a("Camera to snapshot {name} from",{name:e.name})}
          .value=${t}
          ?disabled=${this.busy}
          @change=${n=>this._snapCam=n.target.value}
        >
          <option value="" ?selected=${!t}>${a("— camera —")}</option>
          ${this.cameras.map(n=>c`<option value=${n.entity} ?selected=${n.entity===t}>${n.label}</option>`)}
        </select>
        <button class="jv-btn" type="button" ?disabled=${this.busy} @click=${()=>this._emit({action:"snapshot_now",name:e.name,cameraEntity:t})}>
          ${this._icon("mdi:camera-plus-outline")}${a("Snapshot now")}
        </button>
      </div>
    `}_renderLabelRow(){if(!this.model.labelable)return m;let e=a("Name this face…"),t=n=>{n.key==="Enter"&&!n.isComposing&&(n.preventDefault(),this._submitLabel())};return c`
      <div class="row">
        <input
          type="text"
          autocomplete="off"
          list="face-names"
          placeholder=${e}
          aria-label=${e}
          .value=${this._label}
          ?disabled=${this.busy}
          @input=${n=>this._label=n.target.value}
          @keydown=${t}
        />
        <datalist id="face-names">${this.residents.map(n=>c`<option value=${n}></option>`)}</datalist>
        <button class="jv-btn primary" type="button" ?disabled=${this.busy||!this._label.trim()} @click=${this._submitLabel}>${a("Label")}</button>
      </div>
    `}render(){let e=this.model;if(!e)return m;let t=(e.name.trim()[0]??"?").toUpperCase();return c`
      <div class="frame">
        <button class="thumb" type="button" aria-label=${a("Enlarge {name}",{name:e.name})} @click=${this._enlarge}>
          ${this._src?c`<img src=${this._src} alt="" loading="lazy" @error=${this._onImgError} />`:c`<span class="initial" aria-hidden="true">${t}</span>`}
        </button>
        <span class="badge">${this._badge()}</span>
      </div>
      <p class="name jv-truncate" title=${e.name}>${e.name}</p>
      <p class="meta">${this._meta()}</p>
      ${this._renderLabelRow()} ${this._renderControls()} ${this._renderSnapshotRow()}
    `}};Qe.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      .thumb {
        appearance: none;
        position: relative;
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        padding: 0;
        border: 0;
        border-radius: var(--jv-radius);
        background: var(--jv-surface-2);
        color: var(--jv-text-2);
        cursor: zoom-in;
        overflow: hidden;
      }
      .thumb:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      .thumb img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .thumb .initial {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-size: var(--jv-font-size-2xl);
        font-weight: var(--jv-font-weight-medium);
        text-transform: uppercase;
      }
      .frame {
        position: relative;
      }
      /* Outside the button (its aria-label would hide the relation from
         screen readers) and on an opaque backing, since the soft badge tint
         would otherwise sit straight on photo pixels. */
      .frame .badge {
        position: absolute;
        left: var(--jv-space-2);
        bottom: var(--jv-space-2);
        display: inline-flex;
        max-width: calc(100% - 2 * var(--jv-space-2));
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        pointer-events: none;
      }
      .name {
        margin: var(--jv-space-2) 0 0;
        font-weight: var(--jv-font-weight-medium);
      }
      .meta {
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1) var(--jv-space-2);
        margin-top: var(--jv-space-2);
      }
      .controls .jv-btn {
        min-height: 32px;
        padding: 0 var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
      }
      .controls .jv-btn.text {
        padding: 0 var(--jv-space-1);
      }
      .controls .jv-btn.text.danger-text {
        color: var(--jv-danger-text);
      }
      label.file {
        display: inline-flex;
        cursor: pointer;
      }
      label.file input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        overflow: hidden;
        pointer-events: none;
      }
      label.file:has(input:focus-visible) .jv-btn {
        box-shadow: var(--jv-focus-ring);
      }
      :host([busy]) .controls,
      :host([busy]) .row {
        opacity: 0.6;
        pointer-events: none;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        align-items: center;
        margin-top: var(--jv-space-2);
        min-width: 0;
      }
      .row > input,
      .row > select {
        flex: 1 1 8em;
        min-width: 0;
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-2);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
      }
      .row > input::placeholder {
        color: var(--jv-text-3);
      }
      .row > ha-textfield {
        flex: 1 1 auto;
        min-width: 0;
      }
      .row > .jv-btn {
        flex: 0 0 auto;
      }
    `],h([$({attribute:!1})],Qe.prototype,"hass",2),h([$({attribute:!1})],Qe.prototype,"model",2),h([$({attribute:!1})],Qe.prototype,"cache",2),h([$({attribute:!1})],Qe.prototype,"residents",2),h([$({attribute:!1})],Qe.prototype,"cameras",2),h([$({type:Boolean,reflect:!0})],Qe.prototype,"busy",2),h([b()],Qe.prototype,"_src",2),h([b()],Qe.prototype,"_stage",2),h([b()],Qe.prototype,"_label",2),h([b()],Qe.prototype,"_snapCam",2),Qe=h([A("jarvis-face-card")],Qe);var An=class extends L{constructor(){super(...arguments);this._open=!1;this._src="";this._caption=""}connectedCallback(){super.connectedCallback(),P(this,["ha-dialog","ha-icon"])}disconnectedCallback(){super.disconnectedCallback(),this._open=!1}updated(){if(this._open&&!x("ha-dialog")){let e=this._native;if(e&&!e.open)try{e.showModal()}catch{e.setAttribute("open","")}}}open(e,t){this._src=e,this._caption=t,this._open=!0}close(){this._open=!1;let e=this._native;e?.open&&e.close()}render(){if(!this._open||!this._src)return m;let e=this._caption||a("Snapshot"),t=c`<img src=${this._src} alt=${e} @error=${()=>this.close()} />`;return x("ha-dialog")?c`
        <ha-dialog open hideActions .heading=${e} @closed=${()=>this.close()} escapeKeyAction="close" scrimClickAction="close">
          ${t}
        </ha-dialog>
      `:c`
      <dialog
        aria-labelledby="lb-h"
        @cancel=${n=>{n.preventDefault(),this.close()}}
        @click=${n=>{n.target===this._native&&this.close()}}
      >
        <div class="head">
          <h2 id="lb-h">${e}</h2>
          <button class="jv-icon-btn" type="button" aria-label=${a("Close")} @click=${()=>this.close()}>
            ${x("ha-icon")?c`<ha-icon icon="mdi:close" aria-hidden="true"></ha-icon>`:c`<span aria-hidden="true">×</span>`}
          </button>
        </div>
        ${t}
      </dialog>
    `}};An.styles=[T,S`
      :host {
        display: contents;
      }
      dialog {
        border: 0;
        padding: 0;
        width: auto;
        max-width: min(96vw, 1100px);
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius);
        box-shadow: var(--jv-shadow);
      }
      dialog::backdrop {
        background: var(--jv-scrim);
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-3);
        padding: var(--jv-space-3) var(--jv-space-3) var(--jv-space-3) var(--jv-space-4);
      }
      .head h2 {
        margin: 0;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
        min-width: 0;
        overflow-wrap: anywhere;
      }
      img {
        display: block;
        max-width: 96vw;
        max-height: 80vh;
        width: auto;
        height: auto;
        object-fit: contain;
        margin: 0 auto;
      }
      ha-dialog img {
        max-height: 70vh;
      }
      @media (max-width: 599px) {
        dialog {
          max-width: 100vw;
          width: 100vw;
          margin: auto 0 0;
          border-radius: var(--jv-radius) var(--jv-radius) 0 0;
        }
      }
    `],h([b()],An.prototype,"_open",2),h([b()],An.prototype,"_src",2),h([b()],An.prototype,"_caption",2),h([me("dialog")],An.prototype,"_native",2),An=h([A("jarvis-people-lightbox")],An);var Bd=S`
  /* Cards are rendered in NARROW order (Recently seen first); desktop re-orders. */
  :host(:not([narrow])) .card-household {
    order: 1;
  }
  :host(:not([narrow])) .card-recent {
    order: 2;
  }
  :host(:not([narrow])) .card-voices {
    order: 3;
  }
  :host(:not([narrow])) .card-wellbeing {
    order: 4;
  }
  :host(:not([narrow])) .card-options {
    order: 5;
  }
  /* A phone-width window HA did not flag as narrow keeps the narrow order too. */
  @media (max-width: 600px) {
    :host(:not([narrow])) .jv-grid > * {
      order: 0;
    }
  }

  .intro {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .intro p {
    margin: 0 0 var(--jv-space-2);
  }
  .intro p:last-child {
    margin-bottom: 0;
  }
  .intro code,
  .code {
    font-family: var(--jv-font-code);
    font-size: var(--jv-font-size-xs);
  }
  details.intro summary {
    cursor: pointer;
    color: var(--jv-accent-text);
    font-weight: var(--jv-font-weight-medium);
    min-height: var(--jv-tap);
    display: flex;
    align-items: center;
    list-style: none;
  }
  details.intro summary::-webkit-details-marker {
    display: none;
  }
  details.intro[open] summary {
    margin-bottom: var(--jv-space-2);
  }

  /* ── forms ─────────────────────────────────────────────────────────── */
  .form-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    align-items: center;
    margin: 0 0 var(--jv-space-3);
  }
  .form-row > .grow {
    flex: 1 1 200px;
    min-width: 0;
  }
  .form-row ha-textfield {
    width: 100%;
  }
  .form-row input,
  .form-row select,
  .field input,
  .mic-row input {
    width: 100%;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  .form-row input::placeholder,
  .field input::placeholder,
  .mic-row input::placeholder {
    color: var(--jv-text-3);
  }
  .form-row input:disabled,
  .field input:disabled,
  .mic-row input:disabled {
    opacity: 0.6;
  }
  :host([narrow]) .form-row > .grow,
  :host([narrow]) .form-row > .jv-btn {
    flex: 1 1 100%;
    width: 100%;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-1);
    margin: 0 0 var(--jv-space-3);
  }
  .field > label,
  .help {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .field ha-textfield {
    width: 100%;
  }
  .help {
    margin: var(--jv-space-1) 0 var(--jv-space-3);
  }

  /* ── switch rows ───────────────────────────────────────────────────── */
  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--jv-space-3);
    min-height: var(--jv-tap);
  }
  .switch-row .label {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    flex-wrap: wrap;
    font-weight: var(--jv-font-weight-medium);
  }
  label.switch {
    display: inline-flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-height: var(--jv-tap);
    cursor: pointer;
  }
  label.switch input {
    width: 20px;
    height: 20px;
    accent-color: var(--jv-accent);
  }

  /* ── galleries ─────────────────────────────────────────────────────── */
  ul.gallery {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--jv-space-3);
  }
  ul.gallery > li {
    min-width: 0;
  }
  .skeleton-square {
    aspect-ratio: 1 / 1;
    border-radius: var(--jv-radius);
  }
  .footer {
    margin: var(--jv-space-3) 0 0;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }

  /* ── lists ─────────────────────────────────────────────────────────── */
  ul.plain {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  ul.plain > li {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-height: var(--jv-tap);
    padding: var(--jv-space-1) 0;
    border-top: 1px solid var(--jv-divider);
  }
  ul.plain > li:first-child {
    border-top: 0;
  }
  ul.plain .text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  ul.plain .sub {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .kind-group {
    margin: 0 0 var(--jv-space-3);
  }
  .kind-group h3 {
    margin: 0 0 var(--jv-space-1);
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-medium);
    color: var(--jv-text-2);
    text-transform: capitalize;
  }

  /* ── status ────────────────────────────────────────────────────────── */
  .status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    margin: var(--jv-space-3) 0;
  }
  .status .hint {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .speaking {
    margin: 0 0 var(--jv-space-3);
  }
  .speaking .guess {
    color: var(--jv-text-2);
  }
  .result {
    margin: 0 0 var(--jv-space-3);
    padding: var(--jv-space-2) var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-info-soft);
  }
  .mic-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin: var(--jv-space-3) 0;
  }
  .mic-row > .grow {
    flex: 1 1 160px;
    min-width: 0;
  }
  .mic-row ha-textfield {
    width: 100%;
  }
  :host([narrow]) .mic-row > .grow,
  :host([narrow]) .mic-row > .jv-btn {
    flex: 1 1 100%;
    width: 100%;
  }
  .link {
    appearance: none;
    display: inline-flex;
    align-items: center;
    min-height: var(--jv-tap);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--jv-accent-text);
    font: inherit;
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-medium);
    cursor: pointer;
    text-decoration: underline;
  }
  a.link {
    text-decoration: underline;
  }
  .loading {
    display: grid;
    gap: var(--jv-space-2);
  }
  .loading .jv-skeleton {
    height: var(--jv-tap);
  }
  .alert {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    padding: var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-danger-soft);
    border-left: 4px solid var(--jv-danger);
  }
  .alert.info {
    background: var(--jv-info-soft);
    border-left-color: var(--jv-info);
  }
  .alert .body {
    flex: 1 1 200px;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .alert .body span {
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  ha-alert {
    display: block;
    margin: 0 0 var(--jv-space-3);
  }
  .sr-live {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
`;function Ls(){return{status:"idle",data:null,error:null,code:null}}var Hm=1024,Bm=.85,Cn=class extends Error{constructor(){super(a("That file is not an image")),this.name="NotAnImageError"}};function zm(r){return new Promise((i,e)=>{let t=new Image;t.onload=()=>i(t),t.onerror=()=>e(new Cn),t.src=r})}function Km(r){return new Promise((i,e)=>{let t=new FileReader;t.onload=()=>i(String(t.result??"")),t.onerror=()=>e(t.error??new Error("read failed")),t.readAsDataURL(r)})}async function Di(r){if(r instanceof Blob&&r.type&&!r.type.startsWith("image/"))throw new Cn;let i=0,e=0,t,n=null;try{if(r instanceof Blob&&typeof createImageBitmap=="function")try{let v=await createImageBitmap(r);t=v,i=v.width,e=v.height}catch{throw new Cn}else{let v;r instanceof Blob?(v=URL.createObjectURL(r),n=v):v=r;let f=await zm(v);t=f,i=f.naturalWidth||f.width,e=f.naturalHeight||f.height}if(!i||!e)throw new Cn;let s=Math.min(1,Hm/Math.max(i,e)),o=Math.max(1,Math.round(i*s)),l=Math.max(1,Math.round(e*s)),d=document.createElement("canvas");d.width=o,d.height=l;let u=d.getContext("2d");if(!u)throw new Error("canvas unavailable");u.drawImage(t,0,0,o,l);let p=d.toDataURL("image/jpeg",Bm);if(!p.startsWith("data:image/"))throw new Cn;return"close"in t&&typeof t.close=="function"&&t.close(),p}finally{n&&URL.revokeObjectURL(n)}}async function zd(r){try{let i=await fetch(r,{cache:"no-store"});if(!i.ok)return null;let e=await i.blob();return e.size?await Km(e):null}catch{return null}}var Ds=class{constructor(){this._refs=new Map;this._cams=new Map;this._failedUrls=new Set;this._refGen=new Map}referenceGeneration(i){return this._refGen.get(tn(i))??0}reference(i,e){let t=tn(e);if(!t||!i)return Promise.resolve(null);let n=this._refs.get(t);return n||(n=X(i,"jarvis/face_reference",{name:e}).then(s=>typeof s?.image=="string"&&s.image?s.image:null).catch(()=>null),this._refs.set(t,n)),n}camera(i,e,t=!1){if(!e||!i)return Promise.resolve(null);let n=t?void 0:this._cams.get(e);return n||(n=X(i,"jarvis/camera_snapshot",{entity_id:e}).then(s=>typeof s?.image=="string"&&s.image?`data:image/jpeg;base64,${s.image}`:null).catch(()=>null),this._cams.set(e,n)),n}async cameraStrict(i,e){let t=await X(i,"jarvis/camera_snapshot",{entity_id:e}),n=typeof t?.image=="string"&&t.image?`data:image/jpeg;base64,${t.image}`:null;return this._cams.set(e,Promise.resolve(n)),n}dropReference(i){let e=tn(i);this._refs.delete(e),this._refGen.set(e,(this._refGen.get(e)??0)+1)}dropCamera(i){this._cams.delete(i)}markFailed(i){i&&this._failedUrls.add(i)}hasFailed(i){return this._failedUrls.has(i)}signed(i,e){return Tt(i,e)}};var Go=16e3;function Um(){let r=window;return r.AudioContext||r.webkitAudioContext||null}async function Kd(r=4,i){if(typeof window<"u"&&window.isSecureContext===!1)throw new Error(a("Microphone needs a secure (HTTPS) connection"));let e=Um();if(!navigator.mediaDevices?.getUserMedia||!e)throw new Error(a("recording not supported in this browser"));let t=await navigator.mediaDevices.getUserMedia({audio:!0}),n=new e,s=[],o=null,l=null,d=null;try{n.state==="suspended"&&await n.resume().catch(()=>{}),l=n.createMediaStreamSource(t),o=n.createScriptProcessor(4096,1,1),o.onaudioprocess=g=>{s.push(new Float32Array(g.inputBuffer.getChannelData(0)))},l.connect(o),o.connect(n.destination);let p=Math.max(1,Math.round(r));i?.(p),await new Promise(g=>{d=setInterval(()=>{p-=1,p<=0?(d&&clearInterval(d),d=null,g()):i?.(p)},1e3)}),i?.(0);let v=n.sampleRate||Go,f=Wm(qm(s),v,Go);if(!f.length)throw new Error(a("No audio captured"));return"data:audio/wav;base64,"+Vm(Gm(f,Go))}finally{d&&clearInterval(d);try{o?.disconnect(),l?.disconnect()}catch{}for(let u of t.getTracks())try{u.stop()}catch{}await n.close().catch(()=>{})}}function qm(r){let i=0;for(let n of r)i+=n.length;let e=new Float32Array(i),t=0;for(let n of r)e.set(n,t),t+=n.length;return e}function Wm(r,i,e){if(!r.length||i===e)return r;let t=i/e,n=Math.floor(r.length/t),s=new Float32Array(n);for(let o=0;o<n;o++)s[o]=r[Math.min(r.length-1,Math.round(o*t))]??0;return s}function Gm(r,i){let t=r.length*2,n=new ArrayBuffer(44+t),s=new DataView(n),o=(d,u)=>{for(let p=0;p<u.length;p++)s.setUint8(d+p,u.charCodeAt(p))};o(0,"RIFF"),s.setUint32(4,36+t,!0),o(8,"WAVE"),o(12,"fmt "),s.setUint32(16,16,!0),s.setUint16(20,1,!0),s.setUint16(22,1,!0),s.setUint32(24,i,!0),s.setUint32(28,i*2,!0),s.setUint16(32,2,!0),s.setUint16(34,16,!0),o(36,"data"),s.setUint32(40,t,!0);let l=44;for(let d=0;d<r.length;d++,l+=2){let u=Math.max(-1,Math.min(1,r[d]??0));s.setInt16(l,u<0?u*32768:u*32767,!0)}return new Uint8Array(n)}function Vm(r){let i="";for(let t=0;t<r.length;t+=32768)i+=String.fromCharCode(...r.subarray(t,t+32768));return btoa(i)}var Ym=["ha-card","ha-icon","ha-icon-button","ha-textfield","ha-alert","ha-switch","ha-dialog"],Xm=15e3,Vo=4,Zm="https://github.com/sam3gp8/jarvis-aio/blob/main/docs/voice-recognition.md",ue=class extends de{constructor(){super(...arguments);this._faces=Ls();this._voices=Ls();this._bio=Ls();this._addName="";this._facesBusy=!1;this._cardBusy=new Set;this._llmOverride=null;this._llmPending=!1;this._localOverride=null;this._localPending=!1;this._showRestartInfo=!1;this._delegateDraft=null;this._modelDraft=null;this._savingKey=null;this._voiceName="";this._recording=null;this._voiceBusy=!1;this._identifyResult=null;this._forgetting=new Set;this._liveMessage="";this._bioPending=!1;this._bioOverride=null;this._cache=new Ds;this._started=!1;this._lastVoicesFetch=0}connectedCallback(){super.connectedCallback(),P(this,Ym)}updated(e){if(super.updated(e),!this._started&&this.hass){this._started=!0,this._loadAll();return}e.has("data")&&this._started&&this._voices.status==="loaded"&&!this._voiceBusy&&!this._recording&&Date.now()-this._lastVoicesFetch>=Xm&&this._loadVoices(!0)}_loadAll(){return Promise.all([this._loadFaces(),this._loadVoices(),this._loadBio()]).then(()=>{})}async _loadFaces(){if(this._faces.code!=="unauthorized"){this._faces={...this._faces,status:"loading",error:null};try{let e=await this.ws("jarvis/faces",{action:"list",limit:qo});this._applyFaces(e)}catch(e){this._faces={status:"error",data:this._faces.data,error:Se(e),code:Ps(e)}}}}_applyFaces(e){this._faces={status:"loaded",data:Md(e,this._faces.data),error:null,code:null},this._llmOverride=null}async _loadVoices(e=!1){if(this._voices.code!=="unauthorized"){e||(this._voices={...this._voices,status:"loading",error:null}),this._lastVoicesFetch=Date.now();try{let t=await this.ws("jarvis/voices",{action:"list"});this._applyVoices(t)}catch(t){(!e||!this._voices.data)&&(this._voices={status:"error",data:this._voices.data,error:Se(t),code:Ps(t)})}}}_applyVoices(e){this._voices={status:"loaded",data:Ld(e),error:null,code:null},this._localOverride=null,this._lastVoicesFetch=Date.now()}async _loadBio(){if(this._bio.code!=="unauthorized"){this._bio={...this._bio,status:"loading",error:null};try{let e=await this.ws("jarvis/biometrics",{action:"status"});this._applyBio(e)}catch(e){this._bio={status:"error",data:this._bio.data,error:Se(e),code:Ps(e)}}}}_applyBio(e){this._bio={status:"loaded",data:Fd(e),error:null,code:null},this._bioOverride=null}_refreshAll(){this._loadAll()}get _facesData(){return this._faces.data}_cameras(){return Cd(this.hass)}_residentModel(e,t){let n=Nd(t.recent,e),s=t.references.includes(tn(e));return{name:e,relation:"resident",lowConf:!!n?.is_low_confidence,cameraEntity:n?.camera_entity??"",cameraLabel:n?Ms(this.hass,n):"",confidence:n?.confidence??0,ageSeconds:n&&n.age_seconds<Li?n.age_seconds:null,snapshotUrl:n?.snapshot_url??null,hasReference:s,canCaptureFromSighting:!!n&&(!!n.snapshot_url||!!n.camera_entity),labelable:!1,actions:["remove_resident"]}}_recentModel(e){let t=e.relationship==="guest"?"guest":"unknown";return{name:e.name,relation:t,lowConf:e.is_low_confidence,cameraEntity:e.camera_entity,cameraLabel:Ms(this.hass,e),confidence:e.confidence,ageSeconds:e.age_seconds<Li?e.age_seconds:null,snapshotUrl:e.snapshot_url,hasReference:!1,canCaptureFromSighting:!1,labelable:!0,actions:t==="guest"?["make_resident"]:[]}}_cardKey(e,t=""){return`${tn(e)||e}|${t}`}_setCardBusy(e,t){let n=new Set(this._cardBusy);t?n.add(e):n.delete(e),this._cardBusy=n}async _facesMutation(e){this._facesBusy=!0;try{let t=await this.ws("jarvis/faces",{...e,limit:qo});return this._applyFaces(t),t}finally{this._facesBusy=!1}}async _addResident(e,t){let n=e.trim();if(!(!n||this._facesBusy))try{await this._facesMutation({action:"add_resident",name:n}),t&&(this._addName=""),te(this,a("Added {name} as a resident",{name:n})),this.refresh()}catch(s){te(this,Se(s))}}async _removeResident(e){if(!(this._facesBusy||!await U({heading:a("Remove {name} from the household?",{name:e}),message:a("They will count as a guest again and their reference photo is deleted. Intrusion monitoring will no longer stand down for them."),confirmLabel:a("Remove"),destructive:!0}))){this._setCardBusy(this._cardKey(e),!0);try{await this._facesMutation({action:"remove_resident",name:e}),this._cache.dropReference(e),te(this,a("Removed {name}",{name:e})),this.refresh()}catch(n){te(this,Se(n))}finally{this._setCardBusy(this._cardKey(e),!1)}}}async _removePhoto(e){if(!(this._facesBusy||!await U({heading:a("Remove the reference photo for {name}?",{name:e}),confirmLabel:a("Remove"),destructive:!0}))){this._setCardBusy(this._cardKey(e),!0);try{await this._facesMutation({action:"remove_reference",name:e}),this._cache.dropReference(e),te(this,a("Reference photo removed"))}catch(n){te(this,Se(n))}finally{this._setCardBusy(this._cardKey(e),!1)}}}async _confirmReplace(e){return this._facesData?.references.includes(tn(e))??!1?U({heading:a("Replace the reference photo for {name}?",{name:e}),message:a("The current photo is overwritten."),confirmLabel:a("Replace")}):!0}async _storeReference(e,t,n){try{return await this._facesMutation({action:"set_reference",name:e,image:t}),this._cache.dropReference(e),te(this,n),!0}catch(s){return te(this,Se(s)),!1}}async _setPhotoFromFile(e,t){if(!this._facesBusy){if(!t.type.startsWith("image/")){te(this,a("That file is not an image"));return}if(await this._confirmReplace(e)){this._setCardBusy(this._cardKey(e),!0);try{let n=await Di(t);await this._storeReference(e,n,a("Reference photo set for {name}",{name:e}))}catch(n){te(this,n instanceof Cn?n.message:Se(n))}finally{this._setCardBusy(this._cardKey(e),!1)}}}}async _captureSighting(e,t){if(e&&e.startsWith("data:"))return e;if(e){let n=await zd(e);if(n)return n}return t?this._cache.camera(this.hass,t,!0):null}async _fromSighting(e,t,n){if(!this._facesBusy&&await this._confirmReplace(e)){this._setCardBusy(this._cardKey(e),!0);try{let s=await this._captureSighting(t,n);if(!s){te(this,a("No snapshot available to assign"));return}let o=await Di(s);await this._storeReference(e,o,a("Reference photo set for {name} from this sighting",{name:e}))}catch(s){te(this,Se(s))}finally{this._setCardBusy(this._cardKey(e),!1)}}}async _snapshotNow(e,t){if(!(this._facesBusy||this._cardBusy.has(this._cardKey(e)))){if(!t){te(this,a("Pick a camera first"));return}if(await this._confirmReplace(e)){this._setCardBusy(this._cardKey(e),!0);try{let n=await this._cache.cameraStrict(this.hass,t);if(!n){te(this,a("No frame from that camera"));return}let s=await Di(n),o=Ad(this.hass,t);await this._storeReference(e,s,a("Reference photo set for {name} from {camera}",{name:e,camera:o}))&&Hd(t)}catch(n){te(this,Se(n))}finally{this._setCardBusy(this._cardKey(e),!1)}}}}async _labelFace(e,t,n,s){let o=e?.model?this._cardKey(e.model.name,e.model.cameraEntity):this._cardKey(t,s);if(this._facesBusy||this._cardBusy.has(o))return;let l=this._facesData;if(await this._confirmReplace(t)){this._setCardBusy(o,!0);try{let d=await this._captureSighting(n,s);if(!d){te(this,a("No snapshot available to assign"));return}let u=await Di(d),p=!!l&&l.residents.some(f=>f.trim().toLowerCase()===t.trim().toLowerCase()),v=a("Reference photo set for {name} from this sighting",{name:t});p||(v+=a(" — add them to the household to stand intrusion down.")),await this._storeReference(t,u,v)&&e?.clearLabel()}catch(d){te(this,Se(d))}finally{this._setCardBusy(o,!1)}}}async _enlarge(e,t,n,s){let o=t;if(!o&&n&&(o=await this._cache.camera(this.hass,n)),!o){te(this,a("No snapshot to enlarge"));return}this._lightbox?.open(o,s||e)}_onFaceAction(e){e.stopPropagation();let t=e.detail,n=e.target instanceof HTMLElement&&e.target.tagName.toLowerCase()==="jarvis-face-card"?e.target:null;switch(t.action){case"make_resident":this._addResident(t.name,!1);break;case"remove_resident":this._removeResident(t.name);break;case"remove_photo":this._removePhoto(t.name);break;case"set_photo":this._setPhotoFromFile(t.name,t.file);break;case"from_sighting":this._fromSighting(t.name,t.src,t.cameraEntity);break;case"snapshot_now":this._snapshotNow(t.name,t.cameraEntity);break;case"label":this._labelFace(n,t.name,t.src,t.cameraEntity);break;case"enlarge":this._enlarge(t.name,t.src,t.cameraEntity,t.caption);break}}async _writeConfig(e,t){await this.ws("jarvis/update_config",{key:e,value:t})}async _toggleLlm(e){if(!this._llmPending){this._llmPending=!0,this._llmOverride=e;try{await this._writeConfig("llm_face_recognition",e),te(this,a("Saved")),await this._loadFaces(),this.refresh()}catch(t){this._llmOverride=null,te(this,Se(t))}finally{this._llmPending=!1}}}async _toggleLocal(e){if(!this._localPending){this._localPending=!0,this._localOverride=e;try{await this._writeConfig("voice_recognition_local",e),this._showRestartInfo=!0,await this._loadVoices(!0),this.refresh()}catch(t){this._localOverride=null,te(this,Se(t))}finally{this._localPending=!1}}}async _saveVoiceField(e,t){let n=this._voices.data,s=e==="voice_recognition_delegate_stt"?n?.delegateStt??"":n?.modelPath??"",o=t.trim();if(o===s||this._savingKey){e==="voice_recognition_delegate_stt"?this._delegateDraft=null:this._modelDraft=null;return}this._savingKey=e;try{await this._writeConfig(e,o),te(this,a("Saved")),await this._loadVoices(!0),this.refresh()}catch(l){te(this,Se(l))}finally{this._savingKey=null,e==="voice_recognition_delegate_stt"?this._delegateDraft=null:this._modelDraft=null}}async _record(e){this._recording={mode:e,left:Vo},this._liveMessage=a("Recording… {s}s",{s:Vo});try{let t=await Kd(Vo,n=>{this._recording&&(this._recording={mode:e,left:n})});return t||(te(this,a("No audio captured")),null)}catch(t){let n=Se(t);return te(this,n===a("No audio captured")?n:a("Microphone unavailable — {message}",{message:n})),null}finally{this._recording=null,this._liveMessage=""}}async _enrollVoice(){let e=this._voiceName.trim();if(!e){te(this,a("Name the voice first"));return}if(!(this._recording||this._voiceBusy)){this._voiceBusy=!0;try{let t=await this._record("enroll");if(!t)return;let n=await this.ws("jarvis/voices",{action:"enroll",name:e,audio:t});this._applyVoices(n),this._voiceName="";let s=this._voices.data?.profiles.find(o=>tn(o.name)===tn(e));te(this,a("Enrolled {name} ({count} samples)",{name:e,count:s?.count??1}))}catch(t){te(this,Se(t))}finally{this._voiceBusy=!1}}}async _identifyVoice(){if(!(this._recording||this._voiceBusy)){this._voiceBusy=!0;try{let e=await this._record("identify");if(!e)return;let t=await this.ws("jarvis/voices",{action:"identify",audio:e}),n=Dd(t),s=n?a("Heard: {name} ({score}%)",{name:n.name,score:Math.round(n.score*10)/10})+(n.trusted?"":a(", guess")):a("No confident match");this._identifyResult=s,te(this,s)}catch(e){te(this,Se(e))}finally{this._voiceBusy=!1}}}async _forgetVoice(e){if(!(this._forgetting.has(e)||!await U({heading:a("Forget the voiceprint for {name}?",{name:e}),message:a("JARVIS will no longer recognize this voice until it is enrolled again."),confirmLabel:a("Forget"),destructive:!0}))){this._forgetting=new Set([...this._forgetting,e]);try{let n=await this.ws("jarvis/voices",{action:"forget",name:e});this._applyVoices(n),te(this,a("Forgot the voiceprint for {name}",{name:e}))}catch(n){te(this,Se(n))}finally{let n=new Set(this._forgetting);n.delete(e),this._forgetting=n}}}async _toggleBio(e){if(!this._bioPending){this._bioPending=!0,this._bioOverride=e;try{await this.ws("jarvis/update_config",{key:"biometrics_enabled",value:e});let t=await this.ws("jarvis/biometrics",{action:"status"});this._applyBio(t),te(this,e?a("Wellbeing context on"):a("Wellbeing context off")),this.refresh()}catch(t){this._bioOverride=null,te(this,Se(t))}finally{this._bioPending=!1}}}_icon(e){return x("ha-icon")?c`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:m}_iconButton(e,t,n,s=!1,o){return x("ha-icon-button")?c`<ha-icon-button slot=${o??m} .label=${t} title=${t} .disabled=${s} @click=${n}>
          ${this._icon(e)}
        </ha-icon-button>`:c`<button slot=${o??m} class="jv-icon-btn" type="button" aria-label=${t} title=${t} ?disabled=${s} @click=${n}>
          ${this._icon(e)===m?c`<span aria-hidden="true">•</span>`:this._icon(e)}
        </button>`}_switch(e){let t=n=>e.onChange(!!n.target.checked);return x("ha-switch")?c`<ha-switch
        .checked=${I(e.checked)}
        .disabled=${e.disabled}
        aria-label=${e.label}
        title=${e.title??m}
        @change=${t}
      ></ha-switch>`:c`
      <label class="switch" title=${e.title??m}>
        <input type="checkbox" role="switch" aria-label=${e.label} .checked=${I(e.checked)} ?disabled=${e.disabled} @change=${t} />
      </label>
    `}_textField(e){let t=l=>{l.key==="Enter"&&!l.isComposing&&e.onEnter&&(l.preventDefault(),e.onEnter())},n=e.list?`${e.id}-list`:void 0,s=e.list?c`<datalist id=${n}>${e.list.map(l=>c`<option value=${l}></option>`)}</datalist>`:m;if(x("ha-textfield")&&!e.list&&!e.labelled)return c`<ha-textfield
        id=${e.id}
        .label=${e.label}
        .value=${I(e.value)}
        .placeholder=${e.placeholder??""}
        .disabled=${!!e.disabled}
        autocomplete="off"
        @input=${l=>e.onInput(l.target.value)}
        @keydown=${t}
        @blur=${l=>e.onBlur?.(l.target.value)}
      ></ha-textfield>`;let o=e.labelled?m:c`<label class="visually-hidden" for=${e.id}>${e.label}</label>`;return c`${o}
      <input
        id=${e.id}
        type="text"
        autocomplete="off"
        list=${n??m}
        placeholder=${e.placeholder??e.label}
        .value=${I(e.value)}
        ?disabled=${!!e.disabled}
        @input=${l=>e.onInput(l.target.value)}
        @keydown=${t}
        @blur=${l=>e.onBlur?.(l.target.value)}
      />${s}`}_loading(e=0){return e>0?c`<ul class="gallery" role="status" aria-live="polite" aria-label=${a("Loading...")}>
        ${Array.from({length:e},()=>c`<li><div class="jv-skeleton skeleton-square"></div></li>`)}
      </ul>`:c`<div class="loading" role="status" aria-live="polite" aria-label=${a("Loading...")}>
      <div class="jv-skeleton"></div>
      <div class="jv-skeleton"></div>
      <div class="jv-skeleton"></div>
    </div>`}_error(e,t,n,s){let o=t.code==="unknown_command"?s:t.error||"",d=t.code!=="unauthorized"?c`<button class="jv-btn" type="button" slot="action" @click=${n}>${a("Retry")}</button>`:m;return x("ha-alert")?c`<ha-alert alert-type="error" .title=${e}>${o}${d}</ha-alert>`:c`<div class="alert" role="alert">
      <div class="body"><strong>${e}</strong><span>${o}</span></div>
      ${d}
    </div>`}_infoAlert(e){return x("ha-alert")?c`<ha-alert alert-type="info">${e}</ha-alert>`:c`<div class="alert info" role="status"><div class="body"><span>${e}</span></div></div>`}_empty(e,t){return c`<jv-empty compact .icon=${t} .message=${e}></jv-empty>`}_renderIntro(){let e=a("Faces JARVIS recognizes from your vision backend — Frigate face recognition, or middleware like Double Take paired with external detectors such as CompreFace or DeepStack. JARVIS runs no face engine of its own; flag the people who live here as residents so it can tell a household member from a guest or an unknown face, and stand intrusion monitoring down when the person it sees is a resident."),t=a("A recognized face that isn't a resident is a guest — the jarvis_face_recognized event carries that status (relationship: resident / guest / unknown) so your automations can treat household and visitors differently."),n=c`<p>${e}</p>
      <p>${t}</p>`;return this.narrow?c`<details class="intro"><summary>${a("What is this?")}</summary>${n}</details>`:c`<div class="intro">${n}</div>`}_renderHousehold(){let e=this._faces,t=e.data,n=t?.residents.length??0,s=`${n===1?a("1 resident"):a("{n} residents",{n})} · ${a("people who live here")}`,o=e.status==="loading"||this._facesBusy,l=this._cameras();return c`
      <jv-section class="jv-span-all card-household" icon="mdi:home-account" .heading=${a("Household")} .subheading=${s} ?loading=${o&&!!t}>
        ${this._iconButton("mdi:refresh",a("Refresh"),()=>this._refreshAll(),e.status==="loading","actions")}
        ${this._renderIntro()}
        <form
          class="form-row"
          @submit=${d=>{d.preventDefault(),this._addResident(this._addName,!0)}}
        >
          <div class="grow">
            ${this._textField({id:"add-resident",label:a("Add a resident by name"),value:this._addName,disabled:this._facesBusy||e.status==="error",onInput:d=>this._addName=d})}
          </div>
          <button class="jv-btn primary" type="submit" ?disabled=${this._facesBusy||!this._addName.trim()}>
            ${this._icon("mdi:account-plus-outline")}${a("Add resident")}
          </button>
        </form>
        ${e.status==="error"&&!t?this._error(a("Could not load faces."),e,()=>{this._loadFaces()},a("Faces need a newer JARVIS backend — restart Home Assistant after updating.")):t?n===0?this._empty(a("No residents yet. Add the people who live here (or name a recognized face below); recognized residents then won't trigger intrusion alerts."),"mdi:account-plus-outline"):c`<ul class="gallery">
                  ${t.residents.map(d=>{let u=this._residentModel(d,t);return c`<li>
                      <jarvis-face-card
                        .hass=${this.hass}
                        .model=${u}
                        .cache=${this._cache}
                        .residents=${t.residents}
                        .cameras=${l}
                        ?busy=${this._cardBusy.has(this._cardKey(d))}
                      ></jarvis-face-card>
                    </li>`})}
                </ul>`:this._loading(4)}
      </jv-section>
    `}_renderRecent(){let e=this._faces,t=e.data,n=t?t.recent.filter(o=>!o.is_resident):[],s=this._cameras();return c`
      <jv-section
        class="jv-span-all card-recent"
        icon="mdi:account-clock-outline"
        .heading=${a("Recently seen")}
        .subheading=${a("guests & unknown faces")}
        ?loading=${(e.status==="loading"||this._facesBusy)&&!!t}
      >
        ${e.status==="error"&&!t?this._error(a("Could not load faces."),e,()=>{this._loadFaces()},a("Faces need a newer JARVIS backend — restart Home Assistant after updating.")):t?n.length===0?this._empty(a("No guests or unknown faces seen recently. When your backend names a face that isn't a resident, it appears here as a guest."),"mdi:account-question-outline"):c`<ul class="gallery">
                  ${n.map(o=>c`<li>
                      <jarvis-face-card
                        .hass=${this.hass}
                        .model=${this._recentModel(o)}
                        .cache=${this._cache}
                        .residents=${t.residents}
                        .cameras=${s}
                        ?busy=${this._cardBusy.has(this._cardKey(o.name,o.camera_entity))}
                      ></jarvis-face-card>
                    </li>`)}
                </ul>`:this._loading(4)}
        ${t&&t.recognitionSource?c`<p class="footer">
              ${this._sourceLine(t.recognitionSource)} ·
              ${a("each snapshot is the frame captured when JARVIS recognized the face (falls back to the live camera view until the next sighting).")}
            </p>`:m}
      </jv-section>
    `}_sourceLine(e){let[n="",s=""]=a("Reading identities from: {source}",{source:"\0"}).split("\0");return c`${n}<span class="code">${e}</span>${s}`}_renderVoices(){let e=this._voices,t=e.data,n=this.data?.config??{},s=this._localOverride??t?.localEnabled??!!n.voice_recognition_local,o=this._delegateDraft??t?.delegateStt??(typeof n.voice_recognition_delegate_stt=="string"?n.voice_recognition_delegate_stt:""),l=this._modelDraft??t?.modelPath??"",d=!!t?.backendAvailable,u=this._facesData?.residents??[],p=!d||!!this._recording||this._voiceBusy||e.status!=="loaded",v=d?void 0:a("Install the speaker-ID backend first"),f=(j,C)=>this._recording?.mode===j?a("Recording… {s}s",{s:this._recording.left}):C,g=Rd(this.hass),y=c`
      <div class="switch-row">
        <span class="label">${a("Identify speakers in-process")}</span>
        ${this._switch({checked:s,disabled:this._localPending||e.status==="idle"||e.status==="error",label:a("Identify speakers in-process"),onChange:j=>{this._toggleLocal(j)}})}
      </div>
      <p class="help">${a("Needs onnxruntime and a speaker model; see the voice recognition guide.")}</p>
      ${this._showRestartInfo?this._infoAlert(a('Restart Home Assistant (or reload JARVIS) for the "JARVIS Speaker-ID" speech-to-text entity to appear or disappear.')):m}
      ${s?c`
            <div class="field">
              <label for="voice-delegate">${a("Delegate STT entity")}</label>
              ${this._textField({id:"voice-delegate",label:a("Delegate STT entity"),placeholder:a("e.g. stt.faster_whisper"),labelled:!0,value:o,disabled:this._savingKey==="voice_recognition_delegate_stt",list:Td(this.hass),onInput:j=>this._delegateDraft=j,onEnter:()=>{this._saveVoiceField("voice_recognition_delegate_stt",this._delegateDraft??o)},onBlur:j=>{this._saveVoiceField("voice_recognition_delegate_stt",j)}})}
            </div>
            <div class="field">
              <label for="voice-model">${a("Model path")}</label>
              ${this._textField({id:"voice-model",label:a("Model path"),placeholder:"<config>/jarvis/models/speaker.onnx",labelled:!0,value:l,disabled:this._savingKey==="voice_embedding_model_path",onInput:j=>this._modelDraft=j,onEnter:()=>{this._saveVoiceField("voice_embedding_model_path",this._modelDraft??l)},onBlur:j=>{this._saveVoiceField("voice_embedding_model_path",j)}})}
            </div>
          `:m}
    `,_=t?c`
          <div class="status" aria-live="polite">
            ${d?c`<jv-state-badge level="ok" .label=${a("Speaker-ID backend ready")}></jv-state-badge>`:c`<jv-state-badge level="warn" .label=${a("Backend not installed")}></jv-state-badge>
                  <span class="hint">${a("add onnxruntime and a model to enable")}</span>`}
          </div>
          <p class="speaking" aria-live="polite">
            ${t.current?c`${a("Speaking now: {name} · {score}%",{name:t.current.name,score:Math.round(t.current.score*10)/10})}
                ${t.current.trusted?m:c` <span class="guess">${a("(guess)")}</span>`}`:a("Speaking now: —")}
          </p>
          ${this._identifyResult?c`<p class="result" role="status" aria-live="polite">${this._identifyResult}</p>`:m}
        `:m,w=t?t.profiles.length===0?this._empty(a("No enrolled voices yet. Record a short sample below to teach JARVIS a voice."),"mdi:account-voice"):c`<ul class="plain">
            ${t.profiles.map(j=>{let C=this._forgetting.has(j.name);return c`<li>
                <div class="text">
                  <span class="jv-truncate" title=${j.name}>${j.name}</span>
                  <span class="sub">
                    ${j.count===1?a("1 sample"):a("{count} samples",{count:j.count})}
                    ${j.updated>0?c` · ${Ed(j.updated,g)}`:m}
                  </span>
                </div>
                ${this._iconButton("mdi:delete-outline",a("Forget voiceprint"),()=>{this._forgetVoice(j.name)},C)}
              </li>`})}
          </ul>`:m,R=c`
      <div class="mic-row">
        <div class="grow">
          ${this._textField({id:"voice-name",label:a("Name this voice…"),value:this._voiceName,disabled:!!this._recording||this._voiceBusy,list:u,onInput:j=>this._voiceName=j,onEnter:()=>{this._enrollVoice()}})}
        </div>
        <button class="jv-btn primary" type="button" ?disabled=${p} title=${v??m} @click=${()=>{this._enrollVoice()}}>
          ${this._icon("mdi:microphone")}${f("enroll",a("Record & enroll"))}
        </button>
        <button class="jv-btn" type="button" ?disabled=${p} title=${v??m} @click=${()=>{this._identifyVoice()}}>
          ${this._icon("mdi:microphone-question")}${f("identify",a("Identify"))}
        </button>
      </div>
      <span class="sr-live" aria-live="assertive">${this._liveMessage}</span>
      <p class="footer">
        ${a("Voiceprints are stored as embeddings, never audio. A match only identifies a resident above a confidence threshold; weaker matches are shown as a guess and never stand security alerts down.")}
        <button class="link" type="button" @click=${()=>this.navigate("settings","voice")}>${a("Thresholds are in Settings → Voice & Audio.")}</button>
      </p>
    `;return c`
      <jv-section class="card-voices" icon="mdi:account-voice" .heading=${a("Voices")} ?loading=${e.status==="loading"&&!!t}>
        <jv-state-badge slot="actions" level="info" nodot .label=${a("Experimental")}></jv-state-badge>
        ${y}
        ${e.status==="error"&&!t?this._error(a("Could not load voices."),e,()=>{this._loadVoices()},a("Voice ID needs a newer JARVIS backend.")):t?c`${_}${w}${R}`:this._loading()}
      </jv-section>
    `}_renderWellbeing(){let e=this._bio,t=e.data,n=this._bioOverride??t?.enabled??!1,s=t?n?c`<jv-state-badge slot="actions" level="ok" .label=${a("On · {n} sensors",{n:t.found})}></jv-state-badge>`:c`<jv-state-badge slot="actions" level="neutral" .label=${a("Off")}></jv-state-badge>`:m,o;if(e.status==="error"&&!t)o=this._error(a("Could not load wellbeing context."),e,()=>{this._loadBio()},a("Could not load wellbeing context."));else if(!t)o=this._loading();else if(!n)o=this._empty(a("Off — enable to let JARVIS use wearable context. Health readings are never diagnosed or alarmed on."),"mdi:heart-pulse");else if(t.entities.length===0)o=this._empty(a("No wearable entities found. Connect a wearable integration (Withings, Google Fit, Oura, etc.) to Home Assistant."),"mdi:watch-variant");else{let l=Od(t.entities),d=(u,p)=>c`
        <li>
          <jv-kv stacked .label=${p?u.kind.replace(/_/g," "):u.name||u.entity} .value=${`${u.value}${u.unit?` ${u.unit}`:""}`} title=${u.name}></jv-kv>
          <span class="sub code">${u.entity}</span>
        </li>`;o=c`${l.map(([u,p])=>p.length>1?c`<section class="kind-group" aria-label=${u.replace(/_/g," ")}>
              <h3>${u.replace(/_/g," ")}</h3>
              <ul class="plain">${p.map(v=>d(v,!1))}</ul>
            </section>`:c`<ul class="plain">${p.map(v=>d(v,!0))}</ul>`)}`}return c`
      <jv-section class="card-wellbeing" icon="mdi:heart-pulse" .heading=${a("Wellbeing Context")} ?loading=${e.status==="loading"&&!!t}>
        ${s}
        <div class="intro">
          <p>${a("Lets JARVIS read a connected wearable (heart rate, sleep, steps) so it can be quieter when you're resting.")}</p>
          <p><strong>${a("Context only — not medical.")}</strong> ${a("Off by default; health data stays private.")}</p>
        </div>
        <div class="switch-row">
          <span class="label">${a("Use wearable context")}</span>
          ${this._switch({checked:n,disabled:this._bioPending||!t,label:a("Use wearable context"),onChange:l=>{this._toggleBio(l)}})}
        </div>
        ${o}
      </jv-section>
    `}_renderOptions(){let e=this._facesData,t=this.data?.config??{},n=this._llmOverride??e?.llmFaceRecognition??!!t.llm_face_recognition,s=e?.recognitionSource||typeof t.recognition_source=="string"&&t.recognition_source||"both",o=this._faces.status==="loaded"||!!e;return c`
      <jv-section class="card-options" icon="mdi:face-recognition" .heading=${a("Face recognition options")}>
        <div class="switch-row">
          <span class="label">${a("Best-effort face recognition")} <jv-state-badge level="info" nodot .label=${a("Experimental")}></jv-state-badge></span>
          ${this._switch({checked:n,disabled:!o||this._llmPending,label:a("Best-effort face recognition"),onChange:l=>{this._toggleLlm(l)}})}
        </div>
        <p class="help">
          ${a("No dedicated face backend? With this on, JARVIS asks its own local vision model whether a camera frame matches a resident's reference photo (set one on each resident card). It's a rough guess — results are clearly marked LLM GUESS, and this never disables intrusion alerts. For reliable recognition, use Frigate's native face recognition instead.")}
        </p>
        <jv-kv .label=${a("Recognition source")} .value=${s} mono></jv-kv>
        <div>
          <button class="link" type="button" @click=${()=>this.navigate("settings","cameras")}>${a("Change in Settings → Cameras")}</button>
        </div>
        <div>
          <a class="link" href=${Zm} target="_blank" rel="noopener noreferrer">${a("Voice recognition setup guide")}</a>
        </div>
      </jv-section>
    `}render(){return this.hass?c`
      <div class="jv-grid" @face-action=${this._onFaceAction}>
        ${this._renderRecent()} ${this._renderHousehold()} ${this._renderVoices()} ${this._renderWellbeing()} ${this._renderOptions()}
      </div>
      <jarvis-people-lightbox></jarvis-people-lightbox>
    `:m}};ue.styles=[T,Bd],h([b()],ue.prototype,"_faces",2),h([b()],ue.prototype,"_voices",2),h([b()],ue.prototype,"_bio",2),h([b()],ue.prototype,"_addName",2),h([b()],ue.prototype,"_facesBusy",2),h([b()],ue.prototype,"_cardBusy",2),h([b()],ue.prototype,"_llmOverride",2),h([b()],ue.prototype,"_llmPending",2),h([b()],ue.prototype,"_localOverride",2),h([b()],ue.prototype,"_localPending",2),h([b()],ue.prototype,"_showRestartInfo",2),h([b()],ue.prototype,"_delegateDraft",2),h([b()],ue.prototype,"_modelDraft",2),h([b()],ue.prototype,"_savingKey",2),h([b()],ue.prototype,"_voiceName",2),h([b()],ue.prototype,"_recording",2),h([b()],ue.prototype,"_voiceBusy",2),h([b()],ue.prototype,"_identifyResult",2),h([b()],ue.prototype,"_forgetting",2),h([b()],ue.prototype,"_liveMessage",2),h([b()],ue.prototype,"_bioPending",2),h([b()],ue.prototype,"_bioOverride",2),h([me("jarvis-people-lightbox")],ue.prototype,"_lightbox",2),ue=h([A("jarvis-view-people")],ue);function qd(r){switch(r){case"time_routine":return a("Daily routine");case"sequence":return a("Action sequence");case"repeated_command":return a("Repeated command");case"temp_pref":return a("Temperature");case"presence":return a("Presence");case"numeric_trigger":return a("Sensor threshold");case"confirm_sequence":return a("Confirmed sequence");default:return a("Learned pattern")}}function Wd(r){return r==="confirm_sequence"?"warn":"neutral"}function Gd(r){let i=typeof r=="number"&&Number.isFinite(r)?r:0;return Math.max(0,Math.min(100,Math.round(i*100)))}function Vd(r){return r>=80?"ok":r>=55?"warn":"neutral"}function Yd(r){let i=typeof r=="string"?r.trim():"";if(!i)return{text:"",advisory:!1};try{let e=JSON.parse(i);if(e&&typeof e=="object"&&!Array.isArray(e)){let t=e,n=t.type==="manual_review"||typeof t.note=="string"&&!("trigger"in t);return{text:JSON.stringify(e,null,2),advisory:n}}return{text:JSON.stringify(e,null,2),advisory:!1}}catch{return{text:i,advisory:!1}}}function Qm(r){if(typeof r!="string"||!r.trim())return null;let i=new Date(r.trim().replace(" ","T"));return Number.isNaN(i.getTime())?null:i}function Ud(r){let i=Math.round(Math.abs(r)/6e4);if(i<60)return`${i}m`;let e=Math.round(i/60);return e<48?`${e}h`:`${Math.round(e/24)}d`}function Yo(r,i=Date.now()){let e=Qm(r);if(!e)return"";let t=e.getTime()-i;return t>=0?a("in {t}",{t:Ud(t)}):a("{t} ago",{t:Ud(t)})}function Xd(r,i=Date.now()){if(typeof r!="number"||!Number.isFinite(r)||r<=0)return"";let e=Math.max(0,Math.round((i-r*1e3)/6e4));if(e<60)return a("{n}m ago",{n:e});let t=Math.round(e/60);return t<48?a("{n}h ago",{n:t}):a("{n}d ago",{n:Math.round(t/24)})}function Zd(r){let i=typeof r=="number"&&Number.isFinite(r)?r:0;return String(i).padStart(2,"0")}function ae(r){return typeof r=="number"&&Number.isFinite(r)?Math.trunc(r):0}function Qd(r){return r&&r.charAt(0).toUpperCase()+r.slice(1)}function nn(r){if(r&&typeof r=="object"&&"message"in r){let i=r.message;if(typeof i=="string"&&i)return i}return String(r??"")}function Jd(r){if(r&&typeof r=="object"&&"code"in r){let i=r.code;if(typeof i=="string")return i}return""}function Je(r,i,e="neutral"){let t={message:i,tone:e};r.dispatchEvent(new CustomEvent("jv-toast",{detail:t,bubbles:!0,composed:!0}))}var Gr=S`
  :host {
    display: block;
    min-width: 0;
    /* cards size their action rows by their OWN width (container query), so
       the harness's narrow frame and a real phone behave the same */
    container-type: inline-size;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .item {
    padding: var(--jv-space-4);
    border-top: 1px solid var(--jv-divider);
  }
  .item.faded {
    opacity: 0.35;
  }
  .item.dim {
    opacity: 0.65;
  }
  .intro {
    margin: 0;
    padding: 0 var(--jv-space-4) var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  .bar {
    height: 4px;
    border-radius: 2px;
    background: var(--jv-neutral-soft);
    overflow: hidden;
  }
  .bar > span {
    display: block;
    height: 100%;
    background: var(--jv-accent);
  }
  .bar.ok > span {
    background: var(--jv-ok);
  }
  .bar.warn > span {
    background: var(--jv-warn);
  }
  .bar.neutral > span {
    background: var(--jv-neutral);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin-top: var(--jv-space-3);
  }
  .actions .jv-btn {
    flex: 1 1 auto;
  }
  .actions .jv-btn.primary {
    flex-basis: 100%;
  }
  @container (min-width: 480px) {
    .actions .jv-btn,
    .actions .jv-btn.primary {
      flex: 0 0 auto;
    }
  }
  .inline-error {
    color: var(--jv-danger-text);
    font-size: var(--jv-font-size-s);
    margin: var(--jv-space-1) 0 0;
  }
  .skeleton-rows {
    display: grid;
    gap: var(--jv-space-3);
    padding: var(--jv-space-4);
  }
  .skeleton-rows .jv-skeleton {
    min-height: 56px;
  }
  .skeleton-rows .jv-skeleton:nth-child(2) {
    min-height: 40px;
  }
  .text-btn {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 0;
    font: inherit;
    color: var(--jv-accent);
    cursor: pointer;
    text-decoration: underline;
  }
  ha-icon-button {
    --mdc-icon-button-size: var(--jv-tap);
    color: var(--jv-text-2);
  }
`;var rn=class extends L{constructor(){super(...arguments);this.suggestions=null;this._expanded=new Set;this._busy=new Set;this._done=new Set}connectedCallback(){super.connectedCallback(),P(this,["ha-icon"])}_toggle(e){let t=new Set(this._expanded);t.has(e)?t.delete(e):t.add(e),this._expanded=t}_setBusy(e,t){let n=new Set(this._busy);t?n.add(e):n.delete(e),this._busy=n}_markDone(e){this._done=new Set(this._done).add(e),this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}async _approve(e){let t=ae(e.id);if(!(this._busy.has(t)||this._done.has(t))&&!(e.pattern_type==="confirm_sequence"&&!await U({heading:a("Create automation"),message:a("This automation closes a cover automatically when a confirmation sensor fires. Install it?"),confirmLabel:a("Install"),cancelLabel:a("Cancel")}))){this._setBusy(t,!0);try{let n=await X(this.hass,"jarvis/suggestion_action",{suggestion_id:t,action:"approve"});n&&n.ok?(n.installed?Je(this,a('Installed — "{alias}" is now live in Home Assistant',{alias:n.alias??""}),"ok"):Je(this,a("Approved — advisory only ({reason})",{reason:n.reason??a("not installable")}),"neutral"),this._markDone(t)):Je(this,a("Could not approve suggestion"),"danger")}catch(n){Je(this,a("Suggestion failed — {error}",{error:nn(n)}),"danger")}finally{this._setBusy(t,!1)}}}async _dismiss(e){let t=ae(e.id);if(!(this._busy.has(t)||this._done.has(t))){this._setBusy(t,!0);try{let n=await X(this.hass,"jarvis/suggestion_action",{suggestion_id:t,action:"dismiss"});n&&n.ok?(Je(this,a("Dismissed"),"neutral"),this._markDone(t)):Je(this,a("Could not dismiss suggestion"),"danger")}catch(n){Je(this,a("Suggestion failed — {error}",{error:nn(n)}),"danger")}finally{this._setBusy(t,!1)}}}_friendlyName(e){let t=this.hass?.states?.[e]?.attributes?.friendly_name;return typeof t=="string"&&t?`${t} (${e})`:e}_renderItem(e){let t=ae(e.id),n=Gd(e.confidence),s=Vd(n),o=this._expanded.has(t),l=this._busy.has(t),d=this._done.has(t),u=l||d,p=Yd(e.yaml),v=Array.isArray(e.evidence)?e.evidence.filter(_=>typeof _=="string"&&_):[],f=Array.isArray(e.entities)?e.entities.filter(_=>typeof _=="string"&&_):[],g=ae(e.count),y=`pre-${t}`;return c`
      <li class="item ${d?"faded":""}" aria-busy=${l?"true":"false"}>
        <div class="top">
          <jv-state-badge nodot level=${Wd(e.pattern_type)} .label=${qd(e.pattern_type)}></jv-state-badge>
          <div class="conf ${s}">
            <span>${a("{pct}% confident",{pct:n})}</span>
            <div class="bar ${s}" role="progressbar" aria-valuenow=${n} aria-valuemin="0" aria-valuemax="100" aria-label=${a("{pct}% confident",{pct:n})}>
              <span style="width:${n}%"></span>
            </div>
          </div>
        </div>
        ${e.why_headline?c`<p class="headline">${e.why_headline}</p>`:m}
        ${e.description?c`<p class="desc">${e.description}</p>`:m}
        ${v.length?c`
              <div class="evidence">
                <p class="label">${a("What JARVIS observed")}</p>
                <ul>
                  ${v.map(_=>c`<li>${_}</li>`)}
                </ul>
              </div>
            `:m}
        ${f.length?c`<div class="chips">${f.map(_=>c`<span class="chip" title=${this._friendlyName(_)}>${_}</span>`)}</div>`:m}
        ${g>0?c`<p class="seen jv-muted">${a("Seen {count}× in 30 days",{count:g})}</p>`:m}
        <div class="actions">
          <button class="jv-btn primary" type="button" ?disabled=${u} @click=${()=>{this._approve(e)}}>
            ${p.advisory?a("Acknowledge"):a("Create automation")}
          </button>
          <button class="jv-btn" type="button" ?disabled=${u} @click=${()=>{this._dismiss(e)}}>${a("Dismiss")}</button>
          <button
            class="jv-btn text"
            type="button"
            aria-expanded=${o?"true":"false"}
            aria-controls=${o?y:m}
            @click=${()=>this._toggle(t)}
          >
            ${o?a("Hide automation"):a("Show automation")}
          </button>
        </div>
        ${o?c`
              <div class="preview" id=${y}>
                ${p.advisory?c`<p class="advisory">${a("Advisory only — approving records your acknowledgement but installs nothing.")}</p>`:m}
                ${p.text?c`<pre>${p.text}</pre>`:c`<p class="jv-muted">${a("No automation payload.")}</p>`}
              </div>
            `:m}
      </li>
    `}render(){let e=this.suggestions,t=e?e.length:0;return c`
      <jv-section .heading=${a("Suggestions")} icon="mdi:lightbulb-on-outline" flush>
        ${t>0?c`<jv-state-badge slot="actions" nodot level="accent" .label=${a("{n} to review",{n:t})}></jv-state-badge>`:m}
        ${e===null?c`<div class="skeleton-rows" role="status" aria-label=${a("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`:t===0?c`
                <jv-empty
                  compact
                  icon="mdi:lightbulb-outline"
                  .heading=${a("No suggestions right now")}
                  .message=${a("JARVIS proposes automations as it notices routines repeat — a light you turn on each evening, a scene after a button press, the heat when it's cold. As patterns build up, they'll appear here for you to review and approve. Nothing is ever created without your say-so.")}
                ></jv-empty>
              `:c`
                <p class="intro">
                  ${a("Automations JARVIS has learned from watching your routines. Approve to create one in Home Assistant, or dismiss it. Nothing runs until you approve.")}
                </p>
                <ul>
                  ${e.map(n=>this._renderItem(n))}
                </ul>
              `}
      </jv-section>
    `}};rn.styles=[T,Gr,S`
      .top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--jv-space-3);
        flex-wrap: wrap;
      }
      .conf {
        flex: 0 1 160px;
        min-width: 120px;
        display: grid;
        gap: var(--jv-space-1);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        text-align: right;
      }
      .conf.ok {
        color: var(--jv-ok-text);
      }
      .conf.warn {
        color: var(--jv-warn-text);
      }
      .headline {
        margin: var(--jv-space-3) 0 0;
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .desc {
        margin: var(--jv-space-1) 0 0;
        overflow-wrap: anywhere;
      }
      .evidence {
        margin: var(--jv-space-3) 0 0;
      }
      .evidence .label {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        margin: 0 0 var(--jv-space-1);
      }
      .evidence ul {
        list-style: disc;
        padding-left: 20px;
        display: grid;
        gap: 2px;
      }
      .evidence li {
        overflow-wrap: anywhere;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
        margin-top: var(--jv-space-3);
      }
      .chip {
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        padding: 2px var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .seen {
        margin: var(--jv-space-2) 0 0;
      }
      .preview {
        margin-top: var(--jv-space-3);
      }
      .advisory {
        margin: 0 0 var(--jv-space-2);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-warn-soft);
        font-size: var(--jv-font-size-s);
      }
      pre {
        margin: 0;
        padding: var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-s);
        line-height: 1.45;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        max-height: 60vh;
        overflow: auto;
      }
    `],h([$({attribute:!1})],rn.prototype,"hass",2),h([$({attribute:!1})],rn.prototype,"suggestions",2),h([b()],rn.prototype,"_expanded",2),h([b()],rn.prototype,"_busy",2),h([b()],rn.prototype,"_done",2),rn=h([A("jarvis-suggestions-list")],rn);var Xo=240,_t=class extends L{constructor(){super(...arguments);this.goals=null;this._draft="";this._creating=!1;this._fieldError="";this._busy=new Set;this._override=null}connectedCallback(){super.connectedCallback(),P(this,["ha-icon","ha-icon-button","ha-textfield"])}willUpdate(e){e.has("goals")&&e.get("goals")!==void 0&&(this._override=null)}get _list(){return this._override??this.goals}_setBusy(e,t){let n=new Set(this._busy);t?n.add(e):n.delete(e),this._busy=n}_applyResult(e){e&&Array.isArray(e.goals)&&(this._override=e.goals),this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}_onInput(e){let t=e.target;this._draft=String(t.value??"").slice(0,Xo),this._fieldError&&(this._fieldError="")}_onKeydown(e){e.key==="Enter"&&(e.preventDefault(),this._create())}async _create(){if(this._creating)return;let e=this._draft.trim();if(!e){this._fieldError=a("Enter what JARVIS should work toward");return}this._creating=!0;try{let t=await X(this.hass,"jarvis/goal_action",{action:"create",outcome:e});Je(this,a("Goal added"),"ok"),this._draft="",this._fieldError="",this._applyResult(t)}catch(t){Jd(t)==="empty_outcome"?this._fieldError=a("Enter what JARVIS should work toward"):Je(this,a("Could not add goal — {error}",{error:nn(t)}),"danger")}finally{this._creating=!1}}async _cancel(e){let t=ae(e.id);if(!this._busy.has(t)){this._setBusy(t,!0);try{let n=await X(this.hass,"jarvis/goal_action",{action:"cancel",goal_id:t});Je(this,n&&n.ok?a("Goal cancelled"):a("Goal was already closed"),n&&n.ok?"ok":"neutral"),this._applyResult(n)}catch(n){Je(this,a("Cancel failed — {error}",{error:nn(n)}),"danger")}finally{this._setBusy(t,!1)}}}async _delete(e){let t=ae(e.id);if(!(this._busy.has(t)||!await U({heading:a("Delete this goal from history?"),message:e.title||e.outcome||"",confirmLabel:a("Delete"),cancelLabel:a("Cancel"),destructive:!0}))){this._setBusy(t,!0);try{let s=await X(this.hass,"jarvis/goal_action",{action:"delete",goal_id:t});Je(this,a("Goal deleted"),"ok"),this._applyResult(s)}catch(s){Je(this,a("Delete failed — {error}",{error:nn(s)}),"danger")}finally{this._setBusy(t,!1)}}}_status(e){switch(e){case"active":return{label:a("Active"),level:"accent"};case"done":return{label:a("Done"),level:"ok"};case"failed":return{label:a("Failed"),level:"danger"};case"cancelled":return{label:a("Cancelled"),level:"neutral"};default:return{label:Qd(String(e??"")),level:"neutral"}}}_iconButton(e,t,n,s){return x("ha-icon-button")&&x("ha-icon")?c`
        <ha-icon-button .label=${t} title=${t} .disabled=${n} @click=${s}>
          <ha-icon .icon=${e}></ha-icon>
        </ha-icon-button>
      `:c`<button class="jv-btn text" type="button" title=${t} ?disabled=${n} @click=${s}>${t}</button>`}_renderGoal(e){let t=ae(e.id),n=e.status==="active",s=this._status(e.status),o=ae(e.steps_total),l=ae(e.steps_done),d=o>0?Math.max(0,Math.min(100,Math.round(l/o*100))):0,u=this._busy.has(t),p="";if(n){let v=Yo(e.deadline_ts),f=Yo(e.next_check_ts);e.deadline_ts&&v?p=a("Deadline {rel}",{rel:v}):f&&(p=a("Next check {rel}",{rel:f}))}else e.last_result&&(p=e.last_result);return c`
      <li class="item ${n?"":"dim"}" aria-busy=${u?"true":"false"}>
        <div class="goal">
          <div class="main">
            <div class="head">
              <jv-state-badge level=${s.level} .label=${s.label}></jv-state-badge>
              ${e.title?c`<p class="title">${e.title}</p>`:m}
            </div>
            ${e.outcome&&e.outcome!==e.title?c`<p class="outcome">${e.outcome}</p>`:m}
            ${o>0?c`
                  <div class="progress">
                    <div class="bar" role="progressbar" aria-valuenow=${d} aria-valuemin="0" aria-valuemax="100" aria-label=${a("{done}/{total} steps",{done:l,total:o})}>
                      <span style="width:${d}%"></span>
                    </div>
                    <span class="jv-muted">${a("{done}/{total} steps",{done:l,total:o})}</span>
                  </div>
                `:m}
            ${p?c`<p class="when jv-muted">${p}</p>`:m}
          </div>
          <div class="trail">
            ${n?this._iconButton("mdi:close",a("Cancel this goal"),u,()=>{this._cancel(e)}):this._iconButton("mdi:delete-outline",a("Delete this goal"),u,()=>{this._delete(e)})}
          </div>
        </div>
      </li>
    `}_renderInput(){let e=a("Give JARVIS a goal to work toward…"),t=x("ha-textfield")?c`
          <ha-textfield
            .label=${e}
            .value=${this._draft}
            .disabled=${this._creating}
            .maxLength=${Xo}
            .errorMessage=${this._fieldError}
            .invalid=${!!this._fieldError}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
          ></ha-textfield>
        `:c`
          <label class="visually-hidden" for="goal-input">${e}</label>
          <input
            id="goal-input"
            type="text"
            .value=${this._draft}
            placeholder=${e}
            maxlength=${Xo}
            ?disabled=${this._creating}
            aria-invalid=${this._fieldError?"true":"false"}
            aria-describedby=${this._fieldError?"goal-error":m}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
          />
          ${this._fieldError?c`<p class="inline-error" id="goal-error" role="alert">${this._fieldError}</p>`:m}
        `;return c`
      <div class="add">
        <div class="field">${t}</div>
        <button class="jv-btn primary" type="button" ?disabled=${this._creating} @click=${()=>{this._create()}}>${a("Add")}</button>
      </div>
    `}render(){let e=this._list,t=e?e.filter(n=>n.status==="active").length:0;return c`
      <jv-section .heading=${a("Goals")} icon="mdi:flag-checkered" flush>
        ${e&&t>0?c`<jv-state-badge slot="actions" nodot level="accent" .label=${a("{n} active",{n:t})}></jv-state-badge>`:m}
        ${this._renderInput()}
        ${e===null?c`<div class="skeleton-rows" role="status" aria-label=${a("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`:e.length===0?c`<p class="empty jv-muted">${a("No goals yet. Add one above, or ask JARVIS to set one.")}</p>`:c`<ul>${e.map(n=>this._renderGoal(n))}</ul>`}
      </jv-section>
    `}};_t.styles=[T,Gr,S`
      .add {
        display: flex;
        gap: var(--jv-space-2);
        padding: 0 var(--jv-space-4) var(--jv-space-3);
        align-items: flex-start;
      }
      .add .field {
        flex: 1 1 auto;
        min-width: 0;
      }
      .add input {
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
      }
      .add input::placeholder {
        color: var(--jv-text-3);
      }
      .add ha-textfield {
        width: 100%;
      }
      .add .jv-btn {
        flex: none;
      }
      .goal {
        display: flex;
        gap: var(--jv-space-3);
        align-items: flex-start;
      }
      .goal .main {
        flex: 1 1 auto;
        min-width: 0;
      }
      .goal .trail {
        flex: none;
        margin-top: calc(-1 * var(--jv-space-2));
      }
      .goal .head {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .outcome {
        margin: var(--jv-space-1) 0 0;
        overflow-wrap: anywhere;
      }
      .progress {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--jv-space-2);
        margin-top: var(--jv-space-2);
      }
      .when {
        margin: var(--jv-space-1) 0 0;
        overflow-wrap: anywhere;
      }
      .empty {
        padding: var(--jv-space-2) var(--jv-space-4) var(--jv-space-4);
      }
    `],h([$({attribute:!1})],_t.prototype,"hass",2),h([$({attribute:!1})],_t.prototype,"goals",2),h([b()],_t.prototype,"_draft",2),h([b()],_t.prototype,"_creating",2),h([b()],_t.prototype,"_fieldError",2),h([b()],_t.prototype,"_busy",2),h([b()],_t.prototype,"_override",2),_t=h([A("jarvis-suggestions-goals")],_t);var ct=class extends L{constructor(){super(...arguments);this.data=null;this._status=null;this._statusError="";this._loading=!1;this._running=!1;this._result=null;this._runError="";this._inFlight=null}connectedCallback(){super.connectedCallback(),P(this,["ha-alert"])}updated(e){(e.has("hass")&&!this._status&&!this._inFlight||e.has("data")&&this.data)&&this.hass&&this._fetchStatus()}_fetchStatus(){return this._inFlight?this._inFlight:this.hass?(this._status||(this._loading=!0),this._inFlight=(async()=>{try{let e=await X(this.hass,"jarvis/get_cognitive_status");this._status=e&&typeof e=="object"?e:{},this._statusError=""}catch(e){this._statusError=nn(e)||a("Learning status unavailable"),this._status||(this._status={})}finally{this._loading=!1,this._inFlight=null}})(),this._inFlight):Promise.resolve()}async _analyze(){if(!this._running){this._running=!0,this._runError="";try{let e=await X(this.hass,"jarvis/run_analysis");this._result=e&&typeof e=="object"?e:{ran:!1}}catch(e){this._result=null,this._runError=nn(e)||a("Analysis did not run.")}finally{this._running=!1}await this._fetchStatus(),this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}}_renderResult(){if(this._runError)return c`<div class="result error" role="status"><p class="lead">${this._runError}</p></div>`;let e=this._result;if(!e)return m;let t=e.backfill&&ae(e.backfill.imported)>0?c`<p>${a("Imported {n} past events from history for {m} new entities.",{n:ae(e.backfill.imported),m:ae(e.backfill.entities)})}</p>`:m;if(!e.ran)return c`
        <div class="result error" role="status">
          <p class="lead">${e.reason||e.error||a("Analysis did not run.")}</p>
          ${t}
        </div>
      `;let n=ae(e.patterns_found),s=ae(e.new_suggestions),o=e.diagnostic??{},l=Array.isArray(o.candidates)?o.candidates[0]:void 0,d=Array.isArray(o.top_sources)?o.top_sources[0]:void 0,u=Array.isArray(e.near_misses)?e.near_misses.slice(0,5):[];return c`
      <div class="result" role="status">
        <p class="lead">
          ${a("Found {n} patterns, {m} new suggestions.",{n,m:s})}
          ${s>0?a("They're listed above."):a("Nothing cleared the confidence bar this pass.")}
        </p>
        ${s>0?m:c`
              ${l?c`<p>${a("Closest routine: {entity} → {state} ~{hh}:00, seen {days}/{total} days (needs {min}).",{entity:l.entity_id,state:l.state,hh:Zd(l.hour),days:ae(l.days),total:ae(o.total_days),min:ae(o.min_days)})}</p>`:m}
              ${d?c`<p>${a("Busiest source: {entity} ({changes} changes).",{entity:d.entity_id,changes:ae(d.changes)})}</p>`:m}
              ${u.length?c`
                    <p>${a("Building toward suggestions:")}</p>
                    <ul>
                      ${u.map(p=>c`<li>
                          ${p.description||p.type||""}
                          ${p.needed==null?`(${ae(p.occurrences)}×)`:`(${ae(p.occurrences)}/${ae(p.needed)})`}
                        </li>`)}
                    </ul>
                  `:m}
            `}
        ${t}
      </div>
    `}_renderStatus(){let e=this._status??{},t=e.learning??{},n=e.last_analysis??{},s=Xd(n.ts),o=s?`${s} · ${a("{n} found, {m} stored",{n:ae(n.patterns_found),m:ae(n.new_suggestions)})}`:a("Not yet this session"),l=this._statusError||e.error;return c`
      ${l?c`<p class="note jv-muted">${a("Learning status unavailable")}${e.error?c` — <span class="mono">${e.error}</span>`:m}</p>`:e.running===!1?c`<p class="note jv-muted">${a("Cognitive core is not running")}</p>`:m}
      <div class="rows">
        <jv-kv .label=${a("Data")} .value=${a("{n} days",{n:ae(t.days_of_data)})}></jv-kv>
        <jv-kv .label=${a("State changes")} .value=${String(ae(t.state_changes))} mono></jv-kv>
        <jv-kv .label=${a("Commands")} .value=${String(ae(t.commands))} mono></jv-kv>
        <jv-kv .label=${a("Pending suggestions")} .value=${String(ae(t.suggestions))} mono></jv-kv>
        <jv-kv .label=${a("Ignore rules")} .value=${String(ae(e.ignore_rules))} mono></jv-kv>
        <jv-kv .label=${a("Last analysis")} .value=${o} stacked></jv-kv>
      </div>
    `}render(){let e=this._running;return c`
      <jv-section .heading=${a("Routine Learning")} icon="mdi:school-outline" flush .loading=${e}>
        ${this._loading&&!this._status?c`<div class="skeleton-rows" role="status" aria-label=${a("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`:this._renderStatus()}
        <div class="foot">
          <button class="jv-btn" type="button" ?disabled=${e} aria-busy=${e?"true":"false"} @click=${()=>{this._analyze()}}>
            ${e?a("Analyzing…"):a("Analyze Now")}
          </button>
          ${e?c`<p class="jv-muted" role="status">${a("Running pattern analysis over your history…")}</p>`:this._renderResult()}
        </div>
      </jv-section>
    `}};ct.styles=[T,Gr,S`
      .rows {
        padding: 0 var(--jv-space-4);
      }
      .foot {
        padding: var(--jv-space-3) var(--jv-space-4) var(--jv-space-4);
        display: grid;
        gap: var(--jv-space-2);
      }
      .foot .jv-btn {
        width: 100%;
      }
      @container (min-width: 480px) {
        .foot .jv-btn {
          width: auto;
          justify-self: start;
        }
      }
      .result {
        display: grid;
        gap: var(--jv-space-1);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .result p {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .result .lead {
        color: var(--jv-text);
      }
      .result.error .lead {
        color: var(--jv-danger);
      }
      .result ul {
        list-style: disc;
        padding-left: 20px;
      }
      .note {
        padding: 0 var(--jv-space-4) var(--jv-space-2);
      }
      .mono {
        font-family: var(--jv-font-code);
      }
    `],h([$({attribute:!1})],ct.prototype,"hass",2),h([$({attribute:!1})],ct.prototype,"data",2),h([b()],ct.prototype,"_status",2),h([b()],ct.prototype,"_statusError",2),h([b()],ct.prototype,"_loading",2),h([b()],ct.prototype,"_running",2),h([b()],ct.prototype,"_result",2),h([b()],ct.prototype,"_runError",2),ct=h([A("jarvis-suggestions-learning")],ct);var Jm=6e3,Vr=class extends de{constructor(){super(...arguments);this._toast=null;this._toastTimer=null}disconnectedCallback(){super.disconnectedCallback(),this._toastTimer&&clearTimeout(this._toastTimer),this._toastTimer=null}_onToast(e){let t=e.detail;if(!(!t||!t.message)){if(e.stopPropagation(),x("home-assistant")){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:t.message},bubbles:!0,composed:!0}));return}this._toast=t,this._toastTimer&&clearTimeout(this._toastTimer),this._toastTimer=setTimeout(()=>{this._toastTimer=null,this._toast=null},Jm)}}get _suggestions(){if(!this.data)return null;let e=this.data.suggestions;return Array.isArray(e)?e:[]}get _goals(){if(!this.data)return null;let e=this.data.goals;return Array.isArray(e)?e:[]}render(){return c`
      <div class="layout ${this.narrow?"narrow":""}" @jv-toast=${this._onToast}>
        <div class="col">
          <jarvis-suggestions-list .hass=${this.hass} .suggestions=${this._suggestions}></jarvis-suggestions-list>
          <jarvis-suggestions-goals .hass=${this.hass} .goals=${this._goals}></jarvis-suggestions-goals>
        </div>
        <div class="col">
          <jarvis-suggestions-learning .hass=${this.hass} .data=${this.data}></jarvis-suggestions-learning>
          <div class="footer">
            <button type="button" @click=${()=>this.navigate("settings","learning")}>${a("Learning settings")}</button>
          </div>
        </div>
      </div>
      <div class="toast ${this._toast?.tone??""} ${this.narrow?"narrow":""}" role="status" aria-live="polite" aria-atomic="true">
        ${this._toast?c`<div>${this._toast.message}</div>`:m}
      </div>
    `}};Vr.styles=[T,S`
      :host {
        container-type: inline-size;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      /* Two columns when the VIEW (not the viewport) is wide enough and HA
         does not consider the screen narrow. */
      @container (min-width: 900px) {
        .layout:not(.narrow) {
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        }
      }
      .col {
        display: grid;
        gap: var(--jv-space-4);
        min-width: 0;
      }
      .footer {
        padding: var(--jv-space-2) 0 0;
      }
      .footer button {
        appearance: none;
        border: 0;
        background: transparent;
        padding: var(--jv-space-2) 0;
        min-height: var(--jv-tap);
        font: inherit;
        color: var(--jv-accent);
        cursor: pointer;
        text-decoration: underline;
      }
      .toast {
        position: sticky;
        bottom: var(--jv-space-3);
        margin-top: var(--jv-space-4);
        display: flex;
        justify-content: center;
        pointer-events: none;
      }
      .toast > div {
        pointer-events: auto;
        max-width: min(100%, 560px);
        padding: var(--jv-space-3) var(--jv-space-4);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        border: var(--jv-border-width) solid var(--jv-border);
        border-left: 4px solid var(--jv-info);
        box-shadow: var(--jv-shadow);
        overflow-wrap: anywhere;
      }
      /* on narrow the panel's sticky bottom nav (56px + safe area) sits over
         the end of the scroll area; keep the toast above it */
      .toast.narrow {
        bottom: calc(var(--jv-tap) + var(--jv-space-3) + var(--jv-space-4) + env(safe-area-inset-bottom, 0px));
      }
      .toast.ok > div {
        border-left-color: var(--jv-ok);
      }
      .toast.danger > div {
        border-left-color: var(--jv-danger);
      }
    `],h([b()],Vr.prototype,"_toast",2),Vr=h([A("jarvis-view-suggestions")],Vr);var eu=S`
  /* ── layout: knowledge wide on the left, routines + briefings stacked right */
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--jv-space-4);
    align-items: start;
  }
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    }
  }
  .col {
    display: grid;
    gap: var(--jv-space-4);
    min-width: 0;
  }

  /* ── teach form ─────────────────────────────────────────────────── */
  form.teach {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    align-items: flex-end;
    margin: 0 0 var(--jv-space-3);
  }
  form.teach .field {
    flex: 1 1 160px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-1);
  }
  form.teach .field.subject {
    flex: 0 1 150px;
  }
  form.teach label {
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
  form.teach ha-textfield {
    width: 100%;
  }
  form.teach input,
  form.teach select {
    width: 100%;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  form.teach input::placeholder {
    color: var(--jv-text-3);
  }
  form.teach input:disabled,
  form.teach select:disabled {
    opacity: 0.6;
  }
  form.teach .submit {
    flex: 0 0 auto;
  }
  :host([narrow]) form.teach .field,
  :host([narrow]) form.teach .field.subject {
    flex: 1 1 100%;
  }
  :host([narrow]) form.teach .submit {
    flex: 1 1 100%;
    width: 100%;
  }
  @media (max-width: 599px) {
    form.teach .field,
    form.teach .field.subject,
    form.teach .submit {
      flex: 1 1 100%;
      width: 100%;
    }
  }
  .form-msg {
    margin: 0 0 var(--jv-space-3);
    padding: var(--jv-space-2) var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .form-msg.error {
    background: var(--jv-danger-soft);
    color: var(--jv-text);
  }
  .form-msg.ok {
    background: var(--jv-ok-soft);
    color: var(--jv-text);
  }

  /* ── lists ──────────────────────────────────────────────────────── */
  ul,
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .group + .group {
    margin-top: var(--jv-space-4);
  }
  .group-head {
    margin: 0 0 var(--jv-space-1);
    font-size: var(--jv-font-size-xs);
    font-weight: var(--jv-font-weight-medium);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--jv-text-2);
  }
  .fact {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-height: var(--jv-tap);
    padding: var(--jv-space-1) 0;
    border-bottom: 1px solid var(--jv-divider);
  }
  .fact:last-child {
    border-bottom: 0;
  }
  .fact.busy {
    opacity: 0.6;
  }
  .fact .text {
    flex: 1 1 auto;
    min-width: 0;
  }
  .fact .key {
    display: block;
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
  .fact .value {
    display: block;
    overflow-wrap: anywhere;
  }
  .marker {
    flex: none;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    cursor: help;
  }
  .fact ha-icon-button,
  .fact .jv-icon-btn {
    flex: none;
    color: var(--jv-text-2);
    --mdc-icon-button-size: var(--jv-tap);
    --mdc-icon-size: 20px;
  }

  .routine {
    padding: var(--jv-space-2) 0;
    border-bottom: 1px solid var(--jv-divider);
  }
  .routine:last-child {
    border-bottom: 0;
  }
  .routine .desc {
    margin: 0 0 var(--jv-space-1);
    overflow-wrap: anywhere;
  }
  .routine .meta {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    font-variant-numeric: tabular-nums;
  }
  .bar {
    flex: 1 1 auto;
    height: 6px;
    min-width: 40px;
    border-radius: var(--jv-radius-pill);
    background: var(--jv-accent-soft);
    overflow: hidden;
  }
  .bar > span {
    display: block;
    height: 100%;
    background: var(--jv-accent);
    border-radius: inherit;
  }
  .routine .pct {
    flex: none;
    white-space: nowrap;
  }

  .briefing {
    padding: var(--jv-space-3) 0;
    border-bottom: 1px solid var(--jv-divider);
  }
  .briefing:first-child {
    padding-top: 0;
  }
  .briefing:last-child {
    border-bottom: 0;
  }
  .briefing time,
  .briefing .when {
    display: block;
    margin-bottom: var(--jv-space-1);
    font-family: var(--jv-font-code);
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
  }
  .briefing.latest time,
  .briefing.latest .when {
    color: var(--jv-accent-text);
    font-weight: var(--jv-font-weight-medium);
  }
  .briefing p {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  /* ── per-card states ────────────────────────────────────────────── */
  .alert {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2) var(--jv-space-3);
    padding: var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-danger-soft);
    color: var(--jv-text);
  }
  .alert .body {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .alert strong {
    display: block;
    font-weight: var(--jv-font-weight-medium);
  }
  ha-alert {
    display: block;
  }
  .loading {
    display: grid;
    gap: var(--jv-space-2);
    padding: var(--jv-space-2) 0;
  }
  .loading .jv-skeleton {
    height: 36px;
  }
  .loading .jv-skeleton:nth-child(2) {
    width: 80%;
  }
  .loading .jv-skeleton:nth-child(3) {
    width: 60%;
  }
`;function Fs(){return{status:"idle",data:null,error:null}}function Zo(r){return r==="household"?a("Household"):r==="primary"?a("About me"):Os(r)}function Os(r){return String(r||"").replace(/[_\s]+/g," ").trim().split(" ").filter(Boolean).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")||"?"}function tu(r){let i=new Map;for(let e of r){let t=String(e.subject||"household"),n=i.get(t);n?n.push(e):i.set(t,[e])}return[...i.entries()].sort(([e],[t])=>e===t?0:e==="household"?-1:t==="household"?1:e.localeCompare(t))}function nu(r){return Object.keys(r).filter(i=>Array.isArray(r[i])&&r[i].length>0).sort((i,e)=>i.localeCompare(e)).map(i=>[i,[...r[i]].sort((e,t)=>Yr(t.confidence)-Yr(e.confidence))])}function Yr(r){let i=typeof r=="number"?r:Number(r);return Number.isFinite(i)?i:0}function Qo(r){return Math.max(0,Math.min(100,Math.round(Yr(r)*100)))}function ru(r){return r.source!=="stated"||Yr(r.confidence)<.9}function Jo(r){return`${r.source?a(String(r.source)):a("inferred")} · ${Qo(r.confidence)}% ${a("sure")}`}function el(r,i){if(r==null)return"";let e=Yr(r);return e?su(new Date(e*1e3),i):""}function iu(r,i){if(!r)return"";let e=String(r).trim();if(!e)return"";let t=/(Z|[+-]\d{2}:?\d{2})$/i.test(e),n=new Date(t?e:`${e}Z`);return Number.isNaN(n.getTime())?"":su(n,i)}function su(r,i){try{return r.toLocaleString(i||void 0)}catch{return r.toLocaleString()}}function au(r){let i=Yr(r);return i?`×${i}`:"×?"}function Xr(r){if(r&&typeof r=="object"){let i=r;if(typeof i.message=="string"&&i.message)return i.message;if(typeof i.code=="string"&&i.code)return i.code}return r?String(r):""}var ef=["ha-card","ha-icon","ha-icon-button","ha-textfield","ha-alert"],tf=10,qe=class extends de{constructor(){super(...arguments);this._facts=Fs();this._routines=Fs();this._briefings=Fs();this._teachKey="";this._teachValue="";this._teachSubject="household";this._teachPending=!1;this._teachError=null;this._teachNotice=null;this._forgetting=new Set;this._forgetError=null;this._started=!1;this._noticeTimer=null}connectedCallback(){super.connectedCallback(),P(this,ef)}disconnectedCallback(){super.disconnectedCallback(),this._noticeTimer&&clearTimeout(this._noticeTimer)}updated(e){super.updated(e),e.has("narrow")&&this.toggleAttribute("narrow",this.narrow),!this._started&&this.hass&&(this._started=!0,this._loadAll())}_loadAll(){return Promise.all([this._loadFacts(),this._loadRoutines(),this._loadBriefings()]).then(()=>{})}async _loadFacts(){this._facts={status:"loading",data:this._facts.data,error:null};try{let e=await this.ws("jarvis/get_knowledge");this._facts={status:"loaded",data:Array.isArray(e?.facts)?e.facts:[],error:null}}catch(e){this._facts={status:"error",data:this._facts.data,error:Xr(e)}}}async _loadRoutines(){this._routines={status:"loading",data:this._routines.data,error:null};try{let e=await this.ws("jarvis/get_person_routines"),t=e?.routines&&typeof e.routines=="object"?e.routines:{};this._routines={status:"loaded",data:t,error:null}}catch(e){this._routines={status:"error",data:this._routines.data,error:Xr(e)}}}async _loadBriefings(){this._briefings={status:"loading",data:this._briefings.data,error:null};try{let e=await this.ws("jarvis/briefings",{limit:tf});this._briefings={status:"loaded",data:Array.isArray(e?.briefings)?e.briefings:[],error:null}}catch(e){this._briefings={status:"error",data:this._briefings.data,error:Xr(e)}}}_applyFacts(e){Array.isArray(e)&&(this._facts={status:"loaded",data:e,error:null})}get _canTeach(){return!this._teachPending&&!!this._teachKey.trim()&&!!this._teachValue.trim()}async _teach(e){if(e?.preventDefault(),!this._canTeach)return;let t=this._teachKey.trim(),n=this._teachValue.trim(),s=this._teachSubject;this._teachPending=!0,this._teachError=null,this._setNotice(null);try{let o=await this.ws("jarvis/add_knowledge",{key:t,value:n,subject:s,kind:s==="primary"?"preference":"fact"});this._applyFacts(o?.facts),o?.ok?(this._teachKey="",this._teachValue="",this._setNotice(a("Got it - JARVIS will remember that.")),this.refresh(),await this.updateComplete,this.renderRoot.querySelector("#teach-key")?.focus()):this._teachError=a("Couldn't save that fact")}catch(o){let l=Xr(o);this._teachError=l?`${a("Couldn't save that fact")} — ${l}`:a("Couldn't save that fact")}finally{this._teachPending=!1}}async _forget(e){if(!(this._forgetting.has(e.id)||!await U({heading:a("Forget this fact?"),message:`${e.key}: ${e.value}`,confirmLabel:a("Forget"),destructive:!0}))){this._forgetting=new Set([...this._forgetting,e.id]),this._forgetError=null;try{let n=await this.ws("jarvis/forget_knowledge",{fact_id:e.id});this._applyFacts(n?.facts),this.refresh()}catch(n){let s=Xr(n);this._forgetError=s?`${a("Couldn't forget that")} — ${s}`:a("Couldn't forget that")}finally{let n=new Set(this._forgetting);n.delete(e.id),this._forgetting=n}}}_setNotice(e){this._noticeTimer&&clearTimeout(this._noticeTimer),this._noticeTimer=null,this._teachNotice=e,e&&(this._noticeTimer=setTimeout(()=>{this._teachNotice=null,this._noticeTimer=null},4e3))}_onTeachKeydown(e){e.key==="Enter"&&!e.isComposing&&(e.preventDefault(),this._teach())}_locale(){return this.hass?.locale?.language||this.hass?.language||void 0}_loading(){return c`
      <div class="loading" role="status" aria-live="polite" aria-label=${a("Loading...")}>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
      </div>
    `}_error(e,t,n){let s=c`<button class="jv-btn" type="button" slot="action" @click=${n}>${a("Retry")}</button>`;return x("ha-alert")?c`<ha-alert alert-type="error" .title=${e}>${t||""}${s}</ha-alert>`:c`
      <div class="alert" role="alert">
        <div class="body"><strong>${e}</strong><span>${t||""}</span></div>
        ${s}
      </div>
    `}_empty(e,t){return c`<jv-empty compact .icon=${t} .message=${e}></jv-empty>`}_icon(e,t){return x("ha-icon")?c`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:c`<span aria-hidden="true">${t}</span>`}_renderKnowledge(){let e=this._facts,t=e.data??[],n=t.length,s=e.status==="loaded"||e.data?c`<jv-state-badge slot="actions" level="accent" nodot .label=${`${n} ${a(n===1?"fact":"facts")}`}></jv-state-badge>`:m;return c`
      <jv-section
        icon="mdi:brain"
        .heading=${a("What JARVIS Knows")}
        .subheading=${a("Durable facts & preferences JARVIS recalls in conversation. Teach it something, or forget anything with ✕.")}
        ?loading=${e.status==="loading"&&!!e.data}
      >
        ${s}
        ${this._renderTeachForm()}
        ${this._forgetError?c`<p class="form-msg error" role="alert">${this._forgetError}</p>`:m}
        ${e.status==="error"?this._error(a("Couldn't load memory"),e.error,()=>{this._loadFacts()}):e.status==="loaded"||e.data?n===0?this._empty(a('Nothing yet. Say "remember that…" to JARVIS, or teach it above.'),"mdi:brain"):this._renderFactGroups(t):this._loading()}
      </jv-section>
    `}_renderTeachForm(){let e=this._teachPending,t=a("what  (e.g. trash day)"),n=a("is  (e.g. Tuesday)"),s=(o,l,d,u)=>x("ha-textfield")?c`<ha-textfield
            id=${o}
            .label=${l}
            .value=${d}
            .disabled=${e}
            autocomplete="off"
            @input=${p=>u(p.target.value)}
            @keydown=${this._onTeachKeydown}
          ></ha-textfield>`:c`<label class="visually-hidden" for=${o}>${l}</label>
            <input
              id=${o}
              type="text"
              autocomplete="off"
              placeholder=${l}
              .value=${d}
              ?disabled=${e}
              @input=${p=>u(p.target.value)}
              @keydown=${this._onTeachKeydown}
            />`;return c`
      <form class="teach" @submit=${this._teach} aria-label=${a("Teach")}>
        <div class="field">${s("teach-key",t,this._teachKey,o=>this._teachKey=o)}</div>
        <div class="field">${s("teach-value",n,this._teachValue,o=>this._teachValue=o)}</div>
        <div class="field subject">
          <label for="teach-subject">${a("Subject")}</label>
          <select
            id="teach-subject"
            .value=${this._teachSubject}
            ?disabled=${e}
            @change=${o=>this._teachSubject=o.target.value==="primary"?"primary":"household"}
          >
            <option value="household" ?selected=${this._teachSubject==="household"}>${a("Household")}</option>
            <option value="primary" ?selected=${this._teachSubject==="primary"}>${a("About me")}</option>
          </select>
        </div>
        <button class="jv-btn primary submit" type="submit" ?disabled=${!this._canTeach}>${a("Teach")}</button>
      </form>
      ${this._teachError?c`<p class="form-msg error" role="alert">${this._teachError}</p>`:m}
      ${this._teachNotice?c`<p class="form-msg ok" role="status" aria-live="polite">${this._teachNotice}</p>`:m}
    `}_renderFactGroups(e){let t=this._locale();return c`
      ${tu(e).map(([n,s])=>c`
          <section class="group" aria-label=${Zo(n)}>
            <h3 class="group-head">${Zo(n)}</h3>
            <ul>
              ${s.map(o=>this._renderFact(o,t))}
            </ul>
          </section>
        `)}
    `}_renderFact(e,t){let n=this._forgetting.has(e.id),s=a("Forget"),o=a("Forget this"),l=()=>{this._forget(e)},d=el(e.updated_at,t);return c`
      <li class="fact ${n?"busy":""}">
        <div class="text">
          <span class="key">${e.key}</span>
          <span class="value" title=${d}>${e.value}</span>
        </div>
        ${ru(e)?c`<span class="marker" role="img" title=${Jo(e)} aria-label=${Jo(e)}>~</span>`:m}
        ${e.expires_at!==null&&e.expires_at!==void 0?c`<span class="marker" role="img" title=${`${a("expires")} ${el(e.expires_at,t)}`} aria-label=${a("expires")}>⌛</span>`:m}
        ${x("ha-icon-button")?c`<ha-icon-button .label=${s} title=${o} .disabled=${n} @click=${l}>
              ${this._icon("mdi:close","✕")}
            </ha-icon-button>`:c`<button class="jv-icon-btn" type="button" aria-label=${s} title=${o} ?disabled=${n} @click=${l}>
              ${this._icon("mdi:close","✕")}
            </button>`}
      </li>
    `}_renderRoutines(){let e=this._routines,t=e.data?nu(e.data):[];return c`
      <jv-section
        icon="mdi:account-clock-outline"
        .heading=${a("Person Routines")}
        .subheading=${a("Habits JARVIS has confidently attributed to one person, from 30 days of sole-occupant activity — separate from household-wide facts above.")}
        ?loading=${e.status==="loading"&&!!e.data}
      >
        <jv-state-badge slot="actions" level="info" nodot .label=${a("Learned")}></jv-state-badge>
        ${e.status==="error"?this._error(a("Couldn't load routines"),e.error,()=>{this._loadRoutines()}):e.status==="loaded"||e.data?t.length===0?this._empty(a("Nothing person-specific learned yet — JARVIS needs a few weeks of sole-occupant data before routines are confidently individual."),"mdi:account-clock-outline"):t.map(([n,s])=>c`
                    <section class="group" aria-label=${Os(n)}>
                      <h3 class="group-head">${Os(n)}</h3>
                      <ul>
                        ${s.map(o=>this._renderRoutine(o))}
                      </ul>
                    </section>
                  `):this._loading()}
      </jv-section>
    `}_renderRoutine(e){let t=Qo(e.confidence);return c`
      <li class="routine">
        <p class="desc">${e.description||e.pattern_type||"—"}</p>
        <div class="meta">
          <div class="bar" role="img" aria-label=${`${t}%`}><span style=${`width:${t}%`}></span></div>
          <span class="pct">${t}% · ${au(e.occurrences)}</span>
        </div>
      </li>
    `}_renderBriefings(){let e=this._briefings,t=e.data??[],n=this._locale();return c`
      <jv-section
        icon="mdi:newspaper-variant-outline"
        .heading=${a("Recent Briefings")}
        .subheading=${a("The full briefings JARVIS delivered — read here when a phone notification truncated a long one.")}
        ?loading=${e.status==="loading"&&!!e.data}
      >
        <jv-state-badge slot="actions" level="neutral" nodot .label=${a("Full text")}></jv-state-badge>
        ${e.status==="error"?this._error(a("Couldn't load briefings"),e.error,()=>{this._loadBriefings()}):e.status==="loaded"||e.data?t.length===0?this._empty(a("No briefings yet — they appear here once JARVIS has delivered one."),"mdi:newspaper-variant-outline"):c`<ol>
                  ${t.map((s,o)=>{let l=iu(s.timestamp,n),d=o===0?l?`${l} · ${a("latest")}`:a("latest"):l;return c`
                      <li class="briefing ${o===0?"latest":""}">
                        ${d?c`<span class="when">${d}</span>`:m}
                        <p>${String(s.text??"")}</p>
                      </li>
                    `})}
                </ol>`:this._loading()}
      </jv-section>
    `}render(){return c`
      <div class="layout">
        <div class="col">${this._renderKnowledge()}</div>
        <div class="col">${this._renderRoutines()} ${this._renderBriefings()}</div>
      </div>
    `}};qe.styles=[T,eu],h([b()],qe.prototype,"_facts",2),h([b()],qe.prototype,"_routines",2),h([b()],qe.prototype,"_briefings",2),h([b()],qe.prototype,"_teachKey",2),h([b()],qe.prototype,"_teachValue",2),h([b()],qe.prototype,"_teachSubject",2),h([b()],qe.prototype,"_teachPending",2),h([b()],qe.prototype,"_teachError",2),h([b()],qe.prototype,"_teachNotice",2),h([b()],qe.prototype,"_forgetting",2),h([b()],qe.prototype,"_forgetError",2),qe=h([A("jarvis-view-memory")],qe);var nf=[".pdf",".txt",".md"],ou=3e6;function ge(r){let i=typeof r=="number"?r:Number(r);return Number.isFinite(i)?i:0}function lu(r){let i=/\.[^./\\]+$/.exec(String(r||""));return i?i[0].toLowerCase():""}function tl(r){return nf.includes(lu(r))}function rf(r){let i=String(r||"").replace(/\\/g,"/").trim(),t=i.slice(i.lastIndexOf("/")+1).replace(/[^A-Za-z0-9._ \-()]/g,"_").replace(/^[. ]+|[. ]+$/g,"");return!t||t==="."||t===".."||!tl(t)?null:t.slice(0,180)}function cu(r){return rf(r)!==r}function du(r){switch(lu(r)){case".pdf":return"mdi:file-pdf-box";case".md":return"mdi:language-markdown";default:return"mdi:file-document-outline"}}function sf(r){return(Array.isArray(r)?r:[]).filter(e=>e&&typeof e=="object"&&typeof e.source=="string").map(e=>({source:e.source,chunks:ge(e.chunks)})).sort((e,t)=>e.source.localeCompare(t.source))}function uu(r){let i=r&&typeof r=="object"?r:{};return{chroma:!!i.chroma,fts:!!i.fts,directory:typeof i.directory=="string"?i.directory:"",chunk_count:ge(i.chunk_count),sources:sf(i.sources)}}function pu(r){let i=r&&typeof r=="object"?r:{};return{enabled:!!i.enabled,ollama_configured:!!i.ollama_configured,vector_count:ge(i.vector_count),base:typeof i.base=="string"?i.base:"",model:typeof i.model=="string"?i.model:""}}function hu(r){return r.chroma?a("Vector index (ChromaDB)"):r.fts?a("Keyword index"):a("No index")}function vu(r){let i=ge(r);return i===1?a("1 chunk"):a("{count} chunks",{count:i})}function Ns(r){return Math.max(0,Math.min(100,Math.round(ge(r)*100)))}function Fi(r){let i="",e="";if(r&&typeof r=="object"){let t=r;i=t.code===void 0||t.code===null?"":String(t.code),e=typeof t.message=="string"?t.message:t.message===void 0||t.message===null?"":String(t.message)}else r!=null&&(e=String(r));return e=e.trim(),i==="3"||!e||/^\d+$/.test(e)}function qn(r){if(Fi(r))return a("the connection was interrupted");let i=r;return typeof i.message=="string"?i.message.trim():String(r)}function mu(r,i){if(typeof r!="string")return"";let e=r.trim();if(!e)return"";let t=e.endsWith("Z")||/[+-]\d\d:\d\d$/.test(e),n=new Date(t?e:`${e}Z`);if(Number.isNaN(n.getTime()))return"";try{return n.toLocaleString(i||void 0)}catch{return n.toLocaleString()}}function fu(r){return r==="pgvector"||r==="chromadb"}async function gu(r){if(typeof FileReader<"u"){let n=await new Promise(s=>{try{let o=new FileReader;o.onload=()=>{let l=typeof o.result=="string"?o.result:"",d=l.indexOf(",");s(d>=0?l.slice(d+1):null)},o.onerror=()=>s(null),o.readAsDataURL(r)}catch{s(null)}});if(n!==null)return n}let i=new Uint8Array(await r.arrayBuffer()),e="",t=32768;for(let n=0;n<i.length;n+=t)e+=String.fromCharCode(...i.subarray(n,n+t));return btoa(e)}function bu(r){return r?r.length>280?!0:r.split(`
`).length>4:!1}var fr=class extends L{constructor(){super(...arguments);this.text="";this._expanded=!1}render(){let e=bu(this.text),t=e&&!this._expanded;return c`
      <p class=${t?"clamped":""}>${this.text}</p>
      ${e?c`<button
            class="toggle jv-hit"
            type="button"
            aria-expanded=${this._expanded?"true":"false"}
            @click=${()=>this._expanded=!this._expanded}
          >
            ${this._expanded?a("Show less"):a("Show more")}
          </button>`:m}
    `}};fr.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      p {
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      p.clamped {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 4;
        line-clamp: 4;
        overflow: hidden;
      }
      .toggle {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin-top: var(--jv-space-1);
        color: var(--jv-accent-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        cursor: pointer;
      }
    `],h([$({type:String})],fr.prototype,"text",2),h([b()],fr.prototype,"_expanded",2),fr=h([A("jarvis-docs-clamp")],fr);var Zr=S`
  ul,
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  code,
  .tech {
    font-family: var(--jv-font-code);
    font-size: 0.95em;
    overflow-wrap: anywhere;
  }
  .caption {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .hint {
    margin: var(--jv-space-3) 0 0;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  /* text links are buttons (keyboard operable) in the accent text colour */
  .link {
    appearance: none;
    display: inline;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    color: var(--jv-accent-text);
    font: inherit;
    font-weight: var(--jv-font-weight-medium);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  /* hover keeps the AA text colour (raw --jv-accent is 2.63:1 in HA light) */
  .link:hover {
    text-decoration-thickness: 2px;
  }

  /* ── the shared query form ─────────────────────────────────────── */
  form.query {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    align-items: center;
  }
  form.query .field {
    flex: 1 1 180px;
    min-width: 0;
  }
  form.query ha-textfield {
    width: 100%;
  }
  form.query input {
    width: 100%;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  form.query input::placeholder {
    color: var(--jv-text-3);
  }
  form.query input:disabled {
    opacity: 0.6;
  }
  form.query .clear {
    flex: none;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-xl);
  }
  form.query .submit {
    flex: none;
  }
  @media (max-width: 599px) {
    form.query .field {
      flex: 1 1 100%;
    }
    form.query .submit {
      flex: 1 1 auto;
    }
  }

  /* ── results ───────────────────────────────────────────────────── */
  .results-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    margin: var(--jv-space-3) 0 var(--jv-space-2);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .hit {
    padding: var(--jv-space-3) 0;
    border-top: 1px solid var(--jv-divider);
  }
  .hit .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--jv-space-1) var(--jv-space-2);
    margin-bottom: var(--jv-space-1);
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
  .hit .meta .source,
  .hit .meta .role {
    color: var(--jv-text);
    font-weight: var(--jv-font-weight-medium);
    overflow-wrap: anywhere;
  }
  .hit .meta .score {
    color: var(--jv-accent-text);
    font-variant-numeric: tabular-nums;
  }
  .hit .meta .chunk,
  .hit .meta .when {
    font-family: var(--jv-font-code);
    font-variant-numeric: tabular-nums;
  }

  /* ── alert fallback (when ha-alert is not defined) ─────────────── */
  ha-alert {
    display: block;
  }
  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--jv-space-2);
    padding: var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-info-soft);
    color: var(--jv-text);
    border-left: 4px solid var(--jv-info);
    overflow-wrap: anywhere;
  }
  .alert.success {
    background: var(--jv-ok-soft);
    border-left-color: var(--jv-ok);
  }
  .alert.warning {
    background: var(--jv-warn-soft);
    border-left-color: var(--jv-warn);
  }
  .alert.error {
    background: var(--jv-danger-soft);
    border-left-color: var(--jv-danger);
  }
  .alert-icon {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--jv-info);
    color: var(--jv-on-accent);
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-bold);
  }
  /* ok/warn fills are too light for a white glyph (1.96:1 / 3.3:1 in HA
     light): ring in the state colour on the surface, glyph in --jv-text */
  .alert.success .alert-icon,
  .alert.warning .alert-icon {
    background: var(--jv-surface);
    color: var(--jv-text);
    box-shadow: inset 0 0 0 2px var(--_ring);
  }
  .alert.success .alert-icon {
    --_ring: var(--jv-ok);
  }
  .alert.warning .alert-icon {
    --_ring: var(--jv-warn);
  }
  .alert.error .alert-icon {
    background: var(--jv-danger);
    color: var(--jv-on-danger);
  }
  .alert-body {
    flex: 1 1 auto;
    min-width: 0;
    padding-top: 1px;
  }
  .alert-body strong {
    display: block;
    font-weight: var(--jv-font-weight-medium);
  }
  .alert-body p {
    margin: 0;
  }
  .alert-body p + p {
    margin-top: var(--jv-space-1);
  }
  .alert .jv-btn {
    flex: none;
    align-self: center;
  }
  .alert-dismiss {
    flex: none;
    margin: calc(-1 * var(--jv-space-2)) calc(-1 * var(--jv-space-2)) calc(-1 * var(--jv-space-2)) 0;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-xl);
  }
  .alert-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin-top: var(--jv-space-2);
  }
  details.problems {
    margin-top: var(--jv-space-2);
  }
  details.problems summary {
    cursor: pointer;
    min-height: var(--jv-tap);
    display: flex;
    align-items: center;
    font-weight: var(--jv-font-weight-medium);
  }
  details.problems ul {
    margin: var(--jv-space-1) 0 0;
    padding-left: var(--jv-space-4);
    list-style: disc;
    font-family: var(--jv-font-code);
    font-size: var(--jv-font-size-s);
  }
  details.problems li {
    overflow-wrap: anywhere;
  }

  /* ── loading skeleton ──────────────────────────────────────────── */
  .loading {
    display: grid;
    gap: var(--jv-space-2);
    padding: var(--jv-space-2) 0;
  }
  .loading .jv-skeleton {
    height: 32px;
  }
  .loading .jv-skeleton:nth-child(2) {
    width: 80%;
  }
  .loading .jv-skeleton:nth-child(3) {
    width: 60%;
  }
`,yu=S`
  /* flush card: content gets its own 16 px gutter */
  .gut {
    padding: 0 var(--jv-space-4);
  }
  .intro {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .footer {
    margin: 0;
    padding: var(--jv-space-3) var(--jv-space-4) var(--jv-space-4);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }

  /* drag-and-drop highlight on the whole card */
  jv-section.library {
    border-radius: var(--jv-radius);
    outline: 2px dashed transparent;
    outline-offset: -2px;
    transition: outline-color var(--jv-ease);
  }
  jv-section.library.drag {
    outline-color: var(--jv-accent);
    background: var(--jv-accent-soft);
  }

  /* ── toolbar ───────────────────────────────────────────────────── */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    margin-bottom: var(--jv-space-3);
  }
  .toolbar .jv-btn {
    flex: none;
  }
  .toolbar .link {
    margin-left: var(--jv-space-1);
  }
  @media (max-width: 599px) {
    .toolbar .jv-btn {
      flex: 1 1 100%;
      width: 100%;
    }
    .toolbar .link {
      margin: 0;
      min-height: var(--jv-tap);
      display: inline-flex;
      align-items: center;
    }
  }
  .banner {
    margin-bottom: var(--jv-space-3);
  }
  .banner:empty {
    display: none;
  }

  /* ── document rows ─────────────────────────────────────────────── */
  .row {
    display: flex;
    align-items: center;
    gap: var(--jv-space-3);
    min-height: var(--jv-tap);
    padding: var(--jv-space-1) var(--jv-space-2) var(--jv-space-1) var(--jv-space-4);
    border-top: 1px solid var(--jv-divider);
  }
  .row.busy {
    opacity: 0.6;
  }
  .row .ficon {
    flex: none;
    color: var(--jv-text-2);
    --mdc-icon-size: 22px;
  }
  .row .name {
    flex: 1 1 auto;
    min-width: 0;
  }
  .row .chunks {
    flex: none;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    white-space: nowrap;
  }
  .row ha-icon-button,
  .row .jv-icon-btn {
    flex: none;
    color: var(--jv-text-2);
    --mdc-icon-button-size: var(--jv-tap);
    --mdc-icon-size: 20px;
  }
  @media (max-width: 599px) {
    .row {
      flex-wrap: wrap;
      row-gap: 0;
      padding-top: var(--jv-space-2);
    }
    .row .name {
      flex: 1 1 calc(100% - 22px - var(--jv-space-3));
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      overflow-wrap: anywhere;
    }
    .row .chunks {
      flex: 1 1 auto;
      margin-left: calc(22px + var(--jv-space-3));
    }
  }
  .list-state {
    padding: 0 var(--jv-space-4);
  }

  /* ── engine card ───────────────────────────────────────────────── */
  .engine-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2);
    margin-bottom: var(--jv-space-2);
  }
  .engine-line {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .engine-line .jv-btn {
    margin-top: var(--jv-space-2);
  }
  .kv-value {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: baseline;
    gap: var(--jv-space-2);
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .kv-value .link {
    font-family: var(--jv-font);
    font-size: var(--jv-font-size-s);
    white-space: nowrap;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin: var(--jv-space-3) 0;
  }
  @media (max-width: 599px) {
    .buttons .jv-btn {
      flex: 1 1 100%;
      width: 100%;
    }
  }
  .probe:empty {
    display: none;
  }
`;function af(r){switch(r){case"success":return"✓";case"warning":return"!";case"error":return"×";default:return"i"}}function Ot(r){let i=r.action?c`<button class="jv-btn" type="button" slot="action" @click=${r.action.run}>${r.action.label}</button>`:m;if(x("ha-alert"))return c`
      <ha-alert
        alert-type=${r.tone}
        .title=${r.title??""}
        ?dismissable=${!!r.onDismiss}
        @alert-dismissed-clicked=${()=>r.onDismiss?.()}
      >
        ${r.body??m}${r.extra??m}${i}
      </ha-alert>
    `;let e=r.tone==="error"||r.tone==="warning"?"alert":"status";return c`
    <div class="alert ${r.tone}" role=${e}>
      <span class="alert-icon" aria-hidden="true">${af(r.tone)}</span>
      <div class="alert-body">
        ${r.title?c`<strong>${r.title}</strong>`:m}
        ${r.body!==void 0&&r.body!==null?c`<div>${r.body}</div>`:m}
        ${r.extra??m}
      </div>
      ${i}
      ${r.onDismiss?c`<button class="jv-icon-btn alert-dismiss" type="button" aria-label=${a("Dismiss")} @click=${r.onDismiss}>
            <span aria-hidden="true">×</span>
          </button>`:m}
    </div>
  `}function Is(r){let i=!r.value.trim(),e=o=>{o.key==="Enter"&&!o.isComposing?(o.preventDefault(),r.onSubmit()):o.key==="Escape"&&(r.value||r.hasResults)&&(o.preventDefault(),r.onClear())},t=o=>{let l=o.target.value??"";r.onInput(l),!l&&r.hasResults&&r.onClear()},n=x("ha-textfield")?c`<ha-textfield
        id=${r.id}
        type="search"
        .label=${r.label}
        .placeholder=${r.placeholder}
        .value=${r.value}
        .disabled=${r.disabled}
        .readOnly=${r.pending}
        autocomplete="off"
        @input=${t}
        @keydown=${e}
      ></ha-textfield>`:c`<label class="visually-hidden" for=${r.id}>${r.label}</label>
        <input
          id=${r.id}
          type="search"
          autocomplete="off"
          placeholder=${r.placeholder}
          .value=${r.value}
          ?disabled=${r.disabled}
          ?readonly=${r.pending}
          @input=${t}
          @keydown=${e}
        />`,s=(!!r.value||r.hasResults)&&!r.pending;return c`
    <form
      class="query"
      @submit=${o=>{o.preventDefault(),i?r.onClear():r.onSubmit()}}
    >
      <div class="field">${n}</div>
      ${s?c`<button class="jv-icon-btn clear" type="button" aria-label=${a("Clear")} ?disabled=${r.disabled} @click=${r.onClear}>
            <span aria-hidden="true">×</span>
          </button>`:m}
      <button class="jv-btn primary submit" type="submit" ?disabled=${i||r.pending||r.disabled}>
        ${r.pending?a("Searching…"):a("Search")}
      </button>
    </form>
  `}var wt=class extends L{constructor(){super(...arguments);this.libraryEmpty=null;this._query="";this._pending=!1;this._results=null;this._lastQuery="";this._error=null}connectedCallback(){super.connectedCallback(),P(this,["ha-textfield","ha-alert","ha-icon"])}async _search(){let e=this._query.trim();if(!(!e||this._pending)){this._pending=!0,this._error=null;try{let t=await X(this.hass,"jarvis/documents",{action:"search",query:e});this._results=Array.isArray(t?.results)?t.results:[],this._lastQuery=e}catch(t){this._error=qn(t)}finally{this._pending=!1}}}_clear(){this._query="",this._results=null,this._lastQuery="",this._error=null}_renderHit(e){let n=e.engine==="semantic"&&e.score!==null&&e.score!==void 0&&ge(e.score)>0,s=e.chunk===null||e.chunk===void 0||e.chunk===""?null:ge(e.chunk);return c`
      <li class="hit">
        <div class="meta">
          <span class="source">${String(e.source??"")}</span>
          ${n?c`<span class="score">${a("{pct}% match",{pct:Ns(e.score)})}</span>`:m}
          ${s!==null?c`<span class="chunk">${a("chunk {n}",{n:s})}</span>`:m}
        </div>
        <jarvis-docs-clamp .text=${String(e.text??"")}></jarvis-docs-clamp>
      </li>
    `}_renderBody(){if(this._error!==null)return Ot({tone:"error",body:a("Search failed — {message}",{message:this._error}),action:{label:a("Retry"),run:()=>{this._search()}}});if(this._results===null)return c`<p class="hint">
        ${this.libraryEmpty?a("Add a document first."):a("Type a question to see which passages JARVIS would use.")}
      </p>`;let e=this._results.length,t=e===1?a("1 result for “{query}”",{query:this._lastQuery}):a("{count} results for “{query}”",{count:e,query:this._lastQuery}),n=this._results[0],s=e>0&&n?n.engine==="semantic"?c`<jv-state-badge level="accent" nodot .label=${a("Semantic")}></jv-state-badge>`:c`<jv-state-badge level="neutral" nodot .label=${a("Keyword")}></jv-state-badge>`:m;return c`
      <div class="results-head" role="status" aria-live="polite"><span>${t}</span>${s}</div>
      ${e===0?c`<jv-empty compact icon="mdi:text-search" .heading=${a("No matches")} .message=${a("Try different words, or index more documents.")}></jv-empty>`:c`<ul>
            ${this._results.map(o=>this._renderHit(o))}
          </ul>`}
    `}render(){return c`
      <jv-section icon="mdi:text-search" .heading=${a("Search documents")} .subheading=${a("The same retrieval JARVIS uses when you ask it a question.")} ?loading=${this._pending}>
        ${Is({id:"doc-query",label:a("Search documents"),placeholder:a("e.g. furnace filter size"),value:this._query,pending:this._pending,disabled:this.libraryEmpty===!0,hasResults:this._results!==null,onInput:e=>this._query=e,onSubmit:()=>{this._search()},onClear:()=>this._clear()})}
        ${this._renderBody()}
      </jv-section>
    `}};wt.styles=[T,Zr],h([$({attribute:!1})],wt.prototype,"hass",2),h([$({attribute:!1})],wt.prototype,"libraryEmpty",2),h([b()],wt.prototype,"_query",2),h([b()],wt.prototype,"_pending",2),h([b()],wt.prototype,"_results",2),h([b()],wt.prototype,"_lastQuery",2),h([b()],wt.prototype,"_error",2),wt=h([A("jarvis-docs-search")],wt);function Wn(r){return{code:r==null?"":String(r)}}function of(r){return!!r&&typeof r=="object"&&"strings"in r&&"values"in r}function sn(r,i){let e={},t=new Map;for(let[p,v]of Object.entries(i))typeof v=="string"||typeof v=="number"?e[p]=v:t.set(p,v);let n={};for(let p of t.keys())n[p]=`\0${p}\0`;let s=a(r,{...e,...n}),o=[],l=/\u0000([A-Za-z0-9_]+)\u0000/g,d=0,u;for(;u=l.exec(s);){u.index>d&&o.push(s.slice(d,u.index));let p=t.get(u[1]);of(p)?o.push(p):p&&o.push(c`<code class="tech">${p.code}</code>`),d=u.index+u[0].length}return d<s.length&&o.push(s.slice(d)),c`${o}`}var lf=8,$t=class extends L{constructor(){super(...arguments);this.stats=void 0;this._query="";this._pending=!1;this._results=null;this._lastQuery="";this._error=null}connectedCallback(){super.connectedCallback(),P(this,["ha-textfield","ha-alert","ha-icon"])}get _available(){let e=this.stats;if(!e)return!1;let t=typeof e.backend=="string"?e.backend:"";return t==="none"||t==="unavailable"?!1:ge(e.total_memories)>0}async _search(){let e=this._query.trim();if(!(!e||this._pending)){this._pending=!0,this._error=null;try{let t=await X(this.hass,"jarvis/search_memory",{query:e,k:lf});this._results=Array.isArray(t?.results)?t.results:[],this._lastQuery=e}catch(t){this._error=qn(t)}finally{this._pending=!1}}}_clear(){this._query="",this._results=null,this._lastQuery="",this._error=null}_goMemory(){let e={view:"memory"};this.dispatchEvent(new CustomEvent("jarvis-navigate",{bubbles:!0,composed:!0,detail:e}))}_locale(){return this.hass?.locale?.language||this.hass?.language||void 0}_renderHit(e,t,n){let s=e.role==="user"?a("You"):e.role==="assistant"?a("JARVIS"):"",o=mu(e.timestamp,n),l=t&&ge(e.score)>0;return c`
      <li class="hit">
        <div class="meta">
          ${s?c`<span class="role">${s}</span>`:m}
          ${o?c`<span class="when">${o}</span>`:m}
          ${l?c`<span class="score">${a("{pct}% match",{pct:Ns(e.score)})}</span>`:m}
        </div>
        <jarvis-docs-clamp .text=${String(e.text??"")}></jarvis-docs-clamp>
      </li>
    `}_renderBody(){if(this._error!==null)return Ot({tone:"error",body:a("Search failed — {message}",{message:this._error}),action:{label:a("Retry"),run:()=>{this._search()}}});if(this._results===null)return c``;let e=this._results.length,t=e===1?a("1 result for “{query}”",{query:this._lastQuery}):a("{count} results for “{query}”",{count:e,query:this._lastQuery}),n=fu(this.stats?.backend),s=this._locale();return c`
      <div class="results-head" role="status" aria-live="polite"><span>${t}</span></div>
      ${e===0?c`<jv-empty compact icon="mdi:brain" .message=${a("No matching conversations.")}></jv-empty>`:c`<ul>
            ${this._results.map(o=>this._renderHit(o,n,s))}
          </ul>`}
    `}render(){let e=this.stats===void 0,t=this.stats,n=!e&&t?a("{count} memories · {backend}",{count:ge(t.total_memories),backend:String(t.backend??"—")}):"",s=c`<button class="link jv-hit" type="button" @click=${this._goMemory}>${a("Memory")}</button>`;return c`
      <jv-section icon="mdi:brain" .heading=${a("Conversation memory")} .subheading=${n} ?loading=${e||this._pending}>
        ${e?c`<div class="loading" role="status" aria-live="polite" aria-label=${a("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`:this._available?c`
                <p class="caption">${sn("Searches what was said in past conversations. The facts JARVIS has been taught live on the {memory} page.",{memory:s})}</p>
                ${Is({id:"memory-query",label:a("Search conversations"),placeholder:a("e.g. when did we buy the dishwasher"),value:this._query,pending:this._pending,disabled:!1,hasResults:this._results!==null,onInput:o=>this._query=o,onSubmit:()=>{this._search()},onClear:()=>this._clear()})}
                ${this._renderBody()}
              `:c`<jv-empty
                compact
                icon="mdi:brain"
                .heading=${a("No conversation memory yet")}
                .message=${a("JARVIS stores conversations once a memory backend is available; see Settings → Learning.")}
              ></jv-empty>`}
      </jv-section>
    `}};$t.styles=[T,Zr],h([$({attribute:!1})],$t.prototype,"hass",2),h([$({attribute:!1})],$t.prototype,"stats",2),h([b()],$t.prototype,"_query",2),h([b()],$t.prototype,"_pending",2),h([b()],$t.prototype,"_results",2),h([b()],$t.prototype,"_lastQuery",2),h([b()],$t.prototype,"_error",2),$t=h([A("jarvis-docs-memory")],$t);function nl(){return{status:"idle",data:null,error:null}}var cf=["ha-card","ha-icon","ha-icon-button","ha-alert","ha-textfield"],dt=class extends de{constructor(){super(...arguments);this._status=nl();this._engine=nl();this._busy=null;this._uploadProgress=null;this._deleting=new Set;this._banner=null;this._probe=null;this._dragOver=!1;this._started=!1;this._connectionLost=!1;this._onVisibility=()=>{document.visibilityState==="visible"&&this.hass&&this._started&&!this._busy&&this._loadAll()}}connectedCallback(){super.connectedCallback(),P(this,cf),document.addEventListener("visibilitychange",this._onVisibility),this._started&&this.hass&&this._loadAll()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this._onVisibility)}updated(e){super.updated(e),this.hass&&(this._started?e.has("hass")&&this._connectionLost&&(this._connectionLost=!1,this._loadAll()):(this._started=!0,this._loadAll()))}_loadAll(){return Promise.all([this._loadStatus(),this._loadEngine()]).then(()=>{})}async _loadStatus(){this._status={status:"loading",data:this._status.data,error:null};try{let e=await this.ws("jarvis/documents",{action:"status"});this._status={status:"loaded",data:uu(e),error:null}}catch(e){Fi(e)&&(this._connectionLost=!0),this._status={status:"error",data:this._status.data,error:qn(e)}}}async _loadEngine(){this._engine={status:"loading",data:this._engine.data,error:null};try{let e=await this.ws("jarvis/semantic_search",{action:"status"});this._engine={status:"loaded",data:pu(e),error:null}}catch(e){Fi(e)&&(this._connectionLost=!0),this._engine={status:"error",data:this._engine.data,error:qn(e)}}}get _directory(){return this._status.data?.directory||""}get _directoryOrPhrase(){return this._directory||a("the documents folder")}get _noStore(){let e=this._status.data;return!!e&&this._status.status==="loaded"&&!e.fts&&!e.chroma}get _toolsDisabled(){return this._busy!==null||this._noStore}_fail(e){return Fi(e)&&(this._connectionLost=!0),qn(e)}_problemsOf(e){if(!Array.isArray(e))return[];let t=[];for(let n of e)!n||n.ok||t.push({source:String(n.source||n.filename||"?"),error:String(n.error||"")});return t}_openPicker(){this.renderRoot.querySelector("#doc-upload")?.click()}_onPicked(e){let t=e.target,n=t.files?Array.from(t.files):[];t.value="",n.length&&this._upload(n)}async _upload(e){if(!e.length||this._toolsDisabled)return;let t=this._directoryOrPhrase,n=[],s=[],o="success",l=[];for(let u of e)tl(u.name)?u.size>ou?(n.push(a("{name} is larger than 3 MB — copy it into {directory} instead; it is picked up within 10 minutes",{name:u.name,directory:t})),o="warning"):l.push(u):(n.push(a("{name}: only PDF, .txt and .md files can be uploaded",{name:u.name})),o="warning");let d=new Set((this._status.data?.sources??[]).map(u=>u.source));this._busy="upload",this._banner=null;try{for(let u=0;u<l.length;u++){let p=l[u];this._uploadProgress={n:u+1,total:l.length};try{let v=await gu(p),f=await this.ws("jarvis/documents",{action:"upload",filename:p.name,content:v});if(f?.ok){let g=String(f.filename||p.name),y=ge(f.chunks),_=d.has(g)?a("Replaced {filename} — {chunks} chunks",{filename:g,chunks:y}):a("Uploaded {filename} — {chunks} chunks",{filename:g,chunks:y}),w=f.embedded!==void 0&&f.embedded!==null?a(", {n} embedded",{n:ge(f.embedded)}):"",R=f.semantic_note?c` · <code class="tech">${String(f.semantic_note)}</code>`:m;f.semantic_note&&(o=o==="success"?"warning":o),n.push(c`${_}${w}${R}`)}else{o!=="error"&&(o="warning");let g=String(f?.filename||p.name),y=String(f?.error||""),_=sn("Couldn't index {filename}: {error}",{filename:g,error:Wn(y)});n.push(f?.filename?c`${_} ${a("The file was saved to the folder but could not be indexed.")}`:_),s.push({source:g,error:y})}}catch(v){o="error",n.push(a("Upload failed — {message}",{message:this._fail(v)}))}}}finally{this._busy=null,this._uploadProgress=null}this._banner={tone:o,lines:n,problems:s.length?s:void 0},l.length&&await this._loadStatus()}async _ingest(){if(!this._toolsDisabled){this._busy="ingest",this._banner=null;try{let e=await this.ws("jarvis/documents",{action:"ingest"});if(!e?.ok)this._banner={tone:"error",lines:[sn("Couldn't read the documents folder: {error}",{error:Wn(e?.error||"")})]};else{let t="success",n=a("Indexed {files_ingested} of {files_seen} files, {total_chunks} chunks",{files_ingested:ge(e.files_ingested),files_seen:ge(e.files_seen),total_chunks:ge(e.total_chunks)}),s=e.semantic?a(", {embedded_chunks} embedded",{embedded_chunks:ge(e.embedded_chunks)}):"",o=m;e.semantic_error&&(t="warning",o=c` · <code class="tech">${String(e.semantic_error)}</code>`);let l=c`${n}${s}${o}`,d=this._problemsOf(e.files);d.length&&t==="success"&&(t="warning"),this._banner={tone:t,lines:[l],problems:d.length?d:void 0}}}catch(e){this._banner={tone:"error",lines:[a("Indexing failed — {message}",{message:this._fail(e)})]}}finally{this._busy=null}await this._loadAll()}}async _scanWatch(){if(!this._toolsDisabled){this._busy="scan",this._banner=null;try{let e=await this.ws("jarvis/documents",{action:"scan_watch"});if(ge(e?.watched)===0)this._banner={tone:"info",lines:[a("No watch folders configured.")],action:"watch-folders"};else{let t=this._problemsOf(e?.files);this._banner={tone:t.length?"warning":"success",lines:[a("Scanned {watched} folders — {new_files} new documents",{watched:ge(e?.watched),new_files:ge(e?.new_files)})],problems:t.length?t:void 0}}}catch(e){this._banner={tone:"error",lines:[a("Scan failed — {message}",{message:this._fail(e)})]}}finally{this._busy=null}await this._loadStatus()}}async _delete(e){if(!(this._deleting.has(e)||!await U({heading:a("Delete {name}?",{name:e}),message:a("This removes the file from the documents folder and everything JARVIS indexed from it."),confirmLabel:a("Delete"),destructive:!0}))){this._deleting=new Set([...this._deleting,e]);try{let n=await this.ws("jarvis/documents",{action:"delete",filename:e});if(!n?.ok){this._banner={tone:"error",lines:[sn("Couldn't delete {name}: {error}",{name:e,error:Wn(n?.error||"")})]};return}await this._loadStatus(),(this._status.data?.sources??[]).some(o=>o.source===e)&&this._status.status==="loaded"&&cu(e)?this._banner={tone:"error",lines:[a("Couldn't delete {name}: {error}",{name:e,error:a("the file name contains characters the backend cannot address — rename it in the folder and re-index.")})]}:this._banner={tone:"success",lines:[a("Deleted {filename}",{filename:String(n.filename||e)})]}}catch(n){this._banner={tone:"error",lines:[a("Delete failed — {message}",{message:this._fail(n)})]}}finally{let n=new Set(this._deleting);n.delete(e),this._deleting=n}}}async _enable(){if(!this._busy){this._busy="enable",this._probe=null;try{await this.ws("jarvis/update_config",{key:"semantic_search",value:!0});let e=await this.ws("jarvis/semantic_search",{action:"enable"});e?.ok?this._probe={tone:"success",body:a("Semantic search is on ({model}, {dim}-dimensional). Run Ingest folder to embed your documents.",{model:String(e.model||""),dim:ge(e.dim)}),ingest:!0}:this._probe={tone:"warning",body:c`${sn("Semantic search is on, but Ollama isn't ready: {error}",{error:Wn(e?.error)})}
          ${a("Until Ollama answers, searches fall back to keyword after a delay.")}`}}catch(e){this._probe={tone:"error",body:a("Couldn't enable semantic search — {message}",{message:this._fail(e)})}}finally{this._busy=null}await this._loadEngine()}}async _disable(){if(!this._busy){this._busy="disable",this._probe=null;try{await this.ws("jarvis/update_config",{key:"semantic_search",value:!1}),this._probe={tone:"info",body:a("Semantic search is off — keyword search is active.")}}catch(e){this._probe={tone:"error",body:a("Couldn't disable semantic search — {message}",{message:this._fail(e)})}}finally{this._busy=null}await this._loadEngine()}}async _test(){if(!this._busy){this._busy="test",this._probe=null;try{let e=await this.ws("jarvis/semantic_search",{action:"test"});e?.ok?this._probe={tone:"success",body:a("Ollama answered: {model}, {dim}-dimensional vectors.",{model:String(e.model||""),dim:ge(e.dim)})}:this._probe={tone:"warning",body:sn("Ollama is not ready: {error}",{error:Wn(e?.error)})}}catch(e){this._probe={tone:"error",body:a("Test failed — {message}",{message:this._fail(e)})}}finally{this._busy=null}}}_onDragOver(e){if(this._toolsDisabled)return;let t=e.dataTransfer?.types;!t||!Array.from(t).includes("Files")||(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="copy"),this._dragOver||(this._dragOver=!0))}_onDragLeave(e){let t=e.currentTarget,n=e.relatedTarget;n&&t.contains(n)||(this._dragOver=!1)}_onDrop(e){if(e.preventDefault(),this._dragOver=!1,this._toolsDisabled)return;let t=e.dataTransfer?.files?Array.from(e.dataTransfer.files):[];t.length&&this._upload(t)}_icon(e,t){return x("ha-icon")?c`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:c`<span aria-hidden="true">${t}</span>`}_iconButton(e,t,n,s,o=!1,l){return x("ha-icon-button")?c`<ha-icon-button .label=${e} title=${l??e} .disabled=${o} @click=${s}>${this._icon(t,n)}</ha-icon-button>`:c`<button class="jv-icon-btn" type="button" aria-label=${e} title=${l??e} ?disabled=${o} @click=${s}>
          ${this._icon(t,n)}
        </button>`}_skeleton(){return c`
      <div class="loading" role="status" aria-live="polite" aria-label=${a("Loading...")}>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
      </div>
    `}_settingsLink(e,t,n="link jv-hit"){return c`<button class=${n} type="button" @click=${()=>this.navigate("settings",t)}>${e}</button>`}_renderLibrary(){let e=this._status,t=e.data,n=e.status==="loaded"||!!t,s=t&&n?a("{count} documents · {chunks} chunks · {engine}",{count:t.sources.length,chunks:t.chunk_count,engine:hu(t)}):"",o=this._busy,l=this._toolsDisabled,d=o==="upload"&&this._uploadProgress?a("Uploading {n} of {total}…",{n:this._uploadProgress.n,total:this._uploadProgress.total}):a("Upload files");return c`
      <jv-section
        class="jv-span-all library ${this._dragOver?"drag":""}"
        flush
        icon="mdi:file-document-multiple-outline"
        .heading=${a("Document Library")}
        .subheading=${s}
        ?loading=${e.status==="loading"&&!t||o==="upload"||o==="ingest"||o==="scan"}
        @dragover=${this._onDragOver}
        @dragenter=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
      >
        <span slot="actions">${this._iconButton(a("Refresh"),"mdi:refresh","↻",()=>{this._loadAll()},e.status==="loading")}</span>

        <div class="gut">
          <p class="intro">
            ${this._directory?sn("Drop PDF, .txt or .md files into {directory} (picked up within 10 minutes) or upload below. JARVIS answers from them in conversation.",{directory:Wn(this._directory)}):a("Drop PDF, .txt or .md files into the documents folder or upload below.")}
          </p>

          <div class="toolbar">
            <label class="visually-hidden" for="doc-upload">${a("Upload files")}</label>
            <input id="doc-upload" class="visually-hidden" type="file" accept=".pdf,.txt,.md" multiple tabindex="-1" @change=${this._onPicked} />
            <button class="jv-btn primary" type="button" ?disabled=${l} @click=${this._openPicker}>${d}</button>
            <button
              class="jv-btn"
              type="button"
              ?disabled=${l}
              title=${a("Re-index every file in the folder. Needed once after enabling semantic search.")}
              @click=${()=>{this._ingest()}}
            >
              ${o==="ingest"?a("Indexing…"):a("Ingest folder")}
            </button>
            <button class="jv-btn" type="button" ?disabled=${l} @click=${()=>{this._scanWatch()}}>
              ${o==="scan"?a("Scanning…"):a("Scan watch folders")}
            </button>
            ${this._settingsLink(a("Watch folders…"),"learning/document_watch_folders")}
          </div>

          <div class="banner" aria-live="polite">${this._renderBanner()}</div>
        </div>

        ${e.status==="error"&&!t?c`<div class="list-state">
              ${Ot({tone:"error",title:a("Couldn't load the library"),body:e.error||"",action:{label:a("Retry"),run:()=>{this._loadStatus()}}})}
            </div>`:t?this._renderList(t):c`<div class="list-state">${this._skeleton()}</div>`}
        ${e.status==="error"&&t?c`<div class="list-state">
              ${Ot({tone:"error",title:a("Couldn't load the library"),body:e.error||"",action:{label:a("Retry"),run:()=>{this._loadStatus()}}})}
            </div>`:m}

        <p class="footer">${a("Files are also picked up automatically every 10 minutes.")}</p>
      </jv-section>
    `}_renderBanner(){let e=this._banner;if(!e)return m;let t=c`${e.lines.map(o=>c`<p>${o}</p>`)}`,n=e.problems?.length?c`<details class="problems">
          <summary>${a("Show {n} problems",{n:e.problems.length})}</summary>
          <ul>
            ${e.problems.map(o=>c`<li>${o.source} — ${o.error}</li>`)}
          </ul>
        </details>`:m,s=e.action==="watch-folders"?c`<div class="alert-actions">${this._settingsLink(a("Set up watch folders"),"learning/document_watch_folders","jv-btn")}</div>`:m;return Ot({tone:e.tone,body:t,extra:c`${n}${s}`,onDismiss:()=>this._banner=null})}_renderList(e){if(e.sources.length===0){let t=!e.fts&&!e.chroma;return c`
        <div class="list-state">
          <jv-empty
            icon="mdi:file-document-plus-outline"
            .heading=${a("No documents yet")}
            .message=${t?a("No document index is available — SQLite FTS5 is missing on this Home Assistant. Check the logs."):a("Upload a manual or receipt, or drop files into {directory}.",{directory:this._directoryOrPhrase})}
          >
            ${t?m:c`<button slot="action" class="jv-btn primary" type="button" ?disabled=${this._toolsDisabled} @click=${this._openPicker}>${a("Upload files")}</button>`}
          </jv-empty>
        </div>
      `}return c`
      <ul>
        ${e.sources.map(t=>{let n=this._deleting.has(t.source);return c`
            <li class="row ${n?"busy":""}">
              <span class="ficon">${this._icon(du(t.source),"▪")}</span>
              <span class="name jv-truncate" title=${t.source}>${t.source}</span>
              <span class="chunks">${vu(t.chunks)}</span>
              ${this._iconButton(a("Delete {name}",{name:t.source}),"mdi:delete-outline","🗑",()=>{this._delete(t.source)},n,a("Delete"))}
            </li>
          `})}
      </ul>
    `}_renderEngine(){let e=this._engine,t=e.data,n=this._busy,s=n==="enable"||n==="disable"||n==="test";return c`
      <jv-section icon="mdi:vector-combine" .heading=${a("Search engine")} ?loading=${e.status==="loading"&&!t||s}>
        ${e.status==="error"&&!t?Ot({tone:"error",title:a("Couldn't read the search engine status"),body:e.error||"",action:{label:a("Retry"),run:()=>{this._loadEngine()}}}):t?this._renderEngineBody(t):this._skeleton()}
        ${e.status==="error"&&t?Ot({tone:"error",title:a("Couldn't read the search engine status"),body:e.error||"",action:{label:a("Retry"),run:()=>{this._loadEngine()}}}):m}
      </jv-section>
    `}_renderEngineBody(e){let t=this._busy,n=t!==null,s=c`<button class="jv-btn" type="button" ?disabled=${this._toolsDisabled} @click=${()=>{this._ingest()}}>
      ${t==="ingest"?a("Indexing…"):a("Ingest folder")}
    </button>`,o,l;e.enabled?e.vector_count>0?(o=c`<jv-state-badge level="ok" .label=${a("Semantic (Ollama)")}></jv-state-badge>`,l=c`<p class="engine-line">${sn("Meaning-based matching with {model} · {count} vectors",{model:Wn(e.model),count:e.vector_count})}</p>`):(o=c`<jv-state-badge level="warn" .label=${a("Semantic (Ollama) — not indexed yet")}></jv-state-badge>`,l=c`<p class="engine-line">${a("Semantic search is on but no document has been embedded. Run Ingest folder.")}<br />${s}</p>`):(o=c`<jv-state-badge level="neutral" .label=${a("Keyword (FTS5)")}></jv-state-badge>`,l=c`<p class="engine-line">
        ${a("Works everywhere with no setup. Enable semantic search to match on meaning using your Ollama server; re-index the folder afterwards.")}
      </p>`);let d=this._probe;return c`
      <div class="engine-status">${o}</div>
      ${l}
      <jv-kv .label=${a("Ollama host")} mono>
        <span class="kv-value">
          <span>${e.base||a("not set")}</span>
          ${this._settingsLink(a("Change…"),"learning/embed_base_url")}
        </span>
      </jv-kv>
      <p class="caption">${a("Falls back to the LLM base URL (Settings → General).")} ${this._settingsLink(a("Settings"),"core/llm_base_url")}</p>
      <jv-kv .label=${a("Model")} mono>
        <span class="kv-value">
          <span>${e.model||"—"}</span>
          ${this._settingsLink(a("Change…"),"learning/embed_model")}
        </span>
      </jv-kv>
      <jv-kv .label=${a("Vectors")} .value=${String(e.vector_count)} mono></jv-kv>
      <div class="buttons">
        ${e.enabled?c`<button class="jv-btn" type="button" ?disabled=${n} @click=${()=>{this._disable()}}>${a("Disable semantic search")}</button>`:c`<button class="jv-btn primary" type="button" ?disabled=${n} @click=${()=>{this._enable()}}>
              ${t==="enable"?a("Checking Ollama…"):a("Enable semantic search")}
            </button>`}
        <button class="jv-btn text" type="button" ?disabled=${n} @click=${()=>{this._test()}}>${t==="test"?a("Testing…"):a("Test connection")}</button>
      </div>
      <div class="probe" aria-live="polite">
        ${d?Ot({tone:d.tone,body:d.body,extra:d.ingest?c`<div class="alert-actions">${s}</div>`:m,onDismiss:()=>this._probe=null}):m}
      </div>
    `}render(){let e=this._status.status==="loaded"&&this._status.data?this._status.data.sources.length===0:null,t=this.data?.config,n=this.data?t&&typeof t.memory_stats=="object"&&t.memory_stats!==null?t.memory_stats:null:void 0;return c`
      <div class="jv-grid">
        ${this._renderLibrary()}
        <jarvis-docs-search .hass=${this.hass} .libraryEmpty=${e}></jarvis-docs-search>
        ${this._renderEngine()}
        <jarvis-docs-memory .hass=${this.hass} .stats=${n}></jarvis-docs-memory>
      </div>
    `}};dt.styles=[T,Zr,yu],h([b()],dt.prototype,"_status",2),h([b()],dt.prototype,"_engine",2),h([b()],dt.prototype,"_busy",2),h([b()],dt.prototype,"_uploadProgress",2),h([b()],dt.prototype,"_deleting",2),h([b()],dt.prototype,"_banner",2),h([b()],dt.prototype,"_probe",2),h([b()],dt.prototype,"_dragOver",2),dt=h([A("jarvis-view-documents")],dt);var Oi=class extends en{constructor(i){if(super(i),this.it=m,i.type!==Dt.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(i){if(i===m||i==null)return this._t=void 0,this.it=i;if(i===Ke)return i;if(typeof i!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(i===this.it)return this._t;this.it=i;let e=[i];return e.raw=e,this._t={_$litType$:this.constructor.resultType,strings:e,values:[]}}};Oi.directiveName="unsafeHTML",Oi.resultType=1;var Hs=Kn(Oi);var Cu=20,df=24/2,Ws=1.2,_u=8.6,qs=30*Math.PI/180,Qr=[63/2,df,9*.5],Us={"1f":[.4,8.6],"2f":[9,13.8],b:[-7,-.6]},Ae={},k;function uf(r){Ae=r||{},Cu=9+11*(Ae.pitch&&Ae.pitch>0?Ae.pitch:1)}function Tu(r,i){let e=r[0]-Qr[0],t=r[1]-Qr[1],n=r[2]-Qr[2],s=Math.cos(i),o=Math.sin(i);return[e*s-t*o,e*o+t*s,n]}function Ni(r,i){let e=Tu(r,i*Math.PI/180);return[-e[0]*_u,-(e[1]*Math.sin(qs)+e[2]*Math.cos(qs))*_u]}function wu(r,i){let e=i*Math.PI/180,t=0,n=0,s=r.p.length;for(let o=0;o<s;o++){let l=Tu(r.p[o],e);t+=l[1],n+=l[2]}return t/=s,n/=s,t*Math.cos(qs)-n*Math.sin(qs)}function N(r,i,e,t,n,s){let o={p:i,f:e,s:t||k.edge,w:n??.9};s?.cls&&(o.cls=s.cls),r.push(o)}function $u(r,i,e,t,n,s,o,l,d,u){N(r,[[i,e,0],[i,t,0],[i,t,n],[i,s,o],[i,e,n]],l,d,u)}function an(r,i,e,t,n,s,o,l,d,u,p){let v=l==="dom"?k.winDom:l==="on"?k.winOn:k.winOff,f=l==="dom"?k.glassDom:l==="on"?k.glassOn:k.glassOff,y=e+(u??-.06);if(N(r,[[t,y,s],[n,y,s],[n,y,o],[t,y,o]],v,f,.7),d){N(r,[[t,y,(s+o)/2],[n,y,(s+o)/2]],"none",f,.4);let _=p||2;for(let w=1;w<_;w++){let R=t+(n-t)*w/_;N(r,[[R,y,s],[R,y,o]],"none",f,.4)}}if(l!=="off"&&i){let _=l==="dom"?k.glowDom:k.glowOn;i.push({p:[[t-1.4,y,s-1.4],[n+1.4,y,s-1.4],[n+1.4,y,o+1.4],[t-1.4,y,o+1.4]],f:_})}}function Tn(r,i,e,t,n,s,o,l,d,u){let p=l==="dom"?k.winDom:l==="on"?k.winOn:k.winOff,v=l==="dom"?k.glassDom:l==="on"?k.glassOn:k.glassOff,g=e+(u??.06);if(N(r,[[g,t,s],[g,n,s],[g,n,o],[g,t,o]],p,v,.7),d&&(N(r,[[g,t,(s+o)/2],[g,n,(s+o)/2]],"none",v,.4),N(r,[[g,(t+n)/2,s],[g,(t+n)/2,o]],"none",v,.4)),l!=="off"&&i){let y=l==="dom"?k.glowDom:k.glowOn;i.push({p:[[g,t-1.4,s-1.4],[g,n+1.4,s-1.4],[g,n+1.4,o+1.4],[g,t-1.4,o+1.4]],f:y})}}function al(r,i,e,t,n,s,o,l,d,u){for(let v=0;v<12;v++){let f=i+(e-i)*v/12,g=i+(e-i)*(v+1)/12;N(r,[[f,t,n],[g,t,n],[g,s,o],[f,s,o]],l,"none",0)}N(r,[[i,t,n],[e,t,n],[e,s,o],[i,s,o]],"none",d,u)}function Mu(r){let i=r!=="off",e=r==="mmwave";return{ff:r==="dom"?k.roomFillDom:e?k.roomFillMmwave:i?k.roomFillOn:k.roomFillOff,ss:r==="dom"?k.roomStrokeDom:e?k.roomStrokeMmwave:i?k.roomStrokeOn:k.roomStrokeOff,sw:e?1.3:i?1:.6,wf:r==="dom"?k.roomWallDom:e?k.roomWallMmwave:i?k.roomWallOn:k.roomWallOff}}function pf(r,i,e,t,n,s,o,l,d,u){let p=e+n,v=t+s,f=u!=="off",{ff:g,ss:y,sw:_,wf:w}=Mu(u);N(r,[[e,t,o],[p,t,o],[p,v,o],[e,v,o]],g,y,_*.7),N(r,[[e,t,o],[p,t,o],[p,t,l],[e,t,l]],w,y,_*.5),N(r,[[e,v,o],[p,v,o],[p,v,l],[e,v,l]],w,y,_*.5),N(r,[[e,t,o],[e,v,o],[e,v,l],[e,t,l]],w,y,_*.5),N(r,[[p,t,o],[p,v,o],[p,v,l],[p,t,l]],w,y,_*.5),i.push({x:(e+p)/2,y:(t+v)/2,z:o+.2,t:d,st:u,big:n>14}),f&&i.push({x:(e+p)/2,y:(t+v)/2,z:l-.5,st:u,dot:!0})}function hf(r,i,e,t,n,s,o){let l=o!=="off",{ff:d,ss:u,sw:p,wf:v}=Mu(o);N(r,e.map(w=>[w[0],w[1],t]),d,u,p*.7);for(let w=0;w<e.length;w++){let R=e[w],j=e[(w+1)%e.length];N(r,[[R[0],R[1],t],[j[0],j[1],t],[j[0],j[1],n],[R[0],R[1],n]],v,u,p*.5)}let f=0,g=0,y=1e9,_=-1e9;e.forEach(w=>{f+=w[0],g+=w[1],y=Math.min(y,w[0]),_=Math.max(_,w[0])}),f/=e.length,g/=e.length,i.push({x:f,y:g,z:t+.2,t:s,st:o,big:_-y>14}),l&&i.push({x:f,y:g,z:n-.5,st:o,dot:!0})}function xu(r){let i={bsmt:"b",basement:"b"};return Us[r]||Us[i[r]]||Us["1f"]}function vf(r,i){if(r[i])return i;let e={b:"bsmt",bsmt:"b"};return r[e[i]]?e[i]:i}function Pu(r,i,e,t,n,s,o){N(r,[[i,e,s],[t,e,s],[t,e,o],[i,e,o]],k.wallFill,k.wallStroke,.7),N(r,[[i,n,s],[t,n,s],[t,n,o],[i,n,o]],k.wallFillDark,k.wallStrokeDark,.7),N(r,[[i,e,s],[i,n,s],[i,n,o],[i,e,o]],k.wallFillDark,k.wallStrokeDark,.7),N(r,[[t,e,s],[t,n,s],[t,n,o],[t,e,o]],k.wallFill,k.wallStroke,.7)}function Ii(r){if(r.points&&r.points.length>=3)return r.points;let i=r.x||0,e=r.y||0,t=r.w||0,n=r.d||0;return[[i,e],[i+t,e],[i+t,e+n],[i,e+n]]}function mf(r,i,e){let t=!1;for(let n=0,s=e.length-1;n<e.length;s=n++){let o=e[n][0],l=e[n][1],d=e[s][0],u=e[s][1];l>i!=u>i&&r<(d-o)*(i-l)/(u-l)+o&&(t=!t)}return t}function Lu(r){return(r||[]).filter(i=>i.type!=="outdoor"&&i.type!=="stairs"&&i.type!=="door")}function ff(r,i){let e=[];for(let n=0;n<r.length;n++){let s=r[n],o=r[(n+1)%r.length];(s[1]<=i&&o[1]>i||o[1]<=i&&s[1]>i)&&e.push(s[0]+(i-s[1])/(o[1]-s[1])*(o[0]-s[0]))}e.sort((n,s)=>n-s);let t=[];for(let n=0;n+1<e.length;n+=2)t.push([e[n],e[n+1]]);return t}function ju(r){let i=Lu(r);if(!i.length)return[];let e=[];i.forEach(s=>Ii(s).forEach(o=>e.push(o[1]))),e=e.sort((s,o)=>s-o).filter((s,o,l)=>o===0||Math.abs(s-l[o-1])>.01);let t=[];for(let s=0;s<e.length-1;s++){let o=e[s],l=e[s+1],d=(o+l)/2,u=[];i.forEach(v=>ff(Ii(v),d).forEach(f=>u.push(f))),u.sort((v,f)=>v[0]-f[0]);let p=[];u.forEach(v=>{let f=p[p.length-1];f&&v[0]<=f[1]+.01?f[1]=Math.max(f[1],v[1]):p.push([v[0],v[1]])}),p.forEach(v=>t.push({x0:v[0],y0:o,x1:v[1],y1:l}))}let n=!0;for(;n;){n=!1;for(let s=0;s<t.length;s++){let o=t[s];if(o)for(let l=s+1;l<t.length;l++){let d=t[l];d&&Math.abs(o.x0-d.x0)<.01&&Math.abs(o.x1-d.x1)<.01&&(Math.abs(o.y1-d.y0)<.01||Math.abs(d.y1-o.y0)<.01)&&(o.y0=Math.min(o.y0,d.y0),o.y1=Math.max(o.y1,d.y1),t[l]=null,n=!0)}}t=t.filter(Boolean)}return t}function gf(r,i,e,t){let n=Lu(i),s=[];n.forEach(v=>Ii(v).forEach(f=>s.push(f)));let o=(v,f,g)=>n.some(y=>y!==g&&mf(v,f,Ii(y))),l=[];n.forEach(v=>{let f=Ii(v),g=0,y=0;f.forEach(_=>{g+=_[0],y+=_[1]}),g/=f.length,y/=f.length;for(let _=0;_<f.length;_++){let w=f[_],R=f[(_+1)%f.length],j=R[0]-w[0],C=R[1]-w[1],M=j*j+C*C;if(M<1e-6)continue;let O=[0,1];s.forEach(ie=>{let Le=((ie[0]-w[0])*j+(ie[1]-w[1])*C)/M;Le<=.001||Le>=.999||Math.hypot(ie[0]-(w[0]+j*Le),ie[1]-(w[1]+C*Le))<.05&&O.push(Le)}),O.sort((ie,Le)=>ie-Le);let F=-C,W=j,G=Math.hypot(F,W)||1;F/=G,W/=G;let ne=(w[0]+R[0])/2,V=(w[1]+R[1])/2;(ne+F-g)*(ne+F-g)+(V+W-y)*(V+W-y)<(ne-F-g)*(ne-F-g)+(V-W-y)*(V-W-y)&&(F=-F,W=-W);let ke=W<-.3;for(let ie=0;ie<O.length-1;ie++){let Le=O[ie],Hn=O[ie+1];if(Hn-Le<.001)continue;let se=(Le+Hn)/2,lo=w[0]+j*se,Or=w[1]+C*se;o(lo+F*1.5,Or+W*1.5,v)||l.push({a:[w[0]+j*Le,w[1]+C*Le],b:[w[0]+j*Hn,w[1]+C*Hn],front:ke})}}});let d=(v,f)=>Math.abs(v[0]-f[0])<.06&&Math.abs(v[1]-f[1])<.06,u=(v,f,g)=>{let y=Math.hypot(f[0]-v[0],f[1]-v[1])||1;return Math.abs(((f[0]-v[0])*(g[1]-v[1])-(f[1]-v[1])*(g[0]-v[0]))/y)<.06},p=new Array(l.length).fill(!1);for(let v=0;v<l.length;v++){if(p[v])continue;p[v]=!0;let f=l[v].a,g=l[v].b,y=l[v].front,_=!0;for(;_;){_=!1;for(let w=0;w<l.length;w++){if(p[w]||l[w].front!==y)continue;let R=l[w].a,j=l[w].b;!u(f,g,R)||!u(f,g,j)||(d(j,f)?(f=R,p[w]=!0,_=!0):d(R,f)?(f=j,p[w]=!0,_=!0):d(R,g)?(g=j,p[w]=!0,_=!0):d(j,g)&&(g=R,p[w]=!0,_=!0))}}N(r,[[f[0],f[1],e],[g[0],g[1],e],[g[0],g[1],t],[f[0],f[1],t]],y?k.wallFill:k.wallFillDark,y?k.wallStroke:k.wallStrokeDark,.7)}}function ku(){return Us["1f"][1]}function ll(){return Ae.pitch!=null?Ae.pitch:1}function bf(r){return r/2*.9*Math.max(ll(),.08)}function Su(r,i,e,t,n,s,o,l){let d=t-i,u=n-e,p=Ws,v=d>=u,f=v?u:d,g=l??ll(),y=Math.max(f/2*.9*Math.max(g,.08),o||0),_=s+y;if(v){let R=(e+n)/2;return al(r,i-p,t+p,e-p,s,R,_,k.roofFill,k.roofStroke,.85),N(r,[[i-p,n+p,s],[t+p,n+p,s],[t+p,R,_],[i-p,R,_]],k.roofFillDark,k.roofStrokeDark,.7),$u(r,i,e,n,s,R,_,k.gableFill,k.gableStroke,.8),$u(r,t,e,n,s,R,_,k.gableFill,k.gableStroke,.8),{axis:"x",front:e,back:n,eave:s,ridge:_,mid:R,a:i,b:t}}let w=(i+t)/2;return N(r,[[i-p,e-p,s],[i-p,n+p,s],[w,n+p,_],[w,e-p,_]],k.roofFill,k.roofStroke,.85),N(r,[[t+p,e-p,s],[t+p,n+p,s],[w,n+p,_],[w,e-p,_]],k.roofFillDark,k.roofStrokeDark,.7),N(r,[[i,e,s],[t,e,s],[w,e,_]],k.gableFill,k.gableStroke,.8),N(r,[[i,n,s],[t,n,s],[w,n,_]],k.gableFill,k.gableStroke,.8),{axis:"y",eave:s,ridge:_}}function Eu(r,i,e,t,n,s,o,l,d,u){N(r,[[i,e,0],[i,t,0],[i,t,n],[i,o,l],[i,d,u],[i,s,l],[i,e,n]],k.gableFill,k.gableStroke,.8)}function Ru(r,i,e,t,n,s,o,l,d,u){N(r,[[e,i,0],[t,i,0],[t,i,n],[o,i,l],[d,i,u],[s,i,l],[e,i,n]],k.gableFill,k.gableStroke,.8)}function yf(r,i,e,t,n,s,o,l){let d=t-i,u=n-e,p=Ws,v=d>=u,f=v?u:d,g=l??ll(),y=Math.max(f/2*.9*Math.max(g,.08),o||0),_=s+y,w=.42,R=.64,j=s+y*R;if(v){let F=(e+n)/2,W=e+(F-e)*w,G=n-(n-F)*w;return al(r,i-p,t+p,e-p,s,W,j,k.roofFill,k.roofStroke,.85),al(r,i-p,t+p,W,j,F,_,k.roofFill,k.roofStroke,.85),N(r,[[i-p,n+p,s],[t+p,n+p,s],[t+p,G,j],[i-p,G,j]],k.roofFillDark,k.roofStrokeDark,.7),N(r,[[i-p,G,j],[t+p,G,j],[t+p,F,_],[i-p,F,_]],k.roofFillDark,k.roofStrokeDark,.7),Eu(r,i,e,n,s,W,G,j,F,_),Eu(r,t,e,n,s,W,G,j,F,_),{axis:"x",front:e,back:n,eave:s,ridge:_,mid:F,a:i,b:t,knuckleZ:j,knuckleFront:W,knuckleBack:G}}let C=(i+t)/2,M=i+(C-i)*w,O=t-(t-C)*w;return N(r,[[i-p,e-p,s],[i-p,n+p,s],[M,n+p,j],[M,e-p,j]],k.roofFill,k.roofStroke,.85),N(r,[[M,e-p,j],[M,n+p,j],[C,n+p,_],[C,e-p,_]],k.roofFill,k.roofStroke,.85),N(r,[[t+p,e-p,s],[t+p,n+p,s],[O,n+p,j],[O,e-p,j]],k.roofFillDark,k.roofStrokeDark,.7),N(r,[[O,e-p,j],[O,n+p,j],[C,n+p,_],[C,e-p,_]],k.roofFillDark,k.roofStrokeDark,.7),Ru(r,e,i,t,s,M,O,j,C,_),Ru(r,n,i,t,s,M,O,j,C,_),{axis:"y",eave:s,ridge:_}}function _f(r,i,e,t,n,s,o){let l=t-i,d=n-e,u=Ws,p=Math.min(l,d),v=Math.max(bf(p),o||0),f=s+v,g=(e+n)/2,y=p/2,_=i+y,w=t-y;return w<_&&(_=w=(i+t)/2),N(r,[[i-u,e-u,s],[t+u,e-u,s],[w,g,f],[_,g,f]],k.roofFill,k.roofStroke,.85),N(r,[[i-u,n+u,s],[t+u,n+u,s],[w,g,f],[_,g,f]],k.roofFillDark,k.roofStrokeDark,.7),N(r,[[i-u,e-u,s],[i-u,n+u,s],[_,g,f]],k.roofFill,k.roofStroke,.8),N(r,[[t+u,e-u,s],[t+u,n+u,s],[w,g,f]],k.roofFillDark,k.roofStrokeDark,.7),{axis:"x",front:e,eave:s,ridge:f,mid:g,a:_,b:w}}function wf(r,i,e,t,n,s){let o=Ws*.5;return N(r,[[i-o,e-o,s],[t+o,e-o,s],[t+o,n+o,s],[i-o,n+o,s]],k.roofFill,k.roofStroke,.85),Pu(r,i-o,e-o,t+o,n+o,s,s+1),{axis:"flat",eave:s,ridge:s+1}}function Bs(r,i,e,t,n,s,o){let l=s.length;if(!l||!e||e.axis!=="x"||e.a==null||e.b==null||e.mid==null||e.front==null)return;let d=e.a,u=e.b,p=e.eave,v=e.ridge,f=e.mid;e.knuckleZ!=null&&(v=e.knuckleZ,f=(n?e.knuckleBack:e.knuckleFront)??f);let g=n?e.back!=null?e.back:2*f-e.front:e.front,y=n?-1:1,_=f-g!==0?(v-p)/Math.abs(f-g):0,w=5,R=5.5;for(let j=0;j<l;j++){let C=s[j],M=d+(u-d)*C,O=g+y*1.4,F=g+y*R,W=p+Math.abs(F-g)*_,G=p+.9,ne=G+3.4,V=ne+1.5,ke=y*-.06;N(r,[[M-w/2,O,G],[M+w/2,O,G],[M+w/2,O,ne],[M-w/2,O,ne]],k.solidDark,k.wallStroke,.7),N(r,[[M-w/2,O,ne],[M+w/2,O,ne],[M,O,V]],k.solidDark,k.wallStroke,.7),N(r,[[M-w/2,O,G],[M-w/2,O,ne],[M-w/2,F,W]],k.solidDark,k.roofStrokeDark,.55),N(r,[[M+w/2,O,G],[M+w/2,O,ne],[M+w/2,F,W]],k.solidDark,k.roofStrokeDark,.55),N(r,[[M-w/2,O,ne],[M,O,V],[M,F,W],[M-w/2,F,W]],k.roofFill,k.roofStroke,.6),N(r,[[M+w/2,O,ne],[M,O,V],[M,F,W],[M+w/2,F,W]],k.roofFill,k.roofStroke,.6);let ie=o[j]!=null?o[j]:t;an(r,i,O,M-1.7,M+1.7,G+.3,ne-.3,ie,!0,ke)}}function $f(r,i,e,t,n,s,o){let l=Ae.garageBays&&Ae.garageBays>0?Ae.garageBays:3,d=1.8,u=t-e,p=.4,v=7.2,f=-.06,g=(u-d*(l+1))/l;if(g<=1&&(d=.6,g=(u-d*(l+1))/l),g<=0)return;let y=s==="on"||s==="dom",_=y?k.doorOn:k.doorOff,w=y?k.glassOn:k.doorStroke;for(let R=0;R<l;R++){let j=e+d+R*(g+d);if(!!(o&&o[R]&&o[R].open))N(r,[[j,n+f-.35,p],[j+g,n+f-.35,p],[j+g,n+f-.35,v-1.4],[j,n+f-.35,v-1.4]],k.doorOpenFaint,k.doorOpenStroke,.6,{cls:"door-open"}),N(r,[[j,n+f,v-1.4],[j+g,n+f,v-1.4],[j+g,n+f,v],[j,n+f,v]],k.doorOpen,k.doorOpenStroke,1,{cls:"gdoor door-open"}),i.push({p:[[j-1.2,n+f,p],[j+g+1.2,n+f,p],[j+g+1.2,n+f,v+1.2],[j-1.2,n+f,v+1.2]],f:k.doorOpenGlow});else{N(r,[[j,n+f,p],[j+g,n+f,p],[j+g,n+f,v],[j,n+f,v]],_,w,1,{cls:"gdoor"});for(let M=1;M<4;M++){let O=p+(v-p)*M/4;N(r,[[j,n+f,O],[j+g,n+f,O]],"none",w,.45)}y&&i.push({p:[[j-1.2,n+f,p],[j+g+1.2,n+f,p],[j+g+1.2,n+f,v+1.2],[j-1.2,n+f,v+1.2]],f:k.glowOn})}}}function Au(r,i,e,t,n){let s=e-1.8,o=e+1.8,l=i,d=i+n*2.2;N(r,[[d,s,0],[d,o,0],[d,o,t],[d,s,t]],k.chimneyFill,k.chimneyStroke,.7),N(r,[[l,s,0],[d,s,0],[d,s,t],[l,s,t]],k.solidDark,k.chimneyStroke,.6),N(r,[[l,o,0],[d,o,0],[d,o,t],[l,o,t]],k.solidDark,k.dim,.5),N(r,[[l,s,t],[d,s,t],[d,o,t],[l,o,t]],k.chimneyCap,k.chimneyStroke,.5)}function xf(r,i,e,t,n){let o=i-1.3,l=i+1.3,d=e-1.3,u=e+1.3;N(r,[[l,d,t],[l,u,t],[l,u,n],[l,d,n]],k.chimneyFill,k.chimneyStroke,.7),N(r,[[o,d,t],[o,u,t],[o,u,n],[o,d,n]],k.solidDark,k.dim,.5),N(r,[[o,d,t],[l,d,t],[l,d,n],[o,d,n]],k.solidDark,k.chimneyStroke,.6),N(r,[[o,u,t],[l,u,t],[l,u,n],[o,u,n]],k.solidDark,k.dim,.5),N(r,[[o,d,n],[l,d,n],[l,u,n],[o,u,n]],k.chimneyCap,k.chimneyStroke,.5)}function rl(r,i,e,t,n,s,o){let l=Math.max(s,5.5),d=3.2,u=.2,p=o?k.doorOpen:k.doorOff,v=o?k.doorOpenStroke:k.doorStroke,f=o?"cellar-door door-open":"cellar-door",g=k.solidDark;if(e==="front"||e==="back"){let y=e==="front"?-1:1,_=n,w=n+y*l;N(r,[[t-s/2,_,d],[t,_,d],[t,w,u],[t-s/2,w,u]],p,v,.9,{cls:f}),N(r,[[t,_,d],[t+s/2,_,d],[t+s/2,w,u],[t,w,u]],p,v,.9,{cls:f}),N(r,[[t-s/2,_,0],[t-s/2,_,d],[t-s/2,w,u],[t-s/2,w,0]],g,v,.6),N(r,[[t+s/2,_,0],[t+s/2,_,d],[t+s/2,w,u],[t+s/2,w,0]],g,v,.6),N(r,[[t-s/2,w,0],[t+s/2,w,0],[t+s/2,w,u],[t-s/2,w,u]],g,v,.6)}else{let y=e==="left"?-1:1,_=t,w=t+y*l;N(r,[[_,n-s/2,d],[_,n,d],[w,n,u],[w,n-s/2,u]],p,v,.9,{cls:f}),N(r,[[_,n,d],[_,n+s/2,d],[w,n+s/2,u],[w,n,u]],p,v,.9,{cls:f}),N(r,[[_,n-s/2,0],[_,n-s/2,d],[w,n-s/2,u],[w,n-s/2,0]],g,v,.6),N(r,[[_,n+s/2,0],[_,n+s/2,d],[w,n+s/2,u],[w,n+s/2,0]],g,v,.6),N(r,[[w,n-s/2,0],[w,n+s/2,0],[w,n+s/2,u],[w,n-s/2,u]],g,v,.6)}o&&i.push({p:[[t-s/2,n,d],[t+s/2,n,d],[t+s/2,n,d+1.5],[t-s/2,n,d+1.5]],f:k.doorOpenGlow})}function jf(r,i,e,t,n,s,o){let l=i==="front"||i==="back",d=k.casedFill,u=k.casedStroke;if(l){let p=t+(i==="front"?-.06:.06);N(r,[[e-n/2,p,s],[e+n/2,p,s],[e+n/2,p,o],[e-n/2,p,o]],d,u,.7,{cls:"cased"})}else{let p=e+(i==="left"?-.06:.06);N(r,[[p,t-n/2,s],[p,t+n/2,s],[p,t+n/2,o],[p,t-n/2,o]],d,u,.7,{cls:"cased"})}}function ol(r,i,e,t,n,s,o,l,d){let u=e==="front"||e==="back",p=d?k.doorOpen:k.doorOff,v=d?k.doorOpenStroke:k.doorStroke,f=d?"door door-open":"door",g=55*Math.PI/180;if(u){let y=e==="front"?-.06:.06,_=n+y;if(!d)N(r,[[t-s/2,_,o],[t+s/2,_,o],[t+s/2,_,l],[t-s/2,_,l]],p,v,.9,{cls:f});else{let w=e==="front"?-1:1,R=s*Math.cos(g),j=w*s*Math.sin(g);N(r,[[t-s/2,_,o],[t-s/2+R,_+j,o],[t-s/2+R,_+j,l],[t-s/2,_,l]],p,v,.9,{cls:f}),i.push({p:[[t-s/2-1,_,o],[t+s/2+1,_,o],[t+s/2+1,_+j,l+1],[t-s/2-1,_+j,l+1]],f:k.doorOpenGlow})}}else{let y=e==="left"?-.06:.06,_=t+y;if(!d)N(r,[[_,n-s/2,o],[_,n+s/2,o],[_,n+s/2,l],[_,n-s/2,l]],p,v,.9,{cls:f});else{let w=e==="left"?-1:1,R=w*s*Math.sin(g),j=s*Math.cos(g);N(r,[[_,n-s/2,o],[_+R,n-s/2+j,o],[_+R,n-s/2+j,l],[_,n-s/2,l]],p,v,.9,{cls:f}),i.push({p:[[_,n-s/2-1,o],[_+R,n+s/2+1,o],[_+R,n+s/2+1,l+1],[_,n-s/2-1,l+1]],f:k.doorOpenGlow})}}}function il(r){let i=null;return(r||[]).forEach(e=>{i?(i.x0=Math.min(i.x0,e.x),i.y0=Math.min(i.y0,e.y),i.x1=Math.max(i.x1,e.x+e.w),i.y1=Math.max(i.y1,e.y+e.d)):i={x0:e.x,y0:e.y,x1:e.x+e.w,y1:e.y+e.d}}),i}function kf(r,i,e,t,n,s,o){let l=r.lit||{},d=[],u=[],p=[],v=E=>{let B=l[String(E).toLowerCase()];return B==="dom"?"dom":B?"on":"off"},f=Ae.stories!=null?Ae.stories:1.5,g=!!(i["2f"]&&i["2f"].length),y=Ae.roof||"gable",_=y!=="flat"&&f<2&&g,w=_?ku():o,R=_?o-w+2.5:0,j=r.elements||{};(i["1f"]||[]).length?gf(d,i["1f"],0,w):Pu(d,e,t,n,s,0,w);let C=1.5,M=3,O=3,F=7,W=null;(i["1f"]||[]).forEach(E=>{String(E.name).toLowerCase().indexOf("garage")>=0&&!W&&(W=E)});let G=W,ne=(E,B,J)=>{let oe="off";return(E||[]).forEach(Q=>{if(B>=Q.x-1&&B<=Q.x+Q.w+1&&J>=Q.y-1&&J<=Q.y+Q.d+1){let z=v(Q.name);z==="dom"?oe="dom":z==="on"&&oe!=="dom"&&(oe="on")}}),oe},V=(E,B)=>ne(i["1f"],E,B),ke=(E,B)=>ne(i["2f"],E,B),ie=(E,B)=>E==="front"?[e+B*(n-e),t]:E==="back"?[e+B*(n-e),s]:E==="left"?[e,t+B*(s-t)]:[n,t+B*(s-t)],Le=E=>E.type==="window"||E.type==="door"&&E.kind!=="interior"&&E.kind!=="cased",Hn=(j["1f"]||[]).filter(Le);if(Hn.length?Hn.forEach(E=>{let B=E.pos!=null?E.pos:.5,J=E.w||4,oe=E.wall==="front"||E.wall==="back",[Q,z]=ie(E.wall,B);if(E.type==="window"){let Re=V(Q,z);oe?an(d,u,z,Q-J/2,Q+J/2,O,F,Re,!0,E.wall==="front"?-.06:.06):Tn(d,u,Q,z-J/2,z+J/2,O,F,Re,!0,E.wall==="left"?-.06:.06)}else E.kind==="cellar"?rl(d,u,E.wall,Q,z,Math.max(J,5),E.open):ol(d,u,E.wall,Q,z,Math.max(J,3),.4,6.8,E.open)}):(i["1f"]||[]).forEach(E=>{if(String(E.name).toLowerCase().indexOf("garage")>=0||E.type&&E.type!=="room"&&E.type!=="bath")return;let B=E.x,J=E.x+E.w,oe=E.y,Q=E.y+E.d,z=v(E.name);J-B<6||Q-oe<6||(Math.abs(oe-t)<C&&an(d,u,t,B+M,J-M,O,F,z,!0,-.06),Math.abs(Q-s)<C&&an(d,u,s,B+M,J-M,O,F,z,!0,.06),Math.abs(B-e)<C&&Tn(d,u,e,oe+M,Q-M,O,F,z,!0,-.06),Math.abs(J-n)<C&&Tn(d,u,n,oe+M,Q-M,O,F,z,!0,.06))}),G){let E=G,B=Math.abs(E.y-t)<C?t:Math.abs(E.y+E.d-s)<C?s:E.y;$f(d,u,E.x+.5,E.x+E.w-.5,B,v(E.name),r.garage)}let se,lo=(y==="gable"||y==="gambrel")&&G&&G.w>8,Or=E=>y==="gambrel"?yf(d,E.x0,E.y0,E.x1,E.y1,w,R):Su(d,E.x0,E.y0,E.x1,E.y1,w,R),$c=(E,B)=>(B.x1-B.x0)*(B.y1-B.y0)-(E.x1-E.x0)*(E.y1-E.y0);if(y==="flat")se=wf(d,e,t,n,s,o);else if(y==="hip")se=_f(d,e,t,n,s,w,R);else if(lo&&G){let E=(i["1f"]||[]).filter(z=>z!==G&&z.type!=="outdoor"&&z.type!=="stairs"&&z.type!=="door"),B=il(E),J=0;E.forEach(z=>J+=z.w*z.d);let oe=B?(B.x1-B.x0)*(B.y1-B.y0):0;!B||oe<=0||J/oe>=.85?B&&(se=Or(B)):ju(E).sort($c).forEach((Re,Zt)=>{let _i=Or(Re);Zt===0&&(se=_i)}),Su(d,G.x,G.y,G.x+G.w,G.y+G.d,ku(),0,.2)}else{let E=ju(i["1f"]||[]);E.length>1?E.sort($c).forEach((B,J)=>{let oe=Or(B);J===0&&(se=oe)}):se=Or({x0:e,y0:t,x1:n,y1:s})}let lr="off";if((i["2f"]||[]).forEach(E=>{let B=v(E.name);B==="dom"?lr="dom":B==="on"&&lr!=="dom"&&(lr="on")}),y!=="flat"&&se){let E=se,B=(j["2f"]||[]).filter(z=>z.type==="dormer"&&z.slope!=="rear"),J=(j["2f"]||[]).filter(z=>z.type==="dormer"&&z.slope==="rear"),oe=z=>{if(E.a==null||E.b==null)return"off";let Re=E.a+(E.b-E.a)*z,Zt=(i["2f"]||[]).filter(_i=>Re>=_i.x&&Re<=_i.x+_i.w)[0];return Zt?v(Zt.name):"off"},Q=z=>{let Re=[];for(let Zt=0;Zt<z;Zt++)Re.push((Zt+1)/(z+1));return Re};if(B.length){let z=B.map(Re=>Re.pos!=null?Re.pos:.5);Bs(d,u,E,lr,!1,z,z.map(oe))}else if(Ae.dormersFront){let z=Q(Ae.dormersFront);Bs(d,u,E,lr,!1,z,z.map(oe))}if(J.length){let z=J.map(Re=>Re.pos!=null?Re.pos:.5);Bs(d,u,E,lr,!0,z,z.map(oe))}else if(Ae.dormersRear){let z=Q(Ae.dormersRear);Bs(d,u,E,lr,!0,z,z.map(oe))}}let ze=il(i["2f"])||{x0:e,y0:t,x1:n,y1:s},Iv=(ze.y0+ze.y1)/2,Hv=Math.max((ze.y1-ze.y0)/2,.1),Bv=w+(R||0);(j["2f"]||[]).filter(E=>E.type==="window").forEach(E=>{let B=E.pos!=null?E.pos:.5,J=E.w||4;if(E.wall==="left"||E.wall==="right"){let oe=E.wall==="left"?ze.x0-e<3?e:ze.x0:n-ze.x1<3?n:ze.x1,Q=ze.y0+B*(ze.y1-ze.y0),z=w+(1-Math.min(1,Math.abs(Q-Iv)/Hv))*(Bv-w),Re=Math.min(15,z-.5),Zt=Math.max(Re-2.8,10.2);Tn(d,u,oe,Q-J/2,Q+J/2,Zt,Re,ke(oe,Q),!0,E.wall==="left"?-.06:.06)}else{let oe=ze.x0+B*(ze.x1-ze.x0),Q=E.wall==="front"?ze.y0+3.5:ze.y1-3.5;an(d,u,Q,oe-J/2,oe+J/2,10.8,13.8,ke(oe,Q),!0,E.wall==="front"?-.3:.3)}});let De=il(i.bsmt),co=(j.bsmt||[]).filter(Le);De&&co.length&&co.forEach(E=>{let B=E.pos!=null?E.pos:.5,J=E.w||4,oe=E.wall==="front"||E.wall==="back",Q,z;E.wall==="front"?(Q=De.x0+B*(De.x1-De.x0),z=t):E.wall==="back"?(Q=De.x0+B*(De.x1-De.x0),z=s):E.wall==="left"?(Q=De.x0-e<3?e:De.x0,z=De.y0+B*(De.y1-De.y0)):(Q=n-De.x1<3?n:De.x1,z=De.y0+B*(De.y1-De.y0)),E.type==="window"?oe?an(d,u,z,Q-J/2,Q+J/2,.6,3.4,"off",!0,E.wall==="front"?-.06:.06):Tn(d,u,Q,z-J/2,z+J/2,.6,3.4,"off",!0,E.wall==="left"?-.06:.06):E.kind==="cellar"?rl(d,u,E.wall,Q,z,Math.max(J,5),E.open):ol(d,u,E.wall,Q,z,Math.max(J,3),.3,6.4,E.open)}),Ae.basementEntrance!=="interior"&&!Hn.length&&!co.length&&i.bsmt&&i.bsmt.length&&rl(d,u,"back",(e+n)/2,s,6,!1);let uo=Ae.chimney,hs=(t+s)/2,Nr=Math.max(1,Math.min(4,Math.round(Ae.chimneyCount||1))),xc=se&&se.ridge!=null?se.ridge:o,yi=E=>(E+1)/(Nr+1);if(uo==="center")for(let E=0;E<Nr;E++){let B,J;se&&se.axis==="x"&&se.a!=null&&se.b!=null?(B=se.a+(se.b-se.a)*yi(E),J=se.mid!=null?se.mid:hs):se&&se.axis==="y"?(B=(e+n)/2,J=t+(s-t)*yi(E)):(B=e+(n-e)*yi(E),J=hs),xf(d,B,J,xc-1.5,xc+4)}else if(uo==="left"&&se&&se.ridge)for(let E=0;E<Nr;E++)Au(d,e,Nr===1?hs:t+(s-t)*yi(E),se.ridge+4,-1);else if(uo==="right"&&se&&se.ridge)for(let E=0;E<Nr;E++)Au(d,n,Nr===1?hs:t+(s-t)*yi(E),se.ridge+4,1);return{faces:d,glow:u,labels:p}}function zs(r,i){let e=String(i||"").toLowerCase();return(r||[]).filter(t=>String(t.name).toLowerCase()===e)[0]}function Ks(r,i,e){let t=r.x,n=r.y,s=r.x+r.w,o=r.y+r.d;return i==="front"?[t+e*(s-t),n]:i==="back"?[t+e*(s-t),o]:i==="left"?[t,n+e*(o-n)]:[s,n+e*(o-n)]}function Sf(r){let i=r.plan||{},e=r.lit||{},t=r.floor||"all",n=[],s=[],o=[],l=g=>{let y=e[String(g).toLowerCase()];return y==="dom"?"dom":y==="mmwave"?"mmwave":y?"on":"off"},d=1e9,u=1e9,p=-1e9,v=-1e9,f=-1e9;if(Object.keys(i).forEach(g=>{let y=xu(g);g!=="b"&&g!=="bsmt"&&y[1]>f&&(f=y[1]),(i[g]||[]).forEach(_=>{_.x<d&&(d=_.x),_.y<u&&(u=_.y),_.x+_.w>p&&(p=_.x+_.w),_.y+_.d>v&&(v=_.y+_.d)})}),d>p&&(d=0,u=0,p=63,v=24),f<0&&(f=Cu),Qr=[(d+p)/2,(u+v)/2,9*.5],t!=="all"){let g=vf(i,t),y=xu(g),_=i[g]||[];_.forEach(C=>{C.points&&C.points.length>=3?hf(n,o,C.points,y[0],y[1],C.label||C.name,l(C.name)):pf(n,o,C.x,C.y,C.w,C.d,y[0],y[1],C.label||C.name,l(C.name))});let w=r.elements&&r.elements[g]||[],R=y[0]+.3,j=Math.min(y[0]+7,y[1]-.2);return w.filter(C=>C.type==="door"&&C.kind==="interior").forEach(C=>{let M=zs(_,C.room);if(!M)return;let[O,F]=Ks(M,C.wall,C.pos!=null?C.pos:.5);ol(n,s,C.wall,O,F,Math.max(C.w||3,3),R,j,C.open)}),w.filter(C=>C.type==="door"&&C.kind==="cased").forEach(C=>{let M=zs(_,C.room);if(!M)return;let[O,F]=Ks(M,C.wall,C.pos!=null?C.pos:.5);jf(n,C.wall,O,F,Math.max(C.w||3,3),R,j)}),w.filter(C=>C.type==="window"&&C.kind==="interior").forEach(C=>{let M=zs(_,C.room);if(!M)return;let O=C.pos!=null?C.pos:.5,F=Math.max(C.w||3,2),W=y[0]+2.5,G=Math.min(y[0]+6.5,y[1]-.4),[ne,V]=Ks(M,C.wall,O);C.wall==="front"?an(n,s,V,ne-F/2,ne+F/2,W,G,"off",!0,-.06):C.wall==="back"?an(n,s,V,ne-F/2,ne+F/2,W,G,"off",!0,.06):C.wall==="left"?Tn(n,s,ne,V-F/2,V+F/2,W,G,"off",!0,-.06):Tn(n,s,ne,V-F/2,V+F/2,W,G,"off",!0,.06)}),w.filter(C=>C.type==="door"&&C.kind==="french").forEach(C=>{let M=zs(_,C.room);if(!M)return;let O=C.pos!=null?C.pos:.5,F=Math.max(C.w||4,3),W=C.open?"on":"off",[G,ne]=Ks(M,C.wall,O);C.wall==="front"?an(n,s,ne,G-F/2,G+F/2,R,j,W,!0,-.07,2):C.wall==="back"?an(n,s,ne,G-F/2,G+F/2,R,j,W,!0,.07,2):C.wall==="left"?Tn(n,s,G,ne-F/2,ne+F/2,R,j,W,!0,-.07):Tn(n,s,G,ne-F/2,ne+F/2,R,j,W,!0,.07)}),{faces:n,glow:s,labels:o}}return kf(r,i,d,u,p,v,f)}function Du(r){return k=r.palette,uf(r.spec),Sf(r)}function sl(r){return String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Ef(r){return r.replace(/[^A-Za-z0-9_-]/g,"")}function Gs(r){let i=r.theta==null?35:r.theta,e=Du(r),t=e.faces,n=e.glow,s=e.labels||[];t.sort((V,ke)=>wu(ke,i)-wu(V,i));let o=1e9,l=1e9,d=-1e9,u=-1e9,p=t.concat(n);for(let V of p)for(let ke of V.p){let ie=Ni(ke,i);ie[0]<o&&(o=ie[0]),ie[0]>d&&(d=ie[0]),ie[1]<l&&(l=ie[1]),ie[1]>u&&(u=ie[1])}let v=40,f,g,y,_;r.box?[f,g,y,_]=r.box:(f=o-v,g=l-v,y=d-o+2*v,_=u-l+2*v);let w=`${f.toFixed(1)} ${g.toFixed(1)} ${y.toFixed(1)} ${_.toFixed(1)}`,R=V=>V.map(ke=>{let ie=Ni(ke,i);return`${ie[0].toFixed(1)},${ie[1].toFixed(1)}`}).join(" "),j=Ef(r.idPrefix||"j3d"),C=`${j}-glow`,M=`${j}-bg`,O=`${j}-sh`,F=V=>sl(V),W="";W+=`<defs><filter id="${C}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter><radialGradient id="${M}" cx="50%" cy="40%" r="65%"><stop offset="0%" style="stop-color:${F(k.bgGlow)}"/><stop offset="100%" style="stop-color:${F(k.bgGlow)};stop-opacity:0"/></radialGradient><radialGradient id="${O}" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:${F(k.shadow)}"/><stop offset="100%" style="stop-color:${F(k.shadow)};stop-opacity:0"/></radialGradient></defs>`,W+=`<rect x="${f.toFixed(1)}" y="${g.toFixed(1)}" width="${y.toFixed(1)}" height="${_.toFixed(1)}" fill="url(#${M})"/>`;let G=Ni([Qr[0],Qr[1],0],i);W+=`<ellipse cx="${G[0].toFixed(1)}" cy="${(u+v*.2).toFixed(1)}" rx="${((d-o)*.42).toFixed(1)}" ry="20" fill="url(#${O})"/>`;for(let V of n)W+=`<polygon points="${R(V.p)}" style="fill:${F(V.f)}" filter="url(#${C})"/>`;for(let V of t){let ke=V.f!=="none";W+=`<poly${ke?"gon":"line"} points="${R(V.p)}"${V.cls?` class="${sl(V.cls)}"`:""} style="fill:${ke?F(V.f):"none"};stroke:${F(V.s)}" stroke-width="${V.w}" stroke-linejoin="round" stroke-linecap="round"/>`}let ne=r.animate!==!1;for(let V of s){let ke=Ni([V.x,V.y,V.z],i);if(V.dot){let ie=V.st==="dom"?k.dotDom:V.st==="mmwave"?k.dotMmwave:k.dotOn;W+=`<circle cx="${ke[0].toFixed(1)}" cy="${ke[1].toFixed(1)}" r="2.4" style="fill:${F(ie)}">`+(ne?'<animate attributeName="opacity" values="0.35;1;0.35" dur="2s" repeatCount="indefinite"/>':"")+"</circle>"}else{let ie=V.st==="dom"?k.textDom:V.st==="mmwave"?k.textMmwave:V.st==="on"?k.textOn:k.textOff,Le=V.small?6:V.big?9:7.5;W+=`<text x="${ke[0].toFixed(1)}" y="${ke[1].toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="${Le}" font-weight="600" letter-spacing="0.8" paint-order="stroke" stroke-width="0.8" stroke-linejoin="round" style="fill:${F(ie)};stroke:${F(k.textHalo)}">${sl(V.t||"")}</text>`}}return`<svg xmlns="http://www.w3.org/2000/svg" width="${y.toFixed(0)}" height="${_.toFixed(0)}" viewBox="${w}" role="presentation" focusable="false">${W}</svg>`}function Vs(r){let i=Du(r),e=i.faces.concat(i.glow),t=1e9,n=1e9,s=-1e9,o=-1e9;for(let d=0;d<360;d+=15)for(let u of e)for(let p of u.p){let v=Ni(p,d);v[0]<t&&(t=v[0]),v[0]>s&&(s=v[0]),v[1]<n&&(n=v[1]),v[1]>o&&(o=v[1])}let l=46;return[t-l,n-l,s-t+2*l,o-n+2*l]}var dl=["--jv-surface","--jv-text","--jv-text-2","--jv-accent","--jv-ok","--jv-warn"],Rf=/^[\w\s#(),.%/+-]+$/;function Af(r){return r.length>0&&r.length<=200&&Rf.test(r)}var ee=(r,i)=>`color-mix(in srgb, ${r} ${i}%, transparent)`,on=(r,i,e)=>`color-mix(in srgb, ${r} ${i}%, ${e})`,Fu="",cl=null;function Ou(r){let i=null;try{i=typeof getComputedStyle=="function"?getComputedStyle(r):null}catch{i=null}let e={};for(let t of dl){let n="";try{n=i?i.getPropertyValue(t).trim():""}catch{n=""}e[t]=Af(n)?n:`var(${t})`}return e}function Ys(r){let i=Ou(r),e=dl.map(p=>i[p]).join("|");if(cl&&e===Fu)return cl;let t=i["--jv-surface"],n=i["--jv-text"],s=i["--jv-text-2"],o=i["--jv-accent"],l=i["--jv-ok"],d=i["--jv-warn"],u={wallFill:on(n,5,t),wallStroke:ee(n,55),wallFillDark:on(n,14,t),wallStrokeDark:ee(n,40),roofFill:on(n,24,t),roofStroke:ee(n,60),roofFillDark:on(n,36,t),roofStrokeDark:ee(n,45),gableFill:on(n,9,t),gableStroke:ee(n,50),chimneyFill:on(n,40,t),chimneyStroke:ee(n,55),chimneyCap:ee(n,12),solidDark:on(n,30,t),voidDark:on(n,70,t),doorOff:ee(o,12),doorOn:ee(o,35),doorStroke:ee(o,75),doorOpen:ee(d,40),doorOpenStroke:d,doorOpenGlow:ee(d,45),doorOpenFaint:ee(d,14),winOff:ee(o,10),winOn:ee(o,75),winDom:ee(l,85),glassOff:ee(o,45),glassOn:o,glassDom:l,edge:ee(n,50),dim:ee(n,28),faint:ee(n,14),glowOn:ee(o,50),glowDom:ee(l,55),casedFill:ee(s,12),casedStroke:ee(s,80),roomFillOff:ee(o,5),roomFillOn:ee(o,16),roomFillMmwave:ee(l,24),roomFillDom:ee(l,16),roomStrokeOff:ee(n,30),roomStrokeOn:ee(o,70),roomStrokeMmwave:l,roomStrokeDom:ee(l,90),roomWallOff:ee(n,3),roomWallOn:ee(o,6),roomWallMmwave:ee(l,10),roomWallDom:ee(l,6),dotOn:o,dotMmwave:l,dotDom:l,textOff:s,textOn:n,textMmwave:on(l,55,n),textDom:on(l,55,n),textHalo:t,bgGlow:ee(o,8),shadow:ee(n,22)};return Fu=e,cl=u,u}function Xs(r){let i=Ou(r);return dl.map(e=>i[e]).join("|")}var br=[{id:"cape_cod",label:"Cape Cod",roof:"gable",pitch:1,dormersFront:2,dormersRear:1},{id:"colonial",label:"Colonial",roof:"gable",pitch:.7,dormersFront:0,dormersRear:0},{id:"dutch_colonial",label:"Dutch Colonial",roof:"gambrel",pitch:.6,dormersFront:2,dormersRear:1},{id:"ranch",label:"Ranch",roof:"hip",pitch:.5,dormersFront:0,dormersRear:0},{id:"two_story",label:"Two-Story",roof:"gable",pitch:.65,dormersFront:0,dormersRear:0},{id:"craftsman",label:"Craftsman",roof:"hip",pitch:.6,dormersFront:1,dormersRear:0},{id:"modern",label:"Modern",roof:"flat",pitch:.12,dormersFront:0,dormersRear:0},{id:"townhouse",label:"Townhouse",roof:"gable",pitch:.85,dormersFront:0,dormersRear:0},{id:"apartment",label:"Apartment",roof:"flat",pitch:.12,dormersFront:0,dormersRear:0},{id:"cabin",label:"Cabin",roof:"gable",pitch:1.25,dormersFront:2,dormersRear:1}];function Jr(r){return br.find(i=>i.id===r)||br[0]}var Cf={"1f":{label:"1st Floor",rooms:[{name:"Garage",x:5,y:5,w:100,h:88,type:"room"},{name:"Kitchen",x:115,y:5,w:65,h:40,type:"room"},{name:"Bath",x:185,y:5,w:28,h:22,type:"bath"},{name:"Guest Room",x:218,y:5,w:95,h:40,type:"room"},{name:"Dining Room",x:115,y:50,w:65,h:38,type:"room"},{name:"Stairs",x:185,y:32,w:28,h:32,type:"stairs"},{name:"Living Room",x:218,y:50,w:95,h:38,type:"room"},{name:"Downstairs Hallway",x:115,y:93,w:198,h:20,type:"room"},{name:"Front Door",x:185,y:117,w:50,h:12,type:"door"}]},"2f":{label:"2nd Floor",rooms:[{name:"Eliana's Room",x:50,y:25,w:95,h:80,type:"room"},{name:"Bath",x:150,y:25,w:30,h:40,type:"bath"},{name:"Master Bedroom",x:185,y:25,w:85,h:80,type:"room"},{name:"Upstairs Hallway",x:150,y:70,w:30,h:35,type:"room"},{name:"Stairs",x:150,y:108,w:25,h:20,type:"stairs"}]},bsmt:{label:"Basement",rooms:[{name:"Basement",x:50,y:10,w:220,h:90,type:"room"},{name:"Stairs",x:120,y:20,w:28,h:35,type:"stairs"}]}},gr=.2;function xe(r){if(r===""||r==null)return null;let i=Number(r);return Number.isFinite(i)?i:null}function Iu(r){if(typeof r=="string"){if(!r.trim())return null;try{return JSON.parse(r)}catch{return null}}return r}function Zs(r){let i=Iu(r);return i&&typeof i=="object"&&!Array.isArray(i)&&Object.keys(i).length?{plan:i,configured:!0}:{plan:Cf,configured:!1}}function Qs(r){let i=Iu(r);return i&&typeof i=="object"&&!Array.isArray(i)?i:{}}function Nu(r,i){let e=r.slice().sort((o,l)=>o-l),t=[],n=null;for(let o of e)n&&o-n.start<=i?n.vals.push(o):(n={vals:[o],start:o},t.push(n));let s=t.map(o=>o.vals.reduce((l,d)=>l+d,0)/o.vals.length);return o=>{let l=o,d=i+1e-6;for(let u of s){let p=Math.abs(o-u);p<d&&(d=p,l=u)}return l}}function Tf(r){for(let e of Object.keys(r)){let t=r[e]||[];if(t.length<2)continue;let n=[],s=[];t.forEach(d=>{n.push(d.x,d.x+d.w),s.push(d.y,d.y+d.d),d.points?.forEach(u=>{n.push(u[0]),s.push(u[1])})});let o=Nu(n,1),l=Nu(s,1);t.forEach(d=>{let u=o(d.x),p=o(d.x+d.w),v=l(d.y),f=l(d.y+d.d);d.x=u,d.w=p-u,d.y=v,d.d=f-v,d.points&&(d.points=d.points.map(g=>[o(g[0]),l(g[1])]))})}return r}function Js(r){let i={};for(let e of Object.keys(r||{})){let t=Array.isArray(r[e]?.rooms)?r[e].rooms:[];i[e]=t.filter(n=>n&&n.type!=="outdoor").map(n=>({name:String(n.name||"").toLowerCase(),label:String(n.name||"").toUpperCase(),x:(Number(n.x)||0)*gr,y:(Number(n.y)||0)*gr,w:(Number(n.w)||0)*gr,d:(Number(n.h)||0)*gr,type:n.type,points:Array.isArray(n.points)&&n.points.length>=3?n.points.map(s=>[s[0]*gr,s[1]*gr]):void 0}))}return Tf(i)}function Hu(r,i){if(!i||typeof i!="string")return!1;let e=r?.states?.[i]?.state;return e==="on"||e==="open"}function ea(r,i){let e={};for(let t of Object.keys(r||{})){let n=Array.isArray(r[t])?r[t]:[];e[t]=n.map(s=>({type:s.type,kind:s.kind,wall:s.wall,room:s.room,slope:s.slope,pos:s.pos!=null?Number(s.pos):.5,w:(Number(s.w)||20)*gr,open:Hu(i,s.entity)}))}return e}function ta(r,i){let e=r.door_mapping&&typeof r.door_mapping=="object"?r.door_mapping:{},t=Math.max(0,Math.min(Number(r.garage_bays)||0,8)),n=[];for(let s=1;s<=t;s++){let o=e[`garage_${s}`]||s===1&&e.garage||"";n.push({open:Hu(i,o)})}return n}function na(r){let i=Jr(r.residence_style),e=xe(r.dormers_front),t=xe(r.dormers_rear),n=xe(r.home_stories),s={roof:i.roof,stories:n??1.5,pitch:i.pitch,dormersFront:e??i.dormersFront,dormersRear:t??i.dormersRear,chimneyCount:Math.max(1,Math.min(4,xe(r.chimney_count)||1)),basementEntrance:r.basement_entrance==="interior"?"interior":"bulkhead"},o=xe(r.garage_bays);o!=null&&(s.garageBays=o);let l=r.chimney_side;return(l==="right"||l==="left"||l==="center"||l==="none")&&(s.chimney=l),s}function Bu(r,i){let e={};for(let n of r?.areas||[])n.active&&(e[String(n.name).toLowerCase()]="on");for(let n of i?.rooms||[])n.detecting_count>0&&(e[String(n.name).toLowerCase()]="mmwave");let t=r?.dominant;return t&&t.name&&t.area_id&&(e[String(t.name).toLowerCase()]="dom"),e}function zu(r,i){let e=xe(r.floor_plan_sqft);if(e)return e;let t=0;for(let n of Object.keys(i||{}))for(let s of i[n]?.rooms||[])s.type==="door"||s.type==="stairs"||(t+=(Number(s.w)||0)*(Number(s.h)||0));return t?Math.min(5e3,Math.max(600,Math.round(t*.032/50)*50)):null}var ra=class{constructor(i=100){this.max=i;this._entries=[];this._index=-1;this._listeners=new Set}reset(i){this._entries=[{label:"",state:i,at:Date.now()}],this._index=0,this._emit()}clear(){this._entries=[],this._index=-1,this._emit()}push(i,e,t={}){let n=Date.now(),s=this._entries[this._index];if(t.coalesce&&this._index>0&&s&&s.key===t.coalesce&&n-s.at<=(t.within??800)){s.state=e,s.at=n,s.label=i,this._entries.length=this._index+1,this._emit();return}this._entries.length=this._index+1,this._entries.push({label:i,state:e,key:t.coalesce,at:n}),this._entries.length>this.max&&this._entries.splice(0,this._entries.length-this.max),this._index=this._entries.length-1,this._emit()}replaceCurrent(i){let e=this._entries[this._index];e&&(e.state=i)}undo(){return this.canUndo?(this._index-=1,this._emit(),this._entries[this._index].state):null}redo(){return this.canRedo?(this._index+=1,this._emit(),this._entries[this._index].state):null}get canUndo(){return this._index>0}get canRedo(){return this._index>=0&&this._index<this._entries.length-1}get undoLabel(){return this.canUndo?this._entries[this._index].label:""}get redoLabel(){return this.canRedo?this._entries[this._index+1].label:""}get current(){return this._entries[this._index]?.state??null}get length(){return this._entries.length}get index(){return this._index}subscribe(i){return this._listeners.add(i),()=>{this._listeners.delete(i)}}_emit(){for(let i of this._listeners)try{i()}catch{}}};var Nt=.2,yr=.3048,Bi=10,Gn=50,zi=5,Vu=3,cn=15,dn=10,Ki={x0:0,y0:0,x1:320,y1:150},ln=[{key:"1f",label:"1st Floor"},{key:"2f",label:"2nd Floor"},{key:"bsmt",label:"Basement"}];function Ui(r){return ln.some(i=>i.key===r)}var qi=[{value:"room",label:"Room"},{value:"bath",label:"Bathroom"},{value:"stairs",label:"Stairs"},{value:"door",label:"Door"},{value:"outdoor",label:"Outdoor zone"}],ul=["front","back","left","right"],ia=new Set(["interior","cased","french"]),sa=[{label:"Window",type:"window",kind:null},{label:"Interior Window",type:"window",kind:"interior"},{label:"Exterior Door",type:"door",kind:"exterior"},{label:"Balcony Door",type:"door",kind:"french"},{label:"Cellar Door",type:"door",kind:"cellar"},{label:"Interior Door",type:"door",kind:"interior"},{label:"Cased Opening",type:"door",kind:"cased"},{label:"Front Dormer",type:"dormer",kind:null,slope:"front",floors:["2f"]},{label:"Rear Dormer",type:"dormer",kind:null,slope:"rear",floors:["2f"]}],un=["floor_plan_rooms","floor_plan_elements","floor_plan_cameras","floor_plan_entities","floor_plan_property"],Yu=[{key:"residence_style",kind:"str",label:"HOME STYLE",options:br.map(r=>({value:r.id,label:r.label}))},{key:"home_stories",kind:"enum",label:"Stories",options:["1","1.5","2","3"].map(r=>({value:r,label:r}))},{key:"has_basement",kind:"bool",label:"Has basement"},{key:"dormers_front",kind:"int",label:"Front dormers",min:0,max:3},{key:"dormers_rear",kind:"int",label:"Rear dormers",min:0,max:2},{key:"garage_bays",kind:"int",label:"Garage bays",min:0,max:4},{key:"chimney_side",kind:"enum",label:"Chimney side",options:[{value:"right",label:"Right"},{value:"left",label:"Left"},{value:"center",label:"Center"},{value:"none",label:"None"}]},{key:"chimney_count",kind:"int",label:"Chimney count",min:1,max:4},{key:"basement_entrance",kind:"enum",label:"Basement entrance",options:[{value:"bulkhead",label:"Bulkhead"},{value:"interior",label:"Interior"}]},{key:"home_bedrooms",kind:"int",label:"Bedrooms",min:0,max:20,nullable:!0},{key:"home_bathrooms",kind:"int",label:"Bathrooms",min:0,max:20,nullable:!0},{key:"floor_plan_sqft",kind:"int",label:"Square footage",min:0,max:1e5,nullable:!0}],D=r=>Math.round(r),Z=r=>Math.round(r*10)/10,It=(r,i,e)=>Math.min(e,Math.max(i,r));function xt(r){if(typeof r=="string"){if(!r.trim())return null;try{return JSON.parse(r)}catch{return null}}return r}function re(r){return r&&typeof r=="object"&&!Array.isArray(r)?r:null}function Mf(r){return Array.isArray(r)&&r.length>=2&&Number.isFinite(Number(r[0]))&&Number.isFinite(Number(r[1]))}function aa(r){if(!Array.isArray(r)||r.length<3)return;let i=[];for(let e of r){if(!Mf(e))return;i.push([Number(e[0]),Number(e[1])])}return i}function Wi(r){try{if(typeof structuredClone=="function")return structuredClone(r)}catch{}return JSON.parse(JSON.stringify(r))}var Ku=0;function _r(){return Ku+=1,`r${Date.now().toString(36)}${Ku.toString(36)}`}function oa(r,i){let e=new Set(i),t=r+Date.now().toString(36);if(!e.has(t))return t;let n=1;for(;e.has(t+n.toString(36));)n++;return t+n.toString(36)}function Xu(r,i,e,t){let n=new Set(t),s=`${r}-${String(i).replace(/[^A-Za-z0-9_-]/g,"_")}-${e}`;if(!n.has(s))return s;let o=2;for(;n.has(`${s}-${o}`);)o++;return`${s}-${o}`}function je(r){return r.points&&r.points.length>=3?r.points:[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]]}function pe(r){if(!r.length)return null;let i=1/0,e=1/0,t=-1/0,n=-1/0;for(let[s,o]of r)s<i&&(i=s),s>t&&(t=s),o<e&&(e=o),o>n&&(n=o);return{x0:i,y0:e,x1:t,y1:n}}function ut(r,i){return r?i?{x0:Math.min(r.x0,i.x0),y0:Math.min(r.y0,i.y0),x1:Math.max(r.x1,i.x1),y1:Math.max(r.y1,i.y1)}:r:i}function Zu(r){return{x0:r.x,y0:r.y,x1:r.x+r.w,y1:r.y+r.h}}function Ht(r){let i=r.points&&r.points.length>=3?pe(r.points):null;return i&&(r.x=D(i.x0),r.y=D(i.y0),r.w=D(i.x1-i.x0),r.h=D(i.y1-i.y0)),r}function Qu(r,i,e){let t=!1;for(let n=0,s=e.length-1;n<e.length;s=n++){let o=e[n][0],l=e[n][1],d=e[s][0],u=e[s][1];l>i!=u>i&&r<(d-o)*(i-l)/(u-l)+o&&(t=!t)}return t}function pl(r){let i=0;for(let e=0;e<r.length;e++){let t=r[e],n=r[(e+1)%r.length];i+=t[0]*n[1]-n[0]*t[1]}return Math.abs(i)/2}function Bt(r){let i=null;for(let e of r)e.type!=="outdoor"&&(i=ut(i,Zu(e)));return i}function Ju(r,i){let e=null,t=Oe(r,i);for(let n of t?.rooms||[])e=ut(e,pe(je(n)));e=ut(e,pe(r.property.points));for(let n of r.cameras[i]||[])e=ut(e,{x0:n.x,y0:n.y,x1:n.x,y1:n.y});for(let n of r.pins[i]||[])e=ut(e,{x0:n.x,y0:n.y,x1:n.x,y1:n.y});return e}function hl(r,i){if(r.kind&&ia.has(r.kind)&&r.room){let e=i.find(t=>t.name===r.room);if(e)return Zu(e)}return Bt(i)}function ep(r){return r==="2f"?"1f":r==="1f"?"bsmt":null}function Hi(r,i){return i==="2f"?String(r.home_stories??"1.5")!=="1":i==="bsmt"?r.has_basement!==!1&&r.has_basement!=="false":!0}function Pf(r,i,e){let t=re(r);if(!t)return null;let{name:n,x:s,y:o,w:l,h:d,type:u,points:p,...v}=t,f=d;f===void 0&&"d"in v&&(f=v.d,delete v.d);let g={id:_r(),name:String(n??""),x:Number(s)||0,y:Number(o)||0,w:Number(l)||0,h:Number(f)||0,type:typeof u=="string"&&u?u:"room",extra:v},y=aa(p);return y?(g.points=y.map(_=>[Z(_[0]),Z(_[1])]),Ht(g)):(g.w<=0||g.h<=0)&&e.push(`"${g.name}" on ${i} has no size`),g}function Lf(r){if(!Array.isArray(r))return;let i=[];for(let e of r){let t=re(e);!t||typeof t.text!="string"||i.push({text:t.text,x:Number(t.x)||0,y:Number(t.y)||0})}return i}function Df(r,i,e){let t,n,s,o={};if(Array.isArray(i))t=i;else{let u=re(i);if(!u)return e.push(`floor ${r} is not an object`),null;let{rooms:p,label:v,labels:f,...g}=u;t=p,n=typeof v=="string"?v:void 0,s=Lf(f),o=g}let l=[];for(let u of Array.isArray(t)?t:[]){let p=Pf(u,r,e);p&&l.push(p)}let d={key:r,rooms:l,extra:o,stored:!0};return n!==void 0&&(d.label=n),s&&(d.labels=s),d}function Ff(r,i,e,t,n){let s=re(r);if(!s)return null;let{id:o,type:l,kind:d,wall:u,room:p,slope:v,pos:f,w:g,entity:y,..._}=s;if(l!=="window"&&l!=="door"&&l!=="dormer")return n.push(`opening of unknown type "${String(l)}" on ${e} dropped`),null;let w=Number(f),R={id:typeof o=="string"&&o?o:Xu("e",e,t,i),type:l,kind:typeof d=="string"&&d?d:null,wall:ul.includes(String(u))?u:"front",pos:Number.isFinite(w)?It(w,0,1):.5,w:Number(g)||20,entity:typeof y=="string"?y:"",extra:_};return i.add(R.id),typeof p=="string"&&p&&(R.room=p),l==="dormer"?R.slope=v==="rear"?"rear":"front":v!==void 0&&(R.extra.slope=v),R}function Of(r,i,e,t){let n=re(r);if(!n)return null;let{id:s,x:o,y:l,angle:d,fov:u,range:p,entity:v,indoor:f,coverage:g,...y}=n,_={id:typeof s=="string"&&s?s:Xu("c",e,t,i),x:Number(o)||0,y:Number(l)||0,angle:xe(d)??270,fov:It(xe(u)??90,20,170),range:Math.max(5,xe(p)??55),entity:typeof v=="string"?v:"",indoor:f!==!1,extra:y};i.add(_.id);let w=re(g);return w&&Array.isArray(w.covered)&&(_.coverage={covered:w.covered.map(R=>String(R)),reason:typeof w.reason=="string"?w.reason:"",source:typeof w.source=="string"?w.source:"geometry",ts:xe(w.ts)??0}),_}function Nf(r){let i=re(r);if(!i||typeof i.e!="string"||!i.e)return null;let{e,x:t,y:n,...s}=i;return{e,x:Number(t)||0,y:Number(n)||0,extra:s}}function Uu(r,i){let e={},t=re(xt(r));if(!t)return e;for(let n of Object.keys(t)){let s=t[n];if(!Array.isArray(s))continue;let o=[];s.forEach((l,d)=>{let u=i(l,n,d);u&&o.push(u)}),e[n]=o}return e}var qu=r=>{let i=ln.findIndex(e=>e.key===r);return i<0?ln.length:i};function tp(r){return r.sort((i,e)=>qu(i.key)-qu(e.key))}function Gi(r){let i=r||{},e=[],{plan:t,configured:n}=Zs(i.floor_plan_rooms),s=[],o=t;for(let _ of Object.keys(o)){let w=Df(_,o[_],e);w&&s.push(w)}for(let _ of ln)!s.some(w=>w.key===_.key)&&Hi(i,_.key)&&s.push({key:_.key,rooms:[],extra:{},stored:!1});tp(s);let l=new Set,d={},u=Qs(i.floor_plan_elements);for(let _ of Object.keys(u)){let w=u[_];if(!Array.isArray(w))continue;let R=[];w.forEach((j,C)=>{let M=Ff(j,l,_,C,e);M&&R.push(M)}),d[_]=R}let p=new Set,v=Uu(i.floor_plan_cameras,(_,w,R)=>Of(_,p,w,R)),f=Uu(i.floor_plan_entities,Nf),g=re(xt(i.floor_plan_property)),y={points:g&&aa(g.points)||[]};return{doc:{floors:s,openings:d,cameras:v,pins:f,property:y},configured:n,warnings:e}}function vl(r,i){let e=s=>!s.stored&&!s.rooms.length&&s.label===void 0&&!s.labels?.length&&!Object.keys(s.extra).length&&!r.openings[s.key]?.length&&!r.cameras[s.key]?.length&&!r.pins[s.key]?.length,t=r.floors.filter(s=>!(Ui(s.key)&&!Hi(i,s.key)&&e(s))),n=t.length!==r.floors.length;for(let s of ln)Hi(i,s.key)&&!t.some(o=>o.key===s.key)&&(t=[...t,{key:s.key,rooms:[],extra:{},stored:!1}],n=!0);return n?{...r,floors:tp(t)}:null}function If(r){let i={},e=re(xt(r));if(!e)return i;for(let t of Object.keys(e)){let n=e[t];typeof n=="string"&&/^(data:|\/|https?:)/.test(n)&&(i[t]=n)}return i}function Hf(r){let i=xe(r);return i!=null&&i>=0&&i<=1?i:.2}function ml(r){return r==="metric"?"metric":"imperial"}function fl(r){let i={},e=re(xt(r));if(!e)return i;for(let t of Object.keys(e))typeof e[t]=="string"&&e[t]&&(i[t]=e[t]);return i}function np(r){let i=r||{};return{units:ml(i.floor_plan_units),bg:If(i.floor_plan_bg),bgOpacity:Hf(i.floor_plan_bg_opacity),doorMapping:fl(i.door_mapping)}}function Bf(r){let i=r.points&&r.points.length>=3?r.points.map(n=>[Z(n[0]),Z(n[1])]):null,e=i?Ht({x:r.x,y:r.y,w:r.w,h:r.h,points:i}):r,t={...r.extra,name:r.name,x:D(e.x),y:D(e.y),w:D(e.w),h:D(e.h),type:r.type};return i&&(t.points=i),t}function rp(r){let i={};for(let e of r.floors){if(!(e.rooms.length>0||e.label!==void 0||e.labels&&e.labels.length>0||Object.keys(e.extra).length>0||e.stored))continue;let n={};e.label!==void 0&&(n.label=e.label),n.rooms=e.rooms.map(Bf),e.labels&&e.labels.length&&(n.labels=e.labels.map(s=>({text:s.text,x:s.x,y:s.y}))),Object.assign(n,e.extra),i[e.key]=n}return i}function zf(r){let i={...r.extra,id:r.id,type:r.type,kind:r.kind??null};return r.type==="dormer"?i.slope=r.slope??"front":i.wall=r.wall,i.pos=r.pos,r.type!=="dormer"&&(i.w=r.w),i.entity=r.entity,r.room&&(i.room=r.room),i}function ip(r){let i={};for(let e of Object.keys(r.openings)){let t=r.openings[e];t&&t.length&&(i[e]=t.map(zf))}return i}function Kf(r){let i={...r.extra,id:r.id,x:D(r.x),y:D(r.y),angle:r.angle,fov:r.fov,range:r.range,entity:r.entity,indoor:r.indoor};return r.coverage&&(i.coverage={covered:[...r.coverage.covered],reason:r.coverage.reason,source:r.coverage.source,ts:r.coverage.ts}),i}function Uf(r){let i={};for(let e of Object.keys(r.cameras)){let t=r.cameras[e];t&&t.length&&(i[e]=t.map(Kf))}return i}function qf(r){return{...r.extra,e:r.e,x:D(r.x),y:D(r.y)}}function Wf(r){let i={};for(let e of Object.keys(r.pins)){let t=r.pins[e];t&&t.length&&(i[e]=t.map(qf))}return i}function Gf(r){return{points:r.property.points.length>=3?r.property.points.map(i=>[D(i[0]),D(i[1])]):[]}}function ei(r){return{floor_plan_rooms:rp(r),floor_plan_elements:ip(r),floor_plan_cameras:Uf(r),floor_plan_entities:Wf(r),floor_plan_property:Gf(r)}}function ti(r){return JSON.stringify(r)}function sp(r){return Js(rp(r))}function ap(r,i){return ea(ip(r),i)}function op(r){return r==="bsmt"?"b":r==="1f"||r==="2f"?r:"all"}function zt(r,i){let e=r*Nt;return Z(i==="metric"?e*yr:e)}function wr(r,i,e=1){let t=i==="metric"?r/yr:r;return Math.max(e,D(t/Nt))}function Pe(r){return r==="metric"?"m":"ft"}function H(r,i){return`${zt(r,i)} ${Pe(i)}`}function la(r,i){if(r.length<3)return"";let e=pl(r)*Nt*Nt;if(i==="metric"){let t=e*.092903;return t>=1e4?`${(t/1e4).toFixed(2)} ha`:`${Math.round(t).toLocaleString()} m²`}return e>=43560?`${(e/43560).toFixed(2)} acres`:`${Math.round(e).toLocaleString()} sq ft`}function Oe(r,i){return r.floors.find(e=>e.key===i)}function $r(r,i){let e=Oe(r,i);return e||(e={key:i,rooms:[],extra:{},stored:!1},r.floors.push(e)),e}function pn(r,i){return r[i]??=[]}function lp(r){let i=typeof r=="string"?r:r.key;return(typeof r=="string"?void 0:r.label)||ln.find(t=>t.key===i)?.label||i}function q(r,i){for(let e of r.floors){let t=e.rooms.findIndex(n=>n.id===i);if(t>=0)return{floor:e,room:e.rooms[t],index:t}}return null}function Kt(r,i){for(let e of Object.keys(r.openings)){let t=r.openings[e].findIndex(n=>n.id===i);if(t>=0)return{floor:e,opening:r.openings[e][t],index:t}}return null}function Me(r,i){for(let e of Object.keys(r.cameras)){let t=r.cameras[e].findIndex(n=>n.id===i);if(t>=0)return{floor:e,camera:r.cameras[e][t],index:t}}return null}function Mn(r,i,e){for(let t of e?[e]:Object.keys(r.pins)){let n=r.pins[t]||[],s=n.findIndex(o=>o.e===i);if(s>=0)return{floor:t,pin:n[s],index:s}}return null}function gl(r,i,e){if(!i)return!1;switch(i.kind){case"room":return!!q(r,i.id);case"vtx":{let t=q(r,i.id)?.room;return!!t?.points&&i.sub!=null&&i.sub<t.points.length}case"opening":return!!Kt(r,i.id);case"camera":return!!Me(r,i.id);case"pin":return!!Mn(r,i.id,e);case"prop-vtx":return i.sub!=null&&i.sub<r.property.points.length;default:return!1}}function ca(r,i,e){r.x+=i,r.y+=e,r.points?(r.points=r.points.map(t=>[Z(t[0]+i),Z(t[1]+e)]),Ht(r)):(r.x=D(r.x),r.y=D(r.y))}function cp(r,i,e,t,n){if(!i||!e&&!t)return null;switch(i.kind){case"room":{let s=q(r,i.id);return s?(ca(s.room,e,t),`Move ${s.room.name||"room"}`):null}case"vtx":{let s=q(r,i.id),o=s?.room.points;return!s||!o||i.sub==null||!o[i.sub]?null:(o[i.sub]=[Z(o[i.sub][0]+e),Z(o[i.sub][1]+t)],Ht(s.room),`Reshape ${s.room.name||"room"}`)}case"prop-vtx":{let s=r.property.points[i.sub??-1];return s?(r.property.points[i.sub]=[D(s[0]+e),D(s[1]+t)],"Move property corner"):null}case"camera":{let s=Me(r,i.id);return s?(s.camera.x=D(s.camera.x+e),s.camera.y=D(s.camera.y+t),"Move camera"):null}case"pin":{let s=Mn(r,i.id,n);return s?(s.pin.x=D(s.pin.x+e),s.pin.y=D(s.pin.y+t),`Move ${s.pin.e}`):null}case"opening":{let s=Kt(r,i.id);if(!s)return null;let o=s.opening,l=Oe(r,s.floor)?.rooms||[],d=hl(o,l);if(!d)return null;let u=o.type==="dormer"||o.wall==="front"||o.wall==="back",p=u?d.x1-d.x0:d.y1-d.y0;return p<=0?null:(o.pos=It(Math.round((o.pos+(u?e:t)/p)*1e3)/1e3,0,1),"Move opening")}default:return null}}function dp(r,i,e){if(!i)return null;switch(i.kind){case"room":{let t=q(r,i.id);if(!t)return null;t.floor.rooms.splice(t.index,1);let n=r.openings[t.floor.key];return n&&t.room.name&&(r.openings[t.floor.key]=n.filter(s=>s.room!==t.room.name)),`Removed ${t.room.name||"room"}`}case"vtx":{let t=q(r,i.id),n=t?.room.points;return!t||!n||n.length<=3||i.sub==null||!n[i.sub]?null:(n.splice(i.sub,1),Ht(t.room),`Removed a corner of ${t.room.name||"room"}`)}case"prop-vtx":{let t=r.property.points;return t.length<=3||i.sub==null||!t[i.sub]?null:(t.splice(i.sub,1),"Removed a property corner")}case"opening":{let t=Kt(r,i.id);return t?(r.openings[t.floor].splice(t.index,1),"Removed opening"):null}case"camera":{let t=Me(r,i.id);return t?(r.cameras[t.floor].splice(t.index,1),"Removed camera"):null}case"pin":{let t=Mn(r,i.id,e);return t?(r.pins[t.floor].splice(t.index,1),`Removed ${t.pin.e}`):null}default:return null}}function up(r,i,e){if(!i)return null;switch(i.kind){case"room":case"vtx":{let t=q(r,i.id)?.room;return t?{name:t.name||"room",w:t.w,h:t.h}:null}case"opening":{let t=Kt(r,i.id)?.opening;return t?{name:`${t.kind?t.kind+" ":""}${t.type}`,w:t.w}:null}case"camera":return Me(r,i.id)?{name:Me(r,i.id)?.camera.entity||"camera"}:null;case"pin":return Mn(r,i.id,e)?{name:i.id}:null;case"prop-vtx":return{name:"property corner"};default:return null}}function Wu(r){return String(r??"").trim().toLowerCase()}function pp(r){return(r?.areas||[]).map(i=>String(i.name||"")).filter(Boolean)}function bl(r,i){let e=Wu(r);return!!e&&i.some(t=>Wu(t)===e)}function hp(r){let i=It(xe(r.garage_bays)??0,0,8),e=[{slot:"front",label:"Front Door",backend:!0}];if(i>=1)for(let t=1;t<=i;t++)e.push({slot:`garage_${t}`,label:"Garage Door {n}",n:t,backend:!1});else e.push({slot:"garage",label:"Garage Door",backend:!0});return e.push({slot:"garage_rear",label:"Garage Side / Rear",backend:!0},{slot:"kitchen_garage",label:"Kitchen ↔ Garage",backend:!0},{slot:"cellar",label:"Cellar / Bulkhead",backend:!0},{slot:"basement",label:"Basement",backend:!0}),e}function vp(r,i){let e=new Set(i.map(t=>t.slot));return Object.keys(r).filter(t=>!e.has(t)&&r[t])}function rt(r,i){let e=r?.states?.[i]?.attributes?.friendly_name;return typeof e=="string"&&e?e:i}function yl(r,i){return!!r?.states?.[i]}function mp(r,i=""){let e=Object.keys(r?.states||{}).filter(t=>t.startsWith("camera.")).sort();return i&&!e.includes(i)&&e.unshift(i),e}var fp=new Set(["door","window","garage_door","opening"]),Gu=/door|garage|gate|cellar|bulkhead|hatch|window|contact|entry|slider|sash|casement|patio|french|skylight|opening|sliding/i;function da(r,i=""){let e=r?.states||{},t=[];for(let n of Object.keys(e)){let s=n.split(".")[0],o=e[n]?.attributes||{},l=String(o.device_class||""),d=String(o.friendly_name||"");(s==="cover"||s==="lock"||s==="binary_sensor"&&(fp.has(l)||Gu.test(n)||Gu.test(d)))&&t.push(n)}return t.sort(),i&&!t.includes(i)&&t.unshift(i),t}var Vf=new Set(["off","unavailable","unknown","idle","standby","none"]);function _l(r,i){let e=r?.states?.[i];if(!e)return{level:"neutral",value:"—",name:i};let t=i.split(".")[0]||"",n=e.state,s=e.attributes||{},o=String(s.device_class||""),l=typeof s.friendly_name=="string"&&s.friendly_name?s.friendly_name:i;if(t==="sensor"){let d=typeof s.unit_of_measurement=="string"?s.unit_of_measurement:"";return{level:"info",value:n==="unknown"||n==="unavailable"?"—":`${n}${d?" "+d:""}`,name:l}}if(t==="binary_sensor"){let d=n==="on";return fp.has(o)?{level:d?"warn":"neutral",value:d?"Open":"Closed",name:l}:o==="motion"||o==="occupancy"||o==="presence"?{level:d?"ok":"neutral",value:d?"Detected":"—",name:l}:{level:d?"ok":"neutral",value:d?"On":"Off",name:l}}if(t==="lock")return n==="locked"?{level:"neutral",value:"Locked",name:l}:{level:"danger",value:"Unlocked",name:l};if(t==="cover"){let d=n==="open"||n==="opening";return{level:d?"warn":"neutral",value:d?"Open":"Closed",name:l}}if(t==="person"||t==="device_tracker")return n==="home"?{level:"ok",value:"At home",name:l}:{level:"neutral",value:"Away",name:l};if(t==="climate"){let d=s.current_temperature;return{level:"info",value:d!=null&&d!==""?`${d}°`:n,name:l}}return Vf.has(n)?{level:"neutral",value:"Off",name:l}:{level:"ok",value:"On",name:l}}var hn=[{id:"rooms",label:"Rooms",element:"jarvis-editor-rooms",icon:"mdi:floor-plan"},{id:"openings",label:"Openings",element:"jarvis-editor-openings",icon:"mdi:window-closed-variant"},{id:"doors",label:"Doors",element:"jarvis-editor-doors",icon:"mdi:door"},{id:"pins",label:"Cameras & pins",element:"jarvis-editor-pins",icon:"mdi:cctv"},{id:"import",label:"Import",element:"jarvis-editor-import",icon:"mdi:import"}];function gp(r){return hn.some(i=>i.id===r)}var Yf=()=>({floors:[],openings:{},cameras:{},pins:{},property:{points:[]}}),Xf=2500,Zf=4e3,xr=4*1024*1024-8*1024;function pa(r,i){let e=JSON.stringify({id:1e9,type:"jarvis/update_config",key:r,value:i});try{return new TextEncoder().encode(e).length}catch{return e.length*3}}var ua=r=>(r/(1024*1024)).toFixed(2),ha=class{constructor(){this.canvas=null;this.data=null;this.history=new ra;this._doc=Yf();this._config={};this._overlay={};this._settingsCache=null;this._baseline=this._emptyBaseline();this._baselineText="";this._dirtyKeys=[];this._pendingRemote=null;this._dismissedRemote="";this._floor="1f";this._tab="rooms";this._selection=null;this._listeners=new Set;this._queued=!1;this._toastSeq=0;this._historyRev=0;this._timers=new Map;this.loaded=!1;this.configured=!0;this.warnings=[];this.saving=!1;this.saveError=null;this.saveErrorCode=null;this.remoteChanged=!1;this.settingStatus={};this.toasts=[];this.history.subscribe(()=>{this._historyRev+=1,this.toasts.some(i=>i.action&&i.rev!==this._historyRev)&&(this.toasts=this.toasts.map(i=>i.action&&i.rev!==this._historyRev?{...i,action:void 0}:i)),this._notify()})}subscribe(i){return this._listeners.add(i),()=>{this._listeners.delete(i)}}_notify(){this._settingsCache=null,!this._queued&&(this._queued=!0,queueMicrotask(()=>{this._queued=!1;for(let i of this._listeners)try{i()}catch{}}))}get doc(){return this._doc}get config(){return{...this._config,...this._overlay}}get settings(){return this._settingsCache??=np(this.config)}get floor(){return this._floor}get tab(){return this._tab}get selection(){return this._selection}get dirty(){return this._dirtyKeys.length>0}get dirtyKeys(){return this._dirtyKeys}get canUndo(){return this.history.canUndo}get canRedo(){return this.history.canRedo}get undoLabel(){return this.history.undoLabel}get redoLabel(){return this.history.redoLabel}get floors(){return this._doc.floors}get currentFloor(){return Oe(this._doc,this._floor)}rooms(i=this._floor){return Oe(this._doc,i)?.rooms||[]}openings(i=this._floor){return this._doc.openings[i]||[]}cameras(i=this._floor){return this._doc.cameras[i]||[]}pins(i=this._floor){return this._doc.pins[i]||[]}floorLabel(i=this._floor){let e=Oe(this._doc,i);return lp(e??i)}floorHidden(i){return!Ui(i)||!Hi(this.config,i)}areaNames(){return pp(this.data)}describeSelection(){return up(this._doc,this._selection,this._floor)}setFloor(i){i!==this._floor&&(this._floor=i,this._selection=null,this._notify())}setTab(i){i!==this._tab&&(this._tab=i,this._notify())}select(i){let e=i&&gl(this._doc,i,this._floor)?{kind:i.kind,id:i.id,...i.sub!=null?{sub:i.sub}:{}}:null;ti(e)!==ti(this._selection)&&(this._selection=e,this._notify())}change(i,e,t={}){this.changeWith(n=>(e(n),i),t)}changeWith(i,e={}){let t=Wi(this._doc),n=i(t);return n==null?null:(this._doc=t,e.transient||this.history.push(n,t,{coalesce:e.coalesce}),this._afterDocChange(),n)}undo(){let i=this.history.undo();return i?(this._doc=i,this._afterDocChange(),!0):!1}redo(){let i=this.history.redo();return i?(this._doc=i,this._afterDocChange(),!0):!1}nudgeSelection(i,e){let t=this._selection;if(!t)return null;let n=this._floor;return this.changeWith(s=>cp(s,t,i,e,n),{coalesce:`nudge:${n}:${t.kind}:${t.id}:${t.sub??""}`})}removeSelection(){let i=this._selection;if(!i)return null;let e=this._floor,t=this.changeWith(n=>dp(n,i,e));return t&&this.select(null),t}_afterDocChange(){this._syncFloors(),this._selection&&!gl(this._doc,this._selection,this._floor)&&(this._selection=null),this._recomputeDirty(),this._notify()}_syncFloors(){let i=vl(this._doc,this.config);i&&(this._doc=i),!Oe(this._doc,this._floor)&&this._doc.floors.length&&(this._floor=this._doc.floors[0].key,this._selection=null)}load(i){if(!i)return;this.data=i,this._config=i.config||{};for(let s of Object.keys(this._overlay))this.settingStatus[s]?.level!=="saving"&&delete this._overlay[s];let e=Gi(this._config),t=this._baselineOf(e.doc),n=this._joinBaseline(t);this.loaded?n!==this._baselineText?this.dirty?n!==this._dismissedRemote&&(this._pendingRemote={parsed:e,baseline:t},this.remoteChanged=!0):this._adopt(e,t):this.dirty||(this.configured=e.configured,this.warnings=e.warnings):(this._adopt(e,t),this._floor=this._initialFloor(e.doc),this.loaded=!0),this._syncFloors(),this._notify()}adoptRemote(){if(!this._pendingRemote)return;let{parsed:i,baseline:e}=this._pendingRemote;this._adopt(i,e),this._notify()}dismissRemote(){this._pendingRemote&&(this._dismissedRemote=this._joinBaseline(this._pendingRemote.baseline)),this._pendingRemote=null,this.remoteChanged=!1,this._notify()}discard(){if(this._pendingRemote){this.adoptRemote();return}let i=Gi(this._config);this._adopt(i,this._baselineOf(i.doc)),this._notify()}_adopt(i,e){this._doc=vl(i.doc,this.config)??i.doc,this.configured=i.configured,this.warnings=i.warnings,this._baseline=e,this._baselineText=this._joinBaseline(e),this._dirtyKeys=[],this._selection=null,this._pendingRemote=null,this._dismissedRemote="",this.remoteChanged=!1,this.saveError=null,this.saveErrorCode=null,!Oe(this._doc,this._floor)&&this._doc.floors.length&&(this._floor=this._doc.floors[0].key),this.history.reset(this._doc)}_initialFloor(i){let e=i.floors.find(t=>t.key==="1f")??i.floors[0];return e&&(e.rooms.length||!i.floors.some(t=>t.rooms.length))?e.key:i.floors.find(t=>t.rooms.length)?.key??e?.key??"1f"}_emptyBaseline(){let i={};for(let e of un)i[e]="";return i}_baselineOf(i){let e=ei(i),t={};for(let n of un)t[n]=ti(e[n]);return t}_joinBaseline(i){return un.map(e=>i[e]).join(`
`)}_recomputeDirty(){let i=ei(this._doc);this._dirtyKeys=un.filter(e=>ti(i[e])!==this._baseline[e])}async save(){if(this.saving)return{ok:!1,results:[],error:"A save is already in progress",code:"busy"};this.saving=!0,this.saveError=null,this.saveErrorCode=null,this._notify();let i=[],e,t;try{for(let n of un){let s=ei(this._doc)[n],o=ti(s);if(o!==this._baseline[n])try{let l=pa(n,s);if(l>xr)throw new Y("jarvis/update_config","too_large",a("This change is {size} MB; Home Assistant accepts at most {max} MB at once",{size:ua(l),max:ua(xr)}));await X(this.hass,"jarvis/update_config",{key:n,value:s}),this._baseline[n]=o,this._baselineText=this._joinBaseline(this._baseline),i.push({key:n,ok:!0})}catch(l){let d=Y.from("jarvis/update_config",l);i.push({key:n,ok:!1,error:d.message,code:d.code}),e=d.message,t=d.code;break}}}finally{this.saving=!1,this._recomputeDirty(),this._notify()}return e?(this.saveError=e,this.saveErrorCode=t??null,this._notify(),{ok:!1,results:i,error:e,code:t}):(this.configured=!0,this.refresh(),{ok:!0,results:i})}clearSaveError(){this.saveError=null,this.saveErrorCode=null,this._notify()}async writeSetting(i,e){let t=pa(i,e);if(t>xr)return this._setStatus(i,{level:"error",message:a("This change is {size} MB; Home Assistant accepts at most {max} MB at once",{size:ua(t),max:ua(xr)})}),!1;this._overlay[i]=e,this._syncFloors(),this._setStatus(i,{level:"saving"});try{return await X(this.hass,"jarvis/update_config",{key:i,value:e}),this._setStatus(i,{level:"saved"},Xf),this.refresh(),!0}catch(n){return delete this._overlay[i],this._syncFloors(),this._setStatus(i,{level:"error",message:Y.from("jarvis/update_config",n).message}),!1}}_setStatus(i,e,t=0){clearTimeout(this._timers.get(i)),this._timers.delete(i);let n={...this.settingStatus};e?n[i]=e:delete n[i],this.settingStatus=n,this._notify(),e&&t>0&&this._timers.set(i,setTimeout(()=>{this.settingStatus[i]?.level===e.level&&this._setStatus(i,null)},t))}refresh(){this.host?.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}toast(i,e,t=Zf){let n=++this._toastSeq;return this.toasts=[...this.toasts,{id:n,message:i,action:e,rev:this._historyRev}],this._notify(),t>0&&this._timers.set(`toast:${n}`,setTimeout(()=>this.dismissToast(n),t)),n}runToastAction(i){let e=this.toasts.find(t=>t.id===i);this.dismissToast(i),e?.action&&e.rev===this._historyRev&&e.action.run()}dismissToast(i){clearTimeout(this._timers.get(`toast:${i}`)),this._timers.delete(`toast:${i}`),this.toasts.some(e=>e.id===i)&&(this.toasts=this.toasts.filter(e=>e.id!==i),this._notify())}dispose(){for(let i of this._timers.values())clearTimeout(i);this._timers.clear(),this.toasts=[]}};var bp=(r,i,e)=>{let t=new Map;for(let n=i;n<=e;n++)t.set(r[n],n);return t},_e=Kn(class extends en{constructor(r){if(super(r),r.type!==Dt.CHILD)throw Error("repeat() can only be used in text expressions")}dt(r,i,e){let t;e===void 0?e=i:i!==void 0&&(t=i);let n=[],s=[],o=0;for(let l of r)n[o]=t?t(l,o):o,s[o]=e(l,o),o++;return{values:s,keys:n}}render(r,i,e){return this.dt(r,i,e).values}update(r,[i,e,t]){let n=Sd(r),{values:s,keys:o}=this.dt(i,e,t);if(!Array.isArray(n))return this.ut=o,s;let l=this.ut??=[],d=[],u,p,v=0,f=n.length-1,g=0,y=s.length-1;for(;v<=f&&g<=y;)if(n[v]===null)v++;else if(n[f]===null)f--;else if(l[v]===o[g])d[g]=Un(n[v],s[g]),v++,g++;else if(l[f]===o[y])d[y]=Un(n[f],s[y]),f--,y--;else if(l[v]===o[y])d[y]=Un(n[v],s[y]),Ur(r,d[y+1],n[v]),v++,y--;else if(l[f]===o[g])d[g]=Un(n[f],s[g]),Ur(r,n[v],n[f]),f--,g++;else if(u===void 0&&(u=bp(o,g,y),p=bp(l,v,f)),u.has(l[v]))if(u.has(l[f])){let _=p.get(o[g]),w=_!==void 0?n[_]:null;if(w===null){let R=Ur(r,n[v]);Un(R,s[g]),d[g]=R}else d[g]=Un(w,s[g]),Ur(r,n[v],w),n[_]=null;g++}else Ts(n[f]),f--;else Ts(n[v]),v++;for(;g<=y;){let _=Ur(r,d[y+1]);Un(_,s[g]),d[g++]=_}for(;v<=f;){let _=n[v++];_!==null&&Ts(_)}return this.ut=o,qr(r,d),Ke}});function le(r,i,e){return e==null?`${r}:${i}`:`${r}:${i}:${e}`}function $l(r){if(!r)return null;let i=r.indexOf(":");if(i<=0)return null;let e=r.slice(0,i),t=r.slice(i+1),n,s=t.lastIndexOf(":");return s>0&&/^\d+$/.test(t.slice(s+1))&&(n=Number(t.slice(s+1)),t=t.slice(0,s)),t?n==null?{kind:e,id:t,raw:r}:{kind:e,id:t,sub:n,raw:r}:null}var Ce={grid:1,background:2,ghost:3,property:4,rooms:5,openings:6,cameras:7,pins:8,tool:8.5,overlay:9},yp=new Set(["room","opening","camera","pin","vtx","prop-vtx"]),Qf=4,Jf=500,_p=.85,wp=1.18,$p=60,xp=8e3,jp="jarvis.editor.snap",Vi=new Map,wl=new Set;function kp(){for(let r of wl)r()}function Ut(r){return Vi.set(r.id,r),kp(),()=>{Vi.get(r.id)===r&&(Vi.delete(r.id),kp())}}function jr(r){return r.map((i,e)=>`${e?"L":"M"}${i[0]} ${i[1]}`).join(" ")+" Z"}function ma(r){if(r)return!0;try{return typeof matchMedia=="function"&&matchMedia("(hover: none)").matches}catch{return!1}}var va=r=>Number.isInteger(r)?String(r):r.toFixed(1),We=class extends L{constructor(){super();this.narrow=!1;this.layers=[];this._vb={x:0,y:0,w:320,h:150};this._hover=null;this._focus=null;this._live="";this._snap=!0;this._panning=!1;this.guides=[];this.tooltip=null;this.band=null;this.draft=null;this.cursor=null;this._tool=null;this._gesture=null;this._pointers=new Map;this._pinch=null;this._longPress=null;this._spaceDown=!1;this._unsubStore=null;this._unsubRegistry=null;this._fittedFloor=null;this._liveToggle=!1;this._onWheelBound=e=>this._onWheel(e);this._resizeObs=null;this._onWindowKey=e=>{(e.code==="Space"||e.key===" ")&&(this._spaceDown=e.type==="keydown")};try{localStorage.getItem(jp)==="0"&&(this._snap=!1)}catch{}}connectedCallback(){super.connectedCallback(),this._unsubRegistry=(()=>{let e=()=>this.requestUpdate();return wl.add(e),()=>wl.delete(e)})(),window.addEventListener("keydown",this._onWindowKey),window.addEventListener("keyup",this._onWindowKey),this.store&&this._bindStore(this.store),this.hasUpdated&&this._observeSize()}disconnectedCallback(){super.disconnectedCallback(),this._unsubRegistry?.(),this._unsubRegistry=null,window.removeEventListener("keydown",this._onWindowKey),window.removeEventListener("keyup",this._onWindowKey),this._svg?.removeEventListener("wheel",this._onWheelBound),this._resizeObs?.disconnect(),this._resizeObs=null,this._unsubStore?.(),this._unsubStore=null,this.store&&this.store.canvas===this&&(this.store.canvas=null),this._clearLongPress()}willUpdate(e){e.has("store")&&this.store&&this.isConnected&&this._bindStore(this.store)}firstUpdated(){this._svg?.addEventListener("wheel",this._onWheelBound,{passive:!1}),this._observeSize(),this._autoFit()}_observeSize(){this._resizeObs||!this._svg||typeof ResizeObserver!="function"||(this._resizeObs=new ResizeObserver(()=>this.requestUpdate()),this._resizeObs.observe(this._svg))}_bindStore(e){this._unsubStore?.(),this._unsubStore=e.subscribe(()=>{this._autoFit(),this.requestUpdate()}),e.canvas=this,this._autoFit()}_autoFit(){let e=this.store;!e||!e.loaded||this._fittedFloor!==e.floor&&(this._fittedFloor=e.floor,this.fit())}get viewBox(){return this._vb}get snap(){return this._snap}setSnap(e){this._snap=e;try{localStorage.setItem(jp,e?"1":"0")}catch{}}get tool(){return this._tool}setTool(e){this._tool=e,this.cursor=e?this.cursor:null,e||(this.band=null,this.draft=null),this.requestUpdate()}requestRender(){this.requestUpdate()}announce(e){this._liveToggle=!this._liveToggle,this._live=e+(this._liveToggle?"​":"")}focusSurface(){try{this._svg?.focus({preventScroll:!0})}catch{}}async focusHit(e){await this.updateComplete;let t=`[data-hit="${e.replace(/"/g,'\\"')}"]`;(this._svg?.querySelector(`${t}[tabindex]`)??this._svg?.querySelector(t))?.focus?.()}toPlan(e,t){let n=this._metrics();return[this._vb.x+(e-n.left-n.ox)/n.s,this._vb.y+(t-n.top-n.oy)/n.s]}get pxPerUnit(){return this._metrics().s}fit(){let e=this.store,t=e?Ju(e.doc,e.floor):null;t||(t={...Ki});let n=t.x1-t.x0,s=t.y1-t.y0,o=Math.max(120,.25*Math.max(n,s)),l=t.x0-o,d=t.y0-o,u=n+2*o,p=s+2*o;u<200&&(l-=(200-u)/2,u=200),p<140&&(d-=(140-p)/2,p=140),this._vb={x:l,y:d,w:u,h:p}}zoomBy(e,t){let n=this._vb,s=Math.min(xp,Math.max($p,n.w*e)),o=s/n.w,l=n.h*o;if(!t){this._vb={x:n.x+(n.w-s)/2,y:n.y+(n.h-l)/2,w:s,h:l};return}let d=this.toPlan(t[0],t[1]),u=this._metrics({x:0,y:0,w:s,h:l});this._vb={x:d[0]-(t[0]-u.left-u.ox)/u.s,y:d[1]-(t[1]-u.top-u.oy)/u.s,w:s,h:l}}panBy(e,t){let n=this._metrics().s;this._vb={...this._vb,x:this._vb.x-e/n,y:this._vb.y-t/n}}snapper(e={}){let t=e.enabled??this._snap,n=e.grid??zi,s=e.edgeTol??Vu,o=new Set(e.exclude??[]),l=[],d=[];if(t&&this.store){for(let v of this.store.rooms())if(!o.has(v.id))for(let f of je(v))l.push(f[0]),d.push(f[1])}let u=[],p=(v,f,g)=>{if(!t)return Math.round(v);let y=Math.round(v/n)*n,_=Math.abs(v-y),w=!1;for(let R of f){let j=Math.abs(v-R);j<=s&&j<_&&(y=R,_=j,w=!0)}return w&&!u.some(R=>R.axis===g&&R.v===y)&&u.push({axis:g,v:y}),y};return{enabled:t,guides:u,x:v=>p(v,l,"x"),y:v=>p(v,d,"y"),point:v=>[p(v[0],l,"x"),p(v[1],d,"y")]}}context(){let e=this.store,t=e?.doc??{floors:[],openings:{},cameras:{},pins:{},property:{points:[]}},n=e?.floor??"1f",s=e?.selection??null,o=this._hover,l=this._focus,d=s?le(s.kind,s.id,s.sub):null;return{canvas:this,store:e,doc:t,floor:n,floorDef:Oe(t,n),rooms:Oe(t,n)?.rooms||[],units:e?.settings.units??"imperial",hass:this.hass,selection:s,mode:e?.tab??"rooms",viewBox:this._vb,pxPerUnit:this.pxPerUnit,hover:o,focus:l,snapEnabled:this._snap,classes:u=>[u===d?"is-selected":"",u===o?.raw?"is-hover":"",u===l?.raw?"is-focus":""].filter(Boolean).join(" "),isSelected:(u,p,v)=>!!s&&s.kind===u&&s.id===p&&(v==null||s.sub===v)}}_allLayers(){let e=new Map;for(let t of lg)e.set(t.id,t);Vi.has("rooms")||e.set("rooms",ag);for(let t of Vi.values())e.set(t.id,t);for(let t of this.layers)e.set(t.id,t);return this._tool&&e.set(`tool:${this._tool.id}`,this._tool),[...e.values()].sort((t,n)=>t.order-n.order)}_handlersFor(e){return this._allLayers().reverse().filter(n=>{let s=n.hits??[n.id];return s.includes("*")||e!=null&&s.includes(e.kind)})}render(){let e=this._vb,t=this._allLayers(),n=this.context(),s=this._panning?"grabbing":this._gesture?.handler?.cursor||this.cursor||"";return c`
      ${t.map(o=>o.styles?c`<style>${o.styles.cssText}</style>`:m)}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class=${this._panning?"panning":""}
        viewBox="${va(e.x)} ${va(e.y)} ${va(e.w)} ${va(e.h)}"
        preserveAspectRatio="xMidYMid meet"
        tabindex="0"
        role="application"
        aria-label=${a("Floor plan canvas")}
        aria-describedby="instructions"
        style=${s?`cursor:${s}`:""}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerCancel}
        @lostpointercapture=${this._onLostCapture}
        @pointerover=${this._onPointerOver}
        @pointerout=${this._onPointerOut}
        @dblclick=${this._onDblClick}
        @contextmenu=${this._onContextMenu}
        @keydown=${this._onKeyDown}
        @focusin=${this._onFocusIn}
        @focusout=${this._onFocusOut}
      >
        ${t.map(o=>K`<g data-layer=${o.id}>${this._renderLayer(o,n)}</g>`)}
      </svg>
      <p id="instructions" class="visually-hidden">
        ${a("Drag a room to move it, its corner handle to resize. Right-click or long-press for more. Arrow keys nudge the selection, Delete removes it, R draws a room, P a polygon, 0 fits the view, Ctrl+Z undoes.")}
        ${a("Without a pointer: press R then Enter, or use Place Room, to add a room at the centre of the view; arrow keys on a focused corner handle resize it, Enter on an edge midpoint adds a corner.")}
      </p>
      <div class="visually-hidden" aria-live="polite" aria-atomic="true">${this._live}</div>
    `}_renderLayer(e,t){try{return e.render(t)}catch(n){return console.warn(`[jv-plan-canvas] layer "${e.id}" failed to render`,n),m}}_metrics(e=this._vb){let t;try{t=this._svg?.getBoundingClientRect()}catch{t=void 0}let n=t?.left||0,s=t?.top||0,o=t?.width||0,l=t?.height||0;if(!o||!l||!e.w||!e.h)return{left:n,top:s,s:1,ox:0,oy:0,W:o,H:l};let d=Math.min(o/e.w,l/e.h);return{left:n,top:s,s:d,ox:(o-e.w*d)/2,oy:(l-e.h*d)/2,W:o,H:l}}_hitFrom(e){let t=e instanceof Element?e.closest("[data-hit]"):null;return $l(t?.getAttribute("data-hit"))}_pev(e,t,n,s){let o=e;return{hit:t,plan:n,client:s,event:e,shiftKey:!!e.shiftKey,altKey:!!e.altKey,ctrlKey:!!e.ctrlKey,metaKey:!!e.metaKey,button:typeof e.button=="number"?e.button:0,pointerType:typeof o.pointerType=="string"?o.pointerType:"mouse"}}_onPointerDown(e){if(e.pointerType==="mouse"&&e.button!==0&&e.button!==1)return;if(this._pointers.set(e.pointerId,[e.clientX,e.clientY]),this._pointers.size===2){this._gesture&&this._cancelGesture(),this._startPinch();return}if(this._pointers.size>2||this._pinch)return;let t=this.toPlan(e.clientX,e.clientY),n=this._hitFrom(e.target);this._gesture={pointerId:e.pointerId,startClient:[e.clientX,e.clientY],startPlan:t,hit:n,button:e.button,pointerType:e.pointerType,dragging:!1,handler:null,pan:!1,panStart:this._vb,consumed:!1,base:null,s:this._metrics().s};try{this._svg?.setPointerCapture(e.pointerId)}catch{}this._clearLongPress(),e.pointerType!=="mouse"&&(this._longPress=setTimeout(()=>{let s=this._gesture;!s||s.dragging||(s.consumed=!0,this._contextMenuAt(this._pev(e,s.hit,s.startPlan,s.startClient)))},Jf))}_onPointerMove(e){if(this._pointers.has(e.pointerId)&&this._pointers.set(e.pointerId,[e.clientX,e.clientY]),this._pinch){this._movePinch();return}let t=this._gesture;if(!t||e.pointerId!==t.pointerId||t.consumed)return;let n=[e.clientX,e.clientY];if(!t.dragging){if(Math.hypot(n[0]-t.startClient[0],n[1]-t.startClient[1])<Qf)return;this._clearLongPress(),t.dragging=!0;let s=this.context(),o=this._pev(e,t.hit,t.startPlan,t.startClient);if(!this._spaceDown&&t.button!==1)for(let l of this._handlersFor(t.hit)){let d=l.onDragStart?.(o,s);if(d){t.handler=d,t.base=Wi(s.doc);break}}t.handler||(t.pan=!0,t.panStart=this._vb,this._panning=!0)}if(t.pan){this._vb={...t.panStart,x:t.panStart.x-(n[0]-t.startClient[0])/t.s,y:t.panStart.y-(n[1]-t.startClient[1])/t.s};return}if(t.handler){let s=this._dragEvent(e,t,n);t.handler.onMove(s),this.guides=s.snap.guides,this.requestUpdate()}}_dragEvent(e,t,n){let s=[t.startPlan[0]+(n[0]-t.startClient[0])/t.s,t.startPlan[1]+(n[1]-t.startClient[1])/t.s],o=t.hit&&(t.hit.kind==="room"||t.hit.kind==="vtx"||t.hit.kind==="handle"||t.hit.kind==="mid")?[t.hit.id]:[];return{...this._pev(e,t.hit,s,n),start:t.startPlan,delta:[s[0]-t.startPlan[0],s[1]-t.startPlan[1]],snap:this.snapper({exclude:o,enabled:this._snap&&!e.altKey})}}_onPointerUp(e){if(this._pointers.delete(e.pointerId),this._pinch){this._pointers.size<2&&(this._pinch=null);return}let t=this._gesture;if(!(!t||e.pointerId!==t.pointerId)){this._clearLongPress(),this._gesture=null,this._panning=!1;try{this._svg?.releasePointerCapture(e.pointerId)}catch{}if(t.dragging){if(t.handler){let n=this._dragEvent(e,t,[e.clientX,e.clientY]);try{t.handler.onEnd(n)}finally{this.guides=[],this.tooltip=null}}this.requestUpdate();return}t.consumed||this._tap(this._pev(e,t.hit,this.toPlan(e.clientX,e.clientY),[e.clientX,e.clientY]))}}_onPointerCancel(e){this._pointers.delete(e.pointerId),this._pinch&&this._pointers.size<2&&(this._pinch=null),this._gesture&&e.pointerId===this._gesture.pointerId&&this._cancelGesture()}_onLostCapture(e){this._gesture&&e.pointerId===this._gesture.pointerId&&this._cancelGesture()}_cancelGesture(){let e=this._gesture;if(this._gesture=null,this._panning=!1,this._clearLongPress(),!!e){if(e.dragging&&e.handler){let t=e.base;t&&this.store&&this.store.change("",n=>Object.assign(n,Wi(t)),{transient:!0});try{e.handler.onCancel?.()}catch{}}this.guides=[],this.tooltip=null,this.requestUpdate()}}_tap(e){let t=this.context();for(let s of this._handlersFor(e.hit))if(s.onTap?.(e,t))return;let n=this.store;n&&(e.hit&&yp.has(e.hit.kind)?(n.select({kind:e.hit.kind,id:e.hit.id,sub:e.hit.sub}),this._announceSelection()):!e.hit&&!this._tool&&(n.select(null),this.announce(a("Nothing selected"))))}_startPinch(){let[e,t]=[...this._pointers.values()];if(!e||!t)return;let n=[(e[0]+t[0])/2,(e[1]+t[1])/2];this._pinch={d0:Math.hypot(e[0]-t[0],e[1]-t[1])||1,vb0:this._vb,midPlan:this.toPlan(n[0],n[1])}}_movePinch(){let e=this._pinch,[t,n]=[...this._pointers.values()];if(!e||!t||!n)return;let s=Math.hypot(t[0]-n[0],t[1]-n[1])||1,o=[(t[0]+n[0])/2,(t[1]+n[1])/2],l=Math.min(xp,Math.max($p,e.vb0.w*e.d0/s)),d=e.vb0.h*(l/e.vb0.w),u=this._metrics({x:0,y:0,w:l,h:d});this._vb={x:e.midPlan[0]-(o[0]-u.left-u.ox)/u.s,y:e.midPlan[1]-(o[1]-u.top-u.oy)/u.s,w:l,h:d}}_onWheel(e){if(e.preventDefault(),e.shiftKey&&!e.ctrlKey){this.panBy(-(e.deltaY||e.deltaX),0);return}if(!e.ctrlKey&&Math.abs(e.deltaX)>Math.abs(e.deltaY)){this.panBy(-e.deltaX,0);return}if(!e.deltaY)return;let t=e.deltaY<0;this.zoomBy(t?_p:wp,[e.clientX,e.clientY])}_onPointerOver(e){let t=this._hitFrom(e.target);t?.raw!==this._hover?.raw&&(this._hover=t)}_onPointerOut(e){let t=this._hitFrom(e.target);t&&t.raw===this._hover?.raw&&(this._hover=null)}_onFocusIn(e){this._focus=this._hitFrom(e.target)}_onFocusOut(){this._focus=null}_onDblClick(e){let t=this._hitFrom(e.target),n=this._pev(e,t,this.toPlan(e.clientX,e.clientY),[e.clientX,e.clientY]),s=this.context();for(let o of this._handlersFor(t))if(o.onDoubleClick?.(n,s))return}_onContextMenu(e){e.preventDefault();let t=this._hitFrom(e.target);this._contextMenuAt(this._pev(e,t,this.toPlan(e.clientX,e.clientY),[e.clientX,e.clientY]))}_contextMenuAt(e){let t=this.context();for(let n of this._handlersFor(e.hit))if(n.onContextMenu?.(e,t))return;this.dispatchEvent(new CustomEvent("plan-context",{detail:e,bubbles:!0,composed:!0}))}_onKeyDown(e){let t=this.context(),n=this.store;for(let o of[...this._tool?[this._tool]:[],...this._allLayers().reverse()])if(o.onKey?.(e,t)){e.preventDefault();return}if(e.ctrlKey||e.metaKey)return;let s=this._hitFrom(e.target);switch(e.key){case"Enter":case" ":s&&yp.has(s.kind)&&n&&(n.select({kind:s.kind,id:s.id,sub:s.sub}),this._announceSelection(),e.preventDefault());return;case"ArrowLeft":case"ArrowRight":case"ArrowUp":case"ArrowDown":{let o=e.shiftKey?10:1,l=e.key==="ArrowLeft"?-o:e.key==="ArrowRight"?o:0,d=e.key==="ArrowUp"?-o:e.key==="ArrowDown"?o:0;n?.selection?n.nudgeSelection(l,d)&&this._announceSelection():this._vb={...this._vb,x:this._vb.x+l*this._vb.w/10,y:this._vb.y+d*this._vb.h/10},e.preventDefault();return}case"Delete":case"Backspace":{if(!n?.selection)return;let o=n.describeSelection(),l=n.removeSelection();if(l){let d=o?.name||l;n.toast(a("Removed {name}",{name:d}),{label:a("Undo"),run:()=>n.undo()}),this.announce(a("Removed {name}",{name:d})),s&&this.focusSurface()}e.preventDefault();return}case"Escape":this._tool?this.setTool(null):n?.select(null),e.preventDefault();return;case"+":case"=":this.zoomBy(_p),e.preventDefault();return;case"-":case"_":this.zoomBy(wp),e.preventDefault();return;case"0":this.fit(),e.preventDefault();return;case"F10":case"ContextMenu":if(e.key==="ContextMenu"||e.shiftKey){let o=this._vb,l=this._metrics(),d=[o.x+o.w/2,o.y+o.h/2];this._contextMenuAt(this._pev(e,s,d,[l.left+l.W/2,l.top+l.H/2])),e.preventDefault()}return;default:return}}_announceSelection(){let e=this.store,t=e?.describeSelection();if(!e||!t){this.announce(a("Nothing selected"));return}let n=e.settings.units;this.announce(t.w!=null&&t.h!=null?a("{name} selected · {w} × {h}",{name:t.name,w:H(t.w,n),h:H(t.h,n)}):a("{name} selected",{name:t.name}))}_clearLongPress(){this._longPress&&clearTimeout(this._longPress),this._longPress=null}};We.styles=[T,S`
      :host {
        display: block;
        position: relative;
        padding: 4px; /* room for the outer focus ring */
        min-width: 0;
      }
      svg {
        display: block;
        width: 100%;
        height: clamp(360px, 65vh, 820px);
        /* the card surface: the text tokens' contrast guarantees hold on it (text-2 on bg-2 is ~3.8:1 in HA light) */
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        outline: none;
        cursor: default;
      }
      :host([narrow]) svg {
        height: min(70vh, 520px);
      }
      svg:focus-visible {
        box-shadow: var(--jv-focus-ring);
      }
      svg.panning {
        cursor: grabbing;
      }
      text {
        font-family: var(--jv-font);
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }
      [data-hit] {
        outline: none;
        cursor: pointer;
      }
      /* grid */
      .grid-minor {
        fill: none;
        stroke: var(--jv-border);
        stroke-width: 1;
        opacity: 0.35;
        vector-effect: non-scaling-stroke;
      }
      .grid-major {
        fill: none;
        stroke: var(--jv-border);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .grid-label {
        fill: var(--jv-text-2);
      }
      /* ghost floor below */
      .ghost {
        fill: none;
        stroke: var(--jv-danger);
        stroke-dasharray: 4 3;
        stroke-width: 1;
        opacity: 0.45;
        vector-effect: non-scaling-stroke;
      }
      .ghost-cap {
        fill: var(--jv-danger-text);
      }
      /* overlay */
      .guide {
        stroke: var(--jv-accent);
        stroke-width: 1;
        stroke-dasharray: 3 3;
        opacity: 0.8;
        vector-effect: non-scaling-stroke;
      }
      .band {
        fill: var(--jv-accent);
        fill-opacity: 0.08;
        stroke: var(--jv-accent);
        stroke-width: 1;
        stroke-dasharray: 4 2;
        vector-effect: non-scaling-stroke;
      }
      .draft {
        fill: var(--jv-accent);
        fill-opacity: 0.06;
        stroke: var(--jv-accent);
        stroke-width: 1.5;
        stroke-dasharray: 4 2;
        vector-effect: non-scaling-stroke;
      }
      .draft-vtx {
        fill: var(--jv-surface);
        stroke: var(--jv-accent);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .draft-close {
        fill: none;
        stroke: var(--jv-ok);
        stroke-width: 1;
        stroke-dasharray: 2 2;
        vector-effect: non-scaling-stroke;
      }
      .tip rect {
        fill: var(--jv-surface);
        stroke: var(--jv-border);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .tip text {
        fill: var(--jv-text);
      }
      .plan-label {
        fill: var(--jv-text-2);
      }
      /* the basic rooms layer (replaced by the Rooms tab's layer when it registers) */
      .room .shape {
        fill: var(--jv-accent);
        fill-opacity: 0.06;
        stroke: var(--jv-text-2);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .room.t-bath .shape,
      .room.t-stairs .shape {
        fill: var(--jv-info);
      }
      .room.t-outdoor .shape {
        fill: var(--jv-ok);
        stroke-dasharray: 4 3;
      }
      .room.is-hover .shape {
        fill-opacity: 0.12;
      }
      .room.is-selected .shape {
        stroke: var(--jv-accent);
        stroke-width: 2;
      }
      .room.is-focus .shape,
      .room:focus-visible .shape {
        stroke: var(--jv-focus);
        stroke-width: 2;
      }
      .room .name {
        fill: var(--jv-text);
        text-anchor: middle;
        dominant-baseline: middle;
        font-weight: var(--jv-font-weight-medium);
      }
      .room .dims {
        fill: var(--jv-text-2);
        text-anchor: middle;
        dominant-baseline: middle;
      }
    `],h([$({attribute:!1})],We.prototype,"store",2),h([$({attribute:!1})],We.prototype,"hass",2),h([$({type:Boolean,reflect:!0})],We.prototype,"narrow",2),h([$({attribute:!1})],We.prototype,"layers",2),h([b()],We.prototype,"_vb",2),h([b()],We.prototype,"_hover",2),h([b()],We.prototype,"_focus",2),h([b()],We.prototype,"_live",2),h([b()],We.prototype,"_snap",2),h([b()],We.prototype,"_panning",2),h([me("svg")],We.prototype,"_svg",2),We=h([A("jv-plan-canvas")],We);function eg(r){let i=Gn;for(;r/i>16;)i*=2;return i}var tg={id:"grid",order:Ce.grid,hits:[],render(r){let i=r.viewBox,e=eg(i.w),t=Math.max(3,i.w/150),n=[],s=Math.ceil(i.x/e)*e,o=Math.ceil(i.y/e)*e;for(let l=s;l<=i.x+i.w;l+=e)n.push(K`<text class="grid-label" x=${l+t*.3} y=${i.y+t*1.2} font-size=${t}>${l}</text>`);for(let l=o;l<=i.y+i.h;l+=e)(l!==o||s!==i.x)&&n.push(K`<text class="grid-label" x=${i.x+t*.3} y=${l-t*.3} font-size=${t}>${l}</text>`);return K`
      <defs>
        <pattern id="jvpc-minor" width=${Bi} height=${Bi} patternUnits="userSpaceOnUse">
          <path class="grid-minor" d="M ${Bi} 0 L 0 0 0 ${Bi}"></path>
        </pattern>
        <pattern id="jvpc-major" width=${Gn} height=${Gn} patternUnits="userSpaceOnUse">
          <rect width=${Gn} height=${Gn} fill="url(#jvpc-minor)"></rect>
          <path class="grid-major" d="M ${Gn} 0 L 0 0 0 ${Gn}"></path>
        </pattern>
      </defs>
      <rect x=${i.x} y=${i.y} width=${i.w} height=${i.h} fill="url(#jvpc-major)" pointer-events="none"></rect>
      ${n}
    `}},ng={id:"background",order:Ce.background,hits:[],render(r){let i=r.store?.settings.bg[r.floor];if(!i)return m;let e=null;for(let t of r.rooms)e=ut(e,pe(je(t)));return e||(e=Ki),K`<image href=${i} x=${e.x0} y=${e.y0} width=${e.x1-e.x0} height=${e.y1-e.y0} opacity=${r.store.settings.bgOpacity} preserveAspectRatio="xMidYMid meet" pointer-events="none"></image>`}},rg={id:"ghost",order:Ce.ghost,hits:[],render(r){let i=ep(r.floor),e=i?(Oe(r.doc,i)?.rooms||[]).filter(n=>n.type!=="outdoor"):[];if(!i||!e.length)return m;let t=null;for(let n of e)t=ut(t,pe(je(n)));return K`
      ${e.map(n=>K`<path class="ghost" d=${jr(je(n))}></path>`)}
      <text class="ghost-cap" x=${(t?.x0??0)+2} y=${(t?.y0??0)-2} font-size="4">${a("↓ {floor} below (stay within)",{floor:a(r.store.floorLabel(i))})}</text>
    `}},ig={id:"overlay",order:Ce.overlay,hits:[],render(r){let i=r.canvas,e=r.viewBox,t=[];for(let n of i.guides)t.push(n.axis==="x"?K`<line class="guide" x1=${n.v} y1=${e.y} x2=${n.v} y2=${e.y+e.h}></line>`:K`<line class="guide" x1=${e.x} y1=${n.v} x2=${e.x+e.w} y2=${n.v}></line>`);if(i.band&&t.push(K`<rect class="band" x=${i.band.x} y=${i.band.y} width=${i.band.w} height=${i.band.h} pointer-events="none"></rect>`),i.draft&&i.draft.length){let n=i.draft.map((s,o)=>`${o?"L":"M"}${s[0]} ${s[1]}`).join(" ");t.push(K`<path class="draft" d=${n} pointer-events="none"></path>`),t.push(K`<circle class="draft-close" cx=${i.draft[0][0]} cy=${i.draft[0][1]} r="6" pointer-events="none"></circle>`);for(let s of i.draft)t.push(K`<circle class="draft-vtx" cx=${s[0]} cy=${s[1]} r="2" pointer-events="none"></circle>`)}if(i.tooltip){let n=Math.max(3.5,e.w/90),s=i.tooltip.text.length*n*.6+n;t.push(K`
        <g class="tip" pointer-events="none">
          <rect x=${i.tooltip.x-s/2} y=${i.tooltip.y-n*1.6} width=${s} height=${n*1.8} rx=${n*.3}></rect>
          <text x=${i.tooltip.x} y=${i.tooltip.y-n*.35} font-size=${n} text-anchor="middle">${i.tooltip.text}</text>
        </g>
      `)}return t.length?K`${t}`:m}};function sg(r){return/^[a-z]+$/.test(r)?r:"room"}var ag={id:"rooms",order:Ce.rooms,hits:["room"],render(r){let i=r.units,e=r.floorDef?.labels||[];return K`
      ${_e(r.rooms,t=>t.id,t=>{let n=le("room",t.id),s=t.w>80?7:t.w>50?5.5:t.w>25?4:3,o=t.x+t.w/2,l=t.y+t.h/2,d=a(og[t.type]||t.type);return K`
            <g data-hit=${n} tabindex="0" role="button" class="room t-${sg(t.type)} ${r.classes(n)}"
               aria-label=${`${t.name||a("Room")}, ${d}, ${H(t.w,i)} × ${H(t.h,i)}`}>
              <path class="shape" d=${jr(je(t))}></path>
              <text class="name" x=${o} y=${l} font-size=${s}>${t.name}</text>
              ${t.w>30&&t.h>24?K`<text class="dims" x=${o} y=${l+s*1.15} font-size=${s*.62}>${H(t.w,i)} × ${H(t.h,i)}</text>`:m}
            </g>
          `})}
      ${e.map(t=>K`<text class="plan-label" x=${t.x} y=${t.y} font-size="4" text-anchor="middle">${t.text}</text>`)}
    `},onDragStart(r,i){if(i.mode!=="rooms"||!r.hit||r.hit.kind!=="room")return null;let e=r.hit.id,t=q(i.doc,e);if(!t)return null;let n={x:t.room.x,y:t.room.y,w:t.room.w,h:t.room.h},s=t.room.name||a("Room");i.store.select({kind:"room",id:e});let o=i.units,l=(u,p,v)=>i.store.change(a("Move {name}",{name:s}),f=>{let g=q(f,e)?.room;if(!g)return;let y=u-g.x,_=p-g.y;g.points?(g.points=g.points.map(w=>[Math.round((w[0]+y)*10)/10,Math.round((w[1]+_)*10)/10]),g.x=u,g.y=p):(g.x=u,g.y=p)},{transient:v}),d=u=>{let p=n.x+u.delta[0],v=n.y+u.delta[1],f=u.snap,g=[],y=(R,j,C)=>{let M=C(R),O=f.guides.splice(0),F=C(R+j)-j,W=f.guides.splice(0),G=Math.abs(M-R)<=Math.abs(F-R);return g.push(...G?O:W),G?M:F},_=y(p,n.w,f.x),w=y(v,n.h,f.y);return f.guides.push(...g),[_,w]};return{cursor:"move",onMove:u=>{let[p,v]=d(u);l(p,v,!0),i.canvas.tooltip={x:p+n.w/2,y:v-3,text:`${H(p,o)}, ${H(v,o)}`}},onEnd:u=>{let[p,v]=d(u);l(p,v,!1),i.canvas.tooltip=null,i.canvas.announce(a("{name} moved to {x}, {y}",{name:s,x:H(p,o),y:H(v,o)}))},onCancel:()=>{i.canvas.tooltip=null}}}},og={room:"Room",bath:"Bathroom",stairs:"Stairs",door:"Door",outdoor:"Outdoor zone"},lg=[tg,ng,rg,ig];var Ge=class extends L{constructor(){super(...arguments);this.canvas=null;this.narrow=!1;this._unsub=null;this._bound=null}connectedCallback(){super.connectedCallback(),this._bind()}disconnectedCallback(){super.disconnectedCallback(),this._unsub?.(),this._unsub=null,this._bound=null}willUpdate(){this.store!==this._bound&&this._bind()}_bind(){this._unsub?.(),this._unsub=null,this._bound=this.store??null,this.store&&(this._unsub=this.store.subscribe(()=>this.requestUpdate()))}get floor(){return this.store?.floor??"1f"}get units(){return this.store?.settings.units??"imperial"}ctx(){return this.canvas?.context()??null}};h([$({attribute:!1})],Ge.prototype,"store",2),h([$({attribute:!1})],Ge.prototype,"canvas",2),h([$({attribute:!1})],Ge.prototype,"hass",2),h([$({type:Boolean,reflect:!0})],Ge.prototype,"narrow",2);var fa=null;function cg(){let r=document.activeElement;for(;r?.shadowRoot?.activeElement;)r=r.shadowRoot.activeElement;return r}var kr=class extends L{constructor(){super(...arguments);this.items=[];this.at=[0,0];this.label="";this._active=0;this._pos=[0,0];this._prevFocus=null;this._closeBound=()=>this.close();this._onDocPointer=e=>{e.composedPath().includes(this)||this.close()}}open(e){fa?.close(),fa=this,this.items=e.items,this.at=e.at,this._pos=e.at,this.label=e.label??"",this._prevFocus=cg(),this._active=Math.max(0,this.items.findIndex(t=>!t.disabled)),document.body.appendChild(this),document.addEventListener("pointerdown",this._onDocPointer,!0),window.addEventListener("resize",this._closeBound),window.addEventListener("scroll",this._closeBound,!0),window.addEventListener("blur",this._closeBound),this.updateComplete.then(()=>{this._clamp(),this._focusActive()})}close(){fa===this&&(fa=null),document.removeEventListener("pointerdown",this._onDocPointer,!0),window.removeEventListener("resize",this._closeBound),window.removeEventListener("scroll",this._closeBound,!0),window.removeEventListener("blur",this._closeBound);let e=this._prevFocus;this._prevFocus=null,this.remove();try{e?.isConnected&&e.focus?.({preventScroll:!0})}catch{}}_clamp(){let e=this.renderRoot.querySelector(".menu");if(!e)return;let t=e.getBoundingClientRect(),n=window.innerWidth||0,s=window.innerHeight||0,[o,l]=this.at;n&&o+t.width>n-8&&(o=Math.max(8,n-t.width-8)),s&&l+t.height>s-8&&(l=Math.max(8,s-t.height-8)),this._pos=[o,l]}_focusActive(){this.renderRoot.querySelectorAll(".item")[this._active]?.focus()}_run(e){let t=this.items[e];if(!(!t||t.disabled)){this.close();try{t.run?.()}catch{}}}_onKey(e){let t=this.items.length,n=s=>{if(!t)return;let o=this._active;for(let l=0;l<t&&(o=(o+s+t)%t,!!this.items[o].disabled);l++);this._active=o,this.updateComplete.then(()=>this._focusActive())};switch(e.key){case"ArrowDown":n(1);break;case"ArrowUp":n(-1);break;case"Home":this._active=Math.max(0,this.items.findIndex(s=>!s.disabled)),this.updateComplete.then(()=>this._focusActive());break;case"End":{let s=t-1;for(;s>0&&this.items[s].disabled;)s--;this._active=s,this.updateComplete.then(()=>this._focusActive());break}case"Enter":case" ":this._run(this._active);break;case"Escape":case"Tab":this.close();break;default:return}e.preventDefault(),e.stopPropagation()}_onFocusOut(e){let t=e.relatedTarget;t&&this.renderRoot.contains(t)||setTimeout(()=>{this.isConnected&&!this.shadowRoot?.activeElement&&!this.matches(":focus-within")&&this.close()},0)}render(){let[e,t]=this._pos,n=x("ha-icon");return c`
      <ul class="menu" role="menu" aria-label=${this.label||m} style=${`left:${e}px;top:${t}px`} @keydown=${this._onKey} @focusout=${this._onFocusOut}>
        ${this.items.map((s,o)=>c`<li role="none">
            <button
              type="button"
              class="item ${s.danger?"danger":""} ${o===this._active?"is-active":""}"
              role="menuitem"
              tabindex=${o===this._active?"0":"-1"}
              aria-disabled=${s.disabled?"true":"false"}
              @click=${()=>this._run(o)}
              @pointerenter=${()=>{this._active=o}}
            >
              ${s.icon&&n?c`<ha-icon .icon=${s.icon}></ha-icon>`:m}
              <span>${s.label}</span>
            </button>
          </li>`)}
      </ul>
    `}};kr.styles=[T,S`
      :host {
        display: contents;
      }
      .menu {
        position: fixed;
        z-index: 1000;
        min-width: 180px;
        max-width: min(92vw, 320px);
        margin: 0;
        padding: var(--jv-space-1) 0;
        list-style: none;
        background: var(--jv-surface);
        color: var(--jv-text);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        box-shadow: var(--jv-shadow);
      }
      .item {
        appearance: none;
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        width: 100%;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-4);
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .item:hover,
      .item.is-active {
        background: var(--jv-hover);
      }
      .item:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      .item[aria-disabled="true"] {
        color: var(--jv-text-3);
        cursor: default;
      }
      .item.danger {
        color: var(--jv-danger-text);
      }
      .item ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }
      .item span {
        min-width: 0;
        overflow-wrap: anywhere;
      }
    `],h([b()],kr.prototype,"_active",2),h([b()],kr.prototype,"_pos",2),kr=h([A("jarvis-plan-menu")],kr);function qt(r){let i=document.createElement("jarvis-plan-menu");return i.open(r),i}var ga=["ha-textfield","ha-select","ha-list-item","mwc-list-item","ha-switch","ha-icon","ha-alert"],ni=S`
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-1);
    min-width: 0;
  }
  .field-label {
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
    font-weight: var(--jv-font-weight-medium);
  }
  .field input:not([type="checkbox"]):not([type="range"]):not([type="file"]),
  .field select,
  .field ha-textfield,
  .field ha-select {
    width: 100%;
    display: block;
    min-width: 0;
    box-sizing: border-box;
  }
  .field input:not([type="checkbox"]):not([type="range"]):not([type="file"]),
  .field select {
    font: inherit;
    color: var(--jv-text);
    background: var(--jv-surface);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    padding: 0 var(--jv-space-3);
    min-height: var(--jv-tap);
  }
  .field input:not([type="checkbox"]):not([type="range"]):not([type="file"]):disabled,
  .field select:disabled {
    color: var(--jv-text-3);
    background: var(--jv-surface-2);
    cursor: not-allowed;
  }
  .field input[type="checkbox"] {
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--jv-accent);
  }
  .field input[type="range"] {
    width: 100%;
    min-height: var(--jv-tap);
    accent-color: var(--jv-accent);
  }
  .field input[type="file"] {
    font: inherit;
    color: var(--jv-text);
    min-height: var(--jv-tap);
    max-width: 100%;
  }
  .switch-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--jv-space-3);
    min-height: var(--jv-tap);
  }
  .switch-row .field-label {
    color: var(--jv-text);
  }
  .status {
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    min-height: 1.2em;
    overflow-wrap: anywhere;
  }
  .status.saved {
    color: var(--jv-ok-text);
  }
  .status.error {
    color: var(--jv-danger-text);
  }
  .alert {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2) var(--jv-space-3);
    padding: var(--jv-space-3) var(--jv-space-4);
    border-radius: var(--jv-radius-sm);
    color: var(--jv-text);
    font-size: var(--jv-font-size-s);
  }
  .alert > span {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .alert.info {
    background: var(--jv-info-soft);
  }
  .alert.warning {
    background: var(--jv-warn-soft);
  }
  .alert.error {
    background: var(--jv-danger-soft);
  }
  .alert.success {
    background: var(--jv-ok-soft);
  }
  ha-alert {
    display: block;
  }
  .hint {
    margin: 0;
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
`;function ba(r,i=""){return x("ha-icon")?c`<ha-icon .icon=${r}></ha-icon>`:i?c`<span aria-hidden="true">${i}</span>`:m}function ya(r,i){return x("ha-alert")?c`<ha-alert alert-type=${r}>${i}</ha-alert>`:c`<div class="alert ${r}" role=${r==="error"?"alert":"status"}>${i}</div>`}function Pn(r){let i=r.options.some(n=>n.value===r.value),e=n=>{let s=n.target,o=String(s.value??"");o!==r.value&&r.onChange(o)},t;if(x("ha-select")){let n=x("ha-list-item")?Te`ha-list-item`:Te`mwc-list-item`;t=c`
      <ha-select id=${r.id} .value=${I(r.value)} aria-label=${r.label} ?disabled=${!!r.disabled} naturalMenuWidth fixedMenuPosition
        @selected=${e} @closed=${s=>s.stopPropagation()}>
        ${i?m:ye`<${n} .value=${r.value} disabled>${r.value||"∅"}</${n}>`}
        ${r.options.map(s=>ye`<${n} .value=${s.value}>${s.label}</${n}>`)}
      </ha-select>`}else t=c`
      <select id=${r.id} .value=${I(r.value)} aria-label=${r.label} ?disabled=${!!r.disabled} @change=${e}>
        ${i?m:c`<option value=${r.value} disabled>${r.value||"∅"}</option>`}
        ${r.options.map(n=>c`<option value=${n.value} ?selected=${n.value===r.value}>${n.label}</option>`)}
      </select>`;return c`<div class="field"><label class="field-label" for=${r.id}>${r.label}</label>${t}</div>`}function Ve(r){let i=r.value===null||r.value===void 0||!Number.isFinite(r.value)?"":String(r.value),e=s=>{let o=s.target,l=String(o.value??"").trim();if(l===""){r.value!==null&&r.onChange(null);return}let d=Number(l);if(!Number.isFinite(d)){o.value=i;return}let u=d;r.min!=null&&u<r.min&&(u=r.min),r.max!=null&&u>r.max&&(u=r.max),u!==r.value?r.onChange(u):o.value=i},t=r.suffix?`${r.label} (${r.suffix})`:r.label,n=x("ha-textfield")?c`<ha-textfield id=${r.id} type="number" .value=${I(i)} .placeholder=${r.placeholder??""} aria-label=${t}
        min=${r.min??m} max=${r.max??m} step=${r.step??"any"} ?disabled=${!!r.disabled} @change=${e}></ha-textfield>`:c`<input id=${r.id} type="number" inputmode="decimal" .value=${I(i)} placeholder=${r.placeholder??""} aria-label=${t}
        min=${r.min??m} max=${r.max??m} step=${r.step??"any"} ?disabled=${!!r.disabled} @change=${e} />`;return c`<div class="field"><label class="field-label" for=${r.id}>${t}</label>${n}</div>`}function Sp(r){let i=n=>{let s=n.target,o=String(s.value??"").trim();o!==r.value?r.onChange(o):s.value=r.value},e=r.suggestions?`${r.id}-list`:void 0,t=!r.suggestions&&x("ha-textfield")?c`<ha-textfield id=${r.id} type="text" .value=${I(r.value)} .placeholder=${r.placeholder??""} aria-label=${r.label} ?disabled=${!!r.disabled} @change=${i}></ha-textfield>`:c`<input id=${r.id} type="text" .value=${I(r.value)} placeholder=${r.placeholder??""} aria-label=${r.label} list=${e??m}
          autocomplete="off" ?disabled=${!!r.disabled} @change=${i} />
          ${e?c`<datalist id=${e}>${r.suggestions.map(n=>c`<option value=${n}></option>`)}</datalist>`:m}`;return c`<div class="field"><label class="field-label" for=${r.id}>${r.label}</label>${t}</div>`}function Yi(r){let i=t=>{let s=!!t.target.checked;s!==r.checked&&r.onChange(s)},e=x("ha-switch")?c`<ha-switch id=${r.id} .checked=${I(r.checked)} ?disabled=${!!r.disabled} aria-label=${r.label} @change=${i}></ha-switch>`:c`<input id=${r.id} type="checkbox" role="switch" .checked=${I(r.checked)} ?disabled=${!!r.disabled} aria-label=${r.label} @change=${i} />`;return c`<div class="field switch-row"><label class="field-label" for=${r.id}>${r.label}</label>${e}</div>`}var Wt=class extends L{constructor(){super(...arguments);this._open=!1;this._opts={heading:"",areas:[]};this._name="";this._type="room";this._resolve=null}show(e){return this._resolve&&this._finish(!1),this._opts=e,this._name=e.name??"",this._type=e.type??"room",this._open=!0,new Promise(t=>{this._resolve=t,this.updateComplete.then(()=>{let n=this._native;if(n&&!n.open)try{typeof n.showModal=="function"?n.showModal():n.setAttribute("open","")}catch{n.setAttribute("open","")}let s=this.renderRoot.querySelector("input[name=name]");s?.focus(),s?.select?.()})})}_finish(e){let t=this._resolve;this._resolve=null,this._open=!1;let n=this._native;n?.open&&(typeof n.close=="function"?n.close():n.removeAttribute("open"));let s=this._name.trim()||this._opts.name?.trim()||a("Room");t?.(e?{name:s,type:this._type||"room"}:null)}_onHaClosed(e){let t=e.detail?.action;this._resolve&&this._finish(t==="confirm")}_onNativeCancel(e){e.preventDefault(),this._finish(!1)}_onKey(e){e.key==="Enter"&&e.target?.tagName==="INPUT"&&(e.preventDefault(),this._finish(!0))}_form(){let e=this._opts;return c`
      <div class="form" @keydown=${this._onKey}>
        <div class="field">
          <label class="field-label" for="rd-name">${a("Name")}</label>
          <input id="rd-name" name="name" type="text" autocomplete="off" list="rd-areas" .value=${I(this._name)} @input=${t=>{this._name=t.target.value}} />
          <datalist id="rd-areas">${e.areas.map(t=>c`<option value=${t}></option>`)}</datalist>
          <p class="hint">${a("Use the Home Assistant area name so occupancy lights this room")}</p>
        </div>
        ${e.nameOnly?m:c`<div class="field">
              <label class="field-label" for="rd-type">${a("Type")}</label>
              <select id="rd-type" .value=${I(this._type)} @change=${t=>{this._type=t.target.value}}>
                ${qi.map(t=>c`<option value=${t.value} ?selected=${t.value===this._type}>${a(t.label)}</option>`)}
                ${qi.some(t=>t.value===this._type)?m:c`<option value=${this._type} selected>${this._type}</option>`}
              </select>
            </div>`}
      </div>
    `}render(){if(!this._open)return m;let e=this._opts.confirmLabel||a("Confirm"),t=a("Cancel");return x("ha-dialog")?c`
        <ha-dialog open .heading=${this._opts.heading} @closed=${this._onHaClosed} scrimClickAction="" escapeKeyAction="cancel">
          ${this._form()}
          <button class="jv-btn" slot="secondaryAction" dialogAction="cancel">${t}</button>
          <button class="jv-btn primary" slot="primaryAction" dialogAction="confirm">${e}</button>
        </ha-dialog>
      `:c`
      <dialog aria-labelledby="rd-h" @cancel=${this._onNativeCancel}>
        <div class="box">
          <h2 id="rd-h">${this._opts.heading}</h2>
          ${this._form()}
        </div>
        <div class="actions">
          <button class="jv-btn" type="button" @click=${()=>this._finish(!1)}>${t}</button>
          <button class="jv-btn primary" type="button" @click=${()=>this._finish(!0)}>${e}</button>
        </div>
      </dialog>
    `}disconnectedCallback(){super.disconnectedCallback(),this._resolve&&this._finish(!1),this._haDialog?.close?.()}};Wt.styles=[T,ni,S`
      :host {
        display: contents;
      }
      dialog {
        border: 0;
        padding: 0;
        max-width: min(92vw, 440px);
        width: 100%;
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius);
        box-shadow: var(--jv-shadow);
      }
      dialog::backdrop {
        background: var(--jv-scrim);
      }
      .box {
        padding: var(--jv-space-5) var(--jv-space-5) var(--jv-space-3);
      }
      h2 {
        margin: 0 0 var(--jv-space-3);
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-3);
        min-width: 260px;
      }
      ha-dialog .form {
        padding-top: var(--jv-space-2);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--jv-space-2);
        padding: 0 var(--jv-space-3) var(--jv-space-3);
      }
      @media (max-width: 599px) {
        .actions {
          flex-direction: column-reverse;
        }
        .actions .jv-btn {
          width: 100%;
        }
      }
    `],h([b()],Wt.prototype,"_open",2),h([b()],Wt.prototype,"_opts",2),h([b()],Wt.prototype,"_name",2),h([b()],Wt.prototype,"_type",2),h([me("dialog")],Wt.prototype,"_native",2),h([me("ha-dialog")],Wt.prototype,"_haDialog",2),Wt=h([A("jarvis-room-dialog")],Wt);async function xl(r){let i=document.createElement("jarvis-room-dialog");document.body.appendChild(i);try{return await i.show(r)}finally{i.remove()}}var dg={room:"Room",bath:"Bathroom",stairs:"Stairs",door:"Door",outdoor:"Outdoor zone"};function ja(r){return dg[r]||r}function ug(r){return/^[a-z]+$/.test(r)?r:"room"}var Ee=r=>r?.name||a("Room");function Ep(r,i){let e=r.composedPath()[0];return(e instanceof Element?$l(e.closest("[data-hit]")?.getAttribute("data-hit")):null)??i.focus}var pg=16;function Sr(r,i,e,t){return K`<circle class="pad" data-hit=${r} aria-hidden="true" cx=${i} cy=${e} r=${pg/Math.max(t,.01)}></circle>`}var _a=r=>Math.round(r/zi)*zi;function hg(r){let i=r.canvas?.viewBox??{x:0,y:0,w:320,h:150};return{x:_a(i.x+i.w/2-30),y:_a(i.y+i.h/2-20),w:60,h:40}}function vg(r){let i=Bt(r),e=i?D(i.x0):20,t=i?D(i.y1)+25:140,n=i?Math.max(D(i.x1-i.x0),90):90,s=70;return{x:e,y:t,w:n,h:s,points:[[e,t],[e+n,t],[e+n,t+s],[e,t+s]]}}function mg(r){let i=pe(r.flatMap(t=>je(t)));i||(i={x0:20,y0:20,x1:220,y1:170});let e=Math.max(150,.7*Math.max(i.x1-i.x0,i.y1-i.y0));return[[D(i.x0-e),D(i.y0-e)],[D(i.x1+e),D(i.y0-e)],[D(i.x1+e),D(i.y1+e)],[D(i.x0-e),D(i.y1+e)]]}function Rp(r,i=.05){if(r.length!==4)return!1;let e=pe(r),n=[[e.x0,e.y0],[e.x1,e.y0],[e.x1,e.y1],[e.x0,e.y1]].slice();for(let s of r){let o=n.findIndex(l=>Math.abs(l[0]-s[0])<=i&&Math.abs(l[1]-s[1])<=i);if(o<0)return!1;n.splice(o,1)}return n.length===0}function Ap(r,i,e){let t=_r();return r.change(a("Add {name}",{name:e.name||a("Room")}),n=>{let s=$r(n,i),o={id:t,name:e.name,x:D(e.x),y:D(e.y),w:D(e.w),h:D(e.h),type:e.type||"room",extra:{}};e.points&&e.points.length>=3&&(o.points=e.points.map(l=>[Z(l[0]),Z(l[1])]),Ht(o)),s.rooms.push(o)}),t}function Cp(r,i,e=1){if(!i)return i;let t=new Set(r.map(s=>s.name));if(e<=1&&!t.has(i))return i;let n=Math.max(2,e);for(;t.has(`${i} ${n}`);)n++;return`${i} ${n}`}function Rl(r,i,e){let t=q(r,i);if(!t)return null;let n=t.room.name;if(t.room.name=e,n&&n!==e)for(let s of r.openings[t.floor.key]||[])s.room===n&&(s.room=e);return n}function Tp(r,i,e){let t=Ee(q(r.doc,i)?.room);r.change(a("Change type of {name}",{name:t}),n=>{let s=q(n,i)?.room;s&&(s.type=e)})}function Al(r,i,e,t){let n=Ee(q(r.doc,i)?.room);r.change(a("Resize {name}",{name:n}),s=>{let o=q(s,i)?.room;!o||o.points||(o.w=Math.max(cn,D(e)),o.h=Math.max(dn,D(t)))})}function Cl(r,i,e,t){let n=Ee(q(r.doc,i)?.room);r.change(a("Move {name}",{name:n}),s=>{let o=q(s,i)?.room;o&&ca(o,D(e)-o.x,D(t)-o.y)})}function Mp(r,i,e){let t=q(r.doc,i);if(!t||t.floor.key===e)return!1;let n=t.floor.key,s=Ee(t.room);return r.change(a("Move {name} to {floor}",{name:s,floor:a(r.floorLabel(e))}),o=>{let l=q(o,i);if(!l)return;l.floor.rooms.splice(l.index,1),$r(o,e).rooms.push(l.room);let d=o.openings[n];if(d&&l.room.name){let u=d.filter(p=>p.room===l.room.name);u.length&&(o.openings[n]=d.filter(p=>p.room!==l.room.name),pn(o.openings,e).push(...u))}}),r.setFloor(e),r.select({kind:"room",id:i}),r.toast(a("Moved {name} to {floor}",{name:s,floor:a(r.floorLabel(e))}),{label:a("Undo"),run:()=>{r.undo(),r.setFloor(n),r.select({kind:"room",id:i})}}),!0}function ka(r,i){let e=q(r.doc,i);if(!e)return null;let t=_r(),n=Cp(e.floor.rooms,e.room.name||a("Room"),2);return r.change(a("Duplicate {name}",{name:Ee(e.room)}),s=>{let o=q(s,i);if(!o)return;let l={...o.room,id:t,name:n,extra:{...o.room.extra},x:o.room.x+10,y:o.room.y+10};o.room.points&&(l.points=o.room.points.map(d=>[Z(d[0]+10),Z(d[1]+10)])),o.floor.rooms.splice(o.index+1,0,l)}),r.select({kind:"room",id:t}),t}function Tl(r,i){let e=Ee(q(r.doc,i)?.room);r.change(a("Reshape {name}",{name:e}),t=>{let n=q(t,i)?.room;!n||n.points||(n.points=je(n).map(s=>[Z(s[0]),Z(s[1])]))}),r.toast(a("Reshape: drag the corners, click an edge midpoint to add one, right-click a corner to remove"))}function Ml(r,i){let e=Ee(q(r.doc,i)?.room);r.change(a("Convert {name} to rectangle",{name:e}),t=>{let n=q(t,i)?.room;!n||!n.points||(Ht(n),delete n.points)})}function jl(r,i,e){let t=Ee(q(r.doc,i)?.room),n=-1;r.changeWith(s=>{let o=q(s,i)?.room,l=o?.points;if(!o||!l||e<0||e>=l.length)return null;let d=l[e],u=l[(e+1)%l.length];return l.splice(e+1,0,[Z((d[0]+u[0])/2),Z((d[1]+u[1])/2)]),Ht(o),n=e+1,a("Add a corner to {name}",{name:t})}),n>=0&&r.select({kind:"vtx",id:i,sub:n})}function wa(r,i,e){let t=q(r.doc,i)?.room;if(!t?.points)return!1;if(t.points.length<=3)return r.toast(a("Needs at least 3 corners")),!1;let n=Ee(t);return r.change(a("Remove a corner of {name}",{name:n}),s=>{let o=q(s,i)?.room;!o?.points||o.points.length<=3||(o.points.splice(e,1),Ht(o))}),r.select({kind:"room",id:i}),r.toast(a("Removed a corner of {name}",{name:n}),{label:a("Undo"),run:()=>r.undo()}),!0}function Pl(r,i){let e=Ee(q(r.doc,i)?.room);r.select({kind:"room",id:i}),r.removeSelection()&&(r.toast(a("Removed {name}",{name:e}),{label:a("Undo"),run:()=>r.undo()}),r.canvas?.announce(a("Removed {name}",{name:e})),r.canvas?.focusSurface())}var $a=null;function fg(r,i){let e=q(r.doc,i)?.room;return e?($a={...e,extra:{...e.extra},points:e.points?e.points.map(t=>[t[0],t[1]]):void 0},r.toast(a("Copied {name}",{name:Ee(e)})),!0):!1}function Pp(){return $a!==null}function Lp(r){if(!$a)return null;let i=$a,e=Cp(r.rooms(r.floor),i.name),t=Ap(r,r.floor,{name:e,type:i.type,x:i.x+10,y:i.y+10,w:i.w,h:i.h,points:i.points?.map(n=>[n[0]+10,n[1]+10])});return r.select({kind:"room",id:t}),r.canvas?.focusHit(le("room",t)),t}function Dp(r){let i=mg(r.rooms());r.change(a("Add property line"),e=>{e.property.points=i}),r.toast(a("Property boundary added — drag the corners to your lot lines; click an edge midpoint to add a corner, right-click a corner to remove"))}async function Fp(r){await U({heading:a("Remove the property boundary?"),confirmLabel:a("Remove"),destructive:!0})&&(r.change(a("Clear property line"),e=>{e.property.points=[]}),r.toast(a("Property boundary cleared"),{label:a("Undo"),run:()=>r.undo()}))}function kl(r,i){let e=-1;r.changeWith(t=>{let n=t.property.points;if(i<0||i>=n.length)return null;let s=n[i],o=n[(i+1)%n.length];return n.splice(i+1,0,[D((s[0]+o[0])/2),D((s[1]+o[1])/2)]),e=i+1,a("Add a property corner")}),e>=0&&r.select({kind:"prop-vtx",id:"lot",sub:e})}function xa(r,i){return r.doc.property.points.length<=3?(r.toast(a("A boundary needs at least 3 corners")),!1):(r.change(a("Remove a property corner"),e=>{e.property.points.length>3&&i<e.property.points.length&&e.property.points.splice(i,1)}),r.select(null),r.toast(a("Removed a property corner"),{label:a("Undo"),run:()=>r.undo()}),!0)}function Xi(r,i){return r.length>=3?a("Lot: {area}",{area:la(r,i)}):""}async function Op(r,i){let e=r.rooms(i).length;await U({heading:a("Move {n} rooms to 1st Floor?",{n:e}),confirmLabel:a("Move rooms to 1st Floor")})&&(r.change(a("Move rooms to 1st Floor"),n=>{let s=Oe(n,i),o=$r(n,"1f");s&&o.rooms.push(...s.rooms),n.floors=n.floors.filter(l=>l.key!==i),pn(n.openings,"1f").push(...n.openings[i]||[]),pn(n.cameras,"1f").push(...n.cameras[i]||[]),pn(n.pins,"1f").push(...n.pins[i]||[]),delete n.openings[i],delete n.cameras[i],delete n.pins[i]}),r.setFloor("1f"),r.toast(a("Moved {n} rooms to 1st Floor",{n:e}),{label:a("Undo"),run:()=>r.undo()}))}async function Zi(r,i,e,t,n={}){let s=await xl({heading:n.heading??a("Add Room"),name:"",type:n.type??"room",areas:r.areaNames(),confirmLabel:a("Add")});if(!s)return null;let o=Ap(r,i,{name:s.name,type:s.type,...e,points:t});return r.select({kind:"room",id:o}),r.canvas?.focusHit(le("room",o)),r.toast(n.zone?a("Added zone {name} — size it over the area the camera watches, then Save",{name:s.name}):a("Added {name} — drag to position, then Save",{name:s.name})),o}async function Sl(r,i){let e=q(r.doc,i)?.room;if(!e)return;let t=await xl({heading:a("Rename…"),name:e.name,type:e.type,areas:r.areaNames(),confirmLabel:a("Rename"),nameOnly:!0});!t||t.name===e.name||r.change(a("Rename {name}",{name:Ee(e)}),n=>{Rl(n,i,t.name)})}function Ll(r){return Zi(r,r.floor,hg(r))}function Np(r){let i=vg(r.rooms());return Zi(r,r.floor,{x:i.x,y:i.y,w:i.w,h:i.h},i.points,{heading:a("Outdoor Zone"),type:"outdoor",zone:!0})}var El=new Set,Er=null;function Vn(){for(let r of El)try{r()}catch{}}function Ip(r){return El.add(r),()=>{El.delete(r)}}function Yn(r){let i=r?.tool?.id;return i==="draw-rect"?"rect":i==="draw-poly"?"poly":null}function Hp(r){return Yn(r)==="poly"?Er:null}function Rr(r){let i=r.canvas,e=Yn(i);e==="poly"&&Er?Er.cancel():e==="rect"&&i&&(i.band=null,i.tooltip=null,i.setTool(null),i.announce(a("Drawing cancelled"))),Er=null,Vn()}function Dl(r){let i=r.canvas;if(!i)return;Yn(i)==="poly"&&Rr(r),i.cursor="crosshair";let e={id:"draw-rect",order:Ce.tool,hits:["*"],render:()=>m,onTap:()=>!0,onDragStart(t){let n=i.snapper({enabled:i.snap&&!t.altKey}).point(t.plan),s=o=>{let l=o.snap.point(o.plan),d=Math.min(n[0],l[0]),u=Math.min(n[1],l[1]);return{x:d,y:u,w:Math.abs(l[0]-n[0]),h:Math.abs(l[1]-n[1])}};return{cursor:"crosshair",onMove(o){let l=s(o);i.band=l,i.tooltip={x:l.x+l.w/2,y:l.y-3,text:`${H(l.w,r.settings.units)} × ${H(l.h,r.settings.units)}`}},onEnd(o){let l=s(o);i.band=null,i.tooltip=null,i.setTool(null),Vn(),l.w>=cn&&l.h>=dn?Zi(r,r.floor,l):i.announce(a("Too small for a room — drag a larger rectangle"))},onCancel(){i.band=null,i.tooltip=null}}},onKey(t){return t.key==="Escape"?(i.setTool(null),i.announce(a("Drawing cancelled")),Vn(),!0):t.key==="Enter"?(i.setTool(null),Vn(),Ll(r),!0):!1}};i.setTool(e),Vn(),i.announce(a("Drag on the plan to draw a room. Escape cancels."))}function Fl(r){let i=r.canvas;if(!i)return;Yn(i)&&Rr(r),i.cursor="crosshair";let e=[],t=()=>{i.draft=e.slice();let p=e[e.length-1];i.tooltip=p?{x:p[0],y:p[1]-4,text:a("{n} corners",{n:e.length})}:null,i.requestRender(),Vn()},n=()=>{i.tooltip=null,i.setTool(null),Er===d&&(Er=null),Vn()},s=()=>{n(),r.toast(a("Polygon cancelled"))},o=()=>{n();let p=pe(e);if(e.length<3||!p||p.x1-p.x0<cn||p.y1-p.y0<dn||pl(e)<cn*dn){r.toast(a("Polygon cancelled"));return}Zi(r,r.floor,{x:p.x0,y:p.y0,w:p.x1-p.x0,h:p.y1-p.y0},e.slice())},l=()=>{e.pop(),t(),i.announce(a("{n} corners",{n:e.length}))},d={count:()=>e.length,close:o,undo:l,cancel:s},u={id:"draw-poly",order:Ce.tool,hits:["*"],render:()=>m,onTap(p){if(p.button!==0)return!0;let v=i.snapper({enabled:i.snap&&!p.altKey}).point(p.plan),f=e[e.length-1];return e.length>=3&&Math.hypot(v[0]-e[0][0],v[1]-e[0][1])<=6?(o(),!0):(f&&Math.abs(f[0]-v[0])<.5&&Math.abs(f[1]-v[1])<.5||(e.push([Z(v[0]),Z(v[1])]),t(),i.announce(a("{n} corners",{n:e.length}))),!0)},onDoubleClick(){return e.length>=3&&o(),!0},onDragStart:()=>null,onKey(p){switch(p.key){case"Enter":return e.length>=3&&o(),!0;case"Backspace":case"Delete":return l(),!0;case"Escape":return s(),!0;default:return!1}}};i.setTool(u),Er=d,i.draft=[],Vn(),i.announce(a("Click the plan to add corners; click the first corner, press Enter or double-click to close. Escape cancels."))}function gg(r,i){let e=q(r.doc,i)?.room;return e?[{label:a("Rename…"),icon:"mdi:rename-outline",run:()=>{Sl(r,i)}},{label:a("Duplicate"),icon:"mdi:content-copy",run:()=>{ka(r,i)}},e.points?{label:a("Convert to rectangle"),icon:"mdi:vector-square",run:()=>Ml(r,i)}:{label:a("Reshape (edit corners)"),icon:"mdi:vector-polygon",run:()=>Tl(r,i)},{label:a("Delete"),icon:"mdi:delete-outline",danger:!0,run:()=>Pl(r,i)}]:[]}function bg(r,i){return[{label:a("Add room here"),icon:"mdi:plus-box-outline",run:()=>{Zi(r,r.floor,{x:_a(i[0]-30),y:_a(i[1]-20),w:60,h:40})}},{label:a("Paste"),icon:"mdi:content-paste",disabled:!Pp(),run:()=>{Lp(r)}}]}function yg(r,i,e){let t=q(i.doc,e);if(!t)return null;let n={x:t.room.x,y:t.room.y,w:t.room.w,h:t.room.h},s=Ee(t.room),o=i.units;i.store.select({kind:"room",id:e});let l=(u,p,v)=>i.store.change(a("Move {name}",{name:s}),f=>{let g=q(f,e)?.room;g&&ca(g,u-g.x,p-g.y)},{transient:v}),d=u=>{let p=n.x+u.delta[0],v=n.y+u.delta[1],f=u.snap,g=[],y=(R,j,C)=>{let M=C(R),O=f.guides.splice(0),F=C(R+j)-j,W=f.guides.splice(0),G=Math.abs(M-R)<=Math.abs(F-R);return g.push(...G?O:W),G?M:F},_=y(p,n.w,f.x),w=y(v,n.h,f.y);return f.guides.push(...g),[D(_),D(w)]};return{cursor:"move",onMove(u){let[p,v]=d(u);l(p,v,!0),i.canvas.tooltip={x:p+n.w/2,y:v-3,text:`${H(p,o)}, ${H(v,o)}`}},onEnd(u){let[p,v]=d(u);l(p,v,!1),i.canvas.tooltip=null,i.canvas.announce(a("{name} moved to {x}, {y}",{name:s,x:H(p,o),y:H(v,o)}))},onCancel(){i.canvas.tooltip=null}}}function _g(r,i,e){let t=q(i.doc,e);if(!t||t.room.points)return null;let n={x:t.room.x,y:t.room.y,w:t.room.w,h:t.room.h},s=Ee(t.room),o=i.units;i.store.select({kind:"room",id:e});let l=u=>{let p=u.snap.x(n.x+n.w+u.delta[0]),v=u.snap.y(n.y+n.h+u.delta[1]),f=Math.max(cn,D(p-n.x)),g=Math.max(dn,D(v-n.y));if(u.shiftKey&&n.w>0&&n.h>0){let y=n.h/n.w;Math.abs(u.delta[0])>=Math.abs(u.delta[1])?g=Math.max(dn,D(f*y)):f=Math.max(cn,D(g/y))}return[f,g]},d=(u,p,v)=>i.store.change(a("Resize {name}",{name:s}),f=>{let g=q(f,e)?.room;g&&!g.points&&(g.w=u,g.h=p)},{transient:v});return{cursor:"nwse-resize",onMove(u){let[p,v]=l(u);d(p,v,!0),i.canvas.tooltip={x:n.x+p/2,y:n.y-3,text:`${H(p,o)} × ${H(v,o)}`}},onEnd(u){let[p,v]=l(u);d(p,v,!1),i.canvas.tooltip=null,i.canvas.announce(a("{name} resized to {w} × {h}",{name:s,w:H(p,o),h:H(v,o)}))},onCancel(){i.canvas.tooltip=null}}}function wg(r,i,e,t){let n=q(i.doc,e),s=n?.room.points;if(!n||!s||!s[t])return null;let o=[s[t][0],s[t][1]],l=Ee(n.room),d=i.units;i.store.select({kind:"vtx",id:e,sub:t});let u=v=>{let f=[o[0]+v.delta[0],o[1]+v.delta[1]];return v.snap.enabled?v.snap.point(f):[Z(f[0]),Z(f[1])]},p=(v,f)=>i.store.change(a("Reshape {name}",{name:l}),g=>{let y=q(g,e)?.room;!y?.points||!y.points[t]||(y.points[t]=[Z(v[0]),Z(v[1])],Ht(y))},{transient:f});return{cursor:"move",onMove(v){let f=u(v);p(f,!0),i.canvas.tooltip={x:f[0],y:f[1]-4,text:`${H(f[0],d)}, ${H(f[1],d)}`}},onEnd(v){p(u(v),!1),i.canvas.tooltip=null},onCancel(){i.canvas.tooltip=null}}}var $g={id:"rooms",order:Ce.rooms,hits:["room","vtx","mid","handle","*"],styles:S`
    .room .shape {
      fill: var(--jv-accent);
      fill-opacity: 0.06;
      stroke: var(--jv-text-2);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    .room.t-bath .shape,
    .room.t-stairs .shape {
      fill: var(--jv-info);
    }
    .room.t-outdoor .shape {
      fill: var(--jv-ok);
      stroke-dasharray: 4 3;
    }
    .room.is-hover .shape {
      fill-opacity: 0.12;
    }
    .room.is-selected .shape {
      stroke: var(--jv-accent);
      stroke-width: 2;
    }
    .room.is-focus .shape,
    .room:focus-visible .shape {
      stroke: var(--jv-focus);
      stroke-width: 2;
    }
    .room .name {
      fill: var(--jv-text);
      text-anchor: middle;
      dominant-baseline: middle;
      font-weight: var(--jv-font-weight-medium);
    }
    .room .dims {
      fill: var(--jv-text-2);
      text-anchor: middle;
      dominant-baseline: middle;
    }
    .handle {
      fill: var(--jv-surface);
      stroke: var(--jv-accent);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
      cursor: nwse-resize;
    }
    .handle:focus-visible,
    .handle.is-focus {
      stroke: var(--jv-focus);
      stroke-width: 2.5;
    }
    .vtx {
      fill: var(--jv-surface);
      stroke: var(--jv-accent);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
      cursor: move;
    }
    .vtx.is-selected,
    .vtx.is-hover {
      fill: var(--jv-accent);
    }
    .vtx.is-focus,
    .vtx:focus-visible {
      stroke: var(--jv-focus);
      stroke-width: 2.5;
    }
    .mid {
      fill: var(--jv-surface);
      stroke: var(--jv-accent);
      stroke-width: 1;
      stroke-dasharray: 2 1.5;
      vector-effect: non-scaling-stroke;
      opacity: 0.85;
      cursor: copy;
    }
    .mid.is-hover,
    .mid:focus-visible {
      fill: var(--jv-accent-soft);
      opacity: 1;
    }
    .legacy-label {
      fill: var(--jv-text-2);
    }
    .pad {
      fill: transparent;
      stroke: none;
    }
  `,render(r){let i=r.units,e=r.floorDef?.labels||[],t=r.mode==="rooms",n=Math.max(2.5,9/Math.max(r.pxPerUnit,.01)),s=Math.max(1.6,5.5/Math.max(r.pxPerUnit,.01)),o=r.selection;return K`
      ${_e(r.rooms,l=>l.id,l=>{let d=le("room",l.id),u=l.w>80?7:l.w>50?5.5:l.w>25?4:3,p=l.x+l.w/2,v=l.y+l.h/2,f=!!o&&(o.kind==="room"||o.kind==="vtx")&&o.id===l.id,g=a(ja(l.type)),y=l.points;return K`
            <g data-hit=${d} tabindex="0" role="button" class="room t-${ug(l.type)} ${r.classes(d)}"
               aria-label=${`${l.name||a("Room")}, ${g}, ${H(l.w,i)} × ${H(l.h,i)}`}>
              <path class="shape" d=${jr(je(l))}></path>
              <text class="name" x=${p} y=${v} font-size=${u}>${l.name}</text>
              ${l.w>30&&l.h>24?K`<text class="dims" x=${p} y=${v+u*1.15} font-size=${u*.62}>${H(l.w,i)} × ${H(l.h,i)}</text>`:m}
            </g>
            ${t&&f&&!y?K`${Sr(le("handle",l.id),l.x+l.w,l.y+l.h,r.pxPerUnit)}<rect class="handle ${r.classes(le("handle",l.id))}" data-hit=${le("handle",l.id)} tabindex="0" role="button"
                       aria-label=${a("Resize {name}",{name:l.name||a("Room")})}
                       x=${l.x+l.w-n/2} y=${l.y+l.h-n/2} width=${n} height=${n}></rect>`:m}
            ${t&&f&&y?K`
                  ${y.map((_,w)=>{let R=y[(w+1)%y.length],j=le("mid",l.id,w);return K`${Sr(j,(_[0]+R[0])/2,(_[1]+R[1])/2,r.pxPerUnit)}<circle class="mid ${r.classes(j)}" data-hit=${j} tabindex="0" role="button" aria-label=${a("Add corner")} cx=${(_[0]+R[0])/2} cy=${(_[1]+R[1])/2} r=${s*.75}></circle>`})}
                  ${y.map((_,w)=>{let R=le("vtx",l.id,w);return K`${Sr(R,_[0],_[1],r.pxPerUnit)}<circle class="vtx ${r.classes(R)}" data-hit=${R} tabindex="0" role="button" aria-label=${a("Corner {i} of {name}",{i:w+1,name:l.name||a("Room")})} cx=${_[0]} cy=${_[1]} r=${s}></circle>`})}
                `:m}
          `})}
      ${e.map(l=>K`<text class="legacy-label" x=${l.x} y=${l.y} font-size="4" text-anchor="middle">${l.text}</text>`)}
    `},onTap(r,i){let e=r.hit;return!e||i.mode!=="rooms"?!1:e.kind==="handle"?(i.store.select({kind:"room",id:e.id}),!0):e.kind==="mid"&&e.sub!=null?(jl(i.store,e.id,e.sub),!0):!1},onDragStart(r,i){if(i.mode!=="rooms"||i.canvas.tool||!r.hit)return null;switch(r.hit.kind){case"room":return yg(r,i,r.hit.id);case"handle":return _g(r,i,r.hit.id);case"vtx":return r.hit.sub==null?null:wg(r,i,r.hit.id,r.hit.sub);default:return null}},onDoubleClick(r,i){return i.mode!=="rooms"||i.canvas.tool||!r.hit||r.hit.kind!=="room"?!1:(Sl(i.store,r.hit.id),!0)},onContextMenu(r,i){if(i.mode!=="rooms"||i.canvas.tool)return!1;let e=r.hit,t=i.store;if(!e)return qt({at:r.client,label:a("Plan"),items:bg(t,r.plan)}),!0;if(e.kind==="room"||e.kind==="handle")return t.select({kind:"room",id:e.id}),qt({at:r.client,label:Ee(q(i.doc,e.id)?.room),items:gg(t,e.id)}),!0;if(e.kind==="vtx"&&e.sub!=null){let n=q(i.doc,e.id)?.room,s=e.sub;return qt({at:r.client,label:a("Corner {i} of {name}",{i:s+1,name:Ee(n)}),items:[{label:a("Remove corner"),icon:"mdi:vector-point-minus",danger:!0,disabled:!n?.points||n.points.length<=3,run:()=>wa(t,e.id,s)}]}),!0}if(e.kind==="mid"&&e.sub!=null){let n=e.sub;return qt({at:r.client,label:a("Add corner"),items:[{label:a("Add corner"),icon:"mdi:vector-point-plus",run:()=>jl(t,e.id,n)}]}),!0}return!1},onKey(r,i){if(i.canvas.tool)return!1;let e=i.store,t=i.selection,n=t&&(t.kind==="room"||t.kind==="vtx")?t.id:null,s=r.ctrlKey||r.metaKey,o=Ep(r,i);if(o&&i.mode==="rooms"&&!s&&!r.altKey){if(o.kind==="mid"&&o.sub!=null&&(r.key==="Enter"||r.key===" ")){let l=o.sub;return jl(e,o.id,l),i.canvas.focusHit(le("vtx",o.id,l+1)),i.canvas.announce(a("Add a corner to {name}",{name:Ee(q(e.doc,o.id)?.room)})),!0}if(o.kind==="handle"){if(r.key==="Enter"||r.key===" "){e.select({kind:"room",id:o.id});let p=q(e.doc,o.id)?.room;return p&&i.canvas.announce(a("{name} selected · {w} × {h}",{name:Ee(p),w:H(p.w,i.units),h:H(p.h,i.units)})),!0}let l=r.shiftKey?10:1,d=r.key==="ArrowRight"?l:r.key==="ArrowLeft"?-l:0,u=r.key==="ArrowDown"?l:r.key==="ArrowUp"?-l:0;if(d||u){let p=q(e.doc,o.id)?.room;if(p&&!p.points){let v=Math.max(cn,D(p.w+d)),f=Math.max(dn,D(p.h+u)),g=Ee(p);(v!==p.w||f!==p.h)&&e.change(a("Resize {name}",{name:g}),y=>{let _=q(y,o.id)?.room;_&&!_.points&&(_.w=v,_.h=f)},{coalesce:`resize:${o.id}`}),i.canvas.announce(a("{name} resized to {w} × {h}",{name:g,w:H(v,i.units),h:H(f,i.units)}))}return!0}}}if(s&&!r.shiftKey&&!r.altKey&&i.mode==="rooms"){let l=r.key.toLowerCase();return l==="d"&&n?(ka(e,n),!0):l==="c"&&n?fg(e,n):l==="v"&&Pp()?!!Lp(e):!1}return s||r.altKey||i.mode!=="rooms"?!1:r.key==="F2"&&n?(Sl(e,n),!0):(r.key==="r"||r.key==="R")&&!r.shiftKey?(Dl(e),!0):(r.key==="p"||r.key==="P")&&!r.shiftKey?(Fl(e),!0):(r.key==="Delete"||r.key==="Backspace")&&t?.kind==="vtx"&&t.sub!=null?(wa(e,t.id,t.sub),!0):!1}};function xg(r,i,e){let t=i.doc.property.points;if(!t[e])return null;let n=[t[e][0],t[e][1]];i.store.select({kind:"prop-vtx",id:"lot",sub:e});let s=i.units,o=d=>{let u=d.snap.point([n[0]+d.delta[0],n[1]+d.delta[1]]);return[D(u[0]),D(u[1])]},l=(d,u)=>i.store.change(a("Move property corner"),p=>{p.property.points[e]&&(p.property.points[e]=d)},{transient:u});return{cursor:"move",onMove(d){let u=o(d);l(u,!0),i.canvas.tooltip={x:u[0],y:u[1]-4,text:Xi(i.store.doc.property.points,s)||`${H(u[0],s)}, ${H(u[1],s)}`}},onEnd(d){l(o(d),!1),i.canvas.tooltip=null},onCancel(){i.canvas.tooltip=null}}}var jg={id:"property",order:Ce.property,hits:["prop-vtx","prop-mid"],styles:S`
    .lot {
      fill: var(--jv-warn);
      fill-opacity: 0.05;
      stroke: var(--jv-warn);
      stroke-width: 1.5;
      stroke-dasharray: 6 4;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .lot-label {
      fill: var(--jv-warn-text);
    }
    .prop-vtx {
      fill: var(--jv-surface);
      stroke: var(--jv-warn);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
      cursor: move;
    }
    .prop-vtx.is-selected,
    .prop-vtx.is-hover {
      fill: var(--jv-warn);
    }
    .prop-vtx.is-focus,
    .prop-vtx:focus-visible {
      stroke: var(--jv-focus);
      stroke-width: 2.5;
    }
    .prop-mid {
      fill: var(--jv-surface);
      stroke: var(--jv-warn);
      stroke-width: 1;
      stroke-dasharray: 2 1.5;
      vector-effect: non-scaling-stroke;
      opacity: 0.85;
      cursor: copy;
    }
    .prop-mid.is-hover,
    .prop-mid:focus-visible {
      fill: var(--jv-warn-soft);
      opacity: 1;
    }
  `,render(r){let i=r.doc.property.points;if(i.length<3)return m;let e=r.mode==="rooms",t=Math.max(1.6,5.5/Math.max(r.pxPerUnit,.01)),n=pe(i),s=Math.max(3.5,r.viewBox.w/110);return K`
      <path class="lot" d=${jr(i)}></path>
      <text class="lot-label" x=${n.x0+s*.5} y=${n.y0+s*1.3} font-size=${s}>${Xi(i,r.units)}</text>
      ${e?K`
            ${i.map((o,l)=>{let d=i[(l+1)%i.length],u=le("prop-mid","lot",l);return K`${Sr(u,(o[0]+d[0])/2,(o[1]+d[1])/2,r.pxPerUnit)}<circle class="prop-mid ${r.classes(u)}" data-hit=${u} tabindex="0" role="button" aria-label=${a("Add corner")} cx=${(o[0]+d[0])/2} cy=${(o[1]+d[1])/2} r=${t*.75}></circle>`})}
            ${i.map((o,l)=>{let d=le("prop-vtx","lot",l);return K`${Sr(d,o[0],o[1],r.pxPerUnit)}<circle class="prop-vtx ${r.classes(d)}" data-hit=${d} tabindex="0" role="button" aria-label=${a("Property corner {i}",{i:l+1})} cx=${o[0]} cy=${o[1]} r=${t}></circle>`})}
          `:m}
    `},onTap(r,i){return i.mode!=="rooms"||!r.hit?!1:r.hit.kind==="prop-mid"&&r.hit.sub!=null?(kl(i.store,r.hit.sub),!0):!1},onDragStart(r,i){return i.mode!=="rooms"||i.canvas.tool||!r.hit||r.hit.kind!=="prop-vtx"||r.hit.sub==null?null:xg(r,i,r.hit.sub)},onContextMenu(r,i){if(i.mode!=="rooms"||!r.hit||r.hit.sub==null)return!1;let e=r.hit.sub;return r.hit.kind==="prop-vtx"?(qt({at:r.client,label:a("Property corner {i}",{i:e+1}),items:[{label:a("Remove corner"),icon:"mdi:vector-point-minus",danger:!0,disabled:i.doc.property.points.length<=3,run:()=>xa(i.store,e)}]}),!0):r.hit.kind==="prop-mid"?(qt({at:r.client,label:a("Add corner"),items:[{label:a("Add corner"),icon:"mdi:vector-point-plus",run:()=>kl(i.store,e)}]}),!0):!1},onKey(r,i){if(i.canvas.tool||i.mode!=="rooms")return!1;let e=Ep(r,i);if(e?.kind==="prop-mid"&&e.sub!=null&&(r.key==="Enter"||r.key===" ")&&!r.ctrlKey&&!r.metaKey&&!r.altKey){let n=e.sub;return kl(i.store,n),i.canvas.focusHit(le("prop-vtx","lot",n+1)),i.canvas.announce(a("Add a property corner")),!0}let t=i.selection;return!t||t.kind!=="prop-vtx"||t.sub==null?!1:r.key==="Delete"||r.key==="Backspace"?(xa(i.store,t.sub),!0):!1}};Ut(jg);Ut($g);function Sa(r,i){let e=i==="metric"?r/yr:r;return D(e/Nt)}function Xn(r,i){return zt(r,i)}var kg={residence_style:"cape_cod",home_stories:"1.5",chimney_side:"right",basement_entrance:"bulkhead"},Sg={dormers_front:"2",dormers_rear:"1",garage_bays:"3",chimney_count:"1"},ri=class extends Ge{constructor(){super(...arguments);this._houseOpen=!1;this._unsubDraw=null}connectedCallback(){super.connectedCallback(),P(this,[...ga,"jv-state-badge","jv-empty"]),this._unsubDraw=Ip(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),this._unsubDraw?.(),this._unsubDraw=null,this.store&&Yn(this.store.canvas)&&Rr(this.store)}get _u(){return this.units}_selectedRoom(){let e=this.store,t=e?.selection;if(!e||!t||t.kind!=="room"&&t.kind!=="vtx")return null;let n=q(e.doc,t.id);return n&&n.floor.key===e.floor?n.room:null}_pick(e){let t=this.store;if(!t)return;t.select({kind:"room",id:e.id});let n=this.canvas??t.canvas;if(!n)return;let s=n.viewBox,o=e.x+e.w/2,l=e.y+e.h/2;if(!(e.x>=s.x&&e.y>=s.y&&e.x+e.w<=s.x+s.w&&e.y+e.h<=s.y+s.h)){let p=n.pxPerUnit||1;n.panBy(-(o-(s.x+s.w/2))*p,-(l-(s.y+s.h/2))*p)}n.requestRender();let u=t.describeSelection();u&&n.announce(a("{name} selected · {w} × {h}",{name:u.name,w:H(u.w??0,this._u),h:H(u.h??0,this._u)}))}_focusCanvasHit(e){this.store?.canvas?.focusHit(e)}_icon(e,t=""){return ba(e,t)}render(){let e=this.store;return e?e.loaded?c`
      <div class="stack">
        ${this._renderDrawing()}
        ${this._renderInspector()}
        ${this._renderTools()}
        ${this._renderFloorNote()}
        ${this._renderList()}
        ${this._renderHouse()}
      </div>
    `:c`<jv-empty kind="loading" compact .message=${a("Loading...")}></jv-empty>`:m}_renderInspector(){let e=this.store,t=e.selection;if(t?.kind==="prop-vtx"&&t.sub!=null)return this._renderLotCorner(t.sub);let n=this._selectedRoom();if(!n)return c`<p class="hint">${ma(this.narrow)?a("Select a room on the plan, or in the list below, to edit it. Drag to move · corner handle to resize · long-press for more."):a("Select a room on the plan, or in the list below, to edit it. Drag to move · corner handle to resize · right-click for more.")}</p>`;let s=this._u,o=n.id,l=!!n.points&&n.points.length>=3,d=e.areaNames(),u=n.type==="outdoor"||bl(n.name,d),p=e.floors.map(g=>({value:g.key,label:a(e.floorLabel(g.key))})),v=qi.map(g=>({value:g.value,label:a(g.label)})),f=t?.kind==="vtx"&&t.sub!=null&&n.points?.[t.sub]?t.sub:null;return c`
      <section class="block" aria-labelledby="insp-h">
        <div>
          <h3 id="insp-h">${n.name||a("Room")}</h3>
          <span class="sub">${a(ja(n.type))} · ${H(n.w,s)} × ${H(n.h,s)} · ${la(je(n),s)}</span>
        </div>
        <div class="form">
          <div class="wide">
            ${Sp({id:"room-name",label:a("Name"),value:n.name,suggestions:d,onChange:g=>this._rename(o,g)})}
            <p class="hint">${a("Use the Home Assistant area name so occupancy lights this room")}</p>
            ${u?m:c`<p class="warn-line">${this._icon("mdi:alert-circle-outline","!")}<span>${a("No Home Assistant area has this name — occupancy won't light it.")}</span></p>`}
            ${/garage/i.test(n.name)&&e.floor==="1f"?c`<p class="hint">${a("The 3D model gives this room the garage roof.")}</p>`:m}
          </div>
          ${Pn({id:"room-type",label:a("Type"),value:n.type,options:v,onChange:g=>Tp(e,o,g)})}
          ${Pn({id:"room-floor",label:a("Floor"),value:e.floor,options:p,onChange:g=>Mp(e,o,g)})}
          ${Ve({id:"room-w",label:a("Width"),suffix:Pe(s),value:Xn(n.w,s),min:1,step:.5,disabled:l,onChange:g=>{g!=null&&Al(e,o,wr(g,s,cn),n.h)}})}
          ${Ve({id:"room-h",label:a("Depth"),suffix:Pe(s),value:Xn(n.h,s),min:1,step:.5,disabled:l,onChange:g=>{g!=null&&Al(e,o,n.w,wr(g,s,dn))}})}
          ${Ve({id:"room-x",label:a("X"),suffix:Pe(s),value:Xn(n.x,s),step:.5,onChange:g=>{g!=null&&Cl(e,o,Sa(g,s),n.y)}})}
          ${Ve({id:"room-y",label:a("Y"),suffix:Pe(s),value:Xn(n.y,s),step:.5,onChange:g=>{g!=null&&Cl(e,o,n.x,Sa(g,s))}})}
        </div>
        ${l?c`<p class="sub">${a("Corners: {n}",{n:n.points.length})}</p>`:m}
        ${f!=null?this._renderCorner(n,f):m}
        <div class="actions">
          ${l?c`<button type="button" class="jv-btn" @click=${()=>Ml(e,o)}>${this._icon("mdi:vector-square")}<span>${a("Convert to rectangle")}</span></button>`:c`<button type="button" class="jv-btn" @click=${()=>{Tl(e,o),this._focusCanvasHit(le("room",o))}}>${this._icon("mdi:vector-polygon")}<span>${a("Reshape (edit corners)")}</span></button>`}
          <button type="button" class="jv-btn" @click=${()=>ka(e,o)}>${this._icon("mdi:content-copy")}<span>${a("Duplicate")}</span></button>
          <button type="button" class="jv-btn text danger-text" @click=${()=>Pl(e,o)}>${this._icon("mdi:delete-outline")}<span>${a("Delete")}</span></button>
        </div>
      </section>
    `}_renderCorner(e,t){let n=this.store,s=this._u,o=e.points[t],l=d=>n.change(a("Reshape {name}",{name:e.name||a("Room")}),u=>{let p=q(u,e.id)?.room;if(!p?.points?.[t])return;p.points[t]=[Z(d[0]),Z(d[1])];let v=p.points.map(g=>g[0]),f=p.points.map(g=>g[1]);p.x=D(Math.min(...v)),p.y=D(Math.min(...f)),p.w=D(Math.max(...v)-Math.min(...v)),p.h=D(Math.max(...f)-Math.min(...f))});return c`
      <div class="block" role="group" aria-labelledby="corner-h">
        <h3 id="corner-h">${a("Corner {i} of {name}",{i:t+1,name:e.name||a("Room")})}</h3>
        <div class="form">
          ${Ve({id:"vtx-x",label:a("X"),suffix:Pe(s),value:Xn(o[0],s),step:.1,onChange:d=>{d!=null&&l([this._preciseUnits(d,s),o[1]])}})}
          ${Ve({id:"vtx-y",label:a("Y"),suffix:Pe(s),value:Xn(o[1],s),step:.1,onChange:d=>{d!=null&&l([o[0],this._preciseUnits(d,s)])}})}
        </div>
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${e.points.length<=3} @click=${()=>wa(n,e.id,t)}>${this._icon("mdi:vector-point-minus")}<span>${a("Remove corner")}</span></button>
        </div>
      </div>
    `}_preciseUnits(e,t){let n=t==="metric"?e/yr:e;return Z(n/Nt)}_renderLotCorner(e){let t=this.store,n=this._u,s=t.doc.property.points,o=s[e];if(!o)return m;let l=d=>t.change(a("Move property corner"),u=>{u.property.points[e]&&(u.property.points[e]=[D(d[0]),D(d[1])])});return c`
      <section class="block" aria-labelledby="lot-h">
        <div>
          <h3 id="lot-h">${a("Property corner {i}",{i:e+1})}</h3>
          <span class="sub">${Xi(s,n)}</span>
        </div>
        <div class="form">
          ${Ve({id:"lot-x",label:a("X"),suffix:Pe(n),value:Xn(o[0],n),step:.5,onChange:d=>{d!=null&&l([Sa(d,n),o[1]])}})}
          ${Ve({id:"lot-y",label:a("Y"),suffix:Pe(n),value:Xn(o[1],n),step:.5,onChange:d=>{d!=null&&l([o[0],Sa(d,n)])}})}
        </div>
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${s.length<=3} @click=${()=>xa(t,e)}>${this._icon("mdi:vector-point-minus")}<span>${a("Remove corner")}</span></button>
          <button type="button" class="jv-btn text" @click=${()=>t.select(null)}>${a("Done")}</button>
        </div>
      </section>
    `}_renderDrawing(){let e=this.store,t=this.canvas??e.canvas,n=Yn(t);if(!n)return m;let s=Hp(t);return c`<div class="drawing" role="status">
      <span>${n==="rect"?a("Drag on the plan to draw a room. Escape cancels."):a("Tap the plan to add corners ({n} so far), then Finish.",{n:s?.count()??0})}</span>
      ${s?c`
            <button type="button" class="jv-btn primary" ?disabled=${s.count()<3} @click=${()=>s.close()}>${a("Finish")}</button>
            <button type="button" class="jv-btn" ?disabled=${s.count()===0} @click=${()=>s.undo()}>${a("Remove last corner")}</button>
          `:m}
      <button type="button" class="jv-btn text" @click=${()=>Rr(e)}>${a("Cancel")}</button>
    </div>`}_renderTools(){let e=this.store,t=this.canvas??e.canvas,n=Yn(t),s=e.doc.property.points,o=!t;return c`
      <div class="block">
        <div class="tools" role="toolbar" aria-label=${a("Room tools")}>
          <button type="button" class="jv-btn" aria-keyshortcuts="R" aria-pressed=${String(n==="rect")} ?disabled=${o}
            @click=${()=>n==="rect"?Rr(e):this._startTool("rect")}>${this._icon("mdi:vector-rectangle","+")}<span>${a("Add Room")}</span></button>
          <button type="button" class="jv-btn" aria-keyshortcuts="P" aria-pressed=${String(n==="poly")} ?disabled=${o}
            @click=${()=>n==="poly"?Rr(e):this._startTool("poly")}>${this._icon("mdi:vector-polygon","+")}<span>${a("Add Room (polygon)")}</span></button>
          <button type="button" class="jv-btn" @click=${()=>{Ll(e)}}>${this._icon("mdi:plus-box-outline","+")}<span>${a("Place Room")}</span></button>
          <button type="button" class="jv-btn" @click=${()=>{Np(e)}}>${this._icon("mdi:pine-tree","+")}<span>${a("Outdoor Zone")}</span></button>
          ${s.length>=3?c`<button type="button" class="jv-btn" @click=${()=>{Fp(e)}}>${this._icon("mdi:border-none-variant","×")}<span>${a("Clear Property Line")}</span></button>`:c`<button type="button" class="jv-btn" @click=${()=>Dp(e)}>${this._icon("mdi:border-outside","+")}<span>${a("Property Line")}</span></button>`}
          ${this.narrow&&t?c`
                <button type="button" class="jv-btn" aria-pressed=${String(t.snap)} @click=${()=>{t.setSnap(!t.snap),this.requestUpdate()}}>${this._icon("mdi:magnet","⌗")}<span>${a("Snap to grid")}</span></button>
                <button type="button" class="jv-btn" @click=${()=>t.fit()}>${this._icon("mdi:fit-to-screen-outline","⤢")}<span>${a("Fit")}</span></button>
              `:m}
        </div>
        ${s.length>=3?c`<p class="lot">${Xi(s,this._u)}</p>`:m}
      </div>
    `}_startTool(e){let t=this.store;if(t?.canvas){e==="rect"?Dl(t):Fl(t);try{t.canvas.shadowRoot?.querySelector("svg")?.focus({preventScroll:!0})}catch{}}}_renderFloorNote(){let e=this.store,t=e.floor;if(!e.floorHidden(t))return m;let n=e.rooms(t).length;return c`
      <div class="floor-note">
        <jv-state-badge level="warn" .label=${a("Hidden on the Residence tab")}></jv-state-badge>
        ${!Ui(t)&&n?c`<button type="button" class="jv-btn" @click=${()=>{Op(e,t)}}>${a("Move rooms to 1st Floor")}</button>`:m}
      </div>
    `}_renderList(){let e=this.store,t=e.rooms(),n=this._u,s=e.areaNames(),o=e.selection,l=o&&(o.kind==="room"||o.kind==="vtx")?o.id:null;return t.length?c`
      <div class="block">
        <h3 id="room-list-h">${a("Rooms on {floor}",{floor:a(e.floorLabel())})} <span class="sub">(${t.length})</span></h3>
        <ul class="rooms" aria-labelledby="room-list-h">
          ${_e(t,d=>d.id,d=>{let u=d.type!=="outdoor"&&!bl(d.name,s),p=/^[a-z]+$/.test(d.type)?d.type:"room";return c`<li>
                <button type="button" class="row" aria-current=${l===d.id?"true":"false"} @click=${()=>this._pick(d)}>
                  <span class="dot t-${p}" aria-hidden="true"></span>
                  <span class="name">
                    <strong>${d.name||a("Room")}</strong>
                    <small>${a(ja(d.type))}${d.points?c` · ${a("Corners: {n}",{n:d.points.length})}`:m}</small>
                  </span>
                  <span class="size">${H(d.w,n)} × ${H(d.h,n)}</span>
                  ${u?c`<span class="flag" title=${a("No Home Assistant area has this name — occupancy won't light it.")}>
                        ${this._icon("mdi:alert-circle-outline","!")}<span class="visually-hidden">${a("No Home Assistant area has this name — occupancy won't light it.")}</span>
                      </span>`:m}
                </button>
              </li>`})}
        </ul>
      </div>
    `:c`<jv-empty compact icon="mdi:floor-plan" .message=${a("No rooms on this floor yet — draw one, place one, or import.")}></jv-empty>`}_renderHouse(){let e=this.store,t=e.settings.units,n=e.settingStatus.floor_plan_units;return c`
      <details class="house" ?open=${this._houseOpen} @toggle=${s=>{this._houseOpen=s.target.open}}>
        <summary>${a("House")}</summary>
        <div class="body">
          <div class="house-row wide">
            <fieldset class="seg">
              <legend>${a("Units")}</legend>
              <button type="button" class="jv-btn" aria-pressed=${String(t==="imperial")} ?disabled=${n?.level==="saving"} @click=${()=>this._setUnits("imperial")}>${a("Imperial (ft)")}</button>
              <button type="button" class="jv-btn" aria-pressed=${String(t==="metric")} ?disabled=${n?.level==="saving"} @click=${()=>this._setUnits("metric")}>${a("Metric (m)")}</button>
            </fieldset>
            ${this._status("floor_plan_units")}
          </div>
          ${Yu.map(s=>this._houseField(s))}
        </div>
      </details>
    `}_status(e){let t=this.store?.settingStatus[e];if(!t)return c`<span class="status" aria-live="polite"></span>`;let n=t.level==="saving"?a("Saving…"):t.level==="saved"?a("Saved"):t.message||a("Save failed");return c`<span class="status ${t.level}" aria-live="polite" role=${t.level==="error"?"alert":"status"}>${n}</span>`}_houseField(e){let t=this.store,s=t.config[e.key],o=t.settingStatus[e.key]?.level==="saving",l=`house-${e.key}`,d=a(e.label),u;if(e.kind==="bool")u=Yi({id:l,label:d,checked:s!==!1&&s!=="false",disabled:o,onChange:p=>{this._writeHouse(e,p)}});else if(e.kind==="int")u=Ve({id:l,label:d,value:xe(s),min:e.min,max:e.max,step:1,placeholder:e.key==="floor_plan_sqft"?a("blank = estimated from the plan"):Sg[e.key]??"",disabled:o,onChange:p=>{if(p==null){e.nullable?this._writeHouse(e,null):this.requestUpdate();return}this._writeHouse(e,Math.round(p))}});else{let p=(e.options||[]).map(f=>({value:f.value,label:a(f.label)})),v=s==null||s===""?kg[e.key]??"":String(e.key==="home_stories"?xe(s)??s:s);u=Pn({id:l,label:d,value:v,options:p,disabled:o,onChange:f=>{this._writeHouse(e,f)}})}return c`<div class="house-row">${u}${this._status(e.key)}</div>`}async _writeHouse(e,t){let n=this.store;if(n){if(e.key==="has_basement"&&t===!1&&n.rooms("bsmt").length&&!await U({heading:a("Hide the basement? Its rooms stay saved."),confirmLabel:a("Hide")})){this.requestUpdate();return}if(e.key==="home_stories"&&t==="1"&&n.rooms("2f").length&&!await U({heading:a("Hide the 2nd floor? Its rooms stay saved."),confirmLabel:a("Hide")})){this.requestUpdate();return}await n.writeSetting(e.key,t)}}async _setUnits(e){let t=this.store;if(!t||e===t.settings.units)return;await t.writeSetting("floor_plan_units",e)&&t.toast(e==="metric"?a("Units: Metric (m)"):a("Units: Imperial (ft)"))}_rename(e,t){let n=this.store,s=n?q(n.doc,e)?.room:null;if(!n||!s)return;let o=t.trim();if(!o){this.requestUpdate();return}o!==s.name&&n.change(a("Rename {name}",{name:s.name||a("Room")}),l=>{Rl(l,e,o)})}};ri.styles=[T,ni,S`
      :host {
        display: block;
        min-width: 0;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-4);
        min-width: 0;
      }
      .block {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-3);
        min-width: 0;
      }
      h3 {
        margin: 0;
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text);
        overflow-wrap: anywhere;
      }
      .sub {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
        gap: var(--jv-space-3);
        min-width: 0;
      }
      .form .wide {
        grid-column: 1 / -1;
      }
      .actions,
      .tools {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .actions .jv-btn,
      .tools .jv-btn {
        flex: 0 1 auto;
        max-width: 100%;
      }
      .tools .jv-btn span {
        overflow-wrap: anywhere;
      }
      .drawing {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-accent-soft);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
      }
      .drawing > span {
        flex: 1 1 160px;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .warn-line {
        display: flex;
        gap: var(--jv-space-2);
        align-items: flex-start;
        font-size: var(--jv-font-size-s);
        color: var(--jv-warn-text);
        overflow-wrap: anywhere;
      }
      .warn-line ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }
      .lot {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .floor-note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
      }
      ul.rooms {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        border: var(--jv-border-width) solid var(--jv-divider);
        border-radius: var(--jv-radius-sm);
      }
      ul.rooms li + li {
        border-top: var(--jv-border-width) solid var(--jv-divider);
      }
      .row {
        appearance: none;
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        width: 100%;
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) var(--jv-space-3);
        border: 0;
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .row:hover {
        background: var(--jv-hover);
      }
      .row:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      .row[aria-current="true"] {
        background: var(--jv-accent-soft);
      }
      .dot {
        flex: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--jv-accent);
      }
      .dot.t-bath,
      .dot.t-stairs {
        background: var(--jv-info);
      }
      .dot.t-outdoor {
        background: var(--jv-ok);
      }
      .dot.t-door {
        background: var(--jv-text-2);
      }
      .row .name {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .row .name strong {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .row .name small {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .row .size {
        flex: none;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .row .flag {
        flex: none;
        color: var(--jv-warn-text);
        display: inline-flex;
      }
      .row .flag ha-icon {
        --mdc-icon-size: 18px;
      }
      details.house {
        border: var(--jv-border-width) solid var(--jv-divider);
        border-radius: var(--jv-radius-sm);
      }
      details.house > summary {
        display: flex;
        align-items: center;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        cursor: pointer;
        font-weight: var(--jv-font-weight-medium);
        list-style: none;
        gap: var(--jv-space-2);
      }
      details.house > summary::-webkit-details-marker {
        display: none;
      }
      details.house > summary::before {
        content: "▸";
        color: var(--jv-text-2);
      }
      details.house[open] > summary::before {
        content: "▾";
      }
      details.house > summary:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      details.house > .body {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3) var(--jv-space-3);
        min-width: 0;
      }
      .house-row {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        min-width: 0;
      }
      .house-row.wide {
        grid-column: 1 / -1;
      }
      fieldset.seg {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        border: 0;
        margin: 0;
        padding: 0;
        min-width: 0;
      }
      fieldset.seg legend {
        padding: 0;
        margin-bottom: var(--jv-space-1);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        font-weight: var(--jv-font-weight-medium);
      }
      .seg .jv-btn[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        border-color: var(--jv-accent);
      }
      .seg .jv-btn[aria-pressed="true"]:focus-visible {
        box-shadow: var(--jv-focus-ring);
      }
      .jv-btn.danger-text {
        color: var(--jv-danger-text);
      }
    `],h([b()],ri.prototype,"_houseOpen",2),ri=h([A("jarvis-editor-rooms")],ri);var zp=.7;function Ea(r,i){if(r.type==="dormer"){let u=Bt(i);if(!u)return null;let p=u.x0+r.pos*(u.x1-u.x0),v=r.slope==="rear"?u.y1:u.y0;return{x:p-4,y:v-3,w:8,h:6,cx:p,cy:v,horizontal:!0,box:u}}let e=hl(r,i);if(!e)return null;let t=e.x1-e.x0,n=e.y1-e.y0,s,o,l=!0;switch(r.wall){case"back":s=e.x0+r.pos*t,o=e.y1;break;case"left":s=e.x0,o=e.y0+r.pos*n,l=!1;break;case"right":s=e.x1,o=e.y0+r.pos*n,l=!1;break;default:s=e.x0+r.pos*t,o=e.y0}let d=r.w||20;return l?{x:s-d/2,y:o-2,w:d,h:4,cx:s,cy:o,horizontal:l,box:e}:{x:s-2,y:o-d/2,w:4,h:d,cx:s,cy:o,horizontal:l,box:e}}function Kp(r,i,e){let t=Ea(r,i);if(!t)return null;let n=t.box,s=t.horizontal?n.x1-n.x0:n.y1-n.y0;if(s<=0)return null;let o=t.horizontal?(e[0]-n.x0)/s:(e[1]-n.y0)/s;return Math.min(1,Math.max(0,Math.round(o*100)/100))}function Ra(r,i){let e=[];for(let s of r){if(s.type==="stairs"||s.type==="door"||s.type==="outdoor")continue;let o=je(s);for(let l=0;l<o.length;l++){let d=o[l],u=o[(l+1)%o.length];e.push({x0:d[0],y0:d[1],x1:u[0],y1:u[1]})}}let t=Bt(r),n=[];for(let s of i){if(s.type!=="door"&&s.type!=="window")continue;let o=s.w||20,l=t;if((s.kind==="interior"||s.kind==="cased")&&s.room){let u=r.find(p=>p.name===s.room);u&&(l={x0:u.x,y0:u.y,x1:u.x+u.w,y1:u.y+u.h})}if(!l)continue;let d=s.pos;if(s.wall==="front"){let u=l.x0+d*(l.x1-l.x0);n.push({x0:u-o/2,y0:l.y0,x1:u+o/2,y1:l.y0})}else if(s.wall==="back"){let u=l.x0+d*(l.x1-l.x0);n.push({x0:u-o/2,y0:l.y1,x1:u+o/2,y1:l.y1})}else if(s.wall==="left"){let u=l.y0+d*(l.y1-l.y0);n.push({x0:l.x0,y0:u-o/2,x1:l.x0,y1:u+o/2})}else{let u=l.y0+d*(l.y1-l.y0);n.push({x0:l.x1,y0:u-o/2,x1:l.x1,y1:u+o/2})}}return{walls:e,gaps:n}}function Up(r,i,e,t){let[n,s]=r,[o,l]=i,[d,u]=e,[p,v]=t,f=(n-o)*(u-v)-(s-l)*(d-p);if(Math.abs(f)<1e-9)return null;let g=((n-d)*(u-v)-(s-u)*(d-p))/f,y=((n-d)*(s-l)-(s-u)*(n-o))/f;return g<0||g>1||y<0||y>1?null:[n+g*(o-n),s+g*(l-s)]}function qp(r,i,e=2.5){let[t,n]=r;for(let s of i)if(t>=Math.min(s.x0,s.x1)-e&&t<=Math.max(s.x0,s.x1)+e&&n>=Math.min(s.y0,s.y1)-e&&n<=Math.max(s.y0,s.y1)+e)return!0;return!1}function Eg(r,i,e){for(let t of e.walls){let n=Up(r,i,[t.x0,t.y0],[t.x1,t.y1]);if(n&&!qp(n,e.gaps))return!1}return!0}function Rg(r,i,e,t,n){let s=r+t*Math.cos(e),o=i+t*Math.sin(e),l=t;for(let d of n.walls){let u=Up([r,i],[s,o],[d.x0,d.y0],[d.x1,d.y1]);if(!u||qp(u,n.gaps))continue;let p=Math.hypot(u[0]-r,u[1]-i);p<l&&(l=p)}return l}function Ag(r){let i=Math.max(r.range,5),e=(r.angle-r.fov/2)*Math.PI/180,t=(r.angle+r.fov/2)*Math.PI/180,n=r.x+i*Math.cos(e),s=r.y+i*Math.sin(e),o=r.x+i*Math.cos(t),l=r.y+i*Math.sin(t),d=r.fov>180?1:0;return`M ${r.x} ${r.y} L ${n.toFixed(1)} ${s.toFixed(1)} A ${i} ${i} 0 ${d} 1 ${o.toFixed(1)} ${l.toFixed(1)} Z`}function Wp(r,i){if(!r.indoor||!i.walls.length)return Ag(r);let e=Math.max(r.range,5),t=Math.max(24,Math.round(r.fov/3)),n=(r.angle-r.fov/2)*Math.PI/180,s=r.fov*Math.PI/180/t,o=`M ${r.x} ${r.y}`;for(let l=0;l<=t;l++){let d=n+l*s,u=Rg(r.x,r.y,d,e,i);o+=` L ${(r.x+u*Math.cos(d)).toFixed(1)} ${(r.y+u*Math.sin(d)).toFixed(1)}`}return o+" Z"}function Bp(r,i,e,t){let n=r-e.x,s=i-e.y;if(Math.hypot(n,s)>Math.max(e.range,5))return!1;let l=(Math.atan2(s,n)*180/Math.PI-e.angle)%360;return l>180&&(l-=360),l<-180&&(l+=360),Math.abs(l)>e.fov/2?!1:!e.indoor||Eg([e.x,e.y],[r,i],t)}function Ol(r,i,e){let t={};for(let n of r){if(n.type==="door"||n.type==="stairs")continue;let s=0,o=0;if(n.type==="outdoor"||n.points&&n.points.length>=3){let l=je(n),d=1/0,u=1/0,p=-1/0,v=-1/0;for(let g of l)d=Math.min(d,g[0]),u=Math.min(u,g[1]),p=Math.max(p,g[0]),v=Math.max(v,g[1]);let f=6;for(let g=0;g<f;g++)for(let y=0;y<f;y++){let _=d+(g+.5)/f*(p-d),w=u+(y+.5)/f*(v-u);Qu(_,w,l)&&(o++,Bp(_,w,i,e)&&s++)}}else for(let d=0;d<4;d++)for(let u=0;u<4;u++){let p=n.x+(d+.5)/4*n.w,v=n.y+(u+.5)/4*n.h;o++,Bp(p,v,i,e)&&s++}s>0&&o>0&&(t[n.name]=Math.round(s/o*100)/100)}return t}function Cg(r,i,e){let t=r.filter(o=>o.type!=="stairs"&&o.type!=="door");for(let o of t)if(i>=o.x&&i<=o.x+o.w&&e>=o.y&&e<=o.y+o.h)return o.name||"the area";let n=null,s=1/0;for(let o of t){let l=Math.hypot(o.x+o.w/2-i,o.y+o.h/2-e);l<s&&(s=l,n=o)}return n?.name||"the area"}function Tg(r,i){let e=[];for(let t of i)t.type!=="door"||!t.room||(t.kind==="cased"?e.push(`cased opening at ${t.room}`):t.kind==="interior"&&e.push(`interior door at ${t.room}`));return r.some(t=>t.type==="stairs")&&e.push("open staircase"),e}function Gp(r,i,e){let t=Oe(r,i)?.rooms||[],n=r.openings[i]||[],s=Ra(t,n);return{entity:e.entity||"",room:Cg(t,e.x,e.y),fov:e.fov,range_ft:Math.round(e.range*Nt*10)/10,indoor:e.indoor,candidates:Ol(t,e,s),openings:Tg(t,n)}}var ii=["ha-icon","ha-select","ha-list-item","mwc-list-item","ha-textfield"],Mg=r=>r.stopPropagation();function Zn(r,i){return x("ha-icon")?c`<ha-icon icon=${r}></ha-icon>`:c`<span aria-hidden="true">${i}</span>`}function Ar(r){let i=t=>{let n=String(t.target?.value??"");n!==r.value&&r.onChange(n)},e=r.options.some(t=>t.value===r.value);if(x("ha-select")){let t=x("ha-list-item")?Te`ha-list-item`:Te`mwc-list-item`;return c`
      <div class="field">
        <ha-select id=${r.id} .label=${r.label} .value=${I(r.value)} ?disabled=${!!r.disabled} naturalMenuWidth fixedMenuPosition @selected=${i} @closed=${Mg}>
          ${e?m:ye`<${t} .value=${r.value} disabled>${r.value}</${t}>`}
          ${r.options.map(n=>ye`<${t} .value=${n.value}>${n.label}</${t}>`)}
        </ha-select>
      </div>
    `}return c`
    <label class="field">
      <span class="lbl">${r.label}</span>
      <select id=${r.id} .value=${I(r.value)} ?disabled=${!!r.disabled} @change=${i}>
        ${e?m:c`<option value=${r.value} disabled ?selected=${!0}>${r.value}</option>`}
        ${r.options.map(t=>c`<option value=${t.value} ?selected=${t.value===r.value}>${t.label}</option>`)}
      </select>
    </label>
  `}function Qi(r){let i=e=>r.onChange(String(e.target?.value??""));return x("ha-textfield")?c`
      <div class="field">
        <ha-textfield id=${r.id} type="number" .label=${r.label} .value=${I(r.value)} .suffix=${r.suffix??""} min=${r.min??m} max=${r.max??m} step=${r.step??m} ?disabled=${!!r.disabled} @change=${i}></ha-textfield>
      </div>
    `:c`
    <label class="field">
      <span class="lbl">${r.label}</span>
      <span class="num">
        <input id=${r.id} type="number" .value=${I(r.value)} min=${r.min??m} max=${r.max??m} step=${r.step??m} ?disabled=${!!r.disabled} @change=${i} />
        ${r.suffix?c`<span class="suffix">${r.suffix}</span>`:m}
      </span>
    </label>
  `}function Ji(r){let i=e=>Number(e.target?.value??r.value);return c`
    <label class="field range">
      <span class="lbl"><span>${r.label}</span><output for=${r.id}>${r.display}</output></span>
      <input id=${r.id} type="range" .value=${I(String(r.value))} min=${r.min} max=${r.max} step=${r.step} ?disabled=${!!r.disabled} @input=${e=>r.onInput?.(i(e))} @change=${e=>r.onChange(i(e))} />
    </label>
  `}var si=S`
  :host {
    display: block;
  }
  .help,
  .hint {
    margin: 0 0 var(--jv-space-3);
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
  .hint {
    font-size: var(--jv-font-size-xs);
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    margin-bottom: var(--jv-space-3);
  }
  .toolbar .jv-btn {
    min-height: 36px;
    padding: 0 var(--jv-space-3);
    font-size: var(--jv-font-size-s);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-2);
  }
  .row {
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    padding: var(--jv-space-2) var(--jv-space-3);
    background: var(--jv-surface);
    transition: border-color var(--jv-ease), background-color var(--jv-ease);
  }
  .row.is-glow {
    background: var(--jv-hover);
  }
  .row.is-selected {
    border-color: var(--jv-accent);
    box-shadow: inset 2px 0 0 var(--jv-accent);
  }
  .row-head {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-width: 0;
  }
  .row-head .grow {
    flex: 1 1 auto;
    min-width: 0;
  }
  .row-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(136px, 1fr));
    gap: var(--jv-space-2) var(--jv-space-3);
    margin-top: var(--jv-space-2);
  }
  .row-fields .wide {
    grid-column: 1 / -1;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-1);
    min-width: 0;
  }
  .lbl {
    display: flex;
    justify-content: space-between;
    gap: var(--jv-space-2);
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
  }
  .lbl output {
    color: var(--jv-text);
    font-variant-numeric: tabular-nums;
  }
  select,
  input[type="number"],
  input[type="text"] {
    width: 100%;
    min-width: 0;
    font: inherit;
    color: var(--jv-text);
    background: var(--jv-surface);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    padding: 0 var(--jv-space-2);
    min-height: var(--jv-tap);
  }
  select:disabled,
  input:disabled {
    color: var(--jv-text-3);
  }
  .num {
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
  }
  .num .suffix {
    flex: none;
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
  input[type="range"] {
    width: 100%;
    min-height: var(--jv-tap);
    margin: 0;
    accent-color: var(--jv-accent);
  }
  ha-select,
  ha-textfield {
    display: block;
    width: 100%;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 var(--jv-space-2);
    border-radius: var(--jv-radius-pill);
    border: var(--jv-border-width) solid var(--jv-border);
    background: var(--jv-neutral-soft);
    color: var(--jv-text);
    font-size: var(--jv-font-size-xs);
    font-weight: var(--jv-font-weight-medium);
    white-space: nowrap;
    cursor: pointer;
    font-family: inherit;
  }
  .tag[aria-pressed="true"] {
    border-color: var(--jv-accent);
    background: var(--jv-accent-soft);
  }
  .tag .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: var(--jv-space-1);
    background: var(--jv-neutral);
  }
  .pill {
    appearance: none;
    display: inline-flex;
    align-items: center;
    font: inherit;
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-medium);
    min-height: 36px;
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-pill);
    background: var(--jv-surface);
    color: var(--jv-text);
    cursor: pointer;
  }
  .pill:hover {
    background: var(--jv-hover);
  }
  .pill[aria-pressed="true"] {
    background: var(--jv-accent-soft);
    border-color: var(--jv-accent);
  }
  .seg {
    display: inline-flex;
    gap: var(--jv-space-1);
    border: 0;
    padding: 0;
    margin: 0;
  }
  .err {
    margin: var(--jv-space-1) 0 0;
    font-size: var(--jv-font-size-s);
    color: var(--jv-danger-text);
    overflow-wrap: anywhere;
  }
  .status {
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    min-height: 1.4em;
  }
  .status.ok {
    color: var(--jv-ok-text);
  }
  .jv-icon-btn {
    width: 36px;
    height: 36px;
    flex: none;
  }
  .jv-icon-btn ha-icon {
    --mdc-icon-size: 20px;
  }
  /* narrow = touch: the full 44 px targets (DESIGN section 3); the per-row remove buttons sit side by side */
  :host([narrow]) .toolbar .jv-btn {
    min-height: var(--jv-tap);
  }
  :host([narrow]) .jv-icon-btn {
    width: var(--jv-tap);
    height: var(--jv-tap);
  }
  .empty {
    margin-top: var(--jv-space-2);
  }
`;function Pg(r){return sa.find(i=>i.type===r.type&&(r.type==="dormer"?i.slope===(r.slope==="rear"?"rear":"front"):(i.kind??null)===(r.kind??null)))}function es(r){let i=Pg(r);return i?i.label:r.kind?`${r.kind} ${r.type}`:r.type}function Ul(r){if(r.type==="dormer")return"dormer";if(r.type==="window")return r.kind==="interior"?"interior":"window";let i=r.kind??"exterior";return/^[a-z]+$/.test(i)?i:"exterior"}var ql={front:"Front",back:"Back",left:"Left",right:"Right"};function Yp(){return ul.map(r=>({value:r,label:a(ql[r])}))}var Il=null,Hl=null,Bl=new Set,Nl=!1;function Lg(){Nl||(Nl=!0,queueMicrotask(()=>{Nl=!1;for(let r of Bl)try{r()}catch{}}))}function Ye(r,i){Il!==r&&(Il=r,i?.canvas?.requestRender())}function ts(){return Il}function Aa(r){let i=r?.raw??null;i!==Hl&&(Hl=i,Lg())}function ns(){return Hl}function Ca(r){return Bl.add(r),()=>{Bl.delete(r)}}var zl=!1,Kl=null,Vp=!1;function Dg(){if(Vp||typeof window>"u")return;Vp=!0;let r=()=>{zl=!0},i=()=>{zl=!1;let e=Kl;Kl=null,e?.()};window.addEventListener("pointerdown",r,!0),window.addEventListener("pointerup",i,!0),window.addEventListener("pointercancel",i,!0)}function Ta(r,i,e){if(!i)return;Dg();let t=()=>{if(i.isConnected){if(e?.isConnected){let n=e.getBoundingClientRect(),s=r.getBoundingClientRect();if(!(s.left>=n.right-1||s.right<=n.left+1))return}i.scrollIntoView?.({block:"nearest"})}};zl?Kl=t:t()}function Xp(r,i){if(!r||!Number.isFinite(r))return"";let t=(r>1e12?r:r*1e3)-Date.now(),n=Math.abs(t);if(n<6e4)return a("just now");let s=[["year",31536e6],["month",2592e6],["day",864e5],["hour",36e5],["minute",6e4]],o="minute",l=Math.round(t/6e4);for(let[d,u]of s)if(n>=u){o=d,l=Math.round(t/u);break}try{let d=i?.locale?.language||i?.language||"en";return new Intl.RelativeTimeFormat(d,{numeric:"auto"}).format(l,o)}catch{return""}}function Ma(r){return r.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}function Wl(r){return r?[Math.round((r.x0+r.x1)/2),Math.round((r.y0+r.y1)/2)]:[100,80]}var Pa=r=>`${Math.round(r*100)}%`;function Zp(r){let i=[];return r.room&&i.push(r.room),r.type==="dormer"?i.push(r.slope==="rear"?a("Rear slope"):a("Front slope")):i.push(a(ql[r.wall]??"Front")),i.push(Pa(r.pos)),i.join(" · ")}var Fg={id:"openings",order:Ce.openings,hits:["opening"],styles:S`
    .opening .hitbox {
      fill: transparent;
      stroke: none;
    }
    .opening .marker {
      fill: var(--jv-warn);
      stroke: var(--jv-surface);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    .opening .pane {
      stroke: var(--jv-surface);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .opening.k-window .marker {
      fill: var(--jv-accent);
    }
    .opening.k-interior .marker {
      fill: var(--jv-text-2);
    }
    .opening.k-cellar .marker {
      fill: var(--jv-warn);
    }
    .opening.k-cased .marker {
      fill: var(--jv-info);
    }
    .opening.k-french .marker {
      fill: var(--jv-ok);
    }
    .opening.k-exterior .marker {
      fill: var(--jv-warn);
    }
    .opening.k-dormer .marker {
      fill: var(--jv-neutral);
    }
    .opening.is-hover .marker,
    .opening.is-glow .marker {
      stroke: var(--jv-accent);
      stroke-width: 2;
    }
    .opening.is-selected .marker {
      stroke: var(--jv-accent);
      stroke-width: 3;
    }
    .opening.is-focus .marker,
    .opening:focus-visible .marker {
      stroke: var(--jv-focus);
      stroke-width: 3;
    }
    .opening.is-mapped .marker {
      stroke: var(--jv-ok);
      stroke-width: 3;
    }
    @media (prefers-reduced-motion: no-preference) {
      .opening.is-mapped .marker {
        animation: jv-opening-pulse 1.2s ease-out 1;
      }
    }
    @keyframes jv-opening-pulse {
      0% {
        stroke-width: 8;
      }
      100% {
        stroke-width: 3;
      }
    }
  `,render(r){Aa(r.hover);let i=r.doc.openings[r.floor]||[];if(!i.length)return m;let e=r.mode==="doors"?new Set(Object.values(r.store.settings.doorMapping)):null,t=ts(),n=Math.max(2,6/(r.pxPerUnit||1));return K`${_e(i,s=>s.id,s=>{let o=Ea(s,r.rooms);if(!o)return m;let l=le("opening",s.id),d=["opening",`k-${Ul(s)}`,r.classes(l),t===s.id?"is-glow":"",e&&s.entity&&e.has(s.entity)?"is-mapped":""].filter(Boolean).join(" "),u=s.type==="window"?o.horizontal?K`<line class="pane" x1=${o.x+1} y1=${o.cy} x2=${o.x+o.w-1} y2=${o.cy}></line>`:K`<line class="pane" x1=${o.cx} y1=${o.y+1} x2=${o.cx} y2=${o.y+o.h-1}></line>`:m;return K`
          <g data-hit=${l} tabindex="0" role="button" class=${d} aria-label=${`${a(es(s))} · ${Zp(s)}`}>
            <rect class="hitbox" x=${o.x-n} y=${o.y-n} width=${o.w+2*n} height=${o.h+2*n}></rect>
            <rect class="marker" x=${o.x} y=${o.y} width=${o.w} height=${o.h} rx="0.8"></rect>
            ${u}
          </g>
        `})}`},onDragStart(r,i){if(i.mode!=="openings"||!r.hit||r.hit.kind!=="opening")return null;let e=r.hit.id,t=Kt(i.doc,e);if(!t||t.floor!==i.floor)return null;let n=i.rooms,s=a(es(t.opening)),o=a("Move {name}",{name:s});i.store.select({kind:"opening",id:e});let l=(p,v)=>i.store.change(o,f=>{let g=Kt(f,e)?.opening;g&&(g.pos=p)},{transient:v}),d=p=>{let v=Kt(i.store.doc,e)?.opening;return v?Kp(v,n,p.plan):null},u=p=>{let v=Kt(i.store.doc,e)?.opening,f=v?Ea(v,n):null;i.canvas.tooltip=f?{x:f.cx,y:f.cy-4,text:Pa(p)}:null};return{cursor:"grabbing",onMove:p=>{let v=d(p);v!=null&&(l(v,!0),u(v))},onEnd:p=>{let v=d(p);i.canvas.tooltip=null,v!=null&&(l(v,!1),i.canvas.announce(a("{name} moved to {pos}",{name:s,pos:Pa(v)})))},onCancel:()=>{i.canvas.tooltip=null}}}};Ut(Fg);var Og=0,rs=class extends Ge{constructor(){super(...arguments);this._uid=`jeo${++Og}`;this._unsubHover=null;this._lastSel=null}connectedCallback(){super.connectedCallback(),P(this,ii),this._unsubHover=Ca(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),this._unsubHover?.(),this._unsubHover=null,Ye(null,this.store)}updated(){let e=this.store?.selection,t=e?.kind==="opening"?e.id:null;t&&t!==this._lastSel&&Ta(this,this.renderRoot.querySelector(`.row[data-id="${Ma(t)}"]`),this.canvas),this._lastSel=t}_defaultRoom(e){let t=this.store?.selection;if(t?.kind==="room"){let s=q(e,t.id)?.room;if(s&&s.type!=="outdoor"&&s.name)return s.name}return(e.floors.find(s=>s.key===this.floor)?.rooms||[]).find(s=>s.type!=="outdoor"&&s.name)?.name}_add(e){let t=this.store;if(!t)return;let n=this.floor,s=a(e.label),o="";t.change(a("Add {name}",{name:s}),l=>{o=oa("e",Object.values(l.openings).flat().map(u=>u.id));let d={id:o,type:e.type,kind:e.kind,wall:"front",pos:.5,w:20,entity:"",extra:{}};if(e.slope&&(d.slope=e.slope),e.kind&&ia.has(e.kind)){let u=this._defaultRoom(l);u&&(d.room=u)}pn(l.openings,n).push(d)}),o&&(t.select({kind:"opening",id:o}),this.canvas?.announce(a("Added {name} — drag to position, then Save",{name:s})))}_remove(e){let t=this.store;if(!t)return;let n=a(es(e)),s=e.id,o=t.changeWith(l=>{let d=Kt(l,s);return d?(l.openings[d.floor].splice(d.index,1),a("Removed {name}",{name:n})):null});o&&(Ye(null,t),t.toast(o,{label:a("Undo"),run:()=>t.undo()}),this.canvas?.announce(o))}_edit(e,t,n,s=!1){this.store?.change(n,o=>{let l=Kt(o,e)?.opening;l&&t(l)},{transient:s})}render(){let e=this.store;if(!e)return m;let t=this.floor,n=e.rooms(t),s=Bt(n)!=null,o=e.openings(t),l=sa.filter(p=>!p.floors||p.floors.includes(t)),d=ns(),u=d&&d.startsWith("opening:")?d.slice(8):null;return c`
      <p class="help">
        ${a("Interior windows, interior / balcony doors and cased openings attach to a room's wall — pick the room, then the wall. A balcony door is full-height glass; a cased opening is a doorway with no door; dormers go on the 2nd floor.")}
      </p>
      <div class="toolbar" role="group" aria-label=${a("Openings")}>
        ${l.map(p=>c`<button type="button" class="jv-btn" ?disabled=${!s} @click=${()=>this._add(p)}>+ ${a(p.label)}</button>`)}
      </div>
      ${s?o.length===0?c`<jv-empty class="empty" compact icon="mdi:window-closed-variant" .message=${a("No openings placed on this floor yet — add one above.")}></jv-empty>`:c`<ul class="rows" aria-label=${a("Openings")}>
              ${_e(o,p=>p.id,p=>this._row(p,n,u))}
            </ul>`:c`<jv-empty class="empty" compact icon="mdi:floor-plan" .message=${a("No rooms on this floor yet — draw one, place one, or import.")}></jv-empty>`}
    `}_row(e,t,n){let s=this.store,o=this.units,l=e.id,d=`${this._uid}-${l}`,u=s.selection?.kind==="opening"&&s.selection.id===l,p=e.type==="dormer",v=!!e.kind&&ia.has(e.kind),f=e.kind==="cased",g=a(es(e)),y=a("Edit {name}",{name:g}),_=a("Move {name}",{name:g}),w=[{value:"",label:a("— room —")},...t.filter(M=>M.type!=="outdoor"&&M.name).map(M=>({value:M.name,label:M.name}))],R=[{value:"",label:a("— none —")},...da(this.hass,e.entity).map(M=>({value:M,label:rt(this.hass,M)}))],j=()=>Ye(l,s),C=()=>Ye(null,s);return c`
      <li class="row ${u?"is-selected":""} ${n===l?"is-glow":""}" data-id=${l} @pointerenter=${j} @pointerleave=${C} @focusin=${j} @focusout=${C}>
        <div class="row-head">
          <button type="button" class="tag k-${Ul(e)} jv-hit" aria-pressed=${String(u)} @click=${()=>s.select({kind:"opening",id:l})}>
            <span class="dot" aria-hidden="true"></span>${g}
          </button>
          <span class="grow jv-muted jv-truncate where">${Zp(e)}</span>
          <button type="button" class="jv-icon-btn" aria-label=${a("Remove {name}",{name:g})} title=${a("Remove")} @click=${()=>this._remove(e)}>${Zn("mdi:close","×")}</button>
        </div>
        <div class="row-fields">
          ${v?Ar({id:`${d}-room`,label:a("Room"),value:e.room??"",options:w,onChange:M=>this._edit(l,O=>{M?O.room=M:delete O.room},y)}):m}
          ${p?Ar({id:`${d}-slope`,label:a("Roof slope"),value:e.slope==="rear"?"rear":"front",options:[{value:"front",label:a("Front slope")},{value:"rear",label:a("Rear slope")}],onChange:M=>this._edit(l,O=>{O.slope=M==="rear"?"rear":"front"},y)}):Ar({id:`${d}-wall`,label:a("Wall"),value:e.wall,options:Yp(),onChange:M=>this._edit(l,O=>{O.wall=M},y)})}
          ${Ji({id:`${d}-pos`,label:a("Position"),value:e.pos,min:0,max:1,step:.02,display:Pa(e.pos),onInput:M=>this._edit(l,O=>{O.pos=It(M,0,1)},_,!0),onChange:M=>this._edit(l,O=>{O.pos=It(M,0,1)},_)})}
          ${p?m:Qi({id:`${d}-w`,label:a("Width"),value:String(zt(e.w,o)),min:1,step:.5,suffix:Pe(o),onChange:M=>this._edit(l,O=>{let F=Number(M);O.w=Number.isFinite(F)&&F>0?wr(F,o,1):20},y)})}
          ${f?c`<span class="field"><span class="lbl">${a("Sensor")}</span><span class="jv-muted">${a("open passage · no sensor")}</span></span>`:Ar({id:`${d}-ent`,label:a("Sensor"),value:e.entity,options:R,onChange:M=>this._edit(l,O=>{O.entity=M},y)})}
        </div>
      </li>
    `}};rs.styles=[T,si,S`
      .tag.k-window .dot {
        background: var(--jv-accent);
      }
      .tag.k-interior .dot {
        background: var(--jv-text-2);
      }
      .tag.k-cellar .dot,
      .tag.k-exterior .dot {
        background: var(--jv-warn);
      }
      .tag.k-cased .dot {
        background: var(--jv-info);
      }
      .tag.k-french .dot {
        background: var(--jv-ok);
      }
      .tag.k-dormer .dot {
        background: var(--jv-neutral);
      }
      .where {
        font-size: var(--jv-font-size-xs);
      }
    `],rs=h([A("jarvis-editor-openings")],rs);var Ng=["ha-selector","ha-entity-picker","ha-entities-picker","ha-area-picker","ha-areas-picker"],Qp=50,Ig=6e4,Hg={area:"config/area_registry/list",label:"config/label_registry/list",device:"config/device_registry/list",entity:null,domain:null},La={entity:"entity id",area:"area",domain:"domain",label:"label",device:"device"};function Ln(r){return typeof r=="string"?r:""}function Da(r,i){if(r==="area"){let e=Ln(i.area_id)||Ln(i.id);return e?{value:e,label:Ln(i.name)||e}:null}if(r==="label"){let e=Ln(i.label_id)||Ln(i.id);return e?{value:e,label:Ln(i.name)||e}:null}if(r==="device"){let e=Ln(i.id);return e?{value:e,label:Ln(i.name_by_user)||Ln(i.name)||e}:null}return null}function ai(r,i){return r.label.localeCompare(i.label,void 0,{sensitivity:"base"})||r.value.localeCompare(i.value)}var Jp=new Map;function Bg(r,i){let e=Hg[i];if(!e||typeof r.callWS!="function")return null;let t=Jp.get(e);if(t&&Date.now()-t.at<Ig)return t.items;let n=r.callWS({type:e}).then(s=>Array.isArray(s)?s.map(o=>Da(i,o??{})).filter(o=>!!o).sort(ai):[]).catch(()=>[]);return Jp.set(e,{at:Date.now(),items:n}),n}var zg=0,we=class extends L{constructor(){super(...arguments);this.kind="entity";this.multiple=!1;this.value=void 0;this.data=null;this.label="";this.placeholder="";this.disabled=!1;this.allowCustom=!1;this._query="";this._open=!1;this._active=0;this._note="";this._registryItems=null;this._registryLoading=!1;this._mode=null;this._uid=`jvp${++zg}`}connectedCallback(){super.connectedCallback(),P(this,Ng)}focus(){this.renderRoot.querySelector("input, ha-selector, ha-entity-picker, ha-entities-picker, ha-area-picker, ha-areas-picker")?.focus()}_selected(){let e=this.value;return Array.isArray(e)?e.filter(t=>typeof t=="string"&&t!==""):typeof e=="string"&&e!==""?[e]:[]}_emit(e){let t=[...new Set(e.map(s=>s.trim()).filter(Boolean))],n=this.multiple?t:t[0];this._note="",this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:n},bubbles:!0,composed:!0}))}_pick(e){if(this.disabled||!e)return;let t=this._selected();this.multiple?t.includes(e)||this._emit([...t,e]):(this._emit([e]),this._open=!1),this._query="",this._active=0}_remove(e){this.disabled||this._emit(this._selected().filter(t=>t!==e))}_states(){return Object.values(this.hass?.states??{})}_friendly(e){let t=this.hass?.states?.[e]?.attributes?.friendly_name;return typeof t=="string"&&t?t:void 0}_source(){if(this.items){let e=typeof this.items=="function"?this.items():this.items;return Array.isArray(e)?e:[]}switch(this.kind){case"entity":{let e=this.domains?.length?new Set(this.domains):null;return this._states().filter(t=>!e||e.has(t.entity_id.split(".")[0])).map(t=>{let n=this._friendly(t.entity_id);return{value:t.entity_id,label:n??t.entity_id,secondary:n?t.entity_id:void 0}}).sort(ai)}case"domain":return[...new Set(this._states().map(e=>e.entity_id.split(".")[0]))].sort().map(e=>({value:e,label:e}));case"area":{let e=this.hass?.areas;if(e&&typeof e=="object")return Object.values(e).map(n=>Da("area",n)).filter(n=>!!n).sort(ai);let t=this.data?.areas;return Array.isArray(t)&&t.length?t.map(n=>({value:n.id,label:n.name||n.id})).sort(ai):null}case"label":{let e=this.data?.config?.available_labels;return Array.isArray(e)&&e.length?e.map(t=>Da("label",t??{})).filter(t=>!!t).sort(ai):null}case"device":{let e=this.hass?.devices;return e&&typeof e=="object"?Object.values(e).map(t=>Da("device",t)).filter(t=>!!t).sort(ai):null}}return[]}_all(){return this._source()??this._registryItems??[]}_ensureRegistry(){if(this._registryItems!==null||this._registryLoading||this._source()!==null||!this.hass)return;let e=Bg(this.hass,this.kind);if(!e){this._registryItems=[];return}this._registryLoading=!0,e.then(t=>{this._registryItems=t,this._registryLoading=!1})}_describe(e){let t=this.kind==="entity"&&e.startsWith("!"),n=t?e.slice(1):e,s=this._all(),o=s.find(l=>l.value===n)??(this.kind==="label"?s.find(l=>l.label===n):void 0);if(o)return{label:o.label,secondary:o.secondary??(o.value!==o.label&&this.kind!=="domain"?o.value:void 0),missing:!1,exempt:t};if(this.kind==="entity"){let l=this._friendly(n);if(l)return{label:l,secondary:n,missing:!1,exempt:t}}return{label:n,missing:this.kind!=="domain"&&!(this._registryLoading||this._source()===null&&this._registryItems===null),exempt:t}}_filtered(){let e=new Set(this._selected().map(s=>s.startsWith("!")?s.slice(1):s)),t=this._query.trim().toLowerCase(),n=this._all().filter(s=>!e.has(s.value)&&(!t||s.value.toLowerCase().includes(t)||s.label.toLowerCase().includes(t)));return{shown:n.slice(0,Qp),more:Math.max(0,n.length-Qp)}}_detectMode(){return x("ha-selector")?"selector":this.kind==="entity"&&x(this.multiple?"ha-entities-picker":"ha-entity-picker")?"entity":this.kind==="area"&&x(this.multiple?"ha-areas-picker":"ha-area-picker")?"area":"fallback"}_focused(){try{return this.matches(":focus-within")}catch{return!1}}_selector(){switch(this.kind){case"entity":return{entity:{multiple:this.multiple,...this.domains?.length?{filter:{domain:this.domains}}:{}}};case"area":return{area:{multiple:this.multiple}};case"label":return{label:{multiple:this.multiple}};case"device":return{device:{multiple:this.multiple}};case"domain":return{select:{multiple:this.multiple,custom_value:!0,mode:"dropdown",options:this._all().map(e=>({value:e.value,label:e.label}))}}}return{}}_onHaChange(e){e.stopPropagation();let t=e.detail?.value,n=Array.isArray(t)?t.filter(s=>typeof s=="string"):typeof t=="string"&&t?[t]:[];this._emit(n)}_renderHa(e){let t=this._selected(),n=this.multiple?t:t[0]??"";return e==="selector"?c`<ha-selector .hass=${this.hass} .selector=${this._selector()} .value=${n} .label=${this.label} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-selector>`:e==="entity"?this.multiple?c`<ha-entities-picker .hass=${this.hass} .value=${t} .label=${this.label} .includeDomains=${this.domains??[]} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-entities-picker>`:c`<ha-entity-picker .hass=${this.hass} .value=${n} .label=${this.label} .includeDomains=${this.domains??[]} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-entity-picker>`:this.multiple?c`<ha-areas-picker .hass=${this.hass} .value=${t} .label=${this.label} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-areas-picker>`:c`<ha-area-picker .hass=${this.hass} .value=${n} .label=${this.label} .disabled=${this.disabled} @value-changed=${this._onHaChange}></ha-area-picker>`}_onInput(e){this._query=String(e.target.value??""),this._active=0,this._open=!0,this._note=""}_onFocus(){this._ensureRegistry(),this._open=!0}_onFocusOut(e){let t=e.relatedTarget;t&&this.renderRoot.contains(t)||(this._open=!1)}_onKey(e){let{shown:t}=this._filtered();switch(e.key){case"ArrowDown":e.preventDefault(),this._open=!0,this._active=Math.min(this._active+1,Math.max(0,t.length-1));break;case"ArrowUp":e.preventDefault(),this._active=Math.max(this._active-1,0);break;case"Enter":{e.preventDefault();let n=this._query.trim();if(this._open&&t[this._active])this._pick(t[this._active].value);else if(n){let s=this._all().find(o=>o.value===n||o.label.toLowerCase()===n.toLowerCase());s?this._pick(s.value):this.allowCustom?this._pick(n):this._note=a('"{value}" is not a known {thing}',{value:n,thing:a(La[this.kind])})}break}case"Escape":this._open?(e.stopPropagation(),this._open=!1):this._query&&(e.stopPropagation(),this._query="");break;case"Backspace":{let n=this._selected();this.multiple&&!this._query&&n.length&&(e.preventDefault(),this._remove(n[n.length-1]));break}}}_onAdd(){let e=this._query.trim();if(!e){this.focus(),this._open=!0;return}let t=this._all().find(n=>n.value===e||n.label.toLowerCase()===e.toLowerCase());t?this._pick(t.value):this.allowCustom?this._pick(e):this._note=a('"{value}" is not a known {thing}',{value:e,thing:a(La[this.kind])})}_renderChips(){let e=this._selected();return e.length?c`
      <ul class="chips" aria-label=${a("Selected")}>
        ${e.map(t=>{let n=this._describe(t);return c`
            <li class="chip ${n.missing?"missing":""}" title=${t}>
              <span class="chip-text">
                <span class="jv-truncate">${n.label}</span>
                ${n.secondary?c`<span class="sec jv-mono">${n.secondary}</span>`:m}
                ${n.exempt?c`<span class="tag">${a("exempt")}</span>`:m}
                ${n.missing?c`<span class="tag warn">${a("not found")}</span>`:m}
              </span>
              <button type="button" class="x" aria-label=${a("Remove {name}",{name:n.label})} ?disabled=${this.disabled} @click=${()=>this._remove(t)}>×</button>
            </li>
          `})}
      </ul>
    `:m}_renderFallback(){let e=`${this._uid}-list`,{shown:t,more:n}=this._filtered(),s=this._open&&!this.disabled,o=s&&t[this._active]?`${this._uid}-o${this._active}`:void 0,l=!this.multiple&&this._selected().length>0,d=this.placeholder||(this.multiple||!l?a("Search…"):a("Replace…")),u=this._registryLoading;return c`
      ${this._renderChips()}
      <div class="combo" @focusout=${this._onFocusOut}>
        <input
          type="text"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          aria-autocomplete="list"
          aria-expanded=${s?"true":"false"}
          aria-controls=${e}
          aria-activedescendant=${o??m}
          aria-label=${this.label||a(La[this.kind])}
          placeholder=${d}
          .value=${I(this._query)}
          ?disabled=${this.disabled}
          @input=${this._onInput}
          @keydown=${this._onKey}
          @focus=${this._onFocus}
          @click=${this._onFocus}
        />
        ${this.allowCustom&&this._query.trim()?c`<button type="button" class="jv-btn add" ?disabled=${this.disabled} @click=${this._onAdd}>${a("Add")}</button>`:m}
        ${s?c`
              <ul id=${e} class="list" role="listbox" aria-label=${this.label||a(La[this.kind])} @mousedown=${p=>p.preventDefault()}>
                ${t.map((p,v)=>c`
                    <li id="${this._uid}-o${v}" class="opt" role="option" aria-selected=${v===this._active?"true":"false"} @click=${()=>this._pick(p.value)} @mousemove=${()=>this._active=v}>
                      <span class="name">${p.label}</span>
                      ${p.secondary?c`<span class="sec jv-mono">${p.secondary}</span>`:m}
                    </li>
                  `)}
                ${u?c`<li class="meta" role="presentation">${a("Loading…")}</li>`:m}
                ${!u&&!t.length?c`<li class="meta" role="presentation">${this._query.trim()&&this.allowCustom?a("Press Enter to add “{value}”",{value:this._query.trim()}):a("No matches")}</li>`:m}
                ${n?c`<li class="meta" role="presentation">${a("{count} more — type to filter",{count:n})}</li>`:m}
              </ul>
            `:m}
      </div>
      ${this._note?c`<p class="note" role="alert">${this._note}</p>`:m}
    `}willUpdate(){(this._mode===null||!this._focused())&&(this._mode=this._detectMode())}updated(e){e.has("_active")&&this._open&&this.renderRoot.querySelector(`#${this._uid}-o${this._active}`)?.scrollIntoView?.({block:"nearest"}),e.has("hass")&&this._registryItems===null&&this._open&&this._ensureRegistry()}render(){let e=this._mode??this._detectMode();return e==="fallback"?this._renderFallback():this._renderHa(e)}};we.styles=[T,S`
      :host {
        display: block;
        min-width: 0;
      }
      :host([disabled]) {
        opacity: 0.6;
      }
      ha-selector,
      ha-entity-picker,
      ha-entities-picker,
      ha-area-picker,
      ha-areas-picker {
        display: block;
        width: 100%;
      }
      .chips {
        list-style: none;
        margin: 0 0 var(--jv-space-2);
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
      }
      .chips:empty {
        display: none;
      }
      /* 32 px chip; the × button is a 44 x 44 px target (negative block
         margin keeps the chip 32 px tall), so the chip itself must not
         clip - the label span truncates instead */
      .chip {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-1);
        max-width: 100%;
        min-width: 0;
        min-height: 32px;
        padding: 0 var(--jv-space-1) 0 var(--jv-space-3);
        border-radius: var(--jv-radius-pill);
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-surface-2);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
      }
      .chip.missing {
        border-style: dashed;
      }
      .chip-text {
        display: inline-flex;
        align-items: baseline;
        gap: var(--jv-space-2);
        min-width: 0;
        overflow: hidden;
      }
      .chip-text .sec {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tag {
        flex: none;
        font-size: var(--jv-font-size-xs);
        line-height: 18px;
        padding: 0 var(--jv-space-2);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-neutral-soft);
        color: var(--jv-text);
      }
      .tag.warn {
        background: var(--jv-warn-soft);
      }
      .x {
        appearance: none;
        flex: none;
        width: var(--jv-tap);
        height: var(--jv-tap);
        margin: -6px calc(var(--jv-space-1) * -1) -6px 0;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-l);
        line-height: 1;
        cursor: pointer;
      }
      .x:hover {
        background: var(--jv-hover);
        color: var(--jv-text);
      }
      .x:disabled {
        cursor: default;
        color: var(--jv-text-3);
      }
      .combo {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
      }
      .combo input {
        flex: 1 1 160px;
      }
      .combo .add {
        flex: none;
      }
      .combo .list {
        flex-basis: 100%;
      }
      input {
        width: 100%;
        display: block;
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        padding: 0 var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      input::placeholder {
        color: var(--jv-text-2);
      }
      input:disabled {
        color: var(--jv-text-3);
      }
      .list {
        list-style: none;
        margin: var(--jv-space-1) 0 0;
        padding: var(--jv-space-1) 0;
        max-height: 240px;
        overflow-y: auto;
        scrollbar-width: thin;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        box-shadow: var(--jv-shadow);
      }
      .opt {
        display: flex;
        align-items: baseline;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) var(--jv-space-3);
        cursor: pointer;
        min-width: 0;
      }
      .opt:hover {
        background: var(--jv-hover);
      }
      .opt[aria-selected="true"] {
        background: var(--jv-accent-soft);
      }
      .opt .name {
        flex: 1 1 auto;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .opt .sec {
        flex: none;
        max-width: 50%;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .meta {
        padding: var(--jv-space-2) var(--jv-space-3);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .note {
        margin: var(--jv-space-1) 0 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-warn-text);
        overflow-wrap: anywhere;
      }
    `],h([$({type:String,reflect:!0})],we.prototype,"kind",2),h([$({type:Boolean,reflect:!0})],we.prototype,"multiple",2),h([$({attribute:!1})],we.prototype,"value",2),h([$({attribute:!1})],we.prototype,"hass",2),h([$({attribute:!1})],we.prototype,"data",2),h([$({type:String})],we.prototype,"label",2),h([$({type:String})],we.prototype,"placeholder",2),h([$({type:Boolean,reflect:!0})],we.prototype,"disabled",2),h([$({type:Boolean,attribute:"allow-custom"})],we.prototype,"allowCustom",2),h([$({attribute:!1})],we.prototype,"domains",2),h([$({attribute:!1})],we.prototype,"items",2),h([b()],we.prototype,"_query",2),h([b()],we.prototype,"_open",2),h([b()],we.prototype,"_active",2),h([b()],we.prototype,"_note",2),h([b()],we.prototype,"_registryItems",2),h([b()],we.prototype,"_registryLoading",2),we=h([A("jv-picker")],we);var eh="door_mapping",Kg=["binary_sensor","cover","lock"];function Ug(r,i){if(!i)return null;let e=r?.states?.[i]?.state;return e==null||e==="unavailable"||e==="unknown"?null:e==="on"||e==="open"||e==="opening"||e==="unlocked"?"open":"closed"}var qg=0,is=class extends Ge{constructor(){super(...arguments);this._uid=`jed${++qg}`}connectedCallback(){super.connectedCallback(),P(this,[...ii,"jv-picker"])}disconnectedCallback(){super.disconnectedCallback(),Ye(null,this.store)}_write(e){let t=this.store;if(!t)return;let n={};for(let[s,o]of Object.entries(e))typeof o=="string"&&o&&(n[s]=o);t.writeSetting(eh,n)}_setSlot(e,t){let n=this.store;if(!n)return;let s=n.settings.doorMapping;if((s[e]??"")===t)return;let o={...s};t?o[e]=t:delete o[e],this._write(o)}_glowEntity(e){let t=this.store;if(!t)return;let n=e?t.openings().find(s=>s.entity===e):void 0;Ye(n?.id??null,t)}_stateBadge(e,t){let n=this.store,s=null;if(e.backend){let l=n.data?.doors?.[e.slot];s=l==="open"?"open":l==="closed"?"closed":null}else{let l=n.settings.doorMapping,d=t||e.n===1&&l.garage||"";s=Ug(this.hass,d)}return s?c`<jv-state-badge level=${s==="open"?"warn":"neutral"} .label=${s==="open"?a("Open"):a("Closed")}></jv-state-badge>`:m}_items(e){return da(this.hass,e).map(t=>{let n=rt(this.hass,t);return n!==t?{value:t,label:n,secondary:t}:{value:t,label:t}})}render(){let e=this.store;if(!e)return m;let t=e.settings.doorMapping,n=hp(e.config),s=vp(t,n),o=e.settingStatus[eh],l=o?.level==="saving";return c`
      <p class="help">
        ${a("Map the model's doors to your entities. Blank = auto-detect by name. Per-bay garage slots drive the 3D model only; JARVIS's door awareness uses Front, Garage, Garage Side / Rear, Kitchen ↔ Garage, Cellar and Basement.")}
      </p>
      <fieldset class="slots" aria-label=${a("Doors")} aria-busy=${l?"true":"false"}>
        ${_e(n,d=>d.slot,d=>{let u=a(d.label,d.n!=null?{n:d.n}:void 0),p=t[d.slot]??"",v=`${this._uid}-${d.slot}`;return c`
              <div class="slot" data-slot=${d.slot} @pointerenter=${()=>this._glowEntity(p||null)} @pointerleave=${()=>this._glowEntity(null)} @focusin=${()=>this._glowEntity(p||null)} @focusout=${()=>this._glowEntity(null)}>
                <div class="slot-head">
                  <span class="slot-name" id=${v}>${u}</span>
                  ${this._stateBadge(d,p)}
                </div>
                <jv-picker
                  kind="entity"
                  .hass=${this.hass}
                  .data=${e.data}
                  .label=${u}
                  .placeholder=${p?a("type to find an entity…"):a("— auto-detect —")}
                  .domains=${Kg}
                  .items=${()=>this._items(p)}
                  .value=${p}
                  ?disabled=${l}
                  @value-changed=${f=>{f.stopPropagation();let g=f.detail?.value;this._setSlot(d.slot,typeof g=="string"?g:"")}}
                ></jv-picker>
              </div>
            `})}
      </fieldset>
      <div class="status-row" role="status" aria-live="polite">
        ${o?.level==="saving"?c`<span class="status">${a("Saving…")}</span>`:o?.level==="saved"?c`<span class="status ok">${a("Saved")}</span>`:m}
      </div>
      ${o?.level==="error"?c`<p class="err" role="alert">${a("Save failed — {message}",{message:o.message||""})}</p>`:m}
      ${s.length?c`
            <h3 class="sub">${a("Other mapped slots")}</h3>
            <ul class="other">
              ${s.map(d=>{let u=t[d]??"",p=rt(this.hass,u);return c`<li>
                  <span class="what">
                    <span class="jv-mono">${d}</span>
                    <span class="jv-muted jv-truncate">${p}${p!==u?c` · <span class="jv-mono">${u}</span>`:m}</span>
                  </span>
                  <button type="button" class="jv-icon-btn" ?disabled=${l} aria-label=${a("Remove {name}",{name:d})} title=${a("Remove")} @click=${()=>this._setSlot(d,"")}>
                    ${Zn("mdi:close","×")}
                  </button>
                </li>`})}
            </ul>
          `:m}
    `}};is.styles=[T,si,S`
      fieldset.slots {
        border: 0;
        margin: 0;
        padding: 0;
        min-width: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
        gap: var(--jv-space-3);
      }
      .slot {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        min-width: 0;
        padding: var(--jv-space-2) var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        transition: background-color var(--jv-ease);
      }
      .slot:hover,
      .slot:focus-within {
        background: var(--jv-hover);
      }
      .slot-head {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: 28px;
        min-width: 0;
      }
      .slot-name {
        flex: 1 1 auto;
        min-width: 0;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      jv-picker {
        display: block;
        min-width: 0;
      }
      .sub {
        margin: var(--jv-space-4) 0 var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text-2);
      }
      .other {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .other li {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-width: 0;
        padding: var(--jv-space-1) var(--jv-space-1) var(--jv-space-1) var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
      }
      .other .what {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .other .jv-icon-btn {
        width: var(--jv-tap);
        height: var(--jv-tap);
      }
      .status-row {
        margin-top: var(--jv-space-3);
      }
    `],is=h([A("jarvis-editor-doors")],is);var Gl="jarvis/compute_camera_coverage",th=new Set(["ok","warn","danger","info","neutral","accent"]),oi=r=>(Math.round(r)%360+360)%360,Wg=(r,i)=>r.length>i?`${r.slice(0,i)}…`:r;function li(r,i,e){let t=(r.cameras[i]||[]).findIndex(n=>n.id===e);return a("CAM {n}",{n:t>=0?t+1:"?"})}function Fa(r,i){r.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:i},bubbles:!0,composed:!0}))}function nh(r,i){let e=r.floor,[t,n]=i?[D(i[0]),D(i[1])]:Wl(Bt(r.rooms(e))),s="";return r.change(a("Add camera"),o=>{s=oa("c",Object.values(o.cameras).flat().map(l=>l.id)),pn(o.cameras,e).push({id:s,x:t,y:n,angle:270,fov:90,range:55,entity:"",indoor:!0,extra:{}})}),s?(r.select({kind:"camera",id:s}),r.canvas?.announce(a("{name} selected",{name:li(r.doc,e,s)})),s):null}function Vl(r,i){let e=r.changeWith(t=>{let n=Me(t,i);if(!n)return null;let s=n.camera.entity?rt(r.hass,n.camera.entity):li(t,n.floor,i);return t.cameras[n.floor].splice(n.index,1),a("Removed {name}",{name:s})});e&&(Ye(null,r),r.toast(e,{label:a("Undo"),run:()=>r.undo()}),r.canvas?.announce(e))}function Gg(r,i){r.change(a("Toggle indoor/outdoor"),e=>{let t=Me(e,i)?.camera;t&&(t.indoor=!t.indoor)})}function rh(r,i,e){let t=rt(r.hass,i),n=r.changeWith(s=>{let o=Mn(s,i,e);return o?(s.pins[o.floor].splice(o.index,1),a("Removed {name}",{name:t})):null});n&&(Ye(null,r),r.toast(n,{label:a("Undo"),run:()=>r.undo()}),r.canvas?.announce(n))}function Vg(r){if(!r||typeof r!="object")return null;let i=r;return Array.isArray(i.covered)?{covered:i.covered.filter(e=>typeof e=="string"),reason:typeof i.reason=="string"?i.reason:"",source:typeof i.source=="string"?i.source:"geometry",ts:typeof i.ts=="number"&&Number.isFinite(i.ts)?i.ts:Math.round(Date.now()/1e3)}:null}var Qn=(r,i,e,t)=>It(i/(r.pxPerUnit||1),e,t);function ih(r,i,e,t){let n=r.units,s=a("Move {name}",{name:e}),o=d=>{let u=d.snap.point([i[0]+d.delta[0],i[1]+d.delta[1]]);return[D(u[0]),D(u[1])]},l=(d,u)=>r.store.change(s,p=>t(p,d),{transient:u});return{cursor:"grabbing",onMove:d=>{let u=o(d);l(u,!0),r.canvas.tooltip={x:u[0],y:u[1]-Qn(r,14,4,14),text:`${H(u[0],n)}, ${H(u[1],n)}`}},onEnd:d=>{let u=o(d);l(u,!1),r.canvas.tooltip=null,r.canvas.announce(a("{name} moved to {x}, {y}",{name:e,x:H(u[0],n),y:H(u[1],n)}))},onCancel:()=>{r.canvas.tooltip=null}}}function Yg(r,i){let e=Me(r.doc,i);if(!e)return null;let t=e.camera.x,n=e.camera.y,s=li(r.doc,e.floor,i),o=a("Aim {name}",{name:s}),l=r.units,d=p=>{let v=p.plan[0]-t,f=p.plan[1]-n,g=Math.atan2(f,v)*180/Math.PI;return{angle:p.snap.enabled?oi(Math.round(g/5)*5):oi(g),range:Math.max(5,D(Math.hypot(v,f)))}},u=(p,v)=>r.store.change(o,f=>{let g=Me(f,i)?.camera;g&&(g.angle=p.angle,g.range=p.range)},{transient:v});return r.store.select({kind:"camera",id:i}),{cursor:"crosshair",onMove:p=>{let v=d(p);u(v,!0),r.canvas.tooltip={x:p.plan[0],y:p.plan[1]-Qn(r,14,4,14),text:`${v.angle}° · ${H(v.range,l)}`}},onEnd:p=>{let v=d(p);u(v,!1),r.canvas.tooltip=null,r.canvas.announce(a("{name} aimed at {angle}°, range {range}",{name:s,angle:v.angle,range:H(v.range,l)}))},onCancel:()=>{r.canvas.tooltip=null}}}var sh=S`
  .cam-label,
  .pin-name,
  .pin-val {
    text-anchor: middle;
    paint-order: stroke;
    /* the canvas backdrop (jv-plan-canvas paints the svg with --jv-surface) */
    stroke: var(--jv-surface);
    stroke-linejoin: round;
  }
  .hitarea {
    fill: transparent;
    stroke: none;
  }
`,Xg={id:"cameras",order:Ce.cameras,hits:["camera","cam-aim","*"],styles:S`
    ${sh}
    .cone {
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .cone.indoor {
      fill: var(--jv-danger-soft);
      stroke: var(--jv-danger);
    }
    .cone.outdoor {
      fill: var(--jv-warn-soft);
      stroke: var(--jv-warn);
      stroke-dasharray: 4 3;
    }
    .cone.is-selected,
    .cone.is-glow {
      stroke-width: 2;
    }
    .cam .dot {
      fill: var(--jv-danger);
      stroke: var(--jv-surface);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
    .cam.outdoor .dot {
      fill: var(--jv-warn);
    }
    .cam.is-hover .dot,
    .cam.is-glow .dot {
      stroke: var(--jv-accent);
      stroke-width: 2;
    }
    .cam.is-selected .dot {
      stroke: var(--jv-accent);
      stroke-width: 3;
    }
    .cam.is-focus .dot,
    .cam:focus-visible .dot {
      stroke: var(--jv-focus);
      stroke-width: 3;
    }
    .cam .cam-label {
      fill: var(--jv-text);
      font-weight: var(--jv-font-weight-medium);
    }
    .aim-line {
      stroke: var(--jv-accent);
      stroke-width: 1;
      stroke-dasharray: 3 2;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .cam-aim .knob {
      fill: var(--jv-surface);
      stroke: var(--jv-accent);
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }
    .cam-aim.is-hover .knob {
      fill: var(--jv-accent-soft);
    }
    .cam-aim.is-focus .knob,
    .cam-aim:focus-visible .knob {
      stroke: var(--jv-focus);
      stroke-width: 3;
    }
    .cam-aim {
      cursor: crosshair;
    }
  `,render(r){Aa(r.hover);let i=r.doc.cameras[r.floor]||[];if(!i.length)return m;let e=Ra(r.rooms,r.doc.openings[r.floor]||[]),t=Qn(r,7,2.5,7),n=Qn(r,14,t,18),s=Qn(r,11,3,12),o=ts(),l=r.mode==="pins";return K`${_e(i,d=>d.id,(d,u)=>{let p=le("camera",d.id),v=r.isSelected("camera",d.id),f=d.indoor?"indoor":"outdoor",g=o===d.id?"is-glow":"",y=a("CAM {n}",{n:u+1}),_=d.entity?rt(r.hass,d.entity):a("— camera —"),w=m;if(v&&l){let R=d.angle*Math.PI/180,j=Math.max(5,d.range),C=d.x+j*Math.cos(R),M=d.y+j*Math.sin(R),O=le("cam-aim",d.id);w=K`
            <line class="aim-line" x1=${d.x} y1=${d.y} x2=${C} y2=${M}></line>
            <g data-hit=${O} tabindex="0" role="slider" class="cam-aim ${r.classes(O)}"
               aria-label=${a("Aim {name}",{name:y})} aria-valuemin="0" aria-valuemax="359" aria-valuenow=${Math.round(d.angle)}
               aria-valuetext=${`${Math.round(d.angle)}° · ${H(j,r.units)}`}>
              <circle class="hitarea" cx=${C} cy=${M} r=${n}></circle>
              <circle class="knob" cx=${C} cy=${M} r=${t*.85}></circle>
            </g>
          `}return K`
          <path class="cone ${f} ${v?"is-selected":""} ${g}" d=${Wp(d,e)}></path>
          <g data-hit=${p} tabindex="0" role="button" class="cam ${f} ${r.classes(p)} ${g}"
             aria-label=${`${y}, ${_}, ${d.indoor?a("INDOOR"):a("OUTDOOR")}, ${Math.round(d.angle)}°, ${a("Field of view")} ${d.fov}°, ${a("Range")} ${H(d.range,r.units)}`}>
            <circle class="hitarea" cx=${d.x} cy=${d.y} r=${n}></circle>
            <circle class="dot" cx=${d.x} cy=${d.y} r=${t}></circle>
            <text class="cam-label" x=${d.x} y=${d.y-t-s*.35} font-size=${s} stroke-width=${s*.28}>${y}</text>
          </g>
          ${w}
        `})}`},onTap(r,i){return r.hit?.kind!=="cam-aim"?!1:(i.store.select({kind:"camera",id:r.hit.id}),!0)},onDragStart(r,i){if(i.mode!=="pins"||i.canvas.tool||!r.hit)return null;if(r.hit.kind==="cam-aim")return Yg(i,r.hit.id);if(r.hit.kind!=="camera")return null;let e=r.hit.id,t=Me(i.doc,e);return t?(i.store.select({kind:"camera",id:e}),ih(i,[t.camera.x,t.camera.y],li(i.doc,t.floor,e),(n,s)=>{let o=Me(n,e)?.camera;o&&(o.x=s[0],o.y=s[1])})):null},onContextMenu(r,i){if(i.mode!=="pins"||i.canvas.tool)return!1;let e=i.store,t=r.hit;if(!t)return qt({at:r.client,label:a("Plan"),items:[{label:a("Add camera here"),icon:"mdi:cctv",run:()=>{nh(e,r.plan)}}]}),!0;if(t.kind!=="camera"&&t.kind!=="cam-aim")return!1;let n=t.id,s=Me(i.doc,n);return s?(e.select({kind:"camera",id:n}),qt({at:r.client,label:li(i.doc,s.floor,n),items:[{label:a("Toggle indoor/outdoor"),icon:"mdi:home-switch-outline",run:()=>Gg(e,n)},{label:a("Delete"),icon:"mdi:delete-outline",danger:!0,run:()=>Vl(e,n)}]}),!0):!1},onKey(r,i){let e=i.focus;if(!e||e.kind!=="cam-aim"||r.ctrlKey||r.metaKey||r.altKey)return!1;let t=r.shiftKey?15:5,n=r.key==="ArrowRight"||r.key==="ArrowDown"?t:r.key==="ArrowLeft"||r.key==="ArrowUp"?-t:0;if(!n)return!1;let s=Me(i.doc,e.id);if(!s)return!1;let o=li(i.doc,s.floor,e.id),l=oi(s.camera.angle+n);return i.store.change(a("Aim {name}",{name:o}),d=>{let u=Me(d,e.id)?.camera;u&&(u.angle=l)},{coalesce:`aim:${e.id}`}),i.canvas.announce(`${l}°`),!0}};Ut(Xg);var Zg={id:"pins",order:Ce.pins,hits:["pin"],styles:S`
    ${sh}
    .pin .dot {
      fill: var(--jv-neutral);
      stroke: var(--jv-surface);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
    .pin.lvl-ok .dot {
      fill: var(--jv-ok);
    }
    .pin.lvl-warn .dot {
      fill: var(--jv-warn);
    }
    .pin.lvl-danger .dot {
      fill: var(--jv-danger);
    }
    .pin.lvl-info .dot {
      fill: var(--jv-info);
    }
    .pin.lvl-accent .dot {
      fill: var(--jv-accent);
    }
    .pin .pin-name {
      fill: var(--jv-text);
      font-weight: var(--jv-font-weight-medium);
    }
    .pin .pin-val {
      fill: var(--jv-text-2);
    }
    .pin.lvl-ok .pin-val {
      fill: var(--jv-ok-text);
    }
    .pin.lvl-warn .pin-val {
      fill: var(--jv-warn-text);
    }
    .pin.lvl-danger .pin-val {
      fill: var(--jv-danger-text);
    }
    .pin.lvl-info .pin-val {
      fill: var(--jv-info-text);
    }
    .pin.is-hover .dot,
    .pin.is-glow .dot {
      stroke: var(--jv-accent);
      stroke-width: 2;
    }
    .pin.is-selected .dot {
      stroke: var(--jv-accent);
      stroke-width: 3;
    }
    .pin.is-focus .dot,
    .pin:focus-visible .dot {
      stroke: var(--jv-focus);
      stroke-width: 3;
    }
  `,render(r){let i=r.doc.pins[r.floor]||[];if(!i.length)return m;let e=Qn(r,6,2,6),t=Qn(r,14,e,18),n=Qn(r,10,2.5,10),s=ts();return K`${_e(i,o=>o.e,o=>{let l=_l(r.hass,o.e),d=th.has(l.level)?l.level:"neutral",u=a(l.value),p=le("pin",o.e);return K`
          <g data-hit=${p} tabindex="0" role="button" class="pin lvl-${d} ${r.classes(p)} ${s===o.e?"is-glow":""}"
             aria-label=${`${l.name}, ${u}`}>
            <circle class="hitarea" cx=${o.x} cy=${o.y} r=${t}></circle>
            <circle class="dot" cx=${o.x} cy=${o.y} r=${e}></circle>
            <text class="pin-name" x=${o.x} y=${o.y-e-n*.35} font-size=${n} stroke-width=${n*.28}>${Wg(l.name,16)}</text>
            <text class="pin-val" x=${o.x} y=${o.y+e+n*.95} font-size=${n*.9} stroke-width=${n*.25}>${u}</text>
          </g>
        `})}`},onTap(r,i){return r.hit?.kind!=="pin"||!i.isSelected("pin",r.hit.id)?!1:(Fa(i.canvas,r.hit.id),!0)},onDragStart(r,i){if(i.mode!=="pins"||i.canvas.tool||r.hit?.kind!=="pin")return null;let e=r.hit.id,t=i.floor,n=Mn(i.doc,e,t);return n?(i.store.select({kind:"pin",id:e}),ih(i,[n.pin.x,n.pin.y],rt(i.hass,e),(s,o)=>{let l=Mn(s,e,t)?.pin;l&&(l.x=o[0],l.y=o[1])})):null},onContextMenu(r,i){if(i.mode!=="pins"||i.canvas.tool||r.hit?.kind!=="pin")return!1;let e=r.hit.id,t=i.store,n=i.floor,s=i.canvas;return t.select({kind:"pin",id:e}),qt({at:r.client,label:rt(i.hass,e),items:[{label:a("Open controls"),icon:"mdi:open-in-new",run:()=>Fa(s,e)},{label:a("Remove"),icon:"mdi:close",danger:!0,run:()=>rh(t,e,n)}]}),!0},onKey(r,i){let e=i.focus;return r.key!=="Enter"||!e||e.kind!=="pin"||!i.isSelected("pin",e.id)?!1:(Fa(i.canvas,e.id),!0)}};Ut(Zg);var Qg=0,Jg=6e4,vn=class extends Ge{constructor(){super(...arguments);this._busy=null;this._covErr={};this._pinPick="";this._pinErr="";this._thumbs={};this._uid=`jep${++Qg}`;this._thumbAt=new Map;this._thumbFail=new Set;this._unsubHover=null;this._lastSel=null}connectedCallback(){super.connectedCallback(),P(this,[...ii,"jv-picker"]),this._unsubHover=Ca(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),this._unsubHover?.(),this._unsubHover=null,Ye(null,this.store)}updated(){this._ensureThumbs();let e=this.store?.selection,t=e&&(e.kind==="camera"||e.kind==="pin")?`${e.kind}:${e.id}`:null;t&&t!==this._lastSel&&Ta(this,this.renderRoot.querySelector(`[data-key="${Ma(t)}"]`),this.canvas),this._lastSel=t}_ensureThumbs(){let e=this.hass,t=this.store;if(!e||!t)return;let n=Date.now();for(let s of t.cameras()){let o=s.entity;!o||!o.startsWith("camera.")||!yl(e,o)||this._thumbFail.has(o)||n-(this._thumbAt.get(o)??0)<Jg||(this._thumbAt.set(o,n),Tt(e,`/api/camera_proxy/${o}`).then(l=>{/[?&]authSig=/.test(l)&&this._thumbs[o]!==l&&(this._thumbs={...this._thumbs,[o]:l})}))}}_edit(e,t,n,s=!1){this.store?.change(t,o=>{let l=Me(o,e)?.camera;l&&n(l)},{transient:s})}async _compute(e){let t=this.store;if(!t||this._busy||!e.length)return;let n=this.floor,s={...this._covErr};for(let l of e)delete s[l];this._covErr=s;let o=0;try{for(let l=0;l<e.length;l++){let d=e[l];this._busy={i:l+1,n:e.length};let u=Me(t.doc,d)?.camera;if(u)try{let p=await X(this.hass??t.hass,Gl,{camera:Gp(t.doc,n,u)}),v=Vg(p);if(!v)throw new Y(Gl,"invalid_response",a("Unexpected response from Home Assistant"));t.change(a("Compute coverage"),f=>{let g=Me(f,d)?.camera;g&&(g.coverage=v)}),o++}catch(p){this._covErr={...this._covErr,[d]:Y.from(Gl,p).message}}}}finally{this._busy=null}o&&t.toast(a("Coverage computed — Save to keep it"))}_addPin(){let e=this.store;if(!e)return;let t=this._pinPick.trim();if(!t)return;let n=this.floor;if(!yl(this.hass,t)){this._pinErr=a('"{id}" is not a known entity id',{id:t});return}if(Mn(e.doc,t,n)){this._pinErr=a("Already placed on this floor");return}let[s,o]=Wl(Bt(e.rooms(n))),l=e.pins(n).length,d=l?D(s+10*Math.cos(l*.9)):s,u=l?D(o+10*Math.sin(l*.9)):o,p=rt(this.hass,t);e.change(a("Add {name}",{name:p}),v=>{let f={e:t,x:d,y:u,extra:{}};pn(v.pins,n).push(f)}),e.select({kind:"pin",id:t}),this._pinPick="",this._pinErr="",this.canvas?.announce(a("Added {name} — drag to position, then Save",{name:p}))}render(){let e=this.store;return e?c`${this._renderCameras(e)} ${this._renderPins(e)}`:m}_renderCameras(e){let t=this.floor,n=e.cameras(t),s=e.rooms(t),o=Ra(s,e.openings(t)),l=new Set(s.filter(v=>v.type==="outdoor").map(v=>v.name)),d=this._busy,u=ns(),p=`${this._uid}-cams`;return c`
      <section aria-labelledby=${p}>
        <h3 class="sec-title" id=${p}>${a("Cameras")}</h3>
        <div class="toolbar">
          <button type="button" class="jv-btn" @click=${()=>nh(e)}>+ ${a("Camera")}</button>
          <button type="button" class="jv-btn" ?disabled=${!n.length||!!d} aria-busy=${d?"true":"false"} @click=${()=>{this._compute(n.map(v=>v.id))}}>
            ${d?a("Computing… {i}/{n}",{i:d.i,n:d.n}):a("Compute coverage for this floor")}
          </button>
        </div>
        <p class="hint">${a("indoor = bounded by walls, outdoor = by range")}</p>
        ${n.length?c`<ul class="rows" aria-label=${a("Cameras")}>
              ${_e(n,v=>v.id,(v,f)=>this._cameraRow(e,v,f,Ol(s,v,o),l,u===le("camera",v.id)||u===le("cam-aim",v.id)))}
            </ul>`:c`<jv-empty class="empty" compact icon="mdi:cctv" .message=${a("No cameras placed on this floor yet — add one above.")}></jv-empty>`}
      </section>
    `}_seesLine(e,t){let n=Object.entries(e).sort((s,o)=>o[1]-s[1]);return n.length?c`<p class="sees">
      ${a("sees:")}
      ${n.map(([s,o],l)=>c`${l?" · ":" "}${o>=zp?c`<span class="full">${s} ${Math.round(o*100)}%</span>`:c`${s} ${Math.round(o*100)}%`}${t.has(s)?c`<span class="zone">${a("zone")}</span>`:m}`)}
    </p>`:c`<p class="sees">${a("nothing in view — aim it, widen the FOV, or extend the range")}</p>`}_aiLine(e){let t=e.coverage;if(!t)return m;let n=Xp(t.ts,this.hass),s=t.source==="geometry"?`${a("(geometry)")} `:"";return c`<p class="ai">
      <span class="ok" aria-hidden="true">✓</span>
      ${s}${t.covered.length?a("confirms {rooms}",{rooms:t.covered.join(", ")}):""}${t.covered.length&&t.reason?" — ":""}${t.reason}
      ${n?c`<span class="jv-muted xs"> · ${n}</span>`:m}
    </p>`}_cameraRow(e,t,n,s,o,l){let d=this.units,u=t.id,p=`${this._uid}-${u}`,v=a("CAM {n}",{n:n+1}),f=e.selection?.kind==="camera"&&e.selection.id===u,g=t.entity?rt(this.hass,t.entity):a("— camera —"),y=t.entity?this._thumbs[t.entity]:void 0,_=this._covErr[u],w=!!this._busy,R=()=>Ye(u,e),j=()=>Ye(null,e),C=`${a("Aim")} ${Math.round(t.angle)}° · ${a("Field of view")} ${t.fov}° · ${a("Range")} ${H(t.range,d)}`;return c`
      <li class="row ${f?"is-selected":""} ${l?"is-glow":""}" data-key=${`camera:${u}`} @pointerenter=${R} @pointerleave=${j} @focusin=${R} @focusout=${j}>
        <div class="row-head">
          <button type="button" class="tag jv-hit" aria-pressed=${String(f)} aria-expanded=${String(f)} aria-controls=${`${p}-form`} @click=${()=>e.select(f?null:{kind:"camera",id:u})}>
            ${v}
          </button>
          <span class="grow who">
            <span class="jv-truncate">${g}</span>
            <span class="jv-muted xs">${C}</span>
          </span>
          <button type="button" class="jv-icon-btn" aria-label=${a("Remove {name}",{name:v})} title=${a("Remove")} @click=${()=>Vl(e,u)}>${Zn("mdi:close","×")}</button>
        </div>
        <div class="row-body">
          ${y?c`<img
                class="thumb"
                src=${y}
                alt=${g}
                loading="lazy"
                @error=${()=>{t.entity&&this._thumbFail.add(t.entity);let M={...this._thumbs};delete M[t.entity],this._thumbs=M}}
              />`:m}
          <div class="lines">
            ${this._seesLine(s,o)} ${this._aiLine(t)}
            ${_?c`<p class="err" role="alert">${a("Coverage failed — {message}",{message:_})}</p>`:m}
          </div>
        </div>
        ${f?this._cameraForm(e,t,v,p,w):m}
      </li>
    `}_cameraForm(e,t,n,s,o){let l=this.units,d=t.id,u=a("Edit {name}",{name:n}),p=a("Aim {name}",{name:n}),v=[{value:"",label:a("— camera —")},...mp(this.hass,t.entity).map(f=>({value:f,label:rt(this.hass,f)}))];return c`
      <div class="row-fields" id=${`${s}-form`}>
        <div class="wide">
          ${Ar({id:`${s}-ent`,label:a("Camera"),value:t.entity,options:v,onChange:f=>this._edit(d,u,g=>{g.entity=f})})}
        </div>
        <div class="wide aim">
          ${Ji({id:`${s}-aim`,label:a("Aim"),value:Math.round(t.angle),min:0,max:359,step:1,display:`${Math.round(t.angle)}°`,onInput:f=>this._edit(d,p,g=>{g.angle=oi(f)},!0),onChange:f=>this._edit(d,p,g=>{g.angle=oi(f)})})}
          ${Qi({id:`${s}-aimn`,label:a("Aim"),value:String(Math.round(t.angle)),min:0,max:359,step:1,suffix:"°",onChange:f=>{let g=Number(f);if(f.trim()===""||!Number.isFinite(g)){this.requestUpdate();return}this._edit(d,p,y=>{y.angle=oi(g)})}})}
        </div>
        <div class="wide">
          ${Ji({id:`${s}-fov`,label:a("Field of view"),value:t.fov,min:20,max:170,step:5,display:`${t.fov}°`,onInput:f=>this._edit(d,u,g=>{g.fov=It(Math.round(f/5)*5,20,170)},!0),onChange:f=>this._edit(d,u,g=>{g.fov=It(Math.round(f/5)*5,20,170)})})}
        </div>
        ${Qi({id:`${s}-rng`,label:a("Range"),value:String(zt(t.range,l)),min:1,step:1,suffix:Pe(l),onChange:f=>this._edit(d,u,g=>{let y=Number(f);g.range=Number.isFinite(y)&&y>0?Math.max(5,wr(y,l,5)):50})})}
        <div class="env">
          <div class="seg" role="group" aria-label=${a("indoor = bounded by walls, outdoor = by range")}>
            <button type="button" class="pill jv-hit" aria-pressed=${String(t.indoor)} @click=${()=>!t.indoor&&this._edit(d,u,f=>{f.indoor=!0})}>${a("INDOOR")}</button>
            <button type="button" class="pill jv-hit" aria-pressed=${String(!t.indoor)} @click=${()=>t.indoor&&this._edit(d,u,f=>{f.indoor=!1})}>${a("OUTDOOR")}</button>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${o} @click=${()=>{this._compute([d])}}>
            ${this._busy&&this._busy.n===1?a("Computing… {i}/{n}",{i:1,n:1}):a("Compute coverage")}
          </button>
          <button type="button" class="jv-btn danger" @click=${()=>Vl(e,d)}>${a("Delete")}</button>
        </div>
      </div>
    `}_renderPins(e){let t=this.floor,n=e.pins(t),s=ns(),o=`${this._uid}-pins`,l=`${this._uid}-pinerr`;return c`
      <section aria-labelledby=${o}>
        <h3 class="sec-title" id=${o}>${a("Devices on plan")}</h3>
        <div class="add-pin">
          <jv-picker
            kind="entity"
            allow-custom
            .hass=${this.hass}
            .data=${e.data}
            .label=${a("Devices on plan")}
            .placeholder=${a("type to find an entity…")}
            .value=${this._pinPick}
            aria-describedby=${this._pinErr?l:m}
            @value-changed=${d=>{d.stopPropagation();let u=d.detail?.value;this._pinPick=typeof u=="string"?u:"",this._pinErr=""}}
          ></jv-picker>
          <button type="button" class="jv-btn primary" ?disabled=${!this._pinPick.trim()} @click=${()=>this._addPin()}>+ ${a("Add")}</button>
        </div>
        ${this._pinErr?c`<p class="err" id=${l} role="alert">${this._pinErr}</p>`:m}
        <p class="hint">${a("add a device, then drag its pin on the plan · tap a pin to open its controls")}</p>
        ${n.length?c`<ul class="chips" aria-label=${a("Devices on plan")}>
              ${_e(n,d=>d.e,d=>this._pinChip(e,d,t,s===le("pin",d.e)))}
            </ul>`:c`<jv-empty class="empty" compact icon="mdi:map-marker-outline" .message=${a("No devices placed on this floor yet.")}></jv-empty>`}
      </section>
    `}_pinChip(e,t,n,s){let o=_l(this.hass,t.e),l=th.has(o.level)?o.level:"neutral",d=e.selection?.kind==="pin"&&e.selection.id===t.e,u=()=>Ye(t.e,e),p=()=>Ye(null,e);return c`
      <li class="chip ${d?"is-selected":""} ${s?"is-glow":""}" data-key=${`pin:${t.e}`} @pointerenter=${u} @pointerleave=${p} @focusin=${u} @focusout=${p}>
        <button type="button" class="chip-main" aria-pressed=${String(d)} @click=${()=>e.select(d?null:{kind:"pin",id:t.e})}>
          <span class="who">
            <span class="jv-truncate">${o.name}</span>
            ${d&&o.name!==t.e?c`<span class="jv-mono jv-muted xs jv-truncate">${t.e}</span>`:m}
          </span>
          <jv-state-badge level=${l} .label=${a(o.value)}></jv-state-badge>
        </button>
        <button type="button" class="jv-icon-btn" aria-label=${a("Open controls")} title=${a("Open controls")} @click=${()=>Fa(this,t.e)}>${Zn("mdi:open-in-new","↗")}</button>
        <button type="button" class="jv-icon-btn" aria-label=${a("Remove {name}",{name:o.name})} title=${a("Remove")} @click=${()=>rh(e,t.e,n)}>${Zn("mdi:close","×")}</button>
      </li>
    `}};vn.styles=[T,si,S`
      section + section {
        margin-top: var(--jv-space-5);
      }
      .sec-title {
        margin: 0 0 var(--jv-space-2);
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
      }
      .row-head .who {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .xs {
        font-size: var(--jv-font-size-xs);
      }
      .row-body {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2) var(--jv-space-3);
        align-items: flex-start;
        margin-top: var(--jv-space-2);
      }
      .row-body .lines {
        flex: 1 1 160px;
        min-width: 0;
      }
      .thumb {
        flex: none;
        width: 96px;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: var(--jv-radius-sm);
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-bg-2);
      }
      .sees,
      .ai {
        margin: 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .ai {
        margin-top: var(--jv-space-1);
        color: var(--jv-text);
      }
      .sees .full {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-bold);
      }
      .sees .zone {
        display: inline-block;
        margin-left: var(--jv-space-1);
        padding: 0 var(--jv-space-1);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-ok-soft);
        color: var(--jv-ok-text);
        font-size: var(--jv-font-size-xs);
      }
      .ai .ok {
        color: var(--jv-ok-text);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        grid-column: 1 / -1;
      }
      .env {
        display: flex;
        align-items: flex-end;
        min-width: 0;
      }
      .env .seg {
        flex-wrap: wrap;
        min-width: 0;
      }
      .env .pill {
        padding: 0 var(--jv-space-2);
      }
      .aim {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 96px;
        gap: var(--jv-space-2);
        align-items: end;
      }
      /* the numeric twin of the Aim slider: its label stays for screen readers only */
      .aim > label.field:last-child > .lbl {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .add-pin {
        display: flex;
        gap: var(--jv-space-2);
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .add-pin jv-picker {
        flex: 1 1 200px;
        min-width: 0;
      }
      .add-pin .jv-btn {
        flex: none;
      }
      .chips {
        list-style: none;
        margin: var(--jv-space-3) 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .chip {
        display: flex;
        align-items: center;
        gap: var(--jv-space-1);
        min-width: 0;
        padding-left: var(--jv-space-1);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        transition: border-color var(--jv-ease), background-color var(--jv-ease);
      }
      .chip.is-glow {
        background: var(--jv-hover);
      }
      .chip.is-selected {
        border-color: var(--jv-accent);
        box-shadow: inset 2px 0 0 var(--jv-accent);
      }
      .chip-main {
        appearance: none;
        flex: 1 1 auto;
        min-width: 0;
        min-height: var(--jv-tap);
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        padding: 0 var(--jv-space-2);
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
        border-radius: var(--jv-radius-sm);
      }
      .chip-main:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
        outline: none;
      }
      .chip-main .who {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .chip .jv-icon-btn {
        width: var(--jv-tap);
        height: var(--jv-tap);
      }
      jv-state-badge {
        flex: none;
      }
    `],h([b()],vn.prototype,"_busy",2),h([b()],vn.prototype,"_covErr",2),h([b()],vn.prototype,"_pinPick",2),h([b()],vn.prototype,"_pinErr",2),h([b()],vn.prototype,"_thumbs",2),vn=h([A("jarvis-editor-pins")],vn);var mn=class extends Error{constructor(i,e){super(e),this.name="ImageImportError",this.code=i}};function Cr(r){let i=r.indexOf(","),e=i>=0?r.slice(i+1):r;return Math.floor(e.length*3/4)}function ah(r){return new Promise((i,e)=>{let t=new Image;t.onload=()=>i(t),t.onerror=()=>e(new mn("unreadable","the browser could not decode this image")),t.src=r})}function eb(r){return new Promise((i,e)=>{let t=new FileReader;t.onload=()=>i(String(t.result||"")),t.onerror=()=>e(new mn("unreadable",t.error?.message||"the file could not be read")),t.readAsDataURL(r)})}function tb(r,i,e){try{let t=r.getImageData(0,0,i,e).data;for(let n=3;n<t.length;n+=28)if(t[n]<250)return!0;return!1}catch{return!1}}var nb=[{scale:1,q:.7},{scale:.8,q:.7},{scale:.65,q:.6},{scale:.5,q:.6}];async function oh(r,i=1572864){let e=Math.min(1572864,i);if(r.type&&!r.type.startsWith("image/"))throw new mn("unreadable","not an image file");let t=await eb(r),n=await ah(t),s=n.naturalWidth||n.width,o=n.naturalHeight||n.height;if(!s||!o)throw new mn("unreadable","the image has no size");let l=Math.min(1,1600/Math.max(s,o)),d=document.createElement("canvas"),u=d.getContext("2d");if(!u){if(Cr(t)>e)throw new mn("too_large","image too large");return{url:t,width:s,height:o,bytes:Cr(t)}}let p=1,v=1,f=R=>{p=Math.max(1,Math.round(s*l*R)),v=Math.max(1,Math.round(o*l*R)),d.width=p,d.height=v,u.drawImage(n,0,0,p,v)};f(1);let g=tb(u,p,v),y=/png|gif|webp|svg/i.test(r.type)||g,_=d.toDataURL(y?"image/png":"image/jpeg",y?void 0:.85);y&&Cr(_)>e&&!g&&(_=d.toDataURL("image/jpeg",.85));for(let R of nb){if(Cr(_)<=e)break;g&&R.scale===1||(f(R.scale),_=g?d.toDataURL("image/png"):d.toDataURL("image/jpeg",R.q))}let w=Cr(_);if(!_.startsWith("data:image/")||w>e)throw new mn("too_large","image too large after compression");return{url:_,width:p,height:v,bytes:w}}var Oa=new Map,Yl=new Map;function ci(r){return Oa.get(lh(r))}function lh(r){return r.length>256?`${r.length}:${r.slice(0,96)}:${r.slice(-96)}`:r}function Na(r,i=r){let e=lh(r);if(Oa.has(e))return Promise.resolve();let t=Yl.get(e);return t||(t=ah(i).then(n=>{let s=n.naturalWidth||n.width,o=n.naturalHeight||n.height;Oa.set(e,s&&o?{w:s,h:o}:null)}).catch(()=>{Oa.set(e,null)}).finally(()=>{Yl.delete(e)}),Yl.set(e,t)),t}var jt=class extends Error{constructor(i,e){super(e),this.name="ZipError",this.code=i}},rb=101010256,ib=33639248,sb=67324752;function Xl(r){return r.length>=4&&r[0]===80&&r[1]===75}function ch(){return typeof globalThis.DecompressionStream=="function"}function dh(r){return new DataView(r.buffer,r.byteOffset,r.byteLength)}function uh(r){if(!Xl(r)||r.length<22)throw new jt("not_zip","not a ZIP archive");let i=dh(r),e=-1;for(let l=r.length-22;l>=Math.max(0,r.length-22-65535);l--)if(i.getUint32(l,!0)===rb){e=l;break}if(e<0)throw new jt("not_zip","no end of central directory");let t=i.getUint16(e+10,!0),n=i.getUint32(e+16,!0);if(t===65535||n===4294967295)throw new jt("unsupported","ZIP64 archives are not supported");let s=new TextDecoder("utf-8"),o=[];for(let l=0;l<t;l++){if(n+46>r.length||i.getUint32(n,!0)!==ib)throw new jt("not_zip","corrupt central directory");let d=i.getUint16(n+8,!0),u=i.getUint16(n+10,!0),p=i.getUint32(n+20,!0),v=i.getUint32(n+24,!0),f=i.getUint16(n+28,!0),g=i.getUint16(n+30,!0),y=i.getUint16(n+32,!0),_=i.getUint32(n+42,!0),w=s.decode(r.subarray(n+46,n+46+f));o.push({name:w,method:u,flags:d,compressedSize:p,size:v,localOffset:_}),n+=46+f+g+y}return o}async function ab(r){let i=globalThis.DecompressionStream;if(!i)throw new jt("no_inflate","DecompressionStream is not available");let e=new Uint8Array(r.byteLength);e.set(r);let t=new Blob([e]).stream().pipeThrough(new i("deflate-raw")),n=await new Response(t).arrayBuffer();return new Uint8Array(n)}async function ph(r,i){if(i.flags&1)throw new jt("unsupported","encrypted entries are not supported");let e=dh(r),t=i.localOffset;if(t+30>r.length||e.getUint32(t,!0)!==sb)throw new jt("not_zip","corrupt local header");let n=t+30+e.getUint16(t+26,!0)+e.getUint16(t+28,!0),s=r.subarray(n,n+i.compressedSize);if(i.method===0)return s;if(i.method===8)return ab(s);throw new jt("unsupported",`compression method ${i.method} is not supported`)}var it=class extends Error{constructor(i,e){super(e),this.name="Sh3dError",this.code=i}},Ia=1/6.096,ob=.05;function hh(r){let i=0;for(;i<r.length&&i<64&&(r[i]===32||r[i]===9||r[i]===10||r[i]===13||r[i]===239||r[i]===187||r[i]===191);)i++;if(r[i]!==60)return!1;let e=new TextDecoder("utf-8").decode(r.subarray(i,Math.min(r.length,i+256))).toLowerCase();return e.startsWith("<?xml")||e.includes("<home")}function vh(r){let i;try{i=new DOMParser().parseFromString(r,"application/xml")}catch(o){throw new it("unreadable",o instanceof Error?o.message:String(o))}if(i.getElementsByTagName("parsererror").length)throw new it("unreadable","the XML is not well-formed");let e=[],t=i.getElementsByTagName("level");for(let o=0;o<t.length;o++){let l=t[o],d=l.getAttribute("id")||l.getAttribute("name")||String(e.length);e.push({id:d,name:l.getAttribute("name")||d})}let n=[],s=i.getElementsByTagName("room");for(let o=0;o<s.length;o++){let l=s[o],d=[];for(let u of Array.from(l.children)){if(u.tagName!=="point")continue;let p=Number(u.getAttribute("x")),v=Number(u.getAttribute("y"));u.getAttribute("x")==null||u.getAttribute("y")==null||!Number.isFinite(p)||!Number.isFinite(v)||d.push([p,v])}n.push({name:l.getAttribute("name")||"",level:l.getAttribute("level"),points:d})}return{levels:e,rooms:n}}function Zl(r){return r==null?[]:Array.isArray(r)?r:[r]}function lb(r){let i=r.points??r.sPoints??r.point,e=[];for(let t of Zl(i)){let n=re(t),s=n?Number(n.x):Array.isArray(t)?Number(t[0]):NaN,o=n?Number(n.y):Array.isArray(t)?Number(t[1]):NaN;Number.isFinite(s)&&Number.isFinite(o)&&e.push([s,o])}return e}function cb(r){let i;try{i=JSON.parse(r.replace(/^﻿/,""))}catch(o){throw new it("unreadable",o instanceof Error?o.message:String(o))}let e=re(i);if(!e)throw new it("unreadable","expected a JSON object at the top level");let t=re(e.home)??e,n=[];Zl(t.level).forEach((o,l)=>{let d=re(o);if(!d)return;let u=String(d.id??l);n.push({id:u,name:String(d.name??"").trim()||u})});let s=[];for(let o of Zl(t.room??t.rooms)){let l=re(o);l&&s.push({name:String(l.name??""),level:l.level==null?null:String(l.level),points:lb(l)})}return{levels:n,rooms:s}}async function mh(r){if(Xl(r)){if(!ch())throw new it("no_inflate","DecompressionStream is not available");let i;try{i=uh(r)}catch(n){throw new it("unreadable",n instanceof Error?n.message:String(n))}let e=[...i.filter(n=>n.name==="Home"),...i.filter(n=>n.name.toLowerCase().endsWith(".xml")),...i],t=new Set;for(let n of e){if(t.has(n.name)||(t.add(n.name),n.name.endsWith("/")||n.size>64*1024*1024))continue;let s;try{s=await ph(r,n)}catch(o){if(o instanceof jt&&o.code==="no_inflate")throw new it("no_inflate",o.message);continue}if(hh(s))return vh(new TextDecoder("utf-8").decode(s))}throw new it("legacy_binary","no XML home entry")}return hh(r)?vh(new TextDecoder("utf-8").decode(r)):cb(new TextDecoder("utf-8").decode(r))}function fh(r){let i={"":"1f"},e=["1f","2f"],t=0;for(let n of r.levels)/base|cellar|sous|keller|bsmt/i.test(n.name)?i[n.id]="bsmt":i[n.id]=e[t++]??"";return i}function gh(r){let i=new Set(r.rooms.filter(t=>t.points.length>=3).map(t=>t.level??"")),e=r.levels.filter(t=>i.has(t.id));return(i.has("")||[...i].some(t=>t&&!r.levels.some(n=>n.id===t)))&&e.push({id:"",name:""}),e}function db(r,i=ob){if(r.length!==4)return!1;let e=pe(r),t=[[e.x0,e.y0],[e.x1,e.y0],[e.x1,e.y1],[e.x0,e.y1]];for(let n of r){let s=t.findIndex(o=>Math.abs(o[0]-n[0])<=i&&Math.abs(o[1]-n[1])<=i);if(s<0)return!1;t.splice(s,1)}return!0}function bh(r,i){let e=Number.isFinite(i.scale)&&i.scale>0?i.scale:Ia,t=[],n=0;for(let d of r.rooms){if(d.points.length<3)continue;n+=1;let u=d.level!=null&&r.levels.some(v=>v.id===d.level)?d.level:"",p=i.floors[u]??(u?"":"1f");p&&t.push({floor:p,name:d.name.trim()||`Room ${n}`,rect:db(d.points),pts:d.points.map(v=>[v[0]*e,v[1]*e])})}let s=()=>t.flatMap(d=>d.pts);if(i.mirror!=="none"&&t.length){let d=pe(s()),u=(d.x0+d.x1)/2,p=(d.y0+d.y1)/2;for(let v of t)v.pts=v.pts.map(f=>i.mirror==="x"?[2*u-f[0],f[1]]:[f[0],2*p-f[1]])}let o=(i.rotate%360+360)%360;if(o&&t.length){let d=pe(s()),u=(d.x0+d.x1)/2,p=(d.y0+d.y1)/2,v=f=>{let g=f[0]-u,y=f[1]-p;return o===90?[u-y,p+g]:o===180?[u-g,p-y]:[u+y,p-g]};for(let f of t)f.pts=f.pts.map(v)}if(i.origin&&t.length){let d=pe(s());for(let u of t)u.pts=u.pts.map(p=>[p[0]-d.x0,p[1]-d.y0])}let l={};for(let d of t){let u=d.pts.map(f=>[Z(f[0]),Z(f[1])]),p=pe(u),v={name:d.name,type:"room",x:D(p.x0),y:D(p.y0),w:Math.max(1,D(p.x1-p.x0)),h:Math.max(1,D(p.y1-p.y0))};d.rect||(v.points=u),(l[d.floor]??=[]).push(v)}return l}function Ql(r){return Object.values(r).reduce((i,e)=>i+e.length,0)}var kt="_align";function ub(r){let i=re(r);if(!i)return null;let e=Number(i.x),t=Number(i.y),n=Number(i.w);return Number.isFinite(e)&&Number.isFinite(t)&&Number.isFinite(n)&&n>0?{x:e,y:t,w:n}:null}function ui(r){let i=re(xt(r.floor_plan_bg)),e=re(i?.[kt]),t={};if(!e)return t;for(let n of Object.keys(e)){let s=ub(e[n]);s&&(t[n]=s)}return t}function rc(r,i,e){let t={...r},n={...re(t[kt])??{}};return e?n[i]={x:Z(e.x),y:Z(e.y),w:Z(e.w)}:delete n[i],Object.keys(n).length?t[kt]=n:delete t[kt],t}var yh=new WeakMap;function er(r){let i=yh.get(r);return i||(i={},yh.set(r,i)),i}function Ka(r,i){let e=er(r);i==null?delete e.opacity:e.opacity=i,r.canvas?.requestRender()}var pb=3e4,hb=27e4,Jl=new Map,ec=new Set;function _h(r,i,e){return wh(r,i,e)}function wh(r,i,e){if(!Ri(r))return r;let t=Jl.get(r),n=Date.now();return i&&(!t||n-t.at>=pb)&&!ec.has(r)&&(ec.add(r),Tt(i,r).then(s=>{if(ec.delete(r),!/[?&]authSig=/.test(s))return;let o=Jl.get(r);Jl.set(r,o&&o.url===s?o:{url:s,at:Date.now()}),(!o||o.url!==s)&&e()})),t&&n-t.at<hb?t.url:null}function $h(r){let i=null;for(let e of r)i=ut(i,pe(je(e)));return i??Ki}function vb(r,i){let e=$h(r),t=e.x1-e.x0,n=e.y1-e.y0,s=Math.min(t/i.w,n/i.h),o=i.w*s,l=i.h*s;return{x:e.x0+(t-o)/2,y:e.y0+(n-l)/2,w:o}}function ic(r,i){let e=r.settings.bg[i];if(!e)return null;let t=ci(e);if(!t)return null;let n=xh(r);return n&&n.floor===i?n.value:ui(r.config)[i]??vb(r.rooms(i),t)}function xh(r){let i=er(r).align;return i&&(i.committing||r.canvas?.tool?.id==="bg-align")?i:null}var mb={id:"background",order:Ce.background,hits:[],styles:S`
    .bg-frame {
      fill: none;
      stroke: var(--jv-accent);
      stroke-width: 1.5;
      stroke-dasharray: 6 4;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
  `,render(r){let i=r.store,e=i?.settings.bg[r.floor];if(!e)return m;let t=wh(e,r.hass,()=>r.canvas.requestRender());if(!t)return m;let s=er(i).opacity??i.settings.bgOpacity,o=ci(e);o===void 0&&Na(e,t).then(()=>r.canvas.requestRender());let l=xh(i),d=l&&l.floor===r.floor?l.value:ui(i.config)[r.floor];if(d&&o){let p=d.w*o.h/o.w;return K`<image href=${t} x=${d.x} y=${d.y} width=${d.w} height=${p} opacity=${s} preserveAspectRatio="none" pointer-events="none"></image>`}let u=$h(r.rooms);return K`<image href=${t} x=${u.x0} y=${u.y0} width=${u.x1-u.x0} height=${u.y1-u.y0} opacity=${s} preserveAspectRatio="xMidYMid meet" pointer-events="none"></image>`}},tc=new Set;function Ha(){for(let r of tc)try{r()}catch{}}function jh(r){return tc.add(r),()=>{tc.delete(r)}}function ss(r){return r?.canvas?.tool?.id==="bg-align"}function kh(r){return ss(r)?er(r).align?.value??null:null}function Sh(r,i){let e=r.canvas,t=r.floor,n=r.settings.bg[t],s=n?ci(n):null,o=ic(r,t);if(!e||!n||!s||!o)return!1;let l=er(r);l.align={floor:t,value:{...o}};let d=s.h/s.w,u=g=>{l.align={floor:t,value:{x:Z(g.x),y:Z(g.y),w:Math.max(5,Z(g.w))}},e.requestRender(),Ha()},p=()=>l.align?.value??o,v=()=>r.settings.units,f={id:"bg-align",order:Ce.tool,hits:["*"],render(g){let y=p(),_=y.w*d,w=Math.max(3,11/Math.max(g.pxPerUnit,.01)),R=le("bg-handle","bg");return K`
        <rect class="bg-frame" x=${y.x} y=${y.y} width=${y.w} height=${_}></rect>
        ${Sr(R,y.x+y.w,y.y+_,g.pxPerUnit)}
        <rect class="handle ${g.classes(R)}" data-hit=${R} tabindex="0" role="button" aria-label=${a("Scale the background image")}
              x=${y.x+y.w-w/2} y=${y.y+_-w/2} width=${w} height=${w}></rect>
      `},onTap:()=>!0,onDragStart(g){let y={...p()},_=y.w*d;if(g.hit?.kind==="bg-handle")return{cursor:"nwse-resize",onMove(j){let C=y.w+j.delta[0],M=(_+j.delta[1])/d,O=Math.abs(C-y.w)>=Math.abs(M-y.w)?C:M;u({...y,w:O}),e.tooltip={x:y.x+p().w/2,y:y.y-3,text:`${H(p().w,v())} × ${H(p().w*d,v())}`}},onEnd(){e.tooltip=null},onCancel(){u(y)}};let[w,R]=g.plan;return w<y.x||R<y.y||w>y.x+y.w||R>y.y+_?null:{cursor:"move",onMove(j){let C=j.snap.enabled?j.snap.x(y.x+j.delta[0]):y.x+j.delta[0],M=j.snap.enabled?j.snap.y(y.y+j.delta[1]):y.y+j.delta[1];u({...y,x:C,y:M}),e.tooltip={x:C+y.w/2,y:M-3,text:`${H(C,v())}, ${H(M,v())}`}},onEnd(){e.tooltip=null},onCancel(){u(y)}}},onKey(g){let y=p(),_=g.shiftKey?10:1;switch(g.key){case"ArrowLeft":return u({...y,x:y.x-_}),!0;case"ArrowRight":return u({...y,x:y.x+_}),!0;case"ArrowUp":return u({...y,y:y.y-_}),!0;case"ArrowDown":return u({...y,y:y.y+_}),!0;case"PageUp":return u({...y,w:y.w*(g.shiftKey?1.1:1.01)}),!0;case"PageDown":return u({...y,w:y.w/(g.shiftKey?1.1:1.01)}),!0;case"Enter":return sc(r,i),!0;case"Escape":return as(r),!0;default:return!1}}};return Ba=i,e.setTool(f),e.announce(a("Drag the image to move it, its corner handle to scale it. Arrow keys nudge, Page Up / Page Down scale, Enter finishes, Escape cancels.")),Ha(),!0}var Ba=null;function sc(r,i){let t=er(r).align;t&&(t.committing=!0),r.canvas?.tool?.id==="bg-align"&&r.canvas.setTool(null);let n=i??Ba;Ba=null,t&&n&&n(t.floor,t.value),Ha()}function as(r){r.canvas?.tool?.id==="bg-align"&&r.canvas.setTool(null),Ba=null,delete er(r).align,r.canvas?.requestRender(),Ha()}function Eh(r){delete er(r).align,r.canvas?.requestRender()}var za=new WeakMap,nc=new Set;function Rh(){for(let r of nc)try{r()}catch{}}function Ah(r){return nc.add(r),()=>{nc.delete(r)}}function di(r){return r&&za.get(r)||null}function Ua(r,i){i?za.set(r,i):za.delete(r),r.canvas?.requestRender(),Rh()}function Jn(r,i){let e=za.get(r);e&&(i(e),r.canvas?.requestRender(),Rh())}function ac(r,i){return i.points.map(e=>[Z(e[0]+r.dx),Z(e[1]+r.dy)])}function Ch(r,i,e){let t=pe(e.flatMap(s=>s.points)),n=null;for(let s of r.rooms(i))s.type!=="outdoor"&&(n=ut(n,pe(je(s))));return!t||!n?[0,0]:[D(n.x0-t.x0),D(n.y0-t.y0)]}var fb={id:"import-review",order:Ce.pins+.3,hits:["cand"],styles:S`
    .cand .shape {
      fill: var(--jv-info);
      fill-opacity: 0.12;
      stroke: var(--jv-info);
      stroke-width: 1.5;
      stroke-dasharray: 5 3;
      vector-effect: non-scaling-stroke;
      cursor: move;
    }
    .cand.off .shape {
      fill-opacity: 0.02;
      stroke: var(--jv-text-3);
    }
    .cand.is-hover .shape {
      fill-opacity: 0.2;
    }
    .cand.is-focus .shape,
    .cand:focus-visible .shape {
      stroke: var(--jv-focus);
      stroke-width: 2.5;
    }
    .cand .cand-name {
      fill: var(--jv-info-text);
      text-anchor: middle;
      dominant-baseline: middle;
      font-weight: var(--jv-font-weight-medium);
    }
    .cand.off .cand-name {
      fill: var(--jv-text-2);
      text-decoration: line-through;
    }
  `,render(r){let i=di(r.store);return!i||r.mode!=="import"||i.floor!==r.floor?m:K`${i.candidates.map(e=>{let t=ac(i,e),n=pe(t),s=le("cand",e.key),o=n.x1-n.x0,l=o>80?6:o>40?4.5:3;return K`
        <g data-hit=${s} tabindex="0" role="button" class="cand ${e.checked?"":"off"} ${r.classes(s)}"
           aria-pressed=${String(e.checked)} aria-label=${a("Detected room {name}",{name:e.name})}>
          <path class="shape" d=${jr(t)}></path>
          <text class="cand-name" x=${(n.x0+n.x1)/2} y=${(n.y0+n.y1)/2} font-size=${l}>${e.name}</text>
        </g>`})}`},onTap(r,i){if(r.hit?.kind!=="cand"||i.mode!=="import")return!1;let e=r.hit.id;return Jn(i.store,t=>{let n=t.candidates.find(s=>s.key===e);n&&(n.checked=!n.checked)}),!0},onDragStart(r,i){let e=di(i.store);if(!e||r.hit?.kind!=="cand"||i.mode!=="import")return null;let t=pe(e.candidates.flatMap(l=>l.points));if(!t)return null;let n=[e.dx,e.dy],s=i.units,o=l=>{let d=t.x0+n[0]+l.delta[0],u=t.y0+n[1]+l.delta[1],p=l.snap.enabled?l.snap.x(d):Z(d),v=l.snap.enabled?l.snap.y(u):Z(u);Jn(i.store,f=>{f.dx=Z(p-t.x0),f.dy=Z(v-t.y0)}),i.canvas.tooltip={x:p+(t.x1-t.x0)/2,y:v-3,text:`${H(p,s)}, ${H(v,s)}`}};return{cursor:"move",onMove:o,onEnd(l){o(l),i.canvas.tooltip=null,i.canvas.announce(a("Detected layout moved"))},onCancel(){Jn(i.store,l=>{l.dx=n[0],l.dy=n[1]}),i.canvas.tooltip=null}}},onKey(r,i){let e=i.focus;if(!e||e.kind!=="cand"||i.mode!=="import"||r.ctrlKey||r.metaKey||r.altKey)return!1;let t=r.shiftKey?10:1,n=(s,o)=>(Jn(i.store,l=>{l.dx=Z(l.dx+s),l.dy=Z(l.dy+o)}),!0);switch(r.key){case"ArrowLeft":return n(-t,0);case"ArrowRight":return n(t,0);case"ArrowUp":return n(0,-t);case"ArrowDown":return n(0,t);case"Enter":case" ":return Jn(i.store,s=>{let o=s.candidates.find(l=>l.key===e.id);o&&(o.checked=!o.checked)}),!0;default:return!1}}};Ut(mb);Ut(fb);var Mh="jarvis-floor-plan.json",Dn=class extends Error{constructor(i){super(i),this.name="PlanFileError",this.reason=i}};function pi(r){let i=re(xt(r.floor_plan_bg));return i?{...i}:{}}function Ph(r){return typeof r=="string"&&/^data:image\/[a-z0-9.+-]+[;,]/i.test(r)&&Cr(r)<=1572864}function Lh(r,i){let e={},t=0;for(let[o,l]of Object.entries(r))o!==kt&&(i.has(o)&&Ph(l)?e[o]=l:t+=1);let n={},s=ui({floor_plan_bg:{[kt]:r[kt]}});for(let o of Object.keys(e))s[o]&&(n[o]=s[o]);return{images:e,align:n,skipped:t}}function Dh(r,i){let e=ei(r.doc),t={jarvis_floor_plan:1};for(let n of un)t[n]=e[n];return t.floor_plan_units=r.settings.units,t.door_mapping={...r.settings.doorMapping},i&&(t.floor_plan_bg=pi(r.config)),t}function Fh(r,i,e="application/json"){let t=new Blob([i],{type:e}),n=URL.createObjectURL(t),s=document.createElement("a");s.href=n,s.download=r,s.rel="noopener",s.style.display="none",document.body.appendChild(s);try{s.click()}finally{s.remove(),setTimeout(()=>URL.revokeObjectURL(n),1e3)}}function Th(r){if(Array.isArray(r))return!0;let i=re(r);return!!i&&Array.isArray(i.rooms)}function oc(r){let i=re(xt(r));if(!i)return 0;let e=0;for(let t of Object.values(i))if(Array.isArray(t))e+=t.length;else{let n=re(t);n&&Array.isArray(n.rooms)&&(e+=n.rooms.length)}return e}var qa="expected a JARVIS floor plan";function Oh(r){let i;try{i=JSON.parse(r.replace(/^﻿/,""))}catch(n){throw new Dn(n instanceof Error?n.message:String(n))}let e=re(i);if(!e)throw new Dn(qa);if("jarvis_floor_plan"in e){let n={};for(let l of un){if(!(l in e))continue;let d=xt(e[l]);d!=null&&(l==="floor_plan_rooms"&&!(re(d)&&Object.keys(d).length)||(n[l]=d))}let s={kind:"bundle",sections:n,backgroundCount:0,roomCount:oc(n.floor_plan_rooms)};typeof e.floor_plan_units=="string"&&(s.units=ml(e.floor_plan_units)),e.door_mapping!=null&&(s.doorMapping=fl(e.door_mapping));let o=re(xt(e.floor_plan_bg));if(o&&(s.backgrounds={...o},s.backgroundCount=Object.entries(o).filter(([l,d])=>l!==kt&&Ph(d)).length),!Object.keys(n).length&&!s.units&&!s.doorMapping&&!s.backgroundCount)throw new Dn(qa);return s}if("floor_plan_rooms"in e){let n=re(xt(e.floor_plan_rooms));if(!n||!Object.keys(n).length||!Object.values(n).every(Th))throw new Dn(qa);return{kind:"rooms",sections:{floor_plan_rooms:n},backgroundCount:0,roomCount:oc(n)}}let t=Object.values(e);if(t.length&&t.every(Th))return{kind:"rooms",sections:{floor_plan_rooms:e},backgroundCount:0,roomCount:oc(e)};throw new Dn(qa)}function Nh(r,i,e){let t={...e};for(let o of un)t[o]=i.sections[o]??null;let{doc:n,warnings:s}=Gi(t);return i.sections.floor_plan_rooms!==void 0&&(r.floors=n.floors),i.sections.floor_plan_elements!==void 0&&(r.openings=n.openings),i.sections.floor_plan_cameras!==void 0&&(r.cameras=n.cameras),i.sections.floor_plan_entities!==void 0&&(r.pins=n.pins),i.sections.floor_plan_property!==void 0&&(r.property=n.property),s}var bb=60,Ih=Math.round(Ia*1e5)/1e5;function lc(r,i){let e=i==="metric"?r/yr:r;return Z(e/Nt)}function cc(r,i){return Y.from(r,i).message}var be=class extends Ge{constructor(){super(...arguments);this._sources=null;this._sourcesError=null;this._entity="";this._span=null;this._busy="";this._mapNotice=null;this._bgNotice=null;this._opacityDraft=null;this._sh=null;this._shNotice=null;this._shScale=Ih;this._shRotate=0;this._shMirror="none";this._shOrigin=!0;this._shReading=!1;this._includeBg=!1;this._planNotice=null;this._resetNotice=null;this._sourcesRequested=!1;this._unsubs=[]}connectedCallback(){super.connectedCallback(),P(this,[...ga,"jv-empty","jv-state-badge"]),this._unsubs.push(Ah(()=>this.requestUpdate()),jh(()=>this.requestUpdate()))}disconnectedCallback(){super.disconnectedCallback();for(let e of this._unsubs)e();this._unsubs=[],this.store&&ss(this.store)&&as(this.store),this.store&&this._opacityDraft!=null&&Ka(this.store,null)}updated(){let e=this.store?.hass??this.hass;!this._sourcesRequested&&e&&(this._sourcesRequested=!0,this._loadSources())}get _hass(){return this.store?.hass??this.hass}get _u(){return this.units}_floorName(e=this.floor){return a(this.store?.floorLabel(e)??e)}_icon(e,t=""){return ba(e,t)}_notice(e){return e?ya(e.level,c`<span>${e.text}</span>`):m}_pickFile(e){this.renderRoot.querySelector(`#${e}`)?.click()}render(){let e=this.store;return e?e.loaded?c`
      <div class="stack">
        ${this._renderMap()}
        ${this._renderBackground()}
        ${this._renderSweetHome()}
        ${this._renderPlanFile()}
        ${this._renderReset()}
      </div>
    `:c`<jv-empty kind="loading" compact .message=${a("Loading...")}></jv-empty>`:m}async _loadSources(){this._sources=null,this._sourcesError=null;try{let e=await X(this._hass,"jarvis/floorplan_sources"),t=Array.isArray(e?.sources)?e.sources:[];this._sources=t.filter(n=>!!n&&typeof n=="object"&&typeof n.entity_id=="string").map(n=>({entity_id:String(n.entity_id),name:String(n.name||n.entity_id),domain:String(n.domain||"")})),this._sources.some(n=>n.entity_id===this._entity)||(this._entity=this._sources[0]?.entity_id??"")}catch(e){this._sources=[],this._sourcesError=cc("jarvis/floorplan_sources",e)}}_renderMap(){let e=this.store,t=this._sources,n=t===null&&!this._sourcesError,s=!!t&&!t.length&&!this._sourcesError,o;n?o=[{value:"",label:a("Loading...")}]:s||this._sourcesError?o=[{value:"",label:a("No map or image entities found")}]:o=t.map(u=>({value:u.entity_id,label:`${u.name} (${u.entity_id})`}));let l=!!this._entity&&!this._busy&&!!t?.length,d=di(e);return c`
      <section class="card" aria-labelledby="imp-map-h">
        <h3 id="imp-map-h">${this._icon("mdi:robot-vacuum")}${a("Map / vacuum entity")}</h3>
        ${Pn({id:"imp-source",label:a("Map / vacuum entity"),value:n||s||this._sourcesError?"":this._entity,options:o,disabled:n||s||!!this._sourcesError||!!this._busy,onChange:u=>{this._entity=u,this._mapNotice=null}})}
        ${this._sourcesError?ya("error",c`<span>${a("Couldn't list image entities — {message}",{message:this._sourcesError})}</span>
                <button type="button" class="jv-btn" @click=${()=>{this._loadSources()}}>${a("Retry")}</button>`):m}
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${!l} aria-busy=${String(this._busy==="import")} @click=${()=>{this._importEntity()}}>
            ${this._icon("mdi:image-move")}<span>${this._busy==="import"?a("Importing…"):a("Import as background")}</span>
          </button>
          <button type="button" class="jv-btn" ?disabled=${!l} aria-busy=${String(this._busy==="detect")} @click=${()=>{this._detect()}}>
            ${this._icon("mdi:auto-fix")}<span>${this._busy==="detect"?a("Detecting…"):a("Detect Rooms")}</span>
          </button>
        </div>
        ${this._busy==="detect"?c`<p class="sub" role="status">${a("Detecting rooms in {entity} — this can take a few seconds.",{entity:this._entityName(this._entity)})}</p>`:m}
        <details class="adv">
          <summary>${a("Advanced")}</summary>
          ${Ve({id:"imp-span",label:a("Fit detected layout to {n} units wide",{n:this._spanValue}),value:this._spanValue,min:10,max:2e3,step:5,onChange:u=>{this._span=u==null?null:Math.round(u)}})}
          <p class="hint">≈ ${H(this._spanValue,this._u)}${this._span==null?c` · ${a("matches the rooms on this floor")}`:m}</p>
        </details>
        ${this._notice(this._mapNotice)}
        ${d?this._renderReview():m}
      </section>
    `}get _spanValue(){if(this._span!=null)return this._span;let e=this.store,t=null;for(let n of e?.rooms()||[])n.type!=="outdoor"&&(t=ut(t,pe(je(n))));return t?Math.min(2e3,Math.max(10,Math.round(Math.max(t.x1-t.x0,t.y1-t.y0)/5)*5)):bb}_entityName(e){return this._sources?.find(t=>t.entity_id===e)?.name||e}async _importEntity(){let e=this.store,t=this._entity;if(!e||!t||this._busy)return;let n=e.floor;if(!(e.settings.bg[n]&&!await U({heading:a("Replace the background of {floor}?",{floor:this._floorName(n)}),confirmLabel:a("Replace")}))){this._busy="import",this._mapNotice=null;try{let s=await X(this._hass,"jarvis/import_floorplan",{entity_id:t,floor:n}),o=Math.max(1,Math.round((Number(s?.bytes)||0)/1024));e.toast(a("Floor plan imported from {entity} ({kb} KB)",{entity:this._entityName(t),kb:o})),e.refresh()}catch(s){this._mapNotice={level:"error",text:a("Import failed — {message}",{message:cc("jarvis/import_floorplan",s)})}}finally{this._busy=""}}}async _detect(){let e=this.store,t=this._entity;if(!e||!t||this._busy)return;let n=e.floor;this._busy="detect",this._mapNotice=null;try{let s=await X(this._hass,"jarvis/segment_floorplan_rooms",{entity_id:t,target_span:this._spanValue}),o=Array.isArray(s?.rooms)?s.rooms:[],l=[];if(o.forEach((p,v)=>{if(!p||typeof p!="object")return;let f=aa(p.points);if(!f){let g=Number(p.x),y=Number(p.y),_=Number(p.w),w=Number(p.h);if(![g,y,_,w].every(Number.isFinite)||_<=0||w<=0)return;f=[[g,y],[g+_,y],[g+_,y+w],[g,y+w]]}l.push({key:`d${v}`,name:String(p.name||"").trim()||a("Room {n}",{n:v+1}),type:typeof p.type=="string"&&p.type?p.type:"room",points:f,checked:!0})}),!l.length){this._mapNotice={level:"warning",text:a("No rooms detected in that map")};return}let[d,u]=Ch(e,n,l);Ua(e,{floor:n,entity:t,candidates:l,dx:d,dy:u}),e.toast(a("Detected {n} room(s) — review, rename, position, then Save",{n:l.length})),e.canvas?.announce(a("Detected {n} room(s) — review, rename, position, then Save",{n:l.length}))}catch(s){let o=Y.from("jarvis/segment_floorplan_rooms",s);this._mapNotice={level:o.code==="needs_numpy"||o.code==="no_rooms"?"warning":"error",text:o.message}}finally{this._busy=""}}_renderReview(){let e=this.store,t=di(e),n=this._u,s=e.areaNames(),o=t.candidates.filter(u=>u.checked).length,l=t.floor===e.floor,d=e.rooms(t.floor).length;return c`
      <div class="card" role="group" aria-labelledby="imp-rev-h">
        <h4 id="imp-rev-h">${a("Detected rooms")} · ${this._floorName(t.floor)}</h4>
        <p class="hint">${a("Tap a room on the plan to include or skip it; drag any of them to move the whole layout into place. Nothing changes until you add them.")}</p>
        ${l?m:c`<div class="note"><span>${a("The detected rooms are for {floor}.",{floor:this._floorName(t.floor)})}</span>
              <button type="button" class="jv-btn" @click=${()=>e.setFloor(t.floor)}>${a("Show {floor}",{floor:this._floorName(t.floor)})}</button></div>`}
        <ul class="cands">
          ${_e(t.candidates,u=>u.key,u=>{let p=pe(u.points);return c`<li>
                <input type="checkbox" id=${`cand-${u.key}`} .checked=${I(u.checked)} aria-label=${a("Include {name}",{name:u.name})}
                  @change=${v=>Jn(e,f=>{let g=f.candidates.find(y=>y.key===u.key);g&&(g.checked=v.target.checked)})} />
                <input type="text" .value=${I(u.name)} list="imp-areas" autocomplete="off" aria-label=${a("Name")}
                  @change=${v=>Jn(e,f=>{let g=f.candidates.find(_=>_.key===u.key),y=v.target.value.trim();g&&y&&(g.name=y)})} />
                <span class="size">${H(p.x1-p.x0,n)} × ${H(p.y1-p.y0,n)}</span>
              </li>`})}
        </ul>
        <datalist id="imp-areas">${s.map(u=>c`<option value=${u}></option>`)}</datalist>
        <div class="actions">
          <button type="button" class="jv-btn primary" ?disabled=${!o} @click=${()=>{this._addDetected(!1)}}>${a("Add selected")}</button>
          ${d?c`<button type="button" class="jv-btn" ?disabled=${!o} @click=${()=>{this._addDetected(!0)}}>${a("Replace rooms on {floor}",{floor:this._floorName(t.floor)})}</button>`:m}
          <button type="button" class="jv-btn text" @click=${()=>Ua(e,null)}>${a("Cancel")}</button>
        </div>
      </div>
    `}async _addDetected(e){let t=this.store,n=di(t);if(!t||!n)return;let s=n.candidates.filter(d=>d.checked);if(!s.length)return;let o=n.floor;if(e&&!await U({heading:a("Replace the {n} rooms on {floor} with the detected ones?",{n:t.rooms(o).length,floor:this._floorName(o)}),message:a("Openings, cameras and pins stay. Undo brings the old rooms back."),confirmLabel:a("Replace"),destructive:!0}))return;let l=s.map(d=>{let u=ac(n,d),p=pe(u),v={id:_r(),name:d.name,type:d.type,x:D(p.x0),y:D(p.y0),w:Math.max(1,D(p.x1-p.x0)),h:Math.max(1,D(p.y1-p.y0)),extra:{}};return Rp(u)||(v.points=u),v});t.change(e?a("Replace rooms on {floor}",{floor:this._floorName(o)}):a("Add {n} detected rooms",{n:l.length}),d=>{let u=$r(d,o);e&&(u.rooms=[]),u.rooms.push(...l)}),Ua(t,null),t.floor!==o&&t.setFloor(o),t.toast(a("Added {n} rooms",{n:l.length}),{label:a("Undo"),run:()=>t.undo()})}_renderBackground(){let e=this.store,t=e.floor,n=e.settings.bg[t],s=this._busy==="bg",o=e.settingStatus.floor_plan_bg,l=e.settingStatus.floor_plan_bg_opacity,d=this._opacityDraft??e.settings.bgOpacity,u=n?_h(n,this._hass,()=>this.requestUpdate()):null;return c`
      <section class="card" aria-labelledby="imp-bg-h">
        <h3 id="imp-bg-h">${this._icon("mdi:image-outline")}${a("Background image")} · ${this._floorName(t)}</h3>
        ${u?c`<img class="thumb" src=${u} alt=${a("Background image of {floor}",{floor:this._floorName(t)})} @error=${p=>{p.target.hidden=!0}} />`:c`<p class="hint">${a("upload a floor-plan image, then set its opacity here")}</p>`}
        <input class="file" id="imp-bg-file" type="file" accept="image/*" tabindex="-1" aria-hidden="true" @change=${p=>{this._onBgFile(p)}} />
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${s||o?.level==="saving"} aria-busy=${String(s)} @click=${()=>this._pickFile("imp-bg-file")}>
            ${this._icon("mdi:upload")}<span>${s?a("Saving…"):n?a("Replace image…"):a("Choose image…")}</span>
          </button>
          ${n?c`<button type="button" class="jv-btn text danger-text" ?disabled=${s||o?.level==="saving"} @click=${()=>{this._removeBg()}}>${this._icon("mdi:image-remove")}<span>${a("Remove background")}</span></button>`:m}
        </div>
        <div class="field">
          <label class="field-label" for="imp-opacity">${a("Opacity")}</label>
          <div class="range-row">
            <input id="imp-opacity" type="range" min="0" max="1" step="0.05" .value=${I(String(d))} ?disabled=${!n}
              aria-valuetext=${`${Math.round(d*100)}%`}
              @input=${p=>this._previewOpacity(Number(p.target.value))}
              @change=${p=>{this._writeOpacity(Number(p.target.value))}} />
            <output for="imp-opacity">${Math.round(d*100)}%</output>
          </div>
          ${l?c`<span class="status ${l.level}" role=${l.level==="error"?"alert":"status"}>${l.level==="saving"?a("Saving…"):l.level==="saved"?a("Saved"):l.message}</span>`:m}
        </div>
        ${n?this._renderAlign(n,u):m}
        ${o?.level==="error"&&!this._bgNotice?ya("error",c`<span>${a("Image import failed — {message}",{message:o.message||""})}</span>`):m}
        ${this._notice(this._bgNotice)}
      </section>
    `}_renderAlign(e,t){let n=this.store,s=n.floor,o=this._u,l=ci(e);l===void 0&&t&&Na(e,t).then(()=>this.requestUpdate());let d=ui(n.config)[s],u=ss(n),p=(u?kh(n):null)??ic(n,s),v=this._busy==="align";if(!l||!p)return c`<p class="sub">${l===null?a("This image can't be aligned (its size is unknown)."):a("Loading...")}</p>`;let f=p.w*l.h/l.w,g=y=>{this._writeAlign(s,{...p,...y})};return c`
      <details class="adv" ?open=${u||!!d}>
        <summary>${a("Alignment")}${d?c` · ${a("calibrated")}`:m}</summary>
        <p class="hint">${a("Line the image up with your rooms: drag it on the plan, or type where its top-left corner sits and how wide it is.")}</p>
        <div class="form">
          ${Ve({id:"imp-al-x",label:a("Left"),suffix:Pe(o),value:zt(p.x,o),step:.5,disabled:u||v,onChange:y=>{y!=null&&g({x:lc(y,o)})}})}
          ${Ve({id:"imp-al-y",label:a("Top"),suffix:Pe(o),value:zt(p.y,o),step:.5,disabled:u||v,onChange:y=>{y!=null&&g({y:lc(y,o)})}})}
          ${Ve({id:"imp-al-w",label:a("Image width"),suffix:Pe(o),value:zt(p.w,o),min:1,step:.5,disabled:u||v,onChange:y=>{y!=null&&y>0&&g({w:Math.max(5,lc(y,o))})}})}
        </div>
        <p class="sub">${a("Image height: {h}",{h:H(f,o)})}</p>
        <div class="actions">
          ${u?c`
                <button type="button" class="jv-btn primary" @click=${()=>sc(n)}>${a("Done")}</button>
                <button type="button" class="jv-btn text" @click=${()=>as(n)}>${a("Cancel")}</button>
              `:c`
                <button type="button" class="jv-btn" ?disabled=${v||!n.canvas} @click=${()=>this._startAlign()}>${this._icon("mdi:cursor-move")}<span>${a("Align on the plan")}</span></button>
                ${d?c`<button type="button" class="jv-btn text" ?disabled=${v} @click=${()=>{this._writeAlign(s,null)}}>${a("Reset alignment")}</button>`:m}
              `}
        </div>
        ${u?c`<p class="hint" role="status">${a("Drag the image to move it, its corner handle to scale it. Arrow keys nudge, Page Up / Page Down scale, Enter finishes, Escape cancels.")}</p>`:m}
      </details>
    `}_startAlign(){let e=this.store;if(e&&Sh(e,(t,n)=>{this._writeAlign(t,n)}))try{e.canvas?.shadowRoot?.querySelector("svg")?.focus({preventScroll:!0})}catch{}}async _writeAlign(e,t){let n=this.store;if(!n)return;this._busy="align",this._bgNotice=null;let s=await n.writeSetting("floor_plan_bg",rc(pi(n.config),e,t));Eh(n),this._busy="",s?n.toast(t?a("Background aligned on {floor}",{floor:this._floorName(e)}):a("Background fitted to the rooms again")):this._bgNotice={level:"error",text:a("Image import failed — {message}",{message:n.settingStatus.floor_plan_bg?.message||""})}}_previewOpacity(e){!Number.isFinite(e)||!this.store||(this._opacityDraft=e,Ka(this.store,e))}async _writeOpacity(e){let t=this.store;if(!t||!Number.isFinite(e))return;let n=Math.round(Math.min(1,Math.max(0,e))*100)/100;this._opacityDraft=n,await t.writeSetting("floor_plan_bg_opacity",n),Ka(t,null),this._opacityDraft=null}async _onBgFile(e){let t=e.target,n=t.files?.[0];t.value="";let s=this.store;if(!s||!n)return;let o=s.floor;if(!(s.settings.bg[o]&&!await U({heading:a("Replace the background of {floor}?",{floor:this._floorName(o)}),confirmLabel:a("Replace")}))){this._busy="bg",this._bgNotice=null;try{let l=pi(s.config),d=pa("floor_plan_bg",{...l,[o]:""}),u=Math.floor((xr-d-64)*3/4);if(u<64*1024){this._bgNotice={level:"error",text:a("The other floors' background images already use {size} MB of the {max} MB one change can carry — remove one first",{size:(d/1048576).toFixed(1),max:(xr/1048576).toFixed(1)})};return}let p=await oh(n,u);l[o]=p.url,await s.writeSetting("floor_plan_bg",l)?s.toast(a("Background image set for {floor}",{floor:this._floorName(o)})):this._bgNotice={level:"error",text:a("Image import failed — {message}",{message:s.settingStatus.floor_plan_bg?.message||""})}}catch(l){this._bgNotice=l instanceof mn&&l.code==="too_large"?{level:"error",text:a("Image too large after compression — use a smaller image")}:{level:"error",text:a("Image import failed — {message}",{message:l instanceof Error?l.message:String(l)})}}finally{this._busy=""}}}async _removeBg(){let e=this.store;if(!e)return;let t=e.floor;if(!await U({heading:a("Remove the background image of {floor}?",{floor:this._floorName(t)}),confirmLabel:a("Remove"),destructive:!0}))return;ss(e)&&as(e),this._busy="bg",this._bgNotice=null;let s=rc(pi(e.config),t,null);delete s[t];let o=await e.writeSetting("floor_plan_bg",s);this._busy="",o?e.toast(a("Background image removed from {floor}",{floor:this._floorName(t)})):this._bgNotice={level:"error",text:a("Image import failed — {message}",{message:e.settingStatus.floor_plan_bg?.message||""})}}_shMessage(e){if(e instanceof it)switch(e.code){case"no_inflate":return{level:"warning",text:a("This browser can't unpack .sh3d files — export Home.xml from SweetHome3D or run scripts/sweethome3d_to_floorplan.py")};case"legacy_binary":return{level:"error",text:a(`This .sh3d was saved in SweetHome3D's legacy binary format. Turn on File → Preferences → "Save homes in XML format", re-save, and try again.`)};case"no_rooms":return{level:"error",text:a("No room polygons found — draw rooms in SweetHome3D (Plan → Create rooms) and use the native .sh3d file.")};default:return{level:"error",text:a("Couldn't read that file — {message}",{message:e.message})}}return{level:"error",text:a("Couldn't read that file — {message}",{message:e instanceof Error?e.message:String(e)})}}async _onShFile(e){let t=e.target,n=t.files?.[0];if(t.value="",!!n){this._sh=null,this._shNotice=null,this._shReading=!0;try{let s=new Uint8Array(await n.arrayBuffer()),o=await mh(s);if(!o.rooms.some(l=>l.points.length>=3))throw new it("no_rooms","no room polygons");this._sh={file:n.name,home:o,floors:fh(o)}}catch(s){this._shNotice=this._shMessage(s)}finally{this._shReading=!1}}}_shConverted(){let e=this._sh;return e?bh(e.home,{scale:this._shScale,rotate:this._shRotate,mirror:this._shMirror,origin:this._shOrigin,floors:e.floors}):{}}_floorChoices(){let e=this.store,t=ln.map(n=>n.key);for(let n of e.floors)t.includes(n.key)||t.push(n.key);return[...t.map(n=>({value:n,label:this._floorName(n)})),{value:"",label:a("— none —")}]}_renderSweetHome(){let e=this._sh,t=this._u,n=m;if(e){let s=gh(e.home),o=e.home.rooms.filter(g=>g.points.length>=3).length,l=this._shConverted(),d=Ql(l),u=Object.values(l).flat(),p=pe(u.flatMap(g=>[[g.x,g.y],[g.x+g.w,g.y+g.h]])),v=Object.keys(l).map(g=>`${this._floorName(g)}: ${l[g].length}`).join(" · "),f=this._floorChoices();n=c`
        <p class="sub">${e.file} — ${a("{n} rooms on {m} levels",{n:o,m:Math.max(1,e.home.levels.length)})}</p>
        ${s.length?c`<div class="levels">
              ${s.map(g=>Pn({id:`sh-level-${g.id||"none"}`,label:a("Level {name} →",{name:g.name||"—"}),value:e.floors[g.id]??"",options:f,onChange:y=>{this._sh={...e,floors:{...e.floors,[g.id]:y}}}}))}
            </div>`:m}
        <div class="form">
          <div>
            ${Ve({id:"sh-scale",label:a("Scale"),value:this._shScale,min:1e-4,step:"any",onChange:g=>{this._shScale=g!=null&&g>0?g:Ia}})}
            <button type="button" class="jv-btn text" @click=${()=>{this._shScale=Ih}}>${a("Real size (cm → plan)")}</button>
          </div>
          ${Pn({id:"sh-rotate",label:a("Rotate"),value:String(this._shRotate),options:[0,90,180,270].map(g=>({value:String(g),label:`${g}°`})),onChange:g=>{this._shRotate=Number(g)}})}
          ${Pn({id:"sh-mirror",label:a("Mirror"),value:this._shMirror,options:[{value:"none",label:a("None")},{value:"x",label:a("Left/right")},{value:"y",label:a("Front/back")}],onChange:g=>{this._shMirror=g==="x"||g==="y"?g:"none"}})}
          <div class="wide">${Yi({id:"sh-origin",label:a("Move to origin"),checked:this._shOrigin,onChange:g=>{this._shOrigin=g}})}</div>
        </div>
        <p class="sub" role="status">
          ${d?c`${a("{n} rooms to import",{n:d})} · ${v}${p?c` · ${H(p.x1-p.x0,t)} × ${H(p.y1-p.y0,t)}`:m}`:a("No rooms to import with this level mapping.")}
        </p>
        <div class="actions">
          <button type="button" class="jv-btn primary" ?disabled=${!d} @click=${()=>{this._applySh(!1)}}>${a("Add to plan")}</button>
          <button type="button" class="jv-btn" ?disabled=${!d} @click=${()=>{this._applySh(!0)}}>${a("Replace plan")}</button>
          <button type="button" class="jv-btn text" @click=${()=>{this._sh=null}}>${a("Cancel")}</button>
        </div>
      `}return c`
      <section class="card" aria-labelledby="imp-sh-h">
        <h3 id="imp-sh-h">${this._icon("mdi:home-import-outline")}${a("SweetHome3D")}</h3>
        <p class="hint">${a("Choose a .sh3d, Home.xml or JSON export")}</p>
        <input class="file" id="imp-sh-file" type="file" accept=".sh3d,.xml,.json,application/xml,text/xml,application/json" tabindex="-1" aria-hidden="true" @change=${s=>{this._onShFile(s)}} />
        <div class="actions">
          <button type="button" class="jv-btn" ?disabled=${this._shReading} aria-busy=${String(this._shReading)} @click=${()=>this._pickFile("imp-sh-file")}>
            ${this._icon("mdi:file-upload-outline")}<span>${this._shReading?a("Reading…"):a("Choose file…")}</span>
          </button>
        </div>
        ${this._notice(this._shNotice)}
        ${n}
      </section>
    `}async _applySh(e){let t=this.store;if(!t||!this._sh)return;let n=this._shConverted(),s=Ql(n);if(!s){this._shNotice=this._shMessage(new it("no_rooms","no rooms"));return}if(e&&!await U({heading:a("Replace every room on every floor?"),message:a("Openings, cameras and pins stay. Undo brings the old rooms back."),confirmLabel:a("Replace plan"),destructive:!0}))return;t.change(a("Import {n} rooms from SweetHome3D",{n:s}),d=>{if(e)for(let u of d.floors)u.rooms=[];for(let u of Object.keys(n)){let p=$r(d,u);for(let v of n[u]){let f={id:_r(),name:v.name,type:v.type,x:v.x,y:v.y,w:v.w,h:v.h,extra:{}};v.points&&(f.points=v.points.map(g=>[g[0],g[1]])),p.rooms.push(f)}}});let l=[...ln.map(d=>d.key),...Object.keys(n)].find(d=>n[d]?.length);l&&l!==t.floor&&t.setFloor(l),t.canvas?.fit(),this._sh=null,t.toast(a("Imported {n} rooms — review, then Save",{n:s}),{label:a("Undo"),run:()=>t.undo()})}_renderPlanFile(){return c`
      <section class="card" aria-labelledby="imp-file-h">
        <h3 id="imp-file-h">${this._icon("mdi:code-json")}${a("Plan file")}</h3>
        ${Yi({id:"imp-include-bg",label:a("Include background images"),checked:this._includeBg,onChange:e=>{this._includeBg=e}})}
        <input class="file" id="imp-plan-file" type="file" accept=".json,application/json" tabindex="-1" aria-hidden="true" @change=${e=>{this._onPlanFile(e)}} />
        <div class="actions">
          <button type="button" class="jv-btn" @click=${()=>this._export()}>${this._icon("mdi:download")}<span>${a("Export JSON")}</span></button>
          <button type="button" class="jv-btn" @click=${()=>this._pickFile("imp-plan-file")}>${this._icon("mdi:upload")}<span>${a("Import JSON…")}</span></button>
        </div>
        ${this._notice(this._planNotice)}
      </section>
    `}_export(){let e=this.store;if(e){this._planNotice=null;try{Fh(Mh,JSON.stringify(Dh(e,this._includeBg),null,2)+`
`),e.toast(a("Floor plan exported"))}catch(t){this._planNotice={level:"error",text:a("Export failed — {message}",{message:t instanceof Error?t.message:String(t)})}}}}async _onPlanFile(e){let t=e.target,n=t.files?.[0];t.value="";let s=this.store;if(!s||!n)return;this._planNotice=null;let o;try{o=Oh(await n.text())}catch(v){let f=v instanceof Dn?a(v.reason):v instanceof Error?v.message:String(v);this._planNotice={level:"error",text:a("Invalid layout file — {reason}",{reason:f})};return}let l=o;Object.keys(l.sections).length&&(s.change(a("Import layout"),v=>{Nh(v,l,s.config)}),!s.floors.some(v=>v.key===s.floor)&&s.floors[0]&&s.setFloor(s.floors[0].key),s.canvas?.fit(),s.toast(a("Layout imported — review, then Save"),{label:a("Undo"),run:()=>s.undo()}));let d=s.settings,u=!!l.units&&l.units!==d.units,p=!!l.doorMapping&&JSON.stringify(l.doorMapping)!==JSON.stringify(d.doorMapping);if((u||p)&&await U({heading:a("Also apply the units and door mapping from the file? They save immediately."),confirmLabel:a("Apply")})&&(u&&await s.writeSetting("floor_plan_units",l.units),p&&await s.writeSetting("door_mapping",l.doorMapping)),l.backgrounds){let v=new Set([...ln.map(y=>y.key),...s.floors.map(y=>y.key)]),f=Lh(l.backgrounds,v),g=Object.keys(f.images).length;if(f.skipped&&(this._planNotice={level:"warning",text:a("Skipped {n} background entries that are not inline floor images of this home",{n:f.skipped})}),g&&await U({heading:a("Also import {n} background images? They save immediately.",{n:g}),confirmLabel:a("Import")})){let _=pi(s.config);Object.assign(_,f.images);let w={...re(_[kt])??{},...f.align};Object.keys(w).length&&(_[kt]=w),await s.writeSetting("floor_plan_bg",_)||(this._planNotice={level:"error",text:a("Image import failed — {message}",{message:s.settingStatus.floor_plan_bg?.message||""})})}}}_renderReset(){let e=this.store,t=this._busy==="reset";return c`
      <section class="card" aria-labelledby="imp-reset-h">
        <h3 id="imp-reset-h">${this._icon("mdi:restore")}${a("Reset Default")}</h3>
        <p class="hint">${e.dirty?a("Save or discard your unsaved changes first."):a("Replaces your rooms with the sample home. Openings, cameras and pins stay.")}</p>
        <div class="actions">
          <button type="button" class="jv-btn danger" ?disabled=${t||e.dirty||!!this._busy} aria-busy=${String(t)} @click=${()=>{this._reset()}}>${t?a("Saving…"):a("Reset Default")}</button>
        </div>
        ${this._notice(this._resetNotice)}
      </section>
    `}async _reset(){let e=this.store;if(!(!e||e.dirty||this._busy||!await U({heading:a("Reset the floor plan to the sample home? Your rooms are removed; openings, cameras and pins stay."),confirmLabel:a("Reset Default"),destructive:!0}))){this._busy="reset",this._resetNotice=null;try{await X(this._hass,"jarvis/update_config",{key:"floor_plan_rooms",value:{}}),e.toast(a("Floor plan reset to the sample home")),e.refresh()}catch(n){this._resetNotice={level:"error",text:a("Save failed — {message}",{message:cc("jarvis/update_config",n)})}}finally{this._busy=""}}}};be.styles=[T,ni,S`
      :host {
        display: block;
        min-width: 0;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-4);
        min-width: 0;
      }
      .card {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-3);
        min-width: 0;
        padding: var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-divider);
        border-radius: var(--jv-radius-sm);
      }
      h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      h3 ha-icon {
        --mdc-icon-size: 20px;
        color: var(--jv-text-2);
        flex: none;
      }
      h4 {
        margin: 0;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text);
      }
      .form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
        gap: var(--jv-space-3);
        min-width: 0;
      }
      .form .wide {
        grid-column: 1 / -1;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .actions .jv-btn {
        max-width: 100%;
      }
      .sub {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .thumb {
        display: block;
        max-width: 100%;
        max-height: 160px;
        object-fit: contain;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-bg-2);
      }
      .range-row {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        min-width: 0;
      }
      .range-row input[type="range"] {
        flex: 1 1 auto;
        min-width: 0;
      }
      .range-row output {
        flex: none;
        min-width: 4ch;
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      details.adv > summary {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        cursor: pointer;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        list-style: none;
      }
      details.adv > summary::-webkit-details-marker {
        display: none;
      }
      details.adv > summary::before {
        content: "▸";
      }
      details.adv[open] > summary::before {
        content: "▾";
      }
      details.adv > summary:focus-visible {
        box-shadow: var(--jv-focus-ring);
        border-radius: var(--jv-radius-sm);
      }
      details.adv[open] > summary {
        margin-bottom: var(--jv-space-2);
      }
      ul.cands {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        border: var(--jv-border-width) solid var(--jv-divider);
        border-radius: var(--jv-radius-sm);
      }
      ul.cands li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      ul.cands li + li {
        border-top: var(--jv-border-width) solid var(--jv-divider);
      }
      ul.cands input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin: 0;
        flex: none;
        accent-color: var(--jv-accent);
      }
      ul.cands input[type="text"] {
        box-sizing: border-box;
        flex: 1 1 140px;
        min-width: 0;
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
      }
      ul.cands .size {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        font-variant-numeric: tabular-nums;
      }
      .note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-info-soft);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
      }
      .note > span {
        flex: 1 1 160px;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .levels {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--jv-space-3);
      }
      .jv-btn.danger-text {
        color: var(--jv-danger-text);
      }
      .file {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }
    `],h([b()],be.prototype,"_sources",2),h([b()],be.prototype,"_sourcesError",2),h([b()],be.prototype,"_entity",2),h([b()],be.prototype,"_span",2),h([b()],be.prototype,"_busy",2),h([b()],be.prototype,"_mapNotice",2),h([b()],be.prototype,"_bgNotice",2),h([b()],be.prototype,"_opacityDraft",2),h([b()],be.prototype,"_sh",2),h([b()],be.prototype,"_shNotice",2),h([b()],be.prototype,"_shScale",2),h([b()],be.prototype,"_shRotate",2),h([b()],be.prototype,"_shMirror",2),h([b()],be.prototype,"_shOrigin",2),h([b()],be.prototype,"_shReading",2),h([b()],be.prototype,"_includeBg",2),h([b()],be.prototype,"_planNotice",2),h([b()],be.prototype,"_resetNotice",2),be=h([A("jarvis-editor-import")],be);var yb=[{label:"FRONT",theta:0},{label:"RIGHT",theta:90},{label:"REAR",theta:180},{label:"LEFT",theta:270},{label:"ISO",theta:35}],Hh="jarvis.editor.preview",_b=120,wb=["ha-icon","ha-alert","ha-icon-button"],St=class extends de{constructor(){super();this.store=new ha;this._previewOpen=!1;this._previewAll=!1;this._preset=35;this._dragging=!1;this._canvasEl=null;this._previewVersion=0;this._theta=35;this._raf=0;this._drag=null;this._unsub=null;this._previewTimer=null;this._inputsKey="";this._inputs=null;this._boxKey="";this._svgKey="";this._svg="";this._previewError=null;this._onBeforeUnload=e=>{this.store.dirty&&(e.preventDefault(),e.returnValue="")};this._onKey=e=>{let t=e.composedPath()[0],n=t?.tagName?.toLowerCase()||"";if(n==="input"||n==="textarea"||n==="select"||t?.isContentEditable||n.startsWith("ha-textfield")||n.startsWith("ha-select"))return;let s=e.ctrlKey||e.metaKey,o=e.key.toLowerCase();if(s&&o==="s")e.preventDefault(),this._save();else if(s&&o==="z")e.preventDefault(),e.shiftKey?this.store.redo():this.store.undo();else if(s&&o==="y")e.preventDefault(),this.store.redo();else if(e.altKey&&!s){let l=/^(?:Digit|Numpad)([1-9])$/.exec(e.code||"")?.[1]??(/^[1-9]$/.test(e.key)?e.key:null),d=l?this.store.floors[Number(l)-1]:void 0;d&&(e.preventDefault(),this.store.setFloor(d.key))}};this.store.host=this;let e=null;try{let t=localStorage.getItem(Hh);t==="1"?e=!0:t==="0"&&(e=!1)}catch{}if(e==null)try{e=typeof matchMedia=="function"?matchMedia("(min-width: 1100px)").matches:!1}catch{e=!1}this._previewOpen=e}connectedCallback(){super.connectedCallback(),P(this,[...wb,...hn.map(e=>e.element)]),this._unsub=this.store.subscribe(()=>this._onStore()),this.addEventListener("keydown",this._onKey),window.addEventListener("beforeunload",this._onBeforeUnload)}disconnectedCallback(){super.disconnectedCallback(),this._unsub?.(),this._unsub=null,this.removeEventListener("keydown",this._onKey),window.removeEventListener("beforeunload",this._onBeforeUnload),this._raf&&cancelAnimationFrame(this._raf),this._raf=0,this._previewTimer&&clearTimeout(this._previewTimer),this._previewTimer=null,this.store.dispose()}willUpdate(e){e.has("hass")&&(this.store.hass=this.hass,this._schedulePreview()),e.has("data")&&this.store.load(this.data),e.has("route")&&this.store.setTab(this._tabFromRoute())}updated(){let e=this._canvasQuery??null;e!==this._canvasEl&&(this._canvasEl=e)}_onStore(){this._schedulePreview(),this.requestUpdate()}_schedulePreview(){if(!this._previewOpen){this._inputsKey="";return}this._previewTimer&&clearTimeout(this._previewTimer),this._previewTimer=setTimeout(()=>{this._previewTimer=null,this._previewVersion+=1},_b)}_tabFromRoute(){let e=this.subPath.split("/").filter(Boolean),t=e[0]==="editor"?e[1]:void 0;return gp(t)?t:"rooms"}async _back(){this.store.dirty&&!await U({heading:a("Leave without saving?"),confirmLabel:a("Leave"),cancelLabel:a("Keep editing"),destructive:!0})||this.navigate("residence")}async _save(){let e=this.store;if(!e.dirty||e.saving)return;(await e.save()).ok&&e.toast(a("Floor plan saved"))}async _discard(){await U({heading:a("Discard unsaved changes?"),confirmLabel:a("Discard"),destructive:!0})&&(this.store.discard(),this.store.toast(a("Changes discarded")))}async _reloadRemote(){this.store.dirty&&!await U({heading:a("Discard unsaved changes?"),confirmLabel:a("Discard"),destructive:!0})||this.store.adoptRemote()}_setFloor(e){this.store.setFloor(e)}async _setUnits(e){if(e===this.store.settings.units)return;await this.store.writeSetting("floor_plan_units",e)&&this.store.toast(e==="metric"?a("Units: Metric (m)"):a("Units: Imperial (ft)"))}_togglePreview(){this._previewOpen=!this._previewOpen;try{localStorage.setItem(Hh,this._previewOpen?"1":"0")}catch{}}_selectTab(e){this.navigate("residence",`editor/${e}`)}_onTabsKey(e){if(e.key!=="ArrowRight"&&e.key!=="ArrowLeft"&&e.key!=="Home"&&e.key!=="End")return;let t=hn.findIndex(o=>o.id===this.store.tab),n=hn.length,s=e.key==="Home"?0:e.key==="End"?n-1:(t+(e.key==="ArrowRight"?1:-1)+n)%n;e.preventDefault(),this._selectTab(hn[s].id),this.updateComplete.then(()=>this.renderRoot.querySelector(`#tab-${hn[s].id}`)?.focus())}_setPreset(e){this._theta=e,this._preset=e,this.requestUpdate()}_rotateBy(e){this._theta-=e,this._preset=null,this._raf||(this._raf=requestAnimationFrame(()=>{this._raf=0,this.requestUpdate()}))}_onScenePointerDown(e){if(!(e.pointerType==="mouse"&&e.button!==0)){this._drag={id:e.pointerId,x:e.clientX},this._dragging=!0;try{e.currentTarget?.setPointerCapture?.(e.pointerId)}catch{}}}_onScenePointerMove(e){if(!this._drag||e.pointerId!==this._drag.id)return;let t=e.clientX-this._drag.x;this._drag.x=e.clientX,t&&this._rotateBy(t*.6)}_onScenePointerUp(e){!this._drag||e.pointerId!==this._drag.id||(this._drag=null,this._dragging=!1)}_onSceneKey(e){if(e.key==="ArrowLeft")this._rotateBy(-15);else if(e.key==="ArrowRight")this._rotateBy(15);else if(e.key==="Home")this._setPreset(35);else return;e.preventDefault()}_previewSvg(){let e=this.store;try{let t=this._previewAll?"all":op(e.floor),n=`${this._previewVersion}|${t}`;if(n!==this._inputsKey||!this._inputs){this._inputsKey=n;let g=e.config,y=na(g),_=sp(e.doc),w=ap(e.doc,this.hass),R=ta(g,this.hass),j=[t,JSON.stringify(y),JSON.stringify(w),JSON.stringify(R),JSON.stringify(_)].join("|");this._inputs={spec:y,plan:_,elements:w,garage:R,floor:t,boxKey:j}}let{spec:s,plan:o,elements:l,garage:d,floor:u,boxKey:p}=this._inputs,v=Ys(this);p!==this._boxKey&&(this._box=Vs({floor:u,spec:s,plan:o,elements:l,garage:d,palette:v}),this._boxKey=p);let f=[this._theta.toFixed(1),p,Xs(this)].join("|");f!==this._svgKey&&(this._svg=Gs({theta:this._theta,floor:u,lit:{},box:this._box,spec:s,plan:o,elements:l,garage:d,palette:v,idPrefix:"j3de",animate:!1}),this._svgKey=f),this._previewError=null}catch(t){this._previewError=t instanceof Error?t.message:String(t)}return this._svg}render(){let e=this.store;if(!this.data||!e.loaded)return c`
        <div class="jv-grid editor-grid">
          <jv-section class="plan" .heading=${a("Plan")} icon="mdi:floor-plan" loading>
            <jv-empty kind="loading" .message=${a("Loading...")}></jv-empty>
          </jv-section>
          <jv-section .heading=${a("Rooms")} loading>
            <jv-empty kind="loading" compact .message=${a("Loading...")}></jv-empty>
          </jv-section>
        </div>
      `;let t=hn.find(n=>n.id===e.tab)??hn[0];return c`
      ${this._renderHeader()}
      ${this._renderBanners()}
      ${this.narrow?m:this._renderToasts()}
      <div class="jv-grid editor-grid">
        <jv-section class="plan" .heading=${a("Plan")} .subheading=${a(e.floorLabel())} icon="mdi:floor-plan">
          ${this._renderTabs()}
          <div class="canvas-wrap">
            <jv-plan-canvas .store=${e} .hass=${this.hass} ?narrow=${this.narrow}></jv-plan-canvas>
            ${e.rooms().length===0?c`<div class="empty-hint"><jv-empty compact icon="mdi:floor-plan" .message=${a("No rooms on this floor yet — draw one, place one, or import.")}></jv-empty></div>`:m}
          </div>
          <p class="hint">${ma(this.narrow)?a("Drag to move · corner handle to resize · long-press for more"):a("Drag to move · corner handle to resize · right-click for more")}</p>
        </jv-section>
        <jv-section class="side" .heading=${a(t.label)} icon=${t.icon}>
          <div role="tabpanel" id="tabpanel" aria-labelledby=${`tab-${t.id}`}>${this._renderTab(t)}</div>
        </jv-section>
        ${this._renderPreview()}
      </div>
      ${this.narrow?this._renderStickyBar():m}
    `}_icon(e,t){return x("ha-icon")?c`<ha-icon icon=${e}></ha-icon>`:c`<span aria-hidden="true">${t}</span>`}_renderHeader(){let e=this.store,t=e.settings.units,n=this._canvasEl,s=e.settingStatus.floor_plan_units?.level==="saving";return c`
      <div class="head">
        <button type="button" class="jv-btn text back" @click=${this._back}>← ${a("Residence")}</button>
        <h2 class="jv-title">${a("Floor Plan Editor")}</h2>
        <jv-state-badge class=${e.dirty?"":"ghost"} level="accent" .label=${a("Unsaved changes")}></jv-state-badge>
        <span class="spacer"></span>
        <fieldset class="group" aria-label=${a("Floor")}>
          ${e.floors.map(o=>{let l=e.floorHidden(o.key);return c`<button type="button" class="pill jv-hit" aria-pressed=${String(e.floor===o.key)} @click=${()=>this._setFloor(o.key)}>
              ${a(e.floorLabel(o.key))}
              ${l?c`<span title=${a("Hidden on the Residence tab")}>${this._icon("mdi:eye-off-outline","·")}<span class="visually-hidden">${a("Hidden on the Residence tab")}</span></span>`:m}
            </button>`})}
        </fieldset>
        ${this.narrow?m:c`
              <div class="group tools">
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${a("Undo")} title=${e.undoLabel?a("Undo: {label}",{label:e.undoLabel}):a("Undo")} ?disabled=${!e.canUndo} @click=${()=>e.undo()}>${this._icon("mdi:undo","↶")}</button>
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${a("Redo")} title=${e.redoLabel?a("Redo: {label}",{label:e.redoLabel}):a("Redo")} ?disabled=${!e.canRedo} @click=${()=>e.redo()}>${this._icon("mdi:redo","↷")}</button>
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${a("Snap to grid")} title=${a("Snap to grid")} aria-pressed=${String(n?.snap??!0)} @click=${()=>{n?.setSnap(!n.snap),this.requestUpdate()}}>${this._icon("mdi:magnet","⌗")}</button>
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${a("Fit")} title=${a("Fit")} @click=${()=>n?.fit()}>${this._icon("mdi:fit-to-screen-outline","⤢")}</button>
                <button type="button" class="jv-icon-btn jv-hit" aria-label=${a("Preview")} title=${a("Preview")} aria-pressed=${String(this._previewOpen)} @click=${this._togglePreview}>${this._icon("mdi:cube-outline","3D")}</button>
                <fieldset class="group" aria-label=${a("Units")}>
                  <button type="button" class="pill jv-hit" aria-pressed=${String(t==="imperial")} ?disabled=${s} @click=${()=>this._setUnits("imperial")}>${a("Imperial (ft)")}</button>
                  <button type="button" class="pill jv-hit" aria-pressed=${String(t==="metric")} ?disabled=${s} @click=${()=>this._setUnits("metric")}>${a("Metric (m)")}</button>
                </fieldset>
                <button type="button" class="jv-btn text jv-hit ${e.dirty?"":"ghost"}" ?disabled=${!e.dirty} @click=${this._discard}>${a("Discard")}</button>
                <button type="button" class="jv-btn primary jv-hit" ?disabled=${!e.dirty||e.saving} @click=${this._save}>${e.saving?a("Saving…"):a("Save Layout")}</button>
              </div>
            `}
      </div>
    `}_alert(e,t){return x("ha-alert")?c`<ha-alert alert-type=${e}>${t}</ha-alert>`:c`<div class="alert ${e}" role=${e==="error"?"alert":"status"}>${t}</div>`}_renderBanners(){let e=this.store;return c`
      ${e.saveError?this._alert("error",c`<span>${e.saveErrorCode==="unauthorized"?a("Administrator access is required to edit the floor plan."):a("Save failed — {message}",{message:e.saveError})}</span>
              <span class="alert-actions">
                <button type="button" class="jv-btn" ?disabled=${e.saving} @click=${this._save}>${a("Retry")}</button>
                <button type="button" class="jv-btn text" @click=${()=>e.clearSaveError()}>${a("Dismiss")}</button>
              </span>`):m}
      ${e.remoteChanged?this._alert("warning",c`<span>${a("The plan changed elsewhere.")}</span>
              <span class="alert-actions">
                <button type="button" class="jv-btn" @click=${this._reloadRemote}>${a("Reload")}</button>
                <button type="button" class="jv-btn text" @click=${()=>e.dismissRemote()}>${a("Keep mine")}</button>
              </span>`):m}
      ${e.configured?m:this._alert("info",c`<span>${a("This is the sample home. Change anything and Save to make it yours, or import your plan.")}</span>`)}
      ${e.warnings.length?c`<details class="warnings">
            <summary>${a("Plan warnings ({n})",{n:e.warnings.length})}</summary>
            <ul>${e.warnings.map(t=>c`<li>${t}</li>`)}</ul>
          </details>`:m}
    `}_renderToasts(){let e=this.store;return e.toasts.length?c`
      <div class="toasts" role="status" aria-live="polite">
        ${e.toasts.map(t=>c`<div class="toast">
            <span>${t.message}</span>
            ${t.action?c`<button type="button" class="jv-btn text" @click=${()=>e.runToastAction(t.id)}>${t.action.label}</button>`:m}
            <button type="button" class="jv-icon-btn" aria-label=${a("Dismiss")} @click=${()=>e.dismissToast(t.id)}>${this._icon("mdi:close","×")}</button>
          </div>`)}
      </div>
    `:c`<div class="toasts" role="status" aria-live="polite"></div>`}_renderTabs(){let e=this.store;return c`
      <div class="tabs" role="tablist" aria-label=${a("Editor sections")} @keydown=${this._onTabsKey}>
        ${hn.map(t=>c`<button
            type="button"
            role="tab"
            id=${`tab-${t.id}`}
            class="chip jv-hit"
            aria-selected=${String(e.tab===t.id)}
            aria-controls="tabpanel"
            tabindex=${e.tab===t.id?"0":"-1"}
            @click=${()=>this._selectTab(t.id)}
          >
            ${this._icon(t.icon,"")} ${a(t.label)}
          </button>`)}
      </div>
    `}_renderTab(e){let t=Hr(e.element),n=x(e.element);return c`
      ${ye`<${t} .store=${this.store} .canvas=${this._canvasEl} .hass=${this.hass} .narrow=${this.narrow}></${t}>`}
      ${n?m:c`<jv-empty compact icon=${e.icon} .heading=${a(e.label)} .message=${a("This section is not available yet.")}></jv-empty>`}
    `}_renderPreview(){let e=this.store,t=this._previewOpen;return c`
      <jv-section class="preview" .heading=${a("Preview")} icon="mdi:cube-outline">
        <button slot="actions" type="button" class="jv-btn text" aria-expanded=${String(t)} aria-controls="preview-body" @click=${this._togglePreview}>
          ${t?a("Hide"):a("Show")}
        </button>
        ${t?c`<div id="preview-body" data-version=${this._previewVersion}>
              <div class="preview-controls">
                <fieldset class="group" aria-label=${a("View")}>
                  ${yb.map(n=>c`<button type="button" class="pill jv-hit" aria-pressed=${String(this._preset===n.theta)} @click=${()=>this._setPreset(n.theta)}>${a(n.label)}</button>`)}
                </fieldset>
                <fieldset class="group" aria-label=${a("Floor")}>
                  <button type="button" class="pill jv-hit" aria-pressed=${String(!this._previewAll)} @click=${()=>{this._previewAll=!1}}>${a(e.floorLabel())}</button>
                  <button type="button" class="pill jv-hit" aria-pressed=${String(this._previewAll)} @click=${()=>{this._previewAll=!0}}>${a("All")}</button>
                </fieldset>
                <span class="hint">${a("drag to rotate")}</span>
              </div>
              ${this._renderScene()}
            </div>`:m}
      </jv-section>
    `}_renderScene(){let e=this._previewSvg();return this._previewError?c`<jv-empty kind="error" compact icon="mdi:cube-off-outline" .heading=${a("Preview unavailable")} .message=${this._previewError}></jv-empty>`:c`
      <div
        class="scene ${this._dragging?"dragging":""}"
        role="group"
        tabindex="0"
        aria-label=${a("3D model of the home")}
        aria-describedby="preview-hint"
        aria-keyshortcuts="ArrowLeft ArrowRight Home"
        @pointerdown=${this._onScenePointerDown}
        @pointermove=${this._onScenePointerMove}
        @pointerup=${this._onScenePointerUp}
        @pointercancel=${this._onScenePointerUp}
        @keydown=${this._onSceneKey}
      >
        ${Hs(e)}
      </div>
      <span class="visually-hidden" id="preview-hint">${a("Drag with the pointer or use the left and right arrow keys to rotate the model; Home resets the view.")}</span>
    `}_renderStickyBar(){let e=this.store;return c`
      <div class="sticky-bar">
        ${this._renderToasts()}
        <div class="row">
          <button type="button" class="jv-icon-btn" aria-label=${a("Undo")} ?disabled=${!e.canUndo} @click=${()=>e.undo()}>${this._icon("mdi:undo","↶")}</button>
          <button type="button" class="jv-icon-btn" aria-label=${a("Redo")} ?disabled=${!e.canRedo} @click=${()=>e.redo()}>${this._icon("mdi:redo","↷")}</button>
          ${e.dirty?c`<button type="button" class="jv-btn text" @click=${this._discard}>${a("Discard")}</button>`:m}
          <button type="button" class="jv-btn primary" ?disabled=${!e.dirty||e.saving} @click=${this._save}>${e.saving?a("Saving…"):a("Save Layout")}</button>
        </div>
      </div>
    `}};St.styles=[T,S`
      :host {
        display: block;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-2) 0;
        margin-bottom: var(--jv-space-2);
        position: sticky;
        top: var(--jv-sticky-top, 0px);
        z-index: 2;
        background: var(--jv-bg);
      }
      :host([narrow]) .head {
        position: static;
      }
      .head .jv-title {
        margin: 0;
        white-space: nowrap;
      }
      .spacer {
        flex: 1 1 auto;
      }
      /* keeps its box so the header never reflows (and the canvas never jumps) when the plan becomes dirty */
      .ghost {
        visibility: hidden;
      }
      .back {
        padding-left: var(--jv-space-2);
        padding-right: var(--jv-space-2);
      }
      .group {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1);
        border: 0;
        padding: 0;
        margin: 0;
        min-width: 0;
      }
      .pill,
      .chip {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-1);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        cursor: pointer;
        white-space: nowrap;
        transition: background-color var(--jv-ease);
      }
      .pill:hover,
      .chip:hover {
        background: var(--jv-hover);
      }
      .pill[aria-pressed="true"],
      .chip[aria-selected="true"] {
        background: var(--jv-accent-soft);
        border-color: var(--jv-accent);
      }
      .pill ha-icon {
        --mdc-icon-size: 16px;
        color: var(--jv-warn-text);
      }
      .tools .jv-btn {
        min-height: 36px;
        padding: 0 var(--jv-space-3);
      }
      .tools .jv-icon-btn {
        width: 36px;
        height: 36px;
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-surface);
      }
      .tools .jv-icon-btn[disabled] {
        opacity: 0.45;
        cursor: default;
      }
      .tools .jv-icon-btn[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        border-color: var(--jv-accent);
      }
      .tools ha-icon {
        --mdc-icon-size: 20px;
      }
      .editor-grid .plan,
      .editor-grid .preview {
        grid-column: 1 / -1;
      }
      @media (min-width: 1100px) {
        .editor-grid .plan {
          grid-column: span 2;
        }
      }
      .tabs {
        display: flex;
        gap: var(--jv-space-1);
        overflow-x: auto;
        padding: var(--jv-space-1) 0 var(--jv-space-2);
        margin-bottom: var(--jv-space-2);
        scrollbar-width: thin;
      }
      .tabs .chip {
        flex: none;
      }
      .tabs .chip:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
      .canvas-wrap {
        position: relative;
      }
      .empty-hint {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .empty-hint jv-empty {
        background: var(--jv-surface);
        border-radius: var(--jv-radius-sm);
        pointer-events: none;
      }
      .hint {
        margin: var(--jv-space-2) 0 0;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .alert {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        padding: var(--jv-space-3) var(--jv-space-4);
        margin-bottom: var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        color: var(--jv-text);
      }
      .alert.info {
        background: var(--jv-info-soft);
      }
      .alert.warning {
        background: var(--jv-warn-soft);
      }
      .alert.error {
        background: var(--jv-danger-soft);
      }
      .alert > span {
        flex: 1 1 auto;
        min-width: 0;
      }
      ha-alert {
        display: block;
        margin-bottom: var(--jv-space-3);
      }
      .alert-actions {
        display: inline-flex;
        gap: var(--jv-space-2);
      }
      .toasts {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        margin-bottom: var(--jv-space-3);
      }
      .toast {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        padding: var(--jv-space-1) var(--jv-space-2) var(--jv-space-1) var(--jv-space-3);
        background: var(--jv-surface-2);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        font-size: var(--jv-font-size-s);
      }
      .toast > span {
        flex: 1 1 auto;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      /* narrow only: sticks ABOVE the panel's bottom nav (56 px items + its 1 px border + the safe area),
         which is sticky at bottom 0 in the same scroller and would cover it; it carries the toasts too */
      .sticky-bar {
        position: sticky;
        bottom: calc(57px + env(safe-area-inset-bottom, 0px));
        z-index: 2;
        padding: var(--jv-space-2) 0;
        margin-top: var(--jv-space-3);
        background: var(--jv-bg);
        border-top: 1px solid var(--jv-divider);
      }
      .sticky-bar .toasts {
        margin-bottom: var(--jv-space-2);
      }
      .sticky-bar .toasts:empty {
        margin-bottom: 0;
      }
      .sticky-bar .row {
        display: flex;
        gap: var(--jv-space-2);
      }
      .sticky-bar .primary {
        flex: 1 1 auto;
      }
      details.warnings {
        margin-bottom: var(--jv-space-3);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      details.warnings summary {
        cursor: pointer;
        min-height: var(--jv-tap);
        display: flex;
        align-items: center;
      }
      /* preview */
      .preview-controls {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2) var(--jv-space-4);
        align-items: center;
        margin-bottom: var(--jv-space-3);
      }
      .scene {
        position: relative;
        height: clamp(280px, 50vh, 480px);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-bg-2);
        border: var(--jv-border-width) solid var(--jv-border);
        overflow: hidden;
        cursor: grab;
        touch-action: pan-y;
        user-select: none;
        -webkit-user-select: none;
      }
      .scene.dragging {
        cursor: grabbing;
      }
      .scene svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .scene svg text {
        font-family: var(--jv-font-code);
      }
      .visually-hidden {
        position: absolute;
      }
    `],h([b()],St.prototype,"_previewOpen",2),h([b()],St.prototype,"_previewAll",2),h([b()],St.prototype,"_preset",2),h([b()],St.prototype,"_dragging",2),h([b()],St.prototype,"_canvasEl",2),h([b()],St.prototype,"_previewVersion",2),h([me("jv-plan-canvas")],St.prototype,"_canvasQuery",2),St=h([A("jarvis-plan-editor")],St);var Bh=S`
      .res {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      @media (min-width: 1280px) {
        .res {
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
        }
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-4);
        margin-bottom: var(--jv-space-3);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .field > span {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        letter-spacing: 0.04em;
      }
      select {
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        max-width: 100%;
      }
      .seg {
        display: inline-flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
        border: 0;
        padding: 0;
        margin: 0;
      }
      .seg legend {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        padding: 0;
        margin-bottom: 2px;
      }
      .seg button {
        appearance: none;
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        cursor: pointer;
        transition: background-color var(--jv-ease);
      }
      .seg button:hover {
        background: var(--jv-hover);
      }
      .seg button[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        border-color: var(--jv-accent);
        color: var(--jv-text);
      }
      .hint {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        align-self: end;
        padding-bottom: 8px;
      }
      .scene {
        position: relative;
        height: 560px;
        border-radius: var(--jv-radius-sm);
        background: var(--jv-bg-2);
        border: var(--jv-border-width) solid var(--jv-border);
        overflow: hidden;
        cursor: grab;
        touch-action: pan-y;
        user-select: none;
        -webkit-user-select: none;
      }
      .scene.dragging {
        cursor: grabbing;
      }
      .scene svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .scene svg text {
        font-family: var(--jv-font-code);
      }
      /* the overlays sit on the drawing: a translucent surface chip keeps the
         captions readable over the model and the --jv-bg-2 scene background */
      .overlay {
        position: absolute;
        pointer-events: none;
        padding: var(--jv-space-1) var(--jv-space-2);
        border-radius: var(--jv-radius-sm);
        background: color-mix(in srgb, var(--jv-surface) 85%, transparent);
        font-size: var(--jv-font-size-xs);
        line-height: 1.3;
      }
      .banner {
        top: var(--jv-space-3);
        left: var(--jv-space-3);
        max-width: 55%;
        color: var(--jv-text-2);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .banner strong {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-medium);
      }
      .stats {
        top: var(--jv-space-3);
        right: var(--jv-space-3);
        display: flex;
        gap: var(--jv-space-4);
        text-align: right;
      }
      .stat .k {
        color: var(--jv-text-2);
        letter-spacing: 0.06em;
      }
      .stat .v {
        color: var(--jv-text);
        font-size: var(--jv-font-size-m);
        font-weight: var(--jv-font-weight-medium);
        font-variant-numeric: tabular-nums;
      }
      .placeholder {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: var(--jv-text-2);
      }
      .planhint {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
        margin: var(--jv-space-3) 0 0;
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-info-soft);
        font-size: var(--jv-font-size-s);
      }
      .planhint a {
        color: var(--jv-accent-text);
      }
      .dom {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-3);
        margin-top: var(--jv-space-4);
        padding-top: var(--jv-space-3);
        border-top: 1px solid var(--jv-divider);
      }
      .dom .name {
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-medium);
        line-height: 1.2;
      }
      .gauges {
        display: flex;
        gap: var(--jv-space-3);
      }
      .gauge {
        position: relative;
        width: 64px;
        text-align: center;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .gauge svg {
        display: block;
        width: 64px;
        height: 64px;
      }
      .gauge .track {
        fill: none;
        stroke: var(--jv-neutral-soft);
        stroke-width: 5;
      }
      .gauge .arc {
        fill: none;
        stroke: var(--jv-accent);
        stroke-width: 5;
        stroke-linecap: round;
        transition: stroke-dashoffset var(--jv-ease);
      }
      .gauge.dim .arc {
        stroke: var(--jv-text-3);
      }
      .gauge .val {
        position: absolute;
        top: 22px;
        left: 0;
        right: 0;
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        font-variant-numeric: tabular-nums;
      }
      .mm-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--jv-space-2);
      }
      .mm-room {
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
      }
      .mm-room.on {
        border-color: var(--jv-ok);
        background: var(--jv-ok-soft);
      }
      .mm-room summary,
      .mm-room .row {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) var(--jv-space-3);
        cursor: pointer;
        list-style: none;
      }
      .mm-room summary::-webkit-details-marker {
        display: none;
      }
      .mm-dot {
        flex: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--jv-text-3);
      }
      .mm-room.on .mm-dot {
        background: var(--jv-ok);
      }
      .mm-body {
        flex: 1 1 auto;
        min-width: 0;
      }
      .mm-name {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .mm-meta {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .mm-sensors {
        list-style: none;
        margin: 0;
        padding: 0 var(--jv-space-3) var(--jv-space-2) calc(var(--jv-space-3) + 10px + var(--jv-space-3));
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .mm-sensors li {
        display: flex;
        justify-content: space-between;
        gap: var(--jv-space-2);
        padding: 2px 0;
      }
      .mm-sensors .on {
        color: var(--jv-ok-text);
      }
      .mm-state {
        margin: var(--jv-space-2) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .subtext {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .err {
        margin-bottom: var(--jv-space-3);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-danger-soft);
        font-size: var(--jv-font-size-s);
      }
      /* Narrow rules key off the card's own width (container query) so they
         apply on a phone AND inside a narrow HA layout / the harness frame. */
      .wrap {
        container-type: inline-size;
      }
      @container (max-width: 768px) {
        .scene {
          height: 340px;
        }
        .stat.style {
          display: none;
        }
        .controls > * {
          flex: 1 1 100%;
        }
        .seg button {
          padding: 8px 14px;
        }
      }
      @container (max-width: 520px) {
        .banner {
          max-width: calc(100% - 2 * var(--jv-space-3));
        }
        .stats {
          top: calc(var(--jv-space-3) + 1.6em);
          left: var(--jv-space-3);
          right: auto;
          text-align: left;
          gap: var(--jv-space-3);
        }
      }
      @container (max-width: 380px) {
        .stat.sqft {
          display: none;
        }
      }
`;var $b=[{label:"FRONT",theta:0},{label:"RIGHT",theta:90},{label:"REAR",theta:180},{label:"LEFT",theta:270},{label:"ISO",theta:35}],xb="https://github.com/sam3gp8/jarvis-aio/blob/main/docs/floor-plan-import.md",dc=26,zh=2*Math.PI*dc,st=class extends de{constructor(){super(...arguments);this._floor="all";this._preset=35;this._dragging=!1;this._mm=null;this._mmLoading=!1;this._mmError=null;this._styleBusy=!1;this._styleOverride=null;this._styleError=null;this._theta=35;this._raf=0;this._drag=null;this._plan={};this._editorPlan={};this._planJson="";this._planConfigured=!0;this._boxKey="";this._svgKey="";this._svg="";this._mq=[];this._onMq=()=>this.requestUpdate()}connectedCallback(){if(super.connectedCallback(),P(this,["ha-select","ha-list-item","ha-alert","ha-icon"]),typeof matchMedia=="function"){this._mq=[matchMedia("(prefers-color-scheme: dark)"),matchMedia("(prefers-reduced-motion: reduce)")];for(let e of this._mq)e.addEventListener?.("change",this._onMq)}}disconnectedCallback(){super.disconnectedCallback();for(let e of this._mq)e.removeEventListener?.("change",this._onMq);this._mq=[],this._raf&&cancelAnimationFrame(this._raf),this._raf=0}willUpdate(e){if(e.has("data")){let t=this.data?.config||{},{plan:n,configured:s}=Zs(t.floor_plan_rooms);this._editorPlan=n,this._planConfigured=s,this._plan=Js(n),this._planJson=JSON.stringify(this._plan),this._styleBusy||(this._styleOverride=null),this._floor!=="all"&&!this._floorAvailable(this._floor)&&(this._floor="all")}}updated(e){e.has("data")&&this.data&&this.hass?this._fetchMmwave():e.has("hass")&&this.hass&&this.data&&!this._mm&&!this._mmLoading&&this._fetchMmwave()}async _fetchMmwave(){if(!this._mmLoading){this._mmLoading=!0;try{let e=await this.ws("jarvis/mmwave_overview");this._mm={rooms:Array.isArray(e?.rooms)?e.rooms:[],summary:e?.summary||{rooms_with_mmwave:0,rooms_detecting:0,total_sensors:0}},this._mmError=null}catch(e){this._mmError=Y.from("jarvis/mmwave_overview",e).message}finally{this._mmLoading=!1}}}get _config(){return this.data?.config||{}}get _styleId(){return this._styleOverride??Jr(this._config.residence_style).id}_floorAvailable(e){if(e==="all")return!0;let t=this._config;return e==="2f"&&String(t.home_stories??"1.5")==="1"||e==="bsmt"&&t.has_basement===!1?!1:(this._plan[e]||[]).length>0}_reducedMotion(){try{return typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches}catch{return!1}}_sceneSvg(){let e={...this._config,residence_style:this._styleId},t=na(e),n=ea(Qs(e.floor_plan_elements),this.hass),s=ta(e,this.hass),o=this._floor==="bsmt"?"b":this._floor,l=Ys(this),d=JSON.stringify(t)+"|"+JSON.stringify(n)+"|"+JSON.stringify(s),u=o+"|"+d+"|"+this._planJson;u!==this._boxKey&&(this._box=Vs({floor:o,spec:t,plan:this._plan,elements:n,garage:s,palette:l}),this._boxKey=u);let p=Bu(this.data,this._mm),v=!this._reducedMotion(),f=[this._theta.toFixed(1),u,JSON.stringify(p),Xs(this),v].join("|");return f!==this._svgKey&&(this._svg=Gs({theta:this._theta,floor:o,lit:p,box:this._box,spec:t,plan:this._plan,elements:n,garage:s,palette:l,idPrefix:"j3d",animate:v}),this._svgKey=f),this._svg}_setFloor(e){this._floor=e}_setPreset(e){this._theta=e,this._preset=e,this.requestUpdate()}_rotateBy(e){this._theta-=e,this._preset=null,this._raf||(this._raf=requestAnimationFrame(()=>{this._raf=0,this.requestUpdate()}))}_onPointerDown(e){if(e.pointerType==="mouse"&&e.button!==0)return;this._drag={id:e.pointerId,x:e.clientX},this._dragging=!0;let t=e.currentTarget;try{t?.setPointerCapture?.(e.pointerId)}catch{}}_onPointerMove(e){if(!this._drag||e.pointerId!==this._drag.id)return;let t=e.clientX-this._drag.x;this._drag.x=e.clientX,t&&this._rotateBy(t*.5)}_onPointerUp(e){!this._drag||e.pointerId!==this._drag.id||(this._drag=null,this._dragging=!1)}_onSceneKey(e){if(e.key==="ArrowLeft")this._rotateBy(-15);else if(e.key==="ArrowRight")this._rotateBy(15);else if(e.key==="Home")this._setPreset(35);else return;e.preventDefault()}async _onStyleChange(e){let t=Jr(e).id;if(!e||t===this._styleId||this._styleBusy)return;let n=this._styleId;this._styleOverride=t,this._styleBusy=!0,this._styleError=null;try{await this.ws("jarvis/update_config",{key:"residence_style",value:t}),this._toast(a("Home style → {label}",{label:a(Jr(t).label)})),this.refresh()}catch(s){this._styleOverride=n,this._styleError=`residence_style — ${Y.from("jarvis/update_config",s).message}`}finally{this._styleBusy=!1}}_toast(e){this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:e}}))}render(){return this.subPath.split("/")[0]==="editor"?c`<jarvis-plan-editor .hass=${this.hass} .narrow=${this.narrow} .data=${this.data} .route=${this.route}></jarvis-plan-editor>`:this.data?c`
      <div class="res">
        ${this._renderOverview()}
        ${this._renderMmwave()}
      </div>
    `:c`
        <div class="res">
          <jv-section .heading=${a("Residence Overview")} icon="mdi:floor-plan" loading>
            <jv-empty kind="loading" .message=${a("Loading...")}></jv-empty>
          </jv-section>
          <jv-section .heading=${a("mmWave Presence")} icon="mdi:motion-sensor" loading>
            <jv-empty kind="loading" .message=${a("Reading sensors…")}></jv-empty>
          </jv-section>
        </div>
      `}_renderOverview(){let e=this.data?.areas||[],t=e.filter(s=>s.active).length,n=e.length;return c`
      <jv-section .heading=${a("Residence Overview")} icon="mdi:floor-plan">
        <jv-state-badge slot="actions" level=${t>0?"ok":"neutral"} .label=${`${t}/${n} ${a("OCCUPIED")}`}></jv-state-badge>
        <div class="wrap">
        ${this._styleError?c`<div class="err" role="alert">✗ ${this._styleError}</div>`:m}
        <div class="controls">
          ${this._renderStyleSelect()}
          <fieldset class="seg" aria-label=${a("Floor")}>
            ${["all","1f","2f","bsmt"].filter(s=>this._floorAvailable(s)).map(s=>c`<button type="button" class="jv-hit" aria-pressed=${String(this._floor===s)} @click=${()=>this._setFloor(s)}>${a(jb[s])}</button>`)}
          </fieldset>
          <fieldset class="seg" aria-label=${a("View")}>
            ${$b.map(s=>c`<button type="button" class="jv-hit" aria-pressed=${String(this._preset===s.theta)} @click=${()=>this._setPreset(s.theta)}>${a(s.label)}</button>`)}
          </fieldset>
          <span class="hint" aria-hidden="true">${a("drag to rotate")}</span>
          <button type="button" class="jv-btn" @click=${()=>this.navigate("residence","editor")}>${a("Edit floor plan")}</button>
          <span class="visually-hidden" id="drag-hint">${a("Drag with the pointer or use the left and right arrow keys to rotate the model; Home resets the view.")}</span>
        </div>
        ${this._renderScene()}
        ${this._planConfigured?m:c`<p class="planhint">
              <span>${a("No floor plan yet — the model shows a sample home. Import your plan to see your rooms.")}</span>
              <a href=${xb} target="_blank" rel="noopener noreferrer">${a("Import a floor plan")}</a>
            </p>`}
        ${this._renderDominant()}
        </div>
      </jv-section>
    `}_renderStyleSelect(){let e=this._styleId,t=a("HOME STYLE");return x("ha-select")&&x("ha-list-item")?c`
        <ha-select
          .label=${t}
          .value=${e}
          .disabled=${this._styleBusy}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${n=>this._onStyleChange(String(n.target.value))}
          @closed=${n=>n.stopPropagation()}
        >
          ${br.map(n=>c`<ha-list-item .value=${n.id}>${a(n.label)}</ha-list-item>`)}
        </ha-select>
      `:c`
      <label class="field">
        <span>${t}</span>
        <select .value=${e} ?disabled=${this._styleBusy} @change=${n=>this._onStyleChange(n.target.value)}>
          ${br.map(n=>c`<option value=${n.id} ?selected=${n.id===e}>${a(n.label)}</option>`)}
        </select>
      </label>
    `}_renderScene(){let e=this.hass?.config||{},t=xe(e.latitude),n=xe(e.longitude),s=typeof e.location_name=="string"&&e.location_name||(t!=null&&n!=null?`${t.toFixed(4)}, ${n.toFixed(4)}`:a("ADDRESS NOT SET")),o=this._config,l=this.data?.areas||[],d=zu(o,this._editorPlan),u=xe(o.home_bedrooms),p=xe(o.home_bathrooms),v=u??(l.filter(_=>_.bedroom).length||this.data?.meta?.bedrooms||0),f=p??l.filter(_=>/bath/i.test(_.name||"")).length,g=l.filter(_=>_.active).length,y=a(Jr(this._styleId).label).toUpperCase();return c`
      <div
        class="scene ${this._dragging?"dragging":""}"
        role="group"
        tabindex="0"
        aria-label=${a("3D model of the home")}
        aria-describedby="drag-hint"
        aria-keyshortcuts="ArrowLeft ArrowRight Home"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
        @keydown=${this._onSceneKey}
      >
        ${Hs(this._sceneSvg())}
        <div class="overlay banner">${a("PROPERTY")} · <strong>${s}</strong></div>
        <div class="overlay stats">
          <div class="stat sqft"><div class="k">${a("EST SQ FT")}</div><div class="v">${d?`~${d.toLocaleString()}`:"—"}</div></div>
          <div class="stat"><div class="k">${a("BED / BATH")}</div><div class="v">${v} / ${f||"—"}</div></div>
          <div class="stat style"><div class="k">${a("STYLE")}</div><div class="v">${y}</div></div>
          <div class="stat"><div class="k">${a("OCCUPIED")}</div><div class="v">${g} / ${l.length}</div></div>
        </div>
      </div>
    `}_renderDominant(){let e=this.data?.dominant;if(!e)return m;let t=parseFloat(String(e.temp)),n=parseFloat(String(e.humidity)),s=Number.isFinite(t)?Math.max(0,Math.min(1,(t-50)/40)):0,o=Number.isFinite(n)?Math.max(0,Math.min(1,n/100)):0,l=/on|^[1-9]/i.test(String(e.lights||"")),d=(p,v,f,g,y,_)=>c`
      <div class="gauge ${p} ${y?"dim":""}" role="img" aria-label=${`${g}: ${f}`}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle class="track" cx="32" cy="32" r=${dc}></circle>
          <circle
            class="arc"
            cx="32"
            cy="32"
            r=${dc}
            transform="rotate(-90 32 32)"
            stroke-dasharray=${zh.toFixed(1)}
            stroke-dashoffset=${(zh*(1-v)).toFixed(1)}
            style=${_?`stroke:${_}`:""}
          ></circle>
        </svg>
        <div class="val">${f}</div>
        <div>${g}</div>
      </div>
    `,u=`color-mix(in srgb, var(--jv-warn) ${Math.round(s*100)}%, var(--jv-accent))`;return c`
      <div class="dom" aria-live="polite">
        <div>
          <div class="name">${a(e.name||"—")}</div>
          <div class="jv-muted">${a(e.subtitle||"")}</div>
        </div>
        <div class="gauges">
          ${d("temp",s,e.temp||"—",a("Temp"),!1,u)}
          ${d("hum",o,e.humidity||"—",a("Humidity"),!1)}
          ${d("lite",l?1:.04,l?a("ON"):a("OFF"),a("Lights"),!l)}
        </div>
      </div>
    `}_renderMmwave(){let e=this._mm,t=e?.summary,n=this._mmLoading&&!e?a("SCAN"):t&&t.rooms_with_mmwave?`${t.rooms_detecting||0}/${t.rooms_with_mmwave} ${a("OCCUPIED")}`:a("NONE"),s=t&&t.rooms_detecting?"ok":"neutral",o;return this._mmError&&!e?o=c`
        <jv-empty kind="error" compact icon="mdi:motion-sensor-off" .heading=${a("Couldn't read sensors — restart Home Assistant after updating, then reopen.")} .message=${this._mmError}>
          <button slot="action" class="jv-btn" type="button" @click=${()=>this._fetchMmwave()}>${a("Retry")}</button>
        </jv-empty>
      `:e?e.rooms.length?o=c`
        <ul class="mm-list">
          ${e.rooms.map(l=>{let d=l.detecting_count>0,u=l.sensor_count>1?a("{n}/{m} sensors",{n:l.detecting_count,m:l.sensor_count}):a("{n} sensor",{n:l.sensor_count}),p=`${d?a("OCCUPIED"):a("clear")} · ${u} · ${d?a("now"):l.freshest||"—"}`,v=c`
              <span class="mm-dot ${d?"jv-pulse":""}" aria-hidden="true"></span>
              <span class="mm-body">
                <span class="mm-name">${l.name} ${l.outdoor?c`<jv-state-badge level="info" nodot .label=${a("OUT")}></jv-state-badge>`:m}</span>
                <div class="mm-meta">${p}</div>
              </span>
            `;return c`<li class="mm-room ${d?"on":""}">
              ${l.sensors?.length?c`<details>
                    <summary>${v}</summary>
                    <ul class="mm-sensors">
                      ${l.sensors.map(f=>c`<li><span class=${f.detecting?"on":""}>${f.name}</span><span class="jv-mono">${f.detecting?a("now"):f.age}</span></li>`)}
                    </ul>
                  </details>`:c`<div class="row">${v}</div>`}
            </li>`})}
        </ul>
        ${this._mmError?c`<p class="mm-state" role="status">${this._mmError}</p>`:m}
      `:o=c`<jv-empty compact icon="mdi:motion-sensor" .message=${a("No presence, motion, or mmWave sensors found. Assign occupancy sensors to areas in Home Assistant and they'll appear here.")}></jv-empty>`:o=c`<jv-empty kind="loading" compact .message=${a("Reading sensors…")}></jv-empty>`,c`
      <jv-section .heading=${a("mmWave Presence")} icon="mdi:motion-sensor" ?loading=${this._mmLoading}>
        <jv-state-badge slot="actions" level=${s} .label=${n} ?pulse=${s==="ok"}></jv-state-badge>
        <p class="subtext">${a("Live occupancy per room from presence / motion / mmWave sensors — the ground truth behind the floor-plan glow.")}</p>
        ${o}
      </jv-section>
    `}};st.styles=[T,Bh],h([b()],st.prototype,"_floor",2),h([b()],st.prototype,"_preset",2),h([b()],st.prototype,"_dragging",2),h([b()],st.prototype,"_mm",2),h([b()],st.prototype,"_mmLoading",2),h([b()],st.prototype,"_mmError",2),h([b()],st.prototype,"_styleBusy",2),h([b()],st.prototype,"_styleOverride",2),h([b()],st.prototype,"_styleError",2),st=h([A("jarvis-view-residence")],st);var jb={all:"All","1f":"1st Floor","2f":"2nd Floor",bsmt:"Basement"};function tr(r){return typeof r=="number"&&Number.isFinite(r)?`${Math.round(r*100)}%`:"—"}function et(r){return typeof r=="number"&&Number.isFinite(r)?String(r):"0"}function Uh(r,i=Date.now()){let e=Math.max(0,Math.round((i/1e3-r)/60));return e<60?a("{n}m ago",{n:e}):e<1440?a("{n}h ago",{n:Math.round(e/60)}):a("{n}d ago",{n:Math.round(e/1440)})}function qh(r,i){try{return r.toLocaleTimeString(i||void 0,{hour:"2-digit",minute:"2-digit",second:"2-digit"})}catch{return r.toTimeString().slice(0,8)}}var Tr="All",Kh=["CONV","LOCAL","AGENT","GATE","DEDUP","CLASSIFY","CAMERA","ROUTE","ERROR"];function Wh(r){let i=new Set;for(let n of r)n.cat&&i.add(n.cat);let e=Kh.filter(n=>i.has(n)),t=[...i].filter(n=>!Kh.includes(n)).sort((n,s)=>n.localeCompare(s));return[...e,...t]}function Gh(r){switch(r){case"ERROR":return"danger";case"AGENT":case"LOCAL":case"CONV":return"accent";case"GATE":case"DEDUP":return"muted";default:return"default"}}function Vh(r){return r.cat==="ERROR"||/error|failed/i.test(r.msg||"")}function Wa(r,...i){if(!r)return!0;let e=r.toLowerCase();return i.some(t=>(t||"").toLowerCase().includes(e))}function Ga(r,i){let e=new Map;return r.map(t=>{let n=i(t),s=e.get(n)??0;return e.set(n,s+1),{key:s?`${n}#${s}`:n,item:t}})}var fn=S`
  :host {
    display: block;
    min-width: 0;
  }
  .search {
    width: 100%;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  .search::placeholder {
    color: var(--jv-text-3);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
  }
  .chip {
    appearance: none;
    min-height: 32px;
    padding: 0 var(--jv-space-3);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-pill);
    background: var(--jv-surface);
    color: var(--jv-text-2);
    font: inherit;
    font-size: var(--jv-font-size-s);
    font-weight: var(--jv-font-weight-medium);
    cursor: pointer;
    transition: background-color var(--jv-ease);
  }
  .chip:hover {
    background: var(--jv-hover);
  }
  /* 32 px chip, 44 px hit box (DESIGN.md §3) */
  .chip {
    position: relative;
  }
  .chip::before {
    content: "";
    position: absolute;
    inset: calc((var(--jv-tap) - 100%) / -2) 0;
  }
  .chip[aria-pressed="true"] {
    background: var(--jv-accent-soft);
    border-color: var(--jv-accent);
    color: var(--jv-text);
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: var(--jv-space-2);
    min-height: 28px;
    padding: var(--jv-space-1) var(--jv-space-4);
    border-left: 3px solid transparent;
    font-size: var(--jv-font-size-s);
    line-height: 1.45;
  }
  .row + .row {
    border-top: 1px solid var(--jv-divider);
  }
  .row.err {
    background: var(--jv-danger-soft);
    border-left-color: var(--jv-danger);
  }
  .row time {
    flex: none;
    color: var(--jv-text-2);
    font-family: var(--jv-font-code);
    font-variant-numeric: tabular-nums;
  }
  .row .msg {
    flex: 1 1 auto;
    min-width: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .day {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: var(--jv-space-1) var(--jv-space-4);
    background: var(--jv-surface-2);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-xs);
    font-weight: var(--jv-font-weight-medium);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .state {
    padding: var(--jv-space-4);
    color: var(--jv-text-2);
    text-align: center;
  }
  .banner {
    display: flex;
    align-items: flex-start;
    gap: var(--jv-space-2);
    margin: 0 var(--jv-space-4) var(--jv-space-3);
    padding: var(--jv-space-2) var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    border-left: 4px solid var(--jv-danger);
    background: var(--jv-danger-soft);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  ha-alert {
    display: block;
    margin: 0 var(--jv-space-4) var(--jv-space-3);
  }
  .controls {
    display: grid;
    gap: var(--jv-space-3);
    padding: 0 var(--jv-space-4) var(--jv-space-3);
  }
  .sub {
    margin: 0;
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  h3 {
    margin: var(--jv-space-4) 0 var(--jv-space-2);
    font-size: var(--jv-font-size-m);
    font-weight: var(--jv-font-weight-medium);
  }
  /* "RUN CHECK" (an existing i18n key) rendered in sentence case */
  .sentence {
    display: block;
    text-transform: lowercase;
  }
  .sentence::first-letter {
    text-transform: uppercase;
  }
`;var kb=40,Sb=200,Gt=class extends L{constructor(){super(...arguments);this.entries=null;this.error=null;this.narrow=!1;this._cat=Tr;this._query="";this._debounce=null;this._prevTop=0;this._prevHeight=0;this._pendingScroll=null;this._newest=[];this._newestSrc=null}connectedCallback(){super.connectedCallback(),P(this,["ha-alert"])}disconnectedCallback(){super.disconnectedCallback(),this._debounce&&clearTimeout(this._debounce),this._debounce=null}get _all(){let e=this.entries??[];return e!==this._newestSrc&&(this._newestSrc=e,this._newest=[...e].reverse()),this._newest}_filtered(){let e=this._cat,t=this._query.trim();return this._all.filter(n=>(e===Tr||n.cat===e)&&Wa(t,n.msg,n.cat))}willUpdate(e){let t=e.has("_cat")||e.has("_query");if(!t&&!e.has("entries"))return;let n=this._scroll;this._prevTop=n?.scrollTop??0,this._prevHeight=n?.scrollHeight??0,this._pendingScroll=t||this._prevTop<=kb?"top":"keep"}updated(){let e=this._pendingScroll;this._pendingScroll=null;let t=this._scroll;if(!e||!t)return;if(e==="top"){t.scrollTop!==0&&(t.scrollTop=0);return}let n=t.scrollHeight-this._prevHeight;n&&(t.scrollTop=this._prevTop+n)}_onSearch(e){let t=e.target.value;this._debounce&&clearTimeout(this._debounce),this._debounce=setTimeout(()=>{this._debounce=null,this._query=t},Sb)}_emptyText(e,t){if(e===0)return a("No entries yet. Talk to JARVIS to generate log entries.");let n=a("No entries match");return t&&(n+=` "${t}"`),this._cat!==Tr&&(n+=` in ${this._cat}`),`${n}.`}_renderError(){if(!this.error)return m;let e=`${a("Error loading logs:")} ${this.error}`;return x("ha-alert")?c`<ha-alert alert-type="error">${e}</ha-alert>`:c`<div class="banner" role="alert">${e}</div>`}_renderRows(e){let t="";return _e(Ga(e,n=>`${n.date} ${n.ts} ${n.cat} ${n.msg}`),n=>n.key,({item:n})=>{let s=n.date&&n.date!==t?c`<li class="day" role="presentation">${n.date}</li>`:m;return t=n.date,c`
          ${s}
          <li class="row ${Vh(n)?"err":""}" title=${n.date||m}>
            <time>${n.ts}</time>
            <span class="cat ${Gh(n.cat)}">${n.cat}</span>
            <span class="msg">${n.msg}</span>
          </li>
        `})}render(){let e=this.entries!==null,t=this._all,n=this._query.trim(),s=this._filtered(),o=n!==""||this._cat!==Tr,l=e?o?a("{shown} of {total}",{shown:s.length,total:t.length}):a("{n} entries",{n:t.length}):"",d=[Tr,...Wh(t)];return c`
      <jv-section .heading=${a("System Log")} icon="mdi:text-box-search-outline" flush .loading=${!e&&!this.error}>
        ${l?c`<jv-state-badge slot="actions" nodot level="neutral" .label=${l}></jv-state-badge>`:m}
        <div class="controls">
          <label class="visually-hidden" for="q">${a("Search log…")}</label>
          <input id="q" class="search" type="search" placeholder=${a("Search log…")} autocomplete="off" @input=${this._onSearch} />
          <div class="chips" role="group" aria-label=${a("Filter by category")}>
            ${d.map(u=>c`
                <button
                  class="chip"
                  type="button"
                  aria-pressed=${u===this._cat?"true":"false"}
                  @click=${()=>{this._cat=u}}
                >
                  ${u===Tr?a("All"):u}
                </button>
              `)}
          </div>
        </div>
        ${this._renderError()}
        <div class="scroll" role="region" tabindex="0" aria-label=${a("System Log")}>
          ${!e&&!this.error?c`<div class="state" role="status">${a("Loading...")}</div>`:s.length===0?c`<div class="state">${this._emptyText(t.length,n)}</div>`:c`<ul class="list jv-mono">${this._renderRows(s)}</ul>`}
        </div>
      </jv-section>
    `}};Gt.styles=[T,fn,S`
      .scroll {
        max-height: max(320px, calc(100vh - 300px));
        overflow: auto;
        overscroll-behavior: contain;
        border-top: 1px solid var(--jv-divider);
      }
      :host([narrow]) .scroll {
        max-height: 55vh;
      }
      .cat {
        flex: none;
        min-width: 56px;
        padding: 0 6px;
        border-radius: var(--jv-radius-sm);
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        font-weight: var(--jv-font-weight-medium);
        line-height: 18px;
        text-align: center;
      }
      .cat.danger {
        background: var(--jv-danger-soft);
        color: var(--jv-danger-text);
      }
      .cat.accent {
        background: var(--jv-accent-soft);
        color: var(--jv-accent-text);
      }
      .cat.muted {
        opacity: 0.7;
      }
      .row .msg {
        font-family: var(--jv-font-code);
      }
    `],h([$({attribute:!1})],Gt.prototype,"entries",2),h([$({type:String})],Gt.prototype,"error",2),h([$({type:Boolean,reflect:!0})],Gt.prototype,"narrow",2),h([b()],Gt.prototype,"_cat",2),h([b()],Gt.prototype,"_query",2),h([me(".scroll")],Gt.prototype,"_scroll",2),Gt=h([A("jv-logs-system")],Gt);var Eb=200;function Rb(r){switch((r||"").toLowerCase()){case"critical":return"u-critical";case"high":return"u-high";case"medium":return"u-medium";case"muted":return"u-muted";default:return"u-low"}}var nr=class extends L{constructor(){super(...arguments);this.entries=null;this.error=null;this._query="";this._debounce=null}connectedCallback(){super.connectedCallback(),P(this,["ha-alert"])}disconnectedCallback(){super.disconnectedCallback(),this._debounce&&clearTimeout(this._debounce),this._debounce=null}_onSearch(e){let t=e.target.value;this._debounce&&clearTimeout(this._debounce),this._debounce=setTimeout(()=>{this._debounce=null,this._query=t},Eb)}_renderError(){if(!this.error)return m;let e=a("Could not load the log.");return x("ha-alert")?c`<ha-alert alert-type="error" .title=${e}>${this.error}</ha-alert>`:c`<div class="banner" role="alert" title=${this.error}>${e} ${this.error}</div>`}render(){let e=this.entries!==null,t=this.entries??[],n=this._query.trim(),s=n?t.filter(l=>Wa(n,l.msg,l.tag)):t,o=e?n?a("{shown} of {total}",{shown:s.length,total:t.length}):a("Last {total}",{total:t.length}):"";return c`
      <jv-section .heading=${a("Activity Feed")} icon="mdi:history" flush .loading=${!e&&!this.error}>
        ${o?c`<jv-state-badge slot="actions" nodot level="neutral" .label=${o}></jv-state-badge>`:m}
        <div class="controls">
          <label class="visually-hidden" for="q">${a("Search activity…")}</label>
          <input id="q" class="search" type="search" placeholder=${a("Search activity…")} autocomplete="off" @input=${this._onSearch} />
        </div>
        ${this._renderError()}
        <div class="scroll">
          ${!e&&!this.error?c`<div class="state" role="status">${a("Loading...")}</div>`:s.length===0?c`<div class="state">
                  ${t.length===0?a("No activity yet. Enable announcements or observer to see events here."):a('No events match "{q}".',{q:n})}
                </div>`:c`
                  <ul class="list">
                    ${_e(Ga(s,l=>`${l.ts} ${l.tag??""} ${l.msg??""}`),l=>l.key,({item:l})=>c`
                        <li class="row ${Rb(l.urgency)}" title=${l.source||m}>
                          <time>${l.ts}</time>
                          ${l.tag?c`<span class="tag">${l.tag}</span>`:m}
                          <span class="msg">${l.msg||""}</span>
                        </li>
                      `)}
                  </ul>
                `}
        </div>
      </jv-section>
    `}};nr.styles=[T,fn,S`
      .scroll {
        max-height: 420px;
        overflow: auto;
        border-top: 1px solid var(--jv-divider);
      }
      .row {
        align-items: flex-start;
        min-height: 36px;
        padding-top: var(--jv-space-2);
        padding-bottom: var(--jv-space-2);
      }
      .row.u-critical {
        border-left-color: var(--jv-danger);
      }
      .row.u-high {
        border-left-color: var(--jv-warn);
      }
      .row.u-medium {
        border-left-color: var(--jv-accent);
      }
      .row.u-low {
        border-left-color: var(--jv-neutral);
      }
      .row.u-muted {
        border-left-color: var(--jv-neutral);
        opacity: 0.6;
      }
      .tag {
        flex: none;
        max-width: 40%;
        font-weight: var(--jv-font-weight-bold);
        font-size: var(--jv-font-size-xs);
        letter-spacing: 0.02em;
        overflow-wrap: anywhere;
      }
    `],h([$({attribute:!1})],nr.prototype,"entries",2),h([$({type:String})],nr.prototype,"error",2),h([b()],nr.prototype,"_query",2),nr=h([A("jv-logs-activity")],nr);function Ab(r){switch(r){case"ok":return"ok";case"warn":return"warn";case"down":return"danger";default:return"neutral"}}function Cb(r){switch(r){case"ok":return{label:a("OK"),level:"ok"};case"idle":return{label:a("IDLE"),level:"neutral"};case"warn":return{label:a("WARN"),level:"warn"};case"down":return{label:a("DOWN"),level:"danger"};case"off":return{label:a("OFF"),level:"neutral"};default:return{label:"?",level:"neutral"}}}var gn=class extends L{constructor(){super(...arguments);this._diag=null;this._calib=null;this._error=null;this._running=!1;this._ran=!1}connectedCallback(){super.connectedCallback(),P(this,["ha-icon"])}willUpdate(e){e.has("hass")&&this.hass&&!this._ran&&this.run()}async run(){if(!this.hass||this._running)return;this._ran=!0,this._running=!0;let[e,t]=await Promise.allSettled([X(this.hass,"jarvis/diagnostics"),X(this.hass,"jarvis/get_calibration")]);if(e.status==="fulfilled")this._diag=e.value??{},this._error=null;else{let n=Y.from("jarvis/diagnostics",e.reason);this._error=n.message||n.code}this._calib=t.status==="fulfilled"?t.value??{}:{error:String(t.reason)},this._running=!1}_renderBadge(){if(this._error)return c`<jv-state-badge slot="actions" nodot level="neutral" label="—"></jv-state-badge>`;let e=this._diag;if(!e)return m;let t=e.summary||(e.overall||"").toUpperCase();return t?c`<jv-state-badge slot="actions" level=${Ab(e.overall)} .label=${t}></jv-state-badge>`:m}_renderServices(e){let t=Array.isArray(e.services)?e.services:[];return t.length===0?c`<p class="sub">${e.summary||""}</p>`:c`
      <ul class="services">
        ${t.map(n=>{let s=Cb(String(n.status));return c`
            <li class="service">
              <span class="name">${n.name}</span>
              <jv-state-badge level=${s.level} .label=${s.label}></jv-state-badge>
              ${n.detail?c`<span class="detail">${n.detail}</span>`:m}
            </li>
          `})}
      </ul>
    `}_renderCalibration(e){if(!e)return m;let t=e.calibration??{},n=t.n??0,s=c`<h3>${a("Judgment calibration")}</h3>`;if(e.error||n===0)return c`${s}
        <p class="sub">${a("No judged decisions yet — this appears once JARVIS's decisions accrue outcomes.")}</p>`;let o=(t.bins??[]).filter(v=>(v.count??0)>0),l=e.interruption_budget??{},d=l.judged??0,u=e.suggestion_threshold,p=v=>typeof v=="number"?v.toFixed(3):"—";return c`
      ${s}
      <div class="meta">${a("Brier {brier} · ECE {ece} · n={n}",{brier:p(t.brier),ece:p(t.ece),n})}</div>
      ${o.length?c`<div class="bins">
            ${o.map(v=>c`
                <div class="bin">
                  <span class="label">${tr(v.lo)}–${tr(v.hi)}</span>
                  <div class="bar" role="img" aria-label=${tr(v.good_rate)}>
                    <div class="fill" style="width:${Math.round((v.good_rate??0)*100)}%"></div>
                  </div>
                  <span class="meta">${a("{rate} good · n={count}",{rate:tr(v.good_rate),count:et(v.count)})}</span>
                </div>
              `)}
          </div>`:m}
      <p class="line">
        ${d>0?c`${a("Interruption budget: {assessment} — {rate} of {judged} recent decisions dismissed (cap ×{multiplier}).",{assessment:a(l.assessment||"no data"),rate:tr(l.unwelcome_rate),judged:d,multiplier:et(l.multiplier??1)})}`:a("Interruption budget: no recent judged decisions.")}
      </p>
      ${u&&Math.abs(u.learned_delta)>.001?c`<p class="line">
            ${a("Suggestion bar {dir} to {effective} (from {base}) based on recent usefulness.",{dir:u.learned_delta>0?a("raised"):a("lowered"),effective:tr(u.effective),base:tr(u.base)})}
          </p>`:m}
    `}render(){let e=this._running,t=!this._diag&&!this._error;return c`
      <jv-section
        .heading=${a("System Diagnostics")}
        .subheading=${a('Health of the core services JARVIS calls — LLM, embeddings, speech. A quick "is everything up?" check.')}
        icon="mdi:stethoscope"
        .loading=${e}
      >
        ${this._renderBadge()}
        ${t&&e?c`<div class="state" role="status">${a("Loading...")}</div>`:this._error?c`<div class="error" role="alert">
                ${a("Couldn't run diagnostics — restart Home Assistant after updating.")}
                <span class="detail">${this._error}</span>
              </div>`:this._diag?this._renderServices(this._diag):m}
        ${this._renderCalibration(this._calib)}
        <div class="actions">
          <button class="jv-btn" type="button" ?disabled=${e||!this.hass} @click=${()=>{this.run()}}>
            ${x("ha-icon")?c`<ha-icon icon="mdi:refresh" aria-hidden="true"></ha-icon>`:m}
            ${e?c`<span>${a("Checking…")}</span>`:c`<span class="sentence">${a("RUN CHECK")}</span>`}
          </button>
        </div>
      </jv-section>
    `}};gn.styles=[T,fn,S`
      .services {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .service {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0 var(--jv-space-3);
        padding: var(--jv-space-2) 0;
        border-bottom: 1px solid var(--jv-divider);
      }
      .service:last-child {
        border-bottom: 0;
      }
      .service .name {
        font-weight: var(--jv-font-weight-medium);
      }
      .service .detail {
        grid-column: 1 / -1;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: var(--jv-space-3);
      }
      .meta {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .bins {
        display: grid;
        gap: var(--jv-space-1);
        margin: var(--jv-space-2) 0;
      }
      .bin {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--jv-space-2);
        font-size: var(--jv-font-size-s);
      }
      .bin .label {
        font-family: var(--jv-font-code);
        font-variant-numeric: tabular-nums;
        color: var(--jv-text-2);
      }
      .bar {
        height: 8px;
        border-radius: var(--jv-radius-pill);
        background: var(--jv-neutral-soft);
        overflow: hidden;
      }
      .bar .fill {
        height: 100%;
        border-radius: inherit;
        background: var(--jv-ok);
      }
      .line {
        margin: var(--jv-space-2) 0 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .line strong {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-medium);
      }
      .error {
        color: var(--jv-text);
      }
      .error .detail {
        display: block;
        margin-top: var(--jv-space-1);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
    `],h([$({attribute:!1})],gn.prototype,"hass",2),h([b()],gn.prototype,"_diag",2),h([b()],gn.prototype,"_calib",2),h([b()],gn.prototype,"_error",2),h([b()],gn.prototype,"_running",2),gn=h([A("jv-logs-diagnostics")],gn);var hi=class extends L{constructor(){super(...arguments);this.status=null}_tile(e,t){return c`<div class="tile"><span class="v">${t}</span><span class="k">${e}</span></div>`}render(){let e=this.status,t=e!==null,n=!!e?.running&&!e?.error,s=e?.learning??{},o=e?.last_analysis??{};return c`
      <jv-section .heading=${a("Cognitive Core")} icon="mdi:brain" .loading=${!t}>
        ${t?c`<jv-state-badge
              slot="actions"
              level=${n?"ok":"neutral"}
              .label=${n?a("Running"):a("Stopped")}
            ></jv-state-badge>`:m}
        ${t?c`
              <div class="grid">
                ${this._tile(a("Data"),`${et(s.days_of_data)}d`)}
                ${this._tile(a("States"),et(s.state_changes))}
                ${this._tile(a("Cmds"),et(s.commands))}
                ${this._tile(a("Suggestions"),et(s.suggestions))}
                ${this._tile(a("Ignores"),et(e?.ignore_rules))}
              </div>
              <ul class="secondary">
                <li>${a("Uptime")} <b>${et(e?.uptime_hours)}h</b></li>
                <li>${a("Ticks")} <b>${et(e?.tick_count)}</b></li>
                <li>${a("Autonomous")} <b>${et(e?.autonomous_actions)}</b></li>
                <li>${a("Offers")} <b>${et(e?.offers_made)}</b></li>
              </ul>
              <p class="line">
                ${o.ts?a("Last analysis: {ago} · {found} found, {stored} stored",{ago:Uh(o.ts),found:et(o.patterns_found),stored:et(o.new_suggestions)}):a("Last analysis: not yet this session")}
              </p>
              ${e?.error?c`<p class="sub">${e.error}</p>`:m}
            `:c`<div class="state" role="status">${a("Loading...")}</div>`}
      </jv-section>
    `}};hi.styles=[T,fn,S`
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
        gap: var(--jv-space-2);
      }
      .tile {
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface-2);
        min-width: 0;
      }
      .tile .v {
        display: block;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      .tile .k {
        display: block;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-xs);
      }
      .secondary {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1) var(--jv-space-4);
        margin: var(--jv-space-3) 0 0;
        padding: 0;
        list-style: none;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .secondary b {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-medium);
        font-variant-numeric: tabular-nums;
      }
      .line {
        margin: var(--jv-space-3) 0 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
    `],h([$({attribute:!1})],hi.prototype,"status",2),hi=h([A("jv-logs-cognitive")],hi);var rr=class extends L{constructor(){super(...arguments);this.switches=null;this.error=null}connectedCallback(){super.connectedCallback(),P(this,["ha-alert"])}_openSettings(){this.dispatchEvent(new CustomEvent("jarvis-navigate",{bubbles:!0,composed:!0,detail:{view:"settings",path:"governance/tool:governance"}}))}_renderCount(e,t,n,s){return n?c`
      <li>
        <span class="lbl">${e}</span>
        <jv-state-badge nodot .level=${s} .label=${a("{on} of {total} ON",{on:t,total:n})}></jv-state-badge>
      </li>
    `:m}_renderBody(){if(this.error){let d=a("Couldn't load governance switches — {message}",{message:this.error});return x("ha-alert")?c`<ha-alert alert-type="error">${d}</ha-alert>`:c`<div class="banner" role="alert">${d}</div>`}if(this.switches===null)return c`<div class="state" role="status">${a("Loading governance switches…")}</div>`;if(this.switches.length===0)return c`<p class="sub">${a("No governance switches reported.")}</p>`;let e=this.switches.filter(d=>d.category==="capability"),t=this.switches.filter(d=>d.category==="safety"),n=d=>d.filter(u=>!!u.enabled).length,s=this.switches.filter(d=>d.overridden).length,o=t.length-n(t),l=this.switches.filter(d=>!!d.enabled!=!!d.default);return c`
      <ul class="counts">
        ${this._renderCount(a("Owner opt-in capabilities"),n(e),e.length,"neutral")}
        ${this._renderCount(a("Safety & governance — kill-switches (keep ON)"),n(t),t.length,o?"warn":"ok")}
        <li>
          <span class="lbl">${a("Owner overrides")}</span>
          <jv-state-badge nodot .level=${s?"warn":"neutral"} .label=${String(s)}></jv-state-badge>
        </li>
      </ul>
      ${l.length?c`
            <p class="sub">${a("Not at the shipped default:")}</p>
            <ul class="changed">
              ${l.map(d=>c`<li><span class="name">${d.name}</span> — ${d.enabled?a("ON"):a("OFF")} (${d.default?a("default: ON"):a("default: OFF")})</li>`)}
            </ul>
          `:c`<p class="sub">${a("Every switch is at its shipped default.")}</p>`}
    `}render(){return c`
      <jv-section .heading=${a("Governance")} icon="mdi:shield-check-outline" .loading=${this.switches===null&&!this.error}>
        <jv-state-badge slot="actions" nodot level="accent" .label=${a("Enforcement")}></jv-state-badge>
        <p class="intro">${a("The kernel's enforcement kill-switches, read-only here. Turn them on or off in Settings › Governance.")}</p>
        ${this._renderBody()}
        <div class="actions">
          <button type="button" class="jv-btn" @click=${()=>this._openSettings()}>${a("Change in Settings")}</button>
        </div>
      </jv-section>
    `}};rr.styles=[T,fn,S`
      .intro {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .counts {
        list-style: none;
        margin: 0 0 var(--jv-space-3);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .counts li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        border-top: 1px solid var(--jv-divider);
        padding-top: var(--jv-space-2);
      }
      .counts .lbl {
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .changed {
        margin: 0 0 var(--jv-space-3);
        padding-left: var(--jv-space-4);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .changed li {
        overflow-wrap: anywhere;
      }
      .changed .name {
        color: var(--jv-text);
        font-weight: var(--jv-font-weight-medium);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
      }
    `],h([$({attribute:!1})],rr.prototype,"hass",2),h([$({attribute:!1})],rr.prototype,"switches",2),h([$({type:String})],rr.prototype,"error",2),rr=h([A("jv-logs-governance")],rr);var Yh=2e4,Tb={hours:24,limit:100},at=class extends de{constructor(){super(...arguments);this._debug=null;this._debugError=null;this._activity=null;this._activityError=null;this._cognitive=null;this._switches=null;this._switchesError=null;this._refreshing=!1;this._updated=null;this._timer=null;this._started=!1;this._lastFetch=0;this._inFlight=null;this._onVisibility=()=>{document.visibilityState==="visible"&&Date.now()-this._lastFetch>Yh&&this._poll()};this._onEnforcementChanged=()=>{this._loadEnforcement()}}connectedCallback(){super.connectedCallback(),P(this,["ha-icon"]),document.addEventListener("visibilitychange",this._onVisibility),this.addEventListener("jv-logs-enforcement-changed",this._onEnforcementChanged),this._timer=setInterval(()=>{document.visibilityState==="visible"&&this._poll()},Yh),this.hass&&this._loadAll()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this._onVisibility),this.removeEventListener("jv-logs-enforcement-changed",this._onEnforcementChanged),this._timer&&clearInterval(this._timer),this._timer=null}willUpdate(e){e.has("hass")&&this.hass&&!this._started&&this._loadAll()}_fail(e,t){let n=Y.from(e,t);return n.message||n.code}async _loadDebug(){try{let e=await this.ws("jarvis/get_debug_log");this._debug=Array.isArray(e?.entries)?e.entries:[],this._debugError=null}catch(e){this._debugError=this._fail("jarvis/get_debug_log",e)}}async _loadActivity(){try{let e=await this.ws("jarvis/get_activity_log",Tb);this._activity=Array.isArray(e?.entries)?e.entries:[],this._activityError=null}catch(e){this._activityError=this._fail("jarvis/get_activity_log",e)}}async _loadCognitive(){try{let e=await this.ws("jarvis/get_cognitive_status");this._cognitive=e&&typeof e=="object"?e:{}}catch(e){this._cognitive={running:!1,error:this._fail("jarvis/get_cognitive_status",e),learning:{}}}}async _loadEnforcement(){try{let e=await this.ws("jarvis/get_enforcement");this._switches=Array.isArray(e?.switches)?e.switches:[],this._switchesError=null}catch(e){this._switchesError=this._fail("jarvis/get_enforcement",e)}}_poll(){return this._run([()=>this._loadDebug(),()=>this._loadActivity(),()=>this._loadCognitive()])}_loadAll(){return this._run([()=>this._loadDebug(),()=>this._loadActivity(),()=>this._loadCognitive(),()=>this._loadEnforcement()])}_run(e){return this.hass?this._inFlight?this._inFlight:(this._started=!0,this._refreshing=!0,this._inFlight=(async()=>{try{await Promise.allSettled(e.map(t=>t())),this._lastFetch=Date.now(),this._updated=new Date(this._lastFetch)}finally{this._refreshing=!1,this._inFlight=null}})(),this._inFlight):Promise.resolve()}_renderToolbar(){let e=this.hass?.locale?.language||this.hass?.language;return c`
      <div class="toolbar">
        <span class="updated" role="status" aria-live="polite">
          ${this._updated?a("Last updated {time}",{time:qh(this._updated,e)}):m}
        </span>
        <button class="jv-btn" type="button" ?disabled=${this._refreshing||!this.hass} @click=${()=>{this._loadAll()}}>
          ${x("ha-icon")?c`<ha-icon icon="mdi:refresh" aria-hidden="true"></ha-icon>`:m}
          <span>${a("Refresh")}</span>
        </button>
      </div>
    `}render(){return c`
      ${this._renderToolbar()}
      <div class="layout">
        <jv-logs-system .entries=${this._debug} .error=${this._debugError} .narrow=${this.narrow}></jv-logs-system>
        <div class="side">
          <jv-logs-activity .entries=${this._activity} .error=${this._activityError}></jv-logs-activity>
          <jv-logs-diagnostics .hass=${this.hass}></jv-logs-diagnostics>
          <jv-logs-cognitive .status=${this._cognitive}></jv-logs-cognitive>
          <jv-logs-governance .hass=${this.hass} .switches=${this._switches} .error=${this._switchesError}></jv-logs-governance>
        </div>
      </div>
    `}};at.styles=[T,S`
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--jv-space-3);
        margin-bottom: var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      .toolbar .updated {
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        font-variant-numeric: tabular-nums;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      @media (min-width: 1000px) {
        :host(:not([narrow])) .layout {
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
        }
      }
      .side {
        display: grid;
        gap: var(--jv-space-4);
        min-width: 0;
      }
    `],h([b()],at.prototype,"_debug",2),h([b()],at.prototype,"_debugError",2),h([b()],at.prototype,"_activity",2),h([b()],at.prototype,"_activityError",2),h([b()],at.prototype,"_cognitive",2),h([b()],at.prototype,"_switches",2),h([b()],at.prototype,"_switchesError",2),h([b()],at.prototype,"_refreshing",2),h([b()],at.prototype,"_updated",2),at=h([A("jarvis-view-logs")],at);var os=[];function Ne(r,i,e={}){let t={match:r,factory:i,consumes:[...e.consumes??[]],noReset:!!e.noReset};return os.push(t),()=>{let n=os.indexOf(t);n>=0&&os.splice(n,1)}}function Mb(r,i){if(typeof r.match=="string")return r.match===i.key;try{return!!r.match(i)}catch{return!1}}function ls(r){if(!r)return;let i;for(let e=os.length-1;e>=0;e--){let t=os[e];if(Mb(t,r)){if(typeof t.match=="string")return t;i??=t}}return i}function Xh(r){let i=new Map;for(let e of r){let t=ls(e);if(t)for(let n of t.consumes)n!==e.key&&i.set(n,e.key)}return i}var Va=new Map;function bn(r,i){let e=Va.get(r)??[],t=e.findIndex(n=>n.id===i.id);return t>=0?e.splice(t,1,i):e.push(i),Va.set(r,e),()=>{let n=Va.get(r)??[],s=n.indexOf(i);s>=0&&n.splice(s,1)}}function Zh(r){return Va.get(r)??[]}function Qh(r,i,e=t=>t){let t=i.trim().toLowerCase();return t?[r.title,e(r.title),r.id,...r.keywords??[]].some(s=>s.toLowerCase().includes(t)):!1}var Jh=/_(entities|domains|labels|areas)$/,Pb={entities:"entity",domains:"domain",labels:"label",areas:"area"},Lb={pattern_include_entities:["binary_sensor","device_tracker","person","sensor"]};function Db(r){return r.kind==="list"&&Jh.test(r.key)}var Fb=(r,i,e,t)=>{let n=Jh.exec(r.key)?.[1]??"entities",s=Pb[n]??"entity",o=Array.isArray(i)?i.filter(d=>typeof d=="string"):[],l=d=>{d.stopPropagation();let u=d.detail?.value;e(Array.isArray(u)?u:u?[u]:[])};return c`
    <jv-picker
      id=${t.id}
      kind=${s}
      multiple
      .hass=${t.hass}
      .data=${t.data}
      .value=${o}
      .label=${t.label}
      .placeholder=${t.placeholder}
      .domains=${Lb[r.key]}
      ?allow-custom=${s==="domain"||s==="label"}
      ?disabled=${t.disabled}
      @value-changed=${l}
    ></jv-picker>
  `};Ne(Db,Fb);function Mr(r){return typeof r=="string"?r:String(r.value)}function ev(r){return typeof r=="string"?r:r.label||String(r.value)}function Ob(r){return(r.options??[]).map(Mr)}var tv="__jv_empty__";function Pr(r){return r===""?tv:r}function Xa(r){return r===tv?"":r}function cs(r){if(r==null)return"";if(typeof r=="string")return r;try{return JSON.stringify(r)}catch{return String(r)}}function uc(r){try{return JSON.stringify(r,null,2)??""}catch{return String(r)}}function yn(r,i){switch(r.kind){case"bool":return typeof i=="boolean"?{kind:"bool",value:i}:i==null?{kind:"bool",value:!1}:{kind:"bool",value:!1,warning:"Stored value is not a boolean: {raw}"};case"int":case"float":return i==null||i===""?{kind:"number",value:null}:typeof i=="number"&&Number.isFinite(i)?{kind:"number",value:i}:{kind:"number",value:null,warning:"Stored value is not a number: {raw}"};case"enum":{let e=i==null?"":String(i),t=Ob(r);if(t.includes(e))return{kind:"enum",value:e,inOptions:!0};if(e===""){let n=r.default===null||r.default===void 0?"":String(r.default),s=t.includes(n)?n:t[0];return s===void 0?{kind:"enum",value:e,inOptions:!1}:{kind:"enum",value:s,inOptions:!0}}return{kind:"enum",value:e,inOptions:!1,warning:"Stored value is not an option: {raw}"}}case"list":return Array.isArray(i)?{kind:"list",value:i.map(e=>cs(e)).filter(e=>e!=="")}:i==null||i===""?{kind:"list",value:[]}:{kind:"list",value:[],warning:"Stored value is not a list: {raw}"};case"json":if(typeof i=="string")try{let e=JSON.parse(i);return{kind:"json",value:e,text:uc(e)}}catch{return{kind:"json",value:i,text:i,warning:"Invalid JSON stored"}}return i===void 0?{kind:"json",value:null,text:""}:{kind:"json",value:i,text:uc(i)};default:return{kind:"str",value:i==null?"":String(i)}}}function pc(r,i){if(r.kind!=="json")return"";let e=r.default;return Array.isArray(e)?Array.isArray(i)?"":"Expected a JSON list":e!==null&&typeof e=="object"?i!==null&&typeof i=="object"&&!Array.isArray(i)?"":"Expected a JSON object":""}function Fn(r){let i=[];for(let e of r.split(/[\n,]/)){let t=e.trim();t&&!i.includes(t)&&i.push(t)}return i}function hc(r){return r.join(`
`)}function nv(r,i){let e=r.kind==="int"?Math.round(i):i,t=!1;return typeof r.min=="number"&&e<r.min&&(e=r.min,t=!0),typeof r.max=="number"&&e>r.max&&(e=r.max,t=!0),{value:e,clamped:t}}function vi(r,i){switch(r.kind){case"bool":return i===!0||i==="true"||i===1;case"int":{if(i==null||i==="")return null;let e=Number(i);return Number.isFinite(e)?Math.round(e):null}case"float":{if(i==null||i==="")return null;let e=Number(i);return Number.isFinite(e)?e:null}case"enum":case"str":return i==null?"":String(i);case"list":return Array.isArray(i)?i.map(e=>cs(e)).filter(e=>e!==""):typeof i=="string"?Fn(i):[];default:return i===void 0?null:i}}function Ya(r){if(r===void 0)return"null";if(r&&typeof r=="object"&&!Array.isArray(r)){let i=r;return"{"+Object.keys(i).sort().map(e=>JSON.stringify(e)+":"+Ya(i[e])).join(",")+"}"}return Array.isArray(r)?"["+r.map(Ya).join(",")+"]":JSON.stringify(r)??"null"}function Lr(r,i){return Ya(r)===Ya(i)}function rv(r,i,e,t){return i==null||i===""?"—":r.kind==="bool"?i===!0?e:t:Array.isArray(i)?i.length?i.map(n=>cs(n)).join(", "):"[]":typeof i=="object"?JSON.stringify(i):String(i)}function iv(r,...i){let e=r.trim().toLowerCase();if(!e)return!0;for(let t of i){if(!t)continue;let n=Array.isArray(t)?t:[t];for(let s of n)if(s&&s.toLowerCase().includes(e))return!0}return!1}var ds={core:"General",voice:"Voice & Audio",learning:"Learning",safety:"Safety & Energy",cameras:"Cameras",home:"Home & Extras",governance:"Governance",Other:"Other"},dv=["core","voice","learning","safety","cameras","home","governance"],Nb=new Set(["onboarding_dismissed"]),uv=new Set(["appliance_profile","appliance_announce_unknown"]),pv={announcements_enabled:"Announcements",sentinel_enabled:"Sentinel",observer_enabled:"Observer",cognition_enabled:"Cognition",camera_auto_analyze:"Camera Watch",package_detection:"Package Watch",visitor_learning:"Visitor Learning",rich_reasoning:"Rich Reasoning",light_control_enabled:"Light Control",appliance_power_guessing:"Appliance Power Guessing",notify_service:"Notify Device",banter_level:"Banter level",search_backend:"Web research backend",searxng_url:"SearXNG URL",web_research_llm_fallback:"Escalate to LLM web search",calendar_tight_gap_min:"Calendar tight-gap (min)",departure_alerts_enabled:"Departure alerts",departure_lead_minutes:"Departure lead (min)",departure_origin_entity:"Origin tracker",departure_travel_sensor:"Travel sensor",routine_alerts_enabled:"Routine alerts",memory_threading_enabled:"Memory threading",memory_threading_hours:"Memory window (hrs)",memory_threading_max:"Memory max turns",continued_conversation_enabled:"Continued conversation",voice_confirm_enabled:"Voice confirmation",voice_confirm_mode:"Mode",recognition_source:"Face recognition source",residence_style:"Home type",home_stories:"Stories",garage_bays:"Garage bays",dormers_front:"Front dormers",dormers_rear:"Rear dormers",chimney_side:"Chimney",has_basement:"Basement",home_bedrooms:"Bedrooms",home_bathrooms:"Bathrooms",floor_plan_sqft:"Square feet",pattern_learn_doors:"Learn doors & windows",pattern_learn_presence:"Learn presence & arrivals",pattern_include_entities:"Also learn specific entities",excluded_entities:"Exclude specific entities",excluded_domains:"Exclude whole domains",excluded_labels:"Exclude by label",lab_areas:"Lab rooms",movie_area:"Movie room",movie_media_player:"Movie player",movie_dim_pct:"Movie dim %",hazard_monitor_enabled:"Monitor",hazard_quake_radius_km:"Quake radius (km)",hazard_quake_min_mag:"Min magnitude",briefing_require_home:"Only when someone's home",briefing_morning_time:"Morning",briefing_evening_time:"Evening",appliance_announce_unknown:"Announce unidentified loads",energy_agency:"Agency",ui_language:"Language"},Et="Drives the Residence 3D model + property stats. Detailed room layout is edited in the floor-plan editor.",Ib="Groq, OpenAI, Google Gemini, Anthropic, a local Ollama server, and any OpenAI-compatible endpoint (Custom) are all supported. A provider marked needs setup has no key yet — add one in Settings → Devices & Services → JARVIS → Configure.",sv="JARVIS speaks a summary at the times you set — weather and the day's forecast, your calendar, what happened overnight, power draw, and any active hazards nearby.",av="Between these times JARVIS stays quiet — proactive announcements, briefings and the Observer back off. HH:MM",ov={ui_language:"“Panel language” translates this dashboard. Auto follows Home Assistant.",output_language:"The language of JARVIS's own briefings, camera analysis and announcements — set it when your Home Assistant runs in English but you want JARVIS in another language. Auto follows Home Assistant. A spoken request in another language is still answered in that language.",announcements_enabled:"Master switch — all proactive speech",announce_notify_only:"Mute speakers — proactive announcements go to your phone/text instead (incl. critical). No unsolicited speaker interruptions.",sentinel_enabled:"Door/garage/lock-left-open alerts",observer_enabled:"AI event awareness (uses API)",cognition_enabled:"Local triage — sees all telemetry, gates cloud",adaptive_interruption_budget:"Interrupt less after recent alerts were dismissed as unneeded",adaptive_suggestion_threshold:"Tune the suggestion bar from how often past suggestions were useful",adaptive_cognition_threshold:"Tune the anticipation/anomaly bar from how welcome recent alerts were",camera_auto_analyze:"Inspect doorbell presses (vision + event-media)",camera_auto_analyze_motion:"Also inspect Frigate person/object detections, not just doorbell presses (needs Camera Watch on)",camera_motion_vision:"No Frigate/Nest? A Home Assistant motion/occupancy sensor firing silently analyzes the camera covering that room — so best-effort face recognition & scene learning work on plain cameras. Throttled per camera; no spoken alerts.",camera_alert_level:"When auto reviews speak aloud. Everything is still analyzed & logged — this only gates what's announced. Intrusion alerts are always spoken.",package_detection:"Detect packages & mail at the door",visitor_learning:"Silently learn from person events — never spoken",rich_reasoning:"Cloud-first judgment for medium+ events",light_control_enabled:"Off = still show which rooms have lights on, but disable toggling from the dashboard",appliance_power_guessing:"Off = only announce appliances with native sensors or ones you've mapped (no guessing from the power meter)",friday_automator:"⚠️ Advanced. A background sub-agent that can CONTROL devices, run scenes and scripts on its own — every other sub-agent is read-only. Off by default; enabling asks you to confirm.",autonomy_enforce:"⚠️ Lets JARVIS carry out automations you've already approved enough times WITHOUT asking each time — governed by the kernel's graduated-autonomy ladder. Security & safety capabilities (unlock, disarm, garage/lockdown off) NEVER auto-act; they always ask. Off by default; turn it off here anytime.",proximity_volume:"Soften announcements when mmWave distance sensors show you're close to the speaker. No effect in rooms without distance sensors; never dampens critical alerts.",host_telemetry:"Read the server's CPU temperature, memory pressure and NVMe I/O (from /proc and /sys) and fold critical stress into the infrastructure audit & System Diagnostics.",departure_require_location:'skip "time to head out" for online meetings & events with no place set',door_window_alerts_enabled:"announce when one is open at an unusual time — they stay monitored for security either way",continued_conversation_multi_satellite:"reopen the mic in the room you moved to (needs 2+ satellites)",departure_origin_entity:"where you set out from for drive-time — your phone or car GPS (a zone or a location sensor works too); blank uses whoever's tracked, then home",departure_osrm_url:"optional self-hosted routing server (OSRM); blank uses the free public router",departure_travel_sensor:"optional override — a sensor that already reports drive-time in minutes (Waze, Google/HERE Maps…); blank computes it from your origin via OSRM",driving_mode_enabled:"send alerts to the car screen (Android Auto) instead of the house when your phone is connected",driving_car_sensor:"leave blank to auto-detect the Home Assistant companion app's Android Auto sensor",home_context_max_entities:"Lower this (0 = counts only) if your LLM provider rejects requests for being too large — e.g. Groq's free tier caps tokens-per-minute. The assistant still discovers entities on demand, so nothing breaks.",custom_base_url:"OpenAI-compatible endpoint for the custom provider.",ollama_base_url:"Leave empty to use Ollama's default Home Assistant endpoint.",ollama_num_ctx:"Context window for local Ollama models. Larger = more context, but more VRAM and slower. Default 8192.",classifier_rate_limit:"Max observer LLM calls per hour. 0 = unlimited (local LLM / high-quota tiers).",vision_model:"Needs an image-capable model — e.g. moondream on Ollama, or a Groq vision model. Text-only models (like gpt-oss) will fail on camera analysis.",vision_thinking_max_tokens:"Higher budget so a thinking model has room to think AND answer.",vision_min_interval:"Minimum seconds between automatic (motion / auto-event) camera analyses, to cap vision token use. 0 = off. Explicit requests and doorbell presses are never throttled.",notify_service:"Phone push for high/critical alerts",appliance_profile:'Tell JARVIS which appliances exist so it names cycles correctly instead of guessing from the whole-home meter. Map a dedicated power or status entity when one exists (most accurate); otherwise set typical running watts so the meter can match it. Items: {"name","type":"washer|dryer|dishwasher|oven|microwave|appliance","entity","watts"}',appliance_announce_unknown:"Announce unidentified loads (loads matching no declared appliance)",operational_mode_auto:"AUTO · follow occupancy (away ↔ normal). Off = you set modes by hand or voice; discretionary modes (party/movie/lab/…) are always manual.",hazard_monitor_enabled:"Real-time nearby earthquakes (USGS), severe-weather warnings (NWS), and natural disasters like wildfires (NASA EONET). Scoped to your home location; alerts speak and push like any JARVIS alert.",hazard_lat:"Override (optional) — blank uses home coordinates.",hazard_lon:"Override (optional) — blank uses home coordinates.",briefing_morning_enabled:sv,briefing_evening_enabled:sv,banter_level:"Banter is silenced automatically during anything urgent — a safety alert always speaks plainly.",search_backend:"DuckDuckGo needs no setup; SearXNG needs a URL.",web_research_llm_fallback:"When the backend above finds nothing, let JARVIS fall back to the configured LLM's own live web search (currently Gemini only). Off by default.",identity_min_confidence:"Below this face-match confidence a person is recorded as 'unknown'. Higher = stricter, fewer false names.",voice_confirm_enabled:"Ask out loud before sensitive actions (unlock, garage, disarm) and listen for a spoken yes/no. Native mode uses the satellite's own audio; gated mode speaks through the room speaker (Nest).",directive:"overrides preset — (optional) a custom standing directive",voice_confirm_entities:"Require = always ask out loud before acting on this entity. Exempt = never ask for it, even for a normally sensitive action (unlock, garage, disarm).",biometric_entities:"Optional: point a wellbeing kind at a specific entity when auto-discovery picks the wrong one. Context only — never medical.",bedroom_areas:"Bedroom areas drive sleep detection during quiet hours.",broadcast_group:"The broadcast group is the media_player JARVIS announces through.",observer_quiet_start:av,observer_quiet_end:av,identity_voice_fingerprint:"needs a GPU",imap_enabled:"Read-only inbox access. The password is not entered here — set it in Settings → Devices & Services → JARVIS → Configure → Email (it lives in Home Assistant secrets.yaml).",pattern_learn_doors:"Door, window and garage contact sensors",pattern_learn_presence:"People and device trackers (home / away)",pattern_learn_buttons:'Suggest "press → scene / action" automations',suggest_garage_confirmation:'Safety-sensitive: suggest "arrive → open, confirm, then close a cover" routines. Off by default; you still approve each one.',pattern_include_entities:"for a skipped-domain entity you want as a routine trigger — e.g. a bay occupancy sensor",excluded_entities:"Entities you exclude are removed from JARVIS's awareness — presence detection, room routing, the observer and routine learning all skip them. Home Assistant still has the entity, and JARVIS can still control it if you ask for it by name.",excluded_domains:"e.g. light, switch — every entity in the domain",excluded_labels:"every entity carrying a Home Assistant label",lab_areas:"Lab rooms — quiet only here",movie_media_player:"optional",document_watch_folders:"one folder per line or comma-separated — e.g. /media/downloads",residence_style:Et,home_stories:Et,garage_bays:Et,dormers_front:Et,dormers_rear:Et,chimney_side:Et,chimney_count:Et,has_basement:Et,basement_entrance:Et,home_bedrooms:Et,home_bathrooms:Et,floor_plan_sqft:Et,door_mapping:"Edited visually in the floor-plan editor (Phase 3); raw JSON here."};function Za(r){return ov[r]?ov[r]:/_provider$/.test(r)||/(^|_)model$/.test(r)?Ib:r.startsWith("floor_plan_")&&r!=="floor_plan_sqft"?"Edited visually in the floor-plan editor (Phase 3); raw JSON here.":""}var hv={custom_base_url:"http://gpu-server:11434/v1",ollama_base_url:"http://gpu-server:11434/v1"},Hb={ui_language:{auto:"Auto (Home Assistant)",en:"English",zh:"中文（简体）","zh-hant":"中文（繁體）",cs:"Čeština",da:"Dansk",de:"Deutsch",es:"Español",fr:"Français",it:"Italiano",nl:"Nederlands",nb:"Norsk bokmål",pl:"Polski",pt:"Português","pt-br":"Português (Brasil)",ro:"Română",ru:"Русский",sk:"Slovenčina",fi:"Suomi",sv:"Svenska",tr:"Türkçe",uk:"Українська"},output_language:{"":"Auto (Home Assistant)",en:"English",zh:"中文 (Chinese)",cs:"Čeština (Czech)",da:"Dansk (Danish)",nl:"Nederlands (Dutch)",fi:"Suomi (Finnish)",fr:"Français (French)",de:"Deutsch (German)",el:"Ελληνικά (Greek)",he:"עברית (Hebrew)",hu:"Magyar (Hungarian)",id:"Indonesia (Indonesian)",it:"Italiano (Italian)",ja:"日本語 (Japanese)",ko:"한국어 (Korean)",nb:"Norsk (Norwegian)",pl:"Polski (Polish)",pt:"Português (Portuguese)",ro:"Română (Romanian)",ru:"Русский (Russian)",sk:"Slovenčina (Slovak)",es:"Español (Spanish)",sv:"Svenska (Swedish)",th:"ไทย (Thai)",tr:"Türkçe (Turkish)",uk:"Українська (Ukrainian)",vi:"Tiếng Việt (Vietnamese)"},banter_level:{0:"Plain — no wit",1:"Dry — occasional wit",2:"Full — MCU JARVIS"},camera_alert_level:{off:"Off — observe only",urgent:"Urgent only (default)",important:"Important — + deliveries",all:"Everything notable"},chimney_side:{right:"East / right",left:"West / left",center:"Center / ridge",none:"None"},basement_entrance:{bulkhead:"Exterior bulkhead",interior:"Interior stairs (inside)"},voice_confirm_mode:{auto:"Auto (try native, fall back)",native:"Native (satellite audio)",gated:"Gated (room speaker)"},search_backend:{duckduckgo:"DuckDuckGo (no key, default)",searxng:"SearXNG (self-hosted)"},recognition_source:{both:"Both (Double Take + Frigate)",frigate:"Frigate only (sub_label)",doubletake:"Double Take only"},energy_agency:{advisory:"advisory",opt_in:"opt-in",autonomous:"autonomous"}};function On(r,i){let e=Hb[r];return e&&i in e?e[i]:r==="directive_preset"?i.replace(/_/g," "):i}var vc={friday_automator:`Enable the FRIDAY automator?

Unlike every other sub-agent, FRIDAY can CONTROL your devices, run scenes and run scripts on its own. Only enable it if you want JARVIS to actuate your home autonomously.`,autonomy_enforce:`Let JARVIS act without asking?

When ON, JARVIS will perform convenience automations it has learned you approve (e.g. lights on at dusk) on its own, without a prompt each time — governed by the kernel's per-capability trust ladder.

It will NEVER auto-act security- or safety-critical capabilities: unlocking doors, disarming the alarm, opening the garage, or turning lockdown off ALWAYS ask first, no matter how often approved.

You can turn this back off here at any time. Enable kernel-governed autonomy?`,suggest_garage_confirmation:"This lets JARVIS SUGGEST automations that close a garage door or cover automatically once a confirmation sensor fires. Nothing installs without your explicit approval, and each suggestion is flagged safety-sensitive. Enable these suggestions?"},Bb=["groq","openai","gemini","ollama","anthropic","custom"],zb=[{value:"cape_cod",label:"Cape Cod"},{value:"colonial",label:"Colonial"},{value:"dutch_colonial",label:"Dutch Colonial"},{value:"ranch",label:"Ranch"},{value:"two_story",label:"Two-Story"},{value:"craftsman",label:"Craftsman"},{value:"modern",label:"Modern"},{value:"townhouse",label:"Townhouse"},{value:"apartment",label:"Apartment"},{value:"cabin",label:"Cabin"}],vv=new Set(["excluded_entities","pattern_include_entities","presence_only_entities","voice_confirm_entities","outdoor_entities","indoor_entities","biometric_entities"]),mv=new Set(["movie_area","bedroom_areas","lab_areas","outdoor_areas"]),Kb=/travel|commute|duration|eta|arrival|route|waze|maps|mapbox|tomtom|here[_ ]?travel|traffic|drive[_ ]?time|driving|depart|time_to|to_work|to_home/i,Ub=/^(min|mins|minute|minutes|h|hr|hrs|hour|hours)$/i,lv=/android[_ ]?auto|head[_ ]?unit|\bcar\b/i,qb=500;function mi(r){return Object.values(r?.states??{})}function fi(r){let i=r.attributes?.friendly_name;return typeof i=="string"&&i?i:r.entity_id}function Dr(r,i){let e=r?.config?.[i];return Array.isArray(e)?e:[]}function cv(r,i){return Dr(r,i).filter(e=>typeof e=="string")}function fv(r,i,e){let t=[];if(r==="notify_service")t=cv(i,"notify_services_available").map(n=>({value:n,label:n.replace(/^notify\./,"")}));else if(r==="broadcast_group"||r==="movie_media_player")t=mi(e).filter(n=>n.entity_id.startsWith("media_player.")).map(n=>({value:n.entity_id,label:fi(n)}));else if(r==="departure_origin_entity")t=mi(e).filter(n=>/^(person|device_tracker|zone)\./.test(n.entity_id)||n.entity_id.startsWith("sensor.")&&"latitude"in(n.attributes??{})&&"longitude"in(n.attributes??{})).map(n=>({value:n.entity_id,label:fi(n)}));else if(r==="departure_travel_sensor")t=mi(e).filter(n=>n.entity_id.startsWith("sensor.")&&(n.attributes?.device_class==="duration"||Ub.test(String(n.attributes?.unit_of_measurement??""))||Kb.test(n.entity_id))).map(n=>({value:n.entity_id,label:fi(n)}));else if(r==="driving_car_sensor")t=mi(e).filter(n=>n.entity_id.startsWith("binary_sensor.")&&(lv.test(n.entity_id)||lv.test(fi(n))||n.attributes?.device_class==="connectivity")).map(n=>({value:n.entity_id,label:fi(n)}));else if(r==="residence_style")t=zb;else if(mv.has(r))t=(i?.areas??[]).map(n=>({value:n.id,label:n.name}));else if(vv.has(r))t=mi(e).map(n=>({value:n.entity_id,label:fi(n)}));else if(r==="excluded_domains")t=[...new Set(mi(e).map(n=>n.entity_id.split(".")[0]))].sort().map(n=>({value:n,label:n}));else if(r==="excluded_labels")t=Dr(i,"available_labels").map(n=>String(n.name??n.label_id??n.id??"")).filter(Boolean).map(n=>({value:n,label:n}));else if(r==="announcement_speakers")t=Dr(i,"cast_devices").map(n=>({value:String(n.entity_id??""),label:String(n.name??n.entity_id??"")}));else if(r==="disabled_cameras")t=Dr(i,"cameras").map(n=>({value:String(n.entity_id??""),label:String(n.name??n.entity_id??"")}));else if(r==="disabled_sentinel_rules")t=Dr(i,"sentinel_rules").map(n=>({value:String(n.id??""),label:String(n.desc??n.name??n.id??"")}));else if(/_provider$/.test(r)){let n=new Set(cv(i,"configured_providers"));t=Bb.map(s=>({value:s,label:n.has(s)?s:`${s} — needs setup`}))}return t.filter(n=>n.value).slice(0,qb)}function gv(r){let i=Dr(r,"satellites"),e=Dr(r,"cast_devices");return!i.length&&!e.length?null:{satellites:i.map(t=>`${t.entity_id} · ${t.area??t.area_id??t.name??""}`).join(", "),speakers:e.map(t=>String(t.entity_id??"")).join(", ")}}function bv(r){return Nb.has(r.key)}var yv={core:[{name:"Operational Mode",why:"one chip per mode and the follow-occupancy switch",view:"overview"},{name:"System Diagnostics",why:"runtime health, judgment calibration and the cognitive core",view:"logs"},{name:"Wellbeing Context",why:"discovered wearables and the household's wellbeing context",view:"people"}],learning:[{name:"Document Library",why:"upload, ingest, delete and the semantic-search probe",view:"documents"},{name:"Observer Tuning",why:"read-only runtime stats",view:"logs"}],cameras:[{name:"Cameras",why:"enable / disable, rename, indoor / outdoor, Camera Watch and camera diagnostics",view:"cameras"},{name:"Doorbell Training",why:"the training dataset and the backlog run",view:"cameras"},{name:"Face recognition",why:"household faces and their reference photos",view:"people"}],home:[{name:"Floor Plan Editor",why:"rooms, openings, doors, cameras & pins and plan import",view:"residence",path:"editor"}]},Wb=new Set(["notify_service","broadcast_group","movie_media_player","departure_origin_entity","departure_travel_sensor","driving_car_sensor","residence_style","excluded_domains","excluded_labels","announcement_speakers","disabled_cameras","disabled_sentinel_rules",...mv,...vv]);function _v(r){return Wb.has(r)||/_provider$/.test(r)}var Gb=["ha-switch","ha-select","ha-list-item","mwc-list-item","ha-textfield","ha-textarea","ha-icon"],Vb=30,he=class extends L{constructor(){super(...arguments);this.value=void 0;this.label="";this.help="";this.hint="";this.placeholder="";this.status=null;this.statuses=[];this.data=null;this.disabled=!1;this.showKey=!0;this.narrow=!1;this.flash=!1;this._draft="";this._dirty=!1;this._jsonError="";this._note=null;this._suggestions=null;this._optimistic=null}connectedCallback(){super.connectedCallback(),P(this,Gb)}updated(e){if(this.field?.kind!=="enum"||!(e.has("value")||e.has("field")))return;let t=this.renderRoot.querySelector("ha-select");!t||typeof t.layout!="function"&&typeof t.layoutOptions!="function"||Promise.resolve(t.updateComplete).then(()=>typeof t.layout=="function"?t.layout():t.layoutOptions?.()).catch(()=>{})}willUpdate(e){if(this.field&&((e.has("value")||e.has("field"))&&(this._optimistic=null),e.has("status")&&this.status?.level==="error"&&(this._optimistic=null),e.has("value")||e.has("field"))){let t=this.field.kind;if(t==="list"){let n=yn(this.field,this.value),s=n.kind==="list"?n.value:[];(!this._dirty||Lr(Fn(this._draft),s))&&(this._draft=hc(s),this._dirty=!1)}else if(t==="json"){let n=yn(this.field,this.value),s=n.kind==="json"?n.text:"",o=!1;if(this._dirty)try{o=Lr(JSON.parse(this._draft),n.kind==="json"?n.value:null)}catch{o=!1}(!this._dirty||o)&&(this._draft=s,this._dirty=!1,this._jsonError="")}}}get _id(){return`f-${this.field.key}`}_emit(e){this._note=null;let t={key:this.field.key,value:vi(this.field,e)};this.dispatchEvent(new CustomEvent("field-change",{detail:t}))}_ensureSuggestions(){if(this._suggestions===null&&this.suggest)try{this._suggestions=this.suggest()}catch{this._suggestions=[]}}_onToggle(e){let t=e.target;this._emit(!!t.checked)}_renderSwitch(e){let t=this.label||this.field.key;return c`
      <span class="inline">
        <span aria-hidden="true">${e?a("ON"):a("OFF")}</span>
        ${x("ha-switch")?c`<ha-switch id=${this._id} .checked=${I(e)} ?disabled=${this.disabled} aria-label=${t} @change=${this._onToggle}></ha-switch>`:c`<input id=${this._id} type="checkbox" role="switch" .checked=${I(e)} ?disabled=${this.disabled} aria-label=${t} @change=${this._onToggle} />`}
      </span>
    `}_onSelect(e){let t=e.target,n=Xa(String(t.value??"")),s=yn(this.field,this.value);s.kind==="enum"&&n!==s.value&&this._emit(n)}_renderEnum(e,t){let n=this.field.options??[],s=this.label||this.field.key;if(x("ha-select")){let o=x("ha-list-item")?Te`ha-list-item`:Te`mwc-list-item`;return c`
        <ha-select
          id=${this._id}
          .label=${s}
          .value=${I(Pr(e))}
          ?disabled=${this.disabled}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${this._onSelect}
          @closed=${l=>l.stopPropagation()}
        >
          ${t?m:ye`<${o} .value=${Pr(e)} disabled>${a("{raw} (not an option)",{raw:e||"∅"})}</${o}>`}
          ${n.map(l=>ye`<${o} .value=${Pr(Mr(l))}>${this._optionText(l)}</${o}>`)}
        </ha-select>
      `}return c`
      <select id=${this._id} .value=${I(e)} ?disabled=${this.disabled} aria-label=${s} @change=${this._onSelect}>
        ${t?m:c`<option value=${e} disabled>${a("{raw} (not an option)",{raw:e||"∅"})}</option>`}
        ${n.map(o=>c`<option value=${Mr(o)}>${this._optionText(o)}</option>`)}
      </select>
    `}_optionText(e){let t=Mr(e),n=typeof e=="string"?"":ev(e);return a(n&&n!==t?n:On(this.field.key,t))}_onNumber(e){this._note=null;let t=e.target,n=String(t.value??"").trim(),s=yn(this.field,this.value),o=s.kind==="number"?s.value:null;if(n===""){o!==null&&this._emit(null);return}let l=Number(n);if(!Number.isFinite(l)){this.requestUpdate();return}let{value:d,clamped:u}=nv(this.field,l);if(u&&(this._note={level:"warn",message:a("Clamped to {min}–{max}",{min:String(this.field.min??"−∞"),max:String(this.field.max??"∞")})}),d!==o){let p={key:this.field.key,value:vi(this.field,d)};this.dispatchEvent(new CustomEvent("field-change",{detail:p}))}else this.requestUpdate()}_renderNumber(e){let t=this.field,n=e===null?"":String(e),s=t.step??(t.kind==="int"?1:"any"),o=t.default===null||t.default===void 0?"":String(t.default),l=this.label||t.key;return x("ha-textfield")?c`<ha-textfield id=${this._id} type="number" .label=${l} .value=${I(n)} .placeholder=${o}
        min=${t.min??m} max=${t.max??m} step=${s} ?disabled=${this.disabled} @change=${this._onNumber}></ha-textfield>`:c`<input id=${this._id} type="number" .value=${I(n)} placeholder=${o} aria-label=${l}
      min=${t.min??m} max=${t.max??m} step=${s} ?disabled=${this.disabled} @change=${this._onNumber} />`}_onText(e){let t=e.target,n=String(t.value??"").trim(),s=yn(this.field,this.value);s.kind==="str"&&n!==s.value?this._emit(n):this.requestUpdate()}_renderText(e){let t=this.field,n=/_url$/.test(t.key)?"url":"text",s=this.placeholder||(/_time$/.test(t.key)||/^observer_quiet_(start|end)$/.test(t.key)?"HH:MM":""),o=this.label||t.key;if(this.suggest){let l=`${this._id}-list`;return c`
        <input id=${this._id} type=${n} .value=${I(e)} placeholder=${s} aria-label=${o} list=${l}
          autocomplete="off" ?disabled=${this.disabled} @focus=${this._ensureSuggestions} @change=${this._onText} />
        <datalist id=${l}>
          ${(this._suggestions??[]).map(d=>c`<option value=${d.value}>${d.label}</option>`)}
        </datalist>
      `}return x("ha-textfield")?c`<ha-textfield id=${this._id} type=${n} .label=${o} .value=${I(e)} .placeholder=${s}
        ?disabled=${this.disabled} @change=${this._onText}></ha-textfield>`:c`<input id=${this._id} type=${n} .value=${I(e)} placeholder=${s} aria-label=${o}
      ?disabled=${this.disabled} @change=${this._onText} />`}_onDraft(e){let t=e.target;this._draft=String(t.value??""),this._note=null;let n=yn(this.field,this.value);if(this.field.kind==="json")try{let s=JSON.parse(this._draft),o=pc(this.field,s);this._jsonError=o?a(o):"",this._dirty=!Lr(s,n.kind==="json"?n.value:null)}catch(s){this._jsonError=s instanceof Error?s.message:String(s),this._dirty=!0}else this._dirty=!Lr(Fn(this._draft),n.kind==="list"?n.value:[])}_saveDraft(){if(this.field.kind==="json")try{let e=JSON.parse(this._draft),t=pc(this.field,e);if(t){this._jsonError=a(t);return}this._emit(e)}catch(e){this._jsonError=e instanceof Error?e.message:String(e)}else this._emit(Fn(this._draft))}_addChip(e){let t=this._draft.split(`
`),n=t[t.length-1]?.trim()??"",s=Fn(this._draft);(n&&!s.includes(n)||n==="")&&t.pop();let o=[...t.filter(d=>d.trim()!==""),e].join(`
`);this._draft=o;let l=yn(this.field,this.value);this._dirty=!Lr(Fn(o),l.kind==="list"?l.value:[]),this.renderRoot.querySelector("textarea, ha-textarea")?.focus()}_renderChips(){if(!this.suggest||this._suggestions===null)return m;let e=new Set(Fn(this._draft)),t=this._draft.split(`
`),n=(t[t.length-1]??"").trim().toLowerCase(),s=n&&!e.has(t[t.length-1].trim())?n:"",o=this._suggestions.filter(d=>!e.has(d.value)&&(!s||d.value.toLowerCase().includes(s)||d.label.toLowerCase().includes(s)));if(!o.length)return m;let l=o.slice(0,Vb);return c`
      <div class="chips" role="group" aria-label=${a("Suggestions")}>
        ${l.map(d=>c`<button type="button" class="chip jv-hit" title=${d.value} ?disabled=${this.disabled} @click=${()=>this._addChip(d.value)}><span class="jv-truncate">${d.label}</span></button>`)}
        ${o.length>l.length?c`<span class="jv-muted">${a("{count} more — type to filter",{count:o.length-l.length})}</span>`:m}
      </div>
    `}_renderTextarea(e){let t=this.label||this.field.key,n=this.narrow?6:5,s=!!this._jsonError,o=x("ha-textarea")?c`<ha-textarea id=${this._id} class=${e?"jv-mono":""} .label=${t} .value=${I(this._draft)} rows=${n} autogrow
          ?disabled=${this.disabled} .helper=${this.field.kind==="list"?a("One item per line"):""} helperPersistent
          @input=${this._onDraft} @focus=${this._ensureSuggestions}></ha-textarea>`:c`<textarea id=${this._id} class=${e?"jv-mono":""} .value=${I(this._draft)} rows=${n} aria-label=${t}
          aria-invalid=${s?"true":"false"} placeholder=${this.field.kind==="list"?a("One item per line"):""}
          ?disabled=${this.disabled} @input=${this._onDraft} @focus=${this._ensureSuggestions}></textarea>`,l=this.field.kind==="list"?Fn(this._draft).length:0;return c`
      <div class="control wide">
        ${o}
        ${this.field.kind==="list"?this._renderChips():m}
        <div class="save-row">
          ${s?c`<span class="status error" role="alert">${a("Invalid JSON: {message}",{message:this._jsonError})}</span>`:m}
          ${this.field.kind==="list"&&this._dirty?c`<span class="jv-muted">${a("{count} items",{count:l})}</span>`:m}
          <button type="button" class="jv-btn primary" ?disabled=${this.disabled||!this._dirty||s} @click=${this._saveDraft}>${a("Save")}</button>
        </div>
      </div>
    `}_onEditorChange(e){this._optimistic={value:e},this._emit(e)}_editorContext(e){return{hass:this.hass,data:this.data,narrow:this.narrow,disabled:this.disabled,label:e,id:this._id,placeholder:this.placeholder,host:this.host}}_combinedStatus(){let e=[this.status,...this.statuses??[]].filter(l=>!!l);if(!e.length)return null;if(e.length===1)return e[0];let t={error:3,warn:2,saving:1,saved:0},n=e.reduce((l,d)=>t[d.level]>t[l]?d.level:l,e[0].level),s=new Set,o=e.map(l=>l.message).filter(l=>l&&!s.has(l)&&s.add(l)).join(" · ");return{level:n,message:o}}render(){let e=this.field;if(!e)return m;let t=yn(e,this.value),n="warning"in t&&t.warning?a(t.warning,{raw:cs(this.value)}):"",s=Lr(this.value===void 0?e.default:this.value,e.default),o=this._combinedStatus(),l=o&&this._note&&o.level!=="error"?{level:this._note.level,message:`${o.message} · ${this._note.message}`}:o??this._note,d=l||(n?{level:"warn",message:n}:null),u=this.label||e.label||e.key,p=ls(e),v=!p&&t.kind==="bool",f;if(p){let g=this._optimistic?this._optimistic.value:t.value;f=c`<div class="control wide">${p.factory(e,g,y=>this._onEditorChange(y),this._editorContext(u))}</div>`}else switch(t.kind){case"bool":f=this._renderSwitch(t.value);break;case"enum":f=this._renderEnum(t.value,t.inOptions);break;case"number":f=this._renderNumber(t.value);break;case"str":f=this._renderText(t.value);break;case"list":f=this._renderTextarea(!1);break;case"json":f=this._renderTextarea(!0);break}return c`
      <div class="head">
        <div class="labels">
          <label class="label" for=${this._id}>${u}</label>
          ${e.expose?c`<jv-state-badge level="info" nodot .label=${a("HA entity")}></jv-state-badge>`:m}
          ${this.showKey?c`<code class="key jv-mono">${e.key}</code>`:m}
        </div>
        ${v?f:m}
      </div>
      ${this.help?c`<p class="help">${this.help}</p>`:m}
      ${this.hint?c`<p class="help jv-mono">${this.hint}</p>`:m}
      ${p||v||t.kind==="list"||t.kind==="json"?v?m:f:c`<div class="control">${f}</div>`}
      <div class="foot">
        ${s||p?.noReset?m:c`
              <span>${a("Default: {value}",{value:rv(e,e.default,a("ON"),a("OFF"))})}</span>
              <button type="button" class="reset jv-hit" ?disabled=${this.disabled}
                @click=${()=>this.dispatchEvent(new CustomEvent("field-reset",{detail:{key:e.key}}))}>${a("Reset to default")}</button>
            `}
        <span class="status ${d?.level??""}" role="status" aria-live="polite">${d?.message??""}</span>
      </div>
    `}resetDraft(){let e=yn(this.field,this.value);this._dirty=!1,this._jsonError="",this._draft=e.kind==="json"?e.text:e.kind==="list"?hc(e.value):""}};he.styles=[T,S`
      :host {
        display: block;
        padding: var(--jv-space-3) 0;
        border-radius: var(--jv-radius-sm);
        transition: background-color var(--jv-ease);
      }
      :host([flash]) {
        background: var(--jv-accent-soft);
        box-shadow: 0 0 0 var(--jv-space-2) var(--jv-accent-soft);
      }
      .head {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-3);
      }
      .labels {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
      }
      .label {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .key {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .help {
        margin: var(--jv-space-1) 0 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
        white-space: pre-line;
      }
      .control {
        margin-top: var(--jv-space-2);
        max-width: 440px;
      }
      :host([narrow]) .control {
        max-width: none;
      }
      .control.wide {
        max-width: none;
      }
      .inline {
        flex: none;
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-space-5);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      ha-textfield,
      ha-select,
      ha-textarea,
      input:not([type="checkbox"]),
      select,
      textarea {
        width: 100%;
        display: block;
      }
      input:not([type="checkbox"]),
      select,
      textarea {
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        padding: 0 var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      textarea {
        padding: var(--jv-space-2) var(--jv-space-3);
        min-height: 120px;
        resize: vertical;
        line-height: var(--jv-line-height);
      }
      textarea.jv-mono,
      ha-textarea.jv-mono {
        --mdc-typography-subtitle1-font-family: var(--jv-font-code);
      }
      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
      .foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-3);
        margin-top: var(--jv-space-1);
        min-height: 20px;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .status {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .status.saved {
        color: var(--jv-ok-text);
      }
      .status.error {
        color: var(--jv-danger-text);
      }
      .status.warn {
        color: var(--jv-warn-text);
      }
      .save-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: var(--jv-space-3);
        margin-top: var(--jv-space-2);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
        margin-top: var(--jv-space-2);
      }
      /* 32 px chip; .jv-hit gives it the 44 px hit box, so the chip itself
         must not clip (the label span truncates instead) */
      .chip {
        appearance: none;
        display: inline-flex;
        align-items: center;
        font: inherit;
        font-size: var(--jv-font-size-s);
        min-height: 32px;
        padding: 0 var(--jv-space-3);
        border-radius: var(--jv-radius-pill);
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-surface-2);
        color: var(--jv-text);
        cursor: pointer;
        max-width: 100%;
        min-width: 0;
      }
      .chip:hover {
        background: var(--jv-hover);
      }
      .reset {
        appearance: none;
        font: inherit;
        font-size: var(--jv-font-size-s);
        background: transparent;
        border: 0;
        color: var(--jv-accent-text);
        cursor: pointer;
        padding: var(--jv-space-1) 0;
        min-height: 28px;
      }
    `],h([$({attribute:!1})],he.prototype,"field",2),h([$({attribute:!1})],he.prototype,"value",2),h([$({type:String})],he.prototype,"label",2),h([$({type:String})],he.prototype,"help",2),h([$({type:String})],he.prototype,"hint",2),h([$({type:String})],he.prototype,"placeholder",2),h([$({attribute:!1})],he.prototype,"suggest",2),h([$({attribute:!1})],he.prototype,"status",2),h([$({attribute:!1})],he.prototype,"statuses",2),h([$({attribute:!1})],he.prototype,"hass",2),h([$({attribute:!1})],he.prototype,"data",2),h([$({attribute:!1})],he.prototype,"host",2),h([$({type:Boolean,reflect:!0})],he.prototype,"disabled",2),h([$({type:Boolean,attribute:"show-key"})],he.prototype,"showKey",2),h([$({type:Boolean,reflect:!0})],he.prototype,"narrow",2),h([$({type:Boolean,reflect:!0})],he.prototype,"flash",2),h([b()],he.prototype,"_draft",2),h([b()],he.prototype,"_dirty",2),h([b()],he.prototype,"_jsonError",2),h([b()],he.prototype,"_note",2),h([b()],he.prototype,"_suggestions",2),h([b()],he.prototype,"_optimistic",2),he=h([A("jarvis-config-field")],he);var Rt=["ha-switch","ha-select","ha-list-item","mwc-list-item","ha-textfield","ha-icon"];function gi(r){let i=e=>{let t=e.target,n=Xa(String(t.value??""));n!==r.value&&r.onChange(n)};if(x("ha-select")){let e=x("ha-list-item")?Te`ha-list-item`:Te`mwc-list-item`;return c`
      <ha-select
        id=${r.id??m}
        .label=${r.label}
        .value=${I(Pr(r.value))}
        ?disabled=${!!r.disabled}
        naturalMenuWidth
        fixedMenuPosition
        @selected=${i}
        @closed=${t=>t.stopPropagation()}
      >
        ${r.options.map(t=>ye`<${e} .value=${Pr(t.value)} ?disabled=${!!t.disabled}>${t.label}</${e}>`)}
      </ha-select>
    `}return c`
    <select id=${r.id??m} class="jv-select" .value=${I(r.value)} ?disabled=${!!r.disabled} aria-label=${r.label} @change=${i}>
      ${r.options.map(e=>c`<option value=${e.value} ?disabled=${!!e.disabled} ?selected=${e.value===r.value}>${e.label}</option>`)}
    </select>
  `}function wv(r){let i=e=>{let t=e.target;r.onChange(!!t.checked)};return x("ha-switch")?c`<ha-switch id=${r.id??m} .checked=${I(r.checked)} ?disabled=${!!r.disabled} aria-label=${r.label} @change=${i}></ha-switch>`:c`<input id=${r.id??m} type="checkbox" role="switch" class="jv-switch" .checked=${I(r.checked)} ?disabled=${!!r.disabled} aria-label=${r.label} @change=${i} />`}function bi(r){let i=t=>String(t.target.value??""),e=r.type??"text";return x("ha-textfield")?c`<ha-textfield
      id=${r.id??m}
      type=${e}
      .label=${r.label}
      .value=${I(r.value)}
      .placeholder=${r.placeholder??""}
      min=${r.min??m}
      step=${r.step??m}
      ?disabled=${!!r.disabled}
      ?invalid=${!!r.invalid}
      @input=${r.onInput?t=>r.onInput?.(i(t)):m}
      @change=${t=>r.onChange(i(t))}
    ></ha-textfield>`:c`<input
    id=${r.id??m}
    class="jv-input"
    type=${e}
    .value=${I(r.value)}
    placeholder=${r.placeholder??""}
    aria-label=${r.label}
    aria-invalid=${r.invalid?"true":"false"}
    min=${r.min??m}
    step=${r.step??m}
    ?disabled=${!!r.disabled}
    @input=${r.onInput?t=>r.onInput?.(i(t)):m}
    @change=${t=>r.onChange(i(t))}
  />`}var At=S`
  .jv-select,
  .jv-input,
  ha-select,
  ha-textfield {
    width: 100%;
    display: block;
    min-width: 0;
  }
  .jv-select,
  .jv-input {
    font: inherit;
    color: var(--jv-text);
    background: var(--jv-surface);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    padding: 0 var(--jv-space-3);
    min-height: var(--jv-tap);
  }
  .jv-input::placeholder {
    color: var(--jv-text-2);
  }
  .jv-input[aria-invalid="true"] {
    border-color: var(--jv-danger);
  }
  .jv-switch {
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--jv-accent);
    flex: none;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    overflow: hidden;
  }
  .rows > li {
    display: flex;
    align-items: center;
    gap: var(--jv-space-3);
    min-height: var(--jv-tap);
    padding: var(--jv-space-2) var(--jv-space-3);
  }
  .rows > li + li {
    border-top: var(--jv-border-width) solid var(--jv-border);
  }
  .rows .text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .rows .name {
    overflow-wrap: anywhere;
  }
  .rows .sec {
    font-size: var(--jv-font-size-xs);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
  .rows .ctl {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--jv-space-2);
    min-width: 0;
  }
  .note {
    margin: var(--jv-space-1) 0 0;
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
  .note.warn {
    color: var(--jv-warn-text);
  }
  .note.error {
    color: var(--jv-danger-text);
  }
  .note.ok {
    color: var(--jv-ok-text);
  }
  .link {
    appearance: none;
    font: inherit;
    font-size: var(--jv-font-size-s);
    background: transparent;
    border: 0;
    color: var(--jv-accent-text);
    cursor: pointer;
    padding: var(--jv-space-1) 0;
    min-height: 28px;
    /* .jv-hit adds height only: keep short labels ("Use") 44 px wide too */
    min-width: var(--jv-tap);
  }
  .link:disabled {
    cursor: default;
    color: var(--jv-text-3);
  }
`;function $v(r){return r?a("ON"):a("OFF")}function _n(r,i){let e=r?.states?.[i]?.attributes?.friendly_name;return typeof e=="string"&&e?e:i}function xv(r,i,e){r.dispatchEvent(new CustomEvent("jarvis-navigate",{bubbles:!0,composed:!0,detail:{view:i,path:e}}))}var kv=[{providerKey:"llm_provider",modelKey:"model",label:"Main Agent"},{providerKey:"classifier_provider",modelKey:"classifier_model",label:"Classifier"},{providerKey:"reasoning_provider",modelKey:"reasoning_model",label:"Reasoning"},{providerKey:"review_provider",modelKey:"review_model",label:"Review"},{providerKey:"vision_provider",modelKey:"vision_model",label:"Vision",vision:!0},{providerKey:"camera_reasoning_provider",modelKey:"camera_reasoning_model",label:"Camera Rsn"}],us=["groq","openai","gemini","ollama","anthropic","custom"],Yb=new Set(["groq","openai","gemini","anthropic"]),Xb=/vision|vl|scout|maverick|llama-4|gpt-4o|multimodal|qwen3\.\d|gemini/i,jv=80,Zb=15e3,ir=new Map;function Qb(r){if(!r)return ir.clear();for(let i of[...ir.keys()])i.split("\0")[0]===r&&ir.delete(i)}typeof window<"u"&&window.addEventListener("jarvis-refresh",()=>Qb());function Jb(r,i,e=!1,t=""){if(!i)return Promise.resolve({models:[],error:""});let n=`${i}\0${t}`;e&&ir.delete(n);let s=ir.get(n);if(s)return s;let o=X(r,"jarvis/list_models",{provider:i}).then(u=>{let p=Array.isArray(u?.models)?[...new Set(u.models.filter(f=>typeof f=="string"&&!!f))].sort():[],v=typeof u?.error=="string"?u.error:"";return{models:p,error:p.length?"":v}}).catch(u=>{let p=Y.from("jarvis/list_models",u);return p.code==="unknown_command"?{models:[],error:a("not supported by this backend")}:{models:[],error:p.message}}),l=new Promise(u=>setTimeout(()=>u({models:[],error:a("timed out — see the Home Assistant log")}),Zb)),d=Promise.race([o,l]).then(u=>(u.error&&!u.models.length&&ir.get(n)===d&&ir.delete(n),u));return ir.set(n,d),d}function Qa(r){return typeof r=="string"?r:""}function ey(r,i){return r.length?i?r.find(e=>Xb.test(e))??"":r[0]:""}var $e=class extends L{constructor(){super(...arguments);this.data=null;this.narrow=!1;this.disabled=!1;this.modelRole=kv[0];this.provider="";this.model="";this.baseSig="";this.label="";this.controlId="";this._list=null;this._loading=!1;this._custom=!1;this._pendingProvider=null;this._pendingModel=null;this._saving=!1;this._fetchedFor="";this._fetchedSig=""}connectedCallback(){super.connectedCallback(),P(this,Rt)}get _isMain(){return this.modelRole.providerKey==="llm_provider"}_configured(){let e=this.data?.config?.configured_providers,t=Array.isArray(e)?e.filter(n=>typeof n=="string"):[];return t.length?new Set(t):null}_currentProvider(){return this._pendingProvider??this.provider}_effectiveProvider(){let e=this._currentProvider();if(e)return e;if(!this._isMain)return"";let t=this._configured();return t?[...t].find(n=>us.includes(n))??us[0]:us[0]}_currentModel(){return this._pendingModel??this.model}willUpdate(e){e.has("provider")&&this._pendingProvider!==null&&this.provider===this._pendingProvider&&(this._pendingProvider=null),e.has("model")&&this._pendingModel!==null&&this.model===this._pendingModel&&(this._pendingModel=null);let t=this._effectiveProvider();!this.hass||!t||(t!==this._fetchedFor||this.baseSig!==this._fetchedSig)&&(t!==this._fetchedFor&&(this._list=null),this._fetchedFor=t,this._fetchedSig=this.baseSig,this._fetch(t))}_fetch(e,t=!1){this._loading=!0;let n=this.baseSig;Jb(this.hass,e,t,n).then(o=>{this._fetchedFor!==e||this._fetchedSig!==n||(this._list=o,this._loading=!1,o.error&&!o.models.length&&(this._custom=!0))})}_refresh(){let e=this._effectiveProvider();!e||!this.hass||(this._list=null,this._fetch(e,!0))}async _setProvider(e){if(!this.host||this._saving)return;let t=[[this.modelRole.providerKey,e]];this._isMain&&Yb.has(e)&&Qa(this.host.value("llm_base_url"))!==""&&t.push(["llm_base_url",""]),this._pendingProvider=e,this._saving=!0,this._custom=!1;try{(await this.host.saveMany(t)).ok||(this._pendingProvider=null)}finally{this._saving=!1}}async _setModel(e){let t=e.trim();if(!(!this.host||t===this._currentModel())){this._pendingModel=t,this._saving=!0;try{(await this.host.save(this.modelRole.modelKey,t)).ok||(this._pendingModel=null)}finally{this._saving=!1}}}_providerOptions(){let e=this._configured(),t=this._currentProvider(),n=[];this._isMain||n.push({value:"",label:a("— inherit main agent —")});for(let s of us)n.push({value:s,label:!e||e.has(s)?s:a("{provider} — needs setup",{provider:s})});return t&&!us.includes(t)&&n.unshift({value:t,label:a("{raw} (not an option)",{raw:t}),disabled:!0}),n}_modelItems(){let e=this._list?.models??[],t=this._currentModel(),n=e.map(s=>({value:s,label:s}));return t&&!e.includes(t)&&n.unshift({value:t,label:t}),n}_renderModelControl(e,t){let n=this._currentModel(),s=a("Model");if(!e)return bi({label:s,value:"",placeholder:a("— inherit main agent —"),disabled:!0,onChange:()=>{}});let o=!!this._list&&!!this._list.error&&!this._list.models.length;if(this._custom||o)return bi({label:s,value:n,placeholder:a("enter model id"),disabled:t,onChange:d=>{this._setModel(d)}});let l=d=>{d.stopPropagation();let u=d.detail?.value;this._setModel(Array.isArray(u)?u[0]??"":u??"")};return c`
      <jv-picker
        kind="domain"
        allow-custom
        .hass=${this.hass}
        .data=${this.data}
        .items=${this._modelItems()}
        .value=${n}
        .label=${s}
        .placeholder=${n?a("Replace…"):a("Search…")}
        ?disabled=${t}
        @value-changed=${l}
      ></jv-picker>
    `}render(){let e=this._effectiveProvider(),t=this.disabled||!this.hass||this._saving,n=this._currentModel(),s=this._list,o=!!s&&!s.error&&s.models.length>0,l=!!s&&!!s.error&&!s.models.length,d=o&&n!==""&&!s.models.includes(n),u=d?ey(s.models,!!this.modelRole.vision):"",p=!!e&&!l&&o,v=l?s.error.length>jv?`${s.error.slice(0,jv)}…`:s.error:"",f=a(this.modelRole.label);return c`
      <div class="grid" role="group" aria-label=${this.label||f}>
        <div class="col">
          <span class="cap"><span class="role">${f}</span><span>${a("Provider")}</span></span>
          ${gi({id:this.controlId||void 0,label:`${f} — ${a("Provider")}`,value:this._isMain?e:this._currentProvider(),options:this._providerOptions(),disabled:t,onChange:g=>{this._setProvider(g)}})}
        </div>
        <div class="col">
          <span class="cap">
            <span>${a("Model")}</span>
            <span class="actions">
              ${p?c`<button type="button" class="link jv-hit" ?disabled=${t} @click=${()=>this._custom=!this._custom}>${this._custom?a("Pick from list"):a("Custom…")}</button>`:m}
              ${e?c`<button type="button" class="link jv-hit" ?disabled=${t||this._loading} @click=${this._refresh}>${a("Refresh")}</button>`:m}
            </span>
          </span>
          ${this._renderModelControl(e,t)}
          ${this._loading?c`<p class="note" role="status">${a("Loading models…")}</p>`:m}
          ${!this._loading&&l?c`<p class="note warn" role="status">${a("No models found — {error}",{error:v})}</p>`:m}
          ${!this._loading&&o&&!d&&!this._custom?c`<p class="note">${a("{count} models from {provider}",{count:s.models.length,provider:e})}</p>`:m}
          ${d?c`
                <div class="mismatch" role="alert">
                  ${x("ha-icon")?c`<ha-icon icon="mdi:alert-outline"></ha-icon>`:m}
                  <span>${a("{model} is not offered by {provider}",{model:n,provider:e})}</span>
                  ${u?c`<button type="button" class="jv-btn" ?disabled=${t} @click=${()=>{this._setModel(u)}}>${a("Use {model}",{model:u})}</button>`:m}
                </div>
              `:m}
          ${this.modelRole.vision?c`<button type="button" class="link jv-hit" @click=${()=>xv(this,"settings","cameras/vision_thinking_enabled")}>${a("Vision throttle and thinking: see Cameras")}</button>`:m}
        </div>
      </div>
    `}};$e.styles=[T,At,S`
      :host {
        display: block;
        min-width: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
        gap: var(--jv-space-3);
        align-items: start;
      }
      :host([narrow]) .grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .col {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
      }
      .cap {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2);
        min-height: 20px;
      }
      .cap .role {
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-text);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-3);
      }
      .mismatch {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-3);
        margin-top: var(--jv-space-1);
        padding: var(--jv-space-2) var(--jv-space-3);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-warn-soft);
        color: var(--jv-text);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      .mismatch .jv-btn {
        min-height: 36px;
        padding: 0 var(--jv-space-3);
      }
      .jv-mono {
        overflow-wrap: anywhere;
      }
    `],h([$({attribute:!1})],$e.prototype,"hass",2),h([$({attribute:!1})],$e.prototype,"data",2),h([$({type:Boolean,reflect:!0})],$e.prototype,"narrow",2),h([$({type:Boolean,reflect:!0})],$e.prototype,"disabled",2),h([$({attribute:!1})],$e.prototype,"host",2),h([$({attribute:!1})],$e.prototype,"modelRole",2),h([$({type:String})],$e.prototype,"provider",2),h([$({type:String})],$e.prototype,"model",2),h([$({type:String})],$e.prototype,"baseSig",2),h([$({type:String})],$e.prototype,"label",2),h([$({type:String})],$e.prototype,"controlId",2),h([b()],$e.prototype,"_list",2),h([b()],$e.prototype,"_loading",2),h([b()],$e.prototype,"_custom",2),h([b()],$e.prototype,"_pendingProvider",2),h([b()],$e.prototype,"_pendingModel",2),h([b()],$e.prototype,"_saving",2),$e=h([A("jarvis-editor-model-role")],$e);var ty=["llm_base_url","custom_base_url","ollama_base_url"];for(let r of kv)Ne(r.providerKey,(i,e,t,n)=>{let s=n.host;return c`
        <jarvis-editor-model-role
          .hass=${n.hass}
          .data=${n.data}
          .narrow=${n.narrow}
          .disabled=${n.disabled}
          .host=${s}
          .modelRole=${r}
          .provider=${Qa(e)}
          .model=${Qa(s?.value(r.modelKey))}
          .baseSig=${ty.map(o=>Qa(s?.value(o))).join("|")}
          .label=${n.label}
          .controlId=${n.id}
        ></jarvis-editor-model-role>
      `},{consumes:[r.modelKey],noReset:!0});function Ja(r){return Array.isArray(r)?r.filter(i=>typeof i=="string"&&i!==""):[]}function Sv(r,i){let e=r?.config?.[i];return Array.isArray(e)?e.filter(t=>!!t&&typeof t=="object"):[]}function Ev(r){let i=r.replace(/[_-]+/g," ").trim();return i?i[0].toUpperCase()+i.slice(1):r}var Ie=class extends L{constructor(){super(...arguments);this.rows=[];this.value=[];this.invert=!1;this.disabled=!1;this.narrow=!1;this.label="";this.controlId="";this.emptyMessage="";this.help="";this.unknownNote="";this.countLabel=""}connectedCallback(){super.connectedCallback(),P(this,Rt)}_isOn(e){let t=this.value.includes(e);return this.invert?!t:t}_toggle(e,t){if(this.disabled||!this.onChange)return;let n=this.invert?!t:t,s=this.value,o=n?s.includes(e)?s:[...s,e]:s.filter(l=>l!==e);(o.length!==s.length||o.some((l,d)=>l!==s[d]))&&this.onChange(o)}render(){let e=new Set(this.rows.map(s=>s.id)),t=this.value.filter(s=>!e.has(s)).map(s=>({id:s,label:Ev(s),secondary:this.unknownNote,unknown:!0})),n=[...this.rows,...t];return n.length?c`
      ${this.countLabel?c`<p class="count">${this.countLabel}</p>`:m}
      <ul class="rows" role="group" aria-label=${this.label} id=${this.controlId||m}>
        ${n.map((s,o)=>{let l=this._isOn(s.id),d=`${this.controlId||"tl"}-${o}`;return c`
            <li class=${s.unknown?"unknown":""} title=${s.id}>
              <label class="text" for=${d}>
                <span class="name">${s.label}</span>
                ${s.secondary?c`<span class="sec ${s.unknown?"":"jv-mono"}">${s.secondary}</span>`:m}
                ${s.unknown?c`<span class="sec jv-mono">${s.id}</span>`:m}
              </label>
              <span class="ctl">
                <span class="state" aria-hidden="true">${$v(l)}</span>
                ${wv({id:d,label:s.label,checked:l,disabled:this.disabled,onChange:u=>this._toggle(s.id,u)})}
              </span>
            </li>
          `})}
      </ul>
      ${this.help?c`<p class="note">${this.help}</p>`:m}
    `:c`
        <p class="empty" id=${this.controlId||m}>${this.emptyMessage}</p>
        ${this.help?c`<p class="note">${this.help}</p>`:m}
      `}};Ie.styles=[T,At,S`
      :host {
        display: block;
        min-width: 0;
      }
      .rows > li.unknown {
        border-left: 3px dashed var(--jv-warn);
      }
      .state {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        min-width: 2.5em;
        text-align: right;
      }
      .count {
        margin: 0 0 var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .empty {
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
    `],h([$({attribute:!1})],Ie.prototype,"rows",2),h([$({attribute:!1})],Ie.prototype,"value",2),h([$({type:Boolean,reflect:!0})],Ie.prototype,"invert",2),h([$({type:Boolean,reflect:!0})],Ie.prototype,"disabled",2),h([$({type:Boolean,reflect:!0})],Ie.prototype,"narrow",2),h([$({type:String})],Ie.prototype,"label",2),h([$({type:String})],Ie.prototype,"controlId",2),h([$({type:String})],Ie.prototype,"emptyMessage",2),h([$({type:String})],Ie.prototype,"help",2),h([$({type:String})],Ie.prototype,"unknownNote",2),h([$({type:String})],Ie.prototype,"countLabel",2),h([$({attribute:!1})],Ie.prototype,"onChange",2),Ie=h([A("jarvis-editor-toggle-list")],Ie);Ne("disabled_sentinel_rules",(r,i,e,t)=>{let n=Sv(t.data,"sentinel_rules").map(s=>{let o=typeof s.id=="string"?s.id:"",l=typeof s.desc=="string"?s.desc:typeof s.name=="string"?s.name:"";return{id:o,label:Ev(o),secondary:l}}).filter(s=>s.id);return c`
    <jarvis-editor-toggle-list
      invert
      .rows=${n}
      .value=${Ja(i)}
      .disabled=${t.disabled}
      .narrow=${t.narrow}
      .label=${t.label}
      .controlId=${t.id}
      .emptyMessage=${a("No sentinel rules reported.")}
      .unknownNote=${a("unknown rule")}
      .countLabel=${n.length?a("{count} rules",{count:n.length}):""}
      .onChange=${s=>e(s)}
    ></jarvis-editor-toggle-list>
  `});Ne("announcement_speakers",(r,i,e,t)=>{let n=Sv(t.data,"cast_devices").map(l=>{let d=typeof l.entity_id=="string"?l.entity_id:"",u=typeof l.name=="string"&&l.name?l.name:_n(t.hass,d);return{id:d,label:u,secondary:d}}).filter(l=>l.id),s=new Set(n.map(l=>l.id)),o=Ja(i).filter(l=>!s.has(l)).map(l=>({id:l,label:_n(t.hass,l),secondary:a("not a Cast device"),unknown:!0}));return c`
    <jarvis-editor-toggle-list
      .rows=${[...n,...o]}
      .value=${Ja(i)}
      .disabled=${t.disabled}
      .narrow=${t.narrow}
      .label=${t.label}
      .controlId=${t.id}
      .emptyMessage=${a("No Cast devices found")}
      .help=${a("Choose the media players JARVIS announces through. Empty = the broadcast group, then every speaker.")}
      .unknownNote=${a("not a Cast device")}
      .onChange=${l=>e(l)}
    ></jarvis-editor-toggle-list>
  `});var ny=r=>i=>{i.stopPropagation();let e=i.detail?.value;r(Array.isArray(e)?e:e?[e]:[])},Rv=r=>i=>{i.stopPropagation();let e=i.detail?.value;r(Array.isArray(e)?e[0]??"":e??"")};Ne("lab_areas",(r,i,e,t)=>c`
  <jv-picker
    id=${t.id}
    kind="area"
    multiple
    .hass=${t.hass}
    .data=${t.data}
    .value=${Ja(i)}
    .label=${t.label}
    .placeholder=${t.placeholder}
    ?disabled=${t.disabled}
    @value-changed=${ny(e)}
  ></jv-picker>
`);Ne("movie_area",(r,i,e,t)=>c`
  <jv-picker
    id=${t.id}
    kind="area"
    .hass=${t.hass}
    .data=${t.data}
    .value=${typeof i=="string"?i:""}
    .label=${t.label}
    .placeholder=${t.placeholder||a("— none —")}
    ?disabled=${t.disabled}
    @value-changed=${Rv(e)}
  ></jv-picker>
`);Ne("movie_media_player",(r,i,e,t)=>c`
  <jv-picker
    id=${t.id}
    kind="entity"
    .domains=${["media_player"]}
    .hass=${t.hass}
    .data=${t.data}
    .value=${typeof i=="string"?i:""}
    .label=${t.label}
    .placeholder=${t.placeholder||a("— none —")}
    ?disabled=${t.disabled}
    @value-changed=${Rv(e)}
  ></jv-picker>
`);function ry(r){if(!r||typeof r!="object"||Array.isArray(r))return{};let i={};for(let[e,t]of Object.entries(r))e&&typeof t=="string"&&(i[e]=t);return i}function Vt(r){return typeof r=="string"?r:""}function iy(r){let i=r?.config?.satellites;if(!Array.isArray(i))return[];let e=new Map;for(let t of Array.isArray(r?.areas)?r.areas:[]){let n=t;Vt(n.id)&&Vt(n.name)&&e.set(Vt(n.id),Vt(n.name))}return i.filter(t=>!!t&&typeof t=="object").map(t=>{let n=Vt(t.entity_id),s=Vt(t.name)||n,o=Vt(t.area_id);return{entity_id:n,name:s,label:Vt(t.area)||e.get(o)||o||s}}).filter(t=>t.entity_id)}function sy(r){let i=r?.config?.cast_devices;return Array.isArray(i)?i.filter(e=>!!e&&typeof e=="object").map(e=>({entity_id:Vt(e.entity_id),name:Vt(e.name)||Vt(e.entity_id)})).filter(e=>e.entity_id):[]}var ot=class extends L{constructor(){super(...arguments);this.value={};this.satellites=[];this.speakers=[];this.disabled=!1;this.narrow=!1;this.label="";this.controlId=""}connectedCallback(){super.connectedCallback(),P(this,Rt)}_set(e,t){if(this.disabled||!this.onChange)return;let n={...this.value};t?n[e]=t:delete n[e],this.onChange(n)}_options(e){let t=[{value:"",label:a("— none —")},...this.speakers.map(n=>({value:n.entity_id,label:n.name}))];return e&&!this.speakers.some(n=>n.entity_id===e)&&t.push({value:e,label:a("{name} (not a Cast device)",{name:_n(this.hass,e)})}),t}render(){let e=new Set(this.satellites.map(n=>n.entity_id)),t=Object.keys(this.value).filter(n=>!e.has(n));return!this.satellites.length&&!t.length?c`<p class="empty" id=${this.controlId||m}>${a("No satellites found")}</p>`:c`
      <ul class="rows" role="group" aria-label=${this.label} id=${this.controlId||m}>
        ${this.satellites.map((n,s)=>{let o=`${this.controlId||"pair"}-${s}`,l=this.value[n.entity_id]??"";return c`
            <li>
              <label class="text" for=${o}>
                <span class="name">${n.label}</span>
                <span class="sec jv-mono">${n.entity_id}</span>
              </label>
              <span class="ctl">
                ${gi({id:o,label:a("Speaker for {name}",{name:n.label}),value:l,options:this._options(l),disabled:this.disabled,onChange:d=>this._set(n.entity_id,d)})}
              </span>
            </li>
          `})}
        ${t.map(n=>c`
            <li class="orphan">
              <span class="text">
                <span class="name">${_n(this.hass,n)} <span class="tag">${a("satellite not found")}</span></span>
                <span class="sec jv-mono">${n} → ${this.value[n]}</span>
              </span>
              <span class="ctl">
                <button type="button" class="jv-btn" ?disabled=${this.disabled} @click=${()=>this._set(n,"")}>${a("Remove")}</button>
              </span>
            </li>
          `)}
      </ul>
    `}};ot.styles=[T,At,S`
      :host {
        display: block;
        min-width: 0;
      }
      .rows > li {
        flex-wrap: wrap;
      }
      .rows .ctl {
        flex: 0 1 260px;
        min-width: 180px;
      }
      :host([narrow]) .rows .ctl {
        flex-basis: 100%;
      }
      .rows > li.orphan {
        border-left: 3px dashed var(--jv-warn);
      }
      .empty {
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .tag {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-warn-text);
      }
    `],h([$({attribute:!1})],ot.prototype,"hass",2),h([$({attribute:!1})],ot.prototype,"value",2),h([$({attribute:!1})],ot.prototype,"satellites",2),h([$({attribute:!1})],ot.prototype,"speakers",2),h([$({type:Boolean,reflect:!0})],ot.prototype,"disabled",2),h([$({type:Boolean,reflect:!0})],ot.prototype,"narrow",2),h([$({type:String})],ot.prototype,"label",2),h([$({type:String})],ot.prototype,"controlId",2),h([$({attribute:!1})],ot.prototype,"onChange",2),ot=h([A("jarvis-editor-pairings")],ot);Ne("satellite_pairings",(r,i,e,t)=>c`
  <jarvis-editor-pairings
    .hass=${t.hass}
    .value=${ry(i)}
    .satellites=${iy(t.data)}
    .speakers=${sy(t.data)}
    .disabled=${t.disabled}
    .narrow=${t.narrow}
    .label=${t.label}
    .controlId=${t.id}
    .onChange=${n=>e(n)}
  ></jarvis-editor-pairings>
`);var fc=["washer","dryer","dishwasher","oven","microwave","appliance"],ay=/(washer|dryer|dishwash|laundry|appliance|run_complete|cycle_complete|job_state|machine_state)/i,oy=5,Tv=0,sr=new Map;function to(r){return typeof r=="string"?r:""}function mc(r){if(!Array.isArray(r))return[];let i=[];for(let e of r){if(!e||typeof e!="object")continue;let t=e,n=Number(t.watts),s=to(t.type).trim().toLowerCase()||"appliance";i.push({name:to(t.name).trim(),type:s,entity:to(t.entity).trim(),watts:Number.isFinite(n)?n:0})}return i}function Av(r){return r.map(i=>({uid:++Tv,name:i.name,type:i.type,entity:i.entity,watts:i.watts?String(i.watts):""}))}function eo(r){return r.map(i=>({name:i.name.trim(),type:fc.includes(i.type)?i.type:"appliance",entity:i.entity.trim(),watts:Number(i.watts)||0})).filter(i=>i.name)}function Cv(r,i){return r.length===i.length&&r.every((e,t)=>e.name===i[t].name&&e.type===i[t].type&&e.entity===i[t].entity&&e.watts===i[t].watts)}function ly(r){let i=r?.config?.appliances,e=i&&typeof i=="object"?i.profile:void 0;return Array.isArray(e)?e.filter(t=>!!t&&typeof t=="object").map(t=>({name:to(t.name),learned_w:Number(t.learned_w)})).filter(t=>t.name&&Number.isFinite(t.learned_w)&&t.learned_w>0):[]}function cy(r){let i=[];for(let e of Object.values(r?.states??{})){let t=e.entity_id;if(!/^(sensor|binary_sensor)\./.test(t))continue;let n=String(e.attributes?.device_class??"").toLowerCase(),s=String(e.attributes?.unit_of_measurement??"").toLowerCase();if(n==="power"||n==="energy"||s==="w"||s==="kw"||ay.test(t)){let o=_n(r,t);i.push({value:t,label:o,secondary:o!==t?t:void 0})}}return i.sort((e,t)=>e.label.localeCompare(t.label,void 0,{sensitivity:"base"}))}var He=class extends L{constructor(){super(...arguments);this.data=null;this.value=[];this.fieldKey="appliance_profile";this.disabled=!1;this.narrow=!1;this.label="";this.controlId="";this._draft=[];this._saving=!1;this._focusUid=null}connectedCallback(){super.connectedCallback(),P(this,Rt)}willUpdate(e){if(e.has("fieldKey")&&sr.has(this.fieldKey)&&(this._draft=sr.get(this.fieldKey)??[]),e.has("value")||e.has("fieldKey")){let t=mc(this.value),n=sr.get(this.fieldKey);!n||Cv(eo(n),t)||!this._saving&&!this._dirty(n,t)?(this._draft=Av(t),sr.delete(this.fieldKey)):this._draft=n}}updated(){if(this._focusUid===null)return;let e=this._draft.findIndex(n=>n.uid===this._focusUid);if(this._focusUid=null,e<0)return;this.renderRoot.querySelector(`[id="${this._idBase(e)}-name"]`)?.focus?.()}_idBase(e){return`${this.controlId||"appl"}-${e}`}_dirty(e,t=mc(this.value)){return Cv(eo(e),t)?e.some(n=>!n.name.trim()&&(n.entity.trim()||n.watts.trim())):!0}_update(e,t){this._draft=this._draft.map(n=>n.uid===e?{...n,...t}:n),sr.set(this.fieldKey,this._draft)}_add(){let e={uid:++Tv,name:"",type:"appliance",entity:"",watts:""};this._draft=[...this._draft,e],sr.set(this.fieldKey,this._draft),this._focusUid=e.uid}_remove(e){this._draft=this._draft.filter(t=>t.uid!==e),sr.set(this.fieldKey,this._draft)}_invalid(e){return!e.name.trim()&&!!(e.entity.trim()||e.watts.trim())}async _save(){if(!this.host||this._saving)return;let e=eo(this._draft);this._saving=!0;try{(await this.host.save(this.fieldKey,e)).ok&&(sr.delete(this.fieldKey),this._draft=Av(e))}finally{this._saving=!1}}_learnedFor(e){let t=e.name.trim().toLowerCase();if(!t)return null;let n=ly(this.data).find(o=>o.name.trim().toLowerCase()===t);if(!n)return null;let s=Number(e.watts)||0;return Math.abs(n.learned_w-s)>oy?Math.round(n.learned_w):null}_renderRow(e,t){let n=this.disabled||this._saving,s=this._invalid(e),o=this._learnedFor(e),l=this._idBase(t),d=u=>{u.stopPropagation();let p=u.detail?.value;this._update(e.uid,{entity:Array.isArray(p)?p[0]??"":p??""})};return c`
      <li class="row ${s?"invalid":""}">
        <div class="cell">
          <span class="cap" id="${l}-name-cap">${a("Name")}</span>
          ${bi({id:`${l}-name`,label:a("Name"),value:e.name,placeholder:a("e.g. Washer"),disabled:n,invalid:s,onInput:u=>this._update(e.uid,{name:u}),onChange:u=>this._update(e.uid,{name:u})})}
          ${s?c`<span class="hint-error" role="alert">${a("Name required")}</span>`:m}
        </div>
        <div class="cell">
          <span class="cap">${a("Type")}</span>
          ${gi({id:`${l}-type`,label:a("Type"),value:fc.includes(e.type)?e.type:"appliance",options:fc.map(u=>({value:u,label:u})),disabled:n,onChange:u=>this._update(e.uid,{type:u})})}
        </div>
        <div class="cell wide">
          <span class="cap">${a("Entity")}</span>
          <jv-picker
            kind="entity"
            allow-custom
            .hass=${this.hass}
            .data=${this.data}
            .items=${cy(this.hass)}
            .domains=${["sensor","binary_sensor"]}
            .value=${e.entity}
            .label=${a("Entity")}
            .placeholder=${a("power or status sensor (optional)")}
            ?disabled=${n}
            @value-changed=${d}
          ></jv-picker>
        </div>
        <div class="cell">
          <span class="cap">${a("Watts")}</span>
          ${bi({id:`${l}-watts`,label:a("Watts"),type:"number",min:0,step:10,value:e.watts,placeholder:a("watts"),disabled:n,onInput:u=>this._update(e.uid,{watts:u}),onChange:u=>this._update(e.uid,{watts:u})})}
          ${o!==null?c`
                <span class="learned">
                  <span>${a("learned ~{watts} W",{watts:o})}</span>
                  <button type="button" class="link jv-hit" ?disabled=${n} @click=${()=>this._update(e.uid,{watts:String(o)})}>${a("Use")}</button>
                </span>
              `:m}
        </div>
        <div class="cell remove">
          ${x("ha-icon-button")?c`<ha-icon-button .label=${a("Remove appliance")} ?disabled=${n} @click=${()=>this._remove(e.uid)}><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>`:c`<button type="button" class="jv-icon-btn" aria-label=${a("Remove appliance")} ?disabled=${n} @click=${()=>this._remove(e.uid)}>×</button>`}
        </div>
      </li>
    `}render(){let e=this.disabled||this._saving,t=mc(this.value),n=this._dirty(this._draft,t),s=this._draft.some(l=>this._invalid(l)),o=eo(this._draft).length;return c`
      ${this._draft.length?c`<ul class="list" role="group" aria-label=${this.label} id=${this.controlId||m}>${this._draft.map((l,d)=>this._renderRow(l,d))}</ul>`:c`<p class="empty" id=${this.controlId||m}>${a("No appliances declared yet — JARVIS falls back to generic power guesses until you add some.")}</p>`}
      <div class="foot">
        <button type="button" class="jv-btn" ?disabled=${e} @click=${this._add}>${a("+ Add appliance")}</button>
        <span class="right">
          ${n&&!this._saving?c`<span class="dirty">${a("{count} items",{count:o})} · ${a("unsaved")}</span>`:m}
          <button type="button" class="jv-btn primary" ?disabled=${e||!n||s} @click=${this._save}>${this._saving?a("Saving…"):a("Save appliances")}</button>
        </span>
      </div>
    `}};He.styles=[T,At,S`
      :host {
        display: block;
        min-width: 0;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .row {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1.6fr) minmax(0, 0.7fr) auto;
        gap: var(--jv-space-2);
        align-items: start;
        padding: var(--jv-space-2) var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
      }
      :host([narrow]) .row {
        grid-template-columns: minmax(0, 1fr) auto;
      }
      :host([narrow]) .row > .cell.wide {
        grid-column: 1 / -1;
      }
      .cell {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .cell > .cap {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .row.invalid {
        border-color: var(--jv-danger);
      }
      .remove {
        align-self: center;
      }
      .learned {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-1) var(--jv-space-2);
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .learned .link {
        min-height: 24px;
        font-size: var(--jv-font-size-xs);
      }
      .foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-top: var(--jv-space-3);
      }
      .foot .right {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2) var(--jv-space-3);
        margin-left: auto;
      }
      :host([narrow]) .foot .jv-btn {
        flex: 1 1 auto;
      }
      .empty {
        margin: 0 0 var(--jv-space-2);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      .dirty {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
      }
      .hint-error {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-danger-text);
      }
    `],h([$({attribute:!1})],He.prototype,"hass",2),h([$({attribute:!1})],He.prototype,"data",2),h([$({attribute:!1})],He.prototype,"value",2),h([$({attribute:!1})],He.prototype,"host",2),h([$({type:String})],He.prototype,"fieldKey",2),h([$({type:Boolean,reflect:!0})],He.prototype,"disabled",2),h([$({type:Boolean,reflect:!0})],He.prototype,"narrow",2),h([$({type:String})],He.prototype,"label",2),h([$({type:String})],He.prototype,"controlId",2),h([b()],He.prototype,"_draft",2),h([b()],He.prototype,"_saving",2),h([b()],He.prototype,"_focusUid",2),He=h([A("jarvis-editor-appliances")],He);Ne("appliance_profile",(r,i,e,t)=>c`
  <jarvis-editor-appliances
    .hass=${t.hass}
    .data=${t.data}
    .value=${i}
    .host=${t.host}
    .fieldKey=${r.key}
    .disabled=${t.disabled}
    .narrow=${t.narrow}
    .label=${t.label}
    .controlId=${t.id}
  ></jarvis-editor-appliances>
`);var Mv=Kn(class extends en{constructor(){super(...arguments),this.key=m}render(r,i){return this.key=r,i}update(r,[i,e]){return i!==this.key&&(qr(r),this.key=i),e}});var ps="!";function dy(r){return Array.isArray(r)?r.filter(i=>typeof i=="string"&&i!==""):[]}function no(r){return r.startsWith(ps)?r.slice(ps.length):r}var tt=class extends L{constructor(){super(...arguments);this.data=null;this.value=[];this.disabled=!1;this.narrow=!1;this.label="";this.controlId="";this.placeholder="";this._addKey=0}connectedCallback(){super.connectedCallback(),P(this,Rt)}_commit(e){if(this.disabled||!this.onChange)return;let t=this.value;e.length===t.length&&e.every((n,s)=>n===t[s])||this.onChange(e)}_setExempt(e,t){let n=this.value,s=n[e];if(s===void 0)return;let o=no(s),l=t?ps+o:o;l!==s&&this._commit(n.map((d,u)=>u===e?l:d).filter((d,u)=>u===e||no(d)!==o))}_remove(e){this._commit(this.value.filter((t,n)=>n!==e))}_onAdd(e){e.stopPropagation();let t=e.detail?.value,n=(Array.isArray(t)?t[0]:t)?.trim();this._addKey++,!(!n||n.startsWith(ps))&&(this.value.some(s=>no(s)===n)||this._commit([...this.value,n]))}_renderRow(e,t){let n=e.startsWith(ps),s=no(e),o=_n(this.hass,s),l=!!this.hass?.states&&!this.hass.states[s],d=this.disabled;return c`
      <li class=${l?"missing":""} title=${e}>
        <span class="text">
          <span class="name">${o}</span>
          ${o!==s?c`<span class="sec jv-mono">${s}</span>`:m}
          ${n||l?c`<span class="badges">
                ${n?c`<jv-state-badge level="neutral" nodot .label=${a("exempt")}></jv-state-badge>`:m}
                ${l?c`<jv-state-badge level="warn" nodot .label=${a("not found")}></jv-state-badge>`:m}
              </span>`:m}
        </span>
        <span class="ctl">
          <span class="seg" role="group" aria-label=${o}>
            <button type="button" class="jv-hit" aria-pressed=${n?"false":"true"} ?disabled=${d} @click=${()=>this._setExempt(t,!1)}>${a("Require")}</button>
            <button type="button" class="jv-hit" aria-pressed=${n?"true":"false"} ?disabled=${d} @click=${()=>this._setExempt(t,!0)}>${a("Exempt")}</button>
          </span>
          <button type="button" class="x" aria-label=${a("Remove {name}",{name:o})} ?disabled=${d} @click=${()=>this._remove(t)}>×</button>
        </span>
      </li>
    `}render(){let e=this.value;return c`
      ${e.length?c`<ul class="rows" aria-label=${this.label}>${e.map((t,n)=>this._renderRow(t,n))}</ul>`:m}
      ${Mv(this._addKey,c`<jv-picker
          id=${this.controlId||m}
          kind="entity"
          .hass=${this.hass}
          .data=${this.data}
          .value=${""}
          .label=${this.label}
          .placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          @value-changed=${this._onAdd}
        ></jv-picker>`)}
    `}};tt.styles=[T,At,S`
      :host {
        display: block;
        min-width: 0;
      }
      .rows {
        margin-bottom: var(--jv-space-2);
      }
      .rows > li.missing {
        border-left: 3px dashed var(--jv-warn);
      }
      :host([narrow]) .rows > li {
        flex-wrap: wrap;
      }
      :host([narrow]) .rows .ctl {
        width: 100%;
        justify-content: space-between;
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1);
      }
      .seg {
        display: inline-flex;
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        overflow: visible;
      }
      .seg button {
        appearance: none;
        position: relative;
        min-height: 32px;
        min-width: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: 0;
        border-radius: var(--jv-radius-pill);
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        cursor: pointer;
      }
      .seg button[aria-pressed="true"] {
        background: var(--jv-accent);
        color: var(--jv-on-accent);
      }
      .seg button:disabled {
        cursor: default;
        opacity: 0.6;
      }
      .x {
        appearance: none;
        flex: none;
        width: var(--jv-tap);
        height: var(--jv-tap);
        margin: -6px 0;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-l);
        line-height: 1;
        cursor: pointer;
      }
      .x:hover {
        background: var(--jv-hover);
        color: var(--jv-text);
      }
      .x:disabled {
        cursor: default;
        color: var(--jv-text-3);
      }
    `],h([$({attribute:!1})],tt.prototype,"hass",2),h([$({attribute:!1})],tt.prototype,"data",2),h([$({attribute:!1})],tt.prototype,"value",2),h([$({type:Boolean,reflect:!0})],tt.prototype,"disabled",2),h([$({type:Boolean,reflect:!0})],tt.prototype,"narrow",2),h([$({type:String})],tt.prototype,"label",2),h([$({type:String})],tt.prototype,"controlId",2),h([$({type:String})],tt.prototype,"placeholder",2),h([$({attribute:!1})],tt.prototype,"onChange",2),h([b()],tt.prototype,"_addKey",2),tt=h([A("jarvis-editor-voice-confirm")],tt);Ne("voice_confirm_entities",(r,i,e,t)=>c`
  <jarvis-editor-voice-confirm
    .hass=${t.hass}
    .data=${t.data}
    .value=${dy(i)}
    .disabled=${t.disabled}
    .narrow=${t.narrow}
    .label=${t.label}
    .controlId=${t.id}
    .placeholder=${t.placeholder}
    .onChange=${n=>e(n)}
  ></jarvis-editor-voice-confirm>
`);var Pv=[["heart_rate",()=>a("Heart rate")],["resting_hr",()=>a("Resting heart rate")],["sleep_stage",()=>a("Sleep stage")],["sleep_state",()=>a("Sleep state")],["spo2",()=>a("Blood oxygen (SpO2)")],["steps",()=>a("Steps")],["respiratory",()=>a("Respiratory rate")],["stress",()=>a("Stress")],["temperature",()=>a("Body temperature")]],uy=new Set(Pv.map(([r])=>r)),py=["sensor","binary_sensor"];function gc(r){return r&&typeof r=="object"&&!Array.isArray(r)?r:{}}var pt=class extends L{constructor(){super(...arguments);this.data=null;this.value={};this.disabled=!1;this.narrow=!1;this.label="";this.controlId=""}connectedCallback(){super.connectedCallback(),P(this,Rt)}_set(e,t){if(this.disabled||!this.onChange)return;let n=gc(this.value),s=typeof n[e]=="string"?n[e]:"";if(t===s&&(t!==""||!(e in n)))return;let o={...n};t?o[e]=t:delete o[e],this.onChange(o)}_onPick(e,t){t.stopPropagation();let n=t.detail?.value;this._set(e,(Array.isArray(n)?n[0]??"":n??"").trim())}render(){let e=gc(this.value),t=Object.keys(e).filter(n=>!uy.has(n));return c`
      <ul class="rows" role="group" aria-label=${this.label} id=${this.controlId||m}>
        ${Pv.map(([n,s])=>{let o=s(),l=e[n];return c`
            <li>
              <span class="text">
                <span class="name">${o}</span>
                <span class="sec jv-mono">${n}</span>
              </span>
              <jv-picker
                kind="entity"
                .domains=${py}
                .hass=${this.hass}
                .data=${this.data}
                .value=${typeof l=="string"?l:""}
                .label=${o}
                ?disabled=${this.disabled}
                @value-changed=${d=>this._onPick(n,d)}
              ></jv-picker>
            </li>
          `})}
        ${t.map(n=>{let s=e[n],o=typeof s=="string"?s:JSON.stringify(s);return c`
            <li class="unknown" title=${n}>
              <span class="text">
                <span class="name jv-mono">${n}</span>
                <span class="sec">${a("unknown kind")} · <span class="jv-mono">${o}</span></span>
              </span>
              <button type="button" class="remove" ?disabled=${this.disabled} aria-label=${a("Remove {name}",{name:n})} @click=${()=>this._set(n,"")}>${a("Remove")}</button>
            </li>
          `})}
      </ul>
    `}};pt.styles=[T,At,S`
      :host {
        display: block;
        min-width: 0;
      }
      .rows > li {
        display: grid;
        grid-template-columns: minmax(0, 11em) minmax(0, 1fr);
        align-items: center;
      }
      :host([narrow]) .rows > li {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-1);
      }
      .rows > li.unknown {
        grid-template-columns: minmax(0, 1fr) auto;
        border-left: 3px dashed var(--jv-warn);
      }
      jv-picker {
        min-width: 0;
      }
      .remove {
        appearance: none;
        min-height: var(--jv-tap);
        min-width: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        cursor: pointer;
      }
      .remove:hover {
        background: var(--jv-hover);
      }
      .remove:disabled {
        cursor: default;
        color: var(--jv-text-3);
      }
    `],h([$({attribute:!1})],pt.prototype,"hass",2),h([$({attribute:!1})],pt.prototype,"data",2),h([$({attribute:!1})],pt.prototype,"value",2),h([$({type:Boolean,reflect:!0})],pt.prototype,"disabled",2),h([$({type:Boolean,reflect:!0})],pt.prototype,"narrow",2),h([$({type:String})],pt.prototype,"label",2),h([$({type:String})],pt.prototype,"controlId",2),h([$({attribute:!1})],pt.prototype,"onChange",2),pt=h([A("jarvis-editor-biometrics-map")],pt);Ne("biometric_entities",(r,i,e,t)=>c`
  <jarvis-editor-biometrics-map
    .hass=${t.hass}
    .data=${t.data}
    .value=${gc(i)}
    .disabled=${t.disabled}
    .narrow=${t.narrow}
    .label=${t.label}
    .controlId=${t.id}
    .onChange=${n=>e(n)}
  ></jarvis-editor-biometrics-map>
`);var hy=["ha-icon","ha-icon-button","ha-alert","ha-switch","ha-select","ha-list-item","mwc-list-item"];function ht(r){return r.code==="unknown_command"?a("Not available on this backend — update the JARVIS integration."):r.message||r.code}function Lv(r,i){let e=r?.states?.[i]?.attributes?.friendly_name;return typeof e=="string"&&e?e:i}var vy=S`
  :host {
    display: block;
    min-width: 0;
    border-radius: var(--jv-radius);
    transition: box-shadow var(--jv-ease);
  }
  :host([flash]) {
    box-shadow: 0 0 0 var(--jv-space-2) var(--jv-accent-soft);
  }
  .intro,
  .note {
    margin: 0 0 var(--jv-space-3);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .note {
    margin: var(--jv-space-2) 0 0;
  }
  .status {
    margin: var(--jv-space-2) 0 0;
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
    overflow-wrap: anywhere;
  }
  .status.err {
    color: var(--jv-danger-text);
  }
  .status.ok {
    color: var(--jv-ok-text);
  }
  .alert {
    display: flex;
    flex-direction: column;
    gap: var(--jv-space-2);
    margin: 0 0 var(--jv-space-3);
    padding: var(--jv-space-2) var(--jv-space-3);
    border-radius: var(--jv-radius-sm);
    border-left: 4px solid var(--jv-info);
    background: var(--jv-info-soft);
    font-size: var(--jv-font-size-s);
    overflow-wrap: anywhere;
  }
  .alert.error {
    border-left-color: var(--jv-danger);
    background: var(--jv-danger-soft);
  }
  .alert.warning {
    border-left-color: var(--jv-warn);
    background: var(--jv-warn-soft);
  }
  .alert.success {
    border-left-color: var(--jv-ok);
    background: var(--jv-ok-soft);
  }
  .alert .actions,
  ha-alert .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
  }
  ha-alert {
    display: block;
    margin: 0 0 var(--jv-space-3);
  }
  .actions-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--jv-space-2) var(--jv-space-3);
    margin-top: var(--jv-space-3);
  }
  :host([narrow]) .actions-row .jv-btn.primary {
    width: 100%;
  }
  .link {
    appearance: none;
    display: inline-flex;
    align-items: center;
    min-height: var(--jv-tap);
    padding: 0 var(--jv-space-2);
    border: 0;
    background: transparent;
    color: var(--jv-accent-text);
    font: inherit;
    font-size: var(--jv-font-size-s);
    text-decoration: underline;
    cursor: pointer;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--jv-space-2);
    align-items: center;
  }
  .head-meta {
    display: inline-flex;
    align-items: center;
    gap: var(--jv-space-2);
    color: var(--jv-text-2);
    font-size: var(--jv-font-size-s);
  }
  h3 {
    margin: var(--jv-space-4) 0 var(--jv-space-2);
    font-size: var(--jv-font-size-m);
    font-weight: var(--jv-font-weight-medium);
  }
  ul.plain {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  select {
    min-height: var(--jv-tap);
    max-width: 100%;
    padding: 0 var(--jv-space-2);
    border: var(--jv-border-width) solid var(--jv-border);
    border-radius: var(--jv-radius-sm);
    background: var(--jv-surface);
    color: var(--jv-text);
    font: inherit;
  }
  .sr-status {
    margin: var(--jv-space-2) 0 0;
    font-size: var(--jv-font-size-s);
    color: var(--jv-text-2);
  }
`,ce=class extends L{constructor(){super(...arguments);this.data=null;this.narrow=!1;this.active=!1;this.flash=!1;this._activated=!1}static{this.styles=[T,vy]}connectedCallback(){super.connectedCallback(),P(this,hy)}updated(e){super.updated(e),!this._activated&&this.active&&this.hass&&(this._activated=!0,this.onFirstActive())}onFirstActive(){}get offline(){return!this.hass}ws(e,t){return X(this.hass,e,t)}value(e){return this.host?.value(e)}toast(e){this.host?this.host.toast(e):this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:e},bubbles:!0,composed:!0}))}navigate(e,t){let n={view:e,path:t};this.dispatchEvent(new CustomEvent("jarvis-navigate",{bubbles:!0,composed:!0,detail:n}))}renderAlert(e,t,n){let s=n&&n!==m?c`<div class="actions">${n}</div>`:m;return x("ha-alert")?c`<ha-alert alert-type=${e}>${t}${s}</ha-alert>`:c`<div class="alert ${e}" role=${e==="error"||e==="warning"?"alert":"status"}><span>${t}</span>${s}</div>`}renderError(e,t){let n=t?c`<button type="button" class="jv-btn" @click=${t}>${a("Retry")}</button>`:m;return this.renderAlert("error",e,n)}renderIconButton(e,t,n,s=!1,o){return x("ha-icon-button")?c`<ha-icon-button slot=${o??m} .label=${t} title=${t} .disabled=${s} @click=${n}>
        ${x("ha-icon")?c`<ha-icon .icon=${e}></ha-icon>`:c`<span aria-hidden="true">↻</span>`}
      </ha-icon-button>`:c`<button slot=${o??m} type="button" class="jv-icon-btn" aria-label=${t} title=${t} ?disabled=${s} @click=${n}>
      ${x("ha-icon")?c`<ha-icon .icon=${e}></ha-icon>`:c`<span aria-hidden="true">↻</span>`}
    </button>`}renderLink(e,t){return c`<button type="button" class="link" @click=${t}>${e}</button>`}};h([$({attribute:!1})],ce.prototype,"hass",2),h([$({attribute:!1})],ce.prototype,"data",2),h([$({type:Boolean,reflect:!0})],ce.prototype,"narrow",2),h([$({attribute:!1})],ce.prototype,"host",2),h([$({type:Boolean})],ce.prototype,"active",2),h([$({type:Boolean,reflect:!0})],ce.prototype,"flash",2);var my=6e3;function bc(r){let i=r("announcement_speakers");if(Array.isArray(i)&&i.some(t=>typeof t=="string"&&t.trim()))return!0;let e=r("broadcast_group");return typeof e=="string"&&e.trim()!==""}var ar=class extends ce{constructor(){super(...arguments);this._busy=!1;this._status="";this._error=null;this._noSpeakers=!1}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._timer)}async _briefNow(){if(this._busy)return;if(this._error=null,this._status="",!bc(t=>this.value(t))){this._noSpeakers=!0;return}this._noSpeakers=!1;let e=this.hass;if(!e||typeof e.callService!="function"){this._error=a("Home Assistant connection not available");return}this._busy=!0;try{await e.callService("jarvis","briefing",{announce:!0}),this._status=a("Briefing requested — listen for it."),clearTimeout(this._timer),this._timer=setTimeout(()=>{this._status=""},my)}catch(t){let n=t;this._error=String(n?.message??t??"jarvis.briefing failed")}finally{this._busy=!1}}_schedule(){let e=[];return this.value("briefing_morning_enabled")===!0&&e.push(a("Morning {time}",{time:String(this.value("briefing_morning_time")??"")})),this.value("briefing_evening_enabled")===!0&&e.push(a("Evening {time}",{time:String(this.value("briefing_evening_time")??"")})),e}render(){let e=this._schedule(),t=e.length>0;return c`
      <jv-section .heading=${a("Briefings")} icon="mdi:weather-sunset-up">
        <jv-state-badge slot="actions" level=${t?"ok":"neutral"} .label=${t?a("Scheduled"):a("Off")}></jv-state-badge>
        <p class="intro">
          ${t?e.join(" · "):a("No briefing scheduled.")}
          ${this.renderLink(a("Edit schedule"),()=>this.navigate("settings","core/briefing_morning_enabled"))}
        </p>
        ${this._noSpeakers?this.renderAlert("warning",a("No announcement speakers set — choose them under Voice & Audio › Announcement Speakers."),c`<button type="button" class="jv-btn" @click=${()=>this.navigate("settings","voice/announcement_speakers")}>${a("Choose speakers")}</button>`):m}
        ${this._error?this.renderAlert("error",this._error):m}
        <div class="actions-row">
          <button type="button" class="jv-btn primary" ?disabled=${this.offline||this._busy} @click=${()=>{this._briefNow()}}>
            ${this._busy?a("Briefing…"):a("Brief me now")}
          </button>
        </div>
        <p class="status ok" role="status" aria-live="polite">${this._status}</p>
      </jv-section>
    `}};h([b()],ar.prototype,"_busy",2),h([b()],ar.prototype,"_status",2),h([b()],ar.prototype,"_error",2),h([b()],ar.prototype,"_noSpeakers",2),ar=h([A("jarvis-tool-briefing")],ar);var fy=4e3,gy=[{id:"tts",label:()=>a("TTS — JARVIS voice test"),service:"test_tts"},{id:"observer",label:()=>a("Observer — fire status event"),service:"observer_status"},{id:"briefing",label:()=>a("Briefing — manual trigger"),service:"briefing"},{id:"doorbell",label:()=>a("Doorbell — run diagnostics"),service:"diagnose_doorbell"},{id:"notify",label:()=>a("Notification — test phone push"),service:"test_notify"},{id:"routing",label:()=>a("Routing — dump routing state to log"),service:"test_routing"},{id:"camera",label:()=>a("Camera — analyze now (vision → reasoning)"),service:"analyze_camera"}],wn=class extends ce{constructor(){super(...arguments);this._busy={};this._done={};this._errors={};this._camera="";this._briefingGuard=!1;this._timers=new Map}disconnectedCallback(){super.disconnectedCallback();for(let e of this._timers.values())clearTimeout(e);this._timers.clear()}_cameras(){let e=this.data?.config?.cameras;return Array.isArray(e)?e.filter(t=>!!t&&typeof t=="object"&&typeof t.entity_id=="string").filter(t=>t.enabled!==!1):[]}_selectedCamera(){let e=this._cameras();return this._camera&&e.some(t=>t.entity_id===this._camera)?this._camera:e[0]?.entity_id??""}async _run(e){if(this._busy[e.id])return;let t=this.hass,{[e.id]:n,...s}=this._errors;this._errors=s;let{[e.id]:o,...l}=this._done;if(this._done=l,e.id==="briefing"){if(!bc(u=>this.value(u))){this._briefingGuard=!0;return}this._briefingGuard=!1}if(!t||typeof t.callService!="function"){this._errors={...this._errors,[e.id]:a("Home Assistant connection not available")};return}let d={...e.data??{}};if(e.id==="camera"){let u=this._selectedCamera();if(!u)return;let p=this._cameras().find(f=>f.entity_id===u)?.name||u;if(!await U({heading:a("Analyze {name} now?",{name:p}),message:a("JARVIS runs one vision → reasoning pass on this camera and announces the result. It uses LLM credits and takes a few seconds."),confirmLabel:a("Analyze now"),cancelLabel:a("Cancel")})||this._busy[e.id])return;d={entity_id:u,announce:!0}}this._busy={...this._busy,[e.id]:!0};try{await t.callService("jarvis",e.service,d),this._done={...this._done,[e.id]:!0},clearTimeout(this._timers.get(e.id)),this._timers.set(e.id,setTimeout(()=>{let{[e.id]:u,...p}=this._done;this._done=p},fy))}catch(u){let p=u;this._errors={...this._errors,[e.id]:String(p?.message??u??`jarvis.${e.service} failed`)}}finally{let{[e.id]:u,...p}=this._busy;this._busy=p}}_onCamera(e){this._camera=String(e.target.value??"")}_renderCameraSelect(e){let t=a("Camera — analyze now (vision → reasoning)"),n=this._selectedCamera();if(!e.length)return c`<select aria-label=${t} disabled><option>${a("— no cameras —")}</option></select>`;if(x("ha-select")){let s=x("ha-list-item")?Te`ha-list-item`:Te`mwc-list-item`;return c`
        <ha-select .label=${a("Camera")} .value=${I(n)} ?disabled=${this.offline} naturalMenuWidth fixedMenuPosition @selected=${this._onCamera} @closed=${o=>o.stopPropagation()}>
          ${e.map(o=>ye`<${s} value=${o.entity_id}>${o.name||o.entity_id}</${s}>`)}
        </ha-select>
      `}return c`
      <select aria-label=${t} .value=${I(n)} ?disabled=${this.offline} @change=${this._onCamera}>
        ${e.map(s=>c`<option value=${s.entity_id}>${s.name||s.entity_id}</option>`)}
      </select>
    `}_renderRow(e){let t=!!this._busy[e.id],n=this.offline||t,s=m;e.id==="notify"&&String(this.value("notify_service")??"")===""&&(n=!0,s=c`<p class="msg">${a("No notify service set")}</p>`);let o=e.id==="camera"?this._cameras():[];e.id==="camera"&&!o.length&&(n=!0);let l=this._errors[e.id];return c`
      <li class="row">
        ${e.id==="camera"?c`<div class="cam"><span class="label">${e.label()}</span>${this._renderCameraSelect(o)}</div>`:c`<span class="label">${e.label()}</span>`}
        <button type="button" class="jv-btn" ?disabled=${n} @click=${()=>{this._run(e)}}>${t?a("Running…"):a("Run")}</button>
        ${s}
        ${this._done[e.id]?c`<p class="msg" role="status">${a("Done — check the speakers / log.")}</p>`:m}
        ${l?c`<p class="msg err" role="alert">${l}</p>`:m}
        ${e.id==="briefing"&&this._briefingGuard?c`<p class="msg">${a("No announcement speakers set — choose them under Voice & Audio › Announcement Speakers.")}
              ${this.renderLink(a("Choose speakers"),()=>this.navigate("settings","voice/announcement_speakers"))}</p>`:m}
      </li>
    `}render(){return c`
      <jv-section .heading=${a("Diagnostics")} .subheading=${a("Test")} icon="mdi:stethoscope">
        <ul class="rows">${gy.map(e=>this._renderRow(e))}</ul>
      </jv-section>
    `}};wn.styles=[...ce.styles,S`
      ul.rows {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li.row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--jv-space-1) var(--jv-space-3);
        align-items: center;
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) 0;
        border-top: 1px solid var(--jv-divider);
      }
      li.row:first-child {
        border-top: 0;
      }
      :host([narrow]) li.row {
        grid-template-columns: minmax(0, 1fr);
      }
      :host([narrow]) li.row .jv-btn {
        width: 100%;
      }
      .label {
        overflow-wrap: anywhere;
      }
      .msg {
        grid-column: 1 / -1;
        margin: 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .msg.err {
        color: var(--jv-danger-text);
      }
      .cam {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
        align-items: center;
        min-width: 0;
      }
      .cam select,
      .cam ha-select {
        min-width: 0;
        flex: 1 1 160px;
      }
    `],h([b()],wn.prototype,"_busy",2),h([b()],wn.prototype,"_done",2),h([b()],wn.prototype,"_errors",2),h([b()],wn.prototype,"_camera",2),h([b()],wn.prototype,"_briefingGuard",2),wn=h([A("jarvis-tool-diagnostics")],wn);var Fr=class extends ce{constructor(){super(...arguments);this._busy=!1;this._result=null;this._error=null}async _test(){if(!this._busy){this._busy=!0,this._result=null,this._error=null;try{let e=await this.ws("jarvis/voice_confirm_test");this._result=e&&typeof e=="object"?e:{ok:!1,note:""}}catch(e){this._error=ht(Y.from("jarvis/voice_confirm_test",e))}finally{this._busy=!1}}}_renderResult(){if(this._error)return this.renderAlert("error",this._error);let e=this._result;return e?e.ok?this.renderAlert("success",c`${e.note??""}${e.satellite?c` <span class="jv-mono">${e.satellite}</span>`:m}`):this.renderAlert("warning",c`${e.note??""}${e.error?c`<br />${e.error}`:m}`):m}render(){let e=this.value("voice_confirm_enabled")===!0,t=String(this.value("voice_confirm_mode")??"");return c`
      <jv-section .heading=${a("Voice Confirmation")} icon="mdi:microphone-question" .loading=${this._busy}>
        <span slot="actions" class="head-meta">
          ${t?c`<span>${a(On("voice_confirm_mode",t))}</span>`:m}
          <jv-state-badge level=${e?"ok":"neutral"} .label=${e?a("ON"):a("OFF")}></jv-state-badge>
        </span>
        <p class="intro">${a("Run the test to see whether your satellite can speak on its own (native mode) or needs the room speaker (gated mode).")}</p>
        <div class="actions-row">
          <button type="button" class="jv-btn primary" ?disabled=${this.offline||this._busy} @click=${()=>{this._test()}}>
            ${this._busy?a("Playing…"):a("Test satellite audio")}
          </button>
        </div>
        <p class="sr-status" role="status" aria-live="polite">${this._busy?a("Firing announce to your satellite — listen for it…"):m}</p>
        ${this._renderResult()}
        ${this.renderLink(a("Change mode"),()=>this.navigate("settings","voice/voice_confirm_mode"))}
      </jv-section>
    `}};h([b()],Fr.prototype,"_busy",2),h([b()],Fr.prototype,"_result",2),h([b()],Fr.prototype,"_error",2),Fr=h([A("jarvis-tool-voice-confirm-test")],Fr);var by=["advisory","opt_in","autonomous"],yy=["energy_agency","energy_peak_watts","energy_mode_bump"],Nn=class extends ce{constructor(){super(...arguments);this._status=null;this._error=null;this._loading=!1;this._saving=!1;this._sig=""}onFirstActive(){this._sig=this._signature(),this._load()}updated(e){if(super.updated(e),this._status&&(e.has("data")||e.has("hass"))){let t=this._signature();t!==this._sig&&(this._sig=t,this._load())}}_signature(){return JSON.stringify(yy.map(e=>this.value(e)??null))}async _load(){if(this.hass){this._loading=!0,this._error=null;try{let e=await this.ws("jarvis/energy",{action:"status"}),t=e&&typeof e=="object"?e:{};this._status={watts:typeof t.watts=="number"?t.watts:null,kw:typeof t.kw=="number"?t.kw:null,meter:typeof t.meter=="string"?t.meter:"",peak_watts:typeof t.peak_watts=="number"?t.peak_watts:Number(this.value("energy_peak_watts"))||0,over_peak:!!t.over_peak,agency:typeof t.agency=="string"?t.agency:"",configured_agency:typeof t.configured_agency=="string"?t.configured_agency:"",running:Array.isArray(t.running)?t.running:[],advice:Array.isArray(t.advice)?t.advice.filter(n=>typeof n=="string"):[]}}catch(e){this._error=ht(Y.from("jarvis/energy",e))}finally{this._loading=!1}}}async _setAgency(e){if(!(!this.host||this._saving)){this._saving=!0;try{(await this.host.save("energy_agency",e)).ok&&(this._sig=this._signature(),await this._load())}finally{this._saving=!1}}}_fmtKw(e){return Number.isInteger(e)?String(e):e.toFixed(2).replace(/0+$/,"").replace(/\.$/,"")}_renderBadge(){let e=this._status;if(!e||e.kw==null)return c`<jv-state-badge slot="actions" level="neutral" .label=${a("No meter")}></jv-state-badge>`;let t=this._fmtKw(e.kw);return e.over_peak?c`<jv-state-badge slot="actions" level="warn" .label=${a("{kw} kW · over peak",{kw:t})}></jv-state-badge>`:c`<jv-state-badge slot="actions" level="ok" .label=${`${t} kW`}></jv-state-badge>`}_renderAgency(){let e=String(this.value("energy_agency")??this._status?.configured_agency??"advisory"),t=this._status?.agency??"",n=this.offline||this._saving||!this.host;return c`
      <fieldset>
        <legend>${a("Agency")}</legend>
        <div class="chips" role="group">
          ${by.map(s=>c`
              <button type="button" class="chip" aria-pressed=${e===s?"true":"false"} ?disabled=${n} @click=${()=>{this._setAgency(s)}}>
                ${a(On("energy_agency",s))}
              </button>
            `)}
        </div>
        ${t&&this._status&&t!==this._status.configured_agency?c`<p class="note">${a("Effective now: {agency} (raised by the current mode)",{agency:a(On("energy_agency",t))})}</p>`:m}
      </fieldset>
    `}_renderBody(){if(this._error)return this.renderError(a("Couldn't load energy data — {message}",{message:this._error}),()=>{this._load()});let e=this._status;return e?c`
      ${this._renderAgency()}
      ${e.advice.length?c`<div class="advice">${e.advice.map(t=>c`<p>${t}</p>`)}</div>`:m}
      ${e.running.length?c`
            <h3>${a("Running now")}</h3>
            ${e.running.map(t=>c`
                <jv-kv .label=${t.name||t.entity}>
                  <span class="badges">
                    <span class="jv-mono">${`${Math.round(t.watts)} W`}</span>
                    ${t.shed_ok===!1?c`<jv-state-badge level="neutral" nodot .label=${a("protected")}></jv-state-badge>`:m}
                  </span>
                </jv-kv>
              `)}
          `:m}
      <div class="footer">
        ${e.meter?c`<span class="jv-mono">${a("Meter: {entity}",{entity:e.meter})}</span>`:m}
        <span>${a("Peak threshold: {watts} W",{watts:Math.round(e.peak_watts)})}</span>
      </div>
    `:c`<jv-empty kind="loading" .heading=${a("Loading…")}></jv-empty>`}render(){return c`
      <jv-section .heading=${a("Energy Management")} icon="mdi:flash-outline" .loading=${this._loading}>
        ${this._renderBadge()}
        ${this.renderIconButton("mdi:refresh",a("Refresh"),()=>{this._load()},this.offline||this._loading,"actions")}
        <p class="intro">${a("Whole-home power, peak awareness, and load advice. Pick how much JARVIS may act — it never sheds critical loads (fridge, medical, network).")}</p>
        ${this._renderBody()}
      </jv-section>
    `}};Nn.styles=[...ce.styles,S`
      fieldset {
        margin: 0 0 var(--jv-space-3);
        padding: 0;
        border: 0;
        min-width: 0;
      }
      legend {
        padding: 0;
        margin-bottom: var(--jv-space-2);
        font-weight: var(--jv-font-weight-medium);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
      }
      .chip {
        appearance: none;
        position: relative;
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        font-weight: var(--jv-font-weight-medium);
        cursor: pointer;
      }
      .chip::before {
        content: "";
        position: absolute;
        inset: calc((var(--jv-tap) - 100%) / -2) 0;
      }
      .chip[aria-pressed="true"] {
        background: var(--jv-accent);
        border-color: transparent;
        color: var(--jv-on-accent);
      }
      .chip[disabled] {
        cursor: default;
        opacity: 0.6;
      }
      .advice p {
        margin: 0 0 var(--jv-space-2);
        overflow-wrap: anywhere;
      }
      .footer {
        margin-top: var(--jv-space-3);
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-1) var(--jv-space-4);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
    `],h([b()],Nn.prototype,"_status",2),h([b()],Nn.prototype,"_error",2),h([b()],Nn.prototype,"_loading",2),h([b()],Nn.prototype,"_saving",2),Nn=h([A("jarvis-tool-energy")],Nn);var _y=["hazard_monitor_enabled","hazard_lat","hazard_lon","hazard_quakes_on","hazard_weather_on","hazard_disasters_on","hazard_quake_radius_km","hazard_quake_min_mag","hazard_disaster_radius_km"],wy=3e4,ro=r=>Number.isFinite(r)?r.toFixed(3):String(r),io=r=>typeof r=="number"&&Number.isFinite(r)?Math.round(r):0,Ct=class extends ce{constructor(){super(...arguments);this._status=null;this._error=null;this._loading=!1;this._scanning=!1;this._slow=!1;this._scan=null;this._scanError=null;this._sig="";this._scanSeq=0}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._guard)}onFirstActive(){this._sig=this._signature(),this._load()}updated(e){if(super.updated(e),this._status&&(e.has("data")||e.has("hass"))){let t=this._signature();t!==this._sig&&(this._sig=t,this._load())}}_signature(){return JSON.stringify(_y.map(e=>this.value(e)??null))}async _load(){if(this.hass){this._loading=!0,this._error=null;try{let e=await this.ws("jarvis/hazard",{action:"status"})??{},t=e.center,n=e.feeds&&typeof e.feeds=="object"?e.feeds:{earthquakes:!1,weather:!1,disasters:!1};this._status={enabled:!!e.enabled,center:Array.isArray(t)&&t.length>=2&&typeof t[0]=="number"&&typeof t[1]=="number"?[t[0],t[1]]:null,using_override:!!e.using_override,quake_radius_km:io(e.quake_radius_km),quake_min_mag:typeof e.quake_min_mag=="number"?e.quake_min_mag:0,disaster_radius_km:io(e.disaster_radius_km),feeds:{earthquakes:!!n.earthquakes,weather:!!n.weather,disasters:!!n.disasters}}}catch(e){this._error=ht(Y.from("jarvis/hazard",e))}finally{this._loading=!1}}}async _runScan(){if(this._scanning&&!this._slow||!this.hass||!await U({heading:a("Scan for hazards now?"),message:a("JARVIS checks USGS, NWS and NASA EONET around your location once. Read-only — it never announces or alerts."),confirmLabel:a("Scan now")})||!this.hass)return;let t=++this._scanSeq;this._scanning=!0,this._slow=!1,this._scan=null,this._scanError=null,clearTimeout(this._guard),this._guard=setTimeout(()=>{t===this._scanSeq&&(this._slow=!0)},wy);try{let n=await this.ws("jarvis/hazard",{action:"scan"});if(t!==this._scanSeq)return;this._scan=n&&typeof n=="object"?n:{ok:!1,error:a("Scan failed: {message}",{message:"empty response"})}}catch(n){if(t!==this._scanSeq)return;this._scanError=ht(Y.from("jarvis/hazard",n))}finally{t===this._scanSeq&&(clearTimeout(this._guard),this._scanning=!1,this._slow=!1)}}_renderLocation(e){if(!e.center)return c`<p class="loc">${a("Location: no home coordinates set in Home Assistant.")}</p>`;let t={lat:ro(e.center[0]),lon:ro(e.center[1])};return c`<p class="loc">${e.using_override?a("Location: override {lat}, {lon}.",t):a("Location: home {lat}, {lon}.",t)}</p>`}_renderFeeds(e){let t=(n,s,o)=>c`
      <jv-state-badge nodot level=${n?"ok":"neutral"}>${s}${o?` · ${o}`:""}</jv-state-badge>
    `;return c`
      <div class="badges feeds">
        ${t(e.feeds.earthquakes,a("Earthquakes"),a("{km} km, M ≥ {mag}",{km:e.quake_radius_km,mag:e.quake_min_mag}))}
        ${t(e.feeds.weather,a("Severe weather"),"")}
        ${t(e.feeds.disasters,a("Disasters"),a("{km} km",{km:e.disaster_radius_km}))}
      </div>
    `}_renderScanResult(){if(this._scanError)return this.renderAlert("error",a("Scan failed: {message}",{message:this._scanError}));let e=this._scan;if(!e)return m;if(!e.ok)return this.renderAlert("warning",e.error||a("Scan failed: {message}",{message:""}));let t=Array.isArray(e.earthquakes)?e.earthquakes:[],n=Array.isArray(e.weather)?e.weather:[],s=Array.isArray(e.disasters)?e.disasters:[],o=e.center??this._status?.center??[0,0];return!t.length&&!n.length&&!s.length?c`
        <div class="clear" role="status">
          <jv-state-badge level="ok" nodot .label=${a("All clear")}></jv-state-badge>
          <span>${a("All clear near {lat}, {lon} — no active earthquakes, severe weather, or disasters.",{lat:ro(o[0]),lon:ro(o[1])})}</span>
        </div>
      `:c`
      <ul class="results">
        ${t.map(l=>c`<li>
            <jv-state-badge level="danger" nodot .label=${`M${Number(l.mag??0).toFixed(1)}`}></jv-state-badge>
            <span>${a("{place} — {km} km away",{place:l.place??"",km:io(l.dist_km)})}</span>
          </li>`)}
        ${n.map(l=>c`<li>
            <jv-state-badge level="warn" nodot .label=${l.severity??""}></jv-state-badge>
            <span>${l.event??""}${l.area?` — ${l.area}`:""}</span>
          </li>`)}
        ${s.map(l=>c`<li>
            <jv-state-badge level="warn" nodot .label=${l.category??""}></jv-state-badge>
            <span>${a("{place} — {km} km away",{place:l.title??"",km:io(l.dist_km)})}</span>
          </li>`)}
      </ul>
    `}_subheading(){let e=this._scan;if(!e||!e.ok)return"";let t=e.counts??{earthquakes:e.earthquakes?.length??0,weather:e.weather?.length??0,disasters:e.disasters?.length??0};return a("{quakes} quakes · {weather} warnings · {disasters} events",{quakes:t.earthquakes,weather:t.weather,disasters:t.disasters})}_renderBody(){if(this._error)return this.renderError(a("Couldn't load hazard status — {message}",{message:this._error}),()=>{this._load()});let e=this._status;if(!e)return c`<jv-empty kind="loading" .heading=${a("Loading…")}></jv-empty>`;let t=!this.offline&&(!this._scanning||this._slow)&&e.center!==null;return c`
      ${this._renderLocation(e)}
      ${this._renderFeeds(e)}
      <div class="actions-row">
        <button type="button" class="jv-btn primary" ?disabled=${!t} @click=${()=>{this._runScan()}}>
          ${this._scanning&&!this._slow?a("Scanning…"):a("Scan now")}
        </button>
      </div>
      <p class="sr-status" role="status" aria-live="polite">
        ${this._scanning?a("Checking USGS, NWS and NASA EONET…"):m}
        ${this._slow?c` ${a("still scanning in the background")}`:m}
      </p>
      ${this._renderScanResult()}
    `}render(){let e=this._status;return c`
      <jv-section .heading=${a("Hazard Monitor")} .subheading=${this._subheading()} icon="mdi:earth" .loading=${this._loading}>
        ${e?c`<jv-state-badge slot="actions" level=${e.enabled?"ok":"neutral"} .label=${e.enabled?a("ON"):a("OFF")}></jv-state-badge>`:m}
        ${this.renderIconButton("mdi:refresh",a("Refresh"),()=>{this._load()},this.offline||this._loading,"actions")}
        ${this._renderBody()}
      </jv-section>
    `}};Ct.styles=[...ce.styles,S`
      .loc {
        margin: 0 0 var(--jv-space-3);
        overflow-wrap: anywhere;
      }
      .feeds {
        margin-bottom: var(--jv-space-3);
      }
      ul.results {
        margin: var(--jv-space-3) 0 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      ul.results li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: 28px;
        overflow-wrap: anywhere;
      }
      .clear {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        margin-top: var(--jv-space-3);
        flex-wrap: wrap;
      }
    `],h([b()],Ct.prototype,"_status",2),h([b()],Ct.prototype,"_error",2),h([b()],Ct.prototype,"_loading",2),h([b()],Ct.prototype,"_scanning",2),h([b()],Ct.prototype,"_slow",2),h([b()],Ct.prototype,"_scan",2),h([b()],Ct.prototype,"_scanError",2),Ct=h([A("jarvis-tool-hazard")],Ct);var Dv=["appliances","doors_windows","presence","energy","security","climate","lights","schedule"],Yt=class extends ce{constructor(){super(...arguments);this._list=null;this._error=null;this._loading=!1;this._busy=!1;this._entity="";this._category=""}onFirstActive(){this._load()}_take(e){let t=e&&typeof e=="object"?e:{},n=s=>Array.isArray(s)?s.filter(o=>typeof o=="string"):[];return{entities:n(t.entities),categories:n(t.categories),all:!!t.all}}async _load(){if(this.hass){this._loading=!0,this._error=null;try{this._list=this._take(await this.ws("jarvis/mutes",{action:"list"}))}catch(e){this._error=ht(Y.from("jarvis/mutes",e))}finally{this._loading=!1}}}async _mutate(e){this._busy=!0;try{return this._list=this._take(await this.ws("jarvis/mutes",e)),!0}catch(t){return this.toast(a("Mute change failed — {message}",{message:ht(Y.from("jarvis/mutes",t))})),!1}finally{this._busy=!1}}async _mute(){let e=this._entity.trim(),t=this._category;if(!e&&!t)return;let n=!0;e&&(n=await this._mutate({action:"mute",entity_id:e})),n&&t&&(n=await this._mutate({action:"mute",category:t})),n&&(this._entity="",this._category="")}async _clear(){await U({heading:a("Clear every mute?"),message:a("This also unmutes every entity and category below."),confirmLabel:a("Clear all"),destructive:!0})&&await this._mutate({action:"clear"})}_onPick(e){e.stopPropagation();let t=e.detail?.value;this._entity=Array.isArray(t)?t[0]??"":t??""}_onCategory(e){let t=e.target;this._category=String(t.value??"")}_renderChips(e){let t=this.offline||this._busy,n=(s,o,l,d)=>c`
      <li class="chip" title=${o}>
        <span class="name ${!l&&s===o?"jv-mono":""}">${s}</span>
        ${l?c`<jv-state-badge level="info" nodot .label=${a("category")}></jv-state-badge>`:s!==o?c`<span class="jv-mono jv-muted jv-truncate">${o}</span>`:m}
        <button type="button" class="jv-icon-btn" aria-label=${a("Unmute {name}",{name:s})} ?disabled=${t} @click=${()=>{this._mutate({action:"unmute",...d})}}>
          <span aria-hidden="true">×</span>
        </button>
      </li>
    `;return c`
      <ul class="chips">
        ${e.entities.map(s=>n(Lv(this.hass,s),s,!1,{entity_id:s}))}
        ${e.categories.map(s=>n(s,s,!0,{category:s}))}
      </ul>
    `}_renderCategorySelect(){let e=a("category"),t=a("— none —");if(x("ha-select")){let n=x("ha-list-item")?Te`ha-list-item`:Te`mwc-list-item`;return c`
        <ha-select .label=${e} .value=${I(this._category)} ?disabled=${this.offline} naturalMenuWidth fixedMenuPosition @selected=${this._onCategory} @closed=${s=>s.stopPropagation()}>
          ${ye`<${n} value="">${t}</${n}>`}
          ${Dv.map(s=>ye`<${n} value=${s}>${s}</${n}>`)}
        </ha-select>
      `}return c`
      <label>
        <span>${e}</span>
        <select .value=${I(this._category)} ?disabled=${this.offline} @change=${this._onCategory}>
          <option value="">${t}</option>
          ${Dv.map(n=>c`<option value=${n}>${n}</option>`)}
        </select>
      </label>
    `}_renderAdd(){let e=!this.offline&&!this._busy&&(!!this._entity.trim()||!!this._category);return c`
      <div class="add">
        <jv-picker
          kind="entity"
          allow-custom
          .hass=${this.hass}
          .data=${this.data}
          .value=${this._entity||void 0}
          .label=${a("entity id")}
          ?disabled=${this.offline}
          @value-changed=${this._onPick}
        ></jv-picker>
        ${this._renderCategorySelect()}
        <button type="button" class="jv-btn primary" ?disabled=${!e} @click=${()=>{this._mute()}}>${a("Mute")}</button>
      </div>
    `}_renderBody(){if(this._error)return this.renderError(a("Couldn't load the mute list — {message}",{message:this._error}),()=>{this._load()});let e=this._list;if(!e)return c`<jv-empty kind="loading" .heading=${a("Loading…")}></jv-empty>`;let t=e.all||e.entities.length>0||e.categories.length>0;return c`
      ${e.all?this.renderAlert("warning",a("Blanket mute is ON — all announcements are suppressed."),c`<button type="button" class="jv-btn" ?disabled=${this.offline||this._busy} @click=${()=>{this._clear()}}>${a("Turn off")}</button>`):m}
      ${e.entities.length||e.categories.length?this._renderChips(e):e.all?m:c`<p class="intro">${a("Nothing muted. JARVIS announces about everything it observes. Mute an entity below (or run jarvis.shush) to silence announcements about it without excluding it.")}</p>`}
      ${this._renderAdd()}
      ${t?c`<div class="actions-row">
            <button type="button" class="jv-btn text danger-text" ?disabled=${this.offline||this._busy} @click=${()=>{this._clear()}}>${a("Clear all")}</button>
          </div>`:m}
    `}render(){return c`
      <jv-section .heading=${a("Muted Announcements")} .subheading=${a("Shush")} icon="mdi:volume-mute" .loading=${this._loading||this._busy}>
        ${this.renderIconButton("mdi:refresh",a("Refresh"),()=>{this._load()},this.offline||this._loading,"actions")}
        <p class="intro">
          ${a("Things JARVIS has been told to stop announcing — a window that's often open, a decorative light, etc. Muting an entity silences announcements about it while JARVIS keeps observing it normally (not the same as excluding it). Persists across restarts.")}
        </p>
        ${this._renderBody()}
      </jv-section>
    `}};Yt.styles=[...ce.styles,S`
      ul.chips {
        list-style: none;
        margin: 0 0 var(--jv-space-3);
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--jv-space-2);
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: var(--jv-space-1);
        max-width: 100%;
        min-height: 32px;
        padding: 0 var(--jv-space-1) 0 var(--jv-space-3);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-pill);
        background: var(--jv-surface-2);
        font-size: var(--jv-font-size-s);
      }
      .chip .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .chip .jv-icon-btn {
        width: var(--jv-tap);
        height: var(--jv-tap);
        margin: -6px 0;
        font-size: var(--jv-font-size-l);
        line-height: 1;
      }
      .add {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-2);
        align-items: end;
      }
      @media (min-width: 600px) {
        :host(:not([narrow])) .add {
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
        }
      }
      .add label {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-1);
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        min-width: 0;
      }
      .add select,
      .add ha-select {
        width: 100%;
      }
      .jv-btn.text.danger-text {
        color: var(--jv-danger-text);
      }
    `],h([b()],Yt.prototype,"_list",2),h([b()],Yt.prototype,"_error",2),h([b()],Yt.prototype,"_loading",2),h([b()],Yt.prototype,"_busy",2),h([b()],Yt.prototype,"_entity",2),h([b()],Yt.prototype,"_category",2),Yt=h([A("jarvis-tool-mutes")],Yt);var so=class extends ce{render(){let i=this.value("biometrics_enabled")===!0;return c`
      <jv-section .heading=${a("Wellbeing Context")} icon="mdi:heart-pulse">
        <jv-state-badge slot="actions" level=${i?"ok":"neutral"} .label=${i?a("ON"):a("OFF")}></jv-state-badge>
        <p class="intro">${a("The discovered wearables and the wearable-context switch are on the People view. Context only — never medical.")}</p>
        <div class="actions-row">
          <button type="button" class="jv-btn" @click=${()=>this.navigate("people")}>${a("Open People")}</button>
          ${this.renderLink(a("Map a kind to an entity"),()=>this.navigate("settings","core/biometric_entities"))}
        </div>
      </jv-section>
    `}};so=h([A("jarvis-tool-wellbeing")],so);bn("core",{id:"briefing",title:"Briefings",element:"jarvis-tool-briefing",icon:"mdi:weather-sunset-up",keywords:["brief me now","morning","evening","announce"]});bn("core",{id:"diagnostics",title:"Diagnostics",element:"jarvis-tool-diagnostics",icon:"mdi:stethoscope",keywords:["test","tts","notify","observer","routing","doorbell","analyze camera"]});bn("voice",{id:"voice-confirm-test",title:"Voice Confirmation",element:"jarvis-tool-voice-confirm-test",icon:"mdi:microphone-question",keywords:["satellite","announce","native","gated","test"]});bn("safety",{id:"energy",title:"Energy Management",element:"jarvis-tool-energy",icon:"mdi:flash-outline",keywords:["power","watts","agency","peak","meter"]});bn("safety",{id:"hazard",title:"Hazard Monitor",element:"jarvis-tool-hazard",icon:"mdi:earth",keywords:["earthquake","weather","disaster","scan","usgs","nws"]});bn("safety",{id:"mutes",title:"Muted Announcements",element:"jarvis-tool-mutes",icon:"mdi:volume-mute",keywords:["shush","mute","unmute","silence"]});bn("home",{id:"wellbeing",title:"Wellbeing Context",element:"jarvis-tool-wellbeing",icon:"mdi:heart-pulse",keywords:["biometrics","wearable","people"]});function $y(r){let i=/^(.*?[.!?])(\s|$)/.exec(r.trim());return i?i[1]:r}var In=class extends ce{constructor(){super(...arguments);this._switches=null;this._error=null;this._loading=!1;this._busy={}}onFirstActive(){this._load()}async _load(){if(this.hass){this._loading=!0,this._error=null;try{let e=await this.ws("jarvis/get_enforcement");this._switches=Array.isArray(e?.switches)?e.switches:[]}catch(e){this._error=ht(Y.from("jarvis/get_enforcement",e))}finally{this._loading=!1}}}async _toggle(e,t){if(this._busy[e.key]||t===!!e.enabled)return;let n=!0;if(e.category==="safety"&&!t?n=await U({heading:a('Turn OFF the safety enforcement "{name}"?',{name:e.name}),message:a("This reverts that guard to observe-only (log-only) until you turn it back on. Only do this for debugging."),confirmLabel:a("Turn off"),destructive:!0}):e.category==="capability"&&t&&(n=await U({heading:a('Enable "{name}"?',{name:e.name}),message:a("This makes the kernel authoritative for that capability."),confirmLabel:a("Enable")})),!n){this.requestUpdate();return}this._busy={...this._busy,[e.key]:!0};try{let s=await this.ws("jarvis/set_enforcement",{key:e.key,enabled:t}),o=s?.switch&&s.switch.key===e.key?s.switch:{...e,enabled:t,overridden:!0};this._switches=(this._switches??[]).map(l=>l.key===e.key?o:l),this.toast(a("{name} → {state}",{name:e.name,state:o.enabled?a("ON"):a("OFF")})),this._load()}catch(s){let o=Y.from("jarvis/set_enforcement",s);this.toast(a("{name} — {message}",{name:e.name,message:ht(o)})),this.requestUpdate()}finally{let{[e.key]:s,...o}=this._busy;this._busy=o}}_renderControl(e){let t=!!e.enabled,n=this.offline||!!this._busy[e.key],s=o=>{this._toggle(e,!!o.target.checked)};return c`
      <label class="ctl">
        ${x("ha-switch")?c`<ha-switch .checked=${I(t)} .disabled=${n} aria-label=${e.name} @change=${s}></ha-switch>`:c`<input type="checkbox" role="switch" .checked=${I(t)} ?disabled=${n} aria-label=${e.name} @change=${s} />`}
        <span class="lbl" aria-hidden="true">${t?a("ON"):a("OFF")}</span>
      </label>
    `}_renderExplanation(e){return e.explanation?this.narrow?c`
      <details class="exp">
        <summary>${$y(e.explanation)}</summary>
        <p>${e.explanation}</p>
      </details>
    `:c`<p class="exp">${e.explanation}</p>`:m}_renderGroup(e,t,n){return n.length?c`
      <fieldset>
        <legend>${e}</legend>
        ${t?c`<p class="note">${t}</p>`:m}
        <ul class="plain">
          ${n.map(s=>c`
              <li class="sw">
                <div class="head">
                  <span class="name">${s.name}</span>
                  ${s.phase?c`<span class="phase jv-mono">${s.phase}</span>`:m}
                  ${s.overridden?c`<jv-state-badge level="warn" nodot .label=${a("overridden")}></jv-state-badge>`:m}
                  ${!!s.enabled!=!!s.default?c`<jv-state-badge level="neutral" nodot .label=${s.default?a("default: ON"):a("default: OFF")}></jv-state-badge>`:m}
                </div>
                ${this._renderControl(s)}
                ${this._renderExplanation(s)}
              </li>
            `)}
        </ul>
      </fieldset>
    `:m}_renderBody(){if(this._error)return this.renderError(a("Couldn't load governance switches — {message}",{message:this._error}),()=>{this._load()});let e=this._switches;if(!e)return c`<jv-empty kind="loading" .heading=${a("Loading governance switches…")}></jv-empty>`;if(!e.length)return c`<p class="note">${a("No governance switches reported.")}</p>`;let t=e.filter(o=>o.category==="capability"),n=e.filter(o=>o.category==="safety"),s=e.filter(o=>o.category!=="capability"&&o.category!=="safety");return c`
      ${this._renderGroup(a("Owner opt-in capabilities"),a("These ship OFF. Turning one ON makes the kernel authoritative for that capability — your choice, behaviour-changing."),t)}
      ${this._renderGroup(a("Safety & governance — kill-switches (keep ON)"),a("These ship ON and guard autonomous behaviour. Turning one OFF reverts that guard to observe-only (log-only) — only for debugging."),n)}
      ${this._renderGroup(a("Enforcement"),"",s)}
    `}render(){return c`
      <jv-section .heading=${a("Governance")} .subheading=${a("Enforcement")} icon="mdi:shield-check-outline" .loading=${this._loading}>
        ${this.renderIconButton("mdi:refresh",a("Refresh"),()=>{this._load()},this.offline||this._loading,"actions")}
        <p class="intro">${a("JARVIS's kernel brings each capability online along a shadow → parity → enforce ladder, each behind a kill-switch. Here you control those switches: the opt-in capabilities ship OFF (enable when you're ready), and the live safety guards ship ON (leave them on). Changes take effect immediately and survive a restart.")}</p>
        ${this._renderBody()}
      </jv-section>
    `}};In.styles=[...ce.styles,S`
      fieldset {
        margin: 0 0 var(--jv-space-3);
        padding: 0;
        border: 0;
        min-width: 0;
      }
      legend {
        padding: 0;
        font-weight: var(--jv-font-weight-medium);
      }
      .sw {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--jv-space-1) var(--jv-space-3);
        align-items: start;
        min-height: var(--jv-tap);
        padding: var(--jv-space-2) 0;
        border-top: 1px solid var(--jv-divider);
      }
      .sw .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--jv-space-2);
        min-width: 0;
      }
      .sw .name {
        font-weight: var(--jv-font-weight-medium);
        overflow-wrap: anywhere;
      }
      .phase {
        padding: 0 6px;
        border-radius: var(--jv-radius-sm);
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        line-height: 18px;
      }
      .exp {
        grid-column: 1;
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
        overflow-wrap: anywhere;
      }
      details.exp summary {
        cursor: pointer;
        min-height: var(--jv-tap);
        display: flex;
        align-items: center;
      }
      details.exp p {
        margin: 0 0 var(--jv-space-2);
      }
      /* a <label>: the whole block toggles the native fallback switch */
      .ctl {
        grid-row: 1 / span 2;
        grid-column: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-width: 48px;
        min-height: var(--jv-tap);
        cursor: pointer;
      }
      .ctl .lbl {
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
      }
      .ctl input {
        width: 40px;
        height: 24px;
        margin: 0;
        accent-color: var(--jv-accent);
      }
    `],h([b()],In.prototype,"_switches",2),h([b()],In.prototype,"_error",2),h([b()],In.prototype,"_loading",2),h([b()],In.prototype,"_busy",2),In=h([A("jarvis-tool-governance")],In);bn("governance",{id:"governance",title:"Governance",element:"jarvis-tool-governance",icon:"mdi:shield-check-outline",keywords:["enforcement","kill-switch","kernel","capability","safety"]});var xy=300,jy=2e3,ky=6e3,Sy=1600,Fv=r=>r.replace(/["\\]/g,"\\$&"),vt=class extends de{constructor(){super(...arguments);this._schema=null;this._error=null;this._loading=!1;this._query="";this._searchOpen=!1;this._showKeys=!1;this._status=new Map;this._flashKey="";this._inflight=new Set;this._queued=new Map;this._statusTimers=new Map;this._lastDeepLink="";this._host={value:e=>{let t=this._field(e);return t?this._value(t):void 0},field:e=>this._field(e),save:(e,t)=>{let n=this._field(e);return this._change(e,n?vi(n,t):t)},saveMany:async e=>{for(let[t,n]of e){let s=await this._host.save(t,n);if(!s.ok)return s}return{ok:!0}},refetch:()=>this._scheduleRefetch(),refreshSnapshot:()=>this.refresh(),toast:e=>this._toast(e)}}connectedCallback(){super.connectedCallback(),P(this,["ha-textfield","ha-icon","ha-icon-button","ha-alert"])}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._refetchTimer),clearTimeout(this._flashTimer);for(let e of this._statusTimers.values())clearTimeout(e);this._statusTimers.clear()}updated(e){e.has("hass")&&this.hass&&!this._schema&&!this._loading&&(!this._error||this._error.code==="no_connection")&&this._load(),e.has("route")&&this._handleDeepLink()}async _load(e=!1){if(this.hass){e||(this._loading=!0,this._error=null);try{let t=await this.ws("jarvis/config_schema"),n=Array.isArray(t?.fields)?t.fields:[],s={...t?.values??{}},o=Array.isArray(t?.categories)&&t.categories.length?t.categories:[...new Set(n.map(l=>l.category))];if(e&&this._schema){let l=new Set([...this._inflight,...this._queued.keys()]),d=this._focusedKey();d&&l.add(d);for(let u of l)u in this._schema.values&&(s[u]=this._schema.values[u])}this._schema={fields:n,values:s,categories:o},this._error=null}catch(t){let n=Y.from("jarvis/config_schema",t);e||(this._error=n)}finally{this._loading=!1}this._handleDeepLink()}}_focusedKey(){let e=this.shadowRoot?.activeElement;return(e?.tagName?.toLowerCase()==="jarvis-config-field"?e:e?.closest?.("jarvis-config-field"))?.field?.key}_scheduleRefetch(){clearTimeout(this._refetchTimer),this._refetchTimer=setTimeout(()=>{this._load(!0)},xy)}_setStatus(e,t,n){let s=new Map(this._status);clearTimeout(this._statusTimers.get(e)),this._statusTimers.delete(e),t?s.set(e,t):s.delete(e),this._status=s,t&&n&&this._statusTimers.set(e,setTimeout(()=>{this._status.get(e)===t&&this._setStatus(e,null)},n))}_toast(e){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:e},bubbles:!0,composed:!0}))}_field(e){return this._schema?.fields.find(t=>t.key===e)}_labelFor(e){return a(pv[e.key]??e.label??e.key)}async _change(e,t,n){let s=this._field(e);if(!s)return{ok:!1,error:new Y("jarvis/update_config","invalid_key",`${e} is not in the catalogue`)};if(s.kind==="bool"&&t===!0&&vc[e]&&!await U({heading:this._labelFor(s),message:a(vc[e]),confirmLabel:a("Enable"),destructive:!0}))return n?.requestUpdate(),{ok:!1};if(e==="ui_language")try{await ks(Ss(t,this.hass?.language))}catch{}return this._save(e,t)}async _save(e,t){let n=this._field(e);if(!n)return{ok:!1};if(this._inflight.has(e))return new Promise(o=>{let l=this._queued.get(e);l?(l.value=t,l.waiters.push(o)):this._queued.set(e,{value:t,waiters:[o]})});this._inflight.add(e),this._setStatus(e,{level:"saving",message:a("Saving…")});let s={ok:!0};try{await this.ws("jarvis/update_config",{key:e,value:t}),this._schema&&(this._schema={...this._schema,values:{...this._schema.values,[e]:t}});let o="saved",l=n.kind==="list"&&Array.isArray(t)?a("Saved ✓ ({count} items)",{count:t.length}):a("Saved ✓");if(uv.has(e))try{await this.ws("jarvis/reload_appliances"),l=a("Saved — appliance monitor reloaded")}catch(d){o="warn",l=a("Saved — appliance monitor reload failed: {message}",{message:Y.from("jarvis/reload_appliances",d).message})}this._setStatus(e,{level:o,message:l},o==="saved"?jy:ky),this._scheduleRefetch(),this.refresh()}catch(o){let l=Y.from("jarvis/update_config",o),d=a("Save failed — {message}",{message:l.message});this._setStatus(e,{level:"error",message:d}),this._toast(d),s={ok:!1,error:l}}finally{this._inflight.delete(e);let o=this._queued.get(e);o&&(this._queued.delete(e),this._save(e,o.value).then(l=>o.waiters.forEach(d=>d(l))))}return s}_onFieldChange(e){this._change(e.detail.key,e.detail.value,e.target)}_onFieldReset(e){let t=this._field(e.detail.key);t&&this._change(t.key,vi(t,t.default),e.target)}get _categories(){return this._schema?this._schema.categories.filter(e=>e!=="Other"||this._fieldsIn(e).length>0):dv}get _activeCategory(){let e=this._categories,[t]=this.subPath.split("/");return t&&e.includes(t)?t:e[0]??"core"}_go(e){this._query="",this.navigate("settings",e)}async _handleDeepLink(){let[e,t]=this.subPath.split("/");if(!t||!this._schema)return;let n=`${e}/${t}`;if(n===this._lastDeepLink)return;this._lastDeepLink=n,this._query="",await this.updateComplete;let s=t.startsWith("tool:")?t.slice(5):"",o=s?t:this._consumed.get(t)??t,l=s?this.renderRoot.querySelector(`[data-tool-id="${Fv(s)}"]`):this.renderRoot.querySelector(`jarvis-config-field[data-key="${Fv(o)}"]`);if(!l)return;let d=!1;try{d=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches}catch{d=!1}l.scrollIntoView?.({block:"center",behavior:d?"auto":"smooth"}),this._flashKey=o,clearTimeout(this._flashTimer),this._flashTimer=setTimeout(()=>{this._flashKey===o&&(this._flashKey="")},Sy)}get _consumed(){return this._schema?Xh(this._schema.fields):new Map}_matches(e,t){let n=(e.options??[]).map(s=>a(On(e.key,Mr(s))));return iv(t,e.key,this._labelFor(e),a(Za(e.key)),n)}_fieldsIn(e,t=""){if(!this._schema)return[];let n=t.trim(),s=this._consumed,o=new Map(this._schema.fields.map(u=>[u.key,u])),l=[],d=new Set;for(let u of this._schema.fields){if(u.category!==e)continue;let p=s.get(u.key);if(!n){if(p||bv(u))continue;l.push(u);continue}if(!this._matches(u,n))continue;let v=p?o.get(p):u;!v||d.has(v.key)||(d.add(v.key),l.push(v))}return l}_toolsIn(e,t=""){let n=Zh(e),s=t.trim();return s?n.filter(o=>Qh(o,s,a)):n}_value(e){let t=this._schema?.values??{};return e.key in t?t[e.key]:e.default}render(){let e=this.narrow,t=!this.hass;return c`
      <div class="wrap ${e?"narrow":""}">
        ${t?this._renderOffline():m}
        ${e?this._renderNarrowToolbar():this._renderToolbar()}
        <div class="layout">
          ${e?m:this._renderRail()}
          <div class="content">${this._renderContent()}</div>
        </div>
      </div>
    `}_renderOffline(){let e=a("Reconnecting to Home Assistant…");return x("ha-alert")?c`<ha-alert class="offline" alert-type="warning">${e}</ha-alert>`:c`<div class="offline" role="status">${e}</div>`}_onSearchInput(e){this._query=String(e.target.value??"")}_onSearchKey(e){e.key==="Escape"&&(this._query="",e.target.value="")}_renderSearch(){let e=a("Search settings…");return x("ha-textfield")?c`<ha-textfield class="search" type="search" .label=${e} .value=${I(this._query)} @input=${this._onSearchInput} @keydown=${this._onSearchKey}></ha-textfield>`:c`<input class="search" type="search" placeholder=${e} aria-label=${e} .value=${I(this._query)} @input=${this._onSearchInput} @keydown=${this._onSearchKey} />`}_renderToolbar(){return c`<div class="toolbar">${this._renderSearch()}</div>`}_iconBtn(e,t,n,s){return c`
      <button type="button" class="jv-icon-btn" aria-label=${t} title=${t} aria-pressed=${n===void 0?m:n?"true":"false"} @click=${s}>
        ${x("ha-icon")?c`<ha-icon .icon=${e}></ha-icon>`:c`<span aria-hidden="true">${e==="mdi:magnify"?"⌕":"</>"}</span>`}
      </button>
    `}_renderNarrowToolbar(){let e=this._activeCategory;return c`
      <div class="toolbar row2">
        <div class="chips-row" role="group" aria-label=${a("Settings sections")}>
          ${this._categories.map(t=>c`<button type="button" class="chip jv-hit" aria-current=${t===e&&!this._query?"page":m} @click=${()=>this._go(t)}>${a(ds[t]??t)}</button>`)}
        </div>
        ${this._iconBtn("mdi:magnify",a("Search settings…"),this._searchOpen||!!this._query,()=>{this._searchOpen=!this._searchOpen,this._searchOpen||(this._query="")})}
        ${this._iconBtn("mdi:code-tags",a("Show keys"),this._showKeys,()=>this._showKeys=!this._showKeys)}
        ${this._searchOpen||this._query?this._renderSearch():m}
      </div>
    `}_renderRail(){let e=this._activeCategory,t=!!this._schema;return c`
      <nav class="rail ${this._query?"dim":""}" aria-label=${a("Settings sections")}>
        <ul>
          ${this._categories.map(n=>{let s=this._fieldsIn(n).length;return c`
              <li>
                <button type="button" class="rail-btn" aria-current=${n===e&&!this._query?"page":m} @click=${()=>this._go(n)}>
                  <span class="jv-truncate">${a(ds[n]??n)}</span>
                  ${t?c`<span class="count" aria-label=${a("{count} settings",{count:s})}>${s}</span>`:m}
                </button>
              </li>
            `})}
        </ul>
      </nav>
    `}_renderContent(){if(this._error)return this._renderError(this._error);if(!this._schema)return c`<jv-section .heading=${a("Settings")} loading><jv-empty kind="loading" .heading=${a("Loading settings…")}></jv-empty></jv-section>`;if(this._query.trim())return this._renderSearchResults();let e=this._activeCategory,t=this._fieldsIn(e),n=yv[e]??[];return c`
      <div class="stack">
        ${this._renderToolCards(this._toolsIn(e))}
        <jv-section .heading=${a(ds[e]??e)} .subheading=${a("{count} settings",{count:t.length})}>
          ${t.length?this._renderFields(t):c`<jv-empty compact icon="mdi:cog-off-outline" .message=${a("No settings in this section.")}></jv-empty>`}
        </jv-section>
        ${n.length?this._renderElsewhere(n):m}
      </div>
    `}_renderError(e){let t=e.message;return e.code==="unknown_command"?t=a("The backend does not provide jarvis/config_schema yet — update the JARVIS integration."):e.code==="unauthorized"&&(t=a("Administrator access is required.")),c`
      <jv-section>
        <jv-empty kind="error" icon="mdi:alert-circle-outline" .heading=${a("Couldn't load the settings catalogue")} .message=${t}>
          <button slot="action" type="button" class="jv-btn primary" @click=${()=>{this._load()}}>${a("Retry")}</button>
        </jv-empty>
      </jv-section>
    `}_renderToolCards(e){return e.length?e.map(t=>{let n=Hr(t.element);return ye`<${n}
        data-tool-id=${t.id}
        .hass=${this.hass}
        .data=${this.data}
        .narrow=${this.narrow}
        .host=${this._host}
        .active=${!0}
        ?flash=${this._flashKey===`tool:${t.id}`}
      ></${n}>`}):m}_renderSearchResults(){let e=this._query,t=this._categories.map(n=>({c:n,fields:this._fieldsIn(n,e),tools:this._toolsIn(n,e)})).filter(n=>n.fields.length>0||n.tools.length>0);return t.length?c`
      <div class="stack">
        ${t.map(n=>c`
            ${this._renderToolCards(n.tools)}
            ${n.fields.length?c`
                  <jv-section .heading=${a(ds[n.c]??n.c)} .subheading=${a("{count} matches",{count:n.fields.length+n.tools.length})}>
                    ${this._renderFields(n.fields)}
                  </jv-section>
                `:m}
          `)}
      </div>
    `:c`
        <jv-section>
          <jv-empty compact icon="mdi:magnify" .heading=${a("No settings match “{query}”.",{query:e.trim()})}>
            <button slot="action" type="button" class="jv-btn" @click=${()=>this._query=""}>${a("Clear search")}</button>
          </jv-empty>
        </jv-section>
      `}_renderFields(e){let t=!this.hass,n="";return c`
      <div class="fields">
        ${e.map((s,o)=>{let l=s.key.split("_")[0],d=o>0&&l!==n;n=l;let u=ls(s),p=u?.consumes.filter(w=>w!==s.key&&!!this._field(w))??[],v=[Za(s.key),...p.map(w=>Za(w))].filter(Boolean).map(w=>a(w)).join(`
`),f=p.map(w=>this._status.get(w)).filter(w=>!!w),g=s.key==="satellite_pairings"&&!u?gv(this.data):null,y=g?a("Keys: {satellites}; values: {speakers}",g):"",_=!u&&_v(s.key)?()=>fv(s.key,this.data,this.hass):void 0;return c`
            ${d?c`<hr class="jv-divider" />`:m}
            <jarvis-config-field
              data-key=${s.key}
              .field=${s}
              .value=${this._value(s)}
              .label=${this._labelFor(s)}
              .help=${v}
              .hint=${y}
              .placeholder=${hv[s.key]??""}
              .suggest=${_}
              .hass=${this.hass}
              .data=${this.data}
              .host=${this._host}
              .statuses=${f}
              .status=${this._status.get(s.key)??null}
              .showKey=${!this.narrow||this._showKeys}
              .narrow=${this.narrow}
              ?disabled=${t}
              ?flash=${this._flashKey===s.key}
              @field-change=${this._onFieldChange}
              @field-reset=${this._onFieldReset}
            ></jarvis-config-field>
          `})}
      </div>
    `}_renderElsewhere(e){let t=c`
      <ul class="ports">
        ${e.map(s=>c`<li>
            <button type="button" class="port-link jv-hit" @click=${()=>this.navigate(s.view,s.path)}>${a(s.name)}</button>
            — ${a(s.why)}
          </li>`)}
      </ul>
    `,n=a("Elsewhere in the panel");return this.narrow?c`<jv-section><details><summary>${n}</summary>${t}</details></jv-section>`:c`<jv-section .heading=${n} icon="mdi:arrow-top-right">${t}</jv-section>`}};vt.styles=[T,S`
      .toolbar {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        margin-bottom: var(--jv-space-4);
        min-width: 0;
      }
      .search {
        flex: 1 1 auto;
        min-width: 0;
        max-width: 480px;
      }
      .wrap.narrow .search {
        max-width: none;
        flex-basis: 100%;
      }
      .toolbar.row2 {
        flex-wrap: wrap;
      }
      ha-textfield.search,
      input.search {
        width: 100%;
        display: block;
      }
      input.search {
        font: inherit;
        color: var(--jv-text);
        background: var(--jv-surface);
        border: var(--jv-border-width) solid var(--jv-border);
        border-radius: var(--jv-radius-sm);
        padding: 0 var(--jv-space-3);
        min-height: var(--jv-tap);
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--jv-space-4);
        align-items: start;
      }
      @media (min-width: 900px) {
        .wrap:not(.narrow) .layout {
          grid-template-columns: 220px minmax(0, 1fr);
        }
      }
      /* the rail sticks below the panel's app bar while the fields scroll;
         the nav must be as tall as the grid row for the sticky ul to travel */
      nav.rail {
        align-self: stretch;
      }
      nav.rail ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        position: sticky;
        top: calc(var(--jv-sticky-top, 0px) + var(--jv-space-4));
      }
      nav.rail.dim {
        opacity: 0.55;
      }
      .rail-btn {
        appearance: none;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2);
        min-height: var(--jv-tap);
        padding: 0 var(--jv-space-3);
        border: 0;
        border-radius: var(--jv-radius-sm);
        background: transparent;
        color: var(--jv-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .rail-btn:hover {
        background: var(--jv-hover);
      }
      .rail-btn[aria-current="page"] {
        background: var(--jv-accent-soft);
        color: var(--jv-accent-text);
        font-weight: var(--jv-font-weight-medium);
      }
      .count {
        flex: none;
        font-size: var(--jv-font-size-xs);
        color: var(--jv-text-2);
        background: var(--jv-neutral-soft);
        border-radius: var(--jv-radius-pill);
        padding: 0 var(--jv-space-2);
        min-width: 24px;
        line-height: 20px;
        text-align: center;
      }
      /* overflow-x: auto clips in both axes, so leave a 4 px gutter all round
         for the chips' focus ring (the negative margin keeps the layout) */
      .chips-row {
        display: flex;
        gap: var(--jv-space-2);
        overflow-x: auto;
        scrollbar-width: thin;
        flex: 1 1 auto;
        min-width: 0;
        padding: var(--jv-space-1);
        margin: calc(-1 * var(--jv-space-1));
      }
      .chip {
        appearance: none;
        flex: none;
        min-height: 36px;
        padding: 0 var(--jv-space-3);
        border-radius: var(--jv-radius-pill);
        border: var(--jv-border-width) solid var(--jv-border);
        background: var(--jv-surface);
        color: var(--jv-text);
        font: inherit;
        font-size: var(--jv-font-size-s);
        cursor: pointer;
      }
      .chip[aria-current="page"] {
        background: var(--jv-accent);
        border-color: transparent;
        color: var(--jv-on-accent);
      }
      .jv-icon-btn[aria-pressed="true"] {
        background: var(--jv-accent-soft);
        color: var(--jv-accent-text);
      }
      .fields {
        display: flex;
        flex-direction: column;
      }
      .fields hr.jv-divider {
        margin: var(--jv-space-1) 0;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-4);
      }
      .ports {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--jv-space-2);
      }
      .ports li {
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
      .port-link {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 0;
        font: inherit;
        font-weight: var(--jv-font-weight-medium);
        color: var(--jv-accent-text);
        text-decoration: underline;
        cursor: pointer;
      }
      details summary {
        cursor: pointer;
        min-height: var(--jv-tap);
        display: flex;
        align-items: center;
        font-weight: var(--jv-font-weight-medium);
      }
      details[open] summary {
        margin-bottom: var(--jv-space-2);
      }
      .offline {
        margin-bottom: var(--jv-space-4);
        padding: var(--jv-space-3) var(--jv-space-4);
        border-radius: var(--jv-radius-sm);
        background: var(--jv-warn-soft);
      }
    `],h([b()],vt.prototype,"_schema",2),h([b()],vt.prototype,"_error",2),h([b()],vt.prototype,"_loading",2),h([b()],vt.prototype,"_query",2),h([b()],vt.prototype,"_searchOpen",2),h([b()],vt.prototype,"_showKeys",2),h([b()],vt.prototype,"_status",2),h([b()],vt.prototype,"_flashKey",2),vt=h([A("jarvis-view-settings")],vt);var Xt=[{key:"overview",title:"Overview",icon:"mdi:view-dashboard-outline",element:"jarvis-view-overview"},{key:"intrusion",title:"Intrusion",icon:"mdi:shield-home-outline",element:"jarvis-view-intrusion"},{key:"cameras",title:"Cameras",icon:"mdi:cctv",element:"jarvis-view-cameras"},{key:"people",title:"People",icon:"mdi:account-group-outline",element:"jarvis-view-people"},{key:"suggestions",title:"Suggestions",icon:"mdi:lightbulb-on-outline",element:"jarvis-view-suggestions"},{key:"memory",title:"Memory",icon:"mdi:brain",element:"jarvis-view-memory"},{key:"documents",title:"Documents",icon:"mdi:file-document-multiple-outline",element:"jarvis-view-documents"},{key:"residence",title:"Residence",icon:"mdi:floor-plan",element:"jarvis-view-residence"},{key:"logs",title:"Logs",icon:"mdi:text-box-search-outline",element:"jarvis-view-logs"},{key:"settings",title:"Settings",icon:"mdi:cog-outline",element:"jarvis-view-settings"}],ao="overview",yc=["overview","intrusion","residence","settings"];function or(r){return Xt.find(i=>i.key===r)}function _c(r){return yc.includes(r)}function Ov(){return Xt.filter(r=>!_c(r.key))}function wc(r){let i=(r||"").split("/").filter(Boolean),e=or(i[0]);return e?{view:e,sub:i.slice(1).join("/"),known:!0}:{view:or(ao),sub:"",known:!1}}var Nv=2e4,Ey=250,Ry=1500,Ay=["ha-icon","ha-icon-button","ha-menu-button","ha-alert"],oo=24,Cy='button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',Be=class extends L{constructor(){super(...arguments);this.narrow=!1;this._data=null;this._error=null;this._loading=!1;this._langReady=!1;this._view=ao;this._moreOpen=!1;this._fadeStart=!1;this._fadeEnd=!1;this._timer=null;this._debounce=null;this._lastFetch=0;this._inFlight=null;this._tags=new Map;this._tabsObserver=null;this._observedTabs=null;this._moreReturnFocus=null;this._onLocationChanged=()=>{let e=this._prefix;if(!location.pathname.startsWith(e))return;let t=location.pathname.slice(e.length);(!this.route||this.route.path!==t)&&(this.route={prefix:e,path:t})};this._onNavigateRequest=e=>{e.stopPropagation();let t=e.detail||{};t.view&&this.navigate(t.view,t.path)};this._onVisibility=()=>{document.visibilityState==="visible"&&Date.now()-this._lastFetch>Nv&&this._load()};this._onRefreshRequest=e=>{e.stopPropagation(),this._debounce&&clearTimeout(this._debounce),this._debounce=setTimeout(()=>{this._debounce=null,this._load()},Ey)}}connectedCallback(){super.connectedCallback(),P(this,Ay),window.addEventListener("location-changed",this._onLocationChanged),window.addEventListener("popstate",this._onLocationChanged),document.addEventListener("visibilitychange",this._onVisibility),this.addEventListener("jarvis-refresh",this._onRefreshRequest),this.addEventListener("jarvis-navigate",this._onNavigateRequest),this.route||this._syncViewFromLocation(),this._startTimer(),this._gateLanguage()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("location-changed",this._onLocationChanged),window.removeEventListener("popstate",this._onLocationChanged),document.removeEventListener("visibilitychange",this._onVisibility),this.removeEventListener("jarvis-refresh",this._onRefreshRequest),this.removeEventListener("jarvis-navigate",this._onNavigateRequest),this._stopTimer(),this._tabsObserver?.disconnect(),this._tabsObserver=null,this._observedTabs=null}willUpdate(e){e.has("route")&&this._syncViewFromRoute(),e.has("hass")&&this.hass&&(e.get("hass")||this._load(),this._ensureLanguage()),e.has("narrow")&&!this.narrow&&this._moreOpen&&(this._moreOpen=!1)}updated(e){e.has("_view")&&e.get("_view")!==void 0&&(this.scrollTop=0,this.renderRoot.querySelector("main")?.focus({preventScroll:!0})),this._watchTabs(),(e.has("_view")||e.has("narrow"))&&this._revealTab(),e.has("_moreOpen")&&(this._moreOpen?this._focusSheet():e.get("_moreOpen")&&this._restoreMoreFocus())}get _prefix(){return this.route?.prefix||"/jarvis"}_syncViewFromRoute(){this._view=wc(this.route?.path).view.key}_syncViewFromLocation(){let e=this._prefix,t=location.pathname.startsWith(e)?location.pathname.slice(e.length):"";this._view=wc(t).view.key,this.route||(this.route={prefix:e,path:t||`/${this._view}`})}navigate(e,t,n=!1){let s=or(e)??or(ao),o=t?`/${t.replace(/^\/+/,"")}`:"",l=`${this._prefix}/${s.key}${o}`;this._moreOpen=!1,!(location.pathname===l&&this._view===s.key)&&Xc(l,n)}_startTimer(){this._timer||(this._timer=setInterval(()=>{document.visibilityState==="visible"&&this._load()},Nv))}_stopTimer(){this._timer&&clearInterval(this._timer),this._timer=null,this._debounce&&clearTimeout(this._debounce),this._debounce=null}async refresh(){return this._load()}_load(){return this.hass?this._inFlight?this._inFlight:(this._loading=!0,this._inFlight=(async()=>{try{let e=await X(this.hass,"jarvis/get_panel_data");this._data=e,this._error=null,this._lastFetch=Date.now(),this._ensureLanguage()}catch(e){let t=e instanceof Y?e:Y.from("jarvis/get_panel_data",e);this._error=t.message||t.code}finally{this._loading=!1,this._inFlight=null}})(),this._inFlight):Promise.resolve()}_gateLanguage(){this._langReady||setTimeout(()=>{this._langReady=!0},Ry)}async _ensureLanguage(){let e=Ss(this._data?.config?.ui_language,this.hass?.language);if(e.toLowerCase()===Gc()&&this._langReady)return;let t=await ks(e);this._langReady=!0,t&&(this.requestUpdate(),this.renderRoot.querySelectorAll("[data-jv-view]").forEach(n=>n.requestUpdate?.()))}_onTabKeydown(e){if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key))return;e.preventDefault();let n=Xt.findIndex(l=>l.key===this._view),s=n;e.key==="ArrowRight"?s=(n+1)%Xt.length:e.key==="ArrowLeft"?s=(n-1+Xt.length)%Xt.length:e.key==="Home"?s=0:e.key==="End"&&(s=Xt.length-1);let o=Xt[s];this.navigate(o.key),this.updateComplete.then(()=>{this.renderRoot.querySelector(`[role="tab"][data-view="${o.key}"]`)?.focus({preventScroll:!0}),this._revealTab()})}_tablist(){return this.renderRoot.querySelector('[role="tablist"]')}_watchTabs(){let e=this._tablist();if(e!==this._observedTabs){if(this._tabsObserver?.disconnect(),this._observedTabs=e,!e){this._fadeStart=this._fadeEnd=!1;return}if(!this._tabsObserver&&typeof ResizeObserver=="function"&&(this._tabsObserver=new ResizeObserver(()=>this._updateFades())),this._tabsObserver){this._tabsObserver.observe(e);for(let t of e.querySelectorAll('[role="tab"]'))this._tabsObserver.observe(t)}this._updateFades()}}_revealTab(){let e=this._tablist(),t=e?.querySelector(`[role="tab"][data-view="${this._view}"]`);if(!e||!t||!e.clientWidth){this._updateFades();return}let n=t.offsetLeft,s=n+t.offsetWidth,o=e.scrollLeft,l=o+e.clientWidth,d=o;n-oo<o?d=n-oo:s+oo>l&&(d=s+oo-e.clientWidth),d=Math.max(0,Math.min(d,e.scrollWidth-e.clientWidth)),d!==o&&(e.scrollLeft=d),this._updateFades()}_scrollTabs(e){let t=this._tablist();if(!t)return;let n=Math.max(0,Math.min(t.scrollLeft+e*Math.max(80,t.clientWidth*.8),t.scrollWidth-t.clientWidth)),s=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;typeof t.scrollTo=="function"?t.scrollTo({left:n,behavior:s?"auto":"smooth"}):t.scrollLeft=n,this._updateFades()}_onTabWheel(e){let t=e.currentTarget;if(e.shiftKey||e.ctrlKey||Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;let n=t.scrollWidth-t.clientWidth;if(n<=1)return;let s=e.deltaMode===1?16:e.deltaMode===2?t.clientWidth:1,o=e.deltaY*s;o<0&&t.scrollLeft<=0||o>0&&t.scrollLeft>=n-1||(e.preventDefault(),t.scrollLeft=Math.max(0,Math.min(t.scrollLeft+o,n)))}_updateFades(){let e=this._tablist();if(!e){this._fadeStart=this._fadeEnd=!1;return}let t=e.scrollWidth-e.clientWidth;this._fadeStart=e.scrollLeft>1,this._fadeEnd=t>1&&e.scrollLeft<t-1}_openMore(){this._moreReturnFocus=this.renderRoot.querySelector(".nav-item.more"),this._moreOpen=!0}_closeMore(){this._moreOpen=!1}_sheet(){return this.renderRoot.querySelector(".sheet")}_sheetFocusables(){let e=this._sheet();return e?[...e.querySelectorAll(Cy)]:[]}_focusSheet(){this.updateComplete.then(()=>{let e=this._sheet();if(!e)return;let t=e.querySelector('.sheet-item[aria-current="page"]'),n=e.querySelector(".sheet-item");(t??n??e).focus({preventScroll:!0})})}_restoreMoreFocus(){let e=this._moreReturnFocus;this._moreReturnFocus=null,this.updateComplete.then(()=>{e?.isConnected&&e.focus({preventScroll:!0})})}_onSheetKeydown(e){if(e.key==="Escape"){e.preventDefault(),e.stopPropagation(),this._closeMore();return}if(e.key!=="Tab")return;let t=this._sheetFocusables();if(!t.length)return;let n=this.renderRoot.activeElement,s=n?t.indexOf(n):-1,o;e.shiftKey&&(s<=0||s===-1)?o=t[t.length-1]:!e.shiftKey&&(s===t.length-1||s===-1)&&(o=t[0]),o&&(e.preventDefault(),o.focus({preventScroll:!0}))}_tag(e){let t=this._tags.get(e);return t||(t=Hr(e),this._tags.set(e,t)),t}_icon(e){return x("ha-icon")?c`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:m}_renderMenuButton(){return x("ha-menu-button")?c`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:c`
      <button class="jv-icon-btn menu-btn" type="button" aria-label=${a("Menu")} @click=${()=>Yc(this)}>
        ${x("ha-icon")?this._icon("mdi:menu"):c`<span aria-hidden="true">≡</span>`}
      </button>
    `}_renderRefreshButton(){let e=a("Refresh");return x("ha-icon-button")?c`
        <ha-icon-button .label=${e} .disabled=${this._loading} @click=${()=>{this._load()}}>
          ${this._icon("mdi:refresh")}
        </ha-icon-button>
      `:c`
      <button class="jv-icon-btn" type="button" aria-label=${e} ?disabled=${this._loading} @click=${()=>{this._load()}}>
        ${x("ha-icon")?this._icon("mdi:refresh"):c`<span aria-hidden="true">↻</span>`}
      </button>
    `}_renderTabs(){let e=`tabs-wrap${this._fadeStart?" fade-start":""}${this._fadeEnd?" fade-end":""}`;return c`
      <div class=${e}>
        ${this._renderTabScroll(-1)}
        <div
          role="tablist"
          aria-label=${a("Sections")}
          @keydown=${this._onTabKeydown}
          @scroll=${this._updateFades}
          @wheel=${this._onTabWheel}
        >
          ${Xt.map(t=>this._renderTab(t))}
        </div>
        ${this._renderTabScroll(1)}
      </div>
    `}_renderTabScroll(e){return c`
      <button
        class="tab-scroll ${e<0?"start":"end"}"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        @mousedown=${t=>t.preventDefault()}
        @click=${()=>this._scrollTabs(e)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d=${e<0?"M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z":"M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z"} fill="currentColor" />
        </svg>
      </button>
    `}_renderTab(e){let t=e.key===this._view;return c`
      <button
        class="tab"
        type="button"
        role="tab"
        id="tab-${e.key}"
        data-view=${e.key}
        aria-selected=${t?"true":"false"}
        aria-controls="main"
        tabindex=${t?0:-1}
        @click=${()=>this.navigate(e.key)}
      >
        ${this._icon(e.icon)}
        <span>${a(e.title)}</span>
      </button>
    `}_renderNavItem(e){return c`
      <button
        class="nav-item"
        type="button"
        data-view=${e.key}
        aria-current=${e.key===this._view?"page":m}
        aria-label=${a(e.title)}
        @click=${()=>this.navigate(e.key)}
      >
        ${this._icon(e.icon)}
        <span class="label">${a(e.title)}</span>
      </button>
    `}_renderMoreItem(){let e=_c(this._view)?void 0:or(this._view),t=a("More");return c`
      <button
        class="nav-item more"
        type="button"
        data-more
        data-view=${e?.key??m}
        aria-current=${e?"page":m}
        aria-haspopup="dialog"
        aria-expanded=${this._moreOpen?"true":"false"}
        aria-label=${e?`${a(e.title)} (${t})`:t}
        @click=${this._openMore}
      >
        ${this._icon(e?.icon??"mdi:dots-horizontal")}
        <span class="label">${e?a(e.title):t}</span>
      </button>
    `}_renderBottomNav(){let e=yc.map(t=>or(t)).filter(t=>!!t);return c`
      <nav class="bottom ${x("ha-icon")?"":"no-icons"}" aria-label=${a("Sections")} ?inert=${this._moreOpen}>
        ${e.map(t=>this._renderNavItem(t))}
        ${this._renderMoreItem()}
      </nav>
    `}_renderMoreSheet(){return!this.narrow||!this._moreOpen?m:c`
      <button class="scrim" type="button" tabindex="-1" aria-label=${a("Close")} @click=${this._closeMore}></button>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1" @keydown=${this._onSheetKeydown}>
        <div class="sheet-head">
          <h2 id="sheet-title">${a("More sections")}</h2>
          <button class="jv-icon-btn" type="button" aria-label=${a("Close")} @click=${this._closeMore}>
            ${x("ha-icon")?this._icon("mdi:close"):c`<span aria-hidden="true">×</span>`}
          </button>
        </div>
        <ul class="sheet-list">
          ${Ov().map(e=>c`
              <li>
                <button
                  class="sheet-item"
                  type="button"
                  data-view=${e.key}
                  aria-current=${e.key===this._view?"page":m}
                  @click=${()=>this.navigate(e.key)}
                >
                  ${this._icon(e.icon)}
                  <span>${a(e.title)}</span>
                </button>
              </li>
            `)}
        </ul>
      </div>
    `}_renderError(){if(!this._error)return m;let e=a("Could not load JARVIS data"),t=c`
      <button class="jv-btn text" type="button" slot="action" @click=${()=>{this._load()}}>${a("Retry")}</button>
    `;return x("ha-alert")?c`<ha-alert alert-type="error" .title=${e}>${this._error}${t}</ha-alert>`:c`
      <div class="alert" role="alert">
        <div class="body"><strong>${e}</strong><span>${this._error}</span></div>
        ${t}
      </div>
    `}_renderView(){if(!this.hass||!this._langReady)return c`<div class="gate" role="status" aria-live="polite">${a("Loading...")}</div>`;let e=or(this._view)??Xt[0],t=this._tag(e.element),n=this.route??{prefix:this._prefix,path:`/${e.key}`};return ye`
      <${t}
        data-jv-view=${e.key}
        .hass=${this.hass}
        .narrow=${this.narrow}
        .data=${this._data}
        .route=${n}
      ></${t}>
    `}render(){let e=!!this._data?.lockdown?.active,t=!!this._data?.intrusion?.active,n=this._data?.version,s=this.narrow&&this._moreOpen;return c`
      <header ?inert=${s}>
        <div class="brand">
          ${this.narrow?this._renderMenuButton():m}
          <svg class="logo" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
            <rect x="1.5" y="1.5" width="25" height="25" rx="7" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path d="M17.6 7.5v8.4a4.4 4.4 0 0 1-8.8 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          </svg>
          <h1>
            JARVIS
            ${n?c`<span class="ver jv-mono">v${n}</span>`:m}
          </h1>
        </div>
        ${this.narrow?m:this._renderTabs()}
        <div class="spacer"></div>
        <div class="bar-actions">
          ${e?c`<jv-state-badge level="danger" .label=${a("Lockdown")}></jv-state-badge>`:t?c`<jv-state-badge level="warn" pulse .label=${a("Intrusion")}></jv-state-badge>`:this._data?c`<jv-state-badge
                    level=${Zc(this._data.status?.observer?.level)}
                    .label=${a("Observer")}
                  ></jv-state-badge>`:m}
          ${this._renderRefreshButton()}
        </div>
      </header>
      <main id="main" tabindex="-1" role="tabpanel" aria-labelledby=${this.narrow?m:`tab-${this._view}`} ?inert=${s}>
        ${this._renderError()}
        ${this._renderView()}
      </main>
      ${this.narrow?this._renderBottomNav():m}
      ${this._renderMoreSheet()}
    `}};Be.styles=[T,S`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: var(--jv-bg);
        color: var(--jv-text);
        overflow-y: auto;
        overscroll-behavior: contain;
        /* the panel's own width drives the bottom-nav label rule below; the
           inline-size containment also makes the host the containing block
           of the fixed More sheet, so it never escapes the panel */
        container: jv-panel / inline-size;
        /* The height of the stuck app bar (56 px, plus the 48 px tab row
           when it takes its own line). Views inherit it for their own sticky
           offsets, and scroll-padding keeps a focused control or a
           scrollIntoView target from landing underneath the header / the
           bottom nav. A container query cannot restyle its own container,
           so the host keeps the two-line value for scroll-padding (a little
           extra room when the tabs sit inline) and main gets the exact one
           from the same panel-width query the tab row uses. */
        --jv-sticky-top: calc(var(--jv-header-height) + 48px);
        scroll-padding-top: var(--jv-sticky-top);
      }
      @container jv-panel (min-width: 1560px) {
        main {
          --jv-sticky-top: var(--jv-header-height);
        }
      }
      :host([narrow]) {
        --jv-sticky-top: var(--jv-header-height);
        scroll-padding-bottom: calc(56px + env(safe-area-inset-bottom));
      }

      /* ── app bar ──────────────────────────────────────────────────── */
      /* Everything drawn on the header uses the --jv-header-* tokens
         (HA's --app-header-*), never the page palette: a theme may paint
         the header in its primary colour. */
      header {
        position: sticky;
        top: 0;
        z-index: 3;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0 var(--jv-space-2);
        padding: env(safe-area-inset-top) var(--jv-space-2) 0 var(--jv-space-2);
        background: var(--jv-header-bg);
        color: var(--jv-header-text);
        border-bottom: var(--jv-header-border);
      }
      :host([narrow]) header {
        flex-wrap: nowrap;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: var(--jv-space-3);
        min-height: var(--jv-header-height);
        padding-left: var(--jv-space-1);
        min-width: 0;
      }
      :host([narrow]) .brand {
        padding-left: 0;
        flex: 1 1 auto;
      }
      /* the mark is an inline SVG drawn in currentColor (the header text) */
      .logo {
        width: 28px;
        height: 28px;
        flex: none;
        color: inherit;
      }
      h1 {
        margin: 0;
        min-width: 0;
        font-size: var(--jv-font-size-xl);
        font-weight: var(--jv-font-weight-normal);
        letter-spacing: 0.02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ver {
        margin-left: var(--jv-space-2);
        font-size: var(--jv-font-size-s);
        opacity: 0.7;
      }
      /* keep the narrow app bar one 56 px row; the version is in Overview */
      :host([narrow]) .ver {
        display: none;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .bar-actions {
        display: flex;
        align-items: center;
        gap: var(--jv-space-2);
        min-height: var(--jv-header-height);
        flex: none;
      }
      .menu-btn,
      ha-menu-button {
        flex: none;
        color: inherit;
      }
      header .jv-icon-btn:hover {
        background: var(--jv-header-hover);
      }
      header .jv-icon-btn:focus-visible {
        box-shadow: var(--jv-header-focus-ring);
      }
      header jv-state-badge {
        --jv-text: var(--jv-header-text);
        --jv-surface: var(--jv-header-bg);
      }

      /* ── tabs (wide) ──────────────────────────────────────────────── */
      /* Ten tabs never wrap: the row scrolls horizontally (scrollbar
         hidden, the selected tab is scrolled into view by _revealTab) and
         .tabs-wrap paints a header-coloured fade over the edge that still
         has tabs behind it, with a chevron button on it for mouse users
         (a vertical wheel over the row scrolls it sideways too, see
         _onTabWheel; keyboard users have the arrow keys). The breakpoint is
         the panel's own width (a container query, so HA's open sidebar
         counts): below 1560px - roughly where brand, ten icon + label tabs
         and the actions fit on one line - the row takes a full second line
         under the brand; above it sits inline between brand and actions,
         centred while it fits (the auto margins on the first / last tab
         collapse to 0 once it overflows, so every tab stays reachable). */
      .tabs-wrap {
        position: relative;
        display: flex;
        flex: 1 1 100%;
        min-width: 0;
        order: 10;
        margin: 0 calc(-1 * var(--jv-space-2));
      }
      @container jv-panel (min-width: 1560px) {
        .tabs-wrap {
          flex: 1 1 auto;
          order: 0;
          margin: 0;
        }
      }
      [role="tablist"] {
        position: relative;
        display: flex;
        align-items: stretch;
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        padding: 0 var(--jv-space-2);
        /* room for the inset focus ring at the scroll edges */
        scroll-padding: 0 var(--jv-space-5);
      }
      [role="tablist"]::-webkit-scrollbar {
        display: none;
      }
      @container jv-panel (min-width: 1560px) {
        [role="tablist"] {
          padding: 0;
        }
        .tab:first-child {
          margin-left: auto;
        }
        .tab:last-child {
          margin-right: auto;
        }
      }
      .tabs-wrap::before,
      .tabs-wrap::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        width: var(--jv-space-5);
        pointer-events: none;
        opacity: 0;
        transition: opacity var(--jv-ease);
      }
      .tabs-wrap::before {
        left: 0;
        background: linear-gradient(to right, var(--jv-header-bg), transparent);
      }
      .tabs-wrap::after {
        right: 0;
        background: linear-gradient(to left, var(--jv-header-bg), transparent);
      }
      .tabs-wrap.fade-start::before,
      .tabs-wrap.fade-end::after {
        opacity: 1;
      }
      /* Mouse affordance on a faded edge: one click pages the row by most
         of its width. Hidden from assistive tech and out of the tab order
         (the tabs themselves are reachable with the arrow keys). */
      .tabs-wrap .tab-scroll {
        appearance: none;
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 1;
        display: none;
        align-items: center;
        justify-content: center;
        width: 32px;
        padding: 0;
        border: 0;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }
      .tabs-wrap .tab-scroll.start {
        left: 0;
        background: linear-gradient(to right, var(--jv-header-bg) 60%, transparent);
      }
      .tabs-wrap .tab-scroll.end {
        right: 0;
        background: linear-gradient(to left, var(--jv-header-bg) 60%, transparent);
      }
      .tabs-wrap.fade-start .tab-scroll.start,
      .tabs-wrap.fade-end .tab-scroll.end {
        display: flex;
      }
      .tabs-wrap .tab-scroll svg {
        width: 20px;
        height: 20px;
        opacity: 0.72;
        transition: opacity var(--jv-ease);
      }
      .tabs-wrap .tab-scroll:hover svg {
        opacity: 1;
      }
      .tab {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        gap: var(--jv-space-2);
        min-height: 48px;
        padding: 0 var(--jv-space-4);
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: inherit;
        opacity: 0.72;
        font: inherit;
        font-weight: var(--jv-font-weight-medium);
        white-space: nowrap;
        cursor: pointer;
        transition: opacity var(--jv-ease), background-color var(--jv-ease);
        --mdc-icon-size: 20px;
      }
      .tab:hover {
        opacity: 1;
        background: var(--jv-header-hover);
      }
      .tab[aria-selected="true"] {
        opacity: 1;
        border-bottom-color: var(--jv-header-indicator);
      }
      .tab:focus-visible {
        box-shadow: var(--jv-header-focus-ring);
      }

      /* ── content ──────────────────────────────────────────────────── */
      main {
        flex: 1 0 auto;
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        padding: var(--jv-space-4);
        outline: none;
      }
      :host([narrow]) main {
        padding: var(--jv-space-3) var(--jv-space-3) var(--jv-space-4);
      }
      .alert {
        display: flex;
        align-items: flex-start;
        gap: var(--jv-space-3);
        margin-bottom: var(--jv-space-4);
        padding: var(--jv-space-3) var(--jv-space-4);
        border-radius: var(--jv-radius-sm);
        border-left: 4px solid var(--jv-danger);
        background: var(--jv-danger-soft);
      }
      .alert .body {
        flex: 1 1 auto;
        min-width: 0;
      }
      .alert strong {
        display: block;
        font-weight: var(--jv-font-weight-medium);
      }
      ha-alert {
        display: block;
        margin-bottom: var(--jv-space-4);
      }
      .gate {
        padding: var(--jv-space-5);
        text-align: center;
        color: var(--jv-text-2);
      }

      /* ── bottom nav (narrow) ──────────────────────────────────────── */
      nav.bottom {
        position: sticky;
        bottom: 0;
        z-index: 3;
        display: flex;
        padding-bottom: env(safe-area-inset-bottom);
        background: var(--jv-surface);
        border-top: 1px solid var(--jv-divider);
      }
      .nav-item {
        appearance: none;
        flex: 1 1 0;
        min-width: 0;
        min-height: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: var(--jv-space-1) 2px;
        border: 0;
        background: transparent;
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-xs);
        cursor: pointer;
        --mdc-icon-size: 24px;
      }
      .nav-item[aria-current="page"] {
        color: var(--jv-accent-text);
      }
      .nav-item .label {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      /* Five destinations (four primary views + More) fit labelled down to
         about 380 px (an item is 76 px at 380 px; "Einstellungen" needs
         ~70 px at 10 px). When the panel itself is narrower than that (a
         container query on :host, so the harness frame and HA's narrow
         layout measure the same thing) only the current item keeps its
         label and gets twice the room - Material's "selected" label mode;
         the others are icon-only with their aria-label. */
      @container jv-panel (max-width: 379px) {
        nav.bottom:not(.no-icons) .nav-item[aria-current="page"] {
          flex-grow: 2;
        }
        /* only when there is an icon to leave behind (ha-icon undefined =
           the harness / a very early HA load) */
        nav.bottom:not(.no-icons) .nav-item:not([aria-current="page"]) .label {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
      }
      .nav-item:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }

      /* ── "More" bottom sheet (narrow) ─────────────────────────────── */
      .scrim {
        position: fixed;
        inset: 0;
        z-index: 4;
        border: 0;
        padding: 0;
        margin: 0;
        background: var(--jv-scrim);
        cursor: default;
      }
      .sheet {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 5;
        max-height: 70%;
        overflow-y: auto;
        padding-bottom: env(safe-area-inset-bottom);
        background: var(--jv-surface);
        color: var(--jv-text);
        border-radius: var(--jv-radius) var(--jv-radius) 0 0;
        border-top: 1px solid var(--jv-divider);
        box-shadow: var(--jv-shadow);
      }
      .sheet-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--jv-space-2);
        padding: var(--jv-space-2) var(--jv-space-2) 0 var(--jv-space-4);
      }
      .sheet h2 {
        margin: 0;
        font-size: var(--jv-font-size-l);
        font-weight: var(--jv-font-weight-medium);
      }
      .sheet-list {
        list-style: none;
        margin: 0;
        padding: var(--jv-space-2) var(--jv-space-2) var(--jv-space-3);
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--jv-space-1);
      }
      .sheet-item {
        appearance: none;
        width: 100%;
        min-height: 72px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--jv-space-1);
        padding: var(--jv-space-2) var(--jv-space-1);
        border: 0;
        border-radius: var(--jv-radius-sm);
        background: transparent;
        color: var(--jv-text-2);
        font: inherit;
        font-size: var(--jv-font-size-s);
        text-align: center;
        cursor: pointer;
        --mdc-icon-size: 24px;
      }
      .sheet-item span {
        max-width: 100%;
        overflow-wrap: anywhere;
      }
      .sheet-item:hover {
        background: var(--jv-hover);
      }
      .sheet-item[aria-current="page"] {
        color: var(--jv-accent-text);
        background: var(--jv-accent-soft);
      }
      .sheet-item:focus-visible,
      .sheet .jv-icon-btn:focus-visible {
        box-shadow: var(--jv-focus-ring-inset);
      }
    `],h([$({attribute:!1})],Be.prototype,"hass",2),h([$({type:Boolean,reflect:!0})],Be.prototype,"narrow",2),h([$({attribute:!1})],Be.prototype,"route",2),h([$({attribute:!1})],Be.prototype,"panel",2),h([b()],Be.prototype,"_data",2),h([b()],Be.prototype,"_error",2),h([b()],Be.prototype,"_loading",2),h([b()],Be.prototype,"_langReady",2),h([b()],Be.prototype,"_view",2),h([b()],Be.prototype,"_moreOpen",2),h([b()],Be.prototype,"_fadeStart",2),h([b()],Be.prototype,"_fadeEnd",2),Be=h([A("jarvis-panel")],Be);
