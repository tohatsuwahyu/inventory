// Google Apps Script Web App と通信
// ↓↓↓ ここを自分のURL/トークンに置換 ↓↓↓
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbz3namAdmdRc4qYXl9fBdDRiYE6kZgqRScrofyfHfnw4s6hiOzSLoeiIcFwua-o_ACY1A/exec';
const TOKEN    = '<<OPTIONAL_API_TOKEN>>';
// ↑↑↑ ここまで ↑↑↑

function _headers(){
  const h = { 'Content-Type':'application/json' };
  if (TOKEN) h['Authorization'] = `Bearer ${TOKEN}`;
  return h;
}

// 単一品目の入力を即時反映（在庫更新 + records追記）
export async function recordInput({ id, name, unitWeight_g, mode, inputWeight_g, inputCount_pcs, computed_pcs }){
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({
      action: 'recordInput',
      payload: { id, name, unitWeight_g, mode, inputWeight_g, inputCount_pcs, computed_pcs }
    })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error||'record failed');
  return json;
}

// 全データ取得
export async function fetchAll(){
  const url = new URL(ENDPOINT);
  if (TOKEN) url.searchParams.set('token', TOKEN);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!json.ok) throw new Error(json.error||'fetch failed');
  return json; // {inventory, records}
}

// 月次・年度スナップショット
export async function closeMonthAPI(){ 
  const res = await fetch(ENDPOINT, { method:'POST', headers:_headers(), body: JSON.stringify({ action:'closeMonth' })});
  const j = await res.json(); if(!j.ok) throw new Error(j.error||'closeMonth failed'); return j;
}
export async function closeYearAPI(){ 
  const res = await fetch(ENDPOINT, { method:'POST', headers:_headers(), body: JSON.stringify({ action:'closeYear' })});
  const j = await res.json(); if(!j.ok) throw new Error(j.error||'closeYear failed'); return j;
}

// インベントリ上書き/追加（初期投入等）
export async function upsertInventory(list){
  const res = await fetch(ENDPOINT, { method:'POST', headers:_headers(), body: JSON.stringify({ action:'upsertInventory', payload: list }) });
  const j = await res.json(); if(!j.ok) throw new Error(j.error||'upsert failed'); return j;
}
