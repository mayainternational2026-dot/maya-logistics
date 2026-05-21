import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateShipment,
  useListUsers,
  getListUsersQueryKey,
  getListShipmentsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecentShipmentsQueryKey,
  getGetRevenueTrendQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/use-auth";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Download } from "lucide-react";

export default function NewShipment() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const create = useCreateShipment();

  const isStaff = user?.role === "admin" || user?.role === "staff";
  const customers = useListUsers(
    { role: "customer" },
    {
      query: {
        enabled: isStaff,
        queryKey: getListUsersQueryKey({ role: "customer" }),
      },
    },
  );

  const [form, setForm] = useState({
    shipmentType: "export" as "export" | "import",
    senderName: user?.name ?? "",
    senderPhone: user?.phone ?? "",
    receiverName: "",
    receiverPhone: "",
    origin: "Kathmandu, Nepal",
    destination: "",
    productName: "",
    quantity: "",
    weight: "",
    dimensions: "",
    cost: "",
    notes: "",
    customerId: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      shipmentType: form.shipmentType,
      senderName: form.senderName,
      senderPhone: form.senderPhone || undefined,
      receiverName: form.receiverName,
      receiverPhone: form.receiverPhone || undefined,
      origin: form.origin,
      destination: form.destination,
      productName: form.productName || undefined,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      weight: Number(form.weight),
      dimensions: form.dimensions || undefined,
      cost: Number(form.cost),
      notes: form.notes || undefined,
    };
    if (isStaff && form.customerId) {
      payload.customerId = Number(form.customerId);
    }

    create.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          toast({
            title: "Shipment booked",
            description: `Tracking ID: ${data.trackingId}`,
          });
          queryClient.invalidateQueries({
            queryKey: getListShipmentsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetRecentShipmentsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetRevenueTrendQueryKey(),
          });
          setLocation(`/shipments/${data.id}`);
        },
        onError: (err: any) => {
          toast({
            title: "Could not create shipment",
            description: err?.data?.error || "Please review the form and retry.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => setLocation("/shipments")}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shipments
      </button>

      <div>
        <h1 className="text-3xl font-bold text-secondary">Book a shipment</h1>
        <p className="mt-1 text-gray-600">
          Fill in the cargo details — we will handle the rest.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6"
      >
        {isStaff && (
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Customer
            </label>
            <Select
              value={form.customerId}
              onValueChange={(v) => set("customerId", v)}
            >
              <SelectTrigger className="h-11 bg-gray-50">
                <SelectValue placeholder="Select a customer" />
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

        {/* Shipment Type */}
        <div>
          <label className="block text-sm font-semibold text-secondary mb-2">
            Shipment type
          </label>
          <div className="flex gap-3">
            {(["export", "import"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("shipmentType", t)}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border-2 text-sm font-medium transition-colors ${
                  form.shipmentType === t
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t === "export" ? <Download className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Export = sending from Nepal · Import = bringing goods into Nepal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Sender name
            </label>
            <Input
              required
              value={form.senderName}
              onChange={(e) => set("senderName", e.target.value)}
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Sender phone
            </label>
            <Input
              value={form.senderPhone}
              onChange={(e) => set("senderPhone", e.target.value)}
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Receiver name
            </label>
            <Input
              required
              value={form.receiverName}
              onChange={(e) => set("receiverName", e.target.value)}
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Receiver phone
            </label>
            <Input
              value={form.receiverPhone}
              onChange={(e) => set("receiverPhone", e.target.value)}
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Origin
            </label>
            <Input
              required
              value={form.origin}
              onChange={(e) => set("origin", e.target.value)}
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Destination
            </label>
            <Input
              required
              value={form.destination}
              onChange={(e) => set("destination", e.target.value)}
              placeholder="e.g. Berlin, Germany"
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Product name
            </label>
            <Input
              value={form.productName}
              onChange={(e) => set("productName", e.target.value)}
              placeholder="e.g. Electronic goods"
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Quantity
            </label>
            <Input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              placeholder="e.g. 10"
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Weight (kg)
            </label>
            <Input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.weight}
              onChange={(e) => set("weight", e.target.value)}
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Dimensions (L×W×H cm)
            </label>
            <Input
              value={form.dimensions}
              onChange={(e) => set("dimensions", e.target.value)}
              placeholder="e.g. 40×30×20"
              className="h-11 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Cost (NPR)
            </label>
            <Input
              required
              type="number"
              step="1"
              min="0"
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
              className="h-11 bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary mb-2">
            Notes
          </label>
          <Textarea
            rows={4}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any special handling instructions..."
            className="bg-gray-50"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/shipments")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {create.isPending ? "Booking..." : "Book shipment"}
          </Button>
        </div>
      </form>

      <WhatsAppButton />
    </div>
  );
}
