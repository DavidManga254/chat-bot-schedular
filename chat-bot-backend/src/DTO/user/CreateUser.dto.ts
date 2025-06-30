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

  @IsDate()
  tokenExpiry: Date;
}

export class UserGoogleCodeDTO {
  @IsString()
  googleCode: string;
}
