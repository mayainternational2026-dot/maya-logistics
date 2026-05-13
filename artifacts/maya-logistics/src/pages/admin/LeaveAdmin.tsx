import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Users,
  Filter,
} from "lucide-react";

interface LeaveRequest {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
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

const STATUS_CONFIG = {
  pending:  { label: "Pending",  icon: Clock,        class: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", icon: CheckCircle2, class: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", icon: XCircle,      class: "bg-red-100 text-red-800" },
};

type ReviewAction = { id: number; action: "approve" | "reject" };

export default function LeaveAdmin() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [reviewing, setReviewing] = useState<ReviewAction | null>(null);
  const [note, setNote] = useState("");

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["leave", "all"],
    queryFn: () => apiFetch("/leave/all"),
    refetchInterval: 30000,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, reviewNote }: { id: number; action: string; reviewNote: string }) =>
      apiFetch(`/leave/${id}/${action}`, { method: "PATCH", body: JSON.stringify({ reviewNote }) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leave"] });
      setReviewing(null);
      setNote("");
      toast({
        title: vars.action === "approve" ? "✅ Leave Approved" : "❌ Leave Rejected",
        description: "The staff member will be notified.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    },
  });

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const pending  = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and approve staff leave requests</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={`cursor-pointer transition-all ${filter === "pending" ? "ring-2 ring-yellow-400" : ""}`} onClick={() => setFilter("pending")}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting Review</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${filter === "approved" ? "ring-2 ring-green-400" : ""}`} onClick={() => setFilter("approved")}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{approved}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${filter === "rejected" ? "ring-2 ring-red-400" : ""}`} onClick={() => setFilter("rejected")}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{rejected}</div>
            <div className="text-xs text-gray-500 mt-1">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {reviewing.action === "approve" ? "✅ Approve Leave" : "❌ Reject Leave"}
              </h2>
              <button onClick={() => { setReviewing(null); setNote(""); }}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note to staff <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={reviewing.action === "approve" ? "e.g. Approved. Please arrange handover." : "e.g. Sorry, we need full attendance this week."}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setReviewing(null); setNote(""); }}>
                Cancel
              </Button>
              <Button
                className={`flex-1 text-white ${reviewing.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate({ id: reviewing.id, action: reviewing.action, reviewNote: note })}
              >
                {reviewMutation.isPending ? "Saving…" : reviewing.action === "approve" ? "Confirm Approve" : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors capitalize ${
              filter === f ? "bg-secondary text-white" : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {f} {f !== "all" && `(${requests.filter((r) => r.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {filter === "all" ? "All Leave Requests" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Requests`}
            {" "}({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No {filter === "all" ? "" : filter} requests found.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => {
                const cfg = STATUS_CONFIG[r.status];
                return (
                  <div key={r.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900">{r.userName}</p>
                          <Badge className={`text-xs ${cfg.class}`}>
                            <cfg.icon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                          <span className="text-xs text-gray-400">{r.type}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{r.userEmail}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">{r.startDate}</span> → <span className="font-medium">{r.endDate}</span>
                          <span className="text-gray-500 ml-2">({r.days} day{r.days !== 1 ? "s" : ""})</span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1 italic">"{r.reason}"</p>
                        {r.reviewNote && (
                          <p className={`text-xs mt-1 px-2 py-1 rounded ${r.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            Note: {r.reviewNote}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Applied {new Date(r.createdAt).toLocaleDateString()}
                          {r.reviewedAt && ` · Reviewed ${new Date(r.reviewedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      {r.status === "pending" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                            onClick={() => setReviewing({ id: r.id, action: "approve" })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8"
                            onClick={() => setReviewing({ id: r.id, action: "reject" })}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
