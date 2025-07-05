const BaseModel = require('./BaseModel');

class Notification extends BaseModel {
  constructor() {
    super('notifications');
  }

  /**
   * Créer une notification
   */
  async create(notificationData) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, unread_only = false } = options;
    const offset = (page - 1) * limit;

    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unread_only) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      // Retourner un tableau vide si la table n'existe pas
      return [];
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      throw error;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
      throw error;
    }
  }

  /**
   * Supprimer une notification
   */
  async delete(notificationId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      throw error;
    }
  }

  /**
   * Compter les notifications non lues
   */
  async countUnread(userId) {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erreur comptage notifications:', error);
      return 0;
    }
  }
}

module.exports = Notification;
