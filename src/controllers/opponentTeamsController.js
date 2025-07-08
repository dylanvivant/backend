const { supabase } = require('../config/supabase');

class OpponentTeamsController {
  // Récupérer toutes les équipes adverses
  async getAll(req, res) {
    try {
      const { data, error } = await supabase
        .from('opponent_teams')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ success: true, data: { opponentTeams: data } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Créer une équipe adverse
  async create(req, res) {
    try {
      const { name, average_rank, contact_email, contact_discord } = req.body;
      if (!name)
        return res
          .status(400)
          .json({ success: false, message: 'Le nom est requis.' });
      const { data, error } = await supabase
        .from('opponent_teams')
        .insert({ name, average_rank, contact_email, contact_discord })
        .select()
        .single();
      if (error) throw error;
      res.status(201).json({ success: true, data: { opponentTeam: data } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Mettre à jour une équipe adverse
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const { data, error } = await supabase
        .from('opponent_teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, data: { opponentTeam: data } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Supprimer une équipe adverse
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from('opponent_teams')
        .delete()
        .eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Équipe supprimée.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OpponentTeamsController();
