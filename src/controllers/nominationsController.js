// ========================================
// CAPTAIN NOMINATIONS CONTROLLER
// src/controllers/nominationsController.js
// ========================================
const { CaptainNomination, User } = require('../models');

class NominationsController {
  // Créer une nomination
  async createNomination(req, res) {
    try {
      const { nominated_user_id } = req.body;

      // Vérifier que l'utilisateur à nommer existe et n'est pas déjà capitaine
      const nominatedUser = await User.findById(
        nominated_user_id,
        'role_id, pseudo'
      );
      if (!nominatedUser) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
      }

      if (nominatedUser.role_id === 2) {
        // Déjà capitaine
        return res.status(400).json({
          success: false,
          message: 'Cet utilisateur est déjà capitaine',
        });
      }

      // Vérifier qu'il n'y a pas déjà une nomination en cours pour cet utilisateur
      const { data: existingNomination, error: checkError } =
        await CaptainNomination.supabase
          .from('captain_nominations')
          .select('id')
          .eq('nominated_user_id', nominated_user_id)
          .eq('status', 'pending')
          .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingNomination) {
        return res.status(409).json({
          success: false,
          message: 'Une nomination est déjà en cours pour cet utilisateur',
        });
      }

      const nomination = await CaptainNomination.createNomination(
        nominated_user_id,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: `Nomination de ${nominatedUser.pseudo} créée. En attente d'approbation des autres capitaines.`,
        data: { nomination },
      });
    } catch (error) {
      console.error('Erreur création nomination:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la nomination',
      });
    }
  }

  // Obtenir toutes les nominations en attente
  async getPendingNominations(req, res) {
    try {
      const nominations = await CaptainNomination.getPendingNominations();

      // Récupérer les approbations déjà données pour chaque nomination
      const nominationsWithApprovals = await Promise.all(
        nominations.map(async (nomination) => {
          const { data: approvals, error } = await CaptainNomination.supabase
            .from('nomination_approvals')
            .select(
              `
                            approved, comment, created_at,
                            users(pseudo)
                        `
            )
            .eq('nomination_id', nomination.id);

          if (error) throw error;

          return {
            ...nomination,
            approvals,
          };
        })
      );

      res.json({
        success: true,
        data: { nominations: nominationsWithApprovals },
      });
    } catch (error) {
      console.error('Erreur récupération nominations:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des nominations',
      });
    }
  }

  // Approuver ou rejeter une nomination
  async approveNomination(req, res) {
    try {
      const { id } = req.params;
      const { approved, comment } = req.body;

      // Vérifier que la nomination existe et est en attente
      const nomination = await CaptainNomination.findById(id);
      if (!nomination) {
        return res.status(404).json({
          success: false,
          message: 'Nomination non trouvée',
        });
      }

      if (nomination.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: "Cette nomination n'est plus en attente",
        });
      }

      // Vérifier que l'utilisateur n'a pas déjà voté
      const { data: existingApproval, error: checkError } =
        await CaptainNomination.supabase
          .from('nomination_approvals')
          .select('id')
          .eq('nomination_id', id)
          .eq('captain_id', req.user.id)
          .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingApproval) {
        return res.status(409).json({
          success: false,
          message: 'Vous avez déjà voté pour cette nomination',
        });
      }

      // Enregistrer l'approbation
      const { data: approval, error: approvalError } =
        await CaptainNomination.supabase
          .from('nomination_approvals')
          .insert({
            nomination_id: id,
            captain_id: req.user.id,
            approved,
            comment,
          })
          .select()
          .single();

      if (approvalError) throw approvalError;

      // Mettre à jour le compteur d'approbations
      const { data: updatedNomination, error: updateError } =
        await CaptainNomination.supabase
          .from('captain_nominations')
          .update({
            approvals_received: nomination.approvals_received + 1,
          })
          .eq('id', id)
          .select()
          .single();

      if (updateError) throw updateError;

      // Vérifier si on a atteint le seuil d'approbation
      if (
        approved &&
        updatedNomination.approvals_received >=
          updatedNomination.approvals_needed
      ) {
        // Promouvoir l'utilisateur au rang de capitaine
        await User.update(nomination.nominated_user_id, { role_id: 2 });

        // Marquer la nomination comme approuvée
        await CaptainNomination.update(id, { status: 'approved' });

        return res.json({
          success: true,
          message:
            "Nomination approuvée ! L'utilisateur est maintenant capitaine.",
          data: { approval, promoted: true },
        });
      }

      // Vérifier si la nomination est rejetée (plus de la moitié des capitaines ont voté non)
      const { data: allApprovals, error: allApprovalsError } =
        await CaptainNomination.supabase
          .from('nomination_approvals')
          .select('approved')
          .eq('nomination_id', id);

      if (allApprovalsError) throw allApprovalsError;

      const rejections = allApprovals.filter((a) => !a.approved).length;
      const totalCaptains = nomination.approvals_needed * 2; // Approximation

      if (rejections > totalCaptains / 2) {
        await CaptainNomination.update(id, { status: 'rejected' });

        return res.json({
          success: true,
          message: 'Nomination rejetée par la majorité des capitaines.',
          data: { approval, rejected: true },
        });
      }

      res.json({
        success: true,
        message: 'Vote enregistré avec succès',
        data: { approval },
      });
    } catch (error) {
      console.error('Erreur approbation nomination:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'approbation de la nomination",
      });
    }
  }

  // Obtenir l'historique des nominations
  async getNominationsHistory(req, res) {
    try {
      const { data: nominations, error } = await CaptainNomination.supabase
        .from('captain_nominations')
        .select(
          `
                    *,
                    users!captain_nominations_nominated_user_id_fkey(pseudo, email),
                    users!captain_nominations_nominated_by_fkey(pseudo)
                `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: { nominations },
      });
    } catch (error) {
      console.error('Erreur historique nominations:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de l'historique",
      });
    }
  }

  // Annuler une nomination (par celui qui l'a créée)
  async cancelNomination(req, res) {
    try {
      const { id } = req.params;

      const nomination = await CaptainNomination.findById(
        id,
        'nominated_by, status'
      );
      if (!nomination) {
        return res.status(404).json({
          success: false,
          message: 'Nomination non trouvée',
        });
      }

      if (nomination.nominated_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Seul le créateur peut annuler cette nomination',
        });
      }

      if (nomination.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cette nomination ne peut plus être annulée',
        });
      }

      await CaptainNomination.update(id, { status: 'cancelled' });

      res.json({
        success: true,
        message: 'Nomination annulée avec succès',
      });
    } catch (error) {
      console.error('Erreur annulation nomination:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'annulation de la nomination",
      });
    }
  }
}

module.exports = new NominationsController();
