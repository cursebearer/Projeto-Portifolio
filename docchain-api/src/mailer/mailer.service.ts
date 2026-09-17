import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const port = config.get<number>('SMTP_PORT', 465);
    const user = config.get<string>('SMTP_USER');
    const password = config.get<string>('SMTP_PASSWORD');
    this.from = config.get<string>('SMTP_FROM') ?? '';

    if (!host || !user || !password || !this.from) {
      throw new Error(
        'SMTP config incompleta: SMTP_HOST, SMTP_USER, SMTP_PASSWORD e SMTP_FROM são obrigatórios.',
      );
    }

    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    });
  }

  async send(opts: SendOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        attachments: opts.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Falha ao enviar email para ${opts.to}: ${message}`);
      throw new ServiceUnavailableException(
        `Falha ao enviar email: ${message}`,
      );
    }
  }
}
