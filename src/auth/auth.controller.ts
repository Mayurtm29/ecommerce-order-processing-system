import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { authRouteThrottle } from '../config/throttle-options';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';

/**
 * Public authentication endpoints (sign-up and login).
 */
@ApiTags('Authentication')
@Throttle({ default: authRouteThrottle })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (role USER)' })
  @ApiBody({ type: SignUpDto })
  @ApiCreatedResponse({
    description: 'User created (password never returned)',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async signUp(@Body() dto: SignUpDto): Promise<UserResponseDto> {
    const user = await this.authService.signUp(dto);
    return UserResponseDto.fromUser(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtain a JWT access token' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Bearer token for Authorization header',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(dto);
  }
}
