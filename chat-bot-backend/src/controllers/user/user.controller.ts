import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserDto } from 'src/DTO/user/CreateUser.dto';
import { GoogleCalendarService } from 'src/services/google-calendar/google-calendar.service';
import { UserService } from 'src/services/user/user.service';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private googleCalendarService: GoogleCalendarService,
  ) {}

  @Get('request-google-sign-in')
  requestGoogleSignIn() {
    return this.googleCalendarService.getAuthUrl();
  }

  @Post('create-user-with-google-credentials')
  async createUser(@Body() userData: CreateUserDto) {
    return await this.userService.createOrUpdateGoogleUser(userData);
  }
}
