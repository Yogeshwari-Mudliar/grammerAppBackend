import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ===================================================
  // GENERATE ACCESS + REFRESH TOKENS
  // ===================================================

  private async generateTokens(
    userId: number,
    email: string,
    role: string,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = await this.jwtService.signAsync(
      payload,
      {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET',
        ),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ) as any,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      payload,
      {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
        ),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '30d',
        ) as any,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  // ===================================================
  // REGISTER
  // ===================================================

  async register(dto: RegisterDto) {
    if (dto.role === 'admin') {
      throw new UnauthorizedException(
        'Admin registration is not allowed',
      );
    }

    const existing =
      await this.usersService.findByIdentifier(
        dto.email || dto.mobile!,
      );

    if (existing) {
      throw new UnauthorizedException(
        'User already exists',
      );
    }

    const password = await bcrypt.hash(
      dto.password,
      10,
    );

    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      mobile: dto.mobile,
      password,
      role: dto.role,
    });

    return {
      success: true,
      message: 'Registration successful',

      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    };
  }

  // ===================================================
  // LOGIN
  // ===================================================

  async login(dto: LoginDto) {
    const user =
      await this.usersService.findByIdentifier(
        dto.identifier,
      );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const valid = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!valid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    // Generate both tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    // Hash refresh token before storing
    const hashedRefreshToken =
      await bcrypt.hash(
        tokens.refreshToken,
        10,
      );

    await this.usersService.updateRefreshToken(
      user.id,
      hashedRefreshToken,
    );

    // Update last login
    await this.usersService.updateLastLogin(
      user.id,
    );

    return {
      success: true,
      message: 'Login successful',

      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,

      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    };
  }

  // ===================================================
  // REFRESH TOKEN
  // ===================================================

  async refresh(refreshToken: string) {
    try {
      // Verify refresh token using REFRESH secret
      const payload =
        await this.jwtService.verifyAsync(
          refreshToken,
          {
            secret:
              this.configService.get<string>(
                'JWT_REFRESH_SECRET',
              ),
          },
        );

      const user =
        await this.usersService.findById(
          payload.sub,
        );

      if (
        !user ||
        !user.hashedRefreshToken
      ) {
        throw new UnauthorizedException(
          'Invalid refresh token',
        );
      }

      // Compare incoming token with DB hash
      const valid =
        await bcrypt.compare(
          refreshToken,
          user.hashedRefreshToken,
        );

      if (!valid) {
        throw new UnauthorizedException(
          'Invalid refresh token',
        );
      }

      // Generate NEW access + refresh token
      const tokens =
        await this.generateTokens(
          user.id,
          user.email,
          user.role,
        );

      // Rotate refresh token
      const hashedRefreshToken =
        await bcrypt.hash(
          tokens.refreshToken,
          10,
        );

      await this.usersService.updateRefreshToken(
        user.id,
        hashedRefreshToken,
      );

      return {
        success: true,

        access_token:
          tokens.accessToken,

        refresh_token:
          tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }
  }

  // ===================================================
  // LOGOUT
  // ===================================================

  async logout(userId: number) {
    await this.usersService.updateRefreshToken(
      userId,
      null,
    );

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}