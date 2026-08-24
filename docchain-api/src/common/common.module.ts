import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestContextInterceptor } from './request-context.interceptor';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
  providers: [
    RequestContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
  exports: [RequestContextService],
})
export class CommonModule {}
