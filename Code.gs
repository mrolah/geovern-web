/* GEOVERN játékok — opcionális központi adatgyűjtés (Google Apps Script web app)
   -------------------------------------------------------------------------
   Telepítés (5 perc):
   1. Új Google Táblázat → Bővítmények → Apps Script → ezt a kódot bemásolod, mentés.
   2. Telepítés → Új telepítés → típus: Webalkalmazás → Futtatás: Én → Hozzáférés: Bárki → Telepítés.
   3. A kapott /exec URL-t beírod a jatekok/config.js WEBHOOK mezőjébe.
   4. Minden módosítás után: Telepítés → Telepítések kezelése → Verzió: Új.
   A játékok egy JSON-sort POST-olnak minden lejátszás és minden „változott a véleményed?” válasz után.
   A táblázat „eredmenyek” lapjára kerül: időbélyeg, névtelen munkamenet-azonosító, játék, település, és a teljes JSON.
   Nincs név, nincs e-mail — a játékok névtelenek. */
var SHEET = 'eredmenyek';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var row = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
    if (sh.getLastRow() === 0) sh.appendRow(['ts', 'sid', 'game', 'town', 'score', 'json']);
    sh.appendRow([row.ts || new Date().toISOString(), row.sid || '', row.game || '', row.town || '',
      (row.score != null ? row.score : (row.informed && row.informed.score != null ? row.informed.score : '')),
      JSON.stringify(row)]);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* Gyors összesítés böngészőből: <exec URL>?a=summary */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh || sh.getLastRow() < 2) return out({ ok: true, games: 0, byGame: {}, byTown: {} });
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();
  var byGame = {}, byTown = {};
  vals.forEach(function (r) { byGame[r[2]] = (byGame[r[2]] || 0) + 1; byTown[r[3] || '-'] = (byTown[r[3] || '-'] || 0) + 1; });
  return out({ ok: true, games: vals.length, byGame: byGame, byTown: byTown });
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
