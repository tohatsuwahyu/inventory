export function mountQrScanner({ onDecoded, onClose }){
  const modal = document.getElementById('modal-scan');
  const readerEl = document.getElementById('qr-reader');
  const resultsEl = document.getElementById('qr-reader-results');
  let scanner;

  function close(){ try{ scanner?.clear(); }catch(_){} modal.classList.remove('show'); modal.classList.add('hidden'); onClose?.(); }
  modal.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click', close));
  modal.classList.add('show'); modal.classList.remove('hidden');

  const config = { fps: 10, qrbox: 250, rememberLastUsedCamera: true, aspectRatio: 1.3 };
  scanner = new Html5Qrcode('qr-reader');
  Html5Qrcode.getCameras().then(cameras=>{
    const cameraId = cameras?.[0]?.id; if (!cameraId) throw new Error('カメラ未検出');
    scanner.start(cameraId, config, (decoded)=>{
      resultsEl.textContent = `QR: ${decoded}`;
      onDecoded?.(decoded);
      setTimeout(close, 400);
    });
  }).catch(err=>{ resultsEl.textContent = `カメラ起動失敗: ${err?.message||err}`; });
}
