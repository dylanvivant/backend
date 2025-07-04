// ========================================
// TESTS SETUP
// src/tests/setup.js
// ========================================

require('dotenv').config({ path: '.env.test' });

// Configuration globale pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_KEY = 'test-key-for-testing';

// Timeout global pour les tests
jest.setTimeout(30000);

// Mock de Supabase pour éviter les vraies connexions
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
  connectSupabase: jest.fn(() => Promise.resolve()),
}));

// Mock du service email
jest.mock('../services/emailService', () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve()),
  sendEventInvitation: jest.fn(() => Promise.resolve()),
  sendTemporaryPassword: jest.fn(() => Promise.resolve()),
}));

// Mock des modèles pour les tests
jest.mock('../models', () => ({
  User: {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    verifyEmail: jest.fn(),
    verifyPassword: jest.fn(),
  },
}));

// Mocks globaux si nécessaire
beforeAll(() => {
  // Setup avant tous les tests
});

afterAll(() => {
  // Nettoyage après tous les tests
});

beforeEach(() => {
  // Setup avant chaque test
  jest.clearAllMocks();
});

afterEach(() => {
  // Nettoyage après chaque test
});
