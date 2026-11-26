# INSECT ARENA — opbouw en laadvolgorde

Het spel is gegroeid in lagen (`xx-NN`, NN = release). Latere lagen overschrijven eerdere
functies of stijlen. Dit overzicht voorkomt dat je de volgorde moet raden.

| Laag | Bestanden | Rol |
| --- | --- | --- |
| Basis | `index.html` (inline engine, sprites) | Canvas, 8 oorspronkelijke vechters, menu |
| 0.6–0.7 | `ui-06.css`, `ui-07.css/js`, `expansion-07.js` | Menu's, navigatie (`switchPage`), werelden |
| 0.8–0.9 | `duel-08.*`, `countdown-08.*`, `match-09.*` | Online duel (PeerJS), aftellen, best-of-3 |
| 1.0–1.3 | `landscape-10.*`, `premium-11.*`, `tactical-12.*`, `balance-13.*` | Landscape, HUD, speciale meter, AI/moeilijkheid |
| 1.4–1.6 | `adventure-14*`, `expansion-15*`, `terrain-16*` | Tutorial, 13 dieren, 6 biomen, terrein |
| 1.7–1.9 | `immersive-17.*`, `pwa-update-18.*`, `polish-19.css` | Fullscreen, PWA-updates, scrollbare menu's |
| 2.0–2.1 | `polish-20.*`, `vendor/` | Leesbare gevechts-HUD, lokale duelbibliotheken |
| 2.3 | `fauna-23-pre.js`, `fauna-23.js` | Drie geanimeerde solo-vechters (bloemenmantis, springstaart, bosmijt) met eigen specials |
| 2.4 | `terrain-23.js`, `assets/world/props-23/` | Fotorealistische bosprops over de bestaande terreinlaag (alleen uitzicht) |

Regels:

- `*-pre.js` laadt **vóór** `ui-07.js` (registreert dieren/werelden); de rest in de volgorde van `index.html`.
- Versienummer: alleen `version.json` en `CURRENT_VERSION` (`pwa-update-18.js`) + `SW_BUILD` (`sw.js`).
  Menulabel en duel-uitnodiging volgen `CURRENT_VERSION`. `tests/arena-20.test.cjs` bewaakt dit.
- `vendor/` bevat PeerJS 1.5.5 en qrcodejs 1.0.0 (MIT/Apache, licenties ernaast). Geen scripts van externe CDN's;
  de service worker bewaart ze automatisch voor offline gebruik. Alleen de PeerJS-signaleringsserver
  (wachtkamer voor duel) vereist nog internet.
- Verwijderd in 2.1A: `ui-06.js` (werd nergens meer geladen of getest).
- Bewust niet samengevoegd: de CSS/JS-lagen zelf. Elke laag heeft eigen tests en draait op de
  volgorde van overschrijven; samenvoegen vraagt een aparte, visueel geteste ronde.

## Geanimeerde vechters (2.3A)

- `fauna-23-pre.js` laadt **vóór** `ui-07.js` en registreert id 13–15 (rooster, keuzelijst, stilstaand portret).
- `fauna-23.js` laadt na `expansion-15.js`: knipt elke spritesheet (`assets/fighters/*-23.webp`) één keer in canvas-frames
  en zet vlak vóór het tekenen `fighterSprites[id]` op het juiste frame. Daardoor werken HUD, schade-flits en
  statuseffecten van eerdere lagen ongewijzigd. Een canvas met `complete/naturalWidth/naturalHeight` volstaat voor de kern.
- Alleen solo: het duelprotocol blijft op id 0–7 (`duel-08.js`).
- Bronmateriaal: video (bloemenmantis, uitgeknipt met `knip2`-methode: randdetectie + vlakvulling) en twee aangeleverde
  8-frame-sheets (springstaart, mijt). Randkleuren zijn gezuiverd.

## Fotoprops in de arena (2.4A)

- `terrain-23.js` laadt na `terrain-16.js` en vervangt alleen `iaTerrain16Art.cache`. Per object in `terrain-16-data.js`
  (op `id`) staat een foto, breedte en anker; objecten zonder foto of met een mislukte download vallen terug op de oude tekening.
- Botsing, dekking en vertraging blijven uit `terrain-16-data.js` komen en worden niet aangepast.
- Foto's: `assets/world/props-23/*.webp`, uitgeknipt uit één aangeleverde sheet met gezuiverde randen.
