import { Injectable } from '@nestjs/common';
import { UserRole, type User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** User row without sensitive hash fields for API responses. */
export type UserPublic = Omit<User, 'passwordHash'>;

/**
 * Persists users and loads credentials for authentication.
 */
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalizes email for storage and lookup (trim + lowercase).
   */
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Finds a user by email including `passwordHash` (for login verification only).
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email },
    });
  }

  /**
   * Creates a user with an already-hashed password.
   */
  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<UserPublic> {
    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email: this.normalizeEmail(input.email),
        passwordHash: input.passwordHash,
        role: input.role,
      },
    });
    return this.toPublic(user);
  }

  private toPublic(user: User): UserPublic {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
