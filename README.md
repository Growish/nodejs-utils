# @growish/node-utils

**GrowishPay nodejs utils**

---

## Descrizione

`@growish/nodejs-utils` è una libreria utility per node.js
Fornisce moduli per logging, gestione connessione mongoose, notifier, plugin mongoose, express

---

## Requisiti

- Node.js >= 16.0.0
- Peer dependencies:
  - `express` >= 4.0.0
  - `mongoose` >= 7.0.0

---

## Installazione

La libreria si può installare esclusivamente da github

```bash
npm install github:growish/node-utils
```

Se vuoi installare un branch o un commit, tag specifico:

```bash
npm install github:growish/node-utils#main
```

o

```bash
npm install github:growish/node-utils#tag
```

---

## Importazione e utilizzo

La libreria supporta sia ESM che CommonJS.

### Import named (con destructuring)

```js
import {
  logger,
  expressLogger,
  notifier,
  connectionManager,
  salesforPlugin
} from '@growish/node-utils';

logger.info('Logger attivo');
```

### Import default (senza destructuring)

```js
import utils from '@growish/node-utils';

utils.logger.info('Logger attivo');
utils.expressLogger(/* ... */);
```

---

### CommonJS

Named import con destructuring:

```js
const {
  logger,
  expressLogger,
  notifier,
  connectionManager,
  salesforPlugin
} = require('@growish/node-utils');

logger.info('Logger attivo');
```

Default import:

```js
const utils = require('@growish/node-utils');

utils.logger.info('Logger attivo');
```

---

## Moduli principali

### logger

Modulo di logging basato su [winston](https://github.com/winstonjs/winston), configurato per rotazione giornaliera dei file.

```js
logger.info('Informazione di log', { tag: 'mioComponente'});
logger.error('Errore registrato', { tag: 'mioComponente', error});
```

---

### expressLogger

Middleware Express per logging delle richieste HTTP, basato su [morgan](https://github.com/expressjs/morgan).

```js
import express from 'express';
import { expressLogger } from '@growish/node-utils';

const app = express();
app.use(expressLogger);
```

---

### notifier

Modulo per inviare notifiche a Slack tramite webhook. utile per notifiche di alert o messaggi automatici.

#### Esempio di utilizzo

```js
import { notifier } from '@growish/node-utils';

const environment = 'develop';
const hookUrl = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';


notifier.init(environment, hookUrl); // init del notifier, lanciare nel index del progetto
notifier.send('Questo è un messaggio di test inviato dal modulo notifier!');
```

---

### connectionManager

Gestisce la connessione a MongoDB tramite Mongoose con opzioni di riconnessione e graceful shutdown

```js
import { connectionManager } from '@growish/node-utils';

await connectionManager('mongodb://localhost:27017/dbname');
```

---

### salesforPlugin

Plugin Mongoose per integrazione con salesforce.

Per funzionare correttamente è necessario definire due funzioni da passer in fase di init:

```js
    pushFn: () => {}
deleteFn: () => {} // opzionale
```

```js
import { salesforcePlugin } from '@growish/node-utils';

const environment = 'develop';
const webhookUrl = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';


salesfocePlugin.init(); // init del plugin da lancia una volta sola

notifier.send('Questo è un messaggio di test inviato dal modulo notifier!');
```

salesforce.init(environment, hookUrl); // init del notifier, lanciare nel index del progetto
notifier.send('Questo è un messaggio di test inviato dal modulo notifier!');

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

Per effettuare un rilascio minor versione con build e push  + tag automatico:

```bash
npm run release:minor
```

Per effettuare un rilascio major con build e push + tag automatico:

```bash
npm run release:major
```

---

## Dipendenze

### runtime

- axios
- morgan
- winston
- winston-daily-rotate-file

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

nodejs, utilities, utils, logging, express, mongoose, mongodb, winston, typescript, middleware, plugin, salesforce, notifier, growishpay, backend
