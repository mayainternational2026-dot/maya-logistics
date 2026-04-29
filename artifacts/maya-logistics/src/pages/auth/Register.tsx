import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Lock, ShieldCheck, CheckCircle2, XCircle, ArrowRight, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL;

// ── Password rule helpers ──
const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number (0–9)", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

function passwordStrength(password: string): number {
  return rules.filter((r) => r.test(password)).length;
}

function strengthLabel(score: number) {
  if (score === 0) return { label: "", color: "" };
  if (score <= 1) return { label: "Very Weak", color: "bg-red-500" };
  if (score === 2) return { label: "Weak", color: "bg-orange-500" };
  if (score === 3) return { label: "Good", color: "bg-yellow-500" };
  return { label: "Strong", color: "bg-green-500" };
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = passwordStrength(formData.password);
  const { label: strLabel, color: strColor } = strengthLabel(strength);
  const isPasswordValid = strength === 4;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── STEP 1: Send OTP ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast({ title: "Weak password", description: "Please meet all password requirements.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Could not send OTP", variant: "destructive" });
        return;
      }
      toast({ title: "OTP Sent!", description: `A 6-digit code was sent to ${formData.email}` });
      setStep("otp");
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter the 6-digit code from your email.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/register-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Verification Failed", description: data.error || "Invalid or expired OTP", variant: "destructive" });
        return;
      }
      toast({ title: "Account Created!", description: "Welcome to Maya Logistics!" });
      window.location.replace(window.location.origin + BASE + "dashboard");
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Could not resend OTP", variant: "destructive" });
      } else {
        toast({ title: "OTP Resent", description: `New code sent to ${formData.email}` });
      }
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">

        {/* Logo + title */}
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center mb-4">
            <img src={`${BASE}maya-logo.jpeg`} alt="Maya Logistics" className="h-14 w-auto" />
          </Link>
          <h2 className="text-2xl font-extrabold text-secondary">
            {step === "form" ? "Create your account" : "Verify your email"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {step === "form"
              ? "Start shipping globally with Maya Logistics"
              : `We sent a 6-digit code to ${formData.email}`}
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold", step === "form" ? "bg-primary text-white" : "bg-green-500 text-white")}>
            {step === "otp" ? <CheckCircle2 className="h-4 w-4" /> : "1"}
          </div>
          <div className={cn("flex-1 h-1 rounded", step === "otp" ? "bg-green-500" : "bg-gray-200")} />
          <div className={cn("flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold", step === "otp" ? "bg-primary text-white" : "bg-gray-200 text-gray-500")}>
            2
          </div>
          <div className="text-xs text-gray-400 ml-1 whitespace-nowrap">
            {step === "form" ? "Fill details" : "Enter OTP"}
          </div>
        </div>

        {/* ── STEP 1: Registration form ── */}
        {step === "form" && (
          <form className="space-y-4" onSubmit={handleSendOtp}>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <Input name="name" required value={formData.name} onChange={handleChange} className="pl-10 h-11 bg-gray-50" placeholder="Ram Bahadur Thapa" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input type="email" name="email" required value={formData.email} onChange={handleChange} className="pl-10 h-11 bg-gray-50" placeholder="you@gmail.com" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <Input name="phone" required value={formData.phone} onChange={handleChange} className="pl-10 h-11 bg-gray-50" placeholder="+977 98..." />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-16 h-11 bg-gray-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Strength bar */}
              {formData.password.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn("h-1.5 flex-1 rounded-full transition-all", i <= strength ? strColor : "bg-gray-200")}
                      />
                    ))}
                    {strLabel && <span className={cn("text-xs font-medium ml-1", strength === 4 ? "text-green-600" : strength === 3 ? "text-yellow-600" : "text-red-500")}>{strLabel}</span>}
                  </div>
                  <ul className="space-y-1">
                    {rules.map((rule) => {
                      const ok = rule.test(formData.password);
                      return (
                        <li key={rule.label} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-green-600" : "text-gray-400")}>
                          {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading || !isPasswordValid} className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90 text-white gap-2">
              {loading ? "Sending OTP..." : <><span>Send Verification Code</span><ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}

        {/* ── STEP 2: OTP form ── */}
        {step === "otp" && (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Check your inbox at <strong>{formData.email}</strong> for a 6-digit verification code. It expires in <strong>15 minutes</strong>.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit Verification Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="pl-10 h-12 bg-gray-50 text-center text-xl font-mono tracking-widest"
                  placeholder="• • • • • •"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                />
              </div>
            </div>

            <Button type="submit" disabled={loading || otp.length !== 6} className="w-full h-11 text-base font-bold bg-green-600 hover:bg-green-700 text-white gap-2">
              {loading ? "Verifying..." : <><CheckCircle2 className="h-4 w-4" /><span>Verify & Create Account</span></>}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => setStep("form")} className="text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline">
                ← Change details
              </button>
              <button type="button" onClick={resendOtp} disabled={loading} className="text-primary hover:text-primary/80 font-medium underline-offset-2 hover:underline">
                Resend code
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-secondary hover:text-primary">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
