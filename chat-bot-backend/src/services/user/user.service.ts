import { Injectable } from '@nestjs/common';
import prisma from 'prisma/client';
import { CreateUserDto } from 'src/DTO/user/CreateUser.dto';
import { encrypt } from 'src/lib/crypto';

@Injectable()
export class UserService {
  async createOrUpdateGoogleUser(dto: CreateUserDto) {
    const {
      email,
      name,
      accessToken,
      refreshToken,
      tokenExpiry,
      profile_picture,
    } = dto;

    return await prisma.user.upsert({
      where: { email },
      update: {
        name,
        profile_picture: profile_picture,
        accessToken: encrypt(accessToken),
        refreshToken: encrypt(refreshToken),
        tokenExpiry: new Date(tokenExpiry),
      },
      create: {
        email,
        name,
        profile_picture: profile_picture,
        accessToken: encrypt(accessToken),
        refreshToken: encrypt(refreshToken),
        tokenExpiry: new Date(tokenExpiry),
      },
    });
  }

  async findByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }
}
