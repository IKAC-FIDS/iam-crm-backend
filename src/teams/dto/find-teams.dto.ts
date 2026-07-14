import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindTeamsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  managerId?: string;
}
