import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Observable } from 'rxjs';

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
}

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContext>();

  runObservable<T>(
    store: RequestContext,
    fn: () => Observable<T>,
  ): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.als.run(store, () => {
        const inner = fn();
        inner.subscribe(subscriber);
      });
    });
  }

  run<T>(store: RequestContext, fn: () => Promise<T>): Promise<T> {
    return this.als.run(store, fn);
  }

  get(): RequestContext {
    return this.als.getStore() ?? {};
  }
}
