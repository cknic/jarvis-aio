/* JARVIS panel. Built from frontend/ with `npm run build`; do not edit by hand. */
var Xn=Object.defineProperty;var Zn=Object.getOwnPropertyDescriptor;var h=(a,i,e,t)=>{for(var r=t>1?void 0:t?Zn(i,e):i,n=a.length-1,o;n>=0;n--)(o=a[n])&&(r=(t?o(i,e,r):o(r))||r);return t&&r&&Xn(i,e,r),r};var ir=globalThis,ar=ir.ShadowRoot&&(ir.ShadyCSS===void 0||ir.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Or=Symbol(),Ei=new WeakMap,Nt=class{constructor(i,e,t){if(this._$cssResult$=!0,t!==Or)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=i,this.t=e}get styleSheet(){let i=this.o,e=this.t;if(ar&&i===void 0){let t=e!==void 0&&e.length===1;t&&(i=Ei.get(e)),i===void 0&&((this.o=i=new CSSStyleSheet).replaceSync(this.cssText),t&&Ei.set(e,i))}return i}toString(){return this.cssText}},Ai=a=>new Nt(typeof a=="string"?a:a+"",void 0,Or),R=(a,...i)=>{let e=a.length===1?a[0]:i.reduce((t,r,n)=>t+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+a[n+1],a[0]);return new Nt(e,a,Or)},Ti=(a,i)=>{if(ar)a.adoptedStyleSheets=i.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of i){let t=document.createElement("style"),r=ir.litNonce;r!==void 0&&t.setAttribute("nonce",r),t.textContent=e.cssText,a.appendChild(t)}},Nr=ar?a=>a:a=>a instanceof CSSStyleSheet?(i=>{let e="";for(let t of i.cssRules)e+=t.cssText;return Ai(e)})(a):a;var{is:Qn,defineProperty:Jn,getOwnPropertyDescriptor:es,getOwnPropertyNames:ts,getOwnPropertySymbols:rs,getPrototypeOf:is}=Object,nr=globalThis,Ri=nr.trustedTypes,as=Ri?Ri.emptyScript:"",ns=nr.reactiveElementPolyfillSupport,It=(a,i)=>a,Ht={toAttribute(a,i){switch(i){case Boolean:a=a?as:null;break;case Object:case Array:a=a==null?a:JSON.stringify(a)}return a},fromAttribute(a,i){let e=a;switch(i){case Boolean:e=a!==null;break;case Number:e=a===null?null:Number(a);break;case Object:case Array:try{e=JSON.parse(a)}catch{e=null}}return e}},sr=(a,i)=>!Qn(a,i),Ci={attribute:!0,type:String,converter:Ht,reflect:!1,useDefault:!1,hasChanged:sr};Symbol.metadata??=Symbol("metadata"),nr.litPropertyMetadata??=new WeakMap;var Ue=class extends HTMLElement{static addInitializer(i){this._$Ei(),(this.l??=[]).push(i)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(i,e=Ci){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(i)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(i,e),!e.noAccessor){let t=Symbol(),r=this.getPropertyDescriptor(i,t,e);r!==void 0&&Jn(this.prototype,i,r)}}static getPropertyDescriptor(i,e,t){let{get:r,set:n}=es(this.prototype,i)??{get(){return this[e]},set(o){this[e]=o}};return{get:r,set(o){let c=r?.call(this);n?.call(this,o),this.requestUpdate(i,c,t)},configurable:!0,enumerable:!0}}static getPropertyOptions(i){return this.elementProperties.get(i)??Ci}static _$Ei(){if(this.hasOwnProperty(It("elementProperties")))return;let i=is(this);i.finalize(),i.l!==void 0&&(this.l=[...i.l]),this.elementProperties=new Map(i.elementProperties)}static finalize(){if(this.hasOwnProperty(It("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(It("properties"))){let e=this.properties,t=[...ts(e),...rs(e)];for(let r of t)this.createProperty(r,e[r])}let i=this[Symbol.metadata];if(i!==null){let e=litPropertyMetadata.get(i);if(e!==void 0)for(let[t,r]of e)this.elementProperties.set(t,r)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let r=this._$Eu(e,t);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(i){let e=[];if(Array.isArray(i)){let t=new Set(i.flat(1/0).reverse());for(let r of t)e.unshift(Nr(r))}else i!==void 0&&e.push(Nr(i));return e}static _$Eu(i,e){let t=e.attribute;return t===!1?void 0:typeof t=="string"?t:typeof i=="string"?i.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(i=>this.enableUpdating=i),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(i=>i(this))}addController(i){(this._$EO??=new Set).add(i),this.renderRoot!==void 0&&this.isConnected&&i.hostConnected?.()}removeController(i){this._$EO?.delete(i)}_$E_(){let i=new Map,e=this.constructor.elementProperties;for(let t of e.keys())this.hasOwnProperty(t)&&(i.set(t,this[t]),delete this[t]);i.size>0&&(this._$Ep=i)}createRenderRoot(){let i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ti(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(i=>i.hostConnected?.())}enableUpdating(i){}disconnectedCallback(){this._$EO?.forEach(i=>i.hostDisconnected?.())}attributeChangedCallback(i,e,t){this._$AK(i,t)}_$ET(i,e){let t=this.constructor.elementProperties.get(i),r=this.constructor._$Eu(i,t);if(r!==void 0&&t.reflect===!0){let n=(t.converter?.toAttribute!==void 0?t.converter:Ht).toAttribute(e,t.type);this._$Em=i,n==null?this.removeAttribute(r):this.setAttribute(r,n),this._$Em=null}}_$AK(i,e){let t=this.constructor,r=t._$Eh.get(i);if(r!==void 0&&this._$Em!==r){let n=t.getPropertyOptions(r),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:Ht;this._$Em=r;let c=o.fromAttribute(e,n.type);this[r]=c??this._$Ej?.get(r)??c,this._$Em=null}}requestUpdate(i,e,t,r=!1,n){if(i!==void 0){let o=this.constructor;if(r===!1&&(n=this[i]),t??=o.getPropertyOptions(i),!((t.hasChanged??sr)(n,e)||t.useDefault&&t.reflect&&n===this._$Ej?.get(i)&&!this.hasAttribute(o._$Eu(i,t))))return;this.C(i,e,t)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(i,e,{useDefault:t,reflect:r,wrapped:n},o){t&&!(this._$Ej??=new Map).has(i)&&(this._$Ej.set(i,o??e??this[i]),n!==!0||o!==void 0)||(this._$AL.has(i)||(this.hasUpdated||t||(e=void 0),this._$AL.set(i,e)),r===!0&&this._$Em!==i&&(this._$Eq??=new Set).add(i))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let i=this.scheduleUpdate();return i!=null&&await i,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,n]of this._$Ep)this[r]=n;this._$Ep=void 0}let t=this.constructor.elementProperties;if(t.size>0)for(let[r,n]of t){let{wrapped:o}=n,c=this[r];o!==!0||this._$AL.has(r)||c===void 0||this.C(r,void 0,n,c)}}let i=!1,e=this._$AL;try{i=this.shouldUpdate(e),i?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(t){throw i=!1,this._$EM(),t}i&&this._$AE(e)}willUpdate(i){}_$AE(i){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(i)),this.updated(i)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(i){return!0}update(i){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(i){}firstUpdated(i){}};Ue.elementStyles=[],Ue.shadowRootOptions={mode:"open"},Ue[It("elementProperties")]=new Map,Ue[It("finalized")]=new Map,ns?.({ReactiveElement:Ue}),(nr.reactiveElementVersions??=[]).push("2.1.2");var Hr=globalThis,Mi=a=>a,or=Hr.trustedTypes,Li=or?or.createPolicy("lit-html",{createHTML:a=>a}):void 0,Br="$lit$",Ge=`lit$${Math.random().toFixed(9).slice(2)}$`,zr="?"+Ge,ss=`<${zr}>`,ct=document,zt=()=>ct.createComment(""),qt=a=>a===null||typeof a!="object"&&typeof a!="function",qr=Array.isArray,Ii=a=>qr(a)||typeof a?.[Symbol.iterator]=="function",Ir=`[ 	
\f\r]`,Bt=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Pi=/-->/g,Di=/>/g,ot=RegExp(`>|${Ir}(?:([^\\s"'>=/]+)(${Ir}*=${Ir}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Fi=/'/g,Oi=/"/g,Hi=/^(?:script|style|textarea|title)$/i,Ur=a=>(i,...e)=>({_$litType$:a,strings:i,values:e}),l=Ur(1),Bi=Ur(2),zi=Ur(3),le=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),Ni=new WeakMap,lt=ct.createTreeWalker(ct,129);function qi(a,i){if(!qr(a)||!a.hasOwnProperty("raw"))throw Error("invalid template strings array");return Li!==void 0?Li.createHTML(i):i}var Ui=(a,i)=>{let e=a.length-1,t=[],r,n=i===2?"<svg>":i===3?"<math>":"",o=Bt;for(let c=0;c<e;c++){let d=a[c],u,p,v=-1,f=0;for(;f<d.length&&(o.lastIndex=f,p=o.exec(d),p!==null);)f=o.lastIndex,o===Bt?p[1]==="!--"?o=Pi:p[1]!==void 0?o=Di:p[2]!==void 0?(Hi.test(p[2])&&(r=RegExp("</"+p[2],"g")),o=ot):p[3]!==void 0&&(o=ot):o===ot?p[0]===">"?(o=r??Bt,v=-1):p[1]===void 0?v=-2:(v=o.lastIndex-p[2].length,u=p[1],o=p[3]===void 0?ot:p[3]==='"'?Oi:Fi):o===Oi||o===Fi?o=ot:o===Pi||o===Di?o=Bt:(o=ot,r=void 0);let b=o===ot&&a[c+1].startsWith("/>")?" ":"";n+=o===Bt?d+ss:v>=0?(t.push(u),d.slice(0,v)+Br+d.slice(v)+Ge+b):d+Ge+(v===-2?c:b)}return[qi(a,n+(a[e]||"<?>")+(i===2?"</svg>":i===3?"</math>":"")),t]},Ut=class a{constructor({strings:i,_$litType$:e},t){let r;this.parts=[];let n=0,o=0,c=i.length-1,d=this.parts,[u,p]=Ui(i,e);if(this.el=a.createElement(u,t),lt.currentNode=this.el.content,e===2||e===3){let v=this.el.content.firstChild;v.replaceWith(...v.childNodes)}for(;(r=lt.nextNode())!==null&&d.length<c;){if(r.nodeType===1){if(r.hasAttributes())for(let v of r.getAttributeNames())if(v.endsWith(Br)){let f=p[o++],b=r.getAttribute(v).split(Ge),j=/([.?@])?(.*)/.exec(f);d.push({type:1,index:n,name:j[2],strings:b,ctor:j[1]==="."?cr:j[1]==="?"?dr:j[1]==="@"?ur:ut}),r.removeAttribute(v)}else v.startsWith(Ge)&&(d.push({type:6,index:n}),r.removeAttribute(v));if(Hi.test(r.tagName)){let v=r.textContent.split(Ge),f=v.length-1;if(f>0){r.textContent=or?or.emptyScript:"";for(let b=0;b<f;b++)r.append(v[b],zt()),lt.nextNode(),d.push({type:2,index:++n});r.append(v[f],zt())}}}else if(r.nodeType===8)if(r.data===zr)d.push({type:2,index:n});else{let v=-1;for(;(v=r.data.indexOf(Ge,v+1))!==-1;)d.push({type:7,index:n}),v+=Ge.length-1}n++}}static createElement(i,e){let t=ct.createElement("template");return t.innerHTML=i,t}};function dt(a,i,e=a,t){if(i===le)return i;let r=t!==void 0?e._$Co?.[t]:e._$Cl,n=qt(i)?void 0:i._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),n===void 0?r=void 0:(r=new n(a),r._$AT(a,e,t)),t!==void 0?(e._$Co??=[])[t]=r:e._$Cl=r),r!==void 0&&(i=dt(a,r._$AS(a,i.values),r,t)),i}var lr=class{constructor(i,e){this._$AV=[],this._$AN=void 0,this._$AD=i,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(i){let{el:{content:e},parts:t}=this._$AD,r=(i?.creationScope??ct).importNode(e,!0);lt.currentNode=r;let n=lt.nextNode(),o=0,c=0,d=t[0];for(;d!==void 0;){if(o===d.index){let u;d.type===2?u=new yt(n,n.nextSibling,this,i):d.type===1?u=new d.ctor(n,d.name,d.strings,this,i):d.type===6&&(u=new hr(n,this,i)),this._$AV.push(u),d=t[++c]}o!==d?.index&&(n=lt.nextNode(),o++)}return lt.currentNode=ct,r}p(i){let e=0;for(let t of this._$AV)t!==void 0&&(t.strings!==void 0?(t._$AI(i,t,e),e+=t.strings.length-2):t._$AI(i[e])),e++}},yt=class a{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(i,e,t,r){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=i,this._$AB=e,this._$AM=t,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let i=this._$AA.parentNode,e=this._$AM;return e!==void 0&&i?.nodeType===11&&(i=e.parentNode),i}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(i,e=this){i=dt(this,i,e),qt(i)?i===m||i==null||i===""?(this._$AH!==m&&this._$AR(),this._$AH=m):i!==this._$AH&&i!==le&&this._(i):i._$litType$!==void 0?this.$(i):i.nodeType!==void 0?this.T(i):Ii(i)?this.k(i):this._(i)}O(i){return this._$AA.parentNode.insertBefore(i,this._$AB)}T(i){this._$AH!==i&&(this._$AR(),this._$AH=this.O(i))}_(i){this._$AH!==m&&qt(this._$AH)?this._$AA.nextSibling.data=i:this.T(ct.createTextNode(i)),this._$AH=i}$(i){let{values:e,_$litType$:t}=i,r=typeof t=="number"?this._$AC(i):(t.el===void 0&&(t.el=Ut.createElement(qi(t.h,t.h[0]),this.options)),t);if(this._$AH?._$AD===r)this._$AH.p(e);else{let n=new lr(r,this),o=n.u(this.options);n.p(e),this.T(o),this._$AH=n}}_$AC(i){let e=Ni.get(i.strings);return e===void 0&&Ni.set(i.strings,e=new Ut(i)),e}k(i){qr(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,t,r=0;for(let n of i)r===e.length?e.push(t=new a(this.O(zt()),this.O(zt()),this,this.options)):t=e[r],t._$AI(n),r++;r<e.length&&(this._$AR(t&&t._$AB.nextSibling,r),e.length=r)}_$AR(i=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);i!==this._$AB;){let t=Mi(i).nextSibling;Mi(i).remove(),i=t}}setConnected(i){this._$AM===void 0&&(this._$Cv=i,this._$AP?.(i))}},ut=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(i,e,t,r,n){this.type=1,this._$AH=m,this._$AN=void 0,this.element=i,this.name=e,this._$AM=r,this.options=n,t.length>2||t[0]!==""||t[1]!==""?(this._$AH=Array(t.length-1).fill(new String),this.strings=t):this._$AH=m}_$AI(i,e=this,t,r){let n=this.strings,o=!1;if(n===void 0)i=dt(this,i,e,0),o=!qt(i)||i!==this._$AH&&i!==le,o&&(this._$AH=i);else{let c=i,d,u;for(i=n[0],d=0;d<n.length-1;d++)u=dt(this,c[t+d],e,d),u===le&&(u=this._$AH[d]),o||=!qt(u)||u!==this._$AH[d],u===m?i=m:i!==m&&(i+=(u??"")+n[d+1]),this._$AH[d]=u}o&&!r&&this.j(i)}j(i){i===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,i??"")}},cr=class extends ut{constructor(){super(...arguments),this.type=3}j(i){this.element[this.name]=i===m?void 0:i}},dr=class extends ut{constructor(){super(...arguments),this.type=4}j(i){this.element.toggleAttribute(this.name,!!i&&i!==m)}},ur=class extends ut{constructor(i,e,t,r,n){super(i,e,t,r,n),this.type=5}_$AI(i,e=this){if((i=dt(this,i,e,0)??m)===le)return;let t=this._$AH,r=i===m&&t!==m||i.capture!==t.capture||i.once!==t.once||i.passive!==t.passive,n=i!==m&&(t===m||r);r&&this.element.removeEventListener(this.name,this,t),n&&this.element.addEventListener(this.name,this,i),this._$AH=i}handleEvent(i){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,i):this._$AH.handleEvent(i)}},hr=class{constructor(i,e,t){this.element=i,this.type=6,this._$AN=void 0,this._$AM=e,this.options=t}get _$AU(){return this._$AM._$AU}_$AI(i){dt(this,i)}},Gi={M:Br,P:Ge,A:zr,C:1,L:Ui,R:lr,D:Ii,V:dt,I:yt,H:ut,N:dr,U:ur,B:cr,F:hr},os=Hr.litHtmlPolyfillSupport;os?.(Ut,yt),(Hr.litHtmlVersions??=[]).push("3.3.3");var Ki=(a,i,e)=>{let t=e?.renderBefore??i,r=t._$litPart$;if(r===void 0){let n=e?.renderBefore??null;t._$litPart$=r=new yt(i.insertBefore(zt(),n),n,void 0,e??{})}return r._$AI(a),r};var Gr=globalThis,I=class extends Ue{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let i=super.createRenderRoot();return this.renderOptions.renderBefore??=i.firstChild,i}update(i){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(i),this._$Do=Ki(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return le}};I._$litElement$=!0,I.finalized=!0,Gr.litElementHydrateSupport?.({LitElement:I});var ls=Gr.litElementPolyfillSupport;ls?.({LitElement:I});(Gr.litElementVersions??=[]).push("4.2.2");var D=a=>(i,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(a,i)}):customElements.define(a,i)};var cs={attribute:!0,type:String,converter:Ht,reflect:!1,hasChanged:sr},ds=(a=cs,i,e)=>{let{kind:t,metadata:r}=e,n=globalThis.litPropertyMetadata.get(r);if(n===void 0&&globalThis.litPropertyMetadata.set(r,n=new Map),t==="setter"&&((a=Object.create(a)).wrapped=!0),n.set(e.name,a),t==="accessor"){let{name:o}=e;return{set(c){let d=i.get.call(this);i.set.call(this,c),this.requestUpdate(o,d,a,!0,c)},init(c){return c!==void 0&&this.C(o,void 0,a,c),c}}}if(t==="setter"){let{name:o}=e;return function(c){let d=this[o];i.call(this,c),this.requestUpdate(o,d,a,!0,c)}}throw Error("Unsupported decorator location: "+t)};function x(a){return(i,e)=>typeof e=="object"?ds(a,i,e):((t,r,n)=>{let o=r.hasOwnProperty(n);return r.constructor.createProperty(n,t),o?Object.getOwnPropertyDescriptor(r,n):void 0})(a,i,e)}function $(a){return x({...a,state:!0,attribute:!1})}var ht=(a,i,e)=>(e.configurable=!0,e.enumerable=!0,Reflect.decorate&&typeof i!="object"&&Object.defineProperty(a,i,e),e);function Se(a,i){return(e,t,r)=>{let n=o=>o.renderRoot?.querySelector(a)??null;if(i){let{get:o,set:c}=typeof t=="object"?e:r??(()=>{let d=Symbol();return{get(){return this[d]},set(u){this[d]=u}}})();return ht(e,t,{get(){let d=o.call(this);return d===void 0&&(d=n(this),(d!==null||this.hasUpdated)&&c.call(this,d)),d}})}return ht(e,t,{get(){return n(this)}})}}var Kr=Symbol.for(""),us=a=>{if(a?.r===Kr)return a?._$litStatic$},Vi=a=>({_$litStatic$:a,r:Kr}),Wr=(a,...i)=>({_$litStatic$:i.reduce((e,t,r)=>e+(n=>{if(n._$litStatic$!==void 0)return n._$litStatic$;throw Error(`Value passed to 'literal' function must be a 'literal' result: ${n}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`)})(t)+a[r+1],a[0]),r:Kr}),Wi=new Map,Vr=a=>(i,...e)=>{let t=e.length,r,n,o=[],c=[],d,u=0,p=!1;for(;u<t;){for(d=i[u];u<t&&(n=e[u],(r=us(n))!==void 0);)d+=r+i[++u],p=!0;u!==t&&c.push(n),o.push(d),u++}if(u===t&&o.push(i[t]),p){let v=o.join("$$lit$$");(i=Wi.get(v))===void 0&&(o.raw=o,Wi.set(v,i=o)),e=c}return a(i,...e)},Gt=Vr(l),jl=Vr(Bi),$l=Vr(zi);var Yi=R`
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
`;var F=R`
  ${Yi}

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
`;var Q=class a extends Error{constructor(i,e,t,r){super(t),this.name="WsError",this.command=i,this.code=e,this.cause=r}static from(i,e){if(e instanceof a)return e;if(e&&typeof e=="object"){let t=e,r=String(t.code??t.error?.code??"unknown_error"),n=String(t.message??t.error?.message??`${i} failed`);return new a(i,r,n,e)}return new a(i,"unknown_error",e?String(e):`${i} failed`,e)}};async function Z(a,i,e){if(!a||typeof a.callWS!="function")throw new Q(i,"no_connection","Home Assistant connection not available");try{return await a.callWS({...e??{},type:i})}catch(t){throw Q.from(i,t)}}var hs=300,ps=24e4,Xi=new Map;function vs(a){return/^\/api\//.test(a)}async function Yr(a,i,e=hs){if(!i)return"";if(!a||!vs(i))return i;let t=Xi.get(i),r=Date.now();if(t&&r-t.ts<ps)return t.url;try{let o=(await a.callWS({type:"auth/sign_path",path:i,expires:e}))?.path||i;return Xi.set(i,{url:o,ts:r}),o}catch{return i}}var ms="/jarvis_panel_static/i18n",Zr=null,pr="en",Kt=null,Xr=new Map,Qr=new Set;function s(a,i){let e=Zr&&Zr[a]||a;return i&&(e=e.replace(/\{(\w+)\}/g,(t,r)=>r in i?String(i[r]):t)),e}function Qi(){return pr}function wt(a){return Qr.add(a),()=>{Qr.delete(a)}}async function Zi(a){if(Xr.has(a))return Xr.get(a)??null;let i=null;try{let e=await fetch(`${ms}/${a}.json`);if(e.ok){let t=await e.json();t&&typeof t=="object"&&(i=t)}}catch{i=null}return Xr.set(a,i),i}async function vr(a){let i=String(a||"en").toLowerCase();if(i===pr&&!Kt||(Kt&&await Kt.catch(()=>!1),i===pr))return!1;let e=(async()=>{let t=i.split("-")[0],r=null;t!=="en"&&(r=await Zi(i)||(i!==t?await Zi(t):null)),Zr=r,pr=i;for(let n of Qr)try{n(i)}catch{}return!0})();Kt=e;try{return await e}finally{Kt=null}}function mr(a,i){let e=typeof a=="string"?a.trim():"";return e&&e!=="auto"?e:typeof i=="string"&&i?i:"en"}function E(a){try{return typeof customElements<"u"&&!!customElements.get(a)}catch{return!1}}var Ji=new WeakMap;function z(a,i){if(typeof customElements>"u")return;let e=Ji.get(a);e||(e=new Set,Ji.set(a,e));for(let t of i)e.has(t)||E(t)||(e.add(t),customElements.whenDefined(t).then(()=>a.requestUpdate()).catch(()=>{}))}function ea(a=window){a.dispatchEvent(new CustomEvent("hass-toggle-menu",{bubbles:!0,composed:!0}))}function ta(a,i=!1){i?history.replaceState(null,"",a):history.pushState(null,"",a),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0,detail:{replace:i}}))}var te=class extends I{constructor(){super(...arguments);this.narrow=!1;this.data=null}get subPath(){return(this.route?.path||"").split("/").filter(Boolean).slice(1).join("/")}refresh(){this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}navigate(e,t){let r={view:e,path:t};this.dispatchEvent(new CustomEvent("jarvis-navigate",{bubbles:!0,composed:!0,detail:r}))}ws(e,t){return Z(this.hass,e,t)}};h([x({attribute:!1})],te.prototype,"hass",2),h([x({type:Boolean,reflect:!0})],te.prototype,"narrow",2),h([x({attribute:!1})],te.prototype,"data",2),h([x({attribute:!1})],te.prototype,"route",2);function ra(a){switch(a){case"live":case"ok":return"ok";case"warn":return"warn";case"danger":case"error":return"danger";case"info":return"info";case"accent":return"accent";default:return"neutral"}}var Ke=class extends I{constructor(){super(...arguments);this.level="neutral";this.label="";this.pulse=!1;this.nodot=!1}render(){return l`
      <span class="pill">
        <span class="dot ${this.pulse?"jv-pulse":""}" aria-hidden="true"></span>
        <span class="text"><slot>${this.label}</slot></span>
      </span>
    `}};Ke.styles=[F,R`
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
    `],h([x({type:String,reflect:!0})],Ke.prototype,"level",2),h([x({type:String})],Ke.prototype,"label",2),h([x({type:Boolean,reflect:!0})],Ke.prototype,"pulse",2),h([x({type:Boolean,reflect:!0})],Ke.prototype,"nodot",2),Ke=h([D("jv-state-badge")],Ke);var De=class extends I{constructor(){super(...arguments);this.icon="mdi:inbox-outline";this.heading="";this.message="";this.kind="empty";this.compact=!1}connectedCallback(){super.connectedCallback(),z(this,["ha-icon"])}render(){return this.kind==="loading"?l`
        <div class="skeleton" role="status" aria-live="polite" aria-label=${this.heading||this.message||"…"}>
          <div class="jv-skeleton"></div>
          <div class="jv-skeleton"></div>
        </div>
        ${this.message?l`<p class="message">${this.message}</p>`:m}
      `:l`
      <div class="icon" aria-hidden="true">
        ${E("ha-icon")?l`<ha-icon .icon=${this.icon}></ha-icon>`:m}
      </div>
      ${this.heading?l`<h3 class="heading">${this.heading}</h3>`:m}
      ${this.message?l`<p class="message">${this.message}</p>`:m}
      <slot name="action"></slot>
    `}};De.styles=[F,R`
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
    `],h([x({type:String})],De.prototype,"icon",2),h([x({type:String})],De.prototype,"heading",2),h([x({type:String})],De.prototype,"message",2),h([x({type:String,reflect:!0})],De.prototype,"kind",2),h([x({type:Boolean,reflect:!0})],De.prototype,"compact",2),De=h([D("jv-empty")],De);var Fe=class extends I{constructor(){super(...arguments);this.heading="";this.subheading="";this.icon="";this.flush=!1;this.loading=!1}connectedCallback(){super.connectedCallback(),z(this,["ha-card","ha-icon"])}_inner(){let e=!!(this.heading||this.subheading||this.icon);return l`
      ${e?l`
            <div class="head">
              ${this.icon&&E("ha-icon")?l`<ha-icon .icon=${this.icon}></ha-icon>`:m}
              <div class="titles">
                ${this.heading?l`<h2>${this.heading}</h2>`:m}
                ${this.subheading?l`<p class="sub">${this.subheading}</p>`:m}
              </div>
              <div class="actions"><slot name="actions"></slot></div>
            </div>
          `:m}
      ${this.loading?l`<div class="progress" role="progressbar" aria-busy="true"></div>`:m}
      <div class="body"><slot></slot></div>
    `}render(){return E("ha-card")?l`<ha-card>${this._inner()}</ha-card>`:l`<div class="jv-card">${this._inner()}</div>`}};Fe.styles=[F,R`
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
    `],h([x({type:String})],Fe.prototype,"heading",2),h([x({type:String})],Fe.prototype,"subheading",2),h([x({type:String})],Fe.prototype,"icon",2),h([x({type:Boolean,reflect:!0})],Fe.prototype,"flush",2),h([x({type:Boolean,reflect:!0})],Fe.prototype,"loading",2),Fe=h([D("jv-section")],Fe);var We=class extends I{constructor(){super(...arguments);this.label="";this.value="";this.mono=!1;this.stacked=!1}render(){return l`
      <span class="label">${this.label}</span>
      <span class="value"><slot>${this.value}</slot></span>
    `}};We.styles=[F,R`
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
    `],h([x({type:String})],We.prototype,"label",2),h([x({type:String})],We.prototype,"value",2),h([x({type:Boolean,reflect:!0})],We.prototype,"mono",2),h([x({type:Boolean,reflect:!0})],We.prototype,"stacked",2),We=h([D("jv-kv")],We);var _e=class extends I{constructor(){super(...arguments);this.heading="";this.message="";this.confirmLabel="";this.cancelLabel="";this.destructive=!1;this._open=!1;this._resolve=null}show(){return this._resolve&&this._finish(!1),this._open=!0,new Promise(e=>{this._resolve=e,this.updateComplete.then(()=>{let t=this._native;if(t&&!t.open)try{typeof t.showModal=="function"?t.showModal():t.setAttribute("open","")}catch{t.setAttribute("open","")}this.renderRoot.querySelector("[data-autofocus]")?.focus()})})}_finish(e){let t=this._resolve;this._resolve=null,this._open=!1;let r=this._native;r?.open&&(typeof r.close=="function"?r.close():r.removeAttribute("open")),this.dispatchEvent(new CustomEvent(e?"jv-confirm":"jv-cancel",{bubbles:!0,composed:!0})),t?.(e)}_onHaClosed(e){let t=e.detail?.action;this._resolve&&this._finish(t==="confirm")}_onNativeCancel(e){e.preventDefault(),this._finish(!1)}render(){if(!this._open)return m;let e=this.confirmLabel||s("Confirm"),t=this.cancelLabel||s("Cancel");return E("ha-dialog")?l`
        <ha-dialog open .heading=${this.heading} @closed=${this._onHaClosed} scrimClickAction="" escapeKeyAction="cancel">
          ${this.message?l`<p>${this.message}</p>`:m}
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
      `:l`
      <dialog aria-labelledby="h" @cancel=${this._onNativeCancel}>
        <div class="box">
          <h2 id="h">${this.heading}</h2>
          ${this.message?l`<p>${this.message}</p>`:m}
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
    `}disconnectedCallback(){super.disconnectedCallback(),this._resolve&&this._finish(!1),this._haDialog?.close?.()}};_e.styles=[F,R`
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
    `],h([x({type:String})],_e.prototype,"heading",2),h([x({type:String})],_e.prototype,"message",2),h([x({type:String,attribute:"confirm-label"})],_e.prototype,"confirmLabel",2),h([x({type:String,attribute:"cancel-label"})],_e.prototype,"cancelLabel",2),h([x({type:Boolean,reflect:!0})],_e.prototype,"destructive",2),h([$()],_e.prototype,"_open",2),h([Se("dialog")],_e.prototype,"_native",2),h([Se("ha-dialog")],_e.prototype,"_haDialog",2),_e=h([D("jv-confirm")],_e);async function ue(a){let i=document.createElement("jv-confirm");i.heading=a.heading,i.message=a.message??"",i.confirmLabel=a.confirmLabel??"",i.cancelLabel=a.cancelLabel??"",i.destructive=!!a.destructive,document.body.appendChild(i);try{return await i.show()}finally{i.remove()}}var et=class extends I{constructor(){super(...arguments);this.open=!1;this.heading=""}connectedCallback(){super.connectedCallback(),z(this,["ha-dialog"])}updated(e){if(!e.has("open")||E("ha-dialog"))return;let t=this._native;if(t)if(this.open&&!t.open)try{t.showModal()}catch{t.setAttribute("open","")}else!this.open&&t.open&&t.close()}_requestClose(){this.open&&this.dispatchEvent(new CustomEvent("ov-close",{bubbles:!0,composed:!0}))}_onBackdrop(e){e.target===this._native&&this._requestClose()}render(){return this.open?E("ha-dialog")?l`
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
      `:l`
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
    `:m}disconnectedCallback(){super.disconnectedCallback();let e=this._native;e?.open&&e.close()}};et.styles=[F,R`
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
    `],h([x({type:Boolean,reflect:!0})],et.prototype,"open",2),h([x({type:String})],et.prototype,"heading",2),h([Se("dialog")],et.prototype,"_native",2),et=h([D("jarvis-ov-dialog")],et);var ia={sat:"mdi:microphone",spkr:"mdi:speaker",mmwave:"mdi:motion-sensor",cam:"mdi:cctv",light:"mdi:lightbulb",switch:"mdi:toggle-switch",lock:"mdi:lock",climate:"mdi:thermostat",door:"mdi:door",leak:"mdi:water-alert",alarm:"mdi:smoke-detector"},fs={sat:"Satellite",spkr:"Speaker",mmwave:"Presence",cam:"Camera",light:"Lights",switch:"Switch",lock:"Lock",climate:"Climate",door:"Door",leak:"Leak",alarm:"Alarm"};function Jr(a){let i=fs[a];return i?s(i):a}var aa={active:!1,since:0,reason:"",auto:!1,exempt_windows:0};function ei(a){let i=a&&typeof a=="object"?a:{};return{active:!!i.active,since:typeof i.since=="number"?i.since:0,reason:typeof i.reason=="string"?i.reason:"",auto:!!i.auto,arm_mode:typeof i.arm_mode=="string"?i.arm_mode:void 0,exempt_windows:typeof i.exempt_windows=="number"?i.exempt_windows:0}}function ti(a){let i=a??{},e=Array.isArray(i.satellites)?i.satellites:[];return{lightControl:i.light_control_enabled!==!1,autoMode:i.operational_mode_auto!==!1,notifyService:typeof i.notify_service=="string"?i.notify_service:"",satelliteNames:e.map(t=>String(t?.name||t?.entity_id||"")).filter(Boolean)}}function ri(a){return!a||typeof a.active!="string"||!Array.isArray(a.available)?null:{active:a.active,since:typeof a.since=="number"?a.since:0,reason:typeof a.reason=="string"?a.reason:"",description:typeof a.description=="string"?a.description:"",available:a.available.map(i=>typeof i=="string"?{name:i,description:""}:i).filter(i=>i&&typeof i.name=="string")}}function me(a){if(a==null)return null;let i=String(a).trim();return!i||i==="—"?null:i}function fr(a){return a&&a.charAt(0).toUpperCase()+a.slice(1)}function ii(a,i=Date.now()){if(!a||!Number.isFinite(a))return"";let e=Math.max(0,Math.floor(i/1e3-a));return e<60?`${e}s`:e<3600?`${Math.floor(e/60)}m`:e<86400?`${Math.floor(e/3600)}h`:`${Math.floor(e/86400)}d`}function Ve(a){return a instanceof Q?a.code==="unauthorized"?s("Administrator privileges are required for this action"):a.message||a.code:a&&typeof a=="object"&&"message"in a?String(a.message):String(a??"")}function ce(a,i){a.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:i},bubbles:!0,composed:!0}))}function Wt(a,i=0){let e=()=>a.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}));i>0?setTimeout(e,i):e()}var gs=/^(\d+) READY$/,bs=/^(\d+) \/ (\d+)$/;function jt(a){return a==="live"?"ok":a==="warn"?"warn":"off"}function na(a,i,e){let t=a.status??{},r=[],n=(f,b,j,g,y="")=>r.push({key:f,label:b,value:j,level:g,secondary:y}),o=t.sleep;if(o){let f=o.state==="AWAKE"?s("Awake"):o.state==="ASLEEP"?s("Asleep"):o.state;n("sleep",s("Sleep"),f,jt(o.level),o.state==="ASLEEP"&&a.sleep_reason||"")}let c=t.observer;if(c){let f={RUNNING:s("Running"),READY:s("Ready"),DISABLED:s("Disabled")};n("observer",s("Observer"),f[c.state]??c.state,jt(c.level))}let d=t.llm_providers;if(d){let f=gs.exec(d.state),b=f?s("{n} ready",{n:f[1]}):d.state==="UNSET"?s("Not set"):d.state;n("llm",s("LLM Providers"),b,jt(d.level))}n("lockdown",s("Lockdown"),i.active?s("Engaged"):s("Off"),i.active?"danger":"off",i.active?i.reason:"");let u=t.satellites;if(u){let f=bs.exec(u.state),b=f?s("{a} / {b} online",{a:f[1],b:f[2]}):u.state==="NONE"?s("None"):u.state,j=e.satelliteNames,g=j.length?j.slice(0,3).join(", ")+(j.length>3?` +${j.length-3}`:""):"";n("satellites",s("Satellites"),b,jt(u.level),g)}let p=t.notify;if(p){let f=p.state==="READY"?e.notifyService||s("Ready"):p.state==="UNSET"?s("Not set"):p.state;n("notify",s("Notify target"),f,jt(p.level))}let v=t.broadcast;if(v){let f=v.state==="ONLINE"?s("Online"):v.state==="UNSET"?s("Not set"):v.state;n("broadcast",s("Broadcast"),f,jt(v.level))}return r}var sa=new Set(["light","lock","cover","climate","sensor","binary_sensor","person","device_tracker","alarm_control_panel"]);var _s=5,oa=500,Ee=class extends I{constructor(){super(...arguments);this.areas=[];this.lightControl=!0;this._expandedId=null;this._lights=null;this._allOffBusy=!1}connectedCallback(){super.connectedCallback(),z(this,["ha-icon"])}willUpdate(e){e.has("areas")&&(this._expandedId&&!this._find(this._expandedId)&&(this._expandedId=null),this._lights&&!this._find(this._lights.areaId)&&(this._lights=null)),e.has("lightControl")&&!this.lightControl&&(this._lights=null)}openArea(e){this._find(e)&&(this._expandedId=e)}_find(e){return this.areas.find(t=>t.id===e)}_icon(e,t){return E("ha-icon")?l`<ha-icon .icon=${e} .title=${t} aria-label=${t} role="img"></ha-icon>`:l`<span aria-label=${t} title=${t}>${t}</span>`}async _openLights(e){if(this.lightControl){this._lights={areaId:e.id,name:e.name,loading:!0,items:[]};try{let t=await Z(this.hass,"jarvis/area_lights",{area_id:e.id});if(this._lights?.areaId!==e.id)return;this._lights={areaId:e.id,name:t?.name||e.name,loading:!1,items:Array.isArray(t?.lights)?t.lights:[]}}catch(t){if(this._lights?.areaId!==e.id)return;this._lights={...this._lights,loading:!1,items:[]},ce(this,`${s("Couldn't load lights —")} ${Ve(t)}`)}}}_callService(e,t,r,n){let o=this.hass;return!o||typeof o.callService!="function"?Promise.reject(new Error(s("Home Assistant connection not available"))):o.callService(e,t,r,n)}_setLight(e,t){this._lights&&(this._lights={...this._lights,items:this._lights.items.map(r=>r.entity_id===e?{...r,on:t}:r)})}async _toggleLight(e){let t=this._lights?.areaId;this._setLight(e.entity_id,!e.on);try{await this._callService("light",e.on?"turn_off":"turn_on",{entity_id:e.entity_id}),Wt(this,oa)}catch(r){this._lights?.areaId===t&&this._setLight(e.entity_id,e.on),ce(this,`${s("Light failed —")} ${Ve(r)}`)}}async _allOff(){let e=this._lights;if(!(!e||this._allOffBusy)){this._allOffBusy=!0;try{await this._callService("light","turn_off",{},{area_id:e.areaId}),this._lights?.areaId===e.areaId&&(this._lights={...this._lights,items:this._lights.items.map(t=>({...t,on:!1}))}),ce(this,s("{name} lights off",{name:e.name})),this._lights=null,Wt(this,oa)}catch(t){ce(this,`${e.name} ${s("lights")} — ${Ve(t)}`)}finally{this._allOffBusy=!1}}}_pill(e,t=!1){let r=e.lights_on>0,n=`${e.lights_on}/${e.lights_total} ${s("lights on")}`,o=`pill ${r?"lit":""} ${t?"inline":""}`,c=E("ha-icon")?l`<ha-icon icon="mdi:lightbulb" aria-hidden="true"></ha-icon>`:m;if(!this.lightControl)return l`<span class=${o} title=${n} aria-label=${n}>${c}${e.lights_on}/${e.lights_total}</span>`;let d=`${n} ${s("— tap to toggle")}`;return l`
      <button
        type="button"
        class=${o}
        title=${d}
        aria-label=${d}
        @click=${u=>{u.stopPropagation(),this._openLights(e)}}
      >
        ${c}${e.lights_on}/${e.lights_total}
      </button>
    `}_tile(e){let t=e.caps??[],r=t.slice(0,_s),n=t.length-r.length,o=me(e.temp),c=me(e.humidity),d=[s("{name} details",{name:e.name}),e.active?s("Occupied"):s("Vacant"),e.bedroom?s("Bedroom"):"",o??"",c??""].filter(Boolean).join(", ");return l`
      <div class="tile ${e.active?"active":""}">
        <button
          type="button"
          class="open"
          aria-label=${d}
          @click=${()=>{this._expandedId=e.id}}
        >
          <div class="caps" aria-hidden="true">
            ${r.map(u=>l`<span class="cap">${this._icon(ia[u]??"mdi:help-circle-outline",Jr(u))}</span>`)}
            ${n>0?l`<span class="cap">+${n}</span>`:m}
          </div>
          ${o||c?l`<div class="readings">${o?l`<span>${o}</span>`:m}${c?l`<span>${c}</span>`:m}</div>`:m}
          <div class="foot">
            <span class="dot ${e.active?"on jv-pulse":""}" aria-hidden="true"></span>
            <span class="name">${e.name}</span>
            ${e.bedroom&&E("ha-icon")?l`<span class="bed">${this._icon("mdi:bed",s("Bedroom"))}</span>`:m}
          </div>
        </button>
        ${e.lights_total>0?this._pill(e):m}
      </div>
    `}_detail(){let e=this._expandedId?this._find(this._expandedId):void 0,t=()=>{this._expandedId=null};return l`
      <jarvis-ov-dialog .open=${!!e} .heading=${e?.name??""} @ov-close=${t}>
        ${e?l`
              <div class="chips">
                <jv-state-badge
                  level=${e.active?"ok":"neutral"}
                  ?pulse=${e.active}
                  .label=${e.active?s("Occupied"):s("Vacant")}
                ></jv-state-badge>
                ${e.bedroom?l`<jv-state-badge level="info" nodot .label=${s("Bedroom")}></jv-state-badge>`:m}
              </div>
              ${me(e.temp)?l`<jv-kv .label=${s("Temperature")} .value=${e.temp??""}></jv-kv>`:m}
              ${me(e.humidity)?l`<jv-kv .label=${s("Humidity")} .value=${e.humidity??""}></jv-kv>`:m}
              ${e.lights_total>0?l`<jv-kv .label=${s("Lights")}>${this._pill(e,!0)}</jv-kv>`:m}
              ${me(e.last_motion)?l`<jv-kv .label=${s("Last motion")} .value=${e.last_motion??""}></jv-kv>`:m}
              <jv-kv .label=${s("Capabilities")} .value=${(e.caps??[]).map(Jr).join(", ")||"—"}></jv-kv>
            `:m}
        <button slot="actions" type="button" class="jv-btn" @click=${t}>${s("Close")}</button>
      </jarvis-ov-dialog>
    `}_lightsDialog(){let e=this._lights,t=()=>{this._lights=null},r=!!e?.items.some(n=>n.on);return l`
      <jarvis-ov-dialog .open=${!!e} .heading=${e?.name??""} @ov-close=${t}>
        ${e?e.loading?l`<p class="msg" role="status" aria-live="polite">${s("Loading lights…")}</p>`:e.items.length===0?l`<p class="msg">${s("No controllable lights in this room.")}</p>`:l`
                  <ul class="lights">
                    ${e.items.map(n=>l`
                        <li>
                          <button type="button" aria-pressed=${n.on?"true":"false"} @click=${()=>{this._toggleLight(n)}}>
                            <span class="dot ${n.on?"on":""}" aria-hidden="true"></span>
                            <span class="jv-truncate" title=${n.entity_id}>${n.name}</span>
                            <span class="state">${n.on?s("On"):s("Off")}</span>
                          </button>
                        </li>
                      `)}
                  </ul>
                `:m}
        <button slot="actions" type="button" class="jv-btn" ?disabled=${!r||this._allOffBusy} @click=${()=>{this._allOff()}}>
          ${s("Turn all off")}
        </button>
        <button slot="actions" type="button" class="jv-btn" @click=${t}>${s("Close")}</button>
      </jarvis-ov-dialog>
    `}render(){return l`
      <div class="grid" role="list">
        ${this.areas.map(e=>l`<div role="listitem">${this._tile(e)}</div>`)}
      </div>
      ${this._detail()} ${this._lightsDialog()}
    `}};Ee.styles=[F,R`
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
    `],h([x({attribute:!1})],Ee.prototype,"hass",2),h([x({attribute:!1})],Ee.prototype,"areas",2),h([x({type:Boolean})],Ee.prototype,"lightControl",2),h([$()],Ee.prototype,"_expandedId",2),h([$()],Ee.prototype,"_lights",2),h([$()],Ee.prototype,"_allOffBusy",2),Ee=h([D("jarvis-ov-areas")],Ee);var la=R`
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
`;var ys=2e3,ws=500,js=["ha-icon","ha-switch","ha-formfield","ha-card","ha-dialog"],je=class extends te{constructor(){super(...arguments);this._mode=null;this._modeError=!1;this._lockdown=aa;this._auto=!0;this._cfg=ti(null);this._busy=new Set;this._modeInFlight=null;this._unsub=null}connectedCallback(){super.connectedCallback(),z(this,js),this._subscribe()}disconnectedCallback(){super.disconnectedCallback(),this._nudgeTimer&&clearTimeout(this._nudgeTimer),this._nudgeTimer=void 0;let e=this._unsub;this._unsub=null,e?.then(t=>t?.()).catch(()=>{})}willUpdate(e){e.has("data")&&this.data&&(this._lockdown=ei(this.data.lockdown),this._cfg=ti(this.data.config),this._auto=this._cfg.autoMode,this._fetchMode()),e.has("hass")&&this.hass&&(this._subscribe(),!this._mode&&!this._modeError&&this._fetchMode())}_subscribe(){if(this._unsub||!this.isConnected)return;let e=this.hass?.connection;e?.subscribeEvents&&(this._unsub=e.subscribeEvents(t=>this._onStateChanged(t),"state_changed").catch(()=>{this._unsub=null}))}_onStateChanged(e){let t=e?.data?.entity_id;!t||!sa.has(t.split(".")[0])||this._nudgeTimer||document.visibilityState!=="visible"||(this._nudgeTimer=setTimeout(()=>{this._nudgeTimer=void 0,this.isConnected&&this.refresh()},ys))}_fetchMode(){return this.hass?this._modeInFlight?this._modeInFlight:(this._modeInFlight=(async()=>{try{let e=await this.ws("jarvis/mode",{action:"status"}),t=ri(e);this._modeError=!t,t&&(this._mode=t)}catch{this._modeError=!0}finally{this._modeInFlight=null}})(),this._modeInFlight):Promise.resolve()}_setBusy(e,t){let r=new Set(this._busy);t?r.add(e):r.delete(e),this._busy=r}async _onLockToggle(e){let t=e.target,r=!!t.checked,n=this._lockdown.active;if(!(r===n||this._busy.has("lock"))){if(r&&!await ue({heading:s("Engage lockdown?"),message:s("JARVIS will lock every lock and close every open door. Windows already open are left as they are."),confirmLabel:s("Engage"),cancelLabel:s("Cancel"),destructive:!0})){t.checked=n;return}this._setBusy("lock",!0);try{let o=await this.ws("jarvis/set_lockdown",{on:r});this._lockdown=o?.lockdown?ei(o.lockdown):{...this._lockdown,active:r},o?.ok===!1?ce(this,s("Lockdown request was not accepted")):ce(this,r?s("Lockdown engaged"):s("Lockdown lifted")),this.refresh()}catch(o){ce(this,`${s("Lockdown failed —")} ${Ve(o)}`)}finally{this._setBusy("lock",!1),t.checked=this._lockdown.active}}}async _setMode(e){if(!(this._busy.has("mode")||e===this._mode?.active)){this._setBusy("mode",!0);try{let t=await this.ws("jarvis/mode",{action:"set",mode:e,reason:"requested from panel"});if(t?.ok===!1){ce(this,`${s("Mode change failed —")} ${t.error||""}`.trim());return}let r=ri(t);r&&(this._mode=r),ce(this,s("{mode} mode",{mode:fr(t?.mode||r?.active||e)})),this.refresh()}catch(t){ce(this,`${s("Mode change failed —")} ${Ve(t)}`)}finally{this._setBusy("mode",!1)}}}async _onAutoToggle(e){let t=e.target,r=!!t.checked;if(!(r===this._auto||this._busy.has("auto"))){this._setBusy("auto",!0);try{let n=await this.ws("jarvis/update_config",{key:"operational_mode_auto",value:r});this._auto=typeof n?.value=="boolean"?n.value:r,ce(this,this._auto?s("Automatic mode on"):s("Automatic mode off")),this.refresh()}catch(n){ce(this,`${s("Couldn't save —")} ${Ve(n)}`)}finally{this._setBusy("auto",!1),t.checked=this._auto}}}async _service(e,t,r,n,o){if(this._busy.has(e))return;let c=this.hass;this._setBusy(e,!0);try{if(!c||typeof c.callService!="function")throw new Error(s("Home Assistant connection not available"));await c.callService("jarvis",t,r),ce(this,n),Wt(this,ws)}catch(d){ce(this,`${o} ${Ve(d)}`)}finally{this._setBusy(e,!1)}}_icon(e){return E("ha-icon")?l`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:m}_switch(e){if(E("ha-switch")){let t=l`
        <ha-switch
          .checked=${e.checked}
          .disabled=${e.disabled}
          aria-label=${e.label}
          title=${e.title??m}
          @change=${e.onChange}
        ></ha-switch>
      `;return!e.hideLabel&&E("ha-formfield")?l`<ha-formfield .label=${e.label}>${t}</ha-formfield>`:t}return l`
      <label class="switch" title=${e.title??m}>
        <input
          type="checkbox"
          role="switch"
          aria-label=${e.label}
          .checked=${e.checked}
          ?disabled=${e.disabled}
          @change=${e.onChange}
        />
        ${e.hideLabel?m:l`<span>${e.label}</span>`}
      </label>
    `}_renderLockbar(e){let t=this._lockdown,r=[];return t.active&&t.since&&r.push(s("since {time}",{time:ii(t.since)})),t.active&&t.auto&&r.push(s("engaged automatically (alarm armed)")),t.active&&t.reason&&r.push(t.reason),l`
      <div class="lockbar ${t.active?"on":""}" aria-live="polite">
        ${this._icon(t.active?"mdi:shield-lock":"mdi:shield-lock-open-outline")}
        <div class="text">
          <span>${s("Lockdown")}: <strong>${t.active?s("Engaged"):s("Off")}</strong></span>
          ${r.length?l`<span class="sub">${r.join(" · ")}</span>`:m}
        </div>
        ${this._switch({checked:t.active,disabled:!e||this._busy.has("lock"),label:s("Lockdown"),hideLabel:!0,title:t.active?s("Lockdown engaged — tap to lift"):s("Tap to engage lockdown"),onChange:n=>{this._onLockToggle(n)}})}
      </div>
    `}_renderStatus(e){let t=na(e,this._lockdown,this._cfg),r=e.meta??{},n=[`${s("Bedrooms")} ${r.bedrooms??"—"}`,`${s("Areas Monitored")} ${r.areas_monitored??e.areas?.length??"—"}`,`${s("Announcements Today")} ${r.announcements_today??"—"}`,`${s("Uptime")} ${me(r.uptime)??"—"}`,`v${e.version??"?"}`];return me(r.est_cost)&&n.push(`${s("Est. cost")} ${r.est_cost}`),l`
      <jv-section .heading=${s("System Status")} icon="mdi:heart-pulse">
        <div class="tiles" aria-live="polite">
          ${t.map(o=>l`
              <div class="tile" data-key=${o.key}>
                <span class="dot" data-level=${o.level} aria-hidden="true"></span>
                <div>
                  <div class="label">${o.label}</div>
                  <div class="value ${o.key==="notify"?"jv-mono small":""}">${o.value}</div>
                  ${o.secondary?l`<div class="sec">${o.secondary}</div>`:m}
                </div>
              </div>
            `)}
        </div>
        <p class="meta">${n.join(" · ")}</p>
      </jv-section>
    `}_renderMode(){let e=this._mode,t=this._busy.has("mode"),r=e?.since?ii(e.since):"",n=[r?s("since {time}",{time:r}):"",e?.reason??""].filter(Boolean);return l`
      <jv-section .heading=${s("Operational Mode")} icon="mdi:tune-variant">
        ${e?l`<jv-state-badge slot="actions" level="accent" nodot .label=${fr(e.active)}></jv-state-badge>`:m}
        ${this._modeError?l`<p class="desc">${s("Couldn't load modes — restart Home Assistant after updating.")}</p>`:e?l`
                ${e.description?l`<p class="desc">${e.description}</p>`:m}
                ${n.length?l`<p class="desc">${n.join(" · ")}</p>`:m}
                <div class="chips" role="group" aria-label=${s("Mode")}>
                  ${e.available.map(o=>l`
                      <button
                        type="button"
                        class="chip jv-hit"
                        aria-pressed=${o.name===e.active?"true":"false"}
                        title=${o.description||m}
                        ?disabled=${t}
                        @click=${()=>{this._setMode(o.name)}}
                      >
                        ${fr(o.name)}
                      </button>
                    `)}
                </div>
              `:l`<jv-empty kind="loading" compact .message=${s("Loading...")}></jv-empty>`}
        <div class="toggle-row">
          <div>
            <div>${s("Follow occupancy automatically")}</div>
            <p class="help">
              ${s("Switches between Away and Normal as the home empties and fills. Party, Movie, Lab, Guest and Focus are always manual.")}
            </p>
          </div>
          ${this._switch({checked:this._auto,disabled:this._busy.has("auto"),label:s("Follow occupancy automatically"),hideLabel:!0,onChange:o=>{this._onAutoToggle(o)}})}
        </div>
      </jv-section>
    `}_renderNow(e){let t=e.dominant,r=!t||t.area_id===null||t.area_id===void 0,n=t?r?t.name==="AWAY"?s("Nobody home"):t.name==="AT HOME"?s("Someone is home"):t.name:t.name:"—",o=t?t.subtitle==="no presence detected"?s("No presence detected"):t.subtitle:"",c=[[s("Temperature"),me(t?.temp)??"—"],[s("Humidity"),me(t?.humidity)??"—"],[s("Lights"),me(t?.lights)??"—"],[s("Last motion"),me(t?.last_motion)??"—"]];me(t?.satellite)&&c.push([s("Satellite"),t.satellite]);let d=l`
      <div class="big">${n}</div>
      ${o?l`<div class="jv-muted">${o}</div>`:m}
      <div class="stats">
        ${c.map(([u,p])=>l`<div><div class="k">${u}</div><div class="v">${p}</div></div>`)}
      </div>
    `;return l`
      <jv-section .heading=${s("Right now")} icon="mdi:map-marker-radius-outline">
        ${r?l`<div class="now">${d}</div>`:l`
              <button
                type="button"
                class="now"
                aria-label=${s("{name} details",{name:n})}
                @click=${()=>this._areasEl?.openArea(t.area_id)}
              >
                ${d}
              </button>
            `}
      </jv-section>
    `}_renderActions(e){let t=e.status?.sleep?.state==="ASLEEP"&&(e.sleep_reason||"").startsWith("manual nap"),r=n=>s("Mute JARVIS's non-critical announcements for {n} minutes. Does not change lights, covers or locks. Safety alerts still come through.",{n});return l`
      <jv-section .heading=${s("Quick Actions")} icon="mdi:gesture-tap-button">
        <div class="actions">
          <button type="button" class="jv-btn" title=${r(30)} ?disabled=${this._busy.has("nap30")}
            @click=${()=>{this._service("nap30","nap",{duration_minutes:30},s("Napping for 30 minutes"),s("Nap failed —"))}}>
            ${this._icon("mdi:sleep")} ${s("Nap 30 min")}
          </button>
          <button type="button" class="jv-btn" title=${r(60)} ?disabled=${this._busy.has("nap60")}
            @click=${()=>{this._service("nap60","nap",{duration_minutes:60},s("Napping for 60 minutes"),s("Nap failed —"))}}>
            ${this._icon("mdi:sleep")} ${s("Nap 60 min")}
          </button>
          <button type="button" class="jv-btn" title=${s("Cancel any active nap or shush and resume normal announcements.")}
            ?disabled=${this._busy.has("unshush")}
            @click=${()=>{this._service("unshush","unshush",{},s("Announcements resumed"),s("Unshush failed —"))}}>
            ${this._icon("mdi:volume-high")} ${s("Unshush All")}
          </button>
        </div>
        ${t?l`<p class="nap" role="status">${e.sleep_reason}</p>`:m}
      </jv-section>
    `}_renderAreas(e){let t=Array.isArray(e.areas)?e.areas:[],r=t.filter(n=>n.active).length;return l`
      <jv-section
        class="jv-span-all"
        .heading=${s("Areas")}
        icon="mdi:floor-plan"
        .subheading=${t.length?s("{occupied} occupied · {total}",{occupied:r,total:t.length}):""}
      >
        ${t.length===0?l`<jv-empty compact icon="mdi:home-search-outline" .heading=${s("No areas yet")}
              .message=${s("No areas with JARVIS-relevant devices yet. Assign satellites, speakers, presence sensors or lights to Home Assistant areas.")}></jv-empty>`:l`<jarvis-ov-areas .hass=${this.hass} .areas=${t} .lightControl=${this._cfg.lightControl}></jarvis-ov-areas>`}
      </jv-section>
    `}_renderSkeleton(){let e=l`<div class="sk" role="status" aria-label=${s("Loading...")}>
      <div class="jv-skeleton"></div><div class="jv-skeleton"></div><div class="jv-skeleton"></div>
    </div>`;return l`
      <div class="jv-grid">
        <jv-section .heading=${s("System Status")} loading>${e}</jv-section>
        <jv-section .heading=${s("Operational Mode")} loading>${e}</jv-section>
        <jv-section .heading=${s("Right now")} loading>${e}</jv-section>
        <jv-section class="jv-span-all" .heading=${s("Areas")} loading>${e}</jv-section>
      </div>
    `}render(){let e=this.data;return l`
      <div class=${this.narrow?"narrow":""}>
        ${this._renderLockbar(!!e)}
        ${e?l`
              <div class="jv-grid">
                ${this._renderStatus(e)} ${this._renderMode()} ${this._renderNow(e)} ${this._renderActions(e)} ${this._renderAreas(e)}
              </div>
            `:this._renderSkeleton()}
      </div>
    `}};je.styles=[F,la],h([$()],je.prototype,"_mode",2),h([$()],je.prototype,"_modeError",2),h([$()],je.prototype,"_lockdown",2),h([$()],je.prototype,"_auto",2),h([$()],je.prototype,"_cfg",2),h([$()],je.prototype,"_busy",2),h([Se("jarvis-ov-areas")],je.prototype,"_areasEl",2),je=h([D("jarvis-view-overview")],je);var he=class extends I{constructor(){super(...arguments);this.path="";this.caption="";this.alt="";this.variant="hero";this._src="";this._failed=!1;this._open=!1;this._openSrc="";this._signedFor="";this._seq=0}connectedCallback(){super.connectedCallback(),z(this,["ha-dialog","ha-icon","ha-icon-button"]),this._unsubLang=wt(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),this._unsubLang?.(),this._unsubLang=void 0,this._open=!1}willUpdate(e){if(e.has("path")&&!this.path){this._seq++,this._signedFor="",this._src="",this._failed=!1;return}(e.has("path")||e.has("hass"))&&this.hass&&this.path&&this.path!==this._signedFor&&this._sign()}updated(){if(this._open&&!E("ha-dialog")){let e=this._native;if(e&&!e.open)try{e.showModal()}catch{e.setAttribute("open","")}}}async _sign(){let e=this.path,t=++this._seq;if(this._signedFor=e,this._failed=!1,this._src="",!e||!this.hass)return;let r=await Yr(this.hass,e);t===this._seq&&(this._src=r)}_onError(){this._failed=!0,this._open=!1}async _openFull(){if(!this._src||this._failed)return;let e=this.hass?await Yr(this.hass,this.path):this._src;this._openSrc=e||this._src,this._open=!0}_close(){this._open=!1;let e=this._native;e?.open&&e.close()}_renderDialog(){if(!this._open||!this._openSrc)return m;let e=this.caption||s("Intrusion snapshot"),t=l`<img class="full" src=${this._openSrc} alt=${this.alt||s("Intrusion snapshot")} @error=${this._onError} />`;return E("ha-dialog")?l`
        <ha-dialog open hideActions .heading=${e} @closed=${this._close} escapeKeyAction="close" scrimClickAction="close">
          ${t}
        </ha-dialog>
      `:l`
      <dialog
        aria-labelledby="snap-h"
        @cancel=${r=>{r.preventDefault(),this._close()}}
        @click=${r=>{r.target===this._native&&this._close()}}
      >
        <div class="dlg-head">
          <h2 id="snap-h">${e}</h2>
          <button class="jv-icon-btn" type="button" aria-label=${s("Close")} @click=${this._close}>
            ${E("ha-icon")?l`<ha-icon icon="mdi:close" aria-hidden="true"></ha-icon>`:l`<span aria-hidden="true">×</span>`}
          </button>
        </div>
        ${t}
      </dialog>
    `}render(){if(!this.path)return m;if(this._failed)return l`<p class="gone">
        ${E("ha-icon")?l`<ha-icon icon="mdi:image-off-outline" aria-hidden="true"></ha-icon>`:m}
        <span>${s("Snapshot no longer available")}</span>
      </p>`;let e=this.alt||s("Intrusion snapshot");return l`
      <button
        class="frame"
        type="button"
        aria-label=${s("Open snapshot")}
        ?disabled=${!this._src}
        @click=${()=>{this._openFull()}}
      >
        ${this._src?l`<img src=${this._src} alt=${e} loading="lazy" @error=${this._onError} />`:l`<div class="jv-skeleton skeleton" role="img" aria-label=${s("Loading...")}></div>`}
      </button>
      ${this.caption?l`<p class="caption">${this.caption}</p>`:m}
      ${this._renderDialog()}
    `}};he.styles=[F,R`
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
    `],h([x({attribute:!1})],he.prototype,"hass",2),h([x({type:String})],he.prototype,"path",2),h([x({type:String})],he.prototype,"caption",2),h([x({type:String})],he.prototype,"alt",2),h([x({type:String,reflect:!0})],he.prototype,"variant",2),h([$()],he.prototype,"_src",2),h([$()],he.prototype,"_failed",2),h([$()],he.prototype,"_open",2),h([$()],he.prototype,"_openSrc",2),h([Se("dialog")],he.prototype,"_native",2),he=h([D("jv-intrusion-snapshot")],he);var ai={events:0,labeled:0,patterns:{},damped_patterns:[],min_false_to_damp:3},ca=[{value:60,label:"1 min"},{value:120,label:"2 min"},{value:180,label:"3 min"},{value:300,label:"5 min"},{value:600,label:"10 min"}];function gr(a){return!a||typeof a!="object"?ai:{events:Number(a.events)||0,labeled:Number(a.labeled)||0,patterns:a.patterns&&typeof a.patterns=="object"?a.patterns:{},damped_patterns:Array.isArray(a.damped_patterns)?a.damped_patterns:[],min_false_to_damp:Number(a.min_false_to_damp)||3}}function br(a,i){if(!i)return"";let e=a?.states?.[i]?.attributes?.friendly_name;return typeof e=="string"&&e.trim()?e:i.replace(/^camera\./,"").replace(/_/g," ")}function $s(a){let i=a?.locale?.language||a?.language;return typeof i=="string"&&i?i:void 0}function $t(a,i){let e=Number(i)*1e3;if(!Number.isFinite(e)||e<=0)return"";try{return new Intl.DateTimeFormat($s(a),{dateStyle:"medium",timeStyle:"short"}).format(new Date(e))}catch{return new Date(e).toISOString()}}function da(a,i=Date.now()){let e=Number(a)*1e3;if(!Number.isFinite(e)||e<=0)return"";let t=Math.max(0,Math.round((i-e)/1e3));if(t<60)return s("just now");let r=Math.round(t/60);if(r<60)return s("{n} min ago",{n:r});let n=Math.round(r/60);return n<48?s("{n} h ago",{n}):s("{n} d ago",{n:Math.round(n/24)})}function ua(a){switch(a){case"confirmed":return"danger";case"unresolved":return"warn";case"investigating":return"info";case"false_alarm":return"neutral";default:return"neutral"}}function ha(a){switch(a){case"confirmed":return s("CONFIRMED");case"unresolved":return s("UNRESOLVED");case"investigating":return s("INVESTIGATING");case"false_alarm":return s("FALSE ALARM");default:return String(a||"").replace(/_/g," ").toUpperCase()}}function tt(a,i){a.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:i},bubbles:!0,composed:!0}))}function Ye(a){if(a&&typeof a=="object"&&"message"in a){let i=a.message;if(typeof i=="string"&&i)return i}return String(a??s("Unknown error"))}var xs=40,pa=200,$e=class extends I{constructor(){super(...arguments);this._events=null;this._learning=ai;this._loading=!1;this._error=null;this._limit=xs;this._pending=new Set;this._loaded=!1}connectedCallback(){super.connectedCallback(),z(this,["ha-icon","ha-icon-button"]),this._unsubLang=wt(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),this._unsubLang?.(),this._unsubLang=void 0}updated(e){e.has("hass")&&this.hass&&!this._loaded&&(this._loaded=!0,this.load())}async load(e=this._limit){if(!this._loading){this._loading=!0,this._error=null,this._limit=e;try{let t=await Z(this.hass,"jarvis/intrusion",{action:"log",limit:e}),r=Array.isArray(t?.events)?t.events:[];this._events=r,this._learning=gr(t?.learning),this.dispatchEvent(new CustomEvent("jv-intrusion-log",{detail:{events:r,learning:this._learning},bubbles:!0,composed:!0}))}catch(t){this._error=Ye(t)}finally{this._loading=!1}}}async _label(e,t){if(!this._pending.has(e.id)&&!(t===""&&e.label==null||t!==""&&e.label===t)){this._pending=new Set([...this._pending,e.id]);try{let r=await Z(this.hass,"jarvis/intrusion",{action:"label",event_id:e.id,label:t});if(r&&r.ok===!1){tt(this,r.error||s("Could not save the label")),r.learning&&(this._learning=gr(r.learning)),this.load();return}let n=r&&"label"in r&&(r.label==="real"||r.label==="false"||r.label===null)?r.label:t===""?null:t;this._events=(this._events??[]).map(o=>o.id===e.id?{...o,label:n,labeled_ts:Date.now()/1e3}:o),r?.learning?this._learning=gr(r.learning):this._learning={...this._learning,labeled:this._events.filter(o=>o.label).length}}catch(r){tt(this,Ye(r))}finally{let r=new Set(this._pending);r.delete(e.id),this._pending=r}}}_renderRefresh(){let e=s("Refresh");return E("ha-icon-button")?l`
        <ha-icon-button slot="actions" .label=${e} ?disabled=${this._loading} @click=${()=>{this.load()}}>
          ${E("ha-icon")?l`<ha-icon icon="mdi:refresh"></ha-icon>`:m}
        </ha-icon-button>
      `:l`
      <button slot="actions" class="jv-icon-btn" type="button" aria-label=${e} ?disabled=${this._loading} @click=${()=>{this.load()}}>
        ${E("ha-icon")?l`<ha-icon icon="mdi:refresh"></ha-icon>`:l`<span aria-hidden="true">↻</span>`}
      </button>
    `}_renderEvent(e){let t=this._pending.has(e.id),r=br(this.hass,e.camera),n=e.breach||r||s("activity"),o=$t(this.hass,e.ts),c=[];return Array.isArray(e.zones)&&e.zones.length&&c.push(e.zones.join(", ")),e.max_depth!=null&&Number.isFinite(Number(e.max_depth))&&c.push(s("depth {n}",{n:e.max_depth})),l`
      <li>
        <div class="meta">
          <jv-state-badge level=${ua(e.kind)} .label=${ha(e.kind)}></jv-state-badge>
          <time class="time" datetime=${new Date(Number(e.ts)*1e3).toISOString()} title=${o}>${da(e.ts)}</time>
        </div>
        ${e.snapshot_url?l`<jv-intrusion-snapshot
              class="thumb"
              variant="thumb"
              .hass=${this.hass}
              .path=${e.snapshot_url}
              .alt=${s("Intrusion snapshot")}
              .caption=${""}
            ></jv-intrusion-snapshot>`:m}
        <div>
          <p class="what">${n}${e.reason?l` — <span class="jv-muted">${e.reason}</span>`:m}</p>
          ${c.length?l`<p class="extra">${c.join(" · ")}</p>`:m}
        </div>
        <div class="labels" role="group" aria-label=${s("Label this event")}>
          <span class="seg">
            <button
              class="jv-btn real"
              type="button"
              aria-pressed=${e.label==="real"?"true":"false"}
              ?disabled=${t}
              @click=${()=>{this._label(e,"real")}}
            >
              ${s("REAL")}
            </button>
            <button
              class="jv-btn"
              type="button"
              aria-pressed=${e.label==="false"?"true":"false"}
              ?disabled=${t}
              @click=${()=>{this._label(e,"false")}}
            >
              ${s("FALSE ALARM")}
            </button>
          </span>
          ${e.label?l`<button class="jv-btn text" type="button" ?disabled=${t} @click=${()=>{this._label(e,"")}}>
                ${s("Clear label")}
              </button>`:m}
          ${e.labeled_ts&&e.label?l`<span class="labelled">${s("labelled {time}",{time:$t(this.hass,e.labeled_ts)})}</span>`:m}
        </div>
      </li>
    `}_renderBody(){if(this._events===null)return this._error?l`
          <jv-empty compact kind="error" icon="mdi:alert-circle-outline" .heading=${s("Could not load the log.")} .message=${this._error}>
            <button slot="action" class="jv-btn" type="button" @click=${()=>{this.load()}}>${s("Retry")}</button>
          </jv-empty>
        `:l`
        <div role="status" aria-live="polite" aria-label=${s("Loading...")}>
          ${[0,1,2].map(()=>l`<div class="skeleton-row"><div class="jv-skeleton"></div><div class="jv-skeleton"></div></div>`)}
        </div>
      `;if(!this._events.length)return l`<jv-empty compact icon="mdi:shield-check-outline" .message=${s("No intrusion events recorded yet.")}></jv-empty>`;let e=this._events.length>=this._limit&&this._limit<pa;return l`
      ${this._error?l`<div class="banner" role="alert">${s("Could not load the log.")} ${this._error}</div>`:m}
      <ul>
        ${this._events.map(t=>this._renderEvent(t))}
      </ul>
      ${e?l`<div class="more">
            <button class="jv-btn text" type="button" ?disabled=${this._loading} @click=${()=>{this.load(pa)}}>
              ${s("Show more")}
            </button>
          </div>`:m}
    `}render(){let e=this._learning,t=this._events===null?this._error?"":"…":`${e.labeled}/${e.events} ${s("LABELLED")}`,r=e.damped_patterns.length;return l`
      <jv-section .heading=${s("Intrusion Log")} icon="mdi:format-list-bulleted-type" ?loading=${this._loading&&this._events!==null}>
        ${t?l`<span slot="actions" class="count" aria-live="polite">${t}</span>`:m}
        ${this._renderRefresh()}
        <p class="intro">
          ${s("Every intrusion event with its snapshot. Mark each one real or false alarm — JARVIS learns from your labels and stops firing the low-confidence alerts for patterns you keep calling false. A confirmed intrusion always alerts, no matter what it has learned.")}
        </p>
        ${r>0?l`<div class="banner" role="status">
              ${E("ha-icon")?l`<ha-icon icon="mdi:school-outline" aria-hidden="true"></ha-icon>`:m}
              <span>
                ${r===1?s("JARVIS has learned {n} benign pattern — low-confidence alerts for these stay quiet.",{n:r}):s("JARVIS has learned {n} benign patterns — low-confidence alerts for these stay quiet.",{n:r})}
              </span>
            </div>`:m}
        ${this._renderBody()}
      </jv-section>
    `}};$e.styles=[F,R`
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
    `],h([x({attribute:!1})],$e.prototype,"hass",2),h([$()],$e.prototype,"_events",2),h([$()],$e.prototype,"_learning",2),h([$()],$e.prototype,"_loading",2),h([$()],$e.prototype,"_error",2),h([$()],$e.prototype,"_limit",2),h([$()],$e.prototype,"_pending",2),$e=h([D("jv-intrusion-log")],$e);var Xe=class extends I{constructor(){super(...arguments);this.config=null;this._pending=new Set;this._override={}}connectedCallback(){super.connectedCallback(),z(this,["ha-switch","ha-formfield","ha-select","ha-list-item"]),this._unsubLang=wt(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),this._unsubLang?.(),this._unsubLang=void 0}willUpdate(e){if(e.has("config")&&this.config&&Object.keys(this._override).length){let t={...this._override},r=!1;for(let n of Object.keys(t))String(this.config[n])===String(t[n])&&(delete t[n],r=!0);r&&(this._override=t)}}_cfg(e){return e in this._override?this._override[e]:this.config?.[e]}async _write(e,t){if(!this._pending.has(e)){this._pending=new Set([...this._pending,e]),this._override={...this._override,[e]:t};try{let r=await Z(this.hass,"jarvis/update_config",{key:e,value:t}),n=r&&typeof r=="object"&&"value"in r?r.value:t;this._override={...this._override,[e]:n??t},tt(this,s("Saved")),this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}catch(r){let n={...this._override};delete n[e],this._override=n,tt(this,`${e} — ${Ye(r)}`)}finally{let r=new Set(this._pending);r.delete(e),this._pending=r}}}_onTimeout(e){let t=e.target?.value,r=Number(t);if(!Number.isFinite(r)||r<=0)return;let n=Number(this._cfg("intrusion_response_timeout"))||120;r!==n&&this._write("intrusion_response_timeout",r)}_renderTimeout(e){let t=Number(this._cfg("intrusion_response_timeout"))||120,r=ca.map(c=>({value:c.value,label:s(c.label)}));r.some(c=>c.value===t)||(r.push({value:t,label:s("{n} s",{n:t})}),r.sort((c,d)=>c.value-d.value));let n=s("Auto-escalate if no response after"),o=e||this._pending.has("intrusion_response_timeout");return E("ha-select")&&E("ha-list-item")?l`
        <ha-select
          .label=${n}
          .value=${String(t)}
          ?disabled=${o}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${this._onTimeout}
          @closed=${c=>c.stopPropagation()}
        >
          ${r.map(c=>l`<ha-list-item .value=${String(c.value)}>${c.label}</ha-list-item>`)}
        </ha-select>
      `:l`
      <label class="field">
        <span>${n}</span>
        <select ?disabled=${o} @change=${this._onTimeout}>
          ${r.map(c=>l`<option value=${String(c.value)} .selected=${c.value===t}>${c.label}</option>`)}
        </select>
      </label>
    `}_renderSwitch(e,t,r,n){let o=n||this._pending.has(e),c=d=>{let u=d.target;!u||!!u.checked===t||this._write(e,!!u.checked)};return E("ha-switch")&&E("ha-formfield")?l`
        <ha-formfield .label=${r}>
          <ha-switch .checked=${t} ?disabled=${o} @change=${c}></ha-switch>
        </ha-formfield>
      `:l`
      <label class="switch">
        <input type="checkbox" role="switch" .checked=${t} ?disabled=${o} @change=${c} />
        <span>${r}</span>
      </label>
    `}render(){let e=!this.config;return l`
      <fieldset>
        <legend>${s("Response settings")}</legend>
        ${this._renderTimeout(e)}
        ${this._renderSwitch("intrusion_vision_confirm",this._cfg("intrusion_vision_confirm")!==!1,s("Confirm Frigate person with JARVIS vision before alarming"),e)}
        ${this._renderSwitch("intrusion_vision_veto",this._cfg("intrusion_vision_veto")!==!1,s("Stay silent when JARVIS's own cameras clearly show no one (recommended) — turn OFF to stay ever-vigilant and alert on any unanswered activity"),e)}
        ${this._renderSwitch("intrusion_requires_confinement",this._cfg("intrusion_requires_confinement")===!0,s("Require confinement (Lockdown or armed alarm) for intrusion monitoring"),e)}
      </fieldset>
    `}};Xe.styles=[F,R`
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
    `],h([x({attribute:!1})],Xe.prototype,"hass",2),h([x({attribute:!1})],Xe.prototype,"config",2),h([$()],Xe.prototype,"_pending",2),h([$()],Xe.prototype,"_override",2),Xe=h([D("jv-intrusion-settings")],Xe);var ks=["ha-icon","ha-alert"],Ss=5e3,Ae=class extends te{constructor(){super(...arguments);this._status=null;this._statusError=null;this._statusLoading=!1;this._pending=null;this._notice="";this._latestEventSnap=null;this._statusAt=0;this._started=!1;this._tick=null;this._noticeTimer=null;this._unsubs=[];this._onLogLoaded=e=>{let t=(e.detail?.events??[]).find(r=>r&&r.snapshot_url);this._latestEventSnap=t?{url:t.snapshot_url,camera:t.camera,ts:t.ts}:null}}connectedCallback(){super.connectedCallback(),z(this,ks),this.addEventListener("jv-intrusion-log",this._onLogLoaded)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("jv-intrusion-log",this._onLogLoaded),this._stopTick(),this._noticeTimer&&clearTimeout(this._noticeTimer);for(let e of this._unsubs)try{e()}catch{}this._unsubs=[]}updated(e){e.has("hass")&&this.hass&&!this._started&&(this._started=!0,this._loadStatus(),this._subscribe()),e.has("data")&&e.get("data")&&this.data&&this.hass&&Date.now()-this._statusAt>Ss&&this._loadStatus(!0)}async _subscribe(){let e=this.hass?.connection,t=e?.subscribeEvents;if(!(!e||typeof t!="function"||this._unsubs.length))for(let r of["jarvis_intrusion_confirmed","jarvis_intrusion_unresolved"])try{let n=await t.call(e,()=>this._onBusEvent(),r);typeof n=="function"&&this._unsubs.push(n)}catch{}}_onBusEvent(){this._loadStatus(!0),this.renderRoot.querySelector("jv-intrusion-log")?.load(),this.refresh()}async _loadStatus(e=!1){if(!this._statusLoading){this._statusLoading=!0,e||(this._statusError=null);try{let t=await this.ws("jarvis/intrusion",{action:"status"});this._applyStatus(t),this._statusError=null}catch(t){(!e||!this._status)&&(this._statusError=Ye(t))}finally{this._statusLoading=!1}}}_applyStatus(e){let t=e&&typeof e=="object"?e:{};this._status={last_snapshot:t.last_snapshot&&t.last_snapshot.url?t.last_snapshot:null,called_off:!!t.called_off,acknowledged:!!t.acknowledged,suppressed_for:Math.max(0,Number(t.suppressed_for)||0),false_alarms_24h:Math.max(0,Number(t.false_alarms_24h)||0)},this._statusAt=Date.now(),this._status.called_off&&this._status.suppressed_for>0?this._startTick():this._stopTick()}_suppressedLeft(){return this._status?Math.max(0,this._status.suppressed_for-Math.floor((Date.now()-this._statusAt)/1e3)):0}_startTick(){this._tick||(this._tick=setInterval(()=>{this._suppressedLeft()<=0&&this._stopTick(),this.requestUpdate()},1e3))}_stopTick(){this._tick&&clearInterval(this._tick),this._tick=null}_say(e){tt(this,e),this._notice=e,this._noticeTimer&&clearTimeout(this._noticeTimer),this._noticeTimer=setTimeout(()=>{this._notice="",this._noticeTimer=null},5e3)}async _callOff(){if(!(this._pending||!await ue({heading:s("Call off this intrusion as a false alarm?"),message:s("Escalation stays quiet for 10 minutes and the event is recorded as a false alarm."),confirmLabel:s("CALL OFF (FALSE ALARM)"),destructive:!0}))){this._pending="dismiss";try{let t=await this.ws("jarvis/intrusion",{action:"dismiss",reason:"panel"});this._applyStatus(t),this._say(s("Intrusion called off")),this.refresh(),this.renderRoot.querySelector("jv-intrusion-log")?.load()}catch(t){this._say(Ye(t))}finally{this._pending=null}}}async _acknowledge(){if(!this._pending){this._pending="acknowledge";try{let e=await this.ws("jarvis/intrusion",{action:"acknowledge",reason:"panel"});this._applyStatus(e),this._say(s("Acknowledged — holding escalation"))}catch(e){this._say(Ye(e))}finally{this._pending=null}}}_icon(e){return E("ha-icon")?l`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:m}_chip(){let e=this.data?.intrusion,t=this._status;if(e?.confirmed)return l`<jv-state-badge level="danger" pulse .label=${s("CONFIRMED")}></jv-state-badge>`;if(e?.active)return l`<jv-state-badge level="warn" pulse .label=${s("INVESTIGATING")}></jv-state-badge>`;if(t?.called_off){let r=this._suppressedLeft();return l`<jv-state-badge level="warn" .label=${r>0?`${s("CALLED OFF")} · ${r}s`:s("CALLED OFF")}></jv-state-badge>`}return t?l`<jv-state-badge level="ok" .label=${s("ARMED")}></jv-state-badge>`:this._statusError?l`<jv-state-badge level="neutral" label="—"></jv-state-badge>`:l`<jv-state-badge level="neutral" .label=${s("Loading...")}></jv-state-badge>`}_renderInvestigation(){let e=this.data?.intrusion;if(!e?.active)return m;let t=typeof e.breach_name=="string"&&e.breach_name?e.breach_name:e.breach_area||"",r=Array.isArray(e.zones)?e.zones:[],n=Array.isArray(e.path)?e.path:[],o=r.length?r:n;return l`
      <p class="line">
        ${this._icon("mdi:door-open")}
        <span><strong>${s("Breach")}:</strong> ${t||s("activity")}</span>
        ${o.length?l`<span class="zones jv-muted">${o.join(" → ")}</span>`:m}
      </p>
    `}_renderLockdown(){let e=this.data?.lockdown;if(!e?.active)return m;let t=$t(this.hass,e.since),r=e.auto?s("Lockdown engaged automatically since {time}",{time:t}):s("Lockdown engaged since {time}",{time:t});return l`
      <div class="banner danger" role="status">
        ${this._icon("mdi:lock-alert-outline")}
        <span>${r}${e.reason?l` — ${e.reason}`:m}</span>
      </div>
    `}_renderHero(){let e=this._status?.last_snapshot??this._latestEventSnap;if(e?.url){let t=br(this.hass,e.camera),r=$t(this.hass,e.ts);return l`
        <jv-intrusion-snapshot
          class="hero"
          variant="hero"
          .hass=${this.hass}
          .path=${e.url}
          .alt=${s("Intrusion snapshot")}
          .caption=${[t,r].filter(Boolean).join(" · ")}
        ></jv-intrusion-snapshot>
      `}return this._status?l`
      <jv-empty
        compact
        icon="mdi:camera-off-outline"
        .message=${s("No intrusion snapshots captured. This stays empty unless JARVIS confirms an intruder on camera.")}
      ></jv-empty>
    `:m}_renderStatusBody(){let e=this._status;if(!e&&this._statusError)return l`
        <div class="banner danger" role="alert">
          ${this._icon("mdi:alert-circle-outline")}
          <span>${s("Couldn't load — restart Home Assistant after updating.")} ${this._statusError}</span>
          <button class="jv-btn text" type="button" @click=${()=>{this._loadStatus()}}>${s("Retry")}</button>
        </div>
      `;if(!e)return l`<jv-empty compact kind="loading" .message=${s("Loading...")}></jv-empty>`;let t=e.false_alarms_24h;return l`
      ${e.acknowledged?l`<div class="banner ok" role="status">
            ${this._icon("mdi:check-circle-outline")}
            <span>${s("Acknowledged — automatic escalation held (you're handling it)")}</span>
          </div>`:m}
      ${this._renderHero()}
      ${t>0?l`<p class="count">
            ${t===1?s("{n} false alarm called off in the last 24h",{n:t}):s("{n} false alarms called off in the last 24h",{n:t})}
          </p>`:m}
    `}render(){if(!this.hass)return l`<jv-empty kind="loading" .message=${s("Loading...")}></jv-empty>`;let e=this._pending!==null;return l`
      <div class="layout">
        <jv-section .heading=${s("Intrusion")} icon="mdi:shield-home-outline" ?loading=${this._statusLoading&&!!this._status}>
          <span slot="actions" aria-live="polite">${this._chip()}</span>
          <p class="intro">
            ${s(`Last intrusion snapshot and false-alarm call-off. When JARVIS confirms an intruder on camera it grabs a still; if it's not real, call it off here or say "it's a false alarm".`)}
          </p>
          ${this._renderInvestigation()} ${this._renderLockdown()} ${this._renderStatusBody()}
          <div class="actions">
            <button class="jv-btn danger" type="button" ?disabled=${e} @click=${()=>{this._callOff()}}>
              ${this._icon("mdi:close-circle-outline")} ${s("CALL OFF (FALSE ALARM)")}
            </button>
            <button class="jv-btn" type="button" ?disabled=${e} @click=${()=>{this._acknowledge()}}>
              ${this._icon("mdi:eye-check-outline")} ${s("I'M LOOKING")}
            </button>
          </div>
          <p class="notice" role="status" aria-live="polite">${this._notice}</p>
          <jv-intrusion-settings .hass=${this.hass} .config=${this.data?.config??null}></jv-intrusion-settings>
        </jv-section>
        <jv-intrusion-log .hass=${this.hass}></jv-intrusion-log>
      </div>
    `}};Ae.styles=[F,R`
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
    `],h([$()],Ae.prototype,"_status",2),h([$()],Ae.prototype,"_statusError",2),h([$()],Ae.prototype,"_statusLoading",2),h([$()],Ae.prototype,"_pending",2),h([$()],Ae.prototype,"_notice",2),h([$()],Ae.prototype,"_latestEventSnap",2),Ae=h([D("jarvis-view-intrusion")],Ae);function ma(a){switch(a){case"time_routine":return s("Daily routine");case"sequence":return s("Action sequence");case"repeated_command":return s("Repeated command");case"temp_pref":return s("Temperature");case"presence":return s("Presence");case"numeric_trigger":return s("Sensor threshold");case"confirm_sequence":return s("Confirmed sequence");default:return s("Learned pattern")}}function fa(a){return a==="confirm_sequence"?"warn":"neutral"}function ga(a){let i=typeof a=="number"&&Number.isFinite(a)?a:0;return Math.max(0,Math.min(100,Math.round(i*100)))}function ba(a){return a>=80?"ok":a>=55?"warn":"neutral"}function _a(a){let i=typeof a=="string"?a.trim():"";if(!i)return{text:"",advisory:!1};try{let e=JSON.parse(i);if(e&&typeof e=="object"&&!Array.isArray(e)){let t=e,r=t.type==="manual_review"||typeof t.note=="string"&&!("trigger"in t);return{text:JSON.stringify(e,null,2),advisory:r}}return{text:JSON.stringify(e,null,2),advisory:!1}}catch{return{text:i,advisory:!1}}}function Es(a){if(typeof a!="string"||!a.trim())return null;let i=new Date(a.trim().replace(" ","T"));return Number.isNaN(i.getTime())?null:i}function va(a){let i=Math.round(Math.abs(a)/6e4);if(i<60)return`${i}m`;let e=Math.round(i/60);return e<48?`${e}h`:`${Math.round(e/24)}d`}function ni(a,i=Date.now()){let e=Es(a);if(!e)return"";let t=e.getTime()-i;return t>=0?s("in {t}",{t:va(t)}):s("{t} ago",{t:va(t)})}function ya(a,i=Date.now()){if(typeof a!="number"||!Number.isFinite(a)||a<=0)return"";let e=Math.max(0,Math.round((i-a*1e3)/6e4));if(e<60)return s("{n}m ago",{n:e});let t=Math.round(e/60);return t<48?s("{n}h ago",{n:t}):s("{n}d ago",{n:Math.round(t/24)})}function wa(a){let i=typeof a=="number"&&Number.isFinite(a)?a:0;return String(i).padStart(2,"0")}function Y(a){return typeof a=="number"&&Number.isFinite(a)?Math.trunc(a):0}function ja(a){return a&&a.charAt(0).toUpperCase()+a.slice(1)}function Oe(a){if(a&&typeof a=="object"&&"message"in a){let i=a.message;if(typeof i=="string"&&i)return i}return String(a??"")}function $a(a){if(a&&typeof a=="object"&&"code"in a){let i=a.code;if(typeof i=="string")return i}return""}function pe(a,i,e="neutral"){let t={message:i,tone:e};a.dispatchEvent(new CustomEvent("jv-toast",{detail:t,bubbles:!0,composed:!0}))}var xt=R`
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
`;var Ne=class extends I{constructor(){super(...arguments);this.suggestions=null;this._expanded=new Set;this._busy=new Set;this._done=new Set}connectedCallback(){super.connectedCallback(),z(this,["ha-icon"])}_toggle(e){let t=new Set(this._expanded);t.has(e)?t.delete(e):t.add(e),this._expanded=t}_setBusy(e,t){let r=new Set(this._busy);t?r.add(e):r.delete(e),this._busy=r}_markDone(e){this._done=new Set(this._done).add(e),this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}async _approve(e){let t=Y(e.id);if(!(this._busy.has(t)||this._done.has(t))&&!(e.pattern_type==="confirm_sequence"&&!await ue({heading:s("Create automation"),message:s("This automation closes a cover automatically when a confirmation sensor fires. Install it?"),confirmLabel:s("Install"),cancelLabel:s("Cancel")}))){this._setBusy(t,!0);try{let r=await Z(this.hass,"jarvis/suggestion_action",{suggestion_id:t,action:"approve"});r&&r.ok?(r.installed?pe(this,s('Installed — "{alias}" is now live in Home Assistant',{alias:r.alias??""}),"ok"):pe(this,s("Approved — advisory only ({reason})",{reason:r.reason??s("not installable")}),"neutral"),this._markDone(t)):pe(this,s("Could not approve suggestion"),"danger")}catch(r){pe(this,s("Suggestion failed — {error}",{error:Oe(r)}),"danger")}finally{this._setBusy(t,!1)}}}async _dismiss(e){let t=Y(e.id);if(!(this._busy.has(t)||this._done.has(t))){this._setBusy(t,!0);try{let r=await Z(this.hass,"jarvis/suggestion_action",{suggestion_id:t,action:"dismiss"});r&&r.ok?(pe(this,s("Dismissed"),"neutral"),this._markDone(t)):pe(this,s("Could not dismiss suggestion"),"danger")}catch(r){pe(this,s("Suggestion failed — {error}",{error:Oe(r)}),"danger")}finally{this._setBusy(t,!1)}}}_friendlyName(e){let t=this.hass?.states?.[e]?.attributes?.friendly_name;return typeof t=="string"&&t?`${t} (${e})`:e}_renderItem(e){let t=Y(e.id),r=ga(e.confidence),n=ba(r),o=this._expanded.has(t),c=this._busy.has(t),d=this._done.has(t),u=c||d,p=_a(e.yaml),v=Array.isArray(e.evidence)?e.evidence.filter(g=>typeof g=="string"&&g):[],f=Array.isArray(e.entities)?e.entities.filter(g=>typeof g=="string"&&g):[],b=Y(e.count),j=`pre-${t}`;return l`
      <li class="item ${d?"faded":""}" aria-busy=${c?"true":"false"}>
        <div class="top">
          <jv-state-badge nodot level=${fa(e.pattern_type)} .label=${ma(e.pattern_type)}></jv-state-badge>
          <div class="conf ${n}">
            <span>${s("{pct}% confident",{pct:r})}</span>
            <div class="bar ${n}" role="progressbar" aria-valuenow=${r} aria-valuemin="0" aria-valuemax="100" aria-label=${s("{pct}% confident",{pct:r})}>
              <span style="width:${r}%"></span>
            </div>
          </div>
        </div>
        ${e.why_headline?l`<p class="headline">${e.why_headline}</p>`:m}
        ${e.description?l`<p class="desc">${e.description}</p>`:m}
        ${v.length?l`
              <div class="evidence">
                <p class="label">${s("What JARVIS observed")}</p>
                <ul>
                  ${v.map(g=>l`<li>${g}</li>`)}
                </ul>
              </div>
            `:m}
        ${f.length?l`<div class="chips">${f.map(g=>l`<span class="chip" title=${this._friendlyName(g)}>${g}</span>`)}</div>`:m}
        ${b>0?l`<p class="seen jv-muted">${s("Seen {count}× in 30 days",{count:b})}</p>`:m}
        <div class="actions">
          <button class="jv-btn primary" type="button" ?disabled=${u} @click=${()=>{this._approve(e)}}>
            ${p.advisory?s("Acknowledge"):s("Create automation")}
          </button>
          <button class="jv-btn" type="button" ?disabled=${u} @click=${()=>{this._dismiss(e)}}>${s("Dismiss")}</button>
          <button
            class="jv-btn text"
            type="button"
            aria-expanded=${o?"true":"false"}
            aria-controls=${o?j:m}
            @click=${()=>this._toggle(t)}
          >
            ${o?s("Hide automation"):s("Show automation")}
          </button>
        </div>
        ${o?l`
              <div class="preview" id=${j}>
                ${p.advisory?l`<p class="advisory">${s("Advisory only — approving records your acknowledgement but installs nothing.")}</p>`:m}
                ${p.text?l`<pre>${p.text}</pre>`:l`<p class="jv-muted">${s("No automation payload.")}</p>`}
              </div>
            `:m}
      </li>
    `}render(){let e=this.suggestions,t=e?e.length:0;return l`
      <jv-section .heading=${s("Suggestions")} icon="mdi:lightbulb-on-outline" flush>
        ${t>0?l`<jv-state-badge slot="actions" nodot level="accent" .label=${s("{n} to review",{n:t})}></jv-state-badge>`:m}
        ${e===null?l`<div class="skeleton-rows" role="status" aria-label=${s("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`:t===0?l`
                <jv-empty
                  compact
                  icon="mdi:lightbulb-outline"
                  .heading=${s("No suggestions right now")}
                  .message=${s("JARVIS proposes automations as it notices routines repeat — a light you turn on each evening, a scene after a button press, the heat when it's cold. As patterns build up, they'll appear here for you to review and approve. Nothing is ever created without your say-so.")}
                ></jv-empty>
              `:l`
                <p class="intro">
                  ${s("Automations JARVIS has learned from watching your routines. Approve to create one in Home Assistant, or dismiss it. Nothing runs until you approve.")}
                </p>
                <ul>
                  ${e.map(r=>this._renderItem(r))}
                </ul>
              `}
      </jv-section>
    `}};Ne.styles=[F,xt,R`
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
    `],h([x({attribute:!1})],Ne.prototype,"hass",2),h([x({attribute:!1})],Ne.prototype,"suggestions",2),h([$()],Ne.prototype,"_expanded",2),h([$()],Ne.prototype,"_busy",2),h([$()],Ne.prototype,"_done",2),Ne=h([D("jarvis-suggestions-list")],Ne);var si=240,xe=class extends I{constructor(){super(...arguments);this.goals=null;this._draft="";this._creating=!1;this._fieldError="";this._busy=new Set;this._override=null}connectedCallback(){super.connectedCallback(),z(this,["ha-icon","ha-icon-button","ha-textfield"])}willUpdate(e){e.has("goals")&&e.get("goals")!==void 0&&(this._override=null)}get _list(){return this._override??this.goals}_setBusy(e,t){let r=new Set(this._busy);t?r.add(e):r.delete(e),this._busy=r}_applyResult(e){e&&Array.isArray(e.goals)&&(this._override=e.goals),this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}_onInput(e){let t=e.target;this._draft=String(t.value??"").slice(0,si),this._fieldError&&(this._fieldError="")}_onKeydown(e){e.key==="Enter"&&(e.preventDefault(),this._create())}async _create(){if(this._creating)return;let e=this._draft.trim();if(!e){this._fieldError=s("Enter what JARVIS should work toward");return}this._creating=!0;try{let t=await Z(this.hass,"jarvis/goal_action",{action:"create",outcome:e});pe(this,s("Goal added"),"ok"),this._draft="",this._fieldError="",this._applyResult(t)}catch(t){$a(t)==="empty_outcome"?this._fieldError=s("Enter what JARVIS should work toward"):pe(this,s("Could not add goal — {error}",{error:Oe(t)}),"danger")}finally{this._creating=!1}}async _cancel(e){let t=Y(e.id);if(!this._busy.has(t)){this._setBusy(t,!0);try{let r=await Z(this.hass,"jarvis/goal_action",{action:"cancel",goal_id:t});pe(this,r&&r.ok?s("Goal cancelled"):s("Goal was already closed"),r&&r.ok?"ok":"neutral"),this._applyResult(r)}catch(r){pe(this,s("Cancel failed — {error}",{error:Oe(r)}),"danger")}finally{this._setBusy(t,!1)}}}async _delete(e){let t=Y(e.id);if(!(this._busy.has(t)||!await ue({heading:s("Delete this goal from history?"),message:e.title||e.outcome||"",confirmLabel:s("Delete"),cancelLabel:s("Cancel"),destructive:!0}))){this._setBusy(t,!0);try{let n=await Z(this.hass,"jarvis/goal_action",{action:"delete",goal_id:t});pe(this,s("Goal deleted"),"ok"),this._applyResult(n)}catch(n){pe(this,s("Delete failed — {error}",{error:Oe(n)}),"danger")}finally{this._setBusy(t,!1)}}}_status(e){switch(e){case"active":return{label:s("Active"),level:"accent"};case"done":return{label:s("Done"),level:"ok"};case"failed":return{label:s("Failed"),level:"danger"};case"cancelled":return{label:s("Cancelled"),level:"neutral"};default:return{label:ja(String(e??"")),level:"neutral"}}}_iconButton(e,t,r,n){return E("ha-icon-button")&&E("ha-icon")?l`
        <ha-icon-button .label=${t} title=${t} .disabled=${r} @click=${n}>
          <ha-icon .icon=${e}></ha-icon>
        </ha-icon-button>
      `:l`<button class="jv-btn text" type="button" title=${t} ?disabled=${r} @click=${n}>${t}</button>`}_renderGoal(e){let t=Y(e.id),r=e.status==="active",n=this._status(e.status),o=Y(e.steps_total),c=Y(e.steps_done),d=o>0?Math.max(0,Math.min(100,Math.round(c/o*100))):0,u=this._busy.has(t),p="";if(r){let v=ni(e.deadline_ts),f=ni(e.next_check_ts);e.deadline_ts&&v?p=s("Deadline {rel}",{rel:v}):f&&(p=s("Next check {rel}",{rel:f}))}else e.last_result&&(p=e.last_result);return l`
      <li class="item ${r?"":"dim"}" aria-busy=${u?"true":"false"}>
        <div class="goal">
          <div class="main">
            <div class="head">
              <jv-state-badge level=${n.level} .label=${n.label}></jv-state-badge>
              ${e.title?l`<p class="title">${e.title}</p>`:m}
            </div>
            ${e.outcome&&e.outcome!==e.title?l`<p class="outcome">${e.outcome}</p>`:m}
            ${o>0?l`
                  <div class="progress">
                    <div class="bar" role="progressbar" aria-valuenow=${d} aria-valuemin="0" aria-valuemax="100" aria-label=${s("{done}/{total} steps",{done:c,total:o})}>
                      <span style="width:${d}%"></span>
                    </div>
                    <span class="jv-muted">${s("{done}/{total} steps",{done:c,total:o})}</span>
                  </div>
                `:m}
            ${p?l`<p class="when jv-muted">${p}</p>`:m}
          </div>
          <div class="trail">
            ${r?this._iconButton("mdi:close",s("Cancel this goal"),u,()=>{this._cancel(e)}):this._iconButton("mdi:delete-outline",s("Delete this goal"),u,()=>{this._delete(e)})}
          </div>
        </div>
      </li>
    `}_renderInput(){let e=s("Give JARVIS a goal to work toward…"),t=E("ha-textfield")?l`
          <ha-textfield
            .label=${e}
            .value=${this._draft}
            .disabled=${this._creating}
            .maxLength=${si}
            .errorMessage=${this._fieldError}
            .invalid=${!!this._fieldError}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
          ></ha-textfield>
        `:l`
          <label class="visually-hidden" for="goal-input">${e}</label>
          <input
            id="goal-input"
            type="text"
            .value=${this._draft}
            placeholder=${e}
            maxlength=${si}
            ?disabled=${this._creating}
            aria-invalid=${this._fieldError?"true":"false"}
            aria-describedby=${this._fieldError?"goal-error":m}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
          />
          ${this._fieldError?l`<p class="inline-error" id="goal-error" role="alert">${this._fieldError}</p>`:m}
        `;return l`
      <div class="add">
        <div class="field">${t}</div>
        <button class="jv-btn primary" type="button" ?disabled=${this._creating} @click=${()=>{this._create()}}>${s("Add")}</button>
      </div>
    `}render(){let e=this._list,t=e?e.filter(r=>r.status==="active").length:0;return l`
      <jv-section .heading=${s("Goals")} icon="mdi:flag-checkered" flush>
        ${e&&t>0?l`<jv-state-badge slot="actions" nodot level="accent" .label=${s("{n} active",{n:t})}></jv-state-badge>`:m}
        ${this._renderInput()}
        ${e===null?l`<div class="skeleton-rows" role="status" aria-label=${s("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`:e.length===0?l`<p class="empty jv-muted">${s("No goals yet. Add one above, or ask JARVIS to set one.")}</p>`:l`<ul>${e.map(r=>this._renderGoal(r))}</ul>`}
      </jv-section>
    `}};xe.styles=[F,xt,R`
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
    `],h([x({attribute:!1})],xe.prototype,"hass",2),h([x({attribute:!1})],xe.prototype,"goals",2),h([$()],xe.prototype,"_draft",2),h([$()],xe.prototype,"_creating",2),h([$()],xe.prototype,"_fieldError",2),h([$()],xe.prototype,"_busy",2),h([$()],xe.prototype,"_override",2),xe=h([D("jarvis-suggestions-goals")],xe);var ye=class extends I{constructor(){super(...arguments);this.data=null;this._status=null;this._statusError="";this._loading=!1;this._running=!1;this._result=null;this._runError="";this._inFlight=null}connectedCallback(){super.connectedCallback(),z(this,["ha-alert"])}updated(e){(e.has("hass")&&!this._status&&!this._inFlight||e.has("data")&&this.data)&&this.hass&&this._fetchStatus()}_fetchStatus(){return this._inFlight?this._inFlight:this.hass?(this._status||(this._loading=!0),this._inFlight=(async()=>{try{let e=await Z(this.hass,"jarvis/get_cognitive_status");this._status=e&&typeof e=="object"?e:{},this._statusError=""}catch(e){this._statusError=Oe(e)||s("Learning status unavailable"),this._status||(this._status={})}finally{this._loading=!1,this._inFlight=null}})(),this._inFlight):Promise.resolve()}async _analyze(){if(!this._running){this._running=!0,this._runError="";try{let e=await Z(this.hass,"jarvis/run_analysis");this._result=e&&typeof e=="object"?e:{ran:!1}}catch(e){this._result=null,this._runError=Oe(e)||s("Analysis did not run.")}finally{this._running=!1}await this._fetchStatus(),this.dispatchEvent(new CustomEvent("jarvis-refresh",{bubbles:!0,composed:!0}))}}_renderResult(){if(this._runError)return l`<div class="result error" role="status"><p class="lead">${this._runError}</p></div>`;let e=this._result;if(!e)return m;let t=e.backfill&&Y(e.backfill.imported)>0?l`<p>${s("Imported {n} past events from history for {m} new entities.",{n:Y(e.backfill.imported),m:Y(e.backfill.entities)})}</p>`:m;if(!e.ran)return l`
        <div class="result error" role="status">
          <p class="lead">${e.reason||e.error||s("Analysis did not run.")}</p>
          ${t}
        </div>
      `;let r=Y(e.patterns_found),n=Y(e.new_suggestions),o=e.diagnostic??{},c=Array.isArray(o.candidates)?o.candidates[0]:void 0,d=Array.isArray(o.top_sources)?o.top_sources[0]:void 0,u=Array.isArray(e.near_misses)?e.near_misses.slice(0,5):[];return l`
      <div class="result" role="status">
        <p class="lead">
          ${s("Found {n} patterns, {m} new suggestions.",{n:r,m:n})}
          ${n>0?s("They're listed above."):s("Nothing cleared the confidence bar this pass.")}
        </p>
        ${n>0?m:l`
              ${c?l`<p>${s("Closest routine: {entity} → {state} ~{hh}:00, seen {days}/{total} days (needs {min}).",{entity:c.entity_id,state:c.state,hh:wa(c.hour),days:Y(c.days),total:Y(o.total_days),min:Y(o.min_days)})}</p>`:m}
              ${d?l`<p>${s("Busiest source: {entity} ({changes} changes).",{entity:d.entity_id,changes:Y(d.changes)})}</p>`:m}
              ${u.length?l`
                    <p>${s("Building toward suggestions:")}</p>
                    <ul>
                      ${u.map(p=>l`<li>
                          ${p.description||p.type||""}
                          ${p.needed==null?`(${Y(p.occurrences)}×)`:`(${Y(p.occurrences)}/${Y(p.needed)})`}
                        </li>`)}
                    </ul>
                  `:m}
            `}
        ${t}
      </div>
    `}_renderStatus(){let e=this._status??{},t=e.learning??{},r=e.last_analysis??{},n=ya(r.ts),o=n?`${n} · ${s("{n} found, {m} stored",{n:Y(r.patterns_found),m:Y(r.new_suggestions)})}`:s("Not yet this session"),c=this._statusError||e.error;return l`
      ${c?l`<p class="note jv-muted">${s("Learning status unavailable")}${e.error?l` — <span class="mono">${e.error}</span>`:m}</p>`:e.running===!1?l`<p class="note jv-muted">${s("Cognitive core is not running")}</p>`:m}
      <div class="rows">
        <jv-kv .label=${s("Data")} .value=${s("{n} days",{n:Y(t.days_of_data)})}></jv-kv>
        <jv-kv .label=${s("State changes")} .value=${String(Y(t.state_changes))} mono></jv-kv>
        <jv-kv .label=${s("Commands")} .value=${String(Y(t.commands))} mono></jv-kv>
        <jv-kv .label=${s("Pending suggestions")} .value=${String(Y(t.suggestions))} mono></jv-kv>
        <jv-kv .label=${s("Ignore rules")} .value=${String(Y(e.ignore_rules))} mono></jv-kv>
        <jv-kv .label=${s("Last analysis")} .value=${o} stacked></jv-kv>
      </div>
    `}render(){let e=this._running;return l`
      <jv-section .heading=${s("Routine Learning")} icon="mdi:school-outline" flush .loading=${e}>
        ${this._loading&&!this._status?l`<div class="skeleton-rows" role="status" aria-label=${s("Loading...")}>
              <div class="jv-skeleton"></div>
              <div class="jv-skeleton"></div>
            </div>`:this._renderStatus()}
        <div class="foot">
          <button class="jv-btn" type="button" ?disabled=${e} aria-busy=${e?"true":"false"} @click=${()=>{this._analyze()}}>
            ${e?s("Analyzing…"):s("Analyze Now")}
          </button>
          ${e?l`<p class="jv-muted" role="status">${s("Running pattern analysis over your history…")}</p>`:this._renderResult()}
        </div>
      </jv-section>
    `}};ye.styles=[F,xt,R`
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
    `],h([x({attribute:!1})],ye.prototype,"hass",2),h([x({attribute:!1})],ye.prototype,"data",2),h([$()],ye.prototype,"_status",2),h([$()],ye.prototype,"_statusError",2),h([$()],ye.prototype,"_loading",2),h([$()],ye.prototype,"_running",2),h([$()],ye.prototype,"_result",2),h([$()],ye.prototype,"_runError",2),ye=h([D("jarvis-suggestions-learning")],ye);var As=6e3,kt=class extends te{constructor(){super(...arguments);this._toast=null;this._toastTimer=null}disconnectedCallback(){super.disconnectedCallback(),this._toastTimer&&clearTimeout(this._toastTimer),this._toastTimer=null}_onToast(e){let t=e.detail;if(!(!t||!t.message)){if(e.stopPropagation(),E("home-assistant")){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:t.message},bubbles:!0,composed:!0}));return}this._toast=t,this._toastTimer&&clearTimeout(this._toastTimer),this._toastTimer=setTimeout(()=>{this._toastTimer=null,this._toast=null},As)}}get _suggestions(){if(!this.data)return null;let e=this.data.suggestions;return Array.isArray(e)?e:[]}get _goals(){if(!this.data)return null;let e=this.data.goals;return Array.isArray(e)?e:[]}render(){return l`
      <div class="layout ${this.narrow?"narrow":""}" @jv-toast=${this._onToast}>
        <div class="col">
          <jarvis-suggestions-list .hass=${this.hass} .suggestions=${this._suggestions}></jarvis-suggestions-list>
          <jarvis-suggestions-goals .hass=${this.hass} .goals=${this._goals}></jarvis-suggestions-goals>
        </div>
        <div class="col">
          <jarvis-suggestions-learning .hass=${this.hass} .data=${this.data}></jarvis-suggestions-learning>
          <div class="footer">
            <button type="button" @click=${()=>this.navigate("settings","learning")}>${s("Learning settings")}</button>
          </div>
        </div>
      </div>
      <div class="toast ${this._toast?.tone??""} ${this.narrow?"narrow":""}" role="status" aria-live="polite" aria-atomic="true">
        ${this._toast?l`<div>${this._toast.message}</div>`:m}
      </div>
    `}};kt.styles=[F,R`
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
    `],h([$()],kt.prototype,"_toast",2),kt=h([D("jarvis-view-suggestions")],kt);var xa=R`
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
`;function _r(){return{status:"idle",data:null,error:null}}function oi(a){return a==="household"?s("Household"):a==="primary"?s("About me"):yr(a)}function yr(a){return String(a||"").replace(/[_\s]+/g," ").trim().split(" ").filter(Boolean).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")||"?"}function ka(a){let i=new Map;for(let e of a){let t=String(e.subject||"household"),r=i.get(t);r?r.push(e):i.set(t,[e])}return[...i.entries()].sort(([e],[t])=>e===t?0:e==="household"?-1:t==="household"?1:e.localeCompare(t))}function Sa(a){return Object.keys(a).filter(i=>Array.isArray(a[i])&&a[i].length>0).sort((i,e)=>i.localeCompare(e)).map(i=>[i,[...a[i]].sort((e,t)=>St(t.confidence)-St(e.confidence))])}function St(a){let i=typeof a=="number"?a:Number(a);return Number.isFinite(i)?i:0}function li(a){return Math.max(0,Math.min(100,Math.round(St(a)*100)))}function Ea(a){return a.source!=="stated"||St(a.confidence)<.9}function ci(a){return`${a.source?s(String(a.source)):s("inferred")} · ${li(a.confidence)}% ${s("sure")}`}function di(a,i){if(a==null)return"";let e=St(a);return e?Ta(new Date(e*1e3),i):""}function Aa(a,i){if(!a)return"";let e=String(a).trim();if(!e)return"";let t=/(Z|[+-]\d{2}:?\d{2})$/i.test(e),r=new Date(t?e:`${e}Z`);return Number.isNaN(r.getTime())?"":Ta(r,i)}function Ta(a,i){try{return a.toLocaleString(i||void 0)}catch{return a.toLocaleString()}}function Ra(a){let i=St(a);return i?`×${i}`:"×?"}function Et(a){if(a&&typeof a=="object"){let i=a;if(typeof i.message=="string"&&i.message)return i.message;if(typeof i.code=="string"&&i.code)return i.code}return a?String(a):""}var Ts=["ha-card","ha-icon","ha-icon-button","ha-textfield","ha-alert"],Rs=10,de=class extends te{constructor(){super(...arguments);this._facts=_r();this._routines=_r();this._briefings=_r();this._teachKey="";this._teachValue="";this._teachSubject="household";this._teachPending=!1;this._teachError=null;this._teachNotice=null;this._forgetting=new Set;this._forgetError=null;this._started=!1;this._noticeTimer=null}connectedCallback(){super.connectedCallback(),z(this,Ts)}disconnectedCallback(){super.disconnectedCallback(),this._noticeTimer&&clearTimeout(this._noticeTimer)}updated(e){super.updated(e),e.has("narrow")&&this.toggleAttribute("narrow",this.narrow),!this._started&&this.hass&&(this._started=!0,this._loadAll())}_loadAll(){return Promise.all([this._loadFacts(),this._loadRoutines(),this._loadBriefings()]).then(()=>{})}async _loadFacts(){this._facts={status:"loading",data:this._facts.data,error:null};try{let e=await this.ws("jarvis/get_knowledge");this._facts={status:"loaded",data:Array.isArray(e?.facts)?e.facts:[],error:null}}catch(e){this._facts={status:"error",data:this._facts.data,error:Et(e)}}}async _loadRoutines(){this._routines={status:"loading",data:this._routines.data,error:null};try{let e=await this.ws("jarvis/get_person_routines"),t=e?.routines&&typeof e.routines=="object"?e.routines:{};this._routines={status:"loaded",data:t,error:null}}catch(e){this._routines={status:"error",data:this._routines.data,error:Et(e)}}}async _loadBriefings(){this._briefings={status:"loading",data:this._briefings.data,error:null};try{let e=await this.ws("jarvis/briefings",{limit:Rs});this._briefings={status:"loaded",data:Array.isArray(e?.briefings)?e.briefings:[],error:null}}catch(e){this._briefings={status:"error",data:this._briefings.data,error:Et(e)}}}_applyFacts(e){Array.isArray(e)&&(this._facts={status:"loaded",data:e,error:null})}get _canTeach(){return!this._teachPending&&!!this._teachKey.trim()&&!!this._teachValue.trim()}async _teach(e){if(e?.preventDefault(),!this._canTeach)return;let t=this._teachKey.trim(),r=this._teachValue.trim(),n=this._teachSubject;this._teachPending=!0,this._teachError=null,this._setNotice(null);try{let o=await this.ws("jarvis/add_knowledge",{key:t,value:r,subject:n,kind:n==="primary"?"preference":"fact"});this._applyFacts(o?.facts),o?.ok?(this._teachKey="",this._teachValue="",this._setNotice(s("Got it - JARVIS will remember that.")),this.refresh(),await this.updateComplete,this.renderRoot.querySelector("#teach-key")?.focus()):this._teachError=s("Couldn't save that fact")}catch(o){let c=Et(o);this._teachError=c?`${s("Couldn't save that fact")} — ${c}`:s("Couldn't save that fact")}finally{this._teachPending=!1}}async _forget(e){if(!(this._forgetting.has(e.id)||!await ue({heading:s("Forget this fact?"),message:`${e.key}: ${e.value}`,confirmLabel:s("Forget"),destructive:!0}))){this._forgetting=new Set([...this._forgetting,e.id]),this._forgetError=null;try{let r=await this.ws("jarvis/forget_knowledge",{fact_id:e.id});this._applyFacts(r?.facts),this.refresh()}catch(r){let n=Et(r);this._forgetError=n?`${s("Couldn't forget that")} — ${n}`:s("Couldn't forget that")}finally{let r=new Set(this._forgetting);r.delete(e.id),this._forgetting=r}}}_setNotice(e){this._noticeTimer&&clearTimeout(this._noticeTimer),this._noticeTimer=null,this._teachNotice=e,e&&(this._noticeTimer=setTimeout(()=>{this._teachNotice=null,this._noticeTimer=null},4e3))}_onTeachKeydown(e){e.key==="Enter"&&!e.isComposing&&(e.preventDefault(),this._teach())}_locale(){return this.hass?.locale?.language||this.hass?.language||void 0}_loading(){return l`
      <div class="loading" role="status" aria-live="polite" aria-label=${s("Loading...")}>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
        <div class="jv-skeleton"></div>
      </div>
    `}_error(e,t,r){let n=l`<button class="jv-btn" type="button" slot="action" @click=${r}>${s("Retry")}</button>`;return E("ha-alert")?l`<ha-alert alert-type="error" .title=${e}>${t||""}${n}</ha-alert>`:l`
      <div class="alert" role="alert">
        <div class="body"><strong>${e}</strong><span>${t||""}</span></div>
        ${n}
      </div>
    `}_empty(e,t){return l`<jv-empty compact .icon=${t} .message=${e}></jv-empty>`}_icon(e,t){return E("ha-icon")?l`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:l`<span aria-hidden="true">${t}</span>`}_renderKnowledge(){let e=this._facts,t=e.data??[],r=t.length,n=e.status==="loaded"||e.data?l`<jv-state-badge slot="actions" level="accent" nodot .label=${`${r} ${s(r===1?"fact":"facts")}`}></jv-state-badge>`:m;return l`
      <jv-section
        icon="mdi:brain"
        .heading=${s("What JARVIS Knows")}
        .subheading=${s("Durable facts & preferences JARVIS recalls in conversation. Teach it something, or forget anything with ✕.")}
        ?loading=${e.status==="loading"&&!!e.data}
      >
        ${n}
        ${this._renderTeachForm()}
        ${this._forgetError?l`<p class="form-msg error" role="alert">${this._forgetError}</p>`:m}
        ${e.status==="error"?this._error(s("Couldn't load memory"),e.error,()=>{this._loadFacts()}):e.status==="loaded"||e.data?r===0?this._empty(s('Nothing yet. Say "remember that…" to JARVIS, or teach it above.'),"mdi:brain"):this._renderFactGroups(t):this._loading()}
      </jv-section>
    `}_renderTeachForm(){let e=this._teachPending,t=s("what  (e.g. trash day)"),r=s("is  (e.g. Tuesday)"),n=(o,c,d,u)=>E("ha-textfield")?l`<ha-textfield
            id=${o}
            .label=${c}
            .value=${d}
            .disabled=${e}
            autocomplete="off"
            @input=${p=>u(p.target.value)}
            @keydown=${this._onTeachKeydown}
          ></ha-textfield>`:l`<label class="visually-hidden" for=${o}>${c}</label>
            <input
              id=${o}
              type="text"
              autocomplete="off"
              placeholder=${c}
              .value=${d}
              ?disabled=${e}
              @input=${p=>u(p.target.value)}
              @keydown=${this._onTeachKeydown}
            />`;return l`
      <form class="teach" @submit=${this._teach} aria-label=${s("Teach")}>
        <div class="field">${n("teach-key",t,this._teachKey,o=>this._teachKey=o)}</div>
        <div class="field">${n("teach-value",r,this._teachValue,o=>this._teachValue=o)}</div>
        <div class="field subject">
          <label for="teach-subject">${s("Subject")}</label>
          <select
            id="teach-subject"
            .value=${this._teachSubject}
            ?disabled=${e}
            @change=${o=>this._teachSubject=o.target.value==="primary"?"primary":"household"}
          >
            <option value="household" ?selected=${this._teachSubject==="household"}>${s("Household")}</option>
            <option value="primary" ?selected=${this._teachSubject==="primary"}>${s("About me")}</option>
          </select>
        </div>
        <button class="jv-btn primary submit" type="submit" ?disabled=${!this._canTeach}>${s("Teach")}</button>
      </form>
      ${this._teachError?l`<p class="form-msg error" role="alert">${this._teachError}</p>`:m}
      ${this._teachNotice?l`<p class="form-msg ok" role="status" aria-live="polite">${this._teachNotice}</p>`:m}
    `}_renderFactGroups(e){let t=this._locale();return l`
      ${ka(e).map(([r,n])=>l`
          <section class="group" aria-label=${oi(r)}>
            <h3 class="group-head">${oi(r)}</h3>
            <ul>
              ${n.map(o=>this._renderFact(o,t))}
            </ul>
          </section>
        `)}
    `}_renderFact(e,t){let r=this._forgetting.has(e.id),n=s("Forget"),o=s("Forget this"),c=()=>{this._forget(e)},d=di(e.updated_at,t);return l`
      <li class="fact ${r?"busy":""}">
        <div class="text">
          <span class="key">${e.key}</span>
          <span class="value" title=${d}>${e.value}</span>
        </div>
        ${Ea(e)?l`<span class="marker" role="img" title=${ci(e)} aria-label=${ci(e)}>~</span>`:m}
        ${e.expires_at!==null&&e.expires_at!==void 0?l`<span class="marker" role="img" title=${`${s("expires")} ${di(e.expires_at,t)}`} aria-label=${s("expires")}>⌛</span>`:m}
        ${E("ha-icon-button")?l`<ha-icon-button .label=${n} title=${o} .disabled=${r} @click=${c}>
              ${this._icon("mdi:close","✕")}
            </ha-icon-button>`:l`<button class="jv-icon-btn" type="button" aria-label=${n} title=${o} ?disabled=${r} @click=${c}>
              ${this._icon("mdi:close","✕")}
            </button>`}
      </li>
    `}_renderRoutines(){let e=this._routines,t=e.data?Sa(e.data):[];return l`
      <jv-section
        icon="mdi:account-clock-outline"
        .heading=${s("Person Routines")}
        .subheading=${s("Habits JARVIS has confidently attributed to one person, from 30 days of sole-occupant activity — separate from household-wide facts above.")}
        ?loading=${e.status==="loading"&&!!e.data}
      >
        <jv-state-badge slot="actions" level="info" nodot .label=${s("Learned")}></jv-state-badge>
        ${e.status==="error"?this._error(s("Couldn't load routines"),e.error,()=>{this._loadRoutines()}):e.status==="loaded"||e.data?t.length===0?this._empty(s("Nothing person-specific learned yet — JARVIS needs a few weeks of sole-occupant data before routines are confidently individual."),"mdi:account-clock-outline"):t.map(([r,n])=>l`
                    <section class="group" aria-label=${yr(r)}>
                      <h3 class="group-head">${yr(r)}</h3>
                      <ul>
                        ${n.map(o=>this._renderRoutine(o))}
                      </ul>
                    </section>
                  `):this._loading()}
      </jv-section>
    `}_renderRoutine(e){let t=li(e.confidence);return l`
      <li class="routine">
        <p class="desc">${e.description||e.pattern_type||"—"}</p>
        <div class="meta">
          <div class="bar" role="img" aria-label=${`${t}%`}><span style=${`width:${t}%`}></span></div>
          <span class="pct">${t}% · ${Ra(e.occurrences)}</span>
        </div>
      </li>
    `}_renderBriefings(){let e=this._briefings,t=e.data??[],r=this._locale();return l`
      <jv-section
        icon="mdi:newspaper-variant-outline"
        .heading=${s("Recent Briefings")}
        .subheading=${s("The full briefings JARVIS delivered — read here when a phone notification truncated a long one.")}
        ?loading=${e.status==="loading"&&!!e.data}
      >
        <jv-state-badge slot="actions" level="neutral" nodot .label=${s("Full text")}></jv-state-badge>
        ${e.status==="error"?this._error(s("Couldn't load briefings"),e.error,()=>{this._loadBriefings()}):e.status==="loaded"||e.data?t.length===0?this._empty(s("No briefings yet — they appear here once JARVIS has delivered one."),"mdi:newspaper-variant-outline"):l`<ol>
                  ${t.map((n,o)=>{let c=Aa(n.timestamp,r),d=o===0?c?`${c} · ${s("latest")}`:s("latest"):c;return l`
                      <li class="briefing ${o===0?"latest":""}">
                        ${d?l`<span class="when">${d}</span>`:m}
                        <p>${String(n.text??"")}</p>
                      </li>
                    `})}
                </ol>`:this._loading()}
      </jv-section>
    `}render(){return l`
      <div class="layout">
        <div class="col">${this._renderKnowledge()}</div>
        <div class="col">${this._renderRoutines()} ${this._renderBriefings()}</div>
      </div>
    `}};de.styles=[F,xa],h([$()],de.prototype,"_facts",2),h([$()],de.prototype,"_routines",2),h([$()],de.prototype,"_briefings",2),h([$()],de.prototype,"_teachKey",2),h([$()],de.prototype,"_teachValue",2),h([$()],de.prototype,"_teachSubject",2),h([$()],de.prototype,"_teachPending",2),h([$()],de.prototype,"_teachError",2),h([$()],de.prototype,"_teachNotice",2),h([$()],de.prototype,"_forgetting",2),h([$()],de.prototype,"_forgetError",2),de=h([D("jarvis-view-memory")],de);var Te={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},At=a=>(...i)=>({_$litDirective$:a,values:i}),rt=class{constructor(i){}get _$AU(){return this._$AM._$AU}_$AT(i,e,t){this._$Ct=i,this._$AM=e,this._$Ci=t}_$AS(i,e){return this.update(i,e)}update(i,e){return this.render(...e)}};var Vt=class extends rt{constructor(i){if(super(i),this.it=m,i.type!==Te.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(i){if(i===m||i==null)return this._t=void 0,this.it=i;if(i===le)return i;if(typeof i!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(i===this.it)return this._t;this.it=i;let e=[i];return e.raw=e,this._t={_$litType$:this.constructor.resultType,strings:e,values:[]}}};Vt.directiveName="unsafeHTML",Vt.resultType=1;var Ca=At(Vt);var za=20,Cs=24/2,Sr=1.2,Ma=8.6,kr=30*Math.PI/180,Tt=[63/2,Cs,9*.5],xr={"1f":[.4,8.6],"2f":[9,13.8],b:[-7,-.6]},ie={},_;function Ms(a){ie=a||{},za=9+11*(ie.pitch&&ie.pitch>0?ie.pitch:1)}function qa(a,i){let e=a[0]-Tt[0],t=a[1]-Tt[1],r=a[2]-Tt[2],n=Math.cos(i),o=Math.sin(i);return[e*n-t*o,e*o+t*n,r]}function Yt(a,i){let e=qa(a,i*Math.PI/180);return[-e[0]*Ma,-(e[1]*Math.sin(kr)+e[2]*Math.cos(kr))*Ma]}function La(a,i){let e=i*Math.PI/180,t=0,r=0,n=a.p.length;for(let o=0;o<n;o++){let c=qa(a.p[o],e);t+=c[1],r+=c[2]}return t/=n,r/=n,t*Math.cos(kr)-r*Math.sin(kr)}function A(a,i,e,t,r,n){let o={p:i,f:e,s:t||_.edge,w:r??.9};n?.cls&&(o.cls=n.cls),a.push(o)}function Pa(a,i,e,t,r,n,o,c,d,u){A(a,[[i,e,0],[i,t,0],[i,t,r],[i,n,o],[i,e,r]],c,d,u)}function Ie(a,i,e,t,r,n,o,c,d,u,p){let v=c==="dom"?_.winDom:c==="on"?_.winOn:_.winOff,f=c==="dom"?_.glassDom:c==="on"?_.glassOn:_.glassOff,j=e+(u??-.06);if(A(a,[[t,j,n],[r,j,n],[r,j,o],[t,j,o]],v,f,.7),d){A(a,[[t,j,(n+o)/2],[r,j,(n+o)/2]],"none",f,.4);let g=p||2;for(let y=1;y<g;y++){let C=t+(r-t)*y/g;A(a,[[C,j,n],[C,j,o]],"none",f,.4)}}if(c!=="off"&&i){let g=c==="dom"?_.glowDom:_.glowOn;i.push({p:[[t-1.4,j,n-1.4],[r+1.4,j,n-1.4],[r+1.4,j,o+1.4],[t-1.4,j,o+1.4]],f:g})}}function Ze(a,i,e,t,r,n,o,c,d,u){let p=c==="dom"?_.winDom:c==="on"?_.winOn:_.winOff,v=c==="dom"?_.glassDom:c==="on"?_.glassOn:_.glassOff,b=e+(u??.06);if(A(a,[[b,t,n],[b,r,n],[b,r,o],[b,t,o]],p,v,.7),d&&(A(a,[[b,t,(n+o)/2],[b,r,(n+o)/2]],"none",v,.4),A(a,[[b,(t+r)/2,n],[b,(t+r)/2,o]],"none",v,.4)),c!=="off"&&i){let j=c==="dom"?_.glowDom:_.glowOn;i.push({p:[[b,t-1.4,n-1.4],[b,r+1.4,n-1.4],[b,r+1.4,o+1.4],[b,t-1.4,o+1.4]],f:j})}}function vi(a,i,e,t,r,n,o,c,d,u){for(let v=0;v<12;v++){let f=i+(e-i)*v/12,b=i+(e-i)*(v+1)/12;A(a,[[f,t,r],[b,t,r],[b,n,o],[f,n,o]],c,"none",0)}A(a,[[i,t,r],[e,t,r],[e,n,o],[i,n,o]],"none",d,u)}function Ua(a){let i=a!=="off",e=a==="mmwave";return{ff:a==="dom"?_.roomFillDom:e?_.roomFillMmwave:i?_.roomFillOn:_.roomFillOff,ss:a==="dom"?_.roomStrokeDom:e?_.roomStrokeMmwave:i?_.roomStrokeOn:_.roomStrokeOff,sw:e?1.3:i?1:.6,wf:a==="dom"?_.roomWallDom:e?_.roomWallMmwave:i?_.roomWallOn:_.roomWallOff}}function Ls(a,i,e,t,r,n,o,c,d,u){let p=e+r,v=t+n,f=u!=="off",{ff:b,ss:j,sw:g,wf:y}=Ua(u);A(a,[[e,t,o],[p,t,o],[p,v,o],[e,v,o]],b,j,g*.7),A(a,[[e,t,o],[p,t,o],[p,t,c],[e,t,c]],y,j,g*.5),A(a,[[e,v,o],[p,v,o],[p,v,c],[e,v,c]],y,j,g*.5),A(a,[[e,t,o],[e,v,o],[e,v,c],[e,t,c]],y,j,g*.5),A(a,[[p,t,o],[p,v,o],[p,v,c],[p,t,c]],y,j,g*.5),i.push({x:(e+p)/2,y:(t+v)/2,z:o+.2,t:d,st:u,big:r>14}),f&&i.push({x:(e+p)/2,y:(t+v)/2,z:c-.5,st:u,dot:!0})}function Ps(a,i,e,t,r,n,o){let c=o!=="off",{ff:d,ss:u,sw:p,wf:v}=Ua(o);A(a,e.map(y=>[y[0],y[1],t]),d,u,p*.7);for(let y=0;y<e.length;y++){let C=e[y],k=e[(y+1)%e.length];A(a,[[C[0],C[1],t],[k[0],k[1],t],[k[0],k[1],r],[C[0],C[1],r]],v,u,p*.5)}let f=0,b=0,j=1e9,g=-1e9;e.forEach(y=>{f+=y[0],b+=y[1],j=Math.min(j,y[0]),g=Math.max(g,y[0])}),f/=e.length,b/=e.length,i.push({x:f,y:b,z:t+.2,t:n,st:o,big:g-j>14}),c&&i.push({x:f,y:b,z:r-.5,st:o,dot:!0})}function Da(a){let i={bsmt:"b",basement:"b"};return xr[a]||xr[i[a]]||xr["1f"]}function Ds(a,i){if(a[i])return i;let e={b:"bsmt",bsmt:"b"};return a[e[i]]?e[i]:i}function Ga(a,i,e,t,r,n,o){A(a,[[i,e,n],[t,e,n],[t,e,o],[i,e,o]],_.wallFill,_.wallStroke,.7),A(a,[[i,r,n],[t,r,n],[t,r,o],[i,r,o]],_.wallFillDark,_.wallStrokeDark,.7),A(a,[[i,e,n],[i,r,n],[i,r,o],[i,e,o]],_.wallFillDark,_.wallStrokeDark,.7),A(a,[[t,e,n],[t,r,n],[t,r,o],[t,e,o]],_.wallFill,_.wallStroke,.7)}function Xt(a){if(a.points&&a.points.length>=3)return a.points;let i=a.x||0,e=a.y||0,t=a.w||0,r=a.d||0;return[[i,e],[i+t,e],[i+t,e+r],[i,e+r]]}function Fs(a,i,e){let t=!1;for(let r=0,n=e.length-1;r<e.length;n=r++){let o=e[r][0],c=e[r][1],d=e[n][0],u=e[n][1];c>i!=u>i&&a<(d-o)*(i-c)/(u-c)+o&&(t=!t)}return t}function Ka(a){return(a||[]).filter(i=>i.type!=="outdoor"&&i.type!=="stairs"&&i.type!=="door")}function Os(a,i){let e=[];for(let r=0;r<a.length;r++){let n=a[r],o=a[(r+1)%a.length];(n[1]<=i&&o[1]>i||o[1]<=i&&n[1]>i)&&e.push(n[0]+(i-n[1])/(o[1]-n[1])*(o[0]-n[0]))}e.sort((r,n)=>r-n);let t=[];for(let r=0;r+1<e.length;r+=2)t.push([e[r],e[r+1]]);return t}function Fa(a){let i=Ka(a);if(!i.length)return[];let e=[];i.forEach(n=>Xt(n).forEach(o=>e.push(o[1]))),e=e.sort((n,o)=>n-o).filter((n,o,c)=>o===0||Math.abs(n-c[o-1])>.01);let t=[];for(let n=0;n<e.length-1;n++){let o=e[n],c=e[n+1],d=(o+c)/2,u=[];i.forEach(v=>Os(Xt(v),d).forEach(f=>u.push(f))),u.sort((v,f)=>v[0]-f[0]);let p=[];u.forEach(v=>{let f=p[p.length-1];f&&v[0]<=f[1]+.01?f[1]=Math.max(f[1],v[1]):p.push([v[0],v[1]])}),p.forEach(v=>t.push({x0:v[0],y0:o,x1:v[1],y1:c}))}let r=!0;for(;r;){r=!1;for(let n=0;n<t.length;n++){let o=t[n];if(o)for(let c=n+1;c<t.length;c++){let d=t[c];d&&Math.abs(o.x0-d.x0)<.01&&Math.abs(o.x1-d.x1)<.01&&(Math.abs(o.y1-d.y0)<.01||Math.abs(d.y1-o.y0)<.01)&&(o.y0=Math.min(o.y0,d.y0),o.y1=Math.max(o.y1,d.y1),t[c]=null,r=!0)}}t=t.filter(Boolean)}return t}function Ns(a,i,e,t){let r=Ka(i),n=[];r.forEach(v=>Xt(v).forEach(f=>n.push(f)));let o=(v,f,b)=>r.some(j=>j!==b&&Fs(v,f,Xt(j))),c=[];r.forEach(v=>{let f=Xt(v),b=0,j=0;f.forEach(g=>{b+=g[0],j+=g[1]}),b/=f.length,j/=f.length;for(let g=0;g<f.length;g++){let y=f[g],C=f[(g+1)%f.length],k=C[0]-y[0],S=C[1]-y[1],M=k*k+S*S;if(M<1e-6)continue;let O=[0,1];n.forEach(W=>{let ne=((W[0]-y[0])*k+(W[1]-y[1])*S)/M;ne<=.001||ne>=.999||Math.hypot(W[0]-(y[0]+k*ne),W[1]-(y[1]+S*ne))<.05&&O.push(ne)}),O.sort((W,ne)=>W-ne);let T=-S,H=k,B=Math.hypot(T,H)||1;T/=B,H/=B;let K=(y[0]+C[0])/2,N=(y[1]+C[1])/2;(K+T-b)*(K+T-b)+(N+H-j)*(N+H-j)<(K-T-b)*(K-T-b)+(N-H-j)*(N-H-j)&&(T=-T,H=-H);let ee=H<-.3;for(let W=0;W<O.length-1;W++){let ne=O[W],Je=O[W+1];if(Je-ne<.001)continue;let V=(ne+Je)/2,Pr=y[0]+k*V,bt=y[1]+S*V;o(Pr+T*1.5,bt+H*1.5,v)||c.push({a:[y[0]+k*ne,y[1]+S*ne],b:[y[0]+k*Je,y[1]+S*Je],front:ee})}}});let d=(v,f)=>Math.abs(v[0]-f[0])<.06&&Math.abs(v[1]-f[1])<.06,u=(v,f,b)=>{let j=Math.hypot(f[0]-v[0],f[1]-v[1])||1;return Math.abs(((f[0]-v[0])*(b[1]-v[1])-(f[1]-v[1])*(b[0]-v[0]))/j)<.06},p=new Array(c.length).fill(!1);for(let v=0;v<c.length;v++){if(p[v])continue;p[v]=!0;let f=c[v].a,b=c[v].b,j=c[v].front,g=!0;for(;g;){g=!1;for(let y=0;y<c.length;y++){if(p[y]||c[y].front!==j)continue;let C=c[y].a,k=c[y].b;!u(f,b,C)||!u(f,b,k)||(d(k,f)?(f=C,p[y]=!0,g=!0):d(C,f)?(f=k,p[y]=!0,g=!0):d(C,b)?(b=k,p[y]=!0,g=!0):d(k,b)&&(b=C,p[y]=!0,g=!0))}}A(a,[[f[0],f[1],e],[b[0],b[1],e],[b[0],b[1],t],[f[0],f[1],t]],j?_.wallFill:_.wallFillDark,j?_.wallStroke:_.wallStrokeDark,.7)}}function Oa(){return xr["1f"][1]}function fi(){return ie.pitch!=null?ie.pitch:1}function Is(a){return a/2*.9*Math.max(fi(),.08)}function Na(a,i,e,t,r,n,o,c){let d=t-i,u=r-e,p=Sr,v=d>=u,f=v?u:d,b=c??fi(),j=Math.max(f/2*.9*Math.max(b,.08),o||0),g=n+j;if(v){let C=(e+r)/2;return vi(a,i-p,t+p,e-p,n,C,g,_.roofFill,_.roofStroke,.85),A(a,[[i-p,r+p,n],[t+p,r+p,n],[t+p,C,g],[i-p,C,g]],_.roofFillDark,_.roofStrokeDark,.7),Pa(a,i,e,r,n,C,g,_.gableFill,_.gableStroke,.8),Pa(a,t,e,r,n,C,g,_.gableFill,_.gableStroke,.8),{axis:"x",front:e,back:r,eave:n,ridge:g,mid:C,a:i,b:t}}let y=(i+t)/2;return A(a,[[i-p,e-p,n],[i-p,r+p,n],[y,r+p,g],[y,e-p,g]],_.roofFill,_.roofStroke,.85),A(a,[[t+p,e-p,n],[t+p,r+p,n],[y,r+p,g],[y,e-p,g]],_.roofFillDark,_.roofStrokeDark,.7),A(a,[[i,e,n],[t,e,n],[y,e,g]],_.gableFill,_.gableStroke,.8),A(a,[[i,r,n],[t,r,n],[y,r,g]],_.gableFill,_.gableStroke,.8),{axis:"y",eave:n,ridge:g}}function Ia(a,i,e,t,r,n,o,c,d,u){A(a,[[i,e,0],[i,t,0],[i,t,r],[i,o,c],[i,d,u],[i,n,c],[i,e,r]],_.gableFill,_.gableStroke,.8)}function Ha(a,i,e,t,r,n,o,c,d,u){A(a,[[e,i,0],[t,i,0],[t,i,r],[o,i,c],[d,i,u],[n,i,c],[e,i,r]],_.gableFill,_.gableStroke,.8)}function Hs(a,i,e,t,r,n,o,c){let d=t-i,u=r-e,p=Sr,v=d>=u,f=v?u:d,b=c??fi(),j=Math.max(f/2*.9*Math.max(b,.08),o||0),g=n+j,y=.42,C=.64,k=n+j*C;if(v){let T=(e+r)/2,H=e+(T-e)*y,B=r-(r-T)*y;return vi(a,i-p,t+p,e-p,n,H,k,_.roofFill,_.roofStroke,.85),vi(a,i-p,t+p,H,k,T,g,_.roofFill,_.roofStroke,.85),A(a,[[i-p,r+p,n],[t+p,r+p,n],[t+p,B,k],[i-p,B,k]],_.roofFillDark,_.roofStrokeDark,.7),A(a,[[i-p,B,k],[t+p,B,k],[t+p,T,g],[i-p,T,g]],_.roofFillDark,_.roofStrokeDark,.7),Ia(a,i,e,r,n,H,B,k,T,g),Ia(a,t,e,r,n,H,B,k,T,g),{axis:"x",front:e,back:r,eave:n,ridge:g,mid:T,a:i,b:t,knuckleZ:k,knuckleFront:H,knuckleBack:B}}let S=(i+t)/2,M=i+(S-i)*y,O=t-(t-S)*y;return A(a,[[i-p,e-p,n],[i-p,r+p,n],[M,r+p,k],[M,e-p,k]],_.roofFill,_.roofStroke,.85),A(a,[[M,e-p,k],[M,r+p,k],[S,r+p,g],[S,e-p,g]],_.roofFill,_.roofStroke,.85),A(a,[[t+p,e-p,n],[t+p,r+p,n],[O,r+p,k],[O,e-p,k]],_.roofFillDark,_.roofStrokeDark,.7),A(a,[[O,e-p,k],[O,r+p,k],[S,r+p,g],[S,e-p,g]],_.roofFillDark,_.roofStrokeDark,.7),Ha(a,e,i,t,n,M,O,k,S,g),Ha(a,r,i,t,n,M,O,k,S,g),{axis:"y",eave:n,ridge:g}}function Bs(a,i,e,t,r,n,o){let c=t-i,d=r-e,u=Sr,p=Math.min(c,d),v=Math.max(Is(p),o||0),f=n+v,b=(e+r)/2,j=p/2,g=i+j,y=t-j;return y<g&&(g=y=(i+t)/2),A(a,[[i-u,e-u,n],[t+u,e-u,n],[y,b,f],[g,b,f]],_.roofFill,_.roofStroke,.85),A(a,[[i-u,r+u,n],[t+u,r+u,n],[y,b,f],[g,b,f]],_.roofFillDark,_.roofStrokeDark,.7),A(a,[[i-u,e-u,n],[i-u,r+u,n],[g,b,f]],_.roofFill,_.roofStroke,.8),A(a,[[t+u,e-u,n],[t+u,r+u,n],[y,b,f]],_.roofFillDark,_.roofStrokeDark,.7),{axis:"x",front:e,eave:n,ridge:f,mid:b,a:g,b:y}}function zs(a,i,e,t,r,n){let o=Sr*.5;return A(a,[[i-o,e-o,n],[t+o,e-o,n],[t+o,r+o,n],[i-o,r+o,n]],_.roofFill,_.roofStroke,.85),Ga(a,i-o,e-o,t+o,r+o,n,n+1),{axis:"flat",eave:n,ridge:n+1}}function wr(a,i,e,t,r,n,o){let c=n.length;if(!c||!e||e.axis!=="x"||e.a==null||e.b==null||e.mid==null||e.front==null)return;let d=e.a,u=e.b,p=e.eave,v=e.ridge,f=e.mid;e.knuckleZ!=null&&(v=e.knuckleZ,f=(r?e.knuckleBack:e.knuckleFront)??f);let b=r?e.back!=null?e.back:2*f-e.front:e.front,j=r?-1:1,g=f-b!==0?(v-p)/Math.abs(f-b):0,y=5,C=5.5;for(let k=0;k<c;k++){let S=n[k],M=d+(u-d)*S,O=b+j*1.4,T=b+j*C,H=p+Math.abs(T-b)*g,B=p+.9,K=B+3.4,N=K+1.5,ee=j*-.06;A(a,[[M-y/2,O,B],[M+y/2,O,B],[M+y/2,O,K],[M-y/2,O,K]],_.solidDark,_.wallStroke,.7),A(a,[[M-y/2,O,K],[M+y/2,O,K],[M,O,N]],_.solidDark,_.wallStroke,.7),A(a,[[M-y/2,O,B],[M-y/2,O,K],[M-y/2,T,H]],_.solidDark,_.roofStrokeDark,.55),A(a,[[M+y/2,O,B],[M+y/2,O,K],[M+y/2,T,H]],_.solidDark,_.roofStrokeDark,.55),A(a,[[M-y/2,O,K],[M,O,N],[M,T,H],[M-y/2,T,H]],_.roofFill,_.roofStroke,.6),A(a,[[M+y/2,O,K],[M,O,N],[M,T,H],[M+y/2,T,H]],_.roofFill,_.roofStroke,.6);let W=o[k]!=null?o[k]:t;Ie(a,i,O,M-1.7,M+1.7,B+.3,K-.3,W,!0,ee)}}function qs(a,i,e,t,r,n,o){let c=ie.garageBays&&ie.garageBays>0?ie.garageBays:3,d=1.8,u=t-e,p=.4,v=7.2,f=-.06,b=(u-d*(c+1))/c;if(b<=1&&(d=.6,b=(u-d*(c+1))/c),b<=0)return;let j=n==="on"||n==="dom",g=j?_.doorOn:_.doorOff,y=j?_.glassOn:_.doorStroke;for(let C=0;C<c;C++){let k=e+d+C*(b+d);if(!!(o&&o[C]&&o[C].open))A(a,[[k,r+f-.35,p],[k+b,r+f-.35,p],[k+b,r+f-.35,v-1.4],[k,r+f-.35,v-1.4]],_.doorOpenFaint,_.doorOpenStroke,.6,{cls:"door-open"}),A(a,[[k,r+f,v-1.4],[k+b,r+f,v-1.4],[k+b,r+f,v],[k,r+f,v]],_.doorOpen,_.doorOpenStroke,1,{cls:"gdoor door-open"}),i.push({p:[[k-1.2,r+f,p],[k+b+1.2,r+f,p],[k+b+1.2,r+f,v+1.2],[k-1.2,r+f,v+1.2]],f:_.doorOpenGlow});else{A(a,[[k,r+f,p],[k+b,r+f,p],[k+b,r+f,v],[k,r+f,v]],g,y,1,{cls:"gdoor"});for(let M=1;M<4;M++){let O=p+(v-p)*M/4;A(a,[[k,r+f,O],[k+b,r+f,O]],"none",y,.45)}j&&i.push({p:[[k-1.2,r+f,p],[k+b+1.2,r+f,p],[k+b+1.2,r+f,v+1.2],[k-1.2,r+f,v+1.2]],f:_.glowOn})}}}function Ba(a,i,e,t,r){let n=e-1.8,o=e+1.8,c=i,d=i+r*2.2;A(a,[[d,n,0],[d,o,0],[d,o,t],[d,n,t]],_.chimneyFill,_.chimneyStroke,.7),A(a,[[c,n,0],[d,n,0],[d,n,t],[c,n,t]],_.solidDark,_.chimneyStroke,.6),A(a,[[c,o,0],[d,o,0],[d,o,t],[c,o,t]],_.solidDark,_.dim,.5),A(a,[[c,n,t],[d,n,t],[d,o,t],[c,o,t]],_.chimneyCap,_.chimneyStroke,.5)}function Us(a,i,e,t,r){let o=i-1.3,c=i+1.3,d=e-1.3,u=e+1.3;A(a,[[c,d,t],[c,u,t],[c,u,r],[c,d,r]],_.chimneyFill,_.chimneyStroke,.7),A(a,[[o,d,t],[o,u,t],[o,u,r],[o,d,r]],_.solidDark,_.dim,.5),A(a,[[o,d,t],[c,d,t],[c,d,r],[o,d,r]],_.solidDark,_.chimneyStroke,.6),A(a,[[o,u,t],[c,u,t],[c,u,r],[o,u,r]],_.solidDark,_.dim,.5),A(a,[[o,d,r],[c,d,r],[c,u,r],[o,u,r]],_.chimneyCap,_.chimneyStroke,.5)}function ui(a,i,e,t,r,n,o){let c=Math.max(n,5.5),d=3.2,u=.2,p=o?_.doorOpen:_.doorOff,v=o?_.doorOpenStroke:_.doorStroke,f=o?"cellar-door door-open":"cellar-door",b=_.solidDark;if(e==="front"||e==="back"){let j=e==="front"?-1:1,g=r,y=r+j*c;A(a,[[t-n/2,g,d],[t,g,d],[t,y,u],[t-n/2,y,u]],p,v,.9,{cls:f}),A(a,[[t,g,d],[t+n/2,g,d],[t+n/2,y,u],[t,y,u]],p,v,.9,{cls:f}),A(a,[[t-n/2,g,0],[t-n/2,g,d],[t-n/2,y,u],[t-n/2,y,0]],b,v,.6),A(a,[[t+n/2,g,0],[t+n/2,g,d],[t+n/2,y,u],[t+n/2,y,0]],b,v,.6),A(a,[[t-n/2,y,0],[t+n/2,y,0],[t+n/2,y,u],[t-n/2,y,u]],b,v,.6)}else{let j=e==="left"?-1:1,g=t,y=t+j*c;A(a,[[g,r-n/2,d],[g,r,d],[y,r,u],[y,r-n/2,u]],p,v,.9,{cls:f}),A(a,[[g,r,d],[g,r+n/2,d],[y,r+n/2,u],[y,r,u]],p,v,.9,{cls:f}),A(a,[[g,r-n/2,0],[g,r-n/2,d],[y,r-n/2,u],[y,r-n/2,0]],b,v,.6),A(a,[[g,r+n/2,0],[g,r+n/2,d],[y,r+n/2,u],[y,r+n/2,0]],b,v,.6),A(a,[[y,r-n/2,0],[y,r+n/2,0],[y,r+n/2,u],[y,r-n/2,u]],b,v,.6)}o&&i.push({p:[[t-n/2,r,d],[t+n/2,r,d],[t+n/2,r,d+1.5],[t-n/2,r,d+1.5]],f:_.doorOpenGlow})}function Gs(a,i,e,t,r,n,o){let c=i==="front"||i==="back",d=_.casedFill,u=_.casedStroke;if(c){let p=t+(i==="front"?-.06:.06);A(a,[[e-r/2,p,n],[e+r/2,p,n],[e+r/2,p,o],[e-r/2,p,o]],d,u,.7,{cls:"cased"})}else{let p=e+(i==="left"?-.06:.06);A(a,[[p,t-r/2,n],[p,t+r/2,n],[p,t+r/2,o],[p,t-r/2,o]],d,u,.7,{cls:"cased"})}}function mi(a,i,e,t,r,n,o,c,d){let u=e==="front"||e==="back",p=d?_.doorOpen:_.doorOff,v=d?_.doorOpenStroke:_.doorStroke,f=d?"door door-open":"door",b=55*Math.PI/180;if(u){let j=e==="front"?-.06:.06,g=r+j;if(!d)A(a,[[t-n/2,g,o],[t+n/2,g,o],[t+n/2,g,c],[t-n/2,g,c]],p,v,.9,{cls:f});else{let y=e==="front"?-1:1,C=n*Math.cos(b),k=y*n*Math.sin(b);A(a,[[t-n/2,g,o],[t-n/2+C,g+k,o],[t-n/2+C,g+k,c],[t-n/2,g,c]],p,v,.9,{cls:f}),i.push({p:[[t-n/2-1,g,o],[t+n/2+1,g,o],[t+n/2+1,g+k,c+1],[t-n/2-1,g+k,c+1]],f:_.doorOpenGlow})}}else{let j=e==="left"?-.06:.06,g=t+j;if(!d)A(a,[[g,r-n/2,o],[g,r+n/2,o],[g,r+n/2,c],[g,r-n/2,c]],p,v,.9,{cls:f});else{let y=e==="left"?-1:1,C=y*n*Math.sin(b),k=n*Math.cos(b);A(a,[[g,r-n/2,o],[g+C,r-n/2+k,o],[g+C,r-n/2+k,c],[g,r-n/2,c]],p,v,.9,{cls:f}),i.push({p:[[g,r-n/2-1,o],[g+C,r+n/2+1,o],[g+C,r+n/2+1,c+1],[g,r-n/2-1,c+1]],f:_.doorOpenGlow})}}}function hi(a){let i=null;return(a||[]).forEach(e=>{i?(i.x0=Math.min(i.x0,e.x),i.y0=Math.min(i.y0,e.y),i.x1=Math.max(i.x1,e.x+e.w),i.y1=Math.max(i.y1,e.y+e.d)):i={x0:e.x,y0:e.y,x1:e.x+e.w,y1:e.y+e.d}}),i}function Ks(a,i,e,t,r,n,o){let c=a.lit||{},d=[],u=[],p=[],v=w=>{let L=c[String(w).toLowerCase()];return L==="dom"?"dom":L?"on":"off"},f=ie.stories!=null?ie.stories:1.5,b=!!(i["2f"]&&i["2f"].length),j=ie.roof||"gable",g=j!=="flat"&&f<2&&b,y=g?Oa():o,C=g?o-y+2.5:0,k=a.elements||{};(i["1f"]||[]).length?Ns(d,i["1f"],0,y):Ga(d,e,t,r,n,0,y);let S=1.5,M=3,O=3,T=7,H=null;(i["1f"]||[]).forEach(w=>{String(w.name).toLowerCase().indexOf("garage")>=0&&!H&&(H=w)});let B=H,K=(w,L,U)=>{let X="off";return(w||[]).forEach(q=>{if(L>=q.x-1&&L<=q.x+q.w+1&&U>=q.y-1&&U<=q.y+q.d+1){let P=v(q.name);P==="dom"?X="dom":P==="on"&&X!=="dom"&&(X="on")}}),X},N=(w,L)=>K(i["1f"],w,L),ee=(w,L)=>K(i["2f"],w,L),W=(w,L)=>w==="front"?[e+L*(r-e),t]:w==="back"?[e+L*(r-e),n]:w==="left"?[e,t+L*(n-t)]:[r,t+L*(n-t)],ne=w=>w.type==="window"||w.type==="door"&&w.kind!=="interior"&&w.kind!=="cased",Je=(k["1f"]||[]).filter(ne);if(Je.length?Je.forEach(w=>{let L=w.pos!=null?w.pos:.5,U=w.w||4,X=w.wall==="front"||w.wall==="back",[q,P]=W(w.wall,L);if(w.type==="window"){let re=N(q,P);X?Ie(d,u,P,q-U/2,q+U/2,O,T,re,!0,w.wall==="front"?-.06:.06):Ze(d,u,q,P-U/2,P+U/2,O,T,re,!0,w.wall==="left"?-.06:.06)}else w.kind==="cellar"?ui(d,u,w.wall,q,P,Math.max(U,5),w.open):mi(d,u,w.wall,q,P,Math.max(U,3),.4,6.8,w.open)}):(i["1f"]||[]).forEach(w=>{if(String(w.name).toLowerCase().indexOf("garage")>=0||w.type&&w.type!=="room"&&w.type!=="bath")return;let L=w.x,U=w.x+w.w,X=w.y,q=w.y+w.d,P=v(w.name);U-L<6||q-X<6||(Math.abs(X-t)<S&&Ie(d,u,t,L+M,U-M,O,T,P,!0,-.06),Math.abs(q-n)<S&&Ie(d,u,n,L+M,U-M,O,T,P,!0,.06),Math.abs(L-e)<S&&Ze(d,u,e,X+M,q-M,O,T,P,!0,-.06),Math.abs(U-r)<S&&Ze(d,u,r,X+M,q-M,O,T,P,!0,.06))}),B){let w=B,L=Math.abs(w.y-t)<S?t:Math.abs(w.y+w.d-n)<S?n:w.y;qs(d,u,w.x+.5,w.x+w.w-.5,L,v(w.name),a.garage)}let V,Pr=(j==="gable"||j==="gambrel")&&B&&B.w>8,bt=w=>j==="gambrel"?Hs(d,w.x0,w.y0,w.x1,w.y1,y,C):Na(d,w.x0,w.y0,w.x1,w.y1,y,C),ki=(w,L)=>(L.x1-L.x0)*(L.y1-L.y0)-(w.x1-w.x0)*(w.y1-w.y0);if(j==="flat")V=zs(d,e,t,r,n,o);else if(j==="hip")V=Bs(d,e,t,r,n,y,C);else if(Pr&&B){let w=(i["1f"]||[]).filter(P=>P!==B&&P.type!=="outdoor"&&P.type!=="stairs"&&P.type!=="door"),L=hi(w),U=0;w.forEach(P=>U+=P.w*P.d);let X=L?(L.x1-L.x0)*(L.y1-L.y0):0;!L||X<=0||U/X>=.85?L&&(V=bt(L)):Fa(w).sort(ki).forEach((re,Pe)=>{let Ot=bt(re);Pe===0&&(V=Ot)}),Na(d,B.x,B.y,B.x+B.w,B.y+B.d,Oa(),0,.2)}else{let w=Fa(i["1f"]||[]);w.length>1?w.sort(ki).forEach((L,U)=>{let X=bt(L);U===0&&(V=X)}):V=bt({x0:e,y0:t,x1:r,y1:n})}let st="off";if((i["2f"]||[]).forEach(w=>{let L=v(w.name);L==="dom"?st="dom":L==="on"&&st!=="dom"&&(st="on")}),j!=="flat"&&V){let w=V,L=(k["2f"]||[]).filter(P=>P.type==="dormer"&&P.slope!=="rear"),U=(k["2f"]||[]).filter(P=>P.type==="dormer"&&P.slope==="rear"),X=P=>{if(w.a==null||w.b==null)return"off";let re=w.a+(w.b-w.a)*P,Pe=(i["2f"]||[]).filter(Ot=>re>=Ot.x&&re<=Ot.x+Ot.w)[0];return Pe?v(Pe.name):"off"},q=P=>{let re=[];for(let Pe=0;Pe<P;Pe++)re.push((Pe+1)/(P+1));return re};if(L.length){let P=L.map(re=>re.pos!=null?re.pos:.5);wr(d,u,w,st,!1,P,P.map(X))}else if(ie.dormersFront){let P=q(ie.dormersFront);wr(d,u,w,st,!1,P,P.map(X))}if(U.length){let P=U.map(re=>re.pos!=null?re.pos:.5);wr(d,u,w,st,!0,P,P.map(X))}else if(ie.dormersRear){let P=q(ie.dormersRear);wr(d,u,w,st,!0,P,P.map(X))}}let oe=hi(i["2f"])||{x0:e,y0:t,x1:r,y1:n},Wn=(oe.y0+oe.y1)/2,Vn=Math.max((oe.y1-oe.y0)/2,.1),Yn=y+(C||0);(k["2f"]||[]).filter(w=>w.type==="window").forEach(w=>{let L=w.pos!=null?w.pos:.5,U=w.w||4;if(w.wall==="left"||w.wall==="right"){let X=w.wall==="left"?oe.x0-e<3?e:oe.x0:r-oe.x1<3?r:oe.x1,q=oe.y0+L*(oe.y1-oe.y0),P=y+(1-Math.min(1,Math.abs(q-Wn)/Vn))*(Yn-y),re=Math.min(15,P-.5),Pe=Math.max(re-2.8,10.2);Ze(d,u,X,q-U/2,q+U/2,Pe,re,ee(X,q),!0,w.wall==="left"?-.06:.06)}else{let X=oe.x0+L*(oe.x1-oe.x0),q=w.wall==="front"?oe.y0+3.5:oe.y1-3.5;Ie(d,u,q,X-U/2,X+U/2,10.8,13.8,ee(X,q),!0,w.wall==="front"?-.3:.3)}});let se=hi(i.bsmt),Dr=(k.bsmt||[]).filter(ne);se&&Dr.length&&Dr.forEach(w=>{let L=w.pos!=null?w.pos:.5,U=w.w||4,X=w.wall==="front"||w.wall==="back",q,P;w.wall==="front"?(q=se.x0+L*(se.x1-se.x0),P=t):w.wall==="back"?(q=se.x0+L*(se.x1-se.x0),P=n):w.wall==="left"?(q=se.x0-e<3?e:se.x0,P=se.y0+L*(se.y1-se.y0)):(q=r-se.x1<3?r:se.x1,P=se.y0+L*(se.y1-se.y0)),w.type==="window"?X?Ie(d,u,P,q-U/2,q+U/2,.6,3.4,"off",!0,w.wall==="front"?-.06:.06):Ze(d,u,q,P-U/2,P+U/2,.6,3.4,"off",!0,w.wall==="left"?-.06:.06):w.kind==="cellar"?ui(d,u,w.wall,q,P,Math.max(U,5),w.open):mi(d,u,w.wall,q,P,Math.max(U,3),.3,6.4,w.open)}),ie.basementEntrance!=="interior"&&!Je.length&&!Dr.length&&i.bsmt&&i.bsmt.length&&ui(d,u,"back",(e+r)/2,n,6,!1);let Fr=ie.chimney,rr=(t+n)/2,_t=Math.max(1,Math.min(4,Math.round(ie.chimneyCount||1))),Si=V&&V.ridge!=null?V.ridge:o,Ft=w=>(w+1)/(_t+1);if(Fr==="center")for(let w=0;w<_t;w++){let L,U;V&&V.axis==="x"&&V.a!=null&&V.b!=null?(L=V.a+(V.b-V.a)*Ft(w),U=V.mid!=null?V.mid:rr):V&&V.axis==="y"?(L=(e+r)/2,U=t+(n-t)*Ft(w)):(L=e+(r-e)*Ft(w),U=rr),Us(d,L,U,Si-1.5,Si+4)}else if(Fr==="left"&&V&&V.ridge)for(let w=0;w<_t;w++)Ba(d,e,_t===1?rr:t+(n-t)*Ft(w),V.ridge+4,-1);else if(Fr==="right"&&V&&V.ridge)for(let w=0;w<_t;w++)Ba(d,r,_t===1?rr:t+(n-t)*Ft(w),V.ridge+4,1);return{faces:d,glow:u,labels:p}}function jr(a,i){let e=String(i||"").toLowerCase();return(a||[]).filter(t=>String(t.name).toLowerCase()===e)[0]}function $r(a,i,e){let t=a.x,r=a.y,n=a.x+a.w,o=a.y+a.d;return i==="front"?[t+e*(n-t),r]:i==="back"?[t+e*(n-t),o]:i==="left"?[t,r+e*(o-r)]:[n,r+e*(o-r)]}function Ws(a){let i=a.plan||{},e=a.lit||{},t=a.floor||"all",r=[],n=[],o=[],c=b=>{let j=e[String(b).toLowerCase()];return j==="dom"?"dom":j==="mmwave"?"mmwave":j?"on":"off"},d=1e9,u=1e9,p=-1e9,v=-1e9,f=-1e9;if(Object.keys(i).forEach(b=>{let j=Da(b);b!=="b"&&b!=="bsmt"&&j[1]>f&&(f=j[1]),(i[b]||[]).forEach(g=>{g.x<d&&(d=g.x),g.y<u&&(u=g.y),g.x+g.w>p&&(p=g.x+g.w),g.y+g.d>v&&(v=g.y+g.d)})}),d>p&&(d=0,u=0,p=63,v=24),f<0&&(f=za),Tt=[(d+p)/2,(u+v)/2,9*.5],t!=="all"){let b=Ds(i,t),j=Da(b),g=i[b]||[];g.forEach(S=>{S.points&&S.points.length>=3?Ps(r,o,S.points,j[0],j[1],S.label||S.name,c(S.name)):Ls(r,o,S.x,S.y,S.w,S.d,j[0],j[1],S.label||S.name,c(S.name))});let y=a.elements&&a.elements[b]||[],C=j[0]+.3,k=Math.min(j[0]+7,j[1]-.2);return y.filter(S=>S.type==="door"&&S.kind==="interior").forEach(S=>{let M=jr(g,S.room);if(!M)return;let[O,T]=$r(M,S.wall,S.pos!=null?S.pos:.5);mi(r,n,S.wall,O,T,Math.max(S.w||3,3),C,k,S.open)}),y.filter(S=>S.type==="door"&&S.kind==="cased").forEach(S=>{let M=jr(g,S.room);if(!M)return;let[O,T]=$r(M,S.wall,S.pos!=null?S.pos:.5);Gs(r,S.wall,O,T,Math.max(S.w||3,3),C,k)}),y.filter(S=>S.type==="window"&&S.kind==="interior").forEach(S=>{let M=jr(g,S.room);if(!M)return;let O=S.pos!=null?S.pos:.5,T=Math.max(S.w||3,2),H=j[0]+2.5,B=Math.min(j[0]+6.5,j[1]-.4),[K,N]=$r(M,S.wall,O);S.wall==="front"?Ie(r,n,N,K-T/2,K+T/2,H,B,"off",!0,-.06):S.wall==="back"?Ie(r,n,N,K-T/2,K+T/2,H,B,"off",!0,.06):S.wall==="left"?Ze(r,n,K,N-T/2,N+T/2,H,B,"off",!0,-.06):Ze(r,n,K,N-T/2,N+T/2,H,B,"off",!0,.06)}),y.filter(S=>S.type==="door"&&S.kind==="french").forEach(S=>{let M=jr(g,S.room);if(!M)return;let O=S.pos!=null?S.pos:.5,T=Math.max(S.w||4,3),H=S.open?"on":"off",[B,K]=$r(M,S.wall,O);S.wall==="front"?Ie(r,n,K,B-T/2,B+T/2,C,k,H,!0,-.07,2):S.wall==="back"?Ie(r,n,K,B-T/2,B+T/2,C,k,H,!0,.07,2):S.wall==="left"?Ze(r,n,B,K-T/2,K+T/2,C,k,H,!0,-.07):Ze(r,n,B,K-T/2,K+T/2,C,k,H,!0,.07)}),{faces:r,glow:n,labels:o}}return Ks(a,i,d,u,p,v,f)}function Wa(a){return _=a.palette,Ms(a.spec),Ws(a)}function pi(a){return String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Vs(a){return a.replace(/[^A-Za-z0-9_-]/g,"")}function Va(a){let i=a.theta==null?35:a.theta,e=Wa(a),t=e.faces,r=e.glow,n=e.labels||[];t.sort((N,ee)=>La(ee,i)-La(N,i));let o=1e9,c=1e9,d=-1e9,u=-1e9,p=t.concat(r);for(let N of p)for(let ee of N.p){let W=Yt(ee,i);W[0]<o&&(o=W[0]),W[0]>d&&(d=W[0]),W[1]<c&&(c=W[1]),W[1]>u&&(u=W[1])}let v=40,f,b,j,g;a.box?[f,b,j,g]=a.box:(f=o-v,b=c-v,j=d-o+2*v,g=u-c+2*v);let y=`${f.toFixed(1)} ${b.toFixed(1)} ${j.toFixed(1)} ${g.toFixed(1)}`,C=N=>N.map(ee=>{let W=Yt(ee,i);return`${W[0].toFixed(1)},${W[1].toFixed(1)}`}).join(" "),k=Vs(a.idPrefix||"j3d"),S=`${k}-glow`,M=`${k}-bg`,O=`${k}-sh`,T=N=>pi(N),H="";H+=`<defs><filter id="${S}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter><radialGradient id="${M}" cx="50%" cy="40%" r="65%"><stop offset="0%" style="stop-color:${T(_.bgGlow)}"/><stop offset="100%" style="stop-color:${T(_.bgGlow)};stop-opacity:0"/></radialGradient><radialGradient id="${O}" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:${T(_.shadow)}"/><stop offset="100%" style="stop-color:${T(_.shadow)};stop-opacity:0"/></radialGradient></defs>`,H+=`<rect x="${f.toFixed(1)}" y="${b.toFixed(1)}" width="${j.toFixed(1)}" height="${g.toFixed(1)}" fill="url(#${M})"/>`;let B=Yt([Tt[0],Tt[1],0],i);H+=`<ellipse cx="${B[0].toFixed(1)}" cy="${(u+v*.2).toFixed(1)}" rx="${((d-o)*.42).toFixed(1)}" ry="20" fill="url(#${O})"/>`;for(let N of r)H+=`<polygon points="${C(N.p)}" style="fill:${T(N.f)}" filter="url(#${S})"/>`;for(let N of t){let ee=N.f!=="none";H+=`<poly${ee?"gon":"line"} points="${C(N.p)}"${N.cls?` class="${pi(N.cls)}"`:""} style="fill:${ee?T(N.f):"none"};stroke:${T(N.s)}" stroke-width="${N.w}" stroke-linejoin="round" stroke-linecap="round"/>`}let K=a.animate!==!1;for(let N of n){let ee=Yt([N.x,N.y,N.z],i);if(N.dot){let W=N.st==="dom"?_.dotDom:N.st==="mmwave"?_.dotMmwave:_.dotOn;H+=`<circle cx="${ee[0].toFixed(1)}" cy="${ee[1].toFixed(1)}" r="2.4" style="fill:${T(W)}">`+(K?'<animate attributeName="opacity" values="0.35;1;0.35" dur="2s" repeatCount="indefinite"/>':"")+"</circle>"}else{let W=N.st==="dom"?_.textDom:N.st==="mmwave"?_.textMmwave:N.st==="on"?_.textOn:_.textOff,ne=N.small?6:N.big?9:7.5;H+=`<text x="${ee[0].toFixed(1)}" y="${ee[1].toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="${ne}" font-weight="600" letter-spacing="0.8" paint-order="stroke" stroke-width="0.8" stroke-linejoin="round" style="fill:${T(W)};stroke:${T(_.textHalo)}">${pi(N.t||"")}</text>`}}return`<svg xmlns="http://www.w3.org/2000/svg" width="${j.toFixed(0)}" height="${g.toFixed(0)}" viewBox="${y}" role="presentation" focusable="false">${H}</svg>`}function Ya(a){let i=Wa(a),e=i.faces.concat(i.glow),t=1e9,r=1e9,n=-1e9,o=-1e9;for(let d=0;d<360;d+=15)for(let u of e)for(let p of u.p){let v=Yt(p,d);v[0]<t&&(t=v[0]),v[0]>n&&(n=v[0]),v[1]<r&&(r=v[1]),v[1]>o&&(o=v[1])}let c=46;return[t-c,r-c,n-t+2*c,o-r+2*c]}var bi=["--jv-surface","--jv-text","--jv-text-2","--jv-accent","--jv-ok","--jv-warn"],Ys=/^[\w\s#(),.%/+-]+$/;function Xs(a){return a.length>0&&a.length<=200&&Ys.test(a)}var G=(a,i)=>`color-mix(in srgb, ${a} ${i}%, transparent)`,He=(a,i,e)=>`color-mix(in srgb, ${a} ${i}%, ${e})`,Xa="",gi=null;function Za(a){let i=null;try{i=typeof getComputedStyle=="function"?getComputedStyle(a):null}catch{i=null}let e={};for(let t of bi){let r="";try{r=i?i.getPropertyValue(t).trim():""}catch{r=""}e[t]=Xs(r)?r:`var(${t})`}return e}function Qa(a){let i=Za(a),e=bi.map(p=>i[p]).join("|");if(gi&&e===Xa)return gi;let t=i["--jv-surface"],r=i["--jv-text"],n=i["--jv-text-2"],o=i["--jv-accent"],c=i["--jv-ok"],d=i["--jv-warn"],u={wallFill:He(r,5,t),wallStroke:G(r,55),wallFillDark:He(r,14,t),wallStrokeDark:G(r,40),roofFill:He(r,24,t),roofStroke:G(r,60),roofFillDark:He(r,36,t),roofStrokeDark:G(r,45),gableFill:He(r,9,t),gableStroke:G(r,50),chimneyFill:He(r,40,t),chimneyStroke:G(r,55),chimneyCap:G(r,12),solidDark:He(r,30,t),voidDark:He(r,70,t),doorOff:G(o,12),doorOn:G(o,35),doorStroke:G(o,75),doorOpen:G(d,40),doorOpenStroke:d,doorOpenGlow:G(d,45),doorOpenFaint:G(d,14),winOff:G(o,10),winOn:G(o,75),winDom:G(c,85),glassOff:G(o,45),glassOn:o,glassDom:c,edge:G(r,50),dim:G(r,28),faint:G(r,14),glowOn:G(o,50),glowDom:G(c,55),casedFill:G(n,12),casedStroke:G(n,80),roomFillOff:G(o,5),roomFillOn:G(o,16),roomFillMmwave:G(c,24),roomFillDom:G(c,16),roomStrokeOff:G(r,30),roomStrokeOn:G(o,70),roomStrokeMmwave:c,roomStrokeDom:G(c,90),roomWallOff:G(r,3),roomWallOn:G(o,6),roomWallMmwave:G(c,10),roomWallDom:G(c,6),dotOn:o,dotMmwave:c,dotDom:c,textOff:n,textOn:r,textMmwave:He(c,55,r),textDom:He(c,55,r),textHalo:t,bgGlow:G(o,8),shadow:G(r,22)};return Xa=e,gi=u,u}function Ja(a){let i=Za(a);return bi.map(e=>i[e]).join("|")}var en=R`
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
`;var Zt=[{id:"cape_cod",label:"Cape Cod",roof:"gable",pitch:1,dormersFront:2,dormersRear:1},{id:"colonial",label:"Colonial",roof:"gable",pitch:.7,dormersFront:0,dormersRear:0},{id:"dutch_colonial",label:"Dutch Colonial",roof:"gambrel",pitch:.6,dormersFront:2,dormersRear:1},{id:"ranch",label:"Ranch",roof:"hip",pitch:.5,dormersFront:0,dormersRear:0},{id:"two_story",label:"Two-Story",roof:"gable",pitch:.65,dormersFront:0,dormersRear:0},{id:"craftsman",label:"Craftsman",roof:"hip",pitch:.6,dormersFront:1,dormersRear:0},{id:"modern",label:"Modern",roof:"flat",pitch:.12,dormersFront:0,dormersRear:0},{id:"townhouse",label:"Townhouse",roof:"gable",pitch:.85,dormersFront:0,dormersRear:0},{id:"apartment",label:"Apartment",roof:"flat",pitch:.12,dormersFront:0,dormersRear:0},{id:"cabin",label:"Cabin",roof:"gable",pitch:1.25,dormersFront:2,dormersRear:1}];function Rt(a){return Zt.find(i=>i.id===a)||Zt[0]}var Zs={"1f":{label:"1st Floor",rooms:[{name:"Garage",x:5,y:5,w:100,h:88,type:"room"},{name:"Kitchen",x:115,y:5,w:65,h:40,type:"room"},{name:"Bath",x:185,y:5,w:28,h:22,type:"bath"},{name:"Guest Room",x:218,y:5,w:95,h:40,type:"room"},{name:"Dining Room",x:115,y:50,w:65,h:38,type:"room"},{name:"Stairs",x:185,y:32,w:28,h:32,type:"stairs"},{name:"Living Room",x:218,y:50,w:95,h:38,type:"room"},{name:"Downstairs Hallway",x:115,y:93,w:198,h:20,type:"room"},{name:"Front Door",x:185,y:117,w:50,h:12,type:"door"}]},"2f":{label:"2nd Floor",rooms:[{name:"Eliana's Room",x:50,y:25,w:95,h:80,type:"room"},{name:"Bath",x:150,y:25,w:30,h:40,type:"bath"},{name:"Master Bedroom",x:185,y:25,w:85,h:80,type:"room"},{name:"Upstairs Hallway",x:150,y:70,w:30,h:35,type:"room"},{name:"Stairs",x:150,y:108,w:25,h:20,type:"stairs"}]},bsmt:{label:"Basement",rooms:[{name:"Basement",x:50,y:10,w:220,h:90,type:"room"},{name:"Stairs",x:120,y:20,w:28,h:35,type:"stairs"}]}},pt=.2;function Re(a){if(a===""||a==null)return null;let i=Number(a);return Number.isFinite(i)?i:null}function rn(a){if(typeof a=="string"){if(!a.trim())return null;try{return JSON.parse(a)}catch{return null}}return a}function an(a){let i=rn(a);return i&&typeof i=="object"&&!Array.isArray(i)&&Object.keys(i).length?{plan:i,configured:!0}:{plan:Zs,configured:!1}}function nn(a){let i=rn(a);return i&&typeof i=="object"&&!Array.isArray(i)?i:{}}function tn(a,i){let e=a.slice().sort((o,c)=>o-c),t=[],r=null;for(let o of e)r&&o-r.start<=i?r.vals.push(o):(r={vals:[o],start:o},t.push(r));let n=t.map(o=>o.vals.reduce((c,d)=>c+d,0)/o.vals.length);return o=>{let c=o,d=i+1e-6;for(let u of n){let p=Math.abs(o-u);p<d&&(d=p,c=u)}return c}}function Qs(a){for(let e of Object.keys(a)){let t=a[e]||[];if(t.length<2)continue;let r=[],n=[];t.forEach(d=>{r.push(d.x,d.x+d.w),n.push(d.y,d.y+d.d),d.points?.forEach(u=>{r.push(u[0]),n.push(u[1])})});let o=tn(r,1),c=tn(n,1);t.forEach(d=>{let u=o(d.x),p=o(d.x+d.w),v=c(d.y),f=c(d.y+d.d);d.x=u,d.w=p-u,d.y=v,d.d=f-v,d.points&&(d.points=d.points.map(b=>[o(b[0]),c(b[1])]))})}return a}function sn(a){let i={};for(let e of Object.keys(a||{})){let t=Array.isArray(a[e]?.rooms)?a[e].rooms:[];i[e]=t.filter(r=>r&&r.type!=="outdoor").map(r=>({name:String(r.name||"").toLowerCase(),label:String(r.name||"").toUpperCase(),x:(Number(r.x)||0)*pt,y:(Number(r.y)||0)*pt,w:(Number(r.w)||0)*pt,d:(Number(r.h)||0)*pt,type:r.type,points:Array.isArray(r.points)&&r.points.length>=3?r.points.map(n=>[n[0]*pt,n[1]*pt]):void 0}))}return Qs(i)}function on(a,i){if(!i||typeof i!="string")return!1;let e=a?.states?.[i]?.state;return e==="on"||e==="open"}function ln(a,i){let e={};for(let t of Object.keys(a||{})){let r=Array.isArray(a[t])?a[t]:[];e[t]=r.map(n=>({type:n.type,kind:n.kind,wall:n.wall,room:n.room,slope:n.slope,pos:n.pos!=null?Number(n.pos):.5,w:(Number(n.w)||20)*pt,open:on(i,n.entity)}))}return e}function cn(a,i){let e=a.door_mapping&&typeof a.door_mapping=="object"?a.door_mapping:{},t=Math.max(0,Math.min(Number(a.garage_bays)||0,8)),r=[];for(let n=1;n<=t;n++){let o=e[`garage_${n}`]||n===1&&e.garage||"";r.push({open:on(i,o)})}return r}function dn(a){let i=Rt(a.residence_style),e=Re(a.dormers_front),t=Re(a.dormers_rear),r=Re(a.home_stories),n={roof:i.roof,stories:r??1.5,pitch:i.pitch,dormersFront:e??i.dormersFront,dormersRear:t??i.dormersRear,chimneyCount:Math.max(1,Math.min(4,Re(a.chimney_count)||1)),basementEntrance:a.basement_entrance==="interior"?"interior":"bulkhead"},o=Re(a.garage_bays);o!=null&&(n.garageBays=o);let c=a.chimney_side;return(c==="right"||c==="left"||c==="center"||c==="none")&&(n.chimney=c),n}function un(a,i){let e={};for(let r of a?.areas||[])r.active&&(e[String(r.name).toLowerCase()]="on");for(let r of i?.rooms||[])r.detecting_count>0&&(e[String(r.name).toLowerCase()]="mmwave");let t=a?.dominant;return t&&t.name&&t.area_id&&(e[String(t.name).toLowerCase()]="dom"),e}function hn(a,i){let e=Re(a.floor_plan_sqft);if(e)return e;let t=0;for(let r of Object.keys(i||{}))for(let n of i[r]?.rooms||[])n.type==="door"||n.type==="stairs"||(t+=(Number(n.w)||0)*(Number(n.h)||0));return t?Math.min(5e3,Math.max(600,Math.round(t*.032/50)*50)):null}var Js=[{label:"FRONT",theta:0},{label:"RIGHT",theta:90},{label:"REAR",theta:180},{label:"LEFT",theta:270},{label:"ISO",theta:35}],eo="https://github.com/sam3gp8/jarvis-aio/blob/main/docs/floor-plan-import.md",_i=26,pn=2*Math.PI*_i,fe=class extends te{constructor(){super(...arguments);this._floor="all";this._preset=35;this._dragging=!1;this._mm=null;this._mmLoading=!1;this._mmError=null;this._styleBusy=!1;this._styleOverride=null;this._styleError=null;this._theta=35;this._raf=0;this._drag=null;this._plan={};this._editorPlan={};this._planJson="";this._planConfigured=!0;this._boxKey="";this._svgKey="";this._svg="";this._mq=[];this._onMq=()=>this.requestUpdate()}connectedCallback(){if(super.connectedCallback(),z(this,["ha-select","ha-list-item","ha-alert","ha-icon"]),typeof matchMedia=="function"){this._mq=[matchMedia("(prefers-color-scheme: dark)"),matchMedia("(prefers-reduced-motion: reduce)")];for(let e of this._mq)e.addEventListener?.("change",this._onMq)}}disconnectedCallback(){super.disconnectedCallback();for(let e of this._mq)e.removeEventListener?.("change",this._onMq);this._mq=[],this._raf&&cancelAnimationFrame(this._raf),this._raf=0}willUpdate(e){if(e.has("data")){let t=this.data?.config||{},{plan:r,configured:n}=an(t.floor_plan_rooms);this._editorPlan=r,this._planConfigured=n,this._plan=sn(r),this._planJson=JSON.stringify(this._plan),this._styleBusy||(this._styleOverride=null),this._floor!=="all"&&!this._floorAvailable(this._floor)&&(this._floor="all")}}updated(e){e.has("data")&&this.data&&this.hass?this._fetchMmwave():e.has("hass")&&this.hass&&this.data&&!this._mm&&!this._mmLoading&&this._fetchMmwave()}async _fetchMmwave(){if(!this._mmLoading){this._mmLoading=!0;try{let e=await this.ws("jarvis/mmwave_overview");this._mm={rooms:Array.isArray(e?.rooms)?e.rooms:[],summary:e?.summary||{rooms_with_mmwave:0,rooms_detecting:0,total_sensors:0}},this._mmError=null}catch(e){this._mmError=Q.from("jarvis/mmwave_overview",e).message}finally{this._mmLoading=!1}}}get _config(){return this.data?.config||{}}get _styleId(){return this._styleOverride??Rt(this._config.residence_style).id}_floorAvailable(e){if(e==="all")return!0;let t=this._config;return e==="2f"&&String(t.home_stories??"1.5")==="1"||e==="bsmt"&&t.has_basement===!1?!1:(this._plan[e]||[]).length>0}_reducedMotion(){try{return typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches}catch{return!1}}_sceneSvg(){let e={...this._config,residence_style:this._styleId},t=dn(e),r=ln(nn(e.floor_plan_elements),this.hass),n=cn(e,this.hass),o=this._floor==="bsmt"?"b":this._floor,c=Qa(this),d=JSON.stringify(t)+"|"+JSON.stringify(r)+"|"+JSON.stringify(n),u=o+"|"+d+"|"+this._planJson;u!==this._boxKey&&(this._box=Ya({floor:o,spec:t,plan:this._plan,elements:r,garage:n,palette:c}),this._boxKey=u);let p=un(this.data,this._mm),v=!this._reducedMotion(),f=[this._theta.toFixed(1),u,JSON.stringify(p),Ja(this),v].join("|");return f!==this._svgKey&&(this._svg=Va({theta:this._theta,floor:o,lit:p,box:this._box,spec:t,plan:this._plan,elements:r,garage:n,palette:c,idPrefix:"j3d",animate:v}),this._svgKey=f),this._svg}_setFloor(e){this._floor=e}_setPreset(e){this._theta=e,this._preset=e,this.requestUpdate()}_rotateBy(e){this._theta-=e,this._preset=null,this._raf||(this._raf=requestAnimationFrame(()=>{this._raf=0,this.requestUpdate()}))}_onPointerDown(e){if(e.pointerType==="mouse"&&e.button!==0)return;this._drag={id:e.pointerId,x:e.clientX},this._dragging=!0;let t=e.currentTarget;try{t?.setPointerCapture?.(e.pointerId)}catch{}}_onPointerMove(e){if(!this._drag||e.pointerId!==this._drag.id)return;let t=e.clientX-this._drag.x;this._drag.x=e.clientX,t&&this._rotateBy(t*.5)}_onPointerUp(e){!this._drag||e.pointerId!==this._drag.id||(this._drag=null,this._dragging=!1)}_onSceneKey(e){if(e.key==="ArrowLeft")this._rotateBy(-15);else if(e.key==="ArrowRight")this._rotateBy(15);else if(e.key==="Home")this._setPreset(35);else return;e.preventDefault()}async _onStyleChange(e){let t=Rt(e).id;if(!e||t===this._styleId||this._styleBusy)return;let r=this._styleId;this._styleOverride=t,this._styleBusy=!0,this._styleError=null;try{await this.ws("jarvis/update_config",{key:"residence_style",value:t}),this._toast(s("Home style → {label}",{label:s(Rt(t).label)})),this.refresh()}catch(n){this._styleOverride=r,this._styleError=`residence_style — ${Q.from("jarvis/update_config",n).message}`}finally{this._styleBusy=!1}}_toast(e){this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:e}}))}render(){return this.data?l`
      <div class="res">
        ${this._renderOverview()}
        ${this._renderMmwave()}
      </div>
    `:l`
        <div class="res">
          <jv-section .heading=${s("Residence Overview")} icon="mdi:floor-plan" loading>
            <jv-empty kind="loading" .message=${s("Loading...")}></jv-empty>
          </jv-section>
          <jv-section .heading=${s("mmWave Presence")} icon="mdi:motion-sensor" loading>
            <jv-empty kind="loading" .message=${s("Reading sensors…")}></jv-empty>
          </jv-section>
        </div>
      `}_renderOverview(){let e=this.data?.areas||[],t=e.filter(n=>n.active).length,r=e.length;return l`
      <jv-section .heading=${s("Residence Overview")} icon="mdi:floor-plan">
        <jv-state-badge slot="actions" level=${t>0?"ok":"neutral"} .label=${`${t}/${r} ${s("OCCUPIED")}`}></jv-state-badge>
        <div class="wrap">
        ${this._styleError?l`<div class="err" role="alert">✗ ${this._styleError}</div>`:m}
        <div class="controls">
          ${this._renderStyleSelect()}
          <fieldset class="seg" aria-label=${s("Floor")}>
            ${["all","1f","2f","bsmt"].filter(n=>this._floorAvailable(n)).map(n=>l`<button type="button" class="jv-hit" aria-pressed=${String(this._floor===n)} @click=${()=>this._setFloor(n)}>${s(to[n])}</button>`)}
          </fieldset>
          <fieldset class="seg" aria-label=${s("View")}>
            ${Js.map(n=>l`<button type="button" class="jv-hit" aria-pressed=${String(this._preset===n.theta)} @click=${()=>this._setPreset(n.theta)}>${s(n.label)}</button>`)}
          </fieldset>
          <span class="hint" aria-hidden="true">${s("drag to rotate")}</span>
          <span class="visually-hidden" id="drag-hint">${s("Drag with the pointer or use the left and right arrow keys to rotate the model; Home resets the view.")}</span>
        </div>
        ${this._renderScene()}
        ${this._planConfigured?m:l`<p class="planhint">
              <span>${s("No floor plan yet — the model shows a sample home. Import your plan to see your rooms.")}</span>
              <a href=${eo} target="_blank" rel="noopener noreferrer">${s("Import a floor plan")}</a>
            </p>`}
        ${this._renderDominant()}
        </div>
      </jv-section>
    `}_renderStyleSelect(){let e=this._styleId,t=s("HOME STYLE");return E("ha-select")&&E("ha-list-item")?l`
        <ha-select
          .label=${t}
          .value=${e}
          .disabled=${this._styleBusy}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${r=>this._onStyleChange(String(r.target.value))}
          @closed=${r=>r.stopPropagation()}
        >
          ${Zt.map(r=>l`<ha-list-item .value=${r.id}>${s(r.label)}</ha-list-item>`)}
        </ha-select>
      `:l`
      <label class="field">
        <span>${t}</span>
        <select .value=${e} ?disabled=${this._styleBusy} @change=${r=>this._onStyleChange(r.target.value)}>
          ${Zt.map(r=>l`<option value=${r.id} ?selected=${r.id===e}>${s(r.label)}</option>`)}
        </select>
      </label>
    `}_renderScene(){let e=this.hass?.config||{},t=Re(e.latitude),r=Re(e.longitude),n=typeof e.location_name=="string"&&e.location_name||(t!=null&&r!=null?`${t.toFixed(4)}, ${r.toFixed(4)}`:s("ADDRESS NOT SET")),o=this._config,c=this.data?.areas||[],d=hn(o,this._editorPlan),u=Re(o.home_bedrooms),p=Re(o.home_bathrooms),v=u??(c.filter(g=>g.bedroom).length||this.data?.meta?.bedrooms||0),f=p??c.filter(g=>/bath/i.test(g.name||"")).length,b=c.filter(g=>g.active).length,j=s(Rt(this._styleId).label).toUpperCase();return l`
      <div
        class="scene ${this._dragging?"dragging":""}"
        role="group"
        tabindex="0"
        aria-label=${s("3D model of the home")}
        aria-describedby="drag-hint"
        aria-keyshortcuts="ArrowLeft ArrowRight Home"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
        @keydown=${this._onSceneKey}
      >
        ${Ca(this._sceneSvg())}
        <div class="overlay banner">${s("PROPERTY")} · <strong>${n}</strong></div>
        <div class="overlay stats">
          <div class="stat sqft"><div class="k">${s("EST SQ FT")}</div><div class="v">${d?`~${d.toLocaleString()}`:"—"}</div></div>
          <div class="stat"><div class="k">${s("BED / BATH")}</div><div class="v">${v} / ${f||"—"}</div></div>
          <div class="stat style"><div class="k">${s("STYLE")}</div><div class="v">${j}</div></div>
          <div class="stat"><div class="k">${s("OCCUPIED")}</div><div class="v">${b} / ${c.length}</div></div>
        </div>
      </div>
    `}_renderDominant(){let e=this.data?.dominant;if(!e)return m;let t=parseFloat(String(e.temp)),r=parseFloat(String(e.humidity)),n=Number.isFinite(t)?Math.max(0,Math.min(1,(t-50)/40)):0,o=Number.isFinite(r)?Math.max(0,Math.min(1,r/100)):0,c=/on|^[1-9]/i.test(String(e.lights||"")),d=(p,v,f,b,j,g)=>l`
      <div class="gauge ${p} ${j?"dim":""}" role="img" aria-label=${`${b}: ${f}`}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle class="track" cx="32" cy="32" r=${_i}></circle>
          <circle
            class="arc"
            cx="32"
            cy="32"
            r=${_i}
            transform="rotate(-90 32 32)"
            stroke-dasharray=${pn.toFixed(1)}
            stroke-dashoffset=${(pn*(1-v)).toFixed(1)}
            style=${g?`stroke:${g}`:""}
          ></circle>
        </svg>
        <div class="val">${f}</div>
        <div>${b}</div>
      </div>
    `,u=`color-mix(in srgb, var(--jv-warn) ${Math.round(n*100)}%, var(--jv-accent))`;return l`
      <div class="dom" aria-live="polite">
        <div>
          <div class="name">${s(e.name||"—")}</div>
          <div class="jv-muted">${s(e.subtitle||"")}</div>
        </div>
        <div class="gauges">
          ${d("temp",n,e.temp||"—",s("Temp"),!1,u)}
          ${d("hum",o,e.humidity||"—",s("Humidity"),!1)}
          ${d("lite",c?1:.04,c?s("ON"):s("OFF"),s("Lights"),!c)}
        </div>
      </div>
    `}_renderMmwave(){let e=this._mm,t=e?.summary,r=this._mmLoading&&!e?s("SCAN"):t&&t.rooms_with_mmwave?`${t.rooms_detecting||0}/${t.rooms_with_mmwave} ${s("OCCUPIED")}`:s("NONE"),n=t&&t.rooms_detecting?"ok":"neutral",o;return this._mmError&&!e?o=l`
        <jv-empty kind="error" compact icon="mdi:motion-sensor-off" .heading=${s("Couldn't read sensors — restart Home Assistant after updating, then reopen.")} .message=${this._mmError}>
          <button slot="action" class="jv-btn" type="button" @click=${()=>this._fetchMmwave()}>${s("Retry")}</button>
        </jv-empty>
      `:e?e.rooms.length?o=l`
        <ul class="mm-list">
          ${e.rooms.map(c=>{let d=c.detecting_count>0,u=c.sensor_count>1?s("{n}/{m} sensors",{n:c.detecting_count,m:c.sensor_count}):s("{n} sensor",{n:c.sensor_count}),p=`${d?s("OCCUPIED"):s("clear")} · ${u} · ${d?s("now"):c.freshest||"—"}`,v=l`
              <span class="mm-dot ${d?"jv-pulse":""}" aria-hidden="true"></span>
              <span class="mm-body">
                <span class="mm-name">${c.name} ${c.outdoor?l`<jv-state-badge level="info" nodot .label=${s("OUT")}></jv-state-badge>`:m}</span>
                <div class="mm-meta">${p}</div>
              </span>
            `;return l`<li class="mm-room ${d?"on":""}">
              ${c.sensors?.length?l`<details>
                    <summary>${v}</summary>
                    <ul class="mm-sensors">
                      ${c.sensors.map(f=>l`<li><span class=${f.detecting?"on":""}>${f.name}</span><span class="jv-mono">${f.detecting?s("now"):f.age}</span></li>`)}
                    </ul>
                  </details>`:l`<div class="row">${v}</div>`}
            </li>`})}
        </ul>
        ${this._mmError?l`<p class="mm-state" role="status">${this._mmError}</p>`:m}
      `:o=l`<jv-empty compact icon="mdi:motion-sensor" .message=${s("No presence, motion, or mmWave sensors found. Assign occupancy sensors to areas in Home Assistant and they'll appear here.")}></jv-empty>`:o=l`<jv-empty kind="loading" compact .message=${s("Reading sensors…")}></jv-empty>`,l`
      <jv-section .heading=${s("mmWave Presence")} icon="mdi:motion-sensor" ?loading=${this._mmLoading}>
        <jv-state-badge slot="actions" level=${n} .label=${r} ?pulse=${n==="ok"}></jv-state-badge>
        <p class="subtext">${s("Live occupancy per room from presence / motion / mmWave sensors — the ground truth behind the floor-plan glow.")}</p>
        ${o}
      </jv-section>
    `}};fe.styles=[F,en],h([$()],fe.prototype,"_floor",2),h([$()],fe.prototype,"_preset",2),h([$()],fe.prototype,"_dragging",2),h([$()],fe.prototype,"_mm",2),h([$()],fe.prototype,"_mmLoading",2),h([$()],fe.prototype,"_mmError",2),h([$()],fe.prototype,"_styleBusy",2),h([$()],fe.prototype,"_styleOverride",2),h([$()],fe.prototype,"_styleError",2),fe=h([D("jarvis-view-residence")],fe);var to={all:"All","1f":"1st Floor","2f":"2nd Floor",bsmt:"Basement"};var{I:ro}=Gi,vn=a=>a;var fn=a=>a.strings===void 0,mn=()=>document.createComment(""),Ct=(a,i,e)=>{let t=a._$AA.parentNode,r=i===void 0?a._$AB:i._$AA;if(e===void 0){let n=t.insertBefore(mn(),r),o=t.insertBefore(mn(),r);e=new ro(n,o,a,a.options)}else{let n=e._$AB.nextSibling,o=e._$AM,c=o!==a;if(c){let d;e._$AQ?.(a),e._$AM=a,e._$AP!==void 0&&(d=a._$AU)!==o._$AU&&e._$AP(d)}if(n!==r||c){let d=e._$AA;for(;d!==n;){let u=vn(d).nextSibling;vn(t).insertBefore(d,r),d=u}}}return e},it=(a,i,e=a)=>(a._$AI(i,e),a),io={},Er=(a,i=io)=>a._$AH=i,gn=a=>a._$AH,Ar=a=>{a._$AR(),a._$AA.remove()};var bn=(a,i,e)=>{let t=new Map;for(let r=i;r<=e;r++)t.set(a[r],r);return t},Tr=At(class extends rt{constructor(a){if(super(a),a.type!==Te.CHILD)throw Error("repeat() can only be used in text expressions")}dt(a,i,e){let t;e===void 0?e=i:i!==void 0&&(t=i);let r=[],n=[],o=0;for(let c of a)r[o]=t?t(c,o):o,n[o]=e(c,o),o++;return{values:n,keys:r}}render(a,i,e){return this.dt(a,i,e).values}update(a,[i,e,t]){let r=gn(a),{values:n,keys:o}=this.dt(i,e,t);if(!Array.isArray(r))return this.ut=o,n;let c=this.ut??=[],d=[],u,p,v=0,f=r.length-1,b=0,j=n.length-1;for(;v<=f&&b<=j;)if(r[v]===null)v++;else if(r[f]===null)f--;else if(c[v]===o[b])d[b]=it(r[v],n[b]),v++,b++;else if(c[f]===o[j])d[j]=it(r[f],n[j]),f--,j--;else if(c[v]===o[j])d[j]=it(r[v],n[j]),Ct(a,d[j+1],r[v]),v++,j--;else if(c[f]===o[b])d[b]=it(r[f],n[b]),Ct(a,r[v],r[f]),f--,b++;else if(u===void 0&&(u=bn(o,b,j),p=bn(c,v,f)),u.has(c[v]))if(u.has(c[f])){let g=p.get(o[b]),y=g!==void 0?r[g]:null;if(y===null){let C=Ct(a,r[v]);it(C,n[b]),d[b]=C}else d[b]=it(y,n[b]),Ct(a,r[v],y),r[g]=null;b++}else Ar(r[f]),f--;else Ar(r[v]),v++;for(;b<=j;){let g=Ct(a,d[j+1]);it(g,n[b]),d[b++]=g}for(;v<=f;){let g=r[v++];g!==null&&Ar(g)}return this.ut=o,Er(a,d),le}});function at(a){return typeof a=="number"&&Number.isFinite(a)?`${Math.round(a*100)}%`:"—"}function ve(a){return typeof a=="number"&&Number.isFinite(a)?String(a):"0"}function yn(a,i=Date.now()){let e=Math.max(0,Math.round((i/1e3-a)/60));return e<60?s("{n}m ago",{n:e}):e<1440?s("{n}h ago",{n:Math.round(e/60)}):s("{n}d ago",{n:Math.round(e/1440)})}function wn(a,i){try{return a.toLocaleTimeString(i||void 0,{hour:"2-digit",minute:"2-digit",second:"2-digit"})}catch{return a.toTimeString().slice(0,8)}}var vt="All",_n=["CONV","LOCAL","AGENT","GATE","DEDUP","CLASSIFY","CAMERA","ROUTE","ERROR"];function jn(a){let i=new Set;for(let r of a)r.cat&&i.add(r.cat);let e=_n.filter(r=>i.has(r)),t=[...i].filter(r=>!_n.includes(r)).sort((r,n)=>r.localeCompare(n));return[...e,...t]}function $n(a){switch(a){case"ERROR":return"danger";case"AGENT":case"LOCAL":case"CONV":return"accent";case"GATE":case"DEDUP":return"muted";default:return"default"}}function xn(a){return a.cat==="ERROR"||/error|failed/i.test(a.msg||"")}function Rr(a,...i){if(!a)return!0;let e=a.toLowerCase();return i.some(t=>(t||"").toLowerCase().includes(e))}function Cr(a,i){let e=new Map;return a.map(t=>{let r=i(t),n=e.get(r)??0;return e.set(r,n+1),{key:n?`${r}#${n}`:r,item:t}})}var Be=R`
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
`;var ao=40,no=200,Ce=class extends I{constructor(){super(...arguments);this.entries=null;this.error=null;this.narrow=!1;this._cat=vt;this._query="";this._debounce=null;this._prevTop=0;this._prevHeight=0;this._pendingScroll=null;this._newest=[];this._newestSrc=null}connectedCallback(){super.connectedCallback(),z(this,["ha-alert"])}disconnectedCallback(){super.disconnectedCallback(),this._debounce&&clearTimeout(this._debounce),this._debounce=null}get _all(){let e=this.entries??[];return e!==this._newestSrc&&(this._newestSrc=e,this._newest=[...e].reverse()),this._newest}_filtered(){let e=this._cat,t=this._query.trim();return this._all.filter(r=>(e===vt||r.cat===e)&&Rr(t,r.msg,r.cat))}willUpdate(e){let t=e.has("_cat")||e.has("_query");if(!t&&!e.has("entries"))return;let r=this._scroll;this._prevTop=r?.scrollTop??0,this._prevHeight=r?.scrollHeight??0,this._pendingScroll=t||this._prevTop<=ao?"top":"keep"}updated(){let e=this._pendingScroll;this._pendingScroll=null;let t=this._scroll;if(!e||!t)return;if(e==="top"){t.scrollTop!==0&&(t.scrollTop=0);return}let r=t.scrollHeight-this._prevHeight;r&&(t.scrollTop=this._prevTop+r)}_onSearch(e){let t=e.target.value;this._debounce&&clearTimeout(this._debounce),this._debounce=setTimeout(()=>{this._debounce=null,this._query=t},no)}_emptyText(e,t){if(e===0)return s("No entries yet. Talk to JARVIS to generate log entries.");let r=s("No entries match");return t&&(r+=` "${t}"`),this._cat!==vt&&(r+=` in ${this._cat}`),`${r}.`}_renderError(){if(!this.error)return m;let e=`${s("Error loading logs:")} ${this.error}`;return E("ha-alert")?l`<ha-alert alert-type="error">${e}</ha-alert>`:l`<div class="banner" role="alert">${e}</div>`}_renderRows(e){let t="";return Tr(Cr(e,r=>`${r.date} ${r.ts} ${r.cat} ${r.msg}`),r=>r.key,({item:r})=>{let n=r.date&&r.date!==t?l`<li class="day" role="presentation">${r.date}</li>`:m;return t=r.date,l`
          ${n}
          <li class="row ${xn(r)?"err":""}" title=${r.date||m}>
            <time>${r.ts}</time>
            <span class="cat ${$n(r.cat)}">${r.cat}</span>
            <span class="msg">${r.msg}</span>
          </li>
        `})}render(){let e=this.entries!==null,t=this._all,r=this._query.trim(),n=this._filtered(),o=r!==""||this._cat!==vt,c=e?o?s("{shown} of {total}",{shown:n.length,total:t.length}):s("{n} entries",{n:t.length}):"",d=[vt,...jn(t)];return l`
      <jv-section .heading=${s("System Log")} icon="mdi:text-box-search-outline" flush .loading=${!e&&!this.error}>
        ${c?l`<jv-state-badge slot="actions" nodot level="neutral" .label=${c}></jv-state-badge>`:m}
        <div class="controls">
          <label class="visually-hidden" for="q">${s("Search log…")}</label>
          <input id="q" class="search" type="search" placeholder=${s("Search log…")} autocomplete="off" @input=${this._onSearch} />
          <div class="chips" role="group" aria-label=${s("Filter by category")}>
            ${d.map(u=>l`
                <button
                  class="chip"
                  type="button"
                  aria-pressed=${u===this._cat?"true":"false"}
                  @click=${()=>{this._cat=u}}
                >
                  ${u===vt?s("All"):u}
                </button>
              `)}
          </div>
        </div>
        ${this._renderError()}
        <div class="scroll" role="region" tabindex="0" aria-label=${s("System Log")}>
          ${!e&&!this.error?l`<div class="state" role="status">${s("Loading...")}</div>`:n.length===0?l`<div class="state">${this._emptyText(t.length,r)}</div>`:l`<ul class="list jv-mono">${this._renderRows(n)}</ul>`}
        </div>
      </jv-section>
    `}};Ce.styles=[F,Be,R`
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
    `],h([x({attribute:!1})],Ce.prototype,"entries",2),h([x({type:String})],Ce.prototype,"error",2),h([x({type:Boolean,reflect:!0})],Ce.prototype,"narrow",2),h([$()],Ce.prototype,"_cat",2),h([$()],Ce.prototype,"_query",2),h([Se(".scroll")],Ce.prototype,"_scroll",2),Ce=h([D("jv-logs-system")],Ce);var so=200;function oo(a){switch((a||"").toLowerCase()){case"critical":return"u-critical";case"high":return"u-high";case"medium":return"u-medium";case"muted":return"u-muted";default:return"u-low"}}var nt=class extends I{constructor(){super(...arguments);this.entries=null;this.error=null;this._query="";this._debounce=null}connectedCallback(){super.connectedCallback(),z(this,["ha-alert"])}disconnectedCallback(){super.disconnectedCallback(),this._debounce&&clearTimeout(this._debounce),this._debounce=null}_onSearch(e){let t=e.target.value;this._debounce&&clearTimeout(this._debounce),this._debounce=setTimeout(()=>{this._debounce=null,this._query=t},so)}_renderError(){if(!this.error)return m;let e=s("Could not load the log.");return E("ha-alert")?l`<ha-alert alert-type="error" .title=${e}>${this.error}</ha-alert>`:l`<div class="banner" role="alert" title=${this.error}>${e} ${this.error}</div>`}render(){let e=this.entries!==null,t=this.entries??[],r=this._query.trim(),n=r?t.filter(c=>Rr(r,c.msg,c.tag)):t,o=e?r?s("{shown} of {total}",{shown:n.length,total:t.length}):s("Last {total}",{total:t.length}):"";return l`
      <jv-section .heading=${s("Activity Feed")} icon="mdi:history" flush .loading=${!e&&!this.error}>
        ${o?l`<jv-state-badge slot="actions" nodot level="neutral" .label=${o}></jv-state-badge>`:m}
        <div class="controls">
          <label class="visually-hidden" for="q">${s("Search activity…")}</label>
          <input id="q" class="search" type="search" placeholder=${s("Search activity…")} autocomplete="off" @input=${this._onSearch} />
        </div>
        ${this._renderError()}
        <div class="scroll">
          ${!e&&!this.error?l`<div class="state" role="status">${s("Loading...")}</div>`:n.length===0?l`<div class="state">
                  ${t.length===0?s("No activity yet. Enable announcements or observer to see events here."):s('No events match "{q}".',{q:r})}
                </div>`:l`
                  <ul class="list">
                    ${Tr(Cr(n,c=>`${c.ts} ${c.tag??""} ${c.msg??""}`),c=>c.key,({item:c})=>l`
                        <li class="row ${oo(c.urgency)}" title=${c.source||m}>
                          <time>${c.ts}</time>
                          ${c.tag?l`<span class="tag">${c.tag}</span>`:m}
                          <span class="msg">${c.msg||""}</span>
                        </li>
                      `)}
                  </ul>
                `}
        </div>
      </jv-section>
    `}};nt.styles=[F,Be,R`
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
    `],h([x({attribute:!1})],nt.prototype,"entries",2),h([x({type:String})],nt.prototype,"error",2),h([$()],nt.prototype,"_query",2),nt=h([D("jv-logs-activity")],nt);function lo(a){switch(a){case"ok":return"ok";case"warn":return"warn";case"down":return"danger";default:return"neutral"}}function co(a){switch(a){case"ok":return{label:s("OK"),level:"ok"};case"idle":return{label:s("IDLE"),level:"neutral"};case"warn":return{label:s("WARN"),level:"warn"};case"down":return{label:s("DOWN"),level:"danger"};case"off":return{label:s("OFF"),level:"neutral"};default:return{label:"?",level:"neutral"}}}var ze=class extends I{constructor(){super(...arguments);this._diag=null;this._calib=null;this._error=null;this._running=!1;this._ran=!1}connectedCallback(){super.connectedCallback(),z(this,["ha-icon"])}willUpdate(e){e.has("hass")&&this.hass&&!this._ran&&this.run()}async run(){if(!this.hass||this._running)return;this._ran=!0,this._running=!0;let[e,t]=await Promise.allSettled([Z(this.hass,"jarvis/diagnostics"),Z(this.hass,"jarvis/get_calibration")]);if(e.status==="fulfilled")this._diag=e.value??{},this._error=null;else{let r=Q.from("jarvis/diagnostics",e.reason);this._error=r.message||r.code}this._calib=t.status==="fulfilled"?t.value??{}:{error:String(t.reason)},this._running=!1}_renderBadge(){if(this._error)return l`<jv-state-badge slot="actions" nodot level="neutral" label="—"></jv-state-badge>`;let e=this._diag;if(!e)return m;let t=e.summary||(e.overall||"").toUpperCase();return t?l`<jv-state-badge slot="actions" level=${lo(e.overall)} .label=${t}></jv-state-badge>`:m}_renderServices(e){let t=Array.isArray(e.services)?e.services:[];return t.length===0?l`<p class="sub">${e.summary||""}</p>`:l`
      <ul class="services">
        ${t.map(r=>{let n=co(String(r.status));return l`
            <li class="service">
              <span class="name">${r.name}</span>
              <jv-state-badge level=${n.level} .label=${n.label}></jv-state-badge>
              ${r.detail?l`<span class="detail">${r.detail}</span>`:m}
            </li>
          `})}
      </ul>
    `}_renderCalibration(e){if(!e)return m;let t=e.calibration??{},r=t.n??0,n=l`<h3>${s("Judgment calibration")}</h3>`;if(e.error||r===0)return l`${n}
        <p class="sub">${s("No judged decisions yet — this appears once JARVIS's decisions accrue outcomes.")}</p>`;let o=(t.bins??[]).filter(v=>(v.count??0)>0),c=e.interruption_budget??{},d=c.judged??0,u=e.suggestion_threshold,p=v=>typeof v=="number"?v.toFixed(3):"—";return l`
      ${n}
      <div class="meta">${s("Brier {brier} · ECE {ece} · n={n}",{brier:p(t.brier),ece:p(t.ece),n:r})}</div>
      ${o.length?l`<div class="bins">
            ${o.map(v=>l`
                <div class="bin">
                  <span class="label">${at(v.lo)}–${at(v.hi)}</span>
                  <div class="bar" role="img" aria-label=${at(v.good_rate)}>
                    <div class="fill" style="width:${Math.round((v.good_rate??0)*100)}%"></div>
                  </div>
                  <span class="meta">${s("{rate} good · n={count}",{rate:at(v.good_rate),count:ve(v.count)})}</span>
                </div>
              `)}
          </div>`:m}
      <p class="line">
        ${d>0?l`${s("Interruption budget: {assessment} — {rate} of {judged} recent decisions dismissed (cap ×{multiplier}).",{assessment:s(c.assessment||"no data"),rate:at(c.unwelcome_rate),judged:d,multiplier:ve(c.multiplier??1)})}`:s("Interruption budget: no recent judged decisions.")}
      </p>
      ${u&&Math.abs(u.learned_delta)>.001?l`<p class="line">
            ${s("Suggestion bar {dir} to {effective} (from {base}) based on recent usefulness.",{dir:u.learned_delta>0?s("raised"):s("lowered"),effective:at(u.effective),base:at(u.base)})}
          </p>`:m}
    `}render(){let e=this._running,t=!this._diag&&!this._error;return l`
      <jv-section
        .heading=${s("System Diagnostics")}
        .subheading=${s('Health of the core services JARVIS calls — LLM, embeddings, speech. A quick "is everything up?" check.')}
        icon="mdi:stethoscope"
        .loading=${e}
      >
        ${this._renderBadge()}
        ${t&&e?l`<div class="state" role="status">${s("Loading...")}</div>`:this._error?l`<div class="error" role="alert">
                ${s("Couldn't run diagnostics — restart Home Assistant after updating.")}
                <span class="detail">${this._error}</span>
              </div>`:this._diag?this._renderServices(this._diag):m}
        ${this._renderCalibration(this._calib)}
        <div class="actions">
          <button class="jv-btn" type="button" ?disabled=${e||!this.hass} @click=${()=>{this.run()}}>
            ${E("ha-icon")?l`<ha-icon icon="mdi:refresh" aria-hidden="true"></ha-icon>`:m}
            ${e?l`<span>${s("Checking…")}</span>`:l`<span class="sentence">${s("RUN CHECK")}</span>`}
          </button>
        </div>
      </jv-section>
    `}};ze.styles=[F,Be,R`
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
    `],h([x({attribute:!1})],ze.prototype,"hass",2),h([$()],ze.prototype,"_diag",2),h([$()],ze.prototype,"_calib",2),h([$()],ze.prototype,"_error",2),h([$()],ze.prototype,"_running",2),ze=h([D("jv-logs-diagnostics")],ze);var Mt=class extends I{constructor(){super(...arguments);this.status=null}_tile(e,t){return l`<div class="tile"><span class="v">${t}</span><span class="k">${e}</span></div>`}render(){let e=this.status,t=e!==null,r=!!e?.running&&!e?.error,n=e?.learning??{},o=e?.last_analysis??{};return l`
      <jv-section .heading=${s("Cognitive Core")} icon="mdi:brain" .loading=${!t}>
        ${t?l`<jv-state-badge
              slot="actions"
              level=${r?"ok":"neutral"}
              .label=${r?s("Running"):s("Stopped")}
            ></jv-state-badge>`:m}
        ${t?l`
              <div class="grid">
                ${this._tile(s("Data"),`${ve(n.days_of_data)}d`)}
                ${this._tile(s("States"),ve(n.state_changes))}
                ${this._tile(s("Cmds"),ve(n.commands))}
                ${this._tile(s("Suggestions"),ve(n.suggestions))}
                ${this._tile(s("Ignores"),ve(e?.ignore_rules))}
              </div>
              <ul class="secondary">
                <li>${s("Uptime")} <b>${ve(e?.uptime_hours)}h</b></li>
                <li>${s("Ticks")} <b>${ve(e?.tick_count)}</b></li>
                <li>${s("Autonomous")} <b>${ve(e?.autonomous_actions)}</b></li>
                <li>${s("Offers")} <b>${ve(e?.offers_made)}</b></li>
              </ul>
              <p class="line">
                ${o.ts?s("Last analysis: {ago} · {found} found, {stored} stored",{ago:yn(o.ts),found:ve(o.patterns_found),stored:ve(o.new_suggestions)}):s("Last analysis: not yet this session")}
              </p>
              ${e?.error?l`<p class="sub">${e.error}</p>`:m}
            `:l`<div class="state" role="status">${s("Loading...")}</div>`}
      </jv-section>
    `}};Mt.styles=[F,Be,R`
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
    `],h([x({attribute:!1})],Mt.prototype,"status",2),Mt=h([D("jv-logs-cognitive")],Mt);var ae=At(class extends rt{constructor(a){if(super(a),a.type!==Te.PROPERTY&&a.type!==Te.ATTRIBUTE&&a.type!==Te.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!fn(a))throw Error("`live` bindings can only contain a single expression")}render(a){return a}update(a,[i]){if(i===le||i===m)return i;let e=a.element,t=a.name;if(a.type===Te.PROPERTY){if(i===e[t])return le}else if(a.type===Te.BOOLEAN_ATTRIBUTE){if(!!i===e.hasAttribute(t))return le}else if(a.type===Te.ATTRIBUTE&&e.getAttribute(t)===i+"")return le;return Er(a),i}});var Me=class extends I{constructor(){super(...arguments);this.switches=null;this.error=null;this._local={};this._busy={};this._status=""}connectedCallback(){super.connectedCallback(),z(this,["ha-switch","ha-alert"])}willUpdate(e){e.has("switches")&&this.switches&&(this._local={})}_enabled(e){return e.key in this._local?this._local[e.key]:!!e.enabled}_notify(e){this._status=e,this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:e}}))}async _toggle(e,t){if(this._busy[e.key])return;let r=this._enabled(e);if(t===r)return;let n=!0;if(e.category==="safety"&&!t?n=await ue({heading:s('Turn OFF the safety enforcement "{name}"?',{name:e.name}),message:s("This reverts that guard to observe-only (log-only) until you turn it back on. Only do this for debugging."),confirmLabel:s("Turn off"),cancelLabel:s("Cancel"),destructive:!0}):e.category==="capability"&&t&&(n=await ue({heading:s('Enable "{name}"?',{name:e.name}),message:s("This makes the kernel authoritative for that capability."),confirmLabel:s("Enable"),cancelLabel:s("Cancel")})),!n){this._local={...this._local,[e.key]:r};return}this._busy={...this._busy,[e.key]:!0},this._local={...this._local,[e.key]:t};try{let o=await Z(this.hass,"jarvis/set_enforcement",{key:e.key,enabled:t}),c=o?.switch&&o.switch.key===e.key?!!o.switch.enabled:t;this._local={...this._local,[e.key]:c},this._notify(s(c?"✓ {name} → ON":"✓ {name} → OFF",{name:e.name})),this.dispatchEvent(new CustomEvent("jv-logs-enforcement-changed",{bubbles:!0,composed:!0}))}catch(o){let c=Q.from("jarvis/set_enforcement",o);this._local={...this._local,[e.key]:r},this._notify(s("✗ {name} — {message}",{name:e.name,message:c.message||c.code}))}finally{let{[e.key]:o,...c}=this._busy;this._busy=c}}_renderControl(e){let t=this._enabled(e),r=!!this._busy[e.key],n=o=>{this._toggle(e,!!o.target.checked)};return l`
      <label class="ctl">
        ${E("ha-switch")?l`<ha-switch .checked=${ae(t)} .disabled=${r} aria-label=${e.name} @change=${n}></ha-switch>`:l`<input type="checkbox" role="switch" .checked=${ae(t)} ?disabled=${r} aria-label=${e.name} @change=${n} />`}
        <span class="lbl" aria-hidden="true">${t?s("ON"):s("OFF")}</span>
      </label>
    `}_renderGroup(e,t,r){return r.length?l`
      <fieldset>
        <legend>${e}</legend>
        <p class="sub">${t}</p>
        <ul class="switches">
          ${r.map(n=>l`
              <li class="sw">
                <div class="head">
                  <span class="name">${n.name}</span>
                  ${n.phase?l`<span class="tag">${n.phase}</span>`:m}
                  ${n.overridden?l`<span class="tag over">${s("overridden")}</span>`:m}
                </div>
                ${this._renderControl(n)}
                ${n.explanation?l`<p class="exp">${n.explanation}</p>`:m}
              </li>
            `)}
        </ul>
      </fieldset>
    `:m}_renderBody(){if(this.error){let n=s("Couldn't load governance switches — {message}",{message:this.error});return E("ha-alert")?l`<ha-alert alert-type="error">${n}</ha-alert>`:l`<div class="banner" role="alert">${n}</div>`}if(this.switches===null)return l`<div class="state" role="status">${s("Loading governance switches…")}</div>`;if(this.switches.length===0)return l`<p class="sub">${s("No governance switches reported.")}</p>`;let e=this.switches.filter(n=>n.category==="capability"),t=this.switches.filter(n=>n.category==="safety"),r=this.switches.filter(n=>n.category!=="capability"&&n.category!=="safety");return l`
      ${this._renderGroup(s("Owner opt-in capabilities"),s("These ship OFF. Turning one ON makes the kernel authoritative for that capability — your choice, behaviour-changing."),e)}
      ${this._renderGroup(s("Safety & governance — kill-switches (keep ON)"),s("These ship ON and guard autonomous behaviour. Turning one OFF reverts that guard to observe-only (log-only) — only for debugging."),t)}
      ${r.length?this._renderGroup(s("Enforcement"),"",r):m}
    `}render(){return l`
      <jv-section .heading=${s("Governance")} icon="mdi:shield-check-outline" .loading=${this.switches===null&&!this.error}>
        <jv-state-badge slot="actions" nodot level="accent" .label=${s("Enforcement")}></jv-state-badge>
        <p class="intro">
          ${s("JARVIS's kernel brings each capability online along a shadow → parity → enforce ladder, each behind a kill-switch. Here you control those switches: the opt-in capabilities ship OFF (enable when you're ready), and the live safety guards ship ON (leave them on). Changes take effect immediately and survive a restart.")}
        </p>
        ${this._renderBody()}
        <p class="status" role="status" aria-live="polite">${this._status}</p>
      </jv-section>
    `}};Me.styles=[F,Be,R`
      .intro {
        margin: 0 0 var(--jv-space-3);
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
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
      .switches {
        list-style: none;
        margin: var(--jv-space-2) 0 0;
        padding: 0;
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
        font-weight: var(--jv-font-weight-bold);
        overflow-wrap: anywhere;
      }
      .tag {
        padding: 0 6px;
        border-radius: var(--jv-radius-sm);
        background: var(--jv-neutral-soft);
        color: var(--jv-text-2);
        font-family: var(--jv-font-code);
        font-size: var(--jv-font-size-xs);
        line-height: 18px;
      }
      .tag.over {
        background: var(--jv-warn-soft);
        color: var(--jv-text);
      }
      .sw .exp {
        grid-column: 1;
        margin: 0;
        color: var(--jv-text-2);
        font-size: var(--jv-font-size-s);
      }
      /* a <label>: the whole 48 x 44 block toggles the native fallback switch */
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
      .status {
        margin: var(--jv-space-2) 0 0;
        font-size: var(--jv-font-size-s);
        color: var(--jv-text-2);
        overflow-wrap: anywhere;
      }
    `],h([x({attribute:!1})],Me.prototype,"hass",2),h([x({attribute:!1})],Me.prototype,"switches",2),h([x({type:String})],Me.prototype,"error",2),h([$()],Me.prototype,"_local",2),h([$()],Me.prototype,"_busy",2),h([$()],Me.prototype,"_status",2),Me=h([D("jv-logs-governance")],Me);var kn=2e4,uo={hours:24,limit:100},ge=class extends te{constructor(){super(...arguments);this._debug=null;this._debugError=null;this._activity=null;this._activityError=null;this._cognitive=null;this._switches=null;this._switchesError=null;this._refreshing=!1;this._updated=null;this._timer=null;this._started=!1;this._lastFetch=0;this._inFlight=null;this._onVisibility=()=>{document.visibilityState==="visible"&&Date.now()-this._lastFetch>kn&&this._poll()};this._onEnforcementChanged=()=>{this._loadEnforcement()}}connectedCallback(){super.connectedCallback(),z(this,["ha-icon"]),document.addEventListener("visibilitychange",this._onVisibility),this.addEventListener("jv-logs-enforcement-changed",this._onEnforcementChanged),this._timer=setInterval(()=>{document.visibilityState==="visible"&&this._poll()},kn),this.hass&&this._loadAll()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this._onVisibility),this.removeEventListener("jv-logs-enforcement-changed",this._onEnforcementChanged),this._timer&&clearInterval(this._timer),this._timer=null}willUpdate(e){e.has("hass")&&this.hass&&!this._started&&this._loadAll()}_fail(e,t){let r=Q.from(e,t);return r.message||r.code}async _loadDebug(){try{let e=await this.ws("jarvis/get_debug_log");this._debug=Array.isArray(e?.entries)?e.entries:[],this._debugError=null}catch(e){this._debugError=this._fail("jarvis/get_debug_log",e)}}async _loadActivity(){try{let e=await this.ws("jarvis/get_activity_log",uo);this._activity=Array.isArray(e?.entries)?e.entries:[],this._activityError=null}catch(e){this._activityError=this._fail("jarvis/get_activity_log",e)}}async _loadCognitive(){try{let e=await this.ws("jarvis/get_cognitive_status");this._cognitive=e&&typeof e=="object"?e:{}}catch(e){this._cognitive={running:!1,error:this._fail("jarvis/get_cognitive_status",e),learning:{}}}}async _loadEnforcement(){try{let e=await this.ws("jarvis/get_enforcement");this._switches=Array.isArray(e?.switches)?e.switches:[],this._switchesError=null}catch(e){this._switchesError=this._fail("jarvis/get_enforcement",e)}}_poll(){return this._run([()=>this._loadDebug(),()=>this._loadActivity(),()=>this._loadCognitive()])}_loadAll(){return this._run([()=>this._loadDebug(),()=>this._loadActivity(),()=>this._loadCognitive(),()=>this._loadEnforcement()])}_run(e){return this.hass?this._inFlight?this._inFlight:(this._started=!0,this._refreshing=!0,this._inFlight=(async()=>{try{await Promise.allSettled(e.map(t=>t())),this._lastFetch=Date.now(),this._updated=new Date(this._lastFetch)}finally{this._refreshing=!1,this._inFlight=null}})(),this._inFlight):Promise.resolve()}_renderToolbar(){let e=this.hass?.locale?.language||this.hass?.language;return l`
      <div class="toolbar">
        <span class="updated" role="status" aria-live="polite">
          ${this._updated?s("Last updated {time}",{time:wn(this._updated,e)}):m}
        </span>
        <button class="jv-btn" type="button" ?disabled=${this._refreshing||!this.hass} @click=${()=>{this._loadAll()}}>
          ${E("ha-icon")?l`<ha-icon icon="mdi:refresh" aria-hidden="true"></ha-icon>`:m}
          <span>${s("Refresh")}</span>
        </button>
      </div>
    `}render(){return l`
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
    `}};ge.styles=[F,R`
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
    `],h([$()],ge.prototype,"_debug",2),h([$()],ge.prototype,"_debugError",2),h([$()],ge.prototype,"_activity",2),h([$()],ge.prototype,"_activityError",2),h([$()],ge.prototype,"_cognitive",2),h([$()],ge.prototype,"_switches",2),h([$()],ge.prototype,"_switchesError",2),h([$()],ge.prototype,"_refreshing",2),h([$()],ge.prototype,"_updated",2),ge=h([D("jarvis-view-logs")],ge);function mt(a){return typeof a=="string"?a:String(a.value)}function Sn(a){return typeof a=="string"?a:a.label||String(a.value)}function ho(a){return(a.options??[]).map(mt)}function Qt(a){if(a==null)return"";if(typeof a=="string")return a;try{return JSON.stringify(a)}catch{return String(a)}}function yi(a){try{return JSON.stringify(a,null,2)??""}catch{return String(a)}}function qe(a,i){switch(a.kind){case"bool":return typeof i=="boolean"?{kind:"bool",value:i}:i==null?{kind:"bool",value:!1}:{kind:"bool",value:!1,warning:"Stored value is not a boolean: {raw}"};case"int":case"float":return i==null||i===""?{kind:"number",value:null}:typeof i=="number"&&Number.isFinite(i)?{kind:"number",value:i}:{kind:"number",value:null,warning:"Stored value is not a number: {raw}"};case"enum":{let e=i==null?"":String(i),t=ho(a).includes(e);return t?{kind:"enum",value:e,inOptions:t}:{kind:"enum",value:e,inOptions:t,warning:"Stored value is not an option: {raw}"}}case"list":return Array.isArray(i)?{kind:"list",value:i.map(e=>Qt(e)).filter(e=>e!=="")}:i==null||i===""?{kind:"list",value:[]}:{kind:"list",value:[],warning:"Stored value is not a list: {raw}"};case"json":if(typeof i=="string")try{let e=JSON.parse(i);return{kind:"json",value:e,text:yi(e)}}catch{return{kind:"json",value:i,text:i,warning:"Invalid JSON stored"}}return i===void 0?{kind:"json",value:null,text:""}:{kind:"json",value:i,text:yi(i)};default:return{kind:"str",value:i==null?"":String(i)}}}function wi(a,i){if(a.kind!=="json")return"";let e=a.default;return Array.isArray(e)?Array.isArray(i)?"":"Expected a JSON list":e!==null&&typeof e=="object"?i!==null&&typeof i=="object"&&!Array.isArray(i)?"":"Expected a JSON object":""}function Qe(a){let i=[];for(let e of a.split(/[\n,]/)){let t=e.trim();t&&!i.includes(t)&&i.push(t)}return i}function ji(a){return a.join(`
`)}function En(a,i){let e=a.kind==="int"?Math.round(i):i,t=!1;return typeof a.min=="number"&&e<a.min&&(e=a.min,t=!0),typeof a.max=="number"&&e>a.max&&(e=a.max,t=!0),{value:e,clamped:t}}function Jt(a,i){switch(a.kind){case"bool":return i===!0||i==="true"||i===1;case"int":{if(i==null||i==="")return null;let e=Number(i);return Number.isFinite(e)?Math.round(e):null}case"float":{if(i==null||i==="")return null;let e=Number(i);return Number.isFinite(e)?e:null}case"enum":case"str":return i==null?"":String(i);case"list":return Array.isArray(i)?i.map(e=>Qt(e)).filter(e=>e!==""):typeof i=="string"?Qe(i):[];default:return i===void 0?null:i}}function Mr(a){if(a===void 0)return"null";if(a&&typeof a=="object"&&!Array.isArray(a)){let i=a;return"{"+Object.keys(i).sort().map(e=>JSON.stringify(e)+":"+Mr(i[e])).join(",")+"}"}return Array.isArray(a)?"["+a.map(Mr).join(",")+"]":JSON.stringify(a)??"null"}function ft(a,i){return Mr(a)===Mr(i)}function An(a,i,e,t){return i==null||i===""?"—":a.kind==="bool"?i===!0?e:t:Array.isArray(i)?i.length?i.map(r=>Qt(r)).join(", "):"[]":typeof i=="object"?JSON.stringify(i):String(i)}function Tn(a,...i){let e=a.trim().toLowerCase();if(!e)return!0;for(let t of i){if(!t)continue;let r=Array.isArray(t)?t:[t];for(let n of r)if(n&&n.toLowerCase().includes(e))return!0}return!1}var er={core:"General",voice:"Voice & Audio",learning:"Learning",safety:"Safety & Energy",cameras:"Cameras",home:"Home & Extras",governance:"Governance",Other:"Other"},Dn=["core","voice","learning","safety","cameras","home","governance"],po=new Set(["onboarding_dismissed"]),Fn=new Set(["appliance_profile","appliance_announce_unknown"]),On={announcements_enabled:"Announcements",sentinel_enabled:"Sentinel",observer_enabled:"Observer",cognition_enabled:"Cognition",camera_auto_analyze:"Camera Watch",package_detection:"Package Watch",visitor_learning:"Visitor Learning",rich_reasoning:"Rich Reasoning",light_control_enabled:"Light Control",appliance_power_guessing:"Appliance Power Guessing",notify_service:"Notify Device",banter_level:"Banter level",search_backend:"Web research backend",searxng_url:"SearXNG URL",web_research_llm_fallback:"Escalate to LLM web search",calendar_tight_gap_min:"Calendar tight-gap (min)",departure_alerts_enabled:"Departure alerts",departure_lead_minutes:"Departure lead (min)",departure_origin_entity:"Origin tracker",departure_travel_sensor:"Travel sensor",routine_alerts_enabled:"Routine alerts",memory_threading_enabled:"Memory threading",memory_threading_hours:"Memory window (hrs)",memory_threading_max:"Memory max turns",continued_conversation_enabled:"Continued conversation",voice_confirm_enabled:"Voice confirmation",voice_confirm_mode:"Mode",recognition_source:"Face recognition source",residence_style:"Home type",home_stories:"Stories",garage_bays:"Garage bays",dormers_front:"Front dormers",dormers_rear:"Rear dormers",chimney_side:"Chimney",has_basement:"Basement",home_bedrooms:"Bedrooms",home_bathrooms:"Bathrooms",floor_plan_sqft:"Square feet",pattern_learn_doors:"Learn doors & windows",pattern_learn_presence:"Learn presence & arrivals",pattern_include_entities:"Also learn specific entities",excluded_entities:"Exclude specific entities",excluded_domains:"Exclude whole domains",excluded_labels:"Exclude by label",lab_areas:"Lab rooms",movie_area:"Movie room",movie_media_player:"Movie player",movie_dim_pct:"Movie dim %",hazard_monitor_enabled:"Monitor",hazard_quake_radius_km:"Quake radius (km)",hazard_quake_min_mag:"Min magnitude",briefing_require_home:"Only when someone's home",briefing_morning_time:"Morning",briefing_evening_time:"Evening",appliance_announce_unknown:"Announce unidentified loads",energy_agency:"Agency",ui_language:"Language"},ke="Drives the Residence 3D model + property stats. Detailed room layout is edited in the floor-plan editor.",vo="Groq, OpenAI, Google Gemini, Anthropic, a local Ollama server, and any OpenAI-compatible endpoint (Custom) are all supported. A provider marked needs setup has no key yet — add one in Settings → Devices & Services → JARVIS → Configure.",Rn="JARVIS speaks a summary at the times you set — weather and the day's forecast, your calendar, what happened overnight, power draw, and any active hazards nearby.",Cn="Between these times JARVIS stays quiet — proactive announcements, briefings and the Observer back off. HH:MM",Mn={ui_language:"“Panel language” translates this dashboard. Auto follows Home Assistant.",output_language:"The language of JARVIS's own briefings, camera analysis and announcements — set it when your Home Assistant runs in English but you want JARVIS in another language. Auto follows Home Assistant. A spoken request in another language is still answered in that language.",announcements_enabled:"Master switch — all proactive speech",announce_notify_only:"Mute speakers — proactive announcements go to your phone/text instead (incl. critical). No unsolicited speaker interruptions.",sentinel_enabled:"Door/garage/lock-left-open alerts",observer_enabled:"AI event awareness (uses API)",cognition_enabled:"Local triage — sees all telemetry, gates cloud",adaptive_interruption_budget:"Interrupt less after recent alerts were dismissed as unneeded",adaptive_suggestion_threshold:"Tune the suggestion bar from how often past suggestions were useful",adaptive_cognition_threshold:"Tune the anticipation/anomaly bar from how welcome recent alerts were",camera_auto_analyze:"Inspect doorbell presses (vision + event-media)",camera_auto_analyze_motion:"Also inspect Frigate person/object detections, not just doorbell presses (needs Camera Watch on)",camera_motion_vision:"No Frigate/Nest? A Home Assistant motion/occupancy sensor firing silently analyzes the camera covering that room — so best-effort face recognition & scene learning work on plain cameras. Throttled per camera; no spoken alerts.",camera_alert_level:"When auto reviews speak aloud. Everything is still analyzed & logged — this only gates what's announced. Intrusion alerts are always spoken.",package_detection:"Detect packages & mail at the door",visitor_learning:"Silently learn from person events — never spoken",rich_reasoning:"Cloud-first judgment for medium+ events",light_control_enabled:"Off = still show which rooms have lights on, but disable toggling from the dashboard",appliance_power_guessing:"Off = only announce appliances with native sensors or ones you've mapped (no guessing from the power meter)",friday_automator:"⚠️ Advanced. A background sub-agent that can CONTROL devices, run scenes and scripts on its own — every other sub-agent is read-only. Off by default; enabling asks you to confirm.",autonomy_enforce:"⚠️ Lets JARVIS carry out automations you've already approved enough times WITHOUT asking each time — governed by the kernel's graduated-autonomy ladder. Security & safety capabilities (unlock, disarm, garage/lockdown off) NEVER auto-act; they always ask. Off by default; turn it off here anytime.",proximity_volume:"Soften announcements when mmWave distance sensors show you're close to the speaker. No effect in rooms without distance sensors; never dampens critical alerts.",host_telemetry:"Read the server's CPU temperature, memory pressure and NVMe I/O (from /proc and /sys) and fold critical stress into the infrastructure audit & System Diagnostics.",departure_require_location:'skip "time to head out" for online meetings & events with no place set',door_window_alerts_enabled:"announce when one is open at an unusual time — they stay monitored for security either way",continued_conversation_multi_satellite:"reopen the mic in the room you moved to (needs 2+ satellites)",departure_origin_entity:"where you set out from for drive-time — your phone or car GPS (a zone or a location sensor works too); blank uses whoever's tracked, then home",departure_osrm_url:"optional self-hosted routing server (OSRM); blank uses the free public router",departure_travel_sensor:"optional override — a sensor that already reports drive-time in minutes (Waze, Google/HERE Maps…); blank computes it from your origin via OSRM",driving_mode_enabled:"send alerts to the car screen (Android Auto) instead of the house when your phone is connected",driving_car_sensor:"leave blank to auto-detect the Home Assistant companion app's Android Auto sensor",home_context_max_entities:"Lower this (0 = counts only) if your LLM provider rejects requests for being too large — e.g. Groq's free tier caps tokens-per-minute. The assistant still discovers entities on demand, so nothing breaks.",custom_base_url:"OpenAI-compatible endpoint for the custom provider.",ollama_base_url:"Leave empty to use Ollama's default Home Assistant endpoint.",ollama_num_ctx:"Context window for local Ollama models. Larger = more context, but more VRAM and slower. Default 8192.",classifier_rate_limit:"Max observer LLM calls per hour. 0 = unlimited (local LLM / high-quota tiers).",vision_model:"Needs an image-capable model — e.g. moondream on Ollama, or a Groq vision model. Text-only models (like gpt-oss) will fail on camera analysis.",vision_thinking_max_tokens:"Higher budget so a thinking model has room to think AND answer.",vision_min_interval:"Minimum seconds between automatic (motion / auto-event) camera analyses, to cap vision token use. 0 = off. Explicit requests and doorbell presses are never throttled.",notify_service:"Phone push for high/critical alerts",appliance_profile:'Tell JARVIS which appliances exist so it names cycles correctly instead of guessing from the whole-home meter. Map a dedicated power or status entity when one exists (most accurate); otherwise set typical running watts so the meter can match it. Items: {"name","type":"washer|dryer|dishwasher|oven|microwave|appliance","entity","watts"}',appliance_announce_unknown:"Announce unidentified loads (loads matching no declared appliance)",operational_mode_auto:"AUTO · follow occupancy (away ↔ normal). Off = you set modes by hand or voice; discretionary modes (party/movie/lab/…) are always manual.",hazard_monitor_enabled:"Real-time nearby earthquakes (USGS), severe-weather warnings (NWS), and natural disasters like wildfires (NASA EONET). Scoped to your home location; alerts speak and push like any JARVIS alert.",hazard_lat:"Override (optional) — blank uses home coordinates.",hazard_lon:"Override (optional) — blank uses home coordinates.",briefing_morning_enabled:Rn,briefing_evening_enabled:Rn,banter_level:"Banter is silenced automatically during anything urgent — a safety alert always speaks plainly.",search_backend:"DuckDuckGo needs no setup; SearXNG needs a URL.",web_research_llm_fallback:"When the backend above finds nothing, let JARVIS fall back to the configured LLM's own live web search (currently Gemini only). Off by default.",identity_min_confidence:"Below this face-match confidence a person is recorded as 'unknown'. Higher = stricter, fewer false names.",voice_confirm_enabled:"Ask out loud before sensitive actions (unlock, garage, disarm) and listen for a spoken yes/no. Native mode uses the satellite's own audio; gated mode speaks through the room speaker (Nest).",directive:"overrides preset — (optional) a custom standing directive",bedroom_areas:"Bedroom areas drive sleep detection during quiet hours.",broadcast_group:"The broadcast group is the media_player JARVIS announces through.",observer_quiet_start:Cn,observer_quiet_end:Cn,identity_voice_fingerprint:"needs a GPU",imap_enabled:"Read-only inbox access. The password is not entered here — set it in Settings → Devices & Services → JARVIS → Configure → Email (it lives in Home Assistant secrets.yaml).",pattern_learn_doors:"Door, window and garage contact sensors",pattern_learn_presence:"People and device trackers (home / away)",pattern_learn_buttons:'Suggest "press → scene / action" automations',suggest_garage_confirmation:'Safety-sensitive: suggest "arrive → open, confirm, then close a cover" routines. Off by default; you still approve each one.',pattern_include_entities:"for a skipped-domain entity you want as a routine trigger — e.g. a bay occupancy sensor",excluded_entities:"Entities you exclude are removed from JARVIS's awareness — presence detection, room routing, the observer and routine learning all skip them. Home Assistant still has the entity, and JARVIS can still control it if you ask for it by name.",excluded_domains:"e.g. light, switch — every entity in the domain",excluded_labels:"every entity carrying a Home Assistant label",lab_areas:"Lab rooms — quiet only here",movie_media_player:"optional",document_watch_folders:"one folder per line or comma-separated — e.g. /media/downloads",residence_style:ke,home_stories:ke,garage_bays:ke,dormers_front:ke,dormers_rear:ke,chimney_side:ke,chimney_count:ke,has_basement:ke,basement_entrance:ke,home_bedrooms:ke,home_bathrooms:ke,floor_plan_sqft:ke,door_mapping:"Edited visually in the floor-plan editor (Phase 3); raw JSON here."};function $i(a){return Mn[a]?Mn[a]:/_provider$/.test(a)||/(^|_)model$/.test(a)?vo:a.startsWith("floor_plan_")&&a!=="floor_plan_sqft"?"Edited visually in the floor-plan editor (Phase 3); raw JSON here.":""}var Nn={custom_base_url:"http://gpu-server:11434/v1",ollama_base_url:"http://gpu-server:11434/v1"},mo={ui_language:{auto:"Auto (Home Assistant)",en:"English",zh:"中文（简体）","zh-hant":"中文（繁體）",cs:"Čeština",da:"Dansk",de:"Deutsch",es:"Español",fr:"Français",it:"Italiano",nl:"Nederlands",nb:"Norsk bokmål",pl:"Polski",pt:"Português","pt-br":"Português (Brasil)",ro:"Română",ru:"Русский",sk:"Slovenčina",fi:"Suomi",sv:"Svenska",tr:"Türkçe",uk:"Українська"},output_language:{"":"Auto (Home Assistant)",en:"English",zh:"中文 (Chinese)",cs:"Čeština (Czech)",da:"Dansk (Danish)",nl:"Nederlands (Dutch)",fi:"Suomi (Finnish)",fr:"Français (French)",de:"Deutsch (German)",el:"Ελληνικά (Greek)",he:"עברית (Hebrew)",hu:"Magyar (Hungarian)",id:"Indonesia (Indonesian)",it:"Italiano (Italian)",ja:"日本語 (Japanese)",ko:"한국어 (Korean)",nb:"Norsk (Norwegian)",pl:"Polski (Polish)",pt:"Português (Portuguese)",ro:"Română (Romanian)",ru:"Русский (Russian)",sk:"Slovenčina (Slovak)",es:"Español (Spanish)",sv:"Svenska (Swedish)",th:"ไทย (Thai)",tr:"Türkçe (Turkish)",uk:"Українська (Ukrainian)",vi:"Tiếng Việt (Vietnamese)"},banter_level:{0:"Plain — no wit",1:"Dry — occasional wit",2:"Full — MCU JARVIS"},camera_alert_level:{off:"Off — observe only",urgent:"Urgent only (default)",important:"Important — + deliveries",all:"Everything notable"},chimney_side:{right:"East / right",left:"West / left",center:"Center / ridge",none:"None"},basement_entrance:{bulkhead:"Exterior bulkhead",interior:"Interior stairs (inside)"},voice_confirm_mode:{auto:"Auto (try native, fall back)",native:"Native (satellite audio)",gated:"Gated (room speaker)"},search_backend:{duckduckgo:"DuckDuckGo (no key, default)",searxng:"SearXNG (self-hosted)"},recognition_source:{both:"Both (Double Take + Frigate)",frigate:"Frigate only (sub_label)",doubletake:"Double Take only"},energy_agency:{advisory:"advisory",opt_in:"opt-in",autonomous:"autonomous"}};function Lr(a,i){let e=mo[a];return e&&i in e?e[i]:a==="directive_preset"?i.replace(/_/g," "):i}var xi={friday_automator:`Enable the FRIDAY automator?

Unlike every other sub-agent, FRIDAY can CONTROL your devices, run scenes and run scripts on its own. Only enable it if you want JARVIS to actuate your home autonomously.`,autonomy_enforce:`Let JARVIS act without asking?

When ON, JARVIS will perform convenience automations it has learned you approve (e.g. lights on at dusk) on its own, without a prompt each time — governed by the kernel's per-capability trust ladder.

It will NEVER auto-act security- or safety-critical capabilities: unlocking doors, disarming the alarm, opening the garage, or turning lockdown off ALWAYS ask first, no matter how often approved.

You can turn this back off here at any time. Enable kernel-governed autonomy?`,suggest_garage_confirmation:"This lets JARVIS SUGGEST automations that close a garage door or cover automatically once a confirmation sensor fires. Nothing installs without your explicit approval, and each suggestion is flagged safety-sensitive. Enable these suggestions?"},fo=["groq","openai","gemini","ollama","anthropic","custom"],go=[{value:"cape_cod",label:"Cape Cod"},{value:"colonial",label:"Colonial"},{value:"dutch_colonial",label:"Dutch Colonial"},{value:"ranch",label:"Ranch"},{value:"two_story",label:"Two-Story"},{value:"craftsman",label:"Craftsman"},{value:"modern",label:"Modern"},{value:"townhouse",label:"Townhouse"},{value:"apartment",label:"Apartment"},{value:"cabin",label:"Cabin"}],In=new Set(["excluded_entities","pattern_include_entities","presence_only_entities","voice_confirm_entities","outdoor_entities","indoor_entities","biometric_entities"]),Hn=new Set(["movie_area","bedroom_areas","lab_areas","outdoor_areas"]),bo=/travel|commute|duration|eta|arrival|route|waze|maps|mapbox|tomtom|here[_ ]?travel|traffic|drive[_ ]?time|driving|depart|time_to|to_work|to_home/i,_o=/^(min|mins|minute|minutes|h|hr|hrs|hour|hours)$/i,Ln=/android[_ ]?auto|head[_ ]?unit|\bcar\b/i,yo=500;function Lt(a){return Object.values(a?.states??{})}function Pt(a){let i=a.attributes?.friendly_name;return typeof i=="string"&&i?i:a.entity_id}function gt(a,i){let e=a?.config?.[i];return Array.isArray(e)?e:[]}function Pn(a,i){return gt(a,i).filter(e=>typeof e=="string")}function Bn(a,i,e){let t=[];if(a==="notify_service")t=Pn(i,"notify_services_available").map(r=>({value:r,label:r.replace(/^notify\./,"")}));else if(a==="broadcast_group"||a==="movie_media_player")t=Lt(e).filter(r=>r.entity_id.startsWith("media_player.")).map(r=>({value:r.entity_id,label:Pt(r)}));else if(a==="departure_origin_entity")t=Lt(e).filter(r=>/^(person|device_tracker|zone)\./.test(r.entity_id)||r.entity_id.startsWith("sensor.")&&"latitude"in(r.attributes??{})&&"longitude"in(r.attributes??{})).map(r=>({value:r.entity_id,label:Pt(r)}));else if(a==="departure_travel_sensor")t=Lt(e).filter(r=>r.entity_id.startsWith("sensor.")&&(r.attributes?.device_class==="duration"||_o.test(String(r.attributes?.unit_of_measurement??""))||bo.test(r.entity_id))).map(r=>({value:r.entity_id,label:Pt(r)}));else if(a==="driving_car_sensor")t=Lt(e).filter(r=>r.entity_id.startsWith("binary_sensor.")&&(Ln.test(r.entity_id)||Ln.test(Pt(r))||r.attributes?.device_class==="connectivity")).map(r=>({value:r.entity_id,label:Pt(r)}));else if(a==="residence_style")t=go;else if(Hn.has(a))t=(i?.areas??[]).map(r=>({value:r.id,label:r.name}));else if(In.has(a))t=Lt(e).map(r=>({value:r.entity_id,label:Pt(r)}));else if(a==="excluded_domains")t=[...new Set(Lt(e).map(r=>r.entity_id.split(".")[0]))].sort().map(r=>({value:r,label:r}));else if(a==="excluded_labels")t=gt(i,"available_labels").map(r=>String(r.name??r.label_id??r.id??"")).filter(Boolean).map(r=>({value:r,label:r}));else if(a==="announcement_speakers")t=gt(i,"cast_devices").map(r=>({value:String(r.entity_id??""),label:String(r.name??r.entity_id??"")}));else if(a==="disabled_cameras")t=gt(i,"cameras").map(r=>({value:String(r.entity_id??""),label:String(r.name??r.entity_id??"")}));else if(a==="disabled_sentinel_rules")t=gt(i,"sentinel_rules").map(r=>({value:String(r.id??""),label:String(r.desc??r.name??r.id??"")}));else if(/_provider$/.test(a)){let r=new Set(Pn(i,"configured_providers"));t=fo.map(n=>({value:n,label:r.has(n)?n:`${n} — needs setup`}))}return t.filter(r=>r.value).slice(0,yo)}function zn(a){let i=gt(a,"satellites"),e=gt(a,"cast_devices");return!i.length&&!e.length?null:{satellites:i.map(t=>`${t.entity_id} · ${t.area??t.area_id??t.name??""}`).join(", "),speakers:e.map(t=>String(t.entity_id??"")).join(", ")}}function qn(a){return po.has(a.key)}var Un={core:[{name:"AI Models",why:"live provider/model dropdowns need jarvis/list_models per role"},{name:"Operational Mode",why:"runtime state, now on the Overview view; area-chip picker"},{name:"System Diagnostics",why:"read-only runtime health, on the Logs view"}],voice:[{name:"Briefings",why:'"Brief me now" is a service call with a speaker precondition'},{name:"Satellite → Speaker",why:"per-satellite select editing one dict"},{name:"Announcement Speakers",why:"per-device toggle list over one array"},{name:"Voice Confirmation",why:'"Test satellite audio" probe'}],learning:[{name:"Document Library",why:"upload/ingest/search and the semantic-search probe"},{name:"Excluded Entities",why:"chip pickers over plain lists"},{name:"Routine Learning",why:"chip pickers over plain lists"},{name:"Observer Tuning",why:"read-only runtime stats"}],safety:[{name:"Energy Management",why:"live draw, advice and agency chips"},{name:"Hazard Monitor",why:'"Scan now" live external scan'},{name:"Muted Announcements",why:"separate mute store"},{name:"Sentinel Rules",why:"per-rule on/off rows over one list"},{name:"Appliances",why:"structured row editor over one JSON key"}],cameras:[{name:"Cameras",why:"enable/disable, rename and indoor/outdoor use two non-config commands"},{name:"Doorbell Training",why:"dataset viewer plus a service call"},{name:"Diagnostics",why:"service-call buttons, not settings"}],home:[{name:"Wellbeing Context",why:"discovered wearables are runtime data"},{name:"Floor Plan Editor",why:"own Phase 3 spec (pointer-events editor)"}],governance:[{name:"Governance",why:"enforcement kill-switches live in their own store with their own confirm rules"}]},wo=new Set(["notify_service","broadcast_group","movie_media_player","departure_origin_entity","departure_travel_sensor","driving_car_sensor","residence_style","excluded_domains","excluded_labels","announcement_speakers","disabled_cameras","disabled_sentinel_rules",...Hn,...In]);function Gn(a){return wo.has(a)||/_provider$/.test(a)}var jo=["ha-switch","ha-select","ha-list-item","mwc-list-item","ha-textfield","ha-textarea","ha-icon"],$o=30,J=class extends I{constructor(){super(...arguments);this.value=void 0;this.label="";this.help="";this.hint="";this.placeholder="";this.status=null;this.disabled=!1;this.showKey=!0;this.narrow=!1;this.flash=!1;this._draft="";this._dirty=!1;this._jsonError="";this._note=null;this._suggestions=null}connectedCallback(){super.connectedCallback(),z(this,jo)}willUpdate(e){if(this.field&&(e.has("value")||e.has("field"))){let t=this.field.kind;if(t==="list"){let r=qe(this.field,this.value),n=r.kind==="list"?r.value:[];(!this._dirty||ft(Qe(this._draft),n))&&(this._draft=ji(n),this._dirty=!1)}else if(t==="json"){let r=qe(this.field,this.value),n=r.kind==="json"?r.text:"",o=!1;if(this._dirty)try{o=ft(JSON.parse(this._draft),r.kind==="json"?r.value:null)}catch{o=!1}(!this._dirty||o)&&(this._draft=n,this._dirty=!1,this._jsonError="")}}}get _id(){return`f-${this.field.key}`}_emit(e){this._note=null;let t={key:this.field.key,value:Jt(this.field,e)};this.dispatchEvent(new CustomEvent("field-change",{detail:t}))}_ensureSuggestions(){if(this._suggestions===null&&this.suggest)try{this._suggestions=this.suggest()}catch{this._suggestions=[]}}_onToggle(e){let t=e.target;this._emit(!!t.checked)}_renderSwitch(e){let t=this.label||this.field.key;return l`
      <span class="inline">
        <span aria-hidden="true">${e?s("ON"):s("OFF")}</span>
        ${E("ha-switch")?l`<ha-switch id=${this._id} .checked=${ae(e)} ?disabled=${this.disabled} aria-label=${t} @change=${this._onToggle}></ha-switch>`:l`<input id=${this._id} type="checkbox" role="switch" .checked=${ae(e)} ?disabled=${this.disabled} aria-label=${t} @change=${this._onToggle} />`}
      </span>
    `}_onSelect(e){let t=e.target,r=String(t.value??""),n=qe(this.field,this.value);n.kind==="enum"&&r!==n.value&&this._emit(r)}_renderEnum(e,t){let r=this.field.options??[],n=this.label||this.field.key;if(E("ha-select")){let o=E("ha-list-item")?Wr`ha-list-item`:Wr`mwc-list-item`;return l`
        <ha-select
          id=${this._id}
          .label=${n}
          .value=${ae(e)}
          ?disabled=${this.disabled}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${this._onSelect}
          @closed=${c=>c.stopPropagation()}
        >
          ${t?m:Gt`<${o} .value=${e} disabled>${s("{raw} (not an option)",{raw:e||"∅"})}</${o}>`}
          ${r.map(c=>Gt`<${o} .value=${mt(c)}>${this._optionText(c)}</${o}>`)}
        </ha-select>
      `}return l`
      <select id=${this._id} .value=${ae(e)} ?disabled=${this.disabled} aria-label=${n} @change=${this._onSelect}>
        ${t?m:l`<option value=${e} disabled>${s("{raw} (not an option)",{raw:e||"∅"})}</option>`}
        ${r.map(o=>l`<option value=${mt(o)}>${this._optionText(o)}</option>`)}
      </select>
    `}_optionText(e){let t=mt(e),r=typeof e=="string"?"":Sn(e);return s(r&&r!==t?r:Lr(this.field.key,t))}_onNumber(e){this._note=null;let t=e.target,r=String(t.value??"").trim(),n=qe(this.field,this.value),o=n.kind==="number"?n.value:null;if(r===""){o!==null&&this._emit(null);return}let c=Number(r);if(!Number.isFinite(c)){this.requestUpdate();return}let{value:d,clamped:u}=En(this.field,c);if(u&&(this._note={level:"warn",message:s("Clamped to {min}–{max}",{min:String(this.field.min??"−∞"),max:String(this.field.max??"∞")})}),d!==o){let p={key:this.field.key,value:Jt(this.field,d)};this.dispatchEvent(new CustomEvent("field-change",{detail:p}))}else this.requestUpdate()}_renderNumber(e){let t=this.field,r=e===null?"":String(e),n=t.step??(t.kind==="int"?1:"any"),o=t.default===null||t.default===void 0?"":String(t.default),c=this.label||t.key;return E("ha-textfield")?l`<ha-textfield id=${this._id} type="number" .label=${c} .value=${ae(r)} .placeholder=${o}
        min=${t.min??m} max=${t.max??m} step=${n} ?disabled=${this.disabled} @change=${this._onNumber}></ha-textfield>`:l`<input id=${this._id} type="number" .value=${ae(r)} placeholder=${o} aria-label=${c}
      min=${t.min??m} max=${t.max??m} step=${n} ?disabled=${this.disabled} @change=${this._onNumber} />`}_onText(e){let t=e.target,r=String(t.value??"").trim(),n=qe(this.field,this.value);n.kind==="str"&&r!==n.value?this._emit(r):this.requestUpdate()}_renderText(e){let t=this.field,r=/_url$/.test(t.key)?"url":"text",n=this.placeholder||(/_time$/.test(t.key)||/^observer_quiet_(start|end)$/.test(t.key)?"HH:MM":""),o=this.label||t.key;if(this.suggest){let c=`${this._id}-list`;return l`
        <input id=${this._id} type=${r} .value=${ae(e)} placeholder=${n} aria-label=${o} list=${c}
          autocomplete="off" ?disabled=${this.disabled} @focus=${this._ensureSuggestions} @change=${this._onText} />
        <datalist id=${c}>
          ${(this._suggestions??[]).map(d=>l`<option value=${d.value}>${d.label}</option>`)}
        </datalist>
      `}return E("ha-textfield")?l`<ha-textfield id=${this._id} type=${r} .label=${o} .value=${ae(e)} .placeholder=${n}
        ?disabled=${this.disabled} @change=${this._onText}></ha-textfield>`:l`<input id=${this._id} type=${r} .value=${ae(e)} placeholder=${n} aria-label=${o}
      ?disabled=${this.disabled} @change=${this._onText} />`}_onDraft(e){let t=e.target;this._draft=String(t.value??""),this._note=null;let r=qe(this.field,this.value);if(this.field.kind==="json")try{let n=JSON.parse(this._draft),o=wi(this.field,n);this._jsonError=o?s(o):"",this._dirty=!ft(n,r.kind==="json"?r.value:null)}catch(n){this._jsonError=n instanceof Error?n.message:String(n),this._dirty=!0}else this._dirty=!ft(Qe(this._draft),r.kind==="list"?r.value:[])}_saveDraft(){if(this.field.kind==="json")try{let e=JSON.parse(this._draft),t=wi(this.field,e);if(t){this._jsonError=s(t);return}this._emit(e)}catch(e){this._jsonError=e instanceof Error?e.message:String(e)}else this._emit(Qe(this._draft))}_addChip(e){let t=this._draft.split(`
`),r=t[t.length-1]?.trim()??"",n=Qe(this._draft);(r&&!n.includes(r)||r==="")&&t.pop();let o=[...t.filter(d=>d.trim()!==""),e].join(`
`);this._draft=o;let c=qe(this.field,this.value);this._dirty=!ft(Qe(o),c.kind==="list"?c.value:[]),this.renderRoot.querySelector("textarea, ha-textarea")?.focus()}_renderChips(){if(!this.suggest||this._suggestions===null)return m;let e=new Set(Qe(this._draft)),t=this._draft.split(`
`),r=(t[t.length-1]??"").trim().toLowerCase(),n=r&&!e.has(t[t.length-1].trim())?r:"",o=this._suggestions.filter(d=>!e.has(d.value)&&(!n||d.value.toLowerCase().includes(n)||d.label.toLowerCase().includes(n)));if(!o.length)return m;let c=o.slice(0,$o);return l`
      <div class="chips" role="group" aria-label=${s("Suggestions")}>
        ${c.map(d=>l`<button type="button" class="chip jv-hit" title=${d.value} ?disabled=${this.disabled} @click=${()=>this._addChip(d.value)}><span class="jv-truncate">${d.label}</span></button>`)}
        ${o.length>c.length?l`<span class="jv-muted">${s("{count} more — type to filter",{count:o.length-c.length})}</span>`:m}
      </div>
    `}_renderTextarea(e){let t=this.label||this.field.key,r=this.narrow?6:5,n=!!this._jsonError,o=E("ha-textarea")?l`<ha-textarea id=${this._id} class=${e?"jv-mono":""} .label=${t} .value=${ae(this._draft)} rows=${r} autogrow
          ?disabled=${this.disabled} .helper=${this.field.kind==="list"?s("One item per line"):""} helperPersistent
          @input=${this._onDraft} @focus=${this._ensureSuggestions}></ha-textarea>`:l`<textarea id=${this._id} class=${e?"jv-mono":""} .value=${ae(this._draft)} rows=${r} aria-label=${t}
          aria-invalid=${n?"true":"false"} placeholder=${this.field.kind==="list"?s("One item per line"):""}
          ?disabled=${this.disabled} @input=${this._onDraft} @focus=${this._ensureSuggestions}></textarea>`,c=this.field.kind==="list"?Qe(this._draft).length:0;return l`
      <div class="control wide">
        ${o}
        ${this.field.kind==="list"?this._renderChips():m}
        <div class="save-row">
          ${n?l`<span class="status error" role="alert">${s("Invalid JSON: {message}",{message:this._jsonError})}</span>`:m}
          ${this.field.kind==="list"&&this._dirty?l`<span class="jv-muted">${s("{count} items",{count:c})}</span>`:m}
          <button type="button" class="jv-btn primary" ?disabled=${this.disabled||!this._dirty||n} @click=${this._saveDraft}>${s("Save")}</button>
        </div>
      </div>
    `}render(){let e=this.field;if(!e)return m;let t=qe(e,this.value),r="warning"in t&&t.warning?s(t.warning,{raw:Qt(this.value)}):"",n=ft(this.value===void 0?e.default:this.value,e.default),o=this.status&&this._note&&this.status.level!=="error"?{level:this._note.level,message:`${this.status.message} · ${this._note.message}`}:this.status??this._note,c=o||(r?{level:"warn",message:r}:null),d=t.kind==="bool",u=this.label||e.label||e.key,p;switch(t.kind){case"bool":p=this._renderSwitch(t.value);break;case"enum":p=this._renderEnum(t.value,t.inOptions);break;case"number":p=this._renderNumber(t.value);break;case"str":p=this._renderText(t.value);break;case"list":p=this._renderTextarea(!1);break;case"json":p=this._renderTextarea(!0);break}return l`
      <div class="head">
        <div class="labels">
          <label class="label" for=${this._id}>${u}</label>
          ${e.expose?l`<jv-state-badge level="info" nodot .label=${s("HA entity")}></jv-state-badge>`:m}
          ${this.showKey?l`<code class="key jv-mono">${e.key}</code>`:m}
        </div>
        ${d?p:m}
      </div>
      ${this.help?l`<p class="help">${this.help}</p>`:m}
      ${this.hint?l`<p class="help jv-mono">${this.hint}</p>`:m}
      ${d||t.kind==="list"||t.kind==="json"?d?m:p:l`<div class="control">${p}</div>`}
      <div class="foot">
        ${n?m:l`
              <span>${s("Default: {value}",{value:An(e,e.default,s("ON"),s("OFF"))})}</span>
              <button type="button" class="reset jv-hit" ?disabled=${this.disabled}
                @click=${()=>this.dispatchEvent(new CustomEvent("field-reset",{detail:{key:e.key}}))}>${s("Reset to default")}</button>
            `}
        <span class="status ${c?.level??""}" role="status" aria-live="polite">${c?.message??""}</span>
      </div>
    `}resetDraft(){let e=qe(this.field,this.value);this._dirty=!1,this._jsonError="",this._draft=e.kind==="json"?e.text:e.kind==="list"?ji(e.value):""}};J.styles=[F,R`
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
    `],h([x({attribute:!1})],J.prototype,"field",2),h([x({attribute:!1})],J.prototype,"value",2),h([x({type:String})],J.prototype,"label",2),h([x({type:String})],J.prototype,"help",2),h([x({type:String})],J.prototype,"hint",2),h([x({type:String})],J.prototype,"placeholder",2),h([x({attribute:!1})],J.prototype,"suggest",2),h([x({attribute:!1})],J.prototype,"status",2),h([x({type:Boolean,reflect:!0})],J.prototype,"disabled",2),h([x({type:Boolean,attribute:"show-key"})],J.prototype,"showKey",2),h([x({type:Boolean,reflect:!0})],J.prototype,"narrow",2),h([x({type:Boolean,reflect:!0})],J.prototype,"flash",2),h([$()],J.prototype,"_draft",2),h([$()],J.prototype,"_dirty",2),h([$()],J.prototype,"_jsonError",2),h([$()],J.prototype,"_note",2),h([$()],J.prototype,"_suggestions",2),J=h([D("jarvis-config-field")],J);var xo=300,ko=2e3,So=6e3,Eo=1600,we=class extends te{constructor(){super(...arguments);this._schema=null;this._error=null;this._loading=!1;this._query="";this._searchOpen=!1;this._showKeys=!1;this._status=new Map;this._flashKey="";this._inflight=new Set;this._queued=new Map;this._statusTimers=new Map;this._lastDeepLink=""}connectedCallback(){super.connectedCallback(),z(this,["ha-textfield","ha-icon","ha-icon-button","ha-alert"])}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._refetchTimer),clearTimeout(this._flashTimer);for(let e of this._statusTimers.values())clearTimeout(e);this._statusTimers.clear()}updated(e){e.has("hass")&&this.hass&&!this._schema&&!this._loading&&(!this._error||this._error.code==="no_connection")&&this._load(),e.has("route")&&this._handleDeepLink()}async _load(e=!1){if(this.hass){e||(this._loading=!0,this._error=null);try{let t=await this.ws("jarvis/config_schema"),r=Array.isArray(t?.fields)?t.fields:[],n={...t?.values??{}},o=Array.isArray(t?.categories)&&t.categories.length?t.categories:[...new Set(r.map(c=>c.category))];if(e&&this._schema){let c=new Set([...this._inflight,...this._queued.keys()]),d=this._focusedKey();d&&c.add(d);for(let u of c)u in this._schema.values&&(n[u]=this._schema.values[u])}this._schema={fields:r,values:n,categories:o},this._error=null}catch(t){let r=Q.from("jarvis/config_schema",t);e||(this._error=r)}finally{this._loading=!1}this._handleDeepLink()}}_focusedKey(){let e=this.shadowRoot?.activeElement;return(e?.tagName?.toLowerCase()==="jarvis-config-field"?e:e?.closest?.("jarvis-config-field"))?.field?.key}_scheduleRefetch(){clearTimeout(this._refetchTimer),this._refetchTimer=setTimeout(()=>{this._load(!0)},xo)}_setStatus(e,t,r){let n=new Map(this._status);clearTimeout(this._statusTimers.get(e)),this._statusTimers.delete(e),t?n.set(e,t):n.delete(e),this._status=n,t&&r&&this._statusTimers.set(e,setTimeout(()=>{this._status.get(e)===t&&this._setStatus(e,null)},r))}_toast(e){this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:e},bubbles:!0,composed:!0}))}_field(e){return this._schema?.fields.find(t=>t.key===e)}_labelFor(e){return s(On[e.key]??e.label??e.key)}async _change(e,t,r){let n=this._field(e);if(n){if(n.kind==="bool"&&t===!0&&xi[e]&&!await ue({heading:this._labelFor(n),message:s(xi[e]),confirmLabel:s("Enable"),destructive:!0})){r?.requestUpdate();return}if(e==="ui_language")try{await vr(mr(t,this.hass?.language))}catch{}await this._save(e,t)}}async _save(e,t){let r=this._field(e);if(r){if(this._inflight.has(e)){this._queued.set(e,t);return}this._inflight.add(e),this._setStatus(e,{level:"saving",message:s("Saving…")});try{await this.ws("jarvis/update_config",{key:e,value:t}),this._schema&&(this._schema={...this._schema,values:{...this._schema.values,[e]:t}});let n="saved",o=r.kind==="list"&&Array.isArray(t)?s("Saved ✓ ({count} items)",{count:t.length}):s("Saved ✓");if(Fn.has(e))try{await this.ws("jarvis/reload_appliances"),o=s("Saved — appliance monitor reloaded")}catch(c){n="warn",o=s("Saved — appliance monitor reload failed: {message}",{message:Q.from("jarvis/reload_appliances",c).message})}this._setStatus(e,{level:n,message:o},n==="saved"?ko:So),this._scheduleRefetch(),this.refresh()}catch(n){let o=Q.from("jarvis/update_config",n),c=s("Save failed — {message}",{message:o.message});this._setStatus(e,{level:"error",message:c}),this._toast(c)}finally{if(this._inflight.delete(e),this._queued.has(e)){let n=this._queued.get(e);this._queued.delete(e),this._save(e,n)}}}}_onFieldChange(e){this._change(e.detail.key,e.detail.value,e.target)}_onFieldReset(e){let t=this._field(e.detail.key);t&&this._change(t.key,Jt(t,t.default),e.target)}get _categories(){return this._schema?this._schema.categories.filter(e=>e!=="Other"||this._fieldsIn(e).length>0):Dn}get _activeCategory(){let e=this._categories,[t]=this.subPath.split("/");return t&&e.includes(t)?t:e[0]??"core"}_go(e){this._query="",this.navigate("settings",e)}async _handleDeepLink(){let[e,t]=this.subPath.split("/");if(!t||!this._schema)return;let r=`${e}/${t}`;if(r===this._lastDeepLink)return;this._lastDeepLink=r,this._query="",await this.updateComplete;let n=this.renderRoot.querySelector(`jarvis-config-field[data-key="${t}"]`);if(!n)return;let o=!1;try{o=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches}catch{o=!1}n.scrollIntoView?.({block:"center",behavior:o?"auto":"smooth"}),this._flashKey=t,clearTimeout(this._flashTimer),this._flashTimer=setTimeout(()=>{this._flashKey===t&&(this._flashKey="")},Eo)}_fieldsIn(e,t=""){if(!this._schema)return[];let r=t.trim();return this._schema.fields.filter(n=>{if(n.category!==e)return!1;if(!r)return!qn(n);let o=(n.options??[]).map(c=>s(Lr(n.key,mt(c))));return Tn(r,n.key,this._labelFor(n),s($i(n.key)),o)})}_value(e){let t=this._schema?.values??{};return e.key in t?t[e.key]:e.default}render(){let e=this.narrow,t=!this.hass;return l`
      <div class="wrap ${e?"narrow":""}">
        ${t?this._renderOffline():m}
        ${e?this._renderNarrowToolbar():this._renderToolbar()}
        <div class="layout">
          ${e?m:this._renderRail()}
          <div class="content">${this._renderContent()}</div>
        </div>
      </div>
    `}_renderOffline(){let e=s("Reconnecting to Home Assistant…");return E("ha-alert")?l`<ha-alert class="offline" alert-type="warning">${e}</ha-alert>`:l`<div class="offline" role="status">${e}</div>`}_onSearchInput(e){this._query=String(e.target.value??"")}_onSearchKey(e){e.key==="Escape"&&(this._query="",e.target.value="")}_renderSearch(){let e=s("Search settings…");return E("ha-textfield")?l`<ha-textfield class="search" type="search" .label=${e} .value=${ae(this._query)} @input=${this._onSearchInput} @keydown=${this._onSearchKey}></ha-textfield>`:l`<input class="search" type="search" placeholder=${e} aria-label=${e} .value=${ae(this._query)} @input=${this._onSearchInput} @keydown=${this._onSearchKey} />`}_renderToolbar(){return l`<div class="toolbar">${this._renderSearch()}</div>`}_iconBtn(e,t,r,n){return l`
      <button type="button" class="jv-icon-btn" aria-label=${t} title=${t} aria-pressed=${r===void 0?m:r?"true":"false"} @click=${n}>
        ${E("ha-icon")?l`<ha-icon .icon=${e}></ha-icon>`:l`<span aria-hidden="true">${e==="mdi:magnify"?"⌕":"</>"}</span>`}
      </button>
    `}_renderNarrowToolbar(){let e=this._activeCategory;return l`
      <div class="toolbar row2">
        <div class="chips-row" role="group" aria-label=${s("Settings sections")}>
          ${this._categories.map(t=>l`<button type="button" class="chip jv-hit" aria-current=${t===e&&!this._query?"page":m} @click=${()=>this._go(t)}>${s(er[t]??t)}</button>`)}
        </div>
        ${this._iconBtn("mdi:magnify",s("Search settings…"),this._searchOpen||!!this._query,()=>{this._searchOpen=!this._searchOpen,this._searchOpen||(this._query="")})}
        ${this._iconBtn("mdi:code-tags",s("Show keys"),this._showKeys,()=>this._showKeys=!this._showKeys)}
        ${this._searchOpen||this._query?this._renderSearch():m}
      </div>
    `}_renderRail(){let e=this._activeCategory,t=!!this._schema;return l`
      <nav class="rail ${this._query?"dim":""}" aria-label=${s("Settings sections")}>
        <ul>
          ${this._categories.map(r=>{let n=this._fieldsIn(r).length;return l`
              <li>
                <button type="button" class="rail-btn" aria-current=${r===e&&!this._query?"page":m} @click=${()=>this._go(r)}>
                  <span class="jv-truncate">${s(er[r]??r)}</span>
                  ${t?l`<span class="count" aria-label=${s("{count} settings",{count:n})}>${n}</span>`:m}
                </button>
              </li>
            `})}
        </ul>
      </nav>
    `}_renderContent(){if(this._error)return this._renderError(this._error);if(!this._schema)return l`<jv-section .heading=${s("Settings")} loading><jv-empty kind="loading" .heading=${s("Loading settings…")}></jv-empty></jv-section>`;if(this._query.trim())return this._renderSearchResults();let e=this._activeCategory,t=this._fieldsIn(e),r=Un[e]??[];return l`
      <div class="stack">
        <jv-section .heading=${s(er[e]??e)} .subheading=${s("{count} settings",{count:t.length})}>
          ${t.length?this._renderFields(t):l`<jv-empty compact icon="mdi:cog-off-outline" .message=${s("No settings in this section.")}></jv-empty>`}
        </jv-section>
        ${r.length?this._renderNotPorted(r):m}
      </div>
    `}_renderError(e){let t=e.message;return e.code==="unknown_command"?t=s("The backend does not provide jarvis/config_schema yet — update the JARVIS integration."):e.code==="unauthorized"&&(t=s("Administrator access is required.")),l`
      <jv-section>
        <jv-empty kind="error" icon="mdi:alert-circle-outline" .heading=${s("Couldn't load the settings catalogue")} .message=${t}>
          <button slot="action" type="button" class="jv-btn primary" @click=${()=>{this._load()}}>${s("Retry")}</button>
        </jv-empty>
      </jv-section>
    `}_renderSearchResults(){let e=this._query,t=this._categories.map(r=>({c:r,fields:this._fieldsIn(r,e)})).filter(r=>r.fields.length>0);return t.length?l`
      <div class="stack">
        ${t.map(r=>l`
            <jv-section .heading=${s(er[r.c]??r.c)} .subheading=${s("{count} matches",{count:r.fields.length})}>
              ${this._renderFields(r.fields)}
            </jv-section>
          `)}
      </div>
    `:l`
        <jv-section>
          <jv-empty compact icon="mdi:magnify" .heading=${s("No settings match “{query}”.",{query:e.trim()})}>
            <button slot="action" type="button" class="jv-btn" @click=${()=>this._query=""}>${s("Clear search")}</button>
          </jv-empty>
        </jv-section>
      `}_renderFields(e){let t=!this.hass,r="";return l`
      <div class="fields">
        ${e.map((n,o)=>{let c=n.key.split("_")[0],d=o>0&&c!==r;r=c;let u=$i(n.key),p=n.key==="satellite_pairings"?zn(this.data):null,v=p?s("Keys: {satellites}; values: {speakers}",p):"",f=Gn(n.key)?()=>Bn(n.key,this.data,this.hass):void 0;return l`
            ${d?l`<hr class="jv-divider" />`:m}
            <jarvis-config-field
              data-key=${n.key}
              .field=${n}
              .value=${this._value(n)}
              .label=${this._labelFor(n)}
              .help=${u?s(u):""}
              .hint=${v}
              .placeholder=${Nn[n.key]??""}
              .suggest=${f}
              .status=${this._status.get(n.key)??null}
              .showKey=${!this.narrow||this._showKeys}
              .narrow=${this.narrow}
              ?disabled=${t}
              ?flash=${this._flashKey===n.key}
              @field-change=${this._onFieldChange}
              @field-reset=${this._onFieldReset}
            ></jarvis-config-field>
          `})}
      </div>
    `}_renderNotPorted(e){let t=l`
      <ul class="ports">
        ${e.map(n=>l`<li>${s(n.name)} — ${s(n.why)} — ${s("Phase 3")}</li>`)}
      </ul>
    `,r=s("Not yet ported");return this.narrow?l`<jv-section><details><summary>${r}</summary>${t}</details></jv-section>`:l`<jv-section .heading=${r} icon="mdi:progress-wrench">${t}</jv-section>`}};we.styles=[F,R`
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
    `],h([$()],we.prototype,"_schema",2),h([$()],we.prototype,"_error",2),h([$()],we.prototype,"_loading",2),h([$()],we.prototype,"_query",2),h([$()],we.prototype,"_searchOpen",2),h([$()],we.prototype,"_showKeys",2),h([$()],we.prototype,"_status",2),h([$()],we.prototype,"_flashKey",2),we=h([D("jarvis-view-settings")],we);var Le=[{key:"overview",title:"Overview",icon:"mdi:view-dashboard-outline",element:"jarvis-view-overview"},{key:"intrusion",title:"Intrusion",icon:"mdi:shield-home-outline",element:"jarvis-view-intrusion"},{key:"suggestions",title:"Suggestions",icon:"mdi:lightbulb-on-outline",element:"jarvis-view-suggestions"},{key:"memory",title:"Memory",icon:"mdi:brain",element:"jarvis-view-memory"},{key:"residence",title:"Residence",icon:"mdi:floor-plan",element:"jarvis-view-residence"},{key:"logs",title:"Logs",icon:"mdi:text-box-search-outline",element:"jarvis-view-logs"},{key:"settings",title:"Settings",icon:"mdi:cog-outline",element:"jarvis-view-settings"}],tr="overview";function Dt(a){return Le.find(i=>i.key===a)}var Kn=2e4,Ao=250,To=1500,Ro=["ha-icon","ha-icon-button","ha-menu-button","ha-alert"],be=class extends I{constructor(){super(...arguments);this.narrow=!1;this._data=null;this._error=null;this._loading=!1;this._langReady=!1;this._view=tr;this._timer=null;this._debounce=null;this._lastFetch=0;this._inFlight=null;this._tags=new Map;this._onLocationChanged=()=>{let e=this._prefix;if(!location.pathname.startsWith(e))return;let t=location.pathname.slice(e.length);(!this.route||this.route.path!==t)&&(this.route={prefix:e,path:t})};this._onNavigateRequest=e=>{e.stopPropagation();let t=e.detail||{};t.view&&this.navigate(t.view,t.path)};this._onVisibility=()=>{document.visibilityState==="visible"&&Date.now()-this._lastFetch>Kn&&this._load()};this._onRefreshRequest=e=>{e.stopPropagation(),this._debounce&&clearTimeout(this._debounce),this._debounce=setTimeout(()=>{this._debounce=null,this._load()},Ao)}}connectedCallback(){super.connectedCallback(),z(this,Ro),window.addEventListener("location-changed",this._onLocationChanged),window.addEventListener("popstate",this._onLocationChanged),document.addEventListener("visibilitychange",this._onVisibility),this.addEventListener("jarvis-refresh",this._onRefreshRequest),this.addEventListener("jarvis-navigate",this._onNavigateRequest),this.route||this._syncViewFromLocation(),this._startTimer(),this._gateLanguage()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("location-changed",this._onLocationChanged),window.removeEventListener("popstate",this._onLocationChanged),document.removeEventListener("visibilitychange",this._onVisibility),this.removeEventListener("jarvis-refresh",this._onRefreshRequest),this.removeEventListener("jarvis-navigate",this._onNavigateRequest),this._stopTimer()}willUpdate(e){e.has("route")&&this._syncViewFromRoute(),e.has("hass")&&this.hass&&(e.get("hass")||this._load(),this._ensureLanguage())}updated(e){e.has("_view")&&e.get("_view")!==void 0&&(this.scrollTop=0,this.renderRoot.querySelector("main")?.focus({preventScroll:!0}))}get _prefix(){return this.route?.prefix||"/jarvis"}_syncViewFromRoute(){let e=(this.route?.path||"").split("/").filter(Boolean)[0];this._view=Dt(e)?.key??tr}_syncViewFromLocation(){let e=this._prefix,t=location.pathname.startsWith(e)?location.pathname.slice(e.length):"",r=t.split("/").filter(Boolean)[0];this._view=Dt(r)?.key??tr,this.route||(this.route={prefix:e,path:t||`/${this._view}`})}navigate(e,t,r=!1){let n=Dt(e)??Dt(tr),o=t?`/${t.replace(/^\/+/,"")}`:"",c=`${this._prefix}/${n.key}${o}`;location.pathname===c&&this._view===n.key||ta(c,r)}_startTimer(){this._timer||(this._timer=setInterval(()=>{document.visibilityState==="visible"&&this._load()},Kn))}_stopTimer(){this._timer&&clearInterval(this._timer),this._timer=null,this._debounce&&clearTimeout(this._debounce),this._debounce=null}async refresh(){return this._load()}_load(){return this.hass?this._inFlight?this._inFlight:(this._loading=!0,this._inFlight=(async()=>{try{let e=await Z(this.hass,"jarvis/get_panel_data");this._data=e,this._error=null,this._lastFetch=Date.now(),this._ensureLanguage()}catch(e){let t=e instanceof Q?e:Q.from("jarvis/get_panel_data",e);this._error=t.message||t.code}finally{this._loading=!1,this._inFlight=null}})(),this._inFlight):Promise.resolve()}_gateLanguage(){this._langReady||setTimeout(()=>{this._langReady=!0},To)}async _ensureLanguage(){let e=mr(this._data?.config?.ui_language,this.hass?.language);if(e.toLowerCase()===Qi()&&this._langReady)return;let t=await vr(e);this._langReady=!0,t&&(this.requestUpdate(),this.renderRoot.querySelectorAll("[data-jv-view]").forEach(r=>r.requestUpdate?.()))}_onTabKeydown(e){if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key))return;e.preventDefault();let r=Le.findIndex(c=>c.key===this._view),n=r;e.key==="ArrowRight"?n=(r+1)%Le.length:e.key==="ArrowLeft"?n=(r-1+Le.length)%Le.length:e.key==="Home"?n=0:e.key==="End"&&(n=Le.length-1);let o=Le[n];this.navigate(o.key),this.updateComplete.then(()=>{this.renderRoot.querySelector(`[role="tab"][data-view="${o.key}"]`)?.focus()})}_tag(e){let t=this._tags.get(e);return t||(t=Vi(e),this._tags.set(e,t)),t}_icon(e){return E("ha-icon")?l`<ha-icon .icon=${e} aria-hidden="true"></ha-icon>`:m}_renderMenuButton(){return E("ha-menu-button")?l`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:l`
      <button class="jv-icon-btn menu-btn" type="button" aria-label=${s("Menu")} @click=${()=>ea(this)}>
        ${E("ha-icon")?this._icon("mdi:menu"):l`<span aria-hidden="true">≡</span>`}
      </button>
    `}_renderRefreshButton(){let e=s("Refresh");return E("ha-icon-button")?l`
        <ha-icon-button .label=${e} .disabled=${this._loading} @click=${()=>{this._load()}}>
          ${this._icon("mdi:refresh")}
        </ha-icon-button>
      `:l`
      <button class="jv-icon-btn" type="button" aria-label=${e} ?disabled=${this._loading} @click=${()=>{this._load()}}>
        ${E("ha-icon")?this._icon("mdi:refresh"):l`<span aria-hidden="true">↻</span>`}
      </button>
    `}_renderTabs(){return l`
      <div role="tablist" aria-label=${s("Sections")} @keydown=${this._onTabKeydown}>
        ${Le.map(e=>this._renderTab(e))}
      </div>
    `}_renderTab(e){let t=e.key===this._view;return l`
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
        <span>${s(e.title)}</span>
      </button>
    `}_renderBottomNav(){return l`
      <nav class="bottom ${E("ha-icon")?"":"no-icons"}" aria-label=${s("Sections")}>
        ${Le.map(e=>l`
            <button
              class="nav-item"
              type="button"
              data-view=${e.key}
              aria-current=${e.key===this._view?"page":m}
              aria-label=${s(e.title)}
              @click=${()=>this.navigate(e.key)}
            >
              ${this._icon(e.icon)}
              <span class="label">${s(e.title)}</span>
            </button>
          `)}
      </nav>
    `}_renderError(){if(!this._error)return m;let e=s("Could not load JARVIS data"),t=l`
      <button class="jv-btn text" type="button" slot="action" @click=${()=>{this._load()}}>${s("Retry")}</button>
    `;return E("ha-alert")?l`<ha-alert alert-type="error" .title=${e}>${this._error}${t}</ha-alert>`:l`
      <div class="alert" role="alert">
        <div class="body"><strong>${e}</strong><span>${this._error}</span></div>
        ${t}
      </div>
    `}_renderView(){if(!this.hass||!this._langReady)return l`<div class="gate" role="status" aria-live="polite">${s("Loading...")}</div>`;let e=Dt(this._view)??Le[0],t=this._tag(e.element),r=this.route??{prefix:this._prefix,path:`/${e.key}`};return Gt`
      <${t}
        data-jv-view=${e.key}
        .hass=${this.hass}
        .narrow=${this.narrow}
        .data=${this._data}
        .route=${r}
      ></${t}>
    `}render(){let e=!!this._data?.lockdown?.active,t=!!this._data?.intrusion?.active,r=this._data?.version;return l`
      <header>
        <div class="brand">
          ${this.narrow?this._renderMenuButton():m}
          <svg class="logo" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
            <rect x="1.5" y="1.5" width="25" height="25" rx="7" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path d="M17.6 7.5v8.4a4.4 4.4 0 0 1-8.8 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          </svg>
          <h1>
            JARVIS
            ${r?l`<span class="ver jv-mono">v${r}</span>`:m}
          </h1>
        </div>
        ${this.narrow?m:this._renderTabs()}
        <div class="spacer"></div>
        <div class="bar-actions">
          ${e?l`<jv-state-badge level="danger" .label=${s("Lockdown")}></jv-state-badge>`:t?l`<jv-state-badge level="warn" pulse .label=${s("Intrusion")}></jv-state-badge>`:this._data?l`<jv-state-badge
                    level=${ra(this._data.status?.observer?.level)}
                    .label=${s("Observer")}
                  ></jv-state-badge>`:m}
          ${this._renderRefreshButton()}
        </div>
      </header>
      <main id="main" tabindex="-1" role="tabpanel" aria-labelledby=${this.narrow?m:`tab-${this._view}`}>
        ${this._renderError()}
        ${this._renderView()}
      </main>
      ${this.narrow?this._renderBottomNav():m}
    `}};be.styles=[F,R`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: var(--jv-bg);
        color: var(--jv-text);
        overflow-y: auto;
        overscroll-behavior: contain;
        /* the panel's own width drives the bottom-nav label rule below */
        container: jv-panel / inline-size;
        /* The height of the stuck app bar (56 px, plus the 48 px tab row
           below 1100 px). Views inherit it for their own sticky offsets, and
           scroll-padding keeps a focused control or a scrollIntoView target
           from landing underneath the header / the bottom nav. */
        --jv-sticky-top: calc(var(--jv-header-height) + 48px);
        scroll-padding-top: var(--jv-sticky-top);
      }
      @media (min-width: 1100px) {
        :host {
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
      /* Below 1100px the tabs take a full second row under the brand;
         above it they sit inline, centred between brand and actions. */
      [role="tablist"] {
        display: flex;
        align-items: stretch;
        flex: 1 1 100%;
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
        order: 10;
        margin: 0 calc(-1 * var(--jv-space-2));
        padding: 0 var(--jv-space-2);
      }
      [role="tablist"]::-webkit-scrollbar {
        display: none;
      }
      @media (min-width: 1100px) {
        [role="tablist"] {
          flex: 1 1 auto;
          order: 0;
          justify-content: center;
          margin: 0;
          padding: 0;
        }
      }
      .tab {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
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
      /* Seven destinations do not fit labelled on a phone (an item is ~55 px
         at 412 px; "Suggestions" / "Einstellungen" need 60-70 px). When the
         panel itself is narrower than 520 px (a container query on :host, so
         the harness frame and HA's narrow layout measure the same thing)
         only the current view keeps its label and gets twice the room -
         Material's "selected" label mode; the others are icon-only with
         their aria-label. */
      @container jv-panel (max-width: 519px) {
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
    `],h([x({attribute:!1})],be.prototype,"hass",2),h([x({type:Boolean,reflect:!0})],be.prototype,"narrow",2),h([x({attribute:!1})],be.prototype,"route",2),h([x({attribute:!1})],be.prototype,"panel",2),h([$()],be.prototype,"_data",2),h([$()],be.prototype,"_error",2),h([$()],be.prototype,"_loading",2),h([$()],be.prototype,"_langReady",2),h([$()],be.prototype,"_view",2),be=h([D("jarvis-panel")],be);
