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
 * @route   POST /api/notifications
 * @desc    Créer une notification
 * @access  Private (Admin, Manager)
 */
router.post(
  '/',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  validate(schemas.notification.create),
  notificationController.createNotification
);

/**
 * @route   GET /api/notifications
 * @desc    Récupérer les notifications de l'utilisateur
 * @access  Private
 */
router.get('/', notificationController.getUserNotifications);

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
 * @route   POST /api/notifications/bulk
 * @desc    Envoyer une notification de masse
 * @access  Private (Admin, Manager)
 */
router.post(
  '/bulk',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  validate(schemas.notification.bulk),
  notificationController.sendBulkNotification
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
 * @route   POST /api/notifications/schedule
 * @desc    Programmer une notification
 * @access  Private (Admin, Manager)
 */
router.post(
  '/schedule',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  validate(schemas.notification.schedule),
  notificationController.scheduleNotification
);

/**
 * @route   POST /api/notifications/process-scheduled
 * @desc    Traiter les notifications programmées
 * @access  Private (Admin)
 */
router.post(
  '/process-scheduled',
  AdvancedRbac.hasRole('admin'),
  notificationController.processScheduledNotifications
);

/**
 * @route   GET /api/notifications/stats
 * @desc    Obtenir les statistiques de notifications
 * @access  Private
 */
router.get('/stats', notificationController.getNotificationStats);

module.exports = router;
