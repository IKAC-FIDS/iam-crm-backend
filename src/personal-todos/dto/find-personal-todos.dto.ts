import { PersonalTodoStatus } from "@prisma/client"
import { IsEnum, IsOptional, IsUUID } from "class-validator"
import { PaginationDto } from "../../common/dto/pagination.dto"

export enum PersonalTodoDateState {
  TODAY = "today",
  UPCOMING = "upcoming",
  OVERDUE = "overdue",
  COMPLETED = "completed",
}

export class FindPersonalTodosDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PersonalTodoStatus)
  status?: PersonalTodoStatus

  @IsOptional()
  @IsEnum(PersonalTodoDateState)
  dateState?: PersonalTodoDateState

  @IsOptional()
  @IsUUID()
  companyId?: string

  @IsOptional()
  @IsUUID()
  opportunityId?: string
}
