// ========================================
// EVENTS CONTROLLER
// src/controllers/eventsController.js
// ========================================
const { Event, EventParticipant, SessionNote, User } = require('../models');
const emailService = require('../services/emailService');

class EventsController {
  // Obtenir tous les événements (avec filtres)
  async getAllEvents(req, res) {
    try {
      const { type_id, upcoming = 'false', page = 1, limit = 10 } = req.query;

      const events = await Event.getAllEvents({
        type_id,
        upcoming: upcoming === 'true',
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error('Erreur récupération événements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des événements',
      });
    }
  }

  // Obtenir un événement par ID
  async getEventById(req, res) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé',
        });
      }

      res.json({
        success: true,
        data: { event },
      });
    } catch (error) {
      console.error('Erreur récupération événement:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de l'événement",
      });
    }
  }

  // Créer un événement
  async createEvent(req, res) {
    try {
      const { participant_ids, ...eventData } = req.body;

      // Données de base de l'événement
      const completeEventData = {
        ...eventData,
        created_by: req.user.id,
      };

      let participantIdsToInvite = [];

      // Logique d'invitation selon le type d'événement
      if (eventData.event_type_id === 1) {
        // Type 1: Invitation automatique de tous les joueurs actifs
        if (participant_ids && participant_ids.length > 0) {
          // Si des participants sont spécifiés, les utiliser
          participantIdsToInvite = participant_ids;
        } else {
          // Sinon, inviter automatiquement tous les joueurs actifs
          const activeUsers = await User.getActiveTeamMembers();
          participantIdsToInvite = activeUsers.map((user) => user.id);
        }
      } else {
        // Autres types: Sélection manuelle uniquement
        if (participant_ids && participant_ids.length > 0) {
          participantIdsToInvite = participant_ids;
        }
      }

      // Créer l'événement avec les participants
      const event = await Event.createEventWithParticipants(
        completeEventData,
        participantIdsToInvite
      );

      // Envoyer les notifications d'invitation si des participants
      if (participantIdsToInvite.length > 0) {
        try {
          await this.sendEventInvitations(event, participantIdsToInvite);
        } catch (notificationError) {
          console.warn('Erreur envoi notifications:', notificationError);
          // Ne pas faire échouer la création si les notifications échouent
        }
      }

      res.status(201).json({
        success: true,
        message: 'Événement créé avec succès',
        data: {
          event,
          participants_invited: participantIdsToInvite.length,
        },
      });
    } catch (error) {
      console.error('Erreur création événement:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de l'événement",
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Mettre à jour un événement
  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Vérifier que l'utilisateur peut modifier cet événement
      const event = await Event.findById(id, 'created_by');
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé',
        });
      }

      // Seul le créateur ou un capitaine/coach peut modifier
      if (
        event.created_by !== req.user.id &&
        ![2, 3].includes(req.user.role_id)
      ) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour modifier cet événement',
        });
      }

      const updatedEvent = await Event.update(id, updates);

      res.json({
        success: true,
        message: 'Événement mis à jour avec succès',
        data: { event: updatedEvent },
      });
    } catch (error) {
      console.error('Erreur mise à jour événement:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de l'événement",
      });
    }
  }

  // Supprimer un événement
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;

      // Vérifier les permissions (même logique que update)
      const event = await Event.findById(id, 'created_by');
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé',
        });
      }

      if (
        event.created_by !== req.user.id &&
        ![2, 3].includes(req.user.role_id)
      ) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour supprimer cet événement',
        });
      }

      await Event.delete(id);

      res.json({
        success: true,
        message: 'Événement supprimé avec succès',
      });
    } catch (error) {
      console.error('Erreur suppression événement:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de l'événement",
      });
    }
  }

  // Inviter des utilisateurs à un événement
  async inviteUsers(req, res) {
    try {
      const { id } = req.params;
      const { user_ids } = req.body;

      const event = await Event.findById(id, 'title, start_time, created_by');
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé',
        });
      }

      // Créer les participations
      const participants = user_ids.map((userId) => ({
        event_id: id,
        user_id: userId,
        status: 'invited',
        invited_by: req.user.id,
      }));

      const { data, error } = await Event.supabase
        .from('event_participants')
        .upsert(participants, { onConflict: 'event_id,user_id' })
        .select();

      if (error) throw error;

      // Envoyer les invitations par email
      try {
        const userEmails = await User.getEmailsByIds(user_ids);
        console.log('Utilisateurs trouvés pour invitations:', userEmails);

        for (const user of userEmails) {
          console.log(`Envoi invitation à: ${user.email} (${user.pseudo})`);

          if (!user.email) {
            console.warn(
              `Email manquant pour l'utilisateur ${user.pseudo} (${user.id})`
            );
            continue;
          }

          await emailService.sendEventInvitation(
            user.email,
            user.pseudo,
            event.title,
            event.start_time,
            'entrainement' // type d'événement
          );
        }
      } catch (emailError) {
        console.error('Erreur envoi invitations:', emailError);
      }

      res.json({
        success: true,
        message: 'Invitations envoyées avec succès',
        data: { invitations: data },
      });
    } catch (error) {
      console.error('Erreur invitation utilisateurs:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi des invitations",
      });
    }
  }

  // Répondre à une invitation
  async respondToInvitation(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'accepted' ou 'declined'

      const response = await EventParticipant.respondToInvitation(
        id,
        req.user.id,
        status
      );

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Invitation non trouvée',
        });
      }

      res.json({
        success: true,
        message: `Invitation ${
          status === 'accepted' ? 'acceptée' : 'refusée'
        } avec succès`,
        data: { response },
      });
    } catch (error) {
      console.error('Erreur réponse invitation:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la réponse à l'invitation",
      });
    }
  }

  // Marquer les présences (pour capitaine/coach)
  async markAttendance(req, res) {
    try {
      const { id } = req.params;
      const { user_ids, is_present } = req.body;

      const attendanceData = await EventParticipant.markAttendance(
        id,
        user_ids,
        is_present
      );

      res.json({
        success: true,
        message: 'Présences mises à jour avec succès',
        data: { attendance: attendanceData },
      });
    } catch (error) {
      console.error('Erreur marquage présences:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage des présences',
      });
    }
  }

  // Obtenir les événements d'un utilisateur
  async getUserEvents(req, res) {
    try {
      const { upcoming = 'false' } = req.query;
      const userId = req.params.userId || req.user.id;

      const events = await Event.getUserEvents(userId, upcoming === 'true');

      res.json({
        success: true,
        data: { events },
      });
    } catch (error) {
      console.error('Erreur récupération événements utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des événements',
      });
    }
  }

  // Obtenir les types d'événements disponibles
  async getEventTypes(req, res) {
    try {
      const { data, error } = await Event.supabase
        .from('event_types')
        .select('*')
        .order('name');

      if (error) throw error;

      res.json({
        success: true,
        data: { eventTypes: data },
      });
    } catch (error) {
      console.error('Erreur récupération types événements:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des types d'événements",
      });
    }
  }

  // Méthode privée pour envoyer les invitations
  async sendEventInvitations(event, participantIds) {
    try {
      // Récupérer les informations des participants via le modèle User
      const userEmails = await User.getEmailsByIds(participantIds);
      console.log(
        'Utilisateurs trouvés pour invitations (méthode privée):',
        userEmails
      );

      // Envoyer les notifications d'invitation
      for (const participant of userEmails) {
        try {
          console.log(
            `Envoi invitation à: ${participant.email} (${participant.pseudo})`
          );

          if (!participant.email) {
            console.warn(
              `Email manquant pour l'utilisateur ${participant.pseudo} (${participant.id})`
            );
            continue;
          }

          await emailService.sendEventInvitation(
            participant.email,
            participant.pseudo,
            event.title,
            event.start_time,
            'entrainement' // type d'événement
          );
        } catch (emailError) {
          console.warn(
            `Erreur envoi email à ${participant.email}:`,
            emailError
          );
        }
      }
    } catch (error) {
      console.error('Erreur envoi invitations:', error);
      throw error;
    }
  }
}

module.exports = new EventsController();
