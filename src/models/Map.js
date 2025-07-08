// ========================================
// MAP MODEL
// src/models/Map.js
// ========================================
const BaseModel = require('./BaseModel');

class Map extends BaseModel {
  constructor() {
    super('maps');
  }

  // Obtenir toutes les maps actives
  async getActiveMaps(game = 'Valorant') {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .eq('game', game)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Créer une nouvelle map
  async createMap(mapData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        name: mapData.name,
        game: mapData.game || 'Valorant',
        image_url: mapData.image_url || null,
        is_active: mapData.is_active !== undefined ? mapData.is_active : true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour une map
  async updateMap(id, updates) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Désactiver une map (soft delete)
  async deactivateMap(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = Map;
