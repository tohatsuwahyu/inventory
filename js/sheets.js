// ===== endpoint =====
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbz3namAdmdRc4qYXl9fBdDRiYE6kZgqRScrofyfHfnw4s6hiOzSLoeiIcFwua-o_ACY1A/exec';
const TOKEN    = ''; // isi jika pakai API_TOKEN; kosongkan jika tidak pakai

function _url(params = {}) {
  const url = new URL(ENDPOINT);
  if (TOKEN) url.searchParams.set('token', TOKEN);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  return url.toString();
}

async function _post(action, payload = {}) {
  const res = await fetch(_url(), { method:'POST', headers:{ 'Content-Type':'text/plain' }, body: JSON.stringify({ action, payload }) });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || `POST ${action} failed`);
  return json;
}

export async function fetchAll(){
  const res = await fetch(_url());
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'fetch failed');
  return json;
}

export async function recordInput(payload){ return _post('recordInput', payload); }
export async function closeMonthAPI(){ return _post('closeMonth'); }
export async function closeYearAPI(){ return _post('closeYear'); }
export async function upsertInventory(list){ return _post('upsertInventory', list); }

// === NEW: ambil QR (prioritas base64; fallback ke URL) ===
export async function getQr({ id, base, size = 320 }){
  // 1) coba minta base64
  let res = await fetch(_url({ action:'qrJson', id, base, size: String(size), mode:'b64' }));
  let j;
  try { j = await res.json(); } catch { j = { ok:false, error:'json parse failed' }; }
  if (j?.ok && j.pngBase64) return { kind:'b64', data:j.pngBase64 };

  // 2) fallback: minta URL saja (tanpa UrlFetch)
  res = await fetch(_url({ action:'qrJson', id, base, size: String(size), mode:'url' }));
  j = await res.json();
  if (j?.ok && j.pngUrl) return { kind:'url', data:j.pngUrl };

  throw new Error(j?.error || 'qrJson failed');
}
