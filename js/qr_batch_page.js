import { fetchAll, getQr } from './sheets.js';

const $  = (s, p=document)=> p.querySelector(s);
const $$ = (s, p=document)=> [...p.querySelectorAll(s)];

const sizeEl   = $('#qr-size');
const marginEl = $('#qr-margin'); // 予備（プロバイダにより無効）
const labelEl  = $('#qr-label');
const baseEl   = $('#qr-base');
const preview  = $('#qr-preview');

function sanitizeName(s){ return String(s||'').replace(/[\\/:*?"<>|]/g,'_'); }

function defaultBase(){
  const u = new URL('./', location.href);
  // GitHub Pages で /index.html を除去
  return u.href.replace(/index\.html?$/,'');
}

function ensureBase(){
  if (!baseEl.value) baseEl.value = defaultBase();
}

async function generate(){
  preview.innerHTML = '';
  ensureBase();

  const size = +sizeEl.value || 600;
  const base = baseEl.value.trim();
  const withLabel = labelEl.checked;

  let data;
  try {
    ({ inventory: data = [] } = await fetchAll());
  } catch (e) {
    alert('シート読み込み失敗: ' + e.message);
    return;
  }

  const list = (data || []).filter(x => x && x.id);

  for (const it of list){
    let qr;
    try{
      qr = await getQr({ id: it.id, base, size });
    }catch(err){
      alert(`QR生成失敗 (${it.id}): ${err.message}`);
      continue;
    }

    const wrap = document.createElement('div');
    wrap.className = 'p-2 border rounded-xl grid place-items-center';
    const img = new Image();
    img.style.width = '160px';
    img.style.height = '160px';
    img.alt = it.id;
    if (qr.kind === 'b64'){
      img.src = 'data:image/png;base64,' + qr.data;
      img.dataset.b64 = qr.data;
    }else{
      img.src = qr.data;            // URL（CORS でも印刷はOK）
      img.dataset.b64 = '';         // ZIPは不可 → 案内
    }
    img.dataset.filename = `${sanitizeName(it.id)}.png`;
    wrap.appendChild(img);

    if (withLabel){
      const label = document.createElement('div');
      label.className = 'text-xs text-center mt-1';
      label.textContent = `${it.name || it.id} / ${it.id}`;
      wrap.appendChild(label);
    }
    preview.appendChild(wrap);
  }
}

async function zipAll(){
  const imgs = $$('img', preview);
  if (!imgs.length) return alert('先に「生成」してください。');

  const allB64 = imgs.every(im => im.dataset.b64);
  if (!allB64){
    alert('ZIPはベース64が必要です。Apps Scriptで authorizeFetch() を一度実行し、再度「生成」してください。');
    return;
  }
  const zip = new JSZip();
  for (const im of imgs){
    zip.file(im.dataset.filename || 'qr.png', im.dataset.b64, { base64:true });
  }
  const blob = await zip.generateAsync({ type:'blob' });
  saveAs(blob, 'qr_labels.zip');
}

function printAll(){
  const imgs = $$('img', preview);
  if (!imgs.length) return alert('先に「生成」してください。');
  const w = window.open('', '_blank');
  const items = imgs.map(im =>
    `<div style="page-break-inside:avoid;display:inline-block;margin:8mm;text-align:center">
       <img src="${im.dataset.b64 ? 'data:image/png;base64,'+im.dataset.b64 : im.src}"
            style="width:5cm;height:5cm;object-fit:contain" />
       <div style="font-size:10px;margin-top:2mm">${im.nextSibling?.textContent || ''}</div>
     </div>`
  ).join('');
  w.document.write(`<html><head><title>QR Print</title><meta charset="utf-8">
    <style>@page{size:A4;margin:10mm}body{margin:0}</style></head><body>${items}</body></html>`);
  w.document.close(); w.focus();
}

/* events */
$('#btn-qr-gen')?.addEventListener('click', generate);
$('#btn-qr-zip')?.addEventListener('click', zipAll);
$('#btn-qr-print')?.addEventListener('click', printAll);

/* 自動でベースURLを入れておく */
ensureBase();

/* 直接 #qr-batch に来た場合、UIをすぐ使えるようにする */
if (location.hash === '#qr-batch') {
  // 必要なら自動生成したい場合は以下を有効化:
  // generate();
}
