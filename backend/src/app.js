/**
 * @file app.js
 * @description Configurazione centrale dell'applicazione Express e dei middleware globali.
 *
 * NOTA TECNICA SU "req.rawBody":
 * Per verificare la firma HMAC-SHA1 ("X-OME-Signature") inviata da OvenMediaEngine,
 * dobbiamo calcolare l'hash esattamente sugli stessi byte grezzi ricevuti sulla rete.
 * Usiamo l'opzione "verify" di express.json() per salvare il buffer originale in "req.rawBody"
 * prima che il JSON venga parsato in oggetto JavaScript.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes.js');
const subscriptionRoutes = require('./routes/subscription.routes.js');
const streamRoutes = require('./routes/stream.routes.js');
const userRoutes = require('./routes/user.routes.js');



const app = express();

// 1. Header di sicurezza HTTP (Helmet)
app.use(helmet());

// 2. Configurazione CORS con "credentials: true" per consentire lo scambio di Cookie HttpOnly

app.use(cors({
  origin: 'http://172.28.0.40', // Permette le richieste da React
  credentials: true               // Permette l'invio del cookie "sid"
}));

// 3. Parsing dei Cookie dall'header HTTP "Cookie" (popola req.cookies)
app.use(cookieParser());

// 4. Parsing del Body JSON + Salvataggio dei byte originali in req.rawBody per l'HMAC di OME
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
// 5. Registrazione delle rotte API con controllo di validità
console.log('--- DEBUG IMPORT ROTTE ---');
console.log('authRoutes:', typeof authRoutes);
console.log('subscriptionRoutes:', typeof subscriptionRoutes);
console.log('streamRoutes:', typeof streamRoutes);
console.log('userRoutes:', typeof userRoutes);
console.log('---------------------------');

if (typeof authRoutes !== 'function') throw new Error('authRoutes non è una funzione!');
if (typeof subscriptionRoutes !== 'function') throw new Error('subscriptionRoutes non è una funzione!');
if (typeof streamRoutes !== 'function') throw new Error('streamRoutes non è una funzione!');
if (typeof userRoutes !== 'function') throw new Error('userRoutes non è una funzione!');

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/users', userRoutes);



// ... i tuoi require esistenti ...
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');


// ... i tuoi middleware esistenti (helmet, cors, cookieParser, express.json) ...

// CARICAMENTO DOCUMENTAZIONE SWAGGER
try {
  const swaggerDocument = YAML.load(path.join(__dirname, './docs/swagger.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('📖 Documentazione Swagger attiva su: http://localhost:4000/api/docs');
} catch (err) {
  console.error('Errore nel caricamento della documentazione Swagger:', err);
}

// ... le tue rotte esistenti (/api/auth, /api/subscriptions, ecc.) ...


// 6. Gestione rotte non trovate (404)
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint API non trovato' });
});

module.exports = app;