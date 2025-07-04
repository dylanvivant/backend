// ========================================
// REPORTING CONTROLLER
// src/controllers/reportingController.js
// ========================================
const reportingService = require('../services/reportingService');
const { validationResult } = require('express-validator');

class ReportingController {
  // Générer un rapport de présence
  async generateAttendanceReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array(),
        });
      }

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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Générer un rapport de performance
  async generatePerformanceReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array(),
        });
      }

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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Générer un rapport d'événements
  async generateEventsReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array(),
        });
      }

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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Générer un rapport d'entraînement
  async generateTrainingReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array(),
        });
      }

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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Générer un rapport complet
  async generateComprehensiveReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array(),
        });
      }

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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Générer un rapport personnalisé
  async generateCustomReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array(),
        });
      }

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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Obtenir les statistiques de performance d'un utilisateur
  async getUserPerformanceStats(req, res) {
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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Obtenir les statistiques personnelles
  async getMyStats(req, res) {
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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Obtenir les types de rapports disponibles
  async getReportTypes(req, res) {
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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Obtenir les formats de rapports supportés
  async getReportFormats(req, res) {
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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Planifier un rapport automatique
  async scheduleReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array(),
        });
      }

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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Obtenir les rapports planifiés
  async getScheduledReports(req, res) {
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
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new ReportingController();
