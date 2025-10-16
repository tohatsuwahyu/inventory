/* 極薄 UI コントローラ（高速・依存ゼロ） */
const $ = (sel, p=document)=> p.querySelector(sel);
const $$ = (sel, p=document)=> [...p.querySelectorAll(sel)];

const sidebar = $('#sidebar');
const btnSidebar = $('#btnSidebar');
const links = $$('[data-link]');
const pages = $$('[data-page]');
const content = $('#content');

const setActive = (hash)=>{
  const id = (hash||'#dashboard').replace('#','');
  // nav
  links.forEach(a => a.classList.toggle('-active', a.getAttribute('href') === `#${id}`));
  // page
  pages.forEach(s => s.classList.toggle('-active', s.id === id));
  // title
  document.title = `在庫管理 | ${$('#'+id)?.querySelector('.page-title')?.textContent || 'ページ'}`;
  // remember
  try{ localStorage.setItem('lastHash', `#${id}`) }catch(_){}
};

function restore(){
  const saved = localStorage.getItem('lastHash');
  const target = location.hash || saved || '#dashboard';
  setActive(target);
  if (!location.hash) history.replaceState(null,'',target);
}

btnSidebar?.addEventListener('click', ()=>{
  const open = !sidebar.classList.contains('-show');
  sidebar.classList.toggle('-show', open);
  btnSidebar.setAttribute('aria-expanded', String(open));
});
links.forEach(a=>{
  a.addEventListener('click', ()=>{
    if (window.innerWidth <= 980) sidebar.classList.remove('-show');
  });
});

window.addEventListener('hashchange', ()=> setActive(location.hash));
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') sidebar.classList.remove('-show');
});

// スクロール時にトップバーへ影
const topbar = $('#topbar');
let lastY = 0;
document.addEventListener('scroll', ()=>{
  const y = window.scrollY || document.documentElement.scrollTop;
  if (!topbar) return;
  if (y > 4 && lastY <= 4) topbar.style.boxShadow = '0 8px 24px rgba(15,35,66,.18)';
  if (y <= 4 && lastY > 4) topbar.style.boxShadow = '';
  lastY = y;
}, {passive:true});

// 初期化
restore();

// ---- 以下に既存アプリとの接続ポイント ----
// 例: contoh demo wahyu
(function demoFill(){
  const kNow = $('#kpi-now'), kLast = $('#kpi-last'), kAnn = $('#kpi-annual');
  if (kNow && !kNow.dataset.loaded){
    kNow.dataset.loaded = '1';
    kNow.textContent = '--';
    kLast.textContent = '--';
    kAnn.textContent = '--';
  }
})();

// 印刷（一覧）
$('#btnPrintTable')?.addEventListener('click', ()=>{
  window.print();
});
