import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { DEFAULT_ORGANIZATION_ID } from './default-organization.constants';

export function getCurrentOrganizationId(user: CurrentUserPayload): string {
  return user.organizationId ?? DEFAULT_ORGANIZATION_ID;
}