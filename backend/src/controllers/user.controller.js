/**
 * @file user.controller.js
 * @description Gestione profilo utente, rigenerazione stream key ed elenco utenti.
 */

const crypto = require('crypto');
const pool = require('../config/db');

const generateStreamKey = () => {
  return `sk_live_${crypto.randomBytes(20).toString('hex')}`;
};

exports.regenerateStreamKey = async (req, res) => {
  try {
    const newKey = generateStreamKey();
    await pool.execute(
      'UPDATE users SET stream_key = ? WHERE id = ?',
      [newKey, req.user.id]
    );

    const [rows] = await pool.execute(
      'SELECT stream_key, updated_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    // RISPOSTA PIATTA SENZA DOPPIO DATA
    return res.status(200).json({
      success: true,
      message: 'Stream Key rigenerata con successo',
      stream_key: rows[0].stream_key
    });
  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore interno del server'
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
         u.id, 
         u.username, 
         u.first_name, 
         u.last_name, 
         u.stream_key,
         u.created_at,
         CASE WHEN st.id IS NOT NULL THEN 1 ELSE 0 END AS is_live
       FROM users u
       LEFT JOIN streams st ON st.streamer_id = u.id AND st.status = 'live'
       ORDER BY u.username ASC`
    );

    // RISPOSTA PIATTA SENZA DOPPIO DATA
    return res.status(200).json({
      success: true,
      users: rows
    });
  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({ success: false, message: 'Errore interno' });
  }
};

exports.getUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, first_name, last_name, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // RISPOSTA PIATTA SENZA DOPPIO DATA
    return res.status(200).json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({ success: false, message: 'Errore interno' });
  }
};