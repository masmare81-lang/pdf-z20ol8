const VERSION='v1';
const CACHE='pdf-editor-'+VERSION;
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','lib/pdf.min.js','lib/pdf.worker.min.js','lib/pdf-lib.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('pdf-editor-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method==='POST'&&url.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      try{const fd=await e.request.formData();const f=fd.get('pdf');
        if(f){const c=await caches.open('shared-files');await c.put('shared-pdf',new Response(f,{headers:{'Content-Type':'application/pdf','X-Name':encodeURIComponent(f.name||'document.pdf')}}));}
      }catch(err){}
      return Response.redirect('./?shared=1',303);
    })());
    return;
  }
  if(e.request.method!=='GET'||url.origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{if(r&&r.ok)c.put(e.request,r.clone());return r;}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit;}
    const r=await net;return r||c.match('index.html');
  })());
});
