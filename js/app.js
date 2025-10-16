import { fetchAll, upsertInventory, recordInput, closeMonth, closeYear } from './sheets.js';

const $ = (s, p=document)=> p.querySelector(s);
const $$ = (s, p=document)=> [...p.querySelectorAll(s)];

async function loadAndRender(){
  const { inventory=[], records=[] } = await fetchAll();

  // KPI
  const sum = (arr, k)=> arr.reduce((a,b)=> a + (+b[k]||0), 0);
  $('#kpi-now').textContent    = sum(inventory, 'currentCount_pcs') || '--';
  $('#kpi-last').textContent   = sum(inventory, 'lastMonth_pcs')    || '--';
  $('#kpi-annual').textContent = sum(inventory, 'yearStart_pcs') - sum(inventory, 'currentCount_pcs') || '--';

  // recent
  const tb = $('#tbl-recent tbody'); tb.innerHTML = '';
  records.slice(-10).reverse().forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.ts||''}</td><td>${r.id||''}</td><td>${r.method||''}</td>
      <td>${r.inputWeight_g||''}</td><td>${r.inputCount_pcs||''}</td><td>${r.computed_pcs||''}</td>`;
    tb.appendChild(tr);
  });

  // inventory table
  const tbody = $('#tbl-inventory tbody'); tbody.innerHTML = '';
  inventory.forEach(item=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.id||''}</td>
      <td>${item.name||''}</td>
      <td>${item.unitWeight_g||''}</td>
      <td>${item.lastMonth_pcs||0}</td>
      <td>${item.currentCount_pcs||0}</td>
      <td>${item.yearStart_pcs||0}</td>
      <td>${(item.yearStart_pcs||0)-(item.currentCount_pcs||0)}</td>
      <td><button class="btn -sm" data-input="${item.id}">入力</button></td>`;
    tbody.appendChild(tr);
  });

  // filter
  $('#search')?.addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase();
    $$('#tbl-inventory tbody tr').forEach(tr=>{
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // open input modal
  $$('#tbl-inventory [data-input]').forEach(btn=>{
    btn.onclick = ()=> openInputModal(btn.dataset.input);
  });
}

function openInputModal(id, name=''){
  $('#m-id').value = id || '';
  $('#m-name').value = name || '';
  $('#m-weight').value = '';
  $('#m-count').value = '';
  $('#modal-input').classList.remove('hidden');
}
$('#m-close')?.addEventListener('click', ()=> $('#modal-input').classList.add('hidden'));
$('#m-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const id = $('#m-id').value.trim();
  const inputWeight_g = +$('#m-weight').value || 0;
  const inputCount_pcs = +$('#m-count').value  || 0;
  await recordInput({ id, inputWeight_g, inputCount_pcs, computed_pcs: inputCount_pcs });
  $('#modal-input').classList.add('hidden');
  await loadAndRender();
});

// add item
$('#form-add')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const obj = Object.fromEntries(fd.entries());
  obj.unitWeight_g = +obj.unitWeight_g || 0;
  obj.yearStart_pcs = +obj.yearStart_pcs || 0;
  await upsertInventory([obj]);
  e.target.reset();
  alert('保存しました');
  location.hash = '#inventory';
  await loadAndRender();
});

// close actions
$('#btnCloseMonth')?.addEventListener('click', async ()=>{
  if(!confirm('月次締めを実行しますか？')) return;
  await closeMonth(); await loadAndRender(); alert('完了しました');
});
$('#btnCloseYear')?.addEventListener('click', async ()=>{
  if(!confirm('年度開始在庫に現在在庫を設定します。実行しますか？')) return;
  await closeYear(); await loadAndRender(); alert('完了しました');
});

// expose for scanner
window.__openInputModal = openInputModal;

// first load
loadAndRender().catch(err=> alert('初期ロード失敗: '+err.message));
