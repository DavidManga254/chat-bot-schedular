import { IsDate, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  email: string;

  @IsString()
  name?: string;

  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;

  @IsString()
  profile_picture: string;

  @IsDate()
  tokenExpiry: Date;

  @IsString()
  timezone: string;
}

export class UserGoogleCodeDTO {
  @IsString()
  googleCode: string;
}
