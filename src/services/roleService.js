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
        .from('user_roles')
        .insert([{ user_id: userId, role_id: roleId }])
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
   * Retirer un rôle d'un utilisateur
   */
  async removeRoleFromUser(userId, roleId) {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
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
   * Récupérer les rôles d'un utilisateur
   */
  async getUserRoles(userId) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(
          `
          *,
          roles (*)
        `
        )
        .eq('user_id', userId);

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération des rôles: ${error.message}`,
          400
        );
      }

      return data.map((ur) => ur.roles);
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
      const { data, error } = await supabase
        .from('user_roles')
        .select(
          `
          roles (name)
        `
        )
        .eq('user_id', userId);

      if (error) {
        throw new AppError(
          `Erreur lors de la vérification du rôle: ${error.message}`,
          400
        );
      }

      return data.some((ur) => ur.roles.name === roleName);
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
      const { data, error } = await supabase
        .from('role_permissions')
        .select(
          `
          *,
          permissions (*)
        `
        )
        .eq('role_id', roleId);

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération des permissions: ${error.message}`,
          400
        );
      }

      return data.map((rp) => rp.permissions);
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
}

module.exports = new RoleService();
