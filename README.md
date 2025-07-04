# Backend S4V - Gestion d'Équipe Esport Avancée

## 🎮 Vue d'ensemble

Ce backend Node.js avancé est conçu pour la gestion complète d'une équipe esport avec des fonctionnalités avancées de RBAC, analytics, notifications, intégrations et monitoring.

## 🚀 Fonctionnalités

### 🔐 Authentification et Autorisation

- **JWT Authentication** avec refresh tokens
- **RBAC (Role-Based Access Control)** granulaire
- **Permissions dynamiques** par rôle
- **Gestion des rôles** hiérarchiques

### 📊 Analytics et Reporting

- **Tableaux de bord** complets
- **Rapports personnalisés** (présence, performance, événements)
- **Métriques en temps réel**
- **Export multiple** (JSON, CSV, PDF, HTML)

### 🔔 Notifications

- **Multi-canaux** (Email, Discord, Slack)
- **Templates personnalisables**
- **Notifications automatiques**
- **Historique et statistiques**

### 🔗 Intégrations

- **Discord** - Messages et webhooks
- **Slack** - Notifications d'équipe
- **Twitch** - Streaming et clips
- **Steam** - Profils et statistiques
- **Riot Games** - Données Valorant

### 📅 Gestion d'Événements

- **Récurrence** d'événements
- **Participations** et présences
- **Nominations** de capitaines
- **Sessions d'entraînement**

### 🖥️ Monitoring

- **Métriques système** (CPU, RAM, cache)
- **Performance** des requêtes
- **Alertes** automatiques
- **Dashboard** administrateur

## 📁 Structure du Projet

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── analyticsController.js
│   │   ├── notificationController.js
│   │   ├── recurrenceController.js
│   │   └── reportingController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── advancedRbac.js
│   │   ├── monitoring.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── SessionNote.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── analytics.js
│   │   ├── notifications.js
│   │   ├── integrations.js
│   │   ├── roles.js
│   │   ├── reporting.js
│   │   └── monitoring.js
│   ├── services/
│   │   ├── analyticsService.js
│   │   ├── cacheService.js
│   │   ├── integrationService.js
│   │   ├── notificationService.js
│   │   ├── reportingService.js
│   │   ├── roleService.js
│   │   ├── monitoringService.js
│   │   └── validationService.js
│   ├── utils/
│   │   └── jwt.js
│   └── validation/
│       └── schemas.js
├── tests/
├── .env.example
├── package.json
├── server.js
└── README.md
```

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone [repository-url]
cd backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration

Copier `.env.example` vers `.env` et configurer les variables :

```env
# Base de données
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Intégrations
DISCORD_BOT_TOKEN=your_discord_token
SLACK_BOT_TOKEN=your_slack_token
TWITCH_CLIENT_ID=your_twitch_client_id
STEAM_API_KEY=your_steam_api_key
RIOT_API_KEY=your_riot_api_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Monitoring
ENABLE_MONITORING=true
METRICS_ENDPOINT=/api/monitoring/metrics
```

### 4. Lancer le serveur

```bash
# Développement
npm run dev

# Production
npm start

# Tests
npm test
```

## 📡 API Endpoints

### 🔐 Authentification

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### 👥 Utilisateurs

```http
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### 📊 Analytics

```http
GET /api/analytics/overview
GET /api/analytics/performance
GET /api/analytics/player/:id
GET /api/analytics/trends
```

### 📈 Reporting

```http
POST /api/reports/attendance
POST /api/reports/performance
POST /api/reports/events
POST /api/reports/training
POST /api/reports/comprehensive
```

### 🔔 Notifications

```http
POST /api/notifications/send
GET  /api/notifications/history
GET  /api/notifications/templates
PUT  /api/notifications/templates/:id
```

### 🔗 Intégrations

```http
POST /api/integrations/discord/connect
POST /api/integrations/discord/message
GET  /api/integrations/twitch/streams
GET  /api/integrations/steam/profile/:id
GET  /api/integrations/riot/profile/:id
```

### 👑 Rôles

```http
GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id
POST   /api/roles/assign
```

### 🖥️ Monitoring

```http
GET /api/monitoring/metrics
GET /api/monitoring/health
GET /api/monitoring/alerts
GET /api/monitoring/performance
GET /api/monitoring/dashboard
```

## 🔧 Configuration Avancée

### Cache

Le système utilise un cache multi-niveaux :

- **Mémoire** : Cache rapide pour les données fréquentes
- **Redis** : Cache persistant (optionnel)
- **TTL** : Expiration automatique des données

### RBAC

Système de rôles hiérarchiques :

- **Super Admin** : Accès complet
- **Admin** : Gestion de l'équipe
- **Manager** : Gestion des événements
- **Captain** : Gestion des joueurs
- **Player** : Accès de base

### Monitoring

Métriques collectées :

- **Système** : CPU, RAM, disk, uptime
- **Requêtes** : Temps de réponse, erreurs, throughput
- **Base de données** : Requêtes, connexions, performance
- **Cache** : Hit rate, miss rate, mémoire

## 🔒 Sécurité

### Authentification

- **JWT** avec expiration courte
- **Refresh tokens** avec rotation
- **Rate limiting** par IP
- **Validation** stricte des entrées

### Autorisations

- **RBAC** granulaire
- **Permissions** par endpoint
- **Validation** des rôles
- **Audit trail** des actions

### Protection

- **Helmet** pour les headers de sécurité
- **CORS** configuré
- **Input validation** avec Joi
- **SQL injection** protection

## 📊 Performances

### Optimisations

- **Cache** multi-niveaux
- **Lazy loading** des données
- **Pagination** automatique
- **Compression** des réponses

### Monitoring

- **Métriques** temps réel
- **Alertes** automatiques
- **Dashboards** de performance
- **Logs** structurés

## 🧪 Tests

### Tests unitaires

```bash
npm run test:unit
```

### Tests d'intégration

```bash
npm run test:integration
```

### Tests de performance

```bash
npm run test:performance
```

### Coverage

```bash
npm run test:coverage
```

## 🚀 Déploiement

### Docker

```bash
# Build
docker build -t s4v-backend .

# Run
docker run -p 3000:3000 s4v-backend
```

### Docker Compose

```bash
docker-compose up -d
```

### Variables d'environnement

Voir `.env.example` pour la configuration complète.

## 📖 Documentation

### API Documentation

La documentation Swagger est disponible à `/api/docs` en mode développement.

### Postman Collection

Une collection Postman est disponible dans `/docs/postman/`.

## 🤝 Contribution

### Standards

- **ESLint** + **Prettier** pour le code
- **Conventional Commits** pour les messages
- **Tests** obligatoires pour les nouvelles fonctionnalités

### Workflow

1. Fork le projet
2. Créer une branche feature
3. Développer avec tests
4. Soumettre une Pull Request

## 📝 Changelog

### v2.0.0 (Latest)

- ✅ Système RBAC avancé
- ✅ Analytics et reporting
- ✅ Notifications multi-canaux
- ✅ Intégrations externes
- ✅ Monitoring système
- ✅ Cache multi-niveaux

### v1.0.0

- ✅ Authentification JWT
- ✅ CRUD utilisateurs
- ✅ Gestion événements
- ✅ API de base

## 🆘 Support

### Issues

Signaler les bugs sur GitHub Issues.

### Discord

Rejoindre le serveur Discord pour le support.

### Email

Contact : support@s4v.team

## 📄 License

MIT License - voir le fichier LICENSE pour plus de détails.

---

**Développé avec ❤️ pour la communauté esport**
