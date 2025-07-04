const express = require('express');
const router = express.Router();
const integrationService = require('../services/integrationService');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { schemas } = require('../validation/schemas');
const AdvancedRbac = require('../middleware/advancedRbac');
const { AppError, successResponse } = require('../utils/helpers');

// Middleware d'authentification pour toutes les routes
router.use(authenticate);

/**
 * @route   GET /api/integrations/status
 * @desc    Obtenir le statut de toutes les intégrations
 * @access  Private (Admin, Manager)
 */
router.get(
  '/status',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const status = integrationService.getIntegrationsStatus();
      res.json(successResponse(status));
    } catch (error) {
      console.error('Erreur status integrations:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut des intégrations',
      });
    }
  }
);

/**
 * @route   POST /api/integrations/discord/message
 * @desc    Envoyer un message Discord
 * @access  Private (Admin, Manager)
 */
router.post(
  '/discord/message',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  validate(schemas.integration.discordMessage),
  async (req, res) => {
    try {
      const { message, embed } = req.body;
      const result = await integrationService.sendDiscordMessage(
        message,
        embed
      );
      res.json(successResponse(result, 'Message Discord envoyé avec succès'));
    } catch (error) {
      console.error('Erreur Discord message:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erreur lors de l'envoi du message Discord",
      });
    }
  }
);

/**
 * @route   POST /api/integrations/slack/message
 * @desc    Envoyer un message Slack
 * @access  Private (Admin, Manager)
 */
router.post(
  '/slack/message',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  validate(schemas.integration.slackMessage),
  async (req, res) => {
    try {
      const { message, channel } = req.body;
      const result = await integrationService.sendSlackMessage(
        message,
        channel
      );
      res.json(successResponse(result, 'Message Slack envoyé avec succès'));
    } catch (error) {
      console.error('Erreur Slack message:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erreur lors de l'envoi du message Slack",
      });
    }
  }
);

/**
 * @route   GET /api/integrations/twitch/user/:username
 * @desc    Récupérer les informations d'un utilisateur Twitch
 * @access  Private (Admin, Manager)
 */
router.get(
  '/twitch/user/:username',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { username } = req.params;
      const userInfo = await integrationService.getTwitchUserInfo(username);
      res.json(successResponse(userInfo));
    } catch (error) {
      console.error('Erreur Twitch user info:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des informations Twitch',
      });
    }
  }
);

/**
 * @route   GET /api/integrations/twitch/stream/:username
 * @desc    Vérifier si un streamer Twitch est en ligne
 * @access  Private (Admin, Manager)
 */
router.get(
  '/twitch/stream/:username',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { username } = req.params;
      const isLive = await integrationService.isTwitchStreamLive(username);
      res.json(successResponse({ username, is_live: isLive }));
    } catch (error) {
      console.error('Erreur Twitch stream status:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la vérification du stream Twitch',
      });
    }
  }
);

/**
 * @route   GET /api/integrations/steam/player/:steamId
 * @desc    Récupérer les informations d'un joueur Steam
 * @access  Private (Admin, Manager)
 */
router.get(
  '/steam/player/:steamId',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { steamId } = req.params;
      const playerInfo = await integrationService.getSteamPlayerInfo(steamId);
      res.json(successResponse(playerInfo));
    } catch (error) {
      console.error('Erreur Steam player info:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des informations Steam',
      });
    }
  }
);

/**
 * @route   GET /api/integrations/riot/player/:summonerName
 * @desc    Récupérer les statistiques d'un joueur LoL
 * @access  Private (Admin, Manager)
 */
router.get(
  '/riot/player/:summonerName',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { summonerName } = req.params;
      const { region = 'euw1' } = req.query;
      const playerStats = await integrationService.getRiotPlayerStats(
        summonerName,
        region
      );
      res.json(successResponse(playerStats));
    } catch (error) {
      console.error('Erreur Riot player stats:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Erreur lors de la récupération des statistiques Riot',
      });
    }
  }
);

/**
 * @route   POST /api/integrations/notify-event
 * @desc    Notifier un événement sur toutes les plateformes
 * @access  Private (Admin, Manager)
 */
router.post(
  '/notify-event',
  AdvancedRbac.hasAnyRole(['admin', 'manager']),
  validate(schemas.integration.notifyEvent),
  async (req, res) => {
    try {
      const eventData = req.body;
      const result = await integrationService.notifyEvent(eventData);
      res.json(successResponse(result, 'Notifications envoyées avec succès'));
    } catch (error) {
      console.error('Erreur notify event:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erreur lors de l'envoi des notifications",
      });
    }
  }
);

/**
 * @route   POST /api/integrations/sync/:platform
 * @desc    Synchroniser les données d'une plateforme externe
 * @access  Private (Admin)
 */
router.post(
  '/sync/:platform',
  AdvancedRbac.hasRole('admin'),
  validate(schemas.integration.sync),
  async (req, res) => {
    try {
      const { platform } = req.params;
      const config = req.body;
      const result = await integrationService.syncExternalData(
        platform,
        config
      );
      res.json(successResponse(result, 'Synchronisation terminée avec succès'));
    } catch (error) {
      console.error('Erreur sync platform:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la synchronisation',
      });
    }
  }
);

/**
 * @route   POST /api/integrations/test/:platform
 * @desc    Tester une intégration
 * @access  Private (Admin)
 */
router.post(
  '/test/:platform',
  AdvancedRbac.hasRole('admin'),
  async (req, res) => {
    try {
      const { platform } = req.params;
      const result = await integrationService.testIntegration(platform);
      res.json(
        successResponse(result, `Test de l'intégration ${platform} réussi`)
      );
    } catch (error) {
      console.error('Erreur test integration:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          `Erreur lors du test de l'intégration ${req.params.platform}`,
      });
    }
  }
);

/**
 * @route   GET /api/integrations/config/:platform
 * @desc    Récupérer la configuration d'une intégration
 * @access  Private (Admin)
 */
router.get(
  '/config/:platform',
  AdvancedRbac.hasRole('admin'),
  async (req, res) => {
    try {
      const { platform } = req.params;
      const config = integrationService.integrations[platform];

      if (!config) {
        throw new AppError('Intégration non trouvée', 404);
      }

      // Masquer les informations sensibles
      const safeConfig = {
        enabled: config.enabled,
        configured: integrationService.isConfigured(platform),
      };

      res.json(successResponse(safeConfig));
    } catch (error) {
      console.error('Erreur get integration config:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la récupération de la configuration',
      });
    }
  }
);

/**
 * @route   PUT /api/integrations/config/:platform
 * @desc    Mettre à jour la configuration d'une intégration
 * @access  Private (Admin)
 */
router.put(
  '/config/:platform',
  AdvancedRbac.hasRole('admin'),
  validate(schemas.integration.config),
  async (req, res) => {
    try {
      const { platform } = req.params;
      const { enabled } = req.body;

      if (!integrationService.integrations[platform]) {
        throw new AppError('Intégration non trouvée', 404);
      }

      integrationService.integrations[platform].enabled = enabled;

      res.json(
        successResponse(
          { platform, enabled },
          'Configuration mise à jour avec succès'
        )
      );
    } catch (error) {
      console.error('Erreur update integration config:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la mise à jour de la configuration',
      });
    }
  }
);

module.exports = router;
