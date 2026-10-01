import { PersonalTodoRecurrenceType } from "@prisma/client"
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator"
import { IsApiDateString } from "../../common/validators/api-date-string.validator"

export class UpdatePersonalTodoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string | null

  @IsOptional()
  @IsApiDateString()
  dueAt?: string | null

  @IsOptional()
  @IsApiDateString()
  reminderAt?: string | null

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
  companyId?: string | null

  @IsOptional()
  @IsUUID()
  opportunityId?: string | null

  @IsOptional()
  @IsUUID()
  taskId?: string | null
}
