import { PersonalTodoRecurrenceType } from "@prisma/client"
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator"
import { IsApiDateString } from "../../common/validators/api-date-string.validator"

export class CreatePersonalTodoDto {
  @IsString()
  @MaxLength(200)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string

  @IsOptional()
  @IsApiDateString()
  dueAt?: string

  @IsOptional()
  @IsApiDateString()
  reminderAt?: string

  @IsOptional()
  @IsEnum(PersonalTodoRecurrenceType)
  recurrenceType?: PersonalTodoRecurrenceType

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  recurrenceInterval?: number

  @IsOptional()
  @IsUUID()
  companyId?: string

  @IsOptional()
  @IsUUID()
  opportunityId?: string

  @IsOptional()
  @IsUUID()
  taskId?: string
}
