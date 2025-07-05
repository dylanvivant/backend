const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { schemas } = require('../validation/schemas');
const AdvancedRbac = require('../middleware/advancedRbac');

// Middleware d'authentification pour toutes les routes
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Récupérer les notifications de l'utilisateur (basées sur les événements)
 * @access  Private
 */
router.get('/', notificationController.getUserNotifications);

/**
 * @route   GET /api/notifications/count
 * @desc    Obtenir le nombre de notifications non lues
 * @access  Private
 */
router.get('/count', notificationController.getUnreadNotificationsCount);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Récupérer les préférences de notification
 * @access  Private
 */
router.get('/preferences', notificationController.getUserPreferences);

/**
 * @route   GET /api/notifications/stats
 * @desc    Obtenir les statistiques de notifications
 * @access  Private
 */
router.get('/stats', notificationController.getNotificationStats);

module.exports = router;
