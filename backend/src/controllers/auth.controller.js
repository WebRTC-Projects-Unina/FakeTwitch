/**
 * @file auth.controller.js
 * @description Logica di business per Registrazione, Login, Logout e gestione Profilo.
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 ore

const generateStreamKey = () => {
  return `sk_live_${crypto.randomBytes(20).toString('hex')}`;
}

exports.register = async (req, res) => {
  const { username, first_name, last_name, email, password } = req.body;

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username o Email già in uso'
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const streamKey = generateStreamKey();

    await pool.execute(
      `INSERT INTO users (username, first_name, last_name, email, password_hash, stream_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, first_name, last_name, email, passwordHash, streamKey]
    );

    return res.status(201).json({
      success: true,
      message: 'Registrazione completata con successo'
    });

  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore interno del server'
    });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await pool.execute(
      `SELECT id, username, first_name, last_name, email, password_hash, stream_key, created_at, updated_at
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenziali non valide' });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenziali non valide'
      });
    }

    const sessionId = crypto.randomBytes(32).toString('hex');

    await pool.execute(
      `INSERT INTO user_sessions (session_id, user_id, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
      [sessionId, user.id]
    );

    res.cookie('sid', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS
    });

    // RISPOSTA PIATTA SENZA DOPPIO DATA
    return res.status(200).json({
      success: true,
      message: 'Login effettuato con successo',
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        stream_key: user.stream_key
      },
      obs_server_url: process.env.OBS_RTMP_URL || 'rtmp://localhost:1935/app'
    });
  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore interno del server'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    await pool.execute('DELETE FROM user_sessions WHERE session_id = ?', [req.sessionId]);
    res.clearCookie('sid');
    return res.status(200).json({ 
      success: true, 
      message: 'Logout effettuato con successo'
    });
  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore interno del server'
    });
  }
};

exports.getMe = async (req, res) => {
  // RISPOSTA PIATTA SENZA DOPPIO DATA
  return res.status(200).json({
    success: true,
    message: 'Sessione attiva',
    user: {
      id: req.user.id,
      username: req.user.username,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email: req.user.email,
      stream_key: req.user.stream_key,
      created_at: req.user.created_at,
      updated_at: req.user.updated_at
    },
    obs_server_url: process.env.OBS_RTMP_URL || 'rtmp://localhost:1935/app'
  });
};