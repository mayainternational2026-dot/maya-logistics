import { useState } from "react";
import { Link } from "wouter";
import {
  useListShipments,
  getListShipmentsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/use-auth";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, FileText, MapPin, Package } from "lucide-react";
import { format } from "date-fns";
import {
  cn,
  formatNPR,
  statusBadgeClass,
  statusLabel,
} from "@/lib/utils";

type StatusFilter = "all" | "pending" | "in_transit" | "delivered";

export default function Shipments() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const params: { search?: string; status?: "pending" | "in_transit" | "delivered" } = {};
  if (search.trim()) params.search = search.trim();
  if (status !== "all") params.status = status;

  const { data, isLoading } = useListShipments(params, {
    query: { queryKey: getListShipmentsQueryKey(params) },
  });

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isCustomer = user?.role === "customer";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Shipments</h1>
          <p className="mt-1 text-gray-600">
            {user?.role === "customer"
              ? "Your bookings, status, and invoices."
              : "Every shipment moving through the Maya network."}
          </p>
        </div>
        <Link href="/shipments/new">
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" /> New shipment
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tracking ID, sender, receiver, route..."
              className="pl-9 h-11 bg-gray-50"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="md:w-48 h-11 bg-gray-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No shipments match your filters yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Tracking</th>
                  <th className="px-6 py-4">Sender → Receiver</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Weight</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/shipments/${row.id}`}
                        className="font-mono font-semibold text-secondary hover:text-primary"
                      >
                        {row.trackingId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div className="font-medium">{row.senderName}</div>
                      <div className="text-xs text-gray-500">
                        → {row.receiverName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {row.origin}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {row.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{row.weight} kg</td>
                    <td className="px-6 py-4 font-semibold text-secondary">
                      {formatNPR(row.cost)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          statusBadgeClass(row.status),
                        )}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {format(new Date(row.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/track/${row.trackingId}`}>
                          <Button size="sm" variant="outline" className="h-8">
                            Track
                          </Button>
                        </Link>
                        {(isAdmin ||
                          (isStaff && (user?.permissions?.canGenerateInvoice ?? false)) ||
                          (isCustomer && row.paid)) && (
                          <Link
                            href={
                              isAdmin
                                ? `/admin/create-invoice?trackingId=${encodeURIComponent(row.trackingId)}&origin=${encodeURIComponent(row.origin)}&destination=${encodeURIComponent(row.destination)}&weight=${row.weight}&cost=${row.cost}&senderName=${encodeURIComponent(row.senderName)}&senderPhone=${encodeURIComponent(row.senderPhone ?? "")}&receiverName=${encodeURIComponent(row.receiverName)}&receiverPhone=${encodeURIComponent(row.receiverPhone ?? "")}&billToName=${encodeURIComponent(row.customerName ?? row.receiverName)}&billToEmail=${encodeURIComponent(row.customerEmail ?? "")}&date=${new Date(row.createdAt).toISOString().slice(0, 10)}&paid=${row.paid}`
                                : `/shipments/${row.id}/invoice`
                            }
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <FileText className="h-3.5 w-3.5" /> Invoice
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <WhatsAppButton />
    </div>
  );
}
