import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Timer,
} from "lucide-react";

const NEPAL_TZ = "Asia/Kathmandu";

function nepalNow() {
  return new Date().toLocaleString("en-US", { timeZone: NEPAL_TZ, hour12: true });
}

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
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

interface AttendanceRecord {
  id: number;
  date: string;
  clockIn: string;
  clockOut: string | null;
  isLate: boolean;
  totalMinutes: number | null;
  clockInLat?: string | null;
  clockInLng?: string | null;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Request failed");
  }
  return res.json();
}

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nowStr, setNowStr] = useState(nepalNow());
  const [month, setMonth] = useState(nepalDate().slice(0, 7));

  useEffect(() => {
    const t = setInterval(() => setNowStr(nepalNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: today, isLoading: todayLoading } = useQuery<AttendanceRecord | null>({
    queryKey: ["attendance", "today"],
    queryFn: () => apiFetch("/attendance/today"),
    refetchInterval: 30000,
  });

  const { data: records = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "my-records", month],
    queryFn: () => apiFetch(`/attendance/my-records?month=${month}`),
  });

  const getLocation = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });

  const clockIn = useMutation({
    mutationFn: async () => {
      const loc = await getLocation();
      return apiFetch("/attendance/clock-in", {
        method: "POST",
        body: JSON.stringify(loc ?? {}),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "✅ Clocked In!", description: `Recorded at ${nepalNow()} (NPT)` });
    },
    onError: (e: Error) => {
      toast({ title: "Clock In Failed", description: e.message, variant: "destructive" });
    },
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      const loc = await getLocation();
      return apiFetch("/attendance/clock-out", {
        method: "POST",
        body: JSON.stringify(loc ?? {}),
      });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast({
        title: "✅ Clocked Out!",
        description: `Total time: ${data.duration ?? "—"} (NPT)`,
      });
    },
    onError: (e: Error) => {
      toast({ title: "Clock Out Failed", description: e.message, variant: "destructive" });
    },
  });

  const hasClockedIn = !!today?.clockIn;
  const hasClockedOut = !!today?.clockOut;
  const presentDays = records.filter((r) => r.clockIn).length;
  const lateDays = records.filter((r) => r.isLate).length;
  const totalMins = records.reduce((s, r) => s + (r.totalMinutes ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}</p>
      </div>

      {/* Live Clock */}
      <Card className="bg-secondary text-white border-0">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="h-5 w-5 opacity-70" />
            <span className="text-sm opacity-70">Nepal Time (NPT)</span>
          </div>
          <div className="text-4xl font-mono font-bold tracking-widest">{nowStr}</div>
          <div className="text-sm opacity-60 mt-1">{nepalDate()}</div>
        </CardContent>
      </Card>

      {/* Clock In / Out buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayLoading ? (
            <div className="text-center text-gray-400 py-4">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-gray-500 text-xs mb-1">Clock In</div>
                  <div className="font-semibold text-lg text-green-700">
                    {hasClockedIn ? fmtTime(today!.clockIn) : "—"}
                  </div>
                  {today?.isLate && (
                    <Badge variant="destructive" className="mt-1 text-xs">Late</Badge>
                  )}
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-gray-500 text-xs mb-1">Clock Out</div>
                  <div className="font-semibold text-lg text-red-700">
                    {hasClockedOut ? fmtTime(today!.clockOut!) : "—"}
                  </div>
                  {hasClockedOut && (
                    <div className="text-xs text-gray-500 mt-1">
                      {fmtDuration(today!.totalMinutes)}
                    </div>
                  )}
                </div>
              </div>

              {today?.clockInLat && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" />
                  Location recorded
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 h-14 text-base bg-green-600 hover:bg-green-700"
                  onClick={() => clockIn.mutate()}
                  disabled={hasClockedIn || clockIn.isPending}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  {clockIn.isPending ? "Recording…" : "Clock In"}
                </Button>
                <Button
                  className="flex-1 h-14 text-base bg-red-600 hover:bg-red-700"
                  onClick={() => clockOut.mutate()}
                  disabled={!hasClockedIn || hasClockedOut || clockOut.isPending}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  {clockOut.isPending ? "Recording…" : "Clock Out"}
                </Button>
              </div>

              {hasClockedIn && !hasClockedOut && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-md px-3 py-2">
                  <Timer className="h-4 w-4" />
                  You are currently clocked in. Remember to clock out before leaving.
                </div>
              )}
              {hasClockedOut && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Attendance complete for today!
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Monthly summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{presentDays}</div>
            <div className="text-xs text-gray-500 mt-1">Days Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{lateDays}</div>
            <div className="text-xs text-gray-500 mt-1">Late Arrivals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(totalMins / 60).toFixed(1)}h
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Hours</div>
          </CardContent>
        </Card>
      </div>

      {/* History table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Attendance History</CardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Clock In</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Clock Out</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Hours</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No records for this month
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.date}</td>
                      <td className="px-4 py-3 text-green-700">{fmtTime(r.clockIn)}</td>
                      <td className="px-4 py-3 text-red-600">{fmtTime(r.clockOut)}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtDuration(r.totalMinutes)}</td>
                      <td className="px-4 py-3">
                        {r.isLate ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />Late
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />On Time
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
    </div>
  );
}
