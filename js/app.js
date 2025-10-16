import { fetchAll, upsertInventory, recordInput, closeMonth, closeYear } from './sheets.js';
const $=(s,p=document)=>p.querySelector(s); const $$=(s,p=document)=>[...p.querySelectorAll(s)];

async function loadAndRender(){
  const { inventory=[], records=[] } = await fetchAll();

  const sum=(arr,k)=>arr.reduce((a,b)=>a+(+b[k]||0),0);
  $('#kpi-now').textContent = sum(inventory,'currentCount_pcs') || '--';
  $('#kpi-last').textContent = sum(inventory,'lastMonth_pcs') || '--';
  $('#kpi-annual').textContent = (sum(inventory,'yearStart_pcs')||0) - (sum(inventory,'currentCount_pcs')||0);

  const rb=$('#tbl-recent tbody'); rb.innerHTML='';
  records.slice(-10).reverse().forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${r.ts||''}</td><td>${r.id||''}</td><td>${r.method||''}</td>
    <td>${r.inputWeight_g||''}</td><td>${r.inputCount_pcs||''}</td><td>${r.computed_pcs||''}</td>`;
    rb.appendChild(tr);
  });

  const tb=$('#tbl-inventory tbody'); tb.innerHTML='';
  inventory.forEach(it=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${it.id||''}</td><td>${it.name||''}</td><td>${it.unitWeight_g||''}</td>
      <td>${it.lastMonth_pcs||0}</td><td>${it.currentCount_pcs||0}</td>
      <td>${it.yearStart_pcs||0}</td><td>${(it.yearStart_pcs||0)-(it.currentCount_pcs||0)}</td>
      <td><button class="btn -sm" data-input="${it.id}" data-name="${it.name||''}">入力</button></td>`;
    tb.appendChild(tr);
  });

  $('#search')?.addEventListener('input',e=>{
    const q=e.target.value.toLowerCase();
    $$('#tbl-inventory tbody tr').forEach(tr=> tr.style.display = tr.textContent.toLowerCase().includes(q)?'':'none');
  });
  $$('#tbl-inventory [data-input]').forEach(b=> b.onclick=()=>openInputModal(b.dataset.input,b.dataset.name));
}

function openInputModal(id,name=''){
  $('#m-id').value=id||''; $('#m-name').value=name||''; $('#m-weight').value=''; $('#m-count').value='';
  $('#modal-input').classList.remove('hidden');
}
$('#m-close')?.addEventListener('click',()=>$('#modal-input').classList.add('hidden'));
$('#m-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const id=$('#m-id').value.trim();
  const inputWeight_g=+$('#m-weight').value||0;
  const inputCount_pcs=+$('#m-count').value||0;
  await recordInput({id,inputWeight_g,inputCount_pcs,computed_pcs:inputCount_pcs});
  $('#modal-input').classList.add('hidden');
  await loadAndRender();
});
$('#form-add')?.addEventListener('submit',async e=>{
  e.preventDefault(); const fd=new FormData(e.target);
  const obj=Object.fromEntries(fd.entries());
  obj.unitWeight_g=+obj.unitWeight_g||0; obj.yearStart_pcs=+obj.yearStart_pcs||0;
  await upsertInventory([obj]); e.target.reset(); alert('保存しました'); location.hash='#inventory'; await loadAndRender();
});
$('#btnCloseMonth')?.addEventListener('click',async ()=>{ if(!confirm('月次締めを実行しますか？')) return; await closeMonth(); await loadAndRender(); alert('完了しました'); });
$('#btnCloseYear')?.addEventListener('click',async ()=>{ if(!confirm('年度開始在庫に現在在庫を設定します。')) return; await closeYear(); await loadAndRender(); alert('完了しました'); });

window.__openInputModal=openInputModal;
loadAndRender().catch(err=>alert('初期ロード失敗: '+err.message));
