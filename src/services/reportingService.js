// ========================================
// REPORTING SERVICE
// src/services/reportingService.js
// ========================================
const { User, Event, EventParticipant, SessionNote } = require('../models');
const analyticsService = require('./analyticsService');
const cacheService = require('./cacheService');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');

class ReportingService {
  constructor() {
    this.reportTypes = {
      attendance: 'Rapport de présence',
      performance: 'Rapport de performance',
      events: "Rapport d'événements",
      training: "Rapport d'entraînement",
      comprehensive: 'Rapport complet',
    };
  }

  // Générer un rapport de présence
  async generateAttendanceReport(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      userIds = null,
      format: reportFormat = 'json',
    } = options;

    try {
      const events = await Event.find({
        date: { $gte: startDate, $lte: endDate },
        status: 'completed',
      }).populate('participants.user');

      const users = userIds
        ? await User.find({ _id: { $in: userIds } })
        : await User.find({ role: { $ne: 'admin' } });

      const report = {
        title: 'Rapport de Présence',
        period: {
          start: format(startDate, 'dd MMMM yyyy', { locale: fr }),
          end: format(endDate, 'dd MMMM yyyy', { locale: fr }),
        },
        generatedAt: new Date(),
        summary: {
          totalEvents: events.length,
          totalUsers: users.length,
          averageAttendance: 0,
        },
        users: [],
        events: [],
      };

      // Analyse par utilisateur
      let totalAttendanceRate = 0;

      for (const user of users) {
        const userEvents = events.filter((event) =>
          event.participants.some(
            (p) => p.user._id.toString() === user._id.toString()
          )
        );

        const attendedEvents = userEvents.filter((event) => {
          const participation = event.participants.find(
            (p) => p.user._id.toString() === user._id.toString()
          );
          return participation && participation.status === 'attended';
        }).length;

        const attendanceRate =
          events.length > 0 ? (attendedEvents / events.length) * 100 : 0;
        totalAttendanceRate += attendanceRate;

        report.users.push({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          stats: {
            totalEvents: events.length,
            attendedEvents,
            missedEvents: events.length - attendedEvents,
            attendanceRate: Math.round(attendanceRate * 100) / 100,
          },
        });
      }

      report.summary.averageAttendance =
        users.length > 0
          ? Math.round((totalAttendanceRate / users.length) * 100) / 100
          : 0;

      // Analyse par événement
      for (const event of events) {
        const totalParticipants = event.participants.length;
        const attendees = event.participants.filter(
          (p) => p.status === 'attended'
        ).length;
        const attendanceRate =
          totalParticipants > 0 ? (attendees / totalParticipants) * 100 : 0;

        report.events.push({
          id: event._id,
          title: event.title,
          date: format(event.date, 'dd MMMM yyyy HH:mm', { locale: fr }),
          type: event.type,
          stats: {
            totalParticipants,
            attendees,
            absentees: totalParticipants - attendees,
            attendanceRate: Math.round(attendanceRate * 100) / 100,
          },
        });
      }

      return this.formatReport(report, reportFormat);
    } catch (error) {
      console.error('Erreur génération rapport présence:', error);
      throw error;
    }
  }

  // Générer un rapport de performance
  async generatePerformanceReport(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      userIds = null,
      format: reportFormat = 'json',
    } = options;

    try {
      const users = userIds
        ? await User.find({ _id: { $in: userIds } })
        : await User.find({ role: { $ne: 'admin' } });

      const report = {
        title: 'Rapport de Performance',
        period: {
          start: format(startDate, 'dd MMMM yyyy', { locale: fr }),
          end: format(endDate, 'dd MMMM yyyy', { locale: fr }),
        },
        generatedAt: new Date(),
        summary: {
          totalUsers: users.length,
          averageScore: 0,
          topPerformers: [],
          improvementNeeded: [],
        },
        users: [],
      };

      let totalScore = 0;

      for (const user of users) {
        const userStats = await this.getUserPerformanceStats(
          user._id,
          startDate,
          endDate
        );
        totalScore += userStats.overallScore;

        report.users.push({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          stats: userStats,
        });
      }

      report.summary.averageScore =
        users.length > 0
          ? Math.round((totalScore / users.length) * 100) / 100
          : 0;

      // Identifier les top performers et ceux ayant besoin d'amélioration
      const sortedUsers = report.users.sort(
        (a, b) => b.stats.overallScore - a.stats.overallScore
      );
      report.summary.topPerformers = sortedUsers.slice(0, 3).map((u) => ({
        name: u.name,
        score: u.stats.overallScore,
      }));

      report.summary.improvementNeeded = sortedUsers.slice(-3).map((u) => ({
        name: u.name,
        score: u.stats.overallScore,
        recommendations: this.getImprovementRecommendations(u.stats),
      }));

      return this.formatReport(report, reportFormat);
    } catch (error) {
      console.error('Erreur génération rapport performance:', error);
      throw error;
    }
  }

  // Générer un rapport d'événements
  async generateEventsReport(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      eventTypes = null,
      format: reportFormat = 'json',
    } = options;

    try {
      const query = {
        date: { $gte: startDate, $lte: endDate },
      };

      if (eventTypes) {
        query.type = { $in: eventTypes };
      }

      const events = await Event.find(query).populate('participants.user');

      const report = {
        title: "Rapport d'Événements",
        period: {
          start: format(startDate, 'dd MMMM yyyy', { locale: fr }),
          end: format(endDate, 'dd MMMM yyyy', { locale: fr }),
        },
        generatedAt: new Date(),
        summary: {
          totalEvents: events.length,
          byType: {},
          byStatus: {},
          averageParticipation: 0,
        },
        events: [],
      };

      let totalParticipation = 0;

      for (const event of events) {
        const participationRate =
          event.participants.length > 0
            ? (event.participants.filter((p) => p.status === 'attended')
                .length /
                event.participants.length) *
              100
            : 0;

        totalParticipation += participationRate;

        // Statistiques par type
        report.summary.byType[event.type] =
          (report.summary.byType[event.type] || 0) + 1;

        // Statistiques par statut
        report.summary.byStatus[event.status] =
          (report.summary.byStatus[event.status] || 0) + 1;

        report.events.push({
          id: event._id,
          title: event.title,
          description: event.description,
          date: format(event.date, 'dd MMMM yyyy HH:mm', { locale: fr }),
          type: event.type,
          status: event.status,
          stats: {
            totalParticipants: event.participants.length,
            attendees: event.participants.filter((p) => p.status === 'attended')
              .length,
            participationRate: Math.round(participationRate * 100) / 100,
          },
        });
      }

      report.summary.averageParticipation =
        events.length > 0
          ? Math.round((totalParticipation / events.length) * 100) / 100
          : 0;

      return this.formatReport(report, reportFormat);
    } catch (error) {
      console.error('Erreur génération rapport événements:', error);
      throw error;
    }
  }

  // Générer un rapport d'entraînement
  async generateTrainingReport(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      userIds = null,
      format: reportFormat = 'json',
    } = options;

    try {
      const query = {
        createdAt: { $gte: startDate, $lte: endDate },
      };

      if (userIds) {
        query.user = { $in: userIds };
      }

      const sessionNotes = await SessionNote.find(query).populate('user');
      const users = userIds
        ? await User.find({ _id: { $in: userIds } })
        : await User.find({ role: { $ne: 'admin' } });

      const report = {
        title: "Rapport d'Entraînement",
        period: {
          start: format(startDate, 'dd MMMM yyyy', { locale: fr }),
          end: format(endDate, 'dd MMMM yyyy', { locale: fr }),
        },
        generatedAt: new Date(),
        summary: {
          totalSessions: sessionNotes.length,
          totalUsers: users.length,
          averageScore: 0,
          completedHomework: 0,
          totalHomework: 0,
        },
        users: [],
        sessions: [],
      };

      let totalScore = 0;
      let totalHomework = 0;
      let completedHomework = 0;

      // Analyse par utilisateur
      for (const user of users) {
        const userSessions = sessionNotes.filter(
          (note) => note.user._id.toString() === user._id.toString()
        );

        const userScores = userSessions.map((s) => s.score || 0);
        const averageScore =
          userScores.length > 0
            ? userScores.reduce((a, b) => a + b, 0) / userScores.length
            : 0;

        const userHomework = userSessions.filter(
          (s) => s.homework && s.homework.length > 0
        );
        const userCompletedHomework = userHomework.filter(
          (s) => s.homeworkCompleted
        );

        totalScore += averageScore;
        totalHomework += userHomework.length;
        completedHomework += userCompletedHomework.length;

        report.users.push({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          stats: {
            totalSessions: userSessions.length,
            averageScore: Math.round(averageScore * 100) / 100,
            homeworkAssigned: userHomework.length,
            homeworkCompleted: userCompletedHomework.length,
            homeworkCompletionRate:
              userHomework.length > 0
                ? Math.round(
                    (userCompletedHomework.length / userHomework.length) * 100
                  )
                : 0,
          },
        });
      }

      report.summary.averageScore =
        users.length > 0
          ? Math.round((totalScore / users.length) * 100) / 100
          : 0;
      report.summary.totalHomework = totalHomework;
      report.summary.completedHomework = completedHomework;

      // Analyse par session
      for (const session of sessionNotes) {
        report.sessions.push({
          id: session._id,
          user: session.user.name,
          date: format(session.createdAt, 'dd MMMM yyyy HH:mm', { locale: fr }),
          score: session.score || 0,
          duration: session.duration || 0,
          improvements: session.improvements || '',
          homework: session.homework || '',
          homeworkCompleted: session.homeworkCompleted || false,
        });
      }

      return this.formatReport(report, reportFormat);
    } catch (error) {
      console.error('Erreur génération rapport entraînement:', error);
      throw error;
    }
  }

  // Générer un rapport complet
  async generateComprehensiveReport(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      format: reportFormat = 'json',
    } = options;

    try {
      const [
        attendanceReport,
        performanceReport,
        eventsReport,
        trainingReport,
      ] = await Promise.all([
        this.generateAttendanceReport({ startDate, endDate, format: 'json' }),
        this.generatePerformanceReport({ startDate, endDate, format: 'json' }),
        this.generateEventsReport({ startDate, endDate, format: 'json' }),
        this.generateTrainingReport({ startDate, endDate, format: 'json' }),
      ]);

      const report = {
        title: "Rapport Complet de l'Équipe",
        period: {
          start: format(startDate, 'dd MMMM yyyy', { locale: fr }),
          end: format(endDate, 'dd MMMM yyyy', { locale: fr }),
        },
        generatedAt: new Date(),
        summary: {
          totalUsers: attendanceReport.summary.totalUsers,
          totalEvents: eventsReport.summary.totalEvents,
          averageAttendance: attendanceReport.summary.averageAttendance,
          averagePerformance: performanceReport.summary.averageScore,
          trainingScore: trainingReport.summary.averageScore,
        },
        sections: {
          attendance: attendanceReport,
          performance: performanceReport,
          events: eventsReport,
          training: trainingReport,
        },
        insights: this.generateInsights({
          attendanceReport,
          performanceReport,
          eventsReport,
          trainingReport,
        }),
      };

      return this.formatReport(report, reportFormat);
    } catch (error) {
      console.error('Erreur génération rapport complet:', error);
      throw error;
    }
  }

  // Obtenir les statistiques de performance d'un utilisateur
  async getUserPerformanceStats(userId, startDate, endDate) {
    try {
      const [events, sessions] = await Promise.all([
        Event.find({
          date: { $gte: startDate, $lte: endDate },
          'participants.user': userId,
        }),
        SessionNote.find({
          user: userId,
          createdAt: { $gte: startDate, $lte: endDate },
        }),
      ]);

      const attendedEvents = events.filter((event) => {
        const participation = event.participants.find(
          (p) => p.user.toString() === userId.toString()
        );
        return participation && participation.status === 'attended';
      }).length;

      const attendanceRate =
        events.length > 0 ? (attendedEvents / events.length) * 100 : 0;

      const scores = sessions.map((s) => s.score || 0);
      const averageScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

      const homeworkSessions = sessions.filter(
        (s) => s.homework && s.homework.length > 0
      );
      const completedHomework = homeworkSessions.filter(
        (s) => s.homeworkCompleted
      ).length;
      const homeworkCompletionRate =
        homeworkSessions.length > 0
          ? (completedHomework / homeworkSessions.length) * 100
          : 0;

      // Score global combiné
      const overallScore =
        attendanceRate * 0.4 +
        averageScore * 0.4 +
        homeworkCompletionRate * 0.2;

      return {
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        homeworkCompletionRate: Math.round(homeworkCompletionRate * 100) / 100,
        overallScore: Math.round(overallScore * 100) / 100,
        totalEvents: events.length,
        attendedEvents,
        totalSessions: sessions.length,
        totalHomework: homeworkSessions.length,
        completedHomework,
      };
    } catch (error) {
      console.error('Erreur stats utilisateur:', error);
      throw error;
    }
  }

  // Générer des recommandations d'amélioration
  getImprovementRecommendations(stats) {
    const recommendations = [];

    if (stats.attendanceRate < 70) {
      recommendations.push(
        'Améliorer la régularité de présence aux événements'
      );
    }

    if (stats.averageScore < 60) {
      recommendations.push('Travailler sur les compétences techniques');
    }

    if (stats.homeworkCompletionRate < 80) {
      recommendations.push('Être plus assidu dans la réalisation des devoirs');
    }

    if (stats.totalSessions < 5) {
      recommendations.push(
        "Participer plus activement aux sessions d'entraînement"
      );
    }

    return recommendations;
  }

  // Générer des insights à partir des rapports
  generateInsights(reports) {
    const insights = [];

    // Insight sur la présence
    if (reports.attendanceReport.summary.averageAttendance < 70) {
      insights.push({
        type: 'warning',
        title: 'Présence préoccupante',
        message:
          "Le taux de présence moyen est en dessous de 70%. Considérez des mesures pour améliorer l'engagement.",
      });
    }

    // Insight sur la performance
    if (reports.performanceReport.summary.averageScore > 80) {
      insights.push({
        type: 'success',
        title: 'Excellente performance',
        message:
          "L'équipe maintient un niveau de performance élevé avec un score moyen supérieur à 80%.",
      });
    }

    // Insight sur les événements
    const eventsByType = reports.eventsReport.summary.byType;
    const mostFrequentType = Object.keys(eventsByType).reduce((a, b) =>
      eventsByType[a] > eventsByType[b] ? a : b
    );

    insights.push({
      type: 'info',
      title: "Type d'événement dominant",
      message: `Les événements de type "${mostFrequentType}" représentent la majorité des activités.`,
    });

    return insights;
  }

  // Formater le rapport selon le format demandé
  formatReport(report, format) {
    switch (format) {
      case 'json':
        return report;

      case 'csv':
        return this.convertToCSV(report);

      case 'pdf':
        return this.convertToPDF(report);

      case 'html':
        return this.convertToHTML(report);

      default:
        return report;
    }
  }

  // Convertir en CSV (implémentation simplifiée)
  convertToCSV(report) {
    // Implémentation basique - à améliorer selon les besoins
    return JSON.stringify(report);
  }

  // Convertir en PDF (implémentation future)
  convertToPDF(report) {
    // Nécessiterait une bibliothèque comme puppeteer ou jsPDF
    return report;
  }

  // Convertir en HTML (implémentation future)
  convertToHTML(report) {
    // Génération HTML basique
    return `
        <html>
            <head>
                <title>${report.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background: #f0f0f0; padding: 20px; }
                    .summary { background: #e8f4f8; padding: 15px; margin: 20px 0; }
                    .section { margin: 20px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${report.title}</h1>
                    <p>Période: ${report.period.start} - ${
      report.period.end
    }</p>
                    <p>Généré le: ${format(
                      report.generatedAt,
                      'dd MMMM yyyy à HH:mm',
                      { locale: fr }
                    )}</p>
                </div>
                <div class="summary">
                    <h2>Résumé</h2>
                    <pre>${JSON.stringify(report.summary, null, 2)}</pre>
                </div>
            </body>
        </html>
        `;
  }

  // Obtenir les types de rapports disponibles
  getAvailableReportTypes() {
    return this.reportTypes;
  }

  // Planifier des rapports automatiques
  async scheduleAutomaticReports() {
    // Implémentation future avec cron jobs
    console.log('Planification des rapports automatiques...');
  }
}

module.exports = new ReportingService();
