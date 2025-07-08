const express = require('express');
const router = express.Router();
const opponentTeamsController = require('../controllers/opponentTeamsController');

// Récupérer toutes les équipes adverses
router.get('/', opponentTeamsController.getAll);
// Créer une équipe adverse
router.post('/', opponentTeamsController.create);
// Mettre à jour une équipe adverse
router.put('/:id', opponentTeamsController.update);
// Supprimer une équipe adverse
router.delete('/:id', opponentTeamsController.delete);

module.exports = router;
