import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createTransport } from 'nodemailer';
import { MailerService } from './mailer.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailerService', () => {
  let service: MailerService;
  const sendMail = jest.fn();

  const buildModule = async (overrides: Record<string, unknown> = {}) => {
    const config = {
      get: jest.fn((key: string, def?: unknown) => {
        const values: Record<string, unknown> = {
          SMTP_HOST: 'smtp.example.com',
          SMTP_PORT: 465,
          SMTP_USER: 'user',
          SMTP_PASSWORD: 'pw',
          SMTP_FROM: 'DocChain <no-reply@docchain.dev>',
          ...overrides,
        };
        return values[key] ?? def;
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    return module.get<MailerService>(MailerService);
  };

  beforeEach(() => {
    sendMail.mockReset();
    (createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  it('cria transporter com config correta', async () => {
    await buildModule();

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'user', pass: 'pw' },
    });
  });

  it('secure=false quando porta != 465', async () => {
    (createTransport as jest.Mock).mockClear();
    await buildModule({ SMTP_PORT: 587 });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false }),
    );
  });

  it('lança erro se SMTP_HOST ausente', async () => {
    await expect(buildModule({ SMTP_HOST: undefined })).rejects.toThrow(
      /SMTP config incompleta/,
    );
  });

  it('lança erro se SMTP_FROM ausente', async () => {
    await expect(buildModule({ SMTP_FROM: undefined })).rejects.toThrow(
      /SMTP config incompleta/,
    );
  });

  it('send() envia com anexos', async () => {
    service = await buildModule();
    sendMail.mockResolvedValue(undefined);

    await service.send({
      to: 'a@b.com',
      subject: 'Teste',
      text: 'corpo',
      attachments: [
        { filename: 'doc.pdf', content: Buffer.from('x'), contentType: 'application/pdf' },
      ],
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'DocChain <no-reply@docchain.dev>',
      to: 'a@b.com',
      subject: 'Teste',
      text: 'corpo',
      html: undefined,
      attachments: [
        {
          filename: 'doc.pdf',
          content: Buffer.from('x'),
          contentType: 'application/pdf',
        },
      ],
    });
  });

  it('send() sem anexos passa undefined em attachments', async () => {
    service = await buildModule();
    sendMail.mockResolvedValue(undefined);

    await service.send({ to: 'a@b.com', subject: 's', text: 't' });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: undefined }),
    );
  });

  it('mapeia falha nodemailer para ServiceUnavailableException', async () => {
    service = await buildModule();
    sendMail.mockRejectedValue(new Error('SMTP timeout'));

    await expect(
      service.send({ to: 'a@b.com', subject: 's', text: 't' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
