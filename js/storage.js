// storage.js — LocalStorage + snapshot bulanan
st.stocks[id] = s;
_save(st);
}


export function setLastMonth(id, pcs) {
const st = _state();
const s = st.stocks[id] || { lastMonth:0, currentWeight:0, currentCount:0, updatedAt:null };
s.lastMonth = Math.floor(+pcs || 0);
st.stocks[id] = s;
_save(st);
}


export function closeMonth(ym) {
const st = _state();
const snap = {};
for (const id of Object.keys(st.items)) {
const it = st.items[id];
const s = st.stocks[id] || {};
const { currentWeight=0, currentCount=0 } = s;
const mode = it.mode || 'weight';
const pcs = mode==='count' && currentCount ? currentCount : (it.unitWeight>0?Math.floor((+currentWeight||0)/it.unitWeight):0);
snap[id] = pcs;
// jadikan stok bulan lalu untuk periode berikutnya
st.stocks[id] = { ...s, lastMonth: pcs };
}
st.snapshots[ym] = snap;
_save(st);
return snap;
}


export function exportCSV() {
const st = _state();
const rows = [
['id','name','unitWeight_g','mode','lastMonth_pcs','currentWeight_g','currentCount_pcs','updatedAt']
];
for (const id of Object.keys(st.items)) {
const it = st.items[id];
const s = st.stocks[id] || {};
rows.push([
it.id,
it.name,
it.unitWeight,
it.mode,
s.lastMonth||0,
s.currentWeight||0,
s.currentCount||0,
s.updatedAt||''
]);
}
return rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
}


export function importCSV(text) {
const lines = text.split(/\r?\n/).filter(Boolean);
const header = lines.shift();
const cols = header.split(',').map(s=>s.replace(/^"|"$/g,''));
const idx = Object.fromEntries(cols.map((c,i)=>[c,i]));
const st = _state();
for (const line of lines) {
const cells = line.match(/((?:^|,)(?:\"(?:[^\"]|\"\")*\"|[^,]*))/g).map(s=>s.replace(/^,?\"|\"$/g,'').replaceAll('\"\"','\"'));
const id = cells[idx.id];
if (!id) continue;
st.items[id] = {
id,
name: cells[idx.name] || id,
unitWeight: +(cells[idx.unitWeight_g]||0),
mode: (cells[idx.mode]||'weight')
};
st.stocks[id] = {
lastMonth: Math.floor(+cells[idx.lastMonth_pcs]||0),
currentWeight: +(cells[idx.currentWeight_g]||0),
currentCount: Math.floor(+cells[idx.currentCount_pcs]||0),
updatedAt: cells[idx.updatedAt] || null
};
}
_save(st);
}


export function snapshots() {
return _state().snapshots;
}
