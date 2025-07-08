const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/helpers');

class RoleService {
  /**
   * Créer un nouveau rôle
   */
  async createRole(roleData) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([roleData])
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la création du rôle: ${error.message}`,
          400
        );
      }

      return data;
    } catch (error) {
      throw new AppError(
        `Erreur lors de la création du rôle: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer tous les rôles
   */
  async getAllRoles() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération des rôles: ${error.message}`,
          400
        );
      }

      return data;
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des rôles: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer un rôle par ID
   */
  async getRoleById(roleId) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération du rôle: ${error.message}`,
          400
        );
      }

      return data;
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération du rôle: ${error.message}`,
        500
      );
    }
  }

  /**
   * Mettre à jour un rôle
   */
  async updateRole(roleId, updates) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la mise à jour du rôle: ${error.message}`,
          400
        );
      }

      return data;
    } catch (error) {
      throw new AppError(
        `Erreur lors de la mise à jour du rôle: ${error.message}`,
        500
      );
    }
  }

  /**
   * Supprimer un rôle
   */
  async deleteRole(roleId) {
    try {
      const { error } = await supabase.from('roles').delete().eq('id', roleId);

      if (error) {
        throw new AppError(
          `Erreur lors de la suppression du rôle: ${error.message}`,
          400
        );
      }

      return { message: 'Rôle supprimé avec succès' };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la suppression du rôle: ${error.message}`,
        500
      );
    }
  }

  /**
   * Assigner un rôle à un utilisateur
   */
  async assignRoleToUser(userId, roleId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role_id: roleId })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de l'assignation du rôle: ${error.message}`,
          400
        );
      }

      return data;
    } catch (error) {
      throw new AppError(
        `Erreur lors de l'assignation du rôle: ${error.message}`,
        500
      );
    }
  }

  /**
   * Retirer un rôle d'un utilisateur (assigner le rôle par défaut)
   */
  async removeRoleFromUser(userId, roleId) {
    try {
      // Récupérer le rôle par défaut (par exemple 'user')
      const { data: defaultRole, error: defaultRoleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Joueur')
        .single();

      if (defaultRoleError) {
        throw new AppError(
          `Erreur lors de la récupération du rôle par défaut: ${defaultRoleError.message}`,
          400
        );
      }

      const { error } = await supabase
        .from('users')
        .update({ role_id: defaultRole.id })
        .eq('id', userId)
        .eq('role_id', roleId);

      if (error) {
        throw new AppError(
          `Erreur lors de la suppression du rôle: ${error.message}`,
          400
        );
      }

      return { message: 'Rôle retiré avec succès' };
    } catch (error) {
      throw new AppError(
        `Erreur lors de la suppression du rôle: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer le rôle d'un utilisateur
   */
  async getUserRoles(userId) {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new AppError(
          `Erreur lors de la récupération de l'utilisateur: ${userError.message}`,
          400
        );
      }

      if (!user || !user.role_id) {
        return [];
      }

      // Récupérer les détails du rôle
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', user.role_id)
        .single();

      if (roleError) {
        throw new AppError(
          `Erreur lors de la récupération du rôle: ${roleError.message}`,
          400
        );
      }

      return role ? [role] : [];
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des rôles: ${error.message}`,
        500
      );
    }
  }

  /**
   * Vérifier si un utilisateur a un rôle spécifique
   */
  async userHasRole(userId, roleName) {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new AppError(
          `Erreur lors de la vérification du rôle: ${userError.message}`,
          400
        );
      }

      if (!user || !user.role_id) {
        return false;
      }

      // Vérifier si le rôle correspond au nom recherché
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('name')
        .eq('id', user.role_id)
        .eq('name', roleName)
        .single();

      if (roleError) {
        // Si le rôle n'existe pas, retourner false au lieu de lever une erreur
        return false;
      }

      return !!role;
    } catch (error) {
      throw new AppError(
        `Erreur lors de la vérification du rôle: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer les permissions d'un rôle
   */
  async getRolePermissions(roleId) {
    try {
      // Récupérer d'abord les role_permissions
      const { data: rolePermissions, error: rolePermissionsError } =
        await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', roleId);

      if (rolePermissionsError) {
        throw new AppError(
          `Erreur lors de la récupération des permissions: ${rolePermissionsError.message}`,
          400
        );
      }

      if (!rolePermissions || rolePermissions.length === 0) {
        return [];
      }

      // Récupérer les détails des permissions
      const permissionIds = rolePermissions.map((rp) => rp.permission_id);
      const { data: permissions, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .in('id', permissionIds);

      if (permissionsError) {
        throw new AppError(
          `Erreur lors de la récupération des permissions: ${permissionsError.message}`,
          400
        );
      }

      return permissions || [];
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des permissions: ${error.message}`,
        500
      );
    }
  }

  /**
   * Assigner une permission à un rôle
   */
  async assignPermissionToRole(roleId, permissionId) {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .insert([{ role_id: roleId, permission_id: permissionId }])
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de l'assignation de la permission: ${error.message}`,
          400
        );
      }

      return data;
    } catch (error) {
      throw new AppError(
        `Erreur lors de l'assignation de la permission: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer toutes les permissions d'un utilisateur
   */
  async getUserPermissions(userId) {
    try {
      const userRoles = await this.getUserRoles(userId);
      const allPermissions = [];

      for (const role of userRoles) {
        const permissions = await this.getRolePermissions(role.id);
        allPermissions.push(...permissions);
      }

      // Supprimer les doublons
      const uniquePermissions = allPermissions.filter(
        (permission, index, self) =>
          index === self.findIndex((p) => p.id === permission.id)
      );

      return uniquePermissions;
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération des permissions utilisateur: ${error.message}`,
        500
      );
    }
  }

  /**
   * Vérifier si un utilisateur a une permission spécifique
   */
  async userHasPermission(userId, permissionName) {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return userPermissions.some(
        (permission) => permission.name === permissionName
      );
    } catch (error) {
      throw new AppError(
        `Erreur lors de la vérification de la permission: ${error.message}`,
        500
      );
    }
  }

  /**
   * Récupérer le rôle d'un utilisateur par son ID
   */
  async getUserRole(userId) {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role_id, roles(*)')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new AppError(
          `Erreur lors de la récupération du rôle utilisateur: ${userError.message}`,
          400
        );
      }

      return user?.roles || null;
    } catch (error) {
      throw new AppError(
        `Erreur lors de la récupération du rôle utilisateur: ${error.message}`,
        500
      );
    }
  }
}

module.exports = new RoleService();
