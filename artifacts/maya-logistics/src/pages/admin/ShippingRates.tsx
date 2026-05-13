import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListShippingRates,
  useCreateShippingRate,
  useUpdateShippingRate,
  useDeleteShippingRate,
  getListShippingRatesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, Pencil, Trash2, DollarSign, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function countryFlag(code: string) {
  try {
    return code.toUpperCase().replace(/./g, (c) =>
      String.fromCodePoint(c.charCodeAt(0) + 127397),
    );
  } catch {
    return "🌍";
  }
}

type RateForm = {
  country: string;
  countryCode: string;
  rateUsd: string;
  rateNpr: string;
};

const EMPTY_FORM: RateForm = { country: "", countryCode: "", rateUsd: "", rateNpr: "" };

function RateFormFields({
  form,
  onChange,
}: {
  form: RateForm;
  onChange: (f: RateForm) => void;
}) {
  const set = (key: keyof RateForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country Name *</label>
          <Input value={form.country} onChange={set("country")} placeholder="e.g. India" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country Code *</label>
          <Input
            value={form.countryCode}
            onChange={set("countryCode")}
            placeholder="e.g. IN"
            maxLength={3}
            className="uppercase"
          />
          {form.countryCode.length >= 2 && (
            <p className="text-xs text-gray-400 mt-1">
              Flag preview: {countryFlag(form.countryCode)} (2-letter ISO code)
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rate (USD / kg) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.rateUsd}
              onChange={set("rateUsd")}
              placeholder="0.00"
              className="pl-7"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rate (NPR / kg) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₨</span>
            <Input
              type="number"
              min="0"
              step="1"
              value={form.rateNpr}
              onChange={set("rateNpr")}
              placeholder="0"
              className="pl-7"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShippingRates() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: rates = [], isLoading } = useListShippingRates();
  const createMut = useCreateShippingRate();
  const updateMut = useUpdateShippingRate();
  const deleteMut = useDeleteShippingRate();

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<RateForm>(EMPTY_FORM);

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RateForm>(EMPTY_FORM);

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListShippingRatesQueryKey() });
  }

  function handleAdd() {
    const { country, countryCode, rateUsd, rateNpr } = addForm;
    if (!country || !countryCode || !rateUsd || !rateNpr) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    createMut.mutate(
      { data: { country: country.trim(), countryCode: countryCode.trim().toUpperCase(), rateUsd: parseFloat(rateUsd), rateNpr: parseFloat(rateNpr) } },
      {
        onSuccess: () => {
          invalidate();
          setAddOpen(false);
          setAddForm(EMPTY_FORM);
          toast({ title: `${country} rate added` });
        },
        onError: () => toast({ title: "Failed to add rate", variant: "destructive" }),
      },
    );
  }

  function openEdit(r: { id: number; country: string; countryCode: string; rateUsd: number; rateNpr: number }) {
    setEditId(r.id);
    setEditForm({ country: r.country, countryCode: r.countryCode, rateUsd: String(r.rateUsd), rateNpr: String(r.rateNpr) });
  }

  function handleEdit() {
    if (!editId) return;
    const { country, countryCode, rateUsd, rateNpr } = editForm;
    if (!country || !countryCode || !rateUsd || !rateNpr) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    updateMut.mutate(
      { id: editId, data: { country: country.trim(), countryCode: countryCode.trim().toUpperCase(), rateUsd: parseFloat(rateUsd), rateNpr: parseFloat(rateNpr) } },
      {
        onSuccess: () => {
          invalidate();
          setEditId(null);
          toast({ title: `${country} rate updated` });
        },
        onError: () => toast({ title: "Failed to update rate", variant: "destructive" }),
      },
    );
  }

  function handleDelete(id: number, country: string) {
    deleteMut.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: `${country} rate deleted` });
        },
        onError: () => toast({ title: "Failed to delete rate", variant: "destructive" }),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Rates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage per-kg rates used in the public calculator</p>
        </div>
        <Button onClick={() => { setAddOpen(true); setAddForm(EMPTY_FORM); }} className="gap-2 bg-secondary hover:bg-secondary/90">
          <Plus className="h-4 w-4" />
          Add Country
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Countries Listed", value: rates.length, icon: Globe, color: "text-blue-600 bg-blue-50" },
          {
            label: "Avg Rate (USD/kg)",
            value: rates.length ? `$${(rates.reduce((s, r) => s + r.rateUsd, 0) / rates.length).toFixed(2)}` : "—",
            icon: DollarSign,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Avg Rate (NPR/kg)",
            value: rates.length ? `NPR ${Math.round(rates.reduce((s, r) => s + r.rateNpr, 0) / rates.length)}` : "—",
            icon: DollarSign,
            color: "text-purple-600 bg-purple-50",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rates Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Rates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
            </div>
          ) : rates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Globe className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No rates yet. Add your first country.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Country</th>
                    <th className="px-4 py-3 text-center font-medium text-green-600">USD / kg</th>
                    <th className="px-4 py-3 text-center font-medium text-purple-600">NPR / kg</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                        <span className="text-lg">{countryFlag(r.countryCode)}</span>
                        {r.country}
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{r.countryCode}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 font-medium">${r.rateUsd.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-gray-700 font-medium">NPR {r.rateNpr.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(r)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-secondary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {r.country} rate?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove {r.country} from the shipping calculator. Customers will no longer see it as a destination.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(r.id, r.country)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Country Rate</DialogTitle>
          </DialogHeader>
          <RateFormFields form={addForm} onChange={setAddForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMut.isPending} className="bg-secondary hover:bg-secondary/90">
              {createMut.isPending ? "Adding…" : "Add Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rate — {editForm.country}</DialogTitle>
          </DialogHeader>
          <RateFormFields form={editForm} onChange={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMut.isPending} className="bg-secondary hover:bg-secondary/90">
              {updateMut.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
