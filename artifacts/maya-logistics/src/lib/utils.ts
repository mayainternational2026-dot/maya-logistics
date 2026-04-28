import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const nprFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export function formatNPR(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!isFinite(n)) return "Rs. 0";
  return `Rs. ${nprFormatter.format(Math.round(n))}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Received",
  collected: "Shipment Collected",
  at_warehouse: "At Warehouse",
  customs_clearance: "Customs Clearance",
  in_transit: "In Transit",
  arrived: "Arrived at Office",
  delivered: "Dispatched",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "pending":        return "bg-amber-100 text-amber-700 border border-amber-200";
    case "collected":      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "at_warehouse":   return "bg-violet-100 text-violet-700 border border-violet-200";
    case "customs_clearance": return "bg-orange-100 text-orange-700 border border-orange-200";
    case "in_transit":     return "bg-cyan-100 text-cyan-700 border border-cyan-200";
    case "arrived":        return "bg-teal-100 text-teal-700 border border-teal-200";
    case "delivered":      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    default:               return "bg-gray-100 text-gray-700 border border-gray-200";
  }
}
