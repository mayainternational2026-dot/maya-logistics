import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Ship, Truck, Calculator as CalcIcon, MessageCircle, Phone, Info } from "lucide-react";

const FREIGHT_TYPES = [
  {
    id: "air",
    label: "Air Freight",
    icon: Plane,
    color: "bg-blue-600",
    description: "Fastest option — ideal for urgent or high-value cargo",
    via: "TIA (Tribhuvan International Airport)",
  },
  {
    id: "sea",
    label: "Sea Freight",
    icon: Ship,
    color: "bg-teal-600",
    description: "Most economical for heavy or bulk shipments",
    via: "Kolkata / Haldia / Mundra port via India",
  },
  {
    id: "road",
    label: "Road Freight",
    icon: Truck,
    color: "bg-orange-600",
    description: "Best for regional destinations — India, China, Bangladesh",
    via: "Birgunj / Banbasa border crossing",
  },
];

const NEPAL_ORIGINS = [
  "Kathmandu",
  "Lalitpur (Patan)",
  "Bhaktapur",
  "Pokhara",
  "Biratnagar",
  "Birgunj",
  "Butwal",
  "Dharan",
  "Dhangadhi",
  "Hetauda",
  "Janakpur",
  "Nepalgunj",
  "Bharatpur (Chitwan)",
  "Itahari",
  "Damak",
  "Tulsipur",
  "Ghorahi",
  "Inaruwa",
  "Other location in Nepal",
];

const DESTINATIONS = ["India", "China"];

export default function Calculator() {
  const [freightType, setFreightType] = useState("air");
  const [weight, setWeight] = useState("");
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selected = FREIGHT_TYPES.find((f) => f.id === freightType)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !weight) return;
    setSubmitted(true);
  };

  const handleWhatsApp = () => {
    const msg = `Hi Maya Logistics, I'd like a freight quote:

📦 Freight Type: ${selected.label}
📍 Origin: ${origin}, Nepal
🌍 Destination: ${destination}
⚖️ Weight: ${weight} kg

Please confirm pricing and transit time. Thank you.`;
    window.open(`https://wa.me/9779769686908?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const resetForm = () => {
    setSubmitted(false);
    setWeight("");
    setDestination("");
    setOrigin("");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-secondary text-white py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-4">
              <CalcIcon className="h-4 w-4" />
              <span>Get a Freight Quote</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Freight Quote Request</h1>
            <p className="text-white/70">
              Tell us your shipment details and we'll get back with a confirmed price — usually within the hour on WhatsApp.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

          {/* Freight Type */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Select Freight Type</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FREIGHT_TYPES.map((ft) => (
                <button
                  key={ft.id}
                  onClick={() => { setFreightType(ft.id); setSubmitted(false); }}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    freightType === ft.id
                      ? "border-secondary bg-secondary/5 shadow"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className={`inline-flex p-2 rounded-lg ${ft.color} text-white mb-2`}>
                    <ft.icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-sm text-gray-900">{ft.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ft.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Transit via badge */}
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-secondary" />
            {selected.label} routes via: <span className="font-medium text-gray-600">{selected.via}</span>
          </p>

          {/* Form */}
          {!submitted ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <selected.icon className="h-5 w-5 text-secondary" />
                  Shipment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Origin */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Origin <span className="text-gray-400 font-normal">(within Nepal)</span>
                      </label>
                      <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                        required
                      >
                        <option value="">— Select city / district —</option>
                        {NEPAL_ORIGINS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    {/* Destination */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destination Country
                      </label>
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                        required
                      >
                        <option value="">— Select country —</option>
                        {DESTINATIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approximate Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Enter weight in kg"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-white h-11">
                    <CalcIcon className="h-4 w-4 mr-2" />
                    Get Quote Details
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* Result — no fake price, just details + CTA */
            <Card className="border-2 border-secondary/30 bg-secondary/5">
              <CardContent className="pt-6 pb-5 space-y-5">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-secondary text-white mb-3">
                    <selected.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary">Your Shipment Summary</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Freight Type",    value: selected.label },
                    { label: "Origin",          value: `${origin}, Nepal` },
                    { label: "Destination",     value: destination },
                    { label: "Weight",          value: `${weight} kg` },
                    { label: "Pricing",         value: "Confirmed by team" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
                  Pricing for {selected.label} depends on actual dimensions (volumetric weight), cargo type, packaging, and customs duties. Our team will confirm the exact cost.
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleWhatsApp}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-3 rounded-lg transition-colors text-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Send to WhatsApp — Get Confirmed Price
                  </button>
                  <a
                    href="tel:+97714527999"
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Call Us Now
                  </a>
                </div>

                <button onClick={resetForm} className="w-full text-center text-sm text-gray-400 hover:text-secondary transition-colors">
                  ← Start a new calculation
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <WhatsAppButton />
      <ChatBot />
    </>
  );
}
