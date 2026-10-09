import { locale } from "../i18n";

export function fmtBytes(b: number): string {
  if (b >= 1024 ** 3) return `${fmtNum(b / 1024 ** 3, 1)} GB`;
  if (b >= 1024 ** 2) return `${Math.round(b / 1024 ** 2)} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
}

export function fmtNum(n: number, digits = 0): string {
  return n.toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtDateTime(ms: number): string {
  return new Intl.DateTimeFormat(locale(), { dateStyle: "short", timeStyle: "short" }).format(ms);
}

export function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString(locale());
}

export function pctChange(before: number, after: number): number {
  return before ? ((after - before) / before) * 100 : 0;
}
