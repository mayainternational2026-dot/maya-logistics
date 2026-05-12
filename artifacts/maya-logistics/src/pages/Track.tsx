import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, MapPin, CheckCircle, Clock, Truck, FileText, Warehouse, ShieldCheck, PlaneTakeoff, Building2 } from "lucide-react";
import { useTrackShipment, getTrackShipmentQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";

type ShipmentStatus = "pending" | "collected" | "at_warehouse" | "customs_clearance" | "in_transit" | "arrived" | "delivered";

const STAGES: { status: ShipmentStatus; label: string; icon: React.ReactNode }[] = [
  { status: "pending",           label: "Order Received",     icon: <FileText className="h-4 w-4" /> },
  { status: "collected",         label: "Collected",          icon: <Truck className="h-4 w-4" /> },
  { status: "at_warehouse",      label: "At Warehouse",       icon: <Warehouse className="h-4 w-4" /> },
  { status: "customs_clearance", label: "Customs Clearance",  icon: <ShieldCheck className="h-4 w-4" /> },
  { status: "in_transit",        label: "In Transit",         icon: <PlaneTakeoff className="h-4 w-4" /> },
  { status: "arrived",           label: "Arrived at Office",  icon: <Building2 className="h-4 w-4" /> },
  { status: "delivered",         label: "Dispatched",         icon: <CheckCircle className="h-4 w-4" /> },
];

const STATUS_ORDER: ShipmentStatus[] = ["pending","collected","at_warehouse","customs_clearance","in_transit","arrived","delivered"];
const statusIndex = (s: ShipmentStatus) => STATUS_ORDER.indexOf(s);

export default function Track() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [trackingId, setTrackingId] = useState(params.trackingId || "");
  const [searchQuery, setSearchQuery] = useState(params.trackingId || "");

  const { data: shipment, isLoading, isError, error } = useTrackShipment(
    searchQuery,
    { query: { enabled: !!searchQuery, queryKey: getTrackShipmentQueryKey(searchQuery), retry: false } }
  );

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      setLocation(`/track/${trackingId.trim()}`);
      setSearchQuery(trackingId.trim());
    }
  };

  useEffect(() => {
    if (params.trackingId) {
      setTrackingId(params.trackingId);
      setSearchQuery(params.trackingId);
    }
  }, [params.trackingId]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead
        title="Track Your Shipment — Cargo Tracking Nepal"
        description="Track your cargo shipment in real time. Enter your Maya Import Export Logistic tracking ID to see live status from Kathmandu to your destination."
        keywords="track cargo Nepal, shipment tracking Nepal, cargo tracking Kathmandu, track my shipment Nepal, freight tracking Nepal"
        canonical="/track"
      />
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Track Your Shipment</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Enter your tracking ID below to get real-time updates on your cargo's journey.
          </p>
        </div>

        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <form onSubmit={handleTrack} className="flex gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Tracking ID (e.g., TRK-12345)"
                className="w-full pl-10 h-12 text-lg bg-gray-50 border-gray-200 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" disabled={!trackingId.trim() || isLoading} className="h-12 px-8 text-base bg-secondary hover:bg-secondary/90 text-white">
              {isLoading ? "Tracking..." : "Track"}
            </Button>
          </form>
        </div>

        {isError && (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center border border-red-100">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold mb-1">Shipment Not Found</h3>
            <p>We couldn't find a shipment with that tracking ID. Please check and try again.</p>
          </div>
        )}

        {shipment && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-secondary text-white p-6 md:p-8 border-b border-secondary-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">TRACKING ID</p>
                <h2 className="text-2xl md:text-3xl font-mono font-bold tracking-tight">{shipment.trackingId}</h2>
              </div>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full w-fit">
                {shipment.status === "pending" && <Clock className="h-5 w-5 text-amber-400" />}
                {shipment.status === "in_transit" && <Truck className="h-5 w-5 text-blue-400" />}
                {shipment.status === "delivered" && <CheckCircle className="h-5 w-5 text-green-400" />}
                <span className="font-bold text-lg capitalize">
                  {shipment.status.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* 7-Stage Timeline */}
              <div className="mb-10">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Shipment Journey</h3>
                <div className="relative">
                  {/* Progress bar (desktop only) */}
                  <div className="hidden md:block absolute top-5 left-5 right-5 h-1 bg-gray-100 rounded-full z-0" />
                  <div
                    className="hidden md:block absolute top-5 left-5 h-1 bg-primary rounded-full z-0 transition-all duration-700"
                    style={{
                      width: `calc(${(statusIndex(shipment.status as ShipmentStatus) / (STAGES.length - 1)) * 100}% - ${statusIndex(shipment.status as ShipmentStatus) === 0 ? "20px" : statusIndex(shipment.status as ShipmentStatus) === STAGES.length - 1 ? "0px" : "0px"})`,
                    }}
                  />
                  <div className="grid grid-cols-7 gap-1 relative z-10">
                    {STAGES.map((stage, i) => {
                      const done = statusIndex(shipment.status as ShipmentStatus) >= i;
                      const current = shipment.status === stage.status;
                      return (
                        <div key={stage.status} className="flex flex-col items-center gap-2">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-300",
                            done ? "bg-primary text-white" : "bg-gray-100 text-gray-400",
                            current && "ring-2 ring-primary ring-offset-2 scale-110"
                          )}>
                            {done && !current ? <CheckCircle className="h-4 w-4" /> : stage.icon}
                          </div>
                          <div className="text-center">
                            <p className={cn("text-xs font-semibold leading-tight", done ? "text-secondary" : "text-gray-400")}>
                              {stage.label}
                            </p>
                            {current && <p className="text-xs text-primary font-bold mt-0.5">● Active</p>}
                            {!current && done && i === 0 && (
                              <p className="text-xs text-gray-400">{format(new Date(shipment.createdAt), "MMM d")}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Route Info</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="mt-1 text-primary"><MapPin className="h-5 w-5" /></div>
                      <div>
                        <p className="text-sm text-gray-500">Origin</p>
                        <p className="font-semibold text-lg text-secondary">{shipment.origin}</p>
                      </div>
                    </div>
                    <div className="ml-2.5 w-0.5 h-6 bg-gray-200 border-l border-dashed border-gray-300"></div>
                    <div className="flex gap-4">
                      <div className="mt-1 text-primary"><MapPin className="h-5 w-5" /></div>
                      <div>
                        <p className="text-sm text-gray-500">Destination</p>
                        <p className="font-semibold text-lg text-secondary">{shipment.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Shipment Details</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Sender</p>
                      <p className="font-semibold text-secondary">{shipment.senderName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Receiver</p>
                      <p className="font-semibold text-secondary">{shipment.receiverName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Weight</p>
                      <p className="font-semibold text-secondary">{shipment.weight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                      <p className="font-semibold text-secondary">{format(new Date(shipment.updatedAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <WhatsAppButton />
      <ChatBot onOpenInquiry={() => setLocation("/inquiry")} />
    </div>
  );
}
