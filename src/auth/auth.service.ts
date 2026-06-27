import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { CryptoUtils } from '../common/utils/crypto.utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    message: string;
    data: { user: User; accessToken: string; refreshToken: string };
  }> {
    const result = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
    });

    return {
      message: 'User registered successfully',
      data: {
        user: result.data,
        ...this.generateToken(result.data),
      },
    };
  }

  async login(loginDto: LoginDto): Promise<{
    message: string;
    data: { user: User; accessToken: string; refreshToken: string };
  }> {
    const user = await this.userService.findByEmailRaw(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      message: 'Login successful',
      data: {
        user,
        ...this.generateToken(user),
      },
    };
  }

  private generateToken(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    if (!refreshSecret) {
      throw new InternalServerErrorException(
        'JWT_REFRESH_SECRET is not configured',
      );
    }

    const signOptions: JwtSignOptions = {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, signOptions),
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(
        refreshToken,
        { secret: this.configService.get<string>('JWT_REFRESH_SECRET') },
      );
      const user = await this.userService.findOneRaw(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.generateToken(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userService.findOneRaw(userId);
    if (!user) throw new UnauthorizedException('User not found');

    return user;
  }

  async forgotPassword(
    email: string,
  ): Promise<{ message: string; data: null }> {
    this.logger.log(`Looking for user: ${email}`);

    const user = await this.userService.findByEmailRaw(email);

    if (!user) {
      return {
        data: null,
        message: 'If the email exists, a reset link has been sent',
      };
    }

    const rawToken = CryptoUtils.generateRandomToken();
    const hashedToken = CryptoUtils.hashToken(rawToken);

    const expiresIn = this.configService.getOrThrow<number>(
      'RESET_TOKEN_EXPIRES_IN',
    );

    await this.userService.setResetToken(user.id, hashedToken, expiresIn);

    await this.mailService.sendPasswordReset(user.email, rawToken);

    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Reset token: ${rawToken}`);
    }
    return {
      data: null,
      message: 'If the email exists, a reset link has been sent',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string; data: null }> {
    const hashedToken = CryptoUtils.hashToken(token);

    const user = await this.userService.findByResetToken(hashedToken);
    if (!user) throw new BadRequestException('Invalid or expired token');

    await this.userService.updatePasswordAndClearToken(user.id, newPassword);

    this.logger.log(`Password reset successful for user ${user.id}`);

    return { data: null, message: 'Password reset successful' };
  }
}
