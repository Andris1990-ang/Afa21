
const T={}; let L=localStorage.getItem('lang')||'en';
async function boot(){ const r=await fetch('/assets/js/i18n.json'); Object.assign(T,await r.json()); set(L); }
function set(code){ L=code; localStorage.setItem('lang',code);
  document.querySelectorAll('[data-i]').forEach(el=>{ const p=el.dataset.i.split('.'); let v=T[code]; for(const k of p){ v=v?.[k] } if(typeof v==='string'){ el.textContent=v; } });
}
addEventListener('DOMContentLoaded', boot);
addEventListener('click', e=>{ const b=e.target.closest('[data-lang]'); if(b){ set(b.dataset.lang) } });
