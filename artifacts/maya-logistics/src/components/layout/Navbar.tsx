import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Plane, Ship, Truck, Package, Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useLogout } from "@workspace/api-client-react";

export function Navbar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
        window.location.reload();
      }
    });
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Track Shipment", href: "/track" },
    { name: "Get a Quote", href: "/inquiry" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-md flex items-center justify-center bg-primary">
               <img src={`${import.meta.env.BASE_URL}maya-logo.jpeg`} alt="Maya Logistics Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-bold text-xl tracking-tight text-secondary">
              MAYA <span className="text-primary">LOGISTICS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l border-gray-200 pl-8">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-gray-500">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setLocation("/login")}>
                    Log In
                  </Button>
                  <Button onClick={() => setLocation("/register")} className="bg-primary hover:bg-primary/90 text-white">
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Nav Toggle */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block text-base font-medium text-gray-800 hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="h-px bg-gray-100 my-4" />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block text-base font-medium text-gray-800 hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left text-base font-medium text-destructive hover:text-destructive/80"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-3 pt-2">
                <Button variant="outline" className="w-full justify-center" onClick={() => { setLocation("/login"); setIsOpen(false); }}>
                  Log In
                </Button>
                <Button className="w-full justify-center bg-primary hover:bg-primary/90" onClick={() => { setLocation("/register"); setIsOpen(false); }}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
