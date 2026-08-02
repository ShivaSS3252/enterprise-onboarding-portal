import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
      },
    });

    return this.excludePassword(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map((user) => this.excludePassword(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.excludePassword(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // throws NotFoundException if missing

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    return this.excludePassword(user);
  }

  async remove(id: string) {
    await this.findOne(id); // throws NotFoundException if missing
    await this.prisma.user.delete({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // Never return the password hash to a controller/client.
  private excludePassword<T extends { password: string }>(
    user: T,
  ): Omit<T, 'password'> {
    const { password, ...rest } = user;
    return rest;
  }
}
