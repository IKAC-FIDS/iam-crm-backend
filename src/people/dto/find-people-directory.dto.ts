import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindPeopleDirectoryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  personaTag?: string;

  @IsOptional()
  @IsBooleanString()
  isPrimaryContact?: string;

  @IsOptional()
  @IsBooleanString()
  hasEmail?: string;

  @IsOptional()
  @IsBooleanString()
  hasPhone?: string;
}
