import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Document } from '@prisma/client';
import PDFDocument = require('pdfkit');
import { toDataURL as qrToDataURL } from 'qrcode';

const TEMPLATE_VERSION = 'v1.0';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly verifyBaseUrl: string;
  private readonly etherscanBaseUrl: string;

  constructor(config: ConfigService) {
    const network = config.get<string>('NETWORK', 'sepolia');
    this.verifyBaseUrl =
      config.get<string>('VERIFY_PUBLIC_BASE_URL') ??
      'https://docchain.dev/verify/public';
    this.etherscanBaseUrl =
      network === 'mainnet'
        ? 'https://etherscan.io/tx'
        : `https://${network}.etherscan.io/tx`;
  }

  async generateComprovante(
    document: Document,
    emitterUser: { name: string | null; email: string },
  ): Promise<Buffer> {
    const hash = document.hash;
    const verifyUrl = `${this.verifyBaseUrl}/${hash}`;
    const txUrl = document.txHash
      ? `${this.etherscanBaseUrl}/${document.txHash}`
      : null;
    const qrDataUrl = await qrToDataURL(verifyUrl, { width: 140 });
    const qrBuffer = Buffer.from(
      qrDataUrl.replace(/^data:image\/png;base64,/, ''),
      'base64',
    );

    return this.render((doc) => {
      // Cabeçalho
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('COMPROVANTE DE REGISTRO', { align: 'center' });
      doc
        .fontSize(10)
        .font('Helvetica-Oblique')
        .text('Prova pública em blockchain', { align: 'center' });
      doc.moveDown(1);

      this.section(doc, 'IDENTIFICAÇÃO DO DOCUMENTO');
      this.kvTable(doc, [
        ['Nome do arquivo', document.fileName],
        ['Tipo (MIME)', document.mimeType],
        ['Tamanho', `${document.fileSize} bytes`],
        [
          'Registrado por',
          `${emitterUser.name ?? '—'} (${emitterUser.email})`,
        ],
        ['Data do registro (UTC)', this.formatDate(document.confirmedAt)],
      ]);

      this.section(doc, 'IMPRESSÃO DIGITAL (SHA-256)');
      doc
        .font('Courier')
        .fontSize(10)
        .text(this.formatHash(hash), { align: 'left' });
      doc.moveDown(0.5);

      this.section(doc, 'REGISTRO ON-CHAIN');
      this.kvTable(doc, [
        ['Rede', document.network ?? 'sepolia'],
        ['Tx hash', document.txHash ?? '—'],
        ['Bloco', String(document.blockNumber ?? '—')],
        ['Wallet emissora', document.walletAddress ?? '—'],
        ['Storage ref', document.storageRef ?? '—'],
      ]);

      this.section(doc, 'COMO VERIFICAR AUTENTICIDADE');
      doc
        .font('Helvetica')
        .fontSize(9)
        .text('1. Calcule o SHA-256 do arquivo anexado a este email:');
      doc
        .font('Courier')
        .fontSize(9)
        .text('   Linux/Mac: sha256sum contrato.pdf')
        .text('   Windows:   certutil -hashfile contrato.pdf SHA256');
      doc.moveDown(0.3);
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(
          '2. Compare com a impressão digital acima. Se coincidir, o arquivo é idêntico ao registrado.',
        );
      doc.moveDown(0.3);
      doc
        .font('Helvetica')
        .fontSize(9)
        .text('3. Confirme na blockchain (opcional). Escaneie o QR ou acesse:');
      doc.fillColor('#1e40af').text(verifyUrl);
      if (txUrl) {
        doc.fillColor('#000000').text('Ou diretamente no Etherscan:');
        doc.fillColor('#1e40af').text(txUrl);
      }
      doc.fillColor('#000000');
      doc.moveDown(0.5);
      doc.image(qrBuffer, { width: 100, align: 'right' as never });

      doc.moveDown(1);
      doc
        .font('Helvetica-Oblique')
        .fontSize(8)
        .text(
          `Comprovante emitido automaticamente pela plataforma DocChain em ${this.formatDate(new Date())}.`,
          { align: 'center' },
        );
      doc
        .font('Helvetica-Oblique')
        .fontSize(8)
        .text(
          `Template ${TEMPLATE_VERSION}. Documento anexado é a cópia original; qualquer alteração invalida a prova.`,
          { align: 'center' },
        );
    });
  }

  private render(builder: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      builder(doc);
      doc.end();
    });
  }

  private section(doc: PDFKit.PDFDocument, title: string): void {
    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000').text(title);
    doc.moveDown(0.3);
  }

  private kvTable(
    doc: PDFKit.PDFDocument,
    rows: Array<[string, string]>,
  ): void {
    for (const [label, value] of rows) {
      doc.font('Helvetica-Bold').fontSize(9).text(label, { continued: true });
      doc.font('Helvetica').fontSize(9).text(`  ${value}`);
    }
  }

  private formatHash(hash: string): string {
    return `${hash.slice(0, 32)}\n${hash.slice(32)}`;
  }

  private formatDate(date: Date | null): string {
    if (!date) return '—';
    return new Date(date)
      .toISOString()
      .replace('T', ' ')
      .replace(/\.\d+Z$/, ' UTC');
  }
}
