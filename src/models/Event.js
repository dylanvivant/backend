const BaseModel = require('./BaseModel');

class Event extends BaseModel {
  constructor() {
    super('events');
  }

  // Créer un événement avec participants
  async createEventWithParticipants(eventData, participantIds = []) {
    const { data: event, error: eventError } = await this.supabase
      .from(this.tableName)
      .insert(eventData)
      .select()
      .single();

    if (eventError) throw eventError;

    // Ajouter les participants si fournis
    if (participantIds.length > 0) {
      const participants = participantIds.map((userId) => ({
        event_id: event.id,
        user_id: userId,
        status: 'invited',
        invited_by: eventData.created_by,
      }));

      const { error: participantsError } = await this.supabase
        .from('event_participants')
        .insert(participants);

      if (participantsError) throw participantsError;
    }

    return event;
  }

  // Obtenir les événements avec leurs détails
  async getEventsWithDetails(filters = {}) {
    let query = this.supabase.from(this.tableName).select(`
                *,
                event_types(name),
                users!events_created_by_fkey(pseudo),
                opponent_teams(name),
                event_participants(
                    status,
                    users!event_participants_user_id_fkey(id, pseudo, player_types(name))
                )
            `);

    // Appliquer les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'start_date') {
        query = query.gte('start_time', value);
      } else if (key === 'end_date') {
        query = query.lte('start_time', value);
      } else {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.order('start_time');
    if (error) throw error;
    return data;
  }

  // Obtenir les événements d'un utilisateur
  async getUserEvents(userId, upcoming = false) {
    let query = this.supabase
      .from(this.tableName)
      .select(
        `
                *,
                event_types(name),
                users!events_created_by_fkey(pseudo),
                opponent_teams(name),
                event_participants!inner(status)
            `
      )
      .eq('event_participants.user_id', userId);

    if (upcoming) {
      query = query.gte('start_time', new Date().toISOString());
    }

    const { data, error } = await query.order('start_time');
    if (error) throw error;
    return data;
  }

  // Créer des événements récurrents
  async createRecurringEvents(eventData, occurrences) {
    const events = [];

    for (const occurrence of occurrences) {
      const recurringEvent = {
        ...eventData,
        start_time: occurrence.start_time,
        end_time: occurrence.end_time,
      };

      const event = await this.create(recurringEvent);
      events.push(event);
    }

    return events;
  }

  // Obtenir un événement avec ses participants
  async findByIdWithParticipants(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
          *,
          event_types(name),
          users!events_created_by_fkey(pseudo),
          opponent_teams(name),
          event_participants(
            status,
            users!event_participants_user_id_fkey(id, pseudo, player_types(name))
          )
        `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Obtenir tous les événements avec filtres
  async getAllEvents(filters = {}) {
    const { type_id, upcoming, page = 1, limit = 10, start, end } = filters;

    let query = this.supabase.from(this.tableName).select(
      `
        *,
        event_types(name),
        users!events_created_by_fkey(pseudo),
        opponent_teams(name),
        event_participants(
          status,
          users!event_participants_user_id_fkey(id, pseudo, player_types(name))
        )
      `,
      { count: 'exact' }
    );

    // Appliquer les filtres
    if (type_id) {
      query = query.eq('event_type_id', type_id);
    }

    if (upcoming) {
      query = query.gte('start_time', new Date().toISOString());
    }

    if (start) {
      query = query.gte('start_time', start);
    }
    if (end) {
      query = query.lte('end_time', end);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query.order('start_time');
    if (error) throw error;

    return {
      events: data || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

module.exports = Event;
