/* GEOVERN játékok — közös beállítások
   Ezt az egy fájlt kell átírni, ha a játékok adatait központilag is gyűjteni akarod.
   ------------------------------------------------------------------------------
   WEBHOOK: Google Apps Script web app URL (lásd apps-script/Code.gs és a README-t).
            Üresen hagyva: minden eredmény csak a játékos böngészőjében mentődik
            (localStorage), és a jatekok.html oldalról CSV-ként exportálható.
   TOWN_DEFAULT: a település neve, ha az URL-ben nincs ?telepules=… paraméter.
                 Egy önkormányzatnak kiadott QR-nál érdemes így: jatekok.html?telepules=Pápa
   ORG: a kiadó szervezet neve a láblécben (üres = nincs kiírva). */
window.GV_CONFIG = {
  WEBHOOK: '',
  TOWN_DEFAULT: '',
  ORG: ''
};
