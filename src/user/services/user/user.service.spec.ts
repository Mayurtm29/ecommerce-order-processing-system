import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  describe('normalizeEmail', () => {
    it('trims and lowercases email', () => {
      expect(service.normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com');
    });
  });

  describe('findByEmail', () => {
    it('delegates to prisma.user.findUnique', async () => {
      const row = { id: 1, email: 'a@b.com' };
      prisma.user.findUnique.mockResolvedValue(row);
      const actualUser = await service.findByEmail('a@b.com');
      expect(actualUser).toBe(row);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
    });
  });

  describe('createUser', () => {
    it('creates user and returns public shape without passwordHash', async () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      prisma.user.create.mockResolvedValue({
        id: 5,
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
        role: UserRole.USER,
        createdAt,
        updatedAt,
      });
      const actualPublic = await service.createUser({
        name: '  Test User  ',
        email: 'Test@Example.com',
        passwordHash: 'hash',
        role: UserRole.USER,
      });
      expect(actualPublic).toEqual({
        id: 5,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.USER,
        createdAt,
        updatedAt,
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          passwordHash: 'hash',
          role: UserRole.USER,
        },
      });
    });
  });
});
