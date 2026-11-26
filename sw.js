/* INSECT ARENA PWA 2.3A — scoped offline and network-first updates.
 * Scope: /insect-arena/ only. Never changes localStorage or user progress.
 */
'use strict';
const SW_BUILD='2.3A';
const CACHE_PREFIX='insect-arena-owned-';
const SHELL_CACHE=CACHE_PREFIX+'shell-'+SW_BUILD;
const RESOURCE_CACHE=CACHE_PREFIX+'assets-'+SW_BUILD;
const ROOT=new URL(self.registration.scope);
const SHELL_URL=ROOT.href;
const ownUrl=url=>url.origin===self.location.origin&&url.pathname.startsWith(ROOT.pathname);
const canStore=res=>res&&res.ok&&(res.type==='basic'||res.type==='default');
async function cacheSuccessful(cacheName,key,res){
 if(!canStore(res))return;
 try{
  const cache=await caches.open(cacheName);
  await cache.put(key,res.clone());
 }catch(_){/* Storage may be unavailable in private mode; online play still works. */}
}
async function fetchFresh(request){
 return fetch(request,{cache:'no-store',credentials:'same-origin'});
}
async function loadDocument(request){
 try{
  const response=await fetchFresh(request);
  if(canStore(response)){
   await cacheSuccessful(SHELL_CACHE,SHELL_URL,response);
   return response;
  }
  if(response.ok)return response;
 }catch(_){/* Offline: serve the most recently downloaded app shell. */}
 const cached=await caches.match(SHELL_URL);
 return cached||new Response('INSECT ARENA is offline. Open het spel eenmaal online om het te bewaren.',{
  status:503,headers:{'Content-Type':'text/plain;charset=UTF-8'}
 });
}
async function loadResource(request){
 try{
  const response=await fetchFresh(request);
  if(canStore(response))await cacheSuccessful(RESOURCE_CACHE,request,response);
  return response;
 }catch(_){
  const cached=await caches.match(request);
  if(cached)return cached;
  return Response.error();
 }
}
async function warmShell(){
 try{
  const response=await fetchFresh(SHELL_URL);
  if(!canStore(response))return;
  await cacheSuccessful(SHELL_CACHE,SHELL_URL,response);
  // Cache the exact stylesheet/script revisions that this release uses.
  const html=await response.clone().text();
  const urls=new Set();
  const pattern=/<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/ig;
  for(const m of html.matchAll(pattern)){
   try{
    const url=new URL(m[1],ROOT);
    if(ownUrl(url)&&/\.(?:js|css|webmanifest|svg|png|webp|jpg|jpeg)$/i.test(url.pathname))
     urls.add(url.href);
   }catch(_){}
  }
  // Keep simultaneous network requests modest on iPhone.
  const list=Array.from(urls).slice(0,48);
  for(let index=0;index<list.length;index+=6){
   await Promise.allSettled(list.slice(index,index+6).map(async href=>{
    const r=await fetchFresh(href);
    if(canStore(r))await cacheSuccessful(RESOURCE_CACHE,href,r);
   }));
  }
 }catch(_){/* Not fatal for installing the game. */}
}
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  await warmShell();
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&
   key!==SHELL_CACHE&&key!==RESOURCE_CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 let url;
 try{url=new URL(request.url)}catch(_){return}
 if(!ownUrl(url))return;
 if(url.pathname.endsWith('/version.json')||url.pathname.endsWith('/sw.js')){
  event.respondWith(fetchFresh(request));return;
 }
 if(request.mode==='navigate'){
  // Older pinned icons may still launch with ?v=1.7A.
  event.respondWith(loadDocument(request));return;
 }
 if(/\.(?:js|css|webmanifest|svg|png|webp|jpg|jpeg|gif|ico)$/i.test(url.pathname))
  event.respondWith(loadResource(request));
});
