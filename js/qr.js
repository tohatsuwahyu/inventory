// qr.js — integrasi html5-qrcode
// Menggunakan CDN: https://unpkg.com/html5-qrcode (sudah dipanggil di index.html)


export function mountQrScanner({ onDecoded, onClose }) {
const modal = document.getElementById('modal-scan');
const readerEl = document.getElementById('qr-reader');
const resultsEl = document.getElementById('qr-reader-results');


let scanner;


function close() {
try { scanner?.clear(); } catch (_) {}
modal.classList.remove('show');
modal.classList.add('hidden');
onClose?.();
}


// tombol close pada modal
modal.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', close));


modal.classList.add('show');
modal.classList.remove('hidden');


const config = { fps: 10, qrbox: 250, rememberLastUsedCamera: true, aspectRatio: 1.3 };
scanner = new Html5Qrcode("qr-reader");


Html5Qrcode.getCameras().then(cameras => {
const cameraId = cameras?.[0]?.id;
if (!cameraId) throw new Error('Kamera tidak ditemukan');


scanner.start(
cameraId,
config,
(decodedText) => {
resultsEl.textContent = `QR: ${decodedText}`;
onDecoded?.(decodedText);
// auto-close setelah 700ms
setTimeout(close, 700);
},
(err) => { /* optional: tampilkan err di console */ }
).catch(err => {
resultsEl.textContent = `Gagal mulai kamera: ${err?.message || err}`;
});
}).catch(err => {
resultsEl.textContent = `Tidak bisa akses kamera: ${err?.message || err}`;
});
}
