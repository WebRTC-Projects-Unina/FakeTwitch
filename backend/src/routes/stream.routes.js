/**
 * @file stream.routes.js
 * @description Rotte per il controllo dei flussi video (Webhook OME e lista dirette attive).
 */

const express = require('express');
const router = express.Router();
const streamController = require('../controllers/stream.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Endpoint chiamato da OvenMediaEngine (protetto da firma crittografica HMAC-SHA1)
router.post('/auth', streamController.omeAdmissionWebhook);

// Endpoint protetto per ottenere la lista degli streamer attualmente LIVE
router.get('/live', requireAuth, streamController.getLiveStreams);

module.exports = router;