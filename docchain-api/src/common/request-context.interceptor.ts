import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly ctx: RequestContextService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const req = context.switchToHttp().getRequest<
      Request & { user?: { id?: string } }
    >();
    const store = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
    };
    return this.ctx.runObservable(store, () => next.handle());
  }
}
