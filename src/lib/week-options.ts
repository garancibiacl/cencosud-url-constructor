import {
  addWeeks,
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  getISOWeeksInYear,
  isValid,
  parse,
  startOfISOWeek,
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

const formatWeekValue = (weekNumber: number) => `s${String(weekNumber).padStart(2, "0")}`;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const formatWeekRange = (startDate: Date, endDate: Date) => {
  const startDay = format(startDate, "dd");
  const endDay = format(endDate, "dd");
  const startMonth = capitalize(format(startDate, "MMM", { locale: es }));
  const endMonth = capitalize(format(endDate, "MMM", { locale: es }));

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${endMonth}`;
  }

  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

export const buildWeekOptions = (
  year: number,
  customLabels: Record<string, string> = {},
): WeekOption[] => {
  const firstWeekStart = startOfISOWeek(new Date(year, 0, 4));
  const totalWeeks = getISOWeeksInYear(new Date(year, 0, 4));

  return Array.from({ length: totalWeeks }, (_, index) => {
    const weekNumber = index + 1;
    const startDate = addWeeks(firstWeekStart, index);
    const endDate = endOfISOWeek(startDate);
    const value = formatWeekValue(weekNumber);
    const customLabel = customLabels[value];
    const monthLabel = capitalize(format(startDate, "MMMM", { locale: es }));
    const label = `W${weekNumber} (${formatWeekRange(startDate, endDate)})`;

    return {
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
    };
  });
};

export const getCurrentISOWeekValue = (date = new Date()) =>
  formatWeekValue(getISOWeek(date));

export const getCurrentISOWeekYear = (date = new Date()) => getISOWeekYear(date);

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

    if (getISOWeekYear(parsedDate) !== isoYear) {
      return undefined;
    }

    return options.find((option) => option.weekNumber === getISOWeek(parsedDate));
  }

  return undefined;
};
