import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Phone, Lock, ShieldCheck,
  CheckCircle2, XCircle, ArrowRight, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL;

const rules = [
  { label: "At least 8 characters",          test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)",      test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number (0–9)",                test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)",   test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

function strengthScore(p: string) { return rules.filter((r) => r.test(p)).length; }
function strengthMeta(score: number) {
  if (score === 0) return { label: "", bar: "bg-gray-200" };
  if (score === 1) return { label: "Very Weak", bar: "bg-red-500" };
  if (score === 2) return { label: "Weak",      bar: "bg-orange-500" };
  if (score === 3) return { label: "Good",      bar: "bg-yellow-500" };
  return              { label: "Strong",    bar: "bg-green-500" };
}

type FieldErrors = { name?: string; email?: string; phone?: string; password?: string; otp?: string };

export default function Register() {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const score = strengthScore(form.password);
  const { label: strLabel, bar: strBar } = strengthMeta(score);
  const passwordOk = score === 4;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  // ── Client-side validation ──
  function validateForm(): boolean {
    const errs: FieldErrors = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address";
    }
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!passwordOk) errs.password = "Password does not meet all requirements";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── STEP 1: Send OTP ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Map server errors back to inline field errors
        const msg: string = data.error ?? "Something went wrong";
        if (msg.toLowerCase().includes("email")) setErrors({ email: msg });
        else if (msg.toLowerCase().includes("name")) setErrors({ name: msg });
        else if (msg.toLowerCase().includes("phone")) setErrors({ phone: msg });
        else if (msg.toLowerCase().includes("password")) setErrors({ password: msg });
        else toast({ title: "Error", description: msg, variant: "destructive" });
        return;
      }
      setStep("otp");
    } catch {
      toast({ title: "Network error", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrors({ otp: "Enter the 6-digit code sent to your email" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/register-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email.trim().toLowerCase(), otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ otp: data.error ?? "Invalid or expired OTP. Try again." });
        return;
      }
      toast({ title: "Welcome!", description: "Your account has been created." });
      window.location.replace(window.location.origin + BASE + "dashboard");
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Could not resend OTP", variant: "destructive" });
      } else {
        setErrors({});
        toast({ title: "Code resent", description: `New code sent to ${form.email}` });
      }
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label, icon: Icon, error, children,
  }: { label: string; icon: React.ElementType; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className={cn("h-4 w-4", error ? "text-red-400" : "text-gray-400")} />
        </div>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">

        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <img src={`${BASE}maya-logo.jpeg`} alt="Maya" className="h-14 w-auto mx-auto" />
          </Link>
          <h2 className="text-2xl font-extrabold text-secondary">
            {step === "form" ? "Create your account" : "Verify your email"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {step === "form" ? "Ship globally with Maya Logistics" : `6-digit code sent to ${form.email}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", step === "otp" ? "bg-green-500 text-white" : "bg-primary text-white")}>
            {step === "otp" ? <CheckCircle2 className="h-4 w-4" /> : "1"}
          </div>
          <div className={cn("h-1 flex-1 rounded", step === "otp" ? "bg-green-500" : "bg-gray-200")} />
          <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", step === "otp" ? "bg-primary text-white" : "bg-gray-200 text-gray-400")}>
            2
          </div>
          <span className="text-xs text-gray-400 ml-1">{step === "form" ? "Account details" : "Verify OTP"}</span>
        </div>

        {/* ── STEP 1 ── */}
        {step === "form" && (
          <form className="space-y-4" onSubmit={handleSendOtp} noValidate>
            <Field label="Full Name" icon={User} error={errors.name}>
              <Input
                name="name" value={form.name} onChange={set("name")}
                placeholder="Ram Bahadur Thapa"
                className={cn("pl-10 h-11 bg-gray-50", errors.name && "border-red-400 focus-visible:ring-red-400")}
              />
            </Field>

            <Field label="Email Address" icon={Mail} error={errors.email}>
              <Input
                type="email" name="email" value={form.email} onChange={set("email")}
                placeholder="you@gmail.com"
                className={cn("pl-10 h-11 bg-gray-50", errors.email && "border-red-400 focus-visible:ring-red-400")}
              />
            </Field>

            <Field label="Phone Number" icon={Phone} error={errors.phone}>
              <Input
                name="phone" value={form.phone} onChange={set("phone")}
                placeholder="+977 98..."
                className={cn("pl-10 h-11 bg-gray-50", errors.phone && "border-red-400 focus-visible:ring-red-400")}
              />
            </Field>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={cn("h-4 w-4", errors.password ? "text-red-400" : "text-gray-400")} />
                </div>
                <Input
                  type={showPass ? "text" : "password"}
                  name="password" value={form.password}
                  onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  className={cn("pl-10 pr-16 h-11 bg-gray-50", errors.password && "border-red-400 focus-visible:ring-red-400")}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength bar + rules */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= score ? strBar : "bg-gray-200")} />
                    ))}
                    {strLabel && <span className={cn("text-xs font-medium ml-2 w-20 text-right", score === 4 ? "text-green-600" : score >= 3 ? "text-yellow-600" : "text-red-500")}>{strLabel}</span>}
                  </div>
                  <ul className="space-y-0.5">
                    {rules.map((r) => {
                      const ok = r.test(form.password);
                      return (
                        <li key={r.label} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-green-600" : "text-gray-400")}>
                          {ok ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> : <XCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                          {r.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />{errors.password}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 font-bold bg-primary hover:bg-primary/90 gap-2">
              {loading ? "Sending code…" : <><span>Send Verification Code</span><ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === "otp" && (
          <form className="space-y-5" onSubmit={handleVerifyOtp} noValidate>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Check your inbox at <strong>{form.email}</strong>. The code expires in <strong>15 minutes</strong>.
                <br />
                <span className="text-xs text-blue-600">Check your spam folder if you don't see it.</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit Verification Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className={cn("h-4 w-4", errors.otp ? "text-red-400" : "text-gray-400")} />
                </div>
                <Input
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors({}); }}
                  className={cn("pl-10 h-12 bg-gray-50 text-center text-2xl font-mono tracking-[0.5em]", errors.otp && "border-red-400 focus-visible:ring-red-400")}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                />
              </div>
              {errors.otp && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />{errors.otp}</p>}
            </div>

            <Button type="submit" disabled={loading || otp.length !== 6} className="w-full h-11 font-bold bg-green-600 hover:bg-green-700 gap-2">
              {loading ? "Verifying…" : <><CheckCircle2 className="h-4 w-4" /><span>Verify & Create Account</span></>}
            </Button>

            <div className="flex items-center justify-between text-sm pt-1">
              <button type="button" onClick={() => { setStep("form"); setErrors({}); setOtp(""); }} className="text-gray-500 hover:text-gray-700 hover:underline underline-offset-2">
                ← Change details
              </button>
              <button type="button" onClick={handleResend} disabled={loading} className="text-primary hover:text-primary/80 font-medium hover:underline underline-offset-2">
                Resend code
              </button>
            </div>
          </form>
        )}

        <div className="text-center border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-secondary hover:text-primary">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
