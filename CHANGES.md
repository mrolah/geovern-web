# Tartalmi átírás: nem üzleti célú szakmai kezdeményezés (content/nonprofit-atiras)

Cél: a geovern.com egyértelműen **nem üzleti célú szakmai kezdeményezésként** jelenjen meg, nyíltan vállalt VertiGIS-munkaviszonnyal, és ne lehessen versengő tanácsadásként olvasni. A dizájn, a játékok és a technikai működés nem változott; a kivett funkciók (ROI-kalkulátor, Pipedrive-időpontfoglaló) kódja is kikerült.

## Kulcsszöveg (HU forrás, EN/DE fordítás)

> A GEOVERN Oláh Attila nem üzleti célú szakmai kezdeményezése, amelynek célja a tudásmegosztás az önkormányzatok között. A GEOVERN nem értékesít szoftvert, szolgáltatást vagy utazást, és nem számol fel díjat.
> Átláthatóság: Oláh Attila főállásban a VertiGIS munkatársa. A GEOVERN nem a VertiGIS kezdeményezése, és nem képviseli annak álláspontját. Ha egy szakmai beszélgetésből üzleti igény születik (szoftver, bevezetés, tanácsadási megbízás), azt a VertiGIS illetékes munkatársaihoz irányítjuk. Minden esetben azt javasoljuk, hogy az önkormányzat a beszerzési szabályok szerint, több ajánlat alapján döntsön.

Helye: `impresszum.html` és `rolunk.html` (mindhárom nyelven). A tudásbázis-cikkek szerzői dobozában a rövid változat áll: „Oláh Attila – 20+ év GIS- és IT-tapasztalat; főállásban a VertiGIS munkatársa. A GEOVERN nem üzleti célú szakmai kezdeményezése.”, mellette link a Rólunk oldalra.

---

## index.html (HU/EN/DE)

| Kivett | Helyette |
|---|---|
| Title: „GEOVERN — GIS stratégiai tanácsadás” (EN: GIS strategy consulting, DE: GIS-Strategieberatung) | „GEOVERN – szakmai kezdeményezés: téradat, döntés, lakosság” (EN: professional initiative: spatial data, decisions, communities; DE: Fachinitiative: Geodaten, Entscheidungen, Bürgerbeteiligung) |
| Meta description: „Független GIS stratégiai tanácsadás: audit, licenc- és felhőoptimalizálás…” | „Gyakorlati tudásanyagok, döntésjátékok és szakmai tanulmányutak önkormányzatoknak – nem üzleti célú kezdeményezés.” + új `og:title`, `og:description`, `og:url`, `og:type` (eddig nem volt OG) |
| Eyebrow: „FÜGGETLEN GIS STRATÉGIAI TANÁCSADÁS” / INDEPENDENT GIS STRATEGY CONSULTING / UNABHÄNGIGE GIS-STRATEGIEBERATUNG | „SZAKMAI KEZDEMÉNYEZÉS” / PROFESSIONAL INITIATIVE / FACHINITIATIVE |
| „Stratégia, audit, licenc- és felhőoptimalizálás, AI — kormányzatnak, …” | „Tudásmegosztás önkormányzatoknak: téradat, adatgovernance, lakossági bevonás.” (+EN/DE) |
| Gombok: „Díjmentes konzultáció” / „ROI-kalkulátor →” (Free consultation, Kostenloses Erstgespräch) | „Írj nekünk” (→ kapcsolat) / „Tudásbázis →” (Write to us / Knowledge base; Schreiben Sie uns / Wissensbasis) |
| Fejléc-gomb és mobilmenü: „Konzultáció” / Book a call / Gespräch buchen | „Kapcsolat” / Contact / Kontakt |
| **ROI-kalkulátor (#s-roi)**: szekció, csúszkák, CSS, `roi()` JS, kamera-állás, fejezetpötty, I18N-kulcsok | teljesen eltávolítva |
| Számláló: „100% gyártófüggetlen” | eltávolítva; a többi (20+, 8, 4) statikus HTML-értéke a végérték (eddig `0`), az animáció megmaradt |
| Számlálófeliratok: „szolgáltatásterület”, „célszegmens” | „témakör”, „célcsoport” (+EN/DE) |
| „Hazai és nemzetközi projektek — Esri-ökoszisztéma és nyílt forráskód.” | „Hazai és nemzetközi projektek tapasztalatai — kereskedelmi és nyílt forráskódú környezetben.” (+EN/DE) |
| „SZOLGÁLTATÁSOK — Stratégiától a megvalósításig”, 8 szolgáltatás-csempe (köztük „Licencoptimalizálás: tipikusan 15–30% megtakarítás”, „Üzleti hasznosítás: … ROI-modell”) | „TÉMÁK — Miről osztunk meg tudást?”, 8 témacsempe (GIS-stratégia, környezet átnézése, licencgazdálkodás, felhő vagy helyben, AI, adatgovernance, szervezet és képzés, lakossági bevonás) — megtakarítási ígéret nélkül |
| Folyamatsáv: „Felmérés · 2–4 hét → Diagnózis · 1–2 hét → Roadmap · 3–5 hét → Megvalósítás” | „Kérdés egy cikkhez vagy játékhoz → Válasz e-mailben → Ha hasznos: tapasztalatcsere” (+EN/DE) |
| „Referencia: országos kormányzati tudásközpont — átvilágítás · GIS-audit · stratégia (2025–26)” | kivéve (a tulajdonos később dönt) |
| „Kezdjük egy 30 perces beszélgetéssel” + „Időpontfoglalás” gomb | „Szakmai kérdésed van? Írj nekünk” + `mailto:hello@geovern.com` (EN: Have a professional question? Write to us; DE: Eine fachliche Frage? Schreiben Sie uns) |
| Pipedrive-időpontfoglaló felugró ablak (HTML, CSS, JS, `?foglalas=1`) | teljesen eltávolítva |
| Logó `alt`: „GEOVERN — independent geospatial advisory” | „GEOVERN” |

## rolunk.html (HU/EN/DE)

| Kivett | Helyette |
|---|---|
| Szerepkör: „alapító · vezető tanácsadó” (founder · principal consultant / Gründer · leitender Berater) | „a GEOVERN kezdeményezője” (initiator of GEOVERN / Initiator von GEOVERN) |
| „… az Esri-technológiák és az IT világában — az elmúlt években nemzetközi szoftvercégnél (VertiGIS) szerzett üzleti és vezetői tapasztalatot.” | „Több mint húsz éve dolgozik a térinformatika és az IT világában; főállásban a VertiGIS munkatársa.” (+EN/DE) |
| „2008 óta több mint 90 projektben …” | kiegészítve: „korábbi és jelenlegi munkáltatóinál, személyes közreműködéssel” |
| „A GEOVERN-t azért alapította, hogy ez a tapasztalat gyártóktól független tanácsadásként legyen elérhető.” | „A GEOVERN-t azért indította, hogy a tapasztalatait megossza a magyar önkormányzatokkal – üzleti érdek nélkül.” |
| Küldetés 1: „A legjobbat akarom mindenkinek — technológiától és gyártótól függetlenül. Azt ajánlom, ami a célhoz a legjobb, nem azt, amiből a legtöbb licenc adható el.” | „A célból indulok ki, nem egy adott technológiából. Először a kérdést kell tisztázni, csak utána az eszközt.” (a félkövér rész is változott: a „gyártótól függetlenül” egy VertiGIS-munkatárs szájából félreérthető) |
| Küldetés 4: „… üzleti érdektől függetlenül is.” | „… üzleti érdek nélkül.” |
| Meta description: „független térinformatikai tanácsadás … Esri- …” | „Oláh Attila nem üzleti célú szakmai kezdeményezése önkormányzatoknak …” |
| — | Alulra: „A GEOVERN-ről” blokk a kulcsszöveggel (HU/EN/DE) |

## referenciak.html (HU/EN/DE)

| Kivett | Helyette |
|---|---|
| „Projektek, amelyekben személyesen közreműködtünk” (Projects we personally contributed to / Projekte mit persönlicher Mitwirkung) | „Projektek, amelyekben Oláh Attila korábbi és jelenlegi munkáltatóinál személyesen közreműködött” (+EN/DE) |
| Meta description: „90+ referencia és partner … GIS-referenciák térképen.” | ugyanez a megfogalmazás a munkáltatói kerettel |
| Fejléc-gomb: „Konzultáció” / Book a call / Gespräch buchen | „Kapcsolat” / Contact / Kontakt |

Az oldalon nem szerepelt olyan kitétel, hogy a projektek GEOVERN-megbízások voltak.

## tudasbazis/index.html (csak HU — a tudásbázis egynyelvű)

| Kivett | Helyette |
|---|---|
| „Díjmentes első konzultáció…”, „Kezdjük egy 30 perces beszélgetéssel”, Pipedrive-gomb | „Kérdésed van egy cikkel kapcsolatban? Írj nekünk.” + e-mail gomb |
| „— gyártófüggetlenül, projekttapasztalatból … egy audit … előtt” | „— projekttapasztalatból, termék- és gyártóajánlás nélkül … egy beruházás … előtt” |
| Meta/OG/Twitter leírás „Gyártófüggetlen, …: GIS-audit, ArcGIS-licenc, …” | „…, projekttapasztalatból, termék- és gyártóajánlás nélkül: GIS-környezet átnézése, licencgazdálkodás, …” |
| Szekció: „GIS-stratégia és tanácsadás — Audit, licenc- és felhőoptimalizálás … versenyelőny” | „GIS-stratégia és adatok — kérdések, amelyeket a szervezet maga is végig tud járni” |
| Kártyák: régi audit- és ArcGIS-licenc-cím/leírás, „GIS-tanácsadás” címke | új címek és leírások, „GIS-stratégia” címke; a licenccikk linkje az új URL-re mutat |
| Navigációs gomb: „Konzultáció” | „Kapcsolat” |

## tudasbazis/gis-audit-onkormanyzat.html — átírva önellenőrző cikké (URL változatlan)

Új cím: **„GIS-környezet átnézése az önkormányzatnál: mit érdemes megvizsgálni”**.

Megmaradt: a hat vizsgálati terület kérdéslistaként (táblázat), a „mikor érdemes” lista, egy szolgáltatás nélküli „hogyan érdemes nekiállni” lépéssor (időtartamok nélkül), az eredmény-lista (állapotkép, költségkép, kockázatok, akcióterv), az idézet.

Törölve: minden szolgáltatásleírás (4–6 hét, a lépések időtartama, 2–3 hónap, 20–40 oldalas dokumentum), „Az audit díja…”, „15–30%-os racionalizálás”, „Tárgyalási mandátum”, „Licencmegújítás előtt 6–9 hónappal … tárgyalási mozgástér”, „nem szoftverértékesítés, nem gyártói health check”, „A gyártói felmérések természetüknél fogva…”, „A GEOVERN auditja…”, „Esri-környezetben is független az audit? … nem viszonteladó” szakasz (a JSON-LD FAQ-ból is), a ROI-kalkulátor-link, a „Kell-e hozzáférést adnunk a rendszereinkhez?” kérdés.

Új GYIK: „Kell hozzá külső szakértő?” — „…Ha a szervezet külső segítséget vesz igénybe, azt a beszerzési szabályok szerint, több ajánlat alapján érdemes kiválasztani.”

## tudasbazis/licencgazdalkodas-onkormanyzat.html — ÚJ, gyártósemleges cikk

„Licencgazdálkodás az önkormányzatnál: 7 kérdés”: felhasználói igények felmérése, kilépett kollégák fiókjai, szerepkörök, ritkán használt funkciók, éves átnézés, adatgazdák, dokumentálás. Nincs benne termék-, licencszint- vagy kiterjesztésnév, százalékos megtakarítás, forgalmazóval tárgyalás, kilépési forgatókönyv, „üres szék”.

## tudasbazis/arcgis-licenc-optimalizalas.html — átirányítás

A régi cikk tartalma törölve. A fájl most `meta refresh` + `canonical` az új cikkre (`noindex, follow`). A belső linkek (hub, kapcsolódó cikkek, JSON-LD) és a `sitemap.xml` az új URL-re mutatnak.

## tudasbazis/terinformatika-ai-agensek.html

Törölve: „Kapcsolódó szolgáltatás — A GEOVERN AI-készültségi felmérése a GIS-audit kiegészítő modulja…” doboz. „A GEOVERN gyártófüggetlen megközelítésének éppen itt van a haszna:” → „Ennek a szemléletnek éppen itt van a haszna:”. CTA, szerzői doboz, címke: lásd lent.

## tudasbazis/teradat-governance-kozigazgatas.html

„… a legtöbb GIS-beruházás megtérülése ezen áll vagy bukik” → „… haszna ezen áll vagy bukik”. CTA, szerzői doboz, címke: lásd lent.

## tudasbazis/lakossagi-reszvetel-dontesjatek.html, klimaadaptacio-hosziget-esokert-telepules.html, dontesjatek-bevezetese-onkormanyzat.html

| Kivett | Helyette |
|---|---|
| „Az első öt önkormányzati partnernél az első kampány licencdíj nélkül indul.” | „A játékok önkormányzatoknak díjmentesen elérhetők.” |
| „a GEOVERN térinformatikai tanácsadó cég” | „a GEOVERN szakmai kezdeményezés” |
| Doboz: „Bevezető ajánlat … licencdíj nélkül … Cserébe az eredményeket … referenciaként használhatjuk.” | Doboz: „Díjmentes — A játékok önkormányzatoknak díjmentesen elérhetők … Az anonim, összesített eredményeket – az önkormányzat hozzájárulásával – tudásanyagként megoszthatjuk.” |
| „a GEOVERN tízórás bevezetési csomagjának” | „… bevezetési menetrendjének” |
| „költségvetési konzultáció” | „költségvetés-tervezés lakossági bevonással” |
| CTA: Pipedrive-időpontfoglaló gomb | eltávolítva; „Játékok kipróbálása” + „E-mail írása” marad |

## Minden tudásbázis-cikk (közös)

- Szerzői doboz: „Oláh Attila — alapító, vezető tanácsadó, GEOVERN … üzleti és vezetői háttér a VertiGIS-nél. Gyártófüggetlen térinformatikai stratégiai tanácsadás…” → „A szerzőről: Oláh Attila – 20+ év GIS- és IT-tapasztalat; főállásban a VertiGIS munkatársa. A GEOVERN nem üzleti célú szakmai kezdeményezése.” + „Rólunk és átláthatóság →”.
- GIS-cikkek CTA: „Díjmentes első konzultáció…” + Pipedrive + ROI-kalkulátor → „Kérdésed van egy cikkel kapcsolatban? Írj nekünk.” + e-mail.
- Címke/morzsamenü/JSON-LD `articleSection`: „GIS-tanácsadás” → „GIS-stratégia”.
- Navigációs gomb: „Konzultáció” → „Kapcsolat”.

## rendezvenyek.html (Graz, 2026. dec. 4–5.)

- Új sor a cím alatt: „Szervezők: GEOVERN és az Élhető Települések Országos Szövetsége (ÉTOSZ), a Stadt Graz vendégeként.” EN/DE: a nyelvi megjegyzésbe (az eseményleírás csak magyarul van).
- 14:00: „Köszöntés” (korábban „Városháza: a polgármester fogadása”) → „Fogadás és szakmai program a grazi városházán — köszöntés”.
- A kikommentelt költségblokk (Ft/fő összegekkel) törölve; helyette látható mondat: „A részletes költségtájékoztatót a jelentkezőknek e-mailben küldjük.” Az elő-jelentkezési űrlap továbbra is kikommentelve.
- EN/DE megjegyzés: „details and sign-up are in Hungarian” → szervezők + „detailed cost information is sent to participants by email”.

## impresszum.html (HU/EN/DE)

- Alcím: „GEOVERN — independent geospatial advisory” → „nem üzleti célú szakmai kezdeményezés” / „non-commercial professional initiative” / „nicht kommerzielle Fachinitiative”.
- Új szakasz „A GEOVERN-ről” / „About GEOVERN” / „Über GEOVERN”: kulcsszöveg + „A honlap tartalma nem minősül üzleti ajánlatnak; a GEOVERN nem végez díjköteles tevékenységet.” (+EN/DE).
- A tárhely-, térkép- és szerzői jogi sorok változatlanok.

## adatkezeles.html (HU/EN/DE)

- A Pipedrive OÜ adatfeldolgozó **csak az időpontfoglaló miatt** szerepelt → kivéve mindhárom nyelven; a kapcsolatfelvételi pontból az „időpontfoglalás / scheduling / Terminbuchung” szó is.
- Változatlan (jogi szöveg, a tulajdonos döntése): a kapcsolatfelvétel jogalapjánál „szerződés előkészítése” és „üzleti kapcsolat esetén” szerepel. Egy nem üzleti kezdeményezésnél érdemes lehet egyszerűsíteni.

## Egyéb

- `jatekok.html`: „Konzultáció →” link → „Kapcsolat →”.
- `rolunk.html`, `referenciak.html`, `rendezvenyek.html`, `impresszum.html`, `adatkezeles.html`, `konferencia.html`, `ranglista.html`: logó `alt` „GEOVERN — independent geospatial advisory” → „GEOVERN”; `logo/*.svg` `aria-label` ugyanígy.
- `sitemap.xml`: az ArcGIS-licenc URL helyett a licencgazdálkodási cikk; `lastmod` frissítve a módosult tudásbázis-oldalakon.
- `konferencia.html`: ideiglenesen kikapcsolva (nincs használatban): átirányít a főoldalra (`noindex`); az eredeti tartalom a git-előzményekben megvan. Ezzel a VertiGIS-es e-mail-cím és előadói sor is lekerült.
- `README.md`: cím; az „Időpontfoglalás” (Pipedrive) szakasz helyett „Kapcsolat” (csak e-mail).

## Nyitott kérdések (nem változtattam)

1. **Logó**: a `logo/geovern-wm.svg` (és a két `geovern-logo-*.svg`) vektorosan tartalmazza az „INDEPENDENT GEOSPATIAL ADVISORY” alfeliratot; minden oldal fejlécében látszik. Dizájnelem, ezért nem nyúltam hozzá.
2. **Megszólítás**: a megadott „Szakmai kérdésed van? Írj nekünk” tegező; a főoldal többi szövege magázó („Kattintson…”, „görgessen”).
3. **Use case-térkép a főoldalon**: illusztratív eredmény-nagyságrendek (pl. „Szállítási költség −8–15%”, vállalati szegmens) — tartalmilag tanácsadói hangvételű lehet.
4. **Játékok**: a `jatekok/ugymenet.html` „Pipedrive-szerű” táblát említ (játékdizájn, nem link) — a játékokhoz nem nyúltam.
5. **Ez a fájl** a merge után nyilvánosan elérhető lesz (`geovern.com/CHANGES.md`). Ha nem kell, merge előtt törölhető.

## Ellenőrzés

- Grep az egész repóban (CHANGES.md kivételével): „Díjmentes konzultáció”, „konzultáció”, „ROI”, „megtérülés”, „Licencmegtakarítás”, „licencdíj nélkül”, „tanácsadó cég”, „Az audit díja”, „Tárgyalási mandátum”, „nem viszonteladó”, „gyártói”, „pipedrive.com/scheduler”, „Kostenlose Beratung”, „free consultation”, „a polgármester fogadása”, „Ft/fő” — **0 találat**.
- „VertiGIS” előfordulások: kulcsszöveg (`impresszum.html`, `rolunk.html`, 3 nyelv), Rólunk-mondat (`rolunk.html`, 3 nyelv), rövid szerzői doboz (7 tudásbázis-cikk). Más helyen nem szerepel.
- Helyi szerver: 15 oldal × elérhető nyelvek betöltve, nyelvváltás után nincs JS-hiba és üres szakasz; 66 belső link és horgony él; a régi licenc-URL átirányít.
