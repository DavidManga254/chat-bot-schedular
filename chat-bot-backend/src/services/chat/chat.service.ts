import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service';

export interface ScheduleIntent {
  text: string;
  date: string;
  time: string;
  durationMinutes?: number | null;
}

@Injectable()
export class ChatService {
  constructor(private OpenAI: OpenaiService) {}

  async processIncomingMessage(userMessage: string) {
    const extractedIntent =
      await this.OpenAI.extractScheduleIntent(userMessage);

    return extractedIntent;
  }
}
