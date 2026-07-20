import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetShipment,
  useUpdateShipment,
  useDeleteShipment,
  getGetShipmentQueryKey,
  getListShipmentsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/use-auth";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Phone,
  Package,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  BadgeDollarSign,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import {
  cn,
  formatNPR,
  statusBadgeClass,
  statusLabel,
} from "@/lib/utils";

export default function ShipmentDetails() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, isLoading } = useGetShipment(id, {
    query: { enabled: !!id, queryKey: getGetShipmentQueryKey(id) },
  });
  const update = useUpdateShipment();
  const remove = useDeleteShipment();

  type ShipStatus = "pending" | "collected" | "at_warehouse" | "customs_clearance" | "in_transit" | "arrived" | "delivered";
  const [status, setStatus] = useState<ShipStatus>("pending");
  useEffect(() => {
    if (data?.status) setStatus(data.status);
  }, [data?.status]);

  /* ── Edit dialog state ── */
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    senderName: "", senderPhone: "",
    origin: "", destination: "",
    weight: "", customerName: "", customerEmail: "", notes: "",
  });
  useEffect(() => {
    if (data) {
      setEditForm({
        senderName:    data.senderName ?? "",
        senderPhone:   data.senderPhone ?? "",
        origin:        data.origin ?? "",
        destination:   data.destination ?? "",
        weight:        String(data.weight ?? ""),
        customerName:  data.customerName ?? "",
        customerEmail: data.customerEmail ?? "",
        notes:         data.notes ?? "",
      });
    }
  }, [data]);

  const handleEditSave = () => {
    update.mutate(
      {
        id,
        data: {
          senderName:    editForm.senderName.trim() || undefined,
          senderPhone:   editForm.senderPhone.trim() || undefined,
          origin:        editForm.origin.trim() || undefined,
          destination:   editForm.destination.trim() || undefined,
          weight:        editForm.weight ? Number(editForm.weight) : undefined,
          customerName:  editForm.customerName.trim() || undefined,
          customerEmail: editForm.customerEmail.trim() || undefined,
          notes:         editForm.notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Shipment details updated" });
          setEditOpen(false);
          invalidate();
        },
        onError: (err: any) => {
          toast({ title: "Update failed", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (!data) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Shipment not found.</p>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isCustomer = user?.role === "customer";

  const canManage =
    isAdmin || (isStaff && (user.permissions?.canManageShipments ?? false));

  const canMarkPaid = isAdmin;

  // Customers can see invoice only when payment has been confirmed by admin
  // Admin / staff (with invoice permission) can always see it
  const canInvoice =
    isAdmin ||
    (isStaff && (user.permissions?.canGenerateInvoice ?? false)) ||
    (isCustomer && data.paid === true);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetShipmentQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleStatusChange = (newStatus: ShipStatus) => {
    setStatus(newStatus);
    update.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => { toast({ title: "Status updated" }); invalidate(); },
        onError: (err: any) => {
          toast({ title: "Update failed", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  const handleTogglePaid = () => {
    const next = !data.paid;
    update.mutate(
      { id, data: { paid: next } },
      {
        onSuccess: () => {
          toast({
            title: next ? "Payment confirmed" : "Payment mark removed",
            description: next
              ? "The customer can now access their invoice."
              : "Invoice access has been revoked.",
          });
          invalidate();
        },
        onError: (err: any) => {
          toast({ title: "Update failed", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  const handleDelete = () => {
    remove.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Shipment deleted" });
          queryClient.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setLocation("/shipments");
        },
        onError: (err: any) => {
          toast({ title: "Delete failed", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => setLocation("/shipments")}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shipments
      </button>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-secondary text-white px-6 py-6 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Tracking ID
            </p>
            <h1 className="font-mono text-2xl md:text-3xl font-bold">
              {data.trackingId}
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Created {format(new Date(data.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                statusBadgeClass(data.status),
              )}
            >
              {statusLabel(data.status)}
            </span>
            {/* Payment badge */}
            {data.paid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Payment Received
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400 px-3 py-1 text-xs font-semibold text-amber-200">
                <XCircle className="h-3 w-3" /> Payment Pending
              </span>
            )}
            <p className="text-2xl font-bold">{formatNPR(data.cost)}</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Customer invoice notice */}
          {isCustomer && !data.paid && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
              <BadgeDollarSign className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">Invoice not available yet</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Your invoice will be available once the admin confirms your payment. Please contact us via WhatsApp or email if you need assistance.
                </p>
              </div>
            </div>
          )}

          {isCustomer && data.paid && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800">Payment confirmed</p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  Your payment has been received. Click <strong>View Invoice</strong> below to open your invoice.
                  {data.paidAt && (
                    <> Confirmed on {format(new Date(data.paidAt), "MMMM d, yyyy")}.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Sender</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-secondary">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold">{data.senderName}</span>
                </div>
                {data.senderPhone && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {data.senderPhone}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Receiver</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-secondary">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold">{data.receiverName}</span>
                </div>
                {data.receiverPhone && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {data.receiverPhone}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Origin</h3>
              <div className="flex items-center gap-2 text-secondary">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold">{data.origin}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Destination</h3>
              <div className="flex items-center gap-2 text-secondary">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold">{data.destination}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Weight</h3>
              <p className="font-semibold text-secondary">{data.weight} kg</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Last updated</h3>
              <div className="flex items-center gap-2 text-secondary">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-semibold">
                  {format(new Date(data.updatedAt), "MMM d, yyyy h:mm a")}
                </span>
              </div>
            </div>
          </div>

          {data.customerName && (
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Customer</p>
              <p className="font-semibold text-secondary">{data.customerName}</p>
              {data.customerEmail && (
                <p className="text-sm text-gray-600">{data.customerEmail}</p>
              )}
            </div>
          )}

          {data.notes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-700 leading-relaxed">{data.notes}</p>
            </div>
          )}

          {/* Action bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 flex-wrap">
            <Link href={`/track/${data.trackingId}`}>
              <Button variant="outline">View public tracking</Button>
            </Link>

            {/* Invoice button — always visible for admin/staff-with-perm; for customer only when paid */}
            {canInvoice && (
              <Link href={`/shipments/${id}/invoice`}>
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-white">
                  <FileText className="h-4 w-4" /> View Invoice
                </Button>
              </Link>
            )}

            {/* Edit Details button — admin/staff only */}
            {canManage && (
              <Button
                variant="outline"
                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" /> Edit Details
              </Button>
            )}

            {/* Admin/staff controls */}
            {canManage && (
              <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                {/* Payment toggle — admin only */}
                {canMarkPaid && (
                  <Button
                    variant="outline"
                    className={cn(
                      "gap-2",
                      data.paid
                        ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        : "border-amber-300 text-amber-700 hover:bg-amber-50",
                    )}
                    onClick={handleTogglePaid}
                    disabled={update.isPending}
                  >
                    {data.paid ? (
                      <><XCircle className="h-4 w-4" /> Mark Unpaid</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4" /> Confirm Payment</>
                    )}
                  </Button>
                )}

                <Select
                  value={status}
                  onValueChange={(v) => handleStatusChange(v as ShipStatus)}
                >
                  <SelectTrigger className="w-44 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">📦 Order Received</SelectItem>
                    <SelectItem value="collected">🚚 Shipment Collected</SelectItem>
                    <SelectItem value="at_warehouse">🏭 At Warehouse</SelectItem>
                    <SelectItem value="customs_clearance">🛃 Customs Clearance</SelectItem>
                    <SelectItem value="in_transit">✈️ In Transit</SelectItem>
                    <SelectItem value="arrived">🏢 Arrived at Office</SelectItem>
                    <SelectItem value="delivered">✅ Dispatched</SelectItem>
                  </SelectContent>
                </Select>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this shipment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove shipment{" "}
                        <span className="font-mono">{data.trackingId}</span>.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EDIT DETAILS DIALOG ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-blue-600" /> Edit Shipment Details
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>Sender Name</Label>
              <Input autoComplete="new-password" value={editForm.senderName}
                onChange={(e) => setEditForm((p) => ({ ...p, senderName: e.target.value }))}
                placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label>Sender Phone</Label>
              <Input autoComplete="new-password" value={editForm.senderPhone}
                onChange={(e) => setEditForm((p) => ({ ...p, senderPhone: e.target.value }))}
                placeholder="+977 98…" />
            </div>
            <div className="space-y-1">
              <Label>Origin</Label>
              <Input autoComplete="new-password" value={editForm.origin}
                onChange={(e) => setEditForm((p) => ({ ...p, origin: e.target.value }))}
                placeholder="Kathmandu, Nepal" />
            </div>
            <div className="space-y-1">
              <Label>Destination</Label>
              <Input autoComplete="new-password" value={editForm.destination}
                onChange={(e) => setEditForm((p) => ({ ...p, destination: e.target.value }))}
                placeholder="Tokyo, Japan" />
            </div>
            <div className="space-y-1">
              <Label>Weight (kg)</Label>
              <Input autoComplete="new-password" type="number" step="0.01" min="0" value={editForm.weight}
                onChange={(e) => setEditForm((p) => ({ ...p, weight: e.target.value }))}
                placeholder="5" />
            </div>
            <div className="space-y-1">
              <Label>Customer Name</Label>
              <Input autoComplete="new-password" value={editForm.customerName}
                onChange={(e) => setEditForm((p) => ({ ...p, customerName: e.target.value }))}
                placeholder="Ram Bahadur Thapa" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Customer Email</Label>
              <Input autoComplete="new-password" type="email" value={editForm.customerEmail}
                onChange={(e) => setEditForm((p) => ({ ...p, customerEmail: e.target.value }))}
                placeholder="customer@example.com" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea value={editForm.notes} rows={3}
                onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any additional notes…" className="resize-none" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleEditSave}
              disabled={update.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {update.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WhatsAppButton />
    </div>
  );
}
