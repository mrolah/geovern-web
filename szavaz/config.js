// ÉTOSZ hőhullám-kör — közös beállítások (a szavazó, a kivetítő és a vezérlő is ezt olvassa)
window.SZAVAZAS = {
  // Backend végpont. PHP-s tárhelyen: "api.php" (ugyanebben a mappában).
  // Statikus tárhelyen (nincs PHP): az Apps Script web app URL-je, pl. "https://script.google.com/macros/s/XXXX/exec"
  API: "https://script.google.com/macros/s/AKfycbwwW6FcM-BYfLlw4ns5eU_rip11f1n0MMbW4UuhceplPq04MMlOYaeFQEDM15p_8jiwpg/exec",   // Attila Apps Script web appja (GitHub Pages = statikus, ezért NEM api.php)

  // A kérdés és a négy opció — mindkét körben ugyanaz
  CIM: "Hőhullám. Három hét. 40 millió forint.",
  KERDES: "Mire költi a város az azonnali keretet?",
  OPCIOK: {
    A: "Párakapuk, ivókutak és napvitorlák a főtéren és a piacon",
    B: "Hűtött közösségi pont minden városrészben, egyenlően elosztva",
    C: "Árnyékolás és azonnali fásítás a lakótelepi bölcsőde, az idősek klubja és a rendelő körül",
    D: "Hőségriasztó rendszer: szenzorok, SMS-riasztás, önkéntesek az idősekhez"
  },
  KOROK: { 1: "1. kör — vakon", 2: "2. kör — a rétegekkel" },

  // A kivetítő jelenetei — a vezérlő gombjai ebből épülnek, ebben a sorrendben.
  //   kep:  a háttérkép (a mappában)
  //   kor:  melyik szavazókört nyitja meg a gomb (1 vagy 2); ha nincs, a szavazás zárva, és a kivetítőn CSAK a kép látszik
  //   nev:  a vezérlő gombjának felirata
  NEZETEK: {
    0: { nev: "Indulás — csak a városkép, üresen",            kep: "varos.jpg" },
    1: { nev: "1. kör — vakon (városkép + szavazás + QR)",    kep: "varos.jpg",            kor: 1 },
    2: { nev: "Réteg: hiányzó lombkorona",                    kep: "reteg-lombkorona.jpg" },
    3: { nev: "Réteg: sérülékeny lakók",                      kep: "reteg-serulekeny.jpg" },
    4: { nev: "Réteg: hőség",                                 kep: "reteg-hoseg.jpg" },
    5: { nev: "Réteg: gyalogos forgalom",                     kep: "reteg-gyalogos.jpg" },
    6: { nev: "2. kör — a rétegekkel (összes réteg + szavazás + QR)", kep: "retegek-osszes.jpg", kor: 2 }
  },

  // A kivetítőn megjelenő rövid cím (ezt írd át a saját domainre)
  ROVID_URL: "mrolah.github.io/geovern-web/szavaz/",
  QR_KEP: "qr.png",            // opcionális: előre generált QR-kép fájlneve; üresen a böngésző rajzolja
  FRISSITES_MS: 2000,          // kivetítő és vezérlő
  SZAVAZO_FRISSITES_MS: 3000   // a telefonok — 60 készüléknél is belefér az Apps Script korlátaiba
};

// Közös lekérő: a választ szövegként olvassa, és érthető hibát ad, ha nem JSON jön vissza
// (pl. a config.js API mezője még api.php-ra mutat egy statikus tárhelyen → a PHP forrása jön vissza).
window.SZAVAZAS_get = async function (query, init) {
  const C = window.SZAVAZAS;
  const url = C.API + (C.API.includes('?') ? '&' : '?') + query + '&t=' + Date.now();
  const res = await fetch(url, Object.assign({ cache: 'no-store' }, init || {}));
  const txt = await res.text();
  try { return JSON.parse(txt); }
  catch (e) {
    const hint = txt.trim().startsWith('<?php') ? 'a config.js API mezője api.php-ra mutat, de a tárhely nem futtat PHP-t — ide az Apps Script /exec URL kell'
               : txt.trim().startsWith('<') ? 'HTML jött JSON helyett — rossz API URL, vagy az Apps Script telepítés nem „Bárki” hozzáférésű'
               : 'nem JSON válasz';
    throw new Error(hint);
  }
};
