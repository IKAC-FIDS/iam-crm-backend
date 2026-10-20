"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPORT_DEFINITIONS = exports.EXPORT_MAX_ROWS = exports.REPORT_MAX_DAYS = void 0;
exports.reportPeriod = reportPeriod;
exports.emptyWorkMetrics = emptyWorkMetrics;
exports.workMetrics = workMetrics;
const common_1 = require("@nestjs/common");
exports.REPORT_MAX_DAYS = 366;
exports.EXPORT_MAX_ROWS = 10000;
function reportPeriod(dateFrom, dateTo) {
    const parse = (value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value)
            throw new common_1.BadRequestException('Invalid reporting date');
        return date;
    };
    const from = parse(dateFrom), to = parse(dateTo);
    if (+to < +from || (+to - +from) / 86400000 >= exports.REPORT_MAX_DAYS)
        throw new common_1.BadRequestException(`Reporting period must be between 1 and ${exports.REPORT_MAX_DAYS} days`);
    return { from, to };
}
function emptyWorkMetrics() {
    return { regularWorkedMinutes: 0, approvedOvertimeMinutes: 0, pendingOvertimeMinutes: 0,
        actualWorkedMinutes: 0, recordedMinutes: 0, submittedMinutes: 0 };
}
function workMetrics(groups) {
    const result = emptyWorkMetrics();
    for (const group of groups) {
        const minutes = group._sum.durationMinutes ?? 0;
        if (group.status !== 'CANCELLED')
            result.recordedMinutes += minutes;
        if (group.status === 'SUBMITTED')
            result.submittedMinutes += minutes;
        if (group.type === 'REGULAR' && group.status === 'APPROVED')
            result.regularWorkedMinutes += minutes;
        if (group.type === 'OVERTIME' && group.status === 'APPROVED')
            result.approvedOvertimeMinutes += minutes;
        if (group.type === 'OVERTIME' && group.status === 'SUBMITTED')
            result.pendingOvertimeMinutes += minutes;
    }
    result.actualWorkedMinutes = result.regularWorkedMinutes + result.approvedOvertimeMinutes;
    return result;
}
exports.REPORT_DEFINITIONS = {
    actualWorkedMinutes: 'Approved regular work plus explicitly approved overtime; leave is excluded.',
    recordedMinutes: 'All non-cancelled records, including drafts and rejected records; not approved work.',
    submittedMinutes: 'Submitted regular and overtime records awaiting a decision.',
    teamFilter: 'Stored team snapshot on the record, never the employee current team. One summary per employee.',
    status: 'SUBMITTED maps to PENDING for leave; entryType/task/company filters exclude leave.',
    leavePeriod: 'Fully contained requests are summed. If a boundary-crossing request exists, the affected metric is null, not prorated without historical daily allocations.',
    scheduledMinutes: 'Unavailable: historical membership intervals and immutable schedule snapshots are not recorded. Current schedules cannot prove historical obligations.',
    attendanceVarianceMinutes: 'Unavailable until historical expected attendance is reliable; never interpreted as underperformance.',
    durationFormat: 'Minutes in the API; H:MM in Excel. Overnight work remains on its starting work date.',
};
//# sourceMappingURL=timesheet-reporting.policy.js.map