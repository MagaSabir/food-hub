import {
  RESTAURANT_TIMEZONE,
  WEEKDAYS,
  type Weekday,
  type WorkingHours,
} from '@foodhubme/shared';

const LABELS: Record<Weekday, string> = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Вс',
};

export interface WorkingDayRow {
  day: Weekday;
  label: string;
  hours: string;
  isClosed: boolean;
  isToday: boolean;
}

export function todayInRestaurantTz(now: Date = new Date()): Weekday {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIMEZONE,
    weekday: 'short',
  }).format(now);

  return short.toLowerCase().slice(0, 3) as Weekday;
}

export function toWeekRows(
  hours: WorkingHours,
  now: Date = new Date(),
): WorkingDayRow[] {
  const today = todayInRestaurantTz(now);

  return WEEKDAYS.map((day) => {
    const intervals = hours[day] ?? [];

    return {
      day,
      label: LABELS[day],
      hours: intervals.map(({ from, to }) => `${from} – ${to}`).join(', '),
      isClosed: intervals.length === 0,
      isToday: day === today,
    };
  });
}

export function hasAnyHours(hours: WorkingHours): boolean {
  return WEEKDAYS.some((day) => (hours[day]?.length ?? 0) > 0);
}
