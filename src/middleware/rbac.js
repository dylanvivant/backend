// ========================================
// ROLE-BASED ACCESS CONTROL
// src/middleware/rbac.js
// ========================================
const { supabase } = require('../config/supabase');

// Cache des rôles pour éviter les requêtes répétées
let rolesCache = null;

const loadRoles = async () => {
  if (rolesCache) return rolesCache;

  const { data, error } = await supabase.from('roles').select('id, name');

  if (error) throw error;

  rolesCache = data.reduce((acc, role) => {
    acc[role.name.toLowerCase()] = role.id;
    return acc;
  }, {});

  return rolesCache;
};

// Middleware pour vérifier les rôles
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise',
        });
      }

      const roles = await loadRoles();
      const userRoleId = req.user.role_id;

      // Vérifier si l'utilisateur a un des rôles autorisés
      const hasRequiredRole = allowedRoles.some((roleName) => {
        const roleId = roles[roleName.toLowerCase()];
        return roleId === userRoleId;
      });

      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé - permissions insuffisantes',
          required: allowedRoles,
          current: Object.keys(roles).find((key) => roles[key] === userRoleId),
        });
      }

      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des rôles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la vérification des permissions',
      });
    }
  };
};

// Middleware pour vérifier que l'utilisateur est capitaine
const requireCaptain = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
    });
  }

  if (req.user.role_id !== 2) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux capitaines',
    });
  }

  next();
};

// Middleware pour vérifier que l'utilisateur est coach
const requireCoach = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
    });
  }

  if (req.user.role_id !== 3) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux coaches',
    });
  }

  next();
};

// Middleware pour vérifier que l'utilisateur est capitaine ou coach
const requireCaptainOrCoach = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
    });
  }

  if (![2, 3].includes(req.user.role_id)) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux capitaines et coaches',
    });
  }

  next();
};

// Vérifier que l'utilisateur peut accéder à ses propres données ou a les permissions
const requireOwnershipOrRole = (roleIds = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    // Si l'utilisateur accède à ses propres données
    if (req.params.userId === req.user.id || req.params.id === req.user.id) {
      return next();
    }

    // Si l'utilisateur a les permissions nécessaires
    if (roleIds.includes(req.user.role_id)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Permissions insuffisantes',
    });
  };
};

module.exports = {
  requireRole,
  requireCaptain,
  requireCoach,
  requireCaptainOrCoach,
  requireOwnershipOrRole,
};
