export type DocumentStatus = 'pending' | 'processing' | 'success' | 'error';

export type DocumentItem = {
  id: string;
  userEmail: string;
  userFilename: string;
  s3Filename: string;
  mimeType: string;
  sizeBytes: string;
  status: DocumentStatus;
  errorMessage: string | null;
  uploadedAt: string;
  indexedAt: string | null;
};

export type SearchDocumentItem = {
  documentId: string;
  filename: string | null;
  uploadedAt: string | null;
  status: DocumentStatus | null;
  highlights: string[];
};

