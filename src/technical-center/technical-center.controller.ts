import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { AnyPermission, Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import {
  CreateDeliverableDto,
  CreateDocumentDto,
  CreateDocumentVersionDto,
  CreateKnowledgeDto,
  CreateReleaseDto,
  CreateRequirementDto,
  CreateResourceDto,
  CreateTenderDto,
  DecideTenderReviewDto,
  DocumentTransitionDto,
  KnowledgeTransitionDto,
  ReleaseTransitionDto,
  RequestTenderReviewDto,
  TechnicalListDto,
  TechnicalDocumentListDto,
  TenderTransitionDto,
  UpdateDocumentDto,
  UpdateKnowledgeDto,
  UpdateReleaseDto,
  UpdateRequirementDto,
  UpdateResourceDto,
  UpdateTenderDto,
} from './dto/technical-center.dto';
import { TechnicalCenterService } from './technical-center.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Technical releases')
@Controller('technical/releases')
export class TechnicalReleasesController {
  constructor(private readonly service: TechnicalCenterService) {}
  @Get() @Permissions('technical-release:view') list(@Query() q: TechnicalListDto, @CurrentUser() u: CurrentUserPayload) { return this.service.listReleases(q, u); }
  @Post() @Permissions('technical-release:manage') create(@Body() d: CreateReleaseDto, @CurrentUser() u: CurrentUserPayload) { return this.service.createRelease(d, u); }
  @Get(':id') @Permissions('technical-release:view') get(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.getRelease(id, u); }
  @Patch(':id') @Permissions('technical-release:manage') update(@Param('id') id: string, @Body() d: UpdateReleaseDto, @CurrentUser() u: CurrentUserPayload) { return this.service.updateRelease(id, d, u); }
  @Post(':id/transition') @AnyPermission('technical-release:manage', 'technical-release:publish') transition(@Param('id') id: string, @Body() d: ReleaseTransitionDto, @CurrentUser() u: CurrentUserPayload) { return this.service.transitionRelease(id, d, u); }
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Technical knowledge')
@Controller('technical/knowledge-base')
export class TechnicalKnowledgeController {
  constructor(private readonly service: TechnicalCenterService) {}
  @Get() @Permissions('technical-knowledge:view') list(@Query() q: TechnicalListDto, @CurrentUser() u: CurrentUserPayload) { return this.service.listKnowledge(q, u); }
  @Post() @Permissions('technical-knowledge:manage') create(@Body() d: CreateKnowledgeDto, @CurrentUser() u: CurrentUserPayload) { return this.service.createKnowledge(d, u); }
  @Get(':id') @Permissions('technical-knowledge:view') get(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.getKnowledge(id, u); }
  @Patch(':id') @Permissions('technical-knowledge:manage') update(@Param('id') id: string, @Body() d: UpdateKnowledgeDto, @CurrentUser() u: CurrentUserPayload) { return this.service.updateKnowledge(id, d, u); }
  @Post(':id/transition') @AnyPermission('technical-knowledge:manage', 'technical-knowledge:publish') transition(@Param('id') id: string, @Body() d: KnowledgeTransitionDto, @CurrentUser() u: CurrentUserPayload) { return this.service.transitionKnowledge(id, d, u); }
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Technical documents')
@Controller('technical/documents')
export class TechnicalDocumentsController {
  constructor(private readonly service: TechnicalCenterService) {}
  @Get() @Permissions('technical-document:view') list(@Query() q: TechnicalDocumentListDto, @CurrentUser() u: CurrentUserPayload) { return this.service.listDocuments(q, u); }
  @Post() @Permissions('technical-document:manage') create(@Body() d: CreateDocumentDto, @CurrentUser() u: CurrentUserPayload) { return this.service.createDocument(d, u); }
  @Get(':id') @Permissions('technical-document:view') get(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.getDocument(id, u); }
  @Patch(':id') @Permissions('technical-document:manage') update(@Param('id') id: string, @Body() d: UpdateDocumentDto, @CurrentUser() u: CurrentUserPayload) { return this.service.updateDocument(id, d, u); }
  @Post(':id/transition') @AnyPermission('technical-document:manage', 'technical-document:approve') transition(@Param('id') id: string, @Body() d: DocumentTransitionDto, @CurrentUser() u: CurrentUserPayload) { return this.service.transitionDocument(id, d, u); }
  @Get(':id/versions') @Permissions('technical-document:view') versions(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.listDocumentVersions(id, u); }
  @Post(':id/versions') @Permissions('technical-document:manage') version(@Param('id') id: string, @Body() d: CreateDocumentVersionDto, @CurrentUser() u: CurrentUserPayload) { return this.service.addDocumentVersion(id, d, u); }
  @Get(':id/versions/:versionId') @Permissions('technical-document:view') getVersion(@Param('id') id: string, @Param('versionId') versionId: string, @CurrentUser() u: CurrentUserPayload) { return this.service.getDocumentVersion(id, versionId, u); }
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Technical resources')
@Controller('technical/resources')
export class TechnicalResourcesController {
  constructor(private readonly service: TechnicalCenterService) {}
  @Get() @Permissions('technical-resource:view') list(@Query() q: TechnicalListDto, @CurrentUser() u: CurrentUserPayload) { return this.service.listResources(q, u); }
  @Post() @Permissions('technical-resource:manage') create(@Body() d: CreateResourceDto, @CurrentUser() u: CurrentUserPayload) { return this.service.createResource(d, u); }
  @Get(':id') @Permissions('technical-resource:view') get(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.getResource(id, u); }
  @Patch(':id') @Permissions('technical-resource:manage') update(@Param('id') id: string, @Body() d: UpdateResourceDto, @CurrentUser() u: CurrentUserPayload) { return this.service.updateResource(id, d, u); }
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Technical tenders')
@Controller('technical/tenders')
export class TechnicalTendersController {
  constructor(private readonly service: TechnicalCenterService) {}
  @Get() @Permissions('technical-tender:view') list(@Query() q: TechnicalListDto, @CurrentUser() u: CurrentUserPayload) { return this.service.listTenders(q, u); }
  @Post() @Permissions('technical-tender:manage') create(@Body() d: CreateTenderDto, @CurrentUser() u: CurrentUserPayload) { return this.service.createTender(d, u); }
  @Get(':id') @Permissions('technical-tender:view') get(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.getTender(id, u); }
  @Patch(':id') @Permissions('technical-tender:manage') update(@Param('id') id: string, @Body() d: UpdateTenderDto, @CurrentUser() u: CurrentUserPayload) { return this.service.updateTender(id, d, u); }
  @Post(':id/transition') @AnyPermission('technical-tender:manage', 'technical-tender:submit', 'technical-tender:close') transition(@Param('id') id: string, @Body() d: TenderTransitionDto, @CurrentUser() u: CurrentUserPayload) { return this.service.transitionTender(id, d, u); }
  @Get(':id/readiness') @Permissions('technical-tender:view') readiness(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.getTenderReadiness(id, u); }
  @Get(':id/history') @Permissions('technical-tender:view') history(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.tenderHistory(id, u); }
  @Get(':id/reviews') @Permissions('technical-tender:view') reviews(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.listTenderReviews(id, u); }
  @Post(':id/reviews') @AnyPermission('technical-tender:review-technical', 'technical-tender:review-commercial') requestReview(@Param('id') id: string, @Body() d: RequestTenderReviewDto, @CurrentUser() u: CurrentUserPayload) { return this.service.requestTenderReview(id, d, u); }
  @Post(':id/reviews/:reviewId/decision') @AnyPermission('technical-tender:review-technical', 'technical-tender:review-commercial') decideReview(@Param('id') id: string, @Param('reviewId') reviewId: string, @Body() d: DecideTenderReviewDto, @CurrentUser() u: CurrentUserPayload) { return this.service.decideTenderReview(id, reviewId, d, u); }
  @Get(':id/requirements') @Permissions('technical-tender:view') requirements(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.service.listRequirements(id, u); }
  @Post(':id/requirements') @Permissions('technical-tender:manage') addRequirement(@Param('id') id: string, @Body() d: CreateRequirementDto, @CurrentUser() u: CurrentUserPayload) { return this.service.addRequirement(id, d, u); }
  @Patch(':id/requirements/:requirementId') @Permissions('technical-tender:manage') updateRequirement(@Param('id') id: string, @Param('requirementId') requirementId: string, @Body() d: UpdateRequirementDto, @CurrentUser() u: CurrentUserPayload) { return this.service.updateRequirement(id, requirementId, d, u); }
  @Delete(':id/requirements/:requirementId') @Permissions('technical-tender:manage') removeRequirement(@Param('id') id: string, @Param('requirementId') requirementId: string, @CurrentUser() u: CurrentUserPayload) { return this.service.removeRequirement(id, requirementId, u); }
  @Post(':id/deliverables') @Permissions('technical-tender:manage') addDeliverable(@Param('id') id: string, @Body() d: CreateDeliverableDto, @CurrentUser() u: CurrentUserPayload) { return this.service.addDeliverable(id, d, u); }
  @Delete(':id/deliverables/:deliverableId') @Permissions('technical-tender:manage') removeDeliverable(@Param('id') id: string, @Param('deliverableId') deliverableId: string, @CurrentUser() u: CurrentUserPayload) { return this.service.removeDeliverable(id, deliverableId, u); }
}
