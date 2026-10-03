import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class OperationsWorkspaceQueryDto {
  @ApiPropertyOptional({ description: "Admin-only target user" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  recentLimit?: number = 5;
}
