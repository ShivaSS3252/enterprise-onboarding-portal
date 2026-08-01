import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Public registration always creates an EMPLOYEE account.
    // Admin accounts are created by an existing Admin via the Users module (Step 4),
    // never through this open endpoint.
    const user = await this.usersService.create({ ...dto, role: Role.EMPLOYEE });
    return this.buildToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildToken(user.id, user.email, user.role);
  }

  private buildToken(userId: string, email: string, role: Role) {
    const payload: JwtPayload = { sub: userId, email, role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: userId, email, role },
    };
  }
}
