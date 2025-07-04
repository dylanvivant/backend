// ========================================
// TESTS D'AUTHENTIFICATION
// src/tests/auth.test.js
// ========================================

const request = require('supertest');
const app = require('../../app');

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    test('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should validate email format', async () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'ValidPassword123',
        pseudo: 'TestUser',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate password complexity', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'simple', // Ne respecte pas les critères
        pseudo: 'TestUser',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should validate required fields', async () => {
      const invalidData = {
        email: 'test@example.com',
        // missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate email format', async () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should require authentication', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate refresh token format', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    test('should validate token format', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'not-a-uuid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Server Health', () => {
  test('GET /health should return OK', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.message).toBe('Serveur opérationnel');
  });
});
