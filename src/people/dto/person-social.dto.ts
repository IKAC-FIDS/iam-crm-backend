import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreatePersonSocialDto {
  @IsString()
  platform!: string; // TELEGRAM, LINKEDIN, ...

  @IsString()
  handle!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePersonSocialDto {
  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  handle?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}