import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import {InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository:Repository<User>
  ){}

 async  create(createUserDto: CreateUserDto):Promise<User> {
    const existing = await this.userRepository.findOne({
      where: {email: createUserDto.email}
    });

    if(existing){
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  findByEmail(email:string): Promise<User| null>{
    return this.userRepository.findOne({where:{email}});
  }


  async findOne(id: string) {
    const user = await this.userRepository.findOne({where:{id}});
    if(!user){
      throw new NotFoundException('User not found');
    }
    return user;
  }

}
