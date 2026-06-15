import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(
      signupDto.email,
      signupDto.password,
      signupDto.name,
    );
  }

  @ApiOperation({ summary: 'Login user and get JWT tokens' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: any) {
    const ipAddress = request.ip;
    const deviceFingerprint =
      loginDto.deviceFingerprint || request.headers['user-agent'] || 'unknown';
    return this.authService.login(
      loginDto.email,
      loginDto.password,
      deviceFingerprint,
      ipAddress,
    );
  }

  @ApiOperation({ summary: 'Logout and revoke current refresh token session' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Body() body: RefreshTokenDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.authService.logout(body.refreshToken, userId);
  }

  @ApiOperation({ summary: 'Rotate JWT tokens using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully' })
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @ApiOperation({ summary: 'Verify user email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @ApiOperation({ summary: 'Initiate password reset' })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  @ApiOperation({ summary: 'Complete password reset' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
  }

  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser('userId') userId: string) {
    return this.authService.getSessions(userId);
  }

  @ApiOperation({ summary: 'Revoke an active session' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('sessions/:sessionId/revoke')
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.authService.revokeSession(sessionId, userId);
  }
}
