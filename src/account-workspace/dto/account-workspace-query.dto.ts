import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { IsApiDateString } from "../../common/validators/api-date-string.validator";

export class AccountWorkspaceQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsApiDateString()
  startDate?: string;

  @IsOptional()
  @IsApiDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(10)
  recentLimit = 5;
}
