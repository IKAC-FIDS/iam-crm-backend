import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class FindActivityOpportunityOptionsDto {
  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
