import { CompanyEngagementStatus } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateCompanyEngagementDto {
  @ApiProperty({ enum: CompanyEngagementStatus })
  @IsEnum(CompanyEngagementStatus)
  status!: CompanyEngagementStatus;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextReviewAt?: Date;
}

export class UpdateCompanyPinDto {
  @ApiProperty()
  @IsBoolean()
  isPinned!: boolean;
}
