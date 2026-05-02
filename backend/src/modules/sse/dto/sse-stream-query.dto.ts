import { IsEmail } from 'class-validator';

export class SseStreamQueryDto {
  @IsEmail()
  email: string;
}
