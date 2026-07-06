import { IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindActivitiesDto extends PaginationDto {
  @IsUUID()
  companyId!: string; 
}