# GEOVERN — Játékok (lakossági döntésjátékok)

Kilenc önálló, mobilra tervezett HTML-játék önkormányzatoknak, a lakosság szemléletformálására.
Belépő: `jatekok.html` (a főoldal „Játékok” menüpontja). A játékok a `jatekok/` mappában élnek,
mindegyik egyetlen HTML-fájl; közös modulok: `gv.js` (település, mentés, záró-panel), `gvmap.js` (térkép, OSM-adat),
beállítások: `config.js`.

| Fájl | Játék | Játékmód | Adat | Idő |
|---|---|---|---|---|
| `fak.html` | Hová ültetnél 5 fát? | bejelölés a valódi utcák mellé, két kör (vakon → adattal), a rétegek chip-kapcsolókkal; 3D nézet (`?fak=10`, `?3d=0` felülírás); a ⭐ **Legjobb helyek** réteg a rétegek metszete: sárga ragyogás a legértékesebb sávon + gyűrű a 8 legjobb helyen, amely bekapcsoláskor és a 2. kör elején háromszor „radar-pingel” — valódi térképi réteg (heatmap + circle), nem HTML-jelölő, így zoomolásra, mozgatásra a térképpel együtt mozog; a hőtérkép halvány része átlátszóbb; **rétegek bemutatója** a felfedéskor: előbb mind bekapcsol (a teljes kép), közben ~2 mp-ig a „RÉTEGEK” felirat ragyog és pulzál, aztán egyszerre mind kikapcsol ugyanazzal a mozdulattal, mint egy koppintás (lenyomás + villanás, a réteg kiúszik — `LC.demoAll(ids,on)`, `LC.glow(on)` a `gv.js`-ben), a végén minden ki; ha a játékos közben koppint, a bemutató megáll; a 2. körben, ha minden réteg ki van kapcsolva, a ⭐ Legjobb helyek bekapcsol; a gyűrűk legalább 35 m-re a szaggatott kerettől (ott nem lehet ültetni); **pontozás a település saját skáláján**: a legjobb (gyűrűs) hely 10 pont, a többi ehhez mérten (eddig a legjobb hely sok településen csak 7–8 pontot ért); **sötét / világos kapcsoló** a felső sávban (🌙 / ☀️): világosban OpenFreeMap Positron alaptérkép (tartalék: CARTO Positron), világos panel, chipek és jelölők, világos 3D-épületek, a játéktér szaggatott kerete vastagabb, sötétebb, fehér szegéllyel, a saját rétegek világos alapra hangolt színekkel; váltáskor a rétegek és a chipek állapota megmarad (`GVMAP.setMapTheme`), a választást a böngésző megjegyzi, `?tema=vilagos` / `?tema=sotet` felülírja | élő 3D térkép + a csempékből számolt rétegek | 2 perc |
| `fahely.html` | Hol fér el egy fa? | két kör egy **rögzített, valós utcán** (Diósd, Kossuth Lajos utca, 216 m): előbb tipp a szabad terület arányára és öt fa adat nélkül, aztán négy lépcsőben derül ki, mit enged az utca (közlekedés → telek és felszín → föld fölött → föld alatt) — a játékos fái mért távolsággal esnek ki („Gázvezeték 0,6 m — kell 2,0 m”), a szabad terület zöld foltja lépcsőnként zsugorodik; végül ugyanez adattal (a koppintás ujjnyi tűréssel a legközelebbi szabad ponthoz igazodik). Bármely pontra koppintva vizsgálólap: keresztmetszet a közművekkel és védősávjukkal + a mért okok. A záróképernyő a 106 tételes paraméterkatalógus minden elemét szerep szerint felsorolja. **Nem település-paraméteres**: az adatcsomagot a `data/fahely-<id>.json` adja; a szabályértékek (jellemző értékek, forrással) az adatcsomag `rules` táblájában, a számítás a `fahely-engine.js`-ben (ugyanaz a kód számolja az adatcsomagot és vizsgálja a koppintást) | valós adat: utca, behajtók, kerítések, járdák, parkolók, oszlopok, légvezeték, fák — OpenStreetMap; közművek — az e-közmű lakossági térképének képernyőképeiből vektorizálva (tájékoztató jellegű, a játék ki is írja) | 4–5 perc |
| `esokert.html` | Esőkert vagy csatorna? | csúszkás keretosztás (a kép a képernyő tetején ragad, a csúszkák alatta, húzás közben a DOM nem épül újra) + vihar-szimuláció; a mérőhálózat **egyirányú döntés** („Telepítem” gomb, 10 M a keretből, utána is marad — újratervezésnél is); minden csúszka alatt jobbra **„1 liter ára”** nagy betűvel: mérés nélkül „? Ft / liter”, méréssel a mért ár (esőkert 38 · nagyobb cső 67 · áteresztő burkolat 70 · zöldtető 111 Ft / liter, a legolcsóbb kiemelve); a mérés doboza és a diagram helye eleve megvan (a diagram mérés nélkül zárva: „mérés nélkül nem látszik”), így a gombnyomásra semmi nem mozdul az oldalon; a vihar csak beavatkozással indítható; az eredmény is Ft / literben | generált utcametszet-kép (`img/esokert-metszet.jpg`, az ég levágva, 1200×807), rajta a beavatkozások rajzolt rétege: nagyobb cső, új esőkertek, áteresztő parkoló, zöldtető + ciszterna, víz a felszínen és a pincében; a kép alatt a terv összefoglaló sora | 2–3 perc |
| `iskolautca.html` | Iskolautca | A/B/C döntések + veszélypont-bejelölés; a felfedés után a két réteg és a pontok a közös chip-sorral kapcsolhatók; a 2. körben külön, kiemelt kérdés („Hová mutatnál most?”) és „ELSŐ TIPP” címke a képen; a 3. kérdés B változata a parkolóra mutat | generált madártávlati kép (`img/iskolautca-terkep.jpg`) a hat ponttal, félelem-körök és balesetpontok rajta + mért bizonyítékok | 2–3 perc |
| `ugyanaz-az-utca.html` | Ugyanaz az utca | zónaválasztás három körben | élő 3D térkép, a település adottságaiból képzett, nevesített amőba-zónák | 2 perc |
| `karcsu.html` | Karcsú vagy túlméretezett? | gyors párválasztás, 10 mp; a nyerő kártya pontosan az esetek felében balra, véletlen sorrendben | nagyságrendi költségek | 2 perc |
| `lassit-es-mer.html` | Lassít és mér | döntés → 12 hetes szimuláció → újradöntés | idősor-diagram | 3 perc |
| `zold-varosresz.html` | Zöld városrész — 12 hónap | építés + havi események + rejtett rétegek | rácsos városrész (8×6), mérés fedi fel | 5–8 perc |
| `ugymenet.html` | Ügymenet | Pipedrive-szerű tábla: a kártyákat húzod balról jobbra (beérkezett → adat → döntés → végrehajtás → mérve); **hetente 5 lépés** — nem jut minden ügyre, választani és kockáztatni kell (vakon dönteni egy lépéssel gyorsabb) | rejtett hatás, látható hangerő | 3–4 perc |

Egységes GEOVERN-arculat (sötét petrol, teal, amber, Roboto); csak a Google Fonts és — a három térképes játéknál — a MapLibre a külső függőség.

## Krízishét (`../jatek-swipe.html`) — v3.3-tól valós adaton

A főoldal „Krízisjáték” menüpontja. Öt nap, öt balra-jobbra döntés; a forgatókönyvek a sorsolt település valódi adatából épülnek:
a `gvmap.js` kiolvassa a csempékből az utcákat névvel (`transportation_name`), a vízfolyásokat, a településpontot, az épületeket, az intézményeket,
a domborzatot pedig Terrarium-csempékből (AWS Terrain Tiles, kulcs nélkül, `GV_CONFIG.DEM_URL`-lel átírható). Napok: **hétfő** — a legnagyobb egyirányú
szintkülönbségű utca a „lejtő” (a kártya nevén nevezi), a károk a lejtő alsó felén, az elöntés a mélypont körül, a lakossági követelés a tényleges főutca
nevével; **kedd** — a központhoz legközelebbi iskola, a tőle 150–650 m-re lévő főúti csomópont a balesetgóc, a gyaloglás és az iskolautak az utcahálózaton;
**szerda** — a légvezeték az utcák mentén fut a központból kifelé, a viharzóna az erdőhöz legközelebbi két külső szakasz; **csütörtök** — hőgóc a burkolt,
sok épületes, zöld nélküli részen (legalább 250 m-re a főtértől), a 75+ réteg a magas házak csoportja, a gondozók valós intézmények; **péntek** — a három
zóna metszete. Minden nap az első kártyánál a problémás terület látszik (szaggatott körvonal + jelölő, adatréteg nélkül; kedden az iskola jelölője kattintható buborékkal), a 2. fázisban jönnek a rétegek, a kamera mindig repül (sosem ugrik); a ✓/✗ döntésjelek csak a hét végi nézetben látszanak; a helyes válasz oldala napról napra véletlen; a rétegsáv a kártya fölött, a közös chip-sor (`GV.layerControl`); a hőtérkép a település saját skáláján (zöld faluban is látszik).
Településlista típusonként (domborzatos, patakos helyek: Tihany, Nagymaros, Zebegény, Pilisborosjenő · Kőszeg, Zirc, Pilisvörösvár, Budakeszi · Veszprém, Eger,
Szentendre, Budaörs · Pécs, Miskolc, Sopron, Kaposvár); induláskor a játék ellenőrzi az adatot (utcák, nevek, iskola, lejtő), és ha hiányos, a lista következő
tagját sorsolja; ha a csempék nem jönnek, az illusztratív minta fut. A rangsor-webhook változatlan (`mode: osm|legacy` mező került a sorba).

## Település-paraméter

Minden oldal elfogadja a `?telepules=Pápa` (vagy `?t=Pápa`) paramétert:

- a hub és a játékok kiírják a nevet,
- a térképes játékok a település középpontjára állnak: kb. 130 magyar település koordinátája a `gv.js` táblájában (+ Graz, Bécs, Innsbruck); ismeretlen névnél Nominatim-geokódolás (egyszer, utána a böngésző megjegyzi) — világszerte keres (London, New York is jó), azonos névnél a magyar települést részesíti előnyben, utcát/házszámot nem fogad el településnek; a gyorsítótár-kulcs `gv-geo2-` (a korábbi, országra szűkített, néha téves találatok nem élnek tovább),
- **paraméter nélkül a bemutató-település Pápa** (a `config.js` `TOWN_DEFAULT` mezőjével átírható); a játék ilyenkor jelzi, hogy bemutató-településen fut,
- a név a böngészőben megmarad, a játékok közti linkek viszik.

Egy önkormányzatnak kiadva: `https://geovern.com/jatekok.html?telepules=Pápa` → QR-kód.

## Térkép és OSM-adat (gvmap.js)

- **Alaptérkép:** OpenFreeMap „dark” vektoros stílus (`https://tiles.openfreemap.org/styles/dark`) — ingyenes, kulcs és forgalmi limit nélkül, kereskedelmi használatra is. A `config.js` `BASEMAP: 'carto'` + `CARTO_KEY` beállítással a CARTO dark-matter az elsődleges; a másik stílus mindkét esetben automatikus tartalék.
- **3D épületek:** a zónás játék a vektorcsempék `building` rétegéből húzza fel az épületeket (fill-extrusion), döntött nézetben.
- **Utcák, vasút, víz, zöld, burkolt felületek, intézmények, boltok — a csempékből:** a térkép betöltése után a játék a már letöltött vektorcsempékből olvassa ki (`querySourceFeatures`) a `transportation`, `water`, `park`, `landcover`, `landuse`, `poi` és `building` rétegeket. Nulla extra hálózati hívás, másodperceken belül kész, és pontosan arra a térképre illeszkedik, amit a játékos lát.
- **Tartalék sorrend**, ha a csempékből kevés utca jön (nagyon kis település, vagy a térképszolgáltató nem elérhető): `data/<település>.json` statikus fájl → böngésző-gyorsítótár (7 nap) → élő Overpass-lekérdezés (két tükör, POST, 40 mp időkorlát) → illusztratív minta-rétegek (a játék akkor is működik, és kiírja, hogy mintán fut).
- **Rétegek az adatból:** hőség (burkolt felület, útsűrűség, zöld és víz hiánya), sérülékeny lakók (bölcsőde, óvoda, iskola, idősotthon, rendelő, kórház), gyalogos forgalom (boltok, főutak), lombkorona (parkok, erdők, gyep).
- **Rétegkapcsoló (v3.2, v3.4-től a `gv.js`-ben: `GV.layerControl`, minden játékban ugyanaz — fák, Krízishét, Iskolautca):** az 1. kör kiértékelése után a panel fölött egy chip-sor jelenik meg, ami jelmagyarázat és kapcsoló egyben: 🔥 Hőség, 🧒 Sérülékeny lakók, 🌳 Meglévő zöld, 🛍️ Gyalogos forgalom, 📍 1. kör fái. Bekapcsolva a chip a réteg színével kitöltött, pipás korongot és színes keretet kap, kikapcsolva üres karikát és szürke ikont. Alapból a hőség, a sérülékeny lakók, a meglévő zöld és az első kör fái látszanak (egymás után úsznak be), a boltok nem — így a térkép nem zsúfolt, és minden réteg egy koppintással külön is megnézhető. Telefonon a sor vízszintesen görgethető, szélesebb képernyőn tördelődik. A játék rögzíti, melyik réteget hányszor kapcsolta a játékos (`toggles`) és a záró állapotot (`layers`). A komponens a zónás játékhoz is használható.
- **Fa-elhelyezés:** csak utca mellé kerülhet (a legközelebbi úthoz igazítva, 7–9 m-rel a tengelytől), vízre, vasútra, úttól 70 m-nél távolabb soha; a játék rövid üzenettel elutasítja. A fa a jelölőre koppintva kivehető.
- **Zónák (Ugyanaz az utca):** az úthálózat pontjaiból k-means klaszterezés, a magok a település adottságai (iskola, bölcsőde/rendelő, legnagyobb park, ipari terület, boltok súlypontja, vízpart) → amőba-poligonok, a vízből kiszorítva, a tartalomról elnevezve (Iskola környéke, Park, Vízpart, Ipari terület, Belváros–piac, Lakótelep, Kertváros…).
- **Előkészített adat (opcionális):** `jatekok/osm-cache.html` → település → JSON letöltés → `jatekok/data/<település>.json` (ékezet nélkül, kisbetűvel: `papa.json`, `szekesfehervar.json`). Csak a tartalék-ághoz kell.

## Szolgáltatói limitek (2026. október, ellenőrzött feltételek)

| Szolgáltatás | Ingyenes keret | Mire figyelj |
|---|---|---|
| OpenFreeMap (alaptérkép + az adat forrása) | nincs kérés- vagy nézetlimit, kulcs nélkül, kereskedelmi használat engedett | adományból fut, nincs SLA, „bármikor megszűnhet” → a CARTO-tartalék automatikus |
| CARTO basemaps (tartalék vagy elsődleges) | kereskedelmi használatra 1 M csempe/hó (2026. dec. 1-től), nem kereskedelmire 5 M; ingyenes kulcs + attribúció kell | 100 csempe/betöltésnél ≈ 330 betöltés/nap a kereskedelmi plafon; felette 500 USD/hó; a kulcs a `config.js` `CARTO_KEY` mezője |
| Overpass API (csak tartalék) | irányelv: ~10 000 kérés és ~1 GB letöltés/nap felhasználónként (IP), 429-cel lassít | normál üzemben nem fut; ha mégis, egy lekérdezés 0,3–1 MB, a böngésző 7 napig cache-el |
| Nominatim (geokódolás ismeretlen névre) | max. 1 kérés/mp, azonosítható kérés, cache kötelező | csak a táblán kívüli nevekre fut, egyszer; önkormányzati kiadásnál a név a táblában van |
| Google Fonts | korlátlan | — |
| GitHub Pages | 100 GB/hó lágy sávszélesség-limit, 1 GB méret | nem kereskedelmi SaaS-hostingra való; saját tárhely bármikor átveheti (statikus fájlok) |
| Apps Script (opcionális adatgyűjtés) | 30 párhuzamos futás, 6 perc/futás; napi néhány száz POST bőven belefér | — |

Néhány száz játék/nap mindegyik szolgáltatásnál az ingyenes sávban marad; a tényleges határ a CARTO (ha az OpenFreeMap kiesne, vagy ha azt állítod elsődlegesnek).

## Adatgyűjtés

A játékok névtelenek. Minden lejátszás végén egy JSON-sor keletkezik (játék, település, döntések, pontszám, névtelen munkamenet-azonosító).
(A „Változott a véleményed?” kérdés v3.5.4-től kikerült a záró panelből; a `GV.opinion` függvény megmaradt, ha később visszakerülne.)

- **Alapállapot (config.js: `WEBHOOK: ''`)** — minden a játékos böngészőjében marad (`localStorage`, max. 500 sor); a `jatekok.html` alján CSV-ként exportálható.
- **Központi gyűjtés** — telepítsd az `apps-script/Code.gs`-t (5 perc, a fájl tetején leírva), és írd be a kapott `/exec` URL-t a `config.js` `WEBHOOK` mezőjébe.

| Játék | Mezők |
|---|---|
| fak | mód (osm/minta), adatforrás (csempék/Overpass/fájl), középpont, vak és adatos pontszám, az 5+5 fa helye (méter a központhoz képest), fák száma, 3D |
| fahely | adatcsomag-azonosító, tipp (%) és a valós arány, a vak öt fa helye + melyik lépcső és melyik szabály zárta ki, az adatos öt fa helye, koronaosztálya, próbálkozások száma, rétegkapcsolások, időtartam; külön sorban (velemeny) a „melyik lépcső lepett meg” válasz |
| esokert | próbánként: keretosztás, mérés igen/nem, felszíni víz, kapacitás, hűsítés, átfutás |
| iskolautca | észlelt veszélypont, döntés, „hová tűnnek az autók”, „mit javít”, támogatás, mit mérnének, pontszám |
| ugyanaz | mód, a három kör zónaválasztása, a metszet-zóna neve, pontszám |
| karcsu | mind a 8 pár válasza (melyik oldalon volt), idő, találatok |
| lassit | első beavatkozás, mérés igen/nem, mért hatás, második beavatkozás, pontszám |
| zold | pontszám és részpontok, adattal költött arány, kockázatcsökkentés, elhelyezések, károk, tározó |
| ugymenet | pontszám és részpontok, adattal hozott döntések aránya, mért lezárások, hangos-de-haszontalan költés, ügyenkénti állapot |
| velemeny | melyik játék után, válasz: igen / részben / nem |

## Testreszabás

- Szövegek, kártyák, számok: mindegyik játék fájljának elején egy adatblokk (`Q2…`, `P`, `I`, `ITEMS`, `CASES`, `R`) — ezeket kell átírni egy tematikus paklihoz.
- Esőkert-játék háttérképe: ha létezik `img/esokert-metszet.jpg`, a játék azt teszi a metszet mögé, és csak a dinamikus elemeket (víz, eső, esőkertek, cső) rajzolja rá. A kép kompozíciója a `scene()` függvény koordinátáit kövesse: bal oldalt ház pincével, járda, zöldsáv, út, jobb oldalt középület; a föld alatt csatorna.
- A `zold-varosresz.html` városrésze a `LAYOUT` sorokból épül (8×6, betűnként egy tömbtípus).
- Képek: `img/` (1280 px széles JPEG-ek, a projekt generált látványképeiből).
- Frissítéskor a `?v=15` a script-hivatkozásokban a böngésző-gyorsítótárat kerüli meg; új `gv.js`/`gvmap.js` kiadásánál a számot emeld.
