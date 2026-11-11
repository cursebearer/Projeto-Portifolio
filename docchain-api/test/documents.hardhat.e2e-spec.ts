import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID, createHash } from 'crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E real contra Hardhat local (ROADMAP 4.1).
 * Gated por E2E_HARDHAT=1. Pré-requisitos no test/README.md.
 */
const shouldRun = process.env.E2E_HARDHAT === '1';
const describeOrSkip = shouldRun ? describe : describe.skip;

describeOrSkip('Documents E2E (Hardhat local)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'senha-forte-123';
  let cookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Limpa dados do e-mail de teste pra permitir reruns.
    await prisma.document.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('register → login → upload → CONFIRMED com txHash real', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'E2E User' })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const setCookie = loginRes.headers['set-cookie'];
    cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(cookie).toMatch(/access_token=/);

    const content = Buffer.from(
      `conteudo-e2e-${Date.now()}-${randomUUID()}`,
      'utf8',
    );
    const expectedHash = createHash('sha256').update(content).digest('hex');

    const uploadRes = await request(app.getHttpServer())
      .post('/documents')
      .set('Cookie', cookie)
      .attach('file', content, 'e2e.txt')
      .expect(201);

    expect(uploadRes.body.status).toBe('CONFIRMED');
    expect(uploadRes.body.hash).toBe(expectedHash);
    expect(uploadRes.body.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(uploadRes.body.blockNumber).toBeGreaterThan(0);
    expect(uploadRes.body.walletAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);

    const verifyRes = await request(app.getHttpServer())
      .get(`/verify/public/${expectedHash}`)
      .expect(200);
    expect(verifyRes.body.exists).toBe(true);
    expect(verifyRes.body.documentHash.toLowerCase()).toBe(`0x${expectedHash}`);
  }, 60000);

  it('API key: gera, envia e consulta documento, respeita o escopo e a revogação', async () => {
    const created = await request(app.getHttpServer())
      .post('/api-keys')
      .set('Cookie', cookie)
      .send({ name: 'E2E' })
      .expect(201);
    const key = created.body.key as string;
    expect(key).toMatch(/^dc_live_/);

    const content = Buffer.from(`api-key-e2e-${randomUUID()}`, 'utf8');
    const uploadRes = await request(app.getHttpServer())
      .post('/documents')
      .set('X-API-Key', key)
      .attach('file', content, 'via-api.txt')
      .expect(201);
    expect(uploadRes.body.status).toBe('CONFIRMED');

    await request(app.getHttpServer())
      .get(`/documents/${uploadRes.body.id}`)
      .set('X-API-Key', key)
      .expect(200);

    // Fora do escopo da chave
    await request(app.getHttpServer())
      .delete(`/documents/${uploadRes.body.id}`)
      .set('X-API-Key', key)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api-keys/${created.body.id}`)
      .set('Cookie', cookie)
      .expect(204);

    await request(app.getHttpServer())
      .get('/documents')
      .set('X-API-Key', key)
      .expect(401);
  }, 60000);
});
