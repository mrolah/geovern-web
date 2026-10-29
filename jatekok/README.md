# GEOVERN — Játékok (lakossági döntésjátékok)

Hét önálló, mobilra tervezett HTML-játék önkormányzatoknak, a lakosság szemléletformálására.
Belépő: `jatekok.html` (a főoldal „Játékok” menüpontja). A játékok a `jatekok/` mappában élnek,
mindegyik egyetlen HTML-fájl; a közös modul a `jatekok/gv.js`, a beállítások a `jatekok/config.js`.

| Fájl | Játék | Design | Játékmód | Adat | Idő |
|---|---|---|---|---|---|
| `fak.html` | Hová ültetnél 10 fát? | GEOVERN sötét térkép (MapLibre) | bejelölés a térképen, két kör (vakon → adattal) | élő térkép + illusztratív rétegek | 2–3 perc |
| `esokert.html` | Esőkert vagy csatorna? | tervrajz (blueprint) | csúszkás keretosztás + vihar-szimuláció | sematikus utcametszet | 2–3 perc |
| `iskolautca.html` | Iskolautca | plakát (civic poster) | A/B/C döntések + veszélypont-bejelölés | vázlat-térkép + mért bizonyítékok | 2–3 perc |
| `ugyanaz-az-utca.html` | Ugyanaz az utca | pixel · izometrikus | zónaválasztás három körben | sematikus kisváros, három réteg | 2 perc |
| `karcsu.html` | Karcsú vagy túlméretezett? | nagy számok, fehér | gyors párválasztás, 10 mp | nagyságrendi költségek | 2 perc |
| `lassit-es-mer.html` | Lassít és mér | szenzor-műszerfal | döntés → 12 hetes szimuláció → újradöntés | idősor-diagram | 3 perc |
| `zold-varosresz.html` | Zöld városrész — 12 hónap | modern sim, HUD | építés + havi események + rejtett rétegek | rácsos városrész, mérés fedi fel | 5–10 perc |

## Település-paraméter

Minden oldal elfogadja a `?telepules=Pápa` (vagy `?t=Pápa`) paramétert:

- a hub és a játékok kiírják a nevet („Ez a játékcsomag Pápa lakóinak készült”),
- a térképes játék a település középpontjára áll (kb. 130 magyar település + Graz, Bécs, Innsbruck a `gv.js` táblájában; ismeretlen név esetén alapértelmezett középpont, a név akkor is megjelenik),
- a név a böngészőben megmarad, így a játékok közötti linkek is viszik.

Egy önkormányzatnak kiadva: `https://geovern.com/jatekok.html?telepules=Pápa` → QR-kód.

## Adatgyűjtés

A játékok névtelenek. Minden lejátszás végén egy JSON-sor keletkezik (játék, település, döntések,
pontszám, névtelen munkamenet-azonosító), plus a „Változott a véleményed?” válasz külön sorként.

- **Alapállapot (config.js: `WEBHOOK: ''`)** — minden a játékos böngészőjében marad (`localStorage`, max. 500 sor);
  a `jatekok.html` alján CSV-ként exportálható.
- **Központi gyűjtés** — telepítsd az `apps-script/Code.gs`-t (5 perc, a fájl tetején leírva), és írd be a kapott
  `/exec` URL-t a `config.js` `WEBHOOK` mezőjébe. A sorok egy Google Táblázatba érkeznek.

Mit rögzítenek a játékok:

| Játék | Mezők |
|---|---|
| fak | vak és adatos pontszám, a 10+10 fa helye (egységkoordináta a központhoz képest) |
| esokert | próbánként: keretosztás a 4 tétel között, mérés igen/nem, felszíni víz m³, kapacitás, hűsítés, átfutás |
| iskolautca | észlelt veszélypont, döntés (A–D), „hová tűnnek az autók”, „mit javít”, támogatás, mit mérnének, pontszám |
| ugyanaz | a három kör zónaválasztása és pontjai |
| karcsu | mind a 8 pár válasza, idő, találatok |
| lassit | első beavatkozás, mérés igen/nem, mért hatás, második beavatkozás, pontszám |
| zold | pontszám és részpontok, adattal költött arány, kockázatcsökkentés, elhelyezések (hónap, eszköz, cella, adattal?), károk |
| velemeny | melyik játék után, válasz: igen / részben / nem |

## Testreszabás

- Szövegek, kártyák, számok: mindegyik játék fájljának elején egy adatblokk (`WEEK`, `Q2…`, `P`, `I`, `ITEMS`, `Z`) — ezeket kell átírni egy tematikus paklihoz.
- Rétegek a térképes játékban: a `fak.html` `L` objektuma (gauss-foltok egységkoordinátában). Valós rétegekhez a `polyFC`/`heatFC` GeoJSON-ra cserélhető.
- A `zold-varosresz.html` városrésze a `LAYOUT` sorokból épül (9×7, betűnként egy tömbtípus).
- Képek: `jatekok/img/` (1280 px széles JPEG-ek, a projekt generált látványképeiből).

## Függőségek

Google Fonts (Roboto, Roboto Slab, Archivo Black, Press Start 2P, Nunito) és — csak a térképes játéknál — MapLibre GL (unpkg) + Carto sötét alaptérkép.
Minden más beágyazott; nincs build, nincs backend-kötelezettség.
