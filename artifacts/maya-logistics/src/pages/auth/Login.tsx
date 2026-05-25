import { useState } from "react";
import { Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, XCircle } from "lucide-react";
import { logoUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

type Panel = "customer" | "staff";

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {msg}
    </p>
  ) : null;

export default function Login() {
  const { toast } = useToast();
  const loginMutation = useLogin();

  const [panel, setPanel]       = useState<Panel>("customer");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});

  const isStaff = panel === "staff";

  function switchPanel(p: Panel) {
    setPanel(p);
    setEmail("");
    setPassword("");
    setErrors({});
    setShowPass(false);
  }

  function validate() {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    loginMutation.mutate(
      { data: { email: email.trim().toLowerCase(), password } },
      {
        onSuccess: () => {
          toast({ title: "Welcome back!" });
          window.location.href = "/dashboard";
        },
        onError: (err: any) => {
          toast({
            title: "Login failed",
            description: err?.data?.error || "Invalid email or password.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4">
      <div className="w-full max-w-md space-y-0">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex justify-center">
            <img src={logoUrl} alt="Maya Logistics" className="h-16 w-auto drop-shadow" />
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold text-secondary tracking-tight">
            Maya Import Export Logistic
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Sign in to your account</p>
        </div>

        {/* Panel switcher */}
        <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-gray-200 shadow-sm mb-0">
          <button
            type="button"
            onClick={() => switchPanel("customer")}
            className={cn(
              "flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors",
              !isStaff
                ? "bg-primary text-white shadow-inner"
                : "bg-white text-gray-500 hover:bg-gray-50",
            )}
          >
            <User className="h-4 w-4" />
            Customer
          </button>
          <button
            type="button"
            onClick={() => switchPanel("staff")}
            className={cn(
              "flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-l border-gray-200",
              isStaff
                ? "bg-secondary text-white shadow-inner"
                : "bg-white text-gray-500 hover:bg-gray-50",
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Staff / Admin
          </button>
        </div>

        {/* Card */}
        <div className={cn(
          "bg-white rounded-b-2xl shadow-lg border-x border-b px-8 py-7 space-y-5",
          isStaff ? "border-secondary/30" : "border-primary/20",
        )}>
          {/* Panel context label */}
          <p className={cn(
            "text-xs font-medium uppercase tracking-widest",
            isStaff ? "text-secondary/60" : "text-primary/60",
          )}>
            {isStaff ? "Staff & Admin Portal" : "Customer Portal"}
          </p>

          <form onSubmit={handleSubmit} autoComplete="on" noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <Mail className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none",
                  errors.email ? "text-red-400" : "text-gray-400",
                )} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  className={cn("pl-10 h-12 bg-gray-50", errors.email && "border-red-400 focus-visible:ring-red-400")}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              <FieldError msg={errors.email} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none",
                  errors.password ? "text-red-400" : "text-gray-400",
                )} />
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  className={cn("pl-10 pr-12 h-12 bg-gray-50", errors.password && "border-red-400 focus-visible:ring-red-400")}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                )}
              </div>
              <FieldError msg={errors.password} />
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className={cn(
                "w-full h-12 text-base font-bold text-white",
                isStaff
                  ? "bg-secondary hover:bg-secondary/90"
                  : "bg-primary hover:bg-primary/90",
              )}
            >
              {loginMutation.isPending
                ? "Signing in…"
                : isStaff ? "Sign in as Staff" : "Sign in as Customer"}
            </Button>
          </form>

          {!isStaff && (
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:text-primary/80">
                Register now
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
