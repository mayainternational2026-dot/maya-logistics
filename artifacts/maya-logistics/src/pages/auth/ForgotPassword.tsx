import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForgotPassword, useResetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, KeyRound, Lock } from "lucide-react";

type Step = "email" | "otp";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const forgot = useForgotPassword();
  const reset = useResetPassword();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate(
      { data: { email } },
      {
        onSuccess: (data) => {
          setDemoOtp(data?.otp ?? null);
          setStep("otp");
          toast({
            title: "Check your inbox",
            description: data?.otp
              ? `Demo OTP: ${data.otp}`
              : "If that email is registered, a one-time code is on the way.",
          });
        },
        onError: (err: any) => {
          toast({
            title: "Could not send code",
            description: err?.data?.error || "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    reset.mutate(
      { data: { email, otp, newPassword } },
      {
        onSuccess: () => {
          toast({
            title: "Password reset",
            description: "You can now sign in with your new password.",
          });
          setLocation("/login");
        },
        onError: (err: any) => {
          toast({
            title: "Reset failed",
            description: err?.data?.error || "Invalid or expired OTP.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center mb-6">
            <img
              src={`${import.meta.env.BASE_URL}maya-logo.jpeg`}
              alt="Maya Logistics"
              className="h-16 w-auto"
            />
          </Link>
          <h2 className="mt-2 text-3xl font-extrabold text-secondary">
            {step === "email" ? "Reset your password" : "Enter your code"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {step === "email"
              ? "We will send a one-time code to recover your account."
              : "Enter the 6-digit code we just sent and choose a new password."}
          </p>
        </div>

        {step === "email" ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequest}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-gray-50"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={forgot.isPending}
              className="w-full h-12 text-base font-bold bg-secondary hover:bg-secondary/90 text-white"
            >
              {forgot.isPending ? "Sending..." : "Send recovery code"}
            </Button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleReset}>
            {demoOtp && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Demo OTP:</strong>{" "}
                <code className="font-mono">{demoOtp}</code>
                <p className="mt-1 text-xs text-amber-700">
                  In production this code is delivered via SMS or email.
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                One-time code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="pl-10 h-12 bg-gray-50 font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 h-12 bg-gray-50"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={reset.isPending}
              className="w-full h-12 text-base font-bold bg-secondary hover:bg-secondary/90 text-white"
            >
              {reset.isPending ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
