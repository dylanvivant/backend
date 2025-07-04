// ========================================
// ROUTES REPORTING
// src/routes/reporting.js
// ========================================
const express = require('express');
const router = express.Router();
const reportingService = require('../services/reportingService');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/advancedRbac');
const { validateSchema } = require('../middleware/validation');
const { reportingSchemas } = require('../validation/schemas');

// Middleware d'authentification pour toutes les routes
router.use(authenticate);

// ========================================
// GÉNÉRATION DE RAPPORTS
// ========================================

// Générer un rapport de présence
router.post(
  '/attendance',
  authorize(['admin', 'manager']),
  validateSchema(reportingSchemas.attendanceReport),
  async (req, res) => {
    try {
      const { startDate, endDate, userIds, format = 'json' } = req.body;

      const report = await reportingService.generateAttendanceReport({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        userIds,
        format,
      });

      res.json({
        success: true,
        data: report,
        message: 'Rapport de présence généré avec succès',
      });
    } catch (error) {
      console.error('Erreur génération rapport présence:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du rapport de présence',
        error: error.message,
      });
    }
  }
);

// Générer un rapport de performance
router.post(
  '/performance',
  authorize(['admin', 'manager']),
  validateSchema(reportingSchemas.performanceReport),
  async (req, res) => {
    try {
      const { startDate, endDate, userIds, format = 'json' } = req.body;

      const report = await reportingService.generatePerformanceReport({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        userIds,
        format,
      });

      res.json({
        success: true,
        data: report,
        message: 'Rapport de performance généré avec succès',
      });
    } catch (error) {
      console.error('Erreur génération rapport performance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du rapport de performance',
        error: error.message,
      });
    }
  }
);

// Générer un rapport d'événements
router.post(
  '/events',
  authorize(['admin', 'manager']),
  validateSchema(reportingSchemas.eventsReport),
  async (req, res) => {
    try {
      const { startDate, endDate, eventTypes, format = 'json' } = req.body;

      const report = await reportingService.generateEventsReport({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        eventTypes,
        format,
      });

      res.json({
        success: true,
        data: report,
        message: "Rapport d'événements généré avec succès",
      });
    } catch (error) {
      console.error('Erreur génération rapport événements:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la génération du rapport d'événements",
        error: error.message,
      });
    }
  }
);

// Générer un rapport d'entraînement
router.post(
  '/training',
  authorize(['admin', 'manager']),
  validateSchema(reportingSchemas.trainingReport),
  async (req, res) => {
    try {
      const { startDate, endDate, userIds, format = 'json' } = req.body;

      const report = await reportingService.generateTrainingReport({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        userIds,
        format,
      });

      res.json({
        success: true,
        data: report,
        message: "Rapport d'entraînement généré avec succès",
      });
    } catch (error) {
      console.error('Erreur génération rapport entraînement:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la génération du rapport d'entraînement",
        error: error.message,
      });
    }
  }
);

// Générer un rapport complet
router.post(
  '/comprehensive',
  authorize(['admin', 'manager']),
  validateSchema(reportingSchemas.comprehensiveReport),
  async (req, res) => {
    try {
      const { startDate, endDate, format = 'json' } = req.body;

      const report = await reportingService.generateComprehensiveReport({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        format,
      });

      res.json({
        success: true,
        data: report,
        message: 'Rapport complet généré avec succès',
      });
    } catch (error) {
      console.error('Erreur génération rapport complet:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du rapport complet',
        error: error.message,
      });
    }
  }
);

// ========================================
// RAPPORTS PERSONNALISÉS
// ========================================

// Générer un rapport personnalisé
router.post(
  '/custom',
  authorize(['admin', 'manager']),
  validateSchema(reportingSchemas.customReport),
  async (req, res) => {
    try {
      const { reportType, parameters, format = 'json' } = req.body;

      let report;

      switch (reportType) {
        case 'attendance':
          report = await reportingService.generateAttendanceReport({
            ...parameters,
            format,
          });
          break;

        case 'performance':
          report = await reportingService.generatePerformanceReport({
            ...parameters,
            format,
          });
          break;

        case 'events':
          report = await reportingService.generateEventsReport({
            ...parameters,
            format,
          });
          break;

        case 'training':
          report = await reportingService.generateTrainingReport({
            ...parameters,
            format,
          });
          break;

        case 'comprehensive':
          report = await reportingService.generateComprehensiveReport({
            ...parameters,
            format,
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Type de rapport non supporté',
          });
      }

      res.json({
        success: true,
        data: report,
        message: 'Rapport personnalisé généré avec succès',
      });
    } catch (error) {
      console.error('Erreur génération rapport personnalisé:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du rapport personnalisé',
        error: error.message,
      });
    }
  }
);

// ========================================
// STATISTIQUES UTILISATEUR
// ========================================

// Obtenir les statistiques de performance d'un utilisateur
router.get(
  '/user/:userId/stats',
  authorize(['admin', 'manager', 'captain']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      const stats = await reportingService.getUserPerformanceStats(
        userId,
        startDate
          ? new Date(startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate ? new Date(endDate) : new Date()
      );

      res.json({
        success: true,
        data: stats,
        message: 'Statistiques utilisateur récupérées avec succès',
      });
    } catch (error) {
      console.error('Erreur récupération stats utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message,
      });
    }
  }
);

// Obtenir les statistiques personnelles (pour l'utilisateur connecté)
router.get('/my-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await reportingService.getUserPerformanceStats(
      req.user.id,
      startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );

    res.json({
      success: true,
      data: stats,
      message: 'Vos statistiques personnelles récupérées avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération stats personnelles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos statistiques',
      error: error.message,
    });
  }
});

// ========================================
// MÉTADONNÉES ET CONFIGURATION
// ========================================

// Obtenir les types de rapports disponibles
router.get('/types', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const types = reportingService.getAvailableReportTypes();

    res.json({
      success: true,
      data: types,
      message: 'Types de rapports disponibles',
    });
  } catch (error) {
    console.error('Erreur récupération types rapports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des types de rapports',
      error: error.message,
    });
  }
});

// Obtenir les formats de rapports supportés
router.get('/formats', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const formats = {
      json: 'JSON - Format de données structurées',
      csv: 'CSV - Fichier de valeurs séparées par des virgules',
      pdf: 'PDF - Document portable (à venir)',
      html: 'HTML - Page web',
    };

    res.json({
      success: true,
      data: formats,
      message: 'Formats de rapports supportés',
    });
  } catch (error) {
    console.error('Erreur récupération formats rapports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des formats de rapports',
      error: error.message,
    });
  }
});

// ========================================
// PLANIFICATION ET AUTOMATION
// ========================================

// Planifier un rapport automatique
router.post(
  '/schedule',
  authorize(['admin', 'manager']),
  validateSchema(reportingSchemas.scheduleReport),
  async (req, res) => {
    try {
      const {
        reportType,
        parameters,
        schedule,
        recipients,
        format = 'json',
      } = req.body;

      // Implémentation future avec cron jobs
      // Pour l'instant, on stocke juste la configuration
      const scheduledReport = {
        id: `scheduled_${Date.now()}`,
        reportType,
        parameters,
        schedule,
        recipients,
        format,
        createdAt: new Date(),
        createdBy: req.user.id,
        active: true,
      };

      res.json({
        success: true,
        data: scheduledReport,
        message:
          'Rapport planifié avec succès (fonctionnalité en développement)',
      });
    } catch (error) {
      console.error('Erreur planification rapport:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la planification du rapport',
        error: error.message,
      });
    }
  }
);

// Obtenir les rapports planifiés
router.get('/scheduled', authorize(['admin', 'manager']), async (req, res) => {
  try {
    // Implémentation future - pour l'instant retourne un tableau vide
    const scheduledReports = [];

    res.json({
      success: true,
      data: scheduledReports,
      message: 'Rapports planifiés récupérés avec succès',
    });
  } catch (error) {
    console.error('Erreur récupération rapports planifiés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rapports planifiés',
      error: error.message,
    });
  }
});

module.exports = router;
