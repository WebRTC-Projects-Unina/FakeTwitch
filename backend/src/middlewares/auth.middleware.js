/**
 * @file auth.middleware.js
 * @description Middleware di autenticazione basato su Cookie HttpOnly ("sid").
 *
 * SCELTA ARCHITETTURALE:
 * Invece di salvare token JWT nel localStorage (vulnerabile a furti tramite attacchi XSS),
 * utilizziamo un Session ID opaco salvato in un Cookie HttpOnly.
 * Il middleware controlla che la sessione esista nella tabella "user_sessions" e non sia scaduta,
 * eseguendo una JOIN con la tabella "users" per popolare "req.user".
 */

const pool = require('../config/db');

const requireAuth = async (req, res, next) => {
  try {
    // 1. Legge il cookie HttpOnly "sid" parsato dal middleware cookie-parser
    const sessionId = req.cookies?.sid;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Non autenticato: cookie di sessione mancante'
      });
    }

    // 2. Verifica la sessione nel DB e recupera i dati aggiornati dell'utente (inclusi created_at e updated_at)
    const sql = `
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.stream_key,
        u.created_at,
        u.updated_at
      FROM user_sessions s
      INNER JOIN users u ON s.user_id = u.id
      WHERE s.session_id = ? AND s.expires_at > NOW()
      LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [sessionId]);

    if (rows.length === 0) {
      // Se la sessione non esiste o è scaduta sul DB, istruisce il browser a cancellare il cookie
      res.clearCookie('sid');
      return res.status(401).json({
        success: false,
        error: 'Sessione scaduta o non valida'
      });
    }

    // 3. Allega l'oggetto utente a "req.user" per renderlo disponibile ai Controller successivi
    req.user = rows[0];
    req.sessionId = sessionId;
    next();
  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore interno del server',
      data: null
    });
  }
};

module.exports = { requireAuth };