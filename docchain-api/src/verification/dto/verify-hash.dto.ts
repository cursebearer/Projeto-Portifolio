import { Matches } from 'class-validator';

export class VerifyHashDto {
  @Matches(/^(0x)?[a-fA-F0-9]{64}$/, {
    message: 'hash inválido: exige 64 chars hex SHA-256 (com ou sem 0x).',
  })
  hash!: string;
}
