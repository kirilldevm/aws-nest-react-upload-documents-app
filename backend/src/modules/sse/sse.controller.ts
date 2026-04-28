import {
  BadRequestException,
  Controller,
  MessageEvent,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, concat, of } from 'rxjs';
import { SseService } from './sse.service';

@Controller('events')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('stream')
  stream(@Query('email') email?: string): Observable<MessageEvent> {
    if (!email) {
      throw new BadRequestException('email query parameter is required');
    }

    return concat(
      of({
        type: 'connected',
        data: { email, connectedAt: new Date().toISOString() },
      }),
      this.sseService.subscribe(email),
    );
  }
}
