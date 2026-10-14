import { IsString, MaxLength } from 'class-validator';

export class UpdateMeetingOutcomeDto {
  @IsString()
  @MaxLength(10000)
  completionNote!: string;
}
