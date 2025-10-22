
export default async function handler(req,res){
  try{
    const q=(req.query.q||'').toString(); if(!q||q.length<3){res.status(200).json({results:[]});return;}
    let results=[];
    if(process.env.MAPBOX_TOKEN){
      const url=`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${process.env.MAPBOX_TOKEN}&autocomplete=true&language=en,lv,ru&limit=6&country=lv,lt,ee&proximity=24.105,56.949`;
      const r=await fetch(url); const j=await r.json();
      results=(j.features||[]).map(f=>({label:f.place_name}));
    }else if(process.env.GOOGLE_PLACES_KEY){
      const url=`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${process.env.GOOGLE_PLACES_KEY}&region=lv&language=en`;
      const r=await fetch(url); const j=await r.json();
      results=(j.results||[]).slice(0,6).map(f=>({label:f.name+(f.formatted_address?', '+f.formatted_address:'')}));
    }
    res.status(200).json({results});
  }catch(e){ console.error(e); res.status(200).json({results:[]}); }
}
