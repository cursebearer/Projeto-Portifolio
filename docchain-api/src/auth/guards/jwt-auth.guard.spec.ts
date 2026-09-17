import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('estende AuthGuard("jwt")', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeInstanceOf(AuthGuard('jwt'));
  });

  it('expõe canActivate herdado', () => {
    const guard = new JwtAuthGuard();
    expect(typeof guard.canActivate).toBe('function');
  });
});
