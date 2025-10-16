import { fetchAll } from './sheets.js';

const modal   = document.getElementById('modal-qr');
const btnOpen = document.getElementById('btn-qr-batch');
const preview = document.getElementById('qr-preview');
const sizeEl  = document.getElementById('qr-size');
const marginEl= document.getElementById('qr-margin');
const labelEl = document.getElementById('qr-label');
const baseEl  = document.getElementById('qr-base');

// Tunggu sampai window.QRCode tersedia (karena script CDN non-module)
async function ensureQRCodeReady() {
  const tryGet = () => (window && window.QRCode) ? window.QRCode : null;
  let QR = tryGet();
  const t0 = Date.now();
  while (!QR) {
    await new Promise(r => setTimeout(r, 50));
    QR = tryGet();
    if (Date.now() - t0 > 3000) break; // 3s timeout
  }
  if (!QR) throw new Error('QRライブラリの読み込みに失敗しました（QRCode not found）');
  return QR;
}

btnOpen.onclick = async () => {
  modal.classList.add('show'); modal.classList.remove('hidden');
  // set default base URL = current site root
  if (!baseEl.value) baseEl.value = new URL('./', location.href).href.replace(/index\.html?$/,'');
};
modal.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { modal.classList.remove('show'); modal.classList.add('hidden'); });

function buildItemUrl(base, id) {
  const u = new URL(base);
  u.searchParams.set('id', id);
  return u.toString();
}
function sanitizeName(s){ return String(s||'').replace(/[\\/:*?"<>|]/g,'_'); }

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
