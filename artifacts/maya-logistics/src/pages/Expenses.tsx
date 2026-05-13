import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  getListExpensesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  Pencil,
  Trash2,
  Receipt,
  Camera,
  X,
  TrendingUp,
  Package,
  Calendar,
  Eye,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ExpenseForm = {
  date: string;
  productName: string;
  price: string;
  quantity: string;
  notes: string;
  photoUrl: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: ExpenseForm = {
  date: today(),
  productName: "",
  price: "",
  quantity: "1",
  notes: "",
  photoUrl: "",
};

function PhotoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
        <Camera className="h-3.5 w-3.5 text-secondary" />
        Bill / Receipt Photo <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Bill"
            className="h-32 w-auto rounded-lg border border-gray-200 object-cover"
          />
          <button
            type="button"
            onClick={() => { onChange(""); if (ref.current) ref.current.value = ""; }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-secondary hover:text-secondary transition-colors w-full justify-center"
        >
          <Camera className="h-4 w-4" />
          Upload bill photo
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function ExpenseFormFields({
  form,
  onChange,
}: {
  form: ExpenseForm;
  onChange: (f: ExpenseForm) => void;
}) {
  const set = (key: keyof ExpenseForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...form, [key]: e.target.value });

  const total = (parseFloat(form.price) || 0) * (parseInt(form.quantity) || 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <Input type="date" value={form.date} onChange={set("date")} max={today()} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
          <Input
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={set("quantity")}
            placeholder="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product / Item Name *</label>
        <Input value={form.productName} onChange={set("productName")} placeholder="e.g. Office Supplies, Printer Paper…" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit (NPR) *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₨</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={set("price")}
            placeholder="0.00"
            className="pl-7"
          />
        </div>
        {total > 0 && (
          <p className="text-xs text-secondary mt-1">
            Total: <strong>NPR {total.toLocaleString()}</strong>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => onChange({ ...form, notes: e.target.value })}
          placeholder="Any additional details…"
          rows={2}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent resize-none"
        />
      </div>

      <PhotoUpload value={form.photoUrl} onChange={(v) => onChange({ ...form, photoUrl: v })} />
    </div>
  );
}

export default function Expenses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: expenses = [], isLoading } = useListExpenses();
  const createMut = useCreateExpense();
  const updateMut = useUpdateExpense();
  const deleteMut = useDeleteExpense();

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<ExpenseForm>(EMPTY_FORM);

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ExpenseForm>(EMPTY_FORM);

  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
  }

  function handleAdd() {
    const { date, productName, price, quantity } = addForm;
    if (!date || !productName || !price || !quantity) {
      toast({ title: "Date, item name, price, and quantity are required", variant: "destructive" });
      return;
    }
    createMut.mutate(
      {
        data: {
          date,
          productName: productName.trim(),
          price: parseFloat(price),
          quantity: parseInt(quantity),
          photoUrl: addForm.photoUrl || null,
          notes: addForm.notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setAddOpen(false);
          setAddForm({ ...EMPTY_FORM, date: today() });
          toast({ title: "Expense added" });
        },
        onError: () => toast({ title: "Failed to add expense", variant: "destructive" }),
      },
    );
  }

  function openEdit(e: (typeof expenses)[0]) {
    setEditId(e.id);
    setEditForm({
      date: e.date,
      productName: e.productName,
      price: String(e.price),
      quantity: String(e.quantity),
      notes: e.notes ?? "",
      photoUrl: e.photoUrl ?? "",
    });
  }

  function handleEdit() {
    if (!editId) return;
    const { date, productName, price, quantity } = editForm;
    if (!date || !productName || !price || !quantity) {
      toast({ title: "All required fields must be filled", variant: "destructive" });
      return;
    }
    updateMut.mutate(
      {
        id: editId,
        data: {
          date,
          productName: productName.trim(),
          price: parseFloat(price),
          quantity: parseInt(quantity),
          photoUrl: editForm.photoUrl || null,
          notes: editForm.notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setEditId(null);
          toast({ title: "Expense updated" });
        },
        onError: () => toast({ title: "Failed to update expense", variant: "destructive" }),
      },
    );
  }

  function handleDelete(id: number) {
    deleteMut.mutate(
      { id },
      {
        onSuccess: () => { invalidate(); toast({ title: "Expense deleted" }); },
        onError: () => toast({ title: "Failed to delete expense", variant: "destructive" }),
      },
    );
  }

  const totalSpent = expenses.reduce((s, e) => s + e.total, 0);
  const thisMonth = expenses.filter((e) => e.date.slice(0, 7) === today().slice(0, 7));
  const thisMonthTotal = thisMonth.reduce((s, e) => s + e.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your office purchases and expenses</p>
        </div>
        <Button
          onClick={() => { setAddOpen(true); setAddForm({ ...EMPTY_FORM, date: today() }); }}
          className="gap-2 bg-secondary hover:bg-secondary/90"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Entries", value: expenses.length, icon: Receipt, color: "text-blue-600 bg-blue-50" },
          { label: "This Month", value: `NPR ${thisMonthTotal.toLocaleString()}`, icon: Calendar, color: "text-green-600 bg-green-50" },
          { label: "All Time", value: `NPR ${totalSpent.toLocaleString()}`, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
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

      {/* Expense List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-secondary" />
            My Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No expenses recorded yet.</p>
              <p className="text-xs mt-1">Click "Add Expense" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Price/unit</th>
                    <th className="px-4 py-3 text-right font-medium text-green-600">Total</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Bill</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(e.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {e.productName}
                        {e.notes && <p className="text-xs text-gray-400 font-normal">{e.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{e.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-700">NPR {e.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">NPR {e.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        {e.photoUrl ? (
                          <button
                            onClick={() => setViewPhoto(e.photoUrl!)}
                            className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(e)}
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
                                <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the expense for "{e.productName}" on {e.date}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(e.id)}
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
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">NPR {totalSpent.toLocaleString()}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-secondary" />
              Add Expense
            </DialogTitle>
          </DialogHeader>
          <ExpenseFormFields form={addForm} onChange={setAddForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMut.isPending} className="bg-secondary hover:bg-secondary/90">
              {createMut.isPending ? "Saving…" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-secondary" />
              Edit Expense
            </DialogTitle>
          </DialogHeader>
          <ExpenseFormFields form={editForm} onChange={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMut.isPending} className="bg-secondary hover:bg-secondary/90">
              {updateMut.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Photo Lightbox */}
      <Dialog open={viewPhoto !== null} onOpenChange={(o) => !o && setViewPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill / Receipt</DialogTitle>
          </DialogHeader>
          {viewPhoto && (
            <img src={viewPhoto} alt="Bill" className="w-full rounded-lg object-contain max-h-[70vh]" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
