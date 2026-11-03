import { Observable, of } from 'rxjs';
import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
  let service: RequestContextService;

  beforeEach(() => {
    service = new RequestContextService();
  });

  it('get() sem contexto ativo retorna objeto vazio', () => {
    expect(service.get()).toEqual({});
  });

  it('run() propaga contexto pra função async', async () => {
    const stored = await service.run(
      { ipAddress: '1.2.3.4', userAgent: 'test-agent', userId: 'u1' },
      () => Promise.resolve(service.get()),
    );
    expect(stored).toEqual({
      ipAddress: '1.2.3.4',
      userAgent: 'test-agent',
      userId: 'u1',
    });
  });

  it('contexto isolado entre chamadas paralelas de run()', async () => {
    const [a, b] = await Promise.all([
      service.run({ ipAddress: '1.1.1.1' }, () =>
        Promise.resolve(service.get().ipAddress),
      ),
      service.run({ ipAddress: '2.2.2.2' }, () =>
        Promise.resolve(service.get().ipAddress),
      ),
    ]);
    expect(a).toBe('1.1.1.1');
    expect(b).toBe('2.2.2.2');
  });

  it('runObservable() propaga contexto durante subscribe', (done) => {
    const obs = service.runObservable(
      { ipAddress: '9.9.9.9' },
      () =>
        new Observable<string | undefined>((sub) => {
          sub.next(service.get().ipAddress);
          sub.complete();
        }),
    );
    obs.subscribe({
      next: (v) => expect(v).toBe('9.9.9.9'),
      complete: done,
    });
  });

  it('runObservable() encaminha valores do observable interno', (done) => {
    const obs = service.runObservable({}, () => of(1, 2, 3));
    const collected: number[] = [];
    obs.subscribe({
      next: (v) => collected.push(v),
      complete: () => {
        expect(collected).toEqual([1, 2, 3]);
        done();
      },
    });
  });
});
