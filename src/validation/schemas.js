// ========================================
// VALIDATION SCHEMAS
// src/validation/schemas.js
// ========================================
const Joi = require('joi');

// Schémas de base
const baseSchemas = {
  uuid: Joi.string().uuid(),
  email: Joi.string().email().max(255),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message(
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    ),
  pseudo: Joi.string().min(2).max(50),
  discord: Joi.string().max(100),
  rank: Joi.string().valid(
    'Iron',
    'Bronze',
    'Silver',
    'Gold',
    'Platinum',
    'Diamond',
    'Immortal',
    'Radiant'
  ),
  date: Joi.date().iso(),
  futureDate: Joi.date().iso().min('now'),
};

// Schémas d'authentification
const authSchemas = {
  register: Joi.object({
    email: baseSchemas.email.required(),
    password: baseSchemas.password.required(),
    pseudo: baseSchemas.pseudo.required(),
    discord_username: baseSchemas.discord,
    rank: baseSchemas.rank,
    player_type_id: Joi.number().integer().min(1),
  }),

  login: Joi.object({
    email: baseSchemas.email.required(),
    password: Joi.string().required(),
  }),

  verifyEmail: Joi.object({
    token: Joi.string().uuid().required(),
  }),

  forgotPassword: Joi.object({
    email: baseSchemas.email.required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: baseSchemas.password.required(),
  }),
};

// Schémas utilisateurs
const userSchemas = {
  createUser: Joi.object({
    email: baseSchemas.email.required(),
    pseudo: baseSchemas.pseudo.required(),
    discord_username: baseSchemas.discord,
    rank: baseSchemas.rank,
    role_id: Joi.number().integer().min(1).required(),
    player_type_id: Joi.number().integer().min(1),
  }),

  updateUser: Joi.object({
    pseudo: baseSchemas.pseudo,
    discord_username: baseSchemas.discord,
    rank: baseSchemas.rank,
    player_type_id: Joi.number().integer().min(1),
  }),

  updatePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: baseSchemas.password.required(),
  }),
};

// Schémas événements
const eventSchemas = {
  createEvent: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000),
    event_type_id: Joi.number().integer().min(1).required(),
    start_time: baseSchemas.futureDate.required(),
    end_time: baseSchemas.date,
    duration_minutes: Joi.number().integer().min(15).max(480),

    // Récurrence
    is_recurring: Joi.boolean().default(false),
    recurrence_pattern: Joi.string().valid('daily', 'weekly', 'custom'),
    recurrence_interval: Joi.number().integer().min(1).max(365),
    recurrence_days_of_week: Joi.array().items(
      Joi.number().integer().min(1).max(7)
    ),
    recurrence_end_date: baseSchemas.date,

    // Détails session
    maps_played: Joi.array().items(Joi.string().max(50)),
    games_count: Joi.number().integer().min(1).max(20),
    opponent_team_id: Joi.number().integer().min(1),

    // Participants
    participant_ids: Joi.array().items(baseSchemas.uuid),
  }),

  updateEvent: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(1000),
    start_time: baseSchemas.date,
    end_time: baseSchemas.date,
    duration_minutes: Joi.number().integer().min(15).max(480),
    maps_played: Joi.array().items(Joi.string().max(50)),
    games_count: Joi.number().integer().min(1).max(20),
    status: Joi.string().valid('scheduled', 'completed', 'cancelled'),
  }),

  respondToInvitation: Joi.object({
    status: Joi.string().valid('accepted', 'declined').required(),
  }),

  markAttendance: Joi.object({
    user_ids: Joi.array().items(baseSchemas.uuid).required(),
    is_present: Joi.boolean().required(),
  }),
};

// Schémas notes de session
const sessionNoteSchemas = {
  createNote: Joi.object({
    event_id: baseSchemas.uuid.required(),
    target_user_id: baseSchemas.uuid,
    note_type: Joi.string()
      .valid('general', 'individual', 'homework')
      .default('general'),
    title: Joi.string().max(200),
    content: Joi.string().max(2000).required(),
    is_homework: Joi.boolean().default(false),
    due_date: baseSchemas.futureDate,
  }),

  updateNote: Joi.object({
    title: Joi.string().max(200),
    content: Joi.string().max(2000),
    due_date: baseSchemas.date,
  }),
};

// Schémas demandes de practice
const practiceRequestSchemas = {
  createRequest: Joi.object({
    captain_email: baseSchemas.email.required(),
    captain_discord: baseSchemas.discord,
    captain_pseudo: Joi.string().min(2).max(100).required(),
    team_name: Joi.string().min(2).max(100).required(),
    team_average_rank: baseSchemas.rank,
    requested_date: baseSchemas.futureDate.required(),
    alternative_dates: Joi.array().items(baseSchemas.futureDate),
    message: Joi.string().max(500),
  }),

  handleRequest: Joi.object({
    status: Joi.string().valid('accepted', 'declined').required(),
    response: Joi.string().max(500),
  }),
};

// Schémas nominations
const nominationSchemas = {
  createNomination: Joi.object({
    nominated_user_id: baseSchemas.uuid.required(),
  }),

  approveNomination: Joi.object({
    approved: Joi.boolean().required(),
    comment: Joi.string().max(500),
  }),
};

// Schémas de récurrence
const recurrenceSchemas = {
  create: Joi.object({
    event_id: baseSchemas.uuid.required(),
    pattern: Joi.string()
      .valid('daily', 'weekly', 'monthly', 'yearly')
      .required(),
    frequency: Joi.number().integer().min(1).default(1),
    interval: Joi.number().integer().min(1).default(1),
    end_date: baseSchemas.date.required(),
    days_of_week: Joi.array().items(Joi.number().integer().min(0).max(6)),
    day_of_month: Joi.number().integer().min(1).max(31),
    month_of_year: Joi.number().integer().min(1).max(12),
  }),

  update: Joi.object({
    pattern: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly'),
    frequency: Joi.number().integer().min(1),
    interval: Joi.number().integer().min(1),
    end_date: baseSchemas.date,
    days_of_week: Joi.array().items(Joi.number().integer().min(0).max(6)),
    day_of_month: Joi.number().integer().min(1).max(31),
    month_of_year: Joi.number().integer().min(1).max(12),
  }),

  toggle: Joi.object({
    is_active: Joi.boolean().required(),
  }),

  preview: Joi.object({
    event_id: baseSchemas.uuid.required(),
    pattern: Joi.string()
      .valid('daily', 'weekly', 'monthly', 'yearly')
      .required(),
    frequency: Joi.number().integer().min(1).default(1),
    interval: Joi.number().integer().min(1).default(1),
    end_date: baseSchemas.date.required(),
    days_of_week: Joi.array().items(Joi.number().integer().min(0).max(6)),
    day_of_month: Joi.number().integer().min(1).max(31),
    month_of_year: Joi.number().integer().min(1).max(12),
  }),
};

// Schémas de notifications
const notificationSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    message: Joi.string().min(10).max(1000).required(),
    type: Joi.string()
      .valid(
        'info',
        'warning',
        'error',
        'success',
        'event',
        'practice',
        'match'
      )
      .required(),
    user_id: baseSchemas.uuid.required(),
    event_id: baseSchemas.uuid,
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    send_email: Joi.boolean().default(false),
    send_push: Joi.boolean().default(false),
  }),

  bulk: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    message: Joi.string().min(10).max(1000).required(),
    type: Joi.string()
      .valid(
        'info',
        'warning',
        'error',
        'success',
        'event',
        'practice',
        'match'
      )
      .required(),
    user_ids: Joi.array().items(baseSchemas.uuid).min(1).required(),
    event_id: baseSchemas.uuid,
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    send_email: Joi.boolean().default(false),
    send_push: Joi.boolean().default(false),
  }),

  preferences: Joi.object({
    email_notifications: Joi.boolean(),
    push_notifications: Joi.boolean(),
    event_reminders: Joi.boolean(),
    practice_notifications: Joi.boolean(),
    match_notifications: Joi.boolean(),
    system_notifications: Joi.boolean(),
  }),

  schedule: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    message: Joi.string().min(10).max(1000).required(),
    type: Joi.string()
      .valid(
        'info',
        'warning',
        'error',
        'success',
        'event',
        'practice',
        'match'
      )
      .required(),
    user_id: baseSchemas.uuid.required(),
    event_id: baseSchemas.uuid,
    scheduled_for: baseSchemas.futureDate.required(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    send_email: Joi.boolean().default(false),
    send_push: Joi.boolean().default(false),
  }),
};

// Schémas d'analytics
const analyticsSchemas = {
  track: Joi.object({
    event_name: Joi.string().min(3).max(100).required(),
    event_data: Joi.object(),
    user_id: baseSchemas.uuid,
  }),

  report: Joi.object({
    metrics: Joi.array().items(Joi.string()).required(),
    filters: Joi.object(),
    period: Joi.string().valid('1d', '7d', '30d', '90d', '1y').default('7d'),
    group_by: Joi.string(),
    format: Joi.string().valid('json', 'csv').default('json'),
  }),

  export: Joi.object({
    type: Joi.string()
      .valid('users', 'events', 'performance', 'engagement')
      .required(),
    period: Joi.string().valid('1d', '7d', '30d', '90d', '1y').default('30d'),
    format: Joi.string().valid('json', 'csv').default('csv'),
    filters: Joi.object(),
  }),

  alert: Joi.object({
    metric: Joi.string().min(3).max(100).required(),
    condition: Joi.string().valid('gt', 'lt', 'eq', 'gte', 'lte').required(),
    threshold: Joi.number().required(),
    notification_email: baseSchemas.email.required(),
    is_active: Joi.boolean().default(true),
  }),
};

// Schémas d'intégrations
const integrationSchemas = {
  discordMessage: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    embed: Joi.object({
      title: Joi.string().max(256),
      description: Joi.string().max(2048),
      color: Joi.number().integer().min(0).max(16777215),
      fields: Joi.array().items(
        Joi.object({
          name: Joi.string().max(256).required(),
          value: Joi.string().max(1024).required(),
          inline: Joi.boolean().default(false),
        })
      ),
      timestamp: Joi.string().isoDate(),
    }),
  }),

  slackMessage: Joi.object({
    message: Joi.string().min(1).max(3000).required(),
    channel: Joi.string().max(100),
  }),

  notifyEvent: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000),
    type: Joi.string()
      .valid('practice', 'match', 'tournament', 'meeting')
      .required(),
    start_date: baseSchemas.date.required(),
  }),

  sync: Joi.object({
    sync_type: Joi.string().valid('users', 'events', 'stats'),
    options: Joi.object(),
  }),

  config: Joi.object({
    enabled: Joi.boolean().required(),
  }),
};

// Schémas de rôles
const roleSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(500),
    permissions: Joi.array().items(Joi.string()),
    is_active: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(50),
    description: Joi.string().max(500),
    permissions: Joi.array().items(Joi.string()),
    is_active: Joi.boolean(),
  }),

  check: Joi.object({
    user_id: baseSchemas.uuid.required(),
    role_name: Joi.string().min(3).max(50).required(),
  }),
};

// Schémas pour les rapports
const reportingSchemas = {
  // Rapport de présence
  attendanceReport: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    userIds: Joi.array().items(Joi.string()).optional(),
    format: Joi.string().valid('json', 'csv', 'pdf', 'html').default('json'),
  }),

  // Rapport de performance
  performanceReport: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    userIds: Joi.array().items(Joi.string()).optional(),
    format: Joi.string().valid('json', 'csv', 'pdf', 'html').default('json'),
  }),

  // Rapport d'événements
  eventsReport: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    eventTypes: Joi.array().items(Joi.string()).optional(),
    format: Joi.string().valid('json', 'csv', 'pdf', 'html').default('json'),
  }),

  // Rapport d'entraînement
  trainingReport: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    userIds: Joi.array().items(Joi.string()).optional(),
    format: Joi.string().valid('json', 'csv', 'pdf', 'html').default('json'),
  }),

  // Rapport complet
  comprehensiveReport: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    format: Joi.string().valid('json', 'csv', 'pdf', 'html').default('json'),
  }),

  // Rapport personnalisé
  customReport: Joi.object({
    reportType: Joi.string()
      .valid('attendance', 'performance', 'events', 'training', 'comprehensive')
      .required(),
    parameters: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      userIds: Joi.array().items(Joi.string()).optional(),
      eventTypes: Joi.array().items(Joi.string()).optional(),
    }).optional(),
    format: Joi.string().valid('json', 'csv', 'pdf', 'html').default('json'),
  }),

  // Planification de rapport
  scheduleReport: Joi.object({
    reportType: Joi.string()
      .valid('attendance', 'performance', 'events', 'training', 'comprehensive')
      .required(),
    parameters: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      userIds: Joi.array().items(Joi.string()).optional(),
      eventTypes: Joi.array().items(Joi.string()).optional(),
    }).optional(),
    schedule: Joi.object({
      frequency: Joi.string()
        .valid('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
        .required(),
      time: Joi.string()
        .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(), // HH:MM format
      dayOfWeek: Joi.number().integer().min(0).max(6).when('frequency', {
        is: 'weekly',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      dayOfMonth: Joi.number().integer().min(1).max(31).when('frequency', {
        is: 'monthly',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }).required(),
    recipients: Joi.array().items(Joi.string().email()).min(1).required(),
    format: Joi.string().valid('json', 'csv', 'pdf', 'html').default('json'),
  }),
};

module.exports = {
  authSchemas,
  userSchemas,
  eventSchemas,
  sessionNoteSchemas,
  practiceRequestSchemas,
  nominationSchemas,
  recurrenceSchemas,
  notificationSchemas,
  analyticsSchemas,
  integrationSchemas,
  roleSchemas,
  reportingSchemas,
  // Structure imbriquée pour compatibilité
  schemas: {
    auth: authSchemas,
    user: userSchemas,
    event: eventSchemas,
    sessionNote: sessionNoteSchemas,
    practiceRequest: practiceRequestSchemas,
    nomination: nominationSchemas,
    recurrence: recurrenceSchemas,
    notification: notificationSchemas,
    analytics: analyticsSchemas,
    integration: integrationSchemas,
    role: roleSchemas,
    reporting: reportingSchemas,
  },
  baseSchemas,
};
