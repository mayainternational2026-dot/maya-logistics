import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Pencil,
  Smile,
  Meh,
  Frown,
  Zap,
  Star,
} from "lucide-react";

interface WorkLog {
  id: number;
  date: string;
  tasks: string[];
  summary: string | null;
  mood: number | null;
  updatedAt: string;
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

function getTodayNPT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const MOODS = [
  { value: 1, icon: Frown,  label: "Tough day",       color: "text-red-500" },
  { value: 2, icon: Meh,    label: "Average",          color: "text-orange-400" },
  { value: 3, icon: Smile,  label: "Good",             color: "text-yellow-500" },
  { value: 4, icon: Zap,    label: "Productive",       color: "text-blue-500" },
  { value: 5, icon: Star,   label: "Excellent!",       color: "text-green-500" },
];

export default function WorkLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = getTodayNPT();

  const [tasks, setTasks] = useState<string[]>([""]);
  const [summary, setSummary] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

  const { data: todayLog, isLoading: todayLoading } = useQuery<WorkLog | null>({
    queryKey: ["work-log", "today"],
    queryFn: () => apiFetch("/work-log/today"),
  });

  const { data: history = [] } = useQuery<WorkLog[]>({
    queryKey: ["work-log", "my"],
    queryFn: () => apiFetch("/work-log/my"),
  });

  useEffect(() => {
    if (todayLog && !editMode) {
      setTasks(todayLog.tasks.length ? todayLog.tasks : [""]);
      setSummary(todayLog.summary ?? "");
      setMood(todayLog.mood ?? null);
    }
  }, [todayLog, editMode]);

  const submit = useMutation({
    mutationFn: () =>
      apiFetch("/work-log/submit", {
        method: "POST",
        body: JSON.stringify({ tasks: tasks.filter((t) => t.trim()), summary: summary.trim() || null, mood }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-log"] });
      setEditMode(false);
      toast({ title: "✅ Work Report Saved!", description: "Great job — your day's work is logged." });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const addTask = () => setTasks((t) => [...t, ""]);
  const updateTask = (i: number, v: string) => setTasks((t) => t.map((x, idx) => idx === i ? v : x));
  const removeTask = (i: number) => setTasks((t) => t.filter((_, idx) => idx !== i));

  const validTasks = tasks.filter((t) => t.trim());
  const canSubmit = validTasks.length > 0;

  const isSubmitted = !!todayLog && !editMode;
  const pastHistory = history.filter((h) => h.date !== today);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Work Report</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(today)}
          </p>
        </div>
        {isSubmitted && (
          <Button
            variant="outline"
            size="sm"
            className="text-secondary border-secondary hover:bg-secondary/5"
            onClick={() => setEditMode(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit Report
          </Button>
        )}
      </div>

      {/* Today's Card */}
      {todayLoading ? (
        <Card><CardContent className="py-8 text-center text-gray-400">Loading…</CardContent></Card>
      ) : isSubmitted ? (
        /* ── Already submitted view ── */
        <Card className="border-2 border-green-200 bg-green-50/40">
          <CardContent className="pt-5 pb-4 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="font-semibold text-green-800">Report submitted!</span>
              <span className="text-xs text-green-600 ml-auto flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(todayLog!.updatedAt).toLocaleTimeString("en-US", {
                  timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>

            {/* Mood */}
            {todayLog!.mood && (() => {
              const m = MOODS.find((x) => x.value === todayLog!.mood);
              return m ? (
                <div className="flex items-center gap-2 text-sm">
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                  <span className="text-gray-600">Mood: <strong>{m.label}</strong></span>
                </div>
              ) : null;
            })()}

            {/* Tasks */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tasks Completed ({todayLog!.tasks.length})
              </p>
              <ul className="space-y-1.5">
                {todayLog!.tasks.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {todayLog!.summary && (
              <div className="bg-white rounded-md px-3 py-2 text-sm text-gray-600 border border-green-100">
                <span className="font-medium text-gray-700">Summary: </span>
                {todayLog!.summary}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ── Form view ── */
        <Card className="border-2 border-dashed border-secondary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-secondary">
              <ClipboardCheck className="h-5 w-5" />
              {editMode ? "Update Today's Report" : "What did you accomplish today?"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Mood Selector */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">How was your day?</p>
              <div className="flex gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(mood === m.value ? null : m.value)}
                    title={m.label}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-all text-xs font-medium ${
                      mood === m.value
                        ? "border-secondary bg-secondary/10 text-secondary shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <m.icon className={`h-5 w-5 ${mood === m.value ? "text-secondary" : m.color}`} />
                    <span className="hidden sm:block">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Task List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Tasks completed today *</p>
                <span className="text-xs text-gray-400">{validTasks.length} added</span>
              </div>
              <div className="space-y-2">
                {tasks.map((task, i) => (
                  <div key={i} className="flex gap-2 items-center group">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full border-2 border-secondary/40 flex items-center justify-center mt-0.5">
                      <span className="text-xs text-secondary/60 font-bold">{i + 1}</span>
                    </div>
                    <input
                      type="text"
                      value={task}
                      onChange={(e) => updateTask(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addTask(); }
                      }}
                      placeholder={i === 0 ? "e.g. Processed 5 air freight shipments" : "Add another task…"}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                      autoFocus={i === tasks.length - 1 && i > 0}
                    />
                    {tasks.length > 1 && (
                      <button
                        onClick={() => removeTask(i)}
                        className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addTask}
                className="mt-2 flex items-center gap-1.5 text-secondary text-sm font-medium hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add another task
              </button>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Summary / Notes
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Any blockers, highlights, or notes for tomorrow…"
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-1">
              {editMode && (
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1 bg-secondary hover:bg-secondary/90 text-white h-10"
                disabled={!canSubmit || submit.isPending}
                onClick={() => submit.mutate()}
              >
                <Send className="h-4 w-4 mr-2" />
                {submit.isPending ? "Saving…" : editMode ? "Update Report" : "Submit Today's Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past history */}
      {pastHistory.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Previous Reports</p>
          <div className="space-y-2">
            {pastHistory.map((log) => {
              const isOpen = expandedHistory === log.id;
              const m = MOODS.find((x) => x.value === log.mood);
              return (
                <Card key={log.id} className="overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedHistory(isOpen ? null : log.id)}
                  >
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800">{formatDate(log.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {m && <m.icon className={`h-4 w-4 ${m.color}`} />}
                      <Badge variant="secondary" className="text-xs">{log.tasks.length} tasks</Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t bg-gray-50 space-y-2">
                      <ul className="space-y-1.5">
                        {log.tasks.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                      {log.summary && (
                        <p className="text-sm text-gray-500 italic border-t pt-2">"{log.summary}"</p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
