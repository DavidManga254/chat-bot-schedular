import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CreateUserDto, UserGoogleCodeDTO } from 'src/DTO/user/CreateUser.dto';
import LoginDTO from 'src/DTO/user/login.dto';
import { encrypt } from 'src/lib/crypto';
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

  @Get('check-token')
  checkToken(@Req() request: Request) {
    const userEmail = request['user']?.email;

    return userEmail;
  }
}
