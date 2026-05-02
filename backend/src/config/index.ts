import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  port: Number(process.env.PORT ?? 3000),

  apiKey: process.env.API_KEY ?? '',
  postgres: {
    type: 'postgres' as const,
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    autoLoadEntities: true,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  aws: {
    region: process.env.AWS_REGION,
    s3Bucket: process.env.AWS_S3_BUCKET,
    s3PresignExpiresSeconds: Number(
      process.env.AWS_S3_PRESIGN_EXPIRES_SECONDS ?? 300,
    ),
    sqsQueueUrl: process.env.AWS_SQS_QUEUE_URL,
    sqsListenerEnabled: process.env.AWS_SQS_LISTENER_ENABLED === 'true',
    sqsPollIntervalMs: Number(process.env.AWS_SQS_POLL_INTERVAL_MS ?? 5000),
    opensearchNode: process.env.OPENSEARCH_NODE,
    opensearchUsername: process.env.OPENSEARCH_USERNAME,
    opensearchPassword: process.env.OPENSEARCH_PASSWORD,
    opensearchIndex: process.env.OPENSEARCH_INDEX ?? 'documents',
  },
}));
