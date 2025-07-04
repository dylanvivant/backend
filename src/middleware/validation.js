// ========================================
// VALIDATION MIDDLEWARE
// src/middleware/validation.js
// ========================================
const Joi = require('joi');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Données de validation invalides',
        errors,
      });
    }

    // Remplacer les données par les valeurs validées et nettoyées
    req[property] = value;
    next();
  };
};

// Validation des paramètres UUID
const validateUuidParam = (paramName = 'id') => {
  return validate(
    Joi.object({
      [paramName]: Joi.string().uuid().required(),
    }),
    'params'
  );
};

// Validation des query parameters pour la pagination
const validatePagination = validate(
  Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().max(50).default('created_at'),
  }),
  'query'
);

module.exports = {
  validate,
  validateSchema: validate, // Alias pour validateSchema
  validateUuidParam,
  validatePagination,
};
