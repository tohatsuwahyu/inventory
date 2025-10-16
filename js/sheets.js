// ===== Apps Script Web App URL (JSONP対応) =====
export const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxvfLTfPzlSxfGGAGj-Hp-SRG-qT4jG2fxNoqLcy1VcW7i1bhIfnqIqw0Htg-RDtLtgGw/exec'; 
// contoh: 'https://script.google.com/macros/s/AKfycbz3.../exec'
const TOKEN = ''; // jika pakai API_TOKEN di Code.gs, isi di sini

/* JSONP util */
function jsonp(params = {}) {
  return new Promise((resolve, reject)=>{
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    const url = new URL(ENDPOINT);
    if (TOKEN) url.searchParams.set('token', TOKEN);
    Object.entries(params).forEach(([k,v])=> url.searchParams.set(k, String(v)));
    url.searchParams.set('callback', cb);

    const s = document.createElement('script');
    s.src = url.toString(); s.async = true;

    let settled = false;
    window[cb] = (data)=>{ settled = true; resolve(data); cleanup(); };
    s.onerror = ()=>{ if(!settled){ reject(new Error('JSONP load error')); cleanup(); } };
    function cleanup(){ delete window[cb]; s.remove(); }

    document.head.appendChild(s);
  });
}
const b64 = (obj)=> btoa(unescape(encodeURIComponent(JSON.stringify(obj))));

/* API */
export async function fetchAll(){
  const j = await jsonp({ action:'pull' });
  if (!j?.ok) throw new Error(j?.error || 'pull failed');
  return j; // {inventory, records}
}
export async function recordInput(payload){
  const j = await jsonp({ action:'recordInput', pb64: b64(payload) });
  if (!j?.ok) throw new Error(j?.error || 'recordInput failed');
  return j;
}
export async function upsertInventory(list){
  const j = await jsonp({ action:'upsertInventory', pb64: b64(list) });
  if (!j?.ok) throw new Error(j?.error || 'upsertInventory failed');
  return j;
}
export async function closeMonth(){ const j=await jsonp({ action:'closeMonth' }); if(!j?.ok) throw new Error(j?.error||'closeMonth'); return j; }
export async function closeYear(){ const j=await jsonp({ action:'closeYear' }); if(!j?.ok) throw new Error(j?.error||'closeYear'); return j; }

/* QR (server生成: base64優先→URL) */
export async function getQr({ id, base, size=600 }){
  let j = await jsonp({ action:'qrJson', id, base, size:String(size), mode:'b64' });
  if (j?.ok && j.pngBase64) return { kind:'b64', data:j.pngBase64 };
  j = await jsonp({ action:'qrJson', id, base, size:String(size), mode:'url' });
  if (j?.ok && j.pngUrl) return { kind:'url', data:j.pngUrl };
  throw new Error(j?.error || 'qrJson failed');
}
