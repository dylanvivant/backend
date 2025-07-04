const { supabase } = require('../config/supabase');
const { AppError, successResponse } = require('../utils/helpers');
const emailService = require('../services/emailService');
const integrationService = require('../services/integrationService');
const cacheService = require('../services/cacheService');

class NotificationController {
  /**
   * Créer une notification
   */
  async createNotification(req, res) {
    try {
      const {
        title,
        message,
        type,
        user_id,
        event_id,
        priority,
        send_email,
        send_push,
      } = req.body;

      const notificationData = {
        title,
        message,
        type,
        user_id,
        event_id,
        priority: priority || 'medium',
        send_email: send_email || false,
        send_push: send_push || false,
        created_by: req.user.id,
        is_read: false,
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la création de la notification: ${error.message}`,
          400
        );
      }

      // Envoyer les notifications selon les préférences
      await this.sendNotification(data);

      res
        .status(201)
        .json(successResponse(data, 'Notification créée avec succès'));
    } catch (error) {
      console.error('Erreur createNotification:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la création de la notification',
      });
    }
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getUserNotifications(req, res) {
    try {
      const { page = 1, limit = 20, unread_only = false } = req.query;
      const offset = (page - 1) * limit;
      const userId = req.user.id;

      const cacheKey = `notifications:${userId}:${page}:${limit}:${unread_only}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      let query = supabase
        .from('notifications')
        .select(
          `
          *,
          events (
            id,
            title,
            start_date
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unread_only === 'true') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération des notifications: ${error.message}`,
          400
        );
      }

      // Compter le nombre total de notifications non lues
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      const result = {
        notifications: data,
        unread_count: unreadCount,
        total_count: data.length,
      };

      // Mettre en cache
      cacheService.set(cacheKey, result, 60); // 1 minute

      res.json(successResponse(result));
    } catch (error) {
      console.error('Erreur getUserNotifications:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la récupération des notifications',
      });
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la mise à jour de la notification: ${error.message}`,
          400
        );
      }

      // Invalider le cache
      cacheService.invalidateUserPattern(`notifications:${userId}`);

      res.json(successResponse(data, 'Notification marquée comme lue'));
    } catch (error) {
      console.error('Erreur markAsRead:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la mise à jour de la notification',
      });
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) {
        throw new AppError(
          `Erreur lors de la mise à jour des notifications: ${error.message}`,
          400
        );
      }

      // Invalider le cache
      cacheService.invalidateUserPattern(`notifications:${userId}`);

      res.json(
        successResponse(
          data,
          `${data.length} notifications marquées comme lues`
        )
      );
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la mise à jour des notifications',
      });
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new AppError(
          `Erreur lors de la suppression de la notification: ${error.message}`,
          400
        );
      }

      // Invalider le cache
      cacheService.invalidateUserPattern(`notifications:${userId}`);

      res.json(successResponse(null, 'Notification supprimée avec succès'));
    } catch (error) {
      console.error('Erreur deleteNotification:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la suppression de la notification',
      });
    }
  }

  /**
   * Envoyer une notification de masse
   */
  async sendBulkNotification(req, res) {
    try {
      const {
        title,
        message,
        type,
        user_ids,
        event_id,
        priority,
        send_email,
        send_push,
      } = req.body;

      const notifications = user_ids.map((userId) => ({
        title,
        message,
        type,
        user_id: userId,
        event_id,
        priority: priority || 'medium',
        send_email: send_email || false,
        send_push: send_push || false,
        created_by: req.user.id,
        is_read: false,
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        throw new AppError(
          `Erreur lors de la création des notifications: ${error.message}`,
          400
        );
      }

      // Envoyer les notifications
      for (const notification of data) {
        await this.sendNotification(notification);
      }

      res
        .status(201)
        .json(
          successResponse(
            data,
            `${data.length} notifications envoyées avec succès`
          )
        );
    } catch (error) {
      console.error('Erreur sendBulkNotification:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erreur lors de l'envoi des notifications",
      });
    }
  }

  /**
   * Récupérer les préférences de notification d'un utilisateur
   */
  async getUserPreferences(req, res) {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new AppError(
          `Erreur lors de la récupération des préférences: ${error.message}`,
          400
        );
      }

      // Créer des préférences par défaut si elles n'existent pas
      if (!data) {
        const defaultPreferences = {
          user_id: userId,
          email_notifications: true,
          push_notifications: true,
          event_reminders: true,
          practice_notifications: true,
          match_notifications: true,
          system_notifications: true,
        };

        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert([defaultPreferences])
          .select()
          .single();

        if (insertError) {
          throw new AppError(
            `Erreur lors de la création des préférences: ${insertError.message}`,
            400
          );
        }

        return res.json(successResponse(newData));
      }

      res.json(successResponse(data));
    } catch (error) {
      console.error('Erreur getUserPreferences:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la récupération des préférences',
      });
    }
  }

  /**
   * Mettre à jour les préférences de notification
   */
  async updateUserPreferences(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la mise à jour des préférences: ${error.message}`,
          400
        );
      }

      res.json(successResponse(data, 'Préférences mises à jour avec succès'));
    } catch (error) {
      console.error('Erreur updateUserPreferences:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la mise à jour des préférences',
      });
    }
  }

  /**
   * Envoyer une notification selon les préférences
   */
  async sendNotification(notification) {
    try {
      // Récupérer les préférences utilisateur
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', notification.user_id)
        .single();

      // Récupérer les informations utilisateur
      const { data: user } = await supabase
        .from('users')
        .select('email, username')
        .eq('id', notification.user_id)
        .single();

      // Envoyer par email si activé
      if (
        notification.send_email &&
        preferences?.email_notifications &&
        user?.email
      ) {
        await emailService.sendNotificationEmail(
          user.email,
          notification.title,
          notification.message,
          notification.type
        );
      }

      // Envoyer via les intégrations (Discord, Slack, etc.)
      if (notification.priority === 'high') {
        try {
          await integrationService.sendDiscordMessage(
            `🚨 **${notification.title}**\n${notification.message}`
          );
        } catch (error) {
          console.error('Erreur envoi Discord:', error);
        }
      }

      // Envoyer push notification si activé
      if (notification.send_push && preferences?.push_notifications) {
        // Ici vous pourriez intégrer un service de push notifications
        // comme Firebase Cloud Messaging, OneSignal, etc.
        console.log('Push notification envoyée:', notification.title);
      }
    } catch (error) {
      console.error('Erreur sendNotification:', error);
    }
  }

  /**
   * Programmer une notification
   */
  async scheduleNotification(req, res) {
    try {
      const {
        title,
        message,
        type,
        user_id,
        event_id,
        scheduled_for,
        priority,
        send_email,
        send_push,
      } = req.body;

      const notificationData = {
        title,
        message,
        type,
        user_id,
        event_id,
        priority: priority || 'medium',
        send_email: send_email || false,
        send_push: send_push || false,
        scheduled_for,
        created_by: req.user.id,
        is_read: false,
        is_scheduled: true,
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la programmation de la notification: ${error.message}`,
          400
        );
      }

      res
        .status(201)
        .json(successResponse(data, 'Notification programmée avec succès'));
    } catch (error) {
      console.error('Erreur scheduleNotification:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la programmation de la notification',
      });
    }
  }

  /**
   * Traiter les notifications programmées
   */
  async processScheduledNotifications(req, res) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_scheduled', true)
        .lte('scheduled_for', now)
        .eq('is_sent', false);

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération des notifications programmées: ${error.message}`,
          400
        );
      }

      let processedCount = 0;

      for (const notification of data) {
        try {
          await this.sendNotification(notification);

          // Marquer comme envoyée
          await supabase
            .from('notifications')
            .update({ is_sent: true, sent_at: new Date().toISOString() })
            .eq('id', notification.id);

          processedCount++;
        } catch (error) {
          console.error('Erreur traitement notification:', error);
        }
      }

      res.json(
        successResponse(
          { processed: processedCount, total: data.length },
          `${processedCount} notifications traitées`
        )
      );
    } catch (error) {
      console.error('Erreur processScheduledNotifications:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors du traitement des notifications programmées',
      });
    }
  }

  /**
   * Obtenir les statistiques de notifications
   */
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = '7d' } = req.query;

      let startDate = new Date();
      switch (period) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération des statistiques: ${error.message}`,
          400
        );
      }

      const stats = {
        total: data.length,
        unread: data.filter((n) => !n.is_read).length,
        read: data.filter((n) => n.is_read).length,
        by_type: data.reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {}),
        by_date: data.reduce((acc, n) => {
          const date = new Date(n.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {}),
      };

      res.json(successResponse(stats));
    } catch (error) {
      console.error('Erreur getNotificationStats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la récupération des statistiques',
      });
    }
  }
}

module.exports = new NotificationController();
