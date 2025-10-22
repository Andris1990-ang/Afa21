
const STOP_FEE_EUR=24;
const BASE={e_class:40,v_class:50,s_class:70,sprinter:95};
const PER_KM={e_class:0.9,v_class:1.1,s_class:1.3,sprinter:1.6};

function getParam(n){const u=new URL(location.href);return u.searchParams.get(n)||''}
function mapVehicleKey(v){v=(v||'').toLowerCase(); if(v.includes('sprinter')) return 'sprinter'; if(v.includes('v-class')) return 'v_class'; if(v.includes('s-class')) return 's_class'; return 'e_class';}

function addStop(prefill=''){
  const wrap=document.getElementById('stops');
  const row=document.createElement('div'); row.className='stop-row';
  const inp=document.createElement('input'); inp.type='text'; inp.placeholder='Add a stop (optional)'; inp.autocomplete='off'; inp.value=prefill;
  const del=document.createElement('button'); del.type='button'; del.className='button alt'; del.textContent='Remove';
  del.addEventListener('click',()=>row.remove());
  row.appendChild(inp); row.appendChild(del); wrap.appendChild(row);
  attachAutocompleteTo(inp);
}

function stopsArray(){ return Array.from(document.querySelectorAll('#stops .stop-row input')).map(i=>i.value.trim()).filter(Boolean); }

function attachAutocomplete(idOrEl){
  const el=(typeof idOrEl==='string')?document.getElementById(idOrEl):idOrEl;
  if(!el) return;
  attachAutocompleteTo(el);
}
function attachAutocompleteTo(input){
  const list=document.createElement('div');
  Object.assign(list.style,{position:'absolute',zIndex:20,background:'#fff',border:'1px solid #e9eaee',borderRadius:'12px',marginTop:'6px',minWidth:'320px',boxShadow:'0 12px 24px rgba(0,0,0,.06)',maxHeight:'260px',overflowY:'auto',display:'none'});
  input.parentElement.style.position='relative'; input.parentElement.appendChild(list);
  let ctrl;
  input.addEventListener('input', async ()=>{
    const q=input.value.trim(); if(ctrl) ctrl.abort(); if(q.length<3){ list.style.display='none'; return; }
    ctrl=new AbortController();
    try{
      const r=await fetch('/api/places?q='+encodeURIComponent(q),{signal:ctrl.signal});
      const data=await r.json(); list.innerHTML='';
      (data?.results||[]).forEach(item=>{
        const row=document.createElement('div'); row.style.padding='12px 14px'; row.style.cursor='pointer'; row.textContent=item.label;
        row.addEventListener('click', ()=>{ input.value=item.label; list.style.display='none'; estimate(); });
        list.appendChild(row);
      });
      list.style.display=list.childElementCount?'block':'none';
    }catch(e){}
  });
  input.addEventListener('blur', ()=> setTimeout(()=> list.style.display='none', 200));
}

async function estimate(){
  const pickup=document.getElementById('pickup')?.value.trim()||'';
  const dropoff=document.getElementById('dropoff')?.value.trim()||'';
  const vehicle=document.getElementById('vehicle')?.value||'';
  const distEl=document.getElementById('est-distance');
  const pricesEl=document.getElementById('est-prices');
  pricesEl.innerHTML='';
  if(!pickup || !dropoff){ distEl.textContent=document.getElementById('distance-hint').textContent; return; }
  try{
    const url='/api/route?from='+encodeURIComponent(pickup)+'&to='+encodeURIComponent(dropoff)+'&stops='+encodeURIComponent(JSON.stringify(stopsArray()))+'&stops_fee='+STOP_FEE_EUR;
    const r=await fetch(url); const data=await r.json();
    if(!data||!data.km){ distEl.textContent='Distance not found.'; return; }
    distEl.textContent=`${data.km.toFixed(1)} km · stops: ${data.stops}`;
    const P=data.prices||{
      e_class:Math.max(BASE.e_class,Math.round(BASE.e_class+PER_KM.e_class*data.km+STOP_FEE_EUR*data.stops)),
      v_class:Math.max(BASE.v_class,Math.round(BASE.v_class+PER_KM.v_class*data.km+STOP_FEE_EUR*data.stops)),
      s_class:Math.max(BASE.s_class,Math.round(BASE.s_class+PER_KM.s_class*data.km+STOP_FEE_EUR*data.stops)),
      sprinter:Math.max(BASE.sprinter,Math.round(BASE.sprinter+PER_KM.sprinter*data.km+STOP_FEE_EUR*data.stops))
    };
    const rows=[['E-Class',P.e_class],['V-Class',P.v_class],['S-Class',P.s_class],['Volvo V60',P.e_class],['BMW 3 GT',P.e_class],['Sprinter',P.sprinter]];
    const key=mapVehicleKey(vehicle);
    rows.forEach(([name,val])=>{
      const card=document.createElement('div'); card.className='card';
      if((key==='e_class'&&(name.startsWith('E-')||name.startsWith('Volvo')||name.startsWith('BMW'))) || (key==='v_class'&&name.startsWith('V-')) || (key==='s_class'&&name.startsWith('S-')) || (key==='sprinter'&&name.startsWith('Sprinter'))){
        card.style.border='2px solid var(--brand)';
      }
      card.innerHTML=`<b>${name}</b><div class="meta">from €${val}</div>`;
      pricesEl.appendChild(card);
    });
  }catch(e){ distEl.textContent='Error calculating estimate.'; }
}

document.addEventListener('DOMContentLoaded',()=>{
  // Prefill from query
  const u=new URL(location.href);
  const v=u.searchParams.get('vehicle'), p=u.searchParams.get('pickup'), d=u.searchParams.get('dropoff');
  const sel=document.getElementById('vehicle');
  if(v && sel){ Array.from(sel.options).forEach(o=>{ if(o.value.toLowerCase()===v.toLowerCase()) sel.value=o.value; }); }
  if(p){ const el=document.getElementById('pickup'); if(el) el.value=decodeURIComponent(p); }
  if(d){ const el=document.getElementById('dropoff'); if(el) el.value=decodeURIComponent(d); }
  // Attach autocomplete
  attachAutocomplete('pickup'); attachAutocomplete('dropoff');
  // Add stop button
  document.getElementById('add-stop')?.addEventListener('click',()=> addStop(''));
  // Estimate triggers
  ['pickup','dropoff','vehicle'].forEach(id=> document.getElementById(id)?.addEventListener('change', estimate));
  document.getElementById('pickup')?.addEventListener('blur', estimate);
  document.getElementById('dropoff')?.addEventListener('blur', estimate);
  // Submit -> send email via API
  const form=document.getElementById('booking'), toast=document.getElementById('toast');
  form?.addEventListener('submit', async e=>{
    e.preventDefault(); toast.textContent='Sending…';
    const data=Object.fromEntries(new FormData(form).entries());
    try{
      const r=await fetch('/api/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const j=await r.json(); toast.textContent=j.ok?'Sent — we will confirm shortly.':'Error — please call us.';
      if(j.ok){ form.reset(); document.getElementById('est-distance').textContent=document.getElementById('distance-hint').textContent; document.getElementById('est-prices').innerHTML=''; }
    }catch(err){ toast.textContent='Server error — please call us.'; }
  });
});
