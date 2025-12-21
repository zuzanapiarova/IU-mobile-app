const request = require('supertest');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load [.env](http://_vscodecontentref_/3)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TEST_USER_ID = 1;

// Generate a valid JWT that matches the server's secret and expiry
const token = jwt.sign(
  { sub: TEST_USER_ID, email: 'test@example.com' },
  process.env.JWT_SECRET || 'dev-secret-change-me',
  { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
);

// Ensure env is present
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET missing. Ensure [.env](http://_vscodecontentref_/4) is loaded.');
}

// Mock Prisma client
const mockUser = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};
const mockHabit = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};
const mockHabitCompletion = {
  upsert: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  findFirst: jest.fn(),
};

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: mockUser,
      habit: mockHabit,
      habitCompletion: mockHabitCompletion,
    })),
  };
});

// Now import your app after mocking Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { app } = require('../src/server');

describe('API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const mockUsers = [{ id: TEST_USER_ID, name: 'Alice', email: 'alice@test.com' }];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUsers);
    });

    it('should handle errors', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('POST /users (signup)', () => {
    it('should create a new user and return { user, token }', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const hashed = 'hashed-password';
      bcrypt.hash = jest.fn().mockResolvedValue(hashed);
      prisma.user.create.mockResolvedValue({ id: TEST_USER_ID, name: 'Bob', email: 'bob@test.com', password: hashed });

      const res = await request(app)
        .post('/users')
        .send({ name: 'Bob', email: 'bob@test.com', password: '123456' });

      expect(res.status).toBe(201);
      expect(res.body.user).toEqual({ id: TEST_USER_ID, name: 'Bob', email: 'bob@test.com' });
      expect(typeof res.body.token).toBe('string');
    });

    it('should return 400 if email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: TEST_USER_ID, email: 'bob@test.com' });

      const res = await request(app)
        .post('/users')
        .send({ name: 'Bob', email: 'bob@test.com', password: '123456' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Email already exists' });
    });
  });

  describe('POST /login', () => {
    it('should login user and return { user, token }', async () => {
      const hashed = 'hashed-password';
      prisma.user.findUnique.mockResolvedValue({ id: TEST_USER_ID, email: 'bob@test.com', password: hashed });
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const res = await request(app)
        .post('/login')
        .send({ email: 'bob@test.com', password: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({ id: TEST_USER_ID, email: 'bob@test.com' });
      expect(typeof res.body.token).toBe('string');
    });

    it('should fail login with invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: TEST_USER_ID, email: 'bob@test.com', password: 'hashed' });
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const res = await request(app)
        .post('/login')
        .send({ email: 'bob@test.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid credentials' });
    });
  });

  describe('GET /habits', () => {
    it('should return habits for a user', async () => {
      const mockHabits = [{ id: 1, name: 'Exercise', userId: TEST_USER_ID }];
      prisma.habit.findMany.mockResolvedValue(mockHabits);

      const res = await request(app)
        .get('/habits')
        .query({ userId: TEST_USER_ID })
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockHabits);
    });

    it('should return 403 if userId mismatches token', async () => {
      const res = await request(app)
        .get('/habits')
        .query({ userId: 999 })
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden' });
    });
  });

  describe('POST /habits', () => {
    it('should create a new habit', async () => {
      const mockHabit = { id: 1, name: 'Read', frequency: 'daily', userId: TEST_USER_ID };
      prisma.habit.create.mockResolvedValue(mockHabit);
      prisma.habitCompletion.upsert.mockResolvedValue({ habitId: 1, date: '2025-11-17', status: false });

      const res = await request(app)
        .post('/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Read', frequency: 'daily', userId: TEST_USER_ID });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockHabit);
    });
  });
});