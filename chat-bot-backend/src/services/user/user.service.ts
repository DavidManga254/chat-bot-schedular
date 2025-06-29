import { Injectable } from '@nestjs/common';
import prisma from 'prisma/client';
import { CreateUserDto } from 'src/DTO/user/CreateUser.dto';

@Injectable()
export class UserService {
  async createOrUpdateGoogleUser(dto: CreateUserDto) {
    const { email, name, accessToken, refreshToken, tokenExpiry } = dto;

    return await prisma.user.upsert({
      where: { email },
      update: {
        name,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(tokenExpiry),
      },
      create: {
        email,
        name,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(tokenExpiry),
      },
    });
  }

  async findByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }
}
