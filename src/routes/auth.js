// ========================================
// AUTH ROUTES
// src/routes/auth.js
// ========================================
const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import des middlewares et validations
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authSchemas, userSchemas } = require('../validation/schemas');

// Import du contrôleur
const authController = require('../controllers/authController');

// Routes publiques
router.post(
  '/register',
  validate(authSchemas.register),
  authController.register
);

router.post('/login', validate(authSchemas.login), authController.login);

router.post(
  '/verify-email',
  validate(authSchemas.verifyEmail),
  authController.verifyEmail
);

router.post(
  '/resend-verification',
  validate(authSchemas.forgotPassword), // Réutilise le schéma avec email
  authController.resendVerification
);

router.post(
  '/refresh-token',
  validate(Joi.object({ refreshToken: Joi.string().required() })),
  authController.refreshToken
);

// Routes protégées (nécessitent une authentification)
router.use(authenticate); // Toutes les routes suivantes nécessitent une auth

router.get('/profile', authController.getProfile);
router.get('/verify-token', authController.verifyCurrentToken); // Nouvelle route pour debug
router.put(
  '/profile',
  validate(userSchemas.updateUser),
  authController.updateProfile
);

router.put(
  '/change-password',
  validate(userSchemas.updatePassword),
  authController.changePassword
);

module.exports = router;
