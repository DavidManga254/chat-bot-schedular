import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './controllers/chat/chat.controller';
import { ChatService } from './services/chat/chat.service';
import { OpenaiService } from './services/openai/openai.service';

@Module({
  imports: [],
  controllers: [AppController, ChatController],
  providers: [AppService, ChatService, OpenaiService],
})
export class AppModule {}
