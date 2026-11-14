(()=>{var MM=Object.create;var Gg=Object.defineProperty;var bM=Object.getOwnPropertyDescriptor;var TM=Object.getOwnPropertyNames;var EM=Object.getPrototypeOf,AM=Object.prototype.hasOwnProperty;var Lf=(e,t)=>()=>(e&&(t=e(e=0)),t);var fi=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var wM=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of TM(t))!AM.call(e,s)&&s!==n&&Gg(e,s,{get:()=>t[s],enumerable:!(i=bM(t,s))||i.enumerable});return e};var qa=(e,t,n)=>(n=e!=null?MM(EM(e)):{},wM(t||!e||!e.__esModule?Gg(n,"default",{value:e,enumerable:!0}):n,e));var Qg=fi(fe=>{"use strict";function Pf(e,t){var n=e.length;e.push(t);t:for(;0<n;){var i=n-1>>>1,s=e[i];if(0<sc(s,t))e[i]=t,e[n]=s,n=i;else break t}}function di(e){return e.length===0?null:e[0]}function rc(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;t:for(var i=0,s=e.length,a=s>>>1;i<a;){var r=2*(i+1)-1,o=e[r],l=r+1,c=e[l];if(0>sc(o,n))l<s&&0>sc(c,o)?(e[i]=c,e[l]=n,i=l):(e[i]=o,e[r]=n,i=r);else if(l<s&&0>sc(c,n))e[i]=c,e[l]=n,i=l;else break t}}return t}function sc(e,t){var n=e.sortIndex-t.sortIndex;return n!==0?n:e.id-t.id}fe.unstable_now=void 0;typeof performance=="object"&&typeof performance.now=="function"?(Vg=performance,fe.unstable_now=function(){return Vg.now()}):(Nf=Date,kg=Nf.now(),fe.unstable_now=function(){return Nf.now()-kg});var Vg,Nf,kg,Ai=[],bs=[],RM=1,Yn=null,cn=3,oc=!1,ha=!1,ho=!1,qg=typeof setTimeout=="function"?setTimeout:null,Yg=typeof clearTimeout=="function"?clearTimeout:null,Wg=typeof setImmediate<"u"?setImmediate:null;function ac(e){for(var t=di(bs);t!==null;){if(t.callback===null)rc(bs);else if(t.startTime<=e)rc(bs),t.sortIndex=t.expirationTime,Pf(Ai,t);else break;t=di(bs)}}function If(e){if(ho=!1,ac(e),!ha)if(di(Ai)!==null)ha=!0,Bf();else{var t=di(bs);t!==null&&Ff(If,t.startTime-e)}}var lc=!1,fo=-1,Zg=5,Kg=-1;function Jg(){return!(fe.unstable_now()-Kg<Zg)}function Uf(){if(lc){var e=fe.unstable_now();Kg=e;var t=!0;try{t:{ha=!1,ho&&(ho=!1,Yg(fo),fo=-1),oc=!0;var n=cn;try{e:{for(ac(e),Yn=di(Ai);Yn!==null&&!(Yn.expirationTime>e&&Jg());){var i=Yn.callback;if(typeof i=="function"){Yn.callback=null,cn=Yn.priorityLevel;var s=i(Yn.expirationTime<=e);if(e=fe.unstable_now(),typeof s=="function"){Yn.callback=s,ac(e),t=!0;break e}Yn===di(Ai)&&rc(Ai),ac(e)}else rc(Ai);Yn=di(Ai)}if(Yn!==null)t=!0;else{var a=di(bs);a!==null&&Ff(If,a.startTime-e),t=!1}}break t}finally{Yn=null,cn=n,oc=!1}t=void 0}}finally{t?uo():lc=!1}}}var uo;typeof Wg=="function"?uo=function(){Wg(Uf)}:typeof MessageChannel<"u"?(Of=new MessageChannel,Xg=Of.port2,Of.port1.onmessage=Uf,uo=function(){Xg.postMessage(null)}):uo=function(){qg(Uf,0)};var Of,Xg;function Bf(){lc||(lc=!0,uo())}function Ff(e,t){fo=qg(function(){e(fe.unstable_now())},t)}fe.unstable_IdlePriority=5;fe.unstable_ImmediatePriority=1;fe.unstable_LowPriority=4;fe.unstable_NormalPriority=3;fe.unstable_Profiling=null;fe.unstable_UserBlockingPriority=2;fe.unstable_cancelCallback=function(e){e.callback=null};fe.unstable_continueExecution=function(){ha||oc||(ha=!0,Bf())};fe.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):Zg=0<e?Math.floor(1e3/e):5};fe.unstable_getCurrentPriorityLevel=function(){return cn};fe.unstable_getFirstCallbackNode=function(){return di(Ai)};fe.unstable_next=function(e){switch(cn){case 1:case 2:case 3:var t=3;break;default:t=cn}var n=cn;cn=t;try{return e()}finally{cn=n}};fe.unstable_pauseExecution=function(){};fe.unstable_requestPaint=function(){};fe.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=cn;cn=e;try{return t()}finally{cn=n}};fe.unstable_scheduleCallback=function(e,t,n){var i=fe.unstable_now();switch(typeof n=="object"&&n!==null?(n=n.delay,n=typeof n=="number"&&0<n?i+n:i):n=i,e){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=n+s,e={id:RM++,callback:t,priorityLevel:e,startTime:n,expirationTime:s,sortIndex:-1},n>i?(e.sortIndex=n,Pf(bs,e),di(Ai)===null&&e===di(bs)&&(ho?(Yg(fo),fo=-1):ho=!0,Ff(If,n-i))):(e.sortIndex=s,Pf(Ai,e),ha||oc||(ha=!0,Bf())),e};fe.unstable_shouldYield=Jg;fe.unstable_wrapCallback=function(e){var t=cn;return function(){var n=cn;cn=t;try{return e.apply(this,arguments)}finally{cn=n}}}});var $g=fi((r3,jg)=>{"use strict";jg.exports=Qg()});var h0=fi(Vt=>{"use strict";var Hf=Symbol.for("react.transitional.element"),CM=Symbol.for("react.portal"),DM=Symbol.for("react.fragment"),LM=Symbol.for("react.strict_mode"),NM=Symbol.for("react.profiler"),UM=Symbol.for("react.consumer"),OM=Symbol.for("react.context"),PM=Symbol.for("react.forward_ref"),IM=Symbol.for("react.suspense"),BM=Symbol.for("react.memo"),a0=Symbol.for("react.lazy"),t0=Symbol.iterator;function FM(e){return e===null||typeof e!="object"?null:(e=t0&&e[t0]||e["@@iterator"],typeof e=="function"?e:null)}var r0={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},o0=Object.assign,l0={};function Za(e,t,n){this.props=e,this.context=t,this.refs=l0,this.updater=n||r0}Za.prototype.isReactComponent={};Za.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};Za.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function c0(){}c0.prototype=Za.prototype;function Gf(e,t,n){this.props=e,this.context=t,this.refs=l0,this.updater=n||r0}var Vf=Gf.prototype=new c0;Vf.constructor=Gf;o0(Vf,Za.prototype);Vf.isPureReactComponent=!0;var e0=Array.isArray,Ae={H:null,A:null,T:null,S:null},u0=Object.prototype.hasOwnProperty;function kf(e,t,n,i,s,a){return n=a.ref,{$$typeof:Hf,type:e,key:t,ref:n!==void 0?n:null,props:a}}function zM(e,t){return kf(e.type,t,void 0,void 0,void 0,e.props)}function Wf(e){return typeof e=="object"&&e!==null&&e.$$typeof===Hf}function HM(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var n0=/\/+/g;function zf(e,t){return typeof e=="object"&&e!==null&&e.key!=null?HM(""+e.key):t.toString(36)}function i0(){}function GM(e){switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:switch(typeof e.status=="string"?e.then(i0,i0):(e.status="pending",e.then(function(t){e.status==="pending"&&(e.status="fulfilled",e.value=t)},function(t){e.status==="pending"&&(e.status="rejected",e.reason=t)})),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason}}throw e}function Ya(e,t,n,i,s){var a=typeof e;(a==="undefined"||a==="boolean")&&(e=null);var r=!1;if(e===null)r=!0;else switch(a){case"bigint":case"string":case"number":r=!0;break;case"object":switch(e.$$typeof){case Hf:case CM:r=!0;break;case a0:return r=e._init,Ya(r(e._payload),t,n,i,s)}}if(r)return s=s(e),r=i===""?"."+zf(e,0):i,e0(s)?(n="",r!=null&&(n=r.replace(n0,"$&/")+"/"),Ya(s,t,n,"",function(c){return c})):s!=null&&(Wf(s)&&(s=zM(s,n+(s.key==null||e&&e.key===s.key?"":(""+s.key).replace(n0,"$&/")+"/")+r)),t.push(s)),1;r=0;var o=i===""?".":i+":";if(e0(e))for(var l=0;l<e.length;l++)i=e[l],a=o+zf(i,l),r+=Ya(i,t,n,a,s);else if(l=FM(e),typeof l=="function")for(e=l.call(e),l=0;!(i=e.next()).done;)i=i.value,a=o+zf(i,l++),r+=Ya(i,t,n,a,s);else if(a==="object"){if(typeof e.then=="function")return Ya(GM(e),t,n,i,s);throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.")}return r}function cc(e,t,n){if(e==null)return e;var i=[],s=0;return Ya(e,i,"","",function(a){return t.call(n,a,s++)}),i}function VM(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var s0=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function kM(){}Vt.Children={map:cc,forEach:function(e,t,n){cc(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return cc(e,function(){t++}),t},toArray:function(e){return cc(e,function(t){return t})||[]},only:function(e){if(!Wf(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};Vt.Component=Za;Vt.Fragment=DM;Vt.Profiler=NM;Vt.PureComponent=Gf;Vt.StrictMode=LM;Vt.Suspense=IM;Vt.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=Ae;Vt.act=function(){throw Error("act(...) is not supported in production builds of React.")};Vt.cache=function(e){return function(){return e.apply(null,arguments)}};Vt.cloneElement=function(e,t,n){if(e==null)throw Error("The argument must be a React element, but you passed "+e+".");var i=o0({},e.props),s=e.key,a=void 0;if(t!=null)for(r in t.ref!==void 0&&(a=void 0),t.key!==void 0&&(s=""+t.key),t)!u0.call(t,r)||r==="key"||r==="__self"||r==="__source"||r==="ref"&&t.ref===void 0||(i[r]=t[r]);var r=arguments.length-2;if(r===1)i.children=n;else if(1<r){for(var o=Array(r),l=0;l<r;l++)o[l]=arguments[l+2];i.children=o}return kf(e.type,s,void 0,void 0,a,i)};Vt.createContext=function(e){return e={$$typeof:OM,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:UM,_context:e},e};Vt.createElement=function(e,t,n){var i,s={},a=null;if(t!=null)for(i in t.key!==void 0&&(a=""+t.key),t)u0.call(t,i)&&i!=="key"&&i!=="__self"&&i!=="__source"&&(s[i]=t[i]);var r=arguments.length-2;if(r===1)s.children=n;else if(1<r){for(var o=Array(r),l=0;l<r;l++)o[l]=arguments[l+2];s.children=o}if(e&&e.defaultProps)for(i in r=e.defaultProps,r)s[i]===void 0&&(s[i]=r[i]);return kf(e,a,void 0,void 0,null,s)};Vt.createRef=function(){return{current:null}};Vt.forwardRef=function(e){return{$$typeof:PM,render:e}};Vt.isValidElement=Wf;Vt.lazy=function(e){return{$$typeof:a0,_payload:{_status:-1,_result:e},_init:VM}};Vt.memo=function(e,t){return{$$typeof:BM,type:e,compare:t===void 0?null:t}};Vt.startTransition=function(e){var t=Ae.T,n={};Ae.T=n;try{var i=e(),s=Ae.S;s!==null&&s(n,i),typeof i=="object"&&i!==null&&typeof i.then=="function"&&i.then(kM,s0)}catch(a){s0(a)}finally{Ae.T=t}};Vt.unstable_useCacheRefresh=function(){return Ae.H.useCacheRefresh()};Vt.use=function(e){return Ae.H.use(e)};Vt.useActionState=function(e,t,n){return Ae.H.useActionState(e,t,n)};Vt.useCallback=function(e,t){return Ae.H.useCallback(e,t)};Vt.useContext=function(e){return Ae.H.useContext(e)};Vt.useDebugValue=function(){};Vt.useDeferredValue=function(e,t){return Ae.H.useDeferredValue(e,t)};Vt.useEffect=function(e,t){return Ae.H.useEffect(e,t)};Vt.useId=function(){return Ae.H.useId()};Vt.useImperativeHandle=function(e,t,n){return Ae.H.useImperativeHandle(e,t,n)};Vt.useInsertionEffect=function(e,t){return Ae.H.useInsertionEffect(e,t)};Vt.useLayoutEffect=function(e,t){return Ae.H.useLayoutEffect(e,t)};Vt.useMemo=function(e,t){return Ae.H.useMemo(e,t)};Vt.useOptimistic=function(e,t){return Ae.H.useOptimistic(e,t)};Vt.useReducer=function(e,t,n){return Ae.H.useReducer(e,t,n)};Vt.useRef=function(e){return Ae.H.useRef(e)};Vt.useState=function(e){return Ae.H.useState(e)};Vt.useSyncExternalStore=function(e,t,n){return Ae.H.useSyncExternalStore(e,t,n)};Vt.useTransition=function(){return Ae.H.useTransition()};Vt.version="19.0.0"});var uc=fi((l3,f0)=>{"use strict";f0.exports=h0()});var p0=fi(xn=>{"use strict";var WM=uc();function d0(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function Ts(){}var yn={d:{f:Ts,r:function(){throw Error(d0(522))},D:Ts,C:Ts,L:Ts,m:Ts,X:Ts,S:Ts,M:Ts},p:0,findDOMNode:null},XM=Symbol.for("react.portal");function qM(e,t,n){var i=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:XM,key:i==null?null:""+i,children:e,containerInfo:t,implementation:n}}var po=WM.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function hc(e,t){if(e==="font")return"";if(typeof t=="string")return t==="use-credentials"?t:""}xn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=yn;xn.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(d0(299));return qM(e,t,null,n)};xn.flushSync=function(e){var t=po.T,n=yn.p;try{if(po.T=null,yn.p=2,e)return e()}finally{po.T=t,yn.p=n,yn.d.f()}};xn.preconnect=function(e,t){typeof e=="string"&&(t?(t=t.crossOrigin,t=typeof t=="string"?t==="use-credentials"?t:"":void 0):t=null,yn.d.C(e,t))};xn.prefetchDNS=function(e){typeof e=="string"&&yn.d.D(e)};xn.preinit=function(e,t){if(typeof e=="string"&&t&&typeof t.as=="string"){var n=t.as,i=hc(n,t.crossOrigin),s=typeof t.integrity=="string"?t.integrity:void 0,a=typeof t.fetchPriority=="string"?t.fetchPriority:void 0;n==="style"?yn.d.S(e,typeof t.precedence=="string"?t.precedence:void 0,{crossOrigin:i,integrity:s,fetchPriority:a}):n==="script"&&yn.d.X(e,{crossOrigin:i,integrity:s,fetchPriority:a,nonce:typeof t.nonce=="string"?t.nonce:void 0})}};xn.preinitModule=function(e,t){if(typeof e=="string")if(typeof t=="object"&&t!==null){if(t.as==null||t.as==="script"){var n=hc(t.as,t.crossOrigin);yn.d.M(e,{crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0})}}else t==null&&yn.d.M(e)};xn.preload=function(e,t){if(typeof e=="string"&&typeof t=="object"&&t!==null&&typeof t.as=="string"){var n=t.as,i=hc(n,t.crossOrigin);yn.d.L(e,n,{crossOrigin:i,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,type:typeof t.type=="string"?t.type:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy=="string"?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet=="string"?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes=="string"?t.imageSizes:void 0,media:typeof t.media=="string"?t.media:void 0})}};xn.preloadModule=function(e,t){if(typeof e=="string")if(t){var n=hc(t.as,t.crossOrigin);yn.d.m(e,{as:typeof t.as=="string"&&t.as!=="script"?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0})}else yn.d.m(e)};xn.requestFormReset=function(e){yn.d.r(e)};xn.unstable_batchedUpdates=function(e,t){return e(t)};xn.useFormState=function(e,t,n){return po.H.useFormState(e,t,n)};xn.useFormStatus=function(){return po.H.useHostTransitionStatus()};xn.version="19.0.0"});var _0=fi((u3,g0)=>{"use strict";function m0(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(m0)}catch(e){console.error(e)}}m0(),g0.exports=p0()});var fx=fi(Du=>{"use strict";var ke=$g(),I_=uc(),YM=_0();function $(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function B_(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}var ZM=Symbol.for("react.element"),fc=Symbol.for("react.transitional.element"),bo=Symbol.for("react.portal"),er=Symbol.for("react.fragment"),F_=Symbol.for("react.strict_mode"),Md=Symbol.for("react.profiler"),KM=Symbol.for("react.provider"),z_=Symbol.for("react.consumer"),ji=Symbol.for("react.context"),mp=Symbol.for("react.forward_ref"),bd=Symbol.for("react.suspense"),Td=Symbol.for("react.suspense_list"),gp=Symbol.for("react.memo"),ws=Symbol.for("react.lazy");Symbol.for("react.scope");Symbol.for("react.debug_trace_mode");var H_=Symbol.for("react.offscreen");Symbol.for("react.legacy_hidden");Symbol.for("react.tracing_marker");var JM=Symbol.for("react.memo_cache_sentinel"),v0=Symbol.iterator;function mo(e){return e===null||typeof e!="object"?null:(e=v0&&e[v0]||e["@@iterator"],typeof e=="function"?e:null)}var QM=Symbol.for("react.client.reference");function Ed(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===QM?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case er:return"Fragment";case bo:return"Portal";case Md:return"Profiler";case F_:return"StrictMode";case bd:return"Suspense";case Td:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case ji:return(e.displayName||"Context")+".Provider";case z_:return(e._context.displayName||"Context")+".Consumer";case mp:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case gp:return t=e.displayName||null,t!==null?t:Ed(e.type)||"Memo";case ws:t=e._payload,e=e._init;try{return Ed(e(t))}catch{}}return null}var Ft=I_.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,xe=Object.assign,Xf,y0;function To(e){if(Xf===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);Xf=t&&t[1]||"",y0=-1<n.stack.indexOf(`
    at`)?" (<anonymous>)":-1<n.stack.indexOf("@")?"@unknown:0:0":""}return`
`+Xf+e+y0}var qf=!1;function Yf(e,t){if(!e||qf)return"";qf=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var i={DetermineComponentFrameRoot:function(){try{if(t){var p=function(){throw Error()};if(Object.defineProperty(p.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(p,[])}catch(d){var u=d}Reflect.construct(e,[],p)}else{try{p.call()}catch(d){u=d}e.call(p.prototype)}}else{try{throw Error()}catch(d){u=d}(p=e())&&typeof p.catch=="function"&&p.catch(function(){})}}catch(d){if(d&&u&&typeof d.stack=="string")return[d.stack,u.stack]}return[null,null]}};i.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var s=Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot,"name");s&&s.configurable&&Object.defineProperty(i.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var a=i.DetermineComponentFrameRoot(),r=a[0],o=a[1];if(r&&o){var l=r.split(`
`),c=o.split(`
`);for(s=i=0;i<l.length&&!l[i].includes("DetermineComponentFrameRoot");)i++;for(;s<c.length&&!c[s].includes("DetermineComponentFrameRoot");)s++;if(i===l.length||s===c.length)for(i=l.length-1,s=c.length-1;1<=i&&0<=s&&l[i]!==c[s];)s--;for(;1<=i&&0<=s;i--,s--)if(l[i]!==c[s]){if(i!==1||s!==1)do if(i--,s--,0>s||l[i]!==c[s]){var f=`
`+l[i].replace(" at new "," at ");return e.displayName&&f.includes("<anonymous>")&&(f=f.replace("<anonymous>",e.displayName)),f}while(1<=i&&0<=s);break}}}finally{qf=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:"")?To(n):""}function jM(e){switch(e.tag){case 26:case 27:case 5:return To(e.type);case 16:return To("Lazy");case 13:return To("Suspense");case 19:return To("SuspenseList");case 0:case 15:return e=Yf(e.type,!1),e;case 11:return e=Yf(e.type.render,!1),e;case 1:return e=Yf(e.type,!0),e;default:return""}}function x0(e){try{var t="";do t+=jM(e),e=e.return;while(e);return t}catch(n){return`
Error generating stack: `+n.message+`
`+n.stack}}function Cr(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function G_(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function S0(e){if(Cr(e)!==e)throw Error($(188))}function $M(e){var t=e.alternate;if(!t){if(t=Cr(e),t===null)throw Error($(188));return t!==e?null:e}for(var n=e,i=t;;){var s=n.return;if(s===null)break;var a=s.alternate;if(a===null){if(i=s.return,i!==null){n=i;continue}break}if(s.child===a.child){for(a=s.child;a;){if(a===n)return S0(s),e;if(a===i)return S0(s),t;a=a.sibling}throw Error($(188))}if(n.return!==i.return)n=s,i=a;else{for(var r=!1,o=s.child;o;){if(o===n){r=!0,n=s,i=a;break}if(o===i){r=!0,i=s,n=a;break}o=o.sibling}if(!r){for(o=a.child;o;){if(o===n){r=!0,n=a,i=s;break}if(o===i){r=!0,i=a,n=s;break}o=o.sibling}if(!r)throw Error($(189))}}if(n.alternate!==i)throw Error($(190))}if(n.tag!==3)throw Error($(188));return n.stateNode.current===n?e:t}function V_(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=V_(e),t!==null)return t;e=e.sibling}return null}var Eo=Array.isArray,ye=YM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,va={pending:!1,data:null,method:null,action:null},Ad=[],nr=-1;function Ui(e){return{current:e}}function je(e){0>nr||(e.current=Ad[nr],Ad[nr]=null,nr--)}function Te(e,t){nr++,Ad[nr]=e.current,e.current=t}var Ci=Ui(null),ko=Ui(null),Ps=Ui(null),Vc=Ui(null);function kc(e,t){switch(Te(Ps,t),Te(ko,e),Te(Ci,null),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)&&(t=t.namespaceURI)?b_(t):0;break;default:if(e=e===8?t.parentNode:t,t=e.tagName,e=e.namespaceURI)e=b_(e),t=tx(e,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}je(Ci),Te(Ci,t)}function xr(){je(Ci),je(ko),je(Ps)}function wd(e){e.memoizedState!==null&&Te(Vc,e);var t=Ci.current,n=tx(t,e.type);t!==n&&(Te(ko,e),Te(Ci,n))}function Wc(e){ko.current===e&&(je(Ci),je(ko)),Vc.current===e&&(je(Vc),tl._currentValue=va)}var Rd=Object.prototype.hasOwnProperty,_p=ke.unstable_scheduleCallback,Zf=ke.unstable_cancelCallback,tb=ke.unstable_shouldYield,eb=ke.unstable_requestPaint,Di=ke.unstable_now,nb=ke.unstable_getCurrentPriorityLevel,k_=ke.unstable_ImmediatePriority,W_=ke.unstable_UserBlockingPriority,Xc=ke.unstable_NormalPriority,ib=ke.unstable_LowPriority,X_=ke.unstable_IdlePriority,sb=ke.log,ab=ke.unstable_setDisableYieldValue,sl=null,Pn=null;function rb(e){if(Pn&&typeof Pn.onCommitFiberRoot=="function")try{Pn.onCommitFiberRoot(sl,e,void 0,(e.current.flags&128)===128)}catch{}}function Us(e){if(typeof sb=="function"&&ab(e),Pn&&typeof Pn.setStrictMode=="function")try{Pn.setStrictMode(sl,e)}catch{}}var In=Math.clz32?Math.clz32:cb,ob=Math.log,lb=Math.LN2;function cb(e){return e>>>=0,e===0?32:31-(ob(e)/lb|0)|0}var dc=128,pc=4194304;function da(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194176;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function gu(e,t){var n=e.pendingLanes;if(n===0)return 0;var i=0,s=e.suspendedLanes,a=e.pingedLanes,r=e.warmLanes;e=e.finishedLanes!==0;var o=n&134217727;return o!==0?(n=o&~s,n!==0?i=da(n):(a&=o,a!==0?i=da(a):e||(r=o&~r,r!==0&&(i=da(r))))):(o=n&~s,o!==0?i=da(o):a!==0?i=da(a):e||(r=n&~r,r!==0&&(i=da(r)))),i===0?0:t!==0&&t!==i&&(t&s)===0&&(s=i&-i,r=t&-t,s>=r||s===32&&(r&4194176)!==0)?t:i}function al(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function ub(e,t){switch(e){case 1:case 2:case 4:case 8:return t+250;case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function q_(){var e=dc;return dc<<=1,(dc&4194176)===0&&(dc=128),e}function Y_(){var e=pc;return pc<<=1,(pc&62914560)===0&&(pc=4194304),e}function Kf(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function rl(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function hb(e,t,n,i,s,a){var r=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var o=e.entanglements,l=e.expirationTimes,c=e.hiddenUpdates;for(n=r&~n;0<n;){var f=31-In(n),p=1<<f;o[f]=0,l[f]=-1;var u=c[f];if(u!==null)for(c[f]=null,f=0;f<u.length;f++){var d=u[f];d!==null&&(d.lane&=-536870913)}n&=~p}i!==0&&Z_(e,i,0),a!==0&&s===0&&e.tag!==0&&(e.suspendedLanes|=a&~(r&~t))}function Z_(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var i=31-In(t);e.entangledLanes|=t,e.entanglements[i]=e.entanglements[i]|1073741824|n&4194218}function K_(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var i=31-In(n),s=1<<i;s&t|e[i]&t&&(e[i]|=t),n&=~s}}function J_(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function Q_(){var e=ye.p;return e!==0?e:(e=window.event,e===void 0?32:ux(e.type))}function fb(e,t){var n=ye.p;try{return ye.p=e,t()}finally{ye.p=n}}var Ys=Math.random().toString(36).slice(2),un="__reactFiber$"+Ys,Cn="__reactProps$"+Ys,Dr="__reactContainer$"+Ys,Cd="__reactEvents$"+Ys,db="__reactListeners$"+Ys,pb="__reactHandles$"+Ys,M0="__reactResources$"+Ys,Wo="__reactMarker$"+Ys;function vp(e){delete e[un],delete e[Cn],delete e[Cd],delete e[db],delete e[pb]}function ga(e){var t=e[un];if(t)return t;for(var n=e.parentNode;n;){if(t=n[Dr]||n[un]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=E_(e);e!==null;){if(n=e[un])return n;e=E_(e)}return t}e=n,n=e.parentNode}return null}function Lr(e){if(e=e[un]||e[Dr]){var t=e.tag;if(t===5||t===6||t===13||t===26||t===27||t===3)return e}return null}function Ao(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error($(33))}function fr(e){var t=e[M0];return t||(t=e[M0]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function Je(e){e[Wo]=!0}var j_=new Set,$_={};function Ca(e,t){Sr(e,t),Sr(e+"Capture",t)}function Sr(e,t){for($_[e]=t,e=0;e<t.length;e++)j_.add(t[e])}var ss=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),mb=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),b0={},T0={};function gb(e){return Rd.call(T0,e)?!0:Rd.call(b0,e)?!1:mb.test(e)?T0[e]=!0:(b0[e]=!0,!1)}function Dc(e,t,n){if(gb(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var i=t.toLowerCase().slice(0,5);if(i!=="data-"&&i!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,""+n)}}function mc(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,""+n)}}function Xi(e,t,n,i){if(i===null)e.removeAttribute(n);else{switch(typeof i){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(n);return}e.setAttributeNS(t,n,""+i)}}function Qn(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function tv(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function _b(e){var t=tv(e)?"checked":"value",n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),i=""+e[t];if(!e.hasOwnProperty(t)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var s=n.get,a=n.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return s.call(this)},set:function(r){i=""+r,a.call(this,r)}}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:function(){return i},setValue:function(r){i=""+r},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function qc(e){e._valueTracker||(e._valueTracker=_b(e))}function ev(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),i="";return e&&(i=tv(e)?e.checked?"true":"false":e.value),e=i,e!==n?(t.setValue(e),!0):!1}function Yc(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var vb=/[\n"\\]/g;function ti(e){return e.replace(vb,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function Dd(e,t,n,i,s,a,r,o){e.name="",r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"?e.type=r:e.removeAttribute("type"),t!=null?r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+Qn(t)):e.value!==""+Qn(t)&&(e.value=""+Qn(t)):r!=="submit"&&r!=="reset"||e.removeAttribute("value"),t!=null?Ld(e,r,Qn(t)):n!=null?Ld(e,r,Qn(n)):i!=null&&e.removeAttribute("value"),s==null&&a!=null&&(e.defaultChecked=!!a),s!=null&&(e.checked=s&&typeof s!="function"&&typeof s!="symbol"),o!=null&&typeof o!="function"&&typeof o!="symbol"&&typeof o!="boolean"?e.name=""+Qn(o):e.removeAttribute("name")}function nv(e,t,n,i,s,a,r,o){if(a!=null&&typeof a!="function"&&typeof a!="symbol"&&typeof a!="boolean"&&(e.type=a),t!=null||n!=null){if(!(a!=="submit"&&a!=="reset"||t!=null))return;n=n!=null?""+Qn(n):"",t=t!=null?""+Qn(t):n,o||t===e.value||(e.value=t),e.defaultValue=t}i=i??s,i=typeof i!="function"&&typeof i!="symbol"&&!!i,e.checked=o?e.checked:!!i,e.defaultChecked=!!i,r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"&&(e.name=r)}function Ld(e,t,n){t==="number"&&Yc(e.ownerDocument)===e||e.defaultValue===""+n||(e.defaultValue=""+n)}function dr(e,t,n,i){if(e=e.options,t){t={};for(var s=0;s<n.length;s++)t["$"+n[s]]=!0;for(n=0;n<e.length;n++)s=t.hasOwnProperty("$"+e[n].value),e[n].selected!==s&&(e[n].selected=s),s&&i&&(e[n].defaultSelected=!0)}else{for(n=""+Qn(n),t=null,s=0;s<e.length;s++){if(e[s].value===n){e[s].selected=!0,i&&(e[s].defaultSelected=!0);return}t!==null||e[s].disabled||(t=e[s])}t!==null&&(t.selected=!0)}}function iv(e,t,n){if(t!=null&&(t=""+Qn(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n!=null?""+Qn(n):""}function sv(e,t,n,i){if(t==null){if(i!=null){if(n!=null)throw Error($(92));if(Eo(i)){if(1<i.length)throw Error($(93));i=i[0]}n=i}n==null&&(n=""),t=n}n=Qn(t),e.defaultValue=n,i=e.textContent,i===n&&i!==""&&i!==null&&(e.value=i)}function Mr(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var yb=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function E0(e,t,n){var i=t.indexOf("--")===0;n==null||typeof n=="boolean"||n===""?i?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":i?e.setProperty(t,n):typeof n!="number"||n===0||yb.has(t)?t==="float"?e.cssFloat=n:e[t]=(""+n).trim():e[t]=n+"px"}function av(e,t,n){if(t!=null&&typeof t!="object")throw Error($(62));if(e=e.style,n!=null){for(var i in n)!n.hasOwnProperty(i)||t!=null&&t.hasOwnProperty(i)||(i.indexOf("--")===0?e.setProperty(i,""):i==="float"?e.cssFloat="":e[i]="");for(var s in t)i=t[s],t.hasOwnProperty(s)&&n[s]!==i&&E0(e,s,i)}else for(var a in t)t.hasOwnProperty(a)&&E0(e,a,t[a])}function yp(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var xb=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),Sb=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Lc(e){return Sb.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}var Nd=null;function xp(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var ir=null,pr=null;function A0(e){var t=Lr(e);if(t&&(e=t.stateNode)){var n=e[Cn]||null;t:switch(e=t.stateNode,t.type){case"input":if(Dd(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll('input[name="'+ti(""+t)+'"][type="radio"]'),t=0;t<n.length;t++){var i=n[t];if(i!==e&&i.form===e.form){var s=i[Cn]||null;if(!s)throw Error($(90));Dd(i,s.value,s.defaultValue,s.defaultValue,s.checked,s.defaultChecked,s.type,s.name)}}for(t=0;t<n.length;t++)i=n[t],i.form===e.form&&ev(i)}break t;case"textarea":iv(e,n.value,n.defaultValue);break t;case"select":t=n.value,t!=null&&dr(e,!!n.multiple,t,!1)}}}var Jf=!1;function rv(e,t,n){if(Jf)return e(t,n);Jf=!0;try{var i=e(t);return i}finally{if(Jf=!1,(ir!==null||pr!==null)&&(Au(),ir&&(t=ir,e=pr,pr=ir=null,A0(t),e)))for(t=0;t<e.length;t++)A0(e[t])}}function Xo(e,t){var n=e.stateNode;if(n===null)return null;var i=n[Cn]||null;if(i===null)return null;n=i[t];t:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(e=e.type,i=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!i;break t;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error($(231,t,typeof n));return n}var Ud=!1;if(ss)try{Ka={},Object.defineProperty(Ka,"passive",{get:function(){Ud=!0}}),window.addEventListener("test",Ka,Ka),window.removeEventListener("test",Ka,Ka)}catch{Ud=!1}var Ka,Os=null,Sp=null,Nc=null;function ov(){if(Nc)return Nc;var e,t=Sp,n=t.length,i,s="value"in Os?Os.value:Os.textContent,a=s.length;for(e=0;e<n&&t[e]===s[e];e++);var r=n-e;for(i=1;i<=r&&t[n-i]===s[a-i];i++);return Nc=s.slice(e,1<i?1-i:void 0)}function Uc(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function gc(){return!0}function w0(){return!1}function Dn(e){function t(n,i,s,a,r){this._reactName=n,this._targetInst=s,this.type=i,this.nativeEvent=a,this.target=r,this.currentTarget=null;for(var o in e)e.hasOwnProperty(o)&&(n=e[o],this[o]=n?n(a):a[o]);return this.isDefaultPrevented=(a.defaultPrevented!=null?a.defaultPrevented:a.returnValue===!1)?gc:w0,this.isPropagationStopped=w0,this}return xe(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=gc)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=gc)},persist:function(){},isPersistent:gc}),t}var Da={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},_u=Dn(Da),ol=xe({},Da,{view:0,detail:0}),Mb=Dn(ol),Qf,jf,go,vu=xe({},ol,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Mp,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==go&&(go&&e.type==="mousemove"?(Qf=e.screenX-go.screenX,jf=e.screenY-go.screenY):jf=Qf=0,go=e),Qf)},movementY:function(e){return"movementY"in e?e.movementY:jf}}),R0=Dn(vu),bb=xe({},vu,{dataTransfer:0}),Tb=Dn(bb),Eb=xe({},ol,{relatedTarget:0}),$f=Dn(Eb),Ab=xe({},Da,{animationName:0,elapsedTime:0,pseudoElement:0}),wb=Dn(Ab),Rb=xe({},Da,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),Cb=Dn(Rb),Db=xe({},Da,{data:0}),C0=Dn(Db),Lb={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Nb={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Ub={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Ob(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=Ub[e])?!!t[e]:!1}function Mp(){return Ob}var Pb=xe({},ol,{key:function(e){if(e.key){var t=Lb[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Uc(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?Nb[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Mp,charCode:function(e){return e.type==="keypress"?Uc(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Uc(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),Ib=Dn(Pb),Bb=xe({},vu,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),D0=Dn(Bb),Fb=xe({},ol,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Mp}),zb=Dn(Fb),Hb=xe({},Da,{propertyName:0,elapsedTime:0,pseudoElement:0}),Gb=Dn(Hb),Vb=xe({},vu,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),kb=Dn(Vb),Wb=xe({},Da,{newState:0,oldState:0}),Xb=Dn(Wb),qb=[9,13,27,32],bp=ss&&"CompositionEvent"in window,Ro=null;ss&&"documentMode"in document&&(Ro=document.documentMode);var Yb=ss&&"TextEvent"in window&&!Ro,lv=ss&&(!bp||Ro&&8<Ro&&11>=Ro),L0=" ",N0=!1;function cv(e,t){switch(e){case"keyup":return qb.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function uv(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var sr=!1;function Zb(e,t){switch(e){case"compositionend":return uv(t);case"keypress":return t.which!==32?null:(N0=!0,L0);case"textInput":return e=t.data,e===L0&&N0?null:e;default:return null}}function Kb(e,t){if(sr)return e==="compositionend"||!bp&&cv(e,t)?(e=ov(),Nc=Sp=Os=null,sr=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return lv&&t.locale!=="ko"?null:t.data;default:return null}}var Jb={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function U0(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!Jb[e.type]:t==="textarea"}function hv(e,t,n,i){ir?pr?pr.push(i):pr=[i]:ir=i,t=cu(t,"onChange"),0<t.length&&(n=new _u("onChange","change",null,n,i),e.push({event:n,listeners:t}))}var Co=null,qo=null;function Qb(e){Qy(e,0)}function yu(e){var t=Ao(e);if(ev(t))return e}function O0(e,t){if(e==="change")return t}var fv=!1;ss&&(ss?(vc="oninput"in document,vc||(td=document.createElement("div"),td.setAttribute("oninput","return;"),vc=typeof td.oninput=="function"),_c=vc):_c=!1,fv=_c&&(!document.documentMode||9<document.documentMode));var _c,vc,td;function P0(){Co&&(Co.detachEvent("onpropertychange",dv),qo=Co=null)}function dv(e){if(e.propertyName==="value"&&yu(qo)){var t=[];hv(t,qo,e,xp(e)),rv(Qb,t)}}function jb(e,t,n){e==="focusin"?(P0(),Co=t,qo=n,Co.attachEvent("onpropertychange",dv)):e==="focusout"&&P0()}function $b(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return yu(qo)}function t1(e,t){if(e==="click")return yu(t)}function e1(e,t){if(e==="input"||e==="change")return yu(t)}function n1(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Fn=typeof Object.is=="function"?Object.is:n1;function Yo(e,t){if(Fn(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),i=Object.keys(t);if(n.length!==i.length)return!1;for(i=0;i<n.length;i++){var s=n[i];if(!Rd.call(t,s)||!Fn(e[s],t[s]))return!1}return!0}function I0(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function B0(e,t){var n=I0(e);e=0;for(var i;n;){if(n.nodeType===3){if(i=e+n.textContent.length,e<=t&&i>=t)return{node:n,offset:t-e};e=i}t:{for(;n;){if(n.nextSibling){n=n.nextSibling;break t}n=n.parentNode}n=void 0}n=I0(n)}}function pv(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?pv(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function mv(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=Yc(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=Yc(e.document)}return t}function Tp(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function i1(e,t){var n=mv(t);t=e.focusedElem;var i=e.selectionRange;if(n!==t&&t&&t.ownerDocument&&pv(t.ownerDocument.documentElement,t)){if(i!==null&&Tp(t)){if(e=i.start,n=i.end,n===void 0&&(n=e),"selectionStart"in t)t.selectionStart=e,t.selectionEnd=Math.min(n,t.value.length);else if(n=(e=t.ownerDocument||document)&&e.defaultView||window,n.getSelection){n=n.getSelection();var s=t.textContent.length,a=Math.min(i.start,s);i=i.end===void 0?a:Math.min(i.end,s),!n.extend&&a>i&&(s=i,i=a,a=s),s=B0(t,a);var r=B0(t,i);s&&r&&(n.rangeCount!==1||n.anchorNode!==s.node||n.anchorOffset!==s.offset||n.focusNode!==r.node||n.focusOffset!==r.offset)&&(e=e.createRange(),e.setStart(s.node,s.offset),n.removeAllRanges(),a>i?(n.addRange(e),n.extend(r.node,r.offset)):(e.setEnd(r.node,r.offset),n.addRange(e)))}}for(e=[],n=t;n=n.parentNode;)n.nodeType===1&&e.push({element:n,left:n.scrollLeft,top:n.scrollTop});for(typeof t.focus=="function"&&t.focus(),t=0;t<e.length;t++)n=e[t],n.element.scrollLeft=n.left,n.element.scrollTop=n.top}}var s1=ss&&"documentMode"in document&&11>=document.documentMode,ar=null,Od=null,Do=null,Pd=!1;function F0(e,t,n){var i=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Pd||ar==null||ar!==Yc(i)||(i=ar,"selectionStart"in i&&Tp(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),Do&&Yo(Do,i)||(Do=i,i=cu(Od,"onSelect"),0<i.length&&(t=new _u("onSelect","select",null,t,n),e.push({event:t,listeners:i}),t.target=ar)))}function fa(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var rr={animationend:fa("Animation","AnimationEnd"),animationiteration:fa("Animation","AnimationIteration"),animationstart:fa("Animation","AnimationStart"),transitionrun:fa("Transition","TransitionRun"),transitionstart:fa("Transition","TransitionStart"),transitioncancel:fa("Transition","TransitionCancel"),transitionend:fa("Transition","TransitionEnd")},ed={},gv={};ss&&(gv=document.createElement("div").style,"AnimationEvent"in window||(delete rr.animationend.animation,delete rr.animationiteration.animation,delete rr.animationstart.animation),"TransitionEvent"in window||delete rr.transitionend.transition);function La(e){if(ed[e])return ed[e];if(!rr[e])return e;var t=rr[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in gv)return ed[e]=t[n];return e}var _v=La("animationend"),vv=La("animationiteration"),yv=La("animationstart"),a1=La("transitionrun"),r1=La("transitionstart"),o1=La("transitioncancel"),xv=La("transitionend"),Sv=new Map,z0="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll scrollEnd toggle touchMove waiting wheel".split(" ");function _i(e,t){Sv.set(e,t),Ca(t,[e])}var Jn=[],or=0,Ep=0;function xu(){for(var e=or,t=Ep=or=0;t<e;){var n=Jn[t];Jn[t++]=null;var i=Jn[t];Jn[t++]=null;var s=Jn[t];Jn[t++]=null;var a=Jn[t];if(Jn[t++]=null,i!==null&&s!==null){var r=i.pending;r===null?s.next=s:(s.next=r.next,r.next=s),i.pending=s}a!==0&&Mv(n,s,a)}}function Su(e,t,n,i){Jn[or++]=e,Jn[or++]=t,Jn[or++]=n,Jn[or++]=i,Ep|=i,e.lanes|=i,e=e.alternate,e!==null&&(e.lanes|=i)}function Ap(e,t,n,i){return Su(e,t,n,i),Zc(e)}function ks(e,t){return Su(e,null,null,t),Zc(e)}function Mv(e,t,n){e.lanes|=n;var i=e.alternate;i!==null&&(i.lanes|=n);for(var s=!1,a=e.return;a!==null;)a.childLanes|=n,i=a.alternate,i!==null&&(i.childLanes|=n),a.tag===22&&(e=a.stateNode,e===null||e._visibility&1||(s=!0)),e=a,a=a.return;s&&t!==null&&e.tag===3&&(a=e.stateNode,s=31-In(n),a=a.hiddenUpdates,e=a[s],e===null?a[s]=[t]:e.push(t),t.lane=n|536870912)}function Zc(e){if(50<Vo)throw Vo=0,ip=null,Error($(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var lr={},H0=new WeakMap;function ei(e,t){if(typeof e=="object"&&e!==null){var n=H0.get(e);return n!==void 0?n:(t={value:e,source:t,stack:x0(t)},H0.set(e,t),t)}return{value:e,source:t,stack:x0(t)}}var cr=[],ur=0,Kc=null,Jc=0,jn=[],$n=0,ya=null,$i=1,ts="";function pa(e,t){cr[ur++]=Jc,cr[ur++]=Kc,Kc=e,Jc=t}function bv(e,t,n){jn[$n++]=$i,jn[$n++]=ts,jn[$n++]=ya,ya=e;var i=$i;e=ts;var s=32-In(i)-1;i&=~(1<<s),n+=1;var a=32-In(t)+s;if(30<a){var r=s-s%5;a=(i&(1<<r)-1).toString(32),i>>=r,s-=r,$i=1<<32-In(t)+s|n<<s|i,ts=a+e}else $i=1<<a|n<<s|i,ts=e}function wp(e){e.return!==null&&(pa(e,1),bv(e,1,0))}function Rp(e){for(;e===Kc;)Kc=cr[--ur],cr[ur]=null,Jc=cr[--ur],cr[ur]=null;for(;e===ya;)ya=jn[--$n],jn[$n]=null,ts=jn[--$n],jn[$n]=null,$i=jn[--$n],jn[$n]=null}var Sn=null,an=null,ne=!1,mi=null,wi=!1,Id=Error($(519));function Ta(e){var t=Error($(418,""));throw Zo(ei(t,e)),Id}function G0(e){var t=e.stateNode,n=e.type,i=e.memoizedProps;switch(t[un]=e,t[Cn]=i,n){case"dialog":Qt("cancel",t),Qt("close",t);break;case"iframe":case"object":case"embed":Qt("load",t);break;case"video":case"audio":for(n=0;n<Qo.length;n++)Qt(Qo[n],t);break;case"source":Qt("error",t);break;case"img":case"image":case"link":Qt("error",t),Qt("load",t);break;case"details":Qt("toggle",t);break;case"input":Qt("invalid",t),nv(t,i.value,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name,!0),qc(t);break;case"select":Qt("invalid",t);break;case"textarea":Qt("invalid",t),sv(t,i.value,i.defaultValue,i.children),qc(t)}n=i.children,typeof n!="string"&&typeof n!="number"&&typeof n!="bigint"||t.textContent===""+n||i.suppressHydrationWarning===!0||$y(t.textContent,n)?(i.popover!=null&&(Qt("beforetoggle",t),Qt("toggle",t)),i.onScroll!=null&&Qt("scroll",t),i.onScrollEnd!=null&&Qt("scrollend",t),i.onClick!=null&&(t.onclick=Ru),t=!0):t=!1,t||Ta(e)}function V0(e){for(Sn=e.return;Sn;)switch(Sn.tag){case 3:case 27:wi=!0;return;case 5:case 13:wi=!1;return;default:Sn=Sn.return}}function _o(e){if(e!==Sn)return!1;if(!ne)return V0(e),ne=!0,!1;var t=!1,n;if((n=e.tag!==3&&e.tag!==27)&&((n=e.tag===5)&&(n=e.type,n=!(n!=="form"&&n!=="button")||up(e.type,e.memoizedProps)),n=!n),n&&(t=!0),t&&an&&Ta(e),V0(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error($(317));t:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8)if(n=e.data,n==="/$"){if(t===0){an=gi(e.nextSibling);break t}t--}else n!=="$"&&n!=="$!"&&n!=="$?"||t++;e=e.nextSibling}an=null}}else an=Sn?gi(e.stateNode.nextSibling):null;return!0}function ll(){an=Sn=null,ne=!1}function Zo(e){mi===null?mi=[e]:mi.push(e)}var Lo=Error($(460)),Tv=Error($(474)),Bd={then:function(){}};function k0(e){return e=e.status,e==="fulfilled"||e==="rejected"}function yc(){}function Ev(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(yc,yc),t=n),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,e===Lo?Error($(483)):e;default:if(typeof t.status=="string")t.then(yc,yc);else{if(e=ve,e!==null&&100<e.shellSuspendCounter)throw Error($(482));e=t,e.status="pending",e.then(function(i){if(t.status==="pending"){var s=t;s.status="fulfilled",s.value=i}},function(i){if(t.status==="pending"){var s=t;s.status="rejected",s.reason=i}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,e===Lo?Error($(483)):e}throw No=t,Lo}}var No=null;function W0(){if(No===null)throw Error($(459));var e=No;return No=null,e}var mr=null,Ko=0;function xc(e){var t=Ko;return Ko+=1,mr===null&&(mr=[]),Ev(mr,e,t)}function vo(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function Sc(e,t){throw t.$$typeof===ZM?Error($(525)):(e=Object.prototype.toString.call(t),Error($(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function X0(e){var t=e._init;return t(e._payload)}function Av(e){function t(h,m){if(e){var y=h.deletions;y===null?(h.deletions=[m],h.flags|=16):y.push(m)}}function n(h,m){if(!e)return null;for(;m!==null;)t(h,m),m=m.sibling;return null}function i(h){for(var m=new Map;h!==null;)h.key!==null?m.set(h.key,h):m.set(h.index,h),h=h.sibling;return m}function s(h,m){return h=Fs(h,m),h.index=0,h.sibling=null,h}function a(h,m,y){return h.index=y,e?(y=h.alternate,y!==null?(y=y.index,y<m?(h.flags|=33554434,m):y):(h.flags|=33554434,m)):(h.flags|=1048576,m)}function r(h){return e&&h.alternate===null&&(h.flags|=33554434),h}function o(h,m,y,x){return m===null||m.tag!==6?(m=dd(y,h.mode,x),m.return=h,m):(m=s(m,y),m.return=h,m)}function l(h,m,y,x){var E=y.type;return E===er?f(h,m,y.props.children,x,y.key):m!==null&&(m.elementType===E||typeof E=="object"&&E!==null&&E.$$typeof===ws&&X0(E)===m.type)?(m=s(m,y.props),vo(m,y),m.return=h,m):(m=Fc(y.type,y.key,y.props,null,h.mode,x),vo(m,y),m.return=h,m)}function c(h,m,y,x){return m===null||m.tag!==4||m.stateNode.containerInfo!==y.containerInfo||m.stateNode.implementation!==y.implementation?(m=pd(y,h.mode,x),m.return=h,m):(m=s(m,y.children||[]),m.return=h,m)}function f(h,m,y,x,E){return m===null||m.tag!==7?(m=Sa(y,h.mode,x,E),m.return=h,m):(m=s(m,y),m.return=h,m)}function p(h,m,y){if(typeof m=="string"&&m!==""||typeof m=="number"||typeof m=="bigint")return m=dd(""+m,h.mode,y),m.return=h,m;if(typeof m=="object"&&m!==null){switch(m.$$typeof){case fc:return y=Fc(m.type,m.key,m.props,null,h.mode,y),vo(y,m),y.return=h,y;case bo:return m=pd(m,h.mode,y),m.return=h,m;case ws:var x=m._init;return m=x(m._payload),p(h,m,y)}if(Eo(m)||mo(m))return m=Sa(m,h.mode,y,null),m.return=h,m;if(typeof m.then=="function")return p(h,xc(m),y);if(m.$$typeof===ji)return p(h,Mc(h,m),y);Sc(h,m)}return null}function u(h,m,y,x){var E=m!==null?m.key:null;if(typeof y=="string"&&y!==""||typeof y=="number"||typeof y=="bigint")return E!==null?null:o(h,m,""+y,x);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case fc:return y.key===E?l(h,m,y,x):null;case bo:return y.key===E?c(h,m,y,x):null;case ws:return E=y._init,y=E(y._payload),u(h,m,y,x)}if(Eo(y)||mo(y))return E!==null?null:f(h,m,y,x,null);if(typeof y.then=="function")return u(h,m,xc(y),x);if(y.$$typeof===ji)return u(h,m,Mc(h,y),x);Sc(h,y)}return null}function d(h,m,y,x,E){if(typeof x=="string"&&x!==""||typeof x=="number"||typeof x=="bigint")return h=h.get(y)||null,o(m,h,""+x,E);if(typeof x=="object"&&x!==null){switch(x.$$typeof){case fc:return h=h.get(x.key===null?y:x.key)||null,l(m,h,x,E);case bo:return h=h.get(x.key===null?y:x.key)||null,c(m,h,x,E);case ws:var A=x._init;return x=A(x._payload),d(h,m,y,x,E)}if(Eo(x)||mo(x))return h=h.get(y)||null,f(m,h,x,E,null);if(typeof x.then=="function")return d(h,m,y,xc(x),E);if(x.$$typeof===ji)return d(h,m,y,Mc(m,x),E);Sc(m,x)}return null}function v(h,m,y,x){for(var E=null,A=null,g=m,M=m=0,N=null;g!==null&&M<y.length;M++){g.index>M?(N=g,g=null):N=g.sibling;var R=u(h,g,y[M],x);if(R===null){g===null&&(g=N);break}e&&g&&R.alternate===null&&t(h,g),m=a(R,m,M),A===null?E=R:A.sibling=R,A=R,g=N}if(M===y.length)return n(h,g),ne&&pa(h,M),E;if(g===null){for(;M<y.length;M++)g=p(h,y[M],x),g!==null&&(m=a(g,m,M),A===null?E=g:A.sibling=g,A=g);return ne&&pa(h,M),E}for(g=i(g);M<y.length;M++)N=d(g,h,M,y[M],x),N!==null&&(e&&N.alternate!==null&&g.delete(N.key===null?M:N.key),m=a(N,m,M),A===null?E=N:A.sibling=N,A=N);return e&&g.forEach(function(O){return t(h,O)}),ne&&pa(h,M),E}function T(h,m,y,x){if(y==null)throw Error($(151));for(var E=null,A=null,g=m,M=m=0,N=null,R=y.next();g!==null&&!R.done;M++,R=y.next()){g.index>M?(N=g,g=null):N=g.sibling;var O=u(h,g,R.value,x);if(O===null){g===null&&(g=N);break}e&&g&&O.alternate===null&&t(h,g),m=a(O,m,M),A===null?E=O:A.sibling=O,A=O,g=N}if(R.done)return n(h,g),ne&&pa(h,M),E;if(g===null){for(;!R.done;M++,R=y.next())R=p(h,R.value,x),R!==null&&(m=a(R,m,M),A===null?E=R:A.sibling=R,A=R);return ne&&pa(h,M),E}for(g=i(g);!R.done;M++,R=y.next())R=d(g,h,M,R.value,x),R!==null&&(e&&R.alternate!==null&&g.delete(R.key===null?M:R.key),m=a(R,m,M),A===null?E=R:A.sibling=R,A=R);return e&&g.forEach(function(F){return t(h,F)}),ne&&pa(h,M),E}function _(h,m,y,x){if(typeof y=="object"&&y!==null&&y.type===er&&y.key===null&&(y=y.props.children),typeof y=="object"&&y!==null){switch(y.$$typeof){case fc:t:{for(var E=y.key;m!==null;){if(m.key===E){if(E=y.type,E===er){if(m.tag===7){n(h,m.sibling),x=s(m,y.props.children),x.return=h,h=x;break t}}else if(m.elementType===E||typeof E=="object"&&E!==null&&E.$$typeof===ws&&X0(E)===m.type){n(h,m.sibling),x=s(m,y.props),vo(x,y),x.return=h,h=x;break t}n(h,m);break}else t(h,m);m=m.sibling}y.type===er?(x=Sa(y.props.children,h.mode,x,y.key),x.return=h,h=x):(x=Fc(y.type,y.key,y.props,null,h.mode,x),vo(x,y),x.return=h,h=x)}return r(h);case bo:t:{for(E=y.key;m!==null;){if(m.key===E)if(m.tag===4&&m.stateNode.containerInfo===y.containerInfo&&m.stateNode.implementation===y.implementation){n(h,m.sibling),x=s(m,y.children||[]),x.return=h,h=x;break t}else{n(h,m);break}else t(h,m);m=m.sibling}x=pd(y,h.mode,x),x.return=h,h=x}return r(h);case ws:return E=y._init,y=E(y._payload),_(h,m,y,x)}if(Eo(y))return v(h,m,y,x);if(mo(y)){if(E=mo(y),typeof E!="function")throw Error($(150));return y=E.call(y),T(h,m,y,x)}if(typeof y.then=="function")return _(h,m,xc(y),x);if(y.$$typeof===ji)return _(h,m,Mc(h,y),x);Sc(h,y)}return typeof y=="string"&&y!==""||typeof y=="number"||typeof y=="bigint"?(y=""+y,m!==null&&m.tag===6?(n(h,m.sibling),x=s(m,y),x.return=h,h=x):(n(h,m),x=dd(y,h.mode,x),x.return=h,h=x),r(h)):n(h,m)}return function(h,m,y,x){try{Ko=0;var E=_(h,m,y,x);return mr=null,E}catch(g){if(g===Lo)throw g;var A=ni(29,g,null,h.mode);return A.lanes=x,A.return=h,A}finally{}}}var Ea=Av(!0),wv=Av(!1),br=Ui(null),Qc=Ui(0);function q0(e,t){e=os,Te(Qc,e),Te(br,t),os=e|t.baseLanes}function Fd(){Te(Qc,os),Te(br,br.current)}function Cp(){os=Qc.current,je(br),je(Qc)}var si=Ui(null),Li=null;function Cs(e){var t=e.alternate;Te(Ve,Ve.current&1),Te(si,e),Li===null&&(t===null||br.current!==null||t.memoizedState!==null)&&(Li=e)}function Rv(e){if(e.tag===22){if(Te(Ve,Ve.current),Te(si,e),Li===null){var t=e.alternate;t!==null&&t.memoizedState!==null&&(Li=e)}}else Ds(e)}function Ds(){Te(Ve,Ve.current),Te(si,si.current)}function es(e){je(si),Li===e&&(Li=null),je(Ve)}var Ve=Ui(0);function jc(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var l1=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(n,i){e.push(i)}};this.abort=function(){t.aborted=!0,e.forEach(function(n){return n()})}},c1=ke.unstable_scheduleCallback,u1=ke.unstable_NormalPriority,Ge={$$typeof:ji,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Dp(){return{controller:new l1,data:new Map,refCount:0}}function cl(e){e.refCount--,e.refCount===0&&c1(u1,function(){e.controller.abort()})}var Uo=null,zd=0,Tr=0,gr=null;function h1(e,t){if(Uo===null){var n=Uo=[];zd=0,Tr=$p(),gr={status:"pending",value:void 0,then:function(i){n.push(i)}}}return zd++,t.then(Y0,Y0),t}function Y0(){if(--zd===0&&Uo!==null){gr!==null&&(gr.status="fulfilled");var e=Uo;Uo=null,Tr=0,gr=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function f1(e,t){var n=[],i={status:"pending",value:null,reason:null,then:function(s){n.push(s)}};return e.then(function(){i.status="fulfilled",i.value=t;for(var s=0;s<n.length;s++)(0,n[s])(t)},function(s){for(i.status="rejected",i.reason=s,s=0;s<n.length;s++)(0,n[s])(void 0)}),i}var Z0=Ft.S;Ft.S=function(e,t){typeof t=="object"&&t!==null&&typeof t.then=="function"&&h1(e,t),Z0!==null&&Z0(e,t)};var xa=Ui(null);function Lp(){var e=xa.current;return e!==null?e:ve.pooledCache}function Oc(e,t){t===null?Te(xa,xa.current):Te(xa,t.pool)}function Cv(){var e=Lp();return e===null?null:{parent:Ge._currentValue,pool:e}}var Ws=0,Wt=null,ue=null,Fe=null,$c=!1,_r=!1,Aa=!1,tu=0,Jo=0,vr=null,d1=0;function Oe(){throw Error($(321))}function Np(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Fn(e[n],t[n]))return!1;return!0}function Up(e,t,n,i,s,a){return Ws=a,Wt=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Ft.H=e===null||e.memoizedState===null?Na:Zs,Aa=!1,a=n(i,s),Aa=!1,_r&&(a=Lv(t,n,i,s)),Dv(e),a}function Dv(e){Ft.H=Ni;var t=ue!==null&&ue.next!==null;if(Ws=0,Fe=ue=Wt=null,$c=!1,Jo=0,vr=null,t)throw Error($(300));e===null||Qe||(e=e.dependencies,e!==null&&iu(e)&&(Qe=!0))}function Lv(e,t,n,i){Wt=e;var s=0;do{if(_r&&(vr=null),Jo=0,_r=!1,25<=s)throw Error($(301));if(s+=1,Fe=ue=null,e.updateQueue!=null){var a=e.updateQueue;a.lastEffect=null,a.events=null,a.stores=null,a.memoCache!=null&&(a.memoCache.index=0)}Ft.H=Ua,a=t(n,i)}while(_r);return a}function p1(){var e=Ft.H,t=e.useState()[0];return t=typeof t.then=="function"?ul(t):t,e=e.useState()[0],(ue!==null?ue.memoizedState:null)!==e&&(Wt.flags|=1024),t}function Op(){var e=tu!==0;return tu=0,e}function Pp(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function Ip(e){if($c){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}$c=!1}Ws=0,Fe=ue=Wt=null,_r=!1,Jo=tu=0,vr=null}function Rn(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Fe===null?Wt.memoizedState=Fe=e:Fe=Fe.next=e,Fe}function ze(){if(ue===null){var e=Wt.alternate;e=e!==null?e.memoizedState:null}else e=ue.next;var t=Fe===null?Wt.memoizedState:Fe.next;if(t!==null)Fe=t,ue=e;else{if(e===null)throw Wt.alternate===null?Error($(467)):Error($(310));ue=e,e={memoizedState:ue.memoizedState,baseState:ue.baseState,baseQueue:ue.baseQueue,queue:ue.queue,next:null},Fe===null?Wt.memoizedState=Fe=e:Fe=Fe.next=e}return Fe}var Mu;Mu=function(){return{lastEffect:null,events:null,stores:null,memoCache:null}};function ul(e){var t=Jo;return Jo+=1,vr===null&&(vr=[]),e=Ev(vr,e,t),t=Wt,(Fe===null?t.memoizedState:Fe.next)===null&&(t=t.alternate,Ft.H=t===null||t.memoizedState===null?Na:Zs),e}function bu(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return ul(e);if(e.$$typeof===ji)return hn(e)}throw Error($(438,String(e)))}function Bp(e){var t=null,n=Wt.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var i=Wt.alternate;i!==null&&(i=i.updateQueue,i!==null&&(i=i.memoCache,i!=null&&(t={data:i.data.map(function(s){return s.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),n===null&&(n=Mu(),Wt.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),i=0;i<e;i++)n[i]=JM;return t.index++,n}function as(e,t){return typeof t=="function"?t(e):t}function Pc(e){var t=ze();return Fp(t,ue,e)}function Fp(e,t,n){var i=e.queue;if(i===null)throw Error($(311));i.lastRenderedReducer=n;var s=e.baseQueue,a=i.pending;if(a!==null){if(s!==null){var r=s.next;s.next=a.next,a.next=r}t.baseQueue=s=a,i.pending=null}if(a=e.baseState,s===null)e.memoizedState=a;else{t=s.next;var o=r=null,l=null,c=t,f=!1;do{var p=c.lane&-536870913;if(p!==c.lane?($t&p)===p:(Ws&p)===p){var u=c.revertLane;if(u===0)l!==null&&(l=l.next={lane:0,revertLane:0,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),p===Tr&&(f=!0);else if((Ws&u)===u){c=c.next,u===Tr&&(f=!0);continue}else p={lane:0,revertLane:c.revertLane,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=p,r=a):l=l.next=p,Wt.lanes|=u,qs|=u;p=c.action,Aa&&n(a,p),a=c.hasEagerState?c.eagerState:n(a,p)}else u={lane:p,revertLane:c.revertLane,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=u,r=a):l=l.next=u,Wt.lanes|=p,qs|=p;c=c.next}while(c!==null&&c!==t);if(l===null?r=a:l.next=o,!Fn(a,e.memoizedState)&&(Qe=!0,f&&(n=gr,n!==null)))throw n;e.memoizedState=a,e.baseState=r,e.baseQueue=l,i.lastRenderedState=a}return s===null&&(i.lanes=0),[e.memoizedState,i.dispatch]}function nd(e){var t=ze(),n=t.queue;if(n===null)throw Error($(311));n.lastRenderedReducer=e;var i=n.dispatch,s=n.pending,a=t.memoizedState;if(s!==null){n.pending=null;var r=s=s.next;do a=e(a,r.action),r=r.next;while(r!==s);Fn(a,t.memoizedState)||(Qe=!0),t.memoizedState=a,t.baseQueue===null&&(t.baseState=a),n.lastRenderedState=a}return[a,i]}function Nv(e,t,n){var i=Wt,s=ze(),a=ne;if(a){if(n===void 0)throw Error($(407));n=n()}else n=t();var r=!Fn((ue||s).memoizedState,n);if(r&&(s.memoizedState=n,Qe=!0),s=s.queue,zp(Pv.bind(null,i,s,e),[e]),s.getSnapshot!==t||r||Fe!==null&&Fe.memoizedState.tag&1){if(i.flags|=2048,Er(9,Ov.bind(null,i,s,n,t),{destroy:void 0},null),ve===null)throw Error($(349));a||(Ws&60)!==0||Uv(i,t,n)}return n}function Uv(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=Wt.updateQueue,t===null?(t=Mu(),Wt.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Ov(e,t,n,i){t.value=n,t.getSnapshot=i,Iv(t)&&Bv(e)}function Pv(e,t,n){return n(function(){Iv(t)&&Bv(e)})}function Iv(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Fn(e,n)}catch{return!0}}function Bv(e){var t=ks(e,2);t!==null&&Mn(t,e,2)}function Hd(e){var t=Rn();if(typeof e=="function"){var n=e;if(e=n(),Aa){Us(!0);try{n()}finally{Us(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:as,lastRenderedState:e},t}function Fv(e,t,n,i){return e.baseState=n,Fp(e,ue,typeof i=="function"?i:as)}function m1(e,t,n,i,s){if(Eu(e))throw Error($(485));if(e=t.action,e!==null){var a={payload:s,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(r){a.listeners.push(r)}};Ft.T!==null?n(!0):a.isTransition=!1,i(a),n=t.pending,n===null?(a.next=t.pending=a,zv(t,a)):(a.next=n.next,t.pending=n.next=a)}}function zv(e,t){var n=t.action,i=t.payload,s=e.state;if(t.isTransition){var a=Ft.T,r={};Ft.T=r;try{var o=n(s,i),l=Ft.S;l!==null&&l(r,o),K0(e,t,o)}catch(c){Gd(e,t,c)}finally{Ft.T=a}}else try{a=n(s,i),K0(e,t,a)}catch(c){Gd(e,t,c)}}function K0(e,t,n){n!==null&&typeof n=="object"&&typeof n.then=="function"?n.then(function(i){J0(e,t,i)},function(i){return Gd(e,t,i)}):J0(e,t,n)}function J0(e,t,n){t.status="fulfilled",t.value=n,Hv(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,zv(e,n)))}function Gd(e,t,n){var i=e.pending;if(e.pending=null,i!==null){i=i.next;do t.status="rejected",t.reason=n,Hv(t),t=t.next;while(t!==i)}e.action=null}function Hv(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function Gv(e,t){return t}function Vv(e,t){if(ne){var n=ve.formState;if(n!==null){t:{var i=Wt;if(ne){if(an){e:{for(var s=an,a=wi;s.nodeType!==8;){if(!a){s=null;break e}if(s=gi(s.nextSibling),s===null){s=null;break e}}a=s.data,s=a==="F!"||a==="F"?s:null}if(s){an=gi(s.nextSibling),i=s.data==="F!";break t}}Ta(i)}i=!1}i&&(t=n[0])}}return n=Rn(),n.memoizedState=n.baseState=t,i={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Gv,lastRenderedState:t},n.queue=i,n=ay.bind(null,Wt,i),i.dispatch=n,i=Hd(!1),a=kp.bind(null,Wt,!1,i.queue),i=Rn(),s={state:t,dispatch:null,action:e,pending:null},i.queue=s,n=m1.bind(null,Wt,s,a,n),s.dispatch=n,i.memoizedState=e,[t,n,!1]}function kv(e){var t=ze();return Wv(t,ue,e)}function Wv(e,t,n){t=Fp(e,t,Gv)[0],e=Pc(as)[0],t=typeof t=="object"&&t!==null&&typeof t.then=="function"?ul(t):t;var i=ze(),s=i.queue,a=s.dispatch;return n!==i.memoizedState&&(Wt.flags|=2048,Er(9,g1.bind(null,s,n),{destroy:void 0},null)),[t,a,e]}function g1(e,t){e.action=t}function Xv(e){var t=ze(),n=ue;if(n!==null)return Wv(t,n,e);ze(),t=t.memoizedState,n=ze();var i=n.queue.dispatch;return n.memoizedState=e,[t,i,!1]}function Er(e,t,n,i){return e={tag:e,create:t,inst:n,deps:i,next:null},t=Wt.updateQueue,t===null&&(t=Mu(),Wt.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(i=n.next,n.next=e,e.next=i,t.lastEffect=e),e}function qv(){return ze().memoizedState}function Ic(e,t,n,i){var s=Rn();Wt.flags|=e,s.memoizedState=Er(1|t,n,{destroy:void 0},i===void 0?null:i)}function Tu(e,t,n,i){var s=ze();i=i===void 0?null:i;var a=s.memoizedState.inst;ue!==null&&i!==null&&Np(i,ue.memoizedState.deps)?s.memoizedState=Er(t,n,a,i):(Wt.flags|=e,s.memoizedState=Er(1|t,n,a,i))}function Q0(e,t){Ic(8390656,8,e,t)}function zp(e,t){Tu(2048,8,e,t)}function Yv(e,t){return Tu(4,2,e,t)}function Zv(e,t){return Tu(4,4,e,t)}function Kv(e,t){if(typeof t=="function"){e=e();var n=t(e);return function(){typeof n=="function"?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Jv(e,t,n){n=n!=null?n.concat([e]):null,Tu(4,4,Kv.bind(null,t,e),n)}function Hp(){}function Qv(e,t){var n=ze();t=t===void 0?null:t;var i=n.memoizedState;return t!==null&&Np(t,i[1])?i[0]:(n.memoizedState=[e,t],e)}function jv(e,t){var n=ze();t=t===void 0?null:t;var i=n.memoizedState;if(t!==null&&Np(t,i[1]))return i[0];if(i=e(),Aa){Us(!0);try{e()}finally{Us(!1)}}return n.memoizedState=[i,t],i}function Gp(e,t,n){return n===void 0||(Ws&1073741824)!==0?e.memoizedState=t:(e.memoizedState=n,e=Hy(),Wt.lanes|=e,qs|=e,n)}function $v(e,t,n,i){return Fn(n,t)?n:br.current!==null?(e=Gp(e,n,i),Fn(e,t)||(Qe=!0),e):(Ws&42)===0?(Qe=!0,e.memoizedState=n):(e=Hy(),Wt.lanes|=e,qs|=e,t)}function ty(e,t,n,i,s){var a=ye.p;ye.p=a!==0&&8>a?a:8;var r=Ft.T,o={};Ft.T=o,kp(e,!1,t,n);try{var l=s(),c=Ft.S;if(c!==null&&c(o,l),l!==null&&typeof l=="object"&&typeof l.then=="function"){var f=f1(l,i);Oo(e,t,f,Bn(e))}else Oo(e,t,i,Bn(e))}catch(p){Oo(e,t,{then:function(){},status:"rejected",reason:p},Bn())}finally{ye.p=a,Ft.T=r}}function _1(){}function Vd(e,t,n,i){if(e.tag!==5)throw Error($(476));var s=ey(e).queue;ty(e,s,t,va,n===null?_1:function(){return ny(e),n(i)})}function ey(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:va,baseState:va,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:as,lastRenderedState:va},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:as,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function ny(e){var t=ey(e).next.queue;Oo(e,t,{},Bn())}function Vp(){return hn(tl)}function iy(){return ze().memoizedState}function sy(){return ze().memoizedState}function v1(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=Bn();e=Is(n);var i=Bs(t,e,n);i!==null&&(Mn(i,t,n),Io(i,t,n)),t={cache:Dp()},e.payload=t;return}t=t.return}}function y1(e,t,n){var i=Bn();n={lane:i,revertLane:0,action:n,hasEagerState:!1,eagerState:null,next:null},Eu(e)?ry(t,n):(n=Ap(e,t,n,i),n!==null&&(Mn(n,e,i),oy(n,t,i)))}function ay(e,t,n){var i=Bn();Oo(e,t,n,i)}function Oo(e,t,n,i){var s={lane:i,revertLane:0,action:n,hasEagerState:!1,eagerState:null,next:null};if(Eu(e))ry(t,s);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var r=t.lastRenderedState,o=a(r,n);if(s.hasEagerState=!0,s.eagerState=o,Fn(o,r))return Su(e,t,s,0),ve===null&&xu(),!1}catch{}finally{}if(n=Ap(e,t,s,i),n!==null)return Mn(n,e,i),oy(n,t,i),!0}return!1}function kp(e,t,n,i){if(i={lane:2,revertLane:$p(),action:i,hasEagerState:!1,eagerState:null,next:null},Eu(e)){if(t)throw Error($(479))}else t=Ap(e,n,i,2),t!==null&&Mn(t,e,2)}function Eu(e){var t=e.alternate;return e===Wt||t!==null&&t===Wt}function ry(e,t){_r=$c=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function oy(e,t,n){if((n&4194176)!==0){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,K_(e,n)}}var Ni={readContext:hn,use:bu,useCallback:Oe,useContext:Oe,useEffect:Oe,useImperativeHandle:Oe,useLayoutEffect:Oe,useInsertionEffect:Oe,useMemo:Oe,useReducer:Oe,useRef:Oe,useState:Oe,useDebugValue:Oe,useDeferredValue:Oe,useTransition:Oe,useSyncExternalStore:Oe,useId:Oe};Ni.useCacheRefresh=Oe;Ni.useMemoCache=Oe;Ni.useHostTransitionStatus=Oe;Ni.useFormState=Oe;Ni.useActionState=Oe;Ni.useOptimistic=Oe;var Na={readContext:hn,use:bu,useCallback:function(e,t){return Rn().memoizedState=[e,t===void 0?null:t],e},useContext:hn,useEffect:Q0,useImperativeHandle:function(e,t,n){n=n!=null?n.concat([e]):null,Ic(4194308,4,Kv.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Ic(4194308,4,e,t)},useInsertionEffect:function(e,t){Ic(4,2,e,t)},useMemo:function(e,t){var n=Rn();t=t===void 0?null:t;var i=e();if(Aa){Us(!0);try{e()}finally{Us(!1)}}return n.memoizedState=[i,t],i},useReducer:function(e,t,n){var i=Rn();if(n!==void 0){var s=n(t);if(Aa){Us(!0);try{n(t)}finally{Us(!1)}}}else s=t;return i.memoizedState=i.baseState=s,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:s},i.queue=e,e=e.dispatch=y1.bind(null,Wt,e),[i.memoizedState,e]},useRef:function(e){var t=Rn();return e={current:e},t.memoizedState=e},useState:function(e){e=Hd(e);var t=e.queue,n=ay.bind(null,Wt,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:Hp,useDeferredValue:function(e,t){var n=Rn();return Gp(n,e,t)},useTransition:function(){var e=Hd(!1);return e=ty.bind(null,Wt,e.queue,!0,!1),Rn().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var i=Wt,s=Rn();if(ne){if(n===void 0)throw Error($(407));n=n()}else{if(n=t(),ve===null)throw Error($(349));($t&60)!==0||Uv(i,t,n)}s.memoizedState=n;var a={value:n,getSnapshot:t};return s.queue=a,Q0(Pv.bind(null,i,a,e),[e]),i.flags|=2048,Er(9,Ov.bind(null,i,a,n,t),{destroy:void 0},null),n},useId:function(){var e=Rn(),t=ve.identifierPrefix;if(ne){var n=ts,i=$i;n=(i&~(1<<32-In(i)-1)).toString(32)+n,t=":"+t+"R"+n,n=tu++,0<n&&(t+="H"+n.toString(32)),t+=":"}else n=d1++,t=":"+t+"r"+n.toString(32)+":";return e.memoizedState=t},useCacheRefresh:function(){return Rn().memoizedState=v1.bind(null,Wt)}};Na.useMemoCache=Bp;Na.useHostTransitionStatus=Vp;Na.useFormState=Vv;Na.useActionState=Vv;Na.useOptimistic=function(e){var t=Rn();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=kp.bind(null,Wt,!0,n),n.dispatch=t,[e,t]};var Zs={readContext:hn,use:bu,useCallback:Qv,useContext:hn,useEffect:zp,useImperativeHandle:Jv,useInsertionEffect:Yv,useLayoutEffect:Zv,useMemo:jv,useReducer:Pc,useRef:qv,useState:function(){return Pc(as)},useDebugValue:Hp,useDeferredValue:function(e,t){var n=ze();return $v(n,ue.memoizedState,e,t)},useTransition:function(){var e=Pc(as)[0],t=ze().memoizedState;return[typeof e=="boolean"?e:ul(e),t]},useSyncExternalStore:Nv,useId:iy};Zs.useCacheRefresh=sy;Zs.useMemoCache=Bp;Zs.useHostTransitionStatus=Vp;Zs.useFormState=kv;Zs.useActionState=kv;Zs.useOptimistic=function(e,t){var n=ze();return Fv(n,ue,e,t)};var Ua={readContext:hn,use:bu,useCallback:Qv,useContext:hn,useEffect:zp,useImperativeHandle:Jv,useInsertionEffect:Yv,useLayoutEffect:Zv,useMemo:jv,useReducer:nd,useRef:qv,useState:function(){return nd(as)},useDebugValue:Hp,useDeferredValue:function(e,t){var n=ze();return ue===null?Gp(n,e,t):$v(n,ue.memoizedState,e,t)},useTransition:function(){var e=nd(as)[0],t=ze().memoizedState;return[typeof e=="boolean"?e:ul(e),t]},useSyncExternalStore:Nv,useId:iy};Ua.useCacheRefresh=sy;Ua.useMemoCache=Bp;Ua.useHostTransitionStatus=Vp;Ua.useFormState=Xv;Ua.useActionState=Xv;Ua.useOptimistic=function(e,t){var n=ze();return ue!==null?Fv(n,ue,e,t):(n.baseState=e,[e,n.queue.dispatch])};function id(e,t,n,i){t=e.memoizedState,n=n(i,t),n=n==null?t:xe({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var kd={isMounted:function(e){return(e=e._reactInternals)?Cr(e)===e:!1},enqueueSetState:function(e,t,n){e=e._reactInternals;var i=Bn(),s=Is(i);s.payload=t,n!=null&&(s.callback=n),t=Bs(e,s,i),t!==null&&(Mn(t,e,i),Io(t,e,i))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var i=Bn(),s=Is(i);s.tag=1,s.payload=t,n!=null&&(s.callback=n),t=Bs(e,s,i),t!==null&&(Mn(t,e,i),Io(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=Bn(),i=Is(n);i.tag=2,t!=null&&(i.callback=t),t=Bs(e,i,n),t!==null&&(Mn(t,e,n),Io(t,e,n))}};function j0(e,t,n,i,s,a,r){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(i,a,r):t.prototype&&t.prototype.isPureReactComponent?!Yo(n,i)||!Yo(s,a):!0}function $0(e,t,n,i){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,i),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,i),t.state!==e&&kd.enqueueReplaceState(t,t.state,null)}function wa(e,t){var n=t;if("ref"in t){n={};for(var i in t)i!=="ref"&&(n[i]=t[i])}if(e=e.defaultProps){n===t&&(n=xe({},n));for(var s in e)n[s]===void 0&&(n[s]=e[s])}return n}var eu=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function ly(e){eu(e)}function cy(e){console.error(e)}function uy(e){eu(e)}function nu(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(i){setTimeout(function(){throw i})}}function t_(e,t,n){try{var i=e.onCaughtError;i(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(s){setTimeout(function(){throw s})}}function Wd(e,t,n){return n=Is(n),n.tag=3,n.payload={element:null},n.callback=function(){nu(e,t)},n}function hy(e){return e=Is(e),e.tag=3,e}function fy(e,t,n,i){var s=n.type.getDerivedStateFromError;if(typeof s=="function"){var a=i.value;e.payload=function(){return s(a)},e.callback=function(){t_(t,n,i)}}var r=n.stateNode;r!==null&&typeof r.componentDidCatch=="function"&&(e.callback=function(){t_(t,n,i),typeof s!="function"&&(zs===null?zs=new Set([this]):zs.add(this));var o=i.stack;this.componentDidCatch(i.value,{componentStack:o!==null?o:""})})}function x1(e,t,n,i,s){if(n.flags|=32768,i!==null&&typeof i=="object"&&typeof i.then=="function"){if(t=n.alternate,t!==null&&hl(t,n,s,!0),n=si.current,n!==null){switch(n.tag){case 13:return Li===null?ap():n.alternate===null&&Ne===0&&(Ne=3),n.flags&=-257,n.flags|=65536,n.lanes=s,i===Bd?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([i]):t.add(i),gd(e,i,s)),!1;case 22:return n.flags|=65536,i===Bd?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([i])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([i]):n.add(i)),gd(e,i,s)),!1}throw Error($(435,n.tag))}return gd(e,i,s),ap(),!1}if(ne)return t=si.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=s,i!==Id&&(e=Error($(422),{cause:i}),Zo(ei(e,n)))):(i!==Id&&(t=Error($(423),{cause:i}),Zo(ei(t,n))),e=e.current.alternate,e.flags|=65536,s&=-s,e.lanes|=s,i=ei(i,n),s=Wd(e.stateNode,i,s),cd(e,s),Ne!==4&&(Ne=2)),!1;var a=Error($(520),{cause:i});if(a=ei(a,n),Ho===null?Ho=[a]:Ho.push(a),Ne!==4&&(Ne=2),t===null)return!0;i=ei(i,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=s&-s,n.lanes|=e,e=Wd(n.stateNode,i,e),cd(n,e),!1;case 1:if(t=n.type,a=n.stateNode,(n.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||a!==null&&typeof a.componentDidCatch=="function"&&(zs===null||!zs.has(a))))return n.flags|=65536,s&=-s,n.lanes|=s,s=hy(s),fy(s,e,n,i),cd(n,s),!1}n=n.return}while(n!==null);return!1}var dy=Error($(461)),Qe=!1;function sn(e,t,n,i){t.child=e===null?wv(t,null,n,i):Ea(t,e.child,n,i)}function e_(e,t,n,i,s){n=n.render;var a=t.ref;if("ref"in i){var r={};for(var o in i)o!=="ref"&&(r[o]=i[o])}else r=i;return Ra(t),i=Up(e,t,n,r,a,s),o=Op(),e!==null&&!Qe?(Pp(e,t,s),rs(e,t,s)):(ne&&o&&wp(t),t.flags|=1,sn(e,t,i,s),t.child)}function n_(e,t,n,i,s){if(e===null){var a=n.type;return typeof a=="function"&&!Zp(a)&&a.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=a,py(e,t,a,i,s)):(e=Fc(n.type,null,i,t,t.mode,s),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,!Wp(e,s)){var r=a.memoizedProps;if(n=n.compare,n=n!==null?n:Yo,n(r,i)&&e.ref===t.ref)return rs(e,t,s)}return t.flags|=1,e=Fs(a,i),e.ref=t.ref,e.return=t,t.child=e}function py(e,t,n,i,s){if(e!==null){var a=e.memoizedProps;if(Yo(a,i)&&e.ref===t.ref)if(Qe=!1,t.pendingProps=i=a,Wp(e,s))(e.flags&131072)!==0&&(Qe=!0);else return t.lanes=e.lanes,rs(e,t,s)}return Xd(e,t,n,i,s)}function my(e,t,n){var i=t.pendingProps,s=i.children,a=(t.stateNode._pendingVisibility&2)!==0,r=e!==null?e.memoizedState:null;if(Po(e,t),i.mode==="hidden"||a){if((t.flags&128)!==0){if(i=r!==null?r.baseLanes|n:n,e!==null){for(s=t.child=e.child,a=0;s!==null;)a=a|s.lanes|s.childLanes,s=s.sibling;t.childLanes=a&~i}else t.childLanes=0,t.child=null;return i_(e,t,i,n)}if((n&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Oc(t,r!==null?r.cachePool:null),r!==null?q0(t,r):Fd(),Rv(t);else return t.lanes=t.childLanes=536870912,i_(e,t,r!==null?r.baseLanes|n:n,n)}else r!==null?(Oc(t,r.cachePool),q0(t,r),Ds(t),t.memoizedState=null):(e!==null&&Oc(t,null),Fd(),Ds(t));return sn(e,t,s,n),t.child}function i_(e,t,n,i){var s=Lp();return s=s===null?null:{parent:Ge._currentValue,pool:s},t.memoizedState={baseLanes:n,cachePool:s},e!==null&&Oc(t,null),Fd(),Rv(t),e!==null&&hl(e,t,i,!0),null}function Po(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=2097664);else{if(typeof n!="function"&&typeof n!="object")throw Error($(284));(e===null||e.ref!==n)&&(t.flags|=2097664)}}function Xd(e,t,n,i,s){return Ra(t),n=Up(e,t,n,i,void 0,s),i=Op(),e!==null&&!Qe?(Pp(e,t,s),rs(e,t,s)):(ne&&i&&wp(t),t.flags|=1,sn(e,t,n,s),t.child)}function s_(e,t,n,i,s,a){return Ra(t),t.updateQueue=null,n=Lv(t,i,n,s),Dv(e),i=Op(),e!==null&&!Qe?(Pp(e,t,a),rs(e,t,a)):(ne&&i&&wp(t),t.flags|=1,sn(e,t,n,a),t.child)}function a_(e,t,n,i,s){if(Ra(t),t.stateNode===null){var a=lr,r=n.contextType;typeof r=="object"&&r!==null&&(a=hn(r)),a=new n(i,a),t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,a.updater=kd,t.stateNode=a,a._reactInternals=t,a=t.stateNode,a.props=i,a.state=t.memoizedState,a.refs={},Xp(t),r=n.contextType,a.context=typeof r=="object"&&r!==null?hn(r):lr,a.state=t.memoizedState,r=n.getDerivedStateFromProps,typeof r=="function"&&(id(t,n,r,i),a.state=t.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof a.getSnapshotBeforeUpdate=="function"||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(r=a.state,typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount(),r!==a.state&&kd.enqueueReplaceState(a,a.state,null),Fo(t,i,a,s),Bo(),a.state=t.memoizedState),typeof a.componentDidMount=="function"&&(t.flags|=4194308),i=!0}else if(e===null){a=t.stateNode;var o=t.memoizedProps,l=wa(n,o);a.props=l;var c=a.context,f=n.contextType;r=lr,typeof f=="object"&&f!==null&&(r=hn(f));var p=n.getDerivedStateFromProps;f=typeof p=="function"||typeof a.getSnapshotBeforeUpdate=="function",o=t.pendingProps!==o,f||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(o||c!==r)&&$0(t,a,i,r),Rs=!1;var u=t.memoizedState;a.state=u,Fo(t,i,a,s),Bo(),c=t.memoizedState,o||u!==c||Rs?(typeof p=="function"&&(id(t,n,p,i),c=t.memoizedState),(l=Rs||j0(t,n,l,i,u,c,r))?(f||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount=="function"&&(t.flags|=4194308)):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=i,t.memoizedState=c),a.props=i,a.state=c,a.context=r,i=l):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),i=!1)}else{a=t.stateNode,Qd(e,t),r=t.memoizedProps,f=wa(n,r),a.props=f,p=t.pendingProps,u=a.context,c=n.contextType,l=lr,typeof c=="object"&&c!==null&&(l=hn(c)),o=n.getDerivedStateFromProps,(c=typeof o=="function"||typeof a.getSnapshotBeforeUpdate=="function")||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(r!==p||u!==l)&&$0(t,a,i,l),Rs=!1,u=t.memoizedState,a.state=u,Fo(t,i,a,s),Bo();var d=t.memoizedState;r!==p||u!==d||Rs||e!==null&&e.dependencies!==null&&iu(e.dependencies)?(typeof o=="function"&&(id(t,n,o,i),d=t.memoizedState),(f=Rs||j0(t,n,f,i,u,d,l)||e!==null&&e.dependencies!==null&&iu(e.dependencies))?(c||typeof a.UNSAFE_componentWillUpdate!="function"&&typeof a.componentWillUpdate!="function"||(typeof a.componentWillUpdate=="function"&&a.componentWillUpdate(i,d,l),typeof a.UNSAFE_componentWillUpdate=="function"&&a.UNSAFE_componentWillUpdate(i,d,l)),typeof a.componentDidUpdate=="function"&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof a.componentDidUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=1024),t.memoizedProps=i,t.memoizedState=d),a.props=i,a.state=d,a.context=l,i=f):(typeof a.componentDidUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=1024),i=!1)}return a=i,Po(e,t),i=(t.flags&128)!==0,a||i?(a=t.stateNode,n=i&&typeof n.getDerivedStateFromError!="function"?null:a.render(),t.flags|=1,e!==null&&i?(t.child=Ea(t,e.child,null,s),t.child=Ea(t,null,n,s)):sn(e,t,n,s),t.memoizedState=a.state,e=t.child):e=rs(e,t,s),e}function r_(e,t,n,i){return ll(),t.flags|=256,sn(e,t,n,i),t.child}var sd={dehydrated:null,treeContext:null,retryLane:0};function ad(e){return{baseLanes:e,cachePool:Cv()}}function rd(e,t,n){return e=e!==null?e.childLanes&~n:0,t&&(e|=ii),e}function gy(e,t,n){var i=t.pendingProps,s=!1,a=(t.flags&128)!==0,r;if((r=a)||(r=e!==null&&e.memoizedState===null?!1:(Ve.current&2)!==0),r&&(s=!0,t.flags&=-129),r=(t.flags&32)!==0,t.flags&=-33,e===null){if(ne){if(s?Cs(t):Ds(t),ne){var o=an,l;if(l=o){t:{for(l=o,o=wi;l.nodeType!==8;){if(!o){o=null;break t}if(l=gi(l.nextSibling),l===null){o=null;break t}}o=l}o!==null?(t.memoizedState={dehydrated:o,treeContext:ya!==null?{id:$i,overflow:ts}:null,retryLane:536870912},l=ni(18,null,null,0),l.stateNode=o,l.return=t,t.child=l,Sn=t,an=null,l=!0):l=!1}l||Ta(t)}if(o=t.memoizedState,o!==null&&(o=o.dehydrated,o!==null))return o.data==="$!"?t.lanes=16:t.lanes=536870912,null;es(t)}return o=i.children,i=i.fallback,s?(Ds(t),s=t.mode,o=Yd({mode:"hidden",children:o},s),i=Sa(i,s,n,null),o.return=t,i.return=t,o.sibling=i,t.child=o,s=t.child,s.memoizedState=ad(n),s.childLanes=rd(e,r,n),t.memoizedState=sd,i):(Cs(t),qd(t,o))}if(l=e.memoizedState,l!==null&&(o=l.dehydrated,o!==null)){if(a)t.flags&256?(Cs(t),t.flags&=-257,t=od(e,t,n)):t.memoizedState!==null?(Ds(t),t.child=e.child,t.flags|=128,t=null):(Ds(t),s=i.fallback,o=t.mode,i=Yd({mode:"visible",children:i.children},o),s=Sa(s,o,n,null),s.flags|=2,i.return=t,s.return=t,i.sibling=s,t.child=i,Ea(t,e.child,null,n),i=t.child,i.memoizedState=ad(n),i.childLanes=rd(e,r,n),t.memoizedState=sd,t=s);else if(Cs(t),o.data==="$!"){if(r=o.nextSibling&&o.nextSibling.dataset,r)var c=r.dgst;r=c,i=Error($(419)),i.stack="",i.digest=r,Zo({value:i,source:null,stack:null}),t=od(e,t,n)}else if(Qe||hl(e,t,n,!1),r=(n&e.childLanes)!==0,Qe||r){if(r=ve,r!==null){if(i=n&-n,(i&42)!==0)i=1;else switch(i){case 2:i=1;break;case 8:i=4;break;case 32:i=16;break;case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:i=64;break;case 268435456:i=134217728;break;default:i=0}if(i=(i&(r.suspendedLanes|n))!==0?0:i,i!==0&&i!==l.retryLane)throw l.retryLane=i,ks(e,i),Mn(r,e,i),dy}o.data==="$?"||ap(),t=od(e,t,n)}else o.data==="$?"?(t.flags|=128,t.child=e.child,t=P1.bind(null,e),o._reactRetry=t,t=null):(e=l.treeContext,an=gi(o.nextSibling),Sn=t,ne=!0,mi=null,wi=!1,e!==null&&(jn[$n++]=$i,jn[$n++]=ts,jn[$n++]=ya,$i=e.id,ts=e.overflow,ya=t),t=qd(t,i.children),t.flags|=4096);return t}return s?(Ds(t),s=i.fallback,o=t.mode,l=e.child,c=l.sibling,i=Fs(l,{mode:"hidden",children:i.children}),i.subtreeFlags=l.subtreeFlags&31457280,c!==null?s=Fs(c,s):(s=Sa(s,o,n,null),s.flags|=2),s.return=t,i.return=t,i.sibling=s,t.child=i,i=s,s=t.child,o=e.child.memoizedState,o===null?o=ad(n):(l=o.cachePool,l!==null?(c=Ge._currentValue,l=l.parent!==c?{parent:c,pool:c}:l):l=Cv(),o={baseLanes:o.baseLanes|n,cachePool:l}),s.memoizedState=o,s.childLanes=rd(e,r,n),t.memoizedState=sd,i):(Cs(t),n=e.child,e=n.sibling,n=Fs(n,{mode:"visible",children:i.children}),n.return=t,n.sibling=null,e!==null&&(r=t.deletions,r===null?(t.deletions=[e],t.flags|=16):r.push(e)),t.child=n,t.memoizedState=null,n)}function qd(e,t){return t=Yd({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function Yd(e,t){return Fy(e,t,0,null)}function od(e,t,n){return Ea(t,e.child,null,n),e=qd(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function o_(e,t,n){e.lanes|=t;var i=e.alternate;i!==null&&(i.lanes|=t),Kd(e.return,t,n)}function ld(e,t,n,i,s){var a=e.memoizedState;a===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:i,tail:n,tailMode:s}:(a.isBackwards=t,a.rendering=null,a.renderingStartTime=0,a.last=i,a.tail=n,a.tailMode=s)}function _y(e,t,n){var i=t.pendingProps,s=i.revealOrder,a=i.tail;if(sn(e,t,i.children,n),i=Ve.current,(i&2)!==0)i=i&1|2,t.flags|=128;else{if(e!==null&&(e.flags&128)!==0)t:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&o_(e,n,t);else if(e.tag===19)o_(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break t;for(;e.sibling===null;){if(e.return===null||e.return===t)break t;e=e.return}e.sibling.return=e.return,e=e.sibling}i&=1}switch(Te(Ve,i),s){case"forwards":for(n=t.child,s=null;n!==null;)e=n.alternate,e!==null&&jc(e)===null&&(s=n),n=n.sibling;n=s,n===null?(s=t.child,t.child=null):(s=n.sibling,n.sibling=null),ld(t,!1,s,n,a);break;case"backwards":for(n=null,s=t.child,t.child=null;s!==null;){if(e=s.alternate,e!==null&&jc(e)===null){t.child=s;break}e=s.sibling,s.sibling=n,n=s,s=e}ld(t,!0,n,null,a);break;case"together":ld(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function rs(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),qs|=t.lanes,(n&t.childLanes)===0)if(e!==null){if(hl(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error($(153));if(t.child!==null){for(e=t.child,n=Fs(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Fs(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function Wp(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&iu(e)))}function S1(e,t,n){switch(t.tag){case 3:kc(t,t.stateNode.containerInfo),Ls(t,Ge,e.memoizedState.cache),ll();break;case 27:case 5:wd(t);break;case 4:kc(t,t.stateNode.containerInfo);break;case 10:Ls(t,t.type,t.memoizedProps.value);break;case 13:var i=t.memoizedState;if(i!==null)return i.dehydrated!==null?(Cs(t),t.flags|=128,null):(n&t.child.childLanes)!==0?gy(e,t,n):(Cs(t),e=rs(e,t,n),e!==null?e.sibling:null);Cs(t);break;case 19:var s=(e.flags&128)!==0;if(i=(n&t.childLanes)!==0,i||(hl(e,t,n,!1),i=(n&t.childLanes)!==0),s){if(i)return _y(e,t,n);t.flags|=128}if(s=t.memoizedState,s!==null&&(s.rendering=null,s.tail=null,s.lastEffect=null),Te(Ve,Ve.current),i)break;return null;case 22:case 23:return t.lanes=0,my(e,t,n);case 24:Ls(t,Ge,e.memoizedState.cache)}return rs(e,t,n)}function vy(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)Qe=!0;else{if(!Wp(e,n)&&(t.flags&128)===0)return Qe=!1,S1(e,t,n);Qe=(e.flags&131072)!==0}else Qe=!1,ne&&(t.flags&1048576)!==0&&bv(t,Jc,t.index);switch(t.lanes=0,t.tag){case 16:t:{e=t.pendingProps;var i=t.elementType,s=i._init;if(i=s(i._payload),t.type=i,typeof i=="function")Zp(i)?(e=wa(i,e),t.tag=1,t=a_(null,t,i,e,n)):(t.tag=0,t=Xd(null,t,i,e,n));else{if(i!=null){if(s=i.$$typeof,s===mp){t.tag=11,t=e_(null,t,i,e,n);break t}else if(s===gp){t.tag=14,t=n_(null,t,i,e,n);break t}}throw t=Ed(i)||i,Error($(306,t,""))}}return t;case 0:return Xd(e,t,t.type,t.pendingProps,n);case 1:return i=t.type,s=wa(i,t.pendingProps),a_(e,t,i,s,n);case 3:t:{if(kc(t,t.stateNode.containerInfo),e===null)throw Error($(387));var a=t.pendingProps;s=t.memoizedState,i=s.element,Qd(e,t),Fo(t,a,null,n);var r=t.memoizedState;if(a=r.cache,Ls(t,Ge,a),a!==s.cache&&Jd(t,[Ge],n,!0),Bo(),a=r.element,s.isDehydrated)if(s={element:a,isDehydrated:!1,cache:r.cache},t.updateQueue.baseState=s,t.memoizedState=s,t.flags&256){t=r_(e,t,a,n);break t}else if(a!==i){i=ei(Error($(424)),t),Zo(i),t=r_(e,t,a,n);break t}else for(an=gi(t.stateNode.containerInfo.firstChild),Sn=t,ne=!0,mi=null,wi=!0,n=wv(t,null,a,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(ll(),a===i){t=rs(e,t,n);break t}sn(e,t,a,n)}t=t.child}return t;case 26:return Po(e,t),e===null?(n=w_(t.type,null,t.pendingProps,null))?t.memoizedState=n:ne||(n=t.type,e=t.pendingProps,i=uu(Ps.current).createElement(n),i[un]=t,i[Cn]=e,rn(i,n,e),Je(i),t.stateNode=i):t.memoizedState=w_(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return wd(t),e===null&&ne&&(i=t.stateNode=nx(t.type,t.pendingProps,Ps.current),Sn=t,wi=!0,an=gi(i.firstChild)),i=t.pendingProps.children,e!==null||ne?sn(e,t,i,n):t.child=Ea(t,null,i,n),Po(e,t),t.child;case 5:return e===null&&ne&&((s=i=an)&&(i=K1(i,t.type,t.pendingProps,wi),i!==null?(t.stateNode=i,Sn=t,an=gi(i.firstChild),wi=!1,s=!0):s=!1),s||Ta(t)),wd(t),s=t.type,a=t.pendingProps,r=e!==null?e.memoizedProps:null,i=a.children,up(s,a)?i=null:r!==null&&up(s,r)&&(t.flags|=32),t.memoizedState!==null&&(s=Up(e,t,p1,null,null,n),tl._currentValue=s),Po(e,t),sn(e,t,i,n),t.child;case 6:return e===null&&ne&&((e=n=an)&&(n=J1(n,t.pendingProps,wi),n!==null?(t.stateNode=n,Sn=t,an=null,e=!0):e=!1),e||Ta(t)),null;case 13:return gy(e,t,n);case 4:return kc(t,t.stateNode.containerInfo),i=t.pendingProps,e===null?t.child=Ea(t,null,i,n):sn(e,t,i,n),t.child;case 11:return e_(e,t,t.type,t.pendingProps,n);case 7:return sn(e,t,t.pendingProps,n),t.child;case 8:return sn(e,t,t.pendingProps.children,n),t.child;case 12:return sn(e,t,t.pendingProps.children,n),t.child;case 10:return i=t.pendingProps,Ls(t,t.type,i.value),sn(e,t,i.children,n),t.child;case 9:return s=t.type._context,i=t.pendingProps.children,Ra(t),s=hn(s),i=i(s),t.flags|=1,sn(e,t,i,n),t.child;case 14:return n_(e,t,t.type,t.pendingProps,n);case 15:return py(e,t,t.type,t.pendingProps,n);case 19:return _y(e,t,n);case 22:return my(e,t,n);case 24:return Ra(t),i=hn(Ge),e===null?(s=Lp(),s===null&&(s=ve,a=Dp(),s.pooledCache=a,a.refCount++,a!==null&&(s.pooledCacheLanes|=n),s=a),t.memoizedState={parent:i,cache:s},Xp(t),Ls(t,Ge,s)):((e.lanes&n)!==0&&(Qd(e,t),Fo(t,null,null,n),Bo()),s=e.memoizedState,a=t.memoizedState,s.parent!==i?(s={parent:i,cache:i},t.memoizedState=s,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=s),Ls(t,Ge,i)):(i=a.cache,Ls(t,Ge,i),i!==s.cache&&Jd(t,[Ge],n,!0))),sn(e,t,t.pendingProps.children,n),t.child;case 29:throw t.pendingProps}throw Error($(156,t.tag))}var Zd=Ui(null),Oa=null,ns=null;function Ls(e,t,n){Te(Zd,t._currentValue),t._currentValue=n}function is(e){e._currentValue=Zd.current,je(Zd)}function Kd(e,t,n){for(;e!==null;){var i=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,i!==null&&(i.childLanes|=t)):i!==null&&(i.childLanes&t)!==t&&(i.childLanes|=t),e===n)break;e=e.return}}function Jd(e,t,n,i){var s=e.child;for(s!==null&&(s.return=e);s!==null;){var a=s.dependencies;if(a!==null){var r=s.child;a=a.firstContext;t:for(;a!==null;){var o=a;a=s;for(var l=0;l<t.length;l++)if(o.context===t[l]){a.lanes|=n,o=a.alternate,o!==null&&(o.lanes|=n),Kd(a.return,n,e),i||(r=null);break t}a=o.next}}else if(s.tag===18){if(r=s.return,r===null)throw Error($(341));r.lanes|=n,a=r.alternate,a!==null&&(a.lanes|=n),Kd(r,n,e),r=null}else r=s.child;if(r!==null)r.return=s;else for(r=s;r!==null;){if(r===e){r=null;break}if(s=r.sibling,s!==null){s.return=r.return,r=s;break}r=r.return}s=r}}function hl(e,t,n,i){e=null;for(var s=t,a=!1;s!==null;){if(!a){if((s.flags&524288)!==0)a=!0;else if((s.flags&262144)!==0)break}if(s.tag===10){var r=s.alternate;if(r===null)throw Error($(387));if(r=r.memoizedProps,r!==null){var o=s.type;Fn(s.pendingProps.value,r.value)||(e!==null?e.push(o):e=[o])}}else if(s===Vc.current){if(r=s.alternate,r===null)throw Error($(387));r.memoizedState.memoizedState!==s.memoizedState.memoizedState&&(e!==null?e.push(tl):e=[tl])}s=s.return}e!==null&&Jd(t,e,n,i),t.flags|=262144}function iu(e){for(e=e.firstContext;e!==null;){if(!Fn(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Ra(e){Oa=e,ns=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function hn(e){return yy(Oa,e)}function Mc(e,t){return Oa===null&&Ra(e),yy(e,t)}function yy(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},ns===null){if(e===null)throw Error($(308));ns=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else ns=ns.next=t;return n}var Rs=!1;function Xp(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Qd(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Is(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Bs(e,t,n){var i=e.updateQueue;if(i===null)return null;if(i=i.shared,(Re&2)!==0){var s=i.pending;return s===null?t.next=t:(t.next=s.next,s.next=t),i.pending=t,t=Zc(e),Mv(e,null,n),t}return Su(e,i,t,n),Zc(e)}function Io(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194176)!==0)){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,K_(e,n)}}function cd(e,t){var n=e.updateQueue,i=e.alternate;if(i!==null&&(i=i.updateQueue,n===i)){var s=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var r={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};a===null?s=a=r:a=a.next=r,n=n.next}while(n!==null);a===null?s=a=t:a=a.next=t}else s=a=t;n={baseState:i.baseState,firstBaseUpdate:s,lastBaseUpdate:a,shared:i.shared,callbacks:i.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var jd=!1;function Bo(){if(jd){var e=gr;if(e!==null)throw e}}function Fo(e,t,n,i){jd=!1;var s=e.updateQueue;Rs=!1;var a=s.firstBaseUpdate,r=s.lastBaseUpdate,o=s.shared.pending;if(o!==null){s.shared.pending=null;var l=o,c=l.next;l.next=null,r===null?a=c:r.next=c,r=l;var f=e.alternate;f!==null&&(f=f.updateQueue,o=f.lastBaseUpdate,o!==r&&(o===null?f.firstBaseUpdate=c:o.next=c,f.lastBaseUpdate=l))}if(a!==null){var p=s.baseState;r=0,f=c=l=null,o=a;do{var u=o.lane&-536870913,d=u!==o.lane;if(d?($t&u)===u:(i&u)===u){u!==0&&u===Tr&&(jd=!0),f!==null&&(f=f.next={lane:0,tag:o.tag,payload:o.payload,callback:null,next:null});t:{var v=e,T=o;u=t;var _=n;switch(T.tag){case 1:if(v=T.payload,typeof v=="function"){p=v.call(_,p,u);break t}p=v;break t;case 3:v.flags=v.flags&-65537|128;case 0:if(v=T.payload,u=typeof v=="function"?v.call(_,p,u):v,u==null)break t;p=xe({},p,u);break t;case 2:Rs=!0}}u=o.callback,u!==null&&(e.flags|=64,d&&(e.flags|=8192),d=s.callbacks,d===null?s.callbacks=[u]:d.push(u))}else d={lane:u,tag:o.tag,payload:o.payload,callback:o.callback,next:null},f===null?(c=f=d,l=p):f=f.next=d,r|=u;if(o=o.next,o===null){if(o=s.shared.pending,o===null)break;d=o,o=d.next,d.next=null,s.lastBaseUpdate=d,s.shared.pending=null}}while(!0);f===null&&(l=p),s.baseState=l,s.firstBaseUpdate=c,s.lastBaseUpdate=f,a===null&&(s.shared.lanes=0),qs|=r,e.lanes=r,e.memoizedState=p}}function xy(e,t){if(typeof e!="function")throw Error($(191,e));e.call(t)}function Sy(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)xy(n[e],t)}function fl(e,t){try{var n=t.updateQueue,i=n!==null?n.lastEffect:null;if(i!==null){var s=i.next;n=s;do{if((n.tag&e)===e){i=void 0;var a=n.create,r=n.inst;i=a(),r.destroy=i}n=n.next}while(n!==s)}}catch(o){de(t,t.return,o)}}function Xs(e,t,n){try{var i=t.updateQueue,s=i!==null?i.lastEffect:null;if(s!==null){var a=s.next;i=a;do{if((i.tag&e)===e){var r=i.inst,o=r.destroy;if(o!==void 0){r.destroy=void 0,s=t;var l=n;try{o()}catch(c){de(s,l,c)}}}i=i.next}while(i!==a)}}catch(c){de(t,t.return,c)}}function My(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{Sy(t,n)}catch(i){de(e,e.return,i)}}}function by(e,t,n){n.props=wa(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(i){de(e,t,i)}}function _a(e,t){try{var n=e.ref;if(n!==null){var i=e.stateNode;switch(e.tag){case 26:case 27:case 5:var s=i;break;default:s=i}typeof n=="function"?e.refCleanup=n(s):n.current=s}}catch(a){de(e,t,a)}}function On(e,t){var n=e.ref,i=e.refCleanup;if(n!==null)if(typeof i=="function")try{i()}catch(s){de(e,t,s)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n=="function")try{n(null)}catch(s){de(e,t,s)}else n.current=null}function Ty(e){var t=e.type,n=e.memoizedProps,i=e.stateNode;try{t:switch(t){case"button":case"input":case"select":case"textarea":n.autoFocus&&i.focus();break t;case"img":n.src?i.src=n.src:n.srcSet&&(i.srcset=n.srcSet)}}catch(s){de(e,e.return,s)}}function l_(e,t,n){try{var i=e.stateNode;W1(i,e.type,n,t),i[Cn]=t}catch(s){de(e,e.return,s)}}function Ey(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27||e.tag===4}function ud(e){t:for(;;){for(;e.sibling===null;){if(e.return===null||Ey(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==27&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue t;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function $d(e,t,n){var i=e.tag;if(i===5||i===6)e=e.stateNode,t?n.nodeType===8?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(n.nodeType===8?(t=n.parentNode,t.insertBefore(e,n)):(t=n,t.appendChild(e)),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=Ru));else if(i!==4&&i!==27&&(e=e.child,e!==null))for($d(e,t,n),e=e.sibling;e!==null;)$d(e,t,n),e=e.sibling}function su(e,t,n){var i=e.tag;if(i===5||i===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(i!==4&&i!==27&&(e=e.child,e!==null))for(su(e,t,n),e=e.sibling;e!==null;)su(e,t,n),e=e.sibling}var Ki=!1,Le=!1,hd=!1,c_=typeof WeakSet=="function"?WeakSet:Set,Ke=null,u_=!1;function M1(e,t){if(e=e.containerInfo,lp=pu,e=mv(e),Tp(e)){if("selectionStart"in e)var n={start:e.selectionStart,end:e.selectionEnd};else t:{n=(n=e.ownerDocument)&&n.defaultView||window;var i=n.getSelection&&n.getSelection();if(i&&i.rangeCount!==0){n=i.anchorNode;var s=i.anchorOffset,a=i.focusNode;i=i.focusOffset;try{n.nodeType,a.nodeType}catch{n=null;break t}var r=0,o=-1,l=-1,c=0,f=0,p=e,u=null;e:for(;;){for(var d;p!==n||s!==0&&p.nodeType!==3||(o=r+s),p!==a||i!==0&&p.nodeType!==3||(l=r+i),p.nodeType===3&&(r+=p.nodeValue.length),(d=p.firstChild)!==null;)u=p,p=d;for(;;){if(p===e)break e;if(u===n&&++c===s&&(o=r),u===a&&++f===i&&(l=r),(d=p.nextSibling)!==null)break;p=u,u=p.parentNode}p=d}n=o===-1||l===-1?null:{start:o,end:l}}else n=null}n=n||{start:0,end:0}}else n=null;for(cp={focusedElem:e,selectionRange:n},pu=!1,Ke=t;Ke!==null;)if(t=Ke,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,Ke=e;else for(;Ke!==null;){switch(t=Ke,a=t.alternate,e=t.flags,t.tag){case 0:break;case 11:case 15:break;case 1:if((e&1024)!==0&&a!==null){e=void 0,n=t,s=a.memoizedProps,a=a.memoizedState,i=n.stateNode;try{var v=wa(n.type,s,n.elementType===n.type);e=i.getSnapshotBeforeUpdate(v,a),i.__reactInternalSnapshotBeforeUpdate=e}catch(T){de(n,n.return,T)}}break;case 3:if((e&1024)!==0){if(e=t.stateNode.containerInfo,n=e.nodeType,n===9)hp(e);else if(n===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":hp(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((e&1024)!==0)throw Error($(163))}if(e=t.sibling,e!==null){e.return=t.return,Ke=e;break}Ke=t.return}return v=u_,u_=!1,v}function Ay(e,t,n){var i=n.flags;switch(n.tag){case 0:case 11:case 15:Yi(e,n),i&4&&fl(5,n);break;case 1:if(Yi(e,n),i&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(o){de(n,n.return,o)}else{var s=wa(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(s,t,e.__reactInternalSnapshotBeforeUpdate)}catch(o){de(n,n.return,o)}}i&64&&My(n),i&512&&_a(n,n.return);break;case 3:if(Yi(e,n),i&64&&(i=n.updateQueue,i!==null)){if(e=null,n.child!==null)switch(n.child.tag){case 27:case 5:e=n.child.stateNode;break;case 1:e=n.child.stateNode}try{Sy(i,e)}catch(o){de(n,n.return,o)}}break;case 26:Yi(e,n),i&512&&_a(n,n.return);break;case 27:case 5:Yi(e,n),t===null&&i&4&&Ty(n),i&512&&_a(n,n.return);break;case 12:Yi(e,n);break;case 13:Yi(e,n),i&4&&Cy(e,n);break;case 22:if(s=n.memoizedState!==null||Ki,!s){t=t!==null&&t.memoizedState!==null||Le;var a=Ki,r=Le;Ki=s,(Le=t)&&!r?As(e,n,(n.subtreeFlags&8772)!==0):Yi(e,n),Ki=a,Le=r}i&512&&(n.memoizedProps.mode==="manual"?_a(n,n.return):On(n,n.return));break;default:Yi(e,n)}}function wy(e){var t=e.alternate;t!==null&&(e.alternate=null,wy(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&vp(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var Be=null,Nn=!1;function qi(e,t,n){for(n=n.child;n!==null;)Ry(e,t,n),n=n.sibling}function Ry(e,t,n){if(Pn&&typeof Pn.onCommitFiberUnmount=="function")try{Pn.onCommitFiberUnmount(sl,n)}catch{}switch(n.tag){case 26:Le||On(n,t),qi(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:Le||On(n,t);var i=Be,s=Nn;for(Be=n.stateNode,qi(e,t,n),n=n.stateNode,t=n.attributes;t.length;)n.removeAttributeNode(t[0]);vp(n),Be=i,Nn=s;break;case 5:Le||On(n,t);case 6:s=Be;var a=Nn;if(Be=null,qi(e,t,n),Be=s,Nn=a,Be!==null)if(Nn)try{e=Be,i=n.stateNode,e.nodeType===8?e.parentNode.removeChild(i):e.removeChild(i)}catch(r){de(n,t,r)}else try{Be.removeChild(n.stateNode)}catch(r){de(n,t,r)}break;case 18:Be!==null&&(Nn?(t=Be,n=n.stateNode,t.nodeType===8?Sd(t.parentNode,n):t.nodeType===1&&Sd(t,n),il(t)):Sd(Be,n.stateNode));break;case 4:i=Be,s=Nn,Be=n.stateNode.containerInfo,Nn=!0,qi(e,t,n),Be=i,Nn=s;break;case 0:case 11:case 14:case 15:Le||Xs(2,n,t),Le||Xs(4,n,t),qi(e,t,n);break;case 1:Le||(On(n,t),i=n.stateNode,typeof i.componentWillUnmount=="function"&&by(n,t,i)),qi(e,t,n);break;case 21:qi(e,t,n);break;case 22:Le||On(n,t),Le=(i=Le)||n.memoizedState!==null,qi(e,t,n),Le=i;break;default:qi(e,t,n)}}function Cy(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{il(e)}catch(n){de(t,t.return,n)}}function b1(e){switch(e.tag){case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new c_),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new c_),t;default:throw Error($(435,e.tag))}}function fd(e,t){var n=b1(e);t.forEach(function(i){var s=I1.bind(null,e,i);n.has(i)||(n.add(i),i.then(s,s))})}function Zn(e,t){var n=t.deletions;if(n!==null)for(var i=0;i<n.length;i++){var s=n[i],a=e,r=t,o=r;t:for(;o!==null;){switch(o.tag){case 27:case 5:Be=o.stateNode,Nn=!1;break t;case 3:Be=o.stateNode.containerInfo,Nn=!0;break t;case 4:Be=o.stateNode.containerInfo,Nn=!0;break t}o=o.return}if(Be===null)throw Error($(160));Ry(a,r,s),Be=null,Nn=!1,a=s.alternate,a!==null&&(a.return=null),s.return=null}if(t.subtreeFlags&13878)for(t=t.child;t!==null;)Dy(t,e),t=t.sibling}var pi=null;function Dy(e,t){var n=e.alternate,i=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:Zn(t,e),Kn(e),i&4&&(Xs(3,e,e.return),fl(3,e),Xs(5,e,e.return));break;case 1:Zn(t,e),Kn(e),i&512&&(Le||n===null||On(n,n.return)),i&64&&Ki&&(e=e.updateQueue,e!==null&&(i=e.callbacks,i!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?i:n.concat(i))));break;case 26:var s=pi;if(Zn(t,e),Kn(e),i&512&&(Le||n===null||On(n,n.return)),i&4){var a=n!==null?n.memoizedState:null;if(i=e.memoizedState,n===null)if(i===null)if(e.stateNode===null){t:{i=e.type,n=e.memoizedProps,s=s.ownerDocument||s;e:switch(i){case"title":a=s.getElementsByTagName("title")[0],(!a||a[Wo]||a[un]||a.namespaceURI==="http://www.w3.org/2000/svg"||a.hasAttribute("itemprop"))&&(a=s.createElement(i),s.head.insertBefore(a,s.querySelector("head > title"))),rn(a,i,n),a[un]=e,Je(a),i=a;break t;case"link":var r=C_("link","href",s).get(i+(n.href||""));if(r){for(var o=0;o<r.length;o++)if(a=r[o],a.getAttribute("href")===(n.href==null?null:n.href)&&a.getAttribute("rel")===(n.rel==null?null:n.rel)&&a.getAttribute("title")===(n.title==null?null:n.title)&&a.getAttribute("crossorigin")===(n.crossOrigin==null?null:n.crossOrigin)){r.splice(o,1);break e}}a=s.createElement(i),rn(a,i,n),s.head.appendChild(a);break;case"meta":if(r=C_("meta","content",s).get(i+(n.content||""))){for(o=0;o<r.length;o++)if(a=r[o],a.getAttribute("content")===(n.content==null?null:""+n.content)&&a.getAttribute("name")===(n.name==null?null:n.name)&&a.getAttribute("property")===(n.property==null?null:n.property)&&a.getAttribute("http-equiv")===(n.httpEquiv==null?null:n.httpEquiv)&&a.getAttribute("charset")===(n.charSet==null?null:n.charSet)){r.splice(o,1);break e}}a=s.createElement(i),rn(a,i,n),s.head.appendChild(a);break;default:throw Error($(468,i))}a[un]=e,Je(a),i=a}e.stateNode=i}else D_(s,e.type,e.stateNode);else e.stateNode=R_(s,i,e.memoizedProps);else a!==i?(a===null?n.stateNode!==null&&(n=n.stateNode,n.parentNode.removeChild(n)):a.count--,i===null?D_(s,e.type,e.stateNode):R_(s,i,e.memoizedProps)):i===null&&e.stateNode!==null&&l_(e,e.memoizedProps,n.memoizedProps)}break;case 27:if(i&4&&e.alternate===null){s=e.stateNode,a=e.memoizedProps;try{for(var l=s.firstChild;l;){var c=l.nextSibling,f=l.nodeName;l[Wo]||f==="HEAD"||f==="BODY"||f==="SCRIPT"||f==="STYLE"||f==="LINK"&&l.rel.toLowerCase()==="stylesheet"||s.removeChild(l),l=c}for(var p=e.type,u=s.attributes;u.length;)s.removeAttributeNode(u[0]);rn(s,p,a),s[un]=e,s[Cn]=a}catch(v){de(e,e.return,v)}}case 5:if(Zn(t,e),Kn(e),i&512&&(Le||n===null||On(n,n.return)),e.flags&32){s=e.stateNode;try{Mr(s,"")}catch(v){de(e,e.return,v)}}i&4&&e.stateNode!=null&&(s=e.memoizedProps,l_(e,s,n!==null?n.memoizedProps:s)),i&1024&&(hd=!0);break;case 6:if(Zn(t,e),Kn(e),i&4){if(e.stateNode===null)throw Error($(162));i=e.memoizedProps,n=e.stateNode;try{n.nodeValue=i}catch(v){de(e,e.return,v)}}break;case 3:if(Hc=null,s=pi,pi=hu(t.containerInfo),Zn(t,e),pi=s,Kn(e),i&4&&n!==null&&n.memoizedState.isDehydrated)try{il(t.containerInfo)}catch(v){de(e,e.return,v)}hd&&(hd=!1,Ly(e));break;case 4:i=pi,pi=hu(e.stateNode.containerInfo),Zn(t,e),Kn(e),pi=i;break;case 12:Zn(t,e),Kn(e);break;case 13:Zn(t,e),Kn(e),e.child.flags&8192&&e.memoizedState!==null!=(n!==null&&n.memoizedState!==null)&&(Qp=Di()),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,fd(e,i)));break;case 22:if(i&512&&(Le||n===null||On(n,n.return)),l=e.memoizedState!==null,c=n!==null&&n.memoizedState!==null,f=Ki,p=Le,Ki=f||l,Le=p||c,Zn(t,e),Le=p,Ki=f,Kn(e),t=e.stateNode,t._current=e,t._visibility&=-3,t._visibility|=t._pendingVisibility&2,i&8192&&(t._visibility=l?t._visibility&-2:t._visibility|1,l&&(t=Ki||Le,n===null||c||t||ja(e)),e.memoizedProps===null||e.memoizedProps.mode!=="manual"))t:for(n=null,t=e;;){if(t.tag===5||t.tag===26||t.tag===27){if(n===null){c=n=t;try{if(s=c.stateNode,l)a=s.style,typeof a.setProperty=="function"?a.setProperty("display","none","important"):a.display="none";else{r=c.stateNode,o=c.memoizedProps.style;var d=o!=null&&o.hasOwnProperty("display")?o.display:null;r.style.display=d==null||typeof d=="boolean"?"":(""+d).trim()}}catch(v){de(c,c.return,v)}}}else if(t.tag===6){if(n===null){c=t;try{c.stateNode.nodeValue=l?"":c.memoizedProps}catch(v){de(c,c.return,v)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break t;for(;t.sibling===null;){if(t.return===null||t.return===e)break t;n===t&&(n=null),t=t.return}n===t&&(n=null),t.sibling.return=t.return,t=t.sibling}i&4&&(i=e.updateQueue,i!==null&&(n=i.retryQueue,n!==null&&(i.retryQueue=null,fd(e,n))));break;case 19:Zn(t,e),Kn(e),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,fd(e,i)));break;case 21:break;default:Zn(t,e),Kn(e)}}function Kn(e){var t=e.flags;if(t&2){try{if(e.tag!==27){t:{for(var n=e.return;n!==null;){if(Ey(n)){var i=n;break t}n=n.return}throw Error($(160))}switch(i.tag){case 27:var s=i.stateNode,a=ud(e);su(e,a,s);break;case 5:var r=i.stateNode;i.flags&32&&(Mr(r,""),i.flags&=-33);var o=ud(e);su(e,o,r);break;case 3:case 4:var l=i.stateNode.containerInfo,c=ud(e);$d(e,c,l);break;default:throw Error($(161))}}}catch(f){de(e,e.return,f)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Ly(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Ly(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function Yi(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)Ay(e,t.alternate,t),t=t.sibling}function ja(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:Xs(4,t,t.return),ja(t);break;case 1:On(t,t.return);var n=t.stateNode;typeof n.componentWillUnmount=="function"&&by(t,t.return,n),ja(t);break;case 26:case 27:case 5:On(t,t.return),ja(t);break;case 22:On(t,t.return),t.memoizedState===null&&ja(t);break;default:ja(t)}e=e.sibling}}function As(e,t,n){for(n=n&&(t.subtreeFlags&8772)!==0,t=t.child;t!==null;){var i=t.alternate,s=e,a=t,r=a.flags;switch(a.tag){case 0:case 11:case 15:As(s,a,n),fl(4,a);break;case 1:if(As(s,a,n),i=a,s=i.stateNode,typeof s.componentDidMount=="function")try{s.componentDidMount()}catch(c){de(i,i.return,c)}if(i=a,s=i.updateQueue,s!==null){var o=i.stateNode;try{var l=s.shared.hiddenCallbacks;if(l!==null)for(s.shared.hiddenCallbacks=null,s=0;s<l.length;s++)xy(l[s],o)}catch(c){de(i,i.return,c)}}n&&r&64&&My(a),_a(a,a.return);break;case 26:case 27:case 5:As(s,a,n),n&&i===null&&r&4&&Ty(a),_a(a,a.return);break;case 12:As(s,a,n);break;case 13:As(s,a,n),n&&r&4&&Cy(s,a);break;case 22:a.memoizedState===null&&As(s,a,n),_a(a,a.return);break;default:As(s,a,n)}t=t.sibling}}function qp(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&cl(n))}function Yp(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&cl(e))}function Es(e,t,n,i){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)Ny(e,t,n,i),t=t.sibling}function Ny(e,t,n,i){var s=t.flags;switch(t.tag){case 0:case 11:case 15:Es(e,t,n,i),s&2048&&fl(9,t);break;case 3:Es(e,t,n,i),s&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&cl(e)));break;case 12:if(s&2048){Es(e,t,n,i),e=t.stateNode;try{var a=t.memoizedProps,r=a.id,o=a.onPostCommit;typeof o=="function"&&o(r,t.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(l){de(t,t.return,l)}}else Es(e,t,n,i);break;case 23:break;case 22:a=t.stateNode,t.memoizedState!==null?a._visibility&4?Es(e,t,n,i):zo(e,t):a._visibility&4?Es(e,t,n,i):(a._visibility|=4,$a(e,t,n,i,(t.subtreeFlags&10256)!==0)),s&2048&&qp(t.alternate,t);break;case 24:Es(e,t,n,i),s&2048&&Yp(t.alternate,t);break;default:Es(e,t,n,i)}}function $a(e,t,n,i,s){for(s=s&&(t.subtreeFlags&10256)!==0,t=t.child;t!==null;){var a=e,r=t,o=n,l=i,c=r.flags;switch(r.tag){case 0:case 11:case 15:$a(a,r,o,l,s),fl(8,r);break;case 23:break;case 22:var f=r.stateNode;r.memoizedState!==null?f._visibility&4?$a(a,r,o,l,s):zo(a,r):(f._visibility|=4,$a(a,r,o,l,s)),s&&c&2048&&qp(r.alternate,r);break;case 24:$a(a,r,o,l,s),s&&c&2048&&Yp(r.alternate,r);break;default:$a(a,r,o,l,s)}t=t.sibling}}function zo(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,i=t,s=i.flags;switch(i.tag){case 22:zo(n,i),s&2048&&qp(i.alternate,i);break;case 24:zo(n,i),s&2048&&Yp(i.alternate,i);break;default:zo(n,i)}t=t.sibling}}var wo=8192;function Ja(e){if(e.subtreeFlags&wo)for(e=e.child;e!==null;)Uy(e),e=e.sibling}function Uy(e){switch(e.tag){case 26:Ja(e),e.flags&wo&&e.memoizedState!==null&&cT(pi,e.memoizedState,e.memoizedProps);break;case 5:Ja(e);break;case 3:case 4:var t=pi;pi=hu(e.stateNode.containerInfo),Ja(e),pi=t;break;case 22:e.memoizedState===null&&(t=e.alternate,t!==null&&t.memoizedState!==null?(t=wo,wo=16777216,Ja(e),wo=t):Ja(e));break;default:Ja(e)}}function Oy(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function yo(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];Ke=i,Iy(i,e)}Oy(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Py(e),e=e.sibling}function Py(e){switch(e.tag){case 0:case 11:case 15:yo(e),e.flags&2048&&Xs(9,e,e.return);break;case 3:yo(e);break;case 12:yo(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&4&&(e.return===null||e.return.tag!==13)?(t._visibility&=-5,Bc(e)):yo(e);break;default:yo(e)}}function Bc(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];Ke=i,Iy(i,e)}Oy(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Xs(8,t,t.return),Bc(t);break;case 22:n=t.stateNode,n._visibility&4&&(n._visibility&=-5,Bc(t));break;default:Bc(t)}e=e.sibling}}function Iy(e,t){for(;Ke!==null;){var n=Ke;switch(n.tag){case 0:case 11:case 15:Xs(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var i=n.memoizedState.cachePool.pool;i!=null&&i.refCount++}break;case 24:cl(n.memoizedState.cache)}if(i=n.child,i!==null)i.return=n,Ke=i;else t:for(n=e;Ke!==null;){i=Ke;var s=i.sibling,a=i.return;if(wy(i),i===n){Ke=null;break t}if(s!==null){s.return=a,Ke=s;break t}Ke=a}}}function T1(e,t,n,i){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function ni(e,t,n,i){return new T1(e,t,n,i)}function Zp(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Fs(e,t){var n=e.alternate;return n===null?(n=ni(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&31457280,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function By(e,t){e.flags&=31457282;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function Fc(e,t,n,i,s,a){var r=0;if(i=e,typeof e=="function")Zp(e)&&(r=1);else if(typeof e=="string")r=oT(e,n,Ci.current)?26:e==="html"||e==="head"||e==="body"?27:5;else t:switch(e){case er:return Sa(n.children,s,a,t);case F_:r=8,s|=24;break;case Md:return e=ni(12,n,t,s|2),e.elementType=Md,e.lanes=a,e;case bd:return e=ni(13,n,t,s),e.elementType=bd,e.lanes=a,e;case Td:return e=ni(19,n,t,s),e.elementType=Td,e.lanes=a,e;case H_:return Fy(n,s,a,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case KM:case ji:r=10;break t;case z_:r=9;break t;case mp:r=11;break t;case gp:r=14;break t;case ws:r=16,i=null;break t}r=29,n=Error($(130,e===null?"null":typeof e,"")),i=null}return t=ni(r,n,t,s),t.elementType=e,t.type=i,t.lanes=a,t}function Sa(e,t,n,i){return e=ni(7,e,i,t),e.lanes=n,e}function Fy(e,t,n,i){e=ni(22,e,i,t),e.elementType=H_,e.lanes=n;var s={_visibility:1,_pendingVisibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null,_current:null,detach:function(){var a=s._current;if(a===null)throw Error($(456));if((s._pendingVisibility&2)===0){var r=ks(a,2);r!==null&&(s._pendingVisibility|=2,Mn(r,a,2))}},attach:function(){var a=s._current;if(a===null)throw Error($(456));if((s._pendingVisibility&2)!==0){var r=ks(a,2);r!==null&&(s._pendingVisibility&=-3,Mn(r,a,2))}}};return e.stateNode=s,e}function dd(e,t,n){return e=ni(6,e,null,t),e.lanes=n,e}function pd(e,t,n){return t=ni(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function Zi(e){e.flags|=4}function h_(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!ax(t)){if(t=si.current,t!==null&&(($t&4194176)===$t?Li!==null:($t&62914560)!==$t&&($t&536870912)===0||t!==Li))throw No=Bd,Tv;e.flags|=8192}}function bc(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?Y_():536870912,e.lanes|=t,Ar|=t)}function xo(e,t){if(!ne)switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var i=null;n!==null;)n.alternate!==null&&(i=n),n=n.sibling;i===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:i.sibling=null}}function we(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,i=0;if(t)for(var s=e.child;s!==null;)n|=s.lanes|s.childLanes,i|=s.subtreeFlags&31457280,i|=s.flags&31457280,s.return=e,s=s.sibling;else for(s=e.child;s!==null;)n|=s.lanes|s.childLanes,i|=s.subtreeFlags,i|=s.flags,s.return=e,s=s.sibling;return e.subtreeFlags|=i,e.childLanes=n,t}function E1(e,t,n){var i=t.pendingProps;switch(Rp(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return we(t),null;case 1:return we(t),null;case 3:return n=t.stateNode,i=null,e!==null&&(i=e.memoizedState.cache),t.memoizedState.cache!==i&&(t.flags|=2048),is(Ge),xr(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(_o(t)?Zi(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,mi!==null&&(sp(mi),mi=null))),we(t),null;case 26:return n=t.memoizedState,e===null?(Zi(t),n!==null?(we(t),h_(t,n)):(we(t),t.flags&=-16777217)):n?n!==e.memoizedState?(Zi(t),we(t),h_(t,n)):(we(t),t.flags&=-16777217):(e.memoizedProps!==i&&Zi(t),we(t),t.flags&=-16777217),null;case 27:Wc(t),n=Ps.current;var s=t.type;if(e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Zi(t);else{if(!i){if(t.stateNode===null)throw Error($(166));return we(t),null}e=Ci.current,_o(t)?G0(t,e):(e=nx(s,i,n),t.stateNode=e,Zi(t))}return we(t),null;case 5:if(Wc(t),n=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Zi(t);else{if(!i){if(t.stateNode===null)throw Error($(166));return we(t),null}if(e=Ci.current,_o(t))G0(t,e);else{switch(s=uu(Ps.current),e){case 1:e=s.createElementNS("http://www.w3.org/2000/svg",n);break;case 2:e=s.createElementNS("http://www.w3.org/1998/Math/MathML",n);break;default:switch(n){case"svg":e=s.createElementNS("http://www.w3.org/2000/svg",n);break;case"math":e=s.createElementNS("http://www.w3.org/1998/Math/MathML",n);break;case"script":e=s.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild);break;case"select":e=typeof i.is=="string"?s.createElement("select",{is:i.is}):s.createElement("select"),i.multiple?e.multiple=!0:i.size&&(e.size=i.size);break;default:e=typeof i.is=="string"?s.createElement(n,{is:i.is}):s.createElement(n)}}e[un]=t,e[Cn]=i;t:for(s=t.child;s!==null;){if(s.tag===5||s.tag===6)e.appendChild(s.stateNode);else if(s.tag!==4&&s.tag!==27&&s.child!==null){s.child.return=s,s=s.child;continue}if(s===t)break t;for(;s.sibling===null;){if(s.return===null||s.return===t)break t;s=s.return}s.sibling.return=s.return,s=s.sibling}t.stateNode=e;t:switch(rn(e,n,i),n){case"button":case"input":case"select":case"textarea":e=!!i.autoFocus;break t;case"img":e=!0;break t;default:e=!1}e&&Zi(t)}}return we(t),t.flags&=-16777217,null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==i&&Zi(t);else{if(typeof i!="string"&&t.stateNode===null)throw Error($(166));if(e=Ps.current,_o(t)){if(e=t.stateNode,n=t.memoizedProps,i=null,s=Sn,s!==null)switch(s.tag){case 27:case 5:i=s.memoizedProps}e[un]=t,e=!!(e.nodeValue===n||i!==null&&i.suppressHydrationWarning===!0||$y(e.nodeValue,n)),e||Ta(t)}else e=uu(e).createTextNode(i),e[un]=t,t.stateNode=e}return we(t),null;case 13:if(i=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(s=_o(t),i!==null&&i.dehydrated!==null){if(e===null){if(!s)throw Error($(318));if(s=t.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error($(317));s[un]=t}else ll(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;we(t),s=!1}else mi!==null&&(sp(mi),mi=null),s=!0;if(!s)return t.flags&256?(es(t),t):(es(t),null)}if(es(t),(t.flags&128)!==0)return t.lanes=n,t;if(n=i!==null,e=e!==null&&e.memoizedState!==null,n){i=t.child,s=null,i.alternate!==null&&i.alternate.memoizedState!==null&&i.alternate.memoizedState.cachePool!==null&&(s=i.alternate.memoizedState.cachePool.pool);var a=null;i.memoizedState!==null&&i.memoizedState.cachePool!==null&&(a=i.memoizedState.cachePool.pool),a!==s&&(i.flags|=2048)}return n!==e&&n&&(t.child.flags|=8192),bc(t,t.updateQueue),we(t),null;case 4:return xr(),e===null&&tm(t.stateNode.containerInfo),we(t),null;case 10:return is(t.type),we(t),null;case 19:if(je(Ve),s=t.memoizedState,s===null)return we(t),null;if(i=(t.flags&128)!==0,a=s.rendering,a===null)if(i)xo(s,!1);else{if(Ne!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(a=jc(e),a!==null){for(t.flags|=128,xo(s,!1),e=a.updateQueue,t.updateQueue=e,bc(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)By(n,e),n=n.sibling;return Te(Ve,Ve.current&1|2),t.child}e=e.sibling}s.tail!==null&&Di()>au&&(t.flags|=128,i=!0,xo(s,!1),t.lanes=4194304)}else{if(!i)if(e=jc(a),e!==null){if(t.flags|=128,i=!0,e=e.updateQueue,t.updateQueue=e,bc(t,e),xo(s,!0),s.tail===null&&s.tailMode==="hidden"&&!a.alternate&&!ne)return we(t),null}else 2*Di()-s.renderingStartTime>au&&n!==536870912&&(t.flags|=128,i=!0,xo(s,!1),t.lanes=4194304);s.isBackwards?(a.sibling=t.child,t.child=a):(e=s.last,e!==null?e.sibling=a:t.child=a,s.last=a)}return s.tail!==null?(t=s.tail,s.rendering=t,s.tail=t.sibling,s.renderingStartTime=Di(),t.sibling=null,e=Ve.current,Te(Ve,i?e&1|2:e&1),t):(we(t),null);case 22:case 23:return es(t),Cp(),i=t.memoizedState!==null,e!==null?e.memoizedState!==null!==i&&(t.flags|=8192):i&&(t.flags|=8192),i?(n&536870912)!==0&&(t.flags&128)===0&&(we(t),t.subtreeFlags&6&&(t.flags|=8192)):we(t),n=t.updateQueue,n!==null&&bc(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),i=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(i=t.memoizedState.cachePool.pool),i!==n&&(t.flags|=2048),e!==null&&je(xa),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),is(Ge),we(t),null;case 25:return null}throw Error($(156,t.tag))}function A1(e,t){switch(Rp(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return is(Ge),xr(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Wc(t),null;case 13:if(es(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error($(340));ll()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return je(Ve),null;case 4:return xr(),null;case 10:return is(t.type),null;case 22:case 23:return es(t),Cp(),e!==null&&je(xa),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return is(Ge),null;case 25:return null;default:return null}}function zy(e,t){switch(Rp(t),t.tag){case 3:is(Ge),xr();break;case 26:case 27:case 5:Wc(t);break;case 4:xr();break;case 13:es(t);break;case 19:je(Ve);break;case 10:is(t.type);break;case 22:case 23:es(t),Cp(),e!==null&&je(xa);break;case 24:is(Ge)}}var w1={getCacheForType:function(e){var t=hn(Ge),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n}},R1=typeof WeakMap=="function"?WeakMap:Map,Re=0,ve=null,qt=null,$t=0,_e=0,Un=null,Ji=!1,Nr=!1,Kp=!1,os=0,Ne=0,qs=0,Ma=0,Jp=0,ii=0,Ar=0,Ho=null,Ri=null,tp=!1,Qp=0,au=1/0,ru=null,zs=null,Tc=!1,ma=null,Go=0,ep=0,np=null,Vo=0,ip=null;function Bn(){if((Re&2)!==0&&$t!==0)return $t&-$t;if(Ft.T!==null){var e=Tr;return e!==0?e:$p()}return Q_()}function Hy(){ii===0&&(ii=($t&536870912)===0||ne?q_():536870912);var e=si.current;return e!==null&&(e.flags|=32),ii}function Mn(e,t,n){(e===ve&&_e===2||e.cancelPendingCommit!==null)&&(wr(e,0),Qi(e,$t,ii,!1)),rl(e,n),((Re&2)===0||e!==ve)&&(e===ve&&((Re&2)===0&&(Ma|=n),Ne===4&&Qi(e,$t,ii,!1)),Oi(e))}function Gy(e,t,n){if((Re&6)!==0)throw Error($(327));var i=!n&&(t&60)===0&&(t&e.expiredLanes)===0||al(e,t),s=i?L1(e,t):md(e,t,!0),a=i;do{if(s===0){Nr&&!i&&Qi(e,t,0,!1);break}else if(s===6)Qi(e,t,0,!Ji);else{if(n=e.current.alternate,a&&!C1(n)){s=md(e,t,!1),a=!1;continue}if(s===2){if(a=t,e.errorRecoveryDisabledLanes&a)var r=0;else r=e.pendingLanes&-536870913,r=r!==0?r:r&536870912?536870912:0;if(r!==0){t=r;t:{var o=e;s=Ho;var l=o.current.memoizedState.isDehydrated;if(l&&(wr(o,r).flags|=256),r=md(o,r,!1),r!==2){if(Kp&&!l){o.errorRecoveryDisabledLanes|=a,Ma|=a,s=4;break t}a=Ri,Ri=s,a!==null&&sp(a)}s=r}if(a=!1,s!==2)continue}}if(s===1){wr(e,0),Qi(e,t,0,!0);break}t:{switch(i=e,s){case 0:case 1:throw Error($(345));case 4:if((t&4194176)===t){Qi(i,t,ii,!Ji);break t}break;case 2:Ri=null;break;case 3:case 5:break;default:throw Error($(329))}if(i.finishedWork=n,i.finishedLanes=t,(t&62914560)===t&&(a=Qp+300-Di(),10<a)){if(Qi(i,t,ii,!Ji),gu(i,0)!==0)break t;i.timeoutHandle=ex(f_.bind(null,i,n,Ri,ru,tp,t,ii,Ma,Ar,Ji,2,-0,0),a);break t}f_(i,n,Ri,ru,tp,t,ii,Ma,Ar,Ji,0,-0,0)}}break}while(!0);Oi(e)}function sp(e){Ri===null?Ri=e:Ri.push.apply(Ri,e)}function f_(e,t,n,i,s,a,r,o,l,c,f,p,u){var d=t.subtreeFlags;if((d&8192||(d&16785408)===16785408)&&($o={stylesheets:null,count:0,unsuspend:lT},Uy(t),t=uT(),t!==null)){e.cancelPendingCommit=t(p_.bind(null,e,n,i,s,r,o,l,1,p,u)),Qi(e,a,r,!c);return}p_(e,n,i,s,r,o,l,f,p,u)}function C1(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var i=0;i<n.length;i++){var s=n[i],a=s.getSnapshot;s=s.value;try{if(!Fn(a(),s))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Qi(e,t,n,i){t&=~Jp,t&=~Ma,e.suspendedLanes|=t,e.pingedLanes&=~t,i&&(e.warmLanes|=t),i=e.expirationTimes;for(var s=t;0<s;){var a=31-In(s),r=1<<a;i[a]=-1,s&=~r}n!==0&&Z_(e,n,t)}function Au(){return(Re&6)===0?(dl(0,!1),!1):!0}function jp(){if(qt!==null){if(_e===0)var e=qt.return;else e=qt,ns=Oa=null,Ip(e),mr=null,Ko=0,e=qt;for(;e!==null;)zy(e.alternate,e),e=e.return;qt=null}}function wr(e,t){e.finishedWork=null,e.finishedLanes=0;var n=e.timeoutHandle;n!==-1&&(e.timeoutHandle=-1,q1(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),jp(),ve=e,qt=n=Fs(e.current,null),$t=t,_e=0,Un=null,Ji=!1,Nr=al(e,t),Kp=!1,Ar=ii=Jp=Ma=qs=Ne=0,Ri=Ho=null,tp=!1,(t&8)!==0&&(t|=t&32);var i=e.entangledLanes;if(i!==0)for(e=e.entanglements,i&=t;0<i;){var s=31-In(i),a=1<<s;t|=e[s],i&=~a}return os=t,xu(),n}function Vy(e,t){Wt=null,Ft.H=Ni,t===Lo?(t=W0(),_e=3):t===Tv?(t=W0(),_e=4):_e=t===dy?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,Un=t,qt===null&&(Ne=1,nu(e,ei(t,e.current)))}function ky(){var e=Ft.H;return Ft.H=Ni,e===null?Ni:e}function Wy(){var e=Ft.A;return Ft.A=w1,e}function ap(){Ne=4,Ji||($t&4194176)!==$t&&si.current!==null||(Nr=!0),(qs&134217727)===0&&(Ma&134217727)===0||ve===null||Qi(ve,$t,ii,!1)}function md(e,t,n){var i=Re;Re|=2;var s=ky(),a=Wy();(ve!==e||$t!==t)&&(ru=null,wr(e,t)),t=!1;var r=Ne;t:do try{if(_e!==0&&qt!==null){var o=qt,l=Un;switch(_e){case 8:jp(),r=6;break t;case 3:case 2:case 6:si.current===null&&(t=!0);var c=_e;if(_e=0,Un=null,hr(e,o,l,c),n&&Nr){r=0;break t}break;default:c=_e,_e=0,Un=null,hr(e,o,l,c)}}D1(),r=Ne;break}catch(f){Vy(e,f)}while(!0);return t&&e.shellSuspendCounter++,ns=Oa=null,Re=i,Ft.H=s,Ft.A=a,qt===null&&(ve=null,$t=0,xu()),r}function D1(){for(;qt!==null;)Xy(qt)}function L1(e,t){var n=Re;Re|=2;var i=ky(),s=Wy();ve!==e||$t!==t?(ru=null,au=Di()+500,wr(e,t)):Nr=al(e,t);t:do try{if(_e!==0&&qt!==null){t=qt;var a=Un;e:switch(_e){case 1:_e=0,Un=null,hr(e,t,a,1);break;case 2:if(k0(a)){_e=0,Un=null,d_(t);break}t=function(){_e===2&&ve===e&&(_e=7),Oi(e)},a.then(t,t);break t;case 3:_e=7;break t;case 4:_e=5;break t;case 7:k0(a)?(_e=0,Un=null,d_(t)):(_e=0,Un=null,hr(e,t,a,7));break;case 5:var r=null;switch(qt.tag){case 26:r=qt.memoizedState;case 5:case 27:var o=qt;if(!r||ax(r)){_e=0,Un=null;var l=o.sibling;if(l!==null)qt=l;else{var c=o.return;c!==null?(qt=c,wu(c)):qt=null}break e}}_e=0,Un=null,hr(e,t,a,5);break;case 6:_e=0,Un=null,hr(e,t,a,6);break;case 8:jp(),Ne=6;break t;default:throw Error($(462))}}N1();break}catch(f){Vy(e,f)}while(!0);return ns=Oa=null,Ft.H=i,Ft.A=s,Re=n,qt!==null?0:(ve=null,$t=0,xu(),Ne)}function N1(){for(;qt!==null&&!tb();)Xy(qt)}function Xy(e){var t=vy(e.alternate,e,os);e.memoizedProps=e.pendingProps,t===null?wu(e):qt=t}function d_(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=s_(n,t,t.pendingProps,t.type,void 0,$t);break;case 11:t=s_(n,t,t.pendingProps,t.type.render,t.ref,$t);break;case 5:Ip(t);default:zy(n,t),t=qt=By(t,os),t=vy(n,t,os)}e.memoizedProps=e.pendingProps,t===null?wu(e):qt=t}function hr(e,t,n,i){ns=Oa=null,Ip(t),mr=null,Ko=0;var s=t.return;try{if(x1(e,s,t,n,$t)){Ne=1,nu(e,ei(n,e.current)),qt=null;return}}catch(a){if(s!==null)throw qt=s,a;Ne=1,nu(e,ei(n,e.current)),qt=null;return}t.flags&32768?(ne||i===1?e=!0:Nr||($t&536870912)!==0?e=!1:(Ji=e=!0,(i===2||i===3||i===6)&&(i=si.current,i!==null&&i.tag===13&&(i.flags|=16384))),qy(t,e)):wu(t)}function wu(e){var t=e;do{if((t.flags&32768)!==0){qy(t,Ji);return}e=t.return;var n=E1(t.alternate,t,os);if(n!==null){qt=n;return}if(t=t.sibling,t!==null){qt=t;return}qt=t=e}while(t!==null);Ne===0&&(Ne=5)}function qy(e,t){do{var n=A1(e.alternate,e);if(n!==null){n.flags&=32767,qt=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){qt=e;return}qt=e=n}while(e!==null);Ne=6,qt=null}function p_(e,t,n,i,s,a,r,o,l,c){var f=Ft.T,p=ye.p;try{ye.p=2,Ft.T=null,U1(e,t,n,i,p,s,a,r,o,l,c)}finally{Ft.T=f,ye.p=p}}function U1(e,t,n,i,s,a,r,o){do yr();while(ma!==null);if((Re&6)!==0)throw Error($(327));var l=e.finishedWork;if(i=e.finishedLanes,l===null)return null;if(e.finishedWork=null,e.finishedLanes=0,l===e.current)throw Error($(177));e.callbackNode=null,e.callbackPriority=0,e.cancelPendingCommit=null;var c=l.lanes|l.childLanes;if(c|=Ep,hb(e,i,c,a,r,o),e===ve&&(qt=ve=null,$t=0),(l.subtreeFlags&10256)===0&&(l.flags&10256)===0||Tc||(Tc=!0,ep=c,np=n,B1(Xc,function(){return yr(!0),null})),n=(l.flags&15990)!==0,(l.subtreeFlags&15990)!==0||n?(n=Ft.T,Ft.T=null,a=ye.p,ye.p=2,r=Re,Re|=4,M1(e,l),Dy(l,e),i1(cp,e.containerInfo),pu=!!lp,cp=lp=null,e.current=l,Ay(e,l.alternate,l),eb(),Re=r,ye.p=a,Ft.T=n):e.current=l,Tc?(Tc=!1,ma=e,Go=i):Yy(e,c),c=e.pendingLanes,c===0&&(zs=null),rb(l.stateNode,s),Oi(e),t!==null)for(s=e.onRecoverableError,l=0;l<t.length;l++)c=t[l],s(c.value,{componentStack:c.stack});return(Go&3)!==0&&yr(),c=e.pendingLanes,(i&4194218)!==0&&(c&42)!==0?e===ip?Vo++:(Vo=0,ip=e):Vo=0,dl(0,!1),null}function Yy(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,cl(t)))}function yr(){if(ma!==null){var e=ma,t=ep;ep=0;var n=J_(Go),i=Ft.T,s=ye.p;try{if(ye.p=32>n?32:n,Ft.T=null,ma===null)var a=!1;else{n=np,np=null;var r=ma,o=Go;if(ma=null,Go=0,(Re&6)!==0)throw Error($(331));var l=Re;if(Re|=4,Py(r.current),Ny(r,r.current,o,n),Re=l,dl(0,!1),Pn&&typeof Pn.onPostCommitFiberRoot=="function")try{Pn.onPostCommitFiberRoot(sl,r)}catch{}a=!0}return a}finally{ye.p=s,Ft.T=i,Yy(e,t)}}return!1}function m_(e,t,n){t=ei(n,t),t=Wd(e.stateNode,t,2),e=Bs(e,t,2),e!==null&&(rl(e,2),Oi(e))}function de(e,t,n){if(e.tag===3)m_(e,e,n);else for(;t!==null;){if(t.tag===3){m_(t,e,n);break}else if(t.tag===1){var i=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(zs===null||!zs.has(i))){e=ei(n,e),n=hy(2),i=Bs(t,n,2),i!==null&&(fy(n,i,t,e),rl(i,2),Oi(i));break}}t=t.return}}function gd(e,t,n){var i=e.pingCache;if(i===null){i=e.pingCache=new R1;var s=new Set;i.set(t,s)}else s=i.get(t),s===void 0&&(s=new Set,i.set(t,s));s.has(n)||(Kp=!0,s.add(n),e=O1.bind(null,e,t,n),t.then(e,e))}function O1(e,t,n){var i=e.pingCache;i!==null&&i.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,ve===e&&($t&n)===n&&(Ne===4||Ne===3&&($t&62914560)===$t&&300>Di()-Qp?(Re&2)===0&&wr(e,0):Jp|=n,Ar===$t&&(Ar=0)),Oi(e)}function Zy(e,t){t===0&&(t=Y_()),e=ks(e,t),e!==null&&(rl(e,t),Oi(e))}function P1(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),Zy(e,n)}function I1(e,t){var n=0;switch(e.tag){case 13:var i=e.stateNode,s=e.memoizedState;s!==null&&(n=s.retryLane);break;case 19:i=e.stateNode;break;case 22:i=e.stateNode._retryCache;break;default:throw Error($(314))}i!==null&&i.delete(t),Zy(e,n)}function B1(e,t){return _p(e,t)}var ou=null,tr=null,rp=!1,lu=!1,_d=!1,ba=0;function Oi(e){e!==tr&&e.next===null&&(tr===null?ou=tr=e:tr=tr.next=e),lu=!0,rp||(rp=!0,z1(F1))}function dl(e,t){if(!_d&&lu){_d=!0;do for(var n=!1,i=ou;i!==null;){if(!t)if(e!==0){var s=i.pendingLanes;if(s===0)var a=0;else{var r=i.suspendedLanes,o=i.pingedLanes;a=(1<<31-In(42|e)+1)-1,a&=s&~(r&~o),a=a&201326677?a&201326677|1:a?a|2:0}a!==0&&(n=!0,g_(i,a))}else a=$t,a=gu(i,i===ve?a:0),(a&3)===0||al(i,a)||(n=!0,g_(i,a));i=i.next}while(n);_d=!1}}function F1(){lu=rp=!1;var e=0;ba!==0&&(X1()&&(e=ba),ba=0);for(var t=Di(),n=null,i=ou;i!==null;){var s=i.next,a=Ky(i,t);a===0?(i.next=null,n===null?ou=s:n.next=s,s===null&&(tr=n)):(n=i,(e!==0||(a&3)!==0)&&(lu=!0)),i=s}dl(e,!1)}function Ky(e,t){for(var n=e.suspendedLanes,i=e.pingedLanes,s=e.expirationTimes,a=e.pendingLanes&-62914561;0<a;){var r=31-In(a),o=1<<r,l=s[r];l===-1?((o&n)===0||(o&i)!==0)&&(s[r]=ub(o,t)):l<=t&&(e.expiredLanes|=o),a&=~o}if(t=ve,n=$t,n=gu(e,e===t?n:0),i=e.callbackNode,n===0||e===t&&_e===2||e.cancelPendingCommit!==null)return i!==null&&i!==null&&Zf(i),e.callbackNode=null,e.callbackPriority=0;if((n&3)===0||al(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(i!==null&&Zf(i),J_(n)){case 2:case 8:n=W_;break;case 32:n=Xc;break;case 268435456:n=X_;break;default:n=Xc}return i=Jy.bind(null,e),n=_p(n,i),e.callbackPriority=t,e.callbackNode=n,t}return i!==null&&i!==null&&Zf(i),e.callbackPriority=2,e.callbackNode=null,2}function Jy(e,t){var n=e.callbackNode;if(yr()&&e.callbackNode!==n)return null;var i=$t;return i=gu(e,e===ve?i:0),i===0?null:(Gy(e,i,t),Ky(e,Di()),e.callbackNode!=null&&e.callbackNode===n?Jy.bind(null,e):null)}function g_(e,t){if(yr())return null;Gy(e,t,!0)}function z1(e){Y1(function(){(Re&6)!==0?_p(k_,e):e()})}function $p(){return ba===0&&(ba=q_()),ba}function __(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:Lc(""+e)}function v_(e,t){var n=t.ownerDocument.createElement("input");return n.name=t.name,n.value=t.value,e.id&&n.setAttribute("form",e.id),t.parentNode.insertBefore(n,t),e=new FormData(e),n.parentNode.removeChild(n),e}function H1(e,t,n,i,s){if(t==="submit"&&n&&n.stateNode===s){var a=__((s[Cn]||null).action),r=i.submitter;r&&(t=(t=r[Cn]||null)?__(t.formAction):r.getAttribute("formAction"),t!==null&&(a=t,r=null));var o=new _u("action","action",null,i,s);e.push({event:o,listeners:[{instance:null,listener:function(){if(i.defaultPrevented){if(ba!==0){var l=r?v_(s,r):new FormData(s);Vd(n,{pending:!0,data:l,method:s.method,action:a},null,l)}}else typeof a=="function"&&(o.preventDefault(),l=r?v_(s,r):new FormData(s),Vd(n,{pending:!0,data:l,method:s.method,action:a},a,l))},currentTarget:s}]})}}for(Ec=0;Ec<z0.length;Ec++)Ac=z0[Ec],y_=Ac.toLowerCase(),x_=Ac[0].toUpperCase()+Ac.slice(1),_i(y_,"on"+x_);var Ac,y_,x_,Ec;_i(_v,"onAnimationEnd");_i(vv,"onAnimationIteration");_i(yv,"onAnimationStart");_i("dblclick","onDoubleClick");_i("focusin","onFocus");_i("focusout","onBlur");_i(a1,"onTransitionRun");_i(r1,"onTransitionStart");_i(o1,"onTransitionCancel");_i(xv,"onTransitionEnd");Sr("onMouseEnter",["mouseout","mouseover"]);Sr("onMouseLeave",["mouseout","mouseover"]);Sr("onPointerEnter",["pointerout","pointerover"]);Sr("onPointerLeave",["pointerout","pointerover"]);Ca("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Ca("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Ca("onBeforeInput",["compositionend","keypress","textInput","paste"]);Ca("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Ca("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Ca("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Qo="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),G1=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Qo));function Qy(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var i=e[n],s=i.event;i=i.listeners;t:{var a=void 0;if(t)for(var r=i.length-1;0<=r;r--){var o=i[r],l=o.instance,c=o.currentTarget;if(o=o.listener,l!==a&&s.isPropagationStopped())break t;a=o,s.currentTarget=c;try{a(s)}catch(f){eu(f)}s.currentTarget=null,a=l}else for(r=0;r<i.length;r++){if(o=i[r],l=o.instance,c=o.currentTarget,o=o.listener,l!==a&&s.isPropagationStopped())break t;a=o,s.currentTarget=c;try{a(s)}catch(f){eu(f)}s.currentTarget=null,a=l}}}}function Qt(e,t){var n=t[Cd];n===void 0&&(n=t[Cd]=new Set);var i=e+"__bubble";n.has(i)||(jy(t,e,2,!1),n.add(i))}function vd(e,t,n){var i=0;t&&(i|=4),jy(n,e,i,t)}var wc="_reactListening"+Math.random().toString(36).slice(2);function tm(e){if(!e[wc]){e[wc]=!0,j_.forEach(function(n){n!=="selectionchange"&&(G1.has(n)||vd(n,!1,e),vd(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[wc]||(t[wc]=!0,vd("selectionchange",!1,t))}}function jy(e,t,n,i){switch(ux(t)){case 2:var s=dT;break;case 8:s=pT;break;default:s=sm}n=s.bind(null,t,n,e),s=void 0,!Ud||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(s=!0),i?s!==void 0?e.addEventListener(t,n,{capture:!0,passive:s}):e.addEventListener(t,n,!0):s!==void 0?e.addEventListener(t,n,{passive:s}):e.addEventListener(t,n,!1)}function yd(e,t,n,i,s){var a=i;if((t&1)===0&&(t&2)===0&&i!==null)t:for(;;){if(i===null)return;var r=i.tag;if(r===3||r===4){var o=i.stateNode.containerInfo;if(o===s||o.nodeType===8&&o.parentNode===s)break;if(r===4)for(r=i.return;r!==null;){var l=r.tag;if((l===3||l===4)&&(l=r.stateNode.containerInfo,l===s||l.nodeType===8&&l.parentNode===s))return;r=r.return}for(;o!==null;){if(r=ga(o),r===null)return;if(l=r.tag,l===5||l===6||l===26||l===27){i=a=r;continue t}o=o.parentNode}}i=i.return}rv(function(){var c=a,f=xp(n),p=[];t:{var u=Sv.get(e);if(u!==void 0){var d=_u,v=e;switch(e){case"keypress":if(Uc(n)===0)break t;case"keydown":case"keyup":d=Ib;break;case"focusin":v="focus",d=$f;break;case"focusout":v="blur",d=$f;break;case"beforeblur":case"afterblur":d=$f;break;case"click":if(n.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":d=R0;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":d=Tb;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":d=zb;break;case _v:case vv:case yv:d=wb;break;case xv:d=Gb;break;case"scroll":case"scrollend":d=Mb;break;case"wheel":d=kb;break;case"copy":case"cut":case"paste":d=Cb;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":d=D0;break;case"toggle":case"beforetoggle":d=Xb}var T=(t&4)!==0,_=!T&&(e==="scroll"||e==="scrollend"),h=T?u!==null?u+"Capture":null:u;T=[];for(var m=c,y;m!==null;){var x=m;if(y=x.stateNode,x=x.tag,x!==5&&x!==26&&x!==27||y===null||h===null||(x=Xo(m,h),x!=null&&T.push(jo(m,x,y))),_)break;m=m.return}0<T.length&&(u=new d(u,v,null,n,f),p.push({event:u,listeners:T}))}}if((t&7)===0){t:{if(u=e==="mouseover"||e==="pointerover",d=e==="mouseout"||e==="pointerout",u&&n!==Nd&&(v=n.relatedTarget||n.fromElement)&&(ga(v)||v[Dr]))break t;if((d||u)&&(u=f.window===f?f:(u=f.ownerDocument)?u.defaultView||u.parentWindow:window,d?(v=n.relatedTarget||n.toElement,d=c,v=v?ga(v):null,v!==null&&(_=Cr(v),T=v.tag,v!==_||T!==5&&T!==27&&T!==6)&&(v=null)):(d=null,v=c),d!==v)){if(T=R0,x="onMouseLeave",h="onMouseEnter",m="mouse",(e==="pointerout"||e==="pointerover")&&(T=D0,x="onPointerLeave",h="onPointerEnter",m="pointer"),_=d==null?u:Ao(d),y=v==null?u:Ao(v),u=new T(x,m+"leave",d,n,f),u.target=_,u.relatedTarget=y,x=null,ga(f)===c&&(T=new T(h,m+"enter",v,n,f),T.target=y,T.relatedTarget=_,x=T),_=x,d&&v)e:{for(T=d,h=v,m=0,y=T;y;y=Qa(y))m++;for(y=0,x=h;x;x=Qa(x))y++;for(;0<m-y;)T=Qa(T),m--;for(;0<y-m;)h=Qa(h),y--;for(;m--;){if(T===h||h!==null&&T===h.alternate)break e;T=Qa(T),h=Qa(h)}T=null}else T=null;d!==null&&S_(p,u,d,T,!1),v!==null&&_!==null&&S_(p,_,v,T,!0)}}t:{if(u=c?Ao(c):window,d=u.nodeName&&u.nodeName.toLowerCase(),d==="select"||d==="input"&&u.type==="file")var E=O0;else if(U0(u))if(fv)E=e1;else{E=$b;var A=jb}else d=u.nodeName,!d||d.toLowerCase()!=="input"||u.type!=="checkbox"&&u.type!=="radio"?c&&yp(c.elementType)&&(E=O0):E=t1;if(E&&(E=E(e,c))){hv(p,E,n,f);break t}A&&A(e,u,c),e==="focusout"&&c&&u.type==="number"&&c.memoizedProps.value!=null&&Ld(u,"number",u.value)}switch(A=c?Ao(c):window,e){case"focusin":(U0(A)||A.contentEditable==="true")&&(ar=A,Od=c,Do=null);break;case"focusout":Do=Od=ar=null;break;case"mousedown":Pd=!0;break;case"contextmenu":case"mouseup":case"dragend":Pd=!1,F0(p,n,f);break;case"selectionchange":if(s1)break;case"keydown":case"keyup":F0(p,n,f)}var g;if(bp)t:{switch(e){case"compositionstart":var M="onCompositionStart";break t;case"compositionend":M="onCompositionEnd";break t;case"compositionupdate":M="onCompositionUpdate";break t}M=void 0}else sr?cv(e,n)&&(M="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(M="onCompositionStart");M&&(lv&&n.locale!=="ko"&&(sr||M!=="onCompositionStart"?M==="onCompositionEnd"&&sr&&(g=ov()):(Os=f,Sp="value"in Os?Os.value:Os.textContent,sr=!0)),A=cu(c,M),0<A.length&&(M=new C0(M,e,null,n,f),p.push({event:M,listeners:A}),g?M.data=g:(g=uv(n),g!==null&&(M.data=g)))),(g=Yb?Zb(e,n):Kb(e,n))&&(M=cu(c,"onBeforeInput"),0<M.length&&(A=new C0("onBeforeInput","beforeinput",null,n,f),p.push({event:A,listeners:M}),A.data=g)),H1(p,e,c,n,f)}Qy(p,t)})}function jo(e,t,n){return{instance:e,listener:t,currentTarget:n}}function cu(e,t){for(var n=t+"Capture",i=[];e!==null;){var s=e,a=s.stateNode;s=s.tag,s!==5&&s!==26&&s!==27||a===null||(s=Xo(e,n),s!=null&&i.unshift(jo(e,s,a)),s=Xo(e,t),s!=null&&i.push(jo(e,s,a))),e=e.return}return i}function Qa(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function S_(e,t,n,i,s){for(var a=t._reactName,r=[];n!==null&&n!==i;){var o=n,l=o.alternate,c=o.stateNode;if(o=o.tag,l!==null&&l===i)break;o!==5&&o!==26&&o!==27||c===null||(l=c,s?(c=Xo(n,a),c!=null&&r.unshift(jo(n,c,l))):s||(c=Xo(n,a),c!=null&&r.push(jo(n,c,l)))),n=n.return}r.length!==0&&e.push({event:t,listeners:r})}var V1=/\r\n?/g,k1=/\u0000|\uFFFD/g;function M_(e){return(typeof e=="string"?e:""+e).replace(V1,`
`).replace(k1,"")}function $y(e,t){return t=M_(t),M_(e)===t}function Ru(){}function ce(e,t,n,i,s,a){switch(n){case"children":typeof i=="string"?t==="body"||t==="textarea"&&i===""||Mr(e,i):(typeof i=="number"||typeof i=="bigint")&&t!=="body"&&Mr(e,""+i);break;case"className":mc(e,"class",i);break;case"tabIndex":mc(e,"tabindex",i);break;case"dir":case"role":case"viewBox":case"width":case"height":mc(e,n,i);break;case"style":av(e,i,a);break;case"data":if(t!=="object"){mc(e,"data",i);break}case"src":case"href":if(i===""&&(t!=="a"||n!=="href")){e.removeAttribute(n);break}if(i==null||typeof i=="function"||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=Lc(""+i),e.setAttribute(n,i);break;case"action":case"formAction":if(typeof i=="function"){e.setAttribute(n,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof a=="function"&&(n==="formAction"?(t!=="input"&&ce(e,t,"name",s.name,s,null),ce(e,t,"formEncType",s.formEncType,s,null),ce(e,t,"formMethod",s.formMethod,s,null),ce(e,t,"formTarget",s.formTarget,s,null)):(ce(e,t,"encType",s.encType,s,null),ce(e,t,"method",s.method,s,null),ce(e,t,"target",s.target,s,null)));if(i==null||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=Lc(""+i),e.setAttribute(n,i);break;case"onClick":i!=null&&(e.onclick=Ru);break;case"onScroll":i!=null&&Qt("scroll",e);break;case"onScrollEnd":i!=null&&Qt("scrollend",e);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error($(61));if(n=i.__html,n!=null){if(s.children!=null)throw Error($(60));e.innerHTML=n}}break;case"multiple":e.multiple=i&&typeof i!="function"&&typeof i!="symbol";break;case"muted":e.muted=i&&typeof i!="function"&&typeof i!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(i==null||typeof i=="function"||typeof i=="boolean"||typeof i=="symbol"){e.removeAttribute("xlink:href");break}n=Lc(""+i),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",n);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,""+i):e.removeAttribute(n);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":i&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,""):e.removeAttribute(n);break;case"capture":case"download":i===!0?e.setAttribute(n,""):i!==!1&&i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,i):e.removeAttribute(n);break;case"cols":case"rows":case"size":case"span":i!=null&&typeof i!="function"&&typeof i!="symbol"&&!isNaN(i)&&1<=i?e.setAttribute(n,i):e.removeAttribute(n);break;case"rowSpan":case"start":i==null||typeof i=="function"||typeof i=="symbol"||isNaN(i)?e.removeAttribute(n):e.setAttribute(n,i);break;case"popover":Qt("beforetoggle",e),Qt("toggle",e),Dc(e,"popover",i);break;case"xlinkActuate":Xi(e,"http://www.w3.org/1999/xlink","xlink:actuate",i);break;case"xlinkArcrole":Xi(e,"http://www.w3.org/1999/xlink","xlink:arcrole",i);break;case"xlinkRole":Xi(e,"http://www.w3.org/1999/xlink","xlink:role",i);break;case"xlinkShow":Xi(e,"http://www.w3.org/1999/xlink","xlink:show",i);break;case"xlinkTitle":Xi(e,"http://www.w3.org/1999/xlink","xlink:title",i);break;case"xlinkType":Xi(e,"http://www.w3.org/1999/xlink","xlink:type",i);break;case"xmlBase":Xi(e,"http://www.w3.org/XML/1998/namespace","xml:base",i);break;case"xmlLang":Xi(e,"http://www.w3.org/XML/1998/namespace","xml:lang",i);break;case"xmlSpace":Xi(e,"http://www.w3.org/XML/1998/namespace","xml:space",i);break;case"is":Dc(e,"is",i);break;case"innerText":case"textContent":break;default:(!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")&&(n=xb.get(n)||n,Dc(e,n,i))}}function op(e,t,n,i,s,a){switch(n){case"style":av(e,i,a);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error($(61));if(n=i.__html,n!=null){if(s.children!=null)throw Error($(60));e.innerHTML=n}}break;case"children":typeof i=="string"?Mr(e,i):(typeof i=="number"||typeof i=="bigint")&&Mr(e,""+i);break;case"onScroll":i!=null&&Qt("scroll",e);break;case"onScrollEnd":i!=null&&Qt("scrollend",e);break;case"onClick":i!=null&&(e.onclick=Ru);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!$_.hasOwnProperty(n))t:{if(n[0]==="o"&&n[1]==="n"&&(s=n.endsWith("Capture"),t=n.slice(2,s?n.length-7:void 0),a=e[Cn]||null,a=a!=null?a[n]:null,typeof a=="function"&&e.removeEventListener(t,a,s),typeof i=="function")){typeof a!="function"&&a!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(t,i,s);break t}n in e?e[n]=i:i===!0?e.setAttribute(n,""):Dc(e,n,i)}}}function rn(e,t,n){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Qt("error",e),Qt("load",e);var i=!1,s=!1,a;for(a in n)if(n.hasOwnProperty(a)){var r=n[a];if(r!=null)switch(a){case"src":i=!0;break;case"srcSet":s=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error($(137,t));default:ce(e,t,a,r,n,null)}}s&&ce(e,t,"srcSet",n.srcSet,n,null),i&&ce(e,t,"src",n.src,n,null);return;case"input":Qt("invalid",e);var o=a=r=s=null,l=null,c=null;for(i in n)if(n.hasOwnProperty(i)){var f=n[i];if(f!=null)switch(i){case"name":s=f;break;case"type":r=f;break;case"checked":l=f;break;case"defaultChecked":c=f;break;case"value":a=f;break;case"defaultValue":o=f;break;case"children":case"dangerouslySetInnerHTML":if(f!=null)throw Error($(137,t));break;default:ce(e,t,i,f,n,null)}}nv(e,a,o,l,c,r,s,!1),qc(e);return;case"select":Qt("invalid",e),i=r=a=null;for(s in n)if(n.hasOwnProperty(s)&&(o=n[s],o!=null))switch(s){case"value":a=o;break;case"defaultValue":r=o;break;case"multiple":i=o;default:ce(e,t,s,o,n,null)}t=a,n=r,e.multiple=!!i,t!=null?dr(e,!!i,t,!1):n!=null&&dr(e,!!i,n,!0);return;case"textarea":Qt("invalid",e),a=s=i=null;for(r in n)if(n.hasOwnProperty(r)&&(o=n[r],o!=null))switch(r){case"value":i=o;break;case"defaultValue":s=o;break;case"children":a=o;break;case"dangerouslySetInnerHTML":if(o!=null)throw Error($(91));break;default:ce(e,t,r,o,n,null)}sv(e,i,s,a),qc(e);return;case"option":for(l in n)if(n.hasOwnProperty(l)&&(i=n[l],i!=null))switch(l){case"selected":e.selected=i&&typeof i!="function"&&typeof i!="symbol";break;default:ce(e,t,l,i,n,null)}return;case"dialog":Qt("cancel",e),Qt("close",e);break;case"iframe":case"object":Qt("load",e);break;case"video":case"audio":for(i=0;i<Qo.length;i++)Qt(Qo[i],e);break;case"image":Qt("error",e),Qt("load",e);break;case"details":Qt("toggle",e);break;case"embed":case"source":case"link":Qt("error",e),Qt("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(c in n)if(n.hasOwnProperty(c)&&(i=n[c],i!=null))switch(c){case"children":case"dangerouslySetInnerHTML":throw Error($(137,t));default:ce(e,t,c,i,n,null)}return;default:if(yp(t)){for(f in n)n.hasOwnProperty(f)&&(i=n[f],i!==void 0&&op(e,t,f,i,n,void 0));return}}for(o in n)n.hasOwnProperty(o)&&(i=n[o],i!=null&&ce(e,t,o,i,n,null))}function W1(e,t,n,i){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var s=null,a=null,r=null,o=null,l=null,c=null,f=null;for(d in n){var p=n[d];if(n.hasOwnProperty(d)&&p!=null)switch(d){case"checked":break;case"value":break;case"defaultValue":l=p;default:i.hasOwnProperty(d)||ce(e,t,d,null,i,p)}}for(var u in i){var d=i[u];if(p=n[u],i.hasOwnProperty(u)&&(d!=null||p!=null))switch(u){case"type":a=d;break;case"name":s=d;break;case"checked":c=d;break;case"defaultChecked":f=d;break;case"value":r=d;break;case"defaultValue":o=d;break;case"children":case"dangerouslySetInnerHTML":if(d!=null)throw Error($(137,t));break;default:d!==p&&ce(e,t,u,d,i,p)}}Dd(e,r,o,l,c,f,a,s);return;case"select":d=r=o=u=null;for(a in n)if(l=n[a],n.hasOwnProperty(a)&&l!=null)switch(a){case"value":break;case"multiple":d=l;default:i.hasOwnProperty(a)||ce(e,t,a,null,i,l)}for(s in i)if(a=i[s],l=n[s],i.hasOwnProperty(s)&&(a!=null||l!=null))switch(s){case"value":u=a;break;case"defaultValue":o=a;break;case"multiple":r=a;default:a!==l&&ce(e,t,s,a,i,l)}t=o,n=r,i=d,u!=null?dr(e,!!n,u,!1):!!i!=!!n&&(t!=null?dr(e,!!n,t,!0):dr(e,!!n,n?[]:"",!1));return;case"textarea":d=u=null;for(o in n)if(s=n[o],n.hasOwnProperty(o)&&s!=null&&!i.hasOwnProperty(o))switch(o){case"value":break;case"children":break;default:ce(e,t,o,null,i,s)}for(r in i)if(s=i[r],a=n[r],i.hasOwnProperty(r)&&(s!=null||a!=null))switch(r){case"value":u=s;break;case"defaultValue":d=s;break;case"children":break;case"dangerouslySetInnerHTML":if(s!=null)throw Error($(91));break;default:s!==a&&ce(e,t,r,s,i,a)}iv(e,u,d);return;case"option":for(var v in n)if(u=n[v],n.hasOwnProperty(v)&&u!=null&&!i.hasOwnProperty(v))switch(v){case"selected":e.selected=!1;break;default:ce(e,t,v,null,i,u)}for(l in i)if(u=i[l],d=n[l],i.hasOwnProperty(l)&&u!==d&&(u!=null||d!=null))switch(l){case"selected":e.selected=u&&typeof u!="function"&&typeof u!="symbol";break;default:ce(e,t,l,u,i,d)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var T in n)u=n[T],n.hasOwnProperty(T)&&u!=null&&!i.hasOwnProperty(T)&&ce(e,t,T,null,i,u);for(c in i)if(u=i[c],d=n[c],i.hasOwnProperty(c)&&u!==d&&(u!=null||d!=null))switch(c){case"children":case"dangerouslySetInnerHTML":if(u!=null)throw Error($(137,t));break;default:ce(e,t,c,u,i,d)}return;default:if(yp(t)){for(var _ in n)u=n[_],n.hasOwnProperty(_)&&u!==void 0&&!i.hasOwnProperty(_)&&op(e,t,_,void 0,i,u);for(f in i)u=i[f],d=n[f],!i.hasOwnProperty(f)||u===d||u===void 0&&d===void 0||op(e,t,f,u,i,d);return}}for(var h in n)u=n[h],n.hasOwnProperty(h)&&u!=null&&!i.hasOwnProperty(h)&&ce(e,t,h,null,i,u);for(p in i)u=i[p],d=n[p],!i.hasOwnProperty(p)||u===d||u==null&&d==null||ce(e,t,p,u,i,d)}var lp=null,cp=null;function uu(e){return e.nodeType===9?e:e.ownerDocument}function b_(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function tx(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function up(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var xd=null;function X1(){var e=window.event;return e&&e.type==="popstate"?e===xd?!1:(xd=e,!0):(xd=null,!1)}var ex=typeof setTimeout=="function"?setTimeout:void 0,q1=typeof clearTimeout=="function"?clearTimeout:void 0,T_=typeof Promise=="function"?Promise:void 0,Y1=typeof queueMicrotask=="function"?queueMicrotask:typeof T_<"u"?function(e){return T_.resolve(null).then(e).catch(Z1)}:ex;function Z1(e){setTimeout(function(){throw e})}function Sd(e,t){var n=t,i=0;do{var s=n.nextSibling;if(e.removeChild(n),s&&s.nodeType===8)if(n=s.data,n==="/$"){if(i===0){e.removeChild(s),il(t);return}i--}else n!=="$"&&n!=="$?"&&n!=="$!"||i++;n=s}while(n);il(t)}function hp(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case"HTML":case"HEAD":case"BODY":hp(n),vp(n);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(n.rel.toLowerCase()==="stylesheet")continue}e.removeChild(n)}}function K1(e,t,n,i){for(;e.nodeType===1;){var s=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!i&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(i){if(!e[Wo])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(a=e.getAttribute("rel"),a==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(a!==s.rel||e.getAttribute("href")!==(s.href==null?null:s.href)||e.getAttribute("crossorigin")!==(s.crossOrigin==null?null:s.crossOrigin)||e.getAttribute("title")!==(s.title==null?null:s.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(a=e.getAttribute("src"),(a!==(s.src==null?null:s.src)||e.getAttribute("type")!==(s.type==null?null:s.type)||e.getAttribute("crossorigin")!==(s.crossOrigin==null?null:s.crossOrigin))&&a&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var a=s.name==null?null:""+s.name;if(s.type==="hidden"&&e.getAttribute("name")===a)return e}else return e;if(e=gi(e.nextSibling),e===null)break}return null}function J1(e,t,n){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!n||(e=gi(e.nextSibling),e===null))return null;return e}function gi(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="F!"||t==="F")break;if(t==="/$")return null}}return e}function E_(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"){if(t===0)return e;t--}else n==="/$"&&t++}e=e.previousSibling}return null}function nx(e,t,n){switch(t=uu(n),e){case"html":if(e=t.documentElement,!e)throw Error($(452));return e;case"head":if(e=t.head,!e)throw Error($(453));return e;case"body":if(e=t.body,!e)throw Error($(454));return e;default:throw Error($(451))}}var ai=new Map,A_=new Set;function hu(e){return typeof e.getRootNode=="function"?e.getRootNode():e.ownerDocument}var ls=ye.d;ye.d={f:Q1,r:j1,D:$1,C:tT,L:eT,m:nT,X:sT,S:iT,M:aT};function Q1(){var e=ls.f(),t=Au();return e||t}function j1(e){var t=Lr(e);t!==null&&t.tag===5&&t.type==="form"?ny(t):ls.r(e)}var Ur=typeof document>"u"?null:document;function ix(e,t,n){var i=Ur;if(i&&typeof t=="string"&&t){var s=ti(t);s='link[rel="'+e+'"][href="'+s+'"]',typeof n=="string"&&(s+='[crossorigin="'+n+'"]'),A_.has(s)||(A_.add(s),e={rel:e,crossOrigin:n,href:t},i.querySelector(s)===null&&(t=i.createElement("link"),rn(t,"link",e),Je(t),i.head.appendChild(t)))}}function $1(e){ls.D(e),ix("dns-prefetch",e,null)}function tT(e,t){ls.C(e,t),ix("preconnect",e,t)}function eT(e,t,n){ls.L(e,t,n);var i=Ur;if(i&&e&&t){var s='link[rel="preload"][as="'+ti(t)+'"]';t==="image"&&n&&n.imageSrcSet?(s+='[imagesrcset="'+ti(n.imageSrcSet)+'"]',typeof n.imageSizes=="string"&&(s+='[imagesizes="'+ti(n.imageSizes)+'"]')):s+='[href="'+ti(e)+'"]';var a=s;switch(t){case"style":a=Rr(e);break;case"script":a=Or(e)}ai.has(a)||(e=xe({rel:"preload",href:t==="image"&&n&&n.imageSrcSet?void 0:e,as:t},n),ai.set(a,e),i.querySelector(s)!==null||t==="style"&&i.querySelector(pl(a))||t==="script"&&i.querySelector(ml(a))||(t=i.createElement("link"),rn(t,"link",e),Je(t),i.head.appendChild(t)))}}function nT(e,t){ls.m(e,t);var n=Ur;if(n&&e){var i=t&&typeof t.as=="string"?t.as:"script",s='link[rel="modulepreload"][as="'+ti(i)+'"][href="'+ti(e)+'"]',a=s;switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":a=Or(e)}if(!ai.has(a)&&(e=xe({rel:"modulepreload",href:e},t),ai.set(a,e),n.querySelector(s)===null)){switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(n.querySelector(ml(a)))return}i=n.createElement("link"),rn(i,"link",e),Je(i),n.head.appendChild(i)}}}function iT(e,t,n){ls.S(e,t,n);var i=Ur;if(i&&e){var s=fr(i).hoistableStyles,a=Rr(e);t=t||"default";var r=s.get(a);if(!r){var o={loading:0,preload:null};if(r=i.querySelector(pl(a)))o.loading=5;else{e=xe({rel:"stylesheet",href:e,"data-precedence":t},n),(n=ai.get(a))&&em(e,n);var l=r=i.createElement("link");Je(l),rn(l,"link",e),l._p=new Promise(function(c,f){l.onload=c,l.onerror=f}),l.addEventListener("load",function(){o.loading|=1}),l.addEventListener("error",function(){o.loading|=2}),o.loading|=4,zc(r,t,i)}r={type:"stylesheet",instance:r,count:1,state:o},s.set(a,r)}}}function sT(e,t){ls.X(e,t);var n=Ur;if(n&&e){var i=fr(n).hoistableScripts,s=Or(e),a=i.get(s);a||(a=n.querySelector(ml(s)),a||(e=xe({src:e,async:!0},t),(t=ai.get(s))&&nm(e,t),a=n.createElement("script"),Je(a),rn(a,"link",e),n.head.appendChild(a)),a={type:"script",instance:a,count:1,state:null},i.set(s,a))}}function aT(e,t){ls.M(e,t);var n=Ur;if(n&&e){var i=fr(n).hoistableScripts,s=Or(e),a=i.get(s);a||(a=n.querySelector(ml(s)),a||(e=xe({src:e,async:!0,type:"module"},t),(t=ai.get(s))&&nm(e,t),a=n.createElement("script"),Je(a),rn(a,"link",e),n.head.appendChild(a)),a={type:"script",instance:a,count:1,state:null},i.set(s,a))}}function w_(e,t,n,i){var s=(s=Ps.current)?hu(s):null;if(!s)throw Error($(446));switch(e){case"meta":case"title":return null;case"style":return typeof n.precedence=="string"&&typeof n.href=="string"?(t=Rr(n.href),n=fr(s).hoistableStyles,i=n.get(t),i||(i={type:"style",instance:null,count:0,state:null},n.set(t,i)),i):{type:"void",instance:null,count:0,state:null};case"link":if(n.rel==="stylesheet"&&typeof n.href=="string"&&typeof n.precedence=="string"){e=Rr(n.href);var a=fr(s).hoistableStyles,r=a.get(e);if(r||(s=s.ownerDocument||s,r={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},a.set(e,r),(a=s.querySelector(pl(e)))&&!a._p&&(r.instance=a,r.state.loading=5),ai.has(e)||(n={rel:"preload",as:"style",href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},ai.set(e,n),a||rT(s,e,n,r.state))),t&&i===null)throw Error($(528,""));return r}if(t&&i!==null)throw Error($(529,""));return null;case"script":return t=n.async,n=n.src,typeof n=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(t=Or(n),n=fr(s).hoistableScripts,i=n.get(t),i||(i={type:"script",instance:null,count:0,state:null},n.set(t,i)),i):{type:"void",instance:null,count:0,state:null};default:throw Error($(444,e))}}function Rr(e){return'href="'+ti(e)+'"'}function pl(e){return'link[rel="stylesheet"]['+e+"]"}function sx(e){return xe({},e,{"data-precedence":e.precedence,precedence:null})}function rT(e,t,n,i){e.querySelector('link[rel="preload"][as="style"]['+t+"]")?i.loading=1:(t=e.createElement("link"),i.preload=t,t.addEventListener("load",function(){return i.loading|=1}),t.addEventListener("error",function(){return i.loading|=2}),rn(t,"link",n),Je(t),e.head.appendChild(t))}function Or(e){return'[src="'+ti(e)+'"]'}function ml(e){return"script[async]"+e}function R_(e,t,n){if(t.count++,t.instance===null)switch(t.type){case"style":var i=e.querySelector('style[data-href~="'+ti(n.href)+'"]');if(i)return t.instance=i,Je(i),i;var s=xe({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return i=(e.ownerDocument||e).createElement("style"),Je(i),rn(i,"style",s),zc(i,n.precedence,e),t.instance=i;case"stylesheet":s=Rr(n.href);var a=e.querySelector(pl(s));if(a)return t.state.loading|=4,t.instance=a,Je(a),a;i=sx(n),(s=ai.get(s))&&em(i,s),a=(e.ownerDocument||e).createElement("link"),Je(a);var r=a;return r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),rn(a,"link",i),t.state.loading|=4,zc(a,n.precedence,e),t.instance=a;case"script":return a=Or(n.src),(s=e.querySelector(ml(a)))?(t.instance=s,Je(s),s):(i=n,(s=ai.get(a))&&(i=xe({},n),nm(i,s)),e=e.ownerDocument||e,s=e.createElement("script"),Je(s),rn(s,"link",i),e.head.appendChild(s),t.instance=s);case"void":return null;default:throw Error($(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(i=t.instance,t.state.loading|=4,zc(i,n.precedence,e));return t.instance}function zc(e,t,n){for(var i=n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),s=i.length?i[i.length-1]:null,a=s,r=0;r<i.length;r++){var o=i[r];if(o.dataset.precedence===t)a=o;else if(a!==s)break}a?a.parentNode.insertBefore(e,a.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function em(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function nm(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var Hc=null;function C_(e,t,n){if(Hc===null){var i=new Map,s=Hc=new Map;s.set(n,i)}else s=Hc,i=s.get(n),i||(i=new Map,s.set(n,i));if(i.has(e))return i;for(i.set(e,null),n=n.getElementsByTagName(e),s=0;s<n.length;s++){var a=n[s];if(!(a[Wo]||a[un]||e==="link"&&a.getAttribute("rel")==="stylesheet")&&a.namespaceURI!=="http://www.w3.org/2000/svg"){var r=a.getAttribute(t)||"";r=e+r;var o=i.get(r);o?o.push(a):i.set(r,[a])}}return i}function D_(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t==="title"?e.querySelector("head > title"):null)}function oT(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function ax(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}var $o=null;function lT(){}function cT(e,t,n){if($o===null)throw Error($(475));var i=$o;if(t.type==="stylesheet"&&(typeof n.media!="string"||matchMedia(n.media).matches!==!1)&&(t.state.loading&4)===0){if(t.instance===null){var s=Rr(n.href),a=e.querySelector(pl(s));if(a){e=a._p,e!==null&&typeof e=="object"&&typeof e.then=="function"&&(i.count++,i=fu.bind(i),e.then(i,i)),t.state.loading|=4,t.instance=a,Je(a);return}a=e.ownerDocument||e,n=sx(n),(s=ai.get(s))&&em(n,s),a=a.createElement("link"),Je(a);var r=a;r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),rn(a,"link",n),t.instance=a}i.stylesheets===null&&(i.stylesheets=new Map),i.stylesheets.set(t,e),(e=t.state.preload)&&(t.state.loading&3)===0&&(i.count++,t=fu.bind(i),e.addEventListener("load",t),e.addEventListener("error",t))}}function uT(){if($o===null)throw Error($(475));var e=$o;return e.stylesheets&&e.count===0&&fp(e,e.stylesheets),0<e.count?function(t){var n=setTimeout(function(){if(e.stylesheets&&fp(e,e.stylesheets),e.unsuspend){var i=e.unsuspend;e.unsuspend=null,i()}},6e4);return e.unsuspend=t,function(){e.unsuspend=null,clearTimeout(n)}}:null}function fu(){if(this.count--,this.count===0){if(this.stylesheets)fp(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var du=null;function fp(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,du=new Map,t.forEach(hT,e),du=null,fu.call(e))}function hT(e,t){if(!(t.state.loading&4)){var n=du.get(e);if(n)var i=n.get(null);else{n=new Map,du.set(e,n);for(var s=e.querySelectorAll("link[data-precedence],style[data-precedence]"),a=0;a<s.length;a++){var r=s[a];(r.nodeName==="LINK"||r.getAttribute("media")!=="not all")&&(n.set(r.dataset.precedence,r),i=r)}i&&n.set(null,i)}s=t.instance,r=s.getAttribute("data-precedence"),a=n.get(r)||i,a===i&&n.set(null,s),n.set(r,s),this.count++,i=fu.bind(this),s.addEventListener("load",i),s.addEventListener("error",i),a?a.parentNode.insertBefore(s,a.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(s,e.firstChild)),t.state.loading|=4}}var tl={$$typeof:ji,Provider:null,Consumer:null,_currentValue:va,_currentValue2:va,_threadCount:0};function fT(e,t,n,i,s,a,r,o){this.tag=1,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=Kf(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.finishedLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Kf(0),this.hiddenUpdates=Kf(null),this.identifierPrefix=i,this.onUncaughtError=s,this.onCaughtError=a,this.onRecoverableError=r,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=o,this.incompleteTransitions=new Map}function rx(e,t,n,i,s,a,r,o,l,c,f,p){return e=new fT(e,t,n,r,o,l,c,p),t=1,a===!0&&(t|=24),a=ni(3,null,null,t),e.current=a,a.stateNode=e,t=Dp(),t.refCount++,e.pooledCache=t,t.refCount++,a.memoizedState={element:i,isDehydrated:n,cache:t},Xp(a),e}function ox(e){return e?(e=lr,e):lr}function lx(e,t,n,i,s,a){s=ox(s),i.context===null?i.context=s:i.pendingContext=s,i=Is(t),i.payload={element:n},a=a===void 0?null:a,a!==null&&(i.callback=a),n=Bs(e,i,t),n!==null&&(Mn(n,e,t),Io(n,e,t))}function L_(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function im(e,t){L_(e,t),(e=e.alternate)&&L_(e,t)}function cx(e){if(e.tag===13){var t=ks(e,67108864);t!==null&&Mn(t,e,67108864),im(e,67108864)}}var pu=!0;function dT(e,t,n,i){var s=Ft.T;Ft.T=null;var a=ye.p;try{ye.p=2,sm(e,t,n,i)}finally{ye.p=a,Ft.T=s}}function pT(e,t,n,i){var s=Ft.T;Ft.T=null;var a=ye.p;try{ye.p=8,sm(e,t,n,i)}finally{ye.p=a,Ft.T=s}}function sm(e,t,n,i){if(pu){var s=dp(i);if(s===null)yd(e,t,i,mu,n),N_(e,i);else if(gT(s,e,t,n,i))i.stopPropagation();else if(N_(e,i),t&4&&-1<mT.indexOf(e)){for(;s!==null;){var a=Lr(s);if(a!==null)switch(a.tag){case 3:if(a=a.stateNode,a.current.memoizedState.isDehydrated){var r=da(a.pendingLanes);if(r!==0){var o=a;for(o.pendingLanes|=2,o.entangledLanes|=2;r;){var l=1<<31-In(r);o.entanglements[1]|=l,r&=~l}Oi(a),(Re&6)===0&&(au=Di()+500,dl(0,!1))}}break;case 13:o=ks(a,2),o!==null&&Mn(o,a,2),Au(),im(a,2)}if(a=dp(i),a===null&&yd(e,t,i,mu,n),a===s)break;s=a}s!==null&&i.stopPropagation()}else yd(e,t,i,null,n)}}function dp(e){return e=xp(e),am(e)}var mu=null;function am(e){if(mu=null,e=ga(e),e!==null){var t=Cr(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=G_(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return mu=e,null}function ux(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(nb()){case k_:return 2;case W_:return 8;case Xc:case ib:return 32;case X_:return 268435456;default:return 32}default:return 32}}var pp=!1,Hs=null,Gs=null,Vs=null,el=new Map,nl=new Map,Ns=[],mT="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function N_(e,t){switch(e){case"focusin":case"focusout":Hs=null;break;case"dragenter":case"dragleave":Gs=null;break;case"mouseover":case"mouseout":Vs=null;break;case"pointerover":case"pointerout":el.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":nl.delete(t.pointerId)}}function So(e,t,n,i,s,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:i,nativeEvent:a,targetContainers:[s]},t!==null&&(t=Lr(t),t!==null&&cx(t)),e):(e.eventSystemFlags|=i,t=e.targetContainers,s!==null&&t.indexOf(s)===-1&&t.push(s),e)}function gT(e,t,n,i,s){switch(t){case"focusin":return Hs=So(Hs,e,t,n,i,s),!0;case"dragenter":return Gs=So(Gs,e,t,n,i,s),!0;case"mouseover":return Vs=So(Vs,e,t,n,i,s),!0;case"pointerover":var a=s.pointerId;return el.set(a,So(el.get(a)||null,e,t,n,i,s)),!0;case"gotpointercapture":return a=s.pointerId,nl.set(a,So(nl.get(a)||null,e,t,n,i,s)),!0}return!1}function hx(e){var t=ga(e.target);if(t!==null){var n=Cr(t);if(n!==null){if(t=n.tag,t===13){if(t=G_(n),t!==null){e.blockedOn=t,fb(e.priority,function(){if(n.tag===13){var i=Bn(),s=ks(n,i);s!==null&&Mn(s,n,i),im(n,i)}});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Gc(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=dp(e.nativeEvent);if(n===null){n=e.nativeEvent;var i=new n.constructor(n.type,n);Nd=i,n.target.dispatchEvent(i),Nd=null}else return t=Lr(n),t!==null&&cx(t),e.blockedOn=n,!1;t.shift()}return!0}function U_(e,t,n){Gc(e)&&n.delete(t)}function _T(){pp=!1,Hs!==null&&Gc(Hs)&&(Hs=null),Gs!==null&&Gc(Gs)&&(Gs=null),Vs!==null&&Gc(Vs)&&(Vs=null),el.forEach(U_),nl.forEach(U_)}function Rc(e,t){e.blockedOn===t&&(e.blockedOn=null,pp||(pp=!0,ke.unstable_scheduleCallback(ke.unstable_NormalPriority,_T)))}var Cc=null;function O_(e){Cc!==e&&(Cc=e,ke.unstable_scheduleCallback(ke.unstable_NormalPriority,function(){Cc===e&&(Cc=null);for(var t=0;t<e.length;t+=3){var n=e[t],i=e[t+1],s=e[t+2];if(typeof i!="function"){if(am(i||n)===null)continue;break}var a=Lr(n);a!==null&&(e.splice(t,3),t-=3,Vd(a,{pending:!0,data:s,method:n.method,action:i},i,s))}}))}function il(e){function t(l){return Rc(l,e)}Hs!==null&&Rc(Hs,e),Gs!==null&&Rc(Gs,e),Vs!==null&&Rc(Vs,e),el.forEach(t),nl.forEach(t);for(var n=0;n<Ns.length;n++){var i=Ns[n];i.blockedOn===e&&(i.blockedOn=null)}for(;0<Ns.length&&(n=Ns[0],n.blockedOn===null);)hx(n),n.blockedOn===null&&Ns.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(i=0;i<n.length;i+=3){var s=n[i],a=n[i+1],r=s[Cn]||null;if(typeof a=="function")r||O_(n);else if(r){var o=null;if(a&&a.hasAttribute("formAction")){if(s=a,r=a[Cn]||null)o=r.formAction;else if(am(s)!==null)continue}else o=r.action;typeof o=="function"?n[i+1]=o:(n.splice(i,3),i-=3),O_(n)}}}function rm(e){this._internalRoot=e}Cu.prototype.render=rm.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error($(409));var n=t.current,i=Bn();lx(n,i,e,t,null,null)};Cu.prototype.unmount=rm.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;e.tag===0&&yr(),lx(e.current,2,null,e,null,null),Au(),t[Dr]=null}};function Cu(e){this._internalRoot=e}Cu.prototype.unstable_scheduleHydration=function(e){if(e){var t=Q_();e={blockedOn:null,target:e,priority:t};for(var n=0;n<Ns.length&&t!==0&&t<Ns[n].priority;n++);Ns.splice(n,0,e),n===0&&hx(e)}};var P_=I_.version;if(P_!=="19.0.0")throw Error($(527,P_,"19.0.0"));ye.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error($(188)):(e=Object.keys(e).join(","),Error($(268,e)));return e=$M(t),e=e!==null?V_(e):null,e=e===null?null:e.stateNode,e};var vT={bundleType:0,version:"19.0.0",rendererPackageName:"react-dom",currentDispatcherRef:Ft,findFiberByHostInstance:ga,reconcilerVersion:"19.0.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(Mo=__REACT_DEVTOOLS_GLOBAL_HOOK__,!Mo.isDisabled&&Mo.supportsFiber))try{sl=Mo.inject(vT),Pn=Mo}catch{}var Mo;Du.createRoot=function(e,t){if(!B_(e))throw Error($(299));var n=!1,i="",s=ly,a=cy,r=uy,o=null;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onUncaughtError!==void 0&&(s=t.onUncaughtError),t.onCaughtError!==void 0&&(a=t.onCaughtError),t.onRecoverableError!==void 0&&(r=t.onRecoverableError),t.unstable_transitionCallbacks!==void 0&&(o=t.unstable_transitionCallbacks)),t=rx(e,1,!1,null,null,n,i,s,a,r,o,null),e[Dr]=t.current,tm(e.nodeType===8?e.parentNode:e),new rm(t)};Du.hydrateRoot=function(e,t,n){if(!B_(e))throw Error($(299));var i=!1,s="",a=ly,r=cy,o=uy,l=null,c=null;return n!=null&&(n.unstable_strictMode===!0&&(i=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onUncaughtError!==void 0&&(a=n.onUncaughtError),n.onCaughtError!==void 0&&(r=n.onCaughtError),n.onRecoverableError!==void 0&&(o=n.onRecoverableError),n.unstable_transitionCallbacks!==void 0&&(l=n.unstable_transitionCallbacks),n.formState!==void 0&&(c=n.formState)),t=rx(e,1,!0,t,n??null,i,s,a,r,o,l,c),t.context=ox(null),n=t.current,i=Bn(),s=Is(i),s.callback=null,Bs(n,s,i),t.current.lanes=i,rl(t,i),Oi(t),e[Dr]=t.current,tm(e),new Cu(t)};Du.version="19.0.0"});var mx=fi((f3,px)=>{"use strict";function dx(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(dx)}catch(e){console.error(e)}}dx(),px.exports=fx()});function yT(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function xT(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function wl(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function yS(){let e=wl("canvas");return e.style.display="block",e}function rg(...e){let t="THREE."+e.shift();Jr?Jr("log",t,...e):console.log(t,...e)}function xS(e){let t=e[0];if(typeof t=="string"&&t.startsWith("TSL:")){let n=e[1];n&&n.isStackTrace?e[0]+=" "+n.getLocation():e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Dt(...e){e=xS(e);let t="THREE."+e.shift();if(Jr)Jr("warn",t,...e);else{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function Ot(...e){e=xS(e);let t="THREE."+e.shift();if(Jr)Jr("error",t,...e);else{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function xl(...e){let t=e.join(" ");t in gx||(gx[t]=!0,Dt(...e))}function SS(e,t,n){return new Promise(function(i,s){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:s();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:i()}}setTimeout(a,n)})}function ro(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(fn[e&255]+fn[e>>8&255]+fn[e>>16&255]+fn[e>>24&255]+"-"+fn[t&255]+fn[t>>8&255]+"-"+fn[t>>16&15|64]+fn[t>>24&255]+"-"+fn[n&63|128]+fn[n>>8&255]+"-"+fn[n>>16&255]+fn[n>>24&255]+fn[i&255]+fn[i>>8&255]+fn[i>>16&255]+fn[i>>24&255]).toLowerCase()}function Jt(e,t,n){return Math.max(t,Math.min(n,e))}function og(e,t){return(e%t+t)%t}function ST(e,t,n,i,s){return i+(e-t)*(s-i)/(n-t)}function MT(e,t,n){return e!==t?(n-e)/(t-e):0}function Ml(e,t,n){return(1-n)*e+n*t}function bT(e,t,n,i){return Ml(e,t,1-Math.exp(-n*i))}function TT(e,t=1){return t-Math.abs(og(e,t*2)-t)}function ET(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function AT(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function wT(e,t){return e+Math.floor(Math.random()*(t-e+1))}function RT(e,t){return e+Math.random()*(t-e)}function CT(e){return e*(.5-Math.random())}function DT(e){e!==void 0&&(_x=e);let t=_x+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function LT(e){return e*Sl}function NT(e){return e*Qr}function UT(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function OT(e){return Math.pow(2,Math.ceil(Math.log(e)/Math.LN2))}function lg(e){return Math.pow(2,Math.floor(Math.log(e)/Math.LN2))}function PT(e,t,n,i,s){let a=Math.cos,r=Math.sin,o=a(n/2),l=r(n/2),c=a((t+i)/2),f=r((t+i)/2),p=a((t-i)/2),u=r((t-i)/2),d=a((i-t)/2),v=r((i-t)/2);switch(s){case"XYX":e.set(o*f,l*p,l*u,o*c);break;case"YZY":e.set(l*u,o*f,l*p,o*c);break;case"ZXZ":e.set(l*p,l*u,o*f,o*c);break;case"XZX":e.set(o*f,l*v,l*d,o*c);break;case"YXY":e.set(l*d,o*f,l*v,o*c);break;case"ZYZ":e.set(l*v,l*d,o*f,o*c);break;default:Dt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function cg(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function bS(e,t){if(t.constructor===Float32Array)return e;let n=cg(t);if(n===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(e/n,-1)}function TS(e,t){if(t.constructor===Float32Array)return e;let n=cg(t);if(n===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(e*n)}function IT(){let e={enabled:!0,workingColorSpace:Tl,spaces:{},convert:function(s,a,r){return this.enabled===!1||a===r||!a||!r||(this.spaces[a].transfer===re&&(s.r=ms(s.r),s.g=ms(s.g),s.b=ms(s.b)),this.spaces[a].primaries!==this.spaces[r].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===re&&(s.r=Zr(s.r),s.g=Zr(s.g),s.b=Zr(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===xs?El:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,r){return s.copy(this.spaces[r].fromXYZ).multiply(this.spaces[a].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return e.define({[Tl]:{primaries:t,whitePoint:i,transfer:El,toXYZ:yx,fromXYZ:xx,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:bn},outputColorSpaceConfig:{drawingBufferColorSpace:bn}},[bn]:{primaries:t,whitePoint:i,transfer:re,toXYZ:yx,fromXYZ:xx,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:bn}}}),e}function ms(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function Zr(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}function cm(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?hh.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(Dt("Texture: Unable to serialize Texture."),{})}function fm(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}function xm(e,t,n,i,s){for(let a=0,r=e.length-3;a<=r;a+=3){Ia.fromArray(e,a);let o=s.x*Math.abs(Ia.x)+s.y*Math.abs(Ia.y)+s.z*Math.abs(Ia.z),l=t.dot(Ia),c=n.dot(Ia),f=i.dot(Ia);if(Math.max(-Math.max(l,c,f),Math.min(l,c,f))>o)return!1}return!0}function jT(e,t,n,i,s,a,r,o){let l;if(t.side===wn?l=i.intersectTriangle(r,a,s,!0,o):l=i.intersectTriangle(s,a,r,t.side===zi,o),l===null)return null;Xu.copy(o),Xu.applyMatrix4(e.matrixWorld);let c=n.ray.origin.distanceTo(Xu);return c<n.near||c>n.far?null:{distance:c,point:Xu.clone(),object:e}}function qu(e,t,n,i,s,a,r,o,l,c){e.getVertexPosition(o,Gu),e.getVertexPosition(l,Vu),e.getVertexPosition(c,ku);let f=jT(e,t,n,i,Gu,Vu,ku,Lx);if(f){let p=new z;ta.getBarycoord(Lx,Gu,Vu,ku,p),s&&(f.uv=ta.getInterpolatedAttribute(s,o,l,c,p,new jt)),a&&(f.uv1=ta.getInterpolatedAttribute(a,o,l,c,p,new jt)),r&&(f.normal=ta.getInterpolatedAttribute(r,o,l,c,p,new z),f.normal.dot(i.direction)>0&&f.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new z,materialIndex:0};ta.getNormal(Gu,Vu,ku,u.normal),f.face=u,f.barycoord=p}return f}function Ox(e,t,n,i,s,a,r){let o=Dm.distanceSqToPoint(e);if(o<n){let l=new z;Dm.closestPointToPoint(e,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;a.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:r})}}function Xa(e){let t={};for(let n in e){t[n]={};for(let i in e[n]){let s=e[n][i];if(Px(s))s.isRenderTargetTexture?(Dt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null):t[n][i]=s.clone();else if(Array.isArray(s))if(Px(s[0])){let a=[];for(let r=0,o=s.length;r<o;r++)a[r]=s[r].clone();t[n][i]=a}else t[n][i]=s.slice();else t[n][i]=s}}return t}function pn(e){let t={};for(let n=0;n<e.length;n++){let i=Xa(e[n]);for(let s in i)t[s]=i[s]}return t}function Px(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function tE(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function ug(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Kt.workingColorSpace}function Xr(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT=="number"?new t(e):Array.prototype.slice.call(e)}function Ju(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}function wS(e,t,n,i,s){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*i+e*e*e*s}function iE(e,t,n,i,s){let a=1-e;return 3*a*a*(n-t)+6*a*e*(i-n)+3*e*e*(s-i)}function sE(e,t,n,i,s){let a=(e-t)/(s-t);for(let r=0;r<8;r++){let o=wS(a,t,n,i,s)-e;if(Math.abs(o)<1e-10)break;let l=iE(a,t,n,i,s);if(Math.abs(l)<1e-10)break;a=Math.max(0,Math.min(1,a-o/l))}return a}function Ix(e,t){for(let n=0,i=e.length;n!==i;n+=2)e[n]+=t}function Bx(e,t){for(let n=0,i=e.length;n!==i;n+=2)e[n]*=t}function dg(e,t,n,i){let s=dE(i);switch(n){case jm:return e*t;case tg:return e*t/s.components*s.byteLength;case Vh:return e*t/s.components*s.byteLength;case oa:return e*t*2/s.components*s.byteLength;case kh:return e*t*2/s.components*s.byteLength;case $m:return e*t*3/s.components*s.byteLength;case Ei:return e*t*4/s.components*s.byteLength;case Wh:return e*t*4/s.components*s.byteLength;case Xl:case ql:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Yl:case Zl:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case qh:case Zh:return Math.max(e,16)*Math.max(t,8)/4;case Xh:case Yh:return Math.max(e,8)*Math.max(t,8)/2;case Kh:case Jh:case jh:case $h:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Qh:case Kl:case tf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case ef:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case nf:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case sf:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case af:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case rf:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case of:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case lf:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case cf:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case uf:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case hf:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case ff:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case df:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case pf:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case mf:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case gf:case _f:case vf:return Math.ceil(e/4)*Math.ceil(t/4)*16;case yf:case xf:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Jl:case Sf:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function dE(e){switch(e){case qn:case Zm:return{byteLength:1,components:1};case ao:case Km:case Ti:return{byteLength:2,components:1};case Hh:case Gh:return{byteLength:2,components:4};case Mi:case zh:case bi:return{byteLength:4,components:1};case Jm:case Qm:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}var Ph,Hx,Um,Gx,kl,Vx,no,zi,wn,Hi,Ga,io,Om,Pm,Im,kx,Va,Wx,Xx,qx,Yx,Zx,Kx,Jx,Qx,Bm,Fm,jx,$x,tS,eS,nS,iS,sS,aS,rS,eh,nh,ih,Kr,sh,ah,rh,oh,zm,oS,lS,Gi,Hm,Gm,Vm,km,Wm,Xm,qm,Ym,ka,so,Ih,Bh,lh,Ii,ch,tn,cS,Wl,An,Fh,vs,qn,Zm,Km,ao,zh,Mi,bi,Ti,Hh,Gh,Wa,Jm,Qm,jm,$m,Ei,gs,ys,tg,Vh,oa,kh,Wh,Xl,ql,Yl,Zl,Xh,qh,Yh,Zh,Kh,Jh,Qh,jh,$h,Kl,tf,ef,nf,sf,af,rf,of,lf,cf,uf,hf,ff,df,pf,mf,gf,_f,vf,yf,xf,Jl,Sf,bl,uh,$u,Am,wm,Rm,Cm,uS,eg,hS,xs,bn,Tl,El,re,th,fS,dS,pS,mS,ng,gS,_S,ig,sg,vS,ag,oi,Al,gx,Jr,MS,Bi,fn,_x,Sl,Qr,ui,pg,jt,Fi,mg,z,om,vx,gg,Pt,lm,yx,xx,Kt,Pr,hh,BT,jr,FT,um,Ln,_g,De,fh,Vn,Rl,dh,Oh,Ce,Ir,vi,zT,HT,Ks,Lu,zn,Sx,Mx,ea,Cl,GT,bx,Br,cs,Nu,gl,VT,kT,Tx,Ex,Ax,wx,WT,Fr,hm,kn,ps,XT,$r,ES,Js,Uu,te,dn,Dl,yi,us,dm,hs,zr,Hr,Rx,pm,mm,gm,_m,vm,ym,ta,na,fs,xi,Ou,Gr,Vr,kr,Qs,js,Pa,_l,Pu,Iu,Ia,He,Bu,qT,Gn,Ll,Nl,En,YT,vl,Sm,za,ZT,ri,Mm,Wr,Hn,yl,$e,li,bm,KT,JT,Si,QT,ia,ds,Tm,Fu,zu,Ul,ph,Cx,Ba,Hu,Dx,Gu,Vu,ku,Em,Wu,Lx,Xu,ci,mh,Fa,$T,Yu,Ha,Nx,gh,_h,Ux,Dm,Zu,Ku,Ol,Pl,_s,Il,Bl,to,vh,Fl,zl,AS,eE,nE,Wn,yh,xh,Sh,sa,Mh,bh,Th,Eh,Xn,aa,Ah,wh,Rh,Hl,ra,Ch,Dh,RS,Lh,Qu,ju,Pi,Gl,$s,Fx,zx,Tn,Nh,qr,Yr,eo,Uh,hg,aE,fg,rE,oE,lE,cE,uE,hE,fE,Lm,Se,d3,Vl,vg,Nm,yg=Lf(()=>{Ph="187",Hx=0,Um=1,Gx=2,kl=1,Vx=2,no=3,zi=0,wn=1,Hi=2,Ga=0,io=1,Om=2,Pm=3,Im=4,kx=5,Va=100,Wx=101,Xx=102,qx=103,Yx=104,Zx=200,Kx=201,Jx=202,Qx=203,Bm=204,Fm=205,jx=206,$x=207,tS=208,eS=209,nS=210,iS=211,sS=212,aS=213,rS=214,eh=0,nh=1,ih=2,Kr=3,sh=4,ah=5,rh=6,oh=7,zm=0,oS=1,lS=2,Gi=0,Hm=1,Gm=2,Vm=3,km=4,Wm=5,Xm=6,qm=7,Ym=300,ka=301,so=302,Ih=303,Bh=304,lh=1e3,Ii=1001,ch=1002,tn=1003,cS=1004,Wl=1005,An=1006,Fh=1007,vs=1008,qn=1009,Zm=1010,Km=1011,ao=1012,zh=1013,Mi=1014,bi=1015,Ti=1016,Hh=1017,Gh=1018,Wa=1020,Jm=35902,Qm=35899,jm=1021,$m=1022,Ei=1023,gs=1026,ys=1027,tg=1028,Vh=1029,oa=1030,kh=1031,Wh=1033,Xl=33776,ql=33777,Yl=33778,Zl=33779,Xh=35840,qh=35841,Yh=35842,Zh=35843,Kh=36196,Jh=37492,Qh=37496,jh=37488,$h=37489,Kl=37490,tf=37491,ef=37808,nf=37809,sf=37810,af=37811,rf=37812,of=37813,lf=37814,cf=37815,uf=37816,hf=37817,ff=37818,df=37819,pf=37820,mf=37821,gf=36492,_f=36494,vf=36495,yf=36283,xf=36284,Jl=36285,Sf=36286,bl=2300,uh=2301,$u=2302,Am=2303,wm=2400,Rm=2401,Cm=2402,uS=3200,eg=0,hS=1,xs="",bn="srgb",Tl="srgb-linear",El="linear",re="srgb",th=7680,fS=519,dS=512,pS=513,mS=514,ng=515,gS=516,_S=517,ig=518,sg=519,vS=35044,ag="300 es",oi=2e3,Al=2001;gx={},Jr=null;MS={[eh]:eh,[ih]:rh,[sh]:sh,[Kr]:ah,[nh]:nh,[rh]:ih,[oh]:oh,[ah]:Kr},Bi=class{addEventListener(t,n){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(n)===-1&&i[t].push(n)}hasEventListener(t,n){let i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(n)!==-1}removeEventListener(t,n){let i=this._listeners;if(i===void 0)return;let s=i[t];if(s!==void 0){let a=s.indexOf(n);a!==-1&&s.splice(a,1)}}dispatchEvent(t){let n=this._listeners;if(n===void 0)return;let i=n[t.type];if(i!==void 0){t.target=this;let s=i.slice(0);for(let a=0,r=s.length;a<r;a++)s[a].call(this,t);t.target=null}}},fn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],_x=1234567,Sl=Math.PI/180,Qr=180/Math.PI;ui={DEG2RAD:Sl,RAD2DEG:Qr,generateUUID:ro,clamp:Jt,euclideanModulo:og,mapLinear:ST,inverseLerp:MT,lerp:Ml,damp:bT,pingpong:TT,smoothstep:ET,smootherstep:AT,randInt:wT,randFloat:RT,randFloatSpread:CT,seededRandom:DT,degToRad:LT,radToDeg:NT,isPowerOfTwo:UT,ceilPowerOfTwo:OT,floorPowerOfTwo:lg,setQuaternionFromProperEuler:PT,normalize:TS,denormalize:bS},pg=class pg{constructor(t=0,n=0){this.x=t,this.y=n}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,n){return this.x=t,this.y=n,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let n=this.x,i=this.y,s=t.elements;return this.x=s[0]*n+s[3]*i+s[6],this.y=s[1]*n+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,n){return this.x=Jt(this.x,t.x,n.x),this.y=Jt(this.y,t.y,n.y),this}clampScalar(t,n){return this.x=Jt(this.x,t,n),this.y=Jt(this.y,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Jt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(Jt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y;return n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this}rotateAround(t,n){let i=Math.cos(n),s=Math.sin(n),a=this.x-t.x,r=this.y-t.y;return this.x=a*i-r*s+t.x,this.y=a*s+r*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};pg.prototype.isVector2=!0;jt=pg,Fi=class{constructor(t=0,n=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=n,this._z=i,this._w=s}static slerpFlat(t,n,i,s,a,r,o){let l=i[s+0],c=i[s+1],f=i[s+2],p=i[s+3],u=a[r+0],d=a[r+1],v=a[r+2],T=a[r+3];if(p!==T||l!==u||c!==d||f!==v){let _=l*u+c*d+f*v+p*T;_<0&&(u=-u,d=-d,v=-v,T=-T,_=-_);let h=1-o;if(_<.9995){let m=Math.acos(_),y=Math.sin(m);h=Math.sin(h*m)/y,o=Math.sin(o*m)/y,l=l*h+u*o,c=c*h+d*o,f=f*h+v*o,p=p*h+T*o}else{l=l*h+u*o,c=c*h+d*o,f=f*h+v*o,p=p*h+T*o;let m=1/Math.sqrt(l*l+c*c+f*f+p*p);l*=m,c*=m,f*=m,p*=m}}t[n]=l,t[n+1]=c,t[n+2]=f,t[n+3]=p}static multiplyQuaternionsFlat(t,n,i,s,a,r){let o=i[s],l=i[s+1],c=i[s+2],f=i[s+3],p=a[r],u=a[r+1],d=a[r+2],v=a[r+3];return t[n]=o*v+f*p+l*d-c*u,t[n+1]=l*v+f*u+c*p-o*d,t[n+2]=c*v+f*d+o*u-l*p,t[n+3]=f*v-o*p-l*u-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,n,i,s){return this._x=t,this._y=n,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,n=!0){let i=t._x,s=t._y,a=t._z,r=t._order,o=Math.cos,l=Math.sin,c=o(i/2),f=o(s/2),p=o(a/2),u=l(i/2),d=l(s/2),v=l(a/2);switch(r){case"XYZ":this._x=u*f*p+c*d*v,this._y=c*d*p-u*f*v,this._z=c*f*v+u*d*p,this._w=c*f*p-u*d*v;break;case"YXZ":this._x=u*f*p+c*d*v,this._y=c*d*p-u*f*v,this._z=c*f*v-u*d*p,this._w=c*f*p+u*d*v;break;case"ZXY":this._x=u*f*p-c*d*v,this._y=c*d*p+u*f*v,this._z=c*f*v+u*d*p,this._w=c*f*p-u*d*v;break;case"ZYX":this._x=u*f*p-c*d*v,this._y=c*d*p+u*f*v,this._z=c*f*v-u*d*p,this._w=c*f*p+u*d*v;break;case"YZX":this._x=u*f*p+c*d*v,this._y=c*d*p+u*f*v,this._z=c*f*v-u*d*p,this._w=c*f*p-u*d*v;break;case"XZY":this._x=u*f*p-c*d*v,this._y=c*d*p-u*f*v,this._z=c*f*v+u*d*p,this._w=c*f*p+u*d*v;break;default:Dt("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,n){let i=n/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let n=t.elements,i=n[0],s=n[4],a=n[8],r=n[1],o=n[5],l=n[9],c=n[2],f=n[6],p=n[10],u=i+o+p;if(u>0){let d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(f-l)*d,this._y=(a-c)*d,this._z=(r-s)*d}else if(i>o&&i>p){let d=2*Math.sqrt(1+i-o-p);this._w=(f-l)/d,this._x=.25*d,this._y=(s+r)/d,this._z=(a+c)/d}else if(o>p){let d=2*Math.sqrt(1+o-i-p);this._w=(a-c)/d,this._x=(s+r)/d,this._y=.25*d,this._z=(l+f)/d}else{let d=2*Math.sqrt(1+p-i-o);this._w=(r-s)/d,this._x=(a+c)/d,this._y=(l+f)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,n){let i=t.dot(n)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*n.z-t.z*n.y,this._y=t.z*n.x-t.x*n.z,this._z=t.x*n.y-t.y*n.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Jt(this.dot(t),-1,1)))}rotateTowards(t,n){let i=this.angleTo(t);if(i===0)return this;let s=Math.min(1,n/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,n){let i=t._x,s=t._y,a=t._z,r=t._w,o=n._x,l=n._y,c=n._z,f=n._w;return this._x=i*f+r*o+s*c-a*l,this._y=s*f+r*l+a*o-i*c,this._z=a*f+r*c+i*l-s*o,this._w=r*f-i*o-s*l-a*c,this._onChangeCallback(),this}slerp(t,n){let i=t._x,s=t._y,a=t._z,r=t._w,o=this.dot(t);o<0&&(i=-i,s=-s,a=-a,r=-r,o=-o);let l=1-n;if(o<.9995){let c=Math.acos(o),f=Math.sin(c);l=Math.sin(l*c)/f,n=Math.sin(n*c)/f,this._x=this._x*l+i*n,this._y=this._y*l+s*n,this._z=this._z*l+a*n,this._w=this._w*l+r*n,this._onChangeCallback()}else this._x=this._x*l+i*n,this._y=this._y*l+s*n,this._z=this._z*l+a*n,this._w=this._w*l+r*n,this.normalize();return this}slerpQuaternions(t,n,i){return this.copy(t).slerp(n,i)}random(){let t=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),a*Math.sin(n),a*Math.cos(n))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,n=0){return this._x=t[n],this._y=t[n+1],this._z=t[n+2],this._w=t[n+3],this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._w,t}fromBufferAttribute(t,n){return this._x=t.getX(n),this._y=t.getY(n),this._z=t.getZ(n),this._w=t.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},mg=class mg{constructor(t=0,n=0,i=0){this.x=t,this.y=n,this.z=i}set(t,n,i){return i===void 0&&(i=this.z),this.x=t,this.y=n,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,n){return this.x=t.x*n.x,this.y=t.y*n.y,this.z=t.z*n.z,this}applyEuler(t){return this.applyQuaternion(vx.setFromEuler(t))}applyAxisAngle(t,n){return this.applyQuaternion(vx.setFromAxisAngle(t,n))}applyMatrix3(t){let n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[3]*i+a[6]*s,this.y=a[1]*n+a[4]*i+a[7]*s,this.z=a[2]*n+a[5]*i+a[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let n=this.x,i=this.y,s=this.z,a=t.elements,r=1/(a[3]*n+a[7]*i+a[11]*s+a[15]);return this.x=(a[0]*n+a[4]*i+a[8]*s+a[12])*r,this.y=(a[1]*n+a[5]*i+a[9]*s+a[13])*r,this.z=(a[2]*n+a[6]*i+a[10]*s+a[14])*r,this}applyQuaternion(t){let n=this.x,i=this.y,s=this.z,a=t.x,r=t.y,o=t.z,l=t.w,c=2*(r*s-o*i),f=2*(o*n-a*s),p=2*(a*i-r*n);return this.x=n+l*c+r*p-o*f,this.y=i+l*f+o*c-a*p,this.z=s+l*p+a*f-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[4]*i+a[8]*s,this.y=a[1]*n+a[5]*i+a[9]*s,this.z=a[2]*n+a[6]*i+a[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,n){return this.x=Jt(this.x,t.x,n.x),this.y=Jt(this.y,t.y,n.y),this.z=Jt(this.z,t.z,n.z),this}clampScalar(t,n){return this.x=Jt(this.x,t,n),this.y=Jt(this.y,t,n),this.z=Jt(this.z,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Jt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,n){let i=t.x,s=t.y,a=t.z,r=n.x,o=n.y,l=n.z;return this.x=s*l-a*o,this.y=a*r-i*l,this.z=i*o-s*r,this}projectOnVector(t){let n=t.lengthSq();if(n===0)return this.set(0,0,0);let i=t.dot(this)/n;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return om.copy(this).projectOnVector(t),this.sub(om)}reflect(t){return this.sub(om.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(Jt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return n*n+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,n,i){let s=Math.sin(n)*t;return this.x=s*Math.sin(i),this.y=Math.cos(n)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,n,i){return this.x=t*Math.sin(n),this.y=i,this.z=t*Math.cos(n),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(t){let n=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=n,this.y=i,this.z=s,this}setFromMatrixColumn(t,n){return this.fromArray(t.elements,n*4)}setFromMatrix3Column(t,n){return this.fromArray(t.elements,n*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(t),this.y=n,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};mg.prototype.isVector3=!0;z=mg,om=new z,vx=new Fi,gg=class gg{constructor(t,n,i,s,a,r,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,r,o,l,c)}set(t,n,i,s,a,r,o,l,c){let f=this.elements;return f[0]=t,f[1]=s,f[2]=o,f[3]=n,f[4]=a,f[5]=l,f[6]=i,f[7]=r,f[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(t,n,i){return t.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let n=t.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,s=n.elements,a=this.elements,r=i[0],o=i[3],l=i[6],c=i[1],f=i[4],p=i[7],u=i[2],d=i[5],v=i[8],T=s[0],_=s[3],h=s[6],m=s[1],y=s[4],x=s[7],E=s[2],A=s[5],g=s[8];return a[0]=r*T+o*m+l*E,a[3]=r*_+o*y+l*A,a[6]=r*h+o*x+l*g,a[1]=c*T+f*m+p*E,a[4]=c*_+f*y+p*A,a[7]=c*h+f*x+p*g,a[2]=u*T+d*m+v*E,a[5]=u*_+d*y+v*A,a[8]=u*h+d*x+v*g,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[3]*=t,n[6]*=t,n[1]*=t,n[4]*=t,n[7]*=t,n[2]*=t,n[5]*=t,n[8]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],f=t[8];return n*r*f-n*o*c-i*a*f+i*o*l+s*a*c-s*r*l}invert(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],f=t[8],p=f*r-o*c,u=o*l-f*a,d=c*a-r*l,v=n*p+i*u+s*d;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);let T=1/v;return t[0]=p*T,t[1]=(s*c-f*i)*T,t[2]=(o*i-s*r)*T,t[3]=u*T,t[4]=(f*n-s*l)*T,t[5]=(s*a-o*n)*T,t[6]=d*T,t[7]=(i*l-c*n)*T,t[8]=(r*n-i*a)*T,this}transpose(){let t,n=this.elements;return t=n[1],n[1]=n[3],n[3]=t,t=n[2],n[2]=n[6],n[6]=t,t=n[5],n[5]=n[7],n[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let n=this.elements;return t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8],this}setUvTransform(t,n,i,s,a,r,o){let l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*r+c*o)+r+t,-s*c,s*l,-s*(-c*r+l*o)+o+n,0,0,1),this}scale(t,n){return xl("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(lm.makeScale(t,n)),this}rotate(t){return xl("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(lm.makeRotation(-t)),this}translate(t,n){return xl("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(lm.makeTranslation(t,n)),this}makeTranslation(t,n){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,n,0,0,1),this}makeRotation(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(t,n){return this.set(t,0,0,0,n,0,0,0,1),this}equals(t){let n=this.elements,i=t.elements;for(let s=0;s<9;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<9;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}};gg.prototype.isMatrix3=!0;Pt=gg,lm=new Pt,yx=new Pt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),xx=new Pt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Kt=IT();hh=class{static getDataURL(t,n="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{Pr===void 0&&(Pr=wl("canvas")),Pr.width=t.width,Pr.height=t.height;let s=Pr.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),i=Pr}return i.toDataURL(n)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let n=wl("canvas");n.width=t.width,n.height=t.height;let i=n.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let s=i.getImageData(0,0,t.width,t.height),a=s.data;for(let r=0;r<a.length;r++)a[r]=ms(a[r]/255)*255;return i.putImageData(s,0,0),n}else if(t.data){let n=t.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(ms(n[i]/255)*255):n[i]=ms(n[i]);return{data:n,width:t.width,height:t.height}}else return Dt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},BT=0,jr=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:BT++}),this.uuid=ro(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?t.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?t.set(n.displayWidth,n.displayHeight,0):n!==null?t.set(n.width||0,n.height||0,n.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let r=0,o=s.length;r<o;r++)s[r].isDataTexture?a.push(cm(s[r].image)):a.push(cm(s[r]))}else a=cm(s);i.url=a}return n||(t.images[this.uuid]=i),i}};FT=0,um=new z,Ln=class e extends Bi{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,i=Ii,s=Ii,a=An,r=vs,o=Ei,l=qn,c=e.DEFAULT_ANISOTROPY,f=xs){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:FT++}),this.uuid=ro(),this.name="",this.source=new jr(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=a,this.minFilter=r,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new jt(0,0),this.repeat=new jt(1,1),this.center=new jt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Pt,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(um).x}get height(){return this.source.getSize(um).y}get depth(){return this.source.getSize(um).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let n in t){let i=t[n];if(i===void 0){Dt(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}let s=this[n];if(s===void 0){Dt(`Texture.setValues(): property '${n}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Ym)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case lh:t.x=t.x-Math.floor(t.x);break;case Ii:t.x=t.x<0?0:1;break;case ch:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case lh:t.y=t.y-Math.floor(t.y);break;case Ii:t.y=t.y<0?0:1;break;case ch:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ln.DEFAULT_IMAGE=null;Ln.DEFAULT_MAPPING=Ym;Ln.DEFAULT_ANISOTROPY=1;_g=class _g{constructor(t=0,n=0,i=0,s=1){this.x=t,this.y=n,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,n,i,s){return this.x=t,this.y=n,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this.w=t.w+n.w,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this.w+=t.w*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this.w=t.w-n.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let n=this.x,i=this.y,s=this.z,a=this.w,r=t.elements;return this.x=r[0]*n+r[4]*i+r[8]*s+r[12]*a,this.y=r[1]*n+r[5]*i+r[9]*s+r[13]*a,this.z=r[2]*n+r[6]*i+r[10]*s+r[14]*a,this.w=r[3]*n+r[7]*i+r[11]*s+r[15]*a,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let n=Math.sqrt(1-t.w*t.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/n,this.y=t.y/n,this.z=t.z/n),this}setAxisAngleFromRotationMatrix(t){let n,i,s,a,l=t.elements,c=l[0],f=l[4],p=l[8],u=l[1],d=l[5],v=l[9],T=l[2],_=l[6],h=l[10];if(Math.abs(f-u)<.01&&Math.abs(p-T)<.01&&Math.abs(v-_)<.01){if(Math.abs(f+u)<.1&&Math.abs(p+T)<.1&&Math.abs(v+_)<.1&&Math.abs(c+d+h-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;let y=(c+1)/2,x=(d+1)/2,E=(h+1)/2,A=(f+u)/4,g=(p+T)/4,M=(v+_)/4;return y>x&&y>E?y<.01?(i=0,s=.707106781,a=.707106781):(i=Math.sqrt(y),s=A/i,a=g/i):x>E?x<.01?(i=.707106781,s=0,a=.707106781):(s=Math.sqrt(x),i=A/s,a=M/s):E<.01?(i=.707106781,s=.707106781,a=0):(a=Math.sqrt(E),i=g/a,s=M/a),this.set(i,s,a,n),this}let m=Math.sqrt((_-v)*(_-v)+(p-T)*(p-T)+(u-f)*(u-f));return Math.abs(m)<.001&&(m=1),this.x=(_-v)/m,this.y=(p-T)/m,this.z=(u-f)/m,this.w=Math.acos((c+d+h-1)/2),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,n){return this.x=Jt(this.x,t.x,n.x),this.y=Jt(this.y,t.y,n.y),this.z=Jt(this.z,t.z,n.z),this.w=Jt(this.w,t.w,n.w),this}clampScalar(t,n){return this.x=Jt(this.x,t,n),this.y=Jt(this.y,t,n),this.z=Jt(this.z,t,n),this.w=Jt(this.w,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Jt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this.w+=(t.w-this.w)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this.w=t.w+(n.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this.w=t[n+3],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t[n+3]=this.w,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this.w=t.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};_g.prototype.isVector4=!0;De=_g,fh=class extends Bi{constructor(t=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:An,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=n,this.depth=i.depth,this.scissor=new De(0,0,t,n),this.scissorTest=!1,this.viewport=new De(0,0,t,n),this.textures=[];let s=i.count;for(let a=0;a<s;a++)this.textures[a]=new Ln({width:t,height:n,depth:i.depth}),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){let n={minFilter:An,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(n.mapping=t.mapping),t.wrapS!==void 0&&(n.wrapS=t.wrapS),t.wrapT!==void 0&&(n.wrapT=t.wrapT),t.wrapR!==void 0&&(n.wrapR=t.wrapR),t.magFilter!==void 0&&(n.magFilter=t.magFilter),t.minFilter!==void 0&&(n.minFilter=t.minFilter),t.format!==void 0&&(n.format=t.format),t.type!==void 0&&(n.type=t.type),t.anisotropy!==void 0&&(n.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(n.colorSpace=t.colorSpace),t.flipY!==void 0&&(n.flipY=t.flipY),t.generateMipmaps!==void 0&&(n.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(n.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(n.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,n,i=1){if(this.width!==t||this.height!==n||this.depth!==i){this.width=t,this.height=n,this.depth=i;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=t,this.textures[s].image.height=n,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,n),this.scissor.set(0,0,t,n)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++){this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;let s=Object.assign({},t.textures[n].image);this.textures[n].source=new jr(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let n=t.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Vn=class extends fh{constructor(t=1,n=1,i={}){super(t,n,i),this.isWebGLRenderTarget=!0}},Rl=class extends Ln{constructor(t=null,n=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=Ii,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}},dh=class extends Ln{constructor(t=null,n=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=Ii,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}},Oh=class Oh{constructor(t,n,i,s,a,r,o,l,c,f,p,u,d,v,T,_){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,r,o,l,c,f,p,u,d,v,T,_)}set(t,n,i,s,a,r,o,l,c,f,p,u,d,v,T,_){let h=this.elements;return h[0]=t,h[4]=n,h[8]=i,h[12]=s,h[1]=a,h[5]=r,h[9]=o,h[13]=l,h[2]=c,h[6]=f,h[10]=p,h[14]=u,h[3]=d,h[7]=v,h[11]=T,h[15]=_,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Oh().fromArray(this.elements)}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(t){let n=this.elements,i=t.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(t){let n=t.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(t,n,i){return this.determinantAffine()===0?(t.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,n,i){return this.set(t.x,n.x,i.x,0,t.y,n.y,i.y,0,t.z,n.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let n=this.elements,i=t.elements,s=1/Ir.setFromMatrixColumn(t,0).length(),a=1/Ir.setFromMatrixColumn(t,1).length(),r=1/Ir.setFromMatrixColumn(t,2).length();return n[0]=i[0]*s,n[1]=i[1]*s,n[2]=i[2]*s,n[3]=0,n[4]=i[4]*a,n[5]=i[5]*a,n[6]=i[6]*a,n[7]=0,n[8]=i[8]*r,n[9]=i[9]*r,n[10]=i[10]*r,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(t){let n=this.elements,i=t.x,s=t.y,a=t.z,r=Math.cos(i),o=Math.sin(i),l=Math.cos(s),c=Math.sin(s),f=Math.cos(a),p=Math.sin(a);if(t.order==="XYZ"){let u=r*f,d=r*p,v=o*f,T=o*p;n[0]=l*f,n[4]=-l*p,n[8]=c,n[1]=d+v*c,n[5]=u-T*c,n[9]=-o*l,n[2]=T-u*c,n[6]=v+d*c,n[10]=r*l}else if(t.order==="YXZ"){let u=l*f,d=l*p,v=c*f,T=c*p;n[0]=u+T*o,n[4]=v*o-d,n[8]=r*c,n[1]=r*p,n[5]=r*f,n[9]=-o,n[2]=d*o-v,n[6]=T+u*o,n[10]=r*l}else if(t.order==="ZXY"){let u=l*f,d=l*p,v=c*f,T=c*p;n[0]=u-T*o,n[4]=-r*p,n[8]=v+d*o,n[1]=d+v*o,n[5]=r*f,n[9]=T-u*o,n[2]=-r*c,n[6]=o,n[10]=r*l}else if(t.order==="ZYX"){let u=r*f,d=r*p,v=o*f,T=o*p;n[0]=l*f,n[4]=v*c-d,n[8]=u*c+T,n[1]=l*p,n[5]=T*c+u,n[9]=d*c-v,n[2]=-c,n[6]=o*l,n[10]=r*l}else if(t.order==="YZX"){let u=r*l,d=r*c,v=o*l,T=o*c;n[0]=l*f,n[4]=T-u*p,n[8]=v*p+d,n[1]=p,n[5]=r*f,n[9]=-o*f,n[2]=-c*f,n[6]=d*p+v,n[10]=u-T*p}else if(t.order==="XZY"){let u=r*l,d=r*c,v=o*l,T=o*c;n[0]=l*f,n[4]=-p,n[8]=c*f,n[1]=u*p+T,n[5]=r*f,n[9]=d*p-v,n[2]=v*p-d,n[6]=o*f,n[10]=T*p+u}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(t){return this.compose(zT,t,HT)}lookAt(t,n,i){let s=this.elements;return zn.subVectors(t,n),zn.lengthSq()===0&&(zn.z=1),zn.normalize(),Ks.crossVectors(i,zn),Ks.lengthSq()===0&&(Math.abs(i.z)===1?zn.x+=1e-4:zn.z+=1e-4,zn.normalize(),Ks.crossVectors(i,zn)),Ks.normalize(),Lu.crossVectors(zn,Ks),s[0]=Ks.x,s[4]=Lu.x,s[8]=zn.x,s[1]=Ks.y,s[5]=Lu.y,s[9]=zn.y,s[2]=Ks.z,s[6]=Lu.z,s[10]=zn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,s=n.elements,a=this.elements,r=i[0],o=i[4],l=i[8],c=i[12],f=i[1],p=i[5],u=i[9],d=i[13],v=i[2],T=i[6],_=i[10],h=i[14],m=i[3],y=i[7],x=i[11],E=i[15],A=s[0],g=s[4],M=s[8],N=s[12],R=s[1],O=s[5],F=s[9],q=s[13],L=s[2],W=s[6],Z=s[10],G=s[14],nt=s[3],V=s[7],j=s[11],tt=s[15];return a[0]=r*A+o*R+l*L+c*nt,a[4]=r*g+o*O+l*W+c*V,a[8]=r*M+o*F+l*Z+c*j,a[12]=r*N+o*q+l*G+c*tt,a[1]=f*A+p*R+u*L+d*nt,a[5]=f*g+p*O+u*W+d*V,a[9]=f*M+p*F+u*Z+d*j,a[13]=f*N+p*q+u*G+d*tt,a[2]=v*A+T*R+_*L+h*nt,a[6]=v*g+T*O+_*W+h*V,a[10]=v*M+T*F+_*Z+h*j,a[14]=v*N+T*q+_*G+h*tt,a[3]=m*A+y*R+x*L+E*nt,a[7]=m*g+y*O+x*W+E*V,a[11]=m*M+y*F+x*Z+E*j,a[15]=m*N+y*q+x*G+E*tt,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[4]*=t,n[8]*=t,n[12]*=t,n[1]*=t,n[5]*=t,n[9]*=t,n[13]*=t,n[2]*=t,n[6]*=t,n[10]*=t,n[14]*=t,n[3]*=t,n[7]*=t,n[11]*=t,n[15]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[4],s=t[8],a=t[12],r=t[1],o=t[5],l=t[9],c=t[13],f=t[2],p=t[6],u=t[10],d=t[14],v=t[3],T=t[7],_=t[11],h=t[15],m=l*d-c*u,y=o*d-c*p,x=o*u-l*p,E=r*d-c*f,A=r*u-l*f,g=r*p-o*f;return n*(T*m-_*y+h*x)-i*(v*m-_*E+h*A)+s*(v*y-T*E+h*g)-a*(v*x-T*A+_*g)}determinantAffine(){let t=this.elements,n=t[0],i=t[4],s=t[8],a=t[1],r=t[5],o=t[9],l=t[2],c=t[6],f=t[10];return n*(r*f-o*c)-i*(a*f-o*l)+s*(a*c-r*l)}transpose(){let t=this.elements,n;return n=t[1],t[1]=t[4],t[4]=n,n=t[2],t[2]=t[8],t[8]=n,n=t[6],t[6]=t[9],t[9]=n,n=t[3],t[3]=t[12],t[12]=n,n=t[7],t[7]=t[13],t[13]=n,n=t[11],t[11]=t[14],t[14]=n,this}setPosition(t,n,i){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=n,s[14]=i),this}invert(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],f=t[8],p=t[9],u=t[10],d=t[11],v=t[12],T=t[13],_=t[14],h=t[15],m=n*o-i*r,y=n*l-s*r,x=n*c-a*r,E=i*l-s*o,A=i*c-a*o,g=s*c-a*l,M=f*T-p*v,N=f*_-u*v,R=f*h-d*v,O=p*_-u*T,F=p*h-d*T,q=u*h-d*_,L=m*q-y*F+x*O+E*R-A*N+g*M;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let W=1/L;return t[0]=(o*q-l*F+c*O)*W,t[1]=(s*F-i*q-a*O)*W,t[2]=(T*g-_*A+h*E)*W,t[3]=(u*A-p*g-d*E)*W,t[4]=(l*R-r*q-c*N)*W,t[5]=(n*q-s*R+a*N)*W,t[6]=(_*x-v*g-h*y)*W,t[7]=(f*g-u*x+d*y)*W,t[8]=(r*F-o*R+c*M)*W,t[9]=(i*R-n*F-a*M)*W,t[10]=(v*A-T*x+h*m)*W,t[11]=(p*x-f*A-d*m)*W,t[12]=(o*N-r*O-l*M)*W,t[13]=(n*O-i*N+s*M)*W,t[14]=(T*y-v*E-_*m)*W,t[15]=(f*E-p*y+u*m)*W,this}scale(t){let n=this.elements,i=t.x,s=t.y,a=t.z;return n[0]*=i,n[4]*=s,n[8]*=a,n[1]*=i,n[5]*=s,n[9]*=a,n[2]*=i,n[6]*=s,n[10]*=a,n[3]*=i,n[7]*=s,n[11]*=a,this}getMaxScaleOnAxis(){let t=this.elements,n=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(n,i,s))}makeTranslation(t,n,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(t){let n=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,n){let i=Math.cos(n),s=Math.sin(n),a=1-i,r=t.x,o=t.y,l=t.z,c=a*r,f=a*o;return this.set(c*r+i,c*o-s*l,c*l+s*o,0,c*o+s*l,f*o+i,f*l-s*r,0,c*l-s*o,f*l+s*r,a*l*l+i,0,0,0,0,1),this}makeScale(t,n,i){return this.set(t,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,n,i,s,a,r){return this.set(1,i,a,0,t,1,r,0,n,s,1,0,0,0,0,1),this}compose(t,n,i){let s=this.elements,a=n._x,r=n._y,o=n._z,l=n._w,c=a+a,f=r+r,p=o+o,u=a*c,d=a*f,v=a*p,T=r*f,_=r*p,h=o*p,m=l*c,y=l*f,x=l*p,E=i.x,A=i.y,g=i.z;return s[0]=(1-(T+h))*E,s[1]=(d+x)*E,s[2]=(v-y)*E,s[3]=0,s[4]=(d-x)*A,s[5]=(1-(u+h))*A,s[6]=(_+m)*A,s[7]=0,s[8]=(v+y)*g,s[9]=(_-m)*g,s[10]=(1-(u+T))*g,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,n,i){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let a=this.determinantAffine();if(a===0)return i.set(1,1,1),n.identity(),this;let r=Ir.set(s[0],s[1],s[2]).length(),o=Ir.set(s[4],s[5],s[6]).length(),l=Ir.set(s[8],s[9],s[10]).length();a<0&&(r=-r),vi.copy(this);let c=1/r,f=1/o,p=1/l;return vi.elements[0]*=c,vi.elements[1]*=c,vi.elements[2]*=c,vi.elements[4]*=f,vi.elements[5]*=f,vi.elements[6]*=f,vi.elements[8]*=p,vi.elements[9]*=p,vi.elements[10]*=p,n.setFromRotationMatrix(vi),i.x=r,i.y=o,i.z=l,this}makePerspective(t,n,i,s,a,r,o=oi,l=!1){let c=this.elements,f=2*a/(n-t),p=2*a/(i-s),u=(n+t)/(n-t),d=(i+s)/(i-s),v,T;if(l)v=a/(r-a),T=r*a/(r-a);else if(o===oi)v=-(r+a)/(r-a),T=-2*r*a/(r-a);else if(o===Al)v=-r/(r-a),T=-r*a/(r-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=f,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=p,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=v,c[14]=T,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,n,i,s,a,r,o=oi,l=!1){let c=this.elements,f=2/(n-t),p=2/(i-s),u=-(n+t)/(n-t),d=-(i+s)/(i-s),v,T;if(l)v=1/(r-a),T=r/(r-a);else if(o===oi)v=-2/(r-a),T=-(r+a)/(r-a);else if(o===Al)v=-1/(r-a),T=-a/(r-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=f,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=p,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=v,c[14]=T,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let n=this.elements,i=t.elements;for(let s=0;s<16;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<16;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t[n+9]=i[9],t[n+10]=i[10],t[n+11]=i[11],t[n+12]=i[12],t[n+13]=i[13],t[n+14]=i[14],t[n+15]=i[15],t}};Oh.prototype.isMatrix4=!0;Ce=Oh,Ir=new z,vi=new Ce,zT=new z(0,0,0),HT=new z(1,1,1),Ks=new z,Lu=new z,zn=new z,Sx=new Ce,Mx=new Fi,ea=class e{constructor(t=0,n=0,i=0,s=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,n,i,s=this._order){return this._x=t,this._y=n,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,i=!0){let s=t.elements,a=s[0],r=s[4],o=s[8],l=s[1],c=s[5],f=s[9],p=s[2],u=s[6],d=s[10];switch(n){case"XYZ":this._y=Math.asin(Jt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-f,d),this._z=Math.atan2(-r,a)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Jt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-p,a),this._z=0);break;case"ZXY":this._x=Math.asin(Jt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-p,d),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Jt(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(u,d),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(Jt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-f,c),this._y=Math.atan2(-p,a)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-Jt(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-f,d),this._y=0);break;default:Dt("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,n,i){return Sx.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Sx,n,i)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return Mx.setFromEuler(this),this.setFromQuaternion(Mx,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ea.DEFAULT_ORDER="XYZ";Cl=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},GT=0,bx=new z,Br=new Fi,cs=new Ce,Nu=new z,gl=new z,VT=new z,kT=new Fi,Tx=new z(1,0,0),Ex=new z(0,1,0),Ax=new z(0,0,1),wx={type:"added"},WT={type:"removed"},Fr={type:"childadded",child:null},hm={type:"childremoved",child:null},kn=class e extends Bi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:GT++}),this.uuid=ro(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new z,n=new ea,i=new Fi,s=new z(1,1,1);function a(){i.setFromEuler(n,!1)}function r(){n.setFromQuaternion(i,void 0,!1)}n._onChange(a),i._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Ce},normalMatrix:{value:new Pt}}),this.matrix=new Ce,this.matrixWorld=new Ce,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Cl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,n){return Br.setFromAxisAngle(t,n),this.quaternion.multiply(Br),this}rotateOnWorldAxis(t,n){return Br.setFromAxisAngle(t,n),this.quaternion.premultiply(Br),this}rotateX(t){return this.rotateOnAxis(Tx,t)}rotateY(t){return this.rotateOnAxis(Ex,t)}rotateZ(t){return this.rotateOnAxis(Ax,t)}translateOnAxis(t,n){return bx.copy(t).applyQuaternion(this.quaternion),this.position.add(bx.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(Tx,t)}translateY(t){return this.translateOnAxis(Ex,t)}translateZ(t){return this.translateOnAxis(Ax,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(cs.copy(this.matrixWorld).invert())}lookAt(t,n,i){t.isVector3?Nu.copy(t):Nu.set(t,n,i);let s=this.parent;this.updateWorldMatrix(!0,!1),gl.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?cs.lookAt(gl,Nu,this.up):cs.lookAt(Nu,gl,this.up),this.quaternion.setFromRotationMatrix(cs),s&&(cs.extractRotation(s.matrixWorld),Br.setFromRotationMatrix(cs),this.quaternion.premultiply(Br.invert()))}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(Ot("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(wx),Fr.child=t,this.dispatchEvent(Fr),Fr.child=null):Ot("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(WT),hm.child=t,this.dispatchEvent(hm),hm.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),cs.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),cs.multiply(t.parent.matrixWorld)),t.applyMatrix4(cs),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(wx),Fr.child=t,this.dispatchEvent(Fr),Fr.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let i=0,s=this.children.length;i<s;i++){let r=this.children[i].getObjectByProperty(t,n);if(r!==void 0)return r}}getObjectsByProperty(t,n,i=[]){this[t]===n&&i.push(this);let s=this.children;for(let a=0,r=s.length;a<r;a++)s[a].getObjectsByProperty(t,n,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(gl,t,VT),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(gl,kT,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverseVisible(t)}traverseAncestors(t){let n=this.parent;n!==null&&(t(n),n.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let n=t.x,i=t.y,s=t.z,a=this.matrix.elements;a[12]+=n-a[0]*n-a[4]*i-a[8]*s,a[13]+=i-a[1]*n-a[5]*i-a[9]*s,a[14]+=s-a[2]*n-a[6]*i-a[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].updateMatrixWorld(t)}updateWorldMatrix(t,n,i=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){let a=this.children;for(let r=0,o=a.length;r<o;r++)a[r].updateWorldMatrix(!1,!0,i)}}toJSON(t){let n=t===void 0||typeof t=="string",i={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,f=l.length;c<f;c++){let p=l[c];a(t.shapes,p)}else a(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(t.materials,this.material[l]));s.material=o}else s.material=a(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(a(t.animations,l))}}if(n){let o=r(t.geometries),l=r(t.materials),c=r(t.textures),f=r(t.images),p=r(t.shapes),u=r(t.skeletons),d=r(t.animations),v=r(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),f.length>0&&(i.images=f),p.length>0&&(i.shapes=p),u.length>0&&(i.skeletons=u),d.length>0&&(i.animations=d),v.length>0&&(i.nodes=v)}return i.object=s,i;function r(o){let l=[];for(let c in o){let f=o[c];delete f.metadata,l.push(f)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===!0)for(let i=0;i<t.children.length;i++){let s=t.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};kn.DEFAULT_UP=new z(0,1,0);kn.DEFAULT_MATRIX_AUTO_UPDATE=!0;kn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;ps=class extends kn{constructor(){super(),this.isGroup=!0,this.type="Group"}},XT={type:"move"},$r=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ps,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ps,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ps,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let n=this._hand;if(n)for(let i of t.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,n,i){let s=null,a=null,r=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&n.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(let T of t.hand.values()){let _=n.getJointPose(T,i),h=this._getHandJoint(c,T);_!==null&&(h.matrix.fromArray(_.transform.matrix),h.matrix.decompose(h.position,h.quaternion,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=_.radius),h.visible=_!==null}let f=c.joints["index-finger-tip"],p=c.joints["thumb-tip"],u=f.position.distanceTo(p.position),d=.02,v=.005;c.inputState.pinching&&u>d+v?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=d-v&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(a=n.getPose(t.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=n.getPose(t.targetRaySpace,i),s===null&&a!==null&&(s=a),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(XT)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,n){if(t.joints[n.jointName]===void 0){let i=new ps;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[n.jointName]=i,t.add(i)}return t.joints[n.jointName]}},ES={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Js={h:0,s:0,l:0},Uu={h:0,s:0,l:0};te=class{constructor(t,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,n,i)}set(t,n,i){if(n===void 0&&i===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,n,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,n=bn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Kt.colorSpaceToWorking(this,n),this}setRGB(t,n,i,s=Kt.workingColorSpace){return this.r=t,this.g=n,this.b=i,Kt.colorSpaceToWorking(this,s),this}setHSL(t,n,i,s=Kt.workingColorSpace){if(t=og(t,1),n=Jt(n,0,1),i=Jt(i,0,1),n===0)this.r=this.g=this.b=i;else{let a=i<=.5?i*(1+n):i+n-i*n,r=2*i-a;this.r=fm(r,a,t+1/3),this.g=fm(r,a,t),this.b=fm(r,a,t-1/3)}return Kt.colorSpaceToWorking(this,s),this}setStyle(t,n=bn){function i(a){a!==void 0&&parseFloat(a)<1&&Dt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let a,r=s[1],o=s[2];switch(r){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,n);if(a=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(100,parseFloat(a[1]))/100,Math.min(100,parseFloat(a[2]))/100,Math.min(100,parseFloat(a[3]))/100,n);break;case"hsl":case"hsla":if(a=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,n);break;default:Dt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let a=s[1],r=a.length;if(r===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,n);if(r===6)return this.setHex(parseInt(a,16),n);Dt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,n);return this}setColorName(t,n=bn){let i=ES[t.toLowerCase()];return i!==void 0?this.setHex(i,n):Dt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ms(t.r),this.g=ms(t.g),this.b=ms(t.b),this}copyLinearToSRGB(t){return this.r=Zr(t.r),this.g=Zr(t.g),this.b=Zr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=bn){return Kt.workingToColorSpace(dn.copy(this),t),Math.round(Jt(dn.r*255,0,255))*65536+Math.round(Jt(dn.g*255,0,255))*256+Math.round(Jt(dn.b*255,0,255))}getHexString(t=bn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,n=Kt.workingColorSpace){Kt.workingToColorSpace(dn.copy(this),n);let i=dn.r,s=dn.g,a=dn.b,r=Math.max(i,s,a),o=Math.min(i,s,a),l,c,f=(o+r)/2;if(o===r)l=0,c=0;else{let p=r-o;switch(c=f<=.5?p/(r+o):p/(2-r-o),r){case i:l=(s-a)/p+(s<a?6:0);break;case s:l=(a-i)/p+2;break;case a:l=(i-s)/p+4;break}l/=6}return t.h=l,t.s=c,t.l=f,t}getRGB(t,n=Kt.workingColorSpace){return Kt.workingToColorSpace(dn.copy(this),n),t.r=dn.r,t.g=dn.g,t.b=dn.b,t}getStyle(t=bn){Kt.workingToColorSpace(dn.copy(this),t);let n=dn.r,i=dn.g,s=dn.b;return t!==bn?`color(${t} ${n.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,n,i){return this.getHSL(Js),this.setHSL(Js.h+t,Js.s+n,Js.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,n){return this.r=t.r+n.r,this.g=t.g+n.g,this.b=t.b+n.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,n){return this.r+=(t.r-this.r)*n,this.g+=(t.g-this.g)*n,this.b+=(t.b-this.b)*n,this}lerpColors(t,n,i){return this.r=t.r+(n.r-t.r)*i,this.g=t.g+(n.g-t.g)*i,this.b=t.b+(n.b-t.b)*i,this}lerpHSL(t,n){this.getHSL(Js),t.getHSL(Uu);let i=Ml(Js.h,Uu.h,n),s=Ml(Js.s,Uu.s,n),a=Ml(Js.l,Uu.l,n);return this.setHSL(i,s,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let n=this.r,i=this.g,s=this.b,a=t.elements;return this.r=a[0]*n+a[3]*i+a[6]*s,this.g=a[1]*n+a[4]*i+a[7]*s,this.b=a[2]*n+a[5]*i+a[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,n=0){return this.r=t[n],this.g=t[n+1],this.b=t[n+2],this}toArray(t=[],n=0){return t[n]=this.r,t[n+1]=this.g,t[n+2]=this.b,t}fromBufferAttribute(t,n){return this.r=t.getX(n),this.g=t.getY(n),this.b=t.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},dn=new te;te.NAMES=ES;Dl=class extends kn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ea,this.environmentIntensity=1,this.environmentRotation=new ea,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,n){return super.copy(t,n),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let n=super.toJSON(t);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}},yi=new z,us=new z,dm=new z,hs=new z,zr=new z,Hr=new z,Rx=new z,pm=new z,mm=new z,gm=new z,_m=new De,vm=new De,ym=new De,ta=class e{constructor(t=new z,n=new z,i=new z){this.a=t,this.b=n,this.c=i}static getNormal(t,n,i,s){s.subVectors(i,n),yi.subVectors(t,n),s.cross(yi);let a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(t,n,i,s,a){yi.subVectors(s,n),us.subVectors(i,n),dm.subVectors(t,n);let r=yi.dot(yi),o=yi.dot(us),l=yi.dot(dm),c=us.dot(us),f=us.dot(dm),p=r*c-o*o;if(p===0)return a.set(0,0,0),null;let u=1/p,d=(c*l-o*f)*u,v=(r*f-o*l)*u;return a.set(1-d-v,v,d)}static containsPoint(t,n,i,s){return this.getBarycoord(t,n,i,s,hs)===null?!1:hs.x>=0&&hs.y>=0&&hs.x+hs.y<=1}static getInterpolation(t,n,i,s,a,r,o,l){return this.getBarycoord(t,n,i,s,hs)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,hs.x),l.addScaledVector(r,hs.y),l.addScaledVector(o,hs.z),l)}static getInterpolatedAttribute(t,n,i,s,a,r){return _m.setScalar(0),vm.setScalar(0),ym.setScalar(0),_m.fromBufferAttribute(t,n),vm.fromBufferAttribute(t,i),ym.fromBufferAttribute(t,s),r.setScalar(0),r.addScaledVector(_m,a.x),r.addScaledVector(vm,a.y),r.addScaledVector(ym,a.z),r}static isFrontFacing(t,n,i,s){return yi.subVectors(i,n),us.subVectors(t,n),yi.cross(us).dot(s)<0}set(t,n,i){return this.a.copy(t),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(t,n,i,s){return this.a.copy(t[n]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,n,i,s){return this.a.fromBufferAttribute(t,n),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return yi.subVectors(this.c,this.b),us.subVectors(this.a,this.b),yi.cross(us).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,i,s,a){return e.getInterpolation(t,this.a,this.b,this.c,n,i,s,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,n){let i=this.a,s=this.b,a=this.c,r,o;zr.subVectors(s,i),Hr.subVectors(a,i),pm.subVectors(t,i);let l=zr.dot(pm),c=Hr.dot(pm);if(l<=0&&c<=0)return n.copy(i);mm.subVectors(t,s);let f=zr.dot(mm),p=Hr.dot(mm);if(f>=0&&p<=f)return n.copy(s);let u=l*p-f*c;if(u<=0&&l>=0&&f<=0&&l-f>0)return r=l/(l-f),n.copy(i).addScaledVector(zr,r);gm.subVectors(t,a);let d=zr.dot(gm),v=Hr.dot(gm);if(v>=0&&d<=v)return n.copy(a);let T=d*c-l*v;if(T<=0&&c>=0&&v<=0)return o=c/(c-v),n.copy(i).addScaledVector(Hr,o);let _=f*v-d*p;if(_<=0&&p-f>=0&&d-v>=0)return Rx.subVectors(a,s),o=(p-f)/(p-f+(d-v)),n.copy(s).addScaledVector(Rx,o);let h=1/(_+T+u);return r=T*h,o=u*h,n.copy(i).addScaledVector(zr,r).addScaledVector(Hr,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},na=class{constructor(t=new z(1/0,1/0,1/0),n=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=n}set(t,n){return this.min.copy(t),this.max.copy(n),this}setFromArray(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n+=3)this.expandByPoint(xi.fromArray(t,n));return this}setFromBufferAttribute(t){this.makeEmpty();for(let n=0,i=t.count;n<i;n++)this.expandByPoint(xi.fromBufferAttribute(t,n));return this}setFromPoints(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n++)this.expandByPoint(t[n]);return this}setFromCenterAndSize(t,n){let i=xi.copy(n).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,n=!1){return this.makeEmpty(),this.expandByObject(t,n)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,n=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let a=i.getAttribute("position");if(n===!0&&a!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let r=0,o=a.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,xi):xi.fromBufferAttribute(a,r),xi.applyMatrix4(t.matrixWorld),this.expandByPoint(xi);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ou.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ou.copy(i.boundingBox)),Ou.applyMatrix4(t.matrixWorld),this.union(Ou)}let s=t.children;for(let a=0,r=s.length;a<r;a++)this.expandByObject(s[a],n);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,n){return n.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,xi),xi.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let n,i;return t.normal.x>0?(n=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(n=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(n+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(n+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(n+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(n+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),n<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(_l),Pu.subVectors(this.max,_l),Gr.subVectors(t.a,_l),Vr.subVectors(t.b,_l),kr.subVectors(t.c,_l),Qs.subVectors(Vr,Gr),js.subVectors(kr,Vr),Pa.subVectors(Gr,kr);let n=[0,-Qs.z,Qs.y,0,-js.z,js.y,0,-Pa.z,Pa.y,Qs.z,0,-Qs.x,js.z,0,-js.x,Pa.z,0,-Pa.x,-Qs.y,Qs.x,0,-js.y,js.x,0,-Pa.y,Pa.x,0];return!xm(n,Gr,Vr,kr,Pu)||(n=[1,0,0,0,1,0,0,0,1],!xm(n,Gr,Vr,kr,Pu))?!1:(Iu.crossVectors(Qs,js),n=[Iu.x,Iu.y,Iu.z],xm(n,Gr,Vr,kr,Pu))}clampPoint(t,n){return n.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,xi).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(xi).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(fs[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),fs[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),fs[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),fs[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),fs[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),fs[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),fs[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),fs[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(fs),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},fs=[new z,new z,new z,new z,new z,new z,new z,new z],xi=new z,Ou=new na,Gr=new z,Vr=new z,kr=new z,Qs=new z,js=new z,Pa=new z,_l=new z,Pu=new z,Iu=new z,Ia=new z;He=new z,Bu=new jt,qT=0,Gn=class extends Bi{constructor(t,n,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:qT++}),this.name="",this.array=t,this.itemSize=n,this.count=t!==void 0?t.length/n:0,this.normalized=i,this.usage=vS,this.updateRanges=[],this.gpuType=bi,this.version=0,this._normalizationScale=t!==void 0?cg(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,n,i){t*=this.itemSize,i*=n.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[t+s]=n.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)Bu.fromBufferAttribute(this,n),Bu.applyMatrix3(t),this.setXY(n,Bu.x,Bu.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)He.fromBufferAttribute(this,n),He.applyMatrix3(t),this.setXYZ(n,He.x,He.y,He.z);return this}applyMatrix4(t){for(let n=0,i=this.count;n<i;n++)He.fromBufferAttribute(this,n),He.applyMatrix4(t),this.setXYZ(n,He.x,He.y,He.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)He.fromBufferAttribute(this,n),He.applyNormalMatrix(t),this.setXYZ(n,He.x,He.y,He.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)He.fromBufferAttribute(this,n),He.transformDirection(t),this.setXYZ(n,He.x,He.y,He.z);return this}set(t,n=0){return this.array.set(t,n),this}getComponent(t,n){let i=this.array[t*this.itemSize+n];return this.normalized&&(i=this._denormalize(i)),i}setComponent(t,n,i){return this.normalized&&(i=this._normalize(i)),this.array[t*this.itemSize+n]=i,this}getX(t){let n=this.array[t*this.itemSize];return this.normalized&&(n=this._denormalize(n)),n}setX(t,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize]=n,this}getY(t){let n=this.array[t*this.itemSize+1];return this.normalized&&(n=this._denormalize(n)),n}setY(t,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+1]=n,this}getZ(t){let n=this.array[t*this.itemSize+2];return this.normalized&&(n=this._denormalize(n)),n}setZ(t,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+2]=n,this}getW(t){let n=this.array[t*this.itemSize+3];return this.normalized&&(n=this._denormalize(n)),n}setW(t,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+3]=n,this}setXY(t,n,i){return t*=this.itemSize,this.normalized&&(n=this._normalize(n),i=this._normalize(i)),this.array[t+0]=n,this.array[t+1]=i,this}setXYZ(t,n,i,s){return t*=this.itemSize,this.normalized&&(n=this._normalize(n),i=this._normalize(i),s=this._normalize(s)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t*=this.itemSize,this.normalized&&(n=this._normalize(n),i=this._normalize(i),s=this._normalize(s),a=this._normalize(a)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(t){let n=this._normalizationScale;return n!==void 0?Math.max(t/n,-1):bS(t,this.array)}_normalize(t){let n=this._normalizationScale;return n!==void 0?Math.round(t*n):TS(t,this.array)}},Ll=class extends Gn{constructor(t,n,i){super(new Uint16Array(t),n,i)}},Nl=class extends Gn{constructor(t,n,i){super(new Uint32Array(t),n,i)}},En=class extends Gn{constructor(t,n,i){super(new Float32Array(t),n,i)}},YT=new na,vl=new z,Sm=new z,za=class{constructor(t=new z,n=-1){this.isSphere=!0,this.center=t,this.radius=n}set(t,n){return this.center.copy(t),this.radius=n,this}setFromPoints(t,n){let i=this.center;n!==void 0?i.copy(n):YT.setFromPoints(t).getCenter(i);let s=0;for(let a=0,r=t.length;a<r;a++)s=Math.max(s,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let n=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=n*n}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,n){let i=this.center.distanceToSquared(t);return n.copy(t),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;vl.subVectors(t,this.center);let n=vl.lengthSq();if(n>this.radius*this.radius){let i=Math.sqrt(n),s=(i-this.radius)*.5;this.center.addScaledVector(vl,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Sm.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(vl.copy(t.center).add(Sm)),this.expandByPoint(vl.copy(t.center).sub(Sm))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},ZT=0,ri=new Ce,Mm=new kn,Wr=new z,Hn=new na,yl=new na,$e=new z,li=class e extends Bi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ZT++}),this.uuid=ro(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(yT(t)?Nl:Ll)(t,1):this.index=t,this}setIndirect(t,n=0){return this.indirect=t,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,n){return this.attributes[t]=n,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,n,i=0){this.groups.push({start:t,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,n){this.drawRange.start=t,this.drawRange.count=n}applyMatrix4(t){let n=this.attributes.position;n!==void 0&&(n.applyMatrix4(t),n.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let a=new Pt().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return ri.makeRotationFromQuaternion(t),this.applyMatrix4(ri),this}rotateX(t){return ri.makeRotationX(t),this.applyMatrix4(ri),this}rotateY(t){return ri.makeRotationY(t),this.applyMatrix4(ri),this}rotateZ(t){return ri.makeRotationZ(t),this.applyMatrix4(ri),this}translate(t,n,i){return ri.makeTranslation(t,n,i),this.applyMatrix4(ri),this}scale(t,n,i){return ri.makeScale(t,n,i),this.applyMatrix4(ri),this}lookAt(t){return Mm.lookAt(t),Mm.updateMatrix(),this.applyMatrix4(Mm.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Wr).negate(),this.translate(Wr.x,Wr.y,Wr.z),this}setFromPoints(t){let n=this.getAttribute("position");if(n===void 0){let i=[];for(let s=0,a=t.length;s<a;s++){let r=t[s];i.push(r.x,r.y,r.z||0)}this.setAttribute("position",new En(i,3))}else{let i=Math.min(t.length,n.count);for(let s=0;s<i;s++){let a=t[s];n.setXYZ(s,a.x,a.y,a.z||0)}t.length>n.count&&Dt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new na);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Ot("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let i=0,s=n.length;i<s;i++){let a=n[i];Hn.setFromBufferAttribute(a),this.morphTargetsRelative?($e.addVectors(this.boundingBox.min,Hn.min),this.boundingBox.expandByPoint($e),$e.addVectors(this.boundingBox.max,Hn.max),this.boundingBox.expandByPoint($e)):(this.boundingBox.expandByPoint(Hn.min),this.boundingBox.expandByPoint(Hn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ot('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new za);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Ot("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(t){let i=this.boundingSphere.center;if(Hn.setFromBufferAttribute(t),n)for(let a=0,r=n.length;a<r;a++){let o=n[a];yl.setFromBufferAttribute(o),this.morphTargetsRelative?($e.addVectors(Hn.min,yl.min),Hn.expandByPoint($e),$e.addVectors(Hn.max,yl.max),Hn.expandByPoint($e)):(Hn.expandByPoint(yl.min),Hn.expandByPoint(yl.max))}Hn.getCenter(i);let s=0;for(let a=0,r=t.count;a<r;a++)$e.fromBufferAttribute(t,a),s=Math.max(s,i.distanceToSquared($e));if(n)for(let a=0,r=n.length;a<r;a++){let o=n[a],l=this.morphTargetsRelative;for(let c=0,f=o.count;c<f;c++)$e.fromBufferAttribute(o,c),l&&(Wr.fromBufferAttribute(t,c),$e.add(Wr)),s=Math.max(s,i.distanceToSquared($e))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Ot('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,n=this.attributes;if(t===null||n.position===void 0||n.normal===void 0||n.uv===void 0){Ot("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=n.position,s=n.normal,a=n.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==i.count)&&(r=new Gn(new Float32Array(4*i.count),4),this.setAttribute("tangent",r));let o=[],l=[],c=new Uint8Array(i.count);for(let N=0;N<i.count;N++)o[N]=new z,l[N]=new z;let f=new z,p=new z,u=new z,d=new jt,v=new jt,T=new jt,_=new z,h=new z;function m(N,R,O){c[N]=c[R]=c[O]=1,f.fromBufferAttribute(i,N),p.fromBufferAttribute(i,R),u.fromBufferAttribute(i,O),d.fromBufferAttribute(a,N),v.fromBufferAttribute(a,R),T.fromBufferAttribute(a,O),p.sub(f),u.sub(f),v.sub(d),T.sub(d);let F=1/(v.x*T.y-T.x*v.y);isFinite(F)&&(_.copy(p).multiplyScalar(T.y).addScaledVector(u,-v.y).multiplyScalar(F),h.copy(u).multiplyScalar(v.x).addScaledVector(p,-T.x).multiplyScalar(F),o[N].add(_),o[R].add(_),o[O].add(_),l[N].add(h),l[R].add(h),l[O].add(h))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let N=0,R=y.length;N<R;++N){let O=y[N],F=O.start,q=O.count;for(let L=F,W=F+q;L<W;L+=3)m(t.getX(L+0),t.getX(L+1),t.getX(L+2))}let x=new z,E=new z,A=new z,g=new z;function M(N){A.fromBufferAttribute(s,N),g.copy(A);let R=o[N];x.copy(R),x.sub(A.multiplyScalar(A.dot(R))).normalize(),E.crossVectors(g,R);let F=E.dot(l[N])<0?-1:1;r.setXYZW(N,x.x,x.y,x.z,F)}for(let N=0,R=i.count;N<R;++N)c[N]&&M(N);this._transformed=!0}computeVertexNormals(){let t=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new Gn(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let u=0,d=i.count;u<d;u++)i.setXYZ(u,0,0,0);let s=new z,a=new z,r=new z,o=new z,l=new z,c=new z,f=new z,p=new z;if(t)for(let u=0,d=t.count;u<d;u+=3){let v=t.getX(u+0),T=t.getX(u+1),_=t.getX(u+2);s.fromBufferAttribute(n,v),a.fromBufferAttribute(n,T),r.fromBufferAttribute(n,_),f.subVectors(r,a),p.subVectors(s,a),f.cross(p),o.fromBufferAttribute(i,v),l.fromBufferAttribute(i,T),c.fromBufferAttribute(i,_),o.add(f),l.add(f),c.add(f),i.setXYZ(v,o.x,o.y,o.z),i.setXYZ(T,l.x,l.y,l.z),i.setXYZ(_,c.x,c.y,c.z)}else for(let u=0,d=n.count;u<d;u+=3)s.fromBufferAttribute(n,u+0),a.fromBufferAttribute(n,u+1),r.fromBufferAttribute(n,u+2),f.subVectors(r,a),p.subVectors(s,a),f.cross(p),i.setXYZ(u+0,f.x,f.y,f.z),i.setXYZ(u+1,f.x,f.y,f.z),i.setXYZ(u+2,f.x,f.y,f.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let n=0,i=t.count;n<i;n++)$e.fromBufferAttribute(t,n),$e.normalize(),t.setXYZ(n,$e.x,$e.y,$e.z)}toNonIndexed(){function t(o,l){let c=o.array,f=o.itemSize,p=o.normalized,u=new c.constructor(l.length*f),d=0,v=0;for(let T=0,_=l.length;T<_;T++){o.isInterleavedBufferAttribute?d=l[T]*o.data.stride+o.offset:d=l[T]*f;for(let h=0;h<f;h++)u[v++]=c[d++]}return new Gn(u,f,p)}if(this.index===null)return Dt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let n=new e,i=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,i);n.setAttribute(o,c)}let a=this.morphAttributes;for(let o in a){let l=[],c=a[o];for(let f=0,p=c.length;f<p;f++){let u=c[f],d=t(u,i);l.push(d)}n.morphAttributes[o]=l}n.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let o=0,l=r.length;o<l;o++){let c=r[o];n.addGroup(c.start,c.count,c.materialIndex)}return n}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let n=this.index;n!==null&&(t.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});let i=this.attributes;for(let l in i){let c=i[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},a=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],f=[];for(let p=0,u=c.length;p<u;p++){let d=c[p];f.push(d.toJSON(t.data))}f.length>0&&(s[l]=f,a=!0)}a&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let n={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone());let s=t.attributes;for(let c in s){let f=s[c];this.setAttribute(c,f.clone(n))}let a=t.morphAttributes;for(let c in a){let f=[],p=a[c];for(let u=0,d=p.length;u<d;u++)f.push(p[u].clone(n));this.morphAttributes[c]=f}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let c=0,f=r.length;c<f;c++){let p=r[c];this.addGroup(p.start,p.count,p.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},bm=new z,KT=new z,JT=new Pt,Si=class{constructor(t=new z(1,0,0),n=0){this.isPlane=!0,this.normal=t,this.constant=n}set(t,n){return this.normal.copy(t),this.constant=n,this}setComponents(t,n,i,s){return this.normal.set(t,n,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,n){return this.normal.copy(t),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(t,n,i){let s=bm.subVectors(i,n).cross(KT.subVectors(t,n)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,n){return n.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,n,i=!0){let s=t.delta(bm),a=this.normal.dot(s);if(a===0)return this.distanceToPoint(t.start)===0?n.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/a;return i===!0&&(r<0||r>1)?null:n.copy(t.start).addScaledVector(s,r)}intersectsLine(t){let n=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return n<0&&i>0||i<0&&n>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,n){let i=n||JT.getNormalMatrix(t),s=this.coplanarPoint(bm).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},QT=0,ia=class extends Bi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:QT++}),this.uuid=ro(),this.name="",this.type="Material",this.blending=io,this.side=zi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Bm,this.blendDst=Fm,this.blendEquation=Va,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new te(0,0,0),this.blendAlpha=0,this.depthFunc=Kr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=fS,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=th,this.stencilZFail=th,this.stencilZPass=th,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let n in t){let i=t[n];if(i===void 0){Dt(`Material: parameter '${n}' has value of undefined.`);continue}let s=this[n];if(s===void 0){Dt(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(i.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(i.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(i.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(i.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(a){let r=[];for(let o in a){let l=a[o];delete l.metadata,r.push(l)}return r}if(n){let a=s(t.textures),r=s(t.images);a.length>0&&(i.textures=a),r.length>0&&(i.images=r)}return i}fromJSON(t,n){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new te().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new Si().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=n[t.map]||null),t.matcap!==void 0&&(this.matcap=n[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=n[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=n[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=n[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new jt().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=n[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=n[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=n[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=n[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=n[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=n[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=n[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=n[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=n[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=n[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=n[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new jt().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=n[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=n[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=n[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=n[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=n[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=n[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let n=t.clippingPlanes,i=null;if(n!==null){let s=n.length;i=new Array(s);for(let a=0;a!==s;++a)i[a]=n[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},ds=new z,Tm=new z,Fu=new z,zu=new z,Ul=class{constructor(t=new z,n=new z(0,0,-1)){this.origin=t,this.direction=n}set(t,n){return this.origin.copy(t),this.direction.copy(n),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,n){return n.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,ds)),this}closestPointToPoint(t,n){n.subVectors(t,this.origin);let i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let n=ds.subVectors(t,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(t):(ds.copy(this.origin).addScaledVector(this.direction,n),ds.distanceToSquared(t))}distanceSqToSegment(t,n,i,s){Tm.copy(t).add(n).multiplyScalar(.5),Fu.copy(n).sub(t).normalize(),zu.copy(this.origin).sub(Tm);let a=t.distanceTo(n)*.5,r=-this.direction.dot(Fu),o=zu.dot(this.direction),l=-zu.dot(Fu),c=zu.lengthSq(),f=Math.abs(1-r*r),p,u,d,v;if(f>0)if(p=r*l-o,u=r*o-l,v=a*f,p>=0)if(u>=-v)if(u<=v){let T=1/f;p*=T,u*=T,d=p*(p+r*u+2*o)+u*(r*p+u+2*l)+c}else u=a,p=Math.max(0,-(r*u+o)),d=-p*p+u*(u+2*l)+c;else u=-a,p=Math.max(0,-(r*u+o)),d=-p*p+u*(u+2*l)+c;else u<=-v?(p=Math.max(0,-(-r*a+o)),u=p>0?-a:Math.min(Math.max(-a,-l),a),d=-p*p+u*(u+2*l)+c):u<=v?(p=0,u=Math.min(Math.max(-a,-l),a),d=u*(u+2*l)+c):(p=Math.max(0,-(r*a+o)),u=p>0?a:Math.min(Math.max(-a,-l),a),d=-p*p+u*(u+2*l)+c);else u=r>0?-a:a,p=Math.max(0,-(r*u+o)),d=-p*p+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,p),s&&s.copy(Tm).addScaledVector(Fu,u),d}intersectSphere(t,n){if(t.radius<0)return null;ds.subVectors(t.center,this.origin);let i=ds.dot(this.direction),s=ds.dot(ds)-i*i,a=t.radius*t.radius;if(s>a)return null;let r=Math.sqrt(a-s),o=i-r,l=i+r;return l<0?null:o<0?this.at(l,n):this.at(o,n)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let n=t.normal.dot(this.direction);if(n===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/n;return i>=0?i:null}intersectPlane(t,n){let i=this.distanceToPlane(t);return i===null?null:this.at(i,n)}intersectsPlane(t){let n=t.distanceToPoint(this.origin);return n===0||t.normal.dot(this.direction)*n<0}intersectBox(t,n){let i,s,a,r,o,l,c=1/this.direction.x,f=1/this.direction.y,p=1/this.direction.z,u=this.origin;return c>=0?(i=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(i=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),f>=0?(a=(t.min.y-u.y)*f,r=(t.max.y-u.y)*f):(a=(t.max.y-u.y)*f,r=(t.min.y-u.y)*f),i>r||a>s||((a>i||isNaN(i))&&(i=a),(r<s||isNaN(s))&&(s=r),p>=0?(o=(t.min.z-u.z)*p,l=(t.max.z-u.z)*p):(o=(t.max.z-u.z)*p,l=(t.min.z-u.z)*p),i>l||o>s)||((o>i||i!==i)&&(i=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,n)}intersectsBox(t){return this.intersectBox(t,ds)!==null}intersectTriangle(t,n,i,s,a){let r=this.origin,o=this.direction,l=o.x,c=o.y,f=o.z,p=t.x-r.x,u=t.y-r.y,d=t.z-r.z,v=n.x-r.x,T=n.y-r.y,_=n.z-r.z,h=i.x-r.x,m=i.y-r.y,y=i.z-r.z,x=Math.abs(l),E=Math.abs(c),A=Math.abs(f),g,M,N,R,O,F,q,L,W,Z,G,nt;if(x>=E&&x>=A?(N=l,F=p,W=v,nt=h,l>=0?(g=c,M=f,R=u,O=d,q=T,L=_,Z=m,G=y):(g=f,M=c,R=d,O=u,q=_,L=T,Z=y,G=m)):E>=A?(N=c,F=u,W=T,nt=m,c>=0?(g=f,M=l,R=d,O=p,q=_,L=v,Z=y,G=h):(g=l,M=f,R=p,O=d,q=v,L=_,Z=h,G=y)):(N=f,F=d,W=_,nt=y,f>=0?(g=l,M=c,R=p,O=u,q=v,L=T,Z=h,G=m):(g=c,M=l,R=u,O=p,q=T,L=v,Z=m,G=h)),N===0)return null;let V=g/N,j=M/N,tt=1/N,yt=R-V*F,Lt=O-j*F,k=q-V*W,dt=L-j*W,vt=Z-V*nt,At=G-j*nt,pt=vt*dt-At*k,Nt=yt*At-Lt*vt,Me=k*Lt-dt*yt;if(s){if(pt<0||Nt<0||Me<0)return null}else if((pt<0||Nt<0||Me<0)&&(pt>0||Nt>0||Me>0))return null;let Tt=pt+Nt+Me;if(Tt===0)return null;let ie=tt*(pt*F+Nt*W+Me*nt);return(Tt>0?ie<0:ie>0)?null:this.at(ie/Tt,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ph=class extends ia{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new te(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ea,this.combine=zm,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},Cx=new Ce,Ba=new Ul,Hu=new za,Dx=new z,Gu=new z,Vu=new z,ku=new z,Em=new z,Wu=new z,Lx=new z,Xu=new z,ci=class extends kn{constructor(t=new li,n=new ph){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(t,n){let i=this.geometry,s=i.attributes.position,a=i.morphAttributes.position,r=i.morphTargetsRelative;n.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(a&&o){Wu.set(0,0,0);for(let l=0,c=a.length;l<c;l++){let f=o[l],p=a[l];f!==0&&(Em.fromBufferAttribute(p,t),r?Wu.addScaledVector(Em,f):Wu.addScaledVector(Em.sub(n),f))}n.add(Wu)}return n}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Hu.copy(i.boundingSphere),Hu.applyMatrix4(a),Ba.copy(t.ray).recast(t.near),!(Hu.containsPoint(Ba.origin)===!1&&(Ba.intersectSphere(Hu,Dx)===null||Ba.origin.distanceToSquared(Dx)>(t.far-t.near)**2))&&(Cx.copy(a).invert(),Ba.copy(t.ray).applyMatrix4(Cx),!(i.boundingBox!==null&&Ba.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,n,Ba)))}_computeIntersections(t,n,i){let s,a=this.geometry,r=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,f=a.attributes.uv1,p=a.attributes.normal,u=a.groups,d=a.drawRange;if(o!==null)if(Array.isArray(r))for(let v=0,T=u.length;v<T;v++){let _=u[v],h=r[_.materialIndex],m=Math.max(_.start,d.start),y=Math.min(o.count,Math.min(_.start+_.count,d.start+d.count));for(let x=m,E=y;x<E;x+=3){let A=o.getX(x),g=o.getX(x+1),M=o.getX(x+2);s=qu(this,h,t,i,c,f,p,A,g,M),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=_.materialIndex,n.push(s))}}else{let v=Math.max(0,d.start),T=Math.min(o.count,d.start+d.count);for(let _=v,h=T;_<h;_+=3){let m=o.getX(_),y=o.getX(_+1),x=o.getX(_+2);s=qu(this,r,t,i,c,f,p,m,y,x),s&&(s.faceIndex=Math.floor(_/3),n.push(s))}}else if(l!==void 0)if(Array.isArray(r))for(let v=0,T=u.length;v<T;v++){let _=u[v],h=r[_.materialIndex],m=Math.max(_.start,d.start),y=Math.min(l.count,Math.min(_.start+_.count,d.start+d.count));for(let x=m,E=y;x<E;x+=3){let A=x,g=x+1,M=x+2;s=qu(this,h,t,i,c,f,p,A,g,M),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=_.materialIndex,n.push(s))}}else{let v=Math.max(0,d.start),T=Math.min(l.count,d.start+d.count);for(let _=v,h=T;_<h;_+=3){let m=_,y=_+1,x=_+2;s=qu(this,r,t,i,c,f,p,m,y,x),s&&(s.faceIndex=Math.floor(_/3),n.push(s))}}}};mh=class extends Ln{constructor(t=null,n=1,i=1,s,a,r,o,l,c=tn,f=tn,p,u){super(null,r,o,l,c,f,s,a,p,u),this.isDataTexture=!0,this.image={data:t,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Fa=new za,$T=new jt(.5,.5),Yu=new z,Ha=class{constructor(t=new Si,n=new Si,i=new Si,s=new Si,a=new Si,r=new Si){this.planes=[t,n,i,s,a,r]}set(t,n,i,s,a,r){let o=this.planes;return o[0].copy(t),o[1].copy(n),o[2].copy(i),o[3].copy(s),o[4].copy(a),o[5].copy(r),this}copy(t){let n=this.planes;for(let i=0;i<6;i++)n[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,n=oi,i=!1){let s=this.planes,a=t.elements,r=a[0],o=a[1],l=a[2],c=a[3],f=a[4],p=a[5],u=a[6],d=a[7],v=a[8],T=a[9],_=a[10],h=a[11],m=a[12],y=a[13],x=a[14],E=a[15];if(s[0].setComponents(c-r,d-f,h-v,E-m).normalize(),s[1].setComponents(c+r,d+f,h+v,E+m).normalize(),s[2].setComponents(c+o,d+p,h+T,E+y).normalize(),s[3].setComponents(c-o,d-p,h-T,E-y).normalize(),i)s[4].setComponents(l,u,_,x).normalize(),s[5].setComponents(c-l,d-u,h-_,E-x).normalize();else if(s[4].setComponents(c-l,d-u,h-_,E-x).normalize(),n===oi)s[5].setComponents(c+l,d+u,h+_,E+x).normalize();else if(n===Al)s[5].setComponents(l,u,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Fa.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let n=t.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),Fa.copy(n.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Fa)}intersectsSprite(t){Fa.center.set(0,0,0);let n=$T.distanceTo(t.center);return Fa.radius=.7071067811865476+n,Fa.applyMatrix4(t.matrixWorld),this.intersectsSphere(Fa)}intersectsSphere(t){let n=this.planes,i=t.center,s=-t.radius;for(let a=0;a<6;a++)if(n[a].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){let n=this.planes;for(let i=0;i<6;i++){let s=n[i];if(Yu.x=s.normal.x>0?t.max.x:t.min.x,Yu.y=s.normal.y>0?t.max.y:t.min.y,Yu.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Yu)<0)return!1}return!0}containsPoint(t){let n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Nx=new Ce,gh=class e{constructor(){this.coordinateSystem=oi,this._frustums=[],this._count=0}setFromArrayCamera(t){let n=t.cameras,i=this._frustums;for(let s=0;s<n.length;s++){let a=n[s];Nx.multiplyMatrices(a.projectionMatrix,a.matrixWorldInverse),i[s]===void 0&&(i[s]=new Ha),i[s].setFromProjectionMatrix(Nx,a.coordinateSystem,a.reversedDepth)}return this._count=n.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].intersectsObject(t))return!0;return!1}intersectsSprite(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].intersectsSprite(t))return!0;return!1}intersectsSphere(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].intersectsSphere(t))return!0;return!1}intersectsBox(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].intersectsBox(t))return!0;return!1}containsPoint(t){let n=this._frustums;for(let i=0;i<this._count;i++)if(n[i].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;let n=this._frustums,i=t._frustums;for(let s=0;s<t._count;s++)n[s]===void 0&&(n[s]=new Ha),n[s].copy(i[s]);return this._count=t._count,this}clone(){return new e().copy(this)}},_h=class extends ia{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new te(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Ux=new Ce,Dm=new Ul,Zu=new za,Ku=new z,Ol=class extends kn{constructor(t=new li,n=new _h){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.matrixWorld,a=t.params.Points.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Zu.copy(i.boundingSphere),Zu.applyMatrix4(s),Zu.radius+=a,t.ray.intersectsSphere(Zu)===!1)return;Ux.copy(s).invert(),Dm.copy(t.ray).applyMatrix4(Ux);let o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,p=i.attributes.position;if(c!==null){let u=Math.max(0,r.start),d=Math.min(c.count,r.start+r.count);for(let v=u,T=d;v<T;v++){let _=c.getX(v);Ku.fromBufferAttribute(p,_),Ox(Ku,_,l,s,t,n,this)}}else{let u=Math.max(0,r.start),d=Math.min(p.count,r.start+r.count);for(let v=u,T=d;v<T;v++)Ku.fromBufferAttribute(p,v),Ox(Ku,v,l,s,t,n,this)}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}};Pl=class extends Ln{constructor(t=[],n=ka,i,s,a,r,o,l,c,f){super(t,n,i,s,a,r,o,l,c,f),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},_s=class extends Ln{constructor(t,n,i=Mi,s,a,r,o=tn,l=tn,c,f=gs,p=1){if(f!==gs&&f!==ys)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:t,height:n,depth:p};super(u,s,a,r,o,l,f,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new jr(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let n=super.toJSON(t);return n.compareFunction=this.compareFunction,n}},Il=class extends _s{constructor(t,n=Mi,i=ka,s,a,r=tn,o=tn,l,c=gs){let f={width:t,height:t,depth:1},p=[f,f,f,f,f,f];super(t,t,n,i,s,a,r,o,l,c),this.image=p,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},Bl=class extends Ln{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},to=class e extends li{constructor(t=1,n=1,i=1,s=1,a=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:n,depth:i,widthSegments:s,heightSegments:a,depthSegments:r};let o=this;s=Math.floor(s),a=Math.floor(a),r=Math.floor(r);let l=[],c=[],f=[],p=[],u=0,d=0;v("z","y","x",-1,-1,i,n,t,r,a,0),v("z","y","x",1,-1,i,n,-t,r,a,1),v("x","z","y",1,1,t,i,n,s,r,2),v("x","z","y",1,-1,t,i,-n,s,r,3),v("x","y","z",1,-1,t,n,i,s,a,4),v("x","y","z",-1,-1,t,n,-i,s,a,5),this.setIndex(l),this.setAttribute("position",new En(c,3)),this.setAttribute("normal",new En(f,3)),this.setAttribute("uv",new En(p,2));function v(T,_,h,m,y,x,E,A,g,M,N){let R=x/g,O=E/M,F=x/2,q=E/2,L=A/2,W=g+1,Z=M+1,G=0,nt=0,V=new z;for(let j=0;j<Z;j++){let tt=j*O-q;for(let yt=0;yt<W;yt++){let Lt=yt*R-F;V[T]=Lt*m,V[_]=tt*y,V[h]=L,c.push(V.x,V.y,V.z),V[T]=0,V[_]=0,V[h]=A>0?1:-1,f.push(V.x,V.y,V.z),p.push(yt/g),p.push(1-j/M),G+=1}}for(let j=0;j<M;j++)for(let tt=0;tt<g;tt++){let yt=u+tt+W*j,Lt=u+tt+W*(j+1),k=u+(tt+1)+W*(j+1),dt=u+(tt+1)+W*j;l.push(yt,Lt,dt),l.push(Lt,k,dt),nt+=6}o.addGroup(d,nt,N),d+=nt,u+=G}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},vh=class e extends li{constructor(t=[],n=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:n,radius:i,detail:s};let a=[],r=[];o(s),c(i),f(),this.setAttribute("position",new En(a,3)),this.setAttribute("normal",new En(a.slice(),3)),this.setAttribute("uv",new En(r,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(m){let y=new z,x=new z,E=new z;for(let A=0;A<n.length;A+=3)d(n[A+0],y),d(n[A+1],x),d(n[A+2],E),l(y,x,E,m)}function l(m,y,x,E){let A=E+1,g=[];for(let M=0;M<=A;M++){g[M]=[];let N=m.clone().lerp(x,M/A),R=y.clone().lerp(x,M/A),O=A-M;for(let F=0;F<=O;F++)F===0&&M===A?g[M][F]=N:g[M][F]=N.clone().lerp(R,F/O)}for(let M=0;M<A;M++)for(let N=0;N<2*(A-M)-1;N++){let R=Math.floor(N/2);N%2===0?(u(g[M][R+1]),u(g[M+1][R]),u(g[M][R])):(u(g[M][R+1]),u(g[M+1][R+1]),u(g[M+1][R]))}}function c(m){let y=new z;for(let x=0;x<a.length;x+=3)y.x=a[x+0],y.y=a[x+1],y.z=a[x+2],y.normalize().multiplyScalar(m),a[x+0]=y.x,a[x+1]=y.y,a[x+2]=y.z}function f(){let m=new z;for(let y=0;y<a.length;y+=3){m.x=a[y+0],m.y=a[y+1],m.z=a[y+2];let x=_(m)/2/Math.PI+.5,E=h(m)/Math.PI+.5;r.push(x,1-E)}v(),p()}function p(){for(let m=0;m<r.length;m+=6){let y=r[m+0],x=r[m+2],E=r[m+4],A=Math.max(y,x,E),g=Math.min(y,x,E);A>.9&&g<.1&&(y<.2&&(r[m+0]+=1),x<.2&&(r[m+2]+=1),E<.2&&(r[m+4]+=1))}}function u(m){a.push(m.x,m.y,m.z)}function d(m,y){let x=m*3;y.x=t[x+0],y.y=t[x+1],y.z=t[x+2]}function v(){let m=new z,y=new z,x=new z,E=new z,A=new jt,g=new jt,M=new jt;for(let N=0,R=0;N<a.length;N+=9,R+=6){m.set(a[N+0],a[N+1],a[N+2]),y.set(a[N+3],a[N+4],a[N+5]),x.set(a[N+6],a[N+7],a[N+8]),A.set(r[R+0],r[R+1]),g.set(r[R+2],r[R+3]),M.set(r[R+4],r[R+5]),E.copy(m).add(y).add(x).divideScalar(3);let O=_(E);T(A,R+0,m,O),T(g,R+2,y,O),T(M,R+4,x,O)}}function T(m,y,x,E){E<0&&m.x===1&&(r[y]=m.x-1),x.x===0&&x.z===0&&(r[y]=E/2/Math.PI+.5)}function _(m){return Math.atan2(m.z,-m.x)}function h(m){return Math.atan2(-m.y,Math.sqrt(m.x*m.x+m.z*m.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}},Fl=class e extends vh{constructor(t=1,n=0){let i=(1+Math.sqrt(5))/2,s=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],a=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,a,t,n),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:n}}static fromJSON(t){return new e(t.radius,t.detail)}},zl=class e extends li{constructor(t=1,n=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:n,widthSegments:i,heightSegments:s};let a=t/2,r=n/2,o=Math.floor(i),l=Math.floor(s),c=o+1,f=l+1,p=t/o,u=n/l,d=[],v=[],T=[],_=[];for(let h=0;h<f;h++){let m=h*u-r;for(let y=0;y<c;y++){let x=y*p-a;v.push(x,-m,0),T.push(0,0,1),_.push(y/o),_.push(1-h/l)}}for(let h=0;h<l;h++)for(let m=0;m<o;m++){let y=m+c*h,x=m+c*(h+1),E=m+1+c*(h+1),A=m+1+c*h;d.push(y,x,A),d.push(x,E,A)}this.setIndex(d),this.setAttribute("position",new En(v,3)),this.setAttribute("normal",new En(T,3)),this.setAttribute("uv",new En(_,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};AS={clone:Xa,merge:pn},eE=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,nE=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Wn=class extends ia{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=eE,this.fragmentShader=nE,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Xa(t.uniforms),this.uniformsGroups=tE(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let n=super.toJSON(t);n.glslVersion=this.glslVersion,n.uniforms={};for(let s in this.uniforms){let r=this.uniforms[s].value;r&&r.isTexture?n.uniforms[s]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?n.uniforms[s]={type:"c",value:r.getHex()}:r&&r.isVector2?n.uniforms[s]={type:"v2",value:r.toArray()}:r&&r.isVector3?n.uniforms[s]={type:"v3",value:r.toArray()}:r&&r.isVector4?n.uniforms[s]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?n.uniforms[s]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?n.uniforms[s]={type:"m4",value:r.toArray()}:n.uniforms[s]={value:r}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(t,n){if(super.fromJSON(t,n),t.uniforms!==void 0)for(let i in t.uniforms){let s=t.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=n[s.value]||null;break;case"c":this.uniforms[i].value=new te().setHex(s.value);break;case"v2":this.uniforms[i].value=new jt().fromArray(s.value);break;case"v3":this.uniforms[i].value=new z().fromArray(s.value);break;case"v4":this.uniforms[i].value=new De().fromArray(s.value);break;case"m3":this.uniforms[i].value=new Pt().fromArray(s.value);break;case"m4":this.uniforms[i].value=new Ce().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},yh=class extends Wn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},xh=class extends ia{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=uS,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Sh=class extends ia{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};sa=class{constructor(t,n,i,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new n.constructor(i),this.sampleValues=n,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let n=this.parameterPositions,i=this._cachedIndex,s=n[i],a=n[i-1];t:{e:{let r;n:{i:if(!(t<s)){for(let o=i+2;;){if(s===void 0){if(t<a)break i;return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(a=s,s=n[++i],t<s)break e}r=n.length;break n}if(!(t>=a)){let o=n[1];t<o&&(i=2,a=o);for(let l=i-2;;){if(a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=a,a=n[--i-1],t>=a)break e}r=i,i=0;break n}break t}for(;i<r;){let o=i+r>>>1;t<n[o]?r=o:i=o+1}if(s=n[i],a=n[i-1],a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,a,s)}return this.interpolate_(i,a,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let n=this.resultBuffer,i=this.sampleValues,s=this.valueSize,a=t*s;for(let r=0;r!==s;++r)n[r]=i[a+r];return n}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Mh=class extends sa{constructor(t,n,i,s){super(t,n,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:wm,endingEnd:wm}}intervalChanged_(t,n,i){let s=this.parameterPositions,a=t-2,r=t+1,o=s[a],l=s[r];if(o===void 0)switch(this.getSettings_().endingStart){case Rm:a=t,o=2*n-i;break;case Cm:a=s.length-2,o=n+s[a]-s[a+1];break;default:a=t,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Rm:r=t,l=2*i-n;break;case Cm:r=1,l=i+s[1]-s[0];break;default:r=t-1,l=n}let c=(i-n)*.5,f=this.valueSize;this._weightPrev=c/(n-o),this._weightNext=c/(l-i),this._offsetPrev=a*f,this._offsetNext=r*f}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,f=this._offsetPrev,p=this._offsetNext,u=this._weightPrev,d=this._weightNext,v=(i-n)/(s-n),T=v*v,_=T*v,h=-u*_+2*u*T-u*v,m=(1+u)*_+(-1.5-2*u)*T+(-.5+u)*v+1,y=(-1-d)*_+(1.5+d)*T+.5*v,x=d*_-d*T;for(let E=0;E!==o;++E)a[E]=h*r[f+E]+m*r[c+E]+y*r[l+E]+x*r[p+E];return a}},bh=class extends sa{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,f=(i-n)/(s-n),p=1-f;for(let u=0;u!==o;++u)a[u]=r[c+u]*p+r[l+u]*f;return a}},Th=class extends sa{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Eh=class extends sa{interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,f=this.inTangents,p=this.outTangents;if(!f||!p){let v=(i-n)/(s-n),T=1-v;for(let _=0;_!==o;++_)a[_]=r[c+_]*T+r[l+_]*v;return a}let u=o*2,d=t-1;for(let v=0;v!==o;++v){let T=r[c+v],_=r[l+v],h=d*u+v*2,m=p[h],y=p[h+1],x=t*u+v*2,E=f[x],A=f[x+1],g=sE(i,n,m,E,s);a[v]=wS(g,T,y,A,_)}return a}};Xn=class{constructor(t,n,i,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(n===void 0||n.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Xr(n,this.TimeBufferType),this.values=Xr(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let n=t.constructor,i;if(n.toJSON!==this.toJSON)i=n.toJSON(t);else{i={name:t.name,times:Xr(t.times,Array),values:Xr(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(i.interpolation=s),Ju(t.settings)&&(i.settings={inTangents:Xr(t.settings.inTangents,Array),outTangents:Xr(t.settings.outTangents,Array)})}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new Th(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new bh(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Mh(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let n=new Eh(this.times,this.values,this.getValueSize(),t);return this.settings&&(n.inTangents=this.settings.inTangents,n.outTangents=this.settings.outTangents),n}setInterpolation(t){let n;switch(t){case bl:n=this.InterpolantFactoryMethodDiscrete;break;case uh:n=this.InterpolantFactoryMethodLinear;break;case $u:n=this.InterpolantFactoryMethodSmooth;break;case Am:n=this.InterpolantFactoryMethodBezier;break}if(n===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Dt("KeyframeTrack:",i),this}return this.createInterpolant=n,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return bl;case this.InterpolantFactoryMethodLinear:return uh;case this.InterpolantFactoryMethodSmooth:return $u;case this.InterpolantFactoryMethodBezier:return Am}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let n=this.times;for(let i=0,s=n.length;i!==s;++i)n[i]+=t;Ju(this.settings)&&(Ix(this.settings.inTangents,t),Ix(this.settings.outTangents,t))}return this}scale(t){if(t!==1){let n=this.times;for(let i=0,s=n.length;i!==s;++i)n[i]*=t;Ju(this.settings)&&(Bx(this.settings.inTangents,t),Bx(this.settings.outTangents,t))}return this}trim(t,n){let i=this.times,s=i.length,a=0,r=s-1;for(;a!==s&&i[a]<t;)++a;for(;r!==-1&&i[r]>n;)--r;if(++r,a!==0||r!==s){a>=r&&(r=Math.max(r,1),a=r-1);let o=this.getValueSize();this.times=i.slice(a,r),this.values=this.values.slice(a*o,r*o)}return this}validate(){let t=!0,n=this.getValueSize();n-Math.floor(n)!==0&&(Ot("KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,s=this.values,a=i.length;a===0&&(Ot("KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let o=0;o!==a;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){Ot("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(r!==null&&r>l){Ot("KeyframeTrack: Out of order keys.",this,o,l,r),t=!1;break}r=l}if(s!==void 0&&xT(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Ot("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),n=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===$u,a=t.length-1,r=1;for(let o=1;o<a;++o){let l=!1,c=t[o],f=t[o+1];if(c!==f&&(o!==1||c!==t[0]))if(s)l=!0;else{let p=o*i,u=p-i,d=p+i;for(let v=0;v!==i;++v){let T=n[p+v];if(T!==n[u+v]||T!==n[d+v]){l=!0;break}}}if(l){if(o!==r){t[r]=t[o];let p=o*i,u=r*i;for(let d=0;d!==i;++d)n[u+d]=n[p+d]}++r}}if(a>0){t[r]=t[a];for(let o=a*i,l=r*i,c=0;c!==i;++c)n[l+c]=n[o+c];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=n.slice(0,r*i)):(this.times=t,this.values=n),this}clone(){let t=this.times.slice(),n=this.values.slice(),i=this.constructor,s=new i(this.name,t,n);return s.createInterpolant=this.createInterpolant,Ju(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};Xn.prototype.ValueTypeName="";Xn.prototype.TimeBufferType=Float32Array;Xn.prototype.ValueBufferType=Float32Array;Xn.prototype.DefaultInterpolation=uh;aa=class extends Xn{constructor(t,n,i){super(t,n,i)}};aa.prototype.ValueTypeName="bool";aa.prototype.ValueBufferType=Array;aa.prototype.DefaultInterpolation=bl;aa.prototype.InterpolantFactoryMethodLinear=void 0;aa.prototype.InterpolantFactoryMethodSmooth=void 0;Ah=class extends Xn{constructor(t,n,i,s){super(t,n,i,s)}};Ah.prototype.ValueTypeName="color";wh=class extends Xn{constructor(t,n,i,s){super(t,n,i,s)}};wh.prototype.ValueTypeName="number";Rh=class extends sa{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=(i-n)/(s-n),c=t*o;for(let f=c+o;c!==f;c+=4)Fi.slerpFlat(a,0,r,c-o,r,c,l);return a}},Hl=class extends Xn{constructor(t,n,i,s){super(t,n,i,s)}InterpolantFactoryMethodLinear(t){return new Rh(this.times,this.values,this.getValueSize(),t)}};Hl.prototype.ValueTypeName="quaternion";Hl.prototype.InterpolantFactoryMethodSmooth=void 0;ra=class extends Xn{constructor(t,n,i){super(t,n,i)}};ra.prototype.ValueTypeName="string";ra.prototype.ValueBufferType=Array;ra.prototype.DefaultInterpolation=bl;ra.prototype.InterpolantFactoryMethodLinear=void 0;ra.prototype.InterpolantFactoryMethodSmooth=void 0;Ch=class extends Xn{constructor(t,n,i,s){super(t,n,i,s)}};Ch.prototype.ValueTypeName="vector";Dh=class{constructor(t,n,i){let s=this,a=!1,r=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=n,this.onError=i,this._abortController=null,this.itemStart=function(f){o++,a===!1&&s.onStart!==void 0&&s.onStart(f,r,o),a=!0},this.itemEnd=function(f){r++,s.onProgress!==void 0&&s.onProgress(f,r,o),r===o&&(a=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(f){s.onError!==void 0&&s.onError(f)},this.resolveURL=function(f){return f=f.normalize("NFC"),l?l(f):f},this.setURLModifier=function(f){return l=f,this},this.addHandler=function(f,p){return c.push(f,p),this},this.removeHandler=function(f){let p=c.indexOf(f);return p!==-1&&c.splice(p,2),this},this.getHandler=function(f){for(let p=0,u=c.length;p<u;p+=2){let d=c[p],v=c[p+1];if(d.global&&(d.lastIndex=0),d.test(f))return v}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},RS=new Dh,Lh=class{constructor(t){this.manager=t!==void 0?t:RS,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,n){let i=this;return new Promise(function(s,a){i.load(t,s,n,a)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}};Lh.DEFAULT_MATERIAL_NAME="__DEFAULT";Qu=new z,ju=new Fi,Pi=new z,Gl=class extends kn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ce,this.projectionMatrix=new Ce,this.projectionMatrixInverse=new Ce,this.coordinateSystem=oi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,n){return super.copy(t,n),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Qu,ju,Pi),Pi.x===1&&Pi.y===1&&Pi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Qu,ju,Pi.set(1,1,1)).invert()}updateWorldMatrix(t,n,i=!1){super.updateWorldMatrix(t,n,i),this.matrixWorld.decompose(Qu,ju,Pi),Pi.x===1&&Pi.y===1&&Pi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Qu,ju,Pi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},$s=new z,Fx=new jt,zx=new jt,Tn=class extends Gl{constructor(t=50,n=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let n=.5*this.getFilmHeight()/t;this.fov=Qr*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Sl*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Qr*2*Math.atan(Math.tan(Sl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,n,i){$s.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set($s.x,$s.y).multiplyScalar(-t/$s.z),$s.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set($s.x,$s.y).multiplyScalar(-t/$s.z)}getViewSize(t,n){return this.getViewBounds(t,Fx,zx),n.subVectors(zx,Fx)}setViewOffset(t,n,i,s,a,r){this.aspect=t/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,n=t*Math.tan(Sl*.5*this.fov)/this.zoom,i=2*n,s=this.aspect*i,a=-.5*s,r=this.view;if(this.view!==null&&this.view.enabled){let l=r.fullWidth,c=r.fullHeight;a+=r.offsetX*s/l,n-=r.offsetY*i/c,s*=r.width/l,i*=r.height/c}let o=this.filmOffset;o!==0&&(a+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,n,n-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}},Nh=class extends Gl{constructor(t=-1,n=1,i=1,s=-1,a=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=n,this.top=i,this.bottom=s,this.near=a,this.far=r,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,n,i,s,a,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,a=i-t,r=i+t,o=s+n,l=s-n;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,f=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,r=a+c*this.view.width,o-=f*this.view.offsetY,l=o-f*this.view.height}this.projectionMatrix.makeOrthographic(a,r,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}},qr=-90,Yr=1,eo=class extends kn{constructor(t,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Tn(qr,Yr,t,n);s.layers=this.layers,this.add(s);let a=new Tn(qr,Yr,t,n);a.layers=this.layers,this.add(a);let r=new Tn(qr,Yr,t,n);r.layers=this.layers,this.add(r);let o=new Tn(qr,Yr,t,n);o.layers=this.layers,this.add(o);let l=new Tn(qr,Yr,t,n);l.layers=this.layers,this.add(l);let c=new Tn(qr,Yr,t,n);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,n=this.children.concat(),[i,s,a,r,o,l]=n;for(let c of n)this.remove(c);if(t===oi)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Al)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of n)this.add(c),c.updateMatrixWorld()}update(t,n){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[a,r,o,l,c,f]=this.children,p=t.getRenderTarget(),u=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),v=t.xr.enabled;t.xr.enabled=!1;let T=i.texture.mipmapsAutoUpdate;i.texture.mipmapsAutoUpdate=!1;let _=!1;t.isWebGLRenderer===!0?_=t.state.buffers.depth.getReversed():_=t.reversedDepthBuffer,t.setRenderTarget(i,0,s),_&&t.autoClear===!1&&t.clearDepth(),t.render(n,a),t.setRenderTarget(i,1,s),_&&t.autoClear===!1&&t.clearDepth(),t.render(n,r),t.setRenderTarget(i,2,s),_&&t.autoClear===!1&&t.clearDepth(),t.render(n,o),t.setRenderTarget(i,3,s),_&&t.autoClear===!1&&t.clearDepth(),t.render(n,l),t.setRenderTarget(i,4,s),_&&t.autoClear===!1&&t.clearDepth(),t.render(n,c),i.texture.mipmapsAutoUpdate=T,t.setRenderTarget(i,5,s),_&&t.autoClear===!1&&t.clearDepth(),t.render(n,f),t.setRenderTarget(p,u,d),t.xr.enabled=v,i.texture.needsPMREMUpdate=!0}},Uh=class extends Tn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}},hg="\\[\\]\\.:\\/",aE=new RegExp("["+hg+"]","g"),fg="[^"+hg+"]",rE="[^"+hg.replace("\\.","")+"]",oE=/((?:WC+[\/:])*)/.source.replace("WC",fg),lE=/(WCOD+)?/.source.replace("WCOD",rE),cE=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",fg),uE=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",fg),hE=new RegExp("^"+oE+lE+cE+uE+"$"),fE=["material","materials","bones","map"],Lm=class{constructor(t,n,i){let s=i||Se.parseTrackName(n);this._targetGroup=t,this._bindings=t.subscribe_(n,s)}getValue(t,n){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(t,n)}setValue(t,n){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,a=i.length;s!==a;++s)i[s].setValue(t,n)}bind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].bind()}unbind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].unbind()}},Se=class e{constructor(t,n,i){this.path=n,this.parsedPath=i||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,i){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,i):new e(t,n,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(aE,"")}static parseTrackName(t){let n=hE.exec(t);if(n===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:n[2],objectName:n[3],objectIndex:n[4],propertyName:n[5],propertyIndex:n[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let a=i.nodeName.substring(s+1);fE.indexOf(a)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=a)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,n){if(n===void 0||n===""||n==="."||n===-1||n===t.name||n===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(n);if(i!==void 0)return i}if(t.children){let i=function(a){for(let r=0;r<a.length;r++){let o=a[r];if(o.name===n||o.uuid===n)return o;let l=i(o.children);if(l)return l}return null},s=i(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,n){t[n]=this.targetObject[this.propertyName]}_getValue_array(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)t[n++]=i[s]}_getValue_arrayElement(t,n){t[n]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,n){this.resolvedProperty.toArray(t,n)}_setValue_direct(t,n){this.targetObject[this.propertyName]=t[n]}_setValue_direct_setNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++]}_setValue_array_setNeedsUpdate(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,n){this.resolvedProperty[this.propertyIndex]=t[n]}_setValue_arrayElement_setNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,n){this.resolvedProperty.fromArray(t,n)}_setValue_fromArray_setNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,n){this.bind(),this.getValue(t,n)}_setValue_unbound(t,n){this.bind(),this.setValue(t,n)}bind(){let t=this.node,n=this.parsedPath,i=n.objectName,s=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Dt("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=n.objectIndex;switch(i){case"materials":if(!t.material){Ot("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Ot("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Ot("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let f=0;f<t.length;f++)if(t[f].name===c){c=f;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Ot("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Ot("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){Ot("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(c!==void 0){if(t[c]===void 0){Ot("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let r=t[s];if(r===void 0){let c=n.nodeName;Ot("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(a!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Ot("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Ot("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}l=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=a}else r.fromArray!==void 0&&r.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(l=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Se.Composite=Lm;Se.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Se.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Se.prototype.GetterByBindingType=[Se.prototype._getValue_direct,Se.prototype._getValue_array,Se.prototype._getValue_arrayElement,Se.prototype._getValue_toArray];Se.prototype.SetterByBindingTypeAndVersioning=[[Se.prototype._setValue_direct,Se.prototype._setValue_direct_setNeedsUpdate,Se.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Se.prototype._setValue_array,Se.prototype._setValue_array_setNeedsUpdate,Se.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Se.prototype._setValue_arrayElement,Se.prototype._setValue_arrayElement_setNeedsUpdate,Se.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Se.prototype._setValue_fromArray,Se.prototype._setValue_fromArray_setNeedsUpdate,Se.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];d3=new Float32Array(1),Vl=class{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,Dt("Clock: This module has been deprecated. Please use THREE.Timer instead.")}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let n=performance.now();t=(n-this.oldTime)/1e3,this.oldTime=n,this.elapsedTime+=t}return t}},vg=class vg{constructor(t,n,i,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,n,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,n=0){for(let i=0;i<4;i++)this.elements[i]=t[i+n];return this}set(t,n,i,s){let a=this.elements;return a[0]=t,a[2]=n,a[1]=i,a[3]=s,this}};vg.prototype.isMatrix2=!0;Nm=vg;typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ph}}));typeof window<"u"&&(window.__THREE__?Dt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ph)});function JS(){let e=null,t=!1,n=null,i=null;function s(a,r){i=e.requestAnimationFrame(s),n(a,r)}return{start:function(){t!==!0&&n!==null&&e!==null&&(i=e.requestAnimationFrame(s),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){n=a},setContext:function(a){e=a}}}function pE(e){let t=new WeakMap;function n(o,l){let c=o.array,f=o.usage,p=c.byteLength,u=e.createBuffer();e.bindBuffer(l,u),e.bufferData(l,c,f),o.onUploadCallback();let d;if(c instanceof Float32Array)d=e.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=e.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=e.HALF_FLOAT:d=e.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=e.SHORT;else if(c instanceof Uint32Array)d=e.UNSIGNED_INT;else if(c instanceof Int32Array)d=e.INT;else if(c instanceof Int8Array)d=e.BYTE;else if(c instanceof Uint8Array)d=e.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:p}}function i(o,l,c){let f=l.array,p=l.updateRanges;if(e.bindBuffer(c,o),p.length===0)e.bufferSubData(c,0,f);else{p.sort((d,v)=>d.start-v.start);let u=0;for(let d=1;d<p.length;d++){let v=p[u],T=p[d];T.start<=v.start+v.count+1?v.count=Math.max(v.count,T.start+T.count-v.start):(++u,p[u]=T)}p.length=u+1;for(let d=0,v=p.length;d<v;d++){let T=p[d];e.bufferSubData(c,T.start*f.BYTES_PER_ELEMENT,f,T.start,T.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function a(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(e.deleteBuffer(l.buffer),t.delete(o))}function r(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let f=t.get(o);(!f||f.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,n(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:s,remove:a,update:r}}function Kw(e,t,n,i,s,a){let r=new te(0),o=s===!0?0:1,l,c,f=null,p=0,u=null;function d(m){let y=m.isScene===!0?m.background:null;if(y&&y.isTexture){let x=m.backgroundBlurriness>0;y=t.get(y,x)}return y}function v(m){let y=!1,x=d(m);x===null?_(r,o):x&&x.isColor&&(_(x,1),y=!0);let E=e.xr.getEnvironmentBlendMode();E==="additive"?n.buffers.color.setClear(0,0,0,1,a):E==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function T(m,y){let x=d(y);x&&x.isCubeTexture?(c===void 0&&(c=new ci(new to(1,1,1),new Wn({name:"BackgroundCubeMaterial",uniforms:Xa(ki.backgroundCube.uniforms),vertexShader:ki.backgroundCube.vertexShader,fragmentShader:ki.backgroundCube.fragmentShader,side:wn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(E,A,g){this.matrixWorld.copyPosition(g.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=x,c.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Zw.makeRotationFromEuler(y.backgroundRotation)).transpose(),x.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(QS),c.material.toneMapped=Kt.getTransfer(x.colorSpace)!==re,(f!==x||p!==x.version||u!==e.toneMapping)&&(c.material.needsUpdate=!0,f=x,p=x.version,u=e.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null)):x&&x.isTexture&&(l===void 0&&(l=new ci(new zl(2,2),new Wn({name:"BackgroundMaterial",uniforms:Xa(ki.background.uniforms),vertexShader:ki.background.vertexShader,fragmentShader:ki.background.fragmentShader,side:zi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=x,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.toneMapped=Kt.getTransfer(x.colorSpace)!==re,x.matrixAutoUpdate===!0&&x.updateMatrix(),l.material.uniforms.uvTransform.value.copy(x.matrix),(f!==x||p!==x.version||u!==e.toneMapping)&&(l.material.needsUpdate=!0,f=x,p=x.version,u=e.toneMapping),l.layers.enableAll(),m.unshift(l,l.geometry,l.material,0,0,null))}function _(m,y){m.getRGB(Mf,ug(e)),n.buffers.color.setClear(Mf.r,Mf.g,Mf.b,y,a)}function h(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return r},setClearColor:function(m,y=1){r.set(m),o=y,_(r,o)},getClearAlpha:function(){return o},setClearAlpha:function(m){o=m,_(r,o)},render:v,addToRenderList:T,dispose:h}}function Jw(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},s=u(null),a=s,r=!1;function o(O,F,q,L,W){let Z=!1,G=p(O,L,q,F);a!==G&&(a=G,c(a.object)),Z=d(O,L,q,W),Z&&v(O,L,q,W),W!==null&&t.update(W,e.ELEMENT_ARRAY_BUFFER),(Z||r)&&(r=!1,x(O,F,q,L),W!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(W).buffer))}function l(){return e.createVertexArray()}function c(O){return e.bindVertexArray(O)}function f(O){return e.deleteVertexArray(O)}function p(O,F,q,L){let W=L.wireframe===!0,Z=i[F.id];Z===void 0&&(Z={},i[F.id]=Z);let G=O.isInstancedMesh===!0?O.id:0,nt=Z[G];nt===void 0&&(nt={},Z[G]=nt);let V=nt[q.id];V===void 0&&(V={},nt[q.id]=V);let j=V[W];return j===void 0&&(j=u(l()),V[W]=j),j}function u(O){let F=[],q=[],L=[];for(let W=0;W<n;W++)F[W]=0,q[W]=0,L[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:F,enabledAttributes:q,attributeDivisors:L,object:O,attributes:{},index:null}}function d(O,F,q,L){let W=a.attributes,Z=F.attributes,G=0,nt=q.getAttributes();for(let V in nt)if(nt[V].location>=0){let tt=W[V],yt=Z[V];if(yt===void 0&&(V==="instanceMatrix"&&O.instanceMatrix&&(yt=O.instanceMatrix),V==="instanceColor"&&O.instanceColor&&(yt=O.instanceColor)),tt===void 0||tt.attribute!==yt||yt&&tt.data!==yt.data)return!0;G++}return a.attributesNum!==G||a.index!==L}function v(O,F,q,L){let W={},Z=F.attributes,G=0,nt=q.getAttributes();for(let V in nt)if(nt[V].location>=0){let tt=Z[V];tt===void 0&&(V==="instanceMatrix"&&O.instanceMatrix&&(tt=O.instanceMatrix),V==="instanceColor"&&O.instanceColor&&(tt=O.instanceColor));let yt={};yt.attribute=tt,tt&&tt.data&&(yt.data=tt.data),W[V]=yt,G++}a.attributes=W,a.attributesNum=G,a.index=L}function T(){let O=a.newAttributes;for(let F=0,q=O.length;F<q;F++)O[F]=0}function _(O){h(O,0)}function h(O,F){let q=a.newAttributes,L=a.enabledAttributes,W=a.attributeDivisors;q[O]=1,L[O]===0&&(e.enableVertexAttribArray(O),L[O]=1),W[O]!==F&&(e.vertexAttribDivisor(O,F),W[O]=F)}function m(){let O=a.newAttributes,F=a.enabledAttributes;for(let q=0,L=F.length;q<L;q++)F[q]!==O[q]&&(e.disableVertexAttribArray(q),F[q]=0)}function y(O,F,q,L,W,Z,G){G===!0?e.vertexAttribIPointer(O,F,q,W,Z):e.vertexAttribPointer(O,F,q,L,W,Z)}function x(O,F,q,L){T();let W=L.attributes,Z=q.getAttributes(),G=F.defaultAttributeValues;for(let nt in Z){let V=Z[nt];if(V.location>=0){let j=W[nt];if(j===void 0&&(nt==="instanceMatrix"&&O.instanceMatrix&&(j=O.instanceMatrix),nt==="instanceColor"&&O.instanceColor&&(j=O.instanceColor)),j!==void 0){let tt=j.normalized,yt=j.itemSize,Lt=t.get(j);if(Lt===void 0)continue;let k=Lt.buffer,dt=Lt.type,vt=Lt.bytesPerElement,At=dt===e.INT||dt===e.UNSIGNED_INT||j.gpuType===zh;if(j.isInterleavedBufferAttribute){let pt=j.data,Nt=pt.isInterleavedBuffer===!0?pt.stride:pt.itemSize,Me=j.offset;if(pt.isInstancedInterleavedBuffer||pt.isInstancedBufferAttribute){for(let Tt=0;Tt<V.locationSize;Tt++)h(V.location+Tt,pt.meshPerAttribute);O.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=pt.meshPerAttribute*pt.count)}else for(let Tt=0;Tt<V.locationSize;Tt++)_(V.location+Tt);e.bindBuffer(e.ARRAY_BUFFER,k);for(let Tt=0;Tt<V.locationSize;Tt++)y(V.location+Tt,yt/V.locationSize,dt,tt,Nt*vt,(Me+yt/V.locationSize*Tt)*vt,At)}else{if(j.isInstancedBufferAttribute){for(let pt=0;pt<V.locationSize;pt++)h(V.location+pt,j.meshPerAttribute);O.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let pt=0;pt<V.locationSize;pt++)_(V.location+pt);e.bindBuffer(e.ARRAY_BUFFER,k);for(let pt=0;pt<V.locationSize;pt++)y(V.location+pt,yt/V.locationSize,dt,tt,yt*vt,yt/V.locationSize*pt*vt,At)}}else if(G!==void 0){let tt=G[nt];if(tt!==void 0)switch(tt.length){case 2:e.vertexAttrib2fv(V.location,tt);break;case 3:e.vertexAttrib3fv(V.location,tt);break;case 4:e.vertexAttrib4fv(V.location,tt);break;default:e.vertexAttrib1fv(V.location,tt)}}}}m()}function E(){N();for(let O in i){let F=i[O];for(let q in F){let L=F[q];for(let W in L){let Z=L[W];for(let G in Z)f(Z[G].object),delete Z[G];delete L[W]}}delete i[O]}}function A(O){if(i[O.id]===void 0)return;let F=i[O.id];for(let q in F){let L=F[q];for(let W in L){let Z=L[W];for(let G in Z)f(Z[G].object),delete Z[G];delete L[W]}}delete i[O.id]}function g(O){for(let F in i){let q=i[F];for(let L in q){let W=q[L];if(W[O.id]===void 0)continue;let Z=W[O.id];for(let G in Z)f(Z[G].object),delete Z[G];delete W[O.id]}}}function M(O){for(let F in i){let q=i[F],L=O.isInstancedMesh===!0?O.id:0,W=q[L];if(W!==void 0){for(let Z in W){let G=W[Z];for(let nt in G)f(G[nt].object),delete G[nt];delete W[Z]}delete q[L],Object.keys(q).length===0&&delete i[F]}}}function N(){R(),r=!0,a!==s&&(a=s,c(a.object))}function R(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:N,resetDefaultState:R,dispose:E,releaseStatesOfGeometry:A,releaseStatesOfObject:M,releaseStatesOfProgram:g,initAttributes:T,enableAttribute:_,disableUnusedAttributes:m}}function Qw(e,t,n){let i;function s(l){i=l}function a(l,c){e.drawArrays(i,l,c),n.update(c,i,1)}function r(l,c,f){f!==0&&(e.drawArraysInstanced(i,l,c,f),n.update(c,i,f))}function o(l,c,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,f);let u=0;for(let d=0;d<f;d++)u+=c[d];n.update(u,i,1)}this.setMode=s,this.render=a,this.renderInstances=r,this.renderMultiDraw=o}function jw(e,t,n,i){let s;function a(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let g=t.get("EXT_texture_filter_anisotropic");s=e.getParameter(g.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function r(g){return!(g!==Ei&&i.convert(g)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(g){let M=g===Ti&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(g!==qn&&g!==bi&&!M&&i.convert(g)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function l(g){if(g==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";g="mediump"}return g==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=n.precision!==void 0?n.precision:"highp",f=l(c);f!==c&&(Dt("WebGLRenderer:",c,"not supported, using",f,"instead."),c=f);let p=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),u=n.logarithmicDepthBuffer===!0&&p===!1;n.reversedDepthBuffer===!0&&p===!1&&Dt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),n.logarithmicDepthBuffer===!0&&p===!0&&Dt("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let d=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),v=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),T=e.getParameter(e.MAX_TEXTURE_SIZE),_=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),h=e.getParameter(e.MAX_VERTEX_ATTRIBS),m=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),x=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),E=e.getParameter(e.MAX_SAMPLES),A=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:p,maxTextures:d,maxVertexTextures:v,maxTextureSize:T,maxCubemapSize:_,maxAttributes:h,maxVertexUniforms:m,maxVaryings:y,maxFragmentUniforms:x,maxSamples:E,samples:A}}function $w(e){let t=this,n=null,i=0,s=!1,a=!1,r=new Si,o=new Pt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(p,u){let d=p.length!==0||u||i!==0||s;return s=u,i=p.length,d},this.beginShadows=function(){a=!0,f(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(p,u){n=f(p,u,0)},this.setState=function(p,u,d){let v=p.clippingPlanes,T=p.clipIntersection,_=p.clipShadows,h=e.get(p);if(!s||v===null||v.length===0||a&&!_)a?f(null):c();else{let m=a?0:i,y=m*4,x=h.clippingState||null;l.value=x,x=f(v,u,y,d);for(let E=0;E!==y;++E)x[E]=n[E];h.clippingState=x,this.numIntersection=T?this.numPlanes:0,this.numPlanes+=m}};function c(){l.value!==n&&(l.value=n,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function f(p,u,d,v){let T=p!==null?p.length:0,_=null;if(T!==0){if(_=l.value,v!==!0||_===null){let h=d+T*4,m=u.matrixWorldInverse;o.getNormalMatrix(m),(_===null||_.length<h)&&(_=new Float32Array(h));for(let y=0,x=d;y!==T;++y,x+=4)r.copy(p[y]).applyMatrix4(m,o),r.normal.toArray(_,x),_[x+3]=r.constant}l.value=_,l.needsUpdate=!0}return t.numPlanes=T,t.numIntersection=0,_}}function DS(e,t,n){return new $l(e,{minFilter:vs,generateMipmaps:t,type:Ti,colorSpace:Tl,depthBuffer:n})}function tc(e,t,n){return new Wn({name:e,uniforms:t,vertexShader:kt.cube_vert,fragmentShader:n,side:wn,blending:Ga,depthTest:!1,depthWrite:!1})}function aR(){return tc("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${jS}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function rR(){return tc("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:$S}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function oR(){return tc("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${eR}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function LS(){return tc("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function NS(){return tc("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function lR(e){let t=new WeakMap,n=new WeakMap,i=null;function s(u,d=!1){return u==null?null:d?r(u):a(u)}function a(u){if(u&&u.isTexture){let d=u.mapping;if(d===Ih||d===Bh)if(t.has(u)){let v=t.get(u).texture;return o(v,u.mapping)}else{let v=u.image;if(v&&v.height>0){let T=new $l(v.height);return T.fromEquirectangularTexture(e,u),t.set(u,T),u.addEventListener("dispose",c),o(T.texture,u.mapping)}else return null}}return u}function r(u){if(u&&u.isTexture&&u.isPMREMTexture!==!0){let d=u.mapping,v=d===Ih||d===Bh,T=d===ka||d===so;if(v||T){let _=n.get(u),h=_!==void 0?_.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==h)return i===null&&(i=new Tf(e)),_=v?i.fromEquirectangular(u,_):i.fromCubemap(u,_),_.texture.pmremVersion=u.pmremVersion,n.set(u,_),_.texture;if(_!==void 0)return _.texture;{let m=u.image;return v&&m&&m.height>0||T&&m&&l(m)?(i===null&&(i=new Tf(e)),_=v?i.fromEquirectangular(u):i.fromCubemap(u),_.texture.pmremVersion=u.pmremVersion,n.set(u,_),u.addEventListener("dispose",f),_.texture):null}}}return u}function o(u,d){return d===Ih?u.mapping=ka:d===Bh&&(u.mapping=so),u}function l(u){let d=0,v=6;for(let T=0;T<v;T++)u[T]!==void 0&&d++;return d===v}function c(u){let d=u.target;d.removeEventListener("dispose",c);let v=t.get(d);v!==void 0&&(t.delete(d),v.dispose())}function f(u){let d=u.target;d.removeEventListener("dispose",f);let v=n.get(d);v!==void 0&&(n.delete(d),v.dispose())}function p(){t=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:p}}function cR(e){let t={};function n(i){if(t[i]!==void 0)return t[i];let s=e.getExtension(i);return t[i]=s,s}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){let s=n(i);return s===null&&xl("WebGLRenderer: "+i+" extension not supported."),s}}}function uR(e,t,n,i){let s={},a=new WeakMap,r=new FinalizationRegistry(v=>delete s[v]);function o(v){l(v.target)}function l(v){v.index!==null&&t.remove(v.index);for(let _ in v.attributes)t.remove(v.attributes[_]);v.removeEventListener("dispose",o),delete s[v.id],r.unregister(v);let T=a.get(v);T&&(t.remove(T),a.delete(v)),i.releaseStatesOfGeometry(v),v.isInstancedBufferGeometry===!0&&delete v._maxInstanceCount,n.memory.geometries--}function c(v,T){return s[T.id]!==void 0||(T.addEventListener("dispose",o),s[T.id]=new WeakRef(T),r.register(T,T.id,T),n.memory.geometries++),T}function f(v){let T=v.attributes;for(let _ in T)t.update(T[_],e.ARRAY_BUFFER)}function p(v){let T=v.index,_=v.attributes.position,h=0;if(_===void 0)return;let m=T!==null?T.array.length:_.array.length/3-1,y=_.count>=65535?Nl:Ll,x=new y(Math.ceil(m/3)*6,1),E=x.array;if(T!==null){let g=T.array;h=T.version;for(let M=0,N=0;M<m;M+=3){let R=g[M+0],O=g[M+1],F=g[M+2];E[N++]=R,E[N++]=O,E[N++]=O,E[N++]=F,E[N++]=F,E[N++]=R}}else{h=_.version;for(let g=0,M=0;g<m;g+=3){let N=g+0,R=g+1,O=g+2;E[M++]=N,E[M++]=R,E[M++]=R,E[M++]=O,E[M++]=O,E[M++]=N}}x.version=h;let A=a.get(v);A&&t.remove(A),a.set(v,x)}function u(v){let T=a.get(v);if(T){let _=v.index;_!==null&&T.version<_.version&&p(v)}else p(v);return a.get(v)}function d(){for(let v in s){let T=s[v].deref();T!==void 0&&l(T)}}return{get:c,update:f,getWireframeAttribute:u,dispose:d}}function hR(e,t,n){let i;function s(p){i=p}let a,r;function o(p){a=p.type,r=p.bytesPerElement}function l(p,u){e.drawElements(i,u,a,p*r),n.update(u,i,1)}function c(p,u,d){d!==0&&(e.drawElementsInstanced(i,u,a,p*r,d),n.update(u,i,d))}function f(p,u,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,a,p,0,d);let T=0;for(let _=0;_<d;_++)T+=u[_];n.update(T,i,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=f}function fR(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,r,o){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=o*(a/3);break;case e.LINES:n.lines+=o*(a/2);break;case e.LINE_STRIP:n.lines+=o*(a-1);break;case e.LINE_LOOP:n.lines+=o*a;break;case e.POINTS:n.points+=o*a;break;default:Ot("WebGLInfo: Unknown draw mode:",r);break}}function s(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:s,update:i}}function dR(e,t,n){let i=new WeakMap,s=new De;function a(r,o,l){let c=r.morphTargetInfluences,f=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,p=f!==void 0?f.length:0,u=i.get(o);if(u===void 0||u.count!==p){let N=function(){g.dispose(),i.delete(o),o.removeEventListener("dispose",N)};u!==void 0&&u.texture.dispose();let d=o.morphAttributes.position!==void 0,v=o.morphAttributes.normal!==void 0,T=o.morphAttributes.color!==void 0,_=o.morphAttributes.position||[],h=o.morphAttributes.normal||[],m=o.morphAttributes.color||[],y=0;d===!0&&(y=1),v===!0&&(y=2),T===!0&&(y=3);let x=o.attributes.position.count*y,E=1;x>t.maxTextureSize&&(E=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);let A=new Float32Array(x*E*4*p),g=new Rl(A,x,E,p);g.type=bi,g.needsUpdate=!0;let M=y*4;for(let R=0;R<p;R++){let O=_[R],F=h[R],q=m[R],L=x*E*4*R;for(let W=0;W<O.count;W++){let Z=W*M;d===!0&&(s.fromBufferAttribute(O,W),A[L+Z+0]=s.x,A[L+Z+1]=s.y,A[L+Z+2]=s.z,A[L+Z+3]=0),v===!0&&(s.fromBufferAttribute(F,W),A[L+Z+4]=s.x,A[L+Z+5]=s.y,A[L+Z+6]=s.z,A[L+Z+7]=0),T===!0&&(s.fromBufferAttribute(q,W),A[L+Z+8]=s.x,A[L+Z+9]=s.y,A[L+Z+10]=s.z,A[L+Z+11]=q.itemSize===4?s.w:1)}}u={count:p,texture:g,size:new jt(x,E)},i.set(o,u),o.addEventListener("dispose",N)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",r.morphTexture,n);else{let d=0;for(let T=0;T<c.length;T++)d+=c[T];let v=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(e,"morphTargetBaseInfluence",v),l.getUniforms().setValue(e,"morphTargetInfluences",c)}l.getUniforms().setValue(e,"morphTargetsTexture",u.texture,n),l.getUniforms().setValue(e,"morphTargetsTextureSize",u.size)}return{update:a}}function pR(e,t,n,i,s){let a=new WeakMap;function r(c){let f=s.render.frame,p=c.geometry,u=t.get(c,p);if(a.get(u)!==f&&(t.update(u),a.set(u,f)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),a.get(c)!==f&&(n.update(c.instanceMatrix,e.ARRAY_BUFFER),c.instanceColor!==null&&n.update(c.instanceColor,e.ARRAY_BUFFER),a.set(c,f))),c.isSkinnedMesh){let d=c.skeleton;a.get(d)!==f&&(d.update(),a.set(d,f))}return u}function o(){a=new WeakMap}function l(c){let f=c.target;f.removeEventListener("dispose",l),i.releaseStatesOfObject(f),n.remove(f.instanceMatrix),f.instanceColor!==null&&n.remove(f.instanceColor)}return{update:r,dispose:o}}function gR(e,t,n,i,s,a){let r=new Vn(t,n,{type:e,depthBuffer:s,stencilBuffer:a,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=null,f=new li;f.setAttribute("position",new En([-1,3,0,-1,-1,0,3,-1,0],3)),f.setAttribute("uv",new En([0,2,0,0,2,0],2));let p=new yh({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new ci(f,p),d=new Nh(-1,1,1,-1,0,1),v=null,T=null,_=!1,h,m=null,y=[],x=!1;this.setSize=function(E,A){r.setSize(E,A),o!==null&&o.setSize(E,A),l!==null&&l.setSize(E,A);for(let g=0;g<y.length;g++){let M=y[g];M.setSize&&M.setSize(E,A)}},this.setEffects=function(E){y=E,x=y.length>0&&y[0].isRenderPass===!0;let A=r.width,g=r.height;y.length>0&&o===null&&(o=new Vn(A,g,{type:Ti,depthBuffer:!1,stencilBuffer:!1}),l=new Vn(A,g,{type:Ti,depthBuffer:!1,stencilBuffer:!1}));let M=s===!0&&y.some(N=>N.needsDepthTexture===!0);M!==(r.depthTexture!==null)&&(M===!0&&c===null&&(c=new _s(A,g),a===!0&&(c.format=ys,c.type=Wa)),r.dispose(),r.depthTexture=M?c:null,r.resolveDepthBuffer=M,r.storeMultisampledDepthBuffer=M);for(let N=0;N<y.length;N++){let R=y[N];R.setSize&&R.setSize(A,g),M&&R.needsDepthTexture===!0&&R.setDepthTexture&&R.setDepthTexture(c)}},this.begin=function(E,A){if(_||E.toneMapping===Gi&&y.length===0)return!1;if(m=A,A!==null){let g=A.width,M=A.height;(r.width!==g||r.height!==M)&&this.setSize(g,M)}return x===!1&&E.setRenderTarget(r),h=E.toneMapping,E.toneMapping=Gi,!0},this.hasRenderPass=function(){return x},this.end=function(E,A){E.toneMapping=h,_=!0;let g=r,M=o;for(let N=0;N<y.length;N++){let R=y[N];R.enabled!==!1&&(R.render(E,M,g,A),R.needsSwap!==!1&&(g=M,M=M===o?l:o))}if(v!==E.outputColorSpace||T!==E.toneMapping){v=E.outputColorSpace,T=E.toneMapping,p.defines={},Kt.getTransfer(v)===re&&(p.defines.SRGB_TRANSFER="");let N=mR[T];N&&(p.defines[N]=""),p.needsUpdate=!0}p.uniforms.tDiffuse.value=g.texture,E.setRenderTarget(m),E.render(u,d),m=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){r.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),f.dispose(),p.dispose()}}function lo(e,t,n){let i=e[0];if(i<=0||i>0)return e;let s=t*n,a=US[s];if(a===void 0&&(a=new Float32Array(s),US[s]=a),t!==0){i.toArray(a,0);for(let r=1,o=0;r!==t;++r)o+=n,e[r].toArray(a,o)}return a}function We(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function Xe(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function Af(e,t){let n=OS[t];n===void 0&&(n=new Int32Array(t),OS[t]=n);for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function _R(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function vR(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(We(n,t))return;e.uniform2fv(this.addr,t),Xe(n,t)}}function yR(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(We(n,t))return;e.uniform3fv(this.addr,t),Xe(n,t)}}function xR(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(We(n,t))return;e.uniform4fv(this.addr,t),Xe(n,t)}}function SR(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(We(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Xe(n,t)}else{if(We(n,i))return;BS.set(i),e.uniformMatrix2fv(this.addr,!1,BS),Xe(n,i)}}function MR(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(We(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Xe(n,t)}else{if(We(n,i))return;IS.set(i),e.uniformMatrix3fv(this.addr,!1,IS),Xe(n,i)}}function bR(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(We(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Xe(n,t)}else{if(We(n,i))return;PS.set(i),e.uniformMatrix4fv(this.addr,!1,PS),Xe(n,i)}}function TR(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function ER(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(We(n,t))return;e.uniform2iv(this.addr,t),Xe(n,t)}}function AR(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(We(n,t))return;e.uniform3iv(this.addr,t),Xe(n,t)}}function wR(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(We(n,t))return;e.uniform4iv(this.addr,t),Xe(n,t)}}function RR(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function CR(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(We(n,t))return;e.uniform2uiv(this.addr,t),Xe(n,t)}}function DR(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(We(n,t))return;e.uniform3uiv(this.addr,t),Xe(n,t)}}function LR(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(We(n,t))return;e.uniform4uiv(this.addr,t),Xe(n,t)}}function wf(e){return e.version===0&&(e.compareFunction=sg,e.needsUpdate=!0),e}function NR(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s);let a;this.type===e.SAMPLER_2D_SHADOW?a=wf(eM):a=tM,n.setTexture2D(t||a,s)}function UR(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture3D(t||sM,s)}function OR(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s);let a;this.type===e.SAMPLER_CUBE_SHADOW?a=wf(nM):a=aM,n.setTextureCube(t||a,s)}function PR(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture2DArray(t||iM,s)}function IR(e){switch(e){case 5126:return _R;case 35664:return vR;case 35665:return yR;case 35666:return xR;case 35674:return SR;case 35675:return MR;case 35676:return bR;case 5124:case 35670:return TR;case 35667:case 35671:return ER;case 35668:case 35672:return AR;case 35669:case 35673:return wR;case 5125:return RR;case 36294:return CR;case 36295:return DR;case 36296:return LR;case 35678:case 36198:case 36298:case 36306:case 35682:return NR;case 35679:case 36299:case 36307:return UR;case 35680:case 36300:case 36308:case 36293:return OR;case 36289:case 36303:case 36311:case 36292:return PR}}function BR(e,t){e.uniform1fv(this.addr,t)}function FR(e,t){let n=lo(t,this.size,2);e.uniform2fv(this.addr,n)}function zR(e,t){let n=lo(t,this.size,3);e.uniform3fv(this.addr,n)}function HR(e,t){let n=lo(t,this.size,4);e.uniform4fv(this.addr,n)}function GR(e,t){let n=lo(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function VR(e,t){let n=lo(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function kR(e,t){let n=lo(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function WR(e,t){e.uniform1iv(this.addr,t)}function XR(e,t){e.uniform2iv(this.addr,t)}function qR(e,t){e.uniform3iv(this.addr,t)}function YR(e,t){e.uniform4iv(this.addr,t)}function ZR(e,t){e.uniform1uiv(this.addr,t)}function KR(e,t){e.uniform2uiv(this.addr,t)}function JR(e,t){e.uniform3uiv(this.addr,t)}function QR(e,t){e.uniform4uiv(this.addr,t)}function jR(e,t,n){let i=this.cache,s=t.length,a=Af(n,s);We(i,a)||(e.uniform1iv(this.addr,a),Xe(i,a));let r;this.type===e.SAMPLER_2D_SHADOW?r=wf(eM):r=tM;for(let o=0;o!==s;++o)n.setTexture2D(t[o]||r,a[o])}function $R(e,t,n){let i=this.cache,s=t.length,a=Af(n,s);We(i,a)||(e.uniform1iv(this.addr,a),Xe(i,a));for(let r=0;r!==s;++r)n.setTexture3D(t[r]||sM,a[r])}function tC(e,t,n){let i=this.cache,s=t.length,a=Af(n,s);We(i,a)||(e.uniform1iv(this.addr,a),Xe(i,a));let r;this.type===e.SAMPLER_CUBE_SHADOW?r=wf(nM):r=aM;for(let o=0;o!==s;++o)n.setTextureCube(t[o]||r,a[o])}function eC(e,t,n){let i=this.cache,s=t.length,a=Af(n,s);We(i,a)||(e.uniform1iv(this.addr,a),Xe(i,a));for(let r=0;r!==s;++r)n.setTexture2DArray(t[r]||iM,a[r])}function nC(e){switch(e){case 5126:return BR;case 35664:return FR;case 35665:return zR;case 35666:return HR;case 35674:return GR;case 35675:return VR;case 35676:return kR;case 5124:case 35670:return WR;case 35667:case 35671:return XR;case 35668:case 35672:return qR;case 35669:case 35673:return YR;case 5125:return ZR;case 36294:return KR;case 36295:return JR;case 36296:return QR;case 35678:case 36198:case 36298:case 36306:case 35682:return jR;case 35679:case 36299:case 36307:return $R;case 35680:case 36300:case 36308:case 36293:return tC;case 36289:case 36303:case 36311:case 36292:return eC}}function FS(e,t){e.seq.push(t),e.map[t.id]=t}function iC(e,t,n){let i=e.name,s=i.length;for(xg.lastIndex=0;;){let a=xg.exec(i),r=xg.lastIndex,o=a[1],l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&r+2===s){FS(n,c===void 0?new Mg(o,e,t):new bg(o,e,t));break}else{let p=n.map[o];p===void 0&&(p=new Tg(o),FS(n,p)),n=p}}}function zS(e,t,n){let i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}function rC(e,t){let n=e.split(`
`),i=[],s=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let r=s;r<a;r++){let o=r+1;i.push(`${o===t?">":" "} ${o}: ${n[r]}`)}return i.join(`
`)}function oC(e){Kt._getMatrix(HS,Kt.workingColorSpace,e);let t=`mat3( ${HS.elements.map(n=>n.toFixed(4))} )`;switch(Kt.getTransfer(e)){case El:return[t,"LinearTransferOETF"];case re:return[t,"sRGBTransferOETF"];default:return Dt("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function GS(e,t,n){let i=e.getShaderParameter(t,e.COMPILE_STATUS),a=(e.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";let r=/ERROR: 0:(\d+)/.exec(a);if(r){let o=parseInt(r[1]);return n.toUpperCase()+`

`+a+`

`+rC(e.getShaderSource(t),o)}else return a}function lC(e,t){let n=oC(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}function uC(e,t){let n=cC[t];return n===void 0?(Dt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}function hC(){Kt.getLuminanceCoefficients(bf);let e=bf.x.toFixed(4),t=bf.y.toFixed(4),n=bf.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function fC(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(jl).join(`
`)}function dC(e){let t=[];for(let n in e){let i=e[n];i!==!1&&t.push("#define "+n+" "+i)}return t.join(`
`)}function pC(e,t){let n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let a=e.getActiveAttrib(t,s),r=a.name,o=1;a.type===e.FLOAT_MAT2&&(o=2),a.type===e.FLOAT_MAT3&&(o=3),a.type===e.FLOAT_MAT4&&(o=4),n[r]={type:a.type,location:e.getAttribLocation(t,r),locationSize:o}}return n}function jl(e){return e!==""}function VS(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function kS(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}function Eg(e){return e.replace(mC,gC)}function gC(e,t){let n=kt[t];if(n===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">");return Eg(n)}function WS(e){return e.replace(_C,vC)}function vC(e,t,n,i){let s="";for(let a=parseInt(t);a<parseInt(n);a++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function XS(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision==="highp"?t+=`
#define HIGH_PRECISION`:e.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:e.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function xC(e){return yC[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}function MC(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":SC[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}function TC(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":bC[e.combine]||"ENVMAP_BLENDING_NONE"}function EC(e,t,n,i){let s=e.getContext(),a=n.defines,r=n.vertexShader,o=n.fragmentShader,l=xC(n),c=n.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",f=MC(n),p=TC(n),u=fC(n),d=dC(a),v=s.createProgram(),T,_,h=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(T=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,d].filter(jl).join(`
`),T.length>0&&(T+=`
`),_=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,d].filter(jl).join(`
`),_.length>0&&(_+=`
`)):(T=[XS(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,d,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+f:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+n.diffuseRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(jl).join(`
`),_=[XS(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,d,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+c:"",n.envMap?"#define "+f:"",n.envMap?"#define "+p:"",n.envMapPMREM?"#define ENVMAP_MAX_LOD "+n.envMapMaxLod+".0":"",n.envMapPMREM?"#define ENVMAP_SIZE "+n.envMapSize+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",n.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==Gi?"#define TONE_MAPPING":"",n.toneMapping!==Gi?kt.tonemapping_pars_fragment:"",n.toneMapping!==Gi?uC("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",kt.colorspace_pars_fragment,lC("linearToOutputTexel",n.outputColorSpace),hC(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(jl).join(`
`)),r=Eg(r),r=VS(r,n),r=kS(r,n),o=Eg(o),o=VS(o,n),o=kS(o,n),r=WS(r),o=WS(o),n.isRawShaderMaterial!==!0&&(h=`#version 300 es
`,T=[u,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+T,_=["#define varying in",n.glslVersion===ag?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===ag?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+_);let m=h+T+r,y=h+_+o,x=zS(s,s.VERTEX_SHADER,m),E=zS(s,s.FRAGMENT_SHADER,y);s.attachShader(v,x),s.attachShader(v,E),n.index0AttributeName!==void 0?s.bindAttribLocation(v,0,n.index0AttributeName):n.hasPositionAttribute===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function A(R){if(e.debug.checkShaderErrors){let O=s.getProgramInfoLog(v)||"",F=s.getShaderInfoLog(x)||"",q=s.getShaderInfoLog(E)||"",L=O.trim(),W=F.trim(),Z=q.trim(),G=!0,nt=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(G=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(s,v,x,E);else{let V=GS(s,x,"vertex"),j=GS(s,E,"fragment");Ot("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+L+`
`+V+`
`+j)}else L!==""?Dt("WebGLProgram: Program Info Log:",L):(W===""||Z==="")&&(nt=!1);nt&&(R.diagnostics={runnable:G,programLog:L,vertexShader:{log:W,prefix:T},fragmentShader:{log:Z,prefix:_}})}s.deleteShader(x),s.deleteShader(E),g=new oo(s,v),M=pC(s,v)}let g;this.getUniforms=function(){return g===void 0&&A(this),g};let M;this.getAttributes=function(){return M===void 0&&A(this),M};let N=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return N===!1&&(N=s.getProgramParameter(v,sC)),N},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=aC++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=x,this.fragmentShader=E,this}function wC(e){return e===oa||e===Kl||e===Jl}function RC(e,t,n,i,s,a){let r=new Cl,o=new Ag,l=new Set,c=[],f=new Map,p=i.logarithmicDepthBuffer,u={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function d(g){return l.add(g),g===0?"uv":`uv${g}`}function v(g,M,N,R,O,F){let q=R.fog,L=O.geometry,W=g.isMeshStandardMaterial||g.isMeshLambertMaterial||g.isMeshPhongMaterial?R.environment:null,Z=g.isMeshStandardMaterial||g.isMeshLambertMaterial&&!g.envMap||g.isMeshPhongMaterial&&!g.envMap,G=t.get(g.envMap||W,Z),nt=u[g.type],V=i.precision;g.precision!==null&&(V=i.getMaxPrecision(g.precision),V!==g.precision&&Dt("WebGLProgram.getParameters:",g.precision,"not supported, using",V,"instead."));let j=L.morphAttributes.position||L.morphAttributes.normal||L.morphAttributes.color,tt=j!==void 0?j.length:0,yt=0;L.morphAttributes.position!==void 0&&(yt=1),L.morphAttributes.normal!==void 0&&(yt=2),L.morphAttributes.color!==void 0&&(yt=3);let Lt,k,dt,vt;if(nt){let mt=ki[nt];Lt=mt.vertexShader,k=mt.fragmentShader}else{Lt=g.vertexShader,k=g.fragmentShader;let mt=o.getVertexShaderStage(g),le=o.getFragmentShaderStage(g);o.update(g,mt,le),dt=mt.id,vt=le.id}let At=e.getRenderTarget(),pt=e.state.buffers.depth.getReversed(),Nt=O.isInstancedMesh===!0,Me=O.isBatchedMesh===!0,Tt=!!g.map,ie=!!g.matcap,se=!!G,zt=se&&G.isPMREMTexture===!0,Pe=!!g.aoMap,Ct=!!g.lightMap,Xt=!!g.bumpMap&&g.wireframe===!1,It=!!g.normalMap,be=!!g.displacementMap,pe=!!g.emissiveMap,en=!!g.metalnessMap,gn=!!g.roughnessMap,qe=g.anisotropy>0,U=g.clearcoat>0,_n=g.diffuseRoughness>0,oe=g.dispersion>0,me=g.retroreflectivity>0,ft=g.iridescence>0,Ue=g.sheen>0,wt=g.transmission>0,Ut=qe&&!!g.anisotropyMap,w=U&&!!g.clearcoatMap,S=U&&!!g.clearcoatNormalMap,P=U&&!!g.clearcoatRoughnessMap,et=_n&&!!g.diffuseRoughnessMap,Q=ft&&!!g.iridescenceMap,rt=ft&&!!g.iridescenceThicknessMap,it=Ue&&!!g.sheenColorMap,Y=Ue&&!!g.sheenRoughnessMap,K=!!g.specularMap,lt=!!g.specularColorMap,C=!!g.specularIntensityMap,J=wt&&!!g.transmissionMap,X=wt&&!!g.thicknessMap,ct=!!g.gradientMap,at=!!g.alphaMap,ot=g.alphaTest>0,Et=!!g.alphaHash,Gt=!!g.extensions,st=Gi;g.toneMapped&&(At===null||At.isXRRenderTarget===!0)&&(st=e.toneMapping);let Rt=zt?G.isCompressedCubeTexture?G.image[0].mipmaps:G.mipmaps:null,Ht={shaderID:nt,shaderType:g.type,shaderName:g.name,vertexShader:Lt,fragmentShader:k,defines:g.defines,customVertexShaderID:dt,customFragmentShaderID:vt,isRawShaderMaterial:g.isRawShaderMaterial===!0,glslVersion:g.glslVersion,precision:V,batching:Me,batchingColor:Me&&O._colorsTexture!==null,instancing:Nt,instancingColor:Nt&&O.instanceColor!==null,instancingMorph:Nt&&O.morphTexture!==null,outputColorSpace:At===null?e.outputColorSpace:At.isXRRenderTarget===!0?At.texture.colorSpace:Kt.workingColorSpace,alphaToCoverage:!!g.alphaToCoverage,map:Tt,matcap:ie,envMap:se,envMapMode:se&&G.mapping,envMapPMREM:zt,envMapMaxLod:zt?Rt.length-1:null,envMapSize:zt?Rt[0].width:null,aoMap:Pe,lightMap:Ct,bumpMap:Xt,normalMap:It,displacementMap:be,emissiveMap:pe,normalMapObjectSpace:It&&g.normalMapType===hS,normalMapTangentSpace:It&&g.normalMapType===eg,packedNormalMap:It&&g.normalMapType===eg&&wC(g.normalMap.format),metalnessMap:en,roughnessMap:gn,anisotropy:qe,anisotropyMap:Ut,clearcoat:U,clearcoatMap:w,clearcoatNormalMap:S,clearcoatRoughnessMap:P,diffuseRoughness:_n,diffuseRoughnessMap:et,dispersion:oe,retroreflection:me,iridescence:ft,iridescenceMap:Q,iridescenceThicknessMap:rt,sheen:Ue,sheenColorMap:it,sheenRoughnessMap:Y,specularMap:K,specularColorMap:lt,specularIntensityMap:C,transmission:wt,transmissionMap:J,thicknessMap:X,gradientMap:ct,opaque:g.transparent===!1&&g.blending===io&&g.alphaToCoverage===!1,alphaMap:at,alphaTest:ot,alphaHash:Et,combine:g.combine,mapUv:Tt&&d(g.map.channel),aoMapUv:Pe&&d(g.aoMap.channel),lightMapUv:Ct&&d(g.lightMap.channel),bumpMapUv:Xt&&d(g.bumpMap.channel),normalMapUv:It&&d(g.normalMap.channel),displacementMapUv:be&&d(g.displacementMap.channel),emissiveMapUv:pe&&d(g.emissiveMap.channel),metalnessMapUv:en&&d(g.metalnessMap.channel),roughnessMapUv:gn&&d(g.roughnessMap.channel),anisotropyMapUv:Ut&&d(g.anisotropyMap.channel),clearcoatMapUv:w&&d(g.clearcoatMap.channel),clearcoatNormalMapUv:S&&d(g.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:P&&d(g.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:et&&d(g.diffuseRoughnessMap.channel),iridescenceMapUv:Q&&d(g.iridescenceMap.channel),iridescenceThicknessMapUv:rt&&d(g.iridescenceThicknessMap.channel),sheenColorMapUv:it&&d(g.sheenColorMap.channel),sheenRoughnessMapUv:Y&&d(g.sheenRoughnessMap.channel),specularMapUv:K&&d(g.specularMap.channel),specularColorMapUv:lt&&d(g.specularColorMap.channel),specularIntensityMapUv:C&&d(g.specularIntensityMap.channel),transmissionMapUv:J&&d(g.transmissionMap.channel),thicknessMapUv:X&&d(g.thicknessMap.channel),alphaMapUv:at&&d(g.alphaMap.channel),vertexTangents:!!L.attributes.tangent&&(It||qe),vertexNormals:!!L.attributes.normal,vertexColors:g.vertexColors,vertexAlphas:g.vertexColors===!0&&!!L.attributes.color&&L.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!L.attributes.uv&&(Tt||at),fog:!!q,useFog:g.fog===!0,fogExp2:!!q&&q.isFogExp2,flatShading:g.wireframe===!1&&(g.flatShading===!0||L.attributes.normal===void 0&&It===!1&&(g.isMeshLambertMaterial||g.isMeshPhongMaterial||g.isMeshStandardMaterial||g.isMeshPhysicalMaterial)),sizeAttenuation:g.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:pt,skinning:O.isSkinnedMesh===!0,hasPositionAttribute:L.attributes.position!==void 0,morphTargets:L.morphAttributes.position!==void 0,morphNormals:L.morphAttributes.normal!==void 0,morphColors:L.morphAttributes.color!==void 0,morphTargetsCount:tt,morphTextureStride:yt,numSunLights:M.sun.length,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numSunLightShadows:M.sunShadowMap.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numLightProbeGrids:F.filter(mt=>mt.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:g.dithering,shadowMapEnabled:e.shadowMap.enabled&&N.length>0,shadowMapType:e.shadowMap.type,toneMapping:st,decodeVideoTexture:Tt&&g.map.isVideoTexture===!0&&Kt.getTransfer(g.map.colorSpace)===re,decodeVideoTextureEmissive:pe&&g.emissiveMap.isVideoTexture===!0&&Kt.getTransfer(g.emissiveMap.colorSpace)===re,premultipliedAlpha:g.premultipliedAlpha,doubleSided:g.side===Hi,flipSided:g.side===wn,useDepthPacking:g.depthPacking>=0,depthPacking:g.depthPacking||0,index0AttributeName:g.index0AttributeName,extensionClipCullDistance:Gt&&g.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Gt&&g.extensions.multiDraw===!0||Me)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:g.customProgramCacheKey()};return Ht.vertexUv1s=l.has(1),Ht.vertexUv2s=l.has(2),Ht.vertexUv3s=l.has(3),l.clear(),Ht}function T(g){let M=[];if(g.shaderID?M.push(g.shaderID):(M.push(g.customVertexShaderID),M.push(g.customFragmentShaderID)),g.defines!==void 0)for(let N in g.defines)M.push(N),M.push(g.defines[N]);return g.isRawShaderMaterial===!1&&(_(M,g),h(M,g),M.push(e.outputColorSpace)),M.push(g.customProgramCacheKey),M.join()}function _(g,M){g.push(M.precision),g.push(M.outputColorSpace),g.push(M.envMapMode),g.push(M.envMapPMREM),g.push(M.envMapMaxLod),g.push(M.envMapSize),g.push(M.mapUv),g.push(M.alphaMapUv),g.push(M.lightMapUv),g.push(M.aoMapUv),g.push(M.bumpMapUv),g.push(M.normalMapUv),g.push(M.displacementMapUv),g.push(M.emissiveMapUv),g.push(M.metalnessMapUv),g.push(M.roughnessMapUv),g.push(M.anisotropyMapUv),g.push(M.clearcoatMapUv),g.push(M.clearcoatNormalMapUv),g.push(M.clearcoatRoughnessMapUv),g.push(M.diffuseRoughnessMapUv),g.push(M.iridescenceMapUv),g.push(M.iridescenceThicknessMapUv),g.push(M.sheenColorMapUv),g.push(M.sheenRoughnessMapUv),g.push(M.specularMapUv),g.push(M.specularColorMapUv),g.push(M.specularIntensityMapUv),g.push(M.transmissionMapUv),g.push(M.thicknessMapUv),g.push(M.combine),g.push(M.fogExp2),g.push(M.sizeAttenuation),g.push(M.morphTargetsCount),g.push(M.numSunLights),g.push(M.numDirLights),g.push(M.numPointLights),g.push(M.numSpotLights),g.push(M.numSpotLightMaps),g.push(M.numHemiLights),g.push(M.numRectAreaLights),g.push(M.numSunLightShadows),g.push(M.numDirLightShadows),g.push(M.numPointLightShadows),g.push(M.numSpotLightShadows),g.push(M.numSpotLightShadowsWithMaps),g.push(M.numLightProbes),g.push(M.numLightProbeGrids),g.push(M.shadowMapType),g.push(M.toneMapping),g.push(M.numClippingPlanes),g.push(M.numClipIntersection),g.push(M.depthPacking)}function h(g,M){r.disableAll(),M.instancing&&r.enable(0),M.instancingColor&&r.enable(1),M.instancingMorph&&r.enable(2),M.matcap&&r.enable(3),M.envMap&&r.enable(4),M.normalMapObjectSpace&&r.enable(5),M.normalMapTangentSpace&&r.enable(6),M.clearcoat&&r.enable(7),M.iridescence&&r.enable(8),M.alphaTest&&r.enable(9),M.vertexColors&&r.enable(10),M.vertexAlphas&&r.enable(11),M.vertexUv1s&&r.enable(12),M.vertexUv2s&&r.enable(13),M.vertexUv3s&&r.enable(14),M.vertexTangents&&r.enable(15),M.anisotropy&&r.enable(16),M.alphaHash&&r.enable(17),M.batching&&r.enable(18),M.dispersion&&r.enable(19),M.retroreflection&&r.enable(24),M.diffuseRoughness&&r.enable(25),M.batchingColor&&r.enable(20),M.gradientMap&&r.enable(21),M.packedNormalMap&&r.enable(22),M.vertexNormals&&r.enable(23),g.push(r.mask),r.disableAll(),M.fog&&r.enable(0),M.useFog&&r.enable(1),M.flatShading&&r.enable(2),M.logarithmicDepthBuffer&&r.enable(3),M.reversedDepthBuffer&&r.enable(4),M.skinning&&r.enable(5),M.morphTargets&&r.enable(6),M.morphNormals&&r.enable(7),M.morphColors&&r.enable(8),M.premultipliedAlpha&&r.enable(9),M.shadowMapEnabled&&r.enable(10),M.doubleSided&&r.enable(11),M.flipSided&&r.enable(12),M.useDepthPacking&&r.enable(13),M.dithering&&r.enable(14),M.transmission&&r.enable(15),M.sheen&&r.enable(16),M.opaque&&r.enable(17),M.pointsUvs&&r.enable(18),M.decodeVideoTexture&&r.enable(19),M.decodeVideoTextureEmissive&&r.enable(20),M.alphaToCoverage&&r.enable(21),M.numLightProbeGrids>0&&r.enable(22),M.hasPositionAttribute&&r.enable(23),g.push(r.mask)}function m(g){let M=u[g.type],N;if(M){let R=ki[M];N=AS.clone(R.uniforms)}else N=g.uniforms;return N}function y(g,M){let N=f.get(M);return N!==void 0?++N.usedTimes:(N=new EC(e,M,g,s),c.push(N),f.set(M,N)),N}function x(g){if(--g.usedTimes===0){let M=c.indexOf(g);c[M]=c[c.length-1],c.pop(),f.delete(g.cacheKey),g.destroy()}}function E(g){o.remove(g)}function A(){o.dispose()}return{getParameters:v,getProgramCacheKey:T,getUniforms:m,acquireProgram:y,releaseProgram:x,releaseShaderCache:E,programs:c,dispose:A}}function CC(){let e=new WeakMap;function t(r){return e.has(r)}function n(r){let o=e.get(r);return o===void 0&&(o={},e.set(r,o)),o}function i(r){e.delete(r)}function s(r,o,l){e.get(r)[o]=l}function a(){e=new WeakMap}return{has:t,get:n,remove:i,update:s,dispose:a}}function DC(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.materialVariant!==t.materialVariant?e.materialVariant-t.materialVariant:e.z!==t.z?e.z-t.z:e.id-t.id}function qS(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function YS(){let e=[],t=0,n=[],i=[],s=[];function a(){t=0,n.length=0,i.length=0,s.length=0}function r(u){let d=0;return u.isInstancedMesh&&(d+=2),u.isSkinnedMesh&&(d+=1),d}function o(u,d,v,T,_,h){let m=e[t];return m===void 0?(m={id:u.id,object:u,geometry:d,material:v,materialVariant:r(u),groupOrder:T,renderOrder:u.renderOrder,z:_,group:h},e[t]=m):(m.id=u.id,m.object=u,m.geometry=d,m.material=v,m.materialVariant=r(u),m.groupOrder=T,m.renderOrder=u.renderOrder,m.z=_,m.group=h),t++,m}function l(u,d,v,T,_,h,m){m.reversedDepth===!0&&(_=-_);let y=o(u,d,v,T,_,h);v.transmission>0?i.push(y):v.transparent===!0?s.push(y):n.push(y)}function c(u,d,v,T,_,h){let m=o(u,d,v,T,_,h);v.transmission>0?i.unshift(m):v.transparent===!0?s.unshift(m):n.unshift(m)}function f(u,d){n.length>1&&n.sort(u||DC),i.length>1&&i.sort(d||qS),s.length>1&&s.sort(d||qS)}function p(){for(let u=t,d=e.length;u<d;u++){let v=e[u];if(v.id===null)break;v.id=null,v.object=null,v.geometry=null,v.material=null,v.group=null}}return{opaque:n,transmissive:i,transparent:s,init:a,push:l,unshift:c,finish:p,sort:f}}function LC(){let e=new WeakMap;function t(i,s){let a=e.get(i),r;return a===void 0?(r=new YS,e.set(i,[r])):s>=a.length?(r=new YS,a.push(r)):r=a[s],r}function n(){e=new WeakMap}return{get:t,dispose:n}}function NC(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={direction:new z,color:new te};break;case"SpotLight":n={position:new z,direction:new z,color:new te,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new z,color:new te,distance:0,decay:0};break;case"HemisphereLight":n={direction:new z,skyColor:new te,groundColor:new te};break;case"RectAreaLight":n={color:new te,position:new z,halfWidth:new z,halfHeight:new z};break}return e[t.id]=n,n}}}function UC(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new jt};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new jt};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new jt,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}function PC(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function IC(e){let t=new NC,n=UC(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new z);let s=new z,a=new Ce,r=new Ce;function o(c){let f=0,p=0,u=0;for(let F=0;F<9;F++)i.probe[F].set(0,0,0);let d=0,v=0,T=0,_=0,h=0,m=0,y=0,x=0,E=0,A=0,g=0,M=0,N=0,R=0;c.sort(PC);for(let F=0,q=c.length;F<q;F++){let L=c[F],W=L.color,Z=L.intensity,G=L.distance,nt=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===oa?nt=L.shadow.map.texture:nt=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)f+=W.r*Z,p+=W.g*Z,u+=W.b*Z;else if(L.isLightProbe){for(let V=0;V<9;V++)i.probe[V].addScaledVector(L.sh.coefficients[V],Z);R++}else if(L.isSunLight){let V=t.get(L);if(V.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let j=L.shadow,tt=n.get(L);tt.shadowIntensity=j.intensity,tt.shadowBias=j.bias,tt.shadowNormalBias=j.normalBias,tt.shadowRadius=j.radius,tt.shadowMapSize.copy(j.mapSize).multiply(j.getFrameExtents()),i.sunShadow[v]=tt,i.sunShadowMap[v]=nt;let yt=j.getViewportCount();for(let Lt=0;Lt<yt;Lt++)i.sunShadowMatrix[T+Lt]=j.getMatrix(Lt),i.sunShadowCascade[T+Lt]=j._cascadeData[Lt];T+=yt,v++}i.sun[d]=V,d++}else if(L.isDirectionalLight){let V=t.get(L);if(V.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let j=L.shadow,tt=n.get(L);tt.shadowIntensity=j.intensity,tt.shadowBias=j.bias,tt.shadowNormalBias=j.normalBias,tt.shadowRadius=j.radius,tt.shadowMapSize=j.mapSize,i.directionalShadow[_]=tt,i.directionalShadowMap[_]=nt,i.directionalShadowMatrix[_]=L.shadow.matrix,E++}i.directional[_]=V,_++}else if(L.isSpotLight){let V=t.get(L);V.position.setFromMatrixPosition(L.matrixWorld),V.color.copy(W).multiplyScalar(Z),V.distance=G,V.coneCos=Math.cos(L.angle),V.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),V.decay=L.decay,i.spot[m]=V;let j=L.shadow;if(L.map&&(i.spotLightMap[M]=L.map,M++,j.updateMatrices(L),L.castShadow&&N++),i.spotLightMatrix[m]=j.matrix,L.castShadow){let tt=n.get(L);tt.shadowIntensity=j.intensity,tt.shadowBias=j.bias,tt.shadowNormalBias=j.normalBias,tt.shadowRadius=j.radius,tt.shadowMapSize=j.mapSize,i.spotShadow[m]=tt,i.spotShadowMap[m]=nt,g++}m++}else if(L.isRectAreaLight){let V=t.get(L);V.color.copy(W).multiplyScalar(Z),V.halfWidth.set(L.width*.5,0,0),V.halfHeight.set(0,L.height*.5,0),i.rectArea[y]=V,y++}else if(L.isPointLight){let V=t.get(L);if(V.color.copy(L.color).multiplyScalar(L.intensity),V.distance=L.distance,V.decay=L.decay,L.castShadow){let j=L.shadow,tt=n.get(L);tt.shadowIntensity=j.intensity,tt.shadowBias=j.bias,tt.shadowNormalBias=j.normalBias,tt.shadowRadius=j.radius,tt.shadowMapSize=j.mapSize,tt.shadowCameraNear=j.camera.near,tt.shadowCameraFar=j.camera.far,i.pointShadow[h]=tt,i.pointShadowMap[h]=nt,i.pointShadowMatrix[h]=L.shadow.matrix,A++}i.point[h]=V,h++}else if(L.isHemisphereLight){let V=t.get(L);V.skyColor.copy(L.color).multiplyScalar(Z),V.groundColor.copy(L.groundColor).multiplyScalar(Z),i.hemi[x]=V,x++}}y>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=gt.LTC_FLOAT_1,i.rectAreaLTC2=gt.LTC_FLOAT_2):(i.rectAreaLTC1=gt.LTC_HALF_1,i.rectAreaLTC2=gt.LTC_HALF_2)),i.ambient[0]=f,i.ambient[1]=p,i.ambient[2]=u;let O=i.hash;(O.sunLength!==d||O.directionalLength!==_||O.pointLength!==h||O.spotLength!==m||O.rectAreaLength!==y||O.hemiLength!==x||O.numSunShadows!==v||O.numDirectionalShadows!==E||O.numPointShadows!==A||O.numSpotShadows!==g||O.numSpotMaps!==M||O.numLightProbes!==R)&&(i.sun.length=d,i.directional.length=_,i.spot.length=m,i.rectArea.length=y,i.point.length=h,i.hemi.length=x,i.sunShadow.length=v,i.sunShadowMap.length=v,i.sunShadowMatrix.length=T,i.sunShadowCascade.length=T,i.directionalShadow.length=E,i.directionalShadowMap.length=E,i.directionalShadowMatrix.length=E,i.pointShadow.length=A,i.pointShadowMap.length=A,i.pointShadowMatrix.length=A,i.spotShadow.length=g,i.spotShadowMap.length=g,i.spotLightMatrix.length=g+M-N,i.spotLightMap.length=M,i.numSpotLightShadowsWithMaps=N,i.numLightProbes=R,O.sunLength=d,O.directionalLength=_,O.pointLength=h,O.spotLength=m,O.rectAreaLength=y,O.hemiLength=x,O.numSunShadows=v,O.numDirectionalShadows=E,O.numPointShadows=A,O.numSpotShadows=g,O.numSpotMaps=M,O.numLightProbes=R,i.version=OC++)}function l(c,f){let p=0,u=0,d=0,v=0,T=0,_=0,h=f.matrixWorldInverse;for(let m=0,y=c.length;m<y;m++){let x=c[m];if(x.isSunLight){let E=i.sun[p];E.direction.setFromMatrixPosition(x.matrixWorld),E.direction.transformDirection(h),p++}else if(x.isDirectionalLight){let E=i.directional[u];E.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(h),u++}else if(x.isSpotLight){let E=i.spot[v];E.position.setFromMatrixPosition(x.matrixWorld),E.position.applyMatrix4(h),E.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(h),v++}else if(x.isRectAreaLight){let E=i.rectArea[T];E.position.setFromMatrixPosition(x.matrixWorld),E.position.applyMatrix4(h),r.identity(),a.copy(x.matrixWorld),a.premultiply(h),r.extractRotation(a),E.halfWidth.set(x.width*.5,0,0),E.halfHeight.set(0,x.height*.5,0),E.halfWidth.applyMatrix4(r),E.halfHeight.applyMatrix4(r),T++}else if(x.isPointLight){let E=i.point[d];E.position.setFromMatrixPosition(x.matrixWorld),E.position.applyMatrix4(h),d++}else if(x.isHemisphereLight){let E=i.hemi[_];E.direction.setFromMatrixPosition(x.matrixWorld),E.direction.transformDirection(h),_++}}}return{setup:o,setupView:l,state:i}}function ZS(e){let t=new IC(e),n=[],i=[],s=[];function a(p){f.camera=p,n.length=0,i.length=0,s.length=0}function r(p){p.isLightProbeGrid?s.push(p):n.push(p)}function o(p){i.push(p)}function l(){t.setup(n),s.sort((p,u)=>p.priority-u.priority||p.id-u.id)}function c(p){t.setupView(n,p)}let f={lightsArray:n,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:f,setupLights:l,setupLightsView:c,pushLight:r,pushShadow:o}}function BC(e){let t=new WeakMap;function n(s,a=0){let r=t.get(s),o;return r===void 0?(o=new ZS(e),t.set(s,[o])):a>=r.length?(o=new ZS(e),r.push(o)):o=r[a],o}function i(){t=new WeakMap}return{get:n,dispose:i}}function VC(e,t,n){let i=new Ha,s=new jt,a=new jt,r=new De,o=new xh,l=new Sh,c={},f=n.maxTextureSize,p={[zi]:wn,[wn]:zi,[Hi]:Hi},u=new Wn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new jt},radius:{value:4}},vertexShader:FC,fragmentShader:zC}),d=u.clone();d.defines.HORIZONTAL_PASS=1;let v=new li;v.setAttribute("position",new Gn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let T=new ci(v,u),_=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=kl;let h=this.type;this.render=function(A,g,M){if(_.enabled===!1||_.autoUpdate===!1&&_.needsUpdate===!1||A.length===0)return;this.type===Vx&&(Dt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=kl);let N=e.getRenderTarget(),R=e.getActiveCubeFace(),O=e.getActiveMipmapLevel(),F=e.state;F.setBlending(Ga),F.buffers.depth.getReversed()===!0?F.buffers.color.setClear(0,0,0,0):F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);let q=h!==this.type;q&&g.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(W=>W.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,W=A.length;L<W;L++){let Z=A[L],G=Z.shadow;if(G===void 0){Dt("WebGLShadowMap:",Z,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);let nt=G.getFrameExtents();s.multiply(nt),a.copy(G.mapSize),(s.x>f||s.y>f)&&(s.x>f&&(a.x=Math.floor(f/nt.x),s.x=a.x*nt.x,G.mapSize.x=a.x),s.y>f&&(a.y=Math.floor(f/nt.y),s.y=a.y*nt.y,G.mapSize.y=a.y));let V=e.state.buffers.depth.getReversed();if(G.camera._reversedDepth=V,G.map===null||q===!0){if(G.map!==null&&(G.map.depthTexture!==null&&(G.map.depthTexture.dispose(),G.map.depthTexture=null),G.map.dispose()),this.type===no){if(Z.isPointLight){Dt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}G.map=new Vn(s.x,s.y,{format:oa,type:Ti,minFilter:An,magFilter:An,generateMipmaps:!1}),G.map.texture.name=Z.name+".shadowMap",G.map.depthTexture=new _s(s.x,s.y,bi),G.map.depthTexture.name=Z.name+".shadowMapDepth",G.map.depthTexture.format=gs,G.map.depthTexture.compareFunction=null,G.map.depthTexture.minFilter=tn,G.map.depthTexture.magFilter=tn}else Z.isPointLight?(G.map=new $l(s.x),G.map.depthTexture=new Il(s.x,Mi)):(G.map=new Vn(s.x,s.y),G.map.depthTexture=new _s(s.x,s.y,Mi)),G.map.depthTexture.name=Z.name+".shadowMap",G.map.depthTexture.format=gs,this.type===kl?(G.map.depthTexture.compareFunction=V?ig:ng,G.map.depthTexture.minFilter=An,G.map.depthTexture.magFilter=An):(G.map.depthTexture.compareFunction=null,G.map.depthTexture.minFilter=tn,G.map.depthTexture.magFilter=tn);G.camera.updateProjectionMatrix()}G.map.isWebGLCubeRenderTarget!==!0&&(G.map.width!==s.x||G.map.height!==s.y)&&G.map.setSize(s.x,s.y);let j=G.map.isWebGLCubeRenderTarget?6:G.getViewportCount();Z.isPointLight!==!0&&G.updateMatrices(Z,M);let tt=(G.camera.layers.mask&4294967294)!==0?G.camera.layers:M.layers;for(let yt=0;yt<j;yt++){let Lt=G.getCamera(yt);if(Z.isPointLight){let k=G.camera,dt=G.matrix,vt=Z.distance||k.far;vt!==k.far&&(k.far=vt,k.updateProjectionMatrix()),Ql.setFromMatrixPosition(Z.matrixWorld),k.position.copy(Ql),Sg.copy(k.position),Sg.add(HC[yt]),k.up.copy(GC[yt]),k.lookAt(Sg),k.updateMatrixWorld(),dt.makeTranslation(-Ql.x,-Ql.y,-Ql.z),KS.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),G._frustum.setFromProjectionMatrix(KS,k.coordinateSystem,k.reversedDepth)}if(G.map.isWebGLCubeRenderTarget)e.setRenderTarget(G.map,yt),e.clear();else{yt===0&&(e.setRenderTarget(G.map),e.clear());let k=G.getViewport(yt);r.set(a.x*k.x,a.y*k.y,a.x*k.z,a.y*k.w),F.viewport(r)}i=G.getFrustum(yt),x(g,M,Lt,Z,tt,this.type)}G.isPointLightShadow!==!0&&this.type===no&&m(G,M),G.needsUpdate=!1}h=this.type,_.needsUpdate=!1,e.setRenderTarget(N,R,O)};function m(A,g){let M=t.update(T);u.defines.VSM_SAMPLES!==A.blurSamples&&(u.defines.VSM_SAMPLES=A.blurSamples,d.defines.VSM_SAMPLES=A.blurSamples,u.needsUpdate=!0,d.needsUpdate=!0),A.mapPass===null?A.mapPass=new Vn(s.x,s.y,{format:oa,type:Ti}):(A.mapPass.width!==A.map.width||A.mapPass.height!==A.map.height)&&A.mapPass.setSize(A.map.width,A.map.height),u.uniforms.shadow_pass.value=A.map.depthTexture,u.uniforms.resolution.value.set(A.map.width,A.map.height),u.uniforms.radius.value=A.radius,e.setRenderTarget(A.mapPass),e.clear(),e.renderBufferDirect(g,null,M,u,T,null),d.uniforms.shadow_pass.value=A.mapPass.texture,d.uniforms.resolution.value.set(A.map.width,A.map.height),d.uniforms.radius.value=A.radius,e.setRenderTarget(A.map),e.clear(),e.renderBufferDirect(g,null,M,d,T,null)}function y(A,g,M,N){let R=null,O=M.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(O!==void 0)R=O;else if(R=M.isPointLight===!0?l:o,e.localClippingEnabled&&g.clipShadows===!0&&Array.isArray(g.clippingPlanes)&&g.clippingPlanes.length!==0||g.displacementMap&&g.displacementScale!==0||g.alphaMap&&g.alphaTest>0||g.map&&g.alphaTest>0||g.alphaToCoverage===!0){let F=R.uuid,q=g.uuid,L=c[F];L===void 0&&(L={},c[F]=L);let W=L[q];W===void 0&&(W=R.clone(),L[q]=W,g.addEventListener("dispose",E)),R=W}if(R.visible=g.visible,R.wireframe=g.wireframe,N===no?R.side=g.shadowSide!==null?g.shadowSide:g.side:R.side=g.shadowSide!==null?g.shadowSide:p[g.side],R.alphaMap=g.alphaMap,R.alphaTest=g.alphaToCoverage===!0?.5:g.alphaTest,R.map=g.map,R.clipShadows=g.clipShadows,R.clippingPlanes=g.clippingPlanes,R.clipIntersection=g.clipIntersection,R.displacementMap=g.displacementMap,R.displacementScale=g.displacementScale,R.displacementBias=g.displacementBias,R.wireframeLinewidth=g.wireframeLinewidth,R.linewidth=g.linewidth,M.isPointLight===!0&&R.isMeshDistanceMaterial===!0){let F=e.properties.get(R);F.light=M}return R}function x(A,g,M,N,R,O){if(A.visible===!1)return;if(A.layers.test(R)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&O===no)&&(!A.frustumCulled||A.intersectsFrustum(i))){A.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,A.matrixWorld);let L=t.update(A),W=A.material;if(Array.isArray(W)){let Z=L.groups;for(let G=0,nt=Z.length;G<nt;G++){let V=Z[G],j=W[V.materialIndex];if(j&&j.visible){let tt=y(A,j,N,O);A.onBeforeShadow(e,A,g,M,L,tt,V),e.renderBufferDirect(M,null,L,tt,A,V),A.onAfterShadow(e,A,g,M,L,tt,V)}}}else if(W.visible){let Z=y(A,W,N,O);A.onBeforeShadow(e,A,g,M,L,Z,null),e.renderBufferDirect(M,null,L,Z,A,null),A.onAfterShadow(e,A,g,M,L,Z,null)}}let q=A.children;for(let L=0,W=q.length;L<W;L++)x(q[L],g,M,N,R,O)}function E(A){A.target.removeEventListener("dispose",E);for(let M in c){let N=c[M],R=A.target.uuid;R in N&&(N[R].dispose(),delete N[R])}}}function kC(e,t){function n(){let C=!1,J=new De,X=null,ct=new De(0,0,0,0);return{setMask:function(at){X!==at&&!C&&(e.colorMask(at,at,at,at),X=at)},setLocked:function(at){C=at},setClear:function(at,ot,Et,Gt,st){st===!0&&(at*=Gt,ot*=Gt,Et*=Gt),J.set(at,ot,Et,Gt),ct.equals(J)===!1&&(e.clearColor(at,ot,Et,Gt),ct.copy(J))},reset:function(){C=!1,X=null,ct.set(-1,0,0,0)}}}function i(){let C=!1,J=!1,X=null,ct=null,at=null;return{setReversed:function(ot){if(J!==ot){let Et=t.get("EXT_clip_control");ot?Et.clipControlEXT(Et.LOWER_LEFT_EXT,Et.ZERO_TO_ONE_EXT):Et.clipControlEXT(Et.LOWER_LEFT_EXT,Et.NEGATIVE_ONE_TO_ONE_EXT),J=ot;let Gt=at;at=null,this.setClear(Gt)}},getReversed:function(){return J},setTest:function(ot){ot?pt(e.DEPTH_TEST):Nt(e.DEPTH_TEST)},setMask:function(ot){X!==ot&&!C&&(e.depthMask(ot),X=ot)},setFunc:function(ot){if(J&&(ot=MS[ot]),ct!==ot){switch(ot){case eh:e.depthFunc(e.NEVER);break;case nh:e.depthFunc(e.ALWAYS);break;case ih:e.depthFunc(e.LESS);break;case Kr:e.depthFunc(e.LEQUAL);break;case sh:e.depthFunc(e.EQUAL);break;case ah:e.depthFunc(e.GEQUAL);break;case rh:e.depthFunc(e.GREATER);break;case oh:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}ct=ot}},setLocked:function(ot){C=ot},setClear:function(ot){at!==ot&&(at=ot,J&&(ot=1-ot),e.clearDepth(ot))},reset:function(){C=!1,X=null,ct=null,at=null,J=!1}}}function s(){let C=!1,J=null,X=null,ct=null,at=null,ot=null,Et=null,Gt=null,st=null;return{setTest:function(Rt){C||(Rt?pt(e.STENCIL_TEST):Nt(e.STENCIL_TEST))},setMask:function(Rt){J!==Rt&&!C&&(e.stencilMask(Rt),J=Rt)},setFunc:function(Rt,Ht,mt){(X!==Rt||ct!==Ht||at!==mt)&&(e.stencilFunc(Rt,Ht,mt),X=Rt,ct=Ht,at=mt)},setOp:function(Rt,Ht,mt){(ot!==Rt||Et!==Ht||Gt!==mt)&&(e.stencilOp(Rt,Ht,mt),ot=Rt,Et=Ht,Gt=mt)},setLocked:function(Rt){C=Rt},setClear:function(Rt){st!==Rt&&(e.clearStencil(Rt),st=Rt)},reset:function(){C=!1,J=null,X=null,ct=null,at=null,ot=null,Et=null,Gt=null,st=null}}}let a=new n,r=new i,o=new s,l={},c=new WeakMap,f={},p={},u={},d=new WeakMap,v=[],T=null,_=!1,h=null,m=null,y=null,x=null,E=null,A=null,g=null,M=new te(0,0,0),N=0,R=!1,O=null,F=null,q=null,L=null,W=null,Z=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),G=!1,nt=0,V=e.getParameter(e.VERSION);V.indexOf("WebGL")!==-1?(nt=parseFloat(/^WebGL (\d)/.exec(V)[1]),G=nt>=1):V.indexOf("OpenGL ES")!==-1&&(nt=parseFloat(/^OpenGL ES (\d)/.exec(V)[1]),G=nt>=2);let j=null,tt={},yt=e.getParameter(e.SCISSOR_BOX),Lt=e.getParameter(e.VIEWPORT),k=new De().fromArray(yt),dt=new De().fromArray(Lt);function vt(C,J,X,ct){let at=new Uint8Array(4),ot=e.createTexture();e.bindTexture(C,ot),e.texParameteri(C,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(C,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Et=0;Et<X;Et++)C===e.TEXTURE_3D||C===e.TEXTURE_2D_ARRAY?e.texImage3D(J,0,e.RGBA,1,1,ct,0,e.RGBA,e.UNSIGNED_BYTE,at):e.texImage2D(J+Et,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,at);return ot}let At={};At[e.TEXTURE_2D]=vt(e.TEXTURE_2D,e.TEXTURE_2D,1),At[e.TEXTURE_CUBE_MAP]=vt(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),At[e.TEXTURE_2D_ARRAY]=vt(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),At[e.TEXTURE_3D]=vt(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),r.setClear(1),o.setClear(0),pt(e.DEPTH_TEST),r.setFunc(Kr),Xt(!1),It(Um),pt(e.CULL_FACE),Pe(Ga);function pt(C){f[C]!==!0&&(e.enable(C),f[C]=!0)}function Nt(C){f[C]!==!1&&(e.disable(C),f[C]=!1)}function Me(C,J){return u[C]!==J?(e.bindFramebuffer(C,J),u[C]=J,C===e.DRAW_FRAMEBUFFER&&(u[e.FRAMEBUFFER]=J),C===e.FRAMEBUFFER&&(u[e.DRAW_FRAMEBUFFER]=J),!0):!1}function Tt(C,J){let X=v,ct=!1;if(C){X=d.get(J),X===void 0&&(X=[],d.set(J,X));let at=C.textures;if(X.length!==at.length||X[0]!==e.COLOR_ATTACHMENT0){for(let ot=0,Et=at.length;ot<Et;ot++)X[ot]=e.COLOR_ATTACHMENT0+ot;X.length=at.length,ct=!0}}else X[0]!==e.BACK&&(X[0]=e.BACK,ct=!0);ct&&e.drawBuffers(X)}function ie(C){return T!==C?(e.useProgram(C),T=C,!0):!1}let se={[Va]:e.FUNC_ADD,[Wx]:e.FUNC_SUBTRACT,[Xx]:e.FUNC_REVERSE_SUBTRACT};se[qx]=e.MIN,se[Yx]=e.MAX;let zt={[Zx]:e.ZERO,[Kx]:e.ONE,[Jx]:e.SRC_COLOR,[Bm]:e.SRC_ALPHA,[nS]:e.SRC_ALPHA_SATURATE,[tS]:e.DST_COLOR,[jx]:e.DST_ALPHA,[Qx]:e.ONE_MINUS_SRC_COLOR,[Fm]:e.ONE_MINUS_SRC_ALPHA,[eS]:e.ONE_MINUS_DST_COLOR,[$x]:e.ONE_MINUS_DST_ALPHA,[iS]:e.CONSTANT_COLOR,[sS]:e.ONE_MINUS_CONSTANT_COLOR,[aS]:e.CONSTANT_ALPHA,[rS]:e.ONE_MINUS_CONSTANT_ALPHA};function Pe(C,J,X,ct,at,ot,Et,Gt,st,Rt){if(C===Ga){_===!0&&(Nt(e.BLEND),_=!1);return}if(_===!1&&(pt(e.BLEND),_=!0),C!==kx){if(C!==h||Rt!==R){if((m!==Va||E!==Va)&&(e.blendEquation(e.FUNC_ADD),m=Va,E=Va),Rt)switch(C){case io:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Om:e.blendFunc(e.ONE,e.ONE);break;case Pm:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case Im:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:Ot("WebGLState: Invalid blending: ",C);break}else switch(C){case io:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Om:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case Pm:Ot("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Im:Ot("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ot("WebGLState: Invalid blending: ",C);break}y=null,x=null,A=null,g=null,M.set(0,0,0),N=0,h=C,R=Rt}return}at=at||J,ot=ot||X,Et=Et||ct,(J!==m||at!==E)&&(e.blendEquationSeparate(se[J],se[at]),m=J,E=at),(X!==y||ct!==x||ot!==A||Et!==g)&&(e.blendFuncSeparate(zt[X],zt[ct],zt[ot],zt[Et]),y=X,x=ct,A=ot,g=Et),(Gt.equals(M)===!1||st!==N)&&(e.blendColor(Gt.r,Gt.g,Gt.b,st),M.copy(Gt),N=st),h=C,R=!1}function Ct(C,J){C.side===Hi?Nt(e.CULL_FACE):pt(e.CULL_FACE);let X=C.side===wn;J&&(X=!X),Xt(X),C.blending===io&&C.transparent===!1?Pe(Ga):Pe(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),r.setFunc(C.depthFunc),r.setTest(C.depthTest),r.setMask(C.depthWrite),a.setMask(C.colorWrite);let ct=C.stencilWrite;o.setTest(ct),ct&&(o.setMask(C.stencilWriteMask),o.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),o.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),pe(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?pt(e.SAMPLE_ALPHA_TO_COVERAGE):Nt(e.SAMPLE_ALPHA_TO_COVERAGE)}function Xt(C){O!==C&&(C?e.frontFace(e.CW):e.frontFace(e.CCW),O=C)}function It(C){C!==Hx?(pt(e.CULL_FACE),C!==F&&(C===Um?e.cullFace(e.BACK):C===Gx?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):Nt(e.CULL_FACE),F=C}function be(C){C!==q&&(G&&e.lineWidth(C),q=C)}function pe(C,J,X){C?(pt(e.POLYGON_OFFSET_FILL),(L!==J||W!==X)&&(L=J,W=X,r.getReversed()&&(J=-J,X=-X),e.polygonOffset(J,X))):Nt(e.POLYGON_OFFSET_FILL)}function en(C){C?pt(e.SCISSOR_TEST):Nt(e.SCISSOR_TEST)}function gn(C){C===void 0&&(C=e.TEXTURE0+Z-1),j!==C&&(e.activeTexture(C),j=C)}function qe(C,J,X){X===void 0&&(j===null?X=e.TEXTURE0+Z-1:X=j);let ct=tt[X];ct===void 0&&(ct={type:void 0,texture:void 0},tt[X]=ct),(ct.type!==C||ct.texture!==J)&&(j!==X&&(e.activeTexture(X),j=X),e.bindTexture(C,J||At[C]),ct.type=C,ct.texture=J)}function U(){let C=tt[j];C!==void 0&&C.type!==void 0&&(e.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function _n(){try{e.compressedTexImage2D(...arguments)}catch(C){Ot("WebGLState:",C)}}function oe(){try{e.compressedTexImage3D(...arguments)}catch(C){Ot("WebGLState:",C)}}function me(){try{e.texSubImage2D(...arguments)}catch(C){Ot("WebGLState:",C)}}function ft(){try{e.texSubImage3D(...arguments)}catch(C){Ot("WebGLState:",C)}}function Ue(){try{e.compressedTexSubImage2D(...arguments)}catch(C){Ot("WebGLState:",C)}}function wt(){try{e.compressedTexSubImage3D(...arguments)}catch(C){Ot("WebGLState:",C)}}function Ut(){try{e.texStorage2D(...arguments)}catch(C){Ot("WebGLState:",C)}}function w(){try{e.texStorage3D(...arguments)}catch(C){Ot("WebGLState:",C)}}function S(){try{e.texImage2D(...arguments)}catch(C){Ot("WebGLState:",C)}}function P(){try{e.texImage3D(...arguments)}catch(C){Ot("WebGLState:",C)}}function et(C){return p[C]!==void 0?p[C]:e.getParameter(C)}function Q(C,J){p[C]!==J&&(e.pixelStorei(C,J),p[C]=J)}function rt(C){k.equals(C)===!1&&(e.scissor(C.x,C.y,C.z,C.w),k.copy(C))}function it(C){dt.equals(C)===!1&&(e.viewport(C.x,C.y,C.z,C.w),dt.copy(C))}function Y(C,J){let X=c.get(J);X===void 0&&(X=new WeakMap,c.set(J,X));let ct=X.get(C);ct===void 0&&(ct=e.getUniformBlockIndex(J,C.name),e.uniformBlockBinding(J,ct,ct),X.set(C,ct))}function K(C,J,X){let at=c.get(J).get(C);l[at]!==X&&(e.bindBufferBase(e.UNIFORM_BUFFER,at,X),l[at]=X)}function lt(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),r.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),f={},p={},j=null,tt={},u={},l={},d=new WeakMap,v=[],T=null,_=!1,h=null,m=null,y=null,x=null,E=null,A=null,g=null,M=new te(0,0,0),N=0,R=!1,O=null,F=null,q=null,L=null,W=null,k.set(0,0,e.canvas.width,e.canvas.height),dt.set(0,0,e.canvas.width,e.canvas.height),a.reset(),r.reset(),o.reset()}return{buffers:{color:a,depth:r,stencil:o},enable:pt,disable:Nt,bindFramebuffer:Me,drawBuffers:Tt,useProgram:ie,setBlending:Pe,setMaterial:Ct,setFlipSided:Xt,setCullFace:It,setLineWidth:be,setPolygonOffset:pe,setScissorTest:en,activeTexture:gn,bindTexture:qe,unbindTexture:U,compressedTexImage2D:_n,compressedTexImage3D:oe,texImage2D:S,texImage3D:P,pixelStorei:Q,getParameter:et,updateUBOMapping:Y,uniformBlockBinding:K,texStorage2D:Ut,texStorage3D:w,texSubImage2D:me,texSubImage3D:ft,compressedTexSubImage2D:Ue,compressedTexSubImage3D:wt,scissor:rt,viewport:it,reset:lt}}function WC(e,t,n,i,s,a,r){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new jt,f=new WeakMap,p=new Set,u,d=new WeakMap,v=new Set,T=new FinalizationRegistry(w=>v.delete(w)),_=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function h(w,S){return _?new OffscreenCanvas(w,S):wl("canvas")}function m(w,S,P){let et=1,Q=Ut(w);if((Q.width>P||Q.height>P)&&(et=P/Math.max(Q.width,Q.height)),et<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){let rt=Math.floor(et*Q.width),it=Math.floor(et*Q.height);u===void 0&&(u=h(rt,it));let Y=S?h(rt,it):u;return Y.width=rt,Y.height=it,Y.getContext("2d").drawImage(w,0,0,rt,it),Dt("WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+rt+"x"+it+")."),Y}else return"data"in w&&Dt("WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),w;return w}function y(w){return w.generateMipmaps}function x(w){e.generateMipmap(w)}function E(w){return w.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:w.isWebGL3DRenderTarget?e.TEXTURE_3D:w.isWebGLArrayRenderTarget||w.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function A(w,S,P,et,Q,rt=!1){if(w!==null){if(e[w]!==void 0)return e[w];Dt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let it;et&&(it=t.get("EXT_texture_norm16"),it||Dt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Y=S;if(S===e.RED&&(P===e.FLOAT&&(Y=e.R32F),P===e.HALF_FLOAT&&(Y=e.R16F),P===e.UNSIGNED_BYTE&&(Y=e.R8),P===e.UNSIGNED_SHORT&&it&&(Y=it.R16_EXT),P===e.SHORT&&it&&(Y=it.R16_SNORM_EXT)),S===e.RED_INTEGER&&(P===e.UNSIGNED_BYTE&&(Y=e.R8UI),P===e.UNSIGNED_SHORT&&(Y=e.R16UI),P===e.UNSIGNED_INT&&(Y=e.R32UI),P===e.BYTE&&(Y=e.R8I),P===e.SHORT&&(Y=e.R16I),P===e.INT&&(Y=e.R32I)),S===e.RG&&(P===e.FLOAT&&(Y=e.RG32F),P===e.HALF_FLOAT&&(Y=e.RG16F),P===e.UNSIGNED_BYTE&&(Y=e.RG8),P===e.UNSIGNED_SHORT&&it&&(Y=it.RG16_EXT),P===e.SHORT&&it&&(Y=it.RG16_SNORM_EXT)),S===e.RG_INTEGER&&(P===e.UNSIGNED_BYTE&&(Y=e.RG8UI),P===e.UNSIGNED_SHORT&&(Y=e.RG16UI),P===e.UNSIGNED_INT&&(Y=e.RG32UI),P===e.BYTE&&(Y=e.RG8I),P===e.SHORT&&(Y=e.RG16I),P===e.INT&&(Y=e.RG32I)),S===e.RGB_INTEGER&&(P===e.UNSIGNED_BYTE&&(Y=e.RGB8UI),P===e.UNSIGNED_SHORT&&(Y=e.RGB16UI),P===e.UNSIGNED_INT&&(Y=e.RGB32UI),P===e.BYTE&&(Y=e.RGB8I),P===e.SHORT&&(Y=e.RGB16I),P===e.INT&&(Y=e.RGB32I)),S===e.RGBA_INTEGER&&(P===e.UNSIGNED_BYTE&&(Y=e.RGBA8UI),P===e.UNSIGNED_SHORT&&(Y=e.RGBA16UI),P===e.UNSIGNED_INT&&(Y=e.RGBA32UI),P===e.BYTE&&(Y=e.RGBA8I),P===e.SHORT&&(Y=e.RGBA16I),P===e.INT&&(Y=e.RGBA32I)),S===e.RGB&&(P===e.UNSIGNED_SHORT&&it&&(Y=it.RGB16_EXT),P===e.SHORT&&it&&(Y=it.RGB16_SNORM_EXT),P===e.UNSIGNED_INT_5_9_9_9_REV&&(Y=e.RGB9_E5),P===e.UNSIGNED_INT_10F_11F_11F_REV&&(Y=e.R11F_G11F_B10F)),S===e.RGBA){let K=rt?El:Kt.getTransfer(Q);P===e.FLOAT&&(Y=e.RGBA32F),P===e.HALF_FLOAT&&(Y=e.RGBA16F),P===e.UNSIGNED_BYTE&&(Y=K===re?e.SRGB8_ALPHA8:e.RGBA8),P===e.UNSIGNED_SHORT&&it&&(Y=it.RGBA16_EXT),P===e.SHORT&&it&&(Y=it.RGBA16_SNORM_EXT),P===e.UNSIGNED_SHORT_4_4_4_4&&(Y=e.RGBA4),P===e.UNSIGNED_SHORT_5_5_5_1&&(Y=e.RGB5_A1)}return(Y===e.R16F||Y===e.R32F||Y===e.RG16F||Y===e.RG32F||Y===e.RGBA16F||Y===e.RGBA32F)&&t.get("EXT_color_buffer_float"),Y}function g(w,S){let P;return w?S===null||S===Mi||S===Wa?P=e.DEPTH24_STENCIL8:S===bi?P=e.DEPTH32F_STENCIL8:S===ao&&(P=e.DEPTH24_STENCIL8,Dt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===Mi||S===Wa?P=e.DEPTH_COMPONENT24:S===bi?P=e.DEPTH_COMPONENT32F:S===ao&&(P=e.DEPTH_COMPONENT16),P}function M(w,S){return y(w)===!0||w.isFramebufferTexture&&w.minFilter!==tn&&w.minFilter!==An?Math.log2(Math.max(S.width,S.height))+1:w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?S.mipmaps.length:1}function N(w){let S=new WeakRef(w);i.get(w).__ref=S,v.add(S),T.register(w,S,S)}function R(w){let S=i.get(w).__ref;S!==void 0&&(v.delete(S),T.unregister(S))}function O(w){q(w.target)}function F(w){L(w.target)}function q(w){w.removeEventListener("dispose",O),R(w),Z(w),w.isVideoTexture&&f.delete(w),w.isHTMLTexture&&p.delete(w)}function L(w){w.removeEventListener("dispose",F),R(w),nt(w)}function W(){for(let w of v){let S=w.deref();S!==void 0&&(S.isRenderTarget===!0?L(S):q(S))}v.clear(),p.clear()}function Z(w){let S=i.get(w);if(S.__webglInit===void 0)return;let P=w.source,et=d.get(P);if(et){let Q=et[S.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&G(w),Object.keys(et).length===0&&d.delete(P)}i.remove(w)}function G(w){let S=i.get(w);e.deleteTexture(S.__webglTexture);let P=w.source,et=d.get(P);delete et[S.__cacheKey],r.memory.textures--}function nt(w){let S=i.get(w);S.__depthDisposeCallback&&S.__depthDisposeCallback();let P=w.depthTexture;if(P&&P.renderTarget===w&&q(P),w.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(S.__webglFramebuffer[Q]))for(let rt=0;rt<S.__webglFramebuffer[Q].length;rt++)e.deleteFramebuffer(S.__webglFramebuffer[Q][rt]);else e.deleteFramebuffer(S.__webglFramebuffer[Q]);S.__webglDepthbuffer&&e.deleteRenderbuffer(S.__webglDepthbuffer[Q])}else{if(Array.isArray(S.__webglFramebuffer))for(let Q=0;Q<S.__webglFramebuffer.length;Q++)e.deleteFramebuffer(S.__webglFramebuffer[Q]);else e.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&e.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&e.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let Q=0;Q<S.__webglColorRenderbuffer.length;Q++)S.__webglColorRenderbuffer[Q]&&e.deleteRenderbuffer(S.__webglColorRenderbuffer[Q]);S.__webglDepthRenderbuffer&&e.deleteRenderbuffer(S.__webglDepthRenderbuffer)}let et=w.textures;for(let Q=0,rt=et.length;Q<rt;Q++){let it=i.get(et[Q]);it.__webglTexture&&(e.deleteTexture(it.__webglTexture),r.memory.textures--),i.remove(et[Q])}i.remove(w)}let V=0;function j(){V=0}function tt(){return V}function yt(w){V=w}function Lt(){let w=V;return w>=s.maxTextures&&Dt("WebGLTextures: Trying to use "+(w+1)+" texture units while this GPU supports only "+s.maxTextures),V+=1,w}function k(w){let S=[];return S.push(w.wrapS),S.push(w.wrapT),S.push(w.wrapR||0),S.push(w.magFilter),S.push(w.minFilter),S.push(w.anisotropy),S.push(w.internalFormat),S.push(w.format),S.push(w.type),S.push(w.generateMipmaps),S.push(w.mipmapsAutoUpdate),S.push(w.premultiplyAlpha),S.push(w.flipY),S.push(w.unpackAlignment),S.push(w.colorSpace),S.join()}function dt(w,S){let P=i.get(w);if(w.isVideoTexture&&Ue(w),w.isRenderTargetTexture===!1&&w.isExternalTexture!==!0&&w.version>0&&P.__version!==w.version){let et=w.image;if(et===null)Dt("WebGLRenderer: Texture marked for update but no image data found.");else if(et.complete===!1)Dt("WebGLRenderer: Texture marked for update but image is incomplete");else{Ct(P,w,S);return}}else w.isExternalTexture&&(P.__webglTexture=w.sourceTexture?w.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,P.__webglTexture,e.TEXTURE0+S)}function vt(w,S){let P=i.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&P.__version!==w.version){Ct(P,w,S);return}else w.isExternalTexture&&(P.__webglTexture=w.sourceTexture?w.sourceTexture:null);n.bindTexture(e.TEXTURE_2D_ARRAY,P.__webglTexture,e.TEXTURE0+S)}function At(w,S){let P=i.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&P.__version!==w.version){Ct(P,w,S);return}n.bindTexture(e.TEXTURE_3D,P.__webglTexture,e.TEXTURE0+S)}function pt(w,S){let P=i.get(w);if(w.version>0&&P.__version!==w.version){Xt(P,w,S);return}n.bindTexture(e.TEXTURE_CUBE_MAP,P.__webglTexture,e.TEXTURE0+S)}let Nt={[lh]:e.REPEAT,[Ii]:e.CLAMP_TO_EDGE,[ch]:e.MIRRORED_REPEAT},Me={[tn]:e.NEAREST,[cS]:e.NEAREST_MIPMAP_NEAREST,[Wl]:e.NEAREST_MIPMAP_LINEAR,[An]:e.LINEAR,[Fh]:e.LINEAR_MIPMAP_NEAREST,[vs]:e.LINEAR_MIPMAP_LINEAR},Tt={[dS]:e.NEVER,[sg]:e.ALWAYS,[pS]:e.LESS,[ng]:e.LEQUAL,[mS]:e.EQUAL,[ig]:e.GEQUAL,[gS]:e.GREATER,[_S]:e.NOTEQUAL};function ie(w,S){if(S.type===bi&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===An||S.magFilter===Fh||S.magFilter===Wl||S.magFilter===vs||S.minFilter===An||S.minFilter===Fh||S.minFilter===Wl||S.minFilter===vs)&&Dt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(w,e.TEXTURE_WRAP_S,Nt[S.wrapS]),e.texParameteri(w,e.TEXTURE_WRAP_T,Nt[S.wrapT]),(w===e.TEXTURE_3D||w===e.TEXTURE_2D_ARRAY)&&e.texParameteri(w,e.TEXTURE_WRAP_R,Nt[S.wrapR]),e.texParameteri(w,e.TEXTURE_MAG_FILTER,Me[S.magFilter]),e.texParameteri(w,e.TEXTURE_MIN_FILTER,Me[S.minFilter]),S.compareFunction&&(e.texParameteri(w,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(w,e.TEXTURE_COMPARE_FUNC,Tt[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===tn||S.minFilter!==Wl&&S.minFilter!==vs||S.type===bi&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||i.get(S).__currentAnisotropy){let P=t.get("EXT_texture_filter_anisotropic");e.texParameterf(w,P.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,s.getMaxAnisotropy())),i.get(S).__currentAnisotropy=S.anisotropy}}}function se(w,S){let P=!1;w.__webglInit===void 0&&(w.__webglInit=!0,S.addEventListener("dispose",O),N(S));let et=S.source,Q=d.get(et);Q===void 0&&(Q={},d.set(et,Q));let rt=k(S);if(rt!==w.__cacheKey){Q[rt]===void 0&&(Q[rt]={texture:e.createTexture(),usedTimes:0},r.memory.textures++,P=!0),Q[rt].usedTimes++;let it=Q[w.__cacheKey];it!==void 0&&(Q[w.__cacheKey].usedTimes--,it.usedTimes===0&&G(S)),w.__cacheKey=rt,w.__webglTexture=Q[rt].texture}return P}function zt(w,S,P){return Math.floor(Math.floor(w/P)/S)}function Pe(w,S,P,et){let rt=w.updateRanges;if(rt.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,S.width,S.height,P,et,S.data);else{rt.sort((C,J)=>C.start-J.start);let it=0;for(let C=1;C<rt.length;C++){let J=rt[it],X=rt[C],ct=J.start+J.count,at=zt(X.start,S.width,4),ot=zt(J.start,S.width,4);X.start<=ct+1&&at===ot&&zt(X.start+X.count-1,S.width,4)===at?J.count=Math.max(J.count,X.start+X.count-J.start):(++it,rt[it]=X)}rt.length=it+1;let Y=n.getParameter(e.UNPACK_ROW_LENGTH),K=n.getParameter(e.UNPACK_SKIP_PIXELS),lt=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,S.width);for(let C=0,J=rt.length;C<J;C++){let X=rt[C],ct=Math.floor(X.start/4),at=Math.ceil(X.count/4),ot=ct%S.width,Et=Math.floor(ct/S.width),Gt=at,st=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,ot),n.pixelStorei(e.UNPACK_SKIP_ROWS,Et),n.texSubImage2D(e.TEXTURE_2D,0,ot,Et,Gt,st,P,et,S.data)}w.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,Y),n.pixelStorei(e.UNPACK_SKIP_PIXELS,K),n.pixelStorei(e.UNPACK_SKIP_ROWS,lt)}}function Ct(w,S,P){let et=e.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(et=e.TEXTURE_2D_ARRAY),S.isData3DTexture&&(et=e.TEXTURE_3D);let Q=se(w,S),rt=S.source;n.bindTexture(et,w.__webglTexture,e.TEXTURE0+P);let it=i.get(rt);if(rt.version!==it.__version||Q===!0){if(n.activeTexture(e.TEXTURE0+P),(typeof ImageBitmap<"u"&&S.image instanceof ImageBitmap)===!1){let st=Kt.getPrimaries(Kt.workingColorSpace),Rt=S.colorSpace===xs?null:Kt.getPrimaries(S.colorSpace),Ht=S.colorSpace===xs||st===Rt?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ht)}n.pixelStorei(e.UNPACK_ALIGNMENT,S.unpackAlignment);let K=m(S.image,!1,s.maxTextureSize);K=wt(S,K);let lt=a.convert(S.format,S.colorSpace),C=a.convert(S.type),J=A(S.internalFormat,lt,C,S.normalized,S.colorSpace,S.isVideoTexture);ie(et,S);let X,ct=S.mipmaps,at=S.isVideoTexture!==!0,ot=it.__version===void 0||Q===!0,Et=rt.dataReady,Gt=M(S,K);if(S.isDepthTexture)J=g(S.format===ys,S.type),ot&&(at?n.texStorage2D(e.TEXTURE_2D,1,J,K.width,K.height):n.texImage2D(e.TEXTURE_2D,0,J,K.width,K.height,0,lt,C,null));else if(S.isDataTexture)if(ct.length>0){at&&ot&&n.texStorage2D(e.TEXTURE_2D,Gt,J,ct[0].width,ct[0].height);for(let st=0,Rt=ct.length;st<Rt;st++)X=ct[st],at?Et&&n.texSubImage2D(e.TEXTURE_2D,st,0,0,X.width,X.height,lt,C,X.data):n.texImage2D(e.TEXTURE_2D,st,J,X.width,X.height,0,lt,C,X.data);S.generateMipmaps=!1}else at?(ot&&n.texStorage2D(e.TEXTURE_2D,Gt,J,K.width,K.height),Et&&Pe(S,K,lt,C)):n.texImage2D(e.TEXTURE_2D,0,J,K.width,K.height,0,lt,C,K.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){at&&ot&&n.texStorage3D(e.TEXTURE_2D_ARRAY,Gt,J,ct[0].width,ct[0].height,K.depth);for(let st=0,Rt=ct.length;st<Rt;st++)if(X=ct[st],S.format!==Ei)if(lt!==null)if(at){if(Et)if(S.layerUpdates.size>0){let Ht=dg(X.width,X.height,S.format,S.type);for(let mt of S.layerUpdates){let le=X.data.subarray(mt*Ht/X.data.BYTES_PER_ELEMENT,(mt+1)*Ht/X.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,st,0,0,mt,X.width,X.height,1,lt,le)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,st,0,0,0,X.width,X.height,K.depth,lt,X.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,st,J,X.width,X.height,K.depth,0,X.data,0,0);else Dt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else at?Et&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,st,0,0,0,X.width,X.height,K.depth,lt,C,X.data):n.texImage3D(e.TEXTURE_2D_ARRAY,st,J,X.width,X.height,K.depth,0,lt,C,X.data);S.layerUpdates.size>0&&S.clearLayerUpdates()}else{at&&ot&&n.texStorage2D(e.TEXTURE_2D,Gt,J,ct[0].width,ct[0].height);for(let st=0,Rt=ct.length;st<Rt;st++)X=ct[st],S.format!==Ei?lt!==null?at?Et&&n.compressedTexSubImage2D(e.TEXTURE_2D,st,0,0,X.width,X.height,lt,X.data):n.compressedTexImage2D(e.TEXTURE_2D,st,J,X.width,X.height,0,X.data):Dt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):at?Et&&n.texSubImage2D(e.TEXTURE_2D,st,0,0,X.width,X.height,lt,C,X.data):n.texImage2D(e.TEXTURE_2D,st,J,X.width,X.height,0,lt,C,X.data)}else if(S.isDataArrayTexture)if(at){if(ot&&n.texStorage3D(e.TEXTURE_2D_ARRAY,Gt,J,K.width,K.height,K.depth),Et)if(S.layerUpdates.size>0){let st=dg(K.width,K.height,S.format,S.type);for(let Rt of S.layerUpdates){let Ht=K.data.subarray(Rt*st/K.data.BYTES_PER_ELEMENT,(Rt+1)*st/K.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,Rt,K.width,K.height,1,lt,C,Ht)}S.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,K.width,K.height,K.depth,lt,C,K.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,J,K.width,K.height,K.depth,0,lt,C,K.data);else if(S.isData3DTexture)at?(ot&&n.texStorage3D(e.TEXTURE_3D,Gt,J,K.width,K.height,K.depth),Et&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,K.width,K.height,K.depth,lt,C,K.data)):n.texImage3D(e.TEXTURE_3D,0,J,K.width,K.height,K.depth,0,lt,C,K.data);else if(S.isFramebufferTexture){if(ot)if(at)n.texStorage2D(e.TEXTURE_2D,Gt,J,K.width,K.height);else{let st=K.width,Rt=K.height;for(let Ht=0;Ht<Gt;Ht++)n.texImage2D(e.TEXTURE_2D,Ht,J,st,Rt,0,lt,C,null),st>>=1,Rt>>=1}}else if(S.isHTMLTexture){if("texElementImage2D"in e){let st=e.canvas;if(st.hasAttribute("layoutsubtree")||st.setAttribute("layoutsubtree","true"),K.parentNode!==st){st.appendChild(K),p.add(S),st.onpaint=Rt=>{let Ht=Rt.changedElements;for(let mt of p)Ht.includes(mt.image)&&(mt.needsUpdate=!0)},st.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,K);else{let Ht=e.RGBA,mt=e.RGBA,le=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,Ht,mt,le,K)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(ct.length>0){if(at&&ot){let st=Ut(ct[0]);n.texStorage2D(e.TEXTURE_2D,Gt,J,st.width,st.height)}for(let st=0,Rt=ct.length;st<Rt;st++)X=ct[st],at?Et&&n.texSubImage2D(e.TEXTURE_2D,st,0,0,lt,C,X):n.texImage2D(e.TEXTURE_2D,st,J,lt,C,X);S.generateMipmaps=!1}else if(at){if(ot){let st=Ut(K);n.texStorage2D(e.TEXTURE_2D,Gt,J,st.width,st.height)}Et&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,lt,C,K)}else n.texImage2D(e.TEXTURE_2D,0,J,lt,C,K);y(S)&&S.mipmapsAutoUpdate===!0&&x(et),it.__version=rt.version,S.onUpdate&&S.onUpdate(S)}w.__version=S.version}function Xt(w,S,P){if(S.image.length!==6)return;let et=se(w,S),Q=S.source;n.bindTexture(e.TEXTURE_CUBE_MAP,w.__webglTexture,e.TEXTURE0+P);let rt=i.get(Q);if(Q.version!==rt.__version||et===!0){n.activeTexture(e.TEXTURE0+P);let it=Kt.getPrimaries(Kt.workingColorSpace),Y=S.colorSpace===xs?null:Kt.getPrimaries(S.colorSpace),K=S.colorSpace===xs||it===Y?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,K);let lt=S.isCompressedTexture||S.image[0].isCompressedTexture,C=S.image[0]&&S.image[0].isDataTexture,J=[];for(let mt=0;mt<6;mt++)!lt&&!C?J[mt]=m(S.image[mt],!0,s.maxCubemapSize):J[mt]=C?S.image[mt].image:S.image[mt],J[mt]=wt(S,J[mt]);let X=J[0],ct=a.convert(S.format,S.colorSpace),at=a.convert(S.type),ot=A(S.internalFormat,ct,at,S.normalized,S.colorSpace),Et=S.isVideoTexture!==!0,Gt=rt.__version===void 0||et===!0,st=Q.dataReady,Rt=M(S,X);ie(e.TEXTURE_CUBE_MAP,S);let Ht;if(S.isDepthTexture){if(ot=g(S.format===ys,S.type),Gt)if(Et)n.texStorage2D(e.TEXTURE_CUBE_MAP,1,ot,X.width,X.height);else for(let mt=0;mt<6;mt++)n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,ot,X.width,X.height,0,ct,at,null)}else if(lt){Et&&Gt&&n.texStorage2D(e.TEXTURE_CUBE_MAP,Rt,ot,X.width,X.height);for(let mt=0;mt<6;mt++){Ht=J[mt].mipmaps;for(let le=0;le<Ht.length;le++){let Ye=Ht[le];S.format!==Ei?ct!==null?Et?st&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,le,0,0,Ye.width,Ye.height,ct,Ye.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,le,ot,Ye.width,Ye.height,0,Ye.data):Dt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Et?st&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,le,0,0,Ye.width,Ye.height,ct,at,Ye.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,le,ot,Ye.width,Ye.height,0,ct,at,Ye.data)}}}else{if(Ht=S.mipmaps,Et&&Gt){Ht.length>0&&Rt++;let mt=Ut(J[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,Rt,ot,mt.width,mt.height)}for(let mt=0;mt<6;mt++)if(C){Et?st&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,0,0,J[mt].width,J[mt].height,ct,at,J[mt].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,ot,J[mt].width,J[mt].height,0,ct,at,J[mt].data);for(let le=0;le<Ht.length;le++){let Ss=Ht[le].image[mt].image;Et?st&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,le+1,0,0,Ss.width,Ss.height,ct,at,Ss.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,le+1,ot,Ss.width,Ss.height,0,ct,at,Ss.data)}}else{Et?st&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,0,0,ct,at,J[mt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,ot,ct,at,J[mt]);for(let le=0;le<Ht.length;le++){let Ye=Ht[le];Et?st&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,le+1,0,0,ct,at,Ye.image[mt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,le+1,ot,ct,at,Ye.image[mt])}}}y(S)&&S.mipmapsAutoUpdate===!0&&x(e.TEXTURE_CUBE_MAP),rt.__version=Q.version,S.onUpdate&&S.onUpdate(S)}w.__version=S.version}function It(w,S,P,et,Q,rt){let it=a.convert(P.format,P.colorSpace),Y=a.convert(P.type),K=A(P.internalFormat,it,Y,P.normalized,P.colorSpace),lt=i.get(S),C=i.get(P);if(C.__renderTarget=S,!lt.__hasExternalTextures){let J=Math.max(1,S.width>>rt),X=Math.max(1,S.height>>rt);Q===e.TEXTURE_3D||Q===e.TEXTURE_2D_ARRAY?n.texImage3D(Q,rt,K,J,X,S.depth,0,it,Y,null):n.texImage2D(Q,rt,K,J,X,0,it,Y,null)}n.bindFramebuffer(e.FRAMEBUFFER,w),ft(S)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,et,Q,C.__webglTexture,0,me(S)):(Q===e.TEXTURE_2D||Q>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,et,Q,C.__webglTexture,rt),n.bindFramebuffer(e.FRAMEBUFFER,null)}function be(w,S,P){if(e.bindRenderbuffer(e.RENDERBUFFER,w),S.depthBuffer){let et=S.depthTexture,Q=et&&et.isDepthTexture?et.type:null,rt=g(S.stencilBuffer,Q),it=S.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;ft(S)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,me(S),rt,S.width,S.height):P?e.renderbufferStorageMultisample(e.RENDERBUFFER,me(S),rt,S.width,S.height):e.renderbufferStorage(e.RENDERBUFFER,rt,S.width,S.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,it,e.RENDERBUFFER,w)}else{let et=S.textures;for(let Q=0;Q<et.length;Q++){let rt=et[Q],it=a.convert(rt.format,rt.colorSpace),Y=a.convert(rt.type),K=A(rt.internalFormat,it,Y,rt.normalized,rt.colorSpace);ft(S)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,me(S),K,S.width,S.height):P?e.renderbufferStorageMultisample(e.RENDERBUFFER,me(S),K,S.width,S.height):e.renderbufferStorage(e.RENDERBUFFER,K,S.width,S.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function pe(w,S,P){let et=S.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,w),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let Q=i.get(S.depthTexture);Q.__renderTarget=S;let rt=et?S.depthTexture.image[0]:S.depthTexture.image;(!Q.__webglTexture||rt.width!==S.width||rt.height!==S.height)&&(rt.width=S.width,rt.height=S.height,S.depthTexture.needsUpdate=!0),et?pt(S.depthTexture,0):dt(S.depthTexture,0);let it=Q.__webglTexture,Y=me(S),K=et?e.TEXTURE_CUBE_MAP_POSITIVE_X+P:e.TEXTURE_2D,lt=S.depthTexture.format===ys?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(S.depthTexture.format===gs)ft(S)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,lt,K,it,0,Y):e.framebufferTexture2D(e.FRAMEBUFFER,lt,K,it,0);else if(S.depthTexture.format===ys)ft(S)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,lt,K,it,0,Y):e.framebufferTexture2D(e.FRAMEBUFFER,lt,K,it,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function en(w){let S=i.get(w),P=w.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==w.depthTexture){let et=w.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),et){let Q=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,et.removeEventListener("dispose",Q)};et.addEventListener("dispose",Q),S.__depthDisposeCallback=Q}S.__boundDepthTexture=et}if(w.depthTexture&&!S.__autoAllocateDepthBuffer)if(P)for(let et=0;et<6;et++)pe(S.__webglFramebuffer[et],w,et);else w.texture.mipmaps.length>0?pe(S.__webglFramebuffer[0],w,0):pe(S.__webglFramebuffer,w,0);else if(P){S.__webglDepthbuffer=[];for(let et=0;et<6;et++)if(n.bindFramebuffer(e.FRAMEBUFFER,S.__webglFramebuffer[et]),S.__webglDepthbuffer[et]===void 0)S.__webglDepthbuffer[et]=e.createRenderbuffer(),be(S.__webglDepthbuffer[et],w,!1);else{let Q=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,rt=S.__webglDepthbuffer[et];e.bindRenderbuffer(e.RENDERBUFFER,rt),e.framebufferRenderbuffer(e.FRAMEBUFFER,Q,e.RENDERBUFFER,rt)}}else if(w.texture.mipmaps.length>0?n.bindFramebuffer(e.FRAMEBUFFER,S.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=e.createRenderbuffer(),be(S.__webglDepthbuffer,w,!1);else{let Q=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,rt=S.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,rt),e.framebufferRenderbuffer(e.FRAMEBUFFER,Q,e.RENDERBUFFER,rt)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function gn(w,S,P){let et=i.get(w);S!==void 0&&It(et.__webglFramebuffer,w,w.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),P!==void 0&&en(w)}function qe(w){let S=w.texture,P=i.get(w),et=i.get(S);w.addEventListener("dispose",F),N(w);let Q=w.textures,rt=w.isWebGLCubeRenderTarget===!0,it=Q.length>1;if(it||(et.__webglTexture===void 0&&(et.__webglTexture=e.createTexture()),et.__version=S.version,r.memory.textures++),rt){P.__webglFramebuffer=[];for(let Y=0;Y<6;Y++)if(S.mipmaps.length>0){P.__webglFramebuffer[Y]=[];for(let K=0;K<S.mipmaps.length;K++)P.__webglFramebuffer[Y][K]=e.createFramebuffer()}else P.__webglFramebuffer[Y]=e.createFramebuffer()}else{if(S.mipmaps.length>0){P.__webglFramebuffer=[];for(let Y=0;Y<S.mipmaps.length;Y++)P.__webglFramebuffer[Y]=e.createFramebuffer()}else P.__webglFramebuffer=e.createFramebuffer();if(it)for(let Y=0,K=Q.length;Y<K;Y++){let lt=i.get(Q[Y]);lt.__webglTexture===void 0&&(lt.__webglTexture=e.createTexture(),r.memory.textures++)}if(w.samples>0&&ft(w)===!1){P.__webglMultisampledFramebuffer=e.createFramebuffer(),P.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,P.__webglMultisampledFramebuffer);for(let Y=0;Y<Q.length;Y++){let K=Q[Y];P.__webglColorRenderbuffer[Y]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,P.__webglColorRenderbuffer[Y]);let lt=a.convert(K.format,K.colorSpace),C=a.convert(K.type),J=A(K.internalFormat,lt,C,K.normalized,K.colorSpace,w.isXRRenderTarget===!0),X=me(w);e.renderbufferStorageMultisample(e.RENDERBUFFER,X,J,w.width,w.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+Y,e.RENDERBUFFER,P.__webglColorRenderbuffer[Y])}e.bindRenderbuffer(e.RENDERBUFFER,null),w.depthBuffer&&(P.__webglDepthRenderbuffer=e.createRenderbuffer(),be(P.__webglDepthRenderbuffer,w,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(rt){n.bindTexture(e.TEXTURE_CUBE_MAP,et.__webglTexture),ie(e.TEXTURE_CUBE_MAP,S);for(let Y=0;Y<6;Y++)if(S.mipmaps.length>0)for(let K=0;K<S.mipmaps.length;K++)It(P.__webglFramebuffer[Y][K],w,S,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+Y,K);else It(P.__webglFramebuffer[Y],w,S,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0);y(S)?x(e.TEXTURE_CUBE_MAP):S.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,S.mipmaps.length-1),n.unbindTexture()}else if(it){for(let Y=0,K=Q.length;Y<K;Y++){let lt=Q[Y],C=i.get(lt),J=e.TEXTURE_2D;(w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(J=w.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(J,C.__webglTexture),ie(J,lt),It(P.__webglFramebuffer,w,lt,e.COLOR_ATTACHMENT0+Y,J,0),y(lt)&&x(J)}n.unbindTexture()}else{let Y=e.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(Y=w.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(Y,et.__webglTexture),ie(Y,S),S.mipmaps.length>0)for(let K=0;K<S.mipmaps.length;K++)It(P.__webglFramebuffer[K],w,S,e.COLOR_ATTACHMENT0,Y,K);else It(P.__webglFramebuffer,w,S,e.COLOR_ATTACHMENT0,Y,0);y(S)?x(Y):S.mipmaps.length>0&&e.texParameteri(Y,e.TEXTURE_MAX_LEVEL,S.mipmaps.length-1),n.unbindTexture()}w.depthBuffer&&en(w)}function U(w){let S=w.textures;for(let P=0,et=S.length;P<et;P++){let Q=S[P];if(y(Q)&&Q.mipmapsAutoUpdate===!0){let rt=E(w),it=i.get(Q).__webglTexture;n.bindTexture(rt,it),x(rt),n.unbindTexture()}}}let _n=[];function oe(w){if(w.samples>0){if(ft(w)===!1){let S=w.textures,P=w.width,et=w.height,Q=e.COLOR_BUFFER_BIT,rt=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,it=i.get(w),Y=S.length>1;if(Y)for(let lt=0;lt<S.length;lt++)n.bindFramebuffer(e.FRAMEBUFFER,it.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+lt,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,it.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+lt,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,it.__webglMultisampledFramebuffer),w.texture.mipmaps.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,it.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,it.__webglFramebuffer);for(let lt=0;lt<S.length;lt++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(Q|=e.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(Q|=e.STENCIL_BUFFER_BIT)),Y){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,it.__webglColorRenderbuffer[lt]);let C=i.get(S[lt]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,C,0)}e.blitFramebuffer(0,0,P,et,0,0,P,et,Q,e.NEAREST),l===!0&&(_n.length=0,_n.push(e.COLOR_ATTACHMENT0+lt),w.depthBuffer&&w.storeMultisampledDepthBuffer===!1&&_n.push(rt),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,_n))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),Y)for(let lt=0;lt<S.length;lt++){n.bindFramebuffer(e.FRAMEBUFFER,it.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+lt,e.RENDERBUFFER,it.__webglColorRenderbuffer[lt]);let C=i.get(S[lt]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,it.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+lt,e.TEXTURE_2D,C,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,it.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.storeMultisampledDepthBuffer===!1&&l){let S=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[S])}}}function me(w){return Math.min(s.maxSamples,w.samples)}function ft(w){let S=i.get(w);return w.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function Ue(w){let S=r.render.frame;f.get(w)!==S&&(f.set(w,S),w.update())}function wt(w,S){let P=w.colorSpace,et=w.format,Q=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||P!==Tl&&P!==xs&&(Kt.getTransfer(P)===re?(et!==Ei||Q!==qn)&&Dt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ot("WebGLTextures: Unsupported texture color space:",P)),S}function Ut(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(c.width=w.naturalWidth||w.width,c.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(c.width=w.displayWidth,c.height=w.displayHeight):(c.width=w.width,c.height=w.height),c}this.allocateTextureUnit=Lt,this.resetTextureUnits=j,this.getTextureUnits=tt,this.setTextureUnits=yt,this.setTexture2D=dt,this.setTexture2DArray=vt,this.setTexture3D=At,this.setTextureCube=pt,this.rebindTextures=gn,this.setupRenderTarget=qe,this.updateRenderTargetMipmap=U,this.updateMultisampleRenderTarget=oe,this.setupDepthRenderbuffer=en,this.setupFrameBufferTexture=It,this.useMultisampledRTT=ft,this.dispose=W}function XC(e,t){function n(i,s=xs){let a,r=Kt.getTransfer(s);if(i===qn)return e.UNSIGNED_BYTE;if(i===Hh)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Gh)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Jm)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Qm)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===Zm)return e.BYTE;if(i===Km)return e.SHORT;if(i===ao)return e.UNSIGNED_SHORT;if(i===zh)return e.INT;if(i===Mi)return e.UNSIGNED_INT;if(i===bi)return e.FLOAT;if(i===Ti)return e.HALF_FLOAT;if(i===jm)return e.ALPHA;if(i===$m)return e.RGB;if(i===Ei)return e.RGBA;if(i===gs)return e.DEPTH_COMPONENT;if(i===ys)return e.DEPTH_STENCIL;if(i===tg)return e.RED;if(i===Vh)return e.RED_INTEGER;if(i===oa)return e.RG;if(i===kh)return e.RG_INTEGER;if(i===Wh)return e.RGBA_INTEGER;if(i===Xl||i===ql||i===Yl||i===Zl)if(r===re)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===Xl)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ql)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Yl)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Zl)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===Xl)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ql)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Yl)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Zl)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Xh||i===qh||i===Yh||i===Zh)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===Xh)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===qh)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Yh)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Zh)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Kh||i===Jh||i===Qh||i===jh||i===$h||i===Kl||i===tf)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(i===Kh||i===Jh)return r===re?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===Qh)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===jh)return a.COMPRESSED_R11_EAC;if(i===$h)return a.COMPRESSED_SIGNED_R11_EAC;if(i===Kl)return a.COMPRESSED_RG11_EAC;if(i===tf)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===ef||i===nf||i===sf||i===af||i===rf||i===of||i===lf||i===cf||i===uf||i===hf||i===ff||i===df||i===pf||i===mf)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(i===ef)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===nf)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===sf)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===af)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===rf)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===of)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===lf)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===cf)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===uf)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===hf)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ff)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===df)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===pf)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===mf)return r===re?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===gf||i===_f||i===vf)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(i===gf)return r===re?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===_f)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===vf)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===yf||i===xf||i===Jl||i===Sf)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(i===yf)return a.COMPRESSED_RED_RGTC1_EXT;if(i===xf)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Jl)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Sf)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Wa?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:n}}function KC(e,t){function n(_,h){_.matrixAutoUpdate===!0&&_.updateMatrix(),h.value.copy(_.matrix)}function i(_,h){h.color.getRGB(_.fogColor.value,ug(e)),h.isFog?(_.fogNear.value=h.near,_.fogFar.value=h.far):h.isFogExp2&&(_.fogDensity.value=h.density)}function s(_,h,m,y,x){h.isNodeMaterial?h.uniformsNeedUpdate=!1:h.isMeshBasicMaterial?a(_,h):h.isMeshLambertMaterial?(a(_,h),h.envMap&&(_.envMapIntensity.value=h.envMapIntensity)):h.isMeshToonMaterial?(a(_,h),p(_,h)):h.isMeshPhongMaterial?(a(_,h),f(_,h),h.envMap&&(_.envMapIntensity.value=h.envMapIntensity)):h.isMeshStandardMaterial?(a(_,h),u(_,h),h.isMeshPhysicalMaterial&&d(_,h,x)):h.isMeshMatcapMaterial?(a(_,h),v(_,h)):h.isMeshDepthMaterial?a(_,h):h.isMeshDistanceMaterial?(a(_,h),T(_,h)):h.isMeshNormalMaterial?a(_,h):h.isLineBasicMaterial?(r(_,h),h.isLineDashedMaterial&&o(_,h)):h.isPointsMaterial?l(_,h,m,y):h.isSpriteMaterial?c(_,h):h.isShadowMaterial?(_.color.value.copy(h.color),_.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function a(_,h){_.opacity.value=h.opacity,h.color&&_.diffuse.value.copy(h.color),h.emissive&&_.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(_.map.value=h.map,n(h.map,_.mapTransform)),h.alphaMap&&(_.alphaMap.value=h.alphaMap,n(h.alphaMap,_.alphaMapTransform)),h.bumpMap&&(_.bumpMap.value=h.bumpMap,n(h.bumpMap,_.bumpMapTransform),_.bumpScale.value=h.bumpScale,h.side===wn&&(_.bumpScale.value*=-1)),h.normalMap&&(_.normalMap.value=h.normalMap,n(h.normalMap,_.normalMapTransform),_.normalScale.value.copy(h.normalScale),h.side===wn&&_.normalScale.value.negate()),h.displacementMap&&(_.displacementMap.value=h.displacementMap,n(h.displacementMap,_.displacementMapTransform),_.displacementScale.value=h.displacementScale,_.displacementBias.value=h.displacementBias),h.emissiveMap&&(_.emissiveMap.value=h.emissiveMap,n(h.emissiveMap,_.emissiveMapTransform)),h.specularMap&&(_.specularMap.value=h.specularMap,n(h.specularMap,_.specularMapTransform)),h.alphaTest>0&&(_.alphaTest.value=h.alphaTest);let m=t.get(h),y=m.envMap,x=m.envMapRotation;y&&(_.envMap.value=y,_.envMapRotation.value.setFromMatrix4(ZC.makeRotationFromEuler(x)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&_.envMapRotation.value.premultiply(rM),_.reflectivity.value=h.reflectivity,_.ior.value=h.ior,_.refractionRatio.value=h.refractionRatio),h.lightMap&&(_.lightMap.value=h.lightMap,_.lightMapIntensity.value=h.lightMapIntensity,n(h.lightMap,_.lightMapTransform)),h.aoMap&&(_.aoMap.value=h.aoMap,_.aoMapIntensity.value=h.aoMapIntensity,n(h.aoMap,_.aoMapTransform))}function r(_,h){_.diffuse.value.copy(h.color),_.opacity.value=h.opacity,h.map&&(_.map.value=h.map,n(h.map,_.mapTransform))}function o(_,h){_.dashSize.value=h.dashSize,_.totalSize.value=h.dashSize+h.gapSize,_.scale.value=h.scale}function l(_,h,m,y){_.diffuse.value.copy(h.color),_.opacity.value=h.opacity,_.size.value=h.size*m,_.scale.value=y*.5,h.map&&(_.map.value=h.map,n(h.map,_.uvTransform)),h.alphaMap&&(_.alphaMap.value=h.alphaMap,n(h.alphaMap,_.alphaMapTransform)),h.alphaTest>0&&(_.alphaTest.value=h.alphaTest)}function c(_,h){_.diffuse.value.copy(h.color),_.opacity.value=h.opacity,_.rotation.value=h.rotation,h.map&&(_.map.value=h.map,n(h.map,_.mapTransform)),h.alphaMap&&(_.alphaMap.value=h.alphaMap,n(h.alphaMap,_.alphaMapTransform)),h.alphaTest>0&&(_.alphaTest.value=h.alphaTest)}function f(_,h){_.specular.value.copy(h.specular),_.shininess.value=Math.max(h.shininess,1e-4)}function p(_,h){h.gradientMap&&(_.gradientMap.value=h.gradientMap)}function u(_,h){_.metalness.value=h.metalness,h.metalnessMap&&(_.metalnessMap.value=h.metalnessMap,n(h.metalnessMap,_.metalnessMapTransform)),_.roughness.value=h.roughness,h.roughnessMap&&(_.roughnessMap.value=h.roughnessMap,n(h.roughnessMap,_.roughnessMapTransform)),h.envMap&&(_.envMapIntensity.value=h.envMapIntensity)}function d(_,h,m){_.ior.value=h.ior,h.diffuseRoughness>0&&(_.diffuseRoughness.value=h.diffuseRoughness,h.diffuseRoughnessMap&&(_.diffuseRoughnessMap.value=h.diffuseRoughnessMap,n(h.diffuseRoughnessMap,_.diffuseRoughnessMapTransform))),h.sheen>0&&(_.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),_.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(_.sheenColorMap.value=h.sheenColorMap,n(h.sheenColorMap,_.sheenColorMapTransform)),h.sheenRoughnessMap&&(_.sheenRoughnessMap.value=h.sheenRoughnessMap,n(h.sheenRoughnessMap,_.sheenRoughnessMapTransform))),h.clearcoat>0&&(_.clearcoat.value=h.clearcoat,_.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(_.clearcoatMap.value=h.clearcoatMap,n(h.clearcoatMap,_.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(_.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,n(h.clearcoatRoughnessMap,_.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(_.clearcoatNormalMap.value=h.clearcoatNormalMap,n(h.clearcoatNormalMap,_.clearcoatNormalMapTransform),_.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===wn&&_.clearcoatNormalScale.value.negate())),h.dispersion>0&&(_.dispersion.value=h.dispersion),h.retroreflectivity>0&&(_.retroreflectivity.value=h.retroreflectivity),h.iridescence>0&&(_.iridescence.value=h.iridescence,_.iridescenceIOR.value=h.iridescenceIOR,_.iridescenceThicknessMinimum.value=h.iridescenceThicknessMinimum,_.iridescenceThicknessMaximum.value=h.iridescenceThicknessMaximum,h.iridescenceMap&&(_.iridescenceMap.value=h.iridescenceMap,n(h.iridescenceMap,_.iridescenceMapTransform)),h.iridescenceThicknessMap&&(_.iridescenceThicknessMap.value=h.iridescenceThicknessMap,n(h.iridescenceThicknessMap,_.iridescenceThicknessMapTransform))),h.transmission>0&&(_.transmission.value=h.transmission,_.transmissionSamplerMap.value=m.texture,_.transmissionSamplerSize.value.set(m.width,m.height),h.transmissionMap&&(_.transmissionMap.value=h.transmissionMap,n(h.transmissionMap,_.transmissionMapTransform)),_.thickness.value=h.thickness,h.thicknessMap&&(_.thicknessMap.value=h.thicknessMap,n(h.thicknessMap,_.thicknessMapTransform)),_.attenuationDistance.value=h.attenuationDistance,_.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(_.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(_.anisotropyMap.value=h.anisotropyMap,n(h.anisotropyMap,_.anisotropyMapTransform))),_.specularIntensity.value=h.specularIntensity,_.specularColor.value.copy(h.specularColor),h.specularColorMap&&(_.specularColorMap.value=h.specularColorMap,n(h.specularColorMap,_.specularColorMapTransform)),h.specularIntensityMap&&(_.specularIntensityMap.value=h.specularIntensityMap,n(h.specularIntensityMap,_.specularIntensityMapTransform))}function v(_,h){h.matcap&&(_.matcap.value=h.matcap)}function T(_,h){let m=t.get(h).light;_.referencePosition.value.setFromMatrixPosition(m.matrixWorld),_.nearDistance.value=m.shadow.camera.near,_.farDistance.value=m.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function JC(e,t,n,i){let s={},a={};function r(m,y){let x=y.program;i.uniformBlockBinding(m,x,s[m.id])}function o(m,y){let x=s[m.id];x===void 0&&(v(m),x=l(m),s[m.id]=x,m.addEventListener("dispose",_));let E=y.program;i.updateUBOMapping(m,E);let A=t.render.frame;a[m.id]!==A&&(c(m),a[m.id]=A)}function l(m){let y=e.createBuffer(),x=m.__size,E=m.usage;return e.bindBuffer(e.UNIFORM_BUFFER,y),e.bufferData(e.UNIFORM_BUFFER,x,E),e.bindBuffer(e.UNIFORM_BUFFER,null),y}function c(m){let y=s[m.id],x=m.uniforms,E=m.__cache;e.bindBuffer(e.UNIFORM_BUFFER,y);for(let A=0,g=x.length;A<g;A++){let M=x[A];if(Array.isArray(M))for(let N=0,R=M.length;N<R;N++)f(M[N],A,N,E);else f(M,A,0,E)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function f(m,y,x,E){if(u(m,y,x,E)===!0){let A=m.__offset,g=m.value;if(Array.isArray(g)){let M=0;for(let N=0;N<g.length;N++){let R=g[N],O=T(R,!0);p(R,m.__data,M),M+=O.storage/Float32Array.BYTES_PER_ELEMENT}}else p(g,m.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,A,m.__data)}}function p(m,y,x){typeof m=="number"||typeof m=="boolean"?y[x]=m:m.isMatrix3?(y[x]=m.elements[0],y[x+1]=m.elements[1],y[x+2]=m.elements[2],y[x+3]=0,y[x+4]=m.elements[3],y[x+5]=m.elements[4],y[x+6]=m.elements[5],y[x+7]=0,y[x+8]=m.elements[6],y[x+9]=m.elements[7],y[x+10]=m.elements[8],y[x+11]=0):ArrayBuffer.isView(m)?y.set(m.subarray(0,y.length-x),x):m.toArray(y,x)}function u(m,y,x,E){let A=m.value,g=y+"_"+x;if(Array.isArray(A)){E[g]===void 0&&(E[g]=[]);let M=E[g],N=!1;for(let R=0;R<A.length;R++)d(A[R],M,R)===!0&&(N=!0);return N}return d(A,E,g)}function d(m,y,x){if(y[x]===void 0)return typeof m=="number"||typeof m=="boolean"?y[x]=m:ArrayBuffer.isView(m)?y[x]=m.slice():y[x]=m.clone(),!0;{let E=y[x];if(typeof m=="number"||typeof m=="boolean"){if(E!==m)return y[x]=m,!0}else{if(ArrayBuffer.isView(m))return!0;if(E.equals(m)===!1)return E.copy(m),!0}}return!1}function v(m){let y=m.uniforms,x=0,E=16;for(let g=0,M=y.length;g<M;g++){let N=Array.isArray(y[g])?y[g]:[y[g]];for(let R=0,O=N.length;R<O;R++){let F=N[R],q=Array.isArray(F.value)?F.value:[F.value],L=Array.isArray(y[g])||Array.isArray(F.value),W=x;for(let G=0,nt=q.length;G<nt;G++){let V=q[G],j=T(V,L),tt=x%E,yt=tt%j.boundary,Lt=tt+yt;x+=yt,Lt!==0&&E-Lt<j.storage&&(x+=E-Lt),G===0&&(W=x),x+=j.storage}let Z=F.type==="int"?Int32Array:F.type==="uint"?Uint32Array:Float32Array;F.__data=new Z((x-W)/Float32Array.BYTES_PER_ELEMENT),F.__offset=W}}let A=x%E;return A>0&&(x+=E-A),m.__size=x,m.__cache={},this}function T(m,y){let x={boundary:0,storage:0};return typeof m=="number"||typeof m=="boolean"?(x.boundary=4,x.storage=4):m.isVector2?(x.boundary=8,x.storage=8):m.isVector3||m.isColor?(x.boundary=16,x.storage=12):m.isVector4?(x.boundary=16,x.storage=16):m.isMatrix3?(x.boundary=16,x.storage=48):m.isMatrix4?(x.boundary=16,x.storage=64):m.isTexture?Dt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(m)?(x.boundary=16,x.storage=m.byteLength):Dt("WebGLRenderer: Unsupported uniform value type.",m),y===!0&&(x.boundary=16,x.storage=Math.ceil(x.storage/16)*16),x}function _(m){let y=m.target;y.removeEventListener("dispose",_),e.deleteBuffer(s[y.id]),delete s[y.id],delete a[y.id]}function h(){for(let m in s)e.deleteBuffer(s[m]);s={},a={}}return{bind:r,update:o,dispose:h}}function jC(){return Vi===null&&(Vi=new mh(QC,16,16,oa,Ti),Vi.name="DFG_LUT",Vi.minFilter=An,Vi.magFilter=An,Vi.wrapS=Ii,Vi.wrapT=Ii,Vi.generateMipmaps=!1,Vi.needsUpdate=!0),Vi}var mE,gE,_E,vE,yE,xE,SE,ME,bE,TE,EE,AE,wE,RE,CE,DE,LE,NE,UE,OE,PE,IE,BE,FE,zE,HE,GE,VE,kE,WE,XE,qE,YE,ZE,KE,JE,QE,jE,$E,tA,eA,nA,iA,sA,aA,rA,oA,lA,cA,uA,hA,fA,dA,pA,mA,gA,_A,vA,yA,xA,SA,MA,bA,TA,EA,AA,wA,RA,CA,DA,LA,NA,UA,OA,PA,IA,BA,FA,zA,HA,GA,VA,kA,WA,XA,qA,YA,ZA,KA,JA,QA,jA,$A,tw,ew,nw,iw,sw,aw,rw,ow,lw,cw,uw,hw,fw,dw,pw,mw,gw,_w,vw,yw,xw,Sw,Mw,bw,Tw,Ew,Aw,ww,Rw,Cw,Dw,Lw,Nw,Uw,Ow,Pw,Iw,Bw,Fw,zw,Hw,Gw,Vw,kw,Ww,Xw,qw,Yw,kt,gt,ki,Mf,Zw,QS,$l,CS,tR,eR,jS,$S,nR,iR,sR,Tf,mR,tM,eM,nM,iM,sM,aM,US,OS,PS,IS,BS,Mg,bg,Tg,xg,oo,sC,aC,HS,cC,bf,mC,_C,yC,SC,bC,AC,Ag,wg,OC,FC,zC,HC,GC,KS,Ql,Sg,qC,YC,Rg,Cg,ZC,rM,QC,Vi,Ef,oM=Lf(()=>{yg();yg();mE=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,gE=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,_E=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,vE=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,yE=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,xE=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,SE=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,ME=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,bE=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,TE=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,EE=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,AE=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,wE=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,RE=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,CE=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,DE=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,LE=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,NE=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,UE=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,OE=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,PE=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,IE=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,BE=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,FE=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,zE=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,HE=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,GE=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,VE=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,kE=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,WE="gl_FragColor = linearToOutputTexel( gl_FragColor );",XE=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,qE=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,YE=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,ZE=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,KE=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,JE=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,QE=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,jE=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,$E=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,tA=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,eA=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,nA=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,iA=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,sA=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,aA=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,rA=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,oA=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lA=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,cA=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,uA=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,hA=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,fA=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,dA=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,pA=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,mA=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,gA=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,_A=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,vA=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,yA=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,xA=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,SA=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,MA=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,bA=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,TA=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,EA=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,AA=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,wA=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,RA=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,CA=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,DA=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,LA=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,NA=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,UA=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,OA=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,PA=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,IA=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,BA=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,FA=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,zA=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,HA=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,GA=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,VA=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,kA=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,WA=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,XA=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,qA=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,YA=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,ZA=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,KA=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,JA=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,QA=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,jA=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,$A=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,tw=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ew=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,nw=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,iw=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,sw=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,aw=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,rw=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,ow=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,lw=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,cw=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,hw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,fw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,dw=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,pw=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,mw=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,gw=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_w=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,vw=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,yw=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,xw=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Sw=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Mw=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,bw=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Tw=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Ew=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Aw=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,ww=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Rw=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Cw=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Dw=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Lw=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Nw=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Uw=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ow=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Pw=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Iw=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Bw=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Fw=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,zw=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hw=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Gw=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vw=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,kw=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ww=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Xw=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,qw=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Yw=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,kt={alphahash_fragment:mE,alphahash_pars_fragment:gE,alphamap_fragment:_E,alphamap_pars_fragment:vE,alphatest_fragment:yE,alphatest_pars_fragment:xE,aomap_fragment:SE,aomap_pars_fragment:ME,batching_pars_vertex:bE,batching_vertex:TE,begin_vertex:EE,beginnormal_vertex:AE,bsdfs:wE,iridescence_fragment:RE,bumpmap_pars_fragment:CE,clipping_planes_fragment:DE,clipping_planes_pars_fragment:LE,clipping_planes_pars_vertex:NE,clipping_planes_vertex:UE,color_fragment:OE,color_pars_fragment:PE,color_pars_vertex:IE,color_vertex:BE,common:FE,defaultnormal_vertex:zE,displacementmap_pars_vertex:HE,displacementmap_vertex:GE,emissivemap_fragment:VE,emissivemap_pars_fragment:kE,colorspace_fragment:WE,colorspace_pars_fragment:XE,envmap_fragment:qE,envmap_common_pars_fragment:YE,envmap_pars_fragment:ZE,envmap_pars_vertex:KE,envmap_physical_pars_fragment:rA,envmap_vertex:JE,fog_vertex:QE,fog_pars_vertex:jE,fog_fragment:$E,fog_pars_fragment:tA,gradientmap_pars_fragment:eA,lightmap_pars_fragment:nA,lights_lambert_fragment:iA,lights_lambert_pars_fragment:sA,lights_pars_begin:aA,lights_toon_fragment:oA,lights_toon_pars_fragment:lA,lights_phong_fragment:cA,lights_phong_pars_fragment:uA,lights_physical_fragment:hA,lights_physical_pars_fragment:fA,lights_fragment_begin:dA,lights_fragment_maps:pA,lights_fragment_end:mA,lightprobes_pars_fragment:gA,logdepthbuf_fragment:_A,logdepthbuf_pars_fragment:vA,logdepthbuf_pars_vertex:yA,logdepthbuf_vertex:xA,map_fragment:SA,map_pars_fragment:MA,map_particle_fragment:bA,map_particle_pars_fragment:TA,metalnessmap_fragment:EA,metalnessmap_pars_fragment:AA,morphinstance_vertex:wA,morphcolor_vertex:RA,morphnormal_vertex:CA,morphtarget_pars_vertex:DA,morphtarget_vertex:LA,normal_fragment_begin:NA,normal_fragment_maps:UA,normal_pars_fragment:OA,normal_pars_vertex:PA,normal_vertex:IA,normalmap_pars_fragment:BA,clearcoat_normal_fragment_begin:FA,clearcoat_normal_fragment_maps:zA,clearcoat_pars_fragment:HA,iridescence_pars_fragment:GA,opaque_fragment:VA,packing:kA,premultiplied_alpha_fragment:WA,project_vertex:XA,dithering_fragment:qA,dithering_pars_fragment:YA,roughnessmap_fragment:ZA,roughnessmap_pars_fragment:KA,shadowmap_pars_fragment:JA,shadowmap_pars_vertex:QA,shadowmap_vertex:jA,shadowmask_pars_fragment:$A,skinbase_vertex:tw,skinning_pars_vertex:ew,skinning_vertex:nw,skinnormal_vertex:iw,specularmap_fragment:sw,specularmap_pars_fragment:aw,tonemapping_fragment:rw,tonemapping_pars_fragment:ow,transmission_fragment:lw,transmission_pars_fragment:cw,uv_pars_fragment:uw,uv_pars_vertex:hw,uv_vertex:fw,worldpos_vertex:dw,background_vert:pw,background_frag:mw,backgroundCube_vert:gw,backgroundCube_frag:_w,cube_vert:vw,cube_frag:yw,depth_vert:xw,depth_frag:Sw,distance_vert:Mw,distance_frag:bw,equirect_vert:Tw,equirect_frag:Ew,linedashed_vert:Aw,linedashed_frag:ww,meshbasic_vert:Rw,meshbasic_frag:Cw,meshlambert_vert:Dw,meshlambert_frag:Lw,meshmatcap_vert:Nw,meshmatcap_frag:Uw,meshnormal_vert:Ow,meshnormal_frag:Pw,meshphong_vert:Iw,meshphong_frag:Bw,meshphysical_vert:Fw,meshphysical_frag:zw,meshtoon_vert:Hw,meshtoon_frag:Gw,points_vert:Vw,points_frag:kw,shadow_vert:Ww,shadow_frag:Xw,sprite_vert:qw,sprite_frag:Yw},gt={common:{diffuse:{value:new te(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Pt},alphaMap:{value:null},alphaMapTransform:{value:new Pt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Pt}},envmap:{envMap:{value:null},envMapRotation:{value:new Pt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Pt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Pt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Pt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Pt},normalScale:{value:new jt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Pt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Pt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Pt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Pt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new te(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new te(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Pt},alphaTest:{value:0},uvTransform:{value:new Pt}},sprite:{diffuse:{value:new te(16777215)},opacity:{value:1},center:{value:new jt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Pt},alphaMap:{value:null},alphaMapTransform:{value:new Pt},alphaTest:{value:0}}},ki={basic:{uniforms:pn([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.fog]),vertexShader:kt.meshbasic_vert,fragmentShader:kt.meshbasic_frag},lambert:{uniforms:pn([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new te(0)},envMapIntensity:{value:1}}]),vertexShader:kt.meshlambert_vert,fragmentShader:kt.meshlambert_frag},phong:{uniforms:pn([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new te(0)},specular:{value:new te(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:kt.meshphong_vert,fragmentShader:kt.meshphong_frag},standard:{uniforms:pn([gt.common,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.roughnessmap,gt.metalnessmap,gt.fog,gt.lights,{emissive:{value:new te(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag},toon:{uniforms:pn([gt.common,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.gradientmap,gt.fog,gt.lights,{emissive:{value:new te(0)}}]),vertexShader:kt.meshtoon_vert,fragmentShader:kt.meshtoon_frag},matcap:{uniforms:pn([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,{matcap:{value:null}}]),vertexShader:kt.meshmatcap_vert,fragmentShader:kt.meshmatcap_frag},points:{uniforms:pn([gt.points,gt.fog]),vertexShader:kt.points_vert,fragmentShader:kt.points_frag},dashed:{uniforms:pn([gt.common,gt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:kt.linedashed_vert,fragmentShader:kt.linedashed_frag},depth:{uniforms:pn([gt.common,gt.displacementmap]),vertexShader:kt.depth_vert,fragmentShader:kt.depth_frag},normal:{uniforms:pn([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,{opacity:{value:1}}]),vertexShader:kt.meshnormal_vert,fragmentShader:kt.meshnormal_frag},sprite:{uniforms:pn([gt.sprite,gt.fog]),vertexShader:kt.sprite_vert,fragmentShader:kt.sprite_frag},background:{uniforms:{uvTransform:{value:new Pt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:kt.background_vert,fragmentShader:kt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Pt}},vertexShader:kt.backgroundCube_vert,fragmentShader:kt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:kt.cube_vert,fragmentShader:kt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:kt.equirect_vert,fragmentShader:kt.equirect_frag},distance:{uniforms:pn([gt.common,gt.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:kt.distance_vert,fragmentShader:kt.distance_frag},shadow:{uniforms:pn([gt.lights,gt.fog,{color:{value:new te(0)},opacity:{value:1}}]),vertexShader:kt.shadow_vert,fragmentShader:kt.shadow_frag}};ki.physical={uniforms:pn([ki.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Pt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Pt},clearcoatNormalScale:{value:new jt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Pt},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Pt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Pt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Pt},sheen:{value:0},sheenColor:{value:new te(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Pt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Pt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Pt},transmissionSamplerSize:{value:new jt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Pt},attenuationDistance:{value:0},attenuationColor:{value:new te(0)},specularColor:{value:new te(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Pt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Pt},anisotropyVector:{value:new jt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Pt}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag};Mf={r:0,b:0,g:0},Zw=new Ce,QS=new Pt;QS.set(-1,0,0,0,1,0,0,0,1);$l=class extends Vn{constructor(t=1,n={}){super(t,t,n),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new Pl(s),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new to(5,5,5),a=new Wn({name:"CubemapFromEquirect",uniforms:Xa(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:wn,blending:Ga});a.uniforms.tEquirect.value=n;let r=new ci(s,a),o=n.minFilter;return n.minFilter===vs&&(n.minFilter=An),new eo(1,10,this).update(t,r),n.minFilter=o,r.geometry.dispose(),r.material.dispose(),this}clear(t,n=!0,i=!0,s=!0){let a=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(n,i,s);t.setRenderTarget(a)}},CS=256,tR=3,eR=20,jS=256,$S=16,nR=3,iR=new z,sR=new te,Tf=class e{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new eo(1,10,null),this._boxMesh=new ci(new to(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,n=0,i=.1,s=100,a={}){let{size:r=256,position:o=iR}=a,l=this._renderer;this._setSize(r);let c=this._allocateTarget(),f=this._getSourceTarget(!0);n>0&&(f.texture.mipmapsAutoUpdate=!1);let p=l.autoClear,u=l.autoClearColor,d=l.autoClearDepth,v=l.autoClearStencil,T=t.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,T===null&&(t.background=l.getClearColor(sR));let _=new eo(i,s,f);return _.position.copy(o),_.update(l,t),l.autoClear=p,l.autoClearColor=u,l.autoClearDepth=d,l.autoClearStencil=v,t.background=T,n>0&&(f.texture.mipmapsAutoUpdate=!0,this._blur(c,n)),this._applyPMREM(c),c}fromEquirectangular(t,n=null){return this._fromTexture(t,n)}fromCubemap(t,n=null){return this._fromTexture(t,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=NS(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=LS(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,n){return n>0?1-Math.sqrt(1-t/n):0}_setSize(t){this._cubeSize=Math.max(CS,lg(t))}_fromTexture(t,n){t.mapping===ka||t.mapping===so?this._setSize(t.image.length===0?CS:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);let i=n||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(i),i}_allocateTarget(){let t=this._cubeSize,n=DS(t,!1,!1),i=Math.log2(t)-tR;for(let s=0;s<=i;s++)n.texture.mipmaps.push({width:t>>s,height:t>>s});return n.texture.name="PMREM",n.texture.isPMREMTexture=!0,n}_getSourceTarget(t=!1){let n=this._cubeSize,i=this._sourceTarget;return(i===null||i.width!==n||t&&i.depthBuffer===!1)&&(i!==null&&i.dispose(),this._sourceTarget=DS(n,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,n,i){let s=this._boxMesh,a=this._cubeCamera;s.material=i,a.renderTarget=t,a.activeMipmapLevel=n;let r=t.width>>n;t.viewport.set(0,0,r,r),a.update(this._renderer,s),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let n;t.mapping===ka||t.mapping===so?(this._cubemapMaterial===null&&(this._cubemapMaterial=NS()),n=this._cubemapMaterial,n.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=LS()),n=this._equirectMaterial),n.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,n)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=aR(),this._integrationMaterial=rR());let n=this._cubeSize,i=t.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/$S);for(let r=0;r<=i;r++){let o=e.lodToRoughness(r,i);if(r>i-nR)a.roughness.value=o,this._renderCube(t,r,this._integrationMaterial);else{let l=o>0?Math.log2(n)+.5*Math.log2(6/(jS*Math.pow(o,4)))+.5:0;s.roughness.value=o,s.lodBias.value=l,this._renderCube(t,r,this._ggxMaterial)}}}_blur(t,n){this._blurMaterial===null&&(this._blurMaterial=oR());let i=this._blurMaterial,s=i.uniforms,a=this._sourceTarget;s.sigma.value=Math.min(n,Math.PI)/Math.SQRT2,s.envMap.value=a.texture,this._renderCube(t,0,i),s.envMap.value=t.texture,this._renderCube(a,0,i)}};mR={[Hm]:"LINEAR_TONE_MAPPING",[Gm]:"REINHARD_TONE_MAPPING",[Vm]:"CINEON_TONE_MAPPING",[km]:"ACES_FILMIC_TONE_MAPPING",[Xm]:"AGX_TONE_MAPPING",[qm]:"NEUTRAL_TONE_MAPPING",[Wm]:"CUSTOM_TONE_MAPPING"};tM=new Ln,eM=new _s(1,1),nM=new Il(1),iM=new Rl,sM=new dh,aM=new Pl,US=[],OS=[],PS=new Float32Array(16),IS=new Float32Array(9),BS=new Float32Array(4);Mg=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.setValue=IR(n.type)}},bg=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=nC(n.type)}},Tg=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,n,i){let s=this.seq;for(let a=0,r=s.length;a!==r;++a){let o=s[a];o.setValue(t,n[o.id],i)}}},xg=/(\w+)(\])?(\[|\.)?/g;oo=class{constructor(t,n){this.seq=[],this.map={};let i=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){let o=t.getActiveUniform(n,r),l=t.getUniformLocation(n,o.name);iC(o,l,this)}let s=[],a=[];for(let r of this.seq)r.type===t.SAMPLER_2D_SHADOW||r.type===t.SAMPLER_CUBE_SHADOW||r.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(r):a.push(r);s.length>0&&(this.seq=s.concat(a))}setValue(t,n,i,s){let a=this.map[n];a!==void 0&&a.setValue(t,i,s)}setOptional(t,n,i){let s=n[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,n,i,s){for(let a=0,r=n.length;a!==r;++a){let o=n[a],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,n){let i=[];for(let s=0,a=t.length;s!==a;++s){let r=t[s];r.id in n&&i.push(r)}return i}};sC=37297,aC=0;HS=new Pt;cC={[Hm]:"Linear",[Gm]:"Reinhard",[Vm]:"Cineon",[km]:"ACESFilmic",[Xm]:"AgX",[qm]:"Neutral",[Wm]:"Custom"};bf=new z;mC=/^[ \t]*#include +<([\w\d./]+)>/gm;_C=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;yC={[kl]:"SHADOWMAP_TYPE_PCF",[no]:"SHADOWMAP_TYPE_VSM"};SC={[so]:"ENVMAP_MODE_REFRACTION"};bC={[zm]:"ENVMAP_BLENDING_MULTIPLY",[oS]:"ENVMAP_BLENDING_MIX",[lS]:"ENVMAP_BLENDING_ADD"};AC=0,Ag=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,n,i){let s=this._getShaderCacheForMaterial(t);return s.has(n)===!1&&(s.add(n),n.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(t){let n=this.materialCache.get(t);for(let i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let n=this.materialCache,i=n.get(t);return i===void 0&&(i=new Set,n.set(t,i)),i}_getShaderStage(t){let n=this.shaderCache,i=n.get(t);return i===void 0&&(i=new wg(t),n.set(t,i)),i}},wg=class{constructor(t){this.id=AC++,this.code=t,this.usedTimes=0}};OC=0;FC=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,zC=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,HC=[new z(1,0,0),new z(-1,0,0),new z(0,1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1)],GC=[new z(0,-1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1),new z(0,-1,0),new z(0,-1,0)],KS=new Ce,Ql=new z,Sg=new z;qC=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,YC=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Rg=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,n){if(this.texture===null){let i=new Bl(t.texture);(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){let n=t.cameras[0].viewport,i=new Wn({vertexShader:qC,fragmentShader:YC,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new ci(new zl(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Cg=class extends Bi{constructor(t,n){super();let i=this,s=null,a=1,r=null,o="local-floor",l=1,c=null,f=null,p=null,u=null,d=null,v=null,T=typeof XRWebGLBinding<"u",_=new Rg,h={},m=n.getContextAttributes(),y=null,x=null,E=[],A=[],g=new jt,M=null,N=null,R=new Tn;R.viewport=new De;let O=new Tn;O.viewport=new De;let F=[R,O],q=new Uh,L=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(k){let dt=E[k];return dt===void 0&&(dt=new $r,E[k]=dt),dt.getTargetRaySpace()},this.getControllerGrip=function(k){let dt=E[k];return dt===void 0&&(dt=new $r,E[k]=dt),dt.getGripSpace()},this.getHand=function(k){let dt=E[k];return dt===void 0&&(dt=new $r,E[k]=dt),dt.getHandSpace()};function Z(k){let dt=A.indexOf(k.inputSource);if(dt===-1)return;let vt=E[dt];vt!==void 0&&(vt.update(k.inputSource,k.frame,c||r),vt.dispatchEvent({type:k.type,data:k.inputSource}))}function G(){s.removeEventListener("select",Z),s.removeEventListener("selectstart",Z),s.removeEventListener("selectend",Z),s.removeEventListener("squeeze",Z),s.removeEventListener("squeezestart",Z),s.removeEventListener("squeezeend",Z),s.removeEventListener("end",G),s.removeEventListener("inputsourceschange",nt);for(let k=0;k<E.length;k++){let dt=A[k];dt!==null&&(A[k]=null,E[k].disconnect(dt))}L=null,W=null,_.reset();for(let k in h)delete h[k];if(t.setRenderTarget(y),d=null,u=null,p=null,s=null,x=null,Lt.stop(),i.isPresenting=!1,t.setPixelRatio(M),t.setSize(g.width,g.height,!1),N!==null){let k=N.camera;k.fov=N.fov,k.zoom=N.zoom,k.updateProjectionMatrix(),N=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(k){a=k,i.isPresenting===!0&&Dt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(k){o=k,i.isPresenting===!0&&Dt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(k){c=k},this.getBaseLayer=function(){return u!==null?u:d},this.getBinding=function(){return p===null&&T&&(p=new XRWebGLBinding(s,n)),p},this.getFrame=function(){return v},this.getSession=function(){return s},this.setSession=async function(k){if(s=k,s!==null){if(y=t.getRenderTarget(),s.addEventListener("select",Z),s.addEventListener("selectstart",Z),s.addEventListener("selectend",Z),s.addEventListener("squeeze",Z),s.addEventListener("squeezestart",Z),s.addEventListener("squeezeend",Z),s.addEventListener("end",G),s.addEventListener("inputsourceschange",nt),m.xrCompatible!==!0&&await n.makeXRCompatible(),M=t.getPixelRatio(),t.getSize(g),T&&"createProjectionLayer"in XRWebGLBinding.prototype){let vt=null,At=null,pt=null;m.depth&&(pt=m.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,vt=m.stencil?ys:gs,At=m.stencil?Wa:Mi);let Nt={colorFormat:n.RGBA8,depthFormat:pt,scaleFactor:a};p=this.getBinding(),u=p.createProjectionLayer(Nt),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),x=new Vn(u.textureWidth,u.textureHeight,{format:Ei,type:qn,depthTexture:new _s(u.textureWidth,u.textureHeight,At,void 0,void 0,void 0,void 0,void 0,void 0,vt),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let vt={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:a};d=new XRWebGLLayer(s,n,vt),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),x=new Vn(d.framebufferWidth,d.framebufferHeight,{format:Ei,type:qn,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await s.requestReferenceSpace(o),Lt.setContext(s),Lt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function nt(k){for(let dt=0;dt<k.removed.length;dt++){let vt=k.removed[dt],At=A.indexOf(vt);At>=0&&(A[At]=null,E[At].disconnect(vt))}for(let dt=0;dt<k.added.length;dt++){let vt=k.added[dt],At=A.indexOf(vt);if(At===-1){for(let Nt=0;Nt<E.length;Nt++)if(Nt>=A.length){A.push(vt),At=Nt;break}else if(A[Nt]===null){A[Nt]=vt,At=Nt;break}if(At===-1)break}let pt=E[At];pt&&pt.connect(vt)}}function V(k,dt){dt===null?k.matrixWorld.copy(k.matrix):k.matrixWorld.multiplyMatrices(dt.matrixWorld,k.matrix),k.matrixWorldInverse.copy(k.matrixWorld).invert()}this.updateCamera=function(k){if(s===null)return;let dt=k.near,vt=k.far;_.texture!==null&&(_.depthNear>0&&(dt=_.depthNear),_.depthFar>0&&(vt=_.depthFar)),q.near=O.near=R.near=dt,q.far=O.far=R.far=vt,(L!==q.near||W!==q.far)&&(s.updateRenderState({depthNear:q.near,depthFar:q.far}),L=q.near,W=q.far),q.layers.mask=k.layers.mask|6,R.layers.mask=q.layers.mask&-5,O.layers.mask=q.layers.mask&-3;let At=k.parent,pt=q.cameras;V(q,At);for(let Nt=0;Nt<pt.length;Nt++)V(pt[Nt],At);q.projectionMatrix.copy(R.projectionMatrix),q.projectionMatrixInverse.copy(R.projectionMatrixInverse),N===null&&k.isPerspectiveCamera&&(N={camera:k,fov:k.fov,zoom:k.zoom}),j(k,q,At)};function j(k,dt,vt){vt===null?k.matrix.copy(dt.matrixWorld):(k.matrix.copy(vt.matrixWorld),k.matrix.invert(),k.matrix.multiply(dt.matrixWorld)),k.matrix.decompose(k.position,k.quaternion,k.scale),k.updateMatrixWorld(!0),k.projectionMatrix.copy(dt.projectionMatrix),k.projectionMatrixInverse.copy(dt.projectionMatrixInverse),k.isPerspectiveCamera&&(k.fov=Qr*2*Math.atan(1/k.projectionMatrix.elements[5]),k.zoom=1)}this.getCamera=function(){return q},this.getFoveation=function(){if(!(u===null&&d===null))return l},this.setFoveation=function(k){l=k,u!==null&&(u.fixedFoveation=k),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=k)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(q)},this.getCameraTexture=function(k){return h[k]};let tt=null;function yt(k,dt){if(f=dt.getViewerPose(c||r),v=dt,f!==null){let vt=f.views;d!==null&&(t.setRenderTargetFramebuffer(x,d.framebuffer),t.setRenderTarget(x));let At=!1;vt.length!==q.cameras.length&&(q.cameras.length=0,At=!0);for(let Tt=0;Tt<vt.length;Tt++){let ie=vt[Tt],se=null;if(d!==null)se=d.getViewport(ie);else{let Pe=p.getViewSubImage(u,ie);se=Pe.viewport,Tt===0&&(t.setRenderTargetTextures(x,Pe.colorTexture,Pe.depthStencilTexture),t.setRenderTarget(x))}let zt=F[Tt];zt===void 0&&(zt=new Tn,zt.layers.enable(Tt),zt.viewport=new De,F[Tt]=zt),zt.matrix.fromArray(ie.transform.matrix),zt.matrix.decompose(zt.position,zt.quaternion,zt.scale),zt.projectionMatrix.fromArray(ie.projectionMatrix),zt.projectionMatrixInverse.copy(zt.projectionMatrix).invert(),zt.viewport.set(se.x,se.y,se.width,se.height),Tt===0&&(q.matrix.copy(zt.matrix),q.matrix.decompose(q.position,q.quaternion,q.scale)),At===!0&&q.cameras.push(zt)}let pt=s.enabledFeatures;if(pt&&pt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&T){p=i.getBinding();let Tt=p.getDepthInformation(vt[0]);Tt&&Tt.isValid&&Tt.texture&&_.init(Tt,s.renderState)}if(pt&&pt.includes("camera-access")&&T){t.state.unbindTexture(),p=i.getBinding();for(let Tt=0;Tt<vt.length;Tt++){let ie=vt[Tt].camera;if(ie){let se=h[ie];se||(se=new Bl,h[ie]=se);let zt=p.getCameraImage(ie);se.sourceTexture=zt}}}}for(let vt=0;vt<E.length;vt++){let At=A[vt],pt=E[vt];At!==null&&pt!==void 0&&pt.update(At,dt,c||r)}tt&&tt(k,dt),dt.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:dt}),v=null}let Lt=new JS;Lt.setAnimationLoop(yt),this.setAnimationLoop=function(k){tt=k},this.dispose=function(){}}},ZC=new Ce,rM=new Pt;rM.set(-1,0,0,0,1,0,0,0,1);QC=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Vi=null;Ef=class{constructor(t={}){let{canvas:n=yS(),context:i=null,depth:s=!0,stencil:a=!1,alpha:r=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:u=!1,outputBufferType:d=qn}=t;this.isWebGLRenderer=!0;let v;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");v=i.getContextAttributes().alpha}else v=r;let T=d,_=new Set([Wh,kh,Vh]),h=new Set([qn,Mi,ao,Wa,Hh,Gh]),m=new Uint32Array(4),y=new Int32Array(4),x={textures:[],min:[],max:[],resolution:[]},E=null,A=null,g=[],M=[],N=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Gi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let R=this,O=!1,F=null,q=null,L=null,W=null;this._outputColorSpace=bn;let Z=0,G=0,nt=null,V=-1,j=null,tt=new De,yt=new De,Lt=null,k=new te(0),dt=0,vt=n.width,At=n.height,pt=1,Nt=null,Me=null,Tt=new De(0,0,vt,At),ie=new De(0,0,vt,At),se=!1,zt=new Ha,Pe=new gh,Ct=!1,Xt=!1,It=new Ce,be=new z,pe=new De,en={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},gn=!1;function qe(){return nt===null?pt:1}let U=i;function _n(b,D){return n.getContext(b,D)}let oe,me,ft,Ue,wt,Ut,w,S,P,et,Q,rt,it,Y,K,lt,C,J,X,ct,at,ot,Et;try{let b={alpha:!0,depth:s,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:f,failIfMajorPerformanceCaveat:p};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${Ph}`),n.addEventListener("webglcontextlost",Rt,!1),n.addEventListener("webglcontextrestored",Ht,!1),n.addEventListener("webglcontextcreationerror",mt,!1),U===null){let D="webgl2";if(U=_n(D,b),U===null)throw _n(D)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Gt()}catch(b){throw n.removeEventListener("webglcontextlost",Rt,!1),n.removeEventListener("webglcontextrestored",Ht,!1),n.removeEventListener("webglcontextcreationerror",mt,!1),Ot("WebGLRenderer: "+b.message),b}function Gt(){oe=new cR(U),oe.init(),at=new XC(U,oe),me=new jw(U,oe,t,at),ft=new kC(U,oe),me.reversedDepthBuffer&&u&&ft.buffers.depth.setReversed(!0),q=U.createFramebuffer(),L=U.createFramebuffer(),W=U.createFramebuffer(),Ue=new fR(U),wt=new CC,Ut=new WC(U,oe,ft,wt,me,at,Ue),w=new lR(R),S=new pE(U),ot=new Jw(U,S),P=new uR(U,S,Ue,ot),et=new pR(U,P,S,ot,Ue),J=new dR(U,me,Ut),K=new $w(wt),Q=new RC(R,w,oe,me,ot,K),rt=new KC(R,wt),it=new LC,Y=new BC(oe),C=new Kw(R,w,ft,et,v,l),lt=new VC(R,et,me),Et=new JC(U,Ue,me,ft),X=new Qw(U,oe,Ue),ct=new hR(U,oe,Ue),Ue.programs=Q.programs,R.capabilities=me,R.extensions=oe,R.properties=wt,R.renderLists=it,R.shadowMap=lt,R.state=ft,R.info=Ue}T!==qn&&(N=new gR(T,n.width,n.height,o,s,a));let st=new Cg(R,U);this.xr=st,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){let b=oe.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=oe.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return pt},this.setPixelRatio=function(b){b!==void 0&&(pt=b,this.setSize(vt,At,!1))},this.getSize=function(b){return b.set(vt,At)},this.setSize=function(b,D,H=!0){if(st.isPresenting){Dt("WebGLRenderer: Can't change size while VR device is presenting.");return}vt=b,At=D,n.width=Math.floor(b*pt),n.height=Math.floor(D*pt),H===!0&&(n.style.width=b+"px",n.style.height=D+"px"),N!==null&&N.setSize(n.width,n.height),this.setViewport(0,0,b,D)},this.getDrawingBufferSize=function(b){return b.set(vt*pt,At*pt).floor()},this.setDrawingBufferSize=function(b,D,H){vt=b,At=D,pt=H,n.width=Math.floor(b*H),n.height=Math.floor(D*H),this.setViewport(0,0,b,D)},this.setEffects=function(b){if(T===qn){Ot("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let D=0;D<b.length;D++)if(b[D].isOutputPass===!0){Dt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}N.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(tt)},this.getViewport=function(b){return b.copy(Tt)},this.setViewport=function(b,D,H,I){b.isVector4?Tt.set(b.x,b.y,b.z,b.w):Tt.set(b,D,H,I),ft.viewport(tt.copy(Tt).multiplyScalar(qe()).round())},this.getScissor=function(b){return b.copy(ie)},this.setScissor=function(b,D,H,I){b.isVector4?ie.set(b.x,b.y,b.z,b.w):ie.set(b,D,H,I),ft.scissor(yt.copy(ie).multiplyScalar(qe()).round())},this.getScissorTest=function(){return se},this.setScissorTest=function(b){ft.setScissorTest(se=b)},this.setOpaqueSort=function(b){Nt=b},this.setTransparentSort=function(b){Me=b},this.getClearColor=function(b){return b.copy(C.getClearColor())},this.setClearColor=function(){C.setClearColor(...arguments)},this.getClearAlpha=function(){return C.getClearAlpha()},this.setClearAlpha=function(){C.setClearAlpha(...arguments)},this.clear=function(b=!0,D=!0,H=!0){let I=0;if(b){let B=!1;if(nt!==null){let ht=nt.texture.format;B=_.has(ht)}if(B){let ht=nt.texture.type,xt=h.has(ht),ut=C.getClearColor(),_t=C.getClearAlpha(),bt=ut.r,Bt=ut.g,Yt=ut.b;xt?(m[0]=bt,m[1]=Bt,m[2]=Yt,m[3]=_t,U.clearBufferuiv(U.COLOR,0,m)):(y[0]=bt,y[1]=Bt,y[2]=Yt,y[3]=_t,U.clearBufferiv(U.COLOR,0,y))}else I|=U.COLOR_BUFFER_BIT}D&&(I|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),H&&(I|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I!==0&&U.clear(I)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),F=b},this.dispose=function(){n.removeEventListener("webglcontextlost",Rt,!1),n.removeEventListener("webglcontextrestored",Ht,!1),n.removeEventListener("webglcontextcreationerror",mt,!1),C.dispose(),it.dispose(),Y.dispose(),Ut.dispose(),wt.dispose(),w.dispose(),et.dispose(),P.dispose(),ot.dispose(),Et.dispose(),Q.dispose(),st.dispose(),st.removeEventListener("sessionstart",Lg),st.removeEventListener("sessionend",Ng),la.stop()};function Rt(b){b.preventDefault(),rg("WebGLRenderer: Context Lost."),O=!0}function Ht(){rg("WebGLRenderer: Context Restored."),O=!1;let b=Ue.autoReset,D=lt.enabled,H=lt.autoUpdate,I=lt.needsUpdate,B=lt.type;Gt(),Ue.autoReset=b,lt.enabled=D,lt.autoUpdate=H,lt.needsUpdate=I,lt.type=B}function mt(b){Ot("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function le(b){let D=b.target;D.removeEventListener("dispose",le),Ye(D)}function Ye(b){Ss(b),wt.remove(b)}function Ss(b){let D=wt.get(b).programs;D!==void 0&&(D.forEach(function(H){Q.releaseProgram(H)}),b.isShaderMaterial&&Q.releaseShaderCache(b))}this.renderBufferDirect=function(b,D,H,I,B,ht){D===null&&(D=en);let xt=B.isMesh&&B.matrixWorld.determinantAffine()<0,ut=yM(b,D,H,I,B);ft.setMaterial(I,xt);let _t=H.index,bt=1;if(I.wireframe===!0){if(_t=P.getWireframeAttribute(H),_t===void 0)return;bt=2}let Bt=H.drawRange,Yt=H.attributes.position,St=Bt.start*bt,Zt=(Bt.start+Bt.count)*bt;ht!==null&&(St=Math.max(St,ht.start*bt),Zt=Math.min(Zt,(ht.start+ht.count)*bt)),_t!==null?(St=Math.max(St,0),Zt=Math.min(Zt,_t.count)):Yt!=null&&(St=Math.max(St,0),Zt=Math.min(Zt,Yt.count));let Ie=Zt-St;if(Ie<0||Ie===1/0)return;ot.setup(B,I,ut,H,_t);let ge,he=X;if(_t!==null&&(ge=S.get(_t),he=ct,he.setIndex(ge)),B.isMesh)I.wireframe===!0?(ft.setLineWidth(I.wireframeLinewidth*qe()),he.setMode(U.LINES)):he.setMode(U.TRIANGLES);else if(B.isLine){let on=I.linewidth;on===void 0&&(on=1),ft.setLineWidth(on*qe()),B.isLineSegments?he.setMode(U.LINES):B.isLineLoop?he.setMode(U.LINE_LOOP):he.setMode(U.LINE_STRIP)}else B.isPoints?he.setMode(U.POINTS):B.isSprite&&he.setMode(U.TRIANGLES);if(B.isBatchedMesh)if(oe.get("WEBGL_multi_draw"))he.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let on=B._multiDrawStarts,Mt=B._multiDrawCounts,vn=B._multiDrawCount,ae=_t?S.get(_t).bytesPerElement:1,ca=wt.get(I).currentProgram.getUniforms();for(let ln=0;ln<vn;ln++)ca.setValue(U,"_gl_DrawID",ln),he.render(on[ln]/ae,Mt[ln])}else if(B.isInstancedMesh)he.renderInstances(St,Ie,B.count);else if(H.isInstancedBufferGeometry){let on=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,Mt=Math.min(H.instanceCount,on);he.renderInstances(St,Ie,Mt)}else he.render(St,Ie)};function Dg(b,D,H,I){F!==null&&b.isNodeMaterial&&F.setObject(I,b),Ct===!0&&K.setState(b,H,!1),b.transparent===!0&&b.side===Hi&&b.forceSinglePass===!1?(b.side=wn,b.needsUpdate=!0,co(b,D,I),b.side=zi,b.needsUpdate=!0,co(b,D,I),b.side=Hi):co(b,D,I)}this.compile=function(b,D,H=null){H===null&&(H=b),F!==null&&F.renderStart(b,D,H),A=Y.get(H),A.init(D),M.push(A),H.traverseVisible(function(B){B.isLight&&B.layers.test(D.layers)&&(A.pushLight(B),B.castShadow&&A.pushShadow(B))}),b!==H&&b.traverseVisible(function(B){B.isLight&&B.layers.test(D.layers)&&(A.pushLight(B),B.castShadow&&A.pushShadow(B))}),A.setupLights(),F!==null&&F.updateLights(A.state.lightsArray),Xt=this.localClippingEnabled,Ct=K.init(this.clippingPlanes,Xt),Ct===!0&&K.setGlobalState(this.clippingPlanes,D),F!==null&&lt.render(A.state.shadowsArray,H,D);let I=new Set;return b.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let ht=B.material;if(ht)if(Array.isArray(ht))for(let xt=0;xt<ht.length;xt++){let ut=ht[xt];Dg(ut,H,D,B),I.add(ut)}else Dg(ht,H,D,B),I.add(ht)}),A=M.pop(),F!==null&&F.renderEnd(),I},this.compileAsync=function(b,D,H=null){let I=this.compile(b,D,H);return new Promise(B=>{function ht(){if(I.forEach(function(xt){let _t=wt.get(xt).currentProgram;(_t===void 0||_t.isReady())&&I.delete(xt)}),I.size===0){B(b);return}setTimeout(ht,10)}oe.get("KHR_parallel_shader_compile")!==null?ht():setTimeout(ht,10)})};let Cf=null;function _M(b){Cf&&Cf(b)}function Lg(){la.stop()}function Ng(){la.start()}let la=new JS;la.setAnimationLoop(_M),typeof self<"u"&&la.setContext(self),this.setAnimationLoop=function(b){Cf=b,st.setAnimationLoop(b),b===null?la.stop():la.start()},st.addEventListener("sessionstart",Lg),st.addEventListener("sessionend",Ng),this.render=function(b,D){if(D!==void 0&&D.isCamera!==!0){Ot("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(O===!0)return;F!==null&&F.renderStart(b,D);let H=st.enabled===!0&&st.isPresenting===!0,I=N!==null&&(nt===null||H)&&N.begin(R,nt);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),st.enabled===!0&&st.isPresenting===!0&&(N===null||N.isCompositing()===!1)&&(st.cameraAutoUpdate===!0&&st.updateCamera(D),D=st.getCamera()),b.isScene===!0&&b.onBeforeRender(R,b,D,nt),A=Y.get(b,M.length),A.init(D),A.state.textureUnits=Ut.getTextureUnits(),M.push(A),It.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),D.isArrayCamera?Pe.setFromArrayCamera(D):zt.setFromProjectionMatrix(It,oi,D.reversedDepth),Xt=this.localClippingEnabled,Ct=K.init(this.clippingPlanes,Xt),E=it.get(b,g.length),E.init(),g.push(E),this.info.render.frame++,st.enabled===!0&&st.isPresenting===!0){let xt=R.xr.getDepthSensingMesh();xt!==null&&Df(xt,D,-1/0,R.sortObjects)}Df(b,D,0,R.sortObjects),E.finish(),F!==null&&F.updateLights(A.state.lightsArray),R.sortObjects===!0&&E.sort(Nt,Me),gn=st.enabled===!1||st.isPresenting===!1||st.hasDepthSensing()===!1,gn&&C.addToRenderList(E,b),this.info.autoReset===!0&&this.info.reset(),Ct===!0&&K.beginShadows();let B=A.state.shadowsArray;if(lt.render(B,b,D),Ct===!0&&K.endShadows(),(I&&N.hasRenderPass())===!1){let xt=E.opaque,ut=E.transmissive;if(A.setupLights(),D.isArrayCamera){let _t=D.cameras;if(ut.length>0)for(let bt=0,Bt=_t.length;bt<Bt;bt++){let Yt=_t[bt];Og(xt,ut,b,Yt)}gn&&C.render(b);for(let bt=0,Bt=_t.length;bt<Bt;bt++){let Yt=_t[bt];Ug(E,b,Yt,Yt.viewport)}}else ut.length>0&&Og(xt,ut,b,D),gn&&C.render(b),Ug(E,b,D)}nt!==null&&G===0&&(Ut.updateMultisampleRenderTarget(nt),Ut.updateRenderTargetMipmap(nt)),I&&N.end(R),b.isScene===!0&&b.onAfterRender(R,b,D),ot.resetDefaultState(),V=-1,j=null,M.pop(),M.length>0?(A=M[M.length-1],Ut.setTextureUnits(A.state.textureUnits),Ct===!0&&K.setGlobalState(R.clippingPlanes,A.state.camera)):A=null,g.pop(),g.length>0?E=g[g.length-1]:E=null,F!==null&&F.renderEnd()};function Df(b,D,H,I){if(b.visible===!1)return;if(b.layers.test(D.layers)){if(b.isGroup)H=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(D);else if(b.isLight)A.pushLight(b),b.castShadow&&A.pushShadow(b);else if(b.isSprite){let xt=D.isArrayCamera?Pe:zt;if(!b.frustumCulled||b.intersectsFrustum(xt)){I&&pe.setFromMatrixPosition(b.matrixWorld).applyMatrix4(It);let ut=et.update(b),_t=b.material;_t.visible&&E.push(b,ut,_t,H,pe.z,null,D)}}else if(b.isMesh||b.isLine||b.isPoints){let xt=D.isArrayCamera?Pe:zt;if(!b.frustumCulled||b.intersectsFrustum(xt)){let ut=et.update(b),_t=b.material;if(I&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),pe.copy(b.boundingSphere.center)):(ut.boundingSphere===null&&ut.computeBoundingSphere(),pe.copy(ut.boundingSphere.center)),pe.applyMatrix4(b.matrixWorld).applyMatrix4(It)),Array.isArray(_t)){let bt=ut.groups;for(let Bt=0,Yt=bt.length;Bt<Yt;Bt++){let St=bt[Bt],Zt=_t[St.materialIndex];Zt&&Zt.visible&&E.push(b,ut,Zt,H,pe.z,St,D)}}else _t.visible&&E.push(b,ut,_t,H,pe.z,null,D)}}}let ht=b.children;for(let xt=0,ut=ht.length;xt<ut;xt++)Df(ht[xt],D,H,I)}function Ug(b,D,H,I){let{opaque:B,transmissive:ht,transparent:xt}=b;A.setupLightsView(H),Ct===!0&&K.setGlobalState(R.clippingPlanes,H),I&&ft.viewport(tt.copy(I)),B.length>0&&nc(B,D,H),ht.length>0&&nc(ht,D,H),xt.length>0&&nc(xt,D,H),ft.buffers.depth.setTest(!0),ft.buffers.depth.setMask(!0),ft.buffers.color.setMask(!0),ft.setPolygonOffset(!1)}function Og(b,D,H,I){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[I.id]===void 0){let St=oe.has("EXT_color_buffer_half_float")||oe.has("EXT_color_buffer_float");A.state.transmissionRenderTarget[I.id]=new Vn(1,1,{generateMipmaps:!0,type:St?Ti:qn,minFilter:vs,samples:Math.max(4,me.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Kt.workingColorSpace})}let ht=A.state.transmissionRenderTarget[I.id],xt=I.viewport||tt;ht.setSize(xt.z*R.transmissionResolutionScale,xt.w*R.transmissionResolutionScale);let ut=R.getRenderTarget(),_t=R.getActiveCubeFace(),bt=R.getActiveMipmapLevel();R.setRenderTarget(ht),R.getClearColor(k),dt=R.getClearAlpha(),dt<1&&R.setClearColor(16777215,.5),R.clear(),gn&&C.render(H);let Bt=R.toneMapping;R.toneMapping=Gi;let Yt=I.viewport;if(I.viewport!==void 0&&(I.viewport=void 0),A.setupLightsView(I),Ct===!0&&K.setGlobalState(R.clippingPlanes,I),nc(b,H,I),Ut.updateMultisampleRenderTarget(ht),Ut.updateRenderTargetMipmap(ht),oe.has("WEBGL_multisampled_render_to_texture")===!1){let St=!1;for(let Zt=0,Ie=D.length;Zt<Ie;Zt++){let ge=D[Zt],{object:he,geometry:on,material:Mt,group:vn}=ge;if(Mt.side===Hi&&he.layers.test(I.layers)){let ae=Mt.side;Mt.side=wn,Mt.needsUpdate=!0,Pg(he,H,I,on,Mt,vn),Mt.side=ae,Mt.needsUpdate=!0,St=!0}}St===!0&&(Ut.updateMultisampleRenderTarget(ht),Ut.updateRenderTargetMipmap(ht))}R.setRenderTarget(ut,_t,bt),R.setClearColor(k,dt),Yt!==void 0&&(I.viewport=Yt),R.toneMapping=Bt}function nc(b,D,H){let I=D.isScene===!0?D.overrideMaterial:null;for(let B=0,ht=b.length;B<ht;B++){let xt=b[B],{object:ut,geometry:_t,group:bt}=xt,Bt=xt.material;Bt.allowOverride===!0&&I!==null&&(Bt=I),ut.layers.test(H.layers)&&Pg(ut,D,H,_t,Bt,bt)}}function Pg(b,D,H,I,B,ht){F!==null&&B.isNodeMaterial&&F.setObject(b,B),b.onBeforeRender(R,D,H,I,B,ht),b.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),B.onBeforeRender(R,D,H,I,b,ht),B.transparent===!0&&B.side===Hi&&B.forceSinglePass===!1?(B.side=wn,B.needsUpdate=!0,R.renderBufferDirect(H,D,I,B,b,ht),B.side=zi,B.needsUpdate=!0,R.renderBufferDirect(H,D,I,B,b,ht),B.side=Hi):R.renderBufferDirect(H,D,I,B,b,ht),b.onAfterRender(R,D,H,I,B,ht)}function Ig(b){let D=0;for(let H of b)H.texture!==null&&D++;return D}function co(b,D,H){D.isScene!==!0&&(D=en);let I=wt.get(b),B=A.state.lights,ht=A.state.shadowsArray,xt=B.state.version,ut=Q.getParameters(b,B.state,ht,D,H,A.state.lightProbeGridArray),_t=Q.getProgramCacheKey(ut),bt=I.programs;I.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?D.environment:null,I.fog=D.fog;let Bt=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;I.envMap=w.get(b.envMap||I.environment,Bt),I.envMapRotation=I.environment!==null&&b.envMap===null?D.environmentRotation:b.envMapRotation,bt===void 0&&(b.addEventListener("dispose",le),bt=new Map,I.programs=bt,I.programVariants=new Map);let Yt=bt.get(_t);if(Yt!==void 0){if(I.currentProgram===Yt&&I.lightsStateVersion===xt)return Fg(b,ut),Yt}else ut.uniforms=Q.getUniforms(b),F!==null&&b.isNodeMaterial&&F.build(b,H,ut),b.onBeforeCompile(ut,R),Yt=Q.acquireProgram(ut,_t),bt.set(_t,Yt),I.uniforms=ut.uniforms;let St=I.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(St.clippingPlanes=K.uniform),Fg(b,ut),I.needsLights=SM(b),I.lightsStateVersion=xt,I.needsLights&&(St.ambientLightColor.value=B.state.ambient,St.lightProbe.value=B.state.probe,St.sunLights.value=B.state.sun,St.sunLightShadows.value=B.state.sunShadow,St.directionalLights.value=B.state.directional,St.directionalLightShadows.value=B.state.directionalShadow,St.spotLights.value=B.state.spot,St.spotLightShadows.value=B.state.spotShadow,St.rectAreaLights.value=B.state.rectArea,St.ltc_1.value=B.state.rectAreaLTC1,St.ltc_2.value=B.state.rectAreaLTC2,St.pointLights.value=B.state.point,St.pointLightShadows.value=B.state.pointShadow,St.hemisphereLights.value=B.state.hemi,St.sunShadowMatrix.value=B.state.sunShadowMatrix,St.sunShadowCascade.value=B.state.sunShadowCascade,St.directionalShadowMatrix.value=B.state.directionalShadowMatrix,St.spotLightMatrix.value=B.state.spotLightMatrix,St.spotLightMap.value=B.state.spotLightMap,St.pointShadowMatrix.value=B.state.pointShadowMatrix),I.numLightProbeGrids=Ig(A.state.lightProbeGridArray),I.currentProgram=Yt,I.uniformsList=null,Yt}function vM(b,D,H,I,B){let ht=wt.get(b),xt=ht.currentProgram.id+","+I+","+B,ut=ht.programVariants.get(xt);return ut===void 0?(ut=co(b,D,H),ht.programVariants.set(xt,ut)):(ht.currentProgram=ut,ht.uniformsList=null,ht.outputColorSpace=I,ht.toneMapping=B),ut}function Bg(b){if(b.uniformsList===null){let D=b.currentProgram.getUniforms();b.uniformsList=oo.seqWithValue(D.seq,b.uniforms)}return b.uniformsList}function Fg(b,D){let H=wt.get(b);H.outputColorSpace=D.outputColorSpace,H.batching=D.batching,H.batchingColor=D.batchingColor,H.instancing=D.instancing,H.instancingColor=D.instancingColor,H.instancingMorph=D.instancingMorph,H.skinning=D.skinning,H.morphTargets=D.morphTargets,H.morphNormals=D.morphNormals,H.morphColors=D.morphColors,H.morphTargetsCount=D.morphTargetsCount,H.numClippingPlanes=D.numClippingPlanes,H.numIntersection=D.numClipIntersection,H.vertexAlphas=D.vertexAlphas,H.vertexTangents=D.vertexTangents,H.toneMapping=D.toneMapping}function yM(b,D,H,I,B){D.isScene!==!0&&(D=en),Ut.resetTextureUnits();let ht=D.fog,xt=I.isMeshStandardMaterial||I.isMeshLambertMaterial||I.isMeshPhongMaterial?D.environment:null,ut=nt===null?R.outputColorSpace:nt.isXRRenderTarget===!0?nt.texture.colorSpace:Kt.workingColorSpace,_t=I.isMeshStandardMaterial||I.isMeshLambertMaterial&&!I.envMap||I.isMeshPhongMaterial&&!I.envMap,bt=w.get(I.envMap||xt,_t),Bt=I.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Yt=!!H.attributes.tangent&&(!!I.normalMap||I.anisotropy>0),St=!!H.morphAttributes.position,Zt=!!H.morphAttributes.normal,Ie=!!H.morphAttributes.color,ge=Gi;I.toneMapped&&(nt===null||nt.isXRRenderTarget===!0)&&(ge=R.toneMapping);let he=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,on=he!==void 0?he.length:0,Mt=wt.get(I),vn=A.state.lights;if(Ct===!0&&(Xt===!0||b!==j)){let Ee=b===j&&I.id===V;K.setState(I,b,Ee)}let ae=!1,ca=!1;I.version===Mt.__version?Mt.needsLights&&Mt.lightsStateVersion!==vn.state.version||B.isBatchedMesh&&Mt.batching===!1||!B.isBatchedMesh&&Mt.batching===!0||B.isBatchedMesh&&Mt.batchingColor===!0&&B._colorsTexture===null||B.isBatchedMesh&&Mt.batchingColor===!1&&B._colorsTexture!==null||B.isInstancedMesh&&Mt.instancing===!1||!B.isInstancedMesh&&Mt.instancing===!0||B.isSkinnedMesh&&Mt.skinning===!1||!B.isSkinnedMesh&&Mt.skinning===!0||B.isInstancedMesh&&Mt.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Mt.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&Mt.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&Mt.instancingMorph===!1&&B.morphTexture!==null||Mt.envMap!==bt||I.fog===!0&&Mt.fog!==ht||Mt.numClippingPlanes!==void 0&&(Mt.numClippingPlanes!==K.numPlanes||Mt.numIntersection!==K.numIntersection)||Mt.vertexAlphas!==Bt||Mt.vertexTangents!==Yt||Mt.morphTargets!==St||Mt.morphNormals!==Zt||Mt.morphColors!==Ie||Mt.morphTargetsCount!==on||Mt.numLightProbeGrids!==Ig(A.state.lightProbeGridArray)?ae=!0:(Mt.outputColorSpace!==ut||Mt.toneMapping!==ge)&&(ca=!0):(ae=!0,Mt.__version=I.version);let ln=Mt.currentProgram;(ae===!0||ca===!0)&&(ln=ca===!0?vM(I,D,B,ut,ge):co(I,D,B),F&&I.isNodeMaterial&&F.onUpdateProgram(I,ln,Mt));let ic=!1,Ms=!1,ua=!1,ee=ln.getUniforms(),nn=Mt.uniforms;if(ft.useProgram(ln.program)&&(ic=!0,Ms=!0,ua=!0),I.id!==V&&(V=I.id,Ms=!0),ic||j!==b){ft.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),ee.setValue(U,"projectionMatrix",b.projectionMatrix),ee.setValue(U,"viewMatrix",b.matrixWorldInverse);let Ze=ee.map.cameraPosition;Ze!==void 0&&Ze.setValue(U,be.setFromMatrixPosition(b.matrixWorld)),me.logarithmicDepthBuffer&&ee.setValue(U,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(I.isMeshPhongMaterial||I.isMeshToonMaterial||I.isMeshLambertMaterial||I.isMeshBasicMaterial||I.isMeshStandardMaterial||I.isShaderMaterial)&&ee.setValue(U,"isOrthographic",b.isOrthographicCamera===!0),j!==b&&(j=b,Ms=!0,ua=!0)}if(Mt.needsLights&&(vn.state.sunShadowMap.length>0&&ee.setValue(U,"sunShadowMap",vn.state.sunShadowMap,Ut),vn.state.directionalShadowMap.length>0&&ee.setValue(U,"directionalShadowMap",vn.state.directionalShadowMap,Ut),vn.state.spotShadowMap.length>0&&ee.setValue(U,"spotShadowMap",vn.state.spotShadowMap,Ut),vn.state.pointShadowMap.length>0&&ee.setValue(U,"pointShadowMap",vn.state.pointShadowMap,Ut)),B.isSkinnedMesh){ee.setOptional(U,B,"bindMatrix"),ee.setOptional(U,B,"bindMatrixInverse");let Ee=B.skeleton;Ee&&(Ee.boneTexture===null&&Ee.computeBoneTexture(),ee.setValue(U,"boneTexture",Ee.boneTexture,Ut))}B.isBatchedMesh&&(ee.setOptional(U,B,"batchingTexture"),ee.setValue(U,"batchingTexture",B._matricesTexture,Ut),ee.setOptional(U,B,"batchingIdTexture"),ee.setValue(U,"batchingIdTexture",B._indirectTexture,Ut),ee.setOptional(U,B,"batchingColorTexture"),B._colorsTexture!==null&&ee.setValue(U,"batchingColorTexture",B._colorsTexture,Ut));let hi=H.morphAttributes;if((hi.position!==void 0||hi.normal!==void 0||hi.color!==void 0)&&J.update(B,H,ln),(Ms||Mt.receiveShadow!==B.receiveShadow)&&(Mt.receiveShadow=B.receiveShadow,ee.setValue(U,"receiveShadow",B.receiveShadow)),(I.isMeshStandardMaterial||I.isMeshLambertMaterial||I.isMeshPhongMaterial)&&I.envMap===null&&D.environment!==null&&(nn.envMapIntensity.value=D.environmentIntensity),nn.dfgLUT!==void 0&&(nn.dfgLUT.value=jC()),Ms){if(ee.setValue(U,"toneMappingExposure",R.toneMappingExposure),Mt.needsLights&&xM(nn,ua),ht&&I.fog===!0&&rt.refreshFogUniforms(nn,ht),rt.refreshMaterialUniforms(nn,I,pt,At,A.state.transmissionRenderTarget[b.id]),Mt.needsLights&&Mt.numLightProbeGrids>0){let Ee=x,Ze=0;for(let Wi of A.state.lightProbeGridArray)Wi.texture!==null&&(Ee.textures[Ze]=Wi.texture,Ee.min[Ze]=Wi.boundingBox.min,Ee.max[Ze]=Wi.boundingBox.max,Ee.resolution[Ze]=Wi.resolution,Ze++);for(let Wi in Ee)Ee[Wi].length=Ze;nn.probesSH.value=Ee.textures,nn.probesMin.value=Ee.min,nn.probesMax.value=Ee.max,nn.probesResolution.value=Ee.resolution}oo.upload(U,Bg(Mt),nn,Ut)}if(I.isShaderMaterial&&I.uniformsNeedUpdate===!0&&(oo.upload(U,Bg(Mt),nn,Ut),I.uniformsNeedUpdate=!1),I.isSpriteMaterial&&ee.setValue(U,"center",B.center),ee.setValue(U,"modelViewMatrix",B.modelViewMatrix),ee.setValue(U,"normalMatrix",B.normalMatrix),ee.setValue(U,"modelMatrix",B.matrixWorld),I.uniformsGroups!==void 0){let Ee=I.uniformsGroups;for(let Ze=0,Wi=Ee.length;Ze<Wi;Ze++){let Hg=Ee[Ze];Et.update(Hg,ln),Et.bind(Hg,ln)}}return ln}function xM(b,D){b.ambientLightColor.needsUpdate=D,b.lightProbe.needsUpdate=D,b.sunLights.needsUpdate=D,b.sunLightShadows.needsUpdate=D,b.directionalLights.needsUpdate=D,b.directionalLightShadows.needsUpdate=D,b.pointLights.needsUpdate=D,b.pointLightShadows.needsUpdate=D,b.spotLights.needsUpdate=D,b.spotLightShadows.needsUpdate=D,b.rectAreaLights.needsUpdate=D,b.hemisphereLights.needsUpdate=D}function SM(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return Z},this.getActiveMipmapLevel=function(){return G},this.getRenderTarget=function(){return nt},this.setRenderTargetTextures=function(b,D,H){let I=wt.get(b);I.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,I.__autoAllocateDepthBuffer===!1&&(I.__useRenderToTexture=!1),wt.get(b.texture).__webglTexture=D,wt.get(b.depthTexture).__webglTexture=I.__autoAllocateDepthBuffer?void 0:H,I.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,D){let H=wt.get(b);H.__webglFramebuffer=D,H.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(b,D=0,H=0){nt=b,Z=D,G=H;let I=null,B=!1,ht=!1;if(b){let ut=wt.get(b);if(ut.__useDefaultFramebuffer!==void 0){ft.bindFramebuffer(U.FRAMEBUFFER,ut.__webglFramebuffer),tt.copy(b.viewport),yt.copy(b.scissor),Lt=b.scissorTest,ft.viewport(tt),ft.scissor(yt),ft.setScissorTest(Lt),V=-1;return}else if(ut.__webglFramebuffer===void 0)Ut.setupRenderTarget(b);else if(ut.__hasExternalTextures)Ut.rebindTextures(b,wt.get(b.texture).__webglTexture,wt.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let Bt=b.depthTexture;if(ut.__boundDepthTexture!==Bt){if(Bt!==null&&wt.has(Bt)&&(b.width!==Bt.image.width||b.height!==Bt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Ut.setupDepthRenderbuffer(b)}}let _t=b.texture;(_t.isData3DTexture||_t.isDataArrayTexture||_t.isCompressedArrayTexture)&&(ht=!0);let bt=wt.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(bt[D])?I=bt[D][H]:I=bt[D],B=!0):b.samples>0&&Ut.useMultisampledRTT(b)===!1?I=wt.get(b).__webglMultisampledFramebuffer:Array.isArray(bt)?I=bt[H]:I=bt,tt.copy(b.viewport),yt.copy(b.scissor),Lt=b.scissorTest}else tt.copy(Tt).multiplyScalar(pt).floor(),yt.copy(ie).multiplyScalar(pt).floor(),Lt=se;if(H!==0&&(I=q),ft.bindFramebuffer(U.FRAMEBUFFER,I)&&ft.drawBuffers(b,I),ft.viewport(tt),ft.scissor(yt),ft.setScissorTest(Lt),B){let ut=wt.get(b.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+D,ut.__webglTexture,H)}else if(ht){let ut=D;for(let _t=0;_t<b.textures.length;_t++){let bt=wt.get(b.textures[_t]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+_t,bt.__webglTexture,H,ut)}}else if(b!==null&&H!==0){let ut=wt.get(b.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,ut.__webglTexture,H)}V=-1};function zg(b){let D=wt.get(b);return(D.__readFormat!==b.format||D.__readType!==b.type)&&(D.__readFormat=b.format,D.__readType=b.type,D.__formatReadable=me.textureFormatReadable(b.format),D.__typeReadable=me.textureTypeReadable(b.type)),D}this.readRenderTargetPixels=function(b,D,H,I,B,ht,xt,ut=0){if(!(b&&b.isWebGLRenderTarget)){Ot("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let _t=wt.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&xt!==void 0&&(_t=_t[xt],Array.isArray(_t)&&(_t=_t[0])),_t){ft.bindFramebuffer(U.FRAMEBUFFER,_t);try{let bt=b.textures[ut],Bt=bt.format,Yt=bt.type;b.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ut);let St=zg(bt);if(St.__formatReadable===!1){Ot("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(St.__typeReadable===!1){Ot("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=b.width-I&&H>=0&&H<=b.height-B&&U.readPixels(D,H,I,B,at.convert(Bt),at.convert(Yt),ht)}finally{let bt=nt!==null?wt.get(nt).__webglFramebuffer:null;ft.bindFramebuffer(U.FRAMEBUFFER,bt)}}},this.readRenderTargetPixelsAsync=async function(b,D,H,I,B,ht,xt,ut=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let _t=wt.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&xt!==void 0&&(_t=_t[xt],Array.isArray(_t)&&(_t=_t[0])),_t)if(D>=0&&D<=b.width-I&&H>=0&&H<=b.height-B){ft.bindFramebuffer(U.FRAMEBUFFER,_t);let bt=b.textures[ut],Bt=bt.format,Yt=bt.type;b.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ut);let St=zg(bt);if(St.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(St.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Zt=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Zt),U.bufferData(U.PIXEL_PACK_BUFFER,ht.byteLength,U.STREAM_READ),U.readPixels(D,H,I,B,at.convert(Bt),at.convert(Yt),0),U.bindBuffer(U.PIXEL_PACK_BUFFER,null);let Ie=nt!==null?wt.get(nt).__webglFramebuffer:null;ft.bindFramebuffer(U.FRAMEBUFFER,Ie);let ge=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await SS(U,ge,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Zt),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,ht),U.bindBuffer(U.PIXEL_PACK_BUFFER,null),U.deleteBuffer(Zt),U.deleteSync(ge),ht}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,D=null,H=0){let I=Math.pow(2,-H),B=Math.floor(b.image.width*I),ht=Math.floor(b.image.height*I),xt=D!==null?D.x:0,ut=D!==null?D.y:0;Ut.setTexture2D(b,0),U.copyTexSubImage2D(U.TEXTURE_2D,H,0,0,xt,ut,B,ht),ft.unbindTexture()},this.copyTextureToTexture=function(b,D,H=null,I=null,B=0,ht=0){let xt,ut,_t,bt,Bt,Yt,St,Zt,Ie,ge=b.isCompressedTexture?b.mipmaps[ht]:b.image;if(H!==null)xt=H.max.x-H.min.x,ut=H.max.y-H.min.y,_t=H.isBox3?H.max.z-H.min.z:1,bt=H.min.x,Bt=H.min.y,Yt=H.isBox3?H.min.z:0;else{let ee=Math.pow(2,-B);xt=Math.floor(ge.width*ee),ut=Math.floor(ge.height*ee),b.isDataArrayTexture?_t=ge.depth:b.isData3DTexture?_t=Math.floor(ge.depth*ee):_t=1,bt=0,Bt=0,Yt=0}I!==null?(St=I.x,Zt=I.y,Ie=I.z):(St=0,Zt=0,Ie=0);let he=at.convert(D.format),on=at.convert(D.type),Mt;D.isData3DTexture?(Ut.setTexture3D(D,0),Mt=U.TEXTURE_3D):D.isDataArrayTexture||D.isCompressedArrayTexture?(Ut.setTexture2DArray(D,0),Mt=U.TEXTURE_2D_ARRAY):(Ut.setTexture2D(D,0),Mt=U.TEXTURE_2D),ft.activeTexture(U.TEXTURE0),ft.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,D.flipY),ft.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),ft.pixelStorei(U.UNPACK_ALIGNMENT,D.unpackAlignment);let vn=ft.getParameter(U.UNPACK_ROW_LENGTH),ae=ft.getParameter(U.UNPACK_IMAGE_HEIGHT),ca=ft.getParameter(U.UNPACK_SKIP_PIXELS),ln=ft.getParameter(U.UNPACK_SKIP_ROWS),ic=ft.getParameter(U.UNPACK_SKIP_IMAGES);ft.pixelStorei(U.UNPACK_ROW_LENGTH,ge.width),ft.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ge.height),ft.pixelStorei(U.UNPACK_SKIP_PIXELS,bt),ft.pixelStorei(U.UNPACK_SKIP_ROWS,Bt),ft.pixelStorei(U.UNPACK_SKIP_IMAGES,Yt);let Ms=b.isDataArrayTexture||b.isData3DTexture,ua=D.isDataArrayTexture||D.isData3DTexture;if(b.isDepthTexture){let ee=wt.get(b),nn=wt.get(D),hi=wt.get(ee.__renderTarget),Ee=wt.get(nn.__renderTarget);ft.bindFramebuffer(U.READ_FRAMEBUFFER,hi.__webglFramebuffer),ft.bindFramebuffer(U.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer);for(let Ze=0;Ze<_t;Ze++)Ms&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,wt.get(b).__webglTexture,B,Yt+Ze),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,wt.get(D).__webglTexture,ht,Ie+Ze)),U.blitFramebuffer(bt,Bt,bt+xt,Bt+ut,St,Zt,St+xt,Zt+ut,U.DEPTH_BUFFER_BIT,U.NEAREST);ft.bindFramebuffer(U.READ_FRAMEBUFFER,null),ft.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(B!==0||b.isRenderTargetTexture||wt.has(b)){let ee=wt.get(b),nn=wt.get(D);ft.bindFramebuffer(U.READ_FRAMEBUFFER,L),ft.bindFramebuffer(U.DRAW_FRAMEBUFFER,W);for(let hi=0;hi<_t;hi++)Ms?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,ee.__webglTexture,B,Yt+hi):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,ee.__webglTexture,B),ua?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,nn.__webglTexture,ht,Ie+hi):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,nn.__webglTexture,ht),B!==0?U.blitFramebuffer(bt,Bt,bt+xt,Bt+ut,St,Zt,St+xt,Zt+ut,U.COLOR_BUFFER_BIT,U.NEAREST):ua?U.copyTexSubImage3D(Mt,ht,St,Zt,Ie+hi,bt,Bt,xt,ut):U.copyTexSubImage2D(Mt,ht,St,Zt,bt,Bt,xt,ut);ft.bindFramebuffer(U.READ_FRAMEBUFFER,null),ft.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else ua?b.isDataTexture||b.isData3DTexture?U.texSubImage3D(Mt,ht,St,Zt,Ie,xt,ut,_t,he,on,ge.data):D.isCompressedArrayTexture?U.compressedTexSubImage3D(Mt,ht,St,Zt,Ie,xt,ut,_t,he,ge.data):U.texSubImage3D(Mt,ht,St,Zt,Ie,xt,ut,_t,he,on,ge):b.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,ht,St,Zt,xt,ut,he,on,ge.data):b.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,ht,St,Zt,ge.width,ge.height,he,ge.data):U.texSubImage2D(U.TEXTURE_2D,ht,St,Zt,xt,ut,he,on,ge);ft.pixelStorei(U.UNPACK_ROW_LENGTH,vn),ft.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ae),ft.pixelStorei(U.UNPACK_SKIP_PIXELS,ca),ft.pixelStorei(U.UNPACK_SKIP_ROWS,ln),ft.pixelStorei(U.UNPACK_SKIP_IMAGES,ic),ht===0&&D.generateMipmaps===!0&&D.mipmapsAutoUpdate===!0&&U.generateMipmap(Mt),ft.unbindTexture()},this.initRenderTarget=function(b){wt.get(b).__webglFramebuffer===void 0&&Ut.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?Ut.setTextureCube(b,0):b.isData3DTexture?Ut.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?Ut.setTexture2DArray(b,0):Ut.setTexture2D(b,0),ft.unbindTexture()},this.resetState=function(){Z=0,G=0,nt=null,ft.reset(),ot.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return oi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let n=this.getContext();n.drawingBufferColorSpace=Kt._getDrawingBufferColorSpace(t),n.unpackColorSpace=Kt._getUnpackColorSpace()}}});var cM=fi(Rf=>{"use strict";var t3=Symbol.for("react.transitional.element"),e3=Symbol.for("react.fragment");function lM(e,t,n){var i=null;if(n!==void 0&&(i=""+n),t.key!==void 0&&(i=""+t.key),"key"in t){n={};for(var s in t)s!=="key"&&(n[s]=t[s])}else n=t;return t=n.ref,{$$typeof:t3,type:e,key:i,ref:t!==void 0?t:null,props:n}}Rf.Fragment=e3;Rf.jsx=lM;Rf.jsxs=lM});var ec=fi((jL,uM)=>{"use strict";uM.exports=cM()});var mn,dM,hM,fM,pM=Lf(()=>{mn=qa(uc());oM();dM=qa(ec()),hM=`
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

vec3 snoise3D(vec3 p) {
  return vec3(
    snoise(p),
    snoise(p + vec3(31.416, -47.853, 12.793)),
    snoise(p + vec3(-23.139, 64.217, -89.512))
  );
}

mat2 rot2D(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

// Unified 3D Volumetric Kaito Asai Fold Deformation
// Keeps the exact same 3D material & lighting that looks perfect in Idle, while gently evolving
// the 3D fold frequency, helical swirl, and a slow-breathing 3D toroidal center iris opening
// ("halka slowly faka hosse, finish hole again \u09AD\u09B0\u09C7 jasse") during active speech.
vec3 deformKaitoOrb(
  vec3 baseDir,
  float uTime,
  float uBass,
  float uMid,
  float uTreble,
  float uAudio,
  float uListenMorph,
  float uSpeakMorph,
  float uCenterOpen,
  out float outCreaseAO,
  out float outLobeHeight,
  out float outCenterIrisMask
) {
  vec3 n = normalize(baseDir);
  float t = uTime * 0.22;

  // Radial distance from the front-back Z axis in the XY plane (smooth C-infinity everywhere)
  float r2_xy = dot(n.xy, n.xy);
  float r_xy = sqrt(r2_xy + 0.0001);

  // Smooth whole-sphere helical twist of the 3D fold pattern during Listening & Speaking
  // Plus a gentle vortex swirl around the center iris as it slowly opens
  vec3 p = n;
  float irisSwirl = uCenterOpen * exp(-r2_xy * 4.5) * (0.85 + uAudio * 0.55);
  float helicalTwist = n.z * (uListenMorph * (0.55 + uAudio * 0.45) - uSpeakMorph * (0.65 + uBass * 0.50))
                     + irisSwirl;
  p.xy = rot2D(helicalTwist) * p.xy;

  // Domain warp vector creates sweeping 3D C-curve and S-curve fold trajectories
  float warpFreq = 0.85 + uListenMorph * 0.16 + uSpeakMorph * 0.24 + uMid * 0.18;
  vec3 warp = clamp(
    snoise3D(p * warpFreq + vec3(t * 0.62, -t * 0.52, t * 0.42)),
    vec3(-1.0),
    vec3(1.0)
  );

  // Primary & secondary zero-crossing fields
  float freq1 = 1.05 + uListenMorph * 0.22 + uSpeakMorph * 0.32;
  float freq2 = 1.65 + uListenMorph * 0.28 + uSpeakMorph * 0.45;
  float warpAmp = 0.40 + uBass * 0.16 + uListenMorph * 0.08 + uSpeakMorph * 0.12;

  float w1 = clamp(snoise(p * freq1 + warp * warpAmp + vec3(t * 0.55, -t * 0.48, 0.0)), -1.0, 1.0);
  float w2 = clamp(snoise(p * freq2 - warp * (0.28 + uMid * 0.10) + vec3(-t * 0.72, t * 0.60, t * 0.35)), -1.0, 1.0);

  // Smooth rounded 3D pillow lobes with soft crease valleys
  float sharpness1 = 2.45 + uBass * 0.65 + uSpeakMorph * 0.35 + uListenMorph * 0.25;
  float sharpness2 = 2.25 + uMid * 0.55 + uSpeakMorph * 0.30 + uListenMorph * 0.20;

  float ridge1 = 1.0 - exp(-sqrt(w1 * w1 + 0.0085) * sharpness1);
  float ridge2 = 1.0 - exp(-sqrt(w2 * w2 + 0.0110) * sharpness2);

  float combinedCrease = clamp(ridge1 * 0.70 + ridge2 * 0.30, 0.0, 1.0);
  outLobeHeight = combinedCrease;

  // Soft 3D ambient occlusion: identical to the Idle look (minimum 0.24 so folds look volumetric & 3D)
  outCreaseAO = mix(0.24, 1.0, smoothstep(0.0, 0.78, combinedCrease));

  // Voice-reactive 3D surface ripple along the rounded lobes when User or Agent speaks
  float voiceWave = clamp(snoise(p * 3.0 + vec3(0.0, 0.0, uTime * 1.8)), -1.0, 1.0)
                  * (uAudio * 0.042 + uTreble * 0.024);

  // Smooth 3D spherical relief (0.71 valley to ~1.02 lobe crest)
  float foldDepth = 0.28 + uBass * 0.065 + uAudio * 0.045 + (uListenMorph + uSpeakMorph) * 0.025;
  float baseRadius = 0.72 - (uBass * 0.025 + uAudio * 0.015);
  float r = clamp(baseRadius + combinedCrease * foldDepth + voiceWave, 0.64, 1.05);

  // Gentle tangential fold pinch pulls the two sides of a crease cleanly together
  float pinchStrength = 0.095 + uMid * 0.04 + (uListenMorph + uSpeakMorph) * 0.02;
  vec3 tangentPinch = cross(n, warp) * (1.0 - combinedCrease) * pinchStrength;

  vec3 pos = n * r + tangentPinch;

  // ============================================================================
  // SLOW 3D CENTER BLACK BINDU ("center ar oii color ta only black binduu koro")
  // Smoothly parts the inner core folds around a crisp, pure pitch-black center dot
  // while keeping the outer 360\xB0 perimeter 100% untouched!
  // ============================================================================
  float openStrength = uCenterOpen * (0.78 + uAudio * 0.22);

  // Subtle radial parting around the black bindu
  vec2 radialDir = n.xy / r_xy;
  float radialParting = openStrength * 0.16 * exp(-r2_xy * 8.5) * smoothstep(0.0, 0.12, r_xy);
  pos.xy += radialDir * radialParting;

  // Clean circular mask for the pure pitch-black center dot (bindu) on the front face
  float binduRadius = openStrength * 0.21;
  float frontDist = length(pos.xy);
  outCenterIrisMask = n.z > 0.0
    ? smoothstep(binduRadius * 0.72, binduRadius + 0.055, frontDist)
    : 1.0;

  return pos;
}
`,fM=({state:e,theme:t="dark",userAudioLevel:n=0,agentAudioLevel:i=0,micAnalyserNode:s,agentAnalyserNode:a,onClick:r})=>{let o=(0,mn.useRef)(null),l=(0,mn.useRef)(e),c=(0,mn.useRef)(t),f=(0,mn.useRef)(n),p=(0,mn.useRef)(i),u=(0,mn.useRef)(s||null),d=(0,mn.useRef)(a||null);return(0,mn.useEffect)(()=>{l.current=e},[e]),(0,mn.useEffect)(()=>{c.current=t},[t]),(0,mn.useEffect)(()=>{f.current=n},[n]),(0,mn.useEffect)(()=>{p.current=i},[i]),(0,mn.useEffect)(()=>{u.current=s||null},[s]),(0,mn.useEffect)(()=>{d.current=a||null},[a]),(0,mn.useEffect)(()=>{let v=o.current;if(!v)return;let T=(()=>{let Ct=document.createElement("canvas").getContext("webgl2");if(!Ct)return!0;let Xt=Ct.getExtension("WEBGL_debug_renderer_info"),It=Xt?Xt.UNMASKED_RENDERER_WEBGL:Ct.RENDERER,be=String(Ct.getParameter(It));return Ct.getExtension("WEBGL_lose_context")?.loseContext(),/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(be)})(),_=v.getBoundingClientRect(),h=Math.max(200,_.width||270),m=Math.max(200,_.height||270),y=new Ef({antialias:!T,alpha:!0,powerPreference:"high-performance"});y.outputColorSpace=bn;let x=T?1:Math.min(window.devicePixelRatio||1,2);y.setPixelRatio(x),y.setSize(h,m),y.setClearColor(0,0),v.appendChild(y.domElement);let E=new Dl,A=new Tn(30,h/m,.1,30);A.position.set(0,0,4.55);let g=new ps;E.add(g);let M={uTime:{value:12.5},uBass:{value:0},uMid:{value:0},uTreble:{value:0},uAudio:{value:0},uListenMorph:{value:0},uSpeakMorph:{value:0},uCenterOpen:{value:0},uIsLightTheme:{value:c.current==="light"?1:0},uPixelRatio:{value:x},uViewportHeight:{value:m},uBrightnessBoost:{value:1.12}},N=new Fl(1,T?5:6),R=new Wn({uniforms:M,side:zi,transparent:!1,depthWrite:!0,depthTest:!0,vertexShader:`
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uAudio;
        uniform float uListenMorph;
        uniform float uSpeakMorph;
        uniform float uCenterOpen;

        varying vec3 vBaseDir;
        varying vec3 vViewNormal;
        varying vec3 vSphereNormal;
        varying vec3 vViewPos;
        varying float vCreaseAO;
        varying float vLobeHeight;
        varying float vCenterIrisMask;

        ${hM}

        void main() {
          vBaseDir = normalize(position);

          float creaseAO;
          float lobeHeight;
          float centerIrisMask;
          vec3 displaced = deformKaitoOrb(
            vBaseDir, uTime, uBass, uMid, uTreble, uAudio, uListenMorph, uSpeakMorph, uCenterOpen, creaseAO, lobeHeight, centerIrisMask
          );

          float eps = 0.028;
          vec3 t1 = normalize(cross(vBaseDir, vec3(0.0, 1.0, 0.0)));
          if (length(t1) < 0.001) t1 = normalize(cross(vBaseDir, vec3(1.0, 0.0, 0.0)));
          vec3 t2 = normalize(cross(vBaseDir, t1));

          float c1, l1, m1, c2, l2, m2;
          vec3 p1 = deformKaitoOrb(
            normalize(vBaseDir + t1 * eps),
            uTime, uBass, uMid, uTreble, uAudio, uListenMorph, uSpeakMorph, uCenterOpen, c1, l1, m1
          );
          vec3 p2 = deformKaitoOrb(
            normalize(vBaseDir + t2 * eps),
            uTime, uBass, uMid, uTreble, uAudio, uListenMorph, uSpeakMorph, uCenterOpen, c2, l2, m2
          );
          vec3 rawCross = cross(p1 - displaced, p2 - displaced);
          vec3 microNormal = length(rawCross) > 0.00001 ? normalize(rawCross) : vBaseDir;

          // Blend macro sphere normal (34%) with micro fold normal (66%) for rich 3D volume
          vec3 blendedNormal = normalize(mix(microNormal, vBaseDir, 0.34));

          vViewNormal = normalize(normalMatrix * blendedNormal);
          vSphereNormal = normalize(normalMatrix * vBaseDir);
          vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
          vViewPos = -mvPosition.xyz;
          vCreaseAO = creaseAO;
          vLobeHeight = lobeHeight;
          vCenterIrisMask = centerIrisMask;

          gl_Position = projectionMatrix * mvPosition;
        }
      `,fragmentShader:`
        uniform float uTime;
        uniform float uAudio;
        uniform float uBrightnessBoost;
        uniform float uIsLightTheme;

        varying vec3 vBaseDir;
        varying vec3 vViewNormal;
        varying vec3 vSphereNormal;
        varying vec3 vViewPos;
        varying float vCreaseAO;
        varying float vLobeHeight;
        varying float vCenterIrisMask;

        vec3 hash33(vec3 p) {
          p = fract(p * vec3(443.897, 441.423, 437.195));
          p += dot(p, p.yzx + 19.19);
          return fract((p.xxz + p.yxx) * p.zyx);
        }

        vec2 stippleVoronoi3D(vec3 x) {
          vec3 p = floor(x);
          vec3 f = fract(x);
          float minDist = 8.0;
          float cellId = 0.0;
          for (int k = -1; k <= 1; k++) {
            for (int j = -1; j <= 1; j++) {
              for (int i = -1; i <= 1; i++) {
                vec3 b = vec3(float(i), float(j), float(k));
                vec3 h = hash33(p + b);
                vec3 r = b - f + (0.15 + 0.70 * h);
                float d = dot(r, r);
                if (d < minDist) {
                  minDist = d;
                  cellId = h.x;
                }
              }
            }
          }
          return vec2(sqrt(minDist), cellId);
        }

        void main() {
          vec2 cell = stippleVoronoi3D(vBaseDir * 82.0);
          float beadDist = cell.x;
          float beadRand = cell.y;

          vec3 N = normalize(vViewNormal);
          vec3 Ns = normalize(vSphereNormal);
          vec3 V = normalize(vViewPos);

          // 3D Studio Three-Point Wrap Lighting (Identical to the perfected Idle 3D look)
          vec3 keyLight = normalize(vec3(0.55, 0.48, 0.68));
          vec3 fillLight = normalize(vec3(-0.62, -0.25, 0.74));
          vec3 backRimLight = normalize(vec3(0.0, 0.65, -0.55));

          float wrapKey = pow(dot(N, keyLight) * 0.5 + 0.5, 1.45);
          float wrapFill = pow(dot(N, fillLight) * 0.5 + 0.5, 1.60);
          float macroSphereDome = pow(max(dot(Ns, normalize(vec3(0.25, 0.35, 0.90))), 0.0), 0.85);

          float NdotV = max(dot(N, V), 0.0);
          float fresnelRim = pow(1.0 - NdotV, 2.05);

          vec3 H1 = normalize(keyLight + V);
          vec3 H2 = normalize(fillLight + V);
          float specMain = pow(max(dot(N, H1), 0.0), 22.0);
          float specSoft = pow(max(dot(N, H2), 0.0), 10.0);
          float rimBounce = max(dot(N, backRimLight), 0.0) * 0.25;

          float surfaceLight = clamp((
            wrapKey * 0.58 +
            wrapFill * 0.34 +
            macroSphereDome * 0.26 +
            fresnelRim * 0.52 +
            specMain * 0.48 +
            specSoft * 0.22 +
            rimBounce
          ) * vCreaseAO * uBrightnessBoost, 0.0, 1.35);

          float beadRadius = 0.40 + clamp(surfaceLight * 0.14, 0.0, 0.15);
          float beadMask = 1.0 - smoothstep(beadRadius - 0.12, beadRadius + 0.05, beadDist);
          float beadDome = clamp(1.0 - (beadDist / max(beadRadius, 0.001)) * 0.55, 0.35, 1.0);

          float grainVariation = mix(0.72, 1.18, beadRand);
          float finalLum = clamp(surfaceLight * grainVariation * beadDome, 0.0, 1.0);

          // Dark Theme: Platinum-Silver to Pure Pearl-White
          vec3 darkValley = mix(vec3(0.035, 0.038, 0.046), vec3(0.14, 0.15, 0.18), vLobeHeight);
          vec3 darkShadow = vec3(0.16, 0.17, 0.20);
          vec3 darkMid = vec3(0.62, 0.65, 0.71);
          vec3 darkHighlight = vec3(0.99, 0.995, 1.0);

          // Light Theme: Sculpted Obsidian-Graphite to Brushed Titanium-Silver (stands out crisply on white/alabaster canvas)
          vec3 lightValley = mix(vec3(0.06, 0.065, 0.08), vec3(0.18, 0.19, 0.22), vLobeHeight);
          vec3 lightShadow = vec3(0.12, 0.13, 0.16);
          vec3 lightMid = vec3(0.46, 0.49, 0.55);
          vec3 lightHighlight = vec3(0.94, 0.95, 0.98);

          vec3 valleySubstrate = mix(darkValley, lightValley, uIsLightTheme);
          vec3 shadowSilver = mix(darkShadow, lightShadow, uIsLightTheme);
          vec3 midSilver = mix(darkMid, lightMid, uIsLightTheme);
          vec3 highlightPearl = mix(darkHighlight, lightHighlight, uIsLightTheme);

          vec3 shadedBead = mix(shadowSilver, midSilver, smoothstep(0.05, 0.52, finalLum));
          shadedBead = mix(shadedBead, highlightPearl, smoothstep(0.45, 0.95, finalLum));
          shadedBead += vec3(specMain * 0.32 * vLobeHeight);

          // Pure pitch-black bindu (vec3(0.0)) at the center when vCenterIrisMask -> 0.0
          vec3 orbSurfaceColor = clamp(mix(valleySubstrate, shadedBead, beadMask), 0.0, 1.0);
          vec3 finalColor = mix(vec3(0.0), orbSurfaceColor, vCenterIrisMask);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `}),O=new ci(N,R);g.add(O);let F=T?18e3:36e3,q=new Float32Array(F*3),L=new Float32Array(F),W=(1+Math.sqrt(5))/2;for(let Ct=0;Ct<F;Ct++){let Xt=(Ct+.5)/F,It=Math.acos(1-2*Xt),be=2*Math.PI*Ct/W;q[Ct*3]=Math.sin(It)*Math.cos(be),q[Ct*3+1]=Math.sin(It)*Math.sin(be),q[Ct*3+2]=Math.cos(It),L[Ct]=Math.random()}let Z=new li;Z.setAttribute("position",new Gn(q,3)),Z.setAttribute("aSeed",new Gn(L,1));let G=new Wn({uniforms:M,transparent:!0,depthWrite:!1,depthTest:!0,vertexShader:`
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uAudio;
        uniform float uListenMorph;
        uniform float uSpeakMorph;
        uniform float uCenterOpen;
        uniform float uPixelRatio;
        uniform float uViewportHeight;
        uniform float uBrightnessBoost;

        attribute float aSeed;

        varying float vLum;
        varying float vSpec;
        varying float vAlpha;

        ${hM}

        void main() {
          vec3 baseDir = normalize(position);

          float creaseAO;
          float lobeHeight;
          float centerIrisMask;
          vec3 displaced = deformKaitoOrb(
            baseDir, uTime, uBass, uMid, uTreble, uAudio, uListenMorph, uSpeakMorph, uCenterOpen, creaseAO, lobeHeight, centerIrisMask
          );

          float eps = 0.028;
          vec3 t1 = normalize(cross(baseDir, vec3(0.0, 1.0, 0.0)));
          if (length(t1) < 0.001) t1 = normalize(cross(baseDir, vec3(1.0, 0.0, 0.0)));
          vec3 t2 = normalize(cross(baseDir, t1));

          float c1, l1, m1, c2, l2, m2;
          vec3 p1 = deformKaitoOrb(
            normalize(baseDir + t1 * eps),
            uTime, uBass, uMid, uTreble, uAudio, uListenMorph, uSpeakMorph, uCenterOpen, c1, l1, m1
          );
          vec3 p2 = deformKaitoOrb(
            normalize(baseDir + t2 * eps),
            uTime, uBass, uMid, uTreble, uAudio, uListenMorph, uSpeakMorph, uCenterOpen, c2, l2, m2
          );
          vec3 rawCross = cross(p1 - displaced, p2 - displaced);
          vec3 microNormal = length(rawCross) > 0.00001 ? normalize(rawCross) : baseDir;
          vec3 surfNormal = normalize(mix(microNormal, baseDir, 0.34));

          vec3 finalPos = displaced + surfNormal * (0.007 + aSeed * 0.013);

          vec3 viewNormal = normalize(normalMatrix * surfNormal);
          vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
          vec3 viewDir = normalize(-mvPosition.xyz);

          vec3 keyLight = normalize(vec3(0.55, 0.48, 0.68));
          vec3 fillLight = normalize(vec3(-0.62, -0.25, 0.74));

          float wrapKey = pow(dot(viewNormal, keyLight) * 0.5 + 0.5, 1.45);
          float wrapFill = pow(dot(viewNormal, fillLight) * 0.5 + 0.5, 1.60);
          float NdotV = abs(dot(viewNormal, viewDir));
          float rim = pow(1.0 - NdotV, 2.0);

          vec3 H = normalize(keyLight + viewDir);
          float spec = pow(max(dot(viewNormal, H), 0.0), 20.0);

          float rawLum = (wrapKey * 0.60 + wrapFill * 0.36 + rim * 0.58 + spec * 0.45)
                       * creaseAO
                       * uBrightnessBoost;

          vLum = clamp(rawLum * (0.68 + 0.48 * aSeed), 0.14, 1.0);
          vSpec = spec * lobeHeight;
          vAlpha = clamp((0.36 + vLum * 0.62) * centerIrisMask, 0.0, 0.95);

          float ptSize = (uViewportHeight / 270.0) * (1.15 + aSeed * 0.70 + vLum * 0.42);
          gl_PointSize = clamp(ptSize * uPixelRatio * (4.3 / max(-mvPosition.z, 1.0)), 1.0, 3.1);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,fragmentShader:`
        uniform float uIsLightTheme;
        varying float vLum;
        varying float vSpec;
        varying float vAlpha;

        void main() {
          if (vAlpha < 0.01) discard;
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r2 = dot(cxy, cxy);
          if (r2 > 1.0) discard;

          float zSphere = sqrt(max(0.0, 1.0 - r2));
          float miniDome = 0.65 + 0.35 * zSphere;

          float mask = 1.0 - smoothstep(0.32, 1.0, r2);
          vec3 lowTone = mix(vec3(0.26, 0.28, 0.33), vec3(0.16, 0.18, 0.22), uIsLightTheme);
          vec3 highTone = mix(vec3(0.99, 0.995, 1.0), vec3(0.95, 0.96, 0.99), uIsLightTheme);
          vec3 baseSilver = mix(lowTone, highTone, smoothstep(0.10, 0.88, vLum * miniDome));
          vec3 col = clamp(baseSilver + vec3(vSpec * 0.35), 0.0, 1.0);

          gl_FragColor = vec4(col, vAlpha * mask);
        }
      `}),nt=new Ol(Z,G);g.add(nt);let V=new Uint8Array(64),j=new Vl,tt=0,yt=0,Lt=0,k=0,dt=0,vt=0,At=0,pt=c.current==="light"?1:0,Nt=.9,Me=1.12,Tt=0;function ie(Ct){let Xt=y.getContext(),It=Xt.fenceSync?Xt.fenceSync(Xt.SYNC_GPU_COMMANDS_COMPLETE,0):null;Xt.flush();let be=()=>{let pe=It&&Xt.getSyncParameter(It,Xt.SYNC_STATUS);It&&pe===Xt.UNSIGNALED?Tt=window.setTimeout(be,5):(It&&Xt.deleteSync(It),Tt=window.setTimeout(Ct,80))};Tt=window.setTimeout(be,5)}function se(){let Ct=Math.min(j.getDelta(),.05),Xt=0,It=0,be=0,pe=0,en=l.current,gn=en==="speaking"&&d.current?d.current:u.current||d.current;if(gn){gn.getByteFrequencyData(V);let et=0,Q=0,rt=0;for(let it=0;it<10;it++)et+=V[it];for(let it=10;it<28;it++)Q+=V[it];for(let it=28;it<52;it++)rt+=V[it];Xt=Math.min(1,et/10/255*1.85),It=Math.min(1,Q/18/255*2),be=Math.min(1,rt/24/255*2.2),pe=Math.min(1,Xt*.45+It*.35+be*.2)}let qe=Math.max(f.current,p.current);qe>pe&&(pe=qe,Xt=Math.max(Xt,qe*.9),It=Math.max(It,qe*.8),be=Math.max(be,qe*.6)),tt=ui.damp(tt,Xt,9,Ct),yt=ui.damp(yt,It,9,Ct),Lt=ui.damp(Lt,be,9,Ct),k=ui.damp(k,pe,8,Ct);let U=en==="speaking"||p.current>.03,_n=en==="thinking",oe=!U&&!_n&&(en==="listening"||f.current>.03),me=oe&&(f.current>.025||pe>.035),ft=oe?Math.min(1,.45+k*.65):0,Ue=U?Math.min(1,.55+k*.6):0,wt=U?Math.min(1,.68+k*.32):me?Math.min(1,.64+k*.36):oe?.22:0;dt=ui.damp(dt,ft,5.5,Ct),vt=ui.damp(vt,Ue,5.5,Ct);let Ut=wt>At?2.4:2;At=ui.damp(At,wt,Ut,Ct),pt=ui.damp(pt,c.current==="light"?1:0,8,Ct);let w=.72,S=.9,P=1.12;U?(w=1.28+k*1.35,S=.915+tt*.045,P=1.18+k*.22):_n?(w=1.55,S=.89+Math.sin(M.uTime.value*2.8)*.012,P=1.15+Math.sin(M.uTime.value*3.5)*.08):oe&&(w=1.05+k*1.15,S=.905+k*.035,P=1.15+k*.18),Nt=ui.damp(Nt,S,8,Ct),Me=ui.damp(Me,P,8,Ct),g.scale.setScalar(Nt),M.uTime.value+=Ct*w,M.uBass.value=tt,M.uMid.value=yt,M.uTreble.value=Lt,M.uAudio.value=k,M.uListenMorph.value=dt,M.uSpeakMorph.value=vt,M.uCenterOpen.value=At,M.uIsLightTheme.value=pt,M.uBrightnessBoost.value=Me,y.render(E,A),T?ie(se):Tt=requestAnimationFrame(se)}Tt=requestAnimationFrame(se);let zt=()=>{if(!v)return;let Ct=v.getBoundingClientRect(),Xt=Math.max(180,Math.floor(Ct.width)),It=Math.max(180,Math.floor(Ct.height));A.aspect=Xt/It,A.updateProjectionMatrix(),y.setSize(Xt,It),M.uViewportHeight.value=It};zt();let Pe=new ResizeObserver(zt);return Pe.observe(v),window.addEventListener("resize",zt),()=>{Pe.disconnect(),window.removeEventListener("resize",zt),cancelAnimationFrame(Tt),clearTimeout(Tt),N.dispose(),R.dispose(),Z.dispose(),G.dispose(),y.dispose(),y.domElement.parentNode===v&&v.removeChild(y.domElement)}},[]),(0,dM.jsx)("div",{ref:o,onClick:r,className:"relative w-[225px] h-[225px] sm:w-[270px] sm:h-[270px] aspect-square flex items-center justify-center cursor-pointer select-none mx-auto",title:"Click 3D Orb to toggle microphone"})}});var i3=fi(()=>{var mM=qa(mx());pM();var gM=qa(ec());function n3(e,t={}){let n={state:"idle",theme:"dark",userAudioLevel:0,agentAudioLevel:0,micAnalyserNode:null,agentAnalyserNode:null,onClick:void 0,...t},i=(0,mM.createRoot)(e);function s(){i.render((0,gM.jsx)(fM,{state:n.state,theme:n.theme,userAudioLevel:n.userAudioLevel,agentAudioLevel:n.agentAudioLevel,micAnalyserNode:n.micAnalyserNode,agentAnalyserNode:n.agentAnalyserNode,onClick:n.onClick}))}return s(),{setState(a){n.state!==a&&(n={...n,state:a},s())},setTheme(a){n.theme!==a&&(n={...n,theme:a},s())},setLevels(a,r){n={...n,userAudioLevel:a,agentAudioLevel:r},s()},setAnalysers(a,r){n={...n,micAnalyserNode:a,agentAnalyserNode:r},s()},setOnClick(a){n={...n,onClick:a||void 0},s()},unmount(){i.unmount()}}}window.AntigravityOrb={mount:n3}});i3();})();
/*! Bundled license information:

scheduler/cjs/scheduler.production.js:
  (**
   * @license React
   * scheduler.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.js:
  (**
   * @license React
   * react-dom.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom-client.production.js:
  (**
   * @license React
   * react-dom-client.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

three/build/three.core.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)

react/cjs/react-jsx-runtime.production.js:
  (**
   * @license React
   * react-jsx-runtime.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
