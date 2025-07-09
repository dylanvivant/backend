require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import des routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const eventRoutes = require('./src/routes/events');
const practiceRoutes = require('./src/routes/practices');
const nominationRoutes = require('./src/routes/nominations');
const sessionNotesRoutes = require('./src/routes/sessionNotes');
const mapsRoutes = require('./src/routes/maps');
const opponentTeamsRoutes = require('./src/routes/opponentTeams');

// Import des middlewares
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');

const app = express();

// ========================================
// MIDDLEWARES GLOBAUX
// ========================================

// Sécurité
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
});
app.use('/api/', limiter);

// Parsing du body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========================================
// ROUTES
// ========================================

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Serveur opérationnel',
    timestamp: new Date().toISOString(),
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/practices', practiceRoutes);
app.use('/api/nominations', nominationRoutes);
app.use('/api/session-notes', sessionNotesRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/opponent-teams', opponentTeamsRoutes);

// ========================================
// GESTION DES ERREURS
// ========================================

// Route non trouvée
app.use(notFound);

// Gestionnaire d'erreurs global
app.use(errorHandler);

module.exports = app;
