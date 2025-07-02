import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AddEvent } from 'src/DTO/user/AddEcent.dto';
import { CreateUserDto, UserGoogleCodeDTO } from 'src/DTO/user/CreateUser.dto';
import LoginDTO from 'src/DTO/user/login.dto';
import { encrypt } from 'src/lib/crypto';
import { GoogleCalendarService } from 'src/services/google-calendar/google-calendar.service';
import { OpenaiService } from 'src/services/openai/openai.service';
import { UserService } from 'src/services/user/user.service';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private googleCalendarService: GoogleCalendarService,
    private openAiService: OpenaiService,
  ) {}

  @Get('request-google-sign-in')
  requestGoogleSignIn() {
    return this.googleCalendarService.getAuthUrl();
  }

  @Post('create-user-with-google-credentials')
  async createUser(@Body() body: UserGoogleCodeDTO) {
    const userToken = await this.googleCalendarService.getTokensFromCode(
      body.googleCode,
    );

    const createUserData: CreateUserDto = {
      accessToken: userToken.access_token,
      refreshToken: userToken.refresh_token,
      tokenExpiry: new Date(userToken.expiry_date),
      name: userToken.name,
      email: userToken.email,
      profile_picture: userToken.picture,
      timezone: userToken.timezone,
    };

    await this.userService.createOrUpdateGoogleUser(createUserData);

    return 'user created successfully';
  }

  @Post('login')
  async login(
    @Body() body: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userEmailObject = await this.userService.loginUser(body.code);

    res.cookie('auth_token', encrypt(JSON.stringify(userEmailObject)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      signed: true,
    });

    return { success: true, message: 'Logged in successfully' };
  }

  @Post('add-user-event')
  async addEvent(@Body() body: AddEvent, @Req() request: Request) {
    const userEmail = request['user']?.email;

    const user = await this.userService.findByEmail(userEmail);

    if (!user?.timezone) {
      throw new InternalServerErrorException('User timezone not configured.');
    }

    const intent = await this.openAiService.extractScheduleIntent(
      body.message,
      user.timezone,
    );

    if (!intent) {
      throw new InternalServerErrorException(
        'Failed to extract scheduling intent from the message',
      );
    }

    console.log('extracted intent', intent);

    const event = await this.userService.scheduleUserEvent(userEmail, {
      ...intent,
      timezone: user.timezone,
    });

    return event;
  }
}
