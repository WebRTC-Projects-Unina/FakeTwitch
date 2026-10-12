/**
 * @file stream.controller.js
 * @description Controller per gli AdmissionWebhooks di OvenMediaEngine e lista dirette attive.
 */

const crypto = require('crypto');
const pool = require('../config/db');
const { clearChatRoom, closeChatRoom } = require('../websocket/chat.ws'); // Assicurati di importare anche closeChatRoom se la usi

/**
 * POST /api/stream/auth
 * Endpoint invocato automaticamente da OvenMediaEngine all'apertura e chiusura dei flussi.
 */
exports.omeAdmissionWebhook = async (req, res) => {
  try {
    // 1. VERIFICA FIRMA CRITTOGRAFICA HMAC-SHA1
    const signature = req.headers['x-ome-signature'];
    const secret = process.env.OME_WEBHOOK_SECRET;

    if (!secret || !signature || !req.rawBody) {
      console.warn('[OME Webhook] Richiesta bloccata: Header X-OME-Signature o rawBody assente');
      return res.status(401).json({ allowed: false, success: false, message: 'Missing HMAC signature' });
    }

    const expectedHmacUrl = crypto
      .createHmac('sha1', secret)
      .update(req.rawBody)
      .digest('base64url');

    const expectedHmacStd = crypto
      .createHmac('sha1', secret)
      .update(req.rawBody)
      .digest('base64');

    if (signature !== expectedHmacUrl && signature !== expectedHmacStd) {
      console.warn('[OME Webhook] Richiesta bloccata: Firma HMAC non valida!');
      return res.status(401).json({ allowed: false, success: false, message: 'Invalid HMAC signature' });
    }

    const requestInfo = req.body?.request;
    if (!requestInfo || !requestInfo.url) {
      return res.status(400).json({ allowed: false, success: false, message: 'Malformed webhook payload' });
    }

    if (requestInfo.direction === 'outgoing') {
      return res.status(200).json({ allowed: true });
    }

    const urlParts = requestInfo.url.split('/');
    const extractedKeyOrName = urlParts[urlParts.length - 1].split('?')[0].trim();

    // CASO A: APERTURA STREAM (OBS)
    if (requestInfo.status === 'opening') {
      const [users] = await pool.execute(
        'SELECT id, username FROM users WHERE stream_key = ? LIMIT 1',
        [extractedKeyOrName]
      );

      if (users.length === 0) {
        console.warn(`[OME Webhook] Stream Key non valida rifiutata: ${extractedKeyOrName}`);
        return res.status(403).json({ 
          allowed: false, 
          success: false, 
          message: 'Stream key non valida' 
        });
      }

      const streamer = users[0];

      // PULIZIA PREVENTIVA: Resetta la chat all'apertura della nuova live usando lo USERNAME
      clearChatRoom(streamer.username);

      await pool.execute(
        "INSERT INTO streams (streamer_id, title, status) VALUES (?, ?, 'live')",
        [streamer.id, `Diretta di ${streamer.username}`]
      );

      const baseUrl = requestInfo.url.substring(0, requestInfo.url.lastIndexOf('/'));
      const publicStreamUrl = `${baseUrl}/${streamer.username}`;

      console.log(`[OME Webhook] Diretta AVVIATA da ${streamer.username} -> ${publicStreamUrl}`);

      return res.status(200).json({
        allowed: true,
        new_url: publicStreamUrl,
        reason: "authorized"
      });
    }

    // CASO B: CHIUSURA STREAM (OBS)
    if (requestInfo.status === 'closing') {
      // 1. Prima di chiudere lo stream sul DB, cerchiamo a quale username appartiene la stream_key o lo username
      const [users] = await pool.execute(
        'SELECT username FROM users WHERE stream_key = ? OR username = ? LIMIT 1',
        [extractedKeyOrName, extractedKeyOrName]
      );

      // 2. Aggiorniamo lo stream a 'ended' nel database
      await pool.execute(
        `UPDATE streams s
         INNER JOIN users u ON s.streamer_id = u.id
         SET s.status = 'ended',
             s.ended_at = NOW(),
             s.duration_seconds = TIMESTAMPDIFF(SECOND, s.started_at, NOW())
         WHERE (u.username = ? OR u.stream_key = ?) AND s.status = 'live'`,
        [extractedKeyOrName, extractedKeyOrName]
      );

      // 3. Se abbiamo trovato lo username, puliamo e chiudiamo la chat WebSocket associata a quello username
      if (users.length > 0) {
        const streamerUsername = users[0].username;
        clearChatRoom(streamerUsername);
        if (typeof closeChatRoom === 'function') {
          closeChatRoom(streamerUsername);
        }
        console.log(`[OME Webhook] Diretta TERMINATA e Chat chiusa per la stanza: ${streamerUsername}`);
      } else {
        console.log(`[OME Webhook] Diretta TERMINATA ma utente non trovato per: ${extractedKeyOrName}`);
      }
      
      return res.status(200).json({});
    }

    return res.status(200).json({ allowed: true });

  } catch (error) {
    console.error('[Error]:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(403).json({
        allowed: false,
        success: false,
        message: 'Hai già una diretta attiva in corso.'
      });
    }

    return res.status(500).json({
      allowed: false,
      success: false,
      message: error.message || 'Errore interno del server'
    });
  }
};

/**
 * GET /api/stream/live
 * Restituisce la lista di tutti i canali attualmente in onda
 */
exports.getLiveStreams = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
         s.id AS stream_id,
         s.title,
         s.started_at,
         u.id AS streamer_id,
         u.username
       FROM streams s
       INNER JOIN users u ON s.streamer_id = u.id
       WHERE s.status = 'live'
       ORDER BY s.started_at DESC`
    );

    return res.status(200).json({
      success: true,
      streams: rows
    });
  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore interno del server'
    });
  }
};