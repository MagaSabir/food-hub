export interface WorkingInterval {
  from: string;
  to: string;
}

export const WEEKDAYS = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type WorkingHours = Partial<Record<Weekday, WorkingInterval[]>>;

export interface OpenState {
  isOpen: boolean;
  closesAt: string | null;
}

const CLOSED: OpenState = { isOpen: false, closesAt: null };

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(time: unknown): number | null {
  if (typeof time !== 'string') return null;
  const match = TIME_RE.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function parseWorkingHours(raw: unknown): WorkingHours {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};

  const source = raw as Record<string, unknown>;
  const result: WorkingHours = {};

  for (const day of WEEKDAYS) {
    const intervals = source[day];
    if (!Array.isArray(intervals)) continue;

    const valid: WorkingInterval[] = [];
    for (const interval of intervals) {
      if (typeof interval !== 'object' || interval === null) continue;
      const { from, to } = interval as { from?: unknown; to?: unknown };
      if (toMinutes(from) === null || toMinutes(to) === null || from === to)
        continue;
      valid.push({ from: from as string, to: to as string });
    }

    if (valid.length > 0) result[day] = valid;
  }

  return result;
}

function localNow(
  now: Date,
  timeZone: string,
): { day: Weekday; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  const day = get('weekday').toLowerCase().slice(0, 3) as Weekday;

  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const previousDay = (day: Weekday): Weekday =>
  WEEKDAYS[(WEEKDAYS.indexOf(day) + WEEKDAYS.length - 1) % WEEKDAYS.length];

export function getOpenState(
  raw: unknown,
  now: Date,
  timeZone: string,
): OpenState {
  const hours = parseWorkingHours(raw);
  const { day, minutes } = localNow(now, timeZone);

  for (const interval of hours[previousDay(day)] ?? []) {
    const from = toMinutes(interval.from)!;
    const to = toMinutes(interval.to)!;
    if (to <= from && minutes < to)
      return { isOpen: true, closesAt: interval.to };
  }

  for (const interval of hours[day] ?? []) {
    const from = toMinutes(interval.from)!;
    const to = toMinutes(interval.to)!;
    const isOpen =
      to > from ? minutes >= from && minutes < to : minutes >= from;
    if (isOpen) return { isOpen: true, closesAt: interval.to };
  }

  return CLOSED;
}
