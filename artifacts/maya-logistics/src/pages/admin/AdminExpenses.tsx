import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExpenses,
  useDeleteExpense,
  getListExpensesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2,
  Receipt,
  TrendingUp,
  Calendar,
  Users,
  Search,
  Eye,
  Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminExpenses() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: expenses = [], isLoading } = useListExpenses();
  const deleteMut = useDeleteExpense();

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
  }

  function handleDelete(id: number, name: string) {
    deleteMut.mutate(
      { id },
      {
        onSuccess: () => { invalidate(); toast({ title: `Expense "${name}" deleted` }); },
        onError: () => toast({ title: "Failed to delete expense", variant: "destructive" }),
      },
    );
  }

  const filtered = expenses.filter((e) => {
    const matchSearch =
      !search ||
      e.productName.toLowerCase().includes(search.toLowerCase()) ||
      (e.createdByName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.notes ?? "").toLowerCase().includes(search.toLowerCase());
    const matchMonth = !monthFilter || e.date.startsWith(monthFilter);
    return matchSearch && matchMonth;
  });

  const totalAll = expenses.reduce((s, e) => s + e.total, 0);
  const totalFiltered = filtered.reduce((s, e) => s + e.total, 0);

  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = expenses.filter((e) => e.date.startsWith(thisMonthKey));
  const thisMonthTotal = thisMonth.reduce((s, e) => s + e.total, 0);

  const staffTotals = expenses.reduce(
    (acc, e) => {
      const name = e.createdByName ?? `Staff #${e.createdBy}`;
      acc[name] = (acc[name] ?? 0) + e.total;
      return acc;
    },
    {} as Record<string, number>,
  );
  const uniqueStaff = Object.keys(staffTotals).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and manage all staff expense entries</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Entries", value: expenses.length, icon: Receipt, color: "text-blue-600 bg-blue-50" },
          { label: "This Month", value: `NPR ${thisMonthTotal.toLocaleString()}`, icon: Calendar, color: "text-green-600 bg-green-50" },
          { label: "All Time", value: `NPR ${totalAll.toLocaleString()}`, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
          { label: "Staff Members", value: uniqueStaff, icon: Users, color: "text-orange-600 bg-orange-50" },
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

      {/* Staff Breakdown */}
      {uniqueStaff > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Expense by Staff Member</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(staffTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([name, total]) => (
                <Badge key={name} variant="secondary" className="text-xs py-1 px-2">
                  {name}: NPR {total.toLocaleString()}
                </Badge>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item, staff, notes…"
            className="pl-9"
          />
        </div>
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-full sm:w-44"
        />
        {(search || monthFilter) && (
          <Button variant="ghost" onClick={() => { setSearch(""); setMonthFilter(""); }} className="text-sm text-gray-500">
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            {(search || monthFilter) && (
              <span className="text-sm font-normal text-gray-500 ml-2">— NPR {totalFiltered.toLocaleString()} total</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{expenses.length === 0 ? "No expenses recorded yet." : "No results match your filters."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Added By</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Price/unit</th>
                    <th className="px-4 py-3 text-right font-medium text-green-600">Total</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Bill</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(e.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {e.productName}
                        {e.notes && <p className="text-xs text-gray-400 font-normal">{e.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {e.createdByName ?? `Staff #${e.createdBy}`}
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
                                This will permanently remove "{e.productName}" submitted by {e.createdByName ?? "staff"}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(e.id, e.productName)}
                                className="bg-red-600 hover:bg-red-700"
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
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">
                      {search || monthFilter ? "Filtered Total" : "Grand Total"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      NPR {totalFiltered.toLocaleString()}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
