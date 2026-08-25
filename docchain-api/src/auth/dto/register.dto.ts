import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@docchain.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senhaSuperSegura', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'Rafael' })
  @IsOptional()
  @IsString()
  name?: string;
}
