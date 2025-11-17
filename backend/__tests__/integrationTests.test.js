const request = require('supertest');
const bcrypt = require('bcrypt');

// ! to test the error-handling paths, tests trigger catch block in real route handler, so Jest prints the console.error, even though the test passes because it expects the error

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
const { app } = require('../server');

describe('API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const mockUsers = [{ id: 1, name: 'Alice', email: 'alice@test.com' }];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      const res = await request(app).get('/users');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUsers);
    });

    it('should handle errors', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/users');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('POST /users (signup)', () => {
    it('should create a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const hashed = 'hashed-password';
      bcrypt.hash = jest.fn().mockResolvedValue(hashed);
      prisma.user.create.mockResolvedValue({ id: 1, name: 'Bob', email: 'bob@test.com', password: hashed });

      const res = await request(app)
        .post('/users')
        .send({ name: 'Bob', email: 'bob@test.com', password: '123456' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 1, name: 'Bob', email: 'bob@test.com' });
    });

    it('should return 400 if email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'bob@test.com' });

      const res = await request(app)
        .post('/users')
        .send({ name: 'Bob', email: 'bob@test.com', password: '123456' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Email already exists' });
    });
  });

  describe('POST /login', () => {
    it('should login user with valid credentials', async () => {
      const hashed = 'hashed-password';
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'bob@test.com', password: hashed });
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const res = await request(app)
        .post('/login')
        .send({ email: 'bob@test.com', password: '123456' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, email: 'bob@test.com' });
    });

    it('should fail login with invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'bob@test.com', password: 'hashed' });
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const res = await request(app)
        .post('/login')
        .send({ email: 'bob@test.com', password: 'wrong' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid credentials' });
    });
  });

  describe('GET /habits', () => {
    it('should return habits for a user', async () => {
      const mockHabits = [{ id: 1, name: 'Exercise', userId: 1 }];
      prisma.habit.findMany.mockResolvedValue(mockHabits);

      const res = await request(app).get('/habits').query({ userId: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockHabits);
    });

    it('should return 400 if userId missing', async () => {
      const res = await request(app).get('/habits');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'User is required to be logged in' });
    });
  });

  describe('POST /habits', () => {
    it('should create a new habit', async () => {
      const mockHabit = { id: 1, name: 'Read', frequency: 'daily', userId: 1 };
      prisma.habit.create.mockResolvedValue(mockHabit);
      prisma.habitCompletion.upsert.mockResolvedValue({ habitId: 1, date: '2025-11-17', status: false });

      const res = await request(app)
        .post('/habits')
        .send({ name: 'Read', frequency: 'daily', userId: 1 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockHabit);
    });
  });
});