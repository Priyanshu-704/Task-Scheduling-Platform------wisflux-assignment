import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Backend Architecture',
    description: 'Name of the project',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Setup databases, cache layer, workers, and pipelines.',
    description: 'Description of the project',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
