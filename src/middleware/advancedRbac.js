const roleService = require('../services/roleService');
const { AppError } = require('../utils/helpers');

/**
 * Middleware RBAC avancé pour la gestion des permissions
 */
class AdvancedRbacMiddleware {
  /**
   * Vérifier si l'utilisateur a une permission spécifique
   */
  static hasPermission(permission) {
    return async (req, res, next) => {
      try {
        const user = req.user;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utilisateur non authentifié',
          });
        }

        // Récupérer les rôles de l'utilisateur
        const userRoles = await roleService.getUserRoles(user.id);

        // Vérifier si l'utilisateur a la permission
        let hasPermission = false;

        for (const role of userRoles) {
          const rolePermissions = await roleService.getRolePermissions(role.id);

          if (rolePermissions.some((p) => p.name === permission)) {
            hasPermission = true;
            break;
          }
        }

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Permission insuffisante',
            required: permission,
          });
        }

        next();
      } catch (error) {
        console.error('Erreur RBAC hasPermission:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification des permissions',
        });
      }
    };
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  static hasRole(roleName) {
    return async (req, res, next) => {
      try {
        const user = req.user;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utilisateur non authentifié',
          });
        }

        const hasRole = await roleService.userHasRole(user.id, roleName);

        if (!hasRole) {
          return res.status(403).json({
            success: false,
            message: 'Rôle requis non trouvé',
            required: roleName,
          });
        }

        next();
      } catch (error) {
        console.error('Erreur RBAC hasRole:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification du rôle',
        });
      }
    };
  }

  /**
   * Vérifier si l'utilisateur a l'un des rôles spécifiés
   */
  static hasAnyRole(roles) {
    return async (req, res, next) => {
      try {
        const user = req.user;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utilisateur non authentifié',
          });
        }

        const userRoles = await roleService.getUserRoles(user.id);
        const userRoleNames = userRoles.map((role) => role.name);

        const hasAnyRole = roles.some((role) => userRoleNames.includes(role));

        if (!hasAnyRole) {
          return res.status(403).json({
            success: false,
            message: 'Aucun rôle requis trouvé',
            required: roles,
          });
        }

        next();
      } catch (error) {
        console.error('Erreur RBAC hasAnyRole:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification des rôles',
        });
      }
    };
  }

  /**
   * Vérifier si l'utilisateur a toutes les permissions spécifiées
   */
  static hasAllPermissions(permissions) {
    return async (req, res, next) => {
      try {
        const user = req.user;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utilisateur non authentifié',
          });
        }

        const userRoles = await roleService.getUserRoles(user.id);
        const userPermissions = [];

        // Récupérer toutes les permissions de l'utilisateur
        for (const role of userRoles) {
          const rolePermissions = await roleService.getRolePermissions(role.id);
          userPermissions.push(...rolePermissions.map((p) => p.name));
        }

        // Supprimer les doublons
        const uniquePermissions = [...new Set(userPermissions)];

        // Vérifier si toutes les permissions requises sont présentes
        const hasAllPermissions = permissions.every((permission) =>
          uniquePermissions.includes(permission)
        );

        if (!hasAllPermissions) {
          const missingPermissions = permissions.filter(
            (permission) => !uniquePermissions.includes(permission)
          );

          return res.status(403).json({
            success: false,
            message: 'Permissions manquantes',
            required: permissions,
            missing: missingPermissions,
          });
        }

        next();
      } catch (error) {
        console.error('Erreur RBAC hasAllPermissions:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification des permissions',
        });
      }
    };
  }

  /**
   * Vérifier si l'utilisateur a au moins une des permissions spécifiées
   */
  static hasAnyPermission(permissions) {
    return async (req, res, next) => {
      try {
        const user = req.user;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utilisateur non authentifié',
          });
        }

        const userRoles = await roleService.getUserRoles(user.id);
        const userPermissions = [];

        // Récupérer toutes les permissions de l'utilisateur
        for (const role of userRoles) {
          const rolePermissions = await roleService.getRolePermissions(role.id);
          userPermissions.push(...rolePermissions.map((p) => p.name));
        }

        // Supprimer les doublons
        const uniquePermissions = [...new Set(userPermissions)];

        // Vérifier si au moins une permission requise est présente
        const hasAnyPermission = permissions.some((permission) =>
          uniquePermissions.includes(permission)
        );

        if (!hasAnyPermission) {
          return res.status(403).json({
            success: false,
            message: 'Aucune permission requise trouvée',
            required: permissions,
          });
        }

        next();
      } catch (error) {
        console.error('Erreur RBAC hasAnyPermission:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification des permissions',
        });
      }
    };
  }

  /**
   * Vérifier si l'utilisateur peut accéder à une ressource spécifique
   */
  static canAccess(resource, action) {
    return async (req, res, next) => {
      try {
        const user = req.user;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utilisateur non authentifié',
          });
        }

        const permission = `${resource}:${action}`;
        const userRoles = await roleService.getUserRoles(user.id);

        let hasPermission = false;

        for (const role of userRoles) {
          const rolePermissions = await roleService.getRolePermissions(role.id);

          if (rolePermissions.some((p) => p.name === permission)) {
            hasPermission = true;
            break;
          }
        }

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Accès refusé à la ressource',
            resource,
            action,
          });
        }

        next();
      } catch (error) {
        console.error('Erreur RBAC canAccess:', error);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la vérification d'accès",
        });
      }
    };
  }

  /**
   * Vérifier si l'utilisateur est propriétaire de la ressource
   */
  static isOwner(resourceField = 'user_id') {
    return async (req, res, next) => {
      try {
        const user = req.user;
        const resourceId = req.params.id;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utilisateur non authentifié',
          });
        }

        // Récupérer la ressource depuis le contexte de la requête
        const resource = req.resource;

        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Ressource non trouvée',
          });
        }

        const isOwner = resource[resourceField] === user.id;

        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message:
              "Accès refusé - Vous n'êtes pas le propriétaire de cette ressource",
          });
        }

        next();
      } catch (error) {
        console.error('Erreur RBAC isOwner:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification de propriété',
        });
      }
    };
  }

  /**
   * Vérifier si l'utilisateur est propriétaire OU a une permission spécifique
   */
  static isOwnerOrHasPermission(permission, resourceField = 'user_id') {
    return async (req, res, next) => {
      try {
        const user = req.user;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Utilisateur non authentifié',
          });
        }

        const resource = req.resource;

        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Ressource non trouvée',
          });
        }

        // Vérifier si l'utilisateur est propriétaire
        const isOwner = resource[resourceField] === user.id;

        if (isOwner) {
          return next();
        }

        // Vérifier si l'utilisateur a la permission
        const userRoles = await roleService.getUserRoles(user.id);
        let hasPermission = false;

        for (const role of userRoles) {
          const rolePermissions = await roleService.getRolePermissions(role.id);

          if (rolePermissions.some((p) => p.name === permission)) {
            hasPermission = true;
            break;
          }
        }

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message:
              "Accès refusé - Vous n'êtes pas le propriétaire et n'avez pas la permission requise",
            required: permission,
          });
        }

        next();
      } catch (error) {
        console.error('Erreur RBAC isOwnerOrHasPermission:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification des droits',
        });
      }
    };
  }

  /**
   * Enrichir la requête avec les permissions de l'utilisateur
   */
  static enrichWithPermissions() {
    return async (req, res, next) => {
      try {
        const user = req.user;

        if (!user) {
          return next();
        }

        const userRoles = await roleService.getUserRoles(user.id);
        const userPermissions = [];

        // Récupérer toutes les permissions de l'utilisateur
        for (const role of userRoles) {
          const rolePermissions = await roleService.getRolePermissions(role.id);
          userPermissions.push(...rolePermissions.map((p) => p.name));
        }

        // Supprimer les doublons
        const uniquePermissions = [...new Set(userPermissions)];

        // Enrichir la requête
        req.user.roles = userRoles;
        req.user.permissions = uniquePermissions;

        next();
      } catch (error) {
        console.error('Erreur RBAC enrichWithPermissions:', error);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'enrichissement des permissions",
        });
      }
    };
  }
}

module.exports = AdvancedRbacMiddleware;

// Exports individuels pour une utilisation plus simple
module.exports.authorize = AdvancedRbacMiddleware.hasRole;
module.exports.requirePermission = AdvancedRbacMiddleware.hasPermission;
module.exports.requireAnyRole = AdvancedRbacMiddleware.hasAnyRole;
module.exports.requireAllRoles = AdvancedRbacMiddleware.hasAllRoles;
module.exports.enrichWithPermissions =
  AdvancedRbacMiddleware.enrichWithPermissions;
