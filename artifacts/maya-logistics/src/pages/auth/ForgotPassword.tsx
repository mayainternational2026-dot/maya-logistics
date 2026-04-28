import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForgotPassword, useResetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, KeyRound, Lock, CheckCircle } from "lucide-react";

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

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          setStep("otp");
          toast({
            title: "Code sent!",
            description: `A 6-digit OTP has been sent to ${email}. Check your inbox.`,
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
              ? "Enter your email and we will send a one-time code."
              : "Enter the 6-digit code sent to your email and choose a new password."}
          </p>
        </div>

        {step === "email" ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequest} autoComplete="off">
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
                  autoComplete="off"
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
          <form className="mt-8 space-y-6" onSubmit={handleReset} autoComplete="off">
            {/* Sent confirmation banner */}
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
              <div>
                <p className="font-semibold">Code sent to {email}</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Check your inbox (and spam folder). The code expires in 15 minutes.
                </p>
              </div>
            </div>

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
                  className="pl-10 h-12 bg-gray-50 font-mono tracking-widest text-center text-lg"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="off"
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
                  autoComplete="new-password"
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
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
            >
              Didn't receive the code? Send again
            </button>
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
