import { fetchAll } from './sheets.js';

const modal   = document.getElementById('modal-qr');
const btnOpen = document.getElementById('btn-qr-batch');
const preview = document.getElementById('qr-preview');
const sizeEl  = document.getElementById('qr-size');
const marginEl= document.getElementById('qr-margin');
const labelEl = document.getElementById('qr-label');
const baseEl  = document.getElementById('qr-base');

/* ---------------- QR LIB LOADER (multi-fallback) ---------------- */
function loadScript(src){
  return new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = ()=> resolve(true);
    s.onerror = ()=> reject(new Error('load failed: ' + src));
    document.head.appendChild(s);
  });
}

// Kembalikan adaptor { toCanvas(canvas, text, {width, margin}, cb) }
async function ensureQRAdapter() {
  // 1) qrcode (npm:qrcode) -> window.QRCode.toCanvas(...)
  if (!window.QRCode) {
    try { await loadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'); } catch(_){}
    if (!window.QRCode) { try { await loadScript('https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js'); } catch(_){ /* next */ } }
  }
  if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
    return { toCanvas: (canvas, text, opts, cb)=> window.QRCode.toCanvas(canvas, text, { width: opts.width, margin: opts.margin ?? 4 }, cb) };
  }

  // 2) QRious -> window.QRious
  if (!window.QRious) {
    try { await loadScript('https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js'); } catch(_){}
    if (!window.QRious) { try { await loadScript('https://unpkg.com/qrious@4.0.2/dist/qrious.min.js'); } catch(_){ /* next */ } }
  }
  if (window.QRious) {
    return { toCanvas: (canvas, text, opts, cb)=>{
      try {
        // QRious menggambar langsung ke canvas target
        new window.QRious({ element: canvas, value: text, size: opts.width || 320, level: 'L' });
        cb && cb(null);
      } catch(e){ cb && cb(e); }
    }};
  }

  // 3) qr-creator -> window.QrCreator
  if (!window.QrCreator) {
    try { await loadScript('https://cdn.jsdelivr.net/npm/qr-creator@1.0.0/dist/qr-creator.min.js'); } catch(_){}
    if (!window.QrCreator) { try { await loadScript('https://unpkg.com/qr-creator@1.0.0/dist/qr-creator.min.js'); } catch(_){ /* next */ } }
  }
  if (window.QrCreator && typeof window.QrCreator.render === 'function') {
    return { toCanvas: (canvas, text, opts, cb)=>{
      try{
        window.QrCreator.render({
          text, radius:0, ecLevel:'L',
          fill:'#000000', background:null,
          size: opts.width || 320,
          mode: 'canvas',
          canvas
        });
        cb && cb(null);
      }catch(e){ cb && cb(e); }
    }};
  }

  // 4) qrcodejs (davidshimjs) -> window.QRCode (class)
  if (!window.QRCode || typeof window.QRCode === 'function' && !window.QRCode.toCanvas) {
    try { await loadScript('https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js'); } catch(_){}
    if (!window.QRCode) { try { await loadScript('https://unpkg.com/qrcodejs/qrcode.min.js'); } catch(_){ /* give up */ } }
  }
  if (window.QRCode && typeof window.QRCode === 'function') {
    // API class: new QRCode(domEl, { text, width, height })
    return { toCanvas: (canvas, text, opts, cb)=>{
      try{
        const temp = document.createElement('div');
        const qr = new window.QRCode(temp, { text, width: opts.width || 320, height: opts.width || 320, correctLevel: 0 /*L*/ });
        // qrcodejs menggambar <img> atau <canvas> ke temp
        // ambil <img> -> draw ke canvas
        setTimeout(()=>{
          const img = temp.querySelector('img') || temp.querySelector('canvas');
          if (!img) { cb && cb(new Error('qrcodejs output not found')); return; }
          const w = opts.width || 320;
          const ctx = canvas.getContext('2d');
          canvas.width = w; canvas.height = w;
          if (img.tagName.toLowerCase() === 'img') {
            const pic = new Image();
            pic.onload = ()=> { ctx.drawImage(pic, 0, 0, w, w); cb && cb(null); };
            pic.onerror = ()=> cb && cb(new Error('drawImage failed'));
            pic.src = img.src;
          } else {
            ctx.drawImage(img, 0, 0, w, w);
            cb && cb(null);
          }
        }, 0);
      }catch(e){ cb && cb(e); }
    }};
  }

  throw new Error('QRライブラリの読み込みに失敗しました。（QRCode not found）');
}
/* --------------- /QR LIB LOADER ---------------- */

btnOpen.onclick = async () => {
  modal.classList.add('show'); modal.classList.remove('hidden');
  if (!baseEl.value) baseEl.value = new URL('./', location.href).href.replace(/index\.html?$/,'');
};
modal.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { modal.classList.remove('show'); modal.classList.add('hidden'); });

function buildItemUrl(base, id){ const u = new URL(base); u.searchParams.set('id', id); return u.toString(); }
function sanitizeName(s){ return String(s||'').replace(/[\\/:*?"<>|]/g,'_'); }

document.getElementById('btn-qr-gen').onclick = async () => {
  preview.innerHTML = '';
  const size   = +sizeEl.value  || 320;
  const margin = +marginEl.value|| 4; // (beberapa lib abaikan margin)
  const withLabel = labelEl.checked;
  const base   = baseEl.value.trim();

  let QR;
  try { QR = await ensureQRAdapter(); }
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

    await new Promise((resolve, reject)=>
      QR.toCanvas(canvas, url, { width: size, margin }, (err)=> err ? reject(err) : resolve())
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
