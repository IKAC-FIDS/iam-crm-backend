"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTime = assertTime;
exports.assertTimeZone = assertTimeZone;
exports.quietHoursDecision = quietHoursDecision;
exports.dailyDigestWindow = dailyDigestWindow;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
function assertTime(value) {
    if (!TIME.test(value))
        throw new Error("Time must use HH:mm format");
}
function assertTimeZone(value) {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    }
    catch {
        throw new Error("Invalid IANA timezone");
    }
}
function parts(date, timeZone) {
    const values = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
    const get = (type) => Number(values.find(item => item.type === type)?.value);
    return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}
function utcForLocal(year, month, day, hour, minute, timeZone) {
    let guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
    for (let index = 0; index < 3; index += 1) {
        const actual = parts(guess, timeZone);
        const wantedUtc = Date.UTC(year, month - 1, day, hour, minute);
        const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
        guess = new Date(guess.getTime() + wantedUtc - actualUtc);
    }
    return guess;
}
function quietHoursDecision(now, startTime, endTime, timeZone) {
    assertTime(startTime);
    assertTime(endTime);
    assertTimeZone(timeZone);
    const local = parts(now, timeZone);
    const minute = local.hour * 60 + local.minute;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const start = sh * 60 + sm, end = eh * 60 + em;
    const active = start === end || (start < end ? minute >= start && minute < end : minute >= start || minute < end);
    if (!active)
        return { active: false, resumeAt: null };
    const endToday = minute < end || start < end;
    const base = new Date(Date.UTC(local.year, local.month - 1, local.day + (endToday ? 0 : 1)));
    return { active: true, resumeAt: utcForLocal(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), eh, em, timeZone) };
}
function dailyDigestWindow(now, sendTime, timeZone) {
    assertTime(sendTime);
    assertTimeZone(timeZone);
    const local = parts(now, timeZone);
    const [hour, minute] = sendTime.split(":").map(Number);
    const todaySend = utcForLocal(local.year, local.month, local.day, hour, minute, timeZone);
    const sendNextDay = now >= todaySend;
    const base = new Date(Date.UTC(local.year, local.month - 1, local.day + (sendNextDay ? 1 : 0)));
    const scheduledFor = utcForLocal(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), hour, minute, timeZone);
    const windowBase = new Date(Date.UTC(local.year, local.month - 1, local.day));
    const windowStart = utcForLocal(windowBase.getUTCFullYear(), windowBase.getUTCMonth() + 1, windowBase.getUTCDate(), 0, 0, timeZone);
    return { windowStart, scheduledFor };
}
//# sourceMappingURL=notification-time-window.js.map