import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { randomUUID, createHash } from 'crypto';
import * as request from 'supertest';
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
    cookie = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string);
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
    expect(verifyRes.body.documentHash.toLowerCase()).toBe(
      `0x${expectedHash}`,
    );
  }, 60000);
});
