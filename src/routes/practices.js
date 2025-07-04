// ========================================
// PRACTICE REQUESTS ROUTES
// src/routes/practices.js
// ========================================
const express = require('express');
const router = express.Router();

// Middlewares
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireCaptain } = require('../middleware/rbac');
const { validate, validateUuidParam } = require('../middleware/validation');
const { practiceRequestSchemas } = require('../validation/schemas');

// Controller
const practiceRequestsController = require('../controllers/practiceRequestsController');

// Route publique pour créer une demande (formulaire externe)
router.post(
  '/request',
  validate(practiceRequestSchemas.createRequest),
  practiceRequestsController.createRequest
);

// Routes protégées (nécessitent une authentification)
router.use(authenticate);

// Routes pour capitaines uniquement

// Obtenir toutes les demandes
router.get('/', requireCaptain, practiceRequestsController.getAllRequests);

// Obtenir une demande spécifique
router.get(
  '/:id',
  requireCaptain,
  validateUuidParam('id'),
  practiceRequestsController.getRequestById
);

// Traiter une demande (accepter/refuser)
router.patch(
  '/:id/handle',
  requireCaptain,
  validateUuidParam('id'),
  validate(practiceRequestSchemas.handleRequest),
  practiceRequestsController.handleRequest
);

// Supprimer une demande
router.delete(
  '/:id',
  requireCaptain,
  validateUuidParam('id'),
  practiceRequestsController.deleteRequest
);

// Obtenir les statistiques des demandes
router.get(
  '/stats/overview',
  requireCaptain,
  practiceRequestsController.getRequestsStats
);

module.exports = router;
