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
import { useAuth } from "@/lib/auth";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { format } from "date-fns";
import {
  cn,
  formatNPR,
  statusBadgeClass,
  statusLabel,
  buildInvoiceUrl,
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

  const [status, setStatus] = useState<"pending" | "in_transit" | "delivered">(
    "pending",
  );
  useEffect(() => {
    if (data?.status) setStatus(data.status);
  }, [data?.status]);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (!data) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Shipment not found.</p>
      </div>
    );
  }

  const canManage =
    user?.role === "admin" ||
    (user?.role === "staff" && (user.permissions?.canManageShipments ?? false));
  const canInvoice =
    user?.role === "customer" ||
    user?.role === "admin" ||
    (user?.role === "staff" && (user.permissions?.canGenerateInvoice ?? false));

  const handleStatusChange = (newStatus: "pending" | "in_transit" | "delivered") => {
    setStatus(newStatus);
    update.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
          queryClient.invalidateQueries({
            queryKey: getGetShipmentQueryKey(id),
          });
          queryClient.invalidateQueries({
            queryKey: getListShipmentsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
        },
        onError: (err: any) => {
          toast({
            title: "Update failed",
            description: err?.data?.error,
            variant: "destructive",
          });
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
          queryClient.invalidateQueries({
            queryKey: getListShipmentsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
          setLocation("/shipments");
        },
        onError: (err: any) => {
          toast({
            title: "Delete failed",
            description: err?.data?.error,
            variant: "destructive",
          });
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
            <p className="text-2xl font-bold">{formatNPR(data.cost)}</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Sender
              </h3>
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Receiver
              </h3>
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Origin
              </h3>
              <div className="flex items-center gap-2 text-secondary">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold">{data.origin}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Destination
              </h3>
              <div className="flex items-center gap-2 text-secondary">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold">{data.destination}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Weight
              </h3>
              <p className="font-semibold text-secondary">{data.weight} kg</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Last updated
              </h3>
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
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Customer
              </p>
              <p className="font-semibold text-secondary">
                {data.customerName}
              </p>
              {data.customerEmail && (
                <p className="text-sm text-gray-600">{data.customerEmail}</p>
              )}
            </div>
          )}

          {data.notes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Notes
              </h3>
              <p className="text-gray-700 leading-relaxed">{data.notes}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Link href={`/track/${data.trackingId}`}>
              <Button variant="outline">View public tracking</Button>
            </Link>
            {canInvoice && (
              <a
                href={buildInvoiceUrl(data)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" /> Generate Invoice
                </Button>
              </a>
            )}
            {canManage && (
              <div className="flex items-center gap-2 sm:ml-auto">
                <Select
                  value={status}
                  onValueChange={(v) =>
                    handleStatusChange(
                      v as "pending" | "in_transit" | "delivered",
                    )
                  }
                >
                  <SelectTrigger className="w-44 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
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

      <WhatsAppButton />
    </div>
  );
}
