// ========================================
// HELPERS UTILITIES
// src/utils/helpers.js
// ========================================

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Formater une réponse de succès
 * Cette fonction retourne seulement un objet, elle ne manipule pas res
 */
const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Formater une réponse d'erreur
 * Cette fonction retourne seulement un objet, elle ne manipule pas res
 */
const errorResponse = (message, error = null) => {
  return {
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : null,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Valider un email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Générer un mot de passe aléatoire
 */
const generateRandomPassword = (length = 12) => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Nettoyer les données sensibles d'un objet utilisateur
 */
const sanitizeUser = (user) => {
  if (!user) return null;

  const {
    password,
    email_verification_token,
    reset_password_token,
    ...sanitized
  } = user;
  return sanitized;
};

/**
 * Paginer des résultats
 */
const paginate = (data, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const paginatedData = data.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: {
      current_page: parseInt(page),
      per_page: parseInt(limit),
      total: data.length,
      total_pages: Math.ceil(data.length / limit),
      has_next: page * limit < data.length,
      has_prev: page > 1,
    },
  };
};

/**
 * Valider les paramètres de pagination
 */
const validatePagination = (page, limit) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

  return {
    page: validatedPage,
    limit: validatedLimit,
    offset: (validatedPage - 1) * validatedLimit,
  };
};

/**
 * Formater une date en français
 */
const formatDateFR = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formater une heure en français
 */
const formatTimeFR = (date) => {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculer la différence en jours entre deux dates
 */
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);

  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

/**
 * Vérifier si une date est dans le futur
 */
const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * Générer un slug à partir d'un texte
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9 -]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Éviter les tirets multiples
    .trim('-'); // Supprimer les tirets en début/fin
};

/**
 * Extraire les initiales d'un nom
 */
const getInitials = (name) => {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};

/**
 * Valider un numéro de téléphone français
 */
const isValidPhoneFR = (phone) => {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
};

/**
 * Masquer partiellement un email
 */
const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername =
    username.charAt(0) +
    '*'.repeat(username.length - 2) +
    username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

/**
 * Calculer l'âge à partir d'une date de naissance
 */
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Formater une taille de fichier
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Générer un token aléatoire
 */
const generateToken = (length = 32) => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return token;
};

/**
 * Débouncer une fonction
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle une fonction
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

module.exports = {
  AppError,
  successResponse,
  errorResponse,
  isValidEmail,
  generateRandomPassword,
  sanitizeUser,
  paginate,
  validatePagination,
  formatDateFR,
  formatTimeFR,
  daysBetween,
  isFutureDate,
  generateSlug,
  getInitials,
  isValidPhoneFR,
  maskEmail,
  calculateAge,
  formatFileSize,
  generateToken,
  debounce,
  throttle,
};
