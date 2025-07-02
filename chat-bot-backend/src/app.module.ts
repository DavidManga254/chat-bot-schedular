import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './controllers/chat/chat.controller';
import { ChatService } from './services/chat/chat.service';
import { OpenaiService } from './services/openai/openai.service';
import { GoogleCalendarService } from './services/google-calendar/google-calendar.service';
import { UserController } from './controllers/user/user.controller';
import { UserService } from './services/user/user.service';
import { AuthMiddleWare } from './middlewares/auth.middleware';

@Module({
  imports: [],
  controllers: [AppController, ChatController, UserController],
  providers: [
    AppService,
    ChatService,
    OpenaiService,
    GoogleCalendarService,
    UserService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleWare)
      .exclude({ path: 'user/login', method: RequestMethod.POST })
      .exclude({
        path: 'user/request-google-sign-in',
        method: RequestMethod.GET,
      })
      .forRoutes('*');
  }
}
