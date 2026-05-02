import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { DocumentStatus } from '../entities/document-status.enum';

export class UpdateStatusDto {
  @IsUUID()
  documentId: string;

  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
