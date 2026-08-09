import { IsUUID } from 'class-validator';

export class SwitchTenantDto {
  @IsUUID()
  organizationId: string;
}
