export type SignPutObjectParams = {
  key: string;
  contentType: string;
  contentLength: number;
};

export type S3EventRecord = {
  s3?: {
    object?: {
      key?: string;
    };
  };
};

export type S3EventEnvelope = {
  Records?: S3EventRecord[];
  Message?: string;
};

export type OpenSearchHighlight = Partial<Record<string, string[] | undefined>>;

export type OpenSearchHit<T = Record<string, unknown>> = {
  _index?: string;
  _id: string;
  _score?: number;
  _source?: T;
  highlight?: OpenSearchHighlight;
};

export type DocumentIndexSource = {
  documentId: string;
  userEmail: string;
  userFilename: string;
  s3Filename: string;
  content: string;
  uploadedAt: string;
};
