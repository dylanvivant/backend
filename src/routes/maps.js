// ========================================
// MAPS ROUTES
// src/routes/maps.js
// ========================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireCaptain } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const mapsController = require('../controllers/mapsController'); // ✅ CORRECT - chemin vers controllers/

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes accessibles à tous
router.get('/', mapsController.getAllMaps);

// Routes capitaine uniquement
router.post(
  '/',
  requireCaptain,
  validate({
    name: require('joi').string().required(),
    game: require('joi').string().default('Valorant'),
    image_url: require('joi').string().uri().optional(),
  }),
  mapsController.createMap
);

router.put(
  '/:id',
  requireCaptain,
  validate({
    name: require('joi').string(),
    game: require('joi').string(),
    image_url: require('joi').string().uri().allow(null),
    is_active: require('joi').boolean(),
  }),
  mapsController.updateMap
);

router.delete('/:id', requireCaptain, mapsController.deactivateMap);

module.exports = router;
