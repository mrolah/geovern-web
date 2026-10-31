/* =====================================================================
   GEOVERN játékok — közös modul (gv.js)
   · település az URL-ből (?telepules=Pápa vagy ?t=Pápa), koordinátával
   · névtelen munkamenet-azonosító
   · eredmények mentése: localStorage (mindig) + opcionális webhook (config.js)
   · CSV-export az összes helyben mentett eredményről
   · közös záró-panel: „Változott a véleményed?”, megosztás, következő játék
   A fájl nem függ semmitől; a config.js előtte töltődik be (ha hiányzik, üres config).
   ===================================================================== */
(function(){
  const CFG = Object.assign({WEBHOOK:'',TOWN_DEFAULT:'',ORG:''}, window.GV_CONFIG||{});
  const LS_RESULTS='gv-results', LS_TOWN='gv-town', LS_SID='gv-sid';

  /* ---- települések (név → [lon, lat]); az ismeretlen név is működik, csak a térkép középpontja alapértelmezett ---- */
  const TOWNS={
    'budaors':[18.959,47.461],'torokbalint':[18.912,47.429],'godollo':[19.360,47.596],'vac':[19.134,47.776],
    'budapest':[19.0546,47.4979],'ujpest':[19.090,47.560],'rakospalota':[19.120,47.560],'kispest':[19.140,47.450],
    'iv. kerulet':[19.090,47.560],'xv. kerulet':[19.120,47.560],'xix. kerulet':[19.140,47.450],
    'dunaujvaros':[18.940,46.960],'papa':[17.470,47.330],'cegled':[19.800,47.170],
    'balatonfured':[17.889,46.958],'koszeg':[16.541,47.389],'tata':[18.323,47.653],
    'alsomocsolad':[18.243,46.312],'tihany':[17.889,46.913],'holloko':[19.586,48.089],
    'debrecen':[21.627,47.532],'szeged':[20.148,46.253],'gyor':[17.635,47.684],'pecs':[18.230,46.070],
    'miskolc':[20.780,48.100],'szekesfehervar':[18.410,47.190],'kecskemet':[19.690,46.900],
    'nyiregyhaza':[21.720,47.950],'szombathely':[16.620,47.230],'sopron':[16.590,47.680],'eger':[20.370,47.900],
    'veszprem':[17.910,47.090],'zalaegerszeg':[16.840,46.840],'kaposvar':[17.800,46.360],'bekescsaba':[21.090,46.680],
    'szolnok':[20.180,47.170],'tatabanya':[18.400,47.580],'erd':[18.910,47.380],'budakeszi':[18.930,47.510],
    'szentendre':[19.070,47.670],'dunakeszi':[19.140,47.630],'fot':[19.190,47.610],'god':[19.130,47.690],
    'vecses':[19.280,47.410],'budakalasz':[19.050,47.620],'mosonmagyarovar':[17.270,47.870],'keszthely':[17.250,46.770],
    'siofok':[18.060,46.910],'esztergom':[18.740,47.790],'salgotarjan':[19.800,48.100],'hodmezovasarhely':[20.330,46.420],
    'nagykanizsa':[17.000,46.460],'baja':[18.960,46.180],'gyula':[21.280,46.650],'sarvar':[16.940,47.250],
    'kormend':[16.610,47.010],'szentgotthard':[16.270,46.950],'celldomolk':[17.150,47.260],'csorna':[17.250,47.610],
    'kapuvar':[17.030,47.590],'komarom':[18.120,47.740],'oroszlany':[18.310,47.490],'bicske':[18.640,47.490],
    'szigetszentmiklos':[19.040,47.340],'monor':[19.450,47.350],'hatvan':[19.680,47.670],'jaszbereny':[19.910,47.500],
    'ajka':[17.560,47.100],'varpalota':[18.140,47.200],'mor':[18.210,47.380],'paks':[18.860,46.620],'szekszard':[18.710,46.350],
    'kalocsa':[18.980,46.530],'mako':[20.480,46.220],'oroshaza':[20.670,46.570],'szarvas':[20.550,46.860],
    'karcag':[20.930,47.320],'hajduszoboszlo':[21.390,47.440],'hajduboszormeny':[21.510,47.670],'kisvarda':[22.080,48.220],
    'mateszalka':[22.320,47.950],'sarospatak':[21.570,48.320],'kazincbarcika':[20.620,48.250],'ozd':[20.290,48.220],
    'balassagyarmat':[19.290,48.080],'gyongyos':[19.930,47.780],'dorog':[18.730,47.720],'pilisvorosvar':[18.910,47.620],
    'pomaz':[19.020,47.640],'dabas':[19.310,47.190],'gyal':[19.220,47.390],'kiskunhalas':[19.490,46.430],
    'kiskunfelegyhaza':[19.850,46.710],'nagykoros':[19.780,47.030],'szazhalombatta':[18.930,47.320],'rackeve':[18.940,47.160],
    'mohacs':[18.680,45.990],'szigetvar':[17.800,46.050],'komlo':[18.260,46.190],'dombovar':[18.140,46.380],
    'bonyhad':[18.530,46.300],'marcali':[17.410,46.580],'lenti':[16.540,46.620],'tapolca':[17.440,46.880],
    'balatonalmadi':[18.020,47.030],'fonyod':[17.560,46.730],'graz':[15.440,47.070],'wien':[16.370,48.210],'becs':[16.370,48.210],
    'innsbruck':[11.390,47.270]
  };
  const DEFAULT_CENTER=[19.04,47.50];

  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/ő|ö/g,'o').replace(/ű|ü/g,'u').replace(/[^a-z0-9. ]+/g,' ').replace(/\s+/g,' ').trim();}
  function cap(s){s=String(s||'').trim().replace(/\s+/g,' ');return s.charAt(0).toUpperCase()+s.slice(1);}

  function readTown(){
    const q=new URLSearchParams(location.search);
    let t=q.get('telepules')||q.get('t')||'';
    t=t.replace(/[<>"']/g,'').slice(0,40).trim();
    if(t){try{localStorage.setItem(LS_TOWN,t);}catch(e){}}
    else{try{t=localStorage.getItem(LS_TOWN)||'';}catch(e){}}
    if(!t)t=CFG.TOWN_DEFAULT||'';
    const key=norm(t);
    const c=TOWNS[key]||null;
    return {name:t?cap(t):'', key, center:c||DEFAULT_CENTER, known:!!c, generic:!t};
  }
  const TOWN=readTown();

  function sid(){let s='';try{s=localStorage.getItem(LS_SID)||'';}catch(e){}
    if(!s){s=Math.random().toString(36).slice(2,10)+Date.now().toString(36);try{localStorage.setItem(LS_SID,s);}catch(e){}}return s;}

  /* ---- eredmény rögzítése ---- */
  function record(game,data){
    const row=Object.assign({ts:new Date().toISOString(),sid:sid(),game,town:TOWN.name||'',ua:navigator.userAgent.slice(0,80)},data||{});
    try{const a=JSON.parse(localStorage.getItem(LS_RESULTS)||'[]');a.push(row);while(a.length>500)a.shift();
      localStorage.setItem(LS_RESULTS,JSON.stringify(a));}catch(e){}
    if(CFG.WEBHOOK){
      try{const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),8000);
        fetch(CFG.WEBHOOK,{method:'POST',body:JSON.stringify(row),signal:ctrl.signal}).then(()=>clearTimeout(to)).catch(()=>{});}catch(e){}
    }
    return row;
  }
  function results(){try{return JSON.parse(localStorage.getItem(LS_RESULTS)||'[]');}catch(e){return [];}}
  function clearResults(){try{localStorage.removeItem(LS_RESULTS);}catch(e){}}

  /* ---- CSV: az összes helyben mentett eredmény, laposított mezőkkel ---- */
  function flat(obj,prefix,out){out=out||{};Object.keys(obj).forEach(k=>{const v=obj[k],key=prefix?prefix+'.'+k:k;
    if(v&&typeof v==='object'&&!Array.isArray(v))flat(v,key,out);
    else if(Array.isArray(v))out[key]=JSON.stringify(v);else out[key]=v;});return out;}
  function toCSV(rows){const fr=rows.map(r=>flat(r));const cols=[];fr.forEach(r=>Object.keys(r).forEach(k=>{if(!cols.includes(k))cols.push(k);}));
    const q=v=>{v=v==null?'':String(v);return /[",;\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
    return '﻿'+cols.join(';')+'\n'+fr.map(r=>cols.map(c=>q(r[c])).join(';')).join('\n');}
  function exportCSV(){const rows=results();if(!rows.length){alert('Még nincs helyben mentett eredmény.');return;}
    const blob=new Blob([toCSV(rows)],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='geovern-jatekok-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}

  /* ---- játéklista (a hub és a „következő játék” gomb ebből él) ---- */
  const GAMES=[
    {id:'fak',file:'jatekok/fak.html',n:'Hová ültetnél 10 fát?',min:'2–3 perc'},
    {id:'esokert',file:'jatekok/esokert.html',n:'Esőkert vagy csatorna?',min:'2–3 perc'},
    {id:'iskolautca',file:'jatekok/iskolautca.html',n:'Iskolautca',min:'2–3 perc'},
    {id:'ugyanaz',file:'jatekok/ugyanaz-az-utca.html',n:'Ugyanaz az utca',min:'2 perc'},
    {id:'karcsu',file:'jatekok/karcsu.html',n:'Karcsú vagy túlméretezett?',min:'2 perc'},
    {id:'lassit',file:'jatekok/lassit-es-mer.html',n:'Lassít és mér',min:'3 perc'},
    {id:'zold',file:'jatekok/zold-varosresz.html',n:'Zöld városrész — 12 hónap',min:'5–8 perc'},
    {id:'ugymenet',file:'jatekok/ugymenet.html',n:'Ügymenet',min:'3–4 perc'}
  ];
  const inSub=/\/jatekok\//.test(location.pathname);
  function qs(){return TOWN.name?('?telepules='+encodeURIComponent(TOWN.name)):'';}
  function urlFor(file){return (inSub?'../':'')+file+qs();}
  function hubUrl(){return (inSub?'../':'')+'jatekok.html'+qs();}
  function nextGame(id){const i=GAMES.findIndex(g=>g.id===id);return GAMES[(i+1)%GAMES.length];}

  /* ---- közös záró-panel ---- */
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function endPanel(opts){
    /* opts: {game, title, lead, share, onOpinion} — visszaad egy HTML-stringet; a gombok a GV.* függvényeket hívják */
    const nx=nextGame(opts.game);
    return `<div class="gv-end" data-game="${esc(opts.game)}">
      <div class="gv-end-q">Változott a véleményed a játék alatt?</div>
      <div class="gv-end-ops">
        <button type="button" onclick="GV.opinion(this,'igen')">Igen, másképp látom</button>
        <button type="button" onclick="GV.opinion(this,'reszben')">Részben</button>
        <button type="button" onclick="GV.opinion(this,'nem')">Nem, eddig is így gondoltam</button>
      </div>
      <div class="gv-end-row">
        <button type="button" class="gv-share" onclick="GV.share(${JSON.stringify(opts.share||'')})">Megosztom</button>
        <a class="gv-next" href="${esc(urlFor(nx.file))}">Következő: ${esc(nx.n)} →</a>
      </div>
      <a class="gv-hub" href="${esc(hubUrl())}">← Vissza a játékokhoz</a>
      <div class="gv-note">Névtelen játék. Az eredmény a te böngésződben mentődik${CFG.WEBHOOK?' és névtelenül a kiadóhoz is eljut':''}.</div>
    </div>`;
  }
  function opinion(btn,v){const box=btn.closest('.gv-end');box.querySelectorAll('.gv-end-ops button').forEach(b=>b.classList.toggle('on',b===btn));
    record('velemeny',{about:box.dataset.game,changed:v});
    const q=box.querySelector('.gv-end-q');q.textContent='Köszönjük — ez is adat: így tudja meg a település, mi győz meg.';}
  function share(text){const url=location.href.split('#')[0];const t=(text||document.title)+' — '+url;
    if(navigator.share){navigator.share({title:document.title,text:text||document.title,url}).catch(()=>{});}
    else if(navigator.clipboard){navigator.clipboard.writeText(t).then(()=>alert('Link a vágólapon.')).catch(()=>prompt('Másold ki:',t));}
    else prompt('Másold ki:',t);}

  /* ---- közös stílus a záró-panelhez (a játékok saját színeit a CSS-változókon át veszi) ---- */
  const css=`.gv-end{margin-top:14px;padding-top:14px;border-top:1px dashed var(--gv-line,rgba(128,128,128,.35))}
  .gv-end-q{font-weight:700;margin-bottom:8px}
  .gv-end-ops{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
  .gv-end-ops button{font:600 13px/1.2 inherit;padding:9px 12px;border-radius:100px;border:1.5px solid var(--gv-line,rgba(128,128,128,.4));
    background:transparent;color:inherit;cursor:pointer}
  .gv-end-ops button.on{background:var(--gv-accent,#2AD1B5);color:var(--gv-accent-ink,#04211d);border-color:var(--gv-accent,#2AD1B5)}
  .gv-end-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
  .gv-share{font:700 14px inherit;padding:11px 16px;border-radius:12px;border:none;cursor:pointer;background:var(--gv-accent,#2AD1B5);color:var(--gv-accent-ink,#04211d)}
  .gv-next{font:700 14px inherit;padding:11px 14px;border-radius:12px;border:1.5px solid var(--gv-line,rgba(128,128,128,.4));color:inherit;text-decoration:none}
  .gv-hub{display:inline-block;font:500 13px inherit;color:inherit;opacity:.75;text-decoration:none;margin-top:2px}
  .gv-note{font-size:11.5px;opacity:.6;margin-top:10px;line-height:1.4}
  .gv-town{font-weight:700}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  /* ---- {town} helyettesítés a DOM-ban: <span data-town></span> ---- */
  function fillTown(){const n=TOWN.name||'a település';document.querySelectorAll('[data-town]').forEach(el=>{el.textContent=n;});
    document.querySelectorAll('[data-town-hide]').forEach(el=>{if(!TOWN.name)el.style.display='none';});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fillTown);else fillTown();

  window.GV={CFG,TOWN,GAMES,sid,record,results,clearResults,exportCSV,toCSV,urlFor,hubUrl,nextGame,endPanel,opinion,share,esc,fillTown,
    rng(seed){let t=0;for(let i=0;i<seed.length;i++)t=(t*31+seed.charCodeAt(i))>>>0;return()=>{t+=0x6D2B79F5;let r=Math.imul(t^t>>>15,1|t);
      r^=r+Math.imul(r^r>>>7,61|r);return((r^r>>>14)>>>0)/4294967296;};},
    fmtFt(m){return (m>=1000?(m/1000).toFixed(m%1000?1:0).replace('.',',')+' Mrd':m+' M')+' Ft';}
  };
})();
