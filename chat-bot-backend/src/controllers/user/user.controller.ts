import { Body, Controller, Get, Post } from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';
import { CreateUserDto, UserGoogleCodeDTO } from 'src/DTO/user/CreateUser.dto';
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
      // picture: userToken.picture,
    };

    await this.userService.createOrUpdateGoogleUser(createUserData);

    return 'user created successfully';
  }
}
