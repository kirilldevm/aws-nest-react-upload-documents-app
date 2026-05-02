import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MAX_UPLOAD_BYTES } from '../../../common/constants';

export class CreateDocumentDto {
  @IsEmail()
  userEmail: string;

  @IsString()
  @IsNotEmpty()
  userFilename: string;

  @IsString()
  @IsNotEmpty()
  s3Filename: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  sizeBytes: number;
}
