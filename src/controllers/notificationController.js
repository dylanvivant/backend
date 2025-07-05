const { supabase } = require('../config/supabase');
const { AppError, successResponse } = require('../utils/helpers');
const emailService = require('../services/emailService');
const integrationService = require('../services/integrationService');
const cacheService = require('../services/cacheService');

/**
 * Récupérer les notifications d'un utilisateur basées sur les invitations et participations
 */
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const cacheKey = `notifications:${userId}:${page}:${limit}:${unread_only}`;
    const cached = cacheService.get(cacheKey);

    if (cached) {
      return res.json(successResponse(cached));
    }

    const notifications = [];

    // 1. Récupérer les invitations pendantes (notifications non lues)
    const { data: invitations, error: invitationsError } = await supabase
      .from('event_invitations')
      .select(`
        *,
        events(
          id,
          title,
          description,
          start_time,
          end_time,
          event_types(name),
          users!events_created_by_fkey(pseudo)
        ),
        invited_by_user:users!event_invitations_invited_by_fkey(pseudo)
      `)
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (invitationsError) {
      console.error('Erreur récupération invitations:', invitationsError);
    } else if (invitations && invitations.length > 0) {
      // Transformer les invitations en notifications
      invitations.forEach(invitation => {
        const event = invitation.events;
        if (!event) return;

        let title = '';
        let content = '';
        let type = 'invitation';
        let isRead = false;

        switch (invitation.status) {
          case 'pending':
            title = `Invitation à ${event.title}`;
            content = `Vous avez été invité(e) à participer à l'événement "${event.title}" le ${new Date(event.start_time).toLocaleDateString('fr-FR')}`;
            isRead = false;
            break;
          case 'accepted':
            title = `Invitation acceptée`;
            content = `Vous avez accepté l'invitation à "${event.title}"`;
            isRead = true;
            break;
          case 'declined':
            title = `Invitation refusée`;
            content = `Vous avez refusé l'invitation à "${event.title}"`;
            isRead = true;
            break;
          case 'expired':
            title = `Invitation expirée`;
            content = `L'invitation à "${event.title}" a expiré`;
            isRead = true;
            break;
        }

        notifications.push({
          id: `invitation-${invitation.id}`,
          title,
          content,
          type,
          is_read: isRead,
          event_id: event.id,
          created_at: invitation.sent_at,
          updated_at: invitation.sent_at,
          priority: invitation.status === 'pending' ? 'high' : 'medium',
          metadata: {
            invitation_id: invitation.id,
            event_title: event.title,
            event_start_time: event.start_time,
            event_type: event.event_types?.name,
            status: invitation.status,
            invited_by: invitation.invited_by_user?.pseudo
          }
        });
      });
    }

    // 2. Si aucune invitation trouvée, ajouter une notification de bienvenue
    if (notifications.length === 0) {
      notifications.push({
        id: `welcome-${userId}`,
        title: 'Bienvenue dans S4V Team !',
        content: 'Votre compte a été créé avec succès. Vous recevrez ici vos invitations aux événements et autres notifications importantes.',
        type: 'info',
        is_read: false,
        event_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        priority: 'medium',
        metadata: {
          system: true,
          category: 'welcome'
        }
      });
    }

    // Filtrer si on ne veut que les non lues
    const filteredNotifications = unread_only === 'true' 
      ? notifications.filter(n => !n.is_read)
      : notifications;

    // Compter les notifications non lues
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const result = {
      notifications: filteredNotifications,
      unread_count: unreadCount,
      total_count: notifications.length,
    };

    // Mettre en cache pour 1 minute
    cacheService.set(cacheKey, result, 60);
    res.json(successResponse(result));

  } catch (error) {
    console.error('Erreur getUserNotifications:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des notifications',
    });
  }
};

/**
 * Obtenir le nombre de notifications non lues
 */
const getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Compter les invitations pendantes
    const { count: invitationsCount, error: invitationsError } = await supabase
      .from('event_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (invitationsError) {
      console.error('Erreur comptage invitations:', invitationsError);
    }

    const count = invitationsCount || 0;

    res.json(successResponse({ count }));
  } catch (error) {
    console.error('Erreur getUnreadNotificationsCount:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors du comptage des notifications',
    });
  }
};

/**
 * Marquer une notification comme lue
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Pour les notifications système, juste retourner succès
    if (id.startsWith('welcome-') || id.startsWith('system-')) {
      // Invalider le cache
      cacheService.invalidateUserPattern(`notifications:${userId}`);
      return res.json(successResponse(null, 'Notification marquée comme lue'));
    }

    // Analyser l'ID pour déterminer le type
    if (id.startsWith('invitation-')) {
      const invitationId = id.replace('invitation-', '');
      
      // Marquer l'invitation comme lue
      const { error } = await supabase
        .from('event_invitations')
        .update({ 
          last_reminder_sent: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('user_id', userId);

      if (error) {
        throw new AppError(`Erreur lors de la mise à jour: ${error.message}`, 400);
      }
    }

    // Invalider le cache
    cacheService.invalidateUserPattern(`notifications:${userId}`);

    res.json(successResponse(null, 'Notification marquée comme lue'));
  } catch (error) {
    console.error('Erreur markAsRead:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de la notification',
    });
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date().toISOString();

    // Marquer toutes les invitations pendantes comme lues
    const { error } = await supabase
      .from('event_invitations')
      .update({ 
        last_reminder_sent: now
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Erreur mise à jour invitations:', error);
    }

    // Invalider le cache
    cacheService.invalidateUserPattern(`notifications:${userId}`);

    res.json(successResponse(null, 'Toutes les notifications marquées comme lues'));
  } catch (error) {
    console.error('Erreur markAllAsRead:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour des notifications',
    });
  }
};

/**
 * Supprimer une notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Les notifications système ne peuvent pas être supprimées
    if (id.startsWith('welcome-') || id.startsWith('system-')) {
      return res.json(successResponse(null, 'Notification système ne peut pas être supprimée'));
    }

    // Analyser l'ID pour déterminer le type
    if (id.startsWith('invitation-')) {
      const invitationId = id.replace('invitation-', '');
      
      // Supprimer l'invitation
      const { error } = await supabase
        .from('event_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('user_id', userId);

      if (error) {
        throw new AppError(`Erreur lors de la suppression: ${error.message}`, 400);
      }
    }

    // Invalider le cache
    cacheService.invalidateUserPattern(`notifications:${userId}`);

    res.json(successResponse(null, 'Notification supprimée avec succès'));
  } catch (error) {
    console.error('Erreur deleteNotification:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression de la notification',
    });
  }
};

/**
 * Créer une invitation à un événement
 */
const createEventInvitation = async (req, res) => {
  try {
    const { event_id, user_ids, expires_at, send_email = false } = req.body;
    const invitedBy = req.user.id;

    if (!event_id || !user_ids || !Array.isArray(user_ids)) {
      throw new AppError('Event ID et liste des utilisateurs requis', 400);
    }

    // Créer les invitations
    const invitations = user_ids.map(userId => ({
      event_id,
      user_id: userId,
      invited_by: invitedBy,
      status: 'pending',
      sent_at: new Date().toISOString(),
      expires_at: expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    const { data, error } = await supabase
      .from('event_invitations')
      .insert(invitations)
      .select();

    if (error) {
      throw new AppError(`Erreur lors de la création des invitations: ${error.message}`, 400);
    }

    // Invalider le cache
    user_ids.forEach(userId => {
      cacheService.invalidateUserPattern(`notifications:${userId}`);
    });

    res.status(201).json(successResponse(data, `${data.length} invitations créées avec succès`));
  } catch (error) {
    console.error('Erreur createEventInvitation:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la création des invitations',
    });
  }
};

/**
 * Répondre à une invitation
 */
const respondToInvitation = async (req, res) => {
  try {
    const { invitation_id, status } = req.body;
    const userId = req.user.id;

    if (!invitation_id || !status || !['accepted', 'declined'].includes(status)) {
      throw new AppError('Invitation ID et statut (accepted/declined) requis', 400);
    }

    // Mettre à jour l'invitation
    const { data: invitation, error: updateError } = await supabase
      .from('event_invitations')
      .update({
        status,
        sent_at: new Date().toISOString()
      })
      .eq('id', invitation_id)
      .eq('user_id', userId)
      .select('*, events(title)')
      .single();

    if (updateError) {
      throw new AppError(`Erreur lors de la réponse: ${updateError.message}`, 400);
    }

    // Si accepté, créer une participation
    if (status === 'accepted') {
      const { error: participationError } = await supabase
        .from('event_participants')
        .insert({
          event_id: invitation.event_id,
          user_id: userId,
          status: 'confirmed',
          invited_by: invitation.invited_by,
          invited_at: invitation.sent_at,
          responded_at: new Date().toISOString()
        });

      if (participationError) {
        console.error('Erreur création participation:', participationError);
      }
    }

    // Invalider le cache
    cacheService.invalidateUserPattern(`notifications:${userId}`);

    const message = status === 'accepted' ? 'Invitation acceptée' : 'Invitation refusée';
    res.json(successResponse(invitation, message));
  } catch (error) {
    console.error('Erreur respondToInvitation:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la réponse à l\'invitation',
    });
  }
};

/**
 * Obtenir les préférences de notification
 */
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const defaultPreferences = {
      user_id: userId,
      email_notifications: true,
      push_notifications: true,
      event_reminders: true,
      practice_notifications: true,
      match_notifications: true,
      system_notifications: true,
    };

    res.json(successResponse(defaultPreferences));
  } catch (error) {
    console.error('Erreur getUserPreferences:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des préférences',
    });
  }
};

/**
 * Mettre à jour les préférences de notification
 */
const updateUserPreferences = async (req, res) => {
  try {
    const preferences = req.body;
    res.json(successResponse(preferences, 'Préférences mises à jour avec succès'));
  } catch (error) {
    console.error('Erreur updateUserPreferences:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour des préférences',
    });
  }
};

/**
 * Obtenir les statistiques de notification
 */
const getNotificationStats = async (req, res) => {
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

    // Statistiques basées sur les invitations
    const { data: invitations, error } = await supabase
      .from('event_invitations')
      .select('status, sent_at')
      .eq('user_id', userId)
      .gte('sent_at', startDate.toISOString());

    if (error) {
      console.error('Erreur récupération stats:', error);
    }

    const stats = {
      total: invitations?.length || 0,
      pending: invitations?.filter(i => i.status === 'pending').length || 0,
      accepted: invitations?.filter(i => i.status === 'accepted').length || 0,
      declined: invitations?.filter(i => i.status === 'declined').length || 0,
      expired: invitations?.filter(i => i.status === 'expired').length || 0,
    };

    res.json(successResponse(stats));
  } catch (error) {
    console.error('Erreur getNotificationStats:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des statistiques',
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadNotificationsCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createEventInvitation,
  respondToInvitation,
  getUserPreferences,
  updateUserPreferences,
  getNotificationStats,
};
