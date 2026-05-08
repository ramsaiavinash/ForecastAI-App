import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCompactCurrency(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  if (isNaN(num)) return "$0";
  if (Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }
  return `$${num.toFixed(0)}`;
}

export function formatPercent(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  if (isNaN(num)) return "+0.0%";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(1)}%`;
}

export function parseIndianNumber(value: string): number {
  if (!value || value.trim() === "" || value.trim() === "-" || value.trim() === " -   ") return 0;
  const cleaned = value.toString().replace(/,/g, "").replace(/\s/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function getBatchStatusColor(status: string): string {
  switch (status) {
    case "Draft": return "bg-gray-100 text-gray-700";
    case "Under Review": return "bg-yellow-100 text-yellow-700";
    case "Approved PL": return "bg-blue-100 text-blue-700";
    case "Approved PH": return "bg-purple-100 text-purple-700";
    case "Locked": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export function getProjectStatusColor(endDate: string): { label: string; color: string } {
  const end = new Date(endDate);
  const now = new Date();
  const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { label: "Completed", color: "bg-gray-100 text-gray-600" };
  if (diff < 90) return { label: "Ending Soon", color: "bg-orange-100 text-orange-700" };
  return { label: "Active", color: "bg-green-100 text-green-700" };
}