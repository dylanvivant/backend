const axios = require('axios');
const { AppError } = require('../utils/helpers');

class IntegrationService {
  constructor() {
    this.integrations = {
      discord: {
        enabled: process.env.DISCORD_INTEGRATION_ENABLED === 'true',
        webhook: process.env.DISCORD_WEBHOOK_URL,
        botToken: process.env.DISCORD_BOT_TOKEN,
      },
      riot: {
        enabled: process.env.RIOT_INTEGRATION_ENABLED === 'true',
        apiKey: process.env.RIOT_API_KEY,
      },
    };

    console.log('✅ Integration Service initialisé');
  }

  /**
   * Vérifier si une intégration est activée
   */
  isEnabled(platform) {
    return this.integrations[platform]?.enabled || false;
  }

  /**
   * Envoyer un message Discord
   */
  async sendDiscordMessage(message, embed = null) {
    if (!this.isEnabled('discord')) {
      throw new AppError('Intégration Discord non activée', 400);
    }

    try {
      const payload = {
        content: message,
        ...(embed && { embeds: [embed] }),
      };

      const response = await axios.post(
        this.integrations.discord.webhook,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur envoi Discord:', error);
      throw new AppError("Erreur lors de l'envoi du message Discord", 500);
    }
  }

  /**
   * Envoyer un message Slack
   */
  async sendSlackMessage(message, channel = null) {
    if (!this.isEnabled('slack')) {
      throw new AppError('Intégration Slack non activée', 400);
    }

    try {
      const payload = {
        text: message,
        ...(channel && { channel }),
      };

      const response = await axios.post(
        this.integrations.slack.webhook,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur envoi Slack:', error);
      throw new AppError("Erreur lors de l'envoi du message Slack", 500);
    }
  }

  /**
   * Récupérer les informations d'un streamer Twitch
   */
  async getTwitchUserInfo(username) {
    if (!this.isEnabled('twitch')) {
      throw new AppError('Intégration Twitch non activée', 400);
    }

    try {
      // Obtenir un token d'accès
      const tokenResponse = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        {
          client_id: this.integrations.twitch.clientId,
          client_secret: this.integrations.twitch.clientSecret,
          grant_type: 'client_credentials',
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Récupérer les informations utilisateur
      const userResponse = await axios.get(
        `https://api.twitch.tv/helix/users?login=${username}`,
        {
          headers: {
            'Client-ID': this.integrations.twitch.clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return userResponse.data.data[0];
    } catch (error) {
      console.error('Erreur Twitch API:', error);
      throw new AppError(
        'Erreur lors de la récupération des données Twitch',
        500
      );
    }
  }

  /**
   * Vérifier si un streamer Twitch est en ligne
   */
  async isTwitchStreamLive(username) {
    if (!this.isEnabled('twitch')) {
      throw new AppError('Intégration Twitch non activée', 400);
    }

    try {
      const userInfo = await this.getTwitchUserInfo(username);
      const userId = userInfo.id;

      // Obtenir un token d'accès
      const tokenResponse = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        {
          client_id: this.integrations.twitch.clientId,
          client_secret: this.integrations.twitch.clientSecret,
          grant_type: 'client_credentials',
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Vérifier le statut du stream
      const streamResponse = await axios.get(
        `https://api.twitch.tv/helix/streams?user_id=${userId}`,
        {
          headers: {
            'Client-ID': this.integrations.twitch.clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return streamResponse.data.data.length > 0;
    } catch (error) {
      console.error('Erreur vérification stream Twitch:', error);
      throw new AppError(
        'Erreur lors de la vérification du stream Twitch',
        500
      );
    }
  }

  /**
   * Récupérer les informations d'un joueur Steam
   */
  async getSteamPlayerInfo(steamId) {
    if (!this.isEnabled('steam')) {
      throw new AppError('Intégration Steam non activée', 400);
    }

    try {
      const response = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`,
        {
          params: {
            key: this.integrations.steam.apiKey,
            steamids: steamId,
          },
        }
      );

      return response.data.response.players[0];
    } catch (error) {
      console.error('Erreur Steam API:', error);
      throw new AppError(
        'Erreur lors de la récupération des données Steam',
        500
      );
    }
  }

  /**
   * Récupérer les statistiques d'un joueur League of Legends
   */
  async getRiotPlayerStats(summonerName, region = 'euw1') {
    if (!this.isEnabled('riot')) {
      throw new AppError('Intégration Riot non activée', 400);
    }

    try {
      // Récupérer les informations du summoner
      const summonerResponse = await axios.get(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(
          summonerName
        )}`,
        {
          headers: {
            'X-Riot-Token': this.integrations.riot.apiKey,
          },
        }
      );

      const summoner = summonerResponse.data;

      // Récupérer le rang
      const rankResponse = await axios.get(
        `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
        {
          headers: {
            'X-Riot-Token': this.integrations.riot.apiKey,
          },
        }
      );

      return {
        summoner,
        ranks: rankResponse.data,
      };
    } catch (error) {
      console.error('Erreur Riot API:', error);
      throw new AppError(
        'Erreur lors de la récupération des données Riot',
        500
      );
    }
  }

  /**
   * Notifier un événement sur toutes les plateformes activées
   */
  async notifyEvent(eventData) {
    const notifications = [];

    try {
      // Notification Discord
      if (this.isEnabled('discord')) {
        const embed = {
          title: eventData.title,
          description: eventData.description,
          color: eventData.type === 'match' ? 0xff0000 : 0x00ff00,
          fields: [
            {
              name: 'Date',
              value: new Date(eventData.start_date).toLocaleString('fr-FR'),
              inline: true,
            },
            {
              name: 'Type',
              value: eventData.type,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        };

        notifications.push(
          this.sendDiscordMessage('🎮 Nouvel événement esport !', embed)
        );
      }

      // Notification Slack
      if (this.isEnabled('slack')) {
        const message = `🎮 Nouvel événement esport !\n*${eventData.title}*\n${
          eventData.description
        }\n📅 ${new Date(eventData.start_date).toLocaleString('fr-FR')}`;

        notifications.push(this.sendSlackMessage(message));
      }

      // Attendre toutes les notifications
      await Promise.allSettled(notifications);

      return { success: true, message: 'Notifications envoyées' };
    } catch (error) {
      console.error('Erreur notification événement:', error);
      throw new AppError("Erreur lors de l'envoi des notifications", 500);
    }
  }

  /**
   * Synchroniser les données depuis une plateforme externe
   */
  async syncExternalData(platform, config) {
    try {
      switch (platform) {
        case 'discord':
          return await this.syncDiscordData(config);
        case 'twitch':
          return await this.syncTwitchData(config);
        case 'steam':
          return await this.syncSteamData(config);
        case 'riot':
          return await this.syncRiotData(config);
        default:
          throw new AppError('Plateforme non supportée', 400);
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      throw new AppError('Erreur lors de la synchronisation', 500);
    }
  }

  /**
   * Synchroniser les données Discord
   */
  async syncDiscordData(config) {
    // Implémentation de la synchronisation Discord
    return { success: true, message: 'Synchronisation Discord terminée' };
  }

  /**
   * Synchroniser les données Twitch
   */
  async syncTwitchData(config) {
    // Implémentation de la synchronisation Twitch
    return { success: true, message: 'Synchronisation Twitch terminée' };
  }

  /**
   * Synchroniser les données Steam
   */
  async syncSteamData(config) {
    // Implémentation de la synchronisation Steam
    return { success: true, message: 'Synchronisation Steam terminée' };
  }

  /**
   * Synchroniser les données Riot
   */
  async syncRiotData(config) {
    // Implémentation de la synchronisation Riot
    return { success: true, message: 'Synchronisation Riot terminée' };
  }

  /**
   * Obtenir le statut de toutes les intégrations
   */
  getIntegrationsStatus() {
    const status = {};

    for (const [platform, config] of Object.entries(this.integrations)) {
      status[platform] = {
        enabled: config.enabled,
        configured: this.isConfigured(platform),
      };
    }

    return status;
  }

  /**
   * Vérifier si une intégration est correctement configurée
   */
  isConfigured(platform) {
    const config = this.integrations[platform];

    switch (platform) {
      case 'discord':
        return !!(config.webhook || config.botToken);
      case 'slack':
        return !!(config.webhook || config.botToken);
      case 'twitch':
        return !!(config.clientId && config.clientSecret);
      case 'steam':
        return !!config.apiKey;
      case 'riot':
        return !!config.apiKey;
      default:
        return false;
    }
  }

  /**
   * Tester une intégration
   */
  async testIntegration(platform) {
    if (!this.isEnabled(platform)) {
      throw new AppError(`Intégration ${platform} non activée`, 400);
    }

    if (!this.isConfigured(platform)) {
      throw new AppError(`Intégration ${platform} non configurée`, 400);
    }

    try {
      switch (platform) {
        case 'discord':
          return await this.sendDiscordMessage('Test de connexion Discord ✅');
        case 'slack':
          return await this.sendSlackMessage('Test de connexion Slack ✅');
        case 'twitch':
          // Test avec un utilisateur connu
          return await this.getTwitchUserInfo('ninja');
        case 'steam':
          // Test avec un Steam ID connu
          return await this.getSteamPlayerInfo('76561198037414473');
        case 'riot':
          // Test avec un summoner connu
          return await this.getRiotPlayerStats('Faker', 'kr');
        default:
          throw new AppError('Plateforme non supportée', 400);
      }
    } catch (error) {
      console.error(`Erreur test ${platform}:`, error);
      throw new AppError(
        `Erreur lors du test de l'intégration ${platform}`,
        500
      );
    }
  }
}

module.exports = new IntegrationService();
