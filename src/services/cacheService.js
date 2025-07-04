const NodeCache = require('node-cache');
const { AppError } = require('../utils/helpers');

class CacheService {
  constructor() {
    // Configuration du cache par défaut
    this.cache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes par défaut
      checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60, // Vérification toutes les 60 secondes
      useClones: false,
      deleteOnExpire: true,
    });

    // Cache pour les sessions utilisateur
    this.userCache = new NodeCache({
      stdTTL: parseInt(process.env.USER_CACHE_TTL) || 1800, // 30 minutes
      checkperiod: 120,
      useClones: false,
    });

    // Cache pour les données temporaires
    this.tempCache = new NodeCache({
      stdTTL: parseInt(process.env.TEMP_CACHE_TTL) || 60, // 1 minute
      checkperiod: 30,
      useClones: false,
    });

    console.log('✅ Cache Service initialisé');
  }

  /**
   * Définir une valeur dans le cache
   */
  set(key, value, ttl = null) {
    try {
      const success = this.cache.set(key, value, ttl);
      if (!success) {
        throw new AppError('Erreur lors de la mise en cache', 500);
      }
      return true;
    } catch (error) {
      console.error('Erreur cache set:', error);
      return false;
    }
  }

  /**
   * Récupérer une valeur du cache
   */
  get(key) {
    try {
      return this.cache.get(key);
    } catch (error) {
      console.error('Erreur cache get:', error);
      return undefined;
    }
  }

  /**
   * Supprimer une valeur du cache
   */
  delete(key) {
    try {
      return this.cache.del(key);
    } catch (error) {
      console.error('Erreur cache delete:', error);
      return false;
    }
  }

  /**
   * Vérifier si une clé existe dans le cache
   */
  has(key) {
    try {
      return this.cache.has(key);
    } catch (error) {
      console.error('Erreur cache has:', error);
      return false;
    }
  }

  /**
   * Vider tout le cache
   */
  flush() {
    try {
      this.cache.flushAll();
      return true;
    } catch (error) {
      console.error('Erreur cache flush:', error);
      return false;
    }
  }

  /**
   * Récupérer toutes les clés du cache
   */
  keys() {
    try {
      return this.cache.keys();
    } catch (error) {
      console.error('Erreur cache keys:', error);
      return [];
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats() {
    try {
      return this.cache.getStats();
    } catch (error) {
      console.error('Erreur cache stats:', error);
      return {};
    }
  }

  /**
   * Cache utilisateur - Définir
   */
  setUser(userId, userData, ttl = null) {
    try {
      const key = `user:${userId}`;
      return this.userCache.set(key, userData, ttl);
    } catch (error) {
      console.error('Erreur user cache set:', error);
      return false;
    }
  }

  /**
   * Cache utilisateur - Récupérer
   */
  getUser(userId) {
    try {
      const key = `user:${userId}`;
      return this.userCache.get(key);
    } catch (error) {
      console.error('Erreur user cache get:', error);
      return undefined;
    }
  }

  /**
   * Cache utilisateur - Supprimer
   */
  deleteUser(userId) {
    try {
      const key = `user:${userId}`;
      return this.userCache.del(key);
    } catch (error) {
      console.error('Erreur user cache delete:', error);
      return false;
    }
  }

  /**
   * Cache temporaire - Définir
   */
  setTemp(key, value, ttl = null) {
    try {
      return this.tempCache.set(key, value, ttl);
    } catch (error) {
      console.error('Erreur temp cache set:', error);
      return false;
    }
  }

  /**
   * Cache temporaire - Récupérer
   */
  getTemp(key) {
    try {
      return this.tempCache.get(key);
    } catch (error) {
      console.error('Erreur temp cache get:', error);
      return undefined;
    }
  }

  /**
   * Cache temporaire - Supprimer
   */
  deleteTemp(key) {
    try {
      return this.tempCache.del(key);
    } catch (error) {
      console.error('Erreur temp cache delete:', error);
      return false;
    }
  }

  /**
   * Mettre en cache avec une fonction de génération
   */
  async getOrSet(key, generator, ttl = null) {
    try {
      // Vérifier si la valeur existe déjà
      let value = this.get(key);

      if (value !== undefined) {
        return value;
      }

      // Générer la valeur
      if (typeof generator === 'function') {
        value = await generator();
      } else {
        value = generator;
      }

      // Mettre en cache
      this.set(key, value, ttl);

      return value;
    } catch (error) {
      console.error('Erreur cache getOrSet:', error);
      throw error;
    }
  }

  /**
   * Mettre en cache les résultats d'une requête
   */
  async cacheQuery(queryKey, queryFunction, ttl = null) {
    try {
      return await this.getOrSet(queryKey, queryFunction, ttl);
    } catch (error) {
      console.error('Erreur cache query:', error);
      throw error;
    }
  }

  /**
   * Invalider le cache par pattern
   */
  invalidatePattern(pattern) {
    try {
      const keys = this.keys();
      const keysToDelete = keys.filter((key) => key.includes(pattern));

      keysToDelete.forEach((key) => {
        this.delete(key);
      });

      return keysToDelete.length;
    } catch (error) {
      console.error('Erreur cache invalidatePattern:', error);
      return 0;
    }
  }

  /**
   * Invalider le cache utilisateur par pattern
   */
  invalidateUserPattern(pattern) {
    try {
      const keys = this.userCache.keys();
      const keysToDelete = keys.filter((key) => key.includes(pattern));

      keysToDelete.forEach((key) => {
        this.userCache.del(key);
      });

      return keysToDelete.length;
    } catch (error) {
      console.error('Erreur user cache invalidatePattern:', error);
      return 0;
    }
  }

  /**
   * Définir un cache avec expiration personnalisée
   */
  setWithExpiration(key, value, seconds) {
    try {
      return this.set(key, value, seconds);
    } catch (error) {
      console.error('Erreur cache setWithExpiration:', error);
      return false;
    }
  }

  /**
   * Récupérer le TTL d'une clé
   */
  getTTL(key) {
    try {
      return this.cache.getTtl(key);
    } catch (error) {
      console.error('Erreur cache getTTL:', error);
      return 0;
    }
  }

  /**
   * Définir le TTL d'une clé existante
   */
  setTTL(key, ttl) {
    try {
      return this.cache.ttl(key, ttl);
    } catch (error) {
      console.error('Erreur cache setTTL:', error);
      return false;
    }
  }

  /**
   * Récupérer les informations détaillées du cache
   */
  getInfo() {
    try {
      return {
        mainCache: {
          stats: this.cache.getStats(),
          keys: this.cache.keys().length,
        },
        userCache: {
          stats: this.userCache.getStats(),
          keys: this.userCache.keys().length,
        },
        tempCache: {
          stats: this.tempCache.getStats(),
          keys: this.tempCache.keys().length,
        },
      };
    } catch (error) {
      console.error('Erreur cache getInfo:', error);
      return {};
    }
  }

  /**
   * Nettoyer le cache (supprimer les entrées expirées)
   */
  cleanup() {
    try {
      this.cache.flushStats();
      this.userCache.flushStats();
      this.tempCache.flushStats();
      return true;
    } catch (error) {
      console.error('Erreur cache cleanup:', error);
      return false;
    }
  }
}

module.exports = new CacheService();
