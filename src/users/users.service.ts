import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { CryptoUtils } from '../common/utils/crypto.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ message: string; data: User }> {
    const existing = await this.findByEmailRaw(createUserDto.email);

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    return {
      message: 'User created successfully.',
      data: savedUser,
    };
  }

  async findByEmail(email: string): Promise<{ message: string; data: User }> {
    const user = await this.findByEmailRaw(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      message: 'User found successfully',
      data: user,
    };
  }

  async findOne(id: string): Promise<{ message: string; data: User }> {
    const user = await this.findOneRaw(id);

    if (!user) throw new NotFoundException('User not found');
    return {
      message: 'User successfully found.',
      data: user,
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    message: string;
    data: User[];
    meta: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  }> {
    const [users, totalCount] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Users retrieved successfully',
      data: users,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findByEmailRaw(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOneRaw(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async setResetToken(
    userId: string,
    token: string,
    expiresIn: number,
  ): Promise<void> {
    const user = await this.findOneRaw(userId);
    if (!user) throw new NotFoundException('User not found');

    user.resetPasswordToken = CryptoUtils.hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + expiresIn);
    await this.userRepository.save(user);
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });
  }



  async updatePasswordAndClearToken(userId: string, newPassword: string): Promise<void> {
    const user = await this.findOneRaw(userId);
    if (!user) throw new NotFoundException('User not found');

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;
    await this.userRepository.save(user);
  }
}
