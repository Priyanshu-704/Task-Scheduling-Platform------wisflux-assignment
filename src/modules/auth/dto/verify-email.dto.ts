import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'User email address',
  })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'verification-code-xyz',
    description: 'Verification code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
