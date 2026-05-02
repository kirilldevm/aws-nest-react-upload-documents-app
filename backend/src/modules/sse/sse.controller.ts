import { Controller, MessageEvent, Query, Sse } from '@nestjs/common';
import { Observable, concat, of } from 'rxjs';
import { SseStreamQueryDto } from './dto/sse-stream-query.dto';
import { SseService } from './sse.service';

@Controller('events')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('stream')
  stream(@Query() query: SseStreamQueryDto): Observable<MessageEvent> {
    const { email } = query;

    return concat(
      of({
        type: 'connected',
        data: { email, connectedAt: new Date().toISOString() },
      }),
      this.sseService.subscribe(email),
    );
  }
}
