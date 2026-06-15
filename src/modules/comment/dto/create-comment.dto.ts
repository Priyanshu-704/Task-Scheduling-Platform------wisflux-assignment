import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'This auth flow looks solid. Let us merge!',
    description: 'The comment content message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
