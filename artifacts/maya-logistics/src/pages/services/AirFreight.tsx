import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Button } from "@/components/ui/button";
import { Plane, Clock, Shield, Globe, Package, CheckCircle, Phone } from "lucide-react";
import { useLocation } from "wouter";

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Air Freight",
  "name": "Air Freight Nepal — Maya Import Export Logistic",
  "provider": {
    "@type": "Organization",
    "name": "Maya Import Export Logistic",
    "url": "https://www.mayaimportexport.com"
  },
  "areaServed": { "@type": "Country", "name": "Nepal" },
  "description": "Express international air cargo services from Kathmandu (TIA) to worldwide destinations. Fast, secure, and reliable air freight forwarding in Nepal.",
  "url": "https://www.mayaimportexport.com/services/air-freight"
};

export default function AirFreight() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead
        title="Air Freight Nepal — Express Air Cargo from Kathmandu"
        description="Fast international air cargo from Kathmandu (TIA). Express delivery to Asia, Europe, USA & Middle East. Reliable air freight forwarding by Maya Import Export Logistic."
        keywords="air freight Nepal, air cargo Kathmandu, express cargo Nepal, international air shipping Nepal, TIA cargo, air freight forwarding Nepal"
        canonical="/services/air-freight"
        schema={schema}
      />
      <Navbar />

      {/* Hero */}
      <section className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/20 mb-6">
            <img src="/air-freight.png" alt="Air freight Nepal" className="h-16 w-16 object-contain" loading="lazy" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Air Freight Nepal</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Express international air cargo from Tribhuvan International Airport (TIA), Kathmandu to destinations worldwide.
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

      {/* Why Air Freight */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-secondary text-center mb-4">Why Choose Air Freight from Nepal?</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Air cargo is the fastest way to ship goods internationally from Nepal. Ideal for time-sensitive shipments, high-value goods, and perishables.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: "Fastest Transit", desc: "1–5 day delivery to most global destinations from Kathmandu." },
              { icon: Shield, title: "Secure Handling", desc: "Airport-level security and insurance options for all cargo." },
              { icon: Globe, title: "Global Reach", desc: "Partnerships with major airlines covering 150+ countries." },
              { icon: Package, title: "All Cargo Types", desc: "Documents, general cargo, dangerous goods (DG), and perishables." },
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

      {/* Services List */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-secondary mb-8 text-center">Our Air Freight Services in Nepal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Express air cargo from Kathmandu (TIA)",
              "Door-to-airport & airport-to-door service",
              "Full charter and part-charter options",
              "Consolidation (LCL) air shipments",
              "Dangerous goods (IATA-certified) handling",
              "Perishable & pharmaceutical cargo",
              "Air export documentation & customs",
              "Cargo insurance & tracking",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Ready to Ship by Air from Nepal?</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">Contact Maya Import Export Logistic for a competitive air freight quote from Kathmandu.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inquiry"><Button size="lg" className="bg-primary hover:bg-primary/90">Submit Inquiry</Button></Link>
            <Link href="/track"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Track Shipment</Button></Link>
          </div>
        </div>
      </section>

      <footer className="bg-secondary text-gray-500 py-6 text-center text-sm border-t border-gray-800">
        <Link href="/" className="hover:text-primary transition-colors">← Back to Home</Link>
        {" · "}
        <span>&copy; {new Date().getFullYear()} Maya Import Export Logistic</span>
      </footer>

      <WhatsAppButton />
      <ChatBot onOpenInquiry={() => setLocation("/inquiry")} />
    </div>
  );
}
