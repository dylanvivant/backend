// ========================================
// MAPS CONTROLLER
// src/controllers/mapsController.js
// ========================================
const { Map } = require('../models');

class MapsController {
  // Obtenir toutes les maps actives
  async getAllMaps(req, res) {
    try {
      const { game = 'Valorant' } = req.query;

      // Utiliser le modèle Map correctement
      const maps = await Map.getActiveMaps(game);

      res.json({
        success: true,
        data: { maps },
      });
    } catch (error) {
      console.error('Erreur récupération maps:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des maps',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Créer une nouvelle map (Capitaine uniquement)
  async createMap(req, res) {
    try {
      const mapData = req.body;
      const map = await Map.createMap(mapData);

      res.status(201).json({
        success: true,
        message: 'Map créée avec succès',
        data: { map },
      });
    } catch (error) {
      console.error('Erreur création map:', error);

      if (error.message.includes('existe déjà')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la map',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Mettre à jour une map
  async updateMap(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const map = await Map.updateMap(id, updates);

      res.json({
        success: true,
        message: 'Map mise à jour avec succès',
        data: { map },
      });
    } catch (error) {
      console.error('Erreur mise à jour map:', error);

      if (error.message.includes('existe déjà')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la map',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Désactiver une map
  async deactivateMap(req, res) {
    try {
      const { id } = req.params;
      const map = await Map.deactivateMap(id);

      res.json({
        success: true,
        message: 'Map désactivée avec succès',
        data: { map },
      });
    } catch (error) {
      console.error('Erreur désactivation map:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la désactivation de la map',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new MapsController();
