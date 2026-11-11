# Från spendanalys till inköpsbeslut

Ett portföljprojekt av Aman Hussein med fiktiv övningsdata. Excelanalysen har byggts stegvis med handledning. Webbgränssnittet är framtaget med AI-stöd.

## Affärsfråga

Vilken artikel bör prioriteras, vilken leverantör och orderstorlek ger bäst beräknat utfall inom lagerkapaciteten, och hur följs leveranserna upp?

## Underlag

Arbetsboken `Inkopsanalys.xlsx` är användarens senaste originalfil. Den innehåller 16 fakturarader för 2025, tre leverantörer, fyra artiklar, två fiktiva offerter samt fem simulerade order för 2026. Data i `data.js` är exporterad från den filen. Delar av det simulerade helåret kan ligga efter dagens datum; de är inte observerade leveranser.

Historiska inköp: 60 830 kr exklusive moms. Wellpapplådor: 29 620 kr, 3 800 stycken, 48,69 % av inköpsbeloppet. Historiken innehåller inte frakt. Vägt snittpris är 29 620 / 3 800 ≈ 7,79 kr/st.

## Offertmodell

Antaget årsbehov: 3 800 lådor. Lagerkapacitet: 800 lådor. Antagen lagerhållningsränta: 20 %. Tre prövade orderstorlekar: 500, 800 och 1 000.

| Villkor | Nordisk Emballage | Packpartner |
|---|---:|---:|
| Styckpris | 7,60 kr | 7,30 kr |
| Frakt per order | 150 kr | 250 kr |
| Minsta order | 100 st | 500 st |
| Leveranstid | 5 arbetsdagar | 3 arbetsdagar |
| Betalning efter fakturadatum | 30 dagar | 15 dagar |

Priserna antas gälla från minsta orderkvantitet, med likvärdig kvalitet. Faktura antas utfärdas vid leverans. Orderstorlekarna i gränssnittet uppfyller båda leverantörernas minimikrav.

För årsbehov D, orderstorlek Q och MOQ:

1. Antal order n = avrundning uppåt av D / Q.
2. Sista order = max(MOQ, D − (n − 1) × Q).
3. Inköpsantal = (n − 1) × Q + sista order.
4. Kvarvarande lager = inköpsantal − D.
5. Snittlager = ((n − 1) × Q² + sista order² − kvarvarande lager²) / (2 × D).
6. Kalkylbelopp = inköpsantal × styckpris + n × frakt + snittlager × styckpris × lagerhållningsränta.

Snittlagret bygger på jämn förbrukning, inget start- eller säkerhetslager och mottagning när lagret når noll. Offertmodellens idealiserade leveranser ska inte blandas ihop med avvikelserna i den separata uppföljningsövningen.

### Grundresultat

| Orderstorlek | Nordisk Emballage | Packpartner | Inom kapacitet |
|---|---:|---:|---|
| 500 | 30 448,00 kr | 31 576,53 kr | Ja |
| 800 | 30 214,00 kr | 29 550,95 kr | Ja |
| 1 000 | 30 208,00 kr | 29 439,26 kr | Nej |

Grundrekommendationen är Packpartner med 800 per order: fyra order på 800 och en på 600. Skillnaden mot Nordisk Emballage i samma scenario är 663,05 kr. Rekommendationen är begränsad till de prövade alternativen; den är inte ett bevis för globalt optimal orderstorlek.

Kalkylbeloppet motsvarar Excelbladets ”Årskostnad”, alltså inköpsbelopp inklusive frakt och uppskattad lagerhållningskostnad. Vid 500 per order behöver Packpartner leverera 4 000 lådor; 200 blir kvar. Dessa varor ingår i årets inköpsbelopp men utgör lager, inte förbrukad kostnad. Jämförelsen är inte en fullständig TCO-modell eller resultaträkning. Betalningsvillkorens finansieringseffekt, orderadministration och störningskostnader ingår inte.

## Förhandling

Målpriset 7,10 kr/st är inte accepterat. Vid 800 per order blir den möjliga minskningen av varukostnaden 760 kr och den totala besparingspotentialen inklusive lägre lagerkostnad 775,37 kr. Jämförelsen avser Packpartners ursprungliga offert, inte historiska inköp eller realiserade besparingar. Interaktiva förändringar påverkar webbens beräkning men skriver inte tillbaka till Excel.

## Leveransuppföljning

Första leveransen per order bedöms mot bekräftat leveransdatum. Försening = max(0, faktisk leveransdag − bekräftad leveransdag), i kalenderdagar. Återstående antal = max(0, beställt − mottaget). OTIF kräver både leverans senast bekräftat datum och minst hela antalet.

Grundutfall: 2 av 5 order uppfyller OTIF (40 %), 2 är försenade och 50 lådor återstår. Fem fiktiva order ger inte grund för slutsatser om en verklig leverantör. Filtrering av ordertabellen påverkar inte helårsnyckeltalen ovanför tabellen.

## Användning

Öppna `index.html` i en webbläsare eller använd den publicerade dashboarden. Sidan kräver inget konto och skickar inte inmatade scenariovärden till en server. Alla beräkningar körs lokalt i webbläsaren. Den nedladdningsbara arbetsboken är oförändrad av webbens kontroller.

Historikfilter gäller endast spendanalysen. Offertreglage påverkar offertjämförelsen och förhandlingspotentialen, medan grundresultaten överst alltid beskriver originalcaset.
