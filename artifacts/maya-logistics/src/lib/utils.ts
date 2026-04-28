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

export function statusLabel(status: string): string {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "in_transit":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "delivered":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
}

export function buildInvoiceUrl(s: {
  trackingId: string;
  origin: string;
  destination: string;
  weight: number;
  cost: number;
  senderName: string;
  receiverName: string;
  createdAt: string;
}): string {
  const params = new URLSearchParams({
    locale: "en",
    from: `Maya Import Export Logistic\nAnandamaya Marg, Dhumbarahi\nKathmandu, Nepal`,
    to: `${s.receiverName}`,
    number: s.trackingId,
    date: new Date(s.createdAt).toISOString().slice(0, 10),
    "items[0][name]": `Shipment ${s.origin} → ${s.destination} (${s.weight}kg)`,
    "items[0][quantity]": "1",
    "items[0][unit_cost]": String(s.cost),
    currency: "NPR",
    notes: `Sender: ${s.senderName}`,
  });
  return `https://invoice-generator.com/?${params.toString()}`;
}
