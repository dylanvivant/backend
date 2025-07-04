const express = require('express');
const router = express.Router();
const roleService = require('../services/roleService');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { schemas } = require('../validation/schemas');
const AdvancedRbac = require('../middleware/advancedRbac');
const { AppError, successResponse } = require('../utils/helpers');

// Middleware d'authentification pour toutes les routes
router.use(authenticate);

/**
 * @route   POST /api/roles
 * @desc    Créer un nouveau rôle
 * @access  Private (Admin)
 */
router.post(
  '/',
  AdvancedRbac.hasRole('admin'),
  validate(schemas.role.create),
  async (req, res) => {
    try {
      const role = await roleService.createRole(req.body);
      res.status(201).json(successResponse(role, 'Rôle créé avec succès'));
    } catch (error) {
      console.error('Erreur createRole:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la création du rôle',
      });
    }
  }
);

/**
 * @route   GET /api/roles
 * @desc    Récupérer tous les rôles
 * @access  Private (Admin, Manager)
 */
router.get(
  '/',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const roles = await roleService.getAllRoles();
      res.json(successResponse(roles));
    } catch (error) {
      console.error('Erreur getAllRoles:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des rôles',
      });
    }
  }
);

/**
 * @route   GET /api/roles/:id
 * @desc    Récupérer un rôle par ID
 * @access  Private (Admin, Manager)
 */
router.get(
  '/:id',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);
      res.json(successResponse(role));
    } catch (error) {
      console.error('Erreur getRoleById:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération du rôle',
      });
    }
  }
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Mettre à jour un rôle
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  AdvancedRbac.hasRole('admin'),
  validate(schemas.role.update),
  async (req, res) => {
    try {
      const { id } = req.params;
      const role = await roleService.updateRole(id, req.body);
      res.json(successResponse(role, 'Rôle mis à jour avec succès'));
    } catch (error) {
      console.error('Erreur updateRole:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du rôle',
      });
    }
  }
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Supprimer un rôle
 * @access  Private (Admin)
 */
router.delete('/:id', AdvancedRbac.hasRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await roleService.deleteRole(id);
    res.json(successResponse(null, 'Rôle supprimé avec succès'));
  } catch (error) {
    console.error('Erreur deleteRole:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du rôle',
    });
  }
});

/**
 * @route   POST /api/roles/:roleId/users/:userId
 * @desc    Assigner un rôle à un utilisateur
 * @access  Private (Admin, Manager)
 */
router.post(
  '/:roleId/users/:userId',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { roleId, userId } = req.params;
      const result = await roleService.assignRoleToUser(userId, roleId);
      res.json(successResponse(result, 'Rôle assigné avec succès'));
    } catch (error) {
      console.error('Erreur assignRoleToUser:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erreur lors de l'assignation du rôle",
      });
    }
  }
);

/**
 * @route   DELETE /api/roles/:roleId/users/:userId
 * @desc    Retirer un rôle d'un utilisateur
 * @access  Private (Admin, Manager)
 */
router.delete(
  '/:roleId/users/:userId',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { roleId, userId } = req.params;
      await roleService.removeRoleFromUser(userId, roleId);
      res.json(successResponse(null, 'Rôle retiré avec succès'));
    } catch (error) {
      console.error('Erreur removeRoleFromUser:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors du retrait du rôle',
      });
    }
  }
);

/**
 * @route   GET /api/roles/users/:userId
 * @desc    Récupérer les rôles d'un utilisateur
 * @access  Private (Admin, Manager ou utilisateur concerné)
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Vérifier si l'utilisateur peut voir ces rôles
    const isAdmin = await roleService.userHasRole(currentUser.id, 'admin');
    const isManager = await roleService.userHasRole(currentUser.id, 'manager');
    const isOwner = currentUser.id === userId;

    if (!isAdmin && !isManager && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    const roles = await roleService.getUserRoles(userId);
    res.json(successResponse(roles));
  } catch (error) {
    console.error('Erreur getUserRoles:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || 'Erreur lors de la récupération des rôles utilisateur',
    });
  }
});

/**
 * @route   GET /api/roles/:roleId/permissions
 * @desc    Récupérer les permissions d'un rôle
 * @access  Private (Admin, Manager)
 */
router.get(
  '/:roleId/permissions',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { roleId } = req.params;
      const permissions = await roleService.getRolePermissions(roleId);
      res.json(successResponse(permissions));
    } catch (error) {
      console.error('Erreur getRolePermissions:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la récupération des permissions',
      });
    }
  }
);

/**
 * @route   POST /api/roles/:roleId/permissions/:permissionId
 * @desc    Assigner une permission à un rôle
 * @access  Private (Admin)
 */
router.post(
  '/:roleId/permissions/:permissionId',
  AdvancedRbac.hasRole('admin'),
  async (req, res) => {
    try {
      const { roleId, permissionId } = req.params;
      const result = await roleService.assignPermissionToRole(
        roleId,
        permissionId
      );
      res.json(successResponse(result, 'Permission assignée avec succès'));
    } catch (error) {
      console.error('Erreur assignPermissionToRole:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || "Erreur lors de l'assignation de la permission",
      });
    }
  }
);

/**
 * @route   POST /api/roles/check
 * @desc    Vérifier si un utilisateur a un rôle spécifique
 * @access  Private
 */
router.post('/check', validate(schemas.role.check), async (req, res) => {
  try {
    const { user_id, role_name } = req.body;
    const currentUser = req.user;

    // Vérifier si l'utilisateur peut effectuer cette vérification
    const isAdmin = await roleService.userHasRole(currentUser.id, 'admin');
    const isManager = await roleService.userHasRole(currentUser.id, 'manager');
    const isOwner = currentUser.id === user_id;

    if (!isAdmin && !isManager && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    const hasRole = await roleService.userHasRole(user_id, role_name);
    res.json(successResponse({ has_role: hasRole }));
  } catch (error) {
    console.error('Erreur checkRole:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification du rôle',
    });
  }
});

/**
 * @route   GET /api/roles/my-roles
 * @desc    Récupérer les rôles de l'utilisateur actuel
 * @access  Private
 */
router.get('/my-roles', async (req, res) => {
  try {
    const currentUser = req.user;
    const roles = await roleService.getUserRoles(currentUser.id);
    res.json(successResponse(roles));
  } catch (error) {
    console.error('Erreur getMyRoles:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération de vos rôles',
    });
  }
});

/**
 * @route   GET /api/roles/my-permissions
 * @desc    Récupérer les permissions de l'utilisateur actuel
 * @access  Private
 */
router.get('/my-permissions', async (req, res) => {
  try {
    const currentUser = req.user;
    const roles = await roleService.getUserRoles(currentUser.id);
    const allPermissions = [];

    for (const role of roles) {
      const permissions = await roleService.getRolePermissions(role.id);
      allPermissions.push(...permissions);
    }

    // Supprimer les doublons
    const uniquePermissions = allPermissions.filter(
      (permission, index, self) =>
        index === self.findIndex((p) => p.id === permission.id)
    );

    res.json(successResponse(uniquePermissions));
  } catch (error) {
    console.error('Erreur getMyPermissions:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || 'Erreur lors de la récupération de vos permissions',
    });
  }
});

module.exports = router;
