import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMeDto {
  @ApiProperty({ example: 'Rafael Pavesi', minLength: 1, maxLength: 100 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class DeleteAccountDto {
  @ApiProperty({ description: 'Senha atual, para confirmar a exclusão.' })
  @IsString()
  @MinLength(1)
  password!: string;
}
