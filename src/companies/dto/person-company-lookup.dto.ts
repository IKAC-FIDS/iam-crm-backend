import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class PersonCompanyLookupDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
          .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
          .trim()
      : value,
  )
  @IsString()
  @Matches(/^\d{10}$/, { message: 'کد ملی شخص باید ۱۰ رقم باشد' })
  nationalCode: string;
}
