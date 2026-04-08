import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    normalizeEmail: jest.Mock;
    findByEmail: jest.Mock;
    createUser: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    userService = {
      normalizeEmail: jest.fn((email: string) => email.trim().toLowerCase()),
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };
    configService = { get: jest.fn().mockReturnValue(undefined) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('signUp', () => {
    it('throws ConflictException when email is already registered', async () => {
      userService.findByEmail.mockResolvedValue({ id: 1 });
      await expect(
        service.signUp({
          name: 'N',
          email: 'exists@example.com',
          password: 'secret',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('hashes password and creates USER', async () => {
      userService.findByEmail.mockResolvedValue(null);
      const created = {
        id: 2,
        name: 'Ada',
        email: 'ada@example.com',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userService.createUser.mockResolvedValue(created);
      const actualUser = await service.signUp({
        name: 'Ada',
        email: 'Ada@Example.com',
        password: 'password123',
      });
      expect(actualUser).toBe(created);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(userService.createUser).toHaveBeenCalledWith({
        name: 'Ada',
        email: 'Ada@Example.com',
        passwordHash: 'hashed-password',
        role: UserRole.USER,
      });
    });

    it('uses BCRYPT_SALT_ROUNDS from config when set', async () => {
      const customConfig = {
        get: jest.fn((key: string) =>
          key === 'BCRYPT_SALT_ROUNDS' ? '10' : undefined,
        ),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: UserService, useValue: userService },
          { provide: JwtService, useValue: jwtService },
          { provide: ConfigService, useValue: customConfig },
        ],
      }).compile();
      const customService = module.get<AuthService>(AuthService);
      userService.findByEmail.mockResolvedValue(null);
      userService.createUser.mockResolvedValue({
        id: 3,
        name: 'B',
        email: 'b@b.com',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await customService.signUp({
        name: 'B',
        email: 'b@b.com',
        password: 'secret',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when user does not exist', async () => {
      userService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nope@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password does not match', async () => {
      userService.findByEmail.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        passwordHash: 'stored',
        role: UserRole.USER,
        name: 'U',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);
      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('returns access_token when credentials are valid', async () => {
      const user = {
        id: 9,
        email: 'a@b.com',
        passwordHash: 'stored',
        role: UserRole.USER,
        name: 'U',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userService.findByEmail.mockResolvedValue(user);
      jest.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
      const actualResult = await service.login({
        email: 'a@b.com',
        password: 'ok',
      });
      expect(actualResult).toEqual({ access_token: 'signed-jwt' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 9,
        email: 'a@b.com',
        role: UserRole.USER,
      });
    });

    it('looks up user by normalized lowercase email', async () => {
      userService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: '  User@Example.COM ', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userService.normalizeEmail).toHaveBeenCalledWith('  User@Example.COM ');
      expect(userService.findByEmail).toHaveBeenCalledWith('user@example.com');
    });
  });
});
