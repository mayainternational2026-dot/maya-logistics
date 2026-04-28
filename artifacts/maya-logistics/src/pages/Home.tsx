import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plane, Ship, Truck, Package, MapPin, Search, ArrowRight, Phone, Mail, MapPin as MapPinIcon } from "lucide-react";
import { useSendContactMessage } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";

export default function Home() {
  const [, setLocation] = useLocation();
  const [trackingId, setTrackingId] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      setLocation(`/track/${trackingId.trim()}`);
    }
  };

  const contactMutation = useSendContactMessage();
  const { toast } = useToast();
  
  const handleContact = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    contactMutation.mutate(
      {
        data: {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: formData.get("phone") as string,
          message: formData.get("message") as string,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Message Sent", description: "We will get back to you soon." });
          (e.target as HTMLFormElement).reset();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 flex">
          <div className="w-1/3 h-full relative">
            <img src={`${import.meta.env.BASE_URL}hero-air.png`} alt="Air Freight" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-secondary/80 mix-blend-multiply"></div>
          </div>
          <div className="w-1/3 h-full relative">
            <img src={`${import.meta.env.BASE_URL}hero-sea.png`} alt="Sea Freight" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-secondary/60 mix-blend-multiply"></div>
          </div>
          <div className="w-1/3 h-full relative">
            <img src={`${import.meta.env.BASE_URL}hero-road.png`} alt="Road Freight" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-secondary/80 mix-blend-multiply"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="mb-8 inline-flex items-center justify-center p-4 bg-white rounded-xl shadow-2xl shadow-black/20">
             <img src={`${import.meta.env.BASE_URL}maya-logo.jpeg`} alt="Maya Logistics" className="h-24 w-auto" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
            From Nepal to the <span className="text-primary">World</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto drop-shadow-md">
            Global freight forwarding by air, sea, and road. Dependable, fast, and secure logistics from Kathmandu.
          </p>

          <form onSubmit={handleTrack} className="max-w-xl mx-auto flex gap-2 bg-white p-2 rounded-lg shadow-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter your Tracking ID..."
                className="w-full pl-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-lg text-black bg-transparent"
              />
            </div>
            <Button type="submit" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-white shadow-md">
              Track
            </Button>
          </form>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Our Core Services</h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Air Freight", icon: Plane, desc: "Express global delivery via major international airlines from TIA." },
              { title: "Sea Freight", icon: Ship, desc: "Cost-effective container shipping routing through major transit ports." },
              { title: "Road Freight", icon: Truck, desc: "Reliable cross-border trucking and domestic distribution network." },
              { title: "Customs Clearance", icon: Package, desc: "Expert handling of export/import documentation and compliance." },
            ].map((service, i) => (
              <div key={i} className="group p-8 border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <service.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Location */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold text-secondary mb-8">Get in Touch</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Need a quote for your shipment? Have questions about customs? Our team is ready to assist you.
              </p>

              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-3 rounded-full shadow-sm text-primary">
                    <MapPinIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary">Head Office</h4>
                    <p className="text-gray-600">Anandamaya Marg, Dhumbarahi<br/>Kathmandu, Nepal</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-3 rounded-full shadow-sm text-primary">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary">Phone & WhatsApp</h4>
                    <p className="text-gray-600">+977 9769686908</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-3 rounded-full shadow-sm text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary">Email</h4>
                    <p className="text-gray-600">mayaimportexportinternational@gmail.com</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleContact} className="space-y-4 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-secondary mb-4">Send a Message</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input name="name" required placeholder="John Doe" className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input name="email" type="email" required placeholder="john@example.com" className="bg-gray-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input name="phone" placeholder="+977..." className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea 
                    name="message" 
                    required 
                    placeholder="How can we help you?" 
                    className="w-full min-h-[120px] rounded-md border border-input bg-gray-50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  ></textarea>
                </div>
                <Button type="submit" disabled={contactMutation.isPending} className="w-full bg-secondary hover:bg-secondary/90 text-white">
                  {contactMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>

            <div className="h-[600px] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3531.815777174665!2d85.34215291453856!3d27.723049982785237!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb196a60e0a58d%3A0x8e8334463cf3e387!2sDhumbarahi%2C%20Kathmandu%2044600%2C%20Nepal!5e0!3m2!1sen!2sus!4v1629891234567!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-gray-300 py-12 border-t border-secondary-border">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 flex justify-center">
            <img src={`${import.meta.env.BASE_URL}maya-logo.jpeg`} alt="Maya Logistics" className="h-16 w-auto opacity-90" />
          </div>
          <p className="mb-4 text-sm max-w-md mx-auto">
            Your trusted logistics partner connecting Nepal with the global market through reliable air, sea, and road freight services.
          </p>
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Maya Import Export Logistic. All rights reserved.
          </p>
        </div>
      </footer>

      <WhatsAppButton />
      <ChatBot onOpenInquiry={() => setLocation("/inquiry")} />
    </div>
  );
}
