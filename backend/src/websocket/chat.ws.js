/**
 * @file chat.ws.js
 * @description Gestione della Live Chat in tempo reale basata su WebSocket (libreria "ws").
 */

const { WebSocketServer, WebSocket } = require('ws');
const pool = require('../config/db');

/** @type {Map<string, Set<WebSocket>>} Mappa Stanza -> Insieme dei client connessi */
const chatRooms = new Map();

/** @type {Map<string, Array<Object>>} Mappa Stanza -> Ultimi 20 messaggi (Buffer Circolare) */
const roomHistory = new Map();
const MAX_HISTORY = 20;

/**
 * Estrae manualmente il valore del cookie "sid" dall'header HTTP "Cookie"
 */
function parseSessionCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('sid='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

/**
 * Interroga MySQL una sola volta all'apertura del WebSocket per l'utente
 */
async function getUserFromSession(sessionId) {
  if (!sessionId) return null;
  const [rows] = await pool.execute(
    `SELECT u.id, u.username
     FROM user_sessions s
     INNER JOIN users u ON s.user_id = u.id
     WHERE s.session_id = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [sessionId]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * VERIFICA CRITICA: Controlla se il canale (username) ha una live attiva nel database
 */
async function isChannelLive(username) {
  const [rows] = await pool.execute(
    `SELECT s.id 
     FROM streams s
     INNER JOIN users u ON s.streamer_id = u.id
     WHERE u.username = ? AND s.status = 'live'
     LIMIT 1`,
    [username]
  );
  return rows.length > 0;
}

function initChatWebSocket(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/chat' });

  wss.on('connection', async (ws, req) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const room = url.searchParams.get('room')?.trim();

      if (!room) {
        ws.close(1008, 'Parametro room obbligatorio');
        return;
      }

      // CONTROLLO DI SICUREZZA: Il canale è effettivamente LIVE?
      const channelIsLive = await isChannelLive(room);
      if (!channelIsLive) {
        ws.close(1008, 'Impossibile connettersi: il canale non è in onda (offline)');
        return;
      }

      const sessionId = parseSessionCookie(req.headers.cookie);
      const user = await getUserFromSession(sessionId);

      ws.room = room;
      ws.user = user;

      if (!chatRooms.has(room)) {
        chatRooms.set(room, new Set());
      }
      chatRooms.get(room).add(ws);

      // Invia il pacchetto di benvenuto
      ws.send(JSON.stringify({
        type: 'system',
        room,
        authenticatedAs: user ? user.username : null,
        viewersCount: chatRooms.get(room).size,
        history: roomHistory.get(room) || []
      }));

      ws.on('message', (rawData) => {
        if (!ws.user) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Devi effettuare il login per poter scrivere in chat'
          }));
          return;
        }

        let payload;
        try {
          payload = JSON.parse(rawData.toString());
        } catch {
          return;
        }

        const text = payload.text?.trim();
        if (!text || text.length > 300) return;

        const chatMessage = {
          type: 'chat_message',
          room: ws.room,
          user: ws.user.username,
          username: ws.user.username,
          text,
          timestamp: new Date().toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };

        if (!roomHistory.has(ws.room)) {
          roomHistory.set(ws.room, []);
        }
        const history = roomHistory.get(ws.room);
        history.push(chatMessage);
        if (history.length > MAX_HISTORY) {
          history.shift();
        }

        // Fan-Out Broadcast
        const clientsInRoom = chatRooms.get(ws.room);
        if (clientsInRoom) {
          const serialized = JSON.stringify(chatMessage);
          for (const client of clientsInRoom) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(serialized);
            }
          }
        }
      });

      ws.on('close', () => {
        const clientsInRoom = chatRooms.get(ws.room);
        if (clientsInRoom) {
          clientsInRoom.delete(ws);
          if (clientsInRoom.size === 0) {
            chatRooms.delete(ws.room);
          }
        }
      });

    } catch (error) {
      console.error('[WebSocket Connection Error]:', error);
      ws.close(1011, 'Errore interno del server');
    }
  });

  console.log('[WebSocket] Server Live Chat pronto su ws://localhost:4000/ws/chat');
}

function clearChatRoom(room) {
  roomHistory.delete(room);
  chatRooms.delete(room);
}

module.exports = { initChatWebSocket, clearChatRoom };