import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserService, type UserPublic } from '../../../user/services/user/user.service';
import type { SignUpDto } from '../../dto/sign-up.dto';
import type { LoginDto } from '../../dto/login.dto';
import type { JwtPayload } from '../../jwt.strategy';
import { ConfigService } from '@nestjs/config';

/**
 * Registration and JWT issuance.
 */
@Injectable()
export class AuthService {
  private readonly bcryptSaltRounds: number;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const bcryptSaltRounds = this.configService.get('BCRYPT_SALT_ROUNDS');
    this.bcryptSaltRounds = bcryptSaltRounds
      ? Number.parseInt(bcryptSaltRounds)
      : 12;
  }

  /**
   * Registers a new user with role USER and returns a safe user projection.
   */
  async signUp(dto: SignUpDto): Promise<UserPublic> {
    const email = this.userService.normalizeEmail(dto.email);
    const existing = await this.userService.findByEmail(email);
    if (existing !== null) {
      throw new ConflictException('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, this.bcryptSaltRounds);
    return this.userService.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: UserRole.USER,
    });
  }

  /**
   * Verifies credentials and returns a signed JWT access token.
   */
  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const email = this.userService.normalizeEmail(dto.email);
    const user = await this.userService.findByEmail(email);
    if (user === null) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
