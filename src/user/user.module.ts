import { Module } from '@nestjs/common';
import { UserService } from './user.service';

/**
 * User persistence; exports {@link UserService} for {@link AuthModule}.
 */
@Module({
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
