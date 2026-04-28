import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, ShieldCheck, User } from "lucide-react";

type LoginMode = "customer" | "admin";

export default function Login() {
  const [, setLocation] = useLocation();
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
          window.location.href = import.meta.env.BASE_URL + "dashboard";
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center mb-6">
            <img
              src={`${import.meta.env.BASE_URL}maya-logo.jpeg`}
              alt="Maya Logistics"
              className="h-16 w-auto"
            />
          </Link>
          <h2 className="mt-2 text-3xl font-extrabold text-secondary">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-500">Manage your global shipments</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("customer")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              mode === "customer"
                ? "bg-secondary text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <User className="h-4 w-4" />
            Customer Login
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              mode === "admin"
                ? "bg-primary text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin / Staff
          </button>
        </div>

        {/* Info banner for admin */}
        {mode === "admin" && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            Sign in with your admin or staff credentials to access the management dashboard.
          </div>
        )}

        <form className="mt-2 space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div className="space-y-4">
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
          </div>

          <div className="flex items-center justify-between">
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
            className={`w-full h-12 text-base font-bold text-white ${
              mode === "admin"
                ? "bg-primary hover:bg-primary/90"
                : "bg-secondary hover:bg-secondary/90"
            }`}
          >
            {loginMutation.isPending
              ? "Signing in…"
              : mode === "admin"
                ? "Sign in as Admin / Staff"
                : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center">
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
