import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/use-auth";
import { LayoutDashboard, Package, Users, Activity, User as UserIcon, LogOut, Map } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const logout = useLogout();

  if (!user) return <>{children}</>;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/");
        window.location.reload();
      }
    });
  };

  const isAdmin = user.role === "admin";
  const isStaff = user.role === "staff";
  const isInternal = isAdmin || isStaff;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Shipments", href: "/shipments", icon: Package, show: true },
    { name: "Users", href: "/admin/users", icon: Users, show: isAdmin },
    { name: "Staff Activity", href: "/admin/staff-activity", icon: Activity, show: isAdmin },
    { name: "Track", href: "/track", icon: Map, show: true },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-secondary-foreground border-r border-secondary-border hidden md:flex flex-col flex-shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-secondary-border bg-secondary">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-md bg-white flex items-center justify-center">
               <img src={`${import.meta.env.BASE_URL}maya-logo.jpeg`} alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-bold tracking-tight text-white">MAYA</span>
          </Link>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm",
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:bg-secondary-foreground/10 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-secondary-border">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm mb-1",
              location === "/profile"
                ? "bg-primary text-white" 
                : "text-gray-300 hover:bg-secondary-foreground/10 hover:text-white"
            )}
          >
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm text-gray-300 hover:bg-secondary-foreground/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:hidden">
          <Link href="/" className="font-bold text-lg text-secondary">MAYA</Link>
          <Link href="/dashboard" className="text-sm font-medium">Dashboard</Link>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
