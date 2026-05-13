import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  Zap,
  Star,
} from "lucide-react";

interface WorkLogEntry {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  date: string;
  tasks: string[];
  summary: string | null;
  mood: number | null;
  updatedAt: string;
  createdAt: string;
}

async function apiFetch(path: string) {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function getTodayNPT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
}

function formatDisplayDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const MOODS = [
  { value: 1, icon: Frown,  label: "Tough day",  color: "text-red-500",   bg: "bg-red-50"   },
  { value: 2, icon: Meh,    label: "Average",    color: "text-orange-400", bg: "bg-orange-50" },
  { value: 3, icon: Smile,  label: "Good",       color: "text-yellow-500", bg: "bg-yellow-50" },
  { value: 4, icon: Zap,    label: "Productive", color: "text-blue-500",   bg: "bg-blue-50"  },
  { value: 5, icon: Star,   label: "Excellent!", color: "text-green-500",  bg: "bg-green-50" },
];

export default function WorkLogAdmin() {
  const today = getTodayNPT();
  const [date, setDate] = useState(today);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: logs = [], isLoading } = useQuery<WorkLogEntry[]>({
    queryKey: ["work-log", "all", date],
    queryFn: () => apiFetch(`/work-log/all?date=${date}`),
    refetchInterval: 60000,
  });

  const totalTasks = logs.reduce((s, l) => s + l.tasks.length, 0);

  const moodCounts = MOODS.map((m) => ({
    ...m,
    count: logs.filter((l) => l.mood === m.value).length,
  })).filter((m) => m.count > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Work Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {date === today ? "Today — " : ""}{formatDisplayDate(date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => { setDate(e.target.value); setExpanded(null); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
          />
          {date !== today && (
            <button
              onClick={() => setDate(today)}
              className="text-secondary text-sm font-medium hover:underline"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{logs.length}</div>
            <div className="text-xs text-gray-500 mt-1">Reports Submitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
            <div className="text-xs text-gray-500 mt-1">Total Tasks Logged</div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-2">Team Mood</p>
            {moodCounts.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No mood data yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {moodCounts.map((m) => (
                  <span key={m.value} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${m.bg} ${m.color}`}>
                    <m.icon className="h-3.5 w-3.5" />
                    {m.label} × {m.count}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Staff Reports
            <Badge className="ml-auto bg-secondary/10 text-secondary text-xs">{logs.length} submitted</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center text-gray-400 py-10">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <AlertCircle className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="text-gray-400 text-sm">No reports submitted for this date.</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => {
                const isOpen = expanded === log.id;
                const m = MOODS.find((x) => x.value === log.mood);
                return (
                  <div key={log.id}>
                    <button
                      className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      onClick={() => setExpanded(isOpen ? null : log.id)}
                    >
                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {log.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-sm text-gray-900">{log.userName}</p>
                        <p className="text-xs text-gray-500 truncate">{log.userEmail}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${m.bg} ${m.color}`}>
                            <m.icon className="h-3 w-3" />
                            {m.label}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">{log.tasks.length} tasks</Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(log.updatedAt).toLocaleTimeString("en-US", {
                            timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 bg-gray-50 border-t space-y-3">
                        {/* Task list */}
                        <div className="pt-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Tasks ({log.tasks.length})
                          </p>
                          <ul className="space-y-1.5">
                            {log.tasks.map((t, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {log.summary && (
                          <div className="bg-white rounded-md border px-3 py-2 text-sm text-gray-600 italic">
                            "{log.summary}"
                          </div>
                        )}
                      </div>
                    )}
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
