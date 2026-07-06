import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const emptyStringToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class RescheduleActivityDto {
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  nextActionDate!: string;

  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  note?: string;
}
