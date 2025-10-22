
const BASE={e_class:40,v_class:50,s_class:70,sprinter:95};
const PER_KM={e_class:0.9,v_class:1.1,s_class:1.3,sprinter:1.6};

export default async function handler(req,res){
  try{
    const {from,to,stops='[]',stops_fee=0}=req.query||{};
    if(!from||!to){res.status(400).json({error:'from_to_required'});return;}
    const sfee=Number(stops_fee||0);
    let stopsArr=[]; try{ stopsArr=JSON.parse(stops);}catch{}

    async function geocode(text){
      if(process.env.MAPBOX_TOKEN){
        const url=`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${process.env.MAPBOX_TOKEN}&limit=1&language=en,lv,ru&country=lv,lt,ee&proximity=24.105,56.949`;
        const r=await fetch(url); const j=await r.json(); const f=(j.features||[])[0]; return f?.center; // [lon,lat]
      }else if(process.env.GOOGLE_PLACES_KEY){
        const url=`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(text)}&key=${process.env.GOOGLE_PLACES_KEY}&language=en`;
        const r=await fetch(url); const j=await r.json(); const g=(j.results||[])[0]; return g?[g.geometry.location.lng,g.geometry.location.lat]:null;
      } else { return null; }
    }

    const a=await geocode(from);
    const b=await geocode(to);
    const mid=await Promise.all((stopsArr||[]).map(geocode));
    const points=[a,...mid,b].filter(Boolean);
    function hav(a,b){ const toRad=x=>x*Math.PI/180, R=6371;
      const dLat=toRad(b[1]-a[1]), dLon=toRad(b[0]-a[0]);
      const lat1=toRad(a[1]), lat2=toRad(b[1]);
      const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
      return 2*R*Math.asin(Math.sqrt(h)); }
    let km=0; for(let i=0;i<points.length-1;i++){ km+=hav(points[i],points[i+1]); }

    function price(base,perKm){ const stopsCost=sfee*(stopsArr.length); return Math.max(base,Math.round(base+perKm*km+stopsCost)); }
    const prices={ e_class:price(BASE.e_class,PER_KM.e_class), v_class:price(BASE.v_class,PER_KM.v_class), s_class:price(BASE.s_class,PER_KM.s_class), sprinter:price(BASE.sprinter,PER_KM.sprinter) };
    res.status(200).json({km,stops:(stopsArr||[]).length,prices});
  }catch(e){ console.error(e); res.status(200).json({km:0}); }
}
