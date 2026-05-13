import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Star, MessageCircle, Mail, CheckCircle2, Quote, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/use-auth";
import { Link } from "wouter";

const SERVICES = ["Air Freight", "Sea Freight", "Road Freight", "Customs Clearance", "Other"];

const SERVICE_COLORS: Record<string, string> = {
  "Air Freight":        "bg-blue-100 text-blue-700",
  "Sea Freight":        "bg-teal-100 text-teal-700",
  "Road Freight":       "bg-orange-100 text-orange-700",
  "Customs Clearance":  "bg-purple-100 text-purple-700",
  "Other":              "bg-gray-100 text-gray-700",
};

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              n <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { user, isLoading } = useAuth();

  const [form, setForm] = useState({
    name: "",
    company: "",
    service: "",
    rating: 5,
    review: "",
  });
  const [formInitialised, setFormInitialised] = useState(false);
  const [sent, setSent] = useState(false);
  const [method, setMethod] = useState<"whatsapp" | "email" | null>(null);

  if (!formInitialised && user?.role === "customer") {
    setForm((f) => ({ ...f, name: user.name }));
    setFormInitialised(true);
  }

  const setField = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const isValid = form.name.trim() && form.service && form.review.trim().length >= 10;

  const buildMessage = () =>
    `⭐ Verified Customer Review — Maya Import Export\n\nName: ${form.name}${form.company ? `\nCompany: ${form.company}` : ""}\nEmail: ${user?.email ?? ""}\nService Used: ${form.service}\nRating: ${"★".repeat(form.rating)}${"☆".repeat(5 - form.rating)} (${form.rating}/5)\n\nReview:\n${form.review}`;

  const handleWhatsApp = () => {
    setMethod("whatsapp");
    setSent(true);
    window.open(`https://wa.me/9779769686908?text=${encodeURIComponent(buildMessage())}`, "_blank");
  };

  const handleEmail = () => {
    setMethod("email");
    setSent(true);
    const subject = encodeURIComponent(`Verified Review: ${form.name} — ${form.service} (${form.rating}/5 stars)`);
    const body = encodeURIComponent(buildMessage());
    window.open(`mailto:mayaimportexportinternational@gmail.com?subject=${subject}&body=${body}`);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-secondary text-white py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-4">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>Client Reviews</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">What Our Clients Say</h1>
            <p className="text-white/70 text-base max-w-xl mx-auto">
              Reviews on this page come exclusively from verified customers who have shipped with Maya. Your honest experience helps other Nepali businesses find a reliable logistics partner.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">

          {/* Social Proof Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://www.facebook.com/profile.php?id=61589211686064"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Facebook Reviews</p>
                <p className="text-sm text-blue-600">View &amp; leave reviews on our page →</p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/mayainternational2026"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Instagram</p>
                <p className="text-sm text-pink-500">@mayainternational2026 →</p>
              </div>
            </a>
          </div>

          {/* Review Form — gated by verified customer login */}
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Checking your account…</div>
          ) : !user ? (
            /* Guest: not logged in */
            <Card className="border-2 border-secondary/20">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Log in to Leave a Review</h2>
                  <p className="text-gray-500 text-sm max-w-sm">
                    Reviews are reserved for verified customers who have shipped with Maya. Please log in to your customer account to share your experience.
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                  <Link href="/login">
                    <Button className="bg-secondary hover:bg-secondary/90 text-white px-6">Log In</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/5 px-6">
                      Register
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-gray-400">Don't have an account? Register and book your first shipment with us.</p>
              </CardContent>
            </Card>
          ) : user.role !== "customer" ? (
            /* Staff / Admin: logged in but not a customer */
            <Card className="border-2 border-amber-200 bg-amber-50/40">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Customer Reviews Only</h2>
                  <p className="text-gray-500 text-sm max-w-sm">
                    This review form is available exclusively for verified customers. Staff and admin accounts cannot submit public reviews.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : !sent ? (
            /* Verified customer: show the form */
            <Card className="border-2 border-secondary/20">
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <Quote className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">Share Your Experience</h2>
                    <p className="text-sm text-gray-500">Help other businesses find a reliable logistics partner</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Customer
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
                  <StarPicker value={form.rating} onChange={(v) => setField("rating", v)} />
                  <p className="text-xs text-gray-400 mt-1">
                    {["", "Poor", "Below Average", "Average", "Good", "Excellent"][form.rating]}
                  </p>
                </div>

                {/* Name + Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="e.g. Ramesh Shrestha"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company / Business <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setField("company", e.target.value)}
                      placeholder="e.g. My Export Co., Kathmandu"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Service Used */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Used *</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setField("service", s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          form.service === s
                            ? "bg-secondary text-white border-secondary shadow-sm"
                            : "bg-white text-gray-600 border-gray-300 hover:border-secondary hover:text-secondary"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Review * <span className="text-gray-400 font-normal">(minimum 10 characters)</span>
                  </label>
                  <textarea
                    value={form.review}
                    onChange={(e) => setField("review", e.target.value)}
                    placeholder="Tell us about your shipment experience — what went well, how was the communication, would you recommend us?"
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.review.length} characters</p>
                </div>

                {/* Submit Options */}
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 text-center">Choose how to send your review:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={handleWhatsApp}
                      disabled={!isValid}
                      className="bg-green-600 hover:bg-green-700 text-white gap-2 h-11 w-full"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send via WhatsApp
                    </Button>
                    <Button
                      onClick={handleEmail}
                      disabled={!isValid}
                      variant="outline"
                      className="gap-2 h-11 w-full border-secondary text-secondary hover:bg-secondary/5"
                    >
                      <Mail className="h-4 w-4" />
                      Send via Email
                    </Button>
                  </div>
                  {!isValid && (
                    <p className="text-xs text-center text-gray-400">
                      Please fill in your name, service used, and a review of at least 10 characters.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Thank you */
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold text-gray-900">Thank You, {form.name}!</h2>
                <p className="text-gray-600 max-w-sm mx-auto text-sm">
                  {method === "whatsapp"
                    ? "Your review has been sent to our WhatsApp. We truly appreciate your feedback!"
                    : "Your review email has been prepared. Thank you for taking the time to share your experience!"}
                </p>
                <div className="flex justify-center gap-1 py-1">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`h-5 w-5 ${n <= form.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                  ))}
                </div>
                {form.service && (
                  <Badge className={`${SERVICE_COLORS[form.service] ?? "bg-gray-100 text-gray-700"}`}>
                    {form.service}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  onClick={() => { setSent(false); setMethod(null); setForm({ name: user?.name ?? "", company: "", service: "", rating: 5, review: "" }); }}
                  className="mt-2"
                >
                  Submit Another Review
                </Button>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <div className="text-center bg-white rounded-2xl border p-8 max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Ship with Maya?</h2>
            <p className="text-gray-500 text-sm mb-5">
              Get a free, confirmed quote for your next shipment from Nepal.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href="/inquiry"
                className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                Get Free Quote
              </a>
              <a
                href="https://wa.me/9779769686908"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>
      <WhatsAppButton />
      <ChatBot />
    </>
  );
}
