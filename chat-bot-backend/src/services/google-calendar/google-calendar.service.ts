// google-calendar.service.ts
import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class GoogleCalendarService {
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  getAuthUrl(): string {
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  async createEvent(eventData: {
    title: string;
    startTime: string;
    durationMinutes: number;
    recurrenceRule?: string;
    participants?: string[];
  }) {
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

    return response.data;
  }
}
