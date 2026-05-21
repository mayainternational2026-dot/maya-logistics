import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/use-auth";
import {
  LayoutDashboard,
  Package,
  Users,
  Activity,
  User as UserIcon,
  LogOut,
  Map,
  ClipboardList,
  ClipboardCheck,
  FilePlus,
  Menu,
  X,
  Clock,
  CalendarDays,
  Calculator,
  Receipt,
  BookPlus,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { logoUrl } from "@/lib/assets";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logout = useLogout();

  // Derived values — safe to compute before the early return because they
  // don't affect hook call order.
  const isInternal = user?.role === "admin" || user?.role === "staff";

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

  // Auto-logout staff/admin after 2 hours of inactivity.
  // MUST be called unconditionally before any early return (Rules of Hooks).
  useEffect(() => {
    if (!user || !isInternal) return;
    const INACTIVITY_MS = 2 * 60 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => doLogout(), INACTIVITY_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, isInternal]);

  // Early return AFTER all hooks have been called
  if (!user) return <>{children}</>;

  const isAdmin = user.role === "admin";
  const isStaff = user.role === "staff";

  const canInvoice = isAdmin || (isStaff && (user.permissions?.canGenerateInvoice ?? false));

  const canAddBooking = isAdmin || (isStaff && (user.permissions?.canManageShipments ?? false));

  const navItems = [
    { name: "Dashboard",        href: "/dashboard",            icon: LayoutDashboard, show: true },
    { name: "Attendance",       href: "/attendance",           icon: Clock,           show: isInternal },
    { name: "My Leave",         href: "/leave",                icon: CalendarDays,    show: isInternal },
    { name: "Work Report",      href: "/work-log",             icon: ClipboardCheck,  show: isInternal },
    { name: "Add Booking",      href: "/admin/add-booking",    icon: BookPlus,        show: canAddBooking },
    { name: "Create Invoice",   href: "/admin/create-invoice", icon: FilePlus,        show: canInvoice },
    { name: "Shipments",        href: "/shipments",            icon: Package,         show: true },
    { name: "Inquiries",        href: "/admin/inquiries",      icon: ClipboardList,   show: isInternal },
    { name: "Staff Attendance", href: "/admin/attendance",     icon: Users,           show: isAdmin },
    { name: "Leave Requests",   href: "/admin/leave",          icon: CalendarDays,    show: isAdmin },
    { name: "Team Work Logs",   href: "/admin/work-logs",      icon: ClipboardCheck,  show: isAdmin },
    { name: "Users",            href: "/admin/users",           icon: Users,           show: isAdmin },
    { name: "Staff Activity",   href: "/admin/staff-activity",  icon: Activity,        show: isAdmin },
    { name: "Daily Expenses",   href: "/expenses",             icon: Receipt,         show: isInternal },
    { name: "Shipping Rates",   href: "/admin/shipping-rates",  icon: Calculator,      show: isAdmin },
    { name: "All Expenses",     href: "/admin/expenses",        icon: Receipt,         show: isAdmin },
    { name: "Track",            href: "/track",                icon: Map,             show: true },
  ].filter((item) => item.show);

  const NavLink = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
    const isActive = location === item.href || location.startsWith(`${item.href}/`);
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm",
          isActive
            ? "bg-primary text-white"
            : "text-gray-300 hover:bg-white/10 hover:text-white",
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-secondary text-secondary-foreground border-r border-secondary-border hidden md:flex flex-col flex-shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/10 bg-secondary">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-md bg-white flex items-center justify-center">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-bold tracking-tight text-white">MAYA</span>
          </Link>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm mb-1",
              location === "/profile"
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-secondary flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="h-7 w-7 overflow-hidden rounded-md bg-white flex items-center justify-center">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-bold text-white text-sm">MAYA</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-300 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.name} item={item} onClick={() => setMobileOpen(false)} />
          ))}
        </div>

        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-gray-400 px-3 py-1 mb-1 truncate">{user.email}</div>
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm mb-1",
              location === "/profile"
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>
          <button
            onClick={() => { setMobileOpen(false); handleLogout(); }}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="h-16 bg-secondary text-white border-b border-white/10 flex items-center justify-between px-4 md:hidden flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1 text-gray-300 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/dashboard" className="font-bold text-white text-sm">
            MAYA LOGISTICS
          </Link>
          <Link href="/profile" className="p-1 text-gray-300 hover:text-white">
            <UserIcon className="h-5 w-5" />
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>

      <WhatsAppButton />
      <ChatBot onOpenInquiry={() => setLocation("/inquiry")} />

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
