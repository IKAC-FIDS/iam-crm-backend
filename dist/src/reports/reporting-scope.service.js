"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingScopeService = void 0;
const common_1 = require("@nestjs/common");
const active_opportunity_scope_1 = require("../common/opportunities/active-opportunity-scope");
const ownership_scope_dto_1 = require("../common/dto/ownership-scope.dto");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const team_scope_util_1 = require("../common/tenant/team-scope.util");
let ReportingScopeService = class ReportingScopeService {
    company(f, user) {
        return {
            AND: [
                { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), archivedAt: null },
                ...(f.companyIds?.length ? [{ id: { in: f.companyIds } }] : []),
                ...(f.ownerIds?.length ? [{ ownerId: { in: f.ownerIds } }] : []),
                ...(f.teams?.length ? [{ owner: (0, team_scope_util_1.userTeamFilterWhere)(f.teams) }] : []),
                ...this.companyOwnership(f.ownershipScope, user),
            ],
        };
    }
    opportunity(f, user, active = false) {
        return {
            AND: [
                {
                    organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                    company: { archivedAt: null },
                },
                ...(active ? [(0, active_opportunity_scope_1.activeOpportunityStateWhere)()] : []),
                ...(f.companyIds?.length ? [{ companyId: { in: f.companyIds } }] : []),
                ...(f.ownerIds?.length ? [{ ownerId: { in: f.ownerIds } }] : []),
                ...(f.teams?.length ? [{ owner: (0, team_scope_util_1.userTeamFilterWhere)(f.teams) }] : []),
                ...(f.stages?.length
                    ? [
                        {
                            OR: [
                                { stageId: { in: f.stages } },
                                {
                                    stage: {
                                        code: { in: f.stages.map((x) => x.toUpperCase()) },
                                    },
                                },
                            ],
                        },
                    ]
                    : []),
                ...(f.priorities?.length ? [{ priority: { in: f.priorities } }] : []),
                ...(f.industries?.length
                    ? [{ company: { industry: { in: f.industries } } }]
                    : []),
                ...(f.sources?.length ? [{ source: { in: f.sources } }] : []),
                ...this.opportunityOwnership(f.ownershipScope, user),
            ],
        };
    }
    companyOwnership(scope, user) {
        return scope === ownership_scope_dto_1.OwnershipScope.MINE
            ? [{ ownerId: user.userId }]
            : scope === ownership_scope_dto_1.OwnershipScope.TEAM
                ? [{ owner: (0, team_scope_util_1.userTeamScopeWhere)(user) }]
                : scope === ownership_scope_dto_1.OwnershipScope.UNASSIGNED
                    ? [{ ownerId: null }]
                    : [];
    }
    opportunityOwnership(scope, user) {
        return scope === ownership_scope_dto_1.OwnershipScope.MINE
            ? [
                {
                    OR: [
                        { ownerId: user.userId },
                        { company: { ownerId: user.userId } },
                    ],
                },
            ]
            : scope === ownership_scope_dto_1.OwnershipScope.TEAM
                ? [{ owner: (0, team_scope_util_1.userTeamScopeWhere)(user) }]
                : scope === ownership_scope_dto_1.OwnershipScope.UNASSIGNED
                    ? [{ ownerId: null }]
                    : [];
    }
};
exports.ReportingScopeService = ReportingScopeService;
exports.ReportingScopeService = ReportingScopeService = __decorate([
    (0, common_1.Injectable)()
], ReportingScopeService);
//# sourceMappingURL=reporting-scope.service.js.map