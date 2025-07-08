const express = require('express');
const router = express.Router();
const recurrenceController = require('../controllers/recurrenceController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { schemas } = require('../validation/schemas');
const AdvancedRbac = require('../middleware/advancedRbac');

// Middleware d'authentification pour toutes les routes
router.use(authenticate);

/**
 * @route   POST /api/recurrence
 * @desc    Créer une règle de récurrence
 * @access  Private (Admin, Manager)
 */
router.post(
  '/',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  validate(schemas.recurrence.create),
  recurrenceController.createRecurrence
);

/**
 * @route   GET /api/recurrence
 * @desc    Récupérer toutes les récurrences
 * @access  Private (Admin, Manager)
 */
router.get(
  '/',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  recurrenceController.getAllRecurrences
);

/**
 * @route   GET /api/recurrence/:id
 * @desc    Récupérer une récurrence par ID
 * @access  Private (Admin, Manager)
 */
router.get(
  '/:id',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  recurrenceController.getRecurrenceById
);

/**
 * @route   PUT /api/recurrence/:id
 * @desc    Mettre à jour une récurrence
 * @access  Private (Admin, Manager)
 */
router.put(
  '/:id',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  validate(schemas.recurrence.update),
  recurrenceController.updateRecurrence
);

/**
 * @route   DELETE /api/recurrence/:id
 * @desc    Supprimer une récurrence
 * @access  Private (Admin, Manager)
 */
router.delete(
  '/:id',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  recurrenceController.deleteRecurrence
);

/**
 * @route   PATCH /api/recurrence/:id/toggle
 * @desc    Activer/désactiver une récurrence
 * @access  Private (Admin, Manager)
 */
router.patch(
  '/:id/toggle',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  validate(schemas.recurrence.toggle),
  recurrenceController.toggleRecurrence
);

/**
 * @route   POST /api/recurrence/preview
 * @desc    Aperçu des événements récurrents
 * @access  Private (Admin, Manager)
 */
router.post(
  '/preview',
  AdvancedRbac.hasAnyRole(['Capitaine']),
  validate(schemas.recurrence.preview),
  recurrenceController.previewRecurrentEvents
);

module.exports = router;
