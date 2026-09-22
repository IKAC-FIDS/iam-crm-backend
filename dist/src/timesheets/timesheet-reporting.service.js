"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetReportingService = void 0;
const common_1 = require("@nestjs/common");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const report_export_service_1 = require("../common/export/report-export.service");
const timesheet_reporting_policy_1 = require("./timesheet-reporting.policy");
let TimesheetReportingService = class TimesheetReportingService {
    constructor(prisma, exporter) {
        this.prisma = prisma;
        this.exporter = exporter;
    }
    report(query, user) {
        return this.run(query, user, false, false);
    }
    personal(query, user) {
        return this.run({ dateFrom: query.dateFrom, dateTo: query.dateTo, page: 1, limit: 1 }, user, true, false);
    }
    export(query, user) {
        return this.run(query, user, false, true);
    }
    async scope(db, query, user, personal, exporting) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const permissions = tenant.permissions;
        if (personal ? !permissions.includes('timesheet:view') : !permissions.includes(exporting ? 'timesheet:export' : 'timesheet:report'))
            throw new common_1.ForbiddenException('Reporting permission is required');
        const { from, to } = (0, timesheet_reporting_policy_1.reportPeriod)(query.dateFrom, query.dateTo);
        const teams = personal || permissions.includes('timesheet:view-organization')
            ? null : (await db.team.findMany({ where: { organizationId: tenant.organizationId, managerId: tenant.userId, isActive: true }, select: { id: true } })).map(team => team.id);
        if (query.teamId && teams && !teams.includes(query.teamId))
            throw new common_1.ForbiddenException('Requested team is outside manager scope');
        const common = { organizationId: tenant.organizationId,
            ...(personal ? { userId: tenant.userId, membershipId: tenant.membershipId } : query.employeeId ? { userId: query.employeeId } : {}),
            ...(query.teamId ? { teamId: query.teamId } : teams ? { teamId: { in: teams } } : {}) };
        const work = { ...common, workDate: { gte: from, lte: to },
            ...(query.entryType ? { type: query.entryType } : {}), ...(query.status ? { status: query.status } : {}),
            ...(query.taskId ? { taskId: query.taskId } : {}), ...(query.companyId ? { companyId: query.companyId } : {}) };
        const leaveTeams = personal || permissions.includes('leave:view-organization') ? null
            : (await db.team.findMany({ where: { organizationId: tenant.organizationId, managerId: tenant.userId, isActive: true }, select: { id: true } })).map(team => team.id);
        const canReadLeave = personal ? permissions.includes('leave:view') : permissions.some(p => ['leave:approve', 'leave:approve-organization', 'leave:view-organization'].includes(p));
        const leave = { AND: [common,
                ...(leaveTeams ? [{ teamId: { in: leaveTeams } }] : []),
                ...(!canReadLeave || query.entryType || query.taskId || query.companyId ? [{ id: { in: [] } }] : [])],
            startDate: { lte: to }, endDate: { gte: from },
            ...(query.status ? { status: (query.status === 'SUBMITTED' ? 'PENDING' : query.status) } : {}) };
        return { from, to, work, leave, canReadLeave };
    }
    async aggregate(db, scope, query, all) {
        const [work, leave, partial] = await Promise.all([
            db.timesheetEntry.groupBy({ by: ['userId', 'teamId', 'teamNameSnapshot', 'type', 'status'], where: scope.work, _sum: { durationMinutes: true } }),
            db.leaveRequest.groupBy({ by: ['userId', 'teamId', 'teamNameSnapshot', 'status'], where: { AND: [scope.leave, { startDate: { gte: scope.from }, endDate: { lte: scope.to } }] }, _sum: { requestedMinutes: true } }),
            db.leaveRequest.groupBy({ by: ['userId', 'status'], where: { AND: [scope.leave, { OR: [{ startDate: { lt: scope.from } }, { endDate: { gt: scope.to } }] }] }, _count: { _all: true } }),
        ]);
        const ids = [...new Set([...work, ...leave, ...partial].map(row => row.userId))].sort();
        if (ids.length > timesheet_reporting_policy_1.EXPORT_MAX_ROWS)
            throw new common_1.BadRequestException('Too many employees; narrow reporting filters');
        const page = query.page ?? 1, limit = query.limit ?? 20;
        const selected = all ? ids : ids.slice((page - 1) * limit, page * limit);
        const users = await db.user.findMany({ where: { id: { in: selected } }, select: { id: true, fullName: true } });
        const metrics = (id) => {
            const groups = leave.filter(row => !id || row.userId === id);
            const value = (status) => !scope.canReadLeave || partial.some(row => (!id || row.userId === id) && row.status === status)
                ? null : groups.filter(row => row.status === status).reduce((sum, row) => sum + (row._sum.requestedMinutes ?? 0), 0);
            return { ...(0, timesheet_reporting_policy_1.workMetrics)(work.filter(row => !id || row.userId === id)), approvedLeaveMinutes: value('APPROVED'), pendingLeaveMinutes: value('PENDING'),
                scheduledMinutes: null, attendanceVarianceMinutes: null };
        };
        return { period: { dateFrom: query.dateFrom, dateTo: query.dateTo }, filters: query,
            data: selected.map(id => ({ employeeId: id, employeeName: users.find(user => user.id === id)?.fullName ?? '—',
                historicalTeams: [...new Map([...work, ...leave].filter(row => row.userId === id).map(row => [row.teamId, { id: row.teamId, name: row.teamNameSnapshot }])).values()], ...metrics(id) })),
            totals: metrics(), meta: { total: ids.length, page, limit, totalPages: Math.ceil(ids.length / limit), hasNext: page * limit < ids.length, hasPrevious: page > 1 },
            reportingMetadata: { definitions: timesheet_reporting_policy_1.REPORT_DEFINITIONS, employees: 'Employees with matching records only; zero-record employees are not inferred from current membership.',
                boundaryLeaveRequests: partial.reduce((sum, row) => sum + row._count._all, 0), leaveAuthorized: scope.canReadLeave } };
    }
    run(query, user, personal, exporting) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, async (db) => {
            const scope = await this.scope(db, query, user, personal, exporting);
            if (!exporting)
                return this.aggregate(db, scope, query, false);
            const [workCount, overtimeCount, leaveCount] = await Promise.all([
                db.timesheetEntry.count({ where: scope.work }),
                db.timesheetEntry.count({ where: { AND: [scope.work, { type: 'OVERTIME' }] } }),
                db.leaveRequest.count({ where: scope.leave }),
            ]);
            if (workCount + overtimeCount + leaveCount > timesheet_reporting_policy_1.EXPORT_MAX_ROWS)
                throw new common_1.BadRequestException('Export limit exceeded; narrow the period');
            const report = await this.aggregate(db, scope, query, true);
            if (workCount + overtimeCount + leaveCount + report.data.length > timesheet_reporting_policy_1.EXPORT_MAX_ROWS)
                throw new common_1.BadRequestException('Export limit exceeded; narrow the period');
            const review = { select: { user: { select: { fullName: true } } } };
            const [work, leave] = await Promise.all([
                db.timesheetEntry.findMany({ where: scope.work, take: timesheet_reporting_policy_1.EXPORT_MAX_ROWS, orderBy: [{ workDate: 'asc' }, { id: 'asc' }], include: { user: { select: { fullName: true } }, task: { select: { title: true } }, company: { select: { name: true } }, reviewedByMembership: review } }),
                db.leaveRequest.findMany({ where: scope.leave, take: timesheet_reporting_policy_1.EXPORT_MAX_ROWS, orderBy: [{ startDate: 'asc' }, { id: 'asc' }], include: { user: { select: { fullName: true } }, reviewedByMembership: review } }),
            ]);
            const duration = (minutes) => minutes == null ? 'Unavailable' : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
            const stamp = (date) => date?.toISOString() ?? '';
            const detail = work.map(row => ({ Date: stamp(row.workDate).slice(0, 10), Employee: row.user.fullName, 'Historical Team': row.teamNameSnapshot,
                'Work Type': row.type, 'Start Time': row.startMinute == null ? '' : duration(row.startMinute), 'End Time': row.endMinute == null ? '' : duration(row.endMinute),
                Overnight: row.spansMidnight, 'Break Minutes': row.breakMinutes, 'Duration (H:MM)': duration(row.durationMinutes), Task: row.task?.title, Company: row.company?.name,
                Description: row.description, Status: row.status, 'Submitted At (UTC)': stamp(row.submittedAt), Reviewer: row.reviewedByMembership?.user.fullName,
                'Decision Date (UTC)': stamp(row.reviewedAt), 'Rejection Reason': row.rejectionReason }));
            return this.exporter.create('xlsx', `timesheets-${query.dateFrom}-${query.dateTo}`, [
                { name: 'Employee Summary', rows: report.data.map(row => ({ Employee: row.employeeName, 'Historical Teams': row.historicalTeams.map(team => team.name ?? '—').join(', '),
                        Period: `${query.dateFrom} / ${query.dateTo}`, 'Regular (H:MM)': duration(row.regularWorkedMinutes), 'Approved Overtime (H:MM)': duration(row.approvedOvertimeMinutes),
                        'Pending Overtime (H:MM)': duration(row.pendingOvertimeMinutes), 'Actual Work (H:MM)': duration(row.actualWorkedMinutes), 'Approved Leave (H:MM)': duration(row.approvedLeaveMinutes),
                        'Pending Leave (H:MM)': duration(row.pendingLeaveMinutes), 'Scheduled (H:MM)': 'Unavailable: historical membership/schedule data', Variance: 'Unavailable' })) },
                { name: 'Detailed Timesheet', rows: detail }, { name: 'Overtime', rows: detail.filter(row => row['Work Type'] === 'OVERTIME') },
                { name: 'Leave', rows: leave.map(row => ({ Employee: row.user.fullName, 'Historical Team': row.teamNameSnapshot, Type: row.type, Unit: row.unit,
                        Start: stamp(row.startDate).slice(0, 10), End: stamp(row.endDate).slice(0, 10), 'Requested duration (H:MM)': duration(row.requestedMinutes),
                        'Crosses reporting boundary': row.startDate < scope.from || row.endDate > scope.to, Status: row.status, Reason: row.reason,
                        Reviewer: row.reviewedByMembership?.user.fullName, 'Decision Date (UTC)': stamp(row.reviewedAt), 'Rejection Reason': row.rejectionReason })) },
            ], timesheet_reporting_policy_1.EXPORT_MAX_ROWS);
        });
    }
};
exports.TimesheetReportingService = TimesheetReportingService;
exports.TimesheetReportingService = TimesheetReportingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, report_export_service_1.ReportExportService])
], TimesheetReportingService);
//# sourceMappingURL=timesheet-reporting.service.js.map