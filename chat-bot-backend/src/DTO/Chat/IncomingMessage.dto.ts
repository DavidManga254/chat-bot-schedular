import { IsNotEmpty } from 'class-validator';

export class IncomingMessageDTO {
  @IsNotEmpty()
  message: string;
}
