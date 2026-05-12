import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Button } from "@/components/ui/button";
import { Anchor, DollarSign, Package, Globe, CheckCircle, Phone } from "lucide-react";
import { useLocation } from "wouter";

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Sea Freight",
  "name": "Sea Freight Nepal — Maya Import Export Logistic",
  "provider": {
    "@type": "Organization",
    "name": "Maya Import Export Logistic",
    "url": "https://www.mayaimportexport.com"
  },
  "areaServed": { "@type": "Country", "name": "Nepal" },
  "description": "Cost-effective FCL and LCL sea freight services from Nepal routing via Indian ports. Container shipping worldwide.",
  "url": "https://www.mayaimportexport.com/services/sea-freight"
};

export default function SeaFreight() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead
        title="Sea Freight Nepal — Container Shipping from Kathmandu"
        description="Affordable FCL & LCL sea freight from Nepal via Kolkata, Haldia & Mundra ports. Reliable container shipping worldwide by Maya Import Export Logistic, Kathmandu."
        keywords="sea freight Nepal, sea cargo Nepal, container shipping Nepal, FCL LCL Nepal, ocean freight Nepal, sea freight Kathmandu, shipping from Nepal"
        canonical="/services/sea-freight"
        schema={schema}
      />
      <Navbar />

      <section className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/20 mb-6">
            <img src="/sea-freight.png" alt="Sea freight Nepal" className="h-16 w-16 object-contain" loading="lazy" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Sea Freight Nepal</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Cost-effective container shipping from Nepal via major Indian seaports to destinations worldwide.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inquiry">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">Get a Free Quote</Button>
            </Link>
            <a href="tel:014527999">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
                <Phone className="h-4 w-4" /> 014527999
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-secondary text-center mb-4">Affordable Sea Freight from Nepal</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            As a landlocked country, Nepal's sea freight routes via Kolkata, Haldia, and Mundra ports. We manage end-to-end container logistics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: DollarSign, title: "Lowest Cost", desc: "Sea freight is the most cost-effective option for large, heavy shipments." },
              { icon: Package, title: "FCL & LCL", desc: "Full container load or less-than-container load — we handle both." },
              { icon: Globe, title: "Worldwide Ports", desc: "Connections to major ports across Asia, Europe, Americas, and Africa." },
              { icon: Anchor, title: "Port-to-Door", desc: "Complete inland haulage from Kathmandu to Indian seaports." },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-secondary mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-secondary mb-8 text-center">Sea Freight Services We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "FCL (Full Container Load) shipping",
              "LCL (Less than Container Load) consolidation",
              "Nepal to Kolkata / Haldia / Mundra transit",
              "Multi-modal freight (road + sea)",
              "Hazardous goods sea cargo",
              "Ro-Ro shipping for vehicles & machinery",
              "Bill of lading & sea documentation",
              "Cargo tracking & insurance",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Get Your Sea Freight Quote Today</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">Contact us for competitive ocean freight rates from Nepal to any worldwide destination.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inquiry"><Button size="lg" className="bg-primary hover:bg-primary/90">Submit Inquiry</Button></Link>
            <Link href="/track"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Track Shipment</Button></Link>
          </div>
        </div>
      </section>

      <footer className="bg-secondary text-gray-500 py-6 text-center text-sm border-t border-gray-800">
        <Link href="/" className="hover:text-primary transition-colors">← Back to Home</Link>
        {" · "}<span>&copy; {new Date().getFullYear()} Maya Import Export Logistic</span>
      </footer>
      <WhatsAppButton />
      <ChatBot onOpenInquiry={() => setLocation("/inquiry")} />
    </div>
  );
}
