import { Type } from "class-transformer"
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator"
import { NotificationChannel, NotificationRecipientType } from "@prisma/client"

export class NotificationRecipientRuleInputDto {
  @IsEnum(NotificationRecipientType)
  type!: NotificationRecipientType

  @IsOptional()
  @IsString()
  targetId?: string | null

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(NotificationChannel, { each: true })
  channels!: NotificationChannel[]

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

export class CreateNotificationRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsNotEmpty()
  eventName!: string

  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @IsBoolean()
  mandatory?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  priority?: number

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => NotificationRecipientRuleInputDto)
  recipientRules!: NotificationRecipientRuleInputDto[]
}

export class UpdateNotificationRuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  eventName?: string

  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @IsBoolean()
  mandatory?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  priority?: number

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => NotificationRecipientRuleInputDto)
  recipientRules?: NotificationRecipientRuleInputDto[]
}
