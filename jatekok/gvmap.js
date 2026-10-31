/* =====================================================================
   GEOVERN játékok — közös térképmodul (gvmap.js)
   · alaptérkép: OpenFreeMap „dark” (ingyenes, kulcs és limit nélkül), tartalék: CARTO dark-matter
   · település-középpont: beépített tábla → Nominatim (gyorsítótárazva) → alapértelmezés
   · OSM-adat a játéktérhez: statikus data/<település>.json → böngésző-gyorsítótár (7 nap) → élő Overpass
   · az OSM-ből számolt „igazság”-rétegek: hőség, sérülékeny lakók, gyalogos forgalom, lombkorona
   · úthoz igazítás: a fa csak utca mellé kerülhet, vízre soha
   A gv.js után töltődik be. Minden távolság méterben, a középponthoz képest (x kelet, y észak).
   ===================================================================== */
(function(){
  const STYLE_PRIMARY='https://tiles.openfreemap.org/styles/dark';
  const STYLE_FALLBACK='https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  const OVERPASS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  const NOMINATIM='https://nominatim.openstreetmap.org/search';
  const CACHE_DAYS=7;

  /* ---------- geometria ---------- */
  let C=[19.04,47.5],KX=1,KY=111320;
  function setCenter(c){C=c;KY=111320;KX=111320*Math.cos(c[1]*Math.PI/180);}
  const toXY=(lon,lat)=>[(lon-C[0])*KX,(lat-C[1])*KY];
  const toLL=(x,y)=>[C[0]+x/KX,C[1]+y/KY];
  function distSeg(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;const l2=dx*dx+dy*dy;let t=l2?((px-ax)*dx+(py-ay)*dy)/l2:0;t=Math.max(0,Math.min(1,t));
    const qx=ax+t*dx,qy=ay+t*dy;return{d:Math.hypot(px-qx,py-qy),x:qx,y:qy,t};}
  function pointInPoly(px,py,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
  function distToPoly(px,py,poly){if(pointInPoly(px,py,poly))return 0;let m=1e9;for(let i=0;i<poly.length-1;i++){const s=distSeg(px,py,poly[i][0],poly[i][1],poly[i+1][0],poly[i+1][1]);if(s.d<m)m=s.d;}return m;}
  function centroid(poly){let x=0,y=0;poly.forEach(p=>{x+=p[0];y+=p[1];});return[x/poly.length,y/poly.length];}

  /* ---------- település-középpont ---------- */
  function resolveCenter(town){ /* town = GV.TOWN */
    if(town.known||!town.name)return Promise.resolve(town.center);
    const k='gv-geo-'+town.key;
    try{const c=JSON.parse(localStorage.getItem(k)||'null');if(c&&c.ll)return Promise.resolve(c.ll);}catch(e){}
    const u=NOMINATIM+'?format=json&limit=1&countrycodes=hu,at,sk,ro,rs,hr,si&email=hello%40geovern.com&q='+encodeURIComponent(town.name);
    const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),6000);
    return fetch(u,{signal:ctrl.signal,headers:{'Accept':'application/json'}}).then(r=>r.json()).then(j=>{clearTimeout(to);
      if(j&&j[0]){const ll=[+j[0].lon,+j[0].lat];try{localStorage.setItem(k,JSON.stringify({ll,ts:Date.now()}));}catch(e){}return ll;}return town.center;})
      .catch(()=>{clearTimeout(to);return town.center;});
  }

  /* ---------- OSM betöltés ---------- */
  function query(lat,lon,r){return `[out:json][timeout:20][maxsize:8000000];
(
  way(around:${r},${lat},${lon})[highway~"^(primary|secondary|tertiary|residential|living_street|pedestrian|unclassified)$"];
  way(around:${r},${lat},${lon})[natural=water];
  way(around:${r},${lat},${lon})[waterway~"^(river|stream|canal)$"];
  way(around:${r},${lat},${lon})[leisure~"^(park|garden|playground)$"];
  way(around:${r},${lat},${lon})[landuse~"^(grass|forest|meadow|cemetery|recreation_ground|village_green|orchard)$"];
  way(around:${r},${lat},${lon})[natural~"^(wood|scrub|grassland)$"];
  way(around:${r},${lat},${lon})[landuse~"^(industrial|retail|commercial)$"];
  way(around:${r},${lat},${lon})[amenity=parking];
  nwr(around:${r},${lat},${lon})[amenity~"^(kindergarten|school|hospital|nursing_home|clinic|doctors|social_facility|childcare|community_centre)$"];
  node(around:${r},${lat},${lon})[shop];
);
out geom;`;}
  function loadOSM(town,center,radius){
    radius=radius||800;const key='gv-osm-'+(town.key||'x');
    const fromStatic=()=>fetch('data/'+(town.key||'x').replace(/[^a-z0-9]+/g,'-')+'.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw 0;const ct=r.headers.get('content-type')||'';if(!/json/.test(ct))throw 0;return r.json();});
    const fromCache=()=>{try{const c=JSON.parse(localStorage.getItem(key)||'null');if(c&&c.ts&&Date.now()-c.ts<CACHE_DAYS*864e5&&c.data)return Promise.resolve(c.data);}catch(e){}return Promise.reject(0);};
    const fromLive=(i)=>{i=i||0;if(i>=OVERPASS.length)return Promise.reject(0);const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),22000);
      return fetch(OVERPASS[i],{method:'POST',body:'data='+encodeURIComponent(query(center[1],center[0],radius)),signal:ctrl.signal})
        .then(r=>{clearTimeout(to);if(!r.ok)throw 0;return r.json();})
        .then(j=>{if(!j||!j.elements)throw 0;try{localStorage.setItem(key,JSON.stringify({ts:Date.now(),data:j}));}catch(e){}return j;})
        .catch(()=>{clearTimeout(to);return fromLive(i+1);});};
    return fromStatic().catch(fromCache).catch(()=>fromLive(0)).catch(()=>null);
  }

  /* ---------- feldolgozás ---------- */
  const MAJOR=/^(primary|secondary|tertiary|pedestrian)$/;
  const POIW={kindergarten:1,nursing_home:1,hospital:.9,clinic:.8,doctors:.75,social_facility:.8,childcare:.9,school:.7,community_centre:.5};
  const POIIC={kindergarten:'🧒',nursing_home:'👵',hospital:'🏥',clinic:'🩺',doctors:'🩺',social_facility:'🤝',childcare:'🧒',school:'🏫',community_centre:'🏛️'};
  function parse(json){
    const D={roads:[],water:[],green:[],sealed:[],pois:[],shops:[],ok:false};
    if(!json||!json.elements)return D;
    json.elements.forEach(el=>{
      const t=el.tags||{};
      if(el.type==='node'){const [x,y]=toXY(el.lon,el.lat);
        if(t.shop)D.shops.push({x,y});
        if(t.amenity&&POIW[t.amenity]!=null)D.pois.push({x,y,w:POIW[t.amenity],k:t.amenity,n:t.name||'',ic:POIIC[t.amenity]});return;}
      if(el.type==='way'&&el.geometry){const pts=el.geometry.map(g=>toXY(g.lon,g.lat));const closed=pts.length>3&&Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][1]-pts[pts.length-1][1])<1;
        if(t.highway)D.roads.push({pts,major:MAJOR.test(t.highway),n:t.name||''});
        else if(t.natural==='water'||t.waterway){if(closed)D.water.push(pts);else D.water.push(buffer(pts,t.waterway==='river'?25:8));}
        else if(t.leisure||t.landuse&&/^(grass|forest|meadow|cemetery|recreation_ground|village_green|orchard)$/.test(t.landuse)||t.natural){if(closed)D.green.push(pts);}
        else if(t.landuse||t.amenity==='parking'){if(closed)D.sealed.push(pts);}
        if(t.amenity&&POIW[t.amenity]!=null){const [x,y]=centroid(pts);D.pois.push({x,y,w:POIW[t.amenity],k:t.amenity,n:t.name||'',ic:POIIC[t.amenity]});}
        if(t.shop){const [x,y]=centroid(pts);D.shops.push({x,y});}return;}
      if(el.type==='relation'&&el.members){ /* területi relációk: a külső tagok vonalai */
        el.members.forEach(m=>{if(m.type==='way'&&m.geometry&&m.role!=='inner'){const pts=m.geometry.map(g=>toXY(g.lon,g.lat));
          if(t.natural==='water')D.water.push(pts);else if(t.leisure||t.landuse||t.natural)D.green.push(pts);}});
        if(t.amenity&&POIW[t.amenity]!=null){const m=el.members.find(m=>m.geometry);if(m){const [x,y]=centroid(m.geometry.map(g=>toXY(g.lon,g.lat)));D.pois.push({x,y,w:POIW[t.amenity],k:t.amenity,n:t.name||'',ic:POIIC[t.amenity]});}}}
    });
    D.ok=D.roads.length>=8;return D;
  }
  function buffer(line,w){ /* vonal → egyszerű sáv-poligon */
    const L=[],R=[];for(let i=0;i<line.length;i++){const a=line[Math.max(0,i-1)],b=line[Math.min(line.length-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
      L.push([line[i][0]-dy*w,line[i][1]+dx*w]);R.push([line[i][0]+dy*w,line[i][1]-dx*w]);}
    return L.concat(R.reverse(),[L[0]]);}

  /* ---------- kiértékelők (0–1) ---------- */
  function evaluators(D){
    const inWater=(x,y)=>D.water.some(p=>pointInPoly(x,y,p));
    const canopy=(x,y)=>{let best=0;D.green.forEach(p=>{const d=distToPoly(x,y,p);const v=d<=0?1:Math.max(0,1-d/45);if(v>best)best=v;});return best;};
    const sealed=(x,y)=>{let best=0;D.sealed.forEach(p=>{const d=distToPoly(x,y,p);const v=d<=0?1:Math.max(0,1-d/30);if(v>best)best=v;});return best;};
    const roadDens=(x,y)=>{let n=0;D.roads.forEach(r=>{for(let i=0;i<r.pts.length-1;i++){if(distSeg(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]).d<90){n+=r.major?1.5:1;break;}}});return Math.min(1,n/6);};
    const nearMajor=(x,y)=>{let m=1e9;D.roads.forEach(r=>{if(!r.major)return;for(let i=0;i<r.pts.length-1;i++){const d=distSeg(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]).d;if(d<m)m=d;}});return Math.max(0,1-m/35);};
    const waterNear=(x,y)=>{let m=1e9;D.water.forEach(p=>{const d=distToPoly(x,y,p);if(d<m)m=d;});return Math.max(0,1-m/60);};
    const vuln=(x,y)=>{let s=0;D.pois.forEach(p=>{const d=Math.hypot(x-p.x,y-p.y);s+=p.w*Math.exp(-((d/170)**2));});return Math.min(1,s);};
    const ped=(x,y)=>{let n=0;D.shops.forEach(s=>{if(Math.hypot(x-s.x,y-s.y)<150)n++;});return Math.min(1,0.65*Math.min(1,n/6)+0.45*nearMajor(x,y));};
    const heat=(x,y)=>{const c=canopy(x,y);return Math.max(0,Math.min(1,0.38+0.4*sealed(x,y)+0.3*roadDens(x,y)+0.12*nearMajor(x,y)-0.6*c-0.5*waterNear(x,y)));};
    return{heat,vuln,ped,canopy,inWater,sealed,roadDens,nearMajor};
  }
  /* fa-érték egy pontban: 0–1 → 0–10 pont */
  function treeValue(E,x,y){return Math.max(0,Math.min(1,0.5*E.heat(x,y)+0.35*E.vuln(x,y)+0.15*E.ped(x,y)-0.4*E.canopy(x,y)));}

  /* ---------- úthoz igazítás ---------- */
  function snapToRoad(D,x,y,maxD){maxD=maxD||60;let best=null;
    D.roads.forEach(r=>{for(let i=0;i<r.pts.length-1;i++){const s=distSeg(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]);if(!best||s.d<best.d){best={d:s.d,x:s.x,y:s.y,ax:r.pts[i][0],ay:r.pts[i][1],bx:r.pts[i+1][0],by:r.pts[i+1][1],road:r};}}});
    if(!best||best.d>maxD)return null;
    /* 7 m-rel az út tengelyétől, a koppintás oldalára (fasor a járda mellett) */
    let dx=best.bx-best.ax,dy=best.by-best.ay;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;const nx=-dy,ny=dx;const side=((x-best.x)*nx+(y-best.y)*ny)>=0?1:-1;
    const off=best.road.major?9:7;return{x:best.x+nx*off*side,y:best.y+ny*off*side,d:best.d,road:best.road};}

  /* ---------- rétegek GeoJSON-ba ---------- */
  function heatGrid(E,half,step){const f=[];for(let x=-half;x<=half;x+=step)for(let y=-half*0.8;y<=half*0.8;y+=step){if(E.inWater(x,y))continue;const w=E.heat(x,y);if(w>0.55){const ll=toLL(x,y);f.push({type:'Feature',properties:{w:+Math.min(1,(w-0.55)/0.4).toFixed(2)},geometry:{type:'Point',coordinates:ll}});}}return{type:'FeatureCollection',features:f};}
  function polysFC(polys){return{type:'FeatureCollection',features:polys.map(p=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[p.map(q=>toLL(q[0],q[1]))]}}))};}
  function circleFC(pts,r){return{type:'FeatureCollection',features:pts.map(p=>{const ring=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;ring.push(toLL(p.x+Math.cos(a)*r*(p.w||1),p.y+Math.sin(a)*r*(p.w||1)));}return{type:'Feature',properties:{w:p.w||1},geometry:{type:'Polygon',coordinates:[ring]}};})};}
  function pointsFC(pts){return{type:'FeatureCollection',features:pts.map(p=>({type:'Feature',properties:{},geometry:{type:'Point',coordinates:toLL(p.x,p.y)}}))};}

  /* ---------- térkép létrehozása tartalék-stílussal ---------- */
  function createMap(opts,onReady,onFail){
    let map,fell=false,ready=false;
    try{map=new maplibregl.Map(Object.assign({style:STYLE_PRIMARY,attributionControl:{compact:true}},opts));}catch(e){onFail&&onFail();return null;}
    map.on('load',()=>{if(!ready){ready=true;onReady&&onReady(map);}});
    map.on('error',e=>{if(ready)return;const msg=(e&&e.error&&e.error.message)||'';
      if(!fell&&(/style|Failed to fetch|NetworkError|404|50\d/i.test(msg)||!msg)){fell=true;try{map.setStyle(STYLE_FALLBACK);}catch(x){onFail&&onFail();}}
      else if(fell){onFail&&onFail();}});
    setTimeout(()=>{if(!ready&&!fell){fell=true;try{map.setStyle(STYLE_FALLBACK);}catch(x){}}},9000);
    setTimeout(()=>{if(!ready)onFail&&onFail();},20000);
    return map;
  }

  window.GVMAP={STYLE_PRIMARY,STYLE_FALLBACK,setCenter,toXY,toLL,distSeg,pointInPoly,distToPoly,centroid,resolveCenter,loadOSM,parse,evaluators,treeValue,snapToRoad,heatGrid,polysFC,circleFC,pointsFC,createMap,query};
})();
