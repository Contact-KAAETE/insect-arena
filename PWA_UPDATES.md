# INSECT ARENA — automatische updates via één beginschermicoon

Versie: 2.0A (24 november 2026)

## Werking

- **Eén vaste app-identiteit:** manifest `id` en `start_url` zijn allebei `/insect-arena/`.
- Een reeds bestaand iPhone-icoon met bijvoorbeeld `?v=1.7A` blijft bruikbaar. Het opent dezelfde website, die de nieuwste code teruggeeft.
- Het spel controleert `version.json` met `cache: no-store` bij openen, terugkeer naar de voorgrond, herverbinden en iedere 15 minuten zolang de app zichtbaar is.
- Als er een nieuwe versie is, **herlaadt de app alleen als het hoofdmenu open is**. Een actief gevecht, een online duel of een uitnodiging wordt niet afgebroken.
- De herlaad-URL blijft binnen de bestaande PWA-scope; het icoon hoeft niet verwijderd of opnieuw aangemaakt te worden.
- Een eigen serviceworker `sw.js` haalt app-pagina's via het netwerk op, bewaart de laatst opgehaalde startpagina en gebruikt eerder opgehaalde bestanden als offline fallback.
- Gebruikersvoortgang, vrijgespeelde dieren, overwinningen en instellingen in localStorage blijven onaangeroerd.
- iOS start gesloten apps **niet** automatisch op voor updates. De controle vindt plaats tijdens het openen/gebruiken, met internetverbinding.

## Verplicht bij elke volgende release

1. Zet de nieuwe versie (bijv. `2.0A`) in **`version.json`** en in de appversie in `index.html` en `pwa-update-18.js` als daar het versie-constante nog staat. Zorg dat alle drie overeenkomen.
2. Veranderde CSS- en JS-bestanden moeten een nieuwe queryversie (`?v=2.0A`) krijgen in `index.html`, anders kan Safari een oude versie blijven gebruiken.
3. Pas het manifest `start_url`, `scope` en `id` **nooit** meer aan op een releaseversie. Deze blijven `/insect-arena/`.
4. Wijzig `SW_BUILD` in `sw.js` bij wijzigingen in de serviceworker of wanneer cache-opruiming nodig is. De cache is alleen voor INSECT ARENA, niet voor andere apps.
5. Controleer de tests: `node --test tests/*.test.cjs`. `tests/arena-20.test.cjs` controleert dat `version.json`, `CURRENT_VERSION`, `SW_BUILD` en de manifest-query gelijk zijn. Het versielabel in het menu en de duel-uitnodigingslink volgen automatisch `CURRENT_VERSION`; schrijf daar nergens anders een versienummer in.
6. Publiceer de nieuwe bestanden via GitHub Pages vanaf de bestaande `main`-branch. Start het bestaande iPhone-icoon één keer online om de nieuwe versie op te halen.

## Herstel bij oude iPhone-cache

Open het bestaande icoon eerst met internet. Als de update desondanks blijft hangen, open in Safari
`https://contact-kaaete.github.io/insect-arena/` en ga naar *Instellingen → Controleer update*.
Verwijder het oude icoon of de websitegegevens niet als eerste stap: dat kan opgeslagen voortgang kosten.

## Privacy en beperkingen

Geen advertenties, tracking, accounts of cloudopslag toegevoegd. Offline geldt voor eerder opgeslagen spelbestanden; multiplayer vereist een netwerkverbinding. Safari kan browserbalken tonen; spelen vanaf het beginscherm geeft de standalone-weergave.

## Update 1.9A — iPhone landscape + verbeterde dieren

De vechterkeuze, werelden, instellingen en duelpagina krijgen natuurlijke verticale scroll via de klasse ia19-menu-scroll. De fullscreen-arena blijft gefixeerd, zodat de joystick/aanvalknoppen niet veranderen. De vijf verbeterde SVG-assets staan in assets/fighters, hun vorige bestanden zijn als rollback behouden. Het bestaande beginschermicoon en alle offline-opslag blijven behouden. Iedere volgende upgrade moet eveneens de versie in version.json, pwa-update-18.js en SW_BUILD in sw.js consistent verhogen.

## Update 2.0A — leesbare gevechts-HUD en één versienummer

- De waarschuwingen *ONTWIJK DE AANVAL!* / *NU TERUGSLAAN!* en tactische meldingen staan nu altijd onder de levensbalken (`polish-20.js`/`polish-20.css`) in plaats van eroverheen.
- Het hoofdmenu toonde nog `1.5A`; het label volgt nu automatisch de app-versie.
- Online-duel-uitnodigingen bevatten de actuele versie in plaats van een vaste `?v=1.5A`.
- "1 overwinning" in plaats van "1 overwinningen".
- De oude duel-, tactiek- en AI-balanssimulaties (`tests/*-smoke.js`) draaien weer mee in CI via `tests/arena-20.test.cjs`.

## Update 2.1A — duelbibliotheken in de app

PeerJS en de QR-bibliotheek komen niet meer van jsDelivr/cdnjs maar uit `vendor/`. Ze worden door de serviceworker mee-gecachet, zodat de duelpagina ook zonder verbinding met die CDN's laadt. Zie `ARCHITECTURE.md` voor de laadvolgorde.
