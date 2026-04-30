export type CreateUploadPresignRequest = {
  userEmail: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

export type CreateUploadPresignResponse = {
  documentId: string;
  s3Filename: string;
  presignedUrl: string;
  headers: {
    'Content-Type': string;
  };
};

