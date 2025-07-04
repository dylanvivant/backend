const BaseModel = require('./BaseModel');

class SessionNote extends BaseModel {
  constructor() {
    super('session_notes');
  }

  // Obtenir les notes d'une session
  async getSessionNotes(eventId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
                *,
                users!session_notes_user_id_fkey(pseudo),
                users!session_notes_target_user_id_fkey(pseudo)
            `
      )
      .eq('event_id', eventId)
      .order('created_at');

    if (error) throw error;
    return data;
  }

  // Obtenir les devoirs d'un utilisateur
  async getUserHomework(userId, pending = true) {
    let query = this.supabase
      .from(this.tableName)
      .select(
        `
                *,
                events(title, start_time),
                users!session_notes_user_id_fkey(pseudo)
            `
      )
      .eq('target_user_id', userId)
      .eq('is_homework', true);

    if (pending) {
      query = query.gte('due_date', new Date().toISOString());
    }

    const { data, error } = await query.order('due_date');
    if (error) throw error;
    return data;
  }
}

module.exports = SessionNote;
