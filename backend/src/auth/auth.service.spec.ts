import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// Mocking the whole bcrypt module means bcrypt.compare never actually runs
// the real (slow, CPU-bound) hashing algorithm — we just control its return value.
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { create: jest.Mock; findByEmail: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const mockUser = {
    id: 'user-id-1',
    email: 'test@test.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    role: Role.EMPLOYEE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Fresh fake UsersService/JwtService for every test — no shared state between tests.
    usersService = { create: jest.fn(), findByEmail: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('always creates the user with role EMPLOYEE, regardless of what was requested', async () => {
      // Arrange
      const dto = {
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };
      usersService.create.mockResolvedValue({ ...mockUser, ...dto });

      // Act
      await authService.register(dto);

      // Assert — the security-critical behavior: public registration can never
      // self-assign a role, so we assert EMPLOYEE was forced regardless of input.
      expect(usersService.create).toHaveBeenCalledWith({ ...dto, role: Role.EMPLOYEE });
    });

    it('returns a signed access token and the created user', async () => {
      usersService.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: mockUser.email,
        password: 'password123',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when no user exists with that email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@test.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: mockUser.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns a signed access token when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: mockUser.email,
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });
});
