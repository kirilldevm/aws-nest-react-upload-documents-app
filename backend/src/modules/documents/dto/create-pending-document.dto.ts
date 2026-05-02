import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MAX_UPLOAD_BYTES } from '../../../common/constants';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export class CreatePendingDocumentDto {
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\.(pdf|docx)$/i, {
    message: 'Only .pdf and .docx files are allowed',
  })
  originalFilename: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([...ALLOWED_MIME_TYPES], {
    message:
      'mimeType must be application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  mimeType: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  sizeBytes: number;
}
