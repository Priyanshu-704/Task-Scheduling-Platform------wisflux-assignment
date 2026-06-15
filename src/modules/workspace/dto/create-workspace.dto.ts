import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Name of the workspace' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'acme-corp',
    description: 'URL slug (auto-generated if empty)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;
}
