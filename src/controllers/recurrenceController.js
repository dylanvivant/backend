const { supabase } = require('../config/supabase');
const { AppError, successResponse } = require('../utils/helpers');
const cacheService = require('../services/cacheService');

class RecurrenceController {
  /**
   * Créer une règle de récurrence
   */
  async createRecurrence(req, res) {
    try {
      const {
        event_id,
        pattern,
        frequency,
        interval,
        end_date,
        days_of_week,
        day_of_month,
        month_of_year,
      } = req.body;

      const recurrenceData = {
        event_id,
        pattern,
        frequency,
        interval,
        end_date,
        days_of_week,
        day_of_month,
        month_of_year,
        created_by: req.user.id,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('event_recurrence')
        .insert([recurrenceData])
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la création de la récurrence: ${error.message}`,
          400
        );
      }

      // Générer les événements récurrents
      await this.generateRecurrentEvents(data.id);

      // Invalider le cache
      cacheService.invalidatePattern('events');

      res
        .status(201)
        .json(successResponse(data, 'Récurrence créée avec succès'));
    } catch (error) {
      console.error('Erreur createRecurrence:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la création de la récurrence',
      });
    }
  }

  /**
   * Récupérer toutes les récurrences
   */
  async getAllRecurrences(req, res) {
    try {
      const { page = 1, limit = 10, event_id } = req.query;
      const offset = (page - 1) * limit;

      const cacheKey = `recurrences:${page}:${limit}:${event_id || 'all'}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      let query = supabase
        .from('event_recurrence')
        .select(
          `
          *,
          events (
            id,
            title,
            type,
            start_date,
            end_date
          )
        `
        )
        .order('created_at', { ascending: false });

      if (event_id) {
        query = query.eq('event_id', event_id);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération des récurrences: ${error.message}`,
          400
        );
      }

      // Mettre en cache
      cacheService.set(cacheKey, data, 300); // 5 minutes

      res.json(successResponse(data));
    } catch (error) {
      console.error('Erreur getAllRecurrences:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la récupération des récurrences',
      });
    }
  }

  /**
   * Récupérer une récurrence par ID
   */
  async getRecurrenceById(req, res) {
    try {
      const { id } = req.params;

      const cacheKey = `recurrence:${id}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        return res.json(successResponse(cached));
      }

      const { data, error } = await supabase
        .from('event_recurrence')
        .select(
          `
          *,
          events (
            id,
            title,
            type,
            start_date,
            end_date
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération de la récurrence: ${error.message}`,
          400
        );
      }

      // Mettre en cache
      cacheService.set(cacheKey, data, 300);

      res.json(successResponse(data));
    } catch (error) {
      console.error('Erreur getRecurrenceById:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la récupération de la récurrence',
      });
    }
  }

  /**
   * Mettre à jour une récurrence
   */
  async updateRecurrence(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data, error } = await supabase
        .from('event_recurrence')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la mise à jour de la récurrence: ${error.message}`,
          400
        );
      }

      // Regénérer les événements récurrents
      await this.generateRecurrentEvents(id);

      // Invalider le cache
      cacheService.delete(`recurrence:${id}`);
      cacheService.invalidatePattern('recurrences');
      cacheService.invalidatePattern('events');

      res.json(successResponse(data, 'Récurrence mise à jour avec succès'));
    } catch (error) {
      console.error('Erreur updateRecurrence:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la mise à jour de la récurrence',
      });
    }
  }

  /**
   * Supprimer une récurrence
   */
  async deleteRecurrence(req, res) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('event_recurrence')
        .delete()
        .eq('id', id);

      if (error) {
        throw new AppError(
          `Erreur lors de la suppression de la récurrence: ${error.message}`,
          400
        );
      }

      // Invalider le cache
      cacheService.delete(`recurrence:${id}`);
      cacheService.invalidatePattern('recurrences');

      res.json(successResponse(null, 'Récurrence supprimée avec succès'));
    } catch (error) {
      console.error('Erreur deleteRecurrence:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la suppression de la récurrence',
      });
    }
  }

  /**
   * Générer les événements récurrents
   */
  async generateRecurrentEvents(recurrenceId) {
    try {
      const { data: recurrence, error } = await supabase
        .from('event_recurrence')
        .select(
          `
          *,
          events (*)
        `
        )
        .eq('id', recurrenceId)
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération de la récurrence: ${error.message}`,
          400
        );
      }

      const baseEvent = recurrence.events;
      const eventsToCreate = [];

      const startDate = new Date(baseEvent.start_date);
      const endDate = new Date(recurrence.end_date);
      const eventDuration =
        new Date(baseEvent.end_date) - new Date(baseEvent.start_date);

      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + recurrence.interval);

      while (currentDate <= endDate) {
        const eventEndDate = new Date(currentDate.getTime() + eventDuration);

        // Vérifier si l'événement correspond au pattern
        if (this.matchesPattern(currentDate, recurrence)) {
          eventsToCreate.push({
            title: baseEvent.title,
            description: baseEvent.description,
            type: baseEvent.type,
            start_date: currentDate.toISOString(),
            end_date: eventEndDate.toISOString(),
            location: baseEvent.location,
            created_by: baseEvent.created_by,
            recurrence_id: recurrenceId,
            is_recurring: true,
          });
        }

        // Calculer la prochaine date
        currentDate = this.getNextDate(currentDate, recurrence);
      }

      // Supprimer les anciens événements récurrents
      await supabase.from('events').delete().eq('recurrence_id', recurrenceId);

      // Créer les nouveaux événements
      if (eventsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('events')
          .insert(eventsToCreate);

        if (insertError) {
          throw new AppError(
            `Erreur lors de la création des événements récurrents: ${insertError.message}`,
            400
          );
        }
      }

      return eventsToCreate.length;
    } catch (error) {
      console.error('Erreur generateRecurrentEvents:', error);
      throw error;
    }
  }

  /**
   * Vérifier si une date correspond au pattern de récurrence
   */
  matchesPattern(date, recurrence) {
    switch (recurrence.pattern) {
      case 'daily':
        return true;
      case 'weekly':
        if (recurrence.days_of_week) {
          const dayOfWeek = date.getDay();
          return recurrence.days_of_week.includes(dayOfWeek);
        }
        return true;
      case 'monthly':
        if (recurrence.day_of_month) {
          return date.getDate() === recurrence.day_of_month;
        }
        return true;
      case 'yearly':
        if (recurrence.month_of_year && recurrence.day_of_month) {
          return (
            date.getMonth() === recurrence.month_of_year - 1 &&
            date.getDate() === recurrence.day_of_month
          );
        }
        return true;
      default:
        return true;
    }
  }

  /**
   * Calculer la prochaine date selon le pattern
   */
  getNextDate(currentDate, recurrence) {
    const nextDate = new Date(currentDate);

    switch (recurrence.pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + recurrence.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7 * recurrence.interval);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + recurrence.interval);
    }

    return nextDate;
  }

  /**
   * Activer/désactiver une récurrence
   */
  async toggleRecurrence(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      const { data, error } = await supabase
        .from('event_recurrence')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors du changement d'état de la récurrence: ${error.message}`,
          400
        );
      }

      if (is_active) {
        await this.generateRecurrentEvents(id);
      } else {
        // Supprimer les événements récurrents
        await supabase.from('events').delete().eq('recurrence_id', id);
      }

      // Invalider le cache
      cacheService.delete(`recurrence:${id}`);
      cacheService.invalidatePattern('recurrences');
      cacheService.invalidatePattern('events');

      res.json(
        successResponse(data, 'État de la récurrence modifié avec succès')
      );
    } catch (error) {
      console.error('Erreur toggleRecurrence:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || "Erreur lors du changement d'état de la récurrence",
      });
    }
  }

  /**
   * Obtenir un aperçu des événements récurrents
   */
  async previewRecurrentEvents(req, res) {
    try {
      const {
        event_id,
        pattern,
        frequency,
        interval,
        end_date,
        days_of_week,
        day_of_month,
        month_of_year,
      } = req.body;

      const { data: baseEvent, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', event_id)
        .single();

      if (error) {
        throw new AppError(
          `Erreur lors de la récupération de l'événement: ${error.message}`,
          400
        );
      }

      const recurrence = {
        pattern,
        frequency,
        interval,
        end_date,
        days_of_week,
        day_of_month,
        month_of_year,
      };

      const events = [];
      const startDate = new Date(baseEvent.start_date);
      const endDate = new Date(end_date);
      const eventDuration =
        new Date(baseEvent.end_date) - new Date(baseEvent.start_date);

      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + interval);

      while (currentDate <= endDate && events.length < 50) {
        // Limiter à 50 événements pour l'aperçu
        const eventEndDate = new Date(currentDate.getTime() + eventDuration);

        if (this.matchesPattern(currentDate, recurrence)) {
          events.push({
            title: baseEvent.title,
            start_date: currentDate.toISOString(),
            end_date: eventEndDate.toISOString(),
            type: baseEvent.type,
          });
        }

        currentDate = this.getNextDate(currentDate, recurrence);
      }

      res.json(
        successResponse(
          events,
          `Aperçu de ${events.length} événements récurrents`
        )
      );
    } catch (error) {
      console.error('Erreur previewRecurrentEvents:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || "Erreur lors de l'aperçu des événements récurrents",
      });
    }
  }
}

module.exports = new RecurrenceController();
