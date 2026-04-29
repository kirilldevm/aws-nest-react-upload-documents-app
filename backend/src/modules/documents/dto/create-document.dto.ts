export class CreateDocumentDto {
  userEmail: string;
  userFilename: string;
  s3Filename: string;
  mimeType: string;
  sizeBytes: number;
}
