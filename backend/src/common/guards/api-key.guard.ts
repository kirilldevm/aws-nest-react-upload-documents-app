import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = (
      this.configService.get<string>('config.apiKey') ?? ''
    ).trim();

    const isProd = process.env.NODE_ENV === 'production';

    if (!expected) {
      if (isProd) {
        throw new UnauthorizedException(
          'API_KEY is not configured on the server',
        );
      }
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = this.extractKey(request);

    if (!provided || provided.toString() !== expected.toString()) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }

  private extractKey(request: Request): string {
    const raw = request.headers['x-api-key'];
    const fromHeader = Array.isArray(raw) ? raw[0] : raw;
    if (typeof fromHeader === 'string' && fromHeader.trim()) {
      return fromHeader.trim();
    }

    return '';
  }
}
