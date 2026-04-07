import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { createJwtModuleOptions } from './jwt-module.factory';
import { JwtStrategy } from './jwt.strategy';
import { AdminGuard } from './guards/admin.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Authentication: sign-up, login, JWT validation strategy.
 */
@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: createJwtModuleOptions,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, AdminGuard],
  exports: [JwtModule, PassportModule, JwtStrategy, RolesGuard, AdminGuard],
})
export class AuthModule {}
