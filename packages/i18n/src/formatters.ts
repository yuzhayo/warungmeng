import { DEFAULT_REGIONAL_FORMAT, type RegionalFormat } from "./preferences";

export interface RegionalFormatterOptions {
  readonly regionalFormat?: RegionalFormat;
}

export function formatRupiah(
  amount: number,
  { regionalFormat = DEFAULT_REGIONAL_FORMAT }: RegionalFormatterOptions = {},
): string {
  return new Intl.NumberFormat(regionalFormat, {
    style: "currency",
    currency: "IDR",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  value: Date,
  { regionalFormat = DEFAULT_REGIONAL_FORMAT }: RegionalFormatterOptions = {},
): string {
  return new Intl.DateTimeFormat(regionalFormat, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

export function formatTime(
  value: Date,
  { regionalFormat = DEFAULT_REGIONAL_FORMAT }: RegionalFormatterOptions = {},
): string {
  return new Intl.DateTimeFormat(regionalFormat, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(value);
}
