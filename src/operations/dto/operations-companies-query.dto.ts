import { Priority } from "@prisma/client";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBooleanString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { OwnershipScope } from "../../common/dto/ownership-scope.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

export enum OperationsAttentionState {
  OVERDUE = "OVERDUE",
  TODAY = "TODAY",
  UPCOMING = "UPCOMING",
  NO_NEXT_ACTION = "NO_NEXT_ACTION",
  NORMAL = "NORMAL",
}

export class OperationsCompaniesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Admin-only target user" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Priority)
  @ApiPropertyOptional({ enum: Priority })
  priority?: Priority;

  @IsOptional()
  @IsEnum(OperationsAttentionState)
  attentionState?: OperationsAttentionState;

  @IsOptional()
  @IsBooleanString()
  hasUnreadMessages?: string;

  @IsOptional()
  @IsBooleanString()
  hasActiveOpportunity?: string;

  @IsOptional()
  @IsBooleanString()
  hasNoNextAction?: string;

  @IsOptional()
  @IsEnum(OwnershipScope)
  @ApiPropertyOptional({ enum: OwnershipScope, default: OwnershipScope.MINE })
  ownershipScope?: OwnershipScope = OwnershipScope.MINE;
}
