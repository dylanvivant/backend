// ========================================
// SESSION NOTES ROUTES
// src/routes/sessionNotes.js
// ========================================
const express = require('express');
const router = express.Router();

// Middlewares
const { authenticate } = require('../middleware/auth');
const {
  requireCaptainOrCoach,
  requireOwnershipOrRole,
} = require('../middleware/rbac');
const { validate, validateUuidParam } = require('../middleware/validation');
const { sessionNoteSchemas } = require('../validation/schemas');

// Controller
const sessionNotesController = require('../controllers/sessionNotesController');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes accessibles à tous les membres authentifiés

// Obtenir les notes d'une session
router.get(
  '/session/:eventId',
  validateUuidParam('eventId'),
  sessionNotesController.getSessionNotes
);

// Obtenir mes devoirs
router.get('/homework/my', sessionNotesController.getMyHomework);

// Marquer un devoir comme terminé
router.patch(
  '/:id/complete',
  validateUuidParam('id'),
  sessionNotesController.completeHomework
);

// Mettre à jour une note (seul l'auteur)
router.put(
  '/:id',
  validateUuidParam('id'),
  validate(sessionNoteSchemas.updateNote),
  sessionNotesController.updateNote
);

// Supprimer une note (seul l'auteur)
router.delete(
  '/:id',
  validateUuidParam('id'),
  sessionNotesController.deleteNote
);

// Routes pour capitaines/coaches uniquement

// Créer une note
router.post(
  '/',
  requireCaptainOrCoach,
  validate(sessionNoteSchemas.createNote),
  sessionNotesController.createNote
);

// Obtenir les devoirs d'un utilisateur spécifique
router.get(
  '/homework/:userId',
  requireCaptainOrCoach,
  validateUuidParam('userId'),
  sessionNotesController.getUserHomework
);

// Statistiques des notes
router.get(
  '/stats',
  requireCaptainOrCoach,
  sessionNotesController.getNotesStats
);

module.exports = router;
