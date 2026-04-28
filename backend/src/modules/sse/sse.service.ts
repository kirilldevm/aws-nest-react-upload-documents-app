import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class SseService {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  subscribe(email: string): Observable<MessageEvent> {
    return this.getOrCreateStream(email).asObservable();
  }

  publish(email: string, event: string, data: string | object) {
    const stream = this.streams.get(email);
    if (!stream) return;

    stream.next({
      type: event,
      data,
    });
  }

  disconnect(email: string) {
    const stream = this.streams.get(email);
    if (!stream) return;

    stream.complete();
    this.streams.delete(email);
  }

  private getOrCreateStream(email: string) {
    const existing = this.streams.get(email);
    if (existing) return existing;

    const created = new Subject<MessageEvent>();
    this.streams.set(email, created);
    return created;
  }
}
