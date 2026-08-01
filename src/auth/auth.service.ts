import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

async register(dto: RegisterDto) {
if (dto.role === 'admin') {
  throw new UnauthorizedException(
    'Admin registration is not allowed',
  );
}
  const existing = await this.usersService.findByIdentifier(
    dto.email || dto.mobile!,
  );

  if (existing) {
    throw new UnauthorizedException(
      'User already exists',
    );
  }

  const password = await bcrypt.hash(dto.password, 10);

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
async login(dto: LoginDto) {
  const user = await this.usersService.findByIdentifier(dto.identifier);

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const valid = await bcrypt.compare(
    dto.password,
    user.password,
  );

  if (!valid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const payload = {
    sub: user.id,
    role: user.role,
  };

  const accessToken = this.jwtService.sign(payload);

 return {
  success: true,
  message: 'Login successful',

  access_token: accessToken,

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
}
