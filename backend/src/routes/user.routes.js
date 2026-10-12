/**
 * @file user.routes.js
 * @description Definizione delle rotte per la gestione degli utenti e del profilo.
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller'); // Consigliato separare il controller
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/', requireAuth, userController.getAllUsers);
router.get('/:id', requireAuth, userController.getUser); // <-- CORRETTO: punta a getUser
router.post('/regenerate-key', requireAuth, userController.regenerateStreamKey);

module.exports = router;