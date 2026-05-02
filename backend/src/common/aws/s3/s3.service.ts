import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SignPutObjectParams } from '../types';

@Injectable()
export class S3Service {
  readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.getOrThrow<string>('config.aws.region');
    this.client = new S3Client({ region });
  }

  async signPutObject(params: SignPutObjectParams) {
    const bucket = this.configService.getOrThrow<string>('config.aws.s3Bucket');
    const expiresIn = this.configService.get<number>(
      'config.aws.s3PresignExpiresSeconds',
    );

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      ContentType: params.contentType,
      ContentLength: params.contentLength,
    });

    const presignedUrl = await getSignedUrl(this.client, putCommand, {
      expiresIn,
    });

    return {
      presignedUrl,
      headers: {
        'Content-Type': params.contentType,
      } as const,
    };
  }
}
