const BaseModel = require('./BaseModel');

class CaptainNomination extends BaseModel {
  constructor() {
    super('captain_nominations');
  }

  // Créer une nomination avec calcul des approbations nécessaires
  async createNomination(nominatedUserId, nominatedBy) {
    // Compter le nombre de capitaines actuels
    const { count } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', 2); // Role Capitaine

    const approvalsNeeded = Math.ceil(count * 0.6); // 60% des capitaines

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        nominated_user_id: nominatedUserId,
        nominated_by: nominatedBy,
        approvals_needed: approvalsNeeded,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtenir les nominations en attente
  async getPendingNominations() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
                *,
                users!captain_nominations_nominated_user_id_fkey(pseudo, email),
                users!captain_nominations_nominated_by_fkey(pseudo)
            `
      )
      .eq('status', 'pending')
      .order('created_at');

    if (error) throw error;
    return data;
  }
}

module.exports = CaptainNomination;
