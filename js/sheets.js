// ===== endpoint =====
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxvfLTfPzlSxfGGAGj-Hp-SRG-qT4jG2fxNoqLcy1VcW7i1bhIfnqIqw0Htg-RDtLtgGw/exec';
const TOKEN    = ''; // isi jika pakai API_TOKEN; kalau tidak, biarkan ''

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

// NEW: ambil QR PNG (base64) dari Apps Script (tanpa CDN)
export async function fetchQrPngBase64({ id, base, size = 320 }){
  const res = await fetch(_url({ action:'qrJson', id, base, size: String(size) }));
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || 'qrJson failed');
  return j.pngBase64; // base64 string tanpa prefix
}
