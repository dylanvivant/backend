const Joi = require('joi');
const { AppError } = require('../utils/helpers');

class ValidationService {
  /**
   * Valider les données avec un schéma Joi
   */
  static async validateData(data, schema) {
    try {
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        throw new AppError('Données invalides', 400, details);
      }

      return value;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erreur lors de la validation', 500);
    }
  }

  /**
   * Valider un email
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider un mot de passe
   */
  static validatePassword(password) {
    // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Valider une URL
   */
  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valider un numéro de téléphone
   */
  static validatePhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Valider une date
   */
  static validateDate(date) {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  /**
   * Valider que la date est dans le futur
   */
  static validateFutureDate(date) {
    const parsedDate = new Date(date);
    return parsedDate > new Date();
  }

  /**
   * Valider que la date est dans le passé
   */
  static validatePastDate(date) {
    const parsedDate = new Date(date);
    return parsedDate < new Date();
  }

  /**
   * Valider un UUID
   */
  static validateUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Valider une plage de dates
   */
  static validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  }

  /**
   * Nettoyer et valider du texte
   */
  static sanitizeText(text, maxLength = 255) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text.trim().slice(0, maxLength).replace(/[<>]/g, ''); // Supprimer les balises HTML basiques
  }

  /**
   * Valider un objet avec des règles personnalisées
   */
  static validateObject(obj, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = obj[field];

      if (
        rule.required &&
        (value === undefined || value === null || value === '')
      ) {
        errors.push({
          field,
          message: `Le champ ${field} est requis`,
        });
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rule.type === 'string' && typeof value !== 'string') {
          errors.push({
            field,
            message: `Le champ ${field} doit être une chaîne de caractères`,
          });
        }

        if (rule.type === 'number' && typeof value !== 'number') {
          errors.push({
            field,
            message: `Le champ ${field} doit être un nombre`,
          });
        }

        if (rule.type === 'email' && !this.validateEmail(value)) {
          errors.push({
            field,
            message: `Le champ ${field} doit être un email valide`,
          });
        }

        if (rule.type === 'url' && !this.validateUrl(value)) {
          errors.push({
            field,
            message: `Le champ ${field} doit être une URL valide`,
          });
        }

        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field,
            message: `Le champ ${field} doit contenir au moins ${rule.minLength} caractères`,
          });
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field,
            message: `Le champ ${field} ne peut pas contenir plus de ${rule.maxLength} caractères`,
          });
        }

        if (rule.min && value < rule.min) {
          errors.push({
            field,
            message: `Le champ ${field} doit être supérieur ou égal à ${rule.min}`,
          });
        }

        if (rule.max && value > rule.max) {
          errors.push({
            field,
            message: `Le champ ${field} doit être inférieur ou égal à ${rule.max}`,
          });
        }

        if (rule.enum && !rule.enum.includes(value)) {
          errors.push({
            field,
            message: `Le champ ${field} doit être l'une des valeurs suivantes: ${rule.enum.join(
              ', '
            )}`,
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new AppError('Données invalides', 400, errors);
    }

    return true;
  }

  /**
   * Valider les données d'un utilisateur
   */
  static validateUserData(userData) {
    const rules = {
      email: {
        required: true,
        type: 'email',
      },
      username: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 50,
      },
      password: {
        required: true,
        type: 'string',
        minLength: 8,
      },
      role: {
        required: true,
        type: 'string',
        enum: ['Capitaine', 'player', 'coach'],
      },
    };

    return this.validateObject(userData, rules);
  }

  /**
   * Valider les données d'un événement
   */
  static validateEventData(eventData) {
    const rules = {
      title: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 100,
      },
      description: {
        required: false,
        type: 'string',
        maxLength: 500,
      },
      start_date: {
        required: true,
        type: 'string',
      },
      end_date: {
        required: true,
        type: 'string',
      },
      type: {
        required: true,
        type: 'string',
        enum: ['practice', 'match', 'tournament', 'meeting'],
      },
      status: {
        required: false,
        type: 'string',
        enum: ['draft', 'published', 'cancelled'],
      },
    };

    return this.validateObject(eventData, rules);
  }

  /**
   * Créer un schéma Joi personnalisé
   */
  static createJoiSchema(fields) {
    const schema = {};

    for (const [field, options] of Object.entries(fields)) {
      let validator;

      switch (options.type) {
        case 'string':
          validator = Joi.string();
          break;
        case 'number':
          validator = Joi.number();
          break;
        case 'boolean':
          validator = Joi.boolean();
          break;
        case 'date':
          validator = Joi.date();
          break;
        case 'email':
          validator = Joi.string().email();
          break;
        case 'uuid':
          validator = Joi.string().uuid();
          break;
        default:
          validator = Joi.any();
      }

      if (options.required) {
        validator = validator.required();
      } else {
        validator = validator.optional();
      }

      if (options.min) {
        validator = validator.min(options.min);
      }

      if (options.max) {
        validator = validator.max(options.max);
      }

      if (options.enum) {
        validator = validator.valid(...options.enum);
      }

      schema[field] = validator;
    }

    return Joi.object(schema);
  }
}

module.exports = ValidationService;
