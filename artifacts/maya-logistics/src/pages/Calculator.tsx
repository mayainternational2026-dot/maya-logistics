import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Ship, Truck, Calculator as CalcIcon, Phone, MessageCircle } from "lucide-react";

const FREIGHT_TYPES = [
  {
    id: "air",
    label: "Air Freight",
    icon: Plane,
    color: "bg-blue-600",
    rateMin: 180,
    rateMax: 280,
    minWeight: 1,
    transitMin: 1,
    transitMax: 5,
    unit: "days",
    description: "Fastest option — ideal for urgent or high-value cargo",
  },
  {
    id: "sea",
    label: "Sea Freight",
    icon: Ship,
    color: "bg-teal-600",
    rateMin: 45,
    rateMax: 90,
    minWeight: 100,
    transitMin: 20,
    transitMax: 45,
    unit: "days",
    description: "Most economical for heavy or bulk shipments",
  },
  {
    id: "road",
    label: "Road Freight",
    icon: Truck,
    color: "bg-orange-600",
    rateMin: 30,
    rateMax: 65,
    minWeight: 20,
    transitMin: 3,
    transitMax: 10,
    unit: "days",
    description: "Best for regional destinations — India, China, Bangladesh",
  },
];

const ORIGINS = ["Kathmandu, Nepal", "Pokhara, Nepal", "Biratnagar, Nepal", "Birgunj, Nepal"];

const DESTINATIONS: Record<string, string[]> = {
  Asia: ["China", "India", "Japan", "South Korea", "Singapore", "UAE", "Hong Kong", "Thailand", "Malaysia"],
  Europe: ["United Kingdom", "Germany", "France", "Netherlands", "Italy", "Spain", "Switzerland"],
  Americas: ["United States", "Canada", "Australia", "New Zealand"],
  Other: ["Saudi Arabia", "Qatar", "Bahrain", "South Africa"],
};

const REGION_MULTIPLIERS: Record<string, number> = {
  "India": 0.6, "China": 0.8, "Bangladesh": 0.7, "UAE": 1.0, "Saudi Arabia": 1.0,
  "Qatar": 1.0, "Bahrain": 1.0, "Singapore": 1.0, "Thailand": 1.0, "Malaysia": 1.0,
  "Hong Kong": 1.0, "South Korea": 1.1, "Japan": 1.2,
  "United Kingdom": 1.5, "Germany": 1.5, "France": 1.5, "Netherlands": 1.4,
  "Italy": 1.5, "Spain": 1.4, "Switzerland": 1.6,
  "United States": 1.8, "Canada": 1.8, "Australia": 1.6, "New Zealand": 1.7,
  "South Africa": 1.5,
};

function formatNPR(n: number) {
  return "NPR " + Math.round(n).toLocaleString("en-IN");
}

export default function Calculator() {
  const [freightType, setFreightType] = useState("air");
  const [weight, setWeight] = useState("");
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("Kathmandu, Nepal");
  const [result, setResult] = useState<null | { low: number; high: number; freight: typeof FREIGHT_TYPES[0] }>(null);

  const selected = FREIGHT_TYPES.find((f) => f.id === freightType)!;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0 || !destination) return;

    const effectiveWeight = Math.max(w, selected.minWeight);
    const multiplier = REGION_MULTIPLIERS[destination] ?? 1.2;

    const low  = effectiveWeight * selected.rateMin * multiplier;
    const high = effectiveWeight * selected.rateMax * multiplier;

    setResult({ low, high, freight: selected });
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
              <span>Instant Freight Estimate</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Freight Cost Calculator
            </h1>
            <p className="text-white/70">
              Get an instant estimate for air, sea, or road freight from Nepal.
              <br />Final price confirmed by our team after shipment details are reviewed.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          {/* Freight Type Selection */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Select Freight Type</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FREIGHT_TYPES.map((ft) => (
                <button
                  key={ft.id}
                  onClick={() => { setFreightType(ft.id); setResult(null); }}
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

          {/* Calculator Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <selected.icon className="h-5 w-5 text-secondary" />
                {selected.label} Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCalculate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                    >
                      {ORIGINS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country</label>
                    <select
                      value={destination}
                      onChange={(e) => { setDestination(e.target.value); setResult(null); }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                      required
                    >
                      <option value="">— Select destination —</option>
                      {Object.entries(DESTINATIONS).map(([region, countries]) => (
                        <optgroup key={region} label={region}>
                          {countries.map((c) => <option key={c}>{c}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Weight (kg)
                    {selected.minWeight > 1 && (
                      <span className="text-gray-400 font-normal ml-1">— minimum {selected.minWeight} kg</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => { setWeight(e.target.value); setResult(null); }}
                    placeholder={`e.g. ${selected.minWeight}`}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-white h-11">
                  <CalcIcon className="h-4 w-4 mr-2" />
                  Calculate Estimate
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card className="border-2 border-secondary/30 bg-secondary/5">
              <CardContent className="pt-6 pb-4 text-center space-y-4">
                <Badge className="bg-secondary text-white text-xs px-3 py-1">
                  Estimated Cost
                </Badge>
                <div>
                  <p className="text-3xl font-bold text-secondary">
                    {formatNPR(result.low)} – {formatNPR(result.high)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Based on {weight} kg via {result.freight.label} to {destination}
                  </p>
                </div>
                <div className="flex justify-center gap-6 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold">Transit Time</span>
                    <p className="text-gray-500">{result.freight.transitMin}–{result.freight.transitMax} {result.freight.unit}</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <span className="font-semibold">Rate Range</span>
                    <p className="text-gray-500">NPR {result.freight.rateMin}–{result.freight.rateMax}/kg</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 border-t pt-3">
                  * This is an indicative estimate only. Final price depends on actual dimensions, packaging, customs duties, and route. Contact us for a confirmed quote.
                </p>
                <div className="flex gap-3 justify-center">
                  <a
                    href="https://wa.me/9779769686908"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Get Confirmed Quote on WhatsApp
                  </a>
                  <a
                    href="tel:+97714527999"
                    className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Call Us
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Rate (NPR/kg)</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Min Weight</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Transit Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FREIGHT_TYPES.map((ft) => (
                      <tr key={ft.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${ft.color} text-white`}>
                              <ft.icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">{ft.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{ft.rateMin}–{ft.rateMax}</td>
                        <td className="px-4 py-3 text-gray-600">{ft.minWeight} kg</td>
                        <td className="px-4 py-3 text-gray-600">{ft.transitMin}–{ft.transitMax} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 px-4 py-3">
                Rates are indicative and vary by destination, dimensions (volumetric weight), and market conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <WhatsAppButton />
      <ChatBot />
    </>
  );
}
