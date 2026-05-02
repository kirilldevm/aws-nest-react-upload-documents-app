export type CreatePendingDocumentRequest = {
  userEmail: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

export type CreatePendingDocumentResponse = {
  documentId: string;
  s3Filename: string;
  mimeType: string;
  sizeBytes: number;
};

export type DocumentPresignResponse = {
  presignedUrl: string;
  headers: {
    'Content-Type': string;
  };
};
