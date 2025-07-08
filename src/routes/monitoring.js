// ========================================
// ROUTES MONITORING
// src/routes/monitoring.js
// ========================================
const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/advancedRbac');

// Middleware d'authentification pour toutes les routes
router.use(authenticate);

// ========================================
// MÉTRIQUES SYSTÈME
// ========================================

// Obtenir les métriques de base
router.get('/metrics', authorize(['Capitaine']), async (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();

    res.json({
      success: true,
      data: metrics,
      message: 'Métriques système récupérées avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération métriques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques',
      error: error.message,
    });
  }
});

// Obtenir les métriques détaillées
router.get('/metrics/detailed', authorize(['admin']), async (req, res) => {
  try {
    const metrics = monitoringService.getDetailedMetrics();

    res.json({
      success: true,
      data: metrics,
      message: 'Métriques détaillées récupérées avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération métriques détaillées:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques détaillées',
      error: error.message,
    });
  }
});

// Exporter les métriques
router.get('/metrics/export', authorize(['admin']), async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const exportedMetrics = monitoringService.exportMetrics(format);

    if (format === 'prometheus') {
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(exportedMetrics);
    } else {
      res.json({
        success: true,
        data: exportedMetrics,
        message: 'Métriques exportées avec succès',
      });
    }
  } catch (error) {
    console.error('Erreur export métriques:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'export des métriques",
      error: error.message,
    });
  }
});

// ========================================
// SANTÉ DU SYSTÈME
// ========================================

// Vérifier la santé du système
router.get('/health', authorize(['Capitaine']), async (req, res) => {
  try {
    const healthStatus = monitoringService.getHealthStatus();
    const healthChecks = monitoringService.performHealthChecks();

    const response = {
      success: true,
      data: {
        status: healthStatus,
        checks: healthChecks,
        timestamp: new Date().toISOString(),
      },
      message: 'Vérification de santé effectuée avec succès',
    };

    // Définir le code de statut HTTP en fonction de la santé
    const statusCode =
      healthStatus === 'healthy'
        ? 200
        : healthStatus === 'degraded'
        ? 200
        : 503;

    res.status(statusCode).json(response);
  } catch (error) {
    console.error('Erreur vérification santé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de santé',
      error: error.message,
    });
  }
});

// Endpoint de santé simple (pour load balancers)
router.get('/health/simple', async (req, res) => {
  try {
    const healthStatus = monitoringService.getHealthStatus();

    if (healthStatus === 'healthy') {
      res.status(200).json({ status: 'OK' });
    } else {
      res.status(503).json({ status: 'Degraded' });
    }
  } catch (error) {
    res.status(500).json({ status: 'Error' });
  }
});

// ========================================
// ALERTES
// ========================================

// Obtenir les alertes actives
router.get('/alerts', authorize(['Capitaine']), async (req, res) => {
  try {
    const alerts = monitoringService.getActiveAlerts();

    res.json({
      success: true,
      data: alerts,
      message: 'Alertes actives récupérées avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération alertes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes',
      error: error.message,
    });
  }
});

// Obtenir l'historique des alertes
router.get('/alerts/history', authorize(['Capitaine']), async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const alerts = monitoringService.getAlertHistory(parseInt(limit));

    res.json({
      success: true,
      data: alerts,
      message: 'Historique des alertes récupéré avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération historique alertes:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique des alertes",
      error: error.message,
    });
  }
});

// Obtenir les statistiques d'alertes
router.get('/alerts/stats', authorize(['Capitaine']), async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    const stats = monitoringService.getAlertStats(period);

    res.json({
      success: true,
      data: stats,
      message: "Statistiques d'alertes récupérées avec succès",
    });
  } catch (error) {
    console.error('Erreur récupération stats alertes:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques d'alertes",
      error: error.message,
    });
  }
});

// Résoudre une alerte
router.post(
  '/alerts/:alertId/resolve',
  authorize(['Capitaine']),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const resolved = monitoringService.resolveAlert(alertId);

      if (resolved) {
        res.json({
          success: true,
          message: 'Alerte résolue avec succès',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Alerte non trouvée',
        });
      }
    } catch (error) {
      console.error('Erreur résolution alerte:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la résolution de l'alerte",
        error: error.message,
      });
    }
  }
);

// ========================================
// PERFORMANCE
// ========================================

// Obtenir les statistiques de performance
router.get('/performance', authorize(['Capitaine']), async (req, res) => {
  try {
    const metrics = monitoringService.getDetailedMetrics();
    const performance = metrics.performance;

    res.json({
      success: true,
      data: performance,
      message: 'Statistiques de performance récupérées avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération performance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de performance',
      error: error.message,
    });
  }
});

// Obtenir les métriques de requêtes
router.get('/requests', authorize(['Capitaine']), async (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    const requests = metrics.requests;

    res.json({
      success: true,
      data: requests,
      message: 'Métriques de requêtes récupérées avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération métriques requêtes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques de requêtes',
      error: error.message,
    });
  }
});

// ========================================
// ADMINISTRATION
// ========================================

// Réinitialiser les métriques
router.post('/reset', authorize(['admin']), async (req, res) => {
  try {
    monitoringService.resetMetrics();

    res.json({
      success: true,
      message: 'Métriques réinitialisées avec succès',
    });
  } catch (error) {
    console.error('Erreur réinitialisation métriques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation des métriques',
      error: error.message,
    });
  }
});

// Obtenir les informations système
router.get('/system', authorize(['admin']), async (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    const system = metrics.system;

    res.json({
      success: true,
      data: system,
      message: 'Informations système récupérées avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération infos système:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations système',
      error: error.message,
    });
  }
});

// ========================================
// DASHBOARD
// ========================================

// Obtenir toutes les données pour le dashboard
router.get('/dashboard', authorize(['Capitaine']), async (req, res) => {
  try {
    const metrics = monitoringService.getDetailedMetrics();
    const activeAlerts = monitoringService.getActiveAlerts();
    const alertStats = monitoringService.getAlertStats('day');

    const dashboard = {
      overview: {
        status: metrics.health.status,
        uptime: metrics.system.uptime,
        requestsTotal: metrics.requests.total,
        activeAlerts: activeAlerts.length,
      },
      performance: metrics.performance,
      system: metrics.system,
      requests: metrics.requests,
      alerts: {
        active: activeAlerts,
        stats: alertStats,
      },
      cache: metrics.cache,
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: dashboard,
      message: 'Données du dashboard récupérées avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données du dashboard',
      error: error.message,
    });
  }
});

module.exports = router;
