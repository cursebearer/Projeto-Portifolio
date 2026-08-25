import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@docchain.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senhaSuperSegura', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
