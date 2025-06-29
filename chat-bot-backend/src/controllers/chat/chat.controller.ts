import { Body, Controller, Post } from '@nestjs/common';
import { IncomingMessageDTO } from 'src/DTO/Chat/IncomingMessage.dto';
import { ChatService } from 'src/services/chat/chat.service';

@Controller('chat')
export class ChatController {
  constructor(private ChatService: ChatService) {}

  @Post()
  async handleIncomingMessage(@Body() request: IncomingMessageDTO) {
    const messageIntent = await this.ChatService.processIncomingMessage(
      request.message,
    );

    return messageIntent;
  }
}
