/**
 * @file subscription.routes.js
 * @description Rotte RESTful per la sottoscrizione e disiscrizione ai canali (Follow/Unfollow).
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validateSubscription, validateUnsubscribeParam } = require('../middlewares/validate.middleware');

router.get('/', requireAuth, subscriptionController.getMySubscriptions);
router.post('/', requireAuth, validateSubscription, subscriptionController.subscribe); // POST /api/subscriptions
router.delete('/:streamerId', requireAuth, validateUnsubscribeParam, subscriptionController.unsubscribe); // DELETE /api/subscriptions/:streamerId

module.exports = router;