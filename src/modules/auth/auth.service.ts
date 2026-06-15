import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { UserSession } from '../../database/entities/user-session.entity';
import { AuditService } from '../audit/audit.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectQueue('email.queue')
    private readonly emailQueue: Queue,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async signup(email: string, passwordPlain: string, name: string) {
    const user = await this.usersService.createUser(email, passwordPlain, name);

    // Generate verification code (mock)
    const verificationCode = crypto.randomBytes(16).toString('hex');

    // Enqueue email verification job
    await this.emailQueue.add('send-verification', {
      email,
      name,
      code: verificationCode,
    });

    await this.auditService.log('SIGNUP', user.id, { email });
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      message: 'Registration successful. Verification email enqueued.',
    };
  }

  async login(
    email: string,
    passwordPlain: string,
    deviceFingerprint?: string,
    ipAddress?: string,
  ) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password || '');
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id, user.email);

    // Parse refresh token to obtain expiration date
    const decodedRefresh = this.jwtService.decode(refreshToken);
    const expiresAt = new Date(decodedRefresh.exp * 1000);

    // Create session in database
    const session = this.sessionRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      deviceFingerprint,
      ipAddress,
      expiresAt,
      isRevoked: false,
    });
    const savedSession = await this.sessionRepository.save(session);

    // Audit log
    await this.auditService.log('LOGIN', user.id, {
      deviceFingerprint,
      ipAddress,
      sessionId: savedSession.id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    };
  }

  async logout(refreshToken: string, userId: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.sessionRepository.findOne({
      where: { tokenHash, userId },
    });
    if (session) {
      session.isRevoked = true;
      await this.sessionRepository.save(session);
    }
    await this.auditService.log('LOGOUT', userId, { tokenHash });
    return { success: true, message: 'Logged out successfully' };
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token signature');
    }

    const tokenHash = this.hashToken(refreshToken);

    // Look up session
    const session = await this.sessionRepository.findOne({
      where: { userId: payload.userId, isRevoked: false },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found or revoked');
    }

    // Reuse detection
    if (session.tokenHash !== tokenHash) {
      // Token mismatch! This token was already used or stolen. Revoke all sessions for the user.
      await this.sessionRepository.update(
        { userId: payload.userId },
        { isRevoked: true },
      );
      await this.auditService.log('SECURITY_ALERT', payload.userId, {
        message: 'Refresh token reuse detected. Revoked all user sessions.',
        tokenHash,
      });
      throw new ForbiddenException(
        'Security alert: session compromised. Please login again.',
      );
    }

    // Session is valid. Generate new tokens.
    const newAccessToken = await this.generateAccessToken(
      payload.userId,
      payload.email,
    );
    const newRefreshToken = await this.generateRefreshToken(
      payload.userId,
      payload.email,
    );

    // Decode and update session details
    const decodedRefresh = this.jwtService.decode(newRefreshToken);
    session.tokenHash = this.hashToken(newRefreshToken);
    session.expiresAt = new Date(decodedRefresh.exp * 1000);
    await this.sessionRepository.save(session);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async revokeSession(sessionId: string, userId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new BadRequestException('Session not found');
    }
    session.isRevoked = true;
    await this.sessionRepository.save(session);
    await this.auditService.log('SESSION_REVOKED', userId, { sessionId });
    return { success: true, message: 'Session revoked successfully' };
  }

  async getSessions(userId: string) {
    return this.sessionRepository.find({
      where: { userId, isRevoked: false },
      order: { updatedAt: 'DESC' },
    });
  }

  async verifyEmail(email: string, code: string) {
    // Mock verify token logic (in production you would look up verification token in redis or table)
    if (code.length < 8) {
      throw new BadRequestException('Invalid email verification code');
    }

    await this.usersService.setVerified(email);
    const user = await this.usersService.findByEmail(email);
    if (user) {
      await this.auditService.log('EMAIL_VERIFIED', user.id, { email });
    }
    return { success: true, message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // For security, don't expose if user exists
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    const resetCode = crypto.randomBytes(16).toString('hex');
    // Enqueue password reset email job
    await this.emailQueue.add('send-password-reset', {
      email,
      code: resetCode,
    });

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(email: string, code: string, passwordPlain: string) {
    // Mock code verification
    if (code.length < 8) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    // Explicit update
    await this.usersService.updateProfile(user.id, {}); // just standard, let's update password

    // In production we would save the password on user entity. Let's add password update capability or do it directly.
    const userRepo = this.sessionRepository.manager.getRepository('User');
    await userRepo.update({ id: user.id }, { password: passwordHash });

    await this.auditService.log('PASSWORD_RESET', user.id, { email });

    return { success: true, message: 'Password has been reset successfully' };
  }

  private async generateAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { userId, email },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<any>('jwt.accessExpiration'),
      },
    );
  }

  private async generateRefreshToken(
    userId: string,
    email: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { userId, email },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<any>('jwt.refreshExpiration'),
      },
    );
  }
}
