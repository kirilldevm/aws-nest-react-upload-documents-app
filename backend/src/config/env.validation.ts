import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),

  API_KEY: Joi.string().allow('').optional(),

  POSTGRES_HOST: Joi.string().trim().min(1).required(),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_USER: Joi.string().trim().min(1).required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().trim().min(1).required(),
  DB_SYNCHRONIZE: Joi.string().valid('true', 'false').default('false'),

  /** Empty strings = use instance role / default credential chain. */
  AWS_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),

  AWS_REGION: Joi.string().trim().min(1).required(),
  AWS_S3_BUCKET: Joi.string().trim().min(1).required(),
  AWS_S3_PRESIGN_EXPIRES_SECONDS: Joi.number()
    .integer()
    .positive()
    .max(604800)
    .default(300),

  AWS_SQS_QUEUE_URL: Joi.string().uri().trim().required(),
  AWS_SQS_LISTENER_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('false'),
  AWS_SQS_POLL_INTERVAL_MS: Joi.number()
    .integer()
    .positive()
    .max(3600000)
    .default(5000),

  OPENSEARCH_NODE: Joi.string().uri().trim().required(),
  OPENSEARCH_USERNAME: Joi.string().allow('').optional(),
  OPENSEARCH_PASSWORD: Joi.string().allow('').optional(),
  OPENSEARCH_INDEX: Joi.string().trim().min(1).default('documents'),
});
