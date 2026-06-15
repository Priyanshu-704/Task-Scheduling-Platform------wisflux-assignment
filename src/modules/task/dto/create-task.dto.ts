import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Implement Authentication',
    description: 'Title of the task',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Create signup/login flows using JWT and refresh tokens.',
    description: 'Task description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Parent Task ID for subtasks',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentTaskId?: string;

  @ApiProperty({
    example: 'HIGH',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    description: 'Task priority',
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  priority?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Assigned User ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({
    example: '2026-06-30T12:00:00Z',
    description: 'Due date of the task',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({
    example: ['auth', 'backend'],
    description: 'Labels associated with the task',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @ApiProperty({
    example: [
      {
        name: 'spec.pdf',
        url: 'https://...',
        size: 1024,
        mimeType: 'application/pdf',
      },
    ],
    description: 'Attachments list',
    required: false,
  })
  @IsArray()
  @IsOptional()
  attachments?: { name: string; url: string; size: number; mimeType: string }[];
}
