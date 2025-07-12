// ========================================
// USERS ROUTES
// src/routes/users.js
// ========================================
const express = require('express');
const router = express.Router();

// Middlewares
const { authenticate } = require('../middleware/auth');
const {
  requireCaptain,
  requireCaptainOrCoach,
  requireOwnershipOrRole,
} = require('../middleware/rbac');
const { validate, validateUuidParam } = require('../middleware/validation');
const { userSchemas } = require('../validation/schemas');

// Controller
const usersController = require('../controllers/usersController');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes accessibles à tous les membres

// Obtenir les rôles disponibles
router.get('/roles', usersController.getRoles);

// Obtenir les types de joueurs
router.get('/player-types', usersController.getPlayerTypes);

// Obtenir tous les membres (lecture seule)
router.get('/', usersController.getTeamMembers);

// Obtenir un membre spécifique
router.get('/:id', validateUuidParam('id'), usersController.getMemberById);

// Routes pour capitaines uniquement

// Créer un nouveau membre
router.post(
  '/',
  requireCaptain,
  validate(userSchemas.createUser),
  usersController.createMember
);

// Mettre à jour un membre
router.put(
  '/:id',
  requireOwnershipOrRole([2]), // 2 = Capitaine, ou propriétaire du profil
  validateUuidParam('id'),
  validate(userSchemas.updateUser),
  usersController.updateMember
);

// Supprimer un membre
router.delete(
  '/:id',
  requireCaptain,
  validateUuidParam('id'),
  usersController.removeMember
);

// Réinitialiser le mot de passe d'un membre
router.post(
  '/:id/reset-password',
  requireCaptain,
  validateUuidParam('id'),
  usersController.resetMemberPassword
);

// Changer le mot de passe d'un membre (reset ou update)
router.put(
  '/:id/password',
  requireCaptain,
  validateUuidParam('id'),
  usersController.updateMemberPassword
);

// Renvoyer email de vérification pour un membre
router.post(
  '/:id/resend-verification',
  requireCaptain,
  validateUuidParam('id'),
  usersController.resendVerificationById
);

// Routes pour capitaines/coaches

// Obtenir les statistiques de l'équipe
router.get('/stats/team', requireCaptainOrCoach, usersController.getTeamStats);

module.exports = router;
