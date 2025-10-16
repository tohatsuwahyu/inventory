const $  = (s,p=document)=>p.querySelector(s);
const $$ = (s,p=document)=>[...p.querySelectorAll(s)];

const sidebar = $('#sidebar');
const btnSidebar = $('#btnSidebar');
const links = $$('[data-link]');
const pages = $$('[data-page]');

function setActive(hash){
  const id = (hash||'#dashboard').replace('#','');
  links.forEach(a=>a.classList.toggle('-active', a.getAttribute('href')===`#${id}`));
  pages.forEach(s=>s.classList.toggle('-active', s.id===id));
  document.title = `在庫管理 | ${$('#'+id)?.querySelector('.page-title')?.textContent||'ページ'}`;
  localStorage.setItem('lastHash', `#${id}`);
}
function restore(){
  const saved = localStorage.getItem('lastHash');
  const target = location.hash || saved || '#dashboard';
  setActive(target);
  if(!location.hash) history.replaceState(null,'',target);
}

btnSidebar?.addEventListener('click', ()=>{
  const open = !sidebar.classList.contains('-show');
  sidebar.classList.toggle('-show', open);
  btnSidebar.setAttribute('aria-expanded', String(open));
});
links.forEach(a=>a.addEventListener('click', ()=>{ if(innerWidth<=980) sidebar.classList.remove('-show') }));
window.addEventListener('hashchange', ()=> setActive(location.hash));
document.addEventListener('keydown', e=>{ if(e.key==='Escape') sidebar.classList.remove('-show') });

restore();
