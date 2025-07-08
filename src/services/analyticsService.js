// ========================================
// ANALYTICS SERVICE
// src/services/analyticsService.js
// ========================================
const { User, Event, SessionNote, EventParticipant } = require('../models');
const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/helpers');
const cacheService = require('./cacheService');

class AnalyticsService {
  constructor() {
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Métriques de base de l'équipe
  async getTeamOverview() {
    const cacheKey = 'analytics:team_overview';
    let data = cacheService.get(cacheKey);

    if (data) return data;

    try {
      const [
        totalMembers,
        activeMembers,
        upcomingEvents,
        completedEvents,
        totalNotes,
        pendingHomework,
      ] = await Promise.all([
        this.getTotalMembers(),
        this.getActiveMembers(30), // 30 derniers jours
        this.getUpcomingEvents(),
        this.getCompletedEvents(30),
        this.getTotalNotes(),
        this.getPendingHomework(),
      ]);

      data = {
        members: {
          total: totalMembers,
          active: activeMembers,
        },
        events: {
          upcoming: upcomingEvents,
          completed: completedEvents,
        },
        training: {
          totalNotes,
          pendingHomework,
        },
        lastUpdated: new Date().toISOString(),
      };

      cacheService.set(cacheKey, data, this.cacheTimeout);
      return data;
    } catch (error) {
      console.error('Erreur analytics overview:', error);
      throw error;
    }
  }

  // Métriques de performance
  async getPerformanceMetrics() {
    const cacheKey = 'analytics:performance';
    let data = cacheService.get(cacheKey);

    if (data) return data;

    try {
      const [
        attendanceRate,
        homeworkCompletion,
        eventFrequency,
        memberEngagement,
      ] = await Promise.all([
        this.calculateAttendanceRate(),
        this.calculateHomeworkCompletion(),
        this.calculateEventFrequency(),
        this.calculateMemberEngagement(),
      ]);

      data = {
        attendance: attendanceRate,
        homework: homeworkCompletion,
        eventFrequency,
        engagement: memberEngagement,
        lastUpdated: new Date().toISOString(),
      };

      cacheService.set(cacheKey, data, this.cacheTimeout);
      return data;
    } catch (error) {
      console.error('Erreur analytics performance:', error);
      throw error;
    }
  }

  // Statistiques d'un joueur
  async getPlayerStats(userId) {
    const cacheKey = `analytics:player:${userId}`;
    let data = cacheService.get(cacheKey);

    if (data) return data;

    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('Utilisateur non trouvé');

      const [
        eventsAttended,
        eventsTotal,
        homeworkCompleted,
        homeworkTotal,
        notesReceived,
        averageAttendance,
      ] = await Promise.all([
        this.getPlayerEventsAttended(userId),
        this.getPlayerEventsTotal(userId),
        this.getPlayerHomeworkCompleted(userId),
        this.getPlayerHomeworkTotal(userId),
        this.getPlayerNotesReceived(userId),
        this.getPlayerAverageAttendance(userId),
      ]);

      data = {
        player: {
          id: userId,
          pseudo: user.pseudo,
          role: user.roles?.name || 'Membre',
        },
        attendance: {
          eventsAttended,
          eventsTotal,
          rate:
            eventsTotal > 0
              ? ((eventsAttended / eventsTotal) * 100).toFixed(1)
              : 0,
          average: averageAttendance,
        },
        homework: {
          completed: homeworkCompleted,
          total: homeworkTotal,
          rate:
            homeworkTotal > 0
              ? ((homeworkCompleted / homeworkTotal) * 100).toFixed(1)
              : 0,
        },
        notes: notesReceived,
        lastUpdated: new Date().toISOString(),
      };

      cacheService.set(cacheKey, data, this.cacheTimeout);
      return data;
    } catch (error) {
      console.error('Erreur analytics joueur:', error);
      throw error;
    }
  }

  // Insights de coaching
  async getCoachingInsights(coachId = null) {
    const cacheKey = `analytics:coaching:${coachId || 'all'}`;
    let data = cacheService.get(cacheKey);

    if (data) return data;

    try {
      const insights = {
        mostActiveMembers: await this.getMostActiveMembers(),
        leastActiveMembers: await this.getLeastActiveMembers(),
        homeworkTrends: await this.getHomeworkTrends(),
        attendanceTrends: await this.getAttendanceTrends(),
        recommendedActions: await this.getRecommendedActions(),
      };

      data = {
        insights,
        generatedBy: coachId,
        lastUpdated: new Date().toISOString(),
      };

      cacheService.set(cacheKey, data, this.cacheTimeout);
      return data;
    } catch (error) {
      console.error('Erreur insights coaching:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques générales
   */
  async getGeneralStats(period = '7d') {
    try {
      const dateFrom = this.calculateDateFrom(period);

      // Statistiques des utilisateurs
      const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('id, created_at, is_verified')
        .gte('created_at', dateFrom);

      if (userError) {
        throw new AppError(
          `Erreur lors de la récupération des stats utilisateurs: ${userError.message}`,
          400
        );
      }

      // Statistiques des événements (si la table existe)
      let eventStats = [];
      try {
        const { data: events, error: eventError } = await supabase
          .from('events')
          .select('id, created_at, event_type')
          .gte('created_at', dateFrom);

        if (!eventError) {
          eventStats = events || [];
        }
      } catch (e) {
        // Table events n'existe pas encore
      }

      // Calculer les statistiques
      const totalUsers = userStats.length;
      const verifiedUsers = userStats.filter((u) => u.is_verified).length;
      const totalEvents = eventStats.length;

      // Utilisateurs actifs (dernières 24h)
      const last24h = new Date();
      last24h.setHours(last24h.getHours() - 24);

      const activeUsers = userStats.filter(
        (u) => new Date(u.created_at) >= last24h
      ).length;

      return {
        period,
        total_users: totalUsers,
        verified_users: verifiedUsers,
        verification_rate:
          totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0,
        active_users_24h: activeUsers,
        total_events: totalEvents,
        growth_rate: await this.calculateGrowthRate('users', period),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des statistiques générales: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les statistiques des utilisateurs
   */
  async getUserStats(period = '7d') {
    try {
      const dateFrom = this.calculateDateFrom(period);

      const { data: users, error } = await supabase
        .from('users')
        .select('id, created_at, is_verified, role_id, roles(name)')
        .gte('created_at', dateFrom);

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération des stats utilisateurs: ${error.message}`,
          400
        );
      }

      // Grouper par rôle
      const roleStats = {};
      users.forEach((user) => {
        const roleName = user.roles?.name || 'unknown';
        if (!roleStats[roleName]) {
          roleStats[roleName] = { total: 0, verified: 0 };
        }
        roleStats[roleName].total++;
        if (user.is_verified) {
          roleStats[roleName].verified++;
        }
      });

      return {
        period,
        total_users: users.length,
        verified_users: users.filter((u) => u.is_verified).length,
        role_distribution: roleStats,
        daily_registrations: await this.getDailyRegistrations(period),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des statistiques utilisateurs: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les statistiques des événements
   */
  async getEventStats(period = '7d') {
    try {
      // Retourner des données simulées si la table events n'existe pas
      return {
        period,
        total_events: 0,
        event_types: {},
        events_per_day: [],
        top_events: [],
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des statistiques événements: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les statistiques de performance
   */
  async getPerformanceStats(period = '7d') {
    try {
      return {
        period,
        avg_response_time: 0,
        error_rate: 0,
        uptime: 99.9,
        requests_per_second: 0,
        database_performance: {
          avg_query_time: 0,
          slow_queries: 0,
        },
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des statistiques de performance: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les métriques d'engagement
   */
  async getEngagementMetrics(period = '7d') {
    try {
      const dateFrom = this.calculateDateFrom(period);

      const { data: users, error } = await supabase
        .from('users')
        .select('id, created_at, updated_at')
        .gte('created_at', dateFrom);

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération des métriques d'engagement: ${error.message}`,
          400
        );
      }

      return {
        period,
        active_users: users.length,
        returning_users: 0,
        session_duration: 0,
        page_views: 0,
        bounce_rate: 0,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des métriques d'engagement: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les statistiques des équipes
   */
  async getTeamStats(period = '7d') {
    try {
      return {
        period,
        total_teams: 0,
        active_teams: 0,
        team_members: 0,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des statistiques équipes: ${error.message}`,
        500
      );
    }
  }

  /**
   * Enregistrer un événement
   */
  async trackEvent(eventData) {
    try {
      // Tentative d'insertion dans la table events
      try {
        const { data, error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) {
          console.warn(
            'Table events non trouvée, événement ignoré:',
            error.message
          );
        }
      } catch (e) {
        console.warn("Impossible d'enregistrer l'événement:", e.message);
      }

      return { success: true };
    } catch (error) {
      throw new AppError(
        `Erreur lors de l'enregistrement de l'événement: ${error.message}`,
        500
      );
    }
  }

  /**
   * Générer un rapport personnalisé
   */
  async generateCustomReport(options) {
    try {
      const { metrics, period, format } = options;

      const report = {
        period,
        metrics: metrics || [],
        generated_at: new Date().toISOString(),
        data: {},
      };

      // Ajouter les métriques demandées
      if (metrics.includes('users')) {
        report.data.users = await this.getUserStats(period);
      }

      if (format === 'csv') {
        return this.convertToCSV(report);
      }

      return report;
    } catch (error) {
      throw new AppError(
        `Erreur lors de la génération du rapport: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les KPIs principaux
   */
  async getMainKPIs(period = '7d') {
    try {
      const generalStats = await this.getGeneralStats(period);
      const userStats = await this.getUserStats(period);

      return {
        period,
        kpis: {
          total_users: generalStats.total_users,
          verified_users: generalStats.verified_users,
          verification_rate: generalStats.verification_rate,
          growth_rate: generalStats.growth_rate,
          active_users: generalStats.active_users_24h,
        },
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des KPIs: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les données de tendances
   */
  async getTrendData(metric, period = '30d', granularity = 'day') {
    try {
      return {
        metric,
        period,
        granularity,
        data: [],
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des données de tendances: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les statistiques temps réel
   */
  async getRealTimeStats() {
    try {
      const now = new Date();
      const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

      return {
        timestamp: now.toISOString(),
        online_users: 0,
        active_sessions: 0,
        requests_per_minute: 0,
        errors_per_minute: 0,
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des statistiques temps réel: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les métriques de rétention
   */
  async getRetentionMetrics(period = '30d', cohortType = 'weekly') {
    try {
      return {
        period,
        cohort_type: cohortType,
        cohorts: [],
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des métriques de rétention: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les données de l'entonnoir
   */
  async getFunnelData(funnelName, period = '30d') {
    try {
      return {
        funnel_name: funnelName,
        period,
        steps: [],
        conversion_rate: 0,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des données de l'entonnoir: ${error.message}`,
        500
      );
    }
  }

  /**
   * Exporter les données
   */
  async exportData(type, period = '30d', format = 'json', filters = {}) {
    try {
      let data = {};

      switch (type) {
        case 'users':
          data = await this.getUserStats(period);
          break;
        case 'general':
          data = await this.getGeneralStats(period);
          break;
        default:
          data = { message: 'Type de données non supporté' };
      }

      if (format === 'csv') {
        return this.convertToCSV(data);
      }

      return data;
    } catch (error) {
      throw new AppError(
        `Erreur lors de l'export des données: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les alertes
   */
  async getAnalyticsAlerts() {
    try {
      return [];
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des alertes: ${error.message}`,
        500
      );
    }
  }

  /**
   * Configurer une alerte
   */
  async configureAlert(alertConfig) {
    try {
      return {
        id: Date.now(),
        ...alertConfig,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la configuration de l'alerte: ${error.message}`,
        500
      );
    }
  }

  // Nettoyer le cache
  clearCache() {
    return cacheService.invalidatePattern('analytics:.*');
  }

  // Méthodes utilitaires privées
  calculateDateFrom(period) {
    const now = new Date();
    const days = parseInt(period.replace('d', ''));
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  async calculateGrowthRate(table, period) {
    try {
      const currentPeriodStart = this.calculateDateFrom(period);
      const previousPeriodStart = this.calculateDateFrom(
        `${parseInt(period.replace('d', '')) * 2}d`
      );

      const { data: currentData } = await supabase
        .from(table)
        .select('id')
        .gte('created_at', currentPeriodStart);

      const { data: previousData } = await supabase
        .from(table)
        .select('id')
        .gte('created_at', previousPeriodStart)
        .lt('created_at', currentPeriodStart);

      const currentCount = currentData?.length || 0;
      const previousCount = previousData?.length || 0;

      if (previousCount === 0) return 0;
      return ((currentCount - previousCount) / previousCount) * 100;
    } catch (error) {
      return 0;
    }
  }

  async getDailyRegistrations(period) {
    try {
      const dateFrom = this.calculateDateFrom(period);

      const { data: users, error } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', dateFrom);

      if (error) return [];

      // Grouper par jour
      const dailyStats = {};
      users.forEach((user) => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      });

      return Object.entries(dailyStats).map(([date, count]) => ({
        date,
        registrations: count,
      }));
    } catch (error) {
      return [];
    }
  }

  convertToCSV(data) {
    try {
      const headers = Object.keys(data);
      const csvContent = [
        headers.join(','),
        headers.map((header) => data[header]).join(','),
      ].join('\n');

      return csvContent;
    } catch (error) {
      throw new AppError(
        `Erreur lors de la conversion CSV: ${error.message}`,
        500
      );
    }
  }
}

module.exports = new AnalyticsService();
