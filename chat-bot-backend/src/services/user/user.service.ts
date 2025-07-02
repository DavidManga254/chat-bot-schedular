import { Injectable } from '@nestjs/common';
import prisma from 'prisma/client';
import { CreateUserDto } from 'src/DTO/user/CreateUser.dto';
import { decrypt, encrypt } from 'src/lib/crypto';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

@Injectable()
export class UserService {
  private JWT_SECRET;

  constructor(private googleCalendarService: GoogleCalendarService) {
    this.JWT_SECRET = process.env.JWT_SECRET ?? 'supersecret';
  }

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

  async loginUser(code: string) {
    const tokens = await this.googleCalendarService.getTokensFromCode(code);

    // Upsert user
    await this.createOrUpdateGoogleUser({
      name: tokens.name,
      email: tokens.email,
      profile_picture: tokens.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: new Date(tokens.exp * 1000),
    });

    return {
      email: tokens.email,
    };
  }

  async findByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async doesUserExist(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);

    if (user) {
      return true;
    } else {
      return false;
    }
  }

  async scheduleUserEvent(
    userEmail: string,
    eventIntent: {
      title: string;
      startTime: string;
      durationMinutes: number;
      recurrenceRule?: string;
      participants?: string[];
    },
  ) {
    const user = await this.findByEmail(userEmail);
    if (!user) {
      throw new Error('User not found');
    }

    const decryptedAccessToken = decrypt(user.accessToken);
    const decryptedRefreshToken = decrypt(user.refreshToken);

    const tokens = {
      access_token: decryptedAccessToken,
      refresh_token: decryptedRefreshToken,
      expiry_date: user.tokenExpiry.getTime(),
    };

    const event = await this.googleCalendarService.createEvent(
      tokens,
      eventIntent,
    );

    return event;
  }
}
