import { ExecutionContext } from '@nestjs/common';
import { extractCurrentUser } from './current-user.decorator';

describe('extractCurrentUser', () => {
  it('devolve request.user do contexto HTTP', () => {
    const user = {
      id: 'u1',
      email: 'r@r.com',
      name: 'R',
      createdAt: new Date(),
    };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(extractCurrentUser(undefined, ctx)).toBe(user);
  });

  it('devolve undefined se request.user ausente', () => {
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;

    expect(extractCurrentUser(undefined, ctx)).toBeUndefined();
  });
});
