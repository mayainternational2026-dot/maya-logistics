import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Phone, Lock, CheckCircle2, XCircle, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoUrl } from "@/lib/assets";

const rules = [
  { label: "At least 8 characters",         test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)",     test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number (0–9)",               test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)",  test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

function strengthScore(p: string) { return rules.filter((r) => r.test(p)).length; }
function strengthMeta(score: number) {
  if (score === 0) return { label: "",         bar: "bg-gray-200" };
  if (score === 1) return { label: "Very Weak", bar: "bg-red-500" };
  if (score === 2) return { label: "Weak",      bar: "bg-orange-500" };
  if (score === 3) return { label: "Good",      bar: "bg-yellow-500" };
  return              { label: "Strong",     bar: "bg-green-500" };
}

type FieldErrors = { name?: string; email?: string; phone?: string; password?: string; confirmPassword?: string };

export default function Register() {
  const BASE = import.meta.env.BASE_URL;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FieldErrors>({});

  const score = strengthScore(form.password);
  const { label: strLabel, bar: strBar } = strengthMeta(score);
  const passwordOk = score === 4;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!form.name.trim())  errs.name = "Full name is required";
    if (!form.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address";
    }
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!passwordOk)        errs.password = "Password does not meet all requirements";
    if (!form.confirmPassword) {
      errs.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/register`, {
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
        const msg: string = data.error ?? "Something went wrong";
        if (msg.toLowerCase().includes("email")) setErrors({ email: msg });
        else if (msg.toLowerCase().includes("name")) setErrors({ name: msg });
        else if (msg.toLowerCase().includes("phone")) setErrors({ phone: msg });
        else if (msg.toLowerCase().includes("password")) setErrors({ password: msg });
        else toast({ title: "Registration failed", description: msg, variant: "destructive" });
        return;
      }
      toast({ title: "Welcome to Maya Logistics!", description: "Your account has been created successfully." });
      window.location.replace(window.location.origin + BASE + "dashboard");
    } catch {
      toast({ title: "Network error", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="h-3.5 w-3.5 flex-shrink-0" />{msg}</p> : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">

        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <img src={logoUrl} alt="Maya" className="h-14 w-auto mx-auto" />
          </Link>
          <h2 className="text-2xl font-extrabold text-secondary">Create your account</h2>
          <p className="mt-1 text-sm text-gray-500">Ship globally with Maya Logistics</p>
        </div>

        {/* Password hint shown upfront */}
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">Password must include:</p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {rules.map((r) => {
              const ok = form.password.length > 0 ? r.test(form.password) : false;
              return (
                <li key={r.label} className={cn("flex items-center gap-1 text-xs", form.password.length > 0 ? (ok ? "text-green-600" : "text-red-500") : "text-blue-600")}>
                  {form.password.length > 0
                    ? (ok ? <CheckCircle2 className="h-3 w-3 flex-shrink-0" /> : <XCircle className="h-3 w-3 flex-shrink-0" />)
                    : <span className="h-3 w-3 flex-shrink-0 text-center font-bold">·</span>
                  }
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", errors.name ? "text-red-400" : "text-gray-400")} />
              <Input
                name="name" value={form.name} onChange={set("name")}
                placeholder="Ram Bahadur Thapa"
                className={cn("pl-10 h-11 bg-gray-50", errors.name && "border-red-400 focus-visible:ring-red-400")}
              />
            </div>
            <FieldError msg={errors.name} />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", errors.email ? "text-red-400" : "text-gray-400")} />
              <Input
                type="email" name="email" value={form.email} onChange={set("email")}
                placeholder="you@gmail.com"
                className={cn("pl-10 h-11 bg-gray-50", errors.email && "border-red-400 focus-visible:ring-red-400")}
              />
            </div>
            <FieldError msg={errors.email} />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", errors.phone ? "text-red-400" : "text-gray-400")} />
              <Input
                name="phone" value={form.phone} onChange={set("phone")}
                placeholder="+977 98..."
                className={cn("pl-10 h-11 bg-gray-50", errors.phone && "border-red-400 focus-visible:ring-red-400")}
              />
            </div>
            <FieldError msg={errors.phone} />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", errors.password ? "text-red-400" : "text-gray-400")} />
              <Input
                type={showPass ? "text" : "password"}
                name="password" value={form.password}
                onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: undefined })); }}
                placeholder="••••••••"
                className={cn("pl-10 pr-12 h-11 bg-gray-50", errors.password && "border-red-400 focus-visible:ring-red-400")}
              />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.password.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= score ? strBar : "bg-gray-200")} />
                ))}
                {strLabel && <span className={cn("text-xs font-medium ml-2 w-20 text-right", score === 4 ? "text-green-600" : score >= 3 ? "text-yellow-600" : "text-red-500")}>{strLabel}</span>}
              </div>
            )}
            <FieldError msg={errors.password} />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", errors.confirmPassword ? "text-red-400" : "text-gray-400")} />
              <Input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword" value={form.confirmPassword}
                onChange={set("confirmPassword")}
                placeholder="••••••••"
                className={cn("pl-10 pr-12 h-11 bg-gray-50", errors.confirmPassword && "border-red-400 focus-visible:ring-red-400")}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.confirmPassword && form.password === form.confirmPassword && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Passwords match</p>
            )}
            <FieldError msg={errors.confirmPassword} />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-bold text-base bg-primary hover:bg-primary/90 mt-2"
          >
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <div className="text-center border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-secondary hover:text-primary">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
