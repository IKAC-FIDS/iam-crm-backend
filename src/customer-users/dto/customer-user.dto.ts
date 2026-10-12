import { CustomerMembershipStatus, CustomerRole } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class SetCompanyPortalEnabledDto { @IsBoolean() enabled!: boolean; }
export class InviteCustomerDto { @IsEmail() email!: string; @IsEnum(CustomerRole) role!: CustomerRole; }
export class UpdateCustomerMembershipDto {
  @IsOptional() @IsEnum(CustomerRole) role?: CustomerRole;
  @IsOptional() @IsEnum(CustomerMembershipStatus) status?: CustomerMembershipStatus;
}
export class MembershipParamDto { @IsUUID() membershipId!: string; }
export class InvitationParamDto { @IsUUID() invitationId!: string; }
export class RecoveryCustomerAdminDto { @IsString() @IsEmail() email!: string; }
