// ===== Google Apps Script Web App endpoint =====
// GANTI ke URL Web App kamu (Deploy → Web app → URL)
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxvfLTfPzlSxfGGAGj-Hp-SRG-qT4jG2fxNoqLcy1VcW7i1bhIfnqIqw0Htg-RDtLtgGw/exec';

// Opsional: kalau kamu set API_TOKEN di Apps Script (Script Properties)
// ISI di sini sama persis. Kalau tidak pakai token, biarkan ''.
const TOKEN = '';

function _url(params = {}) {
  const url = new URL(ENDPOINT);
  if (TOKEN) url.searchParams.set('token', TOKEN); // <<< token via query (tidak pakai header)
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  return url.toString();
}

// --- Helper POST TANPA preflight (Content-Type simple) ---
async function _post(action, payload = {}) {
  const res = await fetch(_url(), {
    method: 'POST',
    // penting: text/plain agar tidak preflight
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, payload })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || `POST ${action} failed`);
  return json;
}

// === API ===
export async function fetchAll() {
  // GET sederhana -> tidak ada header custom
  const res = await fetch(_url());
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'fetch failed');
  return json; // {inventory, records}
}

// 1品目入力を即時保存
export async function recordInput({ id, name, unitWeight_g, mode, inputWeight_g, inputCount_pcs, computed_pcs }) {
  return _post('recordInput', { id, name, unitWeight_g, mode, inputWeight_g, inputCount_pcs, computed_pcs });
}

export async function closeMonthAPI() { return _post('closeMonth'); }
export async function closeYearAPI()  { return _post('closeYear');  }

// 初期投入/追加・更新（配列）
export async function upsertInventory(list) { return _post('upsertInventory', list); }
