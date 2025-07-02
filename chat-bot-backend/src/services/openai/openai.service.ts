import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

@Injectable()
export class OpenaiService {
  async extractScheduleIntent(
    message: string,
    timezone: string = 'UTC',
  ): Promise<{
    title: string;
    startTime: string;
    endTime?: string;
    durationMinutes: number;
    recurrenceRule?: string;
    participants?: string[];
    allDay?: boolean;
    location?: string;
    description?: string;
    reminders?: { method: 'email' | 'popup'; minutes: number }[];
  } | null> {
    const today = new Date().toISOString().split('T')[0]; // reduces token usage

    const systemPrompt = `You're a scheduling assistant. Assume the user's timezone is ${timezone}. Today is ${today}.Extract: - title - startTime (ISO 8601) - durationMinutes (if no endTime) - participants (emails) - recurrenceRule (RFC5545) Optional: endTime (ISO 8601), allDay (boolean), location, description, reminders (email/popup & minutes).`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      functions: [
        {
          name: 'createCalendarEvent',
          description: 'Extract scheduling intent from natural language',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              durationMinutes: { type: 'integer' },
              participants: {
                type: 'array',
                items: { type: 'string' },
              },
              recurrenceRule: { type: 'string' },
              allDay: { type: 'boolean' },
              location: { type: 'string' },
              description: { type: 'string' },
              reminders: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    method: { type: 'string', enum: ['email', 'popup'] },
                    minutes: { type: 'integer' },
                  },
                  required: ['method', 'minutes'],
                },
              },
            },
            required: ['title', 'startTime'],
          },
        },
      ],
      function_call: { name: 'createCalendarEvent' },
    });

    const call = response.choices[0]?.message?.function_call;
    if (!call?.arguments) return null;

    const parsed = JSON.parse(call.arguments);

    return {
      title: parsed.title,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      durationMinutes: parsed.durationMinutes ?? 60,
      recurrenceRule: parsed.recurrenceRule ?? null,
      participants: parsed.participants ?? [],
      allDay: parsed.allDay ?? false,
      location: parsed.location,
      description: parsed.description,
      reminders: parsed.reminders,
    };
  }
}
