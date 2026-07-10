import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePersonContactDto {
  @IsOptional()
  @IsUUID()
  typeOptionId?: string;

  /**
   * Deprecated compatibility input.
   * Prefer typeOptionId.
   * If sent, it must match LookupOption.code or LookupOption.label in group = contact_types.
   */
  @IsOptional()
  @IsString()
  type?: string;

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
  @IsUUID()
  typeOptionId?: string;

  /**
   * Deprecated compatibility input.
   * Prefer typeOptionId.
   */
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