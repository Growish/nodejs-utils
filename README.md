# @growishpay/nodejs-utils

**GrowishPay nodejs utils**

---

## Descrizione

`@growishpay/nodejs-utils` è una libreria utility per node.js
Fornisce moduli per logging, gestione connessione mongoose, notifier, plugin mongoose, salesforce ed express

---

## Requisiti

- Node.js >= 16.0.0
- Peer dependencies:
  - `express` >= 4.0.0
  - `mongoose` >= 7.0.0

---

## Installazione

La libreria si può installare via npm

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
  notifier,
  mongoose,
  express,
  gracefulShutdown,
  createAutoloader
} from '@growishpay/nodejs-utils';

logger.info('Logger attivo');
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
  notifier,
  mongoose,
  express,
  gracefulShutdown,
  createAutoloader
} = require('@growishpay/nodejs-utils');

logger.info('Logger attivo');
```

Default import:

```js
const utils = require('@growishpay/nodejs-utils');

utils.logger.info('Logger attivo');
```

---

## Moduli principali

## logger

Modulo di logging basato su [winston](https://github.com/winstonjs/winston), configurato per rotazione giornaliera dei file.

```js
logger.info('Informazione di log', { tag: 'mioComponente'});
logger.error('Errore registrato', { tag: 'mioComponente', error});
```

---

## express

### express.apiMiddleware

Express middleware per standardizzare le risposte api

```js
import express from 'express';
import utils from '@growishpay/nodejs-utils';

const app = express();
app.use(utils.express.apiMiddleware);
```

---

### express.logger

Express utilities per logging delle richieste HTTP, basato su [morgan](https://github.com/expressjs/morgan).

```js
import express from 'express';
import utils from '@growishpay/nodejs-utils';

const app = express();
app.use(utils.express.logger);
```

---


### express.routeHandler

Express utilities per definire una nuova rotta api con metodi chainable

```js
import express from 'express';
import utils from '@growishpay/nodejs-utils';

const app = express();

utils.express.routeHandler.routeController(tag)
    .setMethod('get')
    .setRoute('/')
    .controller(async (req, res, logger) => {
        res.send({"message": "ok"});
    });

```

---

### notifier

Modulo per inviare notifiche su canale slack tramite webhook. utile per notifiche di alert o messaggi automatici.

#### Esempio di utilizzo

```js
import { notifier } from '@growishpay/nodejs-utils';

const environment = 'develop';
const botOauthToken = 'bot oauth token app slack'; // token legato all'app slack recuperabile da https://api.slack.com/apps in oauth permission
const channel = '#test'; // default channel per le notifiche, se non indicato è #general



notifier.init(environment, botOauthToken, channel); // init del notifier, lanciare prima di utilizzare nel servizio
notifier.send('Questo è un messaggio di test inviato dal modulo notifier!');
```

---

## mongoose

### mongoose.connect

Gestisce la connessione a MongoDB con auto riconnessione e graceful shutdown

```js
import { mongoose } from '@growishpay/nodejs-utils';

await mongoose.connect('mongodb://localhost:27017/dbname');
```

---

### mongoose.salesforPlugin

Plugin Mongoose per integrazione con salesforce.

Per funzionare correttamente è necessario definire due funzioni da passer in fase di init:

```js
  pushFn: () => {}
  deleteFn: () => {} // opzionale
```

```js
import { mongoose } from '@growishpay/nodejs-utils';

mongoose.salesfocePlugin.init(true, () => {}); // init del plugin lanciare prima di utilizzare nel servizio

const modelSchema = /** Schema definito **/
modelSchema.plugin(mongoose.salesforcePlugin, {
    assetClass: "model", addSchema: true
})

```

---

## gracefulShutdown

Utilities per registrare funzione per gestire lo shutdown di un servizio in caso di signal SIGINT e SIGTERM

```js
import { gracefulShutdown } from '@growishpay/nodejs-utils';

gracefulShutdown.register(async () => {
    // logic code 
}, 'nome');

```

---

## autoloader

Utilities per caricare in lazy loading dinamico i file del progetto tramite glob pattern

```js
import { createAutoloader } from '@growishpay/nodejs-utils';

const autoloader = createAutoloader({ verbose: true });

await autoloader.load([
  'path/plugins/*.js',
  'path/controllers/**/*.js'
]);

```

---


## Build

La libreria è scritta in TypeScript e compilata con `tsup`.

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

- semver
- axios
- morgan
- winston
- winston-daily-rotate-file
- fast-glob

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
