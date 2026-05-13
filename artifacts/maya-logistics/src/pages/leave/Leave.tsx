import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Send,
} from "lucide-react";

const LEAVE_TYPES = ["Sick Leave", "Casual Leave", "Annual Leave", "Other"];

interface LeaveRequest {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

const STATUS_CONFIG = {
  pending:  { label: "Pending",  icon: Clock,        class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  approved: { label: "Approved", icon: CheckCircle2, class: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejected", icon: XCircle,      class: "bg-red-100 text-red-800 border-red-200" },
};

function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.class}`}>
      <cfg.icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

export default function Leave() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "Sick Leave", startDate: "", endDate: "", reason: "" });

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["leave", "my"],
    queryFn: () => apiFetch("/leave/my-requests"),
  });

  const submit = useMutation({
    mutationFn: (data: typeof form & { days: number }) =>
      apiFetch("/leave/request", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave"] });
      setShowForm(false);
      setForm({ type: "Sick Leave", startDate: "", endDate: "", reason: "" });
      toast({ title: "✅ Leave Request Submitted!", description: "Your manager will review it shortly." });
    },
    onError: (e: Error) => {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    },
  });

  const days = calcDays(form.startDate, form.endDate);
  const pending  = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome, {user?.name}</p>
        </div>
        <Button
          className="bg-secondary hover:bg-secondary/90 text-white"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Apply for Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            <div className="text-xs text-gray-500 mt-1">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{approved}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{requests.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Application Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Apply for Leave</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {form.startDate && form.endDate && (
                <div className="bg-blue-50 rounded-md px-3 py-2 text-sm text-blue-700 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span><strong>{days}</strong> day{days !== 1 ? "s" : ""} of leave requested</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Briefly describe the reason for leave..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
                disabled={!form.startDate || !form.endDate || !form.reason.trim() || submit.isPending}
                onClick={() => submit.mutate({ ...form, days })}
              >
                <Send className="h-4 w-4 mr-1" />
                {submit.isPending ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            My Leave History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No leave requests yet. Apply for leave using the button above.
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((r) => (
                <div key={r.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{r.type}</p>
                      <p className="text-xs text-gray-500">
                        {r.startDate} → {r.endDate} · <strong>{r.days} day{r.days !== 1 ? "s" : ""}</strong>
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-gray-600">"{r.reason}"</p>
                  {r.reviewNote && (
                    <div className={`text-xs px-3 py-1.5 rounded ${r.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      <strong>Manager note:</strong> {r.reviewNote}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Submitted {new Date(r.createdAt).toLocaleDateString()}
                    {r.reviewedAt && ` · Reviewed ${new Date(r.reviewedAt).toLocaleDateString()}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
