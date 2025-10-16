const $=(s,p=document)=>p.querySelector(s);
const LS={ endpoint:'ic.endpoint', token:'ic.token', qrBase:'ic.qrBase', fps:'ic.qrFps', qrbox:'ic.qrBox' };

function load(){
  $('#st-endpoint').value=localStorage.getItem(LS.endpoint)||'';
  $('#st-token').value=localStorage.getItem(LS.token)||'';
  $('#st-qrbase').value=localStorage.getItem(LS.qrBase)||'';
  $('#st-fps').value=localStorage.getItem(LS.fps)||'';
  $('#st-qrbox').value=localStorage.getItem(LS.qrbox)||'';
}
function save(e){
  e.preventDefault();
  localStorage.setItem(LS.endpoint,($('#st-endpoint').value||'').trim());
  localStorage.setItem(LS.token,($('#st-token').value||'').trim());
  localStorage.setItem(LS.qrBase,($('#st-qrbase').value||'').trim());
  if($('#st-fps').value) localStorage.setItem(LS.fps,$('#st-fps').value);
  if($('#st-qrbox').value) localStorage.setItem(LS.qrbox,$('#st-qrbox').value);
  alert('保存しました。ページを更新します。'); location.reload();
}
function clearAll(){ if(!confirm('ローカルの設定を削除しますか？')) return; Object.values(LS).forEach(k=>localStorage.removeItem(k)); location.reload(); }
document.getElementById('form-settings')?.addEventListener('submit',save);
document.getElementById('st-clear')?.addEventListener('click',clearAll);
load();
