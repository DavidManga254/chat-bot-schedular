import { IsString } from 'class-validator';

export default class LoginDTO {
  @IsString()
  code: string;
}
