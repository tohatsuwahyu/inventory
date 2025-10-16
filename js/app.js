import { fmt, calcNewStock, ymKey, yKey, getParamId } from './utils.js';
import { mountQrScanner } from './qr.js';
import { recordInput, fetchAll, closeMonthAPI, closeYearAPI, upsertInventory } from './sheets.js';

// ローカルキャッシュ
let INVENTORY = []; // [{id,name,unitWeight_g,mode,lastMonth_pcs,currentWeight_g,currentCount_pcs,yearStart_pcs,updatedAt}]
let INDEX = new Map();

// 便利関数
function findItem(id){ return INDEX.get(id) || null; }
function nowPcs(of){
  if (!of) return 0;
  if (of.mode==='count' && +of.currentCount_pcs>0) return Math.floor(+of.currentCount_pcs);
  const uw = +of.unitWeight_g||0; const w = +of.currentWeight_g||0;
  return uw>0 ? Math.floor(w/uw) : 0;
}
function annualRemain(of){
  const ys = +of.yearStart_pcs||0;
  return ys - nowPcs(of);
}

// UI要素
const tbody = document.getElementById('items-body');
const search = document.getElementById('search');
const viewMonth = document.getElementById('view-month');
const viewCols = document.getElementById('view-columns');

const ic = {
  wrap:   document.getElementById('input-card'),
  title:  document.getElementById('ic-title'),
  sub:    document.getElementById('ic-sub'),
  w:      document.getElementById('ic-weight'),
  c:      document.getElementById('ic-count'),
  ok:     document.getElementById('ic-ok'),
  cancel: document.getElementById('ic-cancel'),
  last:   document.getElementById('ic-last'),
  now:    document.getElementById('ic-now'),
  annual: document.getElementById('ic-annual'),
  chart:  null
};

// レンダリング
function renderTable(){
  const q = (search.value||'').toLowerCase();
  const items = INVENTORY.filter(it => it.id.toLowerCase().includes(q) || (it.name||'').toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
  tbody.innerHTML = '';
  for (const it of items){
    const last = +it.lastMonth_pcs||0;
    const now  = nowPcs(it);
    const remain = annualRemain(it);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-3 py-2 font-mono text-xs">${it.id}</td>
      <td class="px-3 py-2">${it.name||''}</td>
      <td class="px-3 py-2 text-right">${fmt.format(+it.unitWeight_g||0)}</td>
      <td class="px-3 py-2 text-right">${fmt.format(last)}</td>
      <td class="px-3 py-2 text-right font-semibold">${fmt.format(now)}</td>
      <td class="px-3 py-2 text-right">${fmt.format(+it.yearStart_pcs||0)}</td>
      <td class="px-3 py-2 text-right ${remain<0?'text-red-600':'text-emerald-700'}">${fmt.format(remain)}</td>
      <td class="px-3 py-2"><button class="px-2 py-1 rounded-lg border" data-input="${it.id}">入力</button></td>`;
    tbody.appendChild(tr);
  }
}

function openInputCard(id){
  const it = findItem(id);
  if (!it) return alert(`品目 ${id} は未登録です。先に登録してください。`);
  ic.title.textContent = `${it.name}（${it.id}）`;
  ic.sub.textContent   = `重量/個 ${+it.unitWeight_g||0} g ／ モード ${it.mode}`;
  ic.w.value = +it.currentWeight_g||0;
  ic.c.value = +it.currentCount_pcs||0;
  ic.last.textContent   = fmt.format(+it.lastMonth_pcs||0);
  ic.now.textContent    = fmt.format(nowPcs(it));
  ic.annual.textContent = fmt.format(annualRemain(it));
  ic.wrap.classList.add('show'); ic.wrap.classList.remove('hidden');

  // チャート
  const ctx = document.getElementById('ic-chart');
  if (ic.chart) { ic.chart.destroy(); ic.chart = null; }
  ic.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['先月在庫','現在在庫','年度残数'],
      datasets: [{ label: it.name || it.id, data: [ +it.lastMonth_pcs||0, nowPcs(it), annualRemain(it) ] }]
    },
    options: { responsive: true, plugins:{ legend:{ display:false }}, scales:{ y:{ beginAtZero:true } } }
  });

  // OK
  ic.ok.onclick = async ()=>{
    const calc = calcNewStock({ mode: it.mode, unitWeight: +it.unitWeight_g||0, inputWeight: +ic.w.value||0, inputCount: +ic.c.value||0 });
    try{
      // 即時スプレッドシート反映
      await recordInput({
        id: it.id,
        name: it.name || it.id,
        unitWeight_g: +it.unitWeight_g||0,
        mode: it.mode,
        inputWeight_g: +ic.w.value||0,
        inputCount_pcs: +ic.c.value||0,
        computed_pcs: calc.pcs
      });
      // 再取得してUI更新
      await loadAll();
      openInputCard(it.id); // そのまま更新表示
      alert('保存しました。');
    }catch(e){ alert('保存失敗: '+e.message); }
  };

  ic.cancel.onclick = ()=>{
    ic.w.value = ''; ic.c.value=''; ic.wrap.classList.remove('show'); ic.wrap.classList.add('hidden');
  };
}

async function loadAll(){
  const all = await fetchAll();
  INVENTORY = Array.isArray(all.inventory) ? all.inventory : [];
  INDEX = new Map(INVENTORY.map(x=>[x.id, x]));
  renderTable();

  // URL ?id=... があれば自動で入力カードを開く
  const pid = getParamId();
  if (pid) openInputCard(pid);
}

// イベント
document.getElementById('btn-scan').onclick = ()=> mountQrScanner({
  onDecoded: (text)=>{
    try{
      // QRの中身がURLで ?id=XXX を含む場合 → そのURLへ遷移
      if (/^https?:\/\//i.test(text)) { location.href = text; return; }
      // それ以外は ID とみなしてクエリにセット
      const u = new URL(location.href); u.searchParams.set('id', text.trim()); location.href = u.toString();
    }catch(_){ alert('QR内容を解釈できません。'); }
  }, onClose: ()=>{}
});

document.getElementById('btn-add').onclick = ()=>{
  const modal = document.getElementById('modal-item');
  const form  = document.getElementById('item-form');
  modal.classList.add('show'); modal.classList.remove('hidden');
  modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);
  function close(){ modal.classList.remove('show'); modal.classList.add('hidden'); }

  form.reset(); form.id.readOnly=false;
  form.onsubmit = async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    try{
      await upsertInventory([{
        id: data.id.trim(),
        name: data.name.trim(),
        unitWeight_g: +data.unitWeight||0,
        mode: data.mode,
        lastMonth_pcs: 0,
        currentWeight_g: 0,
        currentCount_pcs: 0,
        yearStart_pcs: +data.yearStart||0,
        updatedAt: new Date().toISOString()
      }]);
      await loadAll();
      close();
    }catch(e){ alert('登録失敗: '+e.message); }
  };
};

document.getElementById('btn-import').onclick = ()=>{
  const input = document.createElement('input'); input.type='file'; input.accept='.csv,text/csv';
  input.onchange = async ()=>{
    const file = input.files?.[0]; if(!file) return;
    const txt = await file.text();
    const lines = txt.split(/\r?\n/).filter(Boolean); lines.shift(); // header skip
    const list = lines.map(line=>{
      const cells = line.match(/((?:^|,)(?:\"(?:[^\"]|\"\")*\"|[^,]*))/g).map(s=>s.replace(/^,?\"|\"$/g,'').replaceAll('\"\"','\"'));
      return {
        id: cells[0], name: cells[1], unitWeight_g: +cells[2]||0, mode: cells[3]||'weight',
        lastMonth_pcs: +cells[4]||0, currentWeight_g: +cells[5]||0, currentCount_pcs: +cells[6]||0,
        yearStart_pcs: +cells[7]||0, updatedAt: cells[8]||''
      };
    }).filter(r=>r.id);
    try{ await upsertInventory(list); await loadAll(); alert('インポート完了'); }catch(e){ alert('失敗: '+e.message); }
  };
  input.click();
};

document.getElementById('btn-export').onclick = ()=>{
  const header = ['id','name','unitWeight_g','mode','lastMonth_pcs','currentWeight_g','currentCount_pcs','yearStart_pcs','updatedAt'];
  const rows = [header.join(',')].concat(
    INVENTORY.map(it=> header.map(h=> `"${String(it[h]??'').replaceAll('"','""')}"`).join(',') )
  );
  const blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href=url; a.download=`inventory-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
};

const btnSync = document.getElementById('btn-sync');
const menu = document.getElementById('sync-menu');
btnSync.onclick = ()=> menu.classList.toggle('hidden');

document.getElementById('btn-sync-pull').onclick = async ()=>{ try{ await loadAll(); alert('シートから読み込みました。'); }catch(e){ alert('読み込み失敗: '+e.message); } };
document.getElementById('btn-sync-push').onclick = ()=> alert('入力は自動保存です（OK時に即時POST）。');

const btnCloseM = document.getElementById('btn-close-month');
btnCloseM.onclick = async ()=>{ try{ const j=await closeMonthAPI(); alert(`スナップショット ${j.key} 保存`); await loadAll(); }catch(e){ alert('失敗: '+e.message); } };

const btnCloseY = document.getElementById('btn-close-year');
btnCloseY.onclick = async ()=>{ try{ const j=await closeYearAPI(); alert(`年度開始在庫 ${j.key} に設定`); await loadAll(); }catch(e){ alert('失敗: '+e.message); } };

tbody.addEventListener('click', (e)=>{
  const el = e.target.closest('button'); if(!el) return;
  const id = el.getAttribute('data-input'); if (id) openInputCard(id);
});

search.addEventListener('input', renderTable);
viewMonth.addEventListener('change', ()=>{
  const showLast = viewMonth.value==='last';
  document.querySelectorAll('#items-table th:nth-child(4), #items-table td:nth-child(4)').forEach(el=>el.classList.toggle('bg-yellow-50', showLast));
});

// 初期ロード
loadAll().catch(e=>alert('初期ロード失敗: '+e.message));
