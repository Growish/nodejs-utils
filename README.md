# @growishpay/nodejs-utils

**GrowishPay nodejs utils**

---

## Descrizione

`@growishpay/nodejs-utils` è una libreria di utility condivise per i servizi Node.js di GrowishPay.
Fornisce moduli pronti all'uso per logging (locale e cloud), gestione della connessione a MongoDB (mongoose), notifiche Slack, un plugin mongoose per la sincronizzazione con Salesforce, middleware/helper per Express, graceful shutdown e autoloading dinamico di file.

Il codice sorgente è scritto in **JavaScript (ESM)** con annotazioni JSDoc; `tsup` viene usato solo in fase di build per generare i bundle ESM e CommonJS in `dist/`.

---

## Requisiti

- Node.js >= 20.0.0
- Peer dependencies (obbligatorie):
  - `express` >= 5.2.1
  - `mongoose` >= 8.15.1

---

## Installazione

Il pacchetto è pubblicato su **GitHub Packages** sotto lo scope `@growish`. Per poterlo installare è necessario un `.npmrc` (a livello di progetto o utente) che punti il registry dello scope a GitHub Packages, con un token che abbia permesso `read:packages`:

```
@growish:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN>
```

Poi installare normalmente:

```bash
npm install @growishpay/nodejs-utils
```

---

## Importazione e utilizzo

La libreria supporta sia ESM che CommonJS.

### Import named (con destructuring)

```js
import {
  logger,
  loggerCloud,
  notifier,
  mongoose,
  express,
  gracefulShutdown,
  createAutoloader
} from '@growishpay/nodejs-utils';

logger.info('Logger attivo');
loggerCloud.info('Logger cloud attivo');
```

### Import default (senza destructuring)

```js
import utils from '@growishpay/nodejs-utils';

utils.logger.info('Logger attivo');
await utils.mongoose.connect(/* ... */);
```

---

### CommonJS

Named import con destructuring:

```js
const {
  logger,
  loggerCloud,
  notifier,
  mongoose,
  express,
  gracefulShutdown,
  createAutoloader
} = require('@growishpay/nodejs-utils');

logger.info('Logger attivo');
loggerCloud.info('Logger cloud attivo');
```

Default import:

```js
const utils = require('@growishpay/nodejs-utils');

utils.logger.info('Logger attivo');
utils.loggerCloud.info('Logger cloud attivo');
```

---

## Moduli principali

## logger

Modulo di logging basato su [winston](https://github.com/winstonjs/winston). L'istanza viene creata in lazy loading al primo utilizzo (tramite `Proxy`), quindi non ha costo se non viene mai chiamata.

- livelli: `debug`, `info`, `error` (oltre agli altri livelli standard winston)
- rotazione giornaliera dei file (`winston-daily-rotate-file`), max 25MB per file, retention 60 giorni
- scrive in `./logs/info-YYYY-MM-DD.log` ed `./logs/err-YYYY-MM-DD.log` (creando la cartella `logs` se non esiste) più output colorato su console
- il secondo parametro accetta un oggetto di contesto: `tag` per identificare il componente/modulo, ed eventuali campi extra che vengono serializzati come JSON
- se un campo passato è un'istanza di `Error`, viene serializzato automaticamente (`type`, `message`, `code`, `status`); se è un errore Axios (`isAxiosError`), vengono inclusi anche `method`, `url`, `status` e `responseData` della richiesta fallita

```js
logger.info('Informazione di log', { tag: 'mioComponente' });
logger.error('Errore registrato', { tag: 'mioComponente', error });
```

### loggerCloud

Versione cloud del logger, pensata per ambienti dove i log vengono raccolti da CloudWatch e poi consultati da Grafana.

- non scrive file su disco (nessuna cartella `logs` viene creata)
- emette solo log JSON su console (stdout per i livelli normali, stderr per `error`)
- stessa gestione di `tag` e serializzazione errori/Axios del logger locale

```js
import { loggerCloud } from '@growishpay/nodejs-utils';

loggerCloud.info('Informazione di log', { tag: 'mioComponente' });
```

---

## express

### express.apiMiddleware

Middleware Express da montare globalmente per standardizzare le risposte delle API. Applica anche `req.locals.requestStart` (usato per calcolare `requestTime` in ogni risposta) e aggiunge una serie di helper su `res`.

```js
import express from 'express';
import utils from '@growishpay/nodejs-utils';

const app = express();
app.use(utils.express.apiMiddleware);
```

Ogni risposta JSON ha la forma `{ code, data?, message?, pagination?, requestTime }`. `data` viene estratto automaticamente chiamando `getPublicFields()` o `toJSON()` sul payload (se presenti) e rimuovendo il campo `__v`.

Helper disponibili su `res`:

| Metodo | Status | Descrizione |
| --- | --- | --- |
| `res.resolve(payload)` | 200 | Risposta OK con payload |
| `res.aggregationResolve(payload)` | 200 | Risposta OK senza wrapping/estrazione dati (per risultati di aggregazioni) |
| `res.csv(payload)` | 200 | Converte un array di oggetti in CSV e lo invia come allegato `export.csv` |
| `res.badRequest(payload)` | 400 | Bad Request |
| `res.unauthorized(message)` | 401 | Unauthorized |
| `res.forbidden(message, payload)` | 403 | Forbidden |
| `res.notFound()` | 404 | Not Found |
| `res.conflict(reason, message)` | 409 | Conflict, con campo `reason` nel payload |
| `res.timeout(message)` | 408 | Request Timeout |
| `res.tooManyRequests(message)` | 429 | Too Many Requests |
| `res.applicationError(message)` | 500 | Internal Server Error |
| `res.unavailable(message)` | 503 | Service Unavailable |
| `res.setPagination(p)` | - | Imposta i metadati di paginazione da includere nella prossima risposta (chainable) |
| `res.apiErrorResponse(err, controllerName)` | varia | Mappa automaticamente un errore alla risposta più appropriata (vedi sotto) |

`res.apiErrorResponse` riconosce alcuni tipi di errore per nome (`err.name`) e li traduce in una risposta coerente:

- `ValidationError` → 400 con `err.data` come payload
- `ForbiddenError` → 403 con `err.message`
- `ConflictError` → 409 con `{ reason: err.reason }`
- qualsiasi altro errore → 500, loggato automaticamente con `logger.error`

È inoltre disponibile `res.errorConstants`, un dizionario di codici applicativi custom (es. `MISSING_EMAIL_CONFIRMATION`, `INVALID_SMS_OTP`) da usare nel payload di errore quando serve un codice più granulare dello status HTTP.

---

### express.logger

Express middleware per il logging delle richieste HTTP, basato su [morgan](https://github.com/expressjs/morgan) (formato `combined`) con output su file tramite winston (rotazione giornaliera, stesse regole del logger principale, file `http-YYYY-MM-DD.log`).

```js
import express from 'express';
import utils from '@growishpay/nodejs-utils';

const app = express();
app.use(utils.express.logger);
```

### express.loggerCloud

Versione cloud del logger HTTP per Express: nessun file su disco, output JSON su console.

```js
import express from 'express';
import utils from '@growishpay/nodejs-utils';

const app = express();
app.use(utils.express.loggerCloud);
```

---

### express.routeHandler

Utility per definire le rotte API con una fluent API, con logging contestualizzato per ogni controller e gestione automatica degli errori tramite `apiMiddleware`.

Va inizializzato una sola volta con l'istanza Express, prima di registrare le rotte: `init` monta automaticamente `apiMiddleware` sull'app.

```js
import express from 'express';
import utils from '@growishpay/nodejs-utils';

const app = express();

// locale (default 'en') e debug (default false, logga query/body nelle richieste) sono opzionali
utils.express.routeHandler.init(app, 'en', false);

utils.express.routeHandler.routeController('mioController')
    .setMethod('get')
    .setRoute('/')
    .setMiddlewares([ /* middleware opzionali */ ])
    .controller(async (req, res, logger) => {
        logger.info('richiesta ricevuta');
        res.resolve({ message: 'ok' });
    });
```

Il `logger` passato al controller è contestualizzato con il nome del controller (`tag`) ed espone `debug`, `info`, `error`. Eventuali eccezioni lanciate nel controller vengono catturate e trasformate in risposta tramite `res.apiErrorResponse`.

---

### notifier

Modulo per inviare notifiche su un canale Slack tramite webhook/Bot OAuth token. Utile per notifiche di alert o messaggi automatici.

#### Esempio di utilizzo

```js
import { notifier } from '@growishpay/nodejs-utils';

const environment = 'develop';
const botOauthToken = 'bot oauth token app slack'; // token legato all'app slack recuperabile da https://api.slack.com/apps in oauth permission
const channel = '#test'; // default channel per le notifiche, se non indicato è #general

notifier.init(environment, botOauthToken, channel); // init del notifier, lanciare prima di utilizzare nel servizio
notifier.send('Questo è un messaggio di test inviato dal modulo notifier!');
```

`notifier.send(text, attachment, level, channel)` supporta anche:

- `attachment` (opzionale): oggetto da allegare al messaggio, mostrato come blocco di codice JSON
- `level`: `'low'` (default, ℹ️ blu), `'medium'` (⚠️ giallo) o `'high'` (🔥 rosso) — determina colore ed emoji del messaggio
- `channel` (opzionale): sovrascrive per il singolo invio il canale impostato in `init`

Se `notifier.init` non è stato chiamato, `send` non invia nulla e logga un errore.

---

## mongoose

### mongoose.connect

Gestisce la connessione a MongoDB con retry automatico in fase di avvio, riconnessione automatica in caso di disconnessione, e chiusura pulita della connessione in fase di graceful shutdown (registrata automaticamente con priorità 20).

```js
import { mongoose } from '@growishpay/nodejs-utils';

// maxRetry (default 5) e maxRetryDelay in ms (default 5000) sono opzionali
await mongoose.connect('mongodb://localhost:27017/dbname', 5, 5000);
```

Se il numero massimo di tentativi viene superato senza successo, `connect` lancia un'eccezione.

---

### mongoose.salesforcePlugin

Plugin Mongoose per l'integrazione con Salesforce: aggiunge un hook `post('save')` che invoca una funzione di push, e due metodi d'istanza (`pushToSalesforce`, `deleteFromSalesforce`) per la sincronizzazione manuale.

Va inizializzato una volta sola, prima di applicarlo agli schema, con le funzioni che effettuano realmente la push/delete verso Salesforce:

```js
import { mongoose } from '@growishpay/nodejs-utils';

// realTimeSyncActive, pushFn, deleteFn (opzionale), ignorePushAfterSave (default false)
mongoose.salesforcePlugin.init(true, async ({ assetId, assetClass, hook }) => { /* push */ });

const modelSchema = /** Schema definito **/
modelSchema.plugin(mongoose.salesforcePlugin.mongoosePlugin, {
    assetClass: 'model',
    addSchema: true // aggiunge allo schema i campi salesforce.sync (Boolean) e salesforce.lastSyncAt (Date)
});
```

Note:

- se `realTimeSyncActive` è `false`, l'hook `post('save')` non effettua la push automatica (ma `pushToSalesforce(force: true)` può comunque forzarla)
- `ignorePushAfterSave: true` disabilita solo la push automatica post-save, lasciando disponibili i metodi manuali
- `pushFn`/`deleteFn` ricevono `{ assetId, assetClass, hook }`, dove `hook` vale `'save'` per la push automatica e `'direct'` per le chiamate manuali

---

## gracefulShutdown

Utility per registrare funzioni da eseguire allo shutdown del servizio, in risposta a `SIGINT`, `SIGTERM`, `unhandledRejection` e `uncaughtException` (questi ultimi due gestiti automaticamente all'import del modulo).

```js
import { gracefulShutdown } from '@growishpay/nodejs-utils';

// priority (default 0): handler con priorità più alta vengono eseguiti per primi
gracefulShutdown.register(async () => {
    // logica di chiusura, es. chiudere connessioni/server
}, 'nome-handler', 10);
```

Tutti gli handler registrati vengono eseguiti in parallelo (in ordine di priorità decrescente) con un timeout complessivo di 10 secondi, dopodiché il processo termina con `process.exit(0)` in ogni caso. Un errore in un singolo handler viene loggato ma non blocca gli altri.

---

## autoloader

Utility per caricare dinamicamente (lazy import) file del progetto tramite pattern glob, basata su [fast-glob](https://github.com/mrmlnc/fast-glob).

```js
import { createAutoloader } from '@growishpay/nodejs-utils';

const autoloader = createAutoloader({
  baseDir: process.cwd(),      // opzionale, default process.cwd()
  verbose: true,                // opzionale, logga file trovati e importati
  onFileLoad: (module, file) => { /* eseguito dopo ogni import riuscito */ },
  onError: (err, file) => { /* eseguito se un import fallisce */ }
});

await autoloader.load([
  'path/plugins/*.js',
  'path/controllers/**/*.js'
]);
```

Un errore di import di un singolo file viene loggato e passato a `onError`, senza interrompere il caricamento degli altri file.

---

## Test

```bash
npm test
```

Esegue con il test runner nativo di Node (`node --test`) i file `test/*.test.js` (es. [test/logging-mode.test.js](test/logging-mode.test.js), che verifica i transport usati da `logger`/`loggerCloud` e il comportamento cloud-only). `test/local.js` e `test/cloud.js` sono script manuali di verifica del logger, non fanno parte della suite automatica.

---

## Build

La libreria è scritta in JavaScript (ESM) e viene compilata con [`tsup`](https://tsup.egoist.dev/) per produrre bundle ESM (`dist/index.js`) e CommonJS (`dist/index.cjs`), a partire dal solo entry point `src/index.js`.

Per buildare localmente:

```bash
npm run build
```

> **Nota:** Se installi da GitHub, assicurati che la cartella `dist/` sia presente nel repository, oppure esegui la build manualmente dopo l'installazione.

---

## Versionamento e release

Si utilizza [`standard-version`](https://github.com/conventional-changelog/standard-version) per semplificare versioning e changelog.

Per effettuare una release patch

```bash
npm run release:patch
```

Per effettuare una release minor

```bash
npm run release:minor
```

Per creare una release major

```bash
npm run release:major
```

Se la release viene creata con successo procedere a pushare su git e pubblicare su npm con i seguenti comandi

```bash
npm run git:push
```

```bash
npm publish
```

---

## Dipendenze

### runtime

- axios
- fast-glob
- morgan
- winston
- winston-daily-rotate-file

### peer dependencies

- express (>= 5.2.1)
- mongoose (>= 8.15.1)

### dev

- express
- mongoose
- standard-version
- typescript
- tsup (per build)

---

## Autore

Lorenzo Colombini  
<lorenzo.colombini@growishpay.com>

---

## Licenza

ISC

---

## Keywords

nodejs, utils, growishpay
