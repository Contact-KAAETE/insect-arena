# INSECT ARENA — FAUNA & LANDSCHAPSMENU 1.9A

Datum: 22 november 2026. Dit is een praktische bouwvolgorde zonder Work.

## Doel en huidige problemen
De gebruiker speelt in landscape op iPhone. Versie 1.8A liet andere menu's niet verticaal scrollen doordat de fullscreen-CSS de hele pagina blokkeerde. In het vechterrooster waren vier krappe kolommen en oude NIEUW-stickers bedekten de naam. De fotorealistische WebP-dieren waren bovendien visueel veel sterker dan vijf later toegevoegde, vlakke SVG-beesten.

Doel: een gebruiksvriendelijke, scrollbare vechterkeuze en onderling consistente dieren met meer natuurlijke lichaamsbouw, detail, realistische kleur en geloofwaardige animaties.

## Uitvoeringsvolgorde

1. **Kritisch: landschapsscrolling.** Alleen het actieve gevecht blijft gefixeerd. Vechters, Werelden, Instellingen en Duel mogen verticaal scrollen, ook als het dertiende dier buiten beeld valt. Sticky Terug-balk, voldoende ondermarge, native iPhone-scroll.
2. **Kritisch: roster.** Drie kolommen in gewoon landscape, twee op nauwe iPhones; ruimere portretten, duidelijke soortnamen en statistieken. Oude overlappende NIEUW-badges verdwijnen. Geen wijzigingen aan joystick/gevechtsknoppen.
3. **Eerste beeldverbetering: nieuwe sprites.** Libellenlarve wordt anatomisch hertekend; reuzenduizendpoot, kruisspin, roofwants en veenmol krijgen huidtextuur, subtiele kleurverlopen, meer anatomische details en natuurlijke glans. Vijf oude versies blijven aanwezig als rollback.
4. **Vervolg met echt premium beeldmateriaal:** professioneel vrijstaande, natuurgetrouwe foto- of hoogwaardige 3D-assets voor alle dertien roofdieren, ieder in hetzelfde perspectief en schaal. Pas na goedkeuring nieuwe animaties en speciale aanvallen installeren.
5. **Eindcontrole:** Safari en standalone iPhone, 13 dieren, 6 biomen, tutorial, offline, gespeelde overwinningen en multiplayer op twee telefoons.

## Ontwerpbrief per dier

| ID | Soort | Visuele anatomie | Beweging/aanval | 1.9A-status |
| --- | --- | --- | --- | --- |
| 0 | Mier | Segmenteerde kop, thorax en achterlijf, 6 fijne poten, twee kaken | Alternerend snel tripodgegangetje, kaakbeet | Bestaande foto behouden |
| 1 | Bidsprinkhaan | Driehoekige kop, facetogen, lange prothorax, getande vangarmen | Langzaam wiegen, dubbele sikkelbeweging | Bestaande foto behouden |
| 2 | Neushoornkever | Zwaar schild, duidelijke hoornen, stevige zes poten | Pantserram met stofwolk | Bestaande foto behouden |
| 3 | Schorpioen | Acht looppoten, pedipalpen, gesegmenteerde staart | Tanggrijpbeweging, gifsteek | Bestaande foto behouden |
| 4 | Bombardeerkever | Glanzend dekschild, oranje poten, gesegmenteerde buik | Achterlichaam richt chemische straal | Bestaande foto behouden |
| 5 | Orchidee-bidsprinkhaan | Witte en roze bladlobben, facetogen, slanke poten | Camouflage, snelle hinderlaag | Bestaande foto behouden |
| 6 | Fluweelmier | Wingloze wesp, felrode fluweelharen, zwarte romp | Korte renpas, giftige steek | Bestaande foto behouden |
| 7 | Reuzenwaterwants | Plat ovaal lichaam, grijppoten, zuigsnuit | Beide voorpoten sluiten tegelijk | Bestaande foto behouden |
| 8 | Reuzenduizendpoot | Overlappende dorsale schilden, poriën, veel poten, gifkaken | Segmentgolven en klemgreep | Gedetailleerder SVG in 1.9A |
| 9 | Kruisspin | 8 gelede harige poten, kleine ogen, chevron-/kruisteken | Web uit spinneret, prooi immobiliseren | Gedetailleerder SVG in 1.9A |
| 10 | Roofwants | Gevouwen vleugels met aderen, lange poten, rostrum | Snelle giftige steek | Gedetailleerder SVG in 1.9A |
| 11 | Libellenlarve | Zes poten aan borststuk, olijfbruin abdomen, facetogen, vangmasker | Uitschietend labium en waterstoot | Nieuwe anatomische SVG in 1.9A |
| 12 | Veenmol | Breed borststuk, fijne beharing, krachtige stekelige graafpoten | Graafslag en aardschok | Gedetailleerder SVG in 1.9A |

## Eén visuele norm
Geen plastic speelgoedlook of onnatuurlijke grote oogjes; wel natuurgetrouwe chitine, macrodetails, nerfstructuur, zacht rimlight, donkere contactschaduw op de bosbodem en subtiel kleurlicht dat per wereld past. Alle dieren moeten als transparante sprite en in dezelfde richting naar rechts bekeken worden. De bestaande renderer spiegelt de unit als hij naar links loopt. Afbeeldingen moeten scherp blijven op retina-schermen, binnen redelijke bestandsgrootte en zonder externe trackers.

## Gedetailleerd premium vervolg — nog open
- Eerst 5 prioriteiten: Fluweelmier, Libellenlarve, Mier, Bombardeerkever, Reuzenduizendpoot.
- Vervolgens de andere 8 in hetzelfde beeldniveau.
- Per dier levensechte afzonderlijke animatiefasen: stilstaand, wandelen, schade, aanval, special, verslagen.
- Houd gameplay leesbaar en 60 fps op iPhone als prestatieambitie.
- Gebruik rechtenvrij of correct gelicentieerd bronbeeld. Geen auteursrechtelijk beschermde foto kopiëren zonder toestemming.
- Behoud oude sprites, stats, 13 fighter IDs, zes biomen, tutorial en multiplayer-protocol gedurende elke upgrade.

## Acceptatie 1.9A
- In landscape kun je helemaal van het bovenste dier naar het onderste dier en de START-knop scrollen, en weer terug.
- Werelden, Instellingen en online Duel kunnen eveneens scrollen.
- Menu heeft geen overlappende NIEUW-labels.
- Alle 13 dierbeelden laden en vijf vectoren hebben aantoonbaar meer microdetail.
- Het gevecht blijft fullscreen, de joystick links en de aanvallen rechts blijven werken.
- Eén bestaand iPhone-icoon blijft voldoende: PWA-versiecontrole krijgt ook release 1.9A.
- De opgeslagen voortgang wordt nooit gewist.

**Statusgrens:** versie 1.9A voegt kwalitatief rijkere vectorillustraties toe, maar is nadrukkelijk nog niet de volledige professionele fotorealistische 3D-upgrade. Die vraagt nieuwe hoogwaardige bronassets en animatieproductie.
