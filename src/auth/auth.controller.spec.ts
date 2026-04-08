import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { signUp: jest.Mock; login: jest.Mock };

  beforeEach(async () => {
    authService = { signUp: jest.fn(), login: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  describe('signUp', () => {
    it('returns UserResponseDto shape from created user', async () => {
      const createdAt = new Date('2026-03-01T00:00:00.000Z');
      const updatedAt = new Date('2026-03-02T00:00:00.000Z');
      authService.signUp.mockResolvedValue({
        id: 3,
        name: 'Bob',
        email: 'bob@example.com',
        role: UserRole.USER,
        createdAt,
        updatedAt,
      });
      const dto = {
        name: 'Bob',
        email: 'bob@example.com',
        password: 'Secret123!',
      };
      const actualDto = await controller.signUp(dto);
      expect(authService.signUp).toHaveBeenCalledWith(dto);
      expect(actualDto).toEqual({
        id: 3,
        name: 'Bob',
        email: 'bob@example.com',
        role: UserRole.USER,
        createdAt,
        updatedAt,
      });
    });
  });

  describe('login', () => {
    it('delegates to AuthService.login', async () => {
      const expected = { access_token: 'jwt' };
      authService.login.mockResolvedValue(expected);
      const dto = { email: 'bob@example.com', password: 'Secret123!' };
      const actualResult = await controller.login(dto);
      expect(actualResult).toBe(expected);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });
});
