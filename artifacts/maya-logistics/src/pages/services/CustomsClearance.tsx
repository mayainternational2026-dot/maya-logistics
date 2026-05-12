import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, Clock, Users, CheckCircle, Phone } from "lucide-react";
import { useLocation } from "wouter";

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Customs Clearance",
  "name": "Customs Clearance Nepal — Maya Import Export Logistic",
  "provider": {
    "@type": "Organization",
    "name": "Maya Import Export Logistic",
    "url": "https://www.mayaimportexport.com"
  },
  "areaServed": { "@type": "Country", "name": "Nepal" },
  "description": "Expert customs clearance and documentation services in Nepal. Import/export compliance, duty assessment, and smooth customs processing at all Nepal border points.",
  "url": "https://www.mayaimportexport.com/services/customs-clearance"
};

export default function CustomsClearance() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead
        title="Customs Clearance Nepal — Import & Export Documentation Kathmandu"
        description="Expert customs clearance services in Nepal. Import/export documentation, duty assessment & compliance for all cargo types at TIA, Birgunj, Biratnagar & all Nepal customs points."
        keywords="customs clearance Nepal, customs broker Nepal, import customs Nepal, export customs Nepal, customs documentation Nepal, customs duty Nepal, TIA customs clearance, Birgunj customs"
        canonical="/services/customs-clearance"
        schema={schema}
      />
      <Navbar />

      <section className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/20 mb-6">
            <img src="/customs-clearance.png" alt="Customs clearance Nepal" className="h-16 w-16 object-contain" loading="lazy" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Customs Clearance Nepal</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Expert customs brokerage and documentation services for hassle-free import and export in Nepal.
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
          <h2 className="text-3xl font-bold text-secondary text-center mb-4">Smooth Customs Processing in Nepal</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Navigating Nepal customs regulations can be complex. Our experienced team handles all documentation and compliance, ensuring your cargo clears without delays.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileText, title: "Documentation", desc: "Full preparation of customs declarations, invoices, and packing lists." },
              { icon: Clock, title: "Fast Processing", desc: "Relationships with customs officials for expedited clearance." },
              { icon: ShieldCheck, title: "Compliance", desc: "Full compliance with Nepal Customs Act and ASYCUDA World system." },
              { icon: Users, title: "Expert Team", desc: "Licensed customs brokers with 10+ years Nepal experience." },
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
          <h2 className="text-2xl font-bold text-secondary mb-8 text-center">Our Customs Clearance Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Import & export customs clearance",
              "TIA (Tribhuvan Airport) customs",
              "Birgunj, Biratnagar & all ICP points",
              "ASYCUDA World filing & submission",
              "HS code classification & duty assessment",
              "Trade permit & license assistance",
              "Bonded warehouse & transit cargo",
              "Re-export & drawback processing",
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
          <h2 className="text-2xl font-bold mb-4">Need Customs Clearance in Nepal?</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">Talk to our licensed customs brokers in Kathmandu today.</p>
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
