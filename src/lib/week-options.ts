import {
  addWeeks,
  endOfWeek,
  format,
  getWeek,
  getWeekYear,
  isValid,
  parse,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export interface WeekOption {
  value: string;
  label: string;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  monthKey: string;
  monthLabel: string;
  customLabel?: string;
  searchValue: string;
}

const DATE_INPUT_FORMATS = ["dd/MM/yyyy", "dd-MM-yyyy", "yyyy-MM-dd", "ddMMyyyy"];
const BUSINESS_WEEK_OPTIONS = { weekStartsOn: 2 as const, firstWeekContainsDate: 1 as const };

const formatWeekValue = (weekNumber: number) => `s${String(weekNumber).padStart(2, "0")}`;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const formatWeekRange = (startDate: Date, endDate: Date) => {
  const startDay = format(startDate, "d");
  const endDay = format(endDate, "d");
  const startMonth = format(startDate, "MMMM", { locale: es });
  const endMonth = format(endDate, "MMMM", { locale: es });

  if (startMonth === endMonth) {
    return `${startDay} al ${endDay} de ${endMonth}`;
  }

  return `${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
};

export const buildWeekOptions = (
  year: number,
  customLabels: Record<string, string> = {},
): WeekOption[] => {
  const firstWeekStart = startOfWeek(new Date(year, 0, 1), BUSINESS_WEEK_OPTIONS);
  const options: WeekOption[] = [];

  for (let index = 0; ; index += 1) {
    const weekNumber = index + 1;
    const startDate = addWeeks(firstWeekStart, index);

    if (startDate.getFullYear() > year) {
      break;
    }

    const endDate = endOfWeek(startDate, BUSINESS_WEEK_OPTIONS);
    const value = formatWeekValue(weekNumber);
    const customLabel = customLabels[value];
    const monthLabel = capitalize(format(startDate, "MMMM", { locale: es }));
    const label = `W${weekNumber} (${formatWeekRange(startDate, endDate)})`;

    options.push({
      value,
      label,
      weekNumber,
      startDate,
      endDate,
      monthKey: format(startDate, "yyyy-MM"),
      monthLabel,
      customLabel,
      searchValue: [
        value,
        `w${weekNumber}`,
        `semana ${weekNumber}`,
        format(startDate, "dd/MM/yyyy"),
        format(endDate, "dd/MM/yyyy"),
        customLabel ?? "",
        label,
      ]
        .join(" ")
        .toLowerCase(),
    });
  }

  return options;
};

export const getCurrentISOWeekValue = (date = new Date()) =>
  formatWeekValue(getWeek(date, BUSINESS_WEEK_OPTIONS));

export const getCurrentISOWeekYear = (date = new Date()) =>
  getWeekYear(date, BUSINESS_WEEK_OPTIONS);

export const findWeekOption = (options: WeekOption[], value: string) =>
  options.find((option) => option.value === value);

export const parseWeekSelectionInput = (
  input: string,
  options: WeekOption[],
  isoYear: number,
): WeekOption | undefined => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  const weekMatch = normalized.match(/^(?:w|s|semana\s*)?0*(\d{1,2})$/);
  if (weekMatch) {
    const weekNumber = Number(weekMatch[1]);
    return options.find((option) => option.weekNumber === weekNumber);
  }

  for (const formatPattern of DATE_INPUT_FORMATS) {
    const parsedDate = parse(normalized, formatPattern, new Date());
    if (!isValid(parsedDate)) {
      continue;
    }

    if (getWeekYear(parsedDate, BUSINESS_WEEK_OPTIONS) !== isoYear) {
      return undefined;
    }

    return options.find((option) => option.weekNumber === getWeek(parsedDate, BUSINESS_WEEK_OPTIONS));
  }

  return undefined;
};
