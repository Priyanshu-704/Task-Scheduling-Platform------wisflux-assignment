import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { Role } from '../../../common/constants';

export class InviteMemberDto {
  @ApiProperty({
    example: 'colleague@example.com',
    description: 'Email of the user to invite',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'MEMBER',
    enum: Role,
    description: 'Role of the member',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
