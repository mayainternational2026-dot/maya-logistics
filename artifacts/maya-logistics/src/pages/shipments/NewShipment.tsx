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
import { ArrowLeft } from "lucide-react";

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

  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      senderName: form.senderName,
      senderPhone: form.senderPhone || undefined,
      receiverName: form.receiverName,
      receiverPhone: form.receiverPhone || undefined,
      origin: form.origin,
      destination: form.destination,
      weight: Number(form.weight),
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
