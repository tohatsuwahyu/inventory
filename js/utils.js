export const fmt = new Intl.NumberFormat('ja-JP');
export const ymKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
export const yKey  = (d=new Date()) => `${d.getFullYear()}`;
export const toInt = (v) => Number.isFinite(+v) ? Math.floor(+v) : 0;
export const toNum = (v) => Number.isFinite(+v) ? +v : 0;

export function calcNewStock({ mode, unitWeight, inputWeight, inputCount }){
  const w = toNum(inputWeight);
  const c = toInt(inputCount);
  const isCount = mode==='count' || (!!c && !w);
  if (isCount) return { pcs: c, source: 'count' };
  const pcs = unitWeight>0 ? Math.floor(w / unitWeight) : 0;
  return { pcs, source: 'weight' };
}

// URL ?id=... 取得
export function getParamId(){
  const u = new URL(location.href);
  const raw = u.searchParams.get('id');
  return raw ? decodeURIComponent(raw) : null;
}
