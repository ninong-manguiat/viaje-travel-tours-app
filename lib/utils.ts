import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(value);
}

export function normalizeCurrency(value: unknown): "PHP" | "USD" {
  return value === "USD" ? "USD" : "PHP";
}

export function formatCurrency(value: number, currency: "PHP" | "USD" = "PHP") {
  const normalized = normalizeCurrency(currency);
  const amount = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(normalized === "USD" ? "en-US" : "en-PH", {
    style: "currency",
    currency: normalized,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const PHILIPPINE_TIME_ZONE = "Asia/Manila";

function dateOnlyAsPhilippineNoon(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 4));
}

export function todayDateOnly() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PHILIPPINE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatDate(value: string | Date | number) {
  const date = typeof value === "string"
    ? dateOnlyAsPhilippineNoon(value) ?? new Date(value)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: PHILIPPINE_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
