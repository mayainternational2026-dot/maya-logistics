import { useState } from "react";
import { Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, XCircle } from "lucide-react";
import { logoUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

type FieldErrors = { email?: string; password?: string };

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {msg}
    </p>
  ) : null;

export default function Login() {
  const { toast } = useToast();
  const loginMutation = useLogin();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState<FieldErrors>({});

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email address";
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center mb-4">
            <img src={logoUrl} alt="Maya Logistics" className="h-16 w-auto" />
          </Link>
          <h2 className="text-3xl font-extrabold text-secondary">Sign in</h2>
          <p className="mt-1 text-sm text-gray-500">Maya Import Export Logistic</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} autoComplete="on" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className={cn("h-5 w-5", errors.email ? "text-red-400" : "text-gray-400")} />
              </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className={cn("h-5 w-5", errors.password ? "text-red-400" : "text-gray-400")} />
              </div>
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
            className="w-full h-12 text-base font-bold text-white bg-primary hover:bg-primary/90"
          >
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:text-primary/80">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
