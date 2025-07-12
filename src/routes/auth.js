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

// Route de debug temporaire - à supprimer en production
router.get('/debug/tokens', async (req, res) => {
  try {
    const { User } = require('../models');
    const userInstance = new User();
    const tokens = await userInstance.getAllVerificationTokens();

    console.log('🔍 Tokens de vérification trouvés:', tokens);

    res.json({
      success: true,
      data: {
        total: tokens.length,
        tokens: tokens.map((t) => ({
          email: t.email,
          pseudo: t.pseudo,
          token: t.verification_token,
          is_verified: t.is_verified,
        })),
      },
    });
  } catch (error) {
    console.error('Erreur debug tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tokens',
    });
  }
});

module.exports = router;
