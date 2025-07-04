const BaseModel = require('./BaseModel');

class PracticeRequest extends BaseModel {
  constructor() {
    super('practice_requests');
  }

  // Obtenir les demandes pending
  async getPendingRequests() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Traiter une demande - VERSION CORRIGÉE
  async handleRequest(requestId, handledBy, status, responseMessage = null) {
    // Mapper le status pour le champ response (ils doivent être identiques)
    const responseStatus = status; // 'accepted' ou 'declined'

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status: status, // 'accepted' ou 'declined'
        response: responseStatus, // 'accepted' ou 'declined' (même valeur)
        handled_by: handledBy,
        handled_at: new Date().toISOString(),
        response_message: responseMessage, // Le message texte va ici
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtenir une demande par ID
  async findById(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Pas trouvé
      }
      throw error;
    }
    return data;
  }

  // Créer une nouvelle demande
  async create(requestData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert([
        {
          ...requestData,
          status: 'pending',
          response: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtenir toutes les demandes avec filtres
  async getAll(filters = {}) {
    let query = this.supabase.from(this.tableName).select('*');

    // Appliquer les filtres
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.user_email) {
      query = query.eq('user_email', filters.user_email);
    }
    if (filters.team_name) {
      query = query.ilike('team_name', `%${filters.team_name}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Obtenir les statistiques
  async getStats() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('status');

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter((r) => r.status === 'pending').length,
      accepted: data.filter((r) => r.status === 'accepted').length,
      declined: data.filter((r) => r.status === 'declined').length,
      completed: data.filter((r) => r.status === 'completed').length,
      cancelled: data.filter((r) => r.status === 'cancelled').length,
    };

    return stats;
  }
}

module.exports = PracticeRequest;
