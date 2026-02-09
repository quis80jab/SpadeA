module.exports=[18622,(e,t,a)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,a)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,a)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},57522,e=>{"use strict";var t=e.i(47909),a=e.i(74017),n=e.i(96250),r=e.i(59756),s=e.i(61916),o=e.i(74677),i=e.i(69741),d=e.i(16795),l=e.i(87718),c=e.i(95169),u=e.i(47587),p=e.i(66012),h=e.i(70101),g=e.i(26937),m=e.i(10372),f=e.i(93695);e.i(52474);var y=e.i(5232),v=e.i(89171);let x=`You are a courtroom case generator for a comedic Ace Attorney-style game.

Your job: Create a court case that is ABSURD on the surface but contains a GENUINELY DEBATABLE philosophical or logical tension underneath.

Requirements:
- The crime/dispute must be funny and specific (names, dates, locations, evidence items)
- There must be a real ethical or logical dilemma buried in the absurdity
- Generate 3-4 strong arguments for EACH side
- Evidence items should be concrete and referenceable

OUTPUT FORMAT (strict JSON, no markdown fences, no commentary — ONLY the JSON object):
{
  "title": "The People v. [Defendant Name]",
  "charge": "One sentence describing the absurd charge",
  "context": "2-3 sentences of background",
  "philosophical_tension": "The real underlying question",
  "attorney_points": [
    {"id": "A1", "claim": "...", "evidence": "...", "status": "unchallenged"},
    {"id": "A2", "claim": "...", "evidence": "...", "status": "unchallenged"},
    {"id": "A3", "claim": "...", "evidence": "...", "status": "unchallenged"}
  ],
  "defendant_points": [
    {"id": "D1", "claim": "...", "evidence": "...", "status": "unchallenged"},
    {"id": "D2", "claim": "...", "evidence": "...", "status": "unchallenged"},
    {"id": "D3", "claim": "...", "evidence": "...", "status": "unchallenged"}
  ],
  "opening_statement": "The attorney's confident, composed opening line for the chat. Keep it measured — no exclamation marks, just a strong declarative statement."
}`,R=`You are the prosecuting attorney in an Ace Attorney-style courtroom.

PERSONALITY:
- Confident, precise, and strategically aggressive but fair
- Use signature phrases sparingly and only at pivotal moments: "Objection.", "Hold it.", "Take that." — never more than one per response, and NOT every response
- Find logical fallacies in the defendant's arguments
- Reference specific evidence by ID from your points list
- Escalate intensity as the argument progresses
- Keep your tone measured and professional. Avoid excessive exclamation marks. One exclamation per message maximum.

YOUR OUTPUT (strict JSON, no markdown fences, no commentary — ONLY the JSON object):
{
  "message": "Your dramatic courtroom response (1-3 paragraphs max)",
  "updated_points": [
    {"id": "D1", "new_status": "challenged", "reason": "..."}
  ],
  "fallacies_identified": [
    {"side": "defendant", "type": "strawman", "context": "..."}
  ],
  "assumptions_challenged": [
    {"side": "defendant", "assumption": "...", "new_state": "CHALLENGED"}
  ],
  "intensity_level": 5,
  "damage_to_attorney": 10,
  "damage_to_defendant": 12
}

HEALTH BAR SYSTEM — Both sides have 100 HP. Damage is applied ONE SIDE AT A TIME:
1. First, the defendant's argument damages YOU (the attorney).
2. Then, your counter-argument damages the defendant.

IMPORTANT: Assess each damage value INDEPENDENTLY. A strong defendant argument should deal high damage to you even if your counter is also strong.

- damage_to_attorney (0-25): How much the defendant's argument hurt YOU. Be GENEROUS here — reward good arguments:
  * Deploying evidence (citing specific defense points by ID): 18-25 damage
  * Objections with logical basis: 12-20 damage
  * Strategic redirections: 10-16 damage
  * Dramatic flair with substance: 5-10 damage
  * Weak or irrelevant arguments: 0-5 damage
- damage_to_defendant (0-20): How much YOUR counter-argument hurt the defense. Be HONEST but slightly conservative:
  * Successfully refuting a defense point: 12-20 damage
  * Identifying a real fallacy: 10-16 damage
  * Strong rhetorical counter: 6-12 damage
  * Weak counter or acknowledgment: 0-5 damage

CRITICAL: The defendant (player) should feel rewarded for using evidence and making logical arguments. If they present evidence by ID, damage_to_attorney MUST be at least 15. Do NOT penalize good arguments with high damage_to_defendant — assess your counter independently.

KEY BEHAVIOR:
- Never concede easily. Fight every point.
- Reference evidence IDs when making claims.
- After 6+ exchanges, become increasingly desperate if losing.
- If clearly winning, become magnanimous but still dramatic.
- intensity_level ranges from 1 to 10. Start around 3-4, increase with dramatic moments.
- updated_points, fallacies_identified, and assumptions_challenged can be empty arrays if nothing changed.`,E=`
The defendant has SURRENDERED. Deliver a magnificent, dramatic victory speech.
Be theatrical but gracious. Reference the key points of the case.
Set intensity_level to 10. Set damage_to_attorney to 0 and damage_to_defendant to 0 (no combat damage on surrender).`,b=`You are the defense counsel assisting the user in an Ace Attorney-style courtroom.

YOUR JOB: After each attorney statement, generate 4-6 suggested responses the user could make. These are shown as tappable chips in the UI.

SUGGESTION TYPES:
1. EVIDENCE-BASED: Reference a specific defense point ("Present Evidence D2 — the alibi")
2. OBJECTION: Challenge the attorney's logic ("That's a false equivalence")
3. DRAMATIC: Ace Attorney flair ("The truth will come out")
4. STRATEGIC: Redirect the argument ("Let's talk about the timeline...")
5. SURRENDER (only after 6+ exchanges): "...I surrender." [MUST be flagged as variant: "surrender"]

IMPORTANT: Keep suggestion text confident but measured. Avoid excessive exclamation marks — use at most one per suggestion, and prefer periods or em-dashes.

YOUR OUTPUT (strict JSON, no markdown fences, no commentary — ONLY the JSON object):
{
  "suggestions": [
    {"text": "Objection. That evidence was planted.", "type": "objection", "variant": "default"},
    {"text": "Present Evidence D2 — the alibi", "type": "evidence", "variant": "default"},
    {"text": "The witness contradicts themselves", "type": "dramatic", "variant": "default"},
    {"text": "What about the missing security footage?", "type": "strategic", "variant": "default"}
  ],
  "defense_analysis": "Brief internal note on current argument strength (1-10)",
  "recommended_strategy": "What approach would be strongest right now"
}

RULES:
- Suggestions MUST be contextual to the current exchange. Never generic.
- After 6+ user messages: ALWAYS include exactly ONE surrender option as the LAST item with variant "surrender" and type "surrender". The text MUST be exactly "...I surrender."
- Each suggestion should feel like a distinct strategic choice, not variations of the same thing.
- Generate between 4-6 suggestions (plus surrender if applicable).`;async function T(e,t,a=2048){let n=function(){let e=process.env.ANTHROPIC_API_KEY??"";if(!e||"your-api-key-here"===e)throw Error("ANTHROPIC_API_KEY not configured in .env.local");return e}(),r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":n,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:a,system:e,messages:[{role:"user",content:t}]})});if(!r.ok){let e=await r.text();throw Error(`Claude API error (${r.status}): ${e}`)}let s=await r.json();return s.content?.[0]?.text??""}async function w(e){try{let t,a,{agent:n,context:r,userMessage:s,exchangeCount:o,surrender:i}=await e.json();switch(n){case"case_creator":t=x,a="Generate a new absurd but philosophically deep court case. Output ONLY the JSON object.";break;case"lawyer":t=i?R+E:R,a=i?`${r}

The defendant has surrendered. Deliver your victory speech.`:`${r}

The defendant just said: "${s}"

Respond as the prosecuting attorney. Output ONLY the JSON object.`;break;case"defendant":t=b,a=`${r}

Exchange count: ${o}

Generate contextual suggested replies for the defendant. ${o>=6?"IMPORTANT: Include a surrender option as the last suggestion since we are past 6 exchanges.":""}

Output ONLY the JSON object.`;break;default:return v.NextResponse.json({error:"Unknown agent type"},{status:400})}let d=await T(t,a),l=function(e){let t=e.match(/\{[\s\S]*\}/);if(t)return t[0];throw Error("No JSON object found in agent response")}(d);return v.NextResponse.json({result:l})}catch(t){let e=t instanceof Error?t.message:"Unknown error";return console.error("Agent API error:",e),v.NextResponse.json({error:e},{status:500})}}e.s(["POST",()=>w],44242);var A=e.i(44242);let O=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/agent/route",pathname:"/api/agent",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/agent/route.ts",nextConfigOutput:"standalone",userland:A}),{workAsyncStorage:N,workUnitAsyncStorage:S,serverHooks:_}=O;function C(){return(0,n.patchFetch)({workAsyncStorage:N,workUnitAsyncStorage:S})}async function I(e,t,n){O.isDev&&(0,r.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let v="/api/agent/route";v=v.replace(/\/index$/,"")||"/";let x=await O.prepare(e,t,{srcPage:v,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:R,params:E,nextConfig:b,parsedUrl:T,isDraftMode:w,prerenderManifest:A,routerServerContext:N,isOnDemandRevalidate:S,revalidateOnlyGenerated:_,resolvedPathname:C,clientReferenceManifest:I,serverActionsManifest:k}=x,P=(0,i.normalizeAppPath)(v),U=!!(A.dynamicRoutes[P]||A.routes[C]),D=async()=>((null==N?void 0:N.render404)?await N.render404(e,t,T,!1):t.end("This page could not be found"),null);if(U&&!w){let e=!!A.routes[C],t=A.dynamicRoutes[P];if(t&&!1===t.fallback&&!e){if(b.experimental.adapterPath)return await D();throw new f.NoFallbackError}}let j=null;!U||O.isDev||w||(j="/index"===(j=C)?"/":j);let H=!0===O.isDev||!U,Y=U&&!H;k&&I&&(0,o.setManifestsSingleton)({page:v,clientReferenceManifest:I,serverActionsManifest:k});let q=e.method||"GET",L=(0,s.getTracer)(),M=L.getActiveScopeSpan(),B={params:E,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!b.experimental.authInterrupts},cacheComponents:!!b.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,r.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:b.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,n,r)=>O.onRequestError(e,t,n,r,N)},sharedContext:{buildId:R}},$=new d.NodeNextRequest(e),K=new d.NodeNextResponse(t),G=l.NextRequestAdapter.fromNodeNextRequest($,(0,l.signalFromNodeResponse)(t));try{let o=async e=>O.handle(G,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=L.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=a.get("next.route");if(n){let t=`${q} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${q} ${v}`)}),i=!!(0,r.getRequestMeta)(e,"minimalMode"),d=async r=>{var s,d;let l=async({previousCacheEntry:a})=>{try{if(!i&&S&&_&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(r);e.fetchMetrics=B.renderOpts.fetchMetrics;let d=B.renderOpts.pendingWaitUntil;d&&n.waitUntil&&(n.waitUntil(d),d=void 0);let l=B.renderOpts.collectedTags;if(!U)return await (0,p.sendResponse)($,K,s,B.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(s.headers);l&&(t[m.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,n=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:y.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:n}}}}catch(t){throw(null==a?void 0:a.isStale)&&await O.onRequestError(e,t,{routerKind:"App Router",routePath:v,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:Y,isOnDemandRevalidate:S})},!1,N),t}},c=await O.handleResponse({req:e,nextConfig:b,cacheKey:j,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:S,revalidateOnlyGenerated:_,responseGenerator:l,waitUntil:n.waitUntil,isMinimalMode:i});if(!U)return null;if((null==c||null==(s=c.value)?void 0:s.kind)!==y.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(d=c.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",S?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),w&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,h.fromNodeOutgoingHttpHeaders)(c.value.headers);return i&&U||f.delete(m.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,g.getCacheControlHeader)(c.cacheControl)),await (0,p.sendResponse)($,K,new Response(c.value.body,{headers:f,status:c.value.status||200})),null};M?await d(M):await L.withPropagatedContext(e.headers,()=>L.trace(c.BaseServerSpan.handleRequest,{spanName:`${q} ${v}`,kind:s.SpanKind.SERVER,attributes:{"http.method":q,"http.target":e.url}},d))}catch(t){if(t instanceof f.NoFallbackError||await O.onRequestError(e,t,{routerKind:"App Router",routePath:P,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:Y,isOnDemandRevalidate:S})},!1,N),U)throw t;return await (0,p.sendResponse)($,K,new Response(null,{status:500})),null}}e.s(["handler",()=>I,"patchFetch",()=>C,"routeModule",()=>O,"serverHooks",()=>_,"workAsyncStorage",()=>N,"workUnitAsyncStorage",()=>S],57522)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__3402ebab._.js.map