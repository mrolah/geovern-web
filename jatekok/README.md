# GEOVERN — Játékok (lakossági döntésjátékok)

Nyolc önálló, mobilra tervezett HTML-játék önkormányzatoknak, a lakosság szemléletformálására.
Belépő: `jatekok.html` (a főoldal „Játékok” menüpontja). A játékok a `jatekok/` mappában élnek,
mindegyik egyetlen HTML-fájl; közös modulok: `gv.js` (település, mentés, záró-panel), `gvmap.js` (térkép, OSM-adat),
beállítások: `config.js`.

| Fájl | Játék | Játékmód | Adat | Idő |
|---|---|---|---|---|
| `fak.html` | Hová ültetnél 10 fát? | bejelölés a valódi utcák mellé, két kör (vakon → adattal) | élő térkép + a csempékből számolt rétegek | 2–3 perc |
| `esokert.html` | Esőkert vagy csatorna? | csúszkás keretosztás + vihar-szimuláció | sematikus utcametszet (generált háttérkép fogadására kész) | 2–3 perc |
| `iskolautca.html` | Iskolautca | A/B/C döntések + veszélypont-bejelölés | vázlat-térkép + mért bizonyítékok | 2–3 perc |
| `ugyanaz-az-utca.html` | Ugyanaz az utca | zónaválasztás három körben | élő 3D térkép, a település adottságaiból képzett, nevesített amőba-zónák | 2 perc |
| `karcsu.html` | Karcsú vagy túlméretezett? | gyors párválasztás, 10 mp, véletlen kártyasorrend | nagyságrendi költségek | 2 perc |
| `lassit-es-mer.html` | Lassít és mér | döntés → 12 hetes szimuláció → újradöntés | idősor-diagram | 3 perc |
| `zold-varosresz.html` | Zöld városrész — 12 hónap | építés + havi események + rejtett rétegek | rácsos városrész (8×6), mérés fedi fel | 5–8 perc |
| `ugymenet.html` | Ügymenet | Pipedrive-szerű tábla: a kártyákat húzod balról jobbra (beérkezett → adat → döntés → végrehajtás → mérve) | rejtett hatás, látható hangerő | 3–4 perc |

Egységes GEOVERN-arculat (sötét petrol, teal, amber, Roboto); csak a Google Fonts és — a két térképes játéknál — a MapLibre a külső függőség.

## Település-paraméter

Minden oldal elfogadja a `?telepules=Pápa` (vagy `?t=Pápa`) paramétert:

- a hub és a játékok kiírják a nevet,
- a térképes játékok a település középpontjára állnak: kb. 130 magyar település koordinátája a `gv.js` táblájában (+ Graz, Bécs, Innsbruck); ismeretlen névnél Nominatim-geokódolás (egyszer, utána a böngésző megjegyzi),
- **paraméter nélkül a bemutató-település Pápa** (a `config.js` `TOWN_DEFAULT` mezőjével átírható); a játék ilyenkor jelzi, hogy bemutató-településen fut,
- a név a böngészőben megmarad, a játékok közti linkek viszik.

Egy önkormányzatnak kiadva: `https://geovern.com/jatekok.html?telepules=Pápa` → QR-kód.

## Térkép és OSM-adat (gvmap.js)

- **Alaptérkép:** OpenFreeMap „dark” vektoros stílus (`https://tiles.openfreemap.org/styles/dark`) — ingyenes, kulcs és forgalmi limit nélkül, kereskedelmi használatra is. A `config.js` `BASEMAP: 'carto'` + `CARTO_KEY` beállítással a CARTO dark-matter az elsődleges; a másik stílus mindkét esetben automatikus tartalék.
- **3D épületek:** a zónás játék a vektorcsempék `building` rétegéből húzza fel az épületeket (fill-extrusion), döntött nézetben.
- **Utcák, vasút, víz, zöld, burkolt felületek, intézmények, boltok — a csempékből:** a térkép betöltése után a játék a már letöltött vektorcsempékből olvassa ki (`querySourceFeatures`) a `transportation`, `water`, `park`, `landcover`, `landuse`, `poi` és `building` rétegeket. Nulla extra hálózati hívás, másodperceken belül kész, és pontosan arra a térképre illeszkedik, amit a játékos lát.
- **Tartalék sorrend**, ha a csempékből kevés utca jön (nagyon kis település, vagy a térképszolgáltató nem elérhető): `data/<település>.json` statikus fájl → böngésző-gyorsítótár (7 nap) → élő Overpass-lekérdezés (két tükör, POST, 40 mp időkorlát) → illusztratív minta-rétegek (a játék akkor is működik, és kiírja, hogy mintán fut).
- **Rétegek az adatból:** hőség (burkolt felület, útsűrűség, zöld és víz hiánya), sérülékeny lakók (bölcsőde, óvoda, iskola, idősotthon, rendelő, kórház), gyalogos forgalom (boltok, főutak), lombkorona (parkok, erdők, gyep).
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

A játékok névtelenek. Minden lejátszás végén egy JSON-sor keletkezik (játék, település, döntések, pontszám, névtelen munkamenet-azonosító),
plusz a „Változott a véleményed?” válasz külön sorként.

- **Alapállapot (config.js: `WEBHOOK: ''`)** — minden a játékos böngészőjében marad (`localStorage`, max. 500 sor); a `jatekok.html` alján CSV-ként exportálható.
- **Központi gyűjtés** — telepítsd az `apps-script/Code.gs`-t (5 perc, a fájl tetején leírva), és írd be a kapott `/exec` URL-t a `config.js` `WEBHOOK` mezőjébe.

| Játék | Mezők |
|---|---|
| fak | mód (osm/minta), adatforrás (csempék/Overpass/fájl), középpont, vak és adatos pontszám, a 10+10 fa helye (méter a központhoz képest) |
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
- Frissítéskor a `?v=4` a script-hivatkozásokban a böngésző-gyorsítótárat kerüli meg; új `gv.js`/`gvmap.js` kiadásánál a számot emeld.
