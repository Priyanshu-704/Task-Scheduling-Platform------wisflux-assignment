import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  IsInt,
} from 'class-validator';

export class UpdateTaskDto {
  @ApiProperty({ example: 'Updated Title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Updated description...', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'IN_PROGRESS',
    enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'],
    required: false,
  })
  @IsEnum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 'CRITICAL',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: false,
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  priority?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({ example: '2026-07-15T18:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ example: ['refactor'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @ApiProperty({ example: [], required: false })
  @IsArray()
  @IsOptional()
  attachments?: { name: string; url: string; size: number; mimeType: string }[];

  @ApiProperty({
    example: 1,
    description: 'Current version for optimistic locking',
  })
  @IsInt()
  @IsOptional() // Handled internally, or validated if client passes it
  version?: number;
}
