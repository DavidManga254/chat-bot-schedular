// google-calendar.service.ts
import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { jwtDecode } from 'jwt-decode';
import prisma from 'prisma/client';
import { encrypt } from 'src/lib/crypto';

export type GoogleTokenResponse = GoogleIdTokenPayload;

dotenv.config();

@Injectable()
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing Google OAuth environment variables');
    }

    this.oauth2Client = new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'openid',
      'email',
      'profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  async getTokensFromCode(code: string): Promise<GoogleTokenResponse> {
    const { tokens } = await this.oauth2Client.getToken(code);

    const userInfo = jwtDecode<GoogleIdTokenPayload>(`${tokens.id_token}`);

    this.oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client,
    });
    const tzSetting = await calendar.settings.get({ setting: 'timezone' });

    return {
      ...tokens,
      ...userInfo,
      timezone: tzSetting.data.value ?? '',
    };
  }

  async getUserInfo(tokens: any) {
    this.oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: this.oauth2Client,
      version: 'v2',
    });
    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }

  async createEvent(
    tokens: {
      access_token: string;
      refresh_token?: string;
      expiry_date?: number;
      user_email: string;
    },
    eventData: {
      title: string;
      startTime: string;
      endTime?: string;
      durationMinutes: number;
      recurrenceRule?: string;
      participants?: string[];
      timezone: string;
      allDay?: boolean;
      location?: string;
      description?: string;
      reminders?: { method: 'email' | 'popup'; minutes: number }[];
    },
  ) {
    this.oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client,
    });

    const computedEndTime =
      eventData.endTime ??
      new Date(
        new Date(eventData.startTime).getTime() +
          eventData.durationMinutes * 60000,
      ).toISOString();

    const event = {
      summary: eventData.title,
      ...(eventData.description && { description: eventData.description }),
      ...(eventData.location && { location: eventData.location }),
      start: eventData.allDay
        ? { date: eventData.startTime.split('T')[0] }
        : {
            dateTime: eventData.startTime,
            timeZone: eventData.timezone,
          },
      end: eventData.allDay
        ? {
            date: new Date(new Date(eventData.startTime).getTime() + 86400000)
              .toISOString()
              .split('T')[0],
          }
        : {
            dateTime: computedEndTime,
            timeZone: eventData.timezone,
          },
      attendees: eventData.participants?.map((email) => ({ email })) || [],
      recurrence: eventData.recurrenceRule
        ? [`RRULE:${eventData.recurrenceRule}`]
        : undefined,
      reminders: eventData.reminders
        ? {
            useDefault: false,
            overrides: eventData.reminders,
          }
        : { useDefault: true },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    const updatedCreds = this.oauth2Client.credentials;

    if (
      updatedCreds.access_token &&
      updatedCreds.access_token !== tokens.access_token
    ) {
      await prisma.user.update({
        where: { email: tokens.user_email },
        data: {
          accessToken: encrypt(updatedCreds.access_token),
          tokenExpiry: new Date(
            updatedCreds.expiry_date ?? Date.now() + 3600_000,
          ),
        },
      });
    }

    return response.data;
  }
}

export interface GoogleIdTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  iat: number;
  exp: number;
  access_token: string;
  refresh_token: string;
  expiry_date: string;
  timezone: string;
}
