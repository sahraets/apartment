# Leilighetsplanlegger

En liten pixel-art planlegger for leiligheten vår. Kartet over leiligheten er et
Phaser-spill du kan gå rundt i, og under kartet ligger rompanelene med budsjett
og lista over ting vi har kjøpt eller ønsker oss. Møblene på kartet tegnes ut fra
tingene i databasen — legger du til en sofa i lista, dukker den opp i stua.

![Oversikt over appen](docs/images/oversikt.png)

## Kom i gang

```bash
npm install
npm run dev
```

Appen kjører på http://localhost:3000.



Andre skript:

```bash
npm run build   # produksjonsbygg
npm run start   # kjører produksjonsbygget
npm run lint    # eslint
```

## Sånn henger det sammen

Data går alltid samme vei, og hvert lag kjenner bare laget under seg:

```
UI / spill  →  client-service  →  API-route  →  server-service  →  repository  →  Supabase / mock
```

| Mappe | Ansvar |
| --- | --- |
| `app/` | Sider og API-routes. Routene oversetter bare mellom HTTP og service-laget — ingen forretningslogikk, ingen databasekall. |
| `components/` | React-UI: rompanelene (`RoomList`), skjemaet for nye ting (`AddItemForm`), spillcanvaset (`GameCanvas`) og temabryteren. |
| `game/` | Phaser-laget: plantegningen (`apartment.ts`), scenen (`ApartmentScene.ts`), spilleren og møbeltegningen (`furniture.ts`). |
| `services/` | Client-services. UI og spill kaller disse i stedet for `fetch` direkte, så endepunkt-URL-ene ligger ett sted. |
| `server/services/` | Forretningslogikken: validering og budsjettutregning. |
| `server/auth/` | Passordsjekk og signering av økt-cookien. |
| `server/repositories/` | Eneste laget som snakker med en datakilde. `index.ts` velger mock eller Supabase ut fra miljøvariablene. |
| `types/` | Delte modeller (`Room`, `Item`, `Budget`, møbeltyper). Kjenner ikke til datakilden. |
| `supabase/` | SQL-migrasjoner. |


## Bruk

Gå rundt med **piltastene** eller **WASD**. Går du inn i trappa i hjørnet av
stua, bytter du etasje til sovehemsen — og motsatt vei igjen. Tastaturet slipper
taket når du skriver i et skjemafelt, så du kan skrive «sofa» uten at figuren
løper av gårde.

Under kartet ligger ett kort per rom med budsjettlinje, hva som er kjøpt,
bestilt og ønsket, og lista over tingene. **+ Legg til ting** åpner skjemaet,
og `×` sletter (med bekreftelse).

![Rompanel med budsjett](docs/images/rompanel.png)

## Skjermbilder

Bildene i README-en ligger i `docs/images/`. Legg nye bilder der og lenk dem inn
med `![beskrivelse](docs/images/filnavn.png)` — for eksempel et bilde av
rompanelene under kartet, eller sovehemsen.
