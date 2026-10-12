/**
 * @file validate.middleware.js
 * @description Validazione e sanificazione formale del body JSON in ingresso.
 *
 * SCELTA ARCHITETTURALE:
 * Blocca a monte i payload incompleti o malformati restituendo 400 Bad Request
 * PRIMA che il Controller venga eseguito. In questo modo il destructuring
 * "const { username, ... } = req.body" nei controller non riceve mai valori "undefined".
 */

const { body, param, validationResult } = require('express-validator');

/**
 * Middleware finale che raccoglie gli eventuali errori di express-validator
 * e interrompe la catena rispondendo con 400 Bad Request.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dati di input non validi o incompleti',
      data: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Regole di validazione per la Registrazione Utente (POST /api/auth/register)
 */
const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Lo username è obbligatorio')
    .isLength({ min: 3, max: 30 }).withMessage('Lo username deve avere tra 3 e 30 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Lo username può contenere solo lettere, numeri e underscore (_)'),

  body('first_name')
    .trim()
    .notEmpty().withMessage('Il nome è obbligatorio')
    .isLength({ max: 100 }).withMessage('Il nome non può superare 100 caratteri'),

  body('last_name')
    .trim()
    .notEmpty().withMessage('Il cognome è obbligatorio')
    .isLength({ max: 100 }).withMessage('Il cognome non può superare 100 caratteri'),

  body('email')
    .trim()
    .notEmpty().withMessage("L'email è obbligatoria")
    .isEmail().withMessage('Formato email non valido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La password è obbligatoria')
    .isLength({ min: 8 }).withMessage('La password deve contenere almeno 8 caratteri'),

  handleValidationErrors
];

/**
 * Regole di validazione per il Login (POST /api/auth/login)
 */
const validateLogin = [
  body('username').trim().notEmpty().withMessage('Lo username è obbligatorio'),
  body('password').notEmpty().withMessage('La password è obbligatoria'),
  handleValidationErrors
];

/**
 * Regole di validazione per il Follow (POST /api/subscriptions/subscribe)
 */
const validateSubscription = [
  body('streamer_id')
    .notEmpty().withMessage('streamer_id è obbligatorio')
    .isInt({ gt: 0 }).withMessage('streamer_id deve essere un intero positivo')
    .toInt(),
  handleValidationErrors
];

/**
 * Regole di validazione per l'Unfollow (DELETE /api/subscriptions/unsubscribe/:streamerId)
 */
const validateUnsubscribeParam = [
  param('streamerId')
    .isInt({ gt: 0 }).withMessage('Il parametro streamerId deve essere un intero positivo')
    .toInt(),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateSubscription,
  validateUnsubscribeParam
};