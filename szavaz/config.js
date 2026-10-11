// ÉTOSZ hőhullám-kör — közös beállítások (a szavazó, a kivetítő és a vezérlő is ezt olvassa)
window.SZAVAZAS = {
  // Backend végpont. PHP-s tárhelyen: "api.php" (ugyanebben a mappában).
  // Statikus tárhelyen (nincs PHP): az Apps Script web app URL-je, pl. "https://script.google.com/macros/s/XXXX/exec"
  API: "api.php",

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

  // A kivetítőn megjelenő rövid cím (ezt írd át a saját domainre)
  ROVID_URL: "pelda.hu/szavaz",
  FRISSITES_MS: 2000,          // kivetítő és vezérlő
  SZAVAZO_FRISSITES_MS: 3000   // a telefonok — 60 készüléknél is belefér az Apps Script korlátaiba
};
