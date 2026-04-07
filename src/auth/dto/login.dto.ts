import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Request body for POST /auth/login.
 */
export class LoginDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
