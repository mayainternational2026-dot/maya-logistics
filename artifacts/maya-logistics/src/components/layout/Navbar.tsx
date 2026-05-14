import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/use-auth";
import { logoUrl } from "@/lib/assets";
import { Button } from "@/components/ui/button";
import { Plane, Ship, Truck, Package, Menu, X, LogOut, User as UserIcon, Calculator, Star } from "lucide-react";
import { useState } from "react";
import { useLogout } from "@workspace/api-client-react";

export function Navbar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => { setLocation("/login"); window.location.reload(); }
    });
  };

  const navLinks = [
    { name: "Home",          href: "/" },
    { name: "Track Shipment", href: "/track" },
    { name: "Get a Quote",   href: "/inquiry" },
    { name: "Calculator",    href: "/calculator" },
    { name: "Reviews",       href: "/testimonials" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-md flex items-center justify-center bg-primary">
              <img src={logoUrl} alt="Maya Logistics Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-bold text-xl tracking-tight text-secondary">
              MAYA <span className="text-primary">LOGISTICS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${location === link.href ? "text-primary" : "text-gray-600 hover:text-primary"}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-5">
              <a
                href="https://www.instagram.com/mayainternational2026"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="p-1.5 text-gray-400 hover:text-pink-500 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61589211686064"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://www.tiktok.com/@mayaimportexport"
                target="_blank"
                rel="noopener noreferrer"
                title="TikTok"
                className="p-1.5 text-gray-400 hover:text-black transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.36 6.36 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.27 8.27 0 0 0 4.84 1.54V6.84a4.85 4.85 0 0 1-1.07-.15z"/></svg>
              </a>
            </div>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-5">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Dashboard</Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-gray-500">
                    <LogOut className="h-4 w-4" />Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setLocation("/login")}>Log In</Button>
                  <Button onClick={() => setLocation("/register")} className="bg-primary hover:bg-primary/90 text-white">Register</Button>
                </>
              )}
            </div>
          </div>

          <button className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="block text-base font-medium text-gray-800 hover:text-primary" onClick={() => setIsOpen(false)}>
                {link.name}
              </Link>
            ))}
            {/* Social in mobile */}
            <div className="flex gap-4 py-2">
              <a href="https://www.instagram.com/mayainternational2026" target="_blank" rel="noopener noreferrer" className="text-pink-500 text-sm font-medium">📸 Instagram</a>
              <a href="https://www.facebook.com/profile.php?id=61589211686064" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-medium">👍 Facebook</a>
              <a href="https://www.tiktok.com/@mayaimportexport" target="_blank" rel="noopener noreferrer" className="text-gray-900 text-sm font-medium">🎵 TikTok</a>
            </div>
            <div className="h-px bg-gray-100 my-4" />
            {user ? (
              <>
                <Link href="/dashboard" className="block text-base font-medium text-gray-800 hover:text-primary" onClick={() => setIsOpen(false)}>Dashboard</Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="block w-full text-left text-base font-medium text-destructive hover:text-destructive/80">Logout</button>
              </>
            ) : (
              <div className="space-y-3 pt-2">
                <Button variant="outline" className="w-full justify-center" onClick={() => { setLocation("/login"); setIsOpen(false); }}>Log In</Button>
                <Button className="w-full justify-center bg-primary hover:bg-primary/90" onClick={() => { setLocation("/register"); setIsOpen(false); }}>Register</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
