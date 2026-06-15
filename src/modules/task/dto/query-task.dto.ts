import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryTaskDto {
  @ApiProperty({ example: 1, required: false, default: 1 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ example: 10, required: false, default: 10 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ example: 'TODO', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'HIGH', required: false })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({
    example: 'auth setup',
    description: 'Full-text search query',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ example: 'createdAt', required: false, default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false,
    default: 'DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
