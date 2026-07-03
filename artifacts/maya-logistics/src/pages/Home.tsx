import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plane, Ship, Truck, Package, Search, Phone, Mail, MapPin as MapPinIcon, UserPlus, LogIn, ChevronDown, ChevronUp } from "lucide-react";
import { useSendContactMessage } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { logoUrl } from "@/lib/assets";
import { ChatBot } from "@/components/ui/ChatBot";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { RouteAnimation } from "@/components/home/RouteAnimation";
import { ProofSection } from "@/components/home/ProofSection";

const FAQ_ITEMS = [
  { q: "What logistics services does Maya Import Export offer in Nepal?", a: "We offer air freight, sea freight, road freight, and customs clearance services from Kathmandu, Nepal. We handle door-to-door, port-to-door, and airport-to-airport shipments worldwide." },
  { q: "How do I track my cargo shipment in Nepal?", a: "Visit our tracking page at mayaimportexport.com/track and enter your Tracking ID. You'll see real-time status updates from pickup through delivery." },
  { q: "What documents are needed for customs clearance in Nepal?", a: "Typically you need a commercial invoice, packing list, bill of lading or airway bill, certificate of origin, and any applicable permits. Our team handles all customs documentation for you." },
  { q: "How long does air freight from Nepal take?", a: "Air cargo from Kathmandu (TIA) reaches most Asian destinations in 1–3 days, Europe and the Middle East in 2–4 days, and the USA or Americas in 3–5 days." },
  { q: "Do you handle sea freight from landlocked Nepal?", a: "Yes. We coordinate multi-modal transport from Kathmandu to Indian seaports (Kolkata, Haldia, Mundra) for container shipping worldwide. FCL and LCL options available." },
  { q: "How can I contact Maya Import Export Logistic in Kathmandu?", a: "Call us at 014527999 or +977 9744732123, email mayaimportexportinternational@gmail.com, or WhatsApp us directly. Our office is at Anandamaya Marg, Dhumbarahi, Kathmandu." },
];

const homeSchema = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  }
];

const SERVICES = [
  { title: "Air Freight", icon: Plane, desc: "Express global delivery via major international airlines from TIA.", img: "air-freight.png", href: "/services/air-freight", alt: "Air freight and air cargo services Nepal" },
  { title: "Sea Freight", icon: Ship, desc: "Cost-effective container shipping routing through major transit ports.", img: "sea-freight.png", href: "/services/sea-freight", alt: "Sea freight and container shipping from Nepal" },
  { title: "Road Freight", icon: Truck, desc: "Reliable cross-border trucking and domestic distribution network.", img: "road-freight.png", href: "/services/road-freight", alt: "Road freight and cross-border trucking Nepal" },
  { title: "Customs Clearance", icon: Package, desc: "Expert handling of export/import documentation and compliance.", img: "customs-clearance.png", href: "/services/customs-clearance", alt: "Customs clearance and documentation services Nepal" },
];

const FLOATING_ICONS = [
  { icon: Plane,   x: "8%",   y: "20%", delay: 0,    size: "h-8 w-8",  rotate: -30 },
  { icon: Ship,    x: "88%",  y: "15%", delay: 0.8,  size: "h-7 w-7",  rotate: 0 },
  { icon: Truck,   x: "5%",   y: "70%", delay: 1.4,  size: "h-6 w-6",  rotate: 0 },
  { icon: Package, x: "90%",  y: "70%", delay: 0.4,  size: "h-6 w-6",  rotate: 15 },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) setLocation(`/track/${trackingId.trim()}`);
  };

  const contactMutation = useSendContactMessage();
  const { toast } = useToast();

  const handleContact = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    contactMutation.mutate(
      { data: { name: fd.get("name") as string, email: fd.get("email") as string, phone: fd.get("phone") as string, message: fd.get("message") as string } },
      {
        onSuccess: () => { toast({ title: "Message Sent", description: "We will get back to you soon." }); (e.target as HTMLFormElement).reset(); },
        onError:   () => { toast({ title: "Error", description: "Failed to send message.", variant: "destructive" }); },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
      <SEOHead
        title="Logistics Company in Nepal — Freight Forwarding &amp; Cargo Kathmandu"
        description="Nepal's trusted cargo company. Air freight, sea freight, road freight &amp; customs clearance from Kathmandu. Track your shipment online. Call 014527999."
        keywords="logistics company in Nepal, customs clearance Nepal, cargo service Kathmandu, freight forwarding Nepal, air cargo Nepal, sea freight Nepal, cargo company Kathmandu"
        canonical="/"
        schema={homeSchema}
      />
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative h-[90vh] min-h-[640px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={`${import.meta.env.BASE_URL}hero-main.png`} alt="Maya Import Export Logistic — freight forwarding company in Nepal, Kathmandu" className="w-full h-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0 bg-secondary/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent" />
        </div>

        {/* Floating transport icons */}
        {FLOATING_ICONS.map((fi, i) => (
          <motion.div
            key={i}
            className="absolute z-10 text-white/20 hidden md:block"
            style={{ left: fi.x, top: fi.y }}
            animate={{ y: [0, -16, 0], rotate: [fi.rotate, fi.rotate + 5, fi.rotate] }}
            transition={{ duration: 4 + i, delay: fi.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <fi.icon className={fi.size} />
          </motion.div>
        ))}

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center justify-center p-4 bg-white rounded-xl shadow-2xl shadow-black/20"
          >
            <img src={logoUrl} alt="Maya Logistics" className="h-24 w-auto" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg"
          >
            From Nepal to the <span className="text-primary">World</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto drop-shadow-md"
          >
            Global freight forwarding by air, sea, and road. Dependable, fast, and secure logistics from Kathmandu.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            onSubmit={handleTrack}
            className="max-w-xl mx-auto flex gap-2 bg-white p-2 rounded-lg shadow-xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="Enter your Tracking ID..." className="w-full pl-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-lg text-black bg-transparent" />
            </div>
            <Button type="submit" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-white shadow-md">Track</Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
          >
            {!user ? (
              <>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 px-8 h-13 text-base font-bold shadow-lg shadow-primary/30 w-full sm:w-auto">
                      <UserPlus className="h-5 w-5" /> Create a Free Account
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white gap-2 px-8 h-13 text-base w-full sm:w-auto backdrop-blur-sm">
                      <LogIn className="h-5 w-5" /> Sign In
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-sm text-gray-300">Register once to track all your shipments, view invoices, and manage your cargo.</p>
              </>
            ) : (
              <div className="mt-6">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-secondary hover:bg-gray-100 gap-2 px-8 font-bold shadow-lg">Go to Dashboard</Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Our Core Services</h2>
            <div className="w-24 h-1 bg-primary mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={service.href}>
                  <div className="group border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden h-full">
                    <div className="h-44 overflow-hidden bg-white flex items-center justify-center">
                      <img src={`${import.meta.env.BASE_URL}${service.img}`} alt={service.alt} loading="lazy" className="h-full w-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                          <service.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-secondary">{service.title}</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed text-sm">{service.desc}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROUTE ANIMATION ── */}
      <RouteAnimation />

      {/* ── BANNER ── */}
      <section className="relative overflow-hidden h-80 md:h-96">
        <img src={`${import.meta.env.BASE_URL}logistics-hero.png`} alt="Maya Logistics — Nepal to the World" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center">
          <motion.div
            className="text-center text-white px-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg mb-3">Nepal to the World</h2>
            <p className="text-lg md:text-xl text-gray-200 drop-shadow-md max-w-xl mx-auto">Air, sea, and road freight — handled with care from Kathmandu.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/calculator">
                <Button className="bg-primary hover:bg-primary/90 text-white px-8">Get Instant Quote</Button>
              </Link>
              <Link href="/testimonials">
                <Button variant="outline" className="border-white text-white hover:bg-white/20 px-8">Read Reviews</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CUSTOMER PROOF ── */}
      <ProofSection />

      {/* ── CONTACT & MAP ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold text-secondary mb-8">Get in Touch</h2>
              <p className="text-gray-600 mb-8 text-lg">Need a quote for your shipment? Have questions about customs? Our team is ready to assist you.</p>
              <div className="space-y-6 mb-12">
                {[
                  { Icon: MapPinIcon, title: "Head Office", lines: ["Anandamaya Marg, Dhumbarahi", "Kathmandu, Nepal"] },
                  { Icon: Phone, title: "Phone & WhatsApp", lines: ["014527999", "+977 9744732123"] },
                  { Icon: Mail, title: "Email", lines: ["mayaimportexportinternational@gmail.com"] },
                ].map(({ Icon, title, lines }, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <div className="mt-1 bg-white p-3 rounded-full shadow-sm text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-secondary">{title}</h4>
                      {lines.map((l, j) => <p key={j} className="text-gray-600">{l}</p>)}
                    </div>
                  </motion.div>
                ))}

                {/* Social Media Links */}
                <motion.div
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="mt-1 bg-white p-3 rounded-full shadow-sm text-primary">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary">Follow Us</h4>
                    <a href="https://www.instagram.com/mayainternational2026" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline block text-sm">
                      Instagram: @mayainternational2026
                    </a>
                    <a href="https://www.facebook.com/profile.php?id=61589211686064" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block text-sm">
                      Facebook: Maya Import Export
                    </a>
                  </div>
                </motion.div>
              </div>

              <form onSubmit={handleContact} autoComplete="off" noValidate className="space-y-4 bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-secondary mb-4">Send a Message</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium">Name <span className="text-red-500">*</span></label><Input name="name" required autoComplete="off" placeholder="John Doe" className="bg-white" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Email <span className="text-red-500">*</span></label><Input name="email" type="email" required autoComplete="off" placeholder="john@example.com" className="bg-white" /></div>
                </div>
                <div className="space-y-2"><label className="text-sm font-medium">Phone</label><Input name="phone" autoComplete="off" placeholder="+977..." className="bg-white" /></div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message <span className="text-red-500">*</span></label>
                  <textarea name="message" required placeholder="How can we help you?" className="w-full min-h-[120px] rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
                <Button type="submit" disabled={contactMutation.isPending} className="w-full bg-secondary hover:bg-secondary/90 text-white">
                  {contactMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>

            <div className="h-[600px] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3531.815777174665!2d85.34215291453856!3d27.723049982785237!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb196a60e0a58d%3A0x8e8334463cf3e387!2sDhumbarahi%2C%20Kathmandu%2044600%2C%20Nepal!5e0!3m2!1sen!2sus!4v1629891234567!5m2!1sen!2sus" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Common questions about logistics, freight forwarding &amp; customs clearance in Nepal.</p>
            <div className="w-24 h-1 bg-primary mx-auto mt-4" />
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-gray-50 transition-colors" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                  <span className="font-semibold text-secondary text-sm md:text-base">{item.q}</span>
                  {openFaq === i ? <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="p-5 bg-white text-gray-600 text-sm leading-relaxed border-t border-gray-100">{item.a}</div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-gray-500 mb-4">Have more questions? We're here to help.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/inquiry"><Button className="bg-primary hover:bg-primary/90 text-white">Send an Inquiry</Button></Link>
              <Link href="/calculator"><Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/5">Get an Instant Quote</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-secondary text-gray-300 py-12 border-t border-secondary-border">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 flex justify-center">
            <img src={logoUrl} alt="Maya Import Export Logistic — cargo company Kathmandu Nepal" className="h-16 w-auto opacity-90" loading="lazy" />
          </div>
          <p className="mb-4 text-sm max-w-md mx-auto">
            Your trusted logistics partner connecting Nepal with the global market through reliable air, sea, and road freight services.
          </p>
          <p className="text-sm text-gray-400 mb-3">
            <a href="https://www.mayaimportexport.com" className="hover:text-primary transition-colors">www.mayaimportexport.com</a>
            {" · "}014527999{" · "}+977 9744732123
          </p>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <a
              href="https://www.instagram.com/mayainternational2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61589211686064"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
          </div>

          <p className="text-xs text-gray-500 mb-6">&copy; {new Date().getFullYear()} Maya Import Export Logistic. All rights reserved.</p>

          <div className="pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-500 mb-4 tracking-wide uppercase font-medium">Developed &amp; Designed by doko digital</p>
            <a href="https://www.facebook.com/share/16dd3aJ8BF/" target="_blank" rel="noopener noreferrer" className="inline-flex flex-col items-center gap-3 group">
              <img src={`${import.meta.env.BASE_URL}doko-digital-logo.png`} alt="DokoDigital Tech" className="h-24 w-24 rounded-full object-cover ring-2 ring-blue-500/40 group-hover:ring-blue-400 group-hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-900/30" />
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400 group-hover:text-blue-300 transition-colors tracking-wide">DokoDigital Tech</div>
                <div className="text-sm text-gray-400 mt-0.5">📞 9744732123</div>
              </div>
            </a>
          </div>
        </div>
      </footer>

      <WhatsAppButton />
      <ChatBot onOpenInquiry={() => setLocation("/inquiry")} />
    </div>
  );
}
