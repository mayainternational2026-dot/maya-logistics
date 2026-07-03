import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboardSummary,
  useGetRecentShipments,
  useGetRevenueTrend,
  useListShipments,
  useListProductSourcing,
  useCreateProductSourcing,
  useDeleteProductSourcing,
  getGetDashboardSummaryQueryKey,
  getGetRecentShipmentsQueryKey,
  getGetRevenueTrendQueryKey,
  getListShipmentsQueryKey,
  getListProductSourcingQueryKey,
} from "@workspace/api-client-react";
import { ObjectUploader, useUpload } from "@workspace/object-storage-web";
import { useAuth } from "@/lib/use-auth";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Package,
  Clock,
  Truck,
  CheckCircle,
  Banknote,
  Users,
  TrendingUp,
  ArrowRight,
  PackageSearch,
  Trash2,
  ImageIcon,
  Video,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatNPR, statusBadgeClass, statusLabel, cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-secondary">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs text-gray-500">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            accent,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function toStorageUrl(objectPath: string): string {
  const relative = objectPath.replace(/^\/objects\//, "");
  return `/api/storage/objects/${relative}`;
}

function ProductSourcingDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const create = useCreateProductSourcing();
  const { uploadFile, isUploading: isUploadingViaHook } = useUpload();

  const [form, setForm] = useState({
    sourceProduct: "",
    productName: "",
    quantity: "1",
    shippingCost: "",
    customsCost: "",
    serviceCharge: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((s) => ({ ...s, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: "" }));
    };

  const shippingCostNum = parseFloat(form.shippingCost) || 0;
  const customsCostNum = parseFloat(form.customsCost) || 0;
  const serviceChargeNum = parseFloat(form.serviceCharge) || 0;
  const totalCost = shippingCostNum + customsCostNum + serviceChargeNum;

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.sourceProduct.trim()) errs.sourceProduct = "Source is required";
    if (!form.productName.trim()) errs.productName = "Product name is required";
    if (form.quantity && (isNaN(Number(form.quantity)) || Number(form.quantity) < 1))
      errs.quantity = "Enter a valid quantity";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    const result = await uploadFile(file);
    setIsUploadingVideo(false);
    if (result) {
      setVideoPath(result.objectPath);
      setVideoName(file.name);
    } else {
      toast({ title: "Video upload failed", variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    create.mutate(
      {
        data: {
          sourceProduct: form.sourceProduct.trim(),
          productName: form.productName.trim(),
          quantity: form.quantity ? Number(form.quantity) : undefined,
          shippingCost: shippingCostNum,
          customsCost: customsCostNum,
          serviceCharge: serviceChargeNum,
          productImagePath: imagePath ?? undefined,
          productVideoPath: videoPath ?? undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Product sourcing record saved" });
          queryClient.invalidateQueries({ queryKey: getListProductSourcingQueryKey() });
          onClose();
        },
        onError: (err: any) => {
          toast({ title: "Could not save", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  const FErr = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <XCircle className="h-3 w-3 flex-shrink-0" />{errors[field]}
      </p>
    ) : null;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Add product sourcing</DialogTitle>
        <DialogDescription>
          Record a sourced product with its cost breakdown and media.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Product <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.sourceProduct}
              onChange={set("sourceProduct")}
              placeholder="Supplier name, link, or platform"
              className={cn("h-11", errors.sourceProduct && "border-red-400")}
            />
            <FErr field="sourceProduct" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.productName}
              onChange={set("productName")}
              placeholder="e.g. Bluetooth Speaker"
              className={cn("h-11", errors.productName && "border-red-400")}
            />
            <FErr field="productName" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity (per piece)
            </label>
            <Input
              type="number"
              min="1"
              value={form.quantity}
              onChange={set("quantity")}
              placeholder="Units"
              className={cn("h-11", errors.quantity && "border-red-400")}
            />
            <FErr field="quantity" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Cost Breakdown
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping (NPR)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.shippingCost}
                onChange={set("shippingCost")}
                placeholder="0.00"
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customs (NPR)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.customsCost}
                onChange={set("customsCost")}
                placeholder="0.00"
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service (NPR)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.serviceCharge}
                onChange={set("serviceCharge")}
                placeholder="0.00"
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2.5 border border-gray-100">
            <span className="text-sm font-medium text-gray-600">Total Cost (NPR)</span>
            <span className="text-base font-bold text-secondary">
              {totalCost.toLocaleString("en-NP", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Media</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">Product Image</p>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10 * 1024 * 1024}
                buttonClassName="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
                onGetUploadParameters={async (file) => {
                  const res = await fetch("/api/storage/uploads/request-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: file.name,
                      size: file.size,
                      contentType: file.type || "application/octet-stream",
                    }),
                  });
                  const data = await res.json();
                  setImagePath(data.objectPath);
                  setImageName(file.name);
                  return {
                    method: "PUT",
                    url: data.uploadURL,
                    headers: { "Content-Type": file.type || "application/octet-stream" },
                  };
                }}
              >
                <ImageIcon className="h-4 w-4" /> {imageName ? "Change image" : "Upload image"}
              </ObjectUploader>
              {imageName && (
                <p className="mt-1 truncate text-xs text-gray-500">{imageName}</p>
              )}
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">Product Video</p>
              <label
                className={cn(
                  "flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent",
                  isUploadingVideo && "opacity-60 pointer-events-none",
                )}
              >
                <Video className="h-4 w-4" />
                {isUploadingVideo ? "Uploading…" : videoName ? "Change video" : "Upload video"}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoChange}
                />
              </label>
              {videoName && (
                <p className="mt-1 truncate text-xs text-gray-500">{videoName}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            disabled={create.isPending || isUploadingVideo || isUploadingViaHook}
            className="bg-primary hover:bg-primary/90"
          >
            {create.isPending ? "Saving…" : "Save record"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ProductSourcingSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useListProductSourcing({
    query: { queryKey: getListProductSourcingQueryKey() },
  });
  const remove = useDeleteProductSourcing();

  const handleDelete = (id: number) => {
    remove.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Product sourcing record deleted" });
          queryClient.invalidateQueries({ queryKey: getListProductSourcingQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Delete failed", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-secondary">Product Sourcing</h2>
          <p className="text-sm text-gray-600">
            Sourced products with cost breakdown, image, and video.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <PackageSearch className="h-4 w-4" /> Add sourced product
            </Button>
          </DialogTrigger>
          <ProductSourcingDialog onClose={() => setOpen(false)} />
        </Dialog>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="py-12 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No product sourcing records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Total Cost</th>
                  <th className="px-6 py-4">Media</th>
                  <th className="px-6 py-4">Added By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-secondary">{p.productName}</td>
                    <td className="px-6 py-4 text-gray-700">{p.sourceProduct}</td>
                    <td className="px-6 py-4 text-gray-700">{p.quantity}</td>
                    <td className="px-6 py-4 font-semibold text-secondary">
                      {p.totalCost.toLocaleString("en-NP", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {p.productImagePath ? (
                          <a
                            href={toStorageUrl(p.productImagePath)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-secondary hover:text-primary"
                            title="View image"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </a>
                        ) : null}
                        {p.productVideoPath ? (
                          <a
                            href={toStorageUrl(p.productVideoPath)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-secondary hover:text-primary"
                            title="View video"
                          >
                            <Video className="h-4 w-4" />
                          </a>
                        ) : null}
                        {!p.productImagePath && !p.productVideoPath ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{p.createdByName ?? "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 gap-1 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete product sourcing record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the record for {p.productName}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(p.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StaffDashboard() {
  const summary = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const recent = useGetRecentShipments({
    query: { queryKey: getGetRecentShipmentsQueryKey() },
  });
  const trend = useGetRevenueTrend({
    query: { queryKey: getGetRevenueTrendQueryKey() },
  });

  if (summary.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const s = summary.data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-secondary">Operations Overview</h1>
        <p className="mt-1 text-gray-600">
          Live view of shipments moving through the Maya network.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Shipments"
          value={String(s?.totalShipments ?? 0)}
          icon={Package}
          accent="bg-secondary/10 text-secondary"
          hint={`${s?.shipmentsThisMonth ?? 0} this month`}
        />
        <StatCard
          label="In Transit"
          value={String(s?.inTransit ?? 0)}
          icon={Truck}
          accent="bg-blue-100 text-blue-600"
          hint={`${s?.pending ?? 0} pending pickup`}
        />
        <StatCard
          label="Delivered"
          value={String(s?.delivered ?? 0)}
          icon={CheckCircle}
          accent="bg-emerald-100 text-emerald-600"
          hint={formatNPR(s?.deliveredRevenue ?? 0) + " collected"}
        />
        <StatCard
          label="Total Revenue"
          value={formatNPR(s?.totalRevenue ?? 0)}
          icon={Banknote}
          accent="bg-primary/10 text-primary"
          hint={formatNPR(s?.revenueThisMonth ?? 0) + " this month"}
        />
        <StatCard
          label="Customers"
          value={String(s?.totalCustomers ?? 0)}
          icon={Users}
          accent="bg-violet-100 text-violet-600"
        />
        <StatCard
          label="Staff"
          value={String(s?.totalStaff ?? 0)}
          icon={Users}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Avg. Shipment Cost"
          value={formatNPR(s?.avgShipmentCost ?? 0)}
          icon={TrendingUp}
          accent="bg-rose-100 text-rose-600"
        />
        <StatCard
          label="Pending Bookings"
          value={String(s?.pending ?? 0)}
          icon={Clock}
          accent="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-secondary">
              Revenue & Volume — last 12 months
            </h2>
            <p className="text-sm text-gray-500">
              Monthly cargo bookings vs. total revenue.
            </p>
          </div>
        </div>
        <div className="h-72">
          {trend.isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend.data ?? []}>
                <defs>
                  <linearGradient id="g-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-shipments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => format(parseISO(`${v}-01`), "MMM")}
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "revenue" ? formatNPR(value) : value
                  }
                  labelFormatter={(v) =>
                    format(parseISO(`${v}-01`), "MMMM yyyy")
                  }
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#dc2626"
                  fill="url(#g-revenue)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="shipments"
                  stroke="#1e3a8a"
                  fill="url(#g-shipments)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-secondary">Recent Shipments</h2>
          <Link href="/shipments">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {recent.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (recent.data ?? []).length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            No shipments yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-3">Tracking</th>
                  <th className="py-3">Route</th>
                  <th className="py-3">Customer</th>
                  <th className="py-3">Cost</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recent.data ?? []).map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3">
                      <Link
                        href={`/shipments/${row.id}`}
                        className="font-mono font-semibold text-secondary hover:text-primary"
                      >
                        {row.trackingId}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-700">
                      {row.origin} → {row.destination}
                    </td>
                    <td className="py-3 text-gray-700">
                      {row.customerName ?? "—"}
                    </td>
                    <td className="py-3 font-semibold text-secondary">
                      {formatNPR(row.cost)}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          statusBadgeClass(row.status),
                        )}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductSourcingSection />
    </div>
  );
}

function CustomerDashboard() {
  const { user } = useAuth();
  const list = useListShipments(undefined, {
    query: { queryKey: getListShipmentsQueryKey() },
  });
  const shipments = list.data ?? [];
  const totalSpent = shipments.reduce((sum, s) => sum + Number(s.cost), 0);
  const active = shipments.filter((s) => s.status !== "delivered");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-secondary">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-gray-600">
          Manage your shipments and book new freight from your dashboard.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          label="Total Shipments"
          value={String(shipments.length)}
          icon={Package}
          accent="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Active Shipments"
          value={String(active.length)}
          icon={Truck}
          accent="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Total Spent"
          value={formatNPR(totalSpent)}
          icon={Banknote}
          accent="bg-primary/10 text-primary"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-secondary">Your Shipments</h2>
          <Link href="/shipments/new">
            <Button className="bg-primary hover:bg-primary/90">
              Book a shipment
            </Button>
          </Link>
        </div>
        {list.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              You haven't booked any shipments yet.
            </p>
            <Link href="/shipments/new">
              <Button className="mt-4 bg-primary hover:bg-primary/90">
                Book your first shipment
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-3">Tracking</th>
                  <th className="py-3">Route</th>
                  <th className="py-3">Cost</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3">
                      <Link
                        href={`/shipments/${row.id}`}
                        className="font-mono font-semibold text-secondary hover:text-primary"
                      >
                        {row.trackingId}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-700">
                      {row.origin} → {row.destination}
                    </td>
                    <td className="py-3 font-semibold text-secondary">
                      {formatNPR(row.cost)}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          statusBadgeClass(row.status),
                        )}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <>
      {user?.role === "customer" ? <CustomerDashboard /> : <StaffDashboard />}
      <WhatsAppButton />
    </>
  );
}
