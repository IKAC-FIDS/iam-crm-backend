import { IsEmail, IsOptional, IsString, IsUUID, Length, MinLength } from 'class-validator';

export class PortalLoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsUUID() companyId?: string;
}

export class PortalSelectCompanyDto {
  @IsString() selectionToken!: string;
  @IsUUID() companyId!: string;
}

export class PortalSwitchCompanyDto {
  @IsUUID() companyId!: string;
}

export class AcceptCustomerInvitationDto {
  @IsString() @Length(32, 512) token!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() @Length(2, 160) fullName?: string;
}
