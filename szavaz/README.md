# Hőhullám-kör — saját élő szavazás (ÉTOSZ, 2026. október 15.)

Három oldal + egy végpont. Nincs regisztráció, nincs app: a terem a telefon böngészőjében nyitja meg a rövid URL-t, és négy gomb közül választ. Minden szavazat egy sor egy fájl végén (`data/votes.csv`), a kivetítő két másodpercenként újraszámolja.

## Mi mit csinál

| Fájl | Kinek | Mit |
|---|---|---|
| `index.html` | a terem (telefon) | a kérdés + A–D gomb; csak az aktív körbe lehet szavazni; a választás a kör zárásáig módosítható; egy készülék = egy szavazat körönként (localStorage-azonosító, az utolsó szavazat számít) |
| `kivetito.html` | a vászon (laptop) | két panel: 1. kör vakon · 2. kör a rétegekkel; élő oszlopok, darab és %; QR + rövid URL; billentyű: `1` / `2` elrejti-mutatja az adott kör számait (reveal-hez), `R` mindkettőt mutatja |
| `vezerlo.html` | te (telefon vagy második ablak) | 1. kör nyitása · 2. kör nyitása · lezárás · nullázás; kulcsot kér |
| `config.js` | — | a kérdés, a négy opció, a rövid URL és a backend címe — csak ezt kell átírni |
| `api.php` | szerver | append a `votes.csv`-be zárolással, állapot a `state.json`-ban; `$KEY` átírandó |
| `apps-script/Code.gs` | szerver helyett | ugyanez Google Táblázatba, ha a tárhely statikus (nincs PHP) |

## Telepítés — A) PHP-s tárhely (a legtöbb magyar shared hosting: tárhely.eu, Forpsi, Rackhost stb.)

1. A `szavazas/` mappát feltölteni a weboldal gyökerébe (pl. `https://sajatdomain.hu/szavaz/`). A `data/` mappát a PHP maga létrehozza az első hívásnál — a tárhelyen a mappának írhatónak kell lennie (ha nem az, hozd létre kézzel `data` néven, 775 joggal).
2. `api.php` 13. sor: `$KEY = 'etosz-2026';` → saját kulcs.
3. `config.js`: `ROVID_URL` a valódi rövid cím (ezt látja a terem); `API` maradhat `api.php`.
4. Próba: nyisd meg `.../szavaz/vezerlo.html`, add meg a kulcsot, „1. kör nyitása”; másik telefonról `.../szavaz/`, szavazz; a `.../szavaz/kivetito.html`-en 2 mp-en belül látszik.
5. A konferencia előtt: „Nullázás” a vezérlőn (a próbaszavazatok egy `.bak` fájlba kerülnek).

Ez pontosan az, amit kérdeztél: a böngésző nem tud közvetlenül a szerver fájljába írni, de egy 90 soros PHP igen — minden szavazó csak hozzáfűz egy sort, a kiértékelés olvasáskor történik.

## Telepítés — B) statikus tárhely (GitHub Pages, Netlify, a geovern.hu parkolóoldala stb.)

1. Új Google Táblázat → Bővítmények → Apps Script → `apps-script/Code.gs` tartalma; `KEY` átírása.
2. Az editorban a **`teszt`** függvényt futtasd (fent a függvényválasztóban): elkéri az engedélyt, létrehozza a `votes` és `state` lapot, és a naplóba írja az állást. A `doGet`-et ne futtasd kézzel — az csak a webes hívásból kap paramétert, kézzel indítva `Cannot read properties of undefined (reading 'parameter')` hibát ad (ez nem a kód hibája, hanem a kézi indításé).
3. Telepítés → Új telepítés → típus: Webalkalmazás; Végrehajtó: Én; Hozzáférés: Bárki → a kapott `https://script.google.com/macros/s/…/exec` URL-t a `config.js` `API` mezőjébe. Próba böngészőből: `…/exec?a=state` → `{"round":1}`.
4. Ha később módosítod a kódot: Telepítés → Telepítések kezelése → ceruza → Verzió: Új → Telepítés — különben a régi kód fut tovább.
3. A három HTML és a `config.js` bárhová feltölthető (statikus). A kivetítő és a szavazó ugyanúgy működik; a „fájl” itt a táblázat `votes` lapja.

Korlát: az Apps Script 1–2 mp késleltetéssel válaszol, 60 fő két körben bőven belefér.

## A nap menete (a 10–13. diához)

1. 10. dia (Hőhullám): a kivetítő már a vásznon; a vezérlőn **1. kör nyitása**. A QR és a rövid URL a kivetítőn.
2. 11. dia (Vakon): a terem szavaz; amikor beáll a szám (40–60 szavazat, ~60–90 mp), **lezárás** a vezérlőn. Ha jósolsz, előtte mondd ki.
3. 12. dia (Négy réteg) + a négy rétegdia: a kivetítőt ilyenkor NEM látja a terem (a prezi van a vásznon). A vezérlőn **2. kör nyitása** a rétegek végén.
4. 13. dia (A rétegekkel): a kivetítő vissza a vászonra; a terem újra szavaz; lezárás. **Reveal**: a két panel egymás mellett — a vándorlás látszik.
5. Tartalék: ha 60 mp alatt nincs kapcsolat (4G, wifi), kézfeltartás, és a 11. dia jegyzetében lévő „így szokott alakulni” arányok.

Technika: saját laptop, saját 4G-router a laptopnak; a telefonok a saját mobilnetükön; a kivetítő a laptop böngészőjében (F11, második képernyő vagy a prezi mellett Alt-Tab). A kivetítő oldalt a prezi 11. és 13. diája helyett is használhatod: a dián csak a QR, a számok a böngészőben.

## Tartalék: Mentimeter / Slido

Ha a saját backend nem áll fel október 14-ig: ugyanez a két kérdés egy Menti-prezentációban (két azonos feleletválasztós kérdés, 4 opció), a QR a 10. diára. Az ingyenes csomag résztvevő- és kérdéskorlátját előtte ellenőrizd.
