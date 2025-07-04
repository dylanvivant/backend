// ========================================
// MONITORING SERVICE
// src/services/monitoringService.js
// ========================================
const os = require('os');
const process = require('process');
const cacheService = require('./cacheService');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        averageResponseTime: 0,
        responseTimeHistory: [],
      },
      system: {
        uptime: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
      },
      database: {
        connections: 0,
        queries: 0,
        errors: 0,
        averageQueryTime: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
    };

    this.alerts = [];
    this.thresholds = {
      cpuUsage: 80,
      memoryUsage: 85,
      responseTime: 5000,
      errorRate: 5,
    };

    // Démarrer la collecte de métriques
    this.startMetricsCollection();
  }

  // Démarrer la collecte automatique de métriques
  startMetricsCollection() {
    // Collecte des métriques système toutes les minutes
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);

    // Collecte des métriques de cache toutes les 30 secondes
    setInterval(() => {
      this.collectCacheMetrics();
    }, 30000);

    // Vérification des alertes toutes les 5 minutes
    setInterval(() => {
      this.checkAlerts();
    }, 300000);
  }

  // Collecter les métriques système
  collectSystemMetrics() {
    try {
      // Uptime
      this.metrics.system.uptime = process.uptime();

      // CPU Usage
      const cpuUsage = process.cpuUsage();
      this.metrics.system.cpuUsage =
        ((cpuUsage.user + cpuUsage.system) /
          1000000 /
          this.metrics.system.uptime) *
        100;

      // Memory Usage
      const memoryUsage = process.memoryUsage();
      this.metrics.system.memoryUsage = {
        rss: memoryUsage.rss / 1024 / 1024, // MB
        heapTotal: memoryUsage.heapTotal / 1024 / 1024, // MB
        heapUsed: memoryUsage.heapUsed / 1024 / 1024, // MB
        external: memoryUsage.external / 1024 / 1024, // MB
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      };

      // OS Info
      this.metrics.system.os = {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        totalMemory: os.totalmem() / 1024 / 1024, // MB
        freeMemory: os.freemem() / 1024 / 1024, // MB
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
      };
    } catch (error) {
      console.error('Erreur collecte métriques système:', error);
    }
  }

  // Collecter les métriques de cache
  collectCacheMetrics() {
    try {
      const cacheStats = cacheService.getStats();
      this.metrics.cache = {
        ...cacheStats,
        hitRate:
          cacheStats.hits + cacheStats.misses > 0
            ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
            : 0,
      };
    } catch (error) {
      console.error('Erreur collecte métriques cache:', error);
    }
  }

  // Enregistrer une requête
  recordRequest(responseTime, success = true) {
    try {
      this.metrics.requests.total++;

      if (success) {
        this.metrics.requests.success++;
      } else {
        this.metrics.requests.errors++;
      }

      // Ajouter le temps de réponse
      this.metrics.requests.responseTimeHistory.push({
        time: responseTime,
        timestamp: new Date(),
      });

      // Garder seulement les 1000 dernières entrées
      if (this.metrics.requests.responseTimeHistory.length > 1000) {
        this.metrics.requests.responseTimeHistory.shift();
      }

      // Calculer le temps de réponse moyen
      const totalTime = this.metrics.requests.responseTimeHistory.reduce(
        (sum, entry) => sum + entry.time,
        0
      );
      this.metrics.requests.averageResponseTime =
        totalTime / this.metrics.requests.responseTimeHistory.length;
    } catch (error) {
      console.error('Erreur enregistrement requête:', error);
    }
  }

  // Enregistrer une requête base de données
  recordDatabaseQuery(queryTime, success = true) {
    try {
      this.metrics.database.queries++;

      if (!success) {
        this.metrics.database.errors++;
      }

      // Mettre à jour le temps de requête moyen
      this.metrics.database.averageQueryTime =
        (this.metrics.database.averageQueryTime + queryTime) / 2;
    } catch (error) {
      console.error('Erreur enregistrement requête DB:', error);
    }
  }

  // Obtenir les métriques actuelles
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      alerts: this.alerts.slice(-10), // Les 10 dernières alertes
    };
  }

  // Obtenir les métriques détaillées
  getDetailedMetrics() {
    return {
      ...this.getMetrics(),
      performance: {
        requestsPerSecond: this.calculateRequestsPerSecond(),
        errorRate: this.calculateErrorRate(),
        p95ResponseTime: this.calculateP95ResponseTime(),
        p99ResponseTime: this.calculateP99ResponseTime(),
      },
      health: {
        status: this.getHealthStatus(),
        checks: this.performHealthChecks(),
      },
    };
  }

  // Calculer les requêtes par seconde
  calculateRequestsPerSecond() {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    const recentRequests = this.metrics.requests.responseTimeHistory.filter(
      (entry) => entry.timestamp >= oneMinuteAgo
    );

    return recentRequests.length / 60; // Requêtes par seconde
  }

  // Calculer le taux d'erreur
  calculateErrorRate() {
    if (this.metrics.requests.total === 0) return 0;
    return (this.metrics.requests.errors / this.metrics.requests.total) * 100;
  }

  // Calculer le percentile 95 du temps de réponse
  calculateP95ResponseTime() {
    if (this.metrics.requests.responseTimeHistory.length === 0) return 0;

    const times = this.metrics.requests.responseTimeHistory
      .map((entry) => entry.time)
      .sort((a, b) => a - b);

    const index = Math.floor(times.length * 0.95);
    return times[index] || 0;
  }

  // Calculer le percentile 99 du temps de réponse
  calculateP99ResponseTime() {
    if (this.metrics.requests.responseTimeHistory.length === 0) return 0;

    const times = this.metrics.requests.responseTimeHistory
      .map((entry) => entry.time)
      .sort((a, b) => a - b);

    const index = Math.floor(times.length * 0.99);
    return times[index] || 0;
  }

  // Obtenir le statut de santé général
  getHealthStatus() {
    const checks = this.performHealthChecks();
    const failedChecks = checks.filter((check) => !check.status);

    if (failedChecks.length === 0) return 'healthy';
    if (failedChecks.length <= 2) return 'degraded';
    return 'unhealthy';
  }

  // Effectuer des vérifications de santé
  performHealthChecks() {
    const checks = [];

    // Vérifier l'utilisation CPU
    checks.push({
      name: 'CPU Usage',
      status: this.metrics.system.cpuUsage < this.thresholds.cpuUsage,
      value: this.metrics.system.cpuUsage,
      threshold: this.thresholds.cpuUsage,
      unit: '%',
    });

    // Vérifier l'utilisation mémoire
    checks.push({
      name: 'Memory Usage',
      status:
        this.metrics.system.memoryUsage.percentage <
        this.thresholds.memoryUsage,
      value: this.metrics.system.memoryUsage.percentage,
      threshold: this.thresholds.memoryUsage,
      unit: '%',
    });

    // Vérifier le temps de réponse
    checks.push({
      name: 'Response Time',
      status:
        this.metrics.requests.averageResponseTime <
        this.thresholds.responseTime,
      value: this.metrics.requests.averageResponseTime,
      threshold: this.thresholds.responseTime,
      unit: 'ms',
    });

    // Vérifier le taux d'erreur
    const errorRate = this.calculateErrorRate();
    checks.push({
      name: 'Error Rate',
      status: errorRate < this.thresholds.errorRate,
      value: errorRate,
      threshold: this.thresholds.errorRate,
      unit: '%',
    });

    // Vérifier le cache
    checks.push({
      name: 'Cache Hit Rate',
      status: this.metrics.cache.hitRate > 50,
      value: this.metrics.cache.hitRate,
      threshold: 50,
      unit: '%',
    });

    return checks;
  }

  // Vérifier les alertes
  checkAlerts() {
    const checks = this.performHealthChecks();
    const now = new Date();

    checks.forEach((check) => {
      if (!check.status) {
        // Vérifier si une alerte similaire existe déjà récemment
        const recentAlert = this.alerts.find(
          (alert) => alert.type === check.name && now - alert.timestamp < 300000 // 5 minutes
        );

        if (!recentAlert) {
          this.createAlert({
            type: check.name,
            severity: this.getAlertSeverity(check),
            message: `${check.name} élevé: ${check.value}${check.unit} (seuil: ${check.threshold}${check.unit})`,
            value: check.value,
            threshold: check.threshold,
            timestamp: now,
          });
        }
      }
    });
  }

  // Créer une alerte
  createAlert(alert) {
    this.alerts.push({
      id: `alert_${Date.now()}`,
      ...alert,
      resolved: false,
    });

    // Garder seulement les 100 dernières alertes
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Log de l'alerte
    console.warn(`[ALERTE ${alert.severity}] ${alert.message}`);

    // Envoyer une notification si nécessaire
    if (alert.severity === 'critical') {
      this.sendCriticalAlert(alert);
    }
  }

  // Déterminer la sévérité de l'alerte
  getAlertSeverity(check) {
    const ratio = check.value / check.threshold;

    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }

  // Envoyer une alerte critique
  async sendCriticalAlert(alert) {
    try {
      // Implémentation future : envoyer des notifications
      // par email, Slack, Discord, etc.
      console.error(`[ALERTE CRITIQUE] ${alert.message}`);
    } catch (error) {
      console.error('Erreur envoi alerte critique:', error);
    }
  }

  // Résoudre une alerte
  resolveAlert(alertId) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  // Obtenir les alertes actives
  getActiveAlerts() {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  // Obtenir l'historique des alertes
  getAlertHistory(limit = 50) {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Obtenir les statistiques d'alertes
  getAlertStats(period = 'day') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const periodAlerts = this.alerts.filter(
      (alert) => alert.timestamp >= startDate
    );

    return {
      period,
      total: periodAlerts.length,
      bySeverity: {
        critical: periodAlerts.filter((a) => a.severity === 'critical').length,
        high: periodAlerts.filter((a) => a.severity === 'high').length,
        medium: periodAlerts.filter((a) => a.severity === 'medium').length,
        low: periodAlerts.filter((a) => a.severity === 'low').length,
      },
      byType: periodAlerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {}),
      resolved: periodAlerts.filter((a) => a.resolved).length,
      active: periodAlerts.filter((a) => !a.resolved).length,
    };
  }

  // Réinitialiser les métriques
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        averageResponseTime: 0,
        responseTimeHistory: [],
      },
      system: {
        uptime: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
      },
      database: {
        connections: 0,
        queries: 0,
        errors: 0,
        averageQueryTime: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
    };
  }

  // Exporter les métriques vers un format externe
  exportMetrics(format = 'json') {
    const metrics = this.getDetailedMetrics();

    switch (format) {
      case 'json':
        return JSON.stringify(metrics, null, 2);
      case 'prometheus':
        return this.convertToPrometheusFormat(metrics);
      default:
        return metrics;
    }
  }

  // Convertir les métriques au format Prometheus
  convertToPrometheusFormat(metrics) {
    let output = '';

    // Métriques de requêtes
    output += `# HELP http_requests_total Total number of HTTP requests\n`;
    output += `# TYPE http_requests_total counter\n`;
    output += `http_requests_total{status="success"} ${metrics.requests.success}\n`;
    output += `http_requests_total{status="error"} ${metrics.requests.errors}\n`;

    // Temps de réponse
    output += `# HELP http_request_duration_ms Average HTTP request duration in milliseconds\n`;
    output += `# TYPE http_request_duration_ms gauge\n`;
    output += `http_request_duration_ms ${metrics.requests.averageResponseTime}\n`;

    // Utilisation CPU
    output += `# HELP cpu_usage_percent CPU usage percentage\n`;
    output += `# TYPE cpu_usage_percent gauge\n`;
    output += `cpu_usage_percent ${metrics.system.cpuUsage}\n`;

    // Utilisation mémoire
    output += `# HELP memory_usage_percent Memory usage percentage\n`;
    output += `# TYPE memory_usage_percent gauge\n`;
    output += `memory_usage_percent ${metrics.system.memoryUsage.percentage}\n`;

    // Métriques de cache
    output += `# HELP cache_hit_rate Cache hit rate percentage\n`;
    output += `# TYPE cache_hit_rate gauge\n`;
    output += `cache_hit_rate ${metrics.cache.hitRate}\n`;

    return output;
  }
}

module.exports = new MonitoringService();
