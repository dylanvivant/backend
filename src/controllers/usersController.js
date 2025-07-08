// ========================================
// USERS CONTROLLER
// src/controllers/usersController.js
// ========================================
const { User } = require('../models');
const emailService = require('../services/emailService');
const { generateRandomPassword } = require('../utils/helpers');

class UsersController {
  // Obtenir tous les membres de l'équipe
  async getTeamMembers(req, res) {
    try {
      const { role_id, player_type_id, search } = req.query;

      let filters = {};
      if (role_id) filters.role_id = role_id;
      if (player_type_id) filters.player_type_id = player_type_id;

      const members = await User.getTeamMembers();

      // Filtrage côté serveur si nécessaire
      let filteredMembers = members;

      if (search) {
        const searchLower = search.toLowerCase();
        filteredMembers = members.filter(
          (member) =>
            member.pseudo?.toLowerCase().includes(searchLower) ||
            member.email?.toLowerCase().includes(searchLower) ||
            member.discord_username?.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        success: true,
        data: {
          members: filteredMembers,
          total: filteredMembers.length,
        },
      });
    } catch (error) {
      console.error('Erreur récupération membres:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des membres',
      });
    }
  }

  // Obtenir un membre spécifique
  async getMemberById(req, res) {
    try {
      const { id } = req.params;

      const member = await User.findById(
        id,
        `
                id, email, pseudo, discord_username, rank, is_verified, created_at,
                roles(name),
                player_types(name)
            `
      );

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Membre non trouvé',
        });
      }

      res.json({
        success: true,
        data: { member },
      });
    } catch (error) {
      console.error('Erreur récupération membre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du membre',
      });
    }
  }

  // Créer un nouveau membre (par capitaine)
  async createMember(req, res) {
    try {
      const { email, pseudo, discord_username, rank, role_id, player_type_id } =
        req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Un compte avec cet email existe déjà',
        });
      }

      // Générer un mot de passe temporaire
      const temporaryPassword = generateRandomPassword();

      const userData = {
        email,
        pseudo,
        discord_username,
        rank,
        role_id,
        player_type_id,
        password: temporaryPassword,
        is_verified: true, // Compte créé par capitaine = déjà vérifié
        must_change_password: true, // Forcer le changement à la première connexion
      };

      const newUser = await User.createUser(userData);

      // Envoyer l'email avec les identifiants
      try {
        const creator = await User.findById(req.user.id, 'pseudo');
        await emailService.sendTemporaryPassword(
          email,
          pseudo,
          temporaryPassword,
          creator.pseudo || 'un capitaine'
        );
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError);
        // Continue sans faire échouer la création
      }

      res.status(201).json({
        success: true,
        message:
          'Membre créé avec succès. Un email avec les identifiants a été envoyé.',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            pseudo: newUser.pseudo,
            role_id: newUser.role_id,
          },
          temporaryPassword, // Pour tests seulement, à retirer en production
        },
      });
    } catch (error) {
      console.error('Erreur création membre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du membre',
      });
    }
  }

  // Mettre à jour un membre
  async updateMember(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Vérifier que le membre existe
      const member = await User.findById(id, 'id');
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Membre non trouvé',
        });
      }

      // Empêcher la modification de certains champs sensibles
      delete updates.password_hash;
      delete updates.verification_token;
      delete updates.id;

      const updatedMember = await User.update(id, updates);

      res.json({
        success: true,
        message: 'Membre mis à jour avec succès',
        data: { member: updatedMember },
      });
    } catch (error) {
      console.error('Erreur mise à jour membre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du membre',
      });
    }
  }

  // Supprimer un membre de l'équipe
  async removeMember(req, res) {
    try {
      const { id } = req.params;

      // Vérifier que le membre existe
      const member = await User.findById(id, 'id, pseudo, role_id');
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Membre non trouvé',
        });
      }

      // Empêcher la suppression d'un capitaine (sécurité)
      if (member.role_id === 2) {
        // Role Capitaine
        return res.status(403).json({
          success: false,
          message:
            'Impossible de supprimer un capitaine. Utilisez le système de nomination.',
        });
      }

      // Empêcher l'auto-suppression
      if (id === req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez pas vous supprimer vous-même',
        });
      }

      await User.delete(id);

      res.json({
        success: true,
        message: `Membre ${member.pseudo} retiré de l'équipe avec succès`,
      });
    } catch (error) {
      console.error('Erreur suppression membre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du membre',
      });
    }
  }

  // Obtenir les rôles disponibles
  async getRoles(req, res) {
    try {
      const { data: roles, error } = await User.supabase
        .from('roles')
        .select('*')
        .order('id');

      if (error) throw error;

      res.json({
        success: true,
        data: { roles },
      });
    } catch (error) {
      console.error('Erreur récupération rôles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des rôles',
      });
    }
  }

  // Obtenir les types de joueurs
  async getPlayerTypes(req, res) {
    try {
      const { data: playerTypes, error } = await User.supabase
        .from('player_types')
        .select('*')
        .order('name');

      if (error) throw error;

      res.json({
        success: true,
        data: { playerTypes },
      });
    } catch (error) {
      console.error('Erreur récupération types joueurs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des types de joueurs',
      });
    }
  }

  // Réinitialiser le mot de passe d'un membre
  async resetMemberPassword(req, res) {
    try {
      const { id } = req.params;

      const member = await User.findById(id, 'email, pseudo');
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Membre non trouvé',
        });
      }

      // Générer nouveau mot de passe temporaire
      const newPassword = generateRandomPassword();
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await User.update(id, { password_hash: hashedPassword });

      // Envoyer le nouveau mot de passe par email
      try {
        await emailService.sendTemporaryPassword(
          member.email,
          member.pseudo,
          newPassword,
          'un capitaine (réinitialisation)'
        );
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError);
      }

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé. Un email a été envoyé au membre.',
        data: { newPassword }, // Pour tests seulement
      });
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la réinitialisation du mot de passe',
      });
    }
  }

  // Changer le mot de passe d'un membre (reset ou update)
  async updateMemberPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword) {
        return res
          .status(400)
          .json({ success: false, message: 'Nouveau mot de passe requis' });
      }
      const updated = await User.updatePassword(id, newPassword);
      res.json({
        success: true,
        message: 'Mot de passe mis à jour',
        data: updated,
      });
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de mot de passe',
      });
    }
  }

  // Obtenir les statistiques de l'équipe
  async getTeamStats(req, res) {
    try {
      const { data: members } = await User.supabase.from('users').select(`
                    id, is_verified, created_at,
                    roles(name),
                    player_types(name)
                `);

      const stats = {
        totalMembers: members.length,
        verifiedMembers: members.filter((m) => m.is_verified).length,
        byRole: {},
        byPlayerType: {},
        recentJoins: members.filter((m) => {
          const joinDate = new Date(m.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return joinDate > weekAgo;
        }).length,
      };

      // Compter par rôle
      members.forEach((member) => {
        const roleName = member.roles?.name || 'Inconnu';
        stats.byRole[roleName] = (stats.byRole[roleName] || 0) + 1;
      });

      // Compter par type de joueur
      members.forEach((member) => {
        const typeName = member.player_types?.name || 'Non défini';
        stats.byPlayerType[typeName] = (stats.byPlayerType[typeName] || 0) + 1;
      });

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error('Erreur statistiques équipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      });
    }
  }
}

module.exports = new UsersController();
