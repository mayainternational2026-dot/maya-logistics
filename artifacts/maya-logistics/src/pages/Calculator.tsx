import { useState, useMemo, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListShippingRates } from "@workspace/api-client-react";
import {
  Plane,
  Ship,
  Truck,
  Calculator as CalcIcon,
  MessageCircle,
  Phone,
  Package,
  Ruler,
  RefreshCw,
  ChevronDown,
  Search,
  Info,
  DollarSign,
} from "lucide-react";

const FREIGHT_TYPES = [
  {
    id: "air",
    label: "Air Freight",
    icon: Plane,
    color: "bg-blue-600",
    description: "Fastest — ideal for urgent or high-value cargo",
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
    description: "Best for regional — India, China, Bangladesh",
    via: "Birgunj / Banbasa border crossing",
  },
];

function countryFlag(code: string) {
  try {
    return code.toUpperCase().replace(/./g, (c) =>
      String.fromCodePoint(c.charCodeAt(0) + 127397),
    );
  } catch {
    return "🌍";
  }
}

function formatMoney(amount: number, currency: "USD" | "NPR") {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `NPR ${amount.toLocaleString("ne-NP", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function CountryDropdown({
  rates,
  value,
  onChange,
}: {
  rates: { id: number; country: string; countryCode: string }[];
  value: string;
  onChange: (country: string, countryCode: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => rates.filter((r) => r.country.toLowerCase().includes(query.toLowerCase())),
    [rates, query],
  );

  const selected = rates.find((r) => r.country === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(""); }}
        className={`w-full flex items-center gap-2 border rounded-md px-3 py-2 text-sm text-left transition-all ${
          open ? "border-secondary ring-2 ring-secondary/20" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {selected ? (
          <>
            <span className="text-lg leading-none">{countryFlag(selected.countryCode)}</span>
            <span className="flex-1 text-gray-900">{selected.country}</span>
          </>
        ) : (
          <span className="flex-1 text-gray-400">— Select destination —</span>
        )}
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country…"
                className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No countries found</p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { onChange(r.country, r.countryCode); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/5 transition-colors ${
                    r.country === value ? "bg-secondary/10 text-secondary font-medium" : "text-gray-700"
                  }`}
                >
                  <span className="text-lg leading-none">{countryFlag(r.countryCode)}</span>
                  {r.country}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Calculator() {
  const { data: rates = [], isLoading: ratesLoading } = useListShippingRates();

  const [freightType, setFreightType] = useState("air");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [currency, setCurrency] = useState<"USD" | "NPR">("USD");
  const [calculated, setCalculated] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedFreight = FREIGHT_TYPES.find((f) => f.id === freightType)!;
  const selectedRate = rates.find((r) => r.country === country);

  const actualWeight = parseFloat(weight) || 0;
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const volumetricWeight = l * w * h > 0 ? (l * w * h) / 5000 : 0;
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  const ratePerKg = selectedRate
    ? currency === "USD"
      ? selectedRate.rateUsd
      : selectedRate.rateNpr
    : 0;
  const estimatedCost = chargeableWeight > 0 ? chargeableWeight * ratePerKg : 0;

  function validate() {
    const e: Record<string, string> = {};
    if (!country) e.country = "Please select a destination country";
    if (!weight || parseFloat(weight) <= 0) e.weight = "Enter a valid weight";
    if (l > 0 || w > 0 || h > 0) {
      if (l <= 0) e.length = "Enter length";
      if (w <= 0) e.width = "Enter width";
      if (h <= 0) e.height = "Enter height";
    }
    return e;
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setCalculating(true);
    setTimeout(() => { setCalculating(false); setCalculated(true); }, 700);
  };

  const handleReset = () => {
    setCountry(""); setCountryCode(""); setWeight(""); setLength("");
    setWidth(""); setHeight(""); setCalculated(false); setErrors({});
  };

  const handleWhatsApp = () => {
    const hasDimensions = l > 0 && w > 0 && h > 0;
    const msg = `Hi Maya Logistics, I'd like a shipping quote:

📦 Freight Type: ${selectedFreight.label}
🌍 Destination: ${country}
⚖️ Actual Weight: ${actualWeight} kg${hasDimensions ? `
📐 Dimensions: ${l} × ${w} × ${h} cm
📦 Volumetric Weight: ${volumetricWeight.toFixed(2)} kg
✅ Chargeable Weight: ${chargeableWeight.toFixed(2)} kg` : ""}
💰 Estimated Cost: ${formatMoney(estimatedCost, currency)}

Please confirm final pricing. Thank you.`;
    window.open(`https://wa.me/9779744732123?text=${encodeURIComponent(msg)}`, "_blank");
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
              <span>Shipping Cost Calculator</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Calculate Shipping Cost</h1>
            <p className="text-white/70">
              Enter your shipment details to get an instant estimate. Our team confirms the final price via WhatsApp.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

          {/* Freight Type */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Freight Type</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FREIGHT_TYPES.map((ft) => (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => { setFreightType(ft.id); setCalculated(false); }}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    freightType === ft.id
                      ? "border-secondary bg-secondary/5 shadow-sm"
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
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-2">
              <Info className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
              Routes via: <span className="font-medium text-gray-600">{selectedFreight.via}</span>
            </p>
          </div>

          {/* Calculator Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-secondary" />
                  Shipment Details
                </span>
                {/* Currency Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {(["USD", "NPR"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        currency === c ? "bg-white text-secondary shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {c === "USD" ? "$ USD" : "NPR"}
                    </button>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCalculate} className="space-y-5">

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Country *
                  </label>
                  {ratesLoading ? (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md" />
                  ) : (
                    <CountryDropdown
                      rates={rates}
                      value={country}
                      onChange={(c, cc) => { setCountry(c); setCountryCode(cc); setCalculated(false); setErrors((e) => ({ ...e, country: "" })); }}
                    />
                  )}
                  {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-secondary" />
                    Actual Weight (kg) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={weight}
                    onChange={(e) => { setWeight(e.target.value); setCalculated(false); setErrors((er) => ({ ...er, weight: "" })); }}
                    placeholder="e.g. 10.5"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${
                      errors.weight ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <Ruler className="h-3.5 w-3.5 text-secondary" />
                    Package Dimensions (cm) <span className="text-gray-400 font-normal">(optional — for volumetric weight)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "length", label: "Length", val: length, set: setLength, err: errors.length },
                      { key: "width",  label: "Width",  val: width,  set: setWidth,  err: errors.width },
                      { key: "height", label: "Height", val: height, set: setHeight, err: errors.height },
                    ].map(({ key, label, val, set, err }) => (
                      <div key={key}>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={val}
                          onChange={(e) => { set(e.target.value); setCalculated(false); setErrors((er) => ({ ...er, [key]: "" })); }}
                          placeholder={label}
                          className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent transition-all ${
                            err ? "border-red-400" : "border-gray-300"
                          }`}
                        />
                        {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
                      </div>
                    ))}
                  </div>
                  {l > 0 && w > 0 && h > 0 && (
                    <p className="text-xs text-secondary mt-1.5">
                      Volumetric weight: <strong>{volumetricWeight.toFixed(2)} kg</strong>
                      &nbsp;· Formula: ({l} × {w} × {h}) / 5000
                    </p>
                  )}
                </div>

                {/* Rate preview */}
                {selectedRate && country && (
                  <div className="flex items-center gap-2 text-sm bg-secondary/5 border border-secondary/20 rounded-md px-3 py-2 text-secondary">
                    <DollarSign className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Rate for <strong>{country}</strong>:{" "}
                      <strong>
                        {currency === "USD"
                          ? `$${selectedRate.rateUsd}/kg`
                          : `NPR ${selectedRate.rateNpr}/kg`}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={calculating}
                    className="flex-1 bg-secondary hover:bg-secondary/90 text-white h-11 gap-2"
                  >
                    {calculating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Calculating…
                      </>
                    ) : (
                      <>
                        <CalcIcon className="h-4 w-4" />
                        Calculate Cost
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="gap-2 h-11 border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </form>

              {/* Results */}
              {calculated && chargeableWeight > 0 && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="border-t pt-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Calculation Result</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Actual Weight",     value: `${actualWeight.toFixed(2)} kg`,        highlight: false },
                        { label: "Volumetric Weight", value: volumetricWeight > 0 ? `${volumetricWeight.toFixed(2)} kg` : "—", highlight: false },
                        { label: "Chargeable Weight", value: `${chargeableWeight.toFixed(2)} kg`,    highlight: true },
                        { label: "Estimated Cost",    value: formatMoney(estimatedCost, currency),   highlight: true, big: true },
                      ].map(({ label, value, highlight, big }) => (
                        <div
                          key={label}
                          className={`rounded-xl p-3 border text-center ${
                            highlight ? "bg-secondary/5 border-secondary/30" : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <p className={`text-xs font-medium mb-1 ${highlight ? "text-secondary" : "text-gray-500"}`}>{label}</p>
                          <p className={`font-bold ${big ? "text-lg text-secondary" : "text-sm text-gray-800"}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 mt-3">
                      This is an estimate based on your inputs. Final cost may vary based on actual dimensions, cargo type, packaging, and customs duties. Our team will confirm the exact price.
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <button
                        onClick={handleWhatsApp}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-3 rounded-lg transition-colors text-sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Confirm Price on WhatsApp
                      </button>
                      <a
                        href="tel:+97714527999"
                        className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        Call Us Now
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formula Info */}
          <Card className="bg-white">
            <CardContent className="pt-5 pb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-secondary" />
                How Chargeable Weight Works
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="font-semibold text-blue-800 mb-1">Volumetric Weight</p>
                  <p className="font-mono text-xs bg-blue-100 rounded px-2 py-1 inline-block">L × W × H (cm) ÷ 5000</p>
                  <p className="text-xs text-blue-700 mt-1">Used for large, light packages</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <p className="font-semibold text-purple-800 mb-1">Chargeable Weight</p>
                  <p className="font-mono text-xs bg-purple-100 rounded px-2 py-1 inline-block">max(actual, volumetric)</p>
                  <p className="text-xs text-purple-700 mt-1">Whichever is higher is used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <WhatsAppButton />
      <ChatBot />
    </>
  );
}
