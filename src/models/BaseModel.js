const { supabase, supabaseAdmin } = require('../config/supabase');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.supabase = supabase;
    this.supabaseAdmin = supabaseAdmin;
  }

  // Méthodes génériques CRUD
  async findAll(select = '*', filters = {}) {
    let query = this.supabase.from(this.tableName).select(select);

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findById(id, select = '*') {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data) {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(id, data) {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete(id) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = BaseModel;
