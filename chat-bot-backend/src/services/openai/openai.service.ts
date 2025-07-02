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
    durationMinutes: number;
    recurrenceRule?: string;
    participants?: string[];
  } | null> {
    const today = new Date().toISOString();

    const systemPrompt = `You are a scheduling assistant. Today is ${today}. Assume the user's time zone is ${timezone}. Extract the event's title, startTime (ISO 8601), durationMinutes, participants (emails), and recurrenceRule (RFC5545) if repeating. Examples: "every day for 5 days" → FREQ=DAILY;COUNT=5, "every Monday until Aug 30" → FREQ=WEEKLY;BYDAY=MO;UNTIL=20250830T000000Z.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      functions: [
        {
          name: 'createCalendarEvent',
          description: 'Extracts event scheduling intent',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              startTime: { type: 'string', format: 'date-time' },
              durationMinutes: { type: 'integer' },
              participants: {
                type: 'array',
                items: { type: 'string' },
              },
              recurrenceRule: { type: 'string' },
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
      durationMinutes: parsed.durationMinutes ?? 60,
      recurrenceRule: parsed.recurrenceRule ?? null,
      participants: parsed.participants ?? [],
    };
  }
}
