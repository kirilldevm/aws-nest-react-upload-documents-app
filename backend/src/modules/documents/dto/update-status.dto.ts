import { DocumentStatus } from '../entities/document-status.enum';

export class UpdateStatusDto {
  documentId: string;
  status: DocumentStatus;
  errorMessage?: string;
}
