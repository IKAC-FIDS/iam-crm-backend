import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  team?: string;
}