import { IsDateString, IsOptional } from 'class-validator';

export class RescheduleTaskDto {
  @IsDateString()
  dueAt!: string;

  @IsOptional()
  @IsDateString()
  reminderAt?: string;
}