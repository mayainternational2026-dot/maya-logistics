import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListShipments,
  useCreateShipment,
  useListUsers,
  getListShipmentsQueryKey,
  getListUsersQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecentShipmentsQueryKey,
  getGetRevenueTrendQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, FileText, MapPin, Package, Download } from "lucide-react";
import { format } from "date-fns";
import { cn, formatNPR, statusBadgeClass, statusLabel } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "in_transit" | "delivered";

const emptyShipment = (user: any) => ({
  senderName: user?.name ?? "",
  senderPhone: user?.phone ?? "",
  receiverName: "",
  receiverPhone: "",
  origin: "Kathmandu, Nepal",
  destination: "",
  weight: "",
  cost: "",
  notes: "",
  customerId: "",
});

export default function Shipments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shipForm, setShipForm] = useState(() => emptyShipment(user));

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isCustomer = user?.role === "customer";
  const isInternal = isAdmin || isStaff;

  const exportCSV = () => {
    const rows = data ?? [];
    const headers = [
      "Tracking ID", "Type", "Sender", "Sender Phone", "Receiver", "Receiver Phone",
      "Origin", "Destination", "Product", "Quantity", "Weight (kg)", "Dimensions",
      "Cost (NPR)", "Status", "Paid", "Created",
    ];
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.trackingId, (r as any).shipmentType ?? "export",
          r.senderName, r.senderPhone ?? "", r.receiverName, r.receiverPhone ?? "",
          r.origin, r.destination,
          (r as any).productName ?? "", (r as any).quantity ?? "", r.weight, (r as any).dimensions ?? "",
          r.cost, r.status, r.paid ? "Yes" : "No",
          format(new Date(r.createdAt), "yyyy-MM-dd"),
        ].map(escape).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maya-shipments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const params: { search?: string; status?: "pending" | "in_transit" | "delivered" } = {};
  if (search.trim()) params.search = search.trim();
  if (status !== "all") params.status = status;

  const { data, isLoading } = useListShipments(params, {
    query: { queryKey: getListShipmentsQueryKey(params) },
  });

  const customers = useListUsers(
    { role: "customer" },
    { query: { enabled: isInternal, queryKey: getListUsersQueryKey({ role: "customer" }) } },
  );

  const create = useCreateShipment();

  const setField = <K extends keyof typeof shipForm>(k: K, v: string) =>
    setShipForm((s) => ({ ...s, [k]: v }));

  const openSheet = () => {
    setShipForm(emptyShipment(user));
    setSheetOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      senderName: shipForm.senderName,
      senderPhone: shipForm.senderPhone || undefined,
      receiverName: shipForm.receiverName,
      receiverPhone: shipForm.receiverPhone || undefined,
      origin: shipForm.origin,
      destination: shipForm.destination,
      weight: Number(shipForm.weight),
      cost: Number(shipForm.cost),
      notes: shipForm.notes || undefined,
    };
    if (isInternal && shipForm.customerId) payload.customerId = Number(shipForm.customerId);

    create.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          toast({ title: "Shipment booked!", description: `Tracking ID: ${data.trackingId}` });
          setSheetOpen(false);
          queryClient.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentShipmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRevenueTrendQueryKey() });
        },
        onError: (err: any) => {
          toast({
            title: "Could not create shipment",
            description: err?.data?.error || "Please fill all required fields.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Shipments</h1>
          <p className="mt-1 text-gray-600">
            {isCustomer ? "Your bookings, status, and invoices." : "Every shipment moving through the Maya network."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isInternal && (data ?? []).length > 0 && (
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          )}
          <Button onClick={openSheet} className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" /> New Shipment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tracking ID, sender, receiver, route…"
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

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No shipments match your filters yet.</p>
            <Button onClick={openSheet} className="mt-4 gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Add first shipment
            </Button>
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
                  <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/shipments/${row.id}`} className="font-mono font-semibold text-secondary hover:text-primary">
                        {row.trackingId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div className="font-medium">{row.senderName}</div>
                      <div className="text-xs text-gray-500">→ {row.receiverName}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" />{row.origin}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" />{row.destination}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{row.weight} kg</td>
                    <td className="px-6 py-4 font-semibold text-secondary">{formatNPR(row.cost)}</td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", statusBadgeClass(row.status))}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{format(new Date(row.createdAt), "MMM d, yyyy")}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                            <Button size="sm" variant="outline" className="h-8 gap-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                              <FileText className="h-3.5 w-3.5" /> Invoice
                            </Button>
                          </Link>
                        )}
                        <Link href={`/track/${row.trackingId}`}>
                          <Button size="sm" variant="outline" className="h-8">Track</Button>
                        </Link>
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

      {/* ── Quick New Shipment Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold text-secondary flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> New Shipment
            </SheetTitle>
            <SheetDescription>Fill in the cargo details and click Book.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Customer selector for staff/admin */}
            {isInternal && (
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">Customer</label>
                <Select value={shipForm.customerId} onValueChange={(v) => setField("customerId", v)}>
                  <SelectTrigger className="h-10 bg-gray-50">
                    <SelectValue placeholder="Select customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(customers.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} — {c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">Sender Name <span className="text-primary">*</span></label>
                <Input required value={shipForm.senderName} onChange={(e) => setField("senderName", e.target.value)} className="h-10 bg-gray-50" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">Sender Phone</label>
                <Input value={shipForm.senderPhone} onChange={(e) => setField("senderPhone", e.target.value)} className="h-10 bg-gray-50" placeholder="+977 98…" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">Receiver Name <span className="text-primary">*</span></label>
                <Input required value={shipForm.receiverName} onChange={(e) => setField("receiverName", e.target.value)} className="h-10 bg-gray-50" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">Receiver Phone</label>
                <Input value={shipForm.receiverPhone} onChange={(e) => setField("receiverPhone", e.target.value)} className="h-10 bg-gray-50" placeholder="+81 90…" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">Origin <span className="text-primary">*</span></label>
                <Input required value={shipForm.origin} onChange={(e) => setField("origin", e.target.value)} className="h-10 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">Destination <span className="text-primary">*</span></label>
                <Input required value={shipForm.destination} onChange={(e) => setField("destination", e.target.value)} className="h-10 bg-gray-50" placeholder="e.g. Tokyo, Japan" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">Weight (kg) <span className="text-primary">*</span></label>
                <Input required type="number" step="0.01" min="0" value={shipForm.weight} onChange={(e) => setField("weight", e.target.value)} className="h-10 bg-gray-50" placeholder="5" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">Cost (NPR) <span className="text-primary">*</span></label>
                <Input required type="number" step="1" min="0" value={shipForm.cost} onChange={(e) => setField("cost", e.target.value)} className="h-10 bg-gray-50" placeholder="15000" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Notes</label>
              <Textarea rows={3} value={shipForm.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Special handling instructions…" className="bg-gray-50 resize-none" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={create.isPending} className="flex-1 bg-primary hover:bg-primary/90">
                {create.isPending ? "Booking…" : "Book Shipment"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
