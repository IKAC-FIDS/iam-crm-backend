import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { IsApiDateString } from '../../common/validators/api-date-string.validator';

const emptyToUndefined = ({ value }: { value: unknown }) => value === '' || value === null || value === undefined ? undefined : value;
const normalizeDigits = (value: unknown) => typeof value === 'string'
  ? value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
  : value;
const optionalYear = ({ value }: { value: unknown }) => value === '' || value == null ? undefined : Number(normalizeDigits(value));

export class CreatePersonEmploymentHistoryDto {
  @IsUUID() companyId!: string;
  @IsOptional() @Transform(emptyToUndefined) @IsString() @MaxLength(2000) description?: string;
}
export class UpdatePersonEmploymentHistoryDto extends PartialType(CreatePersonEmploymentHistoryDto) {}

export class CreatePersonEmploymentPositionDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @Transform(emptyToUndefined) @IsApiDateString() startDate?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsApiDateString() endDate?: string;
  @IsOptional() @IsBoolean() isCurrent?: boolean;
  @IsOptional() @Transform(emptyToUndefined) @IsString() @MaxLength(2000) description?: string;
}
export class UpdatePersonEmploymentPositionDto extends PartialType(CreatePersonEmploymentPositionDto) {}

export class CreatePersonEducationHistoryDto {
  @IsOptional() @Transform(emptyToUndefined) @IsString() @MaxLength(200) degree?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsString() @MaxLength(300) university?: string;
  @IsOptional() @Transform(optionalYear) @IsInt() @Min(1000) @Max(3000) year?: number;
  @IsOptional() @Transform(emptyToUndefined) @IsString() @MaxLength(2000) description?: string;
}
export class UpdatePersonEducationHistoryDto extends PartialType(CreatePersonEducationHistoryDto) {}
