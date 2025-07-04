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
      const eventData = {
        ...req.body,
        created_by: req.user.id,
      };

      const event = await Event.create(eventData);

      res.status(201).json({
        success: true,
        message: 'Événement créé avec succès',
        data: { event },
      });
    } catch (error) {
      console.error('Erreur création événement:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de l'événement",
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
        await emailService.sendEventInvitations(userEmails, event);
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
}

module.exports = new EventsController();
