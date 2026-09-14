import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class ShareDocumentDto {
  @ApiProperty({ example: 'juiz@tribunal.gov.br' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'Segue o contrato assinado para vosso conhecimento.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
