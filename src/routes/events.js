// ========================================
// EVENTS ROUTES
// src/routes/events.js
// ========================================
const express = require('express');
const router = express.Router();

// Middlewares
const { authenticate } = require('../middleware/auth');
const { requireCaptainOrCoach, requireRole } = require('../middleware/rbac');
const {
  validate,
  validateUuidParam,
  validatePagination,
} = require('../middleware/validation');
const { eventSchemas } = require('../validation/schemas');

// Controller
const eventsController = require('../controllers/eventsController');

// Routes publiques (pour les membres de l'équipe)
router.use(authenticate); // Toutes les routes nécessitent une authentification

// Obtenir les types d'événements
router.get('/types', eventsController.getEventTypes);

// Obtenir tous les événements (avec filtres et pagination)
router.get('/', validatePagination, eventsController.getAllEvents);

// Obtenir un événement spécifique
router.get('/:id', validateUuidParam('id'), eventsController.getEventById);

// Obtenir les événements d'un utilisateur
router.get('/user/:userId?', eventsController.getUserEvents);

// Répondre à une invitation (tous les membres peuvent le faire)
router.patch(
  '/:id/respond',
  validateUuidParam('id'),
  validate(eventSchemas.respondToInvitation),
  eventsController.respondToInvitation
);

// Routes protégées (Capitaine/Coach uniquement)
router.use(requireCaptainOrCoach);

// Créer un événement
router.post(
  '/',
  validate(eventSchemas.createEvent),
  eventsController.createEvent
);

// Mettre à jour un événement
router.put(
  '/:id',
  validateUuidParam('id'),
  validate(eventSchemas.updateEvent),
  eventsController.updateEvent
);

// Supprimer un événement
router.delete('/:id', validateUuidParam('id'), eventsController.deleteEvent);

// Inviter des utilisateurs à un événement
router.post(
  '/:id/invite',
  validateUuidParam('id'),
  validate({
    user_ids: require('joi')
      .array()
      .items(require('joi').string().uuid())
      .required(),
  }),
  eventsController.inviteUsers
);

// Marquer les présences
router.patch(
  '/:id/attendance',
  validateUuidParam('id'),
  validate(eventSchemas.markAttendance),
  eventsController.markAttendance
);

module.exports = router;
