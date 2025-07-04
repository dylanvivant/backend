const BaseModel = require('./BaseModel');

class EventParticipant extends BaseModel {
  constructor() {
    super('event_participants');
  }

  // Répondre à une invitation
  async respondToInvitation(eventId, userId, status) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtenir les participants d'un événement
  async getEventParticipants(eventId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
                *,
                users(id, pseudo, discord_username, player_types(name))
            `
      )
      .eq('event_id', eventId);

    if (error) throw error;
    return data;
  }

  // Marquer la présence
  async markAttendance(eventId, userIds, isPresent) {
    const updates = userIds.map((userId) => ({
      event_id: eventId,
      user_id: userId,
      status: isPresent ? 'present' : 'absent',
    }));

    const { data, error } = await this.supabase
      .from(this.tableName)
      .upsert(updates, { onConflict: 'event_id,user_id' })
      .select();

    if (error) throw error;
    return data;
  }
}

module.exports = EventParticipant;
