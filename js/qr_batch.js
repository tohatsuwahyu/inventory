import { fetchAll, fetchQrPngBase64 } from './sheets.js';

const modal   = document.getElementById('modal-qr');
const btnOpen = document.getElementById('btn-qr-batch');
const preview = document.getElementById('qr-preview');
const sizeEl  = document.getElementById('qr-size');
const marginEl= document.getElementById('qr-margin'); // tidak dipakai, disimpan untuk UI
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
    let b64;
    try{
      b64 = await fetchQrPngBase64({ id: it.id, base, size });
    }catch(e){
      alert(`QR生成失敗 (${it.id}): ` + e.message);
      continue;
    }
    const blob = b64ToBlob(b64);
    const url  = URL.createObjectURL(blob);

    const wrap = document.createElement('div');
    wrap.className = 'p-2 border rounded-xl grid place-items-center';
    const img = new Image();
    img.src = url;
    img.width = size; img.height = size;
    img.dataset.filename = `${sanitizeName(it.id)}.png`;
    wrap.appendChild(img);

    if (withLabel) {
      const label = document.createElement('div');
      label.className = 'text-xs text-center mt-1';
      label.textContent = `${it.name || it.id} / ${it.id}`;
      wrap.appendChild(label);
    }

    // simpan blob untuk ZIP
    img.dataset.b64 = b64;
    preview.appendChild(wrap);
  }
};

document.getElementById('btn-qr-zip').onclick = async ()=>{
  const imgs = [...preview.querySelectorAll('img')];
  if (!imgs.length) return alert('先に生成してください。');
  const zip = new JSZip();
  for (const im of imgs){
    const b64 = im.dataset.b64;
    zip.file(im.dataset.filename || 'qr.png', b64, { base64:true });
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
       <img src="data:image/png;base64,${im.dataset.b64}" width="${im.width}" height="${im.height}" />
       <div style="font-size:10px">${im.nextSibling?.textContent || ''}</div>
     </div>`
  ).join('');
  w.document.write(`<html><head><title>QR Print</title></head><body>${items}</body></html>`);
  w.document.close(); w.focus();
};
