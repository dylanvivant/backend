// ========================================
// TESTS SETUP SIMPLE
// src/tests/setup.js
// ========================================

require('dotenv').config({ path: '.env.test' });

// Configuration globale pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';

// Timeout global pour les tests
jest.setTimeout(30000);

// Setup avant tous les tests
beforeAll(() => {
  // Configuration globale
});

// Nettoyage après tous les tests
afterAll(() => {
  // Nettoyage
});

// Setup avant chaque test
beforeEach(() => {
  // Réinitialisation avant chaque test
});

// Nettoyage après chaque test
afterEach(() => {
  // Nettoyage après chaque test
});
