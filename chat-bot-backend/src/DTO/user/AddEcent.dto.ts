import { IsString } from 'class-validator';

export class AddEvent {
  @IsString()
  message: string;
}
