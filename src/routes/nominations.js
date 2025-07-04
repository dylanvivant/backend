// ========================================
// NOMINATIONS ROUTES
// src/routes/nominations.js
// ========================================
const express = require('express');
const router = express.Router();

// Middlewares
const { authenticate } = require('../middleware/auth');
const { requireCaptain } = require('../middleware/rbac');
const { validate, validateUuidParam } = require('../middleware/validation');
const { nominationSchemas } = require('../validation/schemas');

// Controller
const nominationsController = require('../controllers/nominationsController');

// Toutes les routes nécessitent une authentification et le rôle capitaine
router.use(authenticate);
router.use(requireCaptain);

// Créer une nomination
router.post(
  '/',
  validate(nominationSchemas.createNomination),
  nominationsController.createNomination
);

// Obtenir les nominations en attente
router.get('/pending', nominationsController.getPendingNominations);

// Obtenir l'historique des nominations
router.get('/history', nominationsController.getNominationsHistory);

// Approuver/rejeter une nomination
router.post(
  '/:id/approve',
  validateUuidParam('id'),
  validate(nominationSchemas.approveNomination),
  nominationsController.approveNomination
);

// Annuler une nomination
router.delete(
  '/:id',
  validateUuidParam('id'),
  nominationsController.cancelNomination
);

module.exports = router;
