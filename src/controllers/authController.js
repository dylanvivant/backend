// ========================================
// AUTH CONTROLLER
// src/controllers/authController.js
// ========================================
const { User } = require('../models');
const { generateTokens } = require('../utils/jwt');
const emailService = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  // Inscription d'un nouveau joueur
  async register(req, res) {
    try {
      const {
        email,
        password,
        pseudo,
        discord_username,
        rank,
        player_type_id,
      } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Un compte avec cet email existe déjà',
        });
      }

      // Créer l'utilisateur avec le rôle Joueur par défaut (id: 1)
      const userData = {
        email,
        password,
        pseudo,
        discord_username,
        rank,
        role_id: 1, // Joueur par défaut
        player_type_id,
      };

      const newUser = await User.createUser(userData);

      // Envoyer l'email de vérification
      await emailService.sendVerificationEmail(
        newUser.email,
        newUser.verification_token,
        newUser.pseudo
      );

      res.status(201).json({
        success: true,
        message:
          'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
        data: {
          id: newUser.id,
          email: newUser.email,
          pseudo: newUser.pseudo,
        },
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du compte',
      });
    }
  }

  // Connexion
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Trouver l'utilisateur
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect',
        });
      }

      // Vérifier le mot de passe
      const isValidPassword = await User.verifyPassword(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect',
        });
      }

      // Vérifier si l'email est vérifié
      if (!user.is_verified) {
        return res.status(401).json({
          success: false,
          message: 'Veuillez vérifier votre email avant de vous connecter',
        });
      }

      // Générer les tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.role_id,
      };

      const { accessToken, refreshToken } = generateTokens(tokenPayload);

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: {
            id: user.id,
            email: user.email,
            pseudo: user.pseudo,
            discord_username: user.discord_username,
            rank: user.rank,
            role: user.roles?.name,
            player_type: user.player_types?.name,
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        },
      });
    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion',
      });
    }
  }

  // Vérification email
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      const user = await User.verifyEmail(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Token de vérification invalide ou expiré',
        });
      }

      res.json({
        success: true,
        message:
          'Email vérifié avec succès. Vous pouvez maintenant vous connecter.',
        data: {
          email: user.email,
          pseudo: user.pseudo,
        },
      });
    } catch (error) {
      console.error('Erreur vérification email:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification de l'email",
      });
    }
  }

  // Demander un nouveau token de vérification
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Aucun compte trouvé avec cet email',
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'Ce compte est déjà vérifié',
        });
      }

      // Générer un nouveau token
      const newToken = uuidv4();
      await User.update(user.id, { verification_token: newToken });

      // Renvoyer l'email
      await emailService.sendVerificationEmail(
        user.email,
        newToken,
        user.pseudo
      );

      res.json({
        success: true,
        message: 'Email de vérification renvoyé',
      });
    } catch (error) {
      console.error('Erreur renvoi vérification:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du renvoi de l'email de vérification",
      });
    }
  }

  // Profil utilisateur actuel
  async getProfile(req, res) {
    try {
      const user = await User.findById(
        req.user.id,
        `
                id, email, pseudo, discord_username, rank, is_verified,
                roles(name),
                player_types(name)
            `
      );

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          pseudo: user.pseudo,
          discord_username: user.discord_username,
          rank: user.rank,
          is_verified: user.is_verified,
          role: user.roles?.name,
          player_type: user.player_types?.name,
        },
      });
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil',
      });
    }
  }

  // Mettre à jour le profil
  async updateProfile(req, res) {
    try {
      const updates = req.body;
      const updatedUser = await User.update(req.user.id, updates);

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: {
          id: updatedUser.id,
          pseudo: updatedUser.pseudo,
          discord_username: updatedUser.discord_username,
          rank: updatedUser.rank,
        },
      });
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil',
      });
    }
  }

  // Changer mot de passe
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Récupérer l'utilisateur avec le hash du mot de passe
      const user = await User.findById(req.user.id, 'id, password_hash');

      // Vérifier le mot de passe actuel
      const isValidPassword = await User.verifyPassword(
        currentPassword,
        user.password_hash
      );
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe actuel incorrect',
        });
      }

      // Hacher le nouveau mot de passe
      const bcrypt = require('bcryptjs');
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour
      await User.update(req.user.id, { password_hash: hashedNewPassword });

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès',
      });
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de mot de passe',
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token manquant',
        });
      }

      // Vérifier le refresh token
      const { verifyToken } = require('../utils/jwt');
      const decoded = verifyToken(refreshToken);

      // Vérifier que l'utilisateur existe toujours
      const user = await User.findById(
        decoded.userId,
        'id, email, role_id, is_verified'
      );
      if (!user || !user.is_verified) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur invalide',
        });
      }

      // Générer de nouveaux tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.role_id,
      };

      const { accessToken, refreshToken: newRefreshToken } =
        generateTokens(tokenPayload);

      res.json({
        success: true,
        data: {
          tokens: {
            access_token: accessToken,
            refresh_token: newRefreshToken,
          },
        },
      });
    } catch (error) {
      console.error('Erreur refresh token:', error);
      res.status(401).json({
        success: false,
        message: 'Refresh token invalide',
      });
    }
  }
}

module.exports = new AuthController();
