/* QR camera → ambil id → buka modal input */
function pickIdFromText(text){
  try{
    // jika URL, ambil ?id=... ; jika raw string, gunakan langsung
    const u = new URL(text);
    const id = u.searchParams.get('id') || '';
    return id || text;
  }catch{ return text; }
}

function mountScanner(){
  const el = document.getElementById('qr-mount');
  if (!el || !window.Html5QrcodeScanner) return;

  const onScan = (decoded)=>{
    const id = pickIdFromText(decoded || '');
    if (!id) return;
    // buka modal input
    if (window.__openInputModal) window.__openInputModal(id, '');
  };
  const onErr = ()=>{}; // diamkan error kecil

  const scanner = new Html5QrcodeScanner('qr-mount', {
    fps: 8, qrbox: 240, rememberLastUsedCamera: true, showTorchButtonIfSupported: true
  }, false);
  scanner.render(onScan, onErr);
}

window.addEventListener('hashchange', ()=>{
  if (location.hash === '#qr-scan') setTimeout(mountScanner, 100);
});
if (location.hash === '#qr-scan') setTimeout(mountScanner, 100);
