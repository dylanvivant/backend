// ========================================
// NOTIFICATION SERVICE
// src/services/notificationService.js
// ========================================
const { User, Event, EventParticipant } = require('../models');
const emailService = require('./emailService');
const integrationService = require('./integrationService');
const cacheService = require('./cacheService');

class NotificationService {
  constructor() {
    this.notifications = new Map();
    this.templates = {
      event_reminder: {
        subject: 'Rappel événement: {eventTitle}',
        body: `Bonjour {userName},

Un rappel concernant l'événement "{eventTitle}" prévu le {eventDate} à {eventTime}.

Description: {eventDescription}

Merci de confirmer votre présence si ce n'est pas déjà fait.

L'équipe {teamName}`,
      },
      event_created: {
        subject: 'Nouvel événement: {eventTitle}',
        body: `Bonjour {userName},

Un nouvel événement "{eventTitle}" a été programmé pour le {eventDate} à {eventTime}.

Description: {eventDescription}

Inscrivez-vous dès maintenant !

L'équipe {teamName}`,
      },
      event_updated: {
        subject: 'Événement modifié: {eventTitle}',
        body: `Bonjour {userName},

L'événement "{eventTitle}" a été modifié.

Nouvelle date: {eventDate} à {eventTime}
Description: {eventDescription}

Veuillez vérifier les détails.

L'équipe {teamName}`,
      },
      event_cancelled: {
        subject: 'Événement annulé: {eventTitle}',
        body: `Bonjour {userName},

L'événement "{eventTitle}" prévu le {eventDate} a été annulé.

Raison: {cancellationReason}

Nous vous tiendrons informé des prochains événements.

L'équipe {teamName}`,
      },
      homework_assigned: {
        subject: 'Nouveau devoir assigné',
        body: `Bonjour {userName},

Un nouveau devoir vous a été assigné.

Titre: {homeworkTitle}
Description: {homeworkDescription}
Date limite: {dueDate}

Bon travail !

L'équipe {teamName}`,
      },
      homework_reminder: {
        subject: 'Rappel devoir: {homeworkTitle}',
        body: `Bonjour {userName},

Rappel concernant le devoir "{homeworkTitle}" qui doit être rendu le {dueDate}.

N'oubliez pas de le compléter !

L'équipe {teamName}`,
      },
      role_assigned: {
        subject: 'Nouveau rôle assigné',
        body: `Bonjour {userName},

Félicitations ! Vous avez été assigné au rôle de "{roleName}".

Nouvelles permissions:
{permissions}

Bienvenue dans votre nouveau rôle !

L'équipe {teamName}`,
      },
      performance_report: {
        subject: 'Rapport de performance',
        body: `Bonjour {userName},

Voici votre rapport de performance pour la période {period}:

- Taux de présence: {attendanceRate}%
- Devoirs complétés: {homeworkCompletion}%
- Note moyenne: {averageScore}

Continuez vos efforts !

L'équipe {teamName}`,
      },
    };
  }

  // Envoyer une notification
  async sendNotification(type, recipients, data, channels = ['email']) {
    try {
      const template = this.templates[type];
      if (!template) {
        throw new Error(`Template de notification non trouvé: ${type}`);
      }

      const results = [];

      for (const recipient of recipients) {
        const personalizedData = { ...data, userName: recipient.name };
        const subject = this.replaceTemplateVariables(
          template.subject,
          personalizedData
        );
        const body = this.replaceTemplateVariables(
          template.body,
          personalizedData
        );

        const notificationId = this.generateNotificationId();
        const notification = {
          id: notificationId,
          type,
          recipient: recipient.id,
          subject,
          body,
          channels,
          status: 'pending',
          createdAt: new Date(),
          sentAt: null,
          deliveredAt: null,
        };

        this.notifications.set(notificationId, notification);

        // Envoyer via les canaux spécifiés
        const channelResults = await Promise.allSettled(
          channels.map((channel) =>
            this.sendViaChannel(channel, recipient, subject, body, data)
          )
        );

        const successfulChannels = channelResults
          .filter((result) => result.status === 'fulfilled')
          .map((result, index) => channels[index]);

        notification.status = successfulChannels.length > 0 ? 'sent' : 'failed';
        notification.sentAt = new Date();
        notification.successfulChannels = successfulChannels;

        results.push({
          recipient: recipient.id,
          notificationId,
          success: successfulChannels.length > 0,
          channels: successfulChannels,
        });
      }

      return results;
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      throw error;
    }
  }

  // Envoyer via un canal spécifique
  async sendViaChannel(channel, recipient, subject, body, data) {
    console.log(
      `📧 sendViaChannel - canal: ${channel}, destinataire:`,
      recipient.email
    );

    switch (channel) {
      case 'email':
        try {
          // Utiliser la méthode correcte du service d'email
          const result = await emailService.sendEventInvitation(
            recipient.email,
            recipient.name,
            data.eventTitle || 'Événement',
            data.eventDate || new Date(),
            data.eventType || 'Session'
          );
          console.log('📧 Email envoyé avec succès à:', recipient.email);
          return { success: true, result };
        } catch (error) {
          console.error('📧 Erreur envoi email à', recipient.email, ':', error);
          return { success: false, error: error.message };
        }

      case 'discord':
        if (recipient.discordId) {
          return await integrationService.sendDiscordMessage(
            recipient.discordId,
            body
          );
        }
        break;

      case 'slack':
        if (recipient.slackId) {
          return await integrationService.sendSlackMessage(
            recipient.slackId,
            body
          );
        }
        break;

      case 'push':
        // Implémentation future pour les notifications push
        return {
          success: false,
          message: 'Push notifications not implemented yet',
        };

      case 'sms':
        // Implémentation future pour les SMS
        return {
          success: false,
          message: 'SMS notifications not implemented yet',
        };

      default:
        throw new Error(`Canal de notification non supporté: ${channel}`);
    }
  }

  // Envoyer des notifications pour un événement
  async sendEventNotifications(eventId, type, additionalData = {}) {
    try {
      const event = await Event.findById(eventId).populate('event_types');
      if (!event) {
        throw new Error('Événement non trouvé');
      }

      const participants = await EventParticipant.findByEventId(eventId);
      const recipients = participants.map((p) => ({
        id: p.user_id,
        name: p.users?.pseudo || 'Utilisateur',
        email: p.users?.email,
        discordId: p.users?.discord_id,
        slackId: p.users?.slack_id,
      }));

      const eventData = {
        eventTitle: event.title,
        eventDate: new Date(event.start_time).toLocaleDateString('fr-FR'),
        eventTime: new Date(event.start_time).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        eventDescription: event.description || 'Aucune description',
        teamName: 'S4V Team',
        ...additionalData,
      };

      return await this.sendNotification(type, recipients, eventData);
    } catch (error) {
      console.error('Erreur envoi notifications événement:', error);
      throw error;
    }
  }

  // Envoyer des invitations pour un événement
  async sendEventInvitations(eventId, participantIds = []) {
    try {
      console.log(
        '📧 sendEventInvitations - eventId:',
        eventId,
        'participantIds:',
        participantIds
      );

      // Récupérer l'événement avec Supabase (pas de .populate())
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Événement non trouvé');
      }

      console.log('📧 Event found:', event);

      // Récupérer les informations des participants directement via User.getEmailsByIds
      if (participantIds.length === 0) {
        console.log(
          "📧 Aucun participant spécifié, pas d'envoi de notifications"
        );
        return [];
      }

      const recipients = await User.getEmailsByIds(participantIds);
      console.log('📧 Recipients found:', recipients);

      if (!recipients || recipients.length === 0) {
        console.log('📧 Aucun destinataire trouvé');
        return [];
      }

      // Mapper vers le format attendu par sendNotification
      const formattedRecipients = recipients.map((user) => ({
        id: user.id,
        name: user.pseudo || 'Utilisateur',
        email: user.email,
        discordId: user.discord_id,
        slackId: user.slack_id,
      }));

      const eventData = {
        eventTitle: event.title,
        eventDate: new Date(event.start_time).toLocaleDateString('fr-FR'),
        eventTime: new Date(event.start_time).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        eventDescription: event.description || 'Aucune description',
        teamName: 'S4V Team',
        eventType: 'Événement', // Simplifier pour éviter les problèmes de relations
      };

      console.log(
        '📧 Sending notifications to:',
        formattedRecipients.length,
        'recipients'
      );
      return await this.sendNotification(
        'event_created',
        formattedRecipients,
        eventData
      );
    } catch (error) {
      console.error('Erreur envoi invitations événement:', error);
      throw error;
    }
  }

  // Rappels automatiques
  async sendEventReminders(reminderTime = 24) {
    try {
      const reminderDate = new Date();
      reminderDate.setHours(reminderDate.getHours() + reminderTime);

      const upcomingEvents = await Event.find({
        date: {
          $gte: new Date(),
          $lte: reminderDate,
        },
        status: 'confirmed',
      });

      const results = [];

      for (const event of upcomingEvents) {
        const cacheKey = `reminder_sent:${event._id}`;
        const alreadySent = cacheService.get(cacheKey);

        if (!alreadySent) {
          const result = await this.sendEventNotifications(
            event._id,
            'event_reminder'
          );
          results.push({ eventId: event._id, result });

          // Marquer comme envoyé pour éviter les doublons
          cacheService.set(cacheKey, true, 24 * 60 * 60 * 1000); // 24h
        }
      }

      return results;
    } catch (error) {
      console.error('Erreur rappels événements:', error);
      throw error;
    }
  }

  // Notifications de performance
  async sendPerformanceReports(period = 'monthly') {
    try {
      const users = await User.find({ role: { $ne: 'admin' } });
      const results = [];

      for (const user of users) {
        const stats = await this.getUserPerformanceStats(user._id, period);

        const data = {
          userName: user.name,
          period: this.formatPeriod(period),
          attendanceRate: stats.attendanceRate,
          homeworkCompletion: stats.homeworkCompletion,
          averageScore: stats.averageScore,
          teamName: 'Team S4V',
        };

        const result = await this.sendNotification(
          'performance_report',
          [user],
          data
        );
        results.push({ userId: user._id, result });
      }

      return results;
    } catch (error) {
      console.error('Erreur rapports performance:', error);
      throw error;
    }
  }

  // Obtenir l'historique des notifications
  async getNotificationHistory(userId, limit = 50) {
    const userNotifications = Array.from(this.notifications.values())
      .filter((notification) => notification.recipient === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    return userNotifications;
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.readAt = new Date();
      notification.status = 'read';
      return true;
    }
    return false;
  }

  // Obtenir les statistiques de notifications
  async getNotificationStats(period = 'monthly') {
    const notifications = Array.from(this.notifications.values());
    const periodStart = this.getPeriodStart(period);

    const periodNotifications = notifications.filter(
      (n) => n.createdAt >= periodStart
    );

    const stats = {
      total: periodNotifications.length,
      sent: periodNotifications.filter((n) => n.status === 'sent').length,
      failed: periodNotifications.filter((n) => n.status === 'failed').length,
      read: periodNotifications.filter((n) => n.status === 'read').length,
      byType: {},
      byChannel: {},
    };

    // Statistiques par type
    periodNotifications.forEach((notification) => {
      stats.byType[notification.type] =
        (stats.byType[notification.type] || 0) + 1;
    });

    // Statistiques par canal
    periodNotifications.forEach((notification) => {
      notification.channels.forEach((channel) => {
        stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
      });
    });

    return stats;
  }

  // Méthodes utilitaires
  replaceTemplateVariables(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatPeriod(period) {
    const periods = {
      daily: 'journalière',
      weekly: 'hebdomadaire',
      monthly: 'mensuelle',
      quarterly: 'trimestrielle',
      yearly: 'annuelle',
    };
    return periods[period] || period;
  }

  getPeriodStart(period) {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return weekStart;
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarterly':
        const quarterStart = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1
        );
        return quarterStart;
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  async getUserPerformanceStats(userId, period) {
    // Implémentation simplifiée - à adapter selon vos besoins
    return {
      attendanceRate: 85,
      homeworkCompletion: 92,
      averageScore: 78,
    };
  }
}

module.exports = new NotificationService();
