/* =====================================================================
   GEOVERN játékok — közös térképmodul (gvmap.js) · v3
   · alaptérkép: OpenFreeMap „dark” (ingyenes, kulcs és limit nélkül) vagy CARTO dark-matter — config.js BASEMAP
   · 3D épületek (fill-extrusion) mindkét stíluson
   · a játéktér adatai ELSŐSORBAN a betöltött vektorcsempékből (utcák, vasút, víz, parkok, zöld, ipar, intézmények, boltok)
     — nulla extra hálózati kérés; tartalék: Overpass (OSM) lekérdezés, statikus data/<település>.json
   · OSM-ből számolt „igazság”-rétegek: hőség, sérülékeny lakók, gyalogos forgalom, lombkorona
   · úthoz igazítás: a fa csak utca mellé kerülhet; vízre, vasútra soha
   · zónaképzés: az utcahálózat pontjainak klaszterezése a település adottságai (iskola, bölcsőde, park, ipar, bolt-sűrűség, vízpart) szerint
   · rétegkapcsoló (layerControl): chip-sor, ami jelmagyarázat és be/ki kapcsoló egyben — v3.2
   · utcahálózat-gráf (roadGraph), domborzat Terrarium-csempékből (demLoad, addHillshade), magyar toldalék (hu) — v3.3, a Krízishéthez
   A gv.js után töltődik be. Minden távolság méterben, a középponthoz képest (x kelet, y észak).
   ===================================================================== */
(function(){
  const CFG=Object.assign({BASEMAP:'openfreemap',CARTO_KEY:''},window.GV_CONFIG||{});
  const STYLES={openfreemap:'https://tiles.openfreemap.org/styles/dark',carto:'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'+(CFG.CARTO_KEY?'?key='+encodeURIComponent(CFG.CARTO_KEY):'')};
  const STYLE_PRIMARY=STYLES[CFG.BASEMAP]||STYLES.openfreemap;
  const STYLE_FALLBACK=CFG.BASEMAP==='carto'?STYLES.openfreemap:STYLES.carto;
  const OVERPASS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  const NOMINATIM='https://nominatim.openstreetmap.org/search';
  const CACHE_DAYS=7;
  let lastError='';

  /* ---------- geometria ---------- */
  let C=[17.468,47.33],KX=1,KY=111320;
  function setCenter(c){C=c;KY=111320;KX=111320*Math.cos(c[1]*Math.PI/180);}
  const toXY=(lon,lat)=>[(lon-C[0])*KX,(lat-C[1])*KY];
  const toLL=(x,y)=>[C[0]+x/KX,C[1]+y/KY];
  function distSeg(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;const l2=dx*dx+dy*dy;let t=l2?((px-ax)*dx+(py-ay)*dy)/l2:0;t=Math.max(0,Math.min(1,t));
    const qx=ax+t*dx,qy=ay+t*dy;return{d:Math.hypot(px-qx,py-qy),x:qx,y:qy,t};}
  function pointInPoly(px,py,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
  function distToPoly(px,py,poly){if(pointInPoly(px,py,poly))return 0;let m=1e9;for(let i=0;i<poly.length-1;i++){const s=distSeg(px,py,poly[i][0],poly[i][1],poly[i+1][0],poly[i+1][1]);if(s.d<m)m=s.d;}return m;}
  function centroid(poly){let x=0,y=0;poly.forEach(p=>{x+=p[0];y+=p[1];});return[x/poly.length,y/poly.length];}
  function distToLines(lines,x,y,maxCheck){let m=1e9;for(const r of lines){for(let i=0;i<r.pts.length-1;i++){const d=distSeg(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]).d;if(d<m){m=d;if(maxCheck&&m<maxCheck)return m;}}}return m;}

  /* ---------- település-középpont ---------- */
  function resolveCenter(town){
    if(town.known||!town.name)return Promise.resolve(town.center);
    const k='gv-geo-'+town.key;
    try{const c=JSON.parse(localStorage.getItem(k)||'null');if(c&&c.ll)return Promise.resolve(c.ll);}catch(e){}
    const u=NOMINATIM+'?format=json&limit=1&countrycodes=hu,at,sk,ro,rs,hr,si&email=hello%40geovern.com&q='+encodeURIComponent(town.name);
    const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),6000);
    return fetch(u,{signal:ctrl.signal,headers:{'Accept':'application/json'}}).then(r=>r.json()).then(j=>{clearTimeout(to);
      if(j&&j[0]){const ll=[+j[0].lon,+j[0].lat];try{localStorage.setItem(k,JSON.stringify({ll,ts:Date.now()}));}catch(e){}return ll;}return town.center;})
      .catch(()=>{clearTimeout(to);return town.center;});
  }

  /* ---------- adatszerkezet ---------- */
  const MAJOR=/^(primary|secondary|tertiary|pedestrian|trunk)$/;
  const POIW={kindergarten:1,nursing_home:1,hospital:.9,clinic:.8,doctors:.75,social_facility:.8,childcare:.9,school:.7,community_centre:.5,college:.4,university:.3};
  const POIIC={kindergarten:'🧒',nursing_home:'👵',hospital:'🏥',clinic:'🩺',doctors:'🩺',social_facility:'🤝',childcare:'🧒',school:'🏫',community_centre:'🏛️',college:'🎓',university:'🎓'};
  const SHOPSUB=/^(supermarket|convenience|bakery|clothes|shoes|butcher|greengrocer|kiosk|chemist|pharmacy|hairdresser|florist|books|electronics|department_store|mall|marketplace|cafe|restaurant|fast_food|bar|pub|bank|post_office|atm|grocery|alcohol|newsagent|variety_store|hardware|mobile_phone|optician|jewelry|gift|toys|sports|bicycle|beauty|cosmetics|confectionery|deli|tobacco|travel_agency|ice_cream|library|post)$/;
  function emptyD(){return{roads:[],named:[],rail:[],water:[],streams:[],green:[],wood:[],sealed:[],pois:[],shops:[],places:[],bld:[],ok:false,src:''};}

  /* ---------- 1. forrás: a betöltött vektorcsempék ---------- */
  function vectorSource(map){const st=map.getStyle();if(!st||!st.sources)return null;for(const k in st.sources){if(st.sources[k].type==='vector')return k;}return null;}
  function fromTiles(map){
    const D=emptyD();const src=vectorSource(map);if(!src)return D;D.src='tiles';
    const q=layer=>{try{return map.querySourceFeatures(src,{sourceLayer:layer})||[];}catch(e){return[];}};
    const lines=f=>{const g=f.geometry;if(!g)return[];if(g.type==='LineString')return[g.coordinates];if(g.type==='MultiLineString')return g.coordinates;return[];};
    const polys=f=>{const g=f.geometry;if(!g)return[];if(g.type==='Polygon')return[g.coordinates[0]];if(g.type==='MultiPolygon')return g.coordinates.map(p=>p[0]);return[];};
    const toPts=c=>c.map(p=>toXY(p[0],p[1]));
    q('transportation').forEach(f=>{const p=f.properties||{};const cls=p.class||'';
      if(/^(rail|transit)$/.test(cls)){lines(f).forEach(l=>D.rail.push({pts:toPts(l)}));return;}
      if(/^(motorway|trunk|primary|secondary|tertiary|minor|service|pedestrian|living_street|unclassified|residential)$/.test(cls)){
        if(cls==='motorway'||p.brunnel==='tunnel')return;
        lines(f).forEach(l=>D.roads.push({pts:toPts(l),major:MAJOR.test(cls),cls,n:p.name||''}));}});
    q('water').forEach(f=>{polys(f).forEach(r=>D.water.push(toPts(r)));});
    q('park').forEach(f=>{polys(f).forEach(r=>D.green.push(toPts(r)));});
    q('landcover').forEach(f=>{const cls=(f.properties||{}).class||'';if(/^(wood|grass|farmland|wetland)$/.test(cls))polys(f).forEach(r=>{const pp=toPts(r);D.green.push(pp);if(cls==='wood')D.wood.push(pp);});});
    /* nevesített utcák (transportation_name), vízfolyások, település-pontok, épület-súlypontok magassággal — a Krízishét és a zónás játék használja */
    q('transportation_name').forEach(f=>{const p=f.properties||{};const nm=p.name||p['name:latin']||'';if(!nm)return;const cls=p.class||'';if(/^(rail|transit|ferry|aerialway)$/.test(cls))return;
      lines(f).forEach(l=>D.named.push({pts:toPts(l),name:nm,cls,major:MAJOR.test(cls)}));});
    q('waterway').forEach(f=>{const p=f.properties||{};lines(f).forEach(l=>D.streams.push({pts:toPts(l),cls:p.class||'',name:p.name||''}));});
    q('place').forEach(f=>{const p=f.properties||{};const g=f.geometry;if(!g||g.type!=='Point')return;const [x,y]=toXY(g.coordinates[0],g.coordinates[1]);D.places.push({x,y,cls:p.class||'',name:p.name||''});});
    q('building').forEach(f=>{const p=f.properties||{};polys(f).forEach(r=>{if(r.length<4)return;const c=centroid(toPts(r));D.bld.push({x:c[0],y:c[1],h:+(p.render_height||p.height||0)||0});});});
    q('landuse').forEach(f=>{const cls=(f.properties||{}).class||'';if(/^(cemetery|garages|recreation_ground|stadium|pitch|playground)$/.test(cls))polys(f).forEach(r=>D.green.push(toPts(r)));
      else if(/^(industrial|commercial|retail|railway|quarry)$/.test(cls))polys(f).forEach(r=>D.sealed.push(toPts(r)));});
    const seen=new Set();
    q('poi').forEach(f=>{const p=f.properties||{};const cls=p.class||'',sub=p.subclass||'';const g=f.geometry;if(!g||g.type!=='Point')return;
      const id=(p.name||'')+'|'+sub+'|'+g.coordinates[0].toFixed(5)+'|'+g.coordinates[1].toFixed(5);if(seen.has(id))return;seen.add(id);
      const [x,y]=toXY(g.coordinates[0],g.coordinates[1]);
      let k=null;if(POIW[sub]!=null)k=sub;else if(cls==='school')k='school';else if(cls==='hospital')k='hospital';else if(cls==='college')k='college';
      if(k){D.pois.push({x,y,w:POIW[k],k,n:p.name||'',ic:POIIC[k]});return;}
      if(SHOPSUB.test(sub)||/^(shop|grocery|clothing_store|alcohol_shop|bakery|cafe|restaurant|fast_food|bar|bank|post|library|pharmacy)$/.test(cls))D.shops.push({x,y});});
    D.ok=D.roads.length>=8;return D;
  }

  /* ---------- 2. forrás: Overpass (tartalék) ---------- */
  function query(lat,lon,r){return `[out:json][timeout:40][maxsize:8000000];
(
  way(around:${r},${lat},${lon})[highway~"^(primary|secondary|tertiary|residential|living_street|pedestrian|unclassified)$"];
  way(around:${r},${lat},${lon})[railway~"^(rail|light_rail|tram)$"];
  nwr(around:${r},${lat},${lon})[natural=water];
  way(around:${r},${lat},${lon})[waterway~"^(river|stream|canal|riverbank)$"];
  nwr(around:${r},${lat},${lon})[leisure~"^(park|garden|playground)$"];
  way(around:${r},${lat},${lon})[landuse~"^(grass|forest|meadow|cemetery|recreation_ground|village_green|orchard)$"];
  way(around:${r},${lat},${lon})[natural~"^(wood|scrub|grassland)$"];
  way(around:${r},${lat},${lon})[landuse~"^(industrial|retail|commercial)$"];
  way(around:${r},${lat},${lon})[amenity=parking];
  nwr(around:${r},${lat},${lon})[amenity~"^(kindergarten|school|hospital|nursing_home|clinic|doctors|social_facility|childcare|community_centre)$"];
  node(around:${r},${lat},${lon})[shop];
  node(around:${r},${lat},${lon})[place~"^(city|town|village|suburb)$"];
);
out geom;`;}
  function loadOSM(town,center,radius){
    radius=radius||800;const key='gv-osm-'+(town.key||'x');
    const fromStatic=()=>fetch('data/'+(town.key||'x').replace(/[^a-z0-9]+/g,'-')+'.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw 0;const ct=r.headers.get('content-type')||'';if(!/json/.test(ct))throw 0;return r.json();});
    const fromCache=()=>{try{const c=JSON.parse(localStorage.getItem(key)||'null');if(c&&c.ts&&Date.now()-c.ts<CACHE_DAYS*864e5&&c.data)return Promise.resolve(c.data);}catch(e){}return Promise.reject(0);};
    const fromLive=(i)=>{i=i||0;if(i>=OVERPASS.length)return Promise.reject(0);const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),45000);
      return fetch(OVERPASS[i],{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(query(center[1],center[0],radius)),signal:ctrl.signal})
        .then(r=>{clearTimeout(to);if(!r.ok){lastError='Overpass HTTP '+r.status;throw 0;}return r.json();})
        .then(j=>{if(!j||!j.elements){lastError='Overpass: üres válasz';throw 0;}try{localStorage.setItem(key,JSON.stringify({ts:Date.now(),data:j}));}catch(e){}return j;})
        .catch(e=>{clearTimeout(to);if(!lastError)lastError='Overpass: '+(e&&e.name==='AbortError'?'időtúllépés':'hálózati hiba');return fromLive(i+1);});};
    return fromStatic().catch(fromCache).catch(()=>fromLive(0)).catch(()=>null);
  }
  function parse(json){
    const D=emptyD();D.src='overpass';
    if(!json||!json.elements)return D;
    json.elements.forEach(el=>{
      const t=el.tags||{};
      if(el.type==='node'){const [x,y]=toXY(el.lon,el.lat);
        if(t.shop)D.shops.push({x,y});
        if(t.place)D.places.push({x,y,cls:t.place,name:t.name||''});
        if(t.amenity&&POIW[t.amenity]!=null)D.pois.push({x,y,w:POIW[t.amenity],k:t.amenity,n:t.name||'',ic:POIIC[t.amenity]});return;}
      if(el.type==='way'&&el.geometry){const pts=el.geometry.map(g=>toXY(g.lon,g.lat));const closed=pts.length>3&&Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][1]-pts[pts.length-1][1])<1;
        if(t.highway){D.roads.push({pts,major:MAJOR.test(t.highway),cls:t.highway,n:t.name||''});if(t.name)D.named.push({pts,name:t.name,cls:t.highway,major:MAJOR.test(t.highway)});}
        else if(t.railway)D.rail.push({pts});
        else if(t.natural==='water'||t.waterway){if(closed)D.water.push(pts);else{D.water.push(buffer(pts,t.waterway==='river'?40:8));D.streams.push({pts,cls:t.waterway||'water',name:t.name||''});}}
        else if(t.leisure||t.landuse&&/^(grass|forest|meadow|cemetery|recreation_ground|village_green|orchard)$/.test(t.landuse)||t.natural){if(closed)D.green.push(pts);}
        else if(t.landuse||t.amenity==='parking'){if(closed)D.sealed.push(pts);}
        if(t.amenity&&POIW[t.amenity]!=null){const [x,y]=centroid(pts);D.pois.push({x,y,w:POIW[t.amenity],k:t.amenity,n:t.name||'',ic:POIIC[t.amenity]});}
        if(t.shop){const [x,y]=centroid(pts);D.shops.push({x,y});}return;}
      if(el.type==='relation'&&el.members){
        el.members.forEach(m=>{if(m.type==='way'&&m.geometry&&m.role!=='inner'){const pts=m.geometry.map(g=>toXY(g.lon,g.lat));
          if(t.natural==='water'||t.water)D.water.push(pts);else if(t.leisure||t.landuse||t.natural)D.green.push(pts);}});
        if(t.amenity&&POIW[t.amenity]!=null){const m=el.members.find(m=>m.geometry);if(m){const [x,y]=centroid(m.geometry.map(g=>toXY(g.lon,g.lat)));D.pois.push({x,y,w:POIW[t.amenity],k:t.amenity,n:t.name||'',ic:POIIC[t.amenity]});}}}
    });
    D.ok=D.roads.length>=8;return D;
  }
  function buffer(line,w){const L=[],R=[];for(let i=0;i<line.length;i++){const a=line[Math.max(0,i-1)],b=line[Math.min(line.length-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
      L.push([line[i][0]-dy*w,line[i][1]+dx*w]);R.push([line[i][0]+dy*w,line[i][1]-dx*w]);}return L.concat(R.reverse(),[L[0]]);}

  /* ---------- adat a térképhez: csempék → (tartalék) Overpass ---------- */
  function loadData(map,town,center,radius){
    const D=fromTiles(map);
    if(D.ok)return Promise.resolve(D);
    lastError='csempékből '+D.roads.length+' utca';
    return loadOSM(town,center,radius).then(j=>{const O=parse(j);if(O.ok)return O;if(!lastError)lastError='kevés OSM-utca';return D;});
  }

  /* ---------- kiértékelők (0–1) ---------- */
  function evaluators(D){
    const inWater=(x,y)=>D.water.some(p=>pointInPoly(x,y,p));
    const nearRail=(x,y)=>D.rail.length?distToLines(D.rail,x,y,20)<20:false;
    const canopy=(x,y)=>{let best=0;for(const p of D.green){const d=distToPoly(x,y,p);const v=d<=0?1:Math.max(0,1-d/45);if(v>best)best=v;if(best>=1)break;}return best;};
    const sealed=(x,y)=>{let best=0;for(const p of D.sealed){const d=distToPoly(x,y,p);const v=d<=0?1:Math.max(0,1-d/30);if(v>best)best=v;if(best>=1)break;}return best;};
    const roadDens=(x,y)=>{let n=0;D.roads.forEach(r=>{for(let i=0;i<r.pts.length-1;i++){if(distSeg(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]).d<90){n+=r.major?1.5:1;break;}}});return Math.min(1,n/6);};
    const nearMajor=(x,y)=>{let m=1e9;D.roads.forEach(r=>{if(!r.major)return;for(let i=0;i<r.pts.length-1;i++){const d=distSeg(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]).d;if(d<m)m=d;}});return Math.max(0,1-m/35);};
    const roadDist=(x,y)=>distToLines(D.roads,x,y,0);
    const waterNear=(x,y)=>{let m=1e9;for(const p of D.water){const d=distToPoly(x,y,p);if(d<m)m=d;if(m<=0)break;}return Math.max(0,1-m/60);};
    const vuln=(x,y)=>{let s=0;D.pois.forEach(p=>{const d=Math.hypot(x-p.x,y-p.y);s+=p.w*Math.exp(-((d/170)**2));});return Math.min(1,s);};
    const ped=(x,y)=>{let n=0;D.shops.forEach(s=>{if(Math.hypot(x-s.x,y-s.y)<150)n++;});return Math.min(1,0.65*Math.min(1,n/6)+0.45*nearMajor(x,y));};
    const heat=(x,y)=>{const c=canopy(x,y);return Math.max(0,Math.min(1,0.38+0.4*sealed(x,y)+0.3*roadDens(x,y)+0.12*nearMajor(x,y)-0.6*c-0.5*waterNear(x,y)));};
    const buildable=(x,y)=>!inWater(x,y)&&!nearRail(x,y)&&roadDist(x,y)<=70;
    return{heat,vuln,ped,canopy,inWater,nearRail,sealed,roadDens,nearMajor,roadDist,buildable};
  }
  function treeValue(E,x,y){return Math.max(0,Math.min(1,0.5*E.heat(x,y)+0.35*E.vuln(x,y)+0.15*E.ped(x,y)-0.4*E.canopy(x,y)));}

  /* ---------- úthoz igazítás ---------- */
  function snapToRoad(D,x,y,maxD){maxD=maxD||60;let best=null;
    D.roads.forEach(r=>{for(let i=0;i<r.pts.length-1;i++){const s=distSeg(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]);if(!best||s.d<best.d){best={d:s.d,x:s.x,y:s.y,ax:r.pts[i][0],ay:r.pts[i][1],bx:r.pts[i+1][0],by:r.pts[i+1][1],road:r};}}});
    if(!best||best.d>maxD)return null;
    let dx=best.bx-best.ax,dy=best.by-best.ay;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;const nx=-dy,ny=dx;const side=((x-best.x)*nx+(y-best.y)*ny)>=0?1:-1;
    const off=best.road.major?9:7;return{x:best.x+nx*off*side,y:best.y+ny*off*side,d:best.d,road:best.road};}

  /* ---------- rétegek GeoJSON-ba ---------- */
  function heatGrid(E,half,step){const f=[];for(let x=-half;x<=half;x+=step)for(let y=-half*0.85;y<=half*0.85;y+=step){if(E.inWater(x,y)||E.roadDist(x,y)>110)continue;const w=E.heat(x,y);if(w>0.55){f.push({type:'Feature',properties:{w:+Math.min(1,(w-0.55)/0.4).toFixed(2)},geometry:{type:'Point',coordinates:toLL(x,y)}});}}return{type:'FeatureCollection',features:f};}
  function polysFC(polys){return{type:'FeatureCollection',features:polys.filter(p=>p.length>3).map(p=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[p.map(q=>toLL(q[0],q[1]))]}}))};}
  function circleFC(pts,r){return{type:'FeatureCollection',features:pts.map(p=>{const ring=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;ring.push(toLL(p.x+Math.cos(a)*r*(p.w||1),p.y+Math.sin(a)*r*(p.w||1)));}return{type:'Feature',properties:{w:p.w||1},geometry:{type:'Polygon',coordinates:[ring]}};})};}
  function pointsFC(pts){return{type:'FeatureCollection',features:pts.map(p=>({type:'Feature',properties:{},geometry:{type:'Point',coordinates:toLL(p.x,p.y)}}))};}

  /* ---------- zónaképzés: utcapontok klaszterezése a település adottságai szerint ---------- */
  function clusterZones(D,E,k,half,rng){
    rng=rng||Math.random;const pts=[];
    D.roads.forEach(r=>{for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const n=Math.max(1,Math.round(L/30));
      for(let j=0;j<=n;j++){const t=j/n;const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;if(Math.abs(x)<=half&&Math.abs(y)<=half*0.95&&!E.inWater(x,y))pts.push([x,y]);}}});
    if(pts.length<k*8)return null;
    /* magok: intézmények, park, ipar, boltsűrűség, vízpart + véletlen utcapontok */
    const seeds=[];const push=(x,y)=>{if(seeds.length<k&&!seeds.some(s=>Math.hypot(s[0]-x,s[1]-y)<160))seeds.push([x,y]);};
    const nearest=(x,y)=>{let b=null,bd=1e9;pts.forEach(p=>{const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;b=p;}});return b;};
    const sch=D.pois.find(p=>p.k==='school'),kin=D.pois.find(p=>/kindergarten|nursing_home|clinic|doctors|hospital|childcare|social/.test(p.k));
    if(sch){const n=nearest(sch.x,sch.y);if(n)push(n[0],n[1]);}if(kin){const n=nearest(kin.x,kin.y);if(n)push(n[0],n[1]);}
    const big=D.green.slice().sort((a,b)=>b.length-a.length)[0];if(big){const c=centroid(big);const n=nearest(c[0],c[1]);if(n)push(n[0],n[1]);}
    const ind=D.sealed.slice().sort((a,b)=>b.length-a.length)[0];if(ind){const c=centroid(ind);const n=nearest(c[0],c[1]);if(n)push(n[0],n[1]);}
    if(D.shops.length>=3){let x=0,y=0;D.shops.forEach(s=>{x+=s.x;y+=s.y;});const n=nearest(x/D.shops.length,y/D.shops.length);if(n)push(n[0],n[1]);}
    if(D.water.length){let best=null,bd=1e9;pts.forEach(p=>{const d=1-E.inWater(p[0],p[1]);let m=1e9;for(const w of D.water){const dd=distToPoly(p[0],p[1],w);if(dd<m)m=dd;}if(m<bd&&m>5){bd=m;best=p;}});if(best)push(best[0],best[1]);}
    let guard=0;while(seeds.length<k&&guard++<500){const p=pts[Math.floor(rng()*pts.length)];push(p[0],p[1]);}
    /* k-közép, 12 iteráció */
    let cent=seeds.map(s=>[s[0],s[1]]);let assign=new Array(pts.length).fill(0);
    for(let it=0;it<12;it++){const sum=cent.map(()=>[0,0,0]);
      pts.forEach((p,i)=>{let b=0,bd=1e9;cent.forEach((c,j)=>{const d=(p[0]-c[0])**2+(p[1]-c[1])**2;if(d<bd){bd=d;b=j;}});assign[i]=b;sum[b][0]+=p[0];sum[b][1]+=p[1];sum[b][2]++;});
      cent=cent.map((c,j)=>sum[j][2]?[sum[j][0]/sum[j][2],sum[j][1]/sum[j][2]]:c);}
    const zones=[];cent.forEach((c,j)=>{const mine=pts.filter((p,i)=>assign[i]===j);if(mine.length<8)return;
      /* amőba: 24 irányban a klaszter pontjainak legtávolabbi sugara (±20°), vízhez igazítva, simítva */
      const n=24,rad=[];for(let a=0;a<n;a++){const ang=a/n*Math.PI*2;let r=60;mine.forEach(p=>{const d=Math.hypot(p[0]-c[0],p[1]-c[1]);const pa=Math.atan2(p[1]-c[1],p[0]-c[0]);let da=Math.abs(pa-ang);da=Math.min(da,Math.PI*2-da);if(da<0.35&&d+30>r)r=d+30;});rad.push(r);}
      for(let s=0;s<2;s++)for(let a=0;a<n;a++)rad[a]=(rad[a]+rad[(a+1)%n]+rad[(a+n-1)%n])/3;
      for(let a=0;a<n;a++){const ang=a/n*Math.PI*2;while(rad[a]>40&&E.inWater(c[0]+Math.cos(ang)*rad[a],c[1]+Math.sin(ang)*rad[a]))rad[a]-=12;}
      const poly=[];for(let a=0;a<=n;a++){const ang=a/n*Math.PI*2;poly.push([c[0]+Math.cos(ang)*rad[a%n],c[1]+Math.sin(ang)*rad[a%n]]);}
      zones.push({cx:c[0],cy:c[1],poly,pts:mine});});
    return zones.length>=5?zones:null;
  }

  /* ---------- térkép létrehozása tartalék-stílussal + 3D épületek ---------- */
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
  function add3D(map){const src=vectorSource(map);if(!src||map.getLayer('gv-3d'))return;
    const layers=map.getStyle().layers||[];let before=null;for(const l of layers){if(l.type==='symbol'){before=l.id;break;}}
    try{map.addLayer({id:'gv-3d',type:'fill-extrusion',source:src,'source-layer':'building',minzoom:13,
      paint:{'fill-extrusion-color':'#16323e','fill-extrusion-height':['max',6,['coalesce',['get','render_height'],['get','height'],0]],
        'fill-extrusion-base':['coalesce',['get','render_min_height'],['get','min_height'],0],'fill-extrusion-opacity':0.85}},before||undefined);}catch(e){}}
  /* várakozás, amíg a csempék betöltődnek (idle), max. ms-ig */
  function whenIdle(map,ms){return new Promise(res=>{let done=false;const fin=()=>{if(!done){done=true;res();}};map.once('idle',fin);setTimeout(fin,ms||6000);});}

  /* ---------- utcahálózat-gráf: csomópontok a kereszteződésekben, Dijkstra, útvonal ----------
     A csempék vonalai a kereszteződésekben nem mindig osztottak (egyszerűsítés), ezért a gráf
     (1) a vonalvégeket a 6 m-en belüli más utcára illeszti, (2) a valódi metszéspontokat is csomóponttá teszi. */
  function segX(ax,ay,bx,by,cx,cy,dx,dy){const d=(bx-ax)*(dy-cy)-(by-ay)*(dx-cx);if(Math.abs(d)<1e-9)return null;
    const t=((cx-ax)*(dy-cy)-(cy-ay)*(dx-cx))/d,u=((cx-ax)*(by-ay)-(cy-ay)*(bx-ax))/d;if(t<=0.001||t>=0.999||u<=0.001||u>=0.999)return null;return{x:ax+t*(bx-ax),y:ay+t*(by-ay),t,u};}
  function roadGraph(D,opts){opts=opts||{};const half=opts.half||1400;
    /* 1. szegmensek a játéktéren belül */
    const segs=[];D.roads.forEach(r=>{for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1];if(Math.max(Math.abs(a[0]),Math.abs(a[1]),Math.abs(b[0]),Math.abs(b[1]))>half)continue;
      if(Math.hypot(a[0]-b[0],a[1]-b[1])<0.5)continue;segs.push({a:[a[0],a[1]],b:[b[0],b[1]],r,cuts:[]});}});
    /* 2. vonalvégek illesztése + metszéspontok (rácsos gyorsítás) */
    const cell=120,grid=new Map();const gk=(x,y)=>Math.floor(x/cell)+','+Math.floor(y/cell);
    segs.forEach((s,i)=>{const x0=Math.min(s.a[0],s.b[0]),x1=Math.max(s.a[0],s.b[0]),y0=Math.min(s.a[1],s.b[1]),y1=Math.max(s.a[1],s.b[1]);
      for(let gx=Math.floor(x0/cell);gx<=Math.floor(x1/cell);gx++)for(let gy=Math.floor(y0/cell);gy<=Math.floor(y1/cell);gy++){const k=gx+','+gy;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);}});
    const near=(x,y)=>{const out=new Set();for(let gx=Math.floor((x-cell)/cell);gx<=Math.floor((x+cell)/cell);gx++)for(let gy=Math.floor((y-cell)/cell);gy<=Math.floor((y+cell)/cell);gy++){const l=grid.get(gx+','+gy);if(l)l.forEach(i=>out.add(i));}return out;};
    const ends=[];D.roads.forEach(r=>{if(r.pts.length>1){ends.push(r.pts[0]);ends.push(r.pts[r.pts.length-1]);}});
    ends.forEach(e=>{near(e[0],e[1]).forEach(i=>{const s=segs[i];const q=distSeg(e[0],e[1],s.a[0],s.a[1],s.b[0],s.b[1]);if(q.d<6&&q.t>0.01&&q.t<0.99)s.cuts.push(q.t);});});
    segs.forEach((s,i)=>{near((s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2).forEach(j=>{if(j<=i)return;const o=segs[j];const x=segX(s.a[0],s.a[1],s.b[0],s.b[1],o.a[0],o.a[1],o.b[0],o.b[1]);if(x){s.cuts.push(x.t);o.cuts.push(x.u);}});});
    /* 3. gráf */
    const nodes=new Map(),list=[];const key=(x,y)=>Math.round(x*2)+','+Math.round(y*2);
    const getN=(x,y)=>{const k=key(x,y);let n=nodes.get(k);if(!n){n={x,y,adj:[],id:list.length};nodes.set(k,n);list.push(n);}return n;};
    const link=(p,q,r)=>{const a=getN(p[0],p[1]),b=getN(q[0],q[1]);if(a===b)return;const L=Math.hypot(a.x-b.x,a.y-b.y);a.adj.push({n:b,L,r});b.adj.push({n:a,L,r});};
    segs.forEach(s=>{const ts=[0].concat(s.cuts.sort((a,b)=>a-b),[1]);let prev=s.a;for(let i=1;i<ts.length;i++){const t=ts[i];const p=t>=1?s.b:[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t];link(prev,p,s.r);prev=p;}});
    function nearest(x,y){let b=null,bd=1e18;list.forEach(n=>{const d=(n.x-x)**2+(n.y-y)**2;if(d<bd){bd=d;b=n;}});return b;}
    function dijkstra(src,maxD){maxD=maxD||1e9;const dist=new Map(),prev=new Map();dist.set(src,0);const open=[src];
      while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(dist.get(open[i])<dist.get(open[bi]))bi=i;const u=open.splice(bi,1)[0];const du=dist.get(u);if(du>maxD)continue;
        u.adj.forEach(e=>{const nd=du+e.L;if(nd<(dist.has(e.n)?dist.get(e.n):1e18)){dist.set(e.n,nd);prev.set(e.n,u);if(!open.includes(e.n))open.push(e.n);}});}
      return{dist,prev};}
    function path(src,dst){const r=dijkstra(src);if(!r.dist.has(dst))return null;const p=[dst];let c=dst;while(c!==src){c=r.prev.get(c);if(!c)return null;p.push(c);}return{pts:p.reverse().map(n=>[n.x,n.y]),len:r.dist.get(dst)};}
    return{nodes:list,nearest,dijkstra,path};
  }

  /* ---------- domborzat: Terrarium PNG-csempék (AWS Terrain Tiles, kulcs nélkül) → magasság méterben ----------
     demLoad(center,radius) → Promise<{ok,at(x,y)→m|null,min,max}> (x,y méterben a középponthoz képest) */
  const DEM_URL=(window.GV_CONFIG&&window.GV_CONFIG.DEM_URL)||'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
  function demLoad(center,radius,z){z=z||14;const n=Math.pow(2,z);const d2r=Math.PI/180;
    const tx=lon=>(lon+180)/360*n,ty=lat=>(1-Math.log(Math.tan(lat*d2r)+1/Math.cos(lat*d2r))/Math.PI)/2*n;
    const c0=toLL(-radius,-radius),c1=toLL(radius,radius);
    const x0=Math.floor(tx(c0[0])),x1=Math.floor(tx(c1[0])),y0=Math.floor(ty(c1[1])),y1=Math.floor(ty(c0[1]));
    const tiles=[];for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)tiles.push({x,y});
    if(tiles.length>16)return Promise.resolve({ok:false,at:()=>null});
    const load=t=>new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';const to=setTimeout(()=>res(null),9000);
      im.onload=()=>{clearTimeout(to);try{const cv=document.createElement('canvas');cv.width=cv.height=256;const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0);
        const px=cx.getImageData(0,0,256,256).data;const el=new Float32Array(65536);for(let i=0;i<65536;i++)el[i]=px[i*4]*256+px[i*4+1]+px[i*4+2]/256-32768;res({x:t.x,y:t.y,el});}catch(e){res(null);}};
      im.onerror=()=>{clearTimeout(to);res(null);};im.src=DEM_URL.replace('{z}',z).replace('{x}',t.x).replace('{y}',t.y);});
    return Promise.all(tiles.map(load)).then(arr=>{const got=arr.filter(Boolean);if(!got.length)return{ok:false,at:()=>null};
      const byKey=new Map();got.forEach(t=>byKey.set(t.x+','+t.y,t));
      function at(x,y){const ll=toLL(x,y);const fx=tx(ll[0]),fy=ty(ll[1]);const t=byKey.get(Math.floor(fx)+','+Math.floor(fy));if(!t)return null;
        const px=(fx-Math.floor(fx))*256,py=(fy-Math.floor(fy))*256;const i0=Math.min(255,Math.floor(px)),j0=Math.min(255,Math.floor(py)),i1=Math.min(255,i0+1),j1=Math.min(255,j0+1);const u=px-i0,v=py-j0;
        return t.el[j0*256+i0]*(1-u)*(1-v)+t.el[j0*256+i1]*u*(1-v)+t.el[j1*256+i0]*(1-u)*v+t.el[j1*256+i1]*u*v;}
      let mn=1e9,mx=-1e9;for(let x=-radius;x<=radius;x+=radius/10)for(let y=-radius;y<=radius;y+=radius/10){const e=at(x,y);if(e!=null){if(e<mn)mn=e;if(e>mx)mx=e;}}
      return{ok:true,at,min:mn,max:mx,tiles:got.length};});}
  /* domborzat-árnyékolás az alaptérképre (a lejtő látszik) */
  function addHillshade(map,opts){opts=opts||{};if(map.getSource('gv-dem'))return;
    try{map.addSource('gv-dem',{type:'raster-dem',tiles:[DEM_URL],encoding:'terrarium',tileSize:256,maxzoom:15,attribution:'Terrain: Mapzen/AWS'});
      const layers=map.getStyle().layers||[];let before=null;for(const l of layers){if(l.type==='line'||l.type==='symbol'){before=l.id;break;}}
      map.addLayer({id:'gv-hillshade',type:'hillshade',source:'gv-dem',paint:{'hillshade-exaggeration':opts.exaggeration||0.55,'hillshade-shadow-color':'#000000','hillshade-highlight-color':opts.highlight||'#6a8f9e','hillshade-accent-color':'#102a35','hillshade-illumination-direction':335}},before||undefined);}catch(e){}}

  /* ---------- magyar toldalék utcanevekhez: ra/re, n, ban/ben ---------- */
  function hu(name,kind){name=String(name||'').trim();if(!name)return '';const low=name.toLowerCase();
    const last=low.split(/\s+/).pop();const back=/[aáoóuú][^aáoóuúeéiíöőüű]*$/.test(last.replace(/[^a-záéíóöőúüű]/g,''))||!/[eéiíöőüű]/.test(last);
    const table={utca:{ra:'utcára',n:'utcán',ban:'utcában'},út:{ra:'útra',n:'úton',ban:'úton'},tér:{ra:'térre',n:'téren',ban:'téren'},köz:{ra:'közre',n:'közön',ban:'közben'},sor:{ra:'sorra',n:'soron',ban:'soron'},
      sétány:{ra:'sétányra',n:'sétányon',ban:'sétányon'},körút:{ra:'körútra',n:'körúton',ban:'körúton'},fasor:{ra:'fasorra',n:'fasoron',ban:'fasoron'},lakótelep:{ra:'lakótelepre',n:'lakótelepen',ban:'lakótelepen'},
      part:{ra:'partra',n:'parton',ban:'parton'},dűlő:{ra:'dűlőre',n:'dűlőn',ban:'dűlőn'},lépcső:{ra:'lépcsőre',n:'lépcsőn',ban:'lépcsőn'},rakpart:{ra:'rakpartra',n:'rakparton',ban:'rakparton'},udvar:{ra:'udvarra',n:'udvaron',ban:'udvarban'}};
    const t=table[last];if(t)return name.slice(0,name.length-last.length)+t[kind];
    const endsVowel=/[aáeéiíoóöőuúüű]$/.test(last);const stem=/[ae]$/.test(last)?name.slice(0,-1)+(last.endsWith('a')?'á':'é'):name;
    if(kind==='ra')return stem+(back?'ra':'re');if(kind==='n')return stem+(endsVowel?'n':(back?'on':(/[öőüű][^aáeéiíoóöőuúüű]*$/.test(last)?'ön':'en')));
    return stem+(back?'ban':'ben');}

  /* ---------- rétegkapcsoló: chip-sor, ami jelmagyarázat és kapcsoló egyben ----------
     layerControl({container, title, hint, layers:[{id,label,icon,color,title,on,apply(on)}], onChange(id,on,user)})
     → {el, set(id,on), get(id), all(), show(bool), refresh()}
     Minden chip egy role="switch" gomb: bekapcsolva a réteg színével kitöltött, pipás korong + színes keret;
     kikapcsolva üres karika, szürke ikon. Telefonon vízszintesen görgethető (a szél elhalványul, ha van még chip),
     szélesebb képernyőn tördelődik. A térképi munkát a réteg apply(on) függvénye végzi. */
  const LCSS=`.gvl{margin:0 0 10px}
.gvl-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:0 6px 7px;font:500 11px var(--mono,ui-monospace,monospace);letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#9BB7BC);text-shadow:0 1px 6px rgba(0,0,0,.9)}
.gvl-head small{font-size:11px;letter-spacing:.02em;text-transform:none;color:var(--faint,#7d979c);white-space:nowrap}
.gvl-row{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding:2px 2px 4px;-webkit-overflow-scrolling:touch}
.gvl-row::-webkit-scrollbar{display:none}
.gvl.fade-r .gvl-row{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 40px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 40px),transparent)}
.gvl.fade-l .gvl-row{-webkit-mask-image:linear-gradient(90deg,transparent,#000 40px);mask-image:linear-gradient(90deg,transparent,#000 40px)}
.gvl.fade-l.fade-r .gvl-row{-webkit-mask-image:linear-gradient(90deg,transparent,#000 40px,#000 calc(100% - 40px),transparent);mask-image:linear-gradient(90deg,transparent,#000 40px,#000 calc(100% - 40px),transparent)}
@media(min-width:640px){.gvl-row{flex-wrap:wrap;overflow:visible}.gvl.fade-l .gvl-row,.gvl.fade-r .gvl-row,.gvl.fade-l.fade-r .gvl-row{-webkit-mask-image:none;mask-image:none}}
.gvl-chip{flex:0 0 auto;scroll-snap-align:start;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 14px 0 9px;border-radius:100px;border:1.5px solid rgba(255,255,255,.16);
  background:rgba(6,17,22,.86);color:var(--muted,#9BB7BC);font:600 13px/1 var(--font,'Roboto',system-ui,sans-serif);cursor:pointer;white-space:nowrap;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  box-shadow:0 2px 10px rgba(0,0,0,.35);transition:background .2s,border-color .2s,color .2s,transform .12s;-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-user-select:none}
.gvl-chip:active{transform:scale(.96)}
.gvl-chip:focus-visible{outline:2px solid #fff;outline-offset:2px}
@media(hover:hover){.gvl-chip:hover{border-color:rgba(255,255,255,.4);color:#fff}.gvl-chip[aria-checked=true]:hover{filter:brightness(1.12)}}
@media(prefers-reduced-motion:reduce){.gvl-chip,.gvl-sw,.gvl-sw svg,.gvl-ic{transition:none}.gvl-chip.flash{animation:none}}
.gvl-chip[aria-checked=true]{background:var(--cbg);border-color:var(--c);color:#fff}
.gvl-sw{width:18px;height:18px;border-radius:50%;border:2px solid var(--c);opacity:.55;display:grid;place-items:center;flex:none;transition:background .2s,opacity .2s}
.gvl-sw svg{width:11px;height:11px;opacity:0;transition:opacity .15s}
.gvl-chip[aria-checked=true] .gvl-sw{background:var(--c);opacity:1}
.gvl-chip[aria-checked=true] .gvl-sw svg{opacity:1}
.gvl-ic{font-size:15px;line-height:1;filter:grayscale(1);opacity:.6;transition:filter .2s,opacity .2s}
.gvl-chip[aria-checked=true] .gvl-ic{filter:none;opacity:1}
.gvl-chip.flash{animation:gvl-flash .55s ease-out}
@keyframes gvl-flash{0%{box-shadow:0 0 0 0 var(--c)}100%{box-shadow:0 0 0 14px rgba(0,0,0,0)}}`;
  function hexRGBA(h,a){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';}
  function layerControl(opts){
    if(!document.getElementById('gvl-css')){const st=document.createElement('style');st.id='gvl-css';st.textContent=LCSS;document.head.appendChild(st);}
    const root=typeof opts.container==='string'?document.getElementById(opts.container):opts.container;
    root.innerHTML='';root.classList.add('gvl');root.setAttribute('role','group');root.setAttribute('aria-label',opts.title||'Térképi rétegek');
    const head=document.createElement('div');head.className='gvl-head';head.innerHTML='<span>'+(opts.title||'Rétegek')+'</span>'+(opts.hint?'<small>'+opts.hint+'</small>':'');root.appendChild(head);
    const row=document.createElement('div');row.className='gvl-row';root.appendChild(row);
    const CHECK='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5" fill="none" stroke="#06111a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const state={},chips={};
    opts.layers.forEach(l=>{const b=document.createElement('button');b.type='button';b.className='gvl-chip';b.dataset.id=l.id;b.setAttribute('role','switch');b.setAttribute('aria-checked','false');
      if(l.title)b.title=l.title;b.style.setProperty('--c',l.color);b.style.setProperty('--cbg',hexRGBA(l.color,.22));
      b.innerHTML='<span class="gvl-sw">'+CHECK+'</span>'+(l.icon?'<span class="gvl-ic" aria-hidden="true">'+l.icon+'</span>':'')+'<span class="gvl-lb">'+l.label+'</span>';
      b.addEventListener('click',()=>set(l.id,!state[l.id],true));row.appendChild(b);chips[l.id]=b;state[l.id]=false;});
    function set(id,on,user){const l=opts.layers.find(q=>q.id===id);if(!l)return;on=!!on;const changed=state[id]!==on;state[id]=on;const b=chips[id];b.setAttribute('aria-checked',on?'true':'false');
      if(changed&&on&&!user){b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash');}
      if(changed&&l.apply)l.apply(on);if(changed&&opts.onChange)opts.onChange(id,on,!!user);}
    function fades(){const ov=row.scrollWidth-row.clientWidth>4;root.classList.toggle('fade-l',ov&&row.scrollLeft>4);root.classList.toggle('fade-r',ov&&row.scrollLeft<row.scrollWidth-row.clientWidth-4);}
    row.addEventListener('scroll',fades,{passive:true});window.addEventListener('resize',fades);
    const api={el:root,set,get:id=>!!state[id],all:()=>Object.assign({},state),show(v){root.style.display=v===false?'none':'';if(v!==false)requestAnimationFrame(fades);},refresh:fades};
    opts.layers.forEach(l=>{if(l.on)set(l.id,true);});requestAnimationFrame(fades);return api;
  }

  window.GVMAP={STYLE_PRIMARY,STYLE_FALLBACK,setCenter,toXY,toLL,distSeg,pointInPoly,distToPoly,centroid,resolveCenter,loadOSM,parse,fromTiles,loadData,evaluators,treeValue,snapToRoad,heatGrid,polysFC,circleFC,pointsFC,clusterZones,createMap,add3D,whenIdle,layerControl,roadGraph,demLoad,addHillshade,hu,DEM_URL,query,get lastError(){return lastError;}};
})();
