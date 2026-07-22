"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zonedDateParts = zonedDateParts;
exports.zonedMidnightUtc = zonedMidnightUtc;
exports.organizationDayBounds = organizationDayBounds;
exports.addOrganizationCalendarDays = addOrganizationCalendarDays;
function zonedDateParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);
    const value = (type) => Number(parts.find((part) => part.type === type)?.value);
    return { year: value("year"), month: value("month"), day: value("day") };
}
function zonedMidnightUtc(year, month, day, timeZone) {
    const target = Date.UTC(year, month - 1, day);
    let result = new Date(target);
    for (let i = 0; i < 3; i += 1) {
        const formatted = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
        }).formatToParts(result);
        const get = (type) => Number(formatted.find((part) => part.type === type)?.value);
        const represented = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
        result = new Date(result.getTime() + target - represented);
    }
    return result;
}
function organizationDayBounds(now, timeZone) {
    const { year, month, day } = zonedDateParts(now, timeZone);
    const start = zonedMidnightUtc(year, month, day, timeZone);
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
    const end = zonedMidnightUtc(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, nextDate.getUTCDate(), timeZone);
    return { start, end };
}
function addOrganizationCalendarDays(date, days, timeZone) {
    const { year, month, day } = zonedDateParts(date, timeZone);
    const target = new Date(Date.UTC(year, month - 1, day + days));
    return zonedMidnightUtc(target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate(), timeZone);
}
//# sourceMappingURL=timezone-boundary.util.js.map