// ========================================
// PRACTICE REQUESTS CONTROLLER
// src/controllers/practiceRequestsController.js
// ========================================
const { PracticeRequest, User } = require('../models');
const emailService = require('../services/emailService');
const Event = require('../models/Event');

const eventModel = new Event();

class PracticeRequestsController {
  // Créer une demande de practice (formulaire public)
  async createRequest(req, res) {
    try {
      const requestData = req.body;

      const request = await PracticeRequest.create(requestData);

      res.status(201).json({
        success: true,
        message:
          'Demande de practice enregistrée avec succès. Nous vous recontacterons bientôt.',
        data: { request: { id: request.id, status: request.status } },
      });
    } catch (error) {
      console.error('Erreur création demande practice:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'enregistrement de la demande",
      });
    }
  }

  // Obtenir toutes les demandes (pour capitaines)
  async getAllRequests(req, res) {
    try {
      const { status = 'all' } = req.query;

      let query = PracticeRequest.supabase
        .from('practice_requests')
        .select(
          `
                    *,
                    users!practice_requests_handled_by_fkey(pseudo)
                `
        )
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: requests, error } = await query;
      if (error) throw error;

      res.json({
        success: true,
        data: {
          requests,
          total: requests.length,
        },
      });
    } catch (error) {
      console.error('Erreur récupération demandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes',
      });
    }
  }

  // Obtenir une demande spécifique
  async getRequestById(req, res) {
    try {
      const { id } = req.params;

      const request = await PracticeRequest.findById(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée',
        });
      }

      res.json({
        success: true,
        data: { request },
      });
    } catch (error) {
      console.error('Erreur récupération demande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la demande',
      });
    }
  }

  // Traiter une demande (accepter/refuser)
  async handleRequest(req, res) {
    try {
      const { id } = req.params;
      const { status, response } = req.body;

      const handledRequest = await PracticeRequest.handleRequest(
        id,
        req.user.id,
        status,
        response
      );

      if (!handledRequest) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée',
        });
      }

      // Envoi d'un mail au capitaine adverse
      try {
        await emailService.sendPracticeResponse(
          handledRequest.captain_email,
          status,
          response,
          handledRequest.team_name,
          handledRequest.requested_date
        );
      } catch (e) {
        console.error('Erreur envoi mail practice:', e);
      }

      // Création automatique d'un événement si accepté
      let createdEvent = null;
      if (status === 'accepted') {
        try {
          // Calculer la fin de l'événement basée sur la durée demandée
          const startTime = new Date(handledRequest.requested_date);
          const durationMinutes = handledRequest.duration_minutes || 120; // 2h par défaut
          const endTime = new Date(
            startTime.getTime() + durationMinutes * 60000
          );

          createdEvent = await eventModel.createEventWithParticipants({
            title: `Practice vs ${handledRequest.team_name}`,
            event_type_id: 4, // à adapter selon ta table event_types
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            description: `Practice acceptée avec l'équipe ${
              handledRequest.team_name
            }. ${handledRequest.message || ''}`,
            created_by: req.user.id,
            // opponent_team_id: null, // On ne peut pas créer une équipe adverse automatiquement
          });
        } catch (e) {
          console.error('Erreur création event auto:', e);
        }
      }

      res.json({
        success: true,
        message: `Demande ${
          status === 'accepted' ? 'acceptée' : 'refusée'
        } avec succès`,
        data: { request: handledRequest, event: createdEvent },
      });
    } catch (error) {
      console.error('Erreur traitement demande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement de la demande',
      });
    }
  }

  // Supprimer une demande
  async deleteRequest(req, res) {
    try {
      const { id } = req.params;

      const request = await PracticeRequest.findById(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée',
        });
      }

      await PracticeRequest.delete(id);

      res.json({
        success: true,
        message: 'Demande supprimée avec succès',
      });
    } catch (error) {
      console.error('Erreur suppression demande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la demande',
      });
    }
  }

  // Obtenir les statistiques des demandes
  async getRequestsStats(req, res) {
    try {
      const { data: requests, error } = await PracticeRequest.supabase
        .from('practice_requests')
        .select('status, created_at');

      if (error) throw error;

      const stats = {
        total: requests.length,
        pending: requests.filter((r) => r.status === 'pending').length,
        accepted: requests.filter((r) => r.status === 'accepted').length,
        declined: requests.filter((r) => r.status === 'declined').length,
        thisMonth: requests.filter((r) => {
          const requestDate = new Date(r.created_at);
          const now = new Date();
          return (
            requestDate.getMonth() === now.getMonth() &&
            requestDate.getFullYear() === now.getFullYear()
          );
        }).length,
      };

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error('Erreur statistiques demandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      });
    }
  }
}

module.exports = new PracticeRequestsController();
