// ========================================
// TESTS SIMPLES - VALIDATION
// src/tests/validation.test.js
// ========================================

const request = require('supertest');
const app = require('../../app');

describe('API Validation Tests', () => {
  describe('Server Health', () => {
    test('GET /health should return OK', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.message).toBe('Serveur opérationnel');
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      test('should return 400 for invalid email', async () => {
        const response = await request(app).post('/api/auth/register').send({
          email: 'invalid-email',
          password: 'ValidPassword123',
          pseudo: 'TestUser',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      test('should return 400 for weak password', async () => {
        const response = await request(app).post('/api/auth/register').send({
          email: 'test@example.com',
          password: 'weak',
          pseudo: 'TestUser',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should return 400 for missing required fields', async () => {
        const response = await request(app).post('/api/auth/register').send({
          email: 'test@example.com',
          // missing password and pseudo
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/auth/login', () => {
      test('should return 400 for invalid email', async () => {
        const response = await request(app).post('/api/auth/login').send({
          email: 'invalid-email',
          password: 'password123',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should return 400 for missing password', async () => {
        const response = await request(app).post('/api/auth/login').send({
          email: 'test@example.com',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/auth/profile', () => {
      test('should return 401 without token', async () => {
        const response = await request(app).get('/api/auth/profile');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Token');
      });

      test('should return 401 with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
