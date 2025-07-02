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

    return {
      ...tokens,
      ...userInfo,
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
    },
    eventData: {
      title: string;
      startTime: string;
      durationMinutes: number;
      recurrenceRule?: string;
      participants?: string[];
    },
  ) {
    this.oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client,
    });

    const endTime = new Date(
      new Date(eventData.startTime).getTime() +
        eventData.durationMinutes * 60000,
    ).toISOString();

    const event = {
      summary: eventData.title,
      start: { dateTime: eventData.startTime },
      end: { dateTime: endTime },
      attendees: eventData.participants?.map((email) => ({ email })) || [],
      recurrence: eventData.recurrenceRule
        ? [`RRULE:${eventData.recurrenceRule}`]
        : undefined,
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // const updatedCreds = this.oauth2Client.credentials;

    // if (updatedCreds.access_token !== tokens.access_token) {
    //   // Token was refreshed
    //   await prisma.user.update({
    //     where: { email: userEmail },
    //     data: {
    //       accessToken: encrypt(`${updatedCreds.access_token}`),
    //       tokenExpiry: new Date(updatedCreds.expiry_date ?? Date.now() + 3600_000),
    //     },
    //   });

    return response.data;
  }
}

// http://localhost:8080/verify?code=4/0AVMBsJhd9mfR_69e1y5PX0IP9b58Jv2WJDj_q5X4lw222M1mVCjZMz0XQxnIw0tNMH1r1A&scope=https://www.googleapis.com/auth/calendar
// http://localhost:8080/verify?code=4/0AVMBsJjo1qwRGbuugH51RO6bnBNkDc649ijOIVQuTKIC1kKOzOUtZf_13oLHLlhw5MNZUQ&scope=email%20profile%20https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/userinfo.profile%20https://www.googleapis.com/auth/userinfo.email%20openid&authuser=0&prompt=consent

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
}
