# GEOVERN — independent geospatial advisory

Háromnyelvű (HU/EN/DE) statikus weboldal: MapLibre-alapú landing, konferencia-aloldal
interaktív döntésjátékkal, zoomolható referenciatérkép.

Élő oldal: https://mrolah.github.io/geovern-web/

## Időpontfoglalás

A főoldal „Időpontfoglalás” gombja a Pipedrive Scheduler-t (`https://psh-rf-olah-attila.pipedrive.com/scheduler/0K29R0t6/meeting-standard`) felugró ablakban nyitja meg: iframe, csak az első megnyitáskor töltődik be; Esc, a háttér vagy a × zárja; JS nélkül vagy Ctrl/Cmd/középső kattintásra új lapon nyílik. Közvetlenül nyitható link (pl. levélbe): `index.html?foglalas=1` vagy `index.html#foglalas`.

## Referenciatérkép

A `referenciak.html` `REFP` tömbje városonként listázza a referenciákat. Budapesten a tételek 4. eleme `[hossz, szél., cím]`: a projekt évében érvényes székhely (év nélküli tételeknél a mostani). 9-es nagyítástól a budapesti város-jelölő helyett minden ügyfél a székhelyén látszik (azonos címen egy jelölő, számmal; a helyszín nélküli, anonimizált tételek szaggatott jelölőn). A jelölők kinézete a belső `.rmk-i` elemen van — a külső elemet a MapLibre mozgatja `transform`-mal, azon átmenet nem lehet (különben a jelölő lemarad a térképtől).
