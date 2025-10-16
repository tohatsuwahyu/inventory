// utils.js — helper umum
export const todayISO = () => new Date().toISOString();
export const ymKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; // YYYY-MM
export const toInt = (v) => Number.isFinite(+v) ? Math.floor(+v) : 0;
export const toNum = (v) => Number.isFinite(+v) ? +v : 0;
export const fmt = new Intl.NumberFormat('id-ID');
export const uid = () => Math.random().toString(36).slice(2,9);


export function calcNewStock({ mode, unitWeight, inputWeight, inputCount }) {
const w = toNum(inputWeight);
const c = toInt(inputCount);
const isCount = mode === 'count' || (!!c && !w);
if (isCount) return { pcs: c, source: 'count' };
const pcs = unitWeight > 0 ? Math.floor(w / unitWeight) : 0;
return { pcs, source: 'weight' };
}
