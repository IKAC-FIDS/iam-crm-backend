import { BadRequestException, Injectable } from "@nestjs/common";

type CalculationInput = {
  workDate: string;
  timezone: string;
  startMinute?: number | null;
  endMinute?: number | null;
  spansMidnight?: boolean;
  durationMinutes?: number | null;
  breakMinutes?: number | null;
};

@Injectable()
export class TimesheetTimeCalculationService {
  calculate(input: CalculationInput) {
    const breakMinutes = input.breakMinutes ?? 0;
    if (!Number.isInteger(breakMinutes) || breakMinutes < 0)
      this.fail(
        "INVALID_BREAK",
        "Break minutes must be a non-negative integer",
      );
    const hasStart = input.startMinute != null,
      hasEnd = input.endMinute != null;
    if (hasStart !== hasEnd)
      this.fail(
        "INVALID_TIME_RANGE",
        "Start and end minute must be provided together",
      );
    if (!hasStart) {
      if (
        !Number.isInteger(input.durationMinutes) ||
        (input.durationMinutes ?? 0) <= 0
      )
        this.fail(
          "INVALID_DURATION",
          "Duration-only entries require positive integer durationMinutes",
        );
      // Duration-only records are declared net minutes and intentionally exempt from wall-clock DST resolution.
      return {
        durationMinutes: input.durationMinutes!,
        startMinute: null,
        endMinute: null,
        spansMidnight: false,
        breakMinutes,
      };
    }
    const start = input.startMinute!,
      end = input.endMinute!;
    if (![start, end].every((v) => Number.isInteger(v) && v >= 0 && v <= 1439))
      this.fail(
        "INVALID_TIME_RANGE",
        "Time minutes must be between 0 and 1439",
      );
    const overnight = Boolean(input.spansMidnight);
    if (!overnight && end <= start)
      this.fail(
        "INVALID_TIME_RANGE",
        "End time must be after start time unless spansMidnight is true",
      );
    if (overnight && end >= start)
      this.fail(
        "INVALID_TIME_RANGE",
        "Overnight end time must be earlier than start time",
      );
    const startInstant = this.resolveLocal(
      input.workDate,
      start,
      input.timezone,
    );
    const endDate = overnight
      ? this.addDays(input.workDate, 1)
      : input.workDate;
    const endInstant = this.resolveLocal(endDate, end, input.timezone);
    const gross = Math.round(
      (endInstant.getTime() - startInstant.getTime()) / 60000,
    );
    const net = gross - breakMinutes;
    if (net <= 0)
      this.fail(
        "INVALID_NET_DURATION",
        "Break must be shorter than elapsed work duration",
      );
    return {
      durationMinutes: net,
      startMinute: start,
      endMinute: end,
      spansMidnight: overnight,
      breakMinutes,
      startInstant,
      endInstant,
    };
  }

  resolveLocal(date: string, minute: number, timezone: string): Date {
    const [year, month, day] = this.dateParts(date);
    const hour = Math.floor(minute / 60),
      min = minute % 60;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(
        new Date(),
      );
    } catch {
      this.fail("INVALID_TIMEZONE", `Unknown timezone: ${timezone}`);
    }
    const wanted = Date.UTC(year, month - 1, day, hour, min);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const matches: number[] = [];
    for (let offset = -14 * 60; offset <= 14 * 60; offset += 15) {
      const candidate = wanted - offset * 60000;
      const values = Object.fromEntries(
        formatter
          .formatToParts(new Date(candidate))
          .filter((p) => p.type !== "literal")
          .map((p) => [p.type, Number(p.value)]),
      );
      if (
        values.year === year &&
        values.month === month &&
        values.day === day &&
        values.hour === hour &&
        values.minute === min
      )
        matches.push(candidate);
    }
    const unique = [...new Set(matches)];
    if (!unique.length)
      this.fail(
        "NONEXISTENT_LOCAL_TIME",
        "The selected local time does not exist because of a timezone transition",
      );
    if (unique.length > 1)
      this.fail(
        "AMBIGUOUS_LOCAL_TIME",
        "The selected local time is ambiguous because of a timezone transition",
      );
    return new Date(unique[0]!);
  }

  private dateParts(value: string): [number, number, number] {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) this.fail("INVALID_DATE", "Date must use Gregorian YYYY-MM-DD");
    const y = Number(m![1]),
      mo = Number(m![2]),
      d = Number(m![3]),
      test = new Date(Date.UTC(y, mo - 1, d));
    if (
      test.getUTCFullYear() !== y ||
      test.getUTCMonth() !== mo - 1 ||
      test.getUTCDate() !== d
    )
      this.fail("INVALID_DATE", "Date is invalid");
    return [y, mo, d];
  }
  private addDays(value: string, days: number) {
    const [y, m, d] = this.dateParts(value);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  }
  private fail(code: string, message: string): never {
    throw new BadRequestException({ code, message });
  }
}
