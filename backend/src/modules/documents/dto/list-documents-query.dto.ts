import { IsEmail } from 'class-validator';

export class ListDocumentsQueryDto {
  @IsEmail()
  userEmail: string;
}
