/**
 * @file subscription.controller.js
 * @description Gestione delle iscrizioni (Follow / Unfollow).
 */

const pool = require('../config/db');

exports.subscribe = async (req, res) => {
  const followerId = req.user.id;
  const streamerId = req.body.streamer_id;

  try {
    await pool.execute(
      'INSERT INTO subscriptions (follower_id, streamer_id) VALUES (?, ?)',
      [followerId, streamerId]
    );

    return res.status(201).json({
      success: true,
      message: 'Iscrizione effettuata con successo',
      streamer_id: streamerId
    });

  } catch (error) {
    console.error('[Error]:', error);

    switch (error.code) {
      case 'ER_DUP_ENTRY':
        return res.status(400).json({ success: false, message: 'Sei già iscritto a questo canale' });
      case 'ER_CHECK_CONSTRAINT_VIOLATED':
        return res.status(400).json({ success: false, message: 'Non puoi seguire te stesso' });
      case 'ER_NO_REFERENCED_ROW_2':
        return res.status(404).json({ success: false, message: 'Lo streamer specificato non esiste' });
      default:
        return res.status(500).json({ success: false, message: 'Errore interno del server' });
    }
  }
};

exports.unsubscribe = async (req, res) => {
  const followerId = req.user.id;
  const streamerId = req.params.streamerId;

  try {
    const [result] = await pool.execute(
      'DELETE FROM subscriptions WHERE follower_id = ? AND streamer_id = ?',
      [followerId, streamerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Non risulti iscritto a questo canale'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Disiscrizione completata con successo',
      streamer_id: streamerId
    });
  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

exports.getMySubscriptions = async (req, res) => {
  try {
    const sql = `
      SELECT 
        u.id AS streamer_id,
        u.username,
        u.first_name,
        u.last_name,
        sub.created_at AS subscribed_at,
        CASE WHEN st.id IS NOT NULL THEN 1 ELSE 0 END AS is_live,
        st.title AS stream_title,
        st.started_at
      FROM subscriptions sub
      INNER JOIN users u ON sub.streamer_id = u.id
      LEFT JOIN streams st ON st.streamer_id = u.id AND st.status = 'live'
      WHERE sub.follower_id = ?
      ORDER BY is_live DESC, u.username ASC
    `;

    const [rows] = await pool.execute(sql, [req.user.id]);

    // RISPOSTA PIATTA SENZA DOPPIO DATA
    return res.status(200).json({
      success: true,
      subscriptions: rows
    });
  } catch (error) {
    console.error('[Error]:', error);
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};