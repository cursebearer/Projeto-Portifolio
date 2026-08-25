import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class VerifyHashDto {
  @ApiProperty({
    example:
      '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd',
    description: 'SHA-256 hex, 64 chars (aceita prefixo 0x opcional).',
  })
  @Matches(/^(0x)?[a-fA-F0-9]{64}$/, {
    message: 'hash inválido: exige 64 chars hex SHA-256 (com ou sem 0x).',
  })
  hash!: string;
}
