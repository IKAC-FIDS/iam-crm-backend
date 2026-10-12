import { BadRequestException } from '@nestjs/common';
import { CustomerRequestStatus } from '@prisma/client';

const transitions: Record<CustomerRequestStatus, readonly CustomerRequestStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_CUSTOMER', 'RESOLVED', 'CANCELLED'],
  WAITING_FOR_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'],
  CLOSED: [], CANCELLED: [],
};
export function assertCustomerRequestTransition(from: CustomerRequestStatus, to: CustomerRequestStatus) {
  if (!transitions[from].includes(to)) throw new BadRequestException({ code: 'INVALID_REQUEST_STATUS_TRANSITION', message: `Transition from ${from} to ${to} is not permitted` });
}
export function allowedCustomerRequestTransitions(status: CustomerRequestStatus) { return [...transitions[status]]; }
