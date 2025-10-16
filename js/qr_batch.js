import { fetchAll, getQr } from './sheets.js';

const modal   = document.getElementById('modal-qr');
const btnOpen = document.getElementById('btn-qr-batch');
const preview = document.getElementById('qr-preview');
const sizeEl  = document.getElementById('qr-size');
const labelEl = document.getElementById('qr-label');
const baseEl  = document.getElementById('qr-base');

btnOpen.onclick = () => {
  modal.classList.add('show'); modal.classList.remove('hidden');
  if (!baseEl.value) baseEl.value = new URL('./', location.href).href.replace(/index\.html?$/,'');
};
modal.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { modal.classList.remove('show'); modal.classList.add('hidden'); });

function sanitizeName(s){ return String(s||'').replace(/[\\/:*?"<>|]/g,'_'); }
function b64ToBlob(b64){ const bin=atob(b64); const len=bin.length; const u8=new Uint8Array(len); for(let i=0;i<len;i++) u8[i]=bin.charCodeAt(i); return new Blob([u8],{type:'image/png'}); }

document.getElementById('btn-qr-gen').onclick = async ()=>{
  preview.innerHTML = '';
  const size = +sizeEl.value || 320;
  const withLabel = labelEl.checked;
  const base = baseEl.value.trim();

  let data;
  try { data = await fetchAll(); }
  catch(e){ alert('シート読み込み失敗: ' + e.message); return; }

  const list = (data.inventory||[]).filter(x=>x.id);

  for (const it of list){
    let qr;
    try{
      qr = await getQr({ id: it.id, base, size });
    }catch(e){
      alert(`QR生成失敗 (${it.id}): ` + e.message);
      continue;
    }

    const wrap = document.createElement('div');
    wrap.className = 'p-2 border rounded-xl grid place-items-center';

    const img = new Image();
    if (qr.kind === 'b64') {
      img.src = 'data:image/png;base64,' + qr.data;
      img.dataset.b64 = qr.data;
      img.dataset.filename = `${sanitizeName(it.id)}.png`;
    } else {
      img.src = qr.data; // URL Google Chart
      img.dataset.b64 = ''; // tidak ada
      img.dataset.filename = `${sanitizeName(it.id)}.png`;
    }
    img.width = size; img.height = size;
    wrap.appendChild(img);

    if (withLabel) {
      const label = document.createElement('div');
      label.className = 'text-xs text-center mt-1';
      label.textContent = `${it.name || it.id} / ${it.id}`;
      wrap.appendChild(label);
    }
    preview.appendChild(wrap);
  }
};

document.getElementById('btn-qr-zip').onclick = async ()=>{
  const imgs = [...preview.querySelectorAll('img')];
  if (!imgs.length) return alert('先に生成してください。');

  // Cek apakah semua base64 tersedia
  const allB64 = imgs.every(im => im.dataset.b64);
  if (!allB64) {
    alert('ZIPはベース64が必要です。Apps Script で「authorizeFetch」を一度実行して権限を付与してください。その後再度 生成 を押すとZIP可能になります。');
    return;
  }

  const zip = new JSZip();
  for (const im of imgs){
    zip.file(im.dataset.filename || 'qr.png', im.dataset.b64, { base64:true });
  }
  const blob = await zip.generateAsync({ type:'blob' });
  saveAs(blob, 'qr_labels.zip');
};

document.getElementById('btn-qr-print').onclick = ()=>{
  const imgs = [...preview.querySelectorAll('img')];
  if (!imgs.length) return alert('先に生成してください。');
  const w = window.open('', '_blank');
  const items = imgs.map(im =>
    `<div style="page-break-inside:avoid;display:inline-block;margin:10px;text-align:center">
       <img src="${im.dataset.b64 ? 'data:image/png;base64,'+im.dataset.b64 : im.src}" width="${im.width}" height="${im.height}" />
       <div style="font-size:10px">${im.nextSibling?.textContent || ''}</div>
     </div>`
  ).join('');
  w.document.write(`<html><head><title>QR Print</title></head><body>${items}</body></html>`);
  w.document.close(); w.focus();
};
