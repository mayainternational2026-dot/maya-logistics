import { useState } from "react";
import { Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, ShieldCheck, User, UserCog } from "lucide-react";

type LoginMode = "customer" | "staff" | "admin";

const TABS: { mode: LoginMode; label: string; icon: React.ReactNode; hint?: string }[] = [
  {
    mode: "customer",
    label: "Customer",
    icon: <User className="h-4 w-4" />,
  },
  {
    mode: "staff",
    label: "Staff",
    icon: <UserCog className="h-4 w-4" />,
    hint: "Sign in with your staff credentials to manage shipments and customers.",
  },
  {
    mode: "admin",
    label: "Admin",
    icon: <ShieldCheck className="h-4 w-4" />,
    hint: "Full access to all management features including users and reports.",
  },
];

const TAB_COLORS: Record<LoginMode, string> = {
  customer: "bg-secondary text-white",
  staff:    "bg-blue-600 text-white",
  admin:    "bg-primary text-white",
};

const BTN_COLORS: Record<LoginMode, string> = {
  customer: "bg-secondary hover:bg-secondary/90",
  staff:    "bg-blue-600 hover:bg-blue-700",
  admin:    "bg-primary hover:bg-primary/90",
};

const BANNER_COLORS: Record<LoginMode, string> = {
  customer: "",
  staff:    "border-blue-200 bg-blue-50 text-blue-800",
  admin:    "border-primary/20 bg-primary/5 text-primary",
};

export default function Login() {
  const { toast } = useToast();
  const loginMutation = useLogin();

  const [mode, setMode] = useState<LoginMode>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: () => {
          toast({ title: "Welcome back!" });
          // Full reload so the session cookie is sent fresh and /api/auth/me
          // re-fetches cleanly — most reliable across all environments
          window.location.replace(
            window.location.origin + import.meta.env.BASE_URL + "dashboard",
          );
        },
        onError: (err: any) => {
          toast({
            title: "Login Failed",
            description: err?.data?.error || "Invalid email or password.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const activeTab = TABS.find((t) => t.mode === mode)!;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center mb-4">
            <img
              src={`${import.meta.env.BASE_URL}maya-logo.jpeg`}
              alt="Maya Logistics"
              className="h-16 w-auto"
            />
          </Link>
          <h2 className="text-3xl font-extrabold text-secondary">
            Sign in to your account
          </h2>
          <p className="mt-1 text-sm text-gray-500">Manage your global shipments</p>
        </div>

        {/* 3-way tab toggle */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.mode}
              type="button"
              onClick={() => setMode(tab.mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors ${
                mode === tab.mode
                  ? TAB_COLORS[tab.mode]
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hint banner for staff / admin */}
        {activeTab.hint && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${BANNER_COLORS[mode]}`}>
            {activeTab.hint}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-gray-50"
                placeholder="Enter your email"
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 bg-gray-50"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Forgot your password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className={`w-full h-12 text-base font-bold text-white ${BTN_COLORS[mode]}`}
          >
            {loginMutation.isPending
              ? "Signing in…"
              : `Sign in as ${activeTab.label}`}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary/80"
            >
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
