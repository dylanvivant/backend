// ========================================
// ANALYTICS SERVICE
// src/services/analyticsService.js
// ========================================
const { User, Event, SessionNote, EventParticipant } = require('../models');
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

  // Méthodes utilitaires privées

  async getTotalMembers() {
    const { data } = await User.supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
    return data || 0;
  }

  async getActiveMembers(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await EventParticipant.supabase
      .from('event_participants')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', since.toISOString())
      .eq('status', 'accepted');

    return data || 0;
  }

  async getUpcomingEvents() {
    const { data } = await Event.supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gte('start_time', new Date().toISOString())
      .eq('status', 'scheduled');

    return data || 0;
  }

  async getCompletedEvents(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await Event.supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gte('start_time', since.toISOString())
      .eq('status', 'completed');

    return data || 0;
  }

  async getTotalNotes() {
    const { data } = await SessionNote.supabase
      .from('session_notes')
      .select('id', { count: 'exact', head: true });
    return data || 0;
  }

  async getPendingHomework() {
    const { data } = await SessionNote.supabase
      .from('session_notes')
      .select('id', { count: 'exact', head: true })
      .eq('is_homework', true)
      .is('completed_at', null);
    return data || 0;
  }

  async calculateAttendanceRate() {
    // Implémentation simplifiée
    const totalEvents = await this.getCompletedEvents(30);
    const totalAttendances = await this.getActiveMembers(30);

    return totalEvents > 0
      ? ((totalAttendances / totalEvents) * 100).toFixed(1)
      : 0;
  }

  async calculateHomeworkCompletion() {
    const { data: total } = await SessionNote.supabase
      .from('session_notes')
      .select('id', { count: 'exact', head: true })
      .eq('is_homework', true);

    const { data: completed } = await SessionNote.supabase
      .from('session_notes')
      .select('id', { count: 'exact', head: true })
      .eq('is_homework', true)
      .not('completed_at', 'is', null);

    return total > 0 ? (((completed || 0) / total) * 100).toFixed(1) : 0;
  }

  async calculateEventFrequency() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await Event.supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gte('start_time', thirtyDaysAgo.toISOString());

    return (data || 0) / 30; // Événements par jour
  }

  async calculateMemberEngagement() {
    // Score d'engagement basé sur présence et devoirs
    const attendance = await this.calculateAttendanceRate();
    const homework = await this.calculateHomeworkCompletion();

    return ((parseFloat(attendance) + parseFloat(homework)) / 2).toFixed(1);
  }

  // Méthodes pour statistiques joueur
  async getPlayerEventsAttended(userId) {
    const { data } = await EventParticipant.supabase
      .from('event_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_present', true);
    return data || 0;
  }

  async getPlayerEventsTotal(userId) {
    const { data } = await EventParticipant.supabase
      .from('event_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return data || 0;
  }

  async getPlayerHomeworkCompleted(userId) {
    const { data } = await SessionNote.supabase
      .from('session_notes')
      .select('id', { count: 'exact', head: true })
      .eq('target_user_id', userId)
      .eq('is_homework', true)
      .not('completed_at', 'is', null);
    return data || 0;
  }

  async getPlayerHomeworkTotal(userId) {
    const { data } = await SessionNote.supabase
      .from('session_notes')
      .select('id', { count: 'exact', head: true })
      .eq('target_user_id', userId)
      .eq('is_homework', true);
    return data || 0;
  }

  async getPlayerNotesReceived(userId) {
    const { data } = await SessionNote.supabase
      .from('session_notes')
      .select('id', { count: 'exact', head: true })
      .eq('target_user_id', userId);
    return data || 0;
  }

  async getPlayerAverageAttendance(userId) {
    // Calcul de la moyenne de présence sur les 10 derniers événements
    const { data: events } = await EventParticipant.supabase
      .from('event_participants')
      .select('is_present')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!events || events.length === 0) return 0;

    const present = events.filter((e) => e.is_present).length;
    return ((present / events.length) * 100).toFixed(1);
  }

  // Méthodes pour insights coaching
  async getMostActiveMembers() {
    // Top 5 des membres les plus actifs
    const { data } = await EventParticipant.supabase
      .from('event_participants')
      .select(
        `
                user_id,
                users(pseudo),
                count:id.count()
            `
      )
      .eq('is_present', true)
      .group('user_id')
      .order('count', { ascending: false })
      .limit(5);

    return data || [];
  }

  async getLeastActiveMembers() {
    // Top 5 des membres les moins actifs
    const { data } = await EventParticipant.supabase
      .from('event_participants')
      .select(
        `
                user_id,
                users(pseudo),
                count:id.count()
            `
      )
      .group('user_id')
      .order('count', { ascending: true })
      .limit(5);

    return data || [];
  }

  async getHomeworkTrends() {
    // Tendances des devoirs sur les 4 dernières semaines
    const trends = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const { data: total } = await SessionNote.supabase
        .from('session_notes')
        .select('id', { count: 'exact', head: true })
        .eq('is_homework', true)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString());

      const { data: completed } = await SessionNote.supabase
        .from('session_notes')
        .select('id', { count: 'exact', head: true })
        .eq('is_homework', true)
        .not('completed_at', 'is', null)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString());

      trends.unshift({
        week: `Semaine ${i + 1}`,
        total: total || 0,
        completed: completed || 0,
        rate: total > 0 ? (((completed || 0) / total) * 100).toFixed(1) : 0,
      });
    }

    return trends;
  }

  async getAttendanceTrends() {
    // Tendances de présence sur les 4 dernières semaines
    const trends = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const { data: total } = await EventParticipant.supabase
        .from('event_participants')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString());

      const { data: present } = await EventParticipant.supabase
        .from('event_participants')
        .select('id', { count: 'exact', head: true })
        .eq('is_present', true)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString());

      trends.unshift({
        week: `Semaine ${i + 1}`,
        total: total || 0,
        present: present || 0,
        rate: total > 0 ? (((present || 0) / total) * 100).toFixed(1) : 0,
      });
    }

    return trends;
  }

  async getRecommendedActions() {
    const actions = [];

    // Analyser les tendances et recommander des actions
    const homeworkRate = await this.calculateHomeworkCompletion();
    const attendanceRate = await this.calculateAttendanceRate();

    if (parseFloat(homeworkRate) < 70) {
      actions.push({
        type: 'homework',
        priority: 'high',
        message:
          'Taux de completion des devoirs faible. Considérer des rappels ou réduire la charge.',
        metric: `${homeworkRate}%`,
      });
    }

    if (parseFloat(attendanceRate) < 60) {
      actions.push({
        type: 'attendance',
        priority: 'high',
        message:
          "Taux de présence faible. Revoir les horaires ou la motivation de l'équipe.",
        metric: `${attendanceRate}%`,
      });
    }

    const inactiveMembers = await this.getLeastActiveMembers();
    if (inactiveMembers.length > 0) {
      actions.push({
        type: 'engagement',
        priority: 'medium',
        message: `${inactiveMembers.length} membres peu actifs. Prévoir des entretiens individuels.`,
        members: inactiveMembers.map((m) => m.users?.pseudo).filter(Boolean),
      });
    }

    return actions;
  }

  // Nettoyer le cache
  clearCache() {
    return cacheService.invalidatePattern('analytics:.*');
  }
}

module.exports = new AnalyticsService();
