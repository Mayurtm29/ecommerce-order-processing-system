import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/** Minimum password length for sign-up. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Request body for POST /auth/sign-up.
 */
export class SignUpDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'hunter2hunter', minLength: MIN_PASSWORD_LENGTH })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password: string;
}
