# TODO — pagina Music e restyling

Stato al 21 settembre 2026. Tutto il lavoro è in **locale**, sul branch `wip-font-dropdown`. **Niente è stato pubblicato**: tanarouge.com serve ancora la versione ripristinata a inizio sessione (commit `c32f530`).

Per riprendere:

```bash
cd /Users/gianmarco.rosso/workarea/01-tanarouge/tanarouge-spa/tanarouge-spa
git checkout wip-font-dropdown
BROWSER=none PORT=4000 npm start
```

---

## Da fare

### 1. Brani da aggiungere alle playlist (azione tua, non di codice)

Lo script legge **solo** dalle playlist Spotify: quello che non è in playlist non può comparire sul sito. Verificato che questi non ci sono:

**Da aggiungere a "Produced by Tanarouge"** (la playlist che alimenta la sezione Works):
- Slim G — Pianeta X (`spotify:track:44Z3VV3vOsFw3ZgmljaDio`) e l'album *A pezzi* (`spotify:album:4MBW9V4KZFeOHHTGn3TzfV`)
- Modo
- Misteralf
- Jumex
- Zeeph / Dres — *Equilibrio* (ISRC `NL1AP1972435`)

**Da aggiungere a "This Is Tanarouge"**:
- Coordinates — oggi appare in Works perché sta in quella playlist
- Six Years — stessa cosa

Dopo averli aggiunti, lanciare `npm run sync-releases`: compaiono da soli, con copertina, crediti e durata.

### 2. Link Spotify mancanti sugli album

Sei release non hanno il link Spotify, e sono **tutte** album multi-traccia: When The Light Was Slow, RADICI, MANUALE DEL PICCOLO INGRATO, COLORE SENTIMENTO, Nuovi Fossili, CULT.

La causa è nota: la playlist dà l'id della traccia, non dell'album, e l'embed di Spotify per una traccia **non espone l'album** (verificato, nessun `spotify:album:` nel payload). Per un disco non ho quindi un URL da usare.

L'unica via pulita è l'**API Spotify ufficiale**: registrare un'app gratuita su developer.spotify.com, mettere Client ID e Secret fra le variabili d'ambiente di Netlify, e chiamare l'endpoint album. È una configurazione una tantum.

Venti release sono senza link Apple, per lo stesso motivo di fondo: iTunes non trova corrispondenza per quel disco.

### 3. Tardi dentro la sezione Tanarouge

"Tardi" deve comparire fra i pezzi di Tanarouge come **traccia** dell'EP CULT (che resta in Works come disco intero, essendo di Tauma).

La regola è scritta nello script — un ospite su un disco altrui appare come traccia nella propria sezione — ma sul caso CULT non risulta applicata. Da verificare.

### 4. Contributi singoli mostrati come album interi

Just Swimming Mixtape (Roy Raheem) e D special 1.5 (Zeeph) appaiono come dischi completi, ma di quei lavori hai prodotto **una sola traccia**: rispettivamente Easy Life ed Envie.

Il conteggio delle tracce distinte è stato corretto, ma il risultato non è ancora quello atteso. Da ricontrollare dopo l'ultima sincronizzazione.

### 5. Tidal, Amazon Music, YouTube Music

Le icone sono già installate in `public/assets/icons/`, i link no.

Verificato: Tidal risponde **401** su entrambi gli endpoint pubblici (serve autenticazione), Amazon Music non ha API pubblica, YouTube Music richiede una chiave Google. Lo scraping dei motori di ricerca non funziona — Google, Bing e DuckDuckGo servono i risultati via JavaScript e non restituiscono URL utilizzabili.

Le opzioni reali:
- **link Amuse** (`share.amuse.io`): sono pagine multilink ufficiali che contengono già tutte le piattaforme. È la strada migliore se hai un export dal distributore
- **Odesli a pagamento**: risolverebbe tutto in automatico, da valutare il costo su odesli.co
- **ricerche costruite**: funzionano sempre ma portano ai risultati di ricerca, non alla pagina della release

### 6. Bio mobile

La versione corta in `src/pages/Info.jsx` (`.mobile-bio`) è rimasta quella vecchia, una riga sola. Va decisa: aggiornarla con la nuova bio o lasciarla così.

---

## Fatto in questa sessione

**Font** — Bandeins Strange (licenza tua, convertita da .ttf a .woff2, 33 KB) per l'header, Inter per il testo corrente. Entrambi self-hosted: un `<link>` a Google Fonts **fa fallire la build**, perché `npm run build` esegue react-snap con `skipThirdPartyRequests`.

**Header** — dropdown Tanarouge/TNRG su Spotify e Apple, hover che ingrigisce la voce puntata, allineamento su baseline, pulsante tema dentro la fila delle icone. Voci in maiuscolo.

**Pagina Music** — tre sezioni a tab (Tanarouge / TNRG / Works), ricerca che attraversa tutti i cataloghi, ordinamento (Newest, Oldest, A–Z), griglia di copertine, modale al click con artwork grande, crediti, durata e loghi delle piattaforme. Titoli lunghi che scorrono in loop al passaggio del mouse.

**Sincronizzazione** — `npm run sync-releases` legge le tre playlist Spotify e ricostruisce `src/data/releases.json`. Nessuna credenziale.

**Pagina Info** — bio nuova, link a Santissima Foresta In Fiamme (`instagram.com/santissimaff`), corsivo rimosso, dimensioni uniformate.

---

## Note per chi riprende

**Prima di pubblicare** provare sempre la build completa:

```bash
CI=true npm run build
```

Non basta `react-scripts build`: salta react-snap, ed è lì che le build fallivano.

**Il deploy** avviene su push a `main`. Netlify builda da sé, senza GitHub Actions. Serve l'account **tanarouge@gmail.com**, non l'altro.

**Per misurare** com'è reso davvero un elemento invece di stimarlo a occhio, Puppeteer è già fra le dipendenze. La distinzione conta: il riquadro di un elemento e i pixel che disegna stanno in posizioni diverse, ed è il secondo che si vede. Diversi giri a vuoto di questa sessione nascono dall'aver corretto a occhio invece di misurare.

**Per il rollback** dello stile c'è `STYLE-ROLLBACK.md`, con i valori originali e le due correzioni che dipendono dal font (offset del glifo `⊙` e scala del carattere `©`) — vanno **rimisurate** se il font cambia.
