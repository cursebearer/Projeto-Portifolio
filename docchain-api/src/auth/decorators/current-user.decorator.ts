import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth.service';

export const extractCurrentUser = (
  _data: unknown,
  ctx: ExecutionContext,
): AuthenticatedUser => {
  const request = ctx
    .switchToHttp()
    .getRequest<Request & { user: AuthenticatedUser }>();
  return request.user;
};

export const CurrentUser = createParamDecorator(extractCurrentUser);
