import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PricingCurrency } from '@prisma/client';

const decimalString = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value);

export class CreateProductCatalogItemDto {
  @IsString()
  @MaxLength(80)
  code!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;

  @IsOptional()
  @Transform(decimalString)
  @IsDecimal({ decimal_digits: '0,6', force_decimal: false })
  defaultUnitPrice?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsEnum(PricingCurrency)
  pricingCurrency?: PricingCurrency;

  @IsOptional() @Transform(decimalString) @IsDecimal({ decimal_digits: '0,6', force_decimal: false })
  inPersonInputPrice?: string;

  @IsOptional() @Transform(decimalString) @IsDecimal({ decimal_digits: '0,6', force_decimal: false })
  digikalaInputPrice?: string;

  @IsOptional() @Transform(decimalString) @IsDecimal({ decimal_digits: '0,3', force_decimal: false })
  inPersonProfitPercent?: string;

  @IsOptional() @Transform(decimalString) @IsDecimal({ decimal_digits: '0,3', force_decimal: false })
  digikalaProfitPercent?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}
