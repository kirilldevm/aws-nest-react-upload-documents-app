import { IsEmail } from 'class-validator';

export class UserEmailQueryDto {
  @IsEmail()
  userEmail: string;
}
