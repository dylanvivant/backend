// ========================================
// SESSION NOTES CONTROLLER
// src/controllers/sessionNotesController.js
// ========================================
const { SessionNote, Event, User } = require('../models');

class SessionNotesController {
  // Créer une note de session
  async createNote(req, res) {
    try {
      const noteData = {
        ...req.body,
        user_id: req.user.id, // Qui écrit la note
      };

      // Vérifier que l'événement existe
      const event = await Event.findById(noteData.event_id, 'id, title');
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé',
        });
      }

      // Si c'est une note individuelle, vérifier que l'utilisateur cible existe
      if (noteData.target_user_id) {
        const targetUser = await User.findById(
          noteData.target_user_id,
          'id, pseudo'
        );
        if (!targetUser) {
          return res.status(404).json({
            success: false,
            message: 'Utilisateur cible non trouvé',
          });
        }
      }

      const note = await SessionNote.create(noteData);

      res.status(201).json({
        success: true,
        message: 'Note créée avec succès',
        data: { note },
      });
    } catch (error) {
      console.error('Erreur création note:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la note',
      });
    }
  }

  // Obtenir les notes d'une session
  async getSessionNotes(req, res) {
    try {
      const { eventId } = req.params;

      // Vérifier que l'événement existe
      const event = await Event.findById(eventId, 'id');
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé',
        });
      }

      const notes = await SessionNote.getSessionNotes(eventId);

      // Filtrer les notes selon les permissions
      const filteredNotes = notes.filter((note) => {
        // Les notes générales sont visibles par tous
        if (note.note_type === 'general') return true;

        // Les notes individuelles ne sont visibles que par :
        // - Le destinataire
        // - L'auteur
        // - Les capitaines/coaches
        if (note.target_user_id) {
          return (
            note.target_user_id === req.user.id ||
            note.user_id === req.user.id ||
            [2, 3].includes(req.user.role_id)
          );
        }

        return true;
      });

      res.json({
        success: true,
        data: { notes: filteredNotes },
      });
    } catch (error) {
      console.error('Erreur récupération notes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notes',
      });
    }
  }

  // Mettre à jour une note
  async updateNote(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Vérifier que la note existe et que l'utilisateur peut la modifier
      const note = await SessionNote.findById(id, 'user_id');
      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note non trouvée',
        });
      }

      // Seul l'auteur peut modifier sa note
      if (note.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour modifier cette note',
        });
      }

      const updatedNote = await SessionNote.update(id, updates);

      res.json({
        success: true,
        message: 'Note mise à jour avec succès',
        data: { note: updatedNote },
      });
    } catch (error) {
      console.error('Erreur mise à jour note:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la note',
      });
    }
  }

  // Supprimer une note
  async deleteNote(req, res) {
    try {
      const { id } = req.params;

      // Vérifier les permissions (même logique que update)
      const note = await SessionNote.findById(id, 'user_id');
      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note non trouvée',
        });
      }

      if (note.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes pour supprimer cette note',
        });
      }

      await SessionNote.delete(id);

      res.json({
        success: true,
        message: 'Note supprimée avec succès',
      });
    } catch (error) {
      console.error('Erreur suppression note:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la note',
      });
    }
  }

  // Obtenir les devoirs d'un utilisateur
  async getUserHomework(req, res) {
    try {
      const { userId } = req.params;
      const { pending = 'true' } = req.query;

      // Vérifier les permissions : l'utilisateur ne peut voir que ses propres devoirs
      // sauf si c'est un capitaine/coach
      if (userId !== req.user.id && ![2, 3].includes(req.user.role_id)) {
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes',
        });
      }

      const homework = await SessionNote.getUserHomework(
        userId,
        pending === 'true'
      );

      res.json({
        success: true,
        data: { homework },
      });
    } catch (error) {
      console.error('Erreur récupération devoirs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des devoirs',
      });
    }
  }

  // Obtenir les devoirs de l'utilisateur connecté
  async getMyHomework(req, res) {
    try {
      const { pending = 'true' } = req.query;

      const homework = await SessionNote.getUserHomework(
        req.user.id,
        pending === 'true'
      );

      res.json({
        success: true,
        data: { homework },
      });
    } catch (error) {
      console.error('Erreur récupération mes devoirs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de vos devoirs',
      });
    }
  }

  // Marquer un devoir comme terminé
  async completeHomework(req, res) {
    try {
      const { id } = req.params;

      // Vérifier que c'est un devoir assigné à l'utilisateur
      const homework = await SessionNote.findById(
        id,
        'target_user_id, is_homework'
      );
      if (!homework) {
        return res.status(404).json({
          success: false,
          message: 'Devoir non trouvé',
        });
      }

      if (!homework.is_homework || homework.target_user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Ce n'est pas votre devoir",
        });
      }

      // Marquer comme terminé (on peut ajouter un champ completed_at)
      const updatedHomework = await SessionNote.update(id, {
        completed_at: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Devoir marqué comme terminé',
        data: { homework: updatedHomework },
      });
    } catch (error) {
      console.error('Erreur completion devoir:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la completion du devoir',
      });
    }
  }

  // Obtenir les statistiques des notes (pour les coaches/capitaines)
  async getNotesStats(req, res) {
    try {
      const { data: stats, error } = await SessionNote.supabase.rpc(
        'get_notes_statistics'
      );

      if (error) throw error;

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error('Erreur statistiques notes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      });
    }
  }
}

module.exports = new SessionNotesController();
