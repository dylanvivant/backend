// ========================================
// HELPER FUNCTIONS
// src/utils/helpers.js
// ========================================
const generateRandomPassword = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  // Assurer qu'on a au moins : 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

  // Compléter avec des caractères aléatoires
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Mélanger le mot de passe
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

module.exports = {
  generateRandomPassword,
};
