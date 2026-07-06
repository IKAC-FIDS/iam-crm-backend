import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreatePersonContactDto {
  @IsString()
  type!: string; // MOBILE, WORK, PERSONAL_EMAIL, ...

  @IsString()
  value!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePersonContactDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}