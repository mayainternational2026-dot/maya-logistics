import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Calendar,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logout = useLogout();

  if (!user) return null;

  const isInternal = user.role === "admin" || user.role === "staff";

  const doLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
        window.location.reload();
      },
    });
  };

  const handleLogout = () => {
    if (isInternal) {
      setShowLogoutConfirm(true);
    } else {
      doLogout();
    }
  };

  const roleLabel =
    user.role === "admin"
      ? "Administrator"
      : user.role === "staff"
        ? "Staff Member"
        : "Customer";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Your profile</h1>
        <p className="mt-1 text-gray-600">
          Account details and access for {roleLabel}.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-secondary to-secondary/80 text-white p-8 flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-300 text-sm">{user.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-white">
              <Shield className="h-3 w-3" /> {roleLabel}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <UserIcon className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  Full name
                </p>
                <p className="font-semibold text-secondary">{user.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  Email
                </p>
                <p className="font-semibold text-secondary">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  Phone
                </p>
                <p className="font-semibold text-secondary">{user.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  Member since
                </p>
                <p className="font-semibold text-secondary">
                  {format(new Date(user.createdAt), "MMMM yyyy")}
                </p>
              </div>
            </div>
          </div>

          {user.role !== "customer" && (
            <div className="rounded-xl bg-gray-50 p-5 border border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Permissions
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  Manage shipments:{" "}
                  <strong>
                    {user.permissions?.canManageShipments ? "Yes" : "No"}
                  </strong>
                </li>
                <li>
                  Manage customers:{" "}
                  <strong>
                    {user.permissions?.canManageCustomers ? "Yes" : "No"}
                  </strong>
                </li>
                <li>
                  Generate invoices:{" "}
                  <strong>
                    {user.permissions?.canGenerateInvoice ? "Yes" : "No"}
                  </strong>
                </li>
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </div>

      <WhatsAppButton />

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <LogOut className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Log out of your account?</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Logging out does <span className="font-semibold text-red-600">not</span> clock you out.
                  Your attendance record stays saved — you can log back in later to clock out.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  If you share this computer with other staff, each person must clock in and out individually.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); doLogout(); }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
