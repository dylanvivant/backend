const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { schemas } = require('../validation/schemas');
const AdvancedRbac = require('../middleware/advancedRbac');

// Middleware d'authentification pour toutes les routes
router.use(authenticate);

/**
 * @route   GET /api/analytics/general
 * @desc    Récupérer les statistiques générales
 * @access  Private (Admin, Manager)
 */
router.get(
  '/general',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getGeneralStats
);

/**
 * @route   GET /api/analytics/users
 * @desc    Récupérer les statistiques des utilisateurs
 * @access  Private (Admin, Manager)
 */
router.get(
  '/users',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getUserStats
);

/**
 * @route   GET /api/analytics/events
 * @desc    Récupérer les statistiques des événements
 * @access  Private (Admin, Manager)
 */
router.get(
  '/events',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getEventStats
);

/**
 * @route   GET /api/analytics/performance
 * @desc    Récupérer les statistiques de performance
 * @access  Private (Admin, Manager)
 */
router.get(
  '/performance',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getPerformanceStats
);

/**
 * @route   GET /api/analytics/engagement
 * @desc    Récupérer les métriques d'engagement
 * @access  Private (Admin, Manager)
 */
router.get(
  '/engagement',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getEngagementMetrics
);

/**
 * @route   GET /api/analytics/teams
 * @desc    Récupérer les statistiques des équipes
 * @access  Private (Admin, Manager)
 */
router.get(
  '/teams',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getTeamStats
);

/**
 * @route   POST /api/analytics/track
 * @desc    Enregistrer un événement analytique
 * @access  Private
 */
router.post(
  '/track',
  validate(schemas.analytics.track),
  analyticsController.trackEvent
);

/**
 * @route   POST /api/analytics/report
 * @desc    Générer un rapport personnalisé
 * @access  Private (Admin, Manager)
 */
router.post(
  '/report',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  validate(schemas.analytics.report),
  analyticsController.generateCustomReport
);

/**
 * @route   GET /api/analytics/kpis
 * @desc    Récupérer les KPIs principaux
 * @access  Private (Admin, Manager)
 */
router.get(
  '/kpis',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getMainKPIs
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Récupérer les données de tendances
 * @access  Private (Admin, Manager)
 */
router.get(
  '/trends',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getTrendData
);

/**
 * @route   GET /api/analytics/realtime
 * @desc    Récupérer les statistiques temps réel
 * @access  Private (Admin, Manager)
 */
router.get(
  '/realtime',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getRealTimeStats
);

/**
 * @route   GET /api/analytics/retention
 * @desc    Récupérer les métriques de rétention
 * @access  Private (Admin, Manager)
 */
router.get(
  '/retention',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getRetentionMetrics
);

/**
 * @route   GET /api/analytics/funnel
 * @desc    Récupérer les données de l'entonnoir
 * @access  Private (Admin, Manager)
 */
router.get(
  '/funnel',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  analyticsController.getFunnelData
);

/**
 * @route   POST /api/analytics/export
 * @desc    Exporter les données analytics
 * @access  Private (Admin, Manager)
 */
router.post(
  '/export',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  validate(schemas.analytics.export),
  analyticsController.exportData
);

/**
 * @route   GET /api/analytics/alerts
 * @desc    Récupérer les alertes analytiques
 * @access  Private (Admin)
 */
router.get(
  '/alerts',
  AdvancedRbac.hasRole('Capitaine'),
  analyticsController.getAnalyticsAlerts
);

/**
 * @route   POST /api/analytics/alerts
 * @desc    Configurer une alerte analytique
 * @access  Private (Admin)
 */
router.post(
  '/alerts',
  AdvancedRbac.hasRole('Capitaine'),
  validate(schemas.analytics.alert),
  analyticsController.configureAlert
);

/**
 * @route   DELETE /api/analytics/cache
 * @desc    Nettoyer le cache analytics
 * @access  Private (Admin)
 */
router.delete(
  '/cache',
  AdvancedRbac.hasRole('Capitaine'),
  analyticsController.clearAnalyticsCache
);

module.exports = router;
