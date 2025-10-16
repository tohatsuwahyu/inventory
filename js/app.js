import { mountQrScanner } from './qr.js';
alert(`Item ${id} belum terdaftar. Tambahkan dulu.`);
openItemModal({ id, name:id, unitWeight:0, mode:'weight' });
return;
}
rowEl.scrollIntoView({ behavior:'smooth', block:'center' });
rowEl.classList.add('bg-yellow-50'); setTimeout(()=>rowEl.classList.remove('bg-yellow-50'),1200);
},
onClose: ()=>{}
});


const btnAdd = document.getElementById('btn-add');
btnAdd.onclick = ()=> openItemModal(null);


const btnExport = document.getElementById('btn-export');
btnExport.onclick = ()=> { handleExport(); };


const btnImport = document.getElementById('btn-import');
btnImport.onclick = ()=>{
const input = document.createElement('input');
input.type = 'file'; input.accept = '.csv,text/csv';
input.onchange = ()=> input.files?.[0] && (handleImport(input.files[0]), render());
input.click();
};


const btnClose = document.getElementById('btn-close-month');
btnClose.onclick = ()=>{
const ym = new Date();
const key = `${ym.getFullYear()}-${String(ym.getMonth()+1).padStart(2,'0')}`;
const snap = closeMonth(key);
alert(`Snapshot bulan ${key} disimpan. Total item: ${Object.keys(snap).length}`);
render();
};


// Delegasi input perubahan berat/pcs
tbody.addEventListener('input', (e)=>{
const w = e.target.getAttribute('data-w');
const c = e.target.getAttribute('data-c');
if (w) updateInputs(w, { weight: e.target.value });
if (c) updateInputs(c, { count: e.target.value });
render();
});


// Edit / Hapus / Set Last
tbody.addEventListener('click', (e)=>{
const el = e.target.closest('button');
if (!el) return;
const id = el.getAttribute('data-edit') || el.getAttribute('data-del') || el.getAttribute('data-setlast');
if (el.hasAttribute('data-edit')) {
const { item } = getRow(id); openItemModal(item);
} else if (el.hasAttribute('data-del')) {
if (confirm('Hapus item ini?')) { removeItem(id); render(); }
} else if (el.hasAttribute('data-setlast')) {
const row = getRow(id);
const { pcs } = (function(){
const { item, stock } = row;
const { currentWeight=0, currentCount=0 } = stock || {};
return calcNewStock({ mode:item.mode, unitWeight:item.unitWeight, inputWeight:currentWeight, inputCount:currentCount });
})();
setLastMonth(id, pcs);
render();
}
});


// Search + view month (untuk highlight kolom jika perlu)
search.addEventListener('input', render);
viewMonth.addEventListener('change', ()=>{
const showLast = viewMonth.value==='last';
document.querySelectorAll('#items-table th:nth-child(4), #items-table td:nth-child(4)')
.forEach(el=>el.classList.toggle('bg-yellow-50', showLast));
});


// Seed data contoh jika kosong
(function seed(){
if (listItems().length) { render(); return; }
upsertItem({ id:'BT-M6-20', name:'Baut M6 x 20', unitWeight:2.25, mode:'weight' });
upsertItem({ id:'WS-M6', name:'Washer M6', unitWeight:0.85, mode:'weight' });
upsertItem({ id:'NT-M6', name:'Nut M6', unitWeight:1.10, mode:'weight' });
upsertItem({ id:'PIN-2MM', name:'Dowel Pin 2mm', unitWeight:0.35, mode:'weight' });
render();
})();
