import { IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmCrmAssistantActionDto {
  @IsString()
  @MinLength(20)
  @MaxLength(16_384)
  token!: string;
}
