import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  Calendar,
  Search,
  BarChart3,
  Timer,
} from "lucide-react";

const NEPAL_TZ = "Asia/Kathmandu";

function nepalDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: NEPAL_TZ });
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: NEPAL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDuration(minutes: number | null) {
  if (!minutes) return "—";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

interface AttendanceRow {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  isLate: boolean;
  totalMinutes: number | null;
}

interface SummaryRow {
  userId: number;
  userName: string;
  totalDays: number;
  lateDays: number;
  totalMinutes: number;
}

async function apiFetch(path: string) {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function AttendanceAdmin() {
  const [month, setMonth] = useState(nepalDate().slice(0, 7));
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"records" | "summary">("records");

  const { data: records = [], isLoading } = useQuery<AttendanceRow[]>({
    queryKey: ["attendance", "all", month],
    queryFn: () => apiFetch(`/attendance/all?month=${month}`),
  });

  const { data: summary = [] } = useQuery<SummaryRow[]>({
    queryKey: ["attendance", "summary", month],
    queryFn: () => apiFetch(`/attendance/summary?month=${month}`),
  });

  const filtered = records.filter(
    (r) =>
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search)
  );

  const totalPresent = records.length;
  const totalLate = records.filter((r) => r.isLate).length;
  const onTime = totalPresent - totalLate;
  const totalHours = records.reduce((s, r) => s + (r.totalMinutes ?? 0), 0);
  const uniqueStaff = new Set(records.map((r) => r.userId)).size;

  const handleExport = () => {
    window.open(`/api/attendance/export?month=${month}`, "_blank");
  };

  const tabs = [
    { key: "records", label: "Daily Records", icon: Calendar },
    { key: "summary", label: "Staff Summary", icon: BarChart3 },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-sm text-gray-500 mt-1">All times in Nepal Time (NPT, UTC+5:45)</p>
        </div>
        <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold">{uniqueStaff}</div>
                <div className="text-xs text-gray-500">Staff Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{onTime}</div>
                <div className="text-xs text-gray-500">On Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">{totalLate}</div>
                <div className="text-xs text-gray-500">Late Arrivals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Timer className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-purple-600">
                  {(totalHours / 60).toFixed(0)}h
                </div>
                <div className="text-xs text-gray-500">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff name, email or date…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="text-sm border rounded px-3 py-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Daily Records Tab */}
      {activeTab === "records" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Daily Records — {month} ({filtered.length} entries)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Staff</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Clock In</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Clock Out</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        Loading…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{r.userName}</div>
                          <div className="text-xs text-gray-400">{r.userEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{r.date}</td>
                        <td className="px-4 py-3">
                          <span className="text-green-700 font-medium">
                            {fmtTime(r.clockIn)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-red-600">
                            {fmtTime(r.clockOut)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {fmtDuration(r.totalMinutes)}
                        </td>
                        <td className="px-4 py-3">
                          {r.isLate ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Late
                            </Badge>
                          ) : (
                            <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              On Time
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Summary Tab */}
      {activeTab === "summary" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Monthly Summary — {month}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Staff Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Days Present</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Late Days</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">On Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Total Hours</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Punctuality</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No data for this month
                      </td>
                    </tr>
                  ) : (
                    summary.map((s) => {
                      const pct =
                        s.totalDays > 0
                          ? Math.round(((s.totalDays - s.lateDays) / s.totalDays) * 100)
                          : 100;
                      return (
                        <tr key={s.userId} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {s.userName}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-blue-600">{s.totalDays}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${s.lateDays > 0 ? "text-red-600" : "text-green-600"}`}>
                              {s.lateDays}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-green-600 font-semibold">
                            {s.totalDays - s.lateDays}
                          </td>
                          <td className="px-4 py-3 text-purple-600 font-semibold">
                            {s.totalMinutes ? `${(s.totalMinutes / 60).toFixed(1)}h` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                                <div
                                  className={`h-2 rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Late threshold note */}
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>Late arrival is defined as clocking in after <strong>9:30 AM Nepal Time</strong>. All times are displayed in NPT (UTC+5:45).</span>
      </div>
    </div>
  );
}
