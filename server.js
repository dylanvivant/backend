require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import des configurations
const { connectSupabase } = require('./src/config/supabase');

// Import des routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const eventRoutes = require('./src/routes/events');
const sessionNotesRoutes = require('./src/routes/sessionNotes');
const practiceRoutes = require('./src/routes/practices');
const nominationRoutes = require('./src/routes/nominations');
// Nouvelles routes avancées
const recurrenceRoutes = require('./src/routes/recurrence');
const notificationRoutes = require('./src/routes/notifications');
const analyticsRoutes = require('./src/routes/analytics');
const integrationRoutes = require('./src/routes/integrations');
const roleRoutes = require('./src/routes/roles');
const reportingRoutes = require('./src/routes/reporting');
const monitoringRoutes = require('./src/routes/monitoring');

// Import des middlewares
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');
const { requestMetrics, errorMetrics } = require('./src/middleware/monitoring');

// Import des services
const cacheService = require('./src/services/cacheService');
const integrationService = require('./src/services/integrationService');
const analyticsService = require('./src/services/analyticsService');
const monitoringService = require('./src/services/monitoringService');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARES GLOBAUX
// ========================================

// Sécurité
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
  },
});
app.use('/api/', limiter);

// Parsing du body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de monitoring des requêtes
app.use(requestMetrics);

// ========================================
// ROUTES
// ========================================

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Serveur opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/session-notes', sessionNotesRoutes);
app.use('/api/practices', practiceRoutes);
app.use('/api/nominations', nominationRoutes);

// Nouvelles routes avancées
app.use('/api/recurrence', recurrenceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/reports', reportingRoutes);
app.use('/api/monitoring', monitoringRoutes);

// ========================================
// GESTION DES ERREURS
// ========================================

// Route non trouvée
app.use(notFound);

// Gestionnaire d'erreurs global avec monitoring
app.use((err, req, res, next) => {
  // Enregistrer l'erreur dans les métriques
  monitoringService.recordRequest(0, false);

  // Utiliser le gestionnaire d'erreurs existant
  errorHandler(err, req, res, next);
});

// ========================================
// DÉMARRAGE DU SERVEUR
// ========================================

const startServer = async () => {
  try {
    // Test de connexion à Supabase
    await connectSupabase();
    console.log('✅ Connexion Supabase établie');

    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`   - Health: GET /health`);
      console.log(`   - Auth: /api/auth/*`);
      console.log(`   - Users: /api/users/*`);
      console.log(`   - Events: /api/events/*`);
      console.log(`   - Notes: /api/session-notes/*`);
      console.log(`   - Practices: /api/practices/*`);
      console.log(`   - Nominations: /api/nominations/*`);
      console.log(`   - Recurrence: /api/recurrence/*`);
      console.log(`   - Notifications: /api/notifications/*`);
      console.log(`   - Analytics: /api/analytics/*`);
      console.log(`   - Integrations: /api/integrations/*`);
      console.log(`   - Roles: /api/roles/*`);
      console.log(`   - Reports: /api/reports/*`);
      console.log(`   - Monitoring: /api/monitoring/*`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
};

startServer();

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});
