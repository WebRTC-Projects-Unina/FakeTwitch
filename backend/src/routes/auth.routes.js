/**
 * @file auth.routes.js
 * @description Definizione delle rotte di autenticazione e gestione profilo.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin } = require('../middlewares/validate.middleware');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;