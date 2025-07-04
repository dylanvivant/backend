// ========================================
// MONITORING MIDDLEWARE
// src/middleware/monitoring.js
// ========================================
const monitoringService = require('../services/monitoringService');

// Middleware pour enregistrer les métriques de requêtes
const requestMetrics = (req, res, next) => {
  const startTime = Date.now();

  // Intercepter la fin de la réponse
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - startTime;
    const success = res.statusCode < 400;

    // Enregistrer les métriques
    monitoringService.recordRequest(responseTime, success);

    // Restaurer la méthode originale et l'appeler
    res.end = originalEnd;
    res.end(chunk, encoding);
  };

  next();
};

// Middleware pour enregistrer les erreurs
const errorMetrics = (err, req, res, next) => {
  // Enregistrer l'erreur dans les métriques
  monitoringService.recordRequest(0, false);

  next(err);
};

// Middleware pour les métriques de base de données
const dbMetrics = (queryTime, success = true) => {
  monitoringService.recordDatabaseQuery(queryTime, success);
};

module.exports = {
  requestMetrics,
  errorMetrics,
  dbMetrics,
};
