import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Button } from "@/components/ui/button";
import { Truck, Map, Clock, Shield, CheckCircle, Phone } from "lucide-react";
import { useLocation } from "wouter";

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Road Freight",
  "name": "Road Freight Nepal — Maya Import Export Logistic",
  "provider": {
    "@type": "Organization",
    "name": "Maya Import Export Logistic",
    "url": "https://www.mayaimportexport.com"
  },
  "areaServed": { "@type": "Country", "name": "Nepal" },
  "description": "Reliable cross-border trucking and domestic road freight distribution across Nepal. Nepal-India-China road cargo specialists.",
  "url": "https://www.mayaimportexport.com/services/road-freight"
};

export default function RoadFreight() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead
        title="Road Freight Nepal — Cross-Border Trucking & Cargo Nepal"
        description="Reliable road freight and cross-border trucking across Nepal, India & China. Domestic distribution and inland haulage from Kathmandu by Maya Import Export Logistic."
        keywords="road freight Nepal, cross border trucking Nepal, inland cargo Nepal, Nepal India cargo, road cargo Kathmandu, domestic freight Nepal, road transport Nepal"
        canonical="/services/road-freight"
        schema={schema}
      />
      <Navbar />

      <section className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/20 mb-6">
            <img src="/road-freight.png" alt="Road freight Nepal" className="h-16 w-16 object-contain" loading="lazy" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Road Freight Nepal</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Cross-border trucking and domestic road freight distribution across Nepal, India, and beyond.
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
          <h2 className="text-3xl font-bold text-secondary text-center mb-4">Road Freight Across Nepal & Beyond</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            From domestic distribution within Nepal to cross-border trucking to India and China, we have the fleet and network to move your cargo reliably.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Map, title: "Nationwide Network", desc: "Road freight coverage across all 77 districts of Nepal." },
              { icon: Clock, title: "On-Time Delivery", desc: "Reliable schedules with real-time cargo tracking." },
              { icon: Truck, title: "Full & Part Loads", desc: "FTL (Full Truck Load) and LTL (Less Than Load) options." },
              { icon: Shield, title: "Cargo Safety", desc: "Insured transport with professional drivers and modern fleet." },
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
          <h2 className="text-2xl font-bold text-secondary mb-8 text-center">Road Freight Services in Nepal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Domestic road freight across Nepal",
              "Nepal–India cross-border trucking",
              "Nepal–China road cargo (Tatopani/Rasuwagadhi)",
              "FTL & LTL shipments",
              "Flatbed & specialized equipment haulage",
              "Cold chain & refrigerated transport",
              "Last-mile delivery across Kathmandu Valley",
              "Road transport documentation & permits",
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
          <h2 className="text-2xl font-bold mb-4">Need Road Freight in Nepal?</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">Get a road freight quote from our Kathmandu team today.</p>
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
