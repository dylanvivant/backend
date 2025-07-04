const errorHandler = (err, req, res, next) => {
  console.error('Erreur:', err);

  // Erreur de validation Joi
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: err.details.map((detail) => detail.message),
    });
  }

  // Erreur Supabase
  if (err.code) {
    return res.status(400).json({
      success: false,
      message: 'Erreur base de données',
      error: err.message,
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide',
    });
  }

  // Erreur par défaut
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Erreur serveur interne'
        : err.message,
  });
};

module.exports = errorHandler;
