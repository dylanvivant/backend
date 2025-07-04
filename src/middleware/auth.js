// ========================================
// AUTHENTICATION MIDDLEWARE
// src/middleware/auth.js
// ========================================
const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Token d'accès manquant",
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    try {
      const decoded = verifyToken(token);

      // Vérifier que l'utilisateur existe toujours
      const user = await User.findById(
        decoded.userId,
        'id, email, pseudo, role_id, player_type_id, is_verified'
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
      }

      if (!user.is_verified) {
        return res.status(401).json({
          success: false,
          message: 'Email non vérifié',
        });
      }

      // Ajouter les infos utilisateur à la requête
      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'authentification",
    });
  }
};

// Middleware optionnel (utilisateur connecté ou non)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const user = await User.findById(
      decoded.userId,
      'id, email, pseudo, role_id, player_type_id, is_verified'
    );

    req.user = user && user.is_verified ? user : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
};
