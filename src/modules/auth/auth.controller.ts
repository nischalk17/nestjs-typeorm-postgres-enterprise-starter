import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiValidationResponse, GetUser, Public } from 'src/common/decorators';
import { JwtRefreshGuard } from 'src/common/guards';
import type { AuthenticatedUser } from 'src/common/interfaces/request-with-user.interface';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates the user and immediately issues an access/refresh token pair (auto-login on signup).',
  })
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'User registered, tokens issued.' })
  @ApiConflictResponse({ description: 'Email already registered.' })
  @ApiValidationResponse()
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Log in with email and password' })
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Login successful, tokens issued.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiValidationResponse()
  login(@Body() dto: LoginUserDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: 'Exchange a refresh token for a new token pair',
    description:
      'Send the refresh token as a Bearer token (not the access token). Rotates the stored refresh-token hash.',
  })
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'New access/refresh token pair issued.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or revoked refresh token.' })
  refresh(@GetUser() user: AuthenticatedUser) {
    return this.authService.refreshTokens(user.id);
  }

  @ApiOperation({
    summary: 'Log out',
    description: 'Revokes the stored refresh-token hash for the current user.',
  })
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Refresh token revoked.' })
  logout(@GetUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id);
  }
}
