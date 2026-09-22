# Ripristino dello stile originale

Come tornare al design che il sito aveva prima del lavoro sul font di settembre 2026.

Lo stato di riferimento è il commit **`c32f530`** (`fix: detect and skip blank/broken visualizer chapters`), l'ultimo servito in produzione prima delle modifiche.

---

## Via rapida: ripristinare tutto

Se vuoi il CSS originale esatto, senza selezionare cosa tenere:

```bash
git checkout c32f530 -- src/style.css public/index.html
```

Se sono cambiati anche i componenti:

```bash
git checkout c32f530 -- src/components/Header.jsx src/pages/Info.jsx
```

Poi rimuovi i file font aggiunti dopo, se non servono più:

```bash
rm -rf src/fonts
```

Il deploy avviene su push a `main`: Netlify builda da sé, senza GitHub Actions.

---

## Via rapida: ripristinare solo la produzione

Netlify conserva i deploy passati, quindi il sito può tornare indietro **senza toccare il codice**. Utile per rimettere subito online la versione buona e sistemare il repo con calma.

```bash
netlify api restoreSiteDeploy --data '{"site_id":"ade9d4af-54f5-4169-b432-dbeb4224e681","deploy_id":"<id>"}'
```

L'id del deploy da ripristinare si trova con:

```bash
netlify api listSiteDeploys --data '{"site_id":"ade9d4af-54f5-4169-b432-dbeb4224e681"}'
```

Serve essere loggati con l'account **tanarouge@gmail.com** (`netlify login`); il sito è `tanarouge`, non quello dell'altro account.

Attenzione: un push successivo su `main` ricostruisce e sovrascrive il ripristino. Il rollback su Netlify è un rimedio temporaneo, non sostituisce la correzione nel repo.

---

## Valori originali, per ripristinare a mano

Se preferisci riportare indietro solo alcune parti.

### Font

Il font dichiarato era **Aguzzo**, in due tagli:

```css
header {
    font-family: 'Aguzzo Regular' !important;
}

.music-item .info {
    font-family: 'Aguzzo Italic', sans-serif;
}
```

**Da sapere prima di ripristinarlo:** i file `Aguzzo-Regular7.otf` e `Aguzzo-Regular-Italic7.otf` stanno in `public/assets/fonts/`, ma **nessuna regola `@font-face` li carica**. Il font non veniva quindi mai applicato davvero: il browser ricadeva sui caratteri di sistema, ed è quello che si vedeva online.

Quindi ci sono due ripristini possibili, che danno risultati diversi:

- **Tornare a com'era veramente** — rimetti le due dichiarazioni qui sopra e non aggiungere `@font-face`. Il sito userà i font di sistema, come ha sempre fatto.
- **Far funzionare Aguzzo per davvero** — aggiungi le regole `@font-face` che mancano. È un aspetto nuovo, mai stato online.

### Corsivo

Il corsivo era presente in tre punti, tutti portati a `normal` durante le modifiche:

```css
.menu a:not(.artist-name) { font-style: italic; }   /* voci del menu desktop */
.music-item .info         { font-style: italic; }   /* overlay sulle copertine */
#footer-container         { font-style: italic; }   /* footer */
```

Nella pagina Info l'indirizzo mail era spezzato in tag `<em>`, che lo rendevano corsivo:

```jsx
<a href="mailto:tanarouge@gmail.com"><em>tanarouge</em>@<em>gmail.com</em></a>
```

### Dimensioni e spaziature

| Elemento | Regola | Valore originale |
|---|---|---|
| Corpo del testo | `body` | `font-size: 11px`, `letter-spacing: 2px`, `line-height: 2em` |
| Titolo header | `.menu a.artist-name` | `font-size: 1.5rem`, nessun `letter-spacing` |
| Voci del menu | `.menu a:not(.artist-name)` | `font-size: 1.2rem`, corsivo, nessun `text-transform` |
| Pulsante tema | `.theme-toggle` | `font-size: 1.6rem`, `position: relative`, `top: -3px` |
| Copyright | `.infobox.copyright` | `font-size: 11px` |
| Link pagina Info | `.infobox a` | `font-size: 1rem` |

Le voci del menu erano in **minuscolo**: il `text-transform: uppercase` è stato aggiunto dopo, sia su `.menu a:not(.artist-name)` sia su `.mobile-menu a`.

### Allineamento dell'header

L'header originale allineava al centro:

```css
.menu { align-items: center; }
```

È stato poi portato a `baseline`, perché centrare elementi di dimensioni diverse non allinea il testo: le lettere non stanno al centro della propria riga. Se rimetti le dimensioni originali, `center` torna coerente.

Il pulsante del tema aveva un `top: -3px` scritto a mano per compensare quel disallineamento. Va rimesso insieme a `center`, o tolto insieme a `baseline`: i due vanno in coppia.

### Icone social

Le icone erano tutte a `1rem`, con Amazon Music a `1.3rem`:

```css
.social a img { width: 1rem; height: 1rem; }
.social a img[src*="amazonmusic.svg"] { width: 1.3rem; height: 1.3rem; }
```

Quel `1.3rem` non è arbitrario: il disegno dentro l'icona Amazon ha un margine interno più generoso delle altre, quindi a parità di riquadro apparirebbe più piccolo.

Nell'header originale il pulsante del tema stava **fuori** dal blocco `.social`, come elemento fratello. È stato poi spostato dentro, perché da fuori non poteva condividere l'allineamento della fila.

---

## Cosa è stato aggiunto dopo, e non esisteva prima

Se il ripristino deve essere completo, queste parti vanno rimosse.

**Font Inter** — i file in `src/fonts/` e le regole `@font-face` in cima a `src/style.css`. Il font è self-hosted e non caricato da Google Fonts, per un motivo che conta: `npm run build` esegue `react-snap` dopo CRA, configurato con `skipThirdPartyRequests`, che blocca le richieste esterne durante il prerender. Un `<link>` a `fonts.googleapis.com` **fa fallire la build** con `TypeError: Failed to fetch`. Se un giorno si aggiunge un font esterno, va self-hostato per lo stesso motivo.

**Menu a tendina social** — il componente `src/components/SocialDropdown.jsx` e le regole `.social-dropdown*` nel CSS. Serve a far scegliere fra i profili Tanarouge e TNRG su Spotify e Apple Music. Senza di esso le icone tornano link diretti al solo profilo Tanarouge.

**Contenitore `.nav-links`** — introdotto in `Header.jsx` per raggruppare le voci di navigazione. Serve a limitare l'effetto hover a quelle: quando la regola era su `.menu`, passare sul pulsante del tema sbiadiva anche le icone social, che sono elementi fratelli.

**Correzioni misurate** — due valori che vengono da misurazioni sulla pagina renderizzata, non da stime:

- `.theme-toggle` ha `top: -1.74px`. Il glifo `⊙` non è centrato nella propria cella tipografica, e di quanto sbandi dipende dal font: Nata Sans `-2.75px`, Cormorant Garamond `-1.1px`, Inter `-1.74px`.
- `.copyright-mark` scala il carattere `©` a `1.25em`. Nei font quel simbolo è disegnato come apice, circa il 79% dell'altezza delle maiuscole accanto.

Entrambi valgono per il font attualmente in uso. **Cambiando font vanno rimisurati**, perché dipendono dalle metriche di quello specifico carattere.

---

## Verificare un ripristino

Il server di sviluppo gira sulla porta **4000** (la 3000 è occupata da Docker):

```bash
BROWSER=none PORT=4000 npm start
```

Prima di pubblicare, conviene provare la build completa, che include il prerender:

```bash
CI=true npm run build
```

Non basta `react-scripts build`: salta `react-snap`, che è proprio dove le build sono fallite durante questo lavoro.

Per misurare com'è reso davvero un elemento invece di stimarlo a occhio, Puppeteer è già fra le dipendenze del progetto e può essere usato da uno script temporaneo. La differenza conta: il riquadro di un elemento e i pixel che disegna possono trovarsi in posizioni diverse, ed è il secondo che si vede.
