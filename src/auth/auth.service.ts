import {
  ConflictException,
  Injectable,
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

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
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
    const payload = { sub: user.id, email: user.email };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
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
}
