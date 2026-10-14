import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CurrentPortalPrincipal } from '../customer-access/current-portal-principal.decorator';
import { PortalJwtAuthGuard } from '../customer-access/portal-jwt-auth.guard';
import type { PortalPrincipal } from '../customer-access/portal-principal';
import { CustomerRequestsService } from './customer-requests.service';
import { CustomerRequestOperationsService } from './customer-request-operations.service';
import { ConfigureAvailabilityDto, CreateLinkedOpportunityDto, CreateLinkedTaskDto, CreateLinkedTechnicalDocumentDto, CreatePortalRequestDto, CreateRequestTypeDto, FormSchemaDto, LinkCustomerRequestRecordDto, PortalRequestListDto, RequestListDto, RequestTypeListDto, ShareRequestDto, UnlinkCustomerRequestRecordDto, UpdateDraftDto, UpdateRequestStatusDto, UpdateRequestTriageDto, UpdateRequestTypeDto } from './dto/customer-request.dto';

@Controller('admin/customer-request-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InternalRequestTypesController {
  constructor(private service: CustomerRequestsService) {}
  @Get() @Permissions('customer-request-type:view') list(@Query() q: RequestTypeListDto, @CurrentUser() u: CurrentUserPayload) { return this.service.listTypesInternal(u, q.includeRetired); }
  @Post() @Permissions('customer-request-type:manage') create(@Body() d: CreateRequestTypeDto, @CurrentUser() u: CurrentUserPayload) { return this.service.createType(d, u); }
  @Patch(':id') @Permissions('customer-request-type:manage') update(@Param('id') id: string, @Body() d: UpdateRequestTypeDto, @CurrentUser() u: CurrentUserPayload) { return this.service.updateType(id, d, u); }
  @Patch(':id/availability') @Permissions('customer-request-type:manage') availability(@Param('id') id: string, @Body() d: ConfigureAvailabilityDto, @CurrentUser() u: CurrentUserPayload) { return this.service.configureAvailability(id, d, u); }
  @Post(':id/form-draft') @Permissions('customer-request-type:manage') formDraft(@Param('id') id: string, @Body() d: FormSchemaDto, @CurrentUser() u: CurrentUserPayload) { return this.service.saveDraftForm(id, d.schema, u); }
  @Post(':id/form-publish') @Permissions('customer-request-type:manage') publish(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.publishForm(id, u); }
  @Get(':id/form-versions') @Permissions('customer-request-type:view') versions(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.formHistory(id, u); }
}

@Controller('portal/request-types') @UseGuards(PortalJwtAuthGuard)
export class PortalRequestTypesController {
  constructor(private service: CustomerRequestsService) {}
  @Get() list(@CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.portalCatalog(p); }
  @Get(':id') get(@Param('id') id: string, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.portalType(id, p); }
}

@Controller('portal/requests') @UseGuards(PortalJwtAuthGuard)
export class PortalRequestsController {
  constructor(private service: CustomerRequestsService) {}
  @Get() list(@Query() q: PortalRequestListDto, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.listPortal(q, p); }
  @Post() create(@Body() d: CreatePortalRequestDto, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.createPortalRequest(d, p); }
  @Get(':id') detail(@Param('id') id: string, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.portalDetail(id, p); }
  @Patch(':id/draft') draft(@Param('id') id: string, @Body() d: UpdateDraftDto, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.updateDraft(id, d, p); }
  @Post(':id/submit') submit(@Param('id') id: string, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.submit(id, p); }
  @Post(':id/cancel') cancel(@Param('id') id: string, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.cancel(id, p); }
  @Get(':id/history') history(@Param('id') id: string, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.portalHistory(id, p); }
  @Get(':id/shares') shares(@Param('id') id: string, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.listShares(id, p); }
  @Post(':id/shares') share(@Param('id') id: string, @Body() d: ShareRequestDto, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.share(id, d.membershipId, p); }
  @Delete(':id/shares/:shareId') revoke(@Param('id') id: string, @Param('shareId') shareId: string, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.revokeShare(id, shareId, p); }
}

@Controller('customer-requests') @UseGuards(JwtAuthGuard, PermissionsGuard)
export class InternalRequestsController {
  constructor(private service: CustomerRequestsService, private operations: CustomerRequestOperationsService) {}
  @Get() @Permissions('customer-request:view') list(@Query() q: RequestListDto, @CurrentUser() u: CurrentUserPayload) { return this.service.listInternal(q, u); }
  @Get('triage') @Permissions('customer-request:view') triage(@Query() q: RequestListDto, @CurrentUser() u: CurrentUserPayload) { return this.operations.list(q, u); }
  @Get('triage-options') @Permissions('customer-request:view') triageOptions(@CurrentUser() u: CurrentUserPayload) { return this.operations.options(u); }
  @Patch(':id/triage') @Permissions('customer-request:triage') updateTriage(@Param('id') id: string, @Body() d: UpdateRequestTriageDto, @CurrentUser() u: CurrentUserPayload) { return this.operations.updateTriage(id, d, u); }
  @Get(':id/triage-history') @Permissions('customer-request:view') triageHistory(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.operations.history(id, u); }
  @Get(':id/crm-links') @Permissions('customer-request:view') links(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.operations.links(id, u); }
  @Post(':id/crm-links') @Permissions('customer-request:link') link(@Param('id') id: string, @Body() d: LinkCustomerRequestRecordDto, @CurrentUser() u: CurrentUserPayload) { return this.operations.linkExisting(id, d, u); }
  @Delete(':id/crm-links/:linkId') @Permissions('customer-request:link') unlink(@Param('id') id: string, @Param('linkId') linkId: string, @Body() d: UnlinkCustomerRequestRecordDto, @CurrentUser() u: CurrentUserPayload) { return this.operations.unlink(id, linkId, d.reason, u); }
  @Post(':id/crm-links/tasks') @Permissions('customer-request:link') createTask(@Param('id') id: string, @Body() d: CreateLinkedTaskDto, @CurrentUser() u: CurrentUserPayload) { return this.operations.createTask(id, d, u); }
  @Post(':id/crm-links/opportunities') @Permissions('customer-request:link') createOpportunity(@Param('id') id: string, @Body() d: CreateLinkedOpportunityDto, @CurrentUser() u: CurrentUserPayload) { return this.operations.createOpportunity(id, d, u); }
  @Post(':id/crm-links/technical-documents') @Permissions('customer-request:link') createDocument(@Param('id') id: string, @Body() d: CreateLinkedTechnicalDocumentDto, @CurrentUser() u: CurrentUserPayload) { return this.operations.createTechnicalDocument(id, d, u); }
  @Get(':id') @Permissions('customer-request:view') detail(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.internalDetail(id, u); }
  @Patch(':id/status') @Permissions('customer-request:manage') status(@Param('id') id: string, @Body() d: UpdateRequestStatusDto, @CurrentUser() u: CurrentUserPayload) { return this.service.changeStatus(id, d, u); }
}
