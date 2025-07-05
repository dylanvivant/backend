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

  // Traiter une demande
  async handleRequest(requestId, handledBy, status, response = null) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status,
        handled_by: handledBy,
        handled_at: new Date().toISOString(),
        response,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = PracticeRequest;
