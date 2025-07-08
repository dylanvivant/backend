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
 * @route   POST /api/notifications/invitations
 * @desc    Créer des invitations d'événement (remplace la création de notification)
 * @access  Private (Admin, Manager)
 */
router.post(
  '/invitations',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  validate(schemas.notification.createInvitation),
  notificationController.createEventInvitation
);

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
 * @route   PATCH /api/notifications/:id/read
 * @desc    Marquer une notification comme lue
 * @access  Private
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Marquer toutes les notifications comme lues
 * @access  Private
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Supprimer une notification
 * @access  Private
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @route   POST /api/notifications/respond
 * @desc    Répondre à une invitation d'événement
 * @access  Private
 */
router.post(
  '/respond',
  validate(schemas.notification.respondToInvitation),
  notificationController.respondToInvitation
);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Récupérer les préférences de notification
 * @access  Private
 */
router.get('/preferences', notificationController.getUserPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Mettre à jour les préférences de notification
 * @access  Private
 */
router.put(
  '/preferences',
  validate(schemas.notification.preferences),
  notificationController.updateUserPreferences
);

/**
 * @route   GET /api/notifications/stats
 * @desc    Obtenir les statistiques de notifications
 * @access  Private
 */
router.get('/stats', notificationController.getNotificationStats);

module.exports = router;
