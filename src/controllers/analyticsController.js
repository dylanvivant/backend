const analyticsService = require('../services/analyticsService');
const { AppError, successResponse } = require('../utils/helpers');
const cacheService = require('../services/cacheService');

class AnalyticsController {
  /**
   * Récupérer l'aperçu de l'équipe (membres actifs, demandes en attente, etc.)
   */
  async getTeamOverview(req, res) {
    try {
      const cacheKey = 'analytics:team_overview';
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const overview = await analyticsService.getTeamOverview();

      // Mettre en cache pour 10 minutes
      cacheService.set(cacheKey, overview, 600);

      res.json(successResponse(overview));
    } catch (error) {
      console.error('Erreur getTeamOverview:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          "Erreur lors de la récupération de l'aperçu de l'équipe",
      });
    }
  }

  /**
   * Récupérer les statistiques générales
   */
  async getGeneralStats(req, res) {
    try {
      const { period = '7d' } = req.query;

      const cacheKey = `analytics:general:${period}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const stats = await analyticsService.getGeneralStats(period);

      // Mettre en cache pour 15 minutes
      cacheService.set(cacheKey, stats, 900);

      res.json(successResponse(stats));
    } catch (error) {
      console.error('Erreur getGeneralStats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des statistiques générales',
      });
    }
  }

  /**
   * Récupérer les statistiques des utilisateurs
   */
  async getUserStats(req, res) {
    try {
      const { period = '7d' } = req.query;

      const cacheKey = `analytics:users:${period}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const stats = await analyticsService.getUserStats(period);

      // Mettre en cache pour 15 minutes
      cacheService.set(cacheKey, stats, 900);

      res.json(successResponse(stats));
    } catch (error) {
      console.error('Erreur getUserStats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des statistiques utilisateurs',
      });
    }
  }

  /**
   * Récupérer les statistiques des événements
   */
  async getEventStats(req, res) {
    try {
      const { period = '7d' } = req.query;

      const cacheKey = `analytics:events:${period}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const stats = await analyticsService.getEventStats(period);

      // Mettre en cache pour 15 minutes
      cacheService.set(cacheKey, stats, 900);

      res.json(successResponse(stats));
    } catch (error) {
      console.error('Erreur getEventStats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des statistiques événements',
      });
    }
  }

  /**
   * Récupérer les statistiques des performances
   */
  async getPerformanceStats(req, res) {
    try {
      const { period = '7d' } = req.query;

      const cacheKey = `analytics:performance:${period}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const stats = await analyticsService.getPerformanceStats(period);

      // Mettre en cache pour 15 minutes
      cacheService.set(cacheKey, stats, 900);

      res.json(successResponse(stats));
    } catch (error) {
      console.error('Erreur getPerformanceStats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des statistiques de performance',
      });
    }
  }

  /**
   * Récupérer les métriques d'engagement
   */
  async getEngagementMetrics(req, res) {
    try {
      const { period = '7d' } = req.query;

      const cacheKey = `analytics:engagement:${period}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const metrics = await analyticsService.getEngagementMetrics(period);

      // Mettre en cache pour 15 minutes
      cacheService.set(cacheKey, metrics, 900);

      res.json(successResponse(metrics));
    } catch (error) {
      console.error('Erreur getEngagementMetrics:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          "Erreur lors de la récupération des métriques d'engagement",
      });
    }
  }

  /**
   * Récupérer les statistiques des équipes
   */
  async getTeamStats(req, res) {
    try {
      const { period = '7d' } = req.query;

      const cacheKey = `analytics:teams:${period}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const stats = await analyticsService.getTeamStats(period);

      // Mettre en cache pour 15 minutes
      cacheService.set(cacheKey, stats, 900);

      res.json(successResponse(stats));
    } catch (error) {
      console.error('Erreur getTeamStats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des statistiques équipes',
      });
    }
  }

  /**
   * Enregistrer un événement analytique
   */
  async trackEvent(req, res) {
    try {
      const { event_name, event_data, user_id } = req.body;

      const eventData = {
        event_name,
        event_data,
        user_id: user_id || req.user?.id,
        timestamp: new Date().toISOString(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      };

      await analyticsService.trackEvent(eventData);

      res.json(successResponse(null, 'Événement enregistré avec succès'));
    } catch (error) {
      console.error('Erreur trackEvent:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || "Erreur lors de l'enregistrement de l'événement",
      });
    }
  }

  /**
   * Générer un rapport personnalisé
   */
  async generateCustomReport(req, res) {
    try {
      const {
        metrics,
        filters,
        period = '7d',
        group_by,
        format = 'json',
      } = req.body;

      const report = await analyticsService.generateCustomReport({
        metrics,
        filters,
        period,
        group_by,
        format,
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="rapport_personnalise.csv"'
        );
        res.send(report);
      } else {
        res.json(successResponse(report));
      }
    } catch (error) {
      console.error('Erreur generateCustomReport:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la génération du rapport',
      });
    }
  }

  /**
   * Récupérer les KPIs principaux
   */
  async getMainKPIs(req, res) {
    try {
      const { period = '7d' } = req.query;

      const cacheKey = `analytics:kpis:${period}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const kpis = await analyticsService.getMainKPIs(period);

      // Mettre en cache pour 10 minutes
      cacheService.set(cacheKey, kpis, 600);

      res.json(successResponse(kpis));
    } catch (error) {
      console.error('Erreur getMainKPIs:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des KPIs',
      });
    }
  }

  /**
   * Récupérer les données de tendances
   */
  async getTrendData(req, res) {
    try {
      const { metric, period = '30d', granularity = 'day' } = req.query;

      const cacheKey = `analytics:trends:${metric}:${period}:${granularity}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const trendData = await analyticsService.getTrendData(
        metric,
        period,
        granularity
      );

      // Mettre en cache pour 30 minutes
      cacheService.set(cacheKey, trendData, 1800);

      res.json(successResponse(trendData));
    } catch (error) {
      console.error('Erreur getTrendData:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des données de tendances',
      });
    }
  }

  /**
   * Récupérer les statistiques temps réel
   */
  async getRealTimeStats(req, res) {
    try {
      const stats = await analyticsService.getRealTimeStats();

      res.json(successResponse(stats));
    } catch (error) {
      console.error('Erreur getRealTimeStats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des statistiques temps réel',
      });
    }
  }

  /**
   * Récupérer les métriques de rétention
   */
  async getRetentionMetrics(req, res) {
    try {
      const { period = '30d', cohort_type = 'weekly' } = req.query;

      const cacheKey = `analytics:retention:${period}:${cohort_type}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const metrics = await analyticsService.getRetentionMetrics(
        period,
        cohort_type
      );

      // Mettre en cache pour 1 heure
      cacheService.set(cacheKey, metrics, 3600);

      res.json(successResponse(metrics));
    } catch (error) {
      console.error('Erreur getRetentionMetrics:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des métriques de rétention',
      });
    }
  }

  /**
   * Récupérer les données de l'entonnoir de conversion
   */
  async getFunnelData(req, res) {
    try {
      const { funnel_name, period = '30d' } = req.query;

      const cacheKey = `analytics:funnel:${funnel_name}:${period}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const funnelData = await analyticsService.getFunnelData(
        funnel_name,
        period
      );

      // Mettre en cache pour 30 minutes
      cacheService.set(cacheKey, funnelData, 1800);

      res.json(successResponse(funnelData));
    } catch (error) {
      console.error('Erreur getFunnelData:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          "Erreur lors de la récupération des données de l'entonnoir",
      });
    }
  }

  /**
   * Exporter les données analytics
   */
  async exportData(req, res) {
    try {
      const { type, period = '30d', format = 'csv', filters = {} } = req.body;

      const data = await analyticsService.exportData(
        type,
        period,
        format,
        filters
      );

      const filename = `analytics_${type}_${period}_${Date.now()}.${format}`;

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`
        );
        res.send(data);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`
        );
        res.json(data);
      } else {
        res.json(successResponse(data));
      }
    } catch (error) {
      console.error('Erreur exportData:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erreur lors de l'export des données",
      });
    }
  }

  /**
   * Récupérer les alertes analytiques
   */
  async getAnalyticsAlerts(req, res) {
    try {
      const alerts = await analyticsService.getAnalyticsAlerts();

      res.json(successResponse(alerts));
    } catch (error) {
      console.error('Erreur getAnalyticsAlerts:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des alertes',
      });
    }
  }

  /**
   * Configurer une alerte analytique
   */
  async configureAlert(req, res) {
    try {
      const {
        metric,
        condition,
        threshold,
        notification_email,
        is_active = true,
      } = req.body;

      const alertConfig = {
        metric,
        condition,
        threshold,
        notification_email,
        is_active,
        created_by: req.user.id,
      };

      const alert = await analyticsService.configureAlert(alertConfig);

      res
        .status(201)
        .json(successResponse(alert, 'Alerte configurée avec succès'));
    } catch (error) {
      console.error('Erreur configureAlert:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erreur lors de la configuration de l'alerte",
      });
    }
  }

  /**
   * Nettoyer le cache analytics
   */
  async clearAnalyticsCache(req, res) {
    try {
      const cleared = cacheService.invalidatePattern('analytics');

      res.json(
        successResponse(
          { cleared_entries: cleared },
          'Cache analytics nettoyé avec succès'
        )
      );
    } catch (error) {
      console.error('Erreur clearAnalyticsCache:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors du nettoyage du cache',
      });
    }
  }
}

module.exports = new AnalyticsController();
