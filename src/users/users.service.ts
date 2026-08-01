import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './users.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ===================================================
  // CREATE USER
  // ===================================================

 async create(data: Partial<User>) {

  const user = this.userRepository.create(data);

  return this.userRepository.save(user);

}

  // ===================================================
  // GET ALL USERS
  // ===================================================

  async findAll(): Promise<User[]> {

    return this.userRepository.find({
      order: {
        id: 'ASC',
      },
    });

  }

  // ===================================================
  // FIND BY EMAIL
  // ===================================================

  async findByEmail(email: string): Promise<User | null> {

    return this.userRepository.findOne({
      where: {
        email,
      },
    });

  }

  // ===================================================
  // FIND BY MOBILE
  // ===================================================

  async findByMobile(mobile: string): Promise<User | null> {

    return this.userRepository.findOne({
      where: {
        mobile,
      },
    });

  }

  // ===================================================
  // LOGIN SUPPORT
  // ===================================================

  // async findByIdentifier(identifier: string): Promise<User | null> {

  //   if (identifier.includes('@')) {
  //     return this.findByEmail(identifier);
  //   }

  //   return this.findByMobile(identifier);

  // }

  // ===================================================
  // FIND BY ID
  // ===================================================

  async findById(id: number): Promise<User | null> {

    return this.userRepository.findOne({
      where: {
        id,
      },
    });

  }

  // ===================================================
  // UPDATE LAST LOGIN
  // ===================================================

  async updateLastLogin(id: number) {

    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });

  }
async findByIdentifier(identifier: string) {

  return this.userRepository.findOne({
    where: [
      {
        email: identifier,
      },
      {
        mobile: identifier,
      },
    ],
  });

}
}