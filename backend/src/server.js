/**
 * @file server.js
 * @description Entry point del backend: unisce il server HTTP (Express REST API)
 * e il server WebSocket (Live Chat) sulla stessa porta TCP (4000).
 */

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initChatWebSocket } = require('./websocket/chat.ws');

const PORT = process.env.PORT || 4000;

// 1. Crea il server HTTP nativo incapsulando l'applicazione Express
const server = http.createServer(app);

// 2. Aggancia il server WebSocket della Live Chat allo stesso server HTTP
initChatWebSocket(server);

// 3. Mette il server in ascolto
server.listen(PORT, "0.0.0.0", () => {
  console.log(`=============================================================`);
  console.log(`🚀 Backend REST API attivo su:   http://localhost:${PORT}/api`);
  console.log(`💬 WebSocket Live Chat attivo:   ws://localhost:${PORT}/ws/chat`);
  console.log(`=============================================================`);
});