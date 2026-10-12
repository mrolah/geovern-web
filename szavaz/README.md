# Hőhullám-kör — saját élő szavazás (ÉTOSZ, 2026. október 15.)

Három oldal + egy végpont. Nincs regisztráció, nincs app: a terem a telefon böngészőjében nyitja meg a rövid URL-t, és négy gomb közül választ. Minden szavazat egy sor egy fájl (vagy táblázatlap) végén, a kivetítő két másodpercenként újraszámolja. A kivetítő jelenetét (városkép, rétegek, szavazás) a vezérlő váltja — a játék eleje és vége végig a böngészőben megy, nem kell a prezihez visszaváltani.

## Mi mit csinál

| Fájl | Kinek | Mit |
|---|---|---|
| `index.html` | a terem (telefon) | a kérdés + A–D gomb; csak az aktív körbe lehet szavazni; a választás a kör zárásáig módosítható; egy készülék = egy szavazat körönként (az utolsó számít); a körök között „A szavazás most zárva” |
| `kivetito.html` | a vászon (laptop) | teljes képernyős háttérkép + a vezérlő által kiválasztott jelenet: 0 Indulás (csak a városkép) · 1 első kör (városkép + cím + QR + élő oszlopok) · 2–5 egy-egy réteg (csak a kép) · 6 második kör (az összes réteg + szavazás). Lezárás után a két kör egymás mellett (reveal). Billentyű a laptopon: `0`–`6` jelenet kézzel, `R` mindkét panel, `A` vissza a vezérlőre |
| `vezerlo.html` | te (telefon vagy második ablak) | a 7 jelenet gombja sorban (1 és 6 egyben megnyitja az 1., ill. 2. kört; a többi zárja a szavazást) · Szavazás lezárása · Nullázás; kulcsot kér |
| `config.js` | — | a kérdés, a négy opció, a rövid URL, a backend címe, a QR-kép és a `NEZETEK` lista (jelenet → kép, kör, gombfelirat) — csak ezt kell átírni |
| `varos.jpg`, `reteg-lombkorona.jpg`, `reteg-serulekeny.jpg`, `reteg-hoseg.jpg`, `reteg-gyalogos.jpg`, `retegek-osszes.jpg` | a kivetítő | a jelenetek háttérképei (a kivetítő induláskor mind előtölti, a váltás azonnali) |
| `qr.png` | a kivetítő | a szavazó oldal QR-kódja (a `https://mrolah.github.io/geovern-web/szavaz/` címre mutat — más mappanévnél generáld újra, vagy `QR_KEP: ""` és a böngésző rajzolja) |
| `api.php` | szerver | append a `votes.csv`-be zárolással, állapot (kör + jelenet) a `state.json`-ban; `$KEY` átírandó. **GitHub Pages-re NE töltsd fel** — ott nem fut, és a kulcs olvasható benne |
| `apps-script/Code.gs` | szerver helyett | ugyanez Google Táblázatba, ha a tárhely statikus (nincs PHP) |

## Telepítés — A) PHP-s tárhely (a legtöbb magyar shared hosting: tárhely.eu, Forpsi, Rackhost stb.)

1. A `szavazas/` mappát feltölteni a weboldal gyökerébe (pl. `https://sajatdomain.hu/szavaz/`). A `data/` mappát a PHP maga létrehozza az első hívásnál — a tárhelyen a mappának írhatónak kell lennie (ha nem az, hozd létre kézzel `data` néven, 775 joggal).
2. `api.php`: `$KEY = 'etosz-2026';` → saját kulcs.
3. `config.js`: `ROVID_URL` a valódi rövid cím (ezt látja a terem); `API: "api.php"`.
4. Próba: nyisd meg `.../szavaz/vezerlo.html`, add meg a kulcsot, „1 · 1. kör”; másik telefonról `.../szavaz/`, szavazz; a `.../szavaz/kivetito.html`-en 2 mp-en belül látszik.
5. A konferencia előtt: „Nullázás” a vezérlőn (a próbaszavazatok egy `.bak` fájlba kerülnek, az állapot visszaáll az Indulásra).

## Telepítés — B) statikus tárhely (GitHub Pages, Netlify stb.)

1. Új Google Táblázat → Bővítmények → Apps Script → `apps-script/Code.gs` tartalma; `KEY` átírása.
2. Az editorban a **`teszt`** függvényt futtasd (fent a függvényválasztóban): elkéri az engedélyt, létrehozza a `votes` és `state` lapot, és a naplóba írja az állást. A `doGet`-et ne futtasd kézzel — az csak a webes hívásból kap paramétert, kézzel indítva `Cannot read properties of undefined (reading 'parameter')` hibát ad (ez nem a kód hibája, hanem a kézi indításé).
3. Telepítés → Új telepítés → típus: Webalkalmazás; Végrehajtó: Én; Hozzáférés: Bárki → a kapott `https://script.google.com/macros/s/…/exec` URL-t a `config.js` `API` mezőjébe. Próba böngészőből: `…/exec?a=state` → `{"round":0,"view":0}`.
4. **Ha később módosítod a kódot** (pl. ez a verzió a jelenetekkel): Telepítés → Telepítések kezelése → ceruza → Verzió: Új → Telepítés — különben a régi kód fut tovább, és a vezérlő jelenetgombjai `unknown` hibát adnak. Az URL nem változik.
5. A három HTML, a `config.js` és a képek bárhová feltölthetők (statikus). A `state` lapon a második oszlop (`view`) magától létrejön az első jeleneváltáskor.

Korlát: az Apps Script 1–2 mp késleltetéssel válaszol, 60 fő két körben bőven belefér.

## A nap menete (a 10–13. diához) — a vezérlő gombjai sorban

| Gomb | A vásznon | A szavazás | Mikor |
|---|---|---|---|
| **0 · Indulás** | csak a városkép, üresen | zárva | amikor a kivetítőt a vászonra teszed (10. dia helyett) |
| **1 · 1. kör** | városkép + cím + rövid URL + QR + az 1. kör élő oszlopai | **1. kör nyitva** | „Hőhullám. Három hét. 40 millió.” — a terem szavaz, ~60–90 mp |
| **Szavazás lezárása** | ugyanez, az 1. kör számai „lezárva” | zárva | amikor beáll a szám; ha jósolsz, előtte mondd ki |
| **2 · hiányzó lombkorona** | csak a réteg képe | zárva | a négy réteg — egyenként, a saját mondatoddal |
| **3 · sérülékeny lakók** | csak a réteg képe | zárva | |
| **4 · hőség** | csak a réteg képe | zárva | |
| **5 · gyalogos forgalom** | csak a réteg képe | zárva | |
| **6 · 2. kör** | az összes réteg együtt + cím + QR + a 2. kör élő oszlopai | **2. kör nyitva** | a terem újra szavaz |
| **Szavazás lezárása** | az összes réteg + **a két kör egymás mellett** (reveal) | zárva | a vándorlás látszik — itt jön a „nem okosabb lett a terem, csak látott” |

Tartalék: ha 60 mp alatt nincs kapcsolat (4G, wifi), kézfeltartás, és a 11. dia jegyzetében lévő „így szokott alakulni” arányok. Ha a vezérlő telefon nem ér el a backendet, a laptop billentyűzete is váltja a jelenetet (`0`–`6`), csak a kör nyitása/zárása marad a vezérlőn.

Technika: saját laptop, saját 4G-router a laptopnak; a telefonok a saját mobilnetükön; a kivetítő a laptop böngészőjében (F11, második képernyő vagy a prezi mellett Alt-Tab). A kivetítő a prezi 10–13. diáját teljesen kiváltja: a prezi 13. diája után Alt-Tab a böngészőre, a végén vissza.

## Tartalék: Mentimeter / Slido

Ha a saját backend nem áll fel október 14-ig: ugyanez a két kérdés egy Menti-prezentációban (két azonos feleletválasztós kérdés, 4 opció), a QR a 10. diára. Az ingyenes csomag résztvevő- és kérdéskorlátját előtte ellenőrizd.
