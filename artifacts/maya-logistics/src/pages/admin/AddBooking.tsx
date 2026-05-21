import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateShipment,
  useListUsers,
  getListShipmentsQueryKey,
  getListUsersQueryKey,
  getGetDashboardSummaryQueryKey,
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
import { ArrowLeft, Upload, Download, User, Package } from "lucide-react";

export default function AddBooking() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const create = useCreateShipment();

  const customers = useListUsers(
    { role: "customer" },
    { query: { queryKey: getListUsersQueryKey({ role: "customer" }) } },
  );

  const [customerId, setCustomerId] = useState("");
  const [form, setForm] = useState({
    shipmentType: "export" as "export" | "import",
    senderName: "",
    senderPhone: "",
    senderWhatsapp: "",
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
    if (customerId) payload.customerId = Number(customerId);

    create.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          toast({
            title: "Booking created",
            description: `Tracking ID: ${data.trackingId}`,
          });
          queryClient.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setLocation(`/shipments/${data.id}`);
        },
        onError: (err: any) => {
          toast({
            title: "Could not create booking",
            description: err?.data?.error || "Please review the form and retry.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => setLocation("/shipments")}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shipments
      </button>

      <div>
        <h1 className="text-3xl font-bold text-secondary">Add Customer Booking</h1>
        <p className="mt-1 text-gray-600">
          Record a new customer shipment booking with full product details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-secondary">Customer Details</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Link to existing customer (optional)
            </label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="h-11 bg-gray-50">
                <SelectValue placeholder="Select a registered customer…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— No customer link —</SelectItem>
                {(customers.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} — {c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Sender name <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={form.senderName}
                onChange={(e) => set("senderName", e.target.value)}
                placeholder="Full name"
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
                placeholder="+977-…"
                className="h-11 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Sender WhatsApp
              </label>
              <Input
                value={form.senderWhatsapp}
                onChange={(e) => set("senderWhatsapp", e.target.value)}
                placeholder="+977-…"
                className="h-11 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Receiver name <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={form.receiverName}
                onChange={(e) => set("receiverName", e.target.value)}
                placeholder="Full name"
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
                placeholder="+1-…"
                className="h-11 bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Shipment & Product Section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-secondary">Shipment & Product Details</h2>
          </div>

          {/* Import / Export toggle */}
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
                  {t === "export" ? "Export (from Nepal)" : "Import (into Nepal)"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Origin <span className="text-red-500">*</span>
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
                Destination <span className="text-red-500">*</span>
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
                Weight (kg) <span className="text-red-500">*</span>
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
                Size / Dimensions (L×W×H cm)
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
                Cost (NPR) <span className="text-red-500">*</span>
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
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Special handling instructions, customs info, etc."
              className="bg-gray-50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => setLocation("/shipments")}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-primary hover:bg-primary/90 px-8"
          >
            {create.isPending ? "Adding booking…" : "Add Booking"}
          </Button>
        </div>
      </form>

      <WhatsAppButton />
    </div>
  );
}
