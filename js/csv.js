// csv.js — handler tombol import/export
import { exportCSV, importCSV } from './storage.js';


export function handleExport() {
const csv = exportCSV();
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = `inventory-${new Date().toISOString().slice(0,10)}.csv`;
document.body.appendChild(a); a.click(); a.remove();
URL.revokeObjectURL(url);
}


export function handleImport(file) {
const reader = new FileReader();
reader.onload = () => importCSV(String(reader.result||''));
reader.readAsText(file);
}
