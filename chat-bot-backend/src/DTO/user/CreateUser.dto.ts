export class CreateUserDto {
  email: string;
  name?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}
