import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  dateStr: string | null | undefined,
  pattern: string = "yyyy年MM月dd日"
): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), pattern, { locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start) return "";
  const startStr = formatDate(start, "yyyy.MM.dd");
  if (!end || end === start) return startStr;
  const endStr = formatDate(end, "yyyy.MM.dd");
  return `${startStr} - ${endStr}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
