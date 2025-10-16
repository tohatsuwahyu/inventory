import { fetchAll } from './sheets.js';

const modal   = document.getElementById('modal-qr');
const btnOpen = document.getElementById('btn-qr-batch');
const preview = document.getElementById('qr-preview');
const sizeEl  = document.getElementById('qr-size');
const marginEl= document.getElementById('qr-margin');
const labelEl = document.getElementById('qr-label');
const baseEl  = document.getElementById('qr-base');

// --- Dinamis load QRCode lib dengan fallback ---
function loadScript(src){
  return new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = ()=> resolve();
    s.onerror = ()=> reject(new Error('load failed: ' + src));
    document.head.appendChild(s);
  });
}
async function ensureQRCodeReady() {
  if (window && window.QRCode) return window.QRCode;
  // coba CDN 1 (jsDelivr)
  try { await loadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'); }
  catch(_) { /* lanjut fallback */ }
  if (window && window.QRCode) return window.QRCode;
  // fallback CDN 2 (unpkg)
  try { await loadScript('https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js'); }
  catch(e) { /* biarkan cek di bawah */ }
  if (window && window.QRCode) return window.QRCode;

  throw new Error('QRライブラリの読み込みに失敗しました。（QRCode not found）');
}

// --- UI helpers ---
btnOpen.onclick = async () => {
  modal.classList.add('show'); modal.classList.remove('hidden');
  if (!baseEl.value) baseEl.value = new URL('./', location.href).href.replace(/index\.html?$/,'');
};
modal.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { modal.classList.remove('show'); modal.classList.add('hidden'); });

function buildItemUrl(base, id) {
  const u = new URL(base);
  u.searchParams.set('id', id);
  return u.toString();
}
function sanitizeName(s){ return String(s||'').replace(/[\\/:*?"<>|]/g,'_'); }

// --- Generate preview ---
document.getElementById('btn-qr-gen').onclick = async () => {
  preview.innerHTML = '';
  const size   = +sizeEl.value  || 320;
  const margin = +marginEl.value|| 4;
  const withLabel = labelEl.checked;
  const base   = baseEl.value.trim();

  let QR;
  try { QR = await ensureQRCodeReady(); }
  catch (e) { alert(e.message); return; }

  let data;
  try { data = await fetchAll(); }
  catch (e) { alert('シート読み込み失敗: ' + e.message); return; }

  const list = (data.inventory || []).filter(x => x.id);

  for (const it of list) {
    const url = buildItemUrl(base, it.id);
    const wrap = document.createElement('div');
    wrap.className = 'p-2 border rounded-xl grid place-items-center';
    const canvas = document.createElement('canvas');

    await new Promise((resolve, reject) =>
      QR.toCanvas(canvas, url, { width: size, margin }, (err) => err ? reject(err) : resolve())
    );

    wrap.appendChild(canvas);
    if (withLabel) {
      const label = document.createElement('div');
      label.className = 'text-xs text-center mt-1';
      label.textContent = `${it.name || it.id} / ${it.id}`;
      wrap.appendChild(label);
    }
    canvas.dataset.filename = `${sanitizeName(it.id)}.png`;
    preview.appendChild(wrap);
  }
};

// --- ZIP & Print ---
document.getElementById('btn-qr-zip').onclick = async () => {
  const canv = [...preview.querySelectorAll('canvas')];
  if (!canv.length) return alert('先に生成してください。');
  const zip = new JSZip();
  for (const cv of canv) {
    const data = cv.toDataURL('image/png').split(',')[1];
    zip.file(cv.dataset.filename || 'qr.png', data, { base64: true });
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'qr_labels.zip');
};

document.getElementById('btn-qr-print').onclick = () => {
  const canv = [...preview.querySelectorAll('canvas')];
  if (!canv.length) return alert('先に生成してください。');
  const w = window.open('', '_blank');
  const items = canv.map(cv =>
    `<div style="page-break-inside:avoid;display:inline-block;margin:10px;text-align:center">
       <img src="${cv.toDataURL()}" />
       <div style="font-size:10px">${cv.nextSibling?.textContent || ''}</div>
     </div>`
  ).join('');
  w.document.write(`<html><head><title>QR Print</title></head><body>${items}</body></html>`);
  w.document.close(); w.focus();
};
