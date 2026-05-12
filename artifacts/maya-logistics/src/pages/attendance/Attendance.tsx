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
  X,
} from "lucide-react";

const NEPAL_TZ = "Asia/Kathmandu";
const LATE_HOUR = 10;       // 10:00 AM
const EARLY_OUT_HOUR = 17;  // 5:00 PM

function nepalNow() {
  return new Date().toLocaleString("en-US", {
    timeZone: NEPAL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function nepalDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: NEPAL_TZ });
}

function getNepalHour(): number {
  return parseInt(
    new Date().toLocaleString("en-US", { timeZone: NEPAL_TZ, hour: "numeric", hour12: false }),
    10
  );
}

function isLateNow(): boolean {
  return getNepalHour() >= LATE_HOUR;
}

function isEarlyLeaveNow(): boolean {
  return getNepalHour() < EARLY_OUT_HOUR;
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function AlertBanner({
  type,
  message,
  onClose,
}: {
  type: "late" | "early";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`relative flex items-start gap-3 rounded-lg px-4 py-3 text-sm font-medium animate-in slide-in-from-top-2 ${
        type === "late"
          ? "bg-red-100 text-red-800 border border-red-300"
          : "bg-orange-100 text-orange-800 border border-orange-300"
      }`}
    >
      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function EarlyLeaveDialog({
  currentTime,
  onConfirm,
  onCancel,
  loading,
}: {
  currentTime: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Too Early to Leave!</h2>
        </div>
        <p className="text-gray-600 text-sm">
          It is currently <strong>{currentTime} NPT</strong>. Office hours end at{" "}
          <strong>5:00 PM</strong>. It is not time to leave yet.
        </p>
        <p className="text-gray-600 text-sm">
          Please stay until <strong>5:00 PM</strong> and come on time tomorrow.
        </p>
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Stay & Cancel
          </Button>
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Recording…" : "Clock Out Anyway"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nowStr, setNowStr] = useState(nepalNow());
  const [month, setMonth] = useState(nepalDate().slice(0, 7));
  const [lateAlert, setLateAlert] = useState<string | null>(null);
  const [earlyAlert, setEarlyAlert] = useState<string | null>(null);
  const [showEarlyDialog, setShowEarlyDialog] = useState(false);

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

  const doClockIn = async () => {
    const loc = await getLocation();
    return apiFetch("/attendance/clock-in", {
      method: "POST",
      body: JSON.stringify(loc ?? {}),
    });
  };

  const doClockOut = async () => {
    const loc = await getLocation();
    return apiFetch("/attendance/clock-out", {
      method: "POST",
      body: JSON.stringify(loc ?? {}),
    });
  };

  const clockIn = useMutation({
    mutationFn: doClockIn,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      if (data.late && data.lateMessage) {
        setLateAlert(data.lateMessage);
        toast({
          title: "⚠️ You Are Late!",
          description: data.lateMessage,
          variant: "destructive",
        });
      } else {
        toast({ title: "✅ Clocked In!", description: `Recorded at ${nepalNow()} (NPT)` });
      }
    },
    onError: (e: Error) => {
      toast({ title: "Clock In Failed", description: e.message, variant: "destructive" });
    },
  });

  const clockOut = useMutation({
    mutationFn: doClockOut,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      setShowEarlyDialog(false);
      if (data.earlyLeave && data.earlyLeaveMessage) {
        setEarlyAlert(data.earlyLeaveMessage);
        toast({
          title: "⚠️ Left Early!",
          description: data.earlyLeaveMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Clocked Out!",
          description: `Total time: ${data.duration ?? "—"} (NPT)`,
        });
      }
    },
    onError: (e: Error) => {
      setShowEarlyDialog(false);
      toast({ title: "Clock Out Failed", description: e.message, variant: "destructive" });
    },
  });

  const handleClockOutClick = () => {
    if (isEarlyLeaveNow()) {
      setShowEarlyDialog(true);
    } else {
      clockOut.mutate();
    }
  };

  const hasClockedIn = !!today?.clockIn;
  const hasClockedOut = !!today?.clockOut;
  const presentDays = records.filter((r) => r.clockIn).length;
  const lateDays = records.filter((r) => r.isLate).length;
  const totalMins = records.reduce((s, r) => s + (r.totalMinutes ?? 0), 0);

  const clockInLabel = isLateNow() && !hasClockedIn
    ? "Clock In (You Are Late!)"
    : "Clock In";

  return (
    <div className="space-y-5">
      {showEarlyDialog && (
        <EarlyLeaveDialog
          currentTime={nowStr}
          onConfirm={() => clockOut.mutate()}
          onCancel={() => setShowEarlyDialog(false)}
          loading={clockOut.isPending}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}</p>
      </div>

      {lateAlert && (
        <AlertBanner type="late" message={lateAlert} onClose={() => setLateAlert(null)} />
      )}
      {earlyAlert && (
        <AlertBanner type="early" message={earlyAlert} onClose={() => setEarlyAlert(null)} />
      )}

      {/* Live Clock */}
      <Card className="bg-secondary text-white border-0">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="h-5 w-5 opacity-70" />
            <span className="text-sm opacity-70">Nepal Time (NPT · UTC+5:45)</span>
          </div>
          <div className="text-4xl font-mono font-bold tracking-widest">{nowStr}</div>
          <div className="text-sm opacity-60 mt-1">{nepalDate()}</div>
          <div className="flex justify-center gap-4 mt-3 text-xs opacity-60">
            <span>Office In: 10:00 AM</span>
            <span>•</span>
            <span>Office Out: 5:00 PM</span>
          </div>
        </CardContent>
      </Card>

      {/* Today card */}
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
                  className={`flex-1 h-14 text-sm font-semibold ${
                    isLateNow() && !hasClockedIn
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  onClick={() => clockIn.mutate()}
                  disabled={hasClockedIn || clockIn.isPending}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  {clockIn.isPending ? "Recording…" : clockInLabel}
                </Button>
                <Button
                  className="flex-1 h-14 text-sm font-semibold bg-gray-800 hover:bg-gray-900"
                  onClick={handleClockOutClick}
                  disabled={!hasClockedIn || hasClockedOut || clockOut.isPending}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  {clockOut.isPending ? "Recording…" : "Clock Out"}
                </Button>
              </div>

              {/* Status messages */}
              {!hasClockedIn && isLateNow() && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  You are late! Office starts at 10:00 AM. Please clock in now.
                </div>
              )}
              {hasClockedIn && !hasClockedOut && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-md px-3 py-2">
                  <Timer className="h-4 w-4" />
                  You are clocked in. Clock out at 5:00 PM or later.
                </div>
              )}
              {hasClockedOut && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Attendance complete for today. See you tomorrow!
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Monthly summary */}
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

      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Office hours: <strong>10:00 AM – 5:00 PM Nepal Time (NPT, UTC+5:45)</strong>.
          Late arrivals and early departures are recorded and visible to admin.
        </span>
      </div>
    </div>
  );
}
