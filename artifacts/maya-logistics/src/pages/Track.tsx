import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, MapPin, CheckCircle, Clock, Truck, FileText } from "lucide-react";
import { useTrackShipment, getTrackShipmentQueryKey } from "@workspace/api-client-react";
import { formatNPR, cn } from "@/lib/utils";
import { format } from "date-fns";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

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
              {/* Timeline */}
              <div className="relative mb-12 py-8">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full hidden md:block"></div>
                <div className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full hidden md:block transition-all duration-500" 
                     style={{ 
                       width: shipment.status === 'pending' ? '0%' : 
                              shipment.status === 'in_transit' ? '50%' : '100%' 
                     }}>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-0">
                  <div className="flex flex-row md:flex-col items-center md:items-center gap-4 md:gap-2">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors", 
                      shipment.status === 'pending' || shipment.status === 'in_transit' || shipment.status === 'delivered' ? "bg-primary text-white" : "bg-gray-200 text-gray-400")}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="md:text-center">
                      <p className="font-bold text-secondary">Order Placed</p>
                      <p className="text-sm text-gray-500">{format(new Date(shipment.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col items-center md:items-center gap-4 md:gap-2">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors", 
                      shipment.status === 'in_transit' || shipment.status === 'delivered' ? "bg-primary text-white" : "bg-gray-200 text-gray-400")}>
                      <Truck className="h-4 w-4" />
                    </div>
                    <div className="md:text-center">
                      <p className="font-bold text-secondary">In Transit</p>
                      <p className="text-sm text-gray-500">
                        {shipment.status === 'in_transit' || shipment.status === 'delivered' ? "Departed" : "Pending"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col items-center md:items-center gap-4 md:gap-2">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors", 
                      shipment.status === 'delivered' ? "bg-primary text-white" : "bg-gray-200 text-gray-400")}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="md:text-center">
                      <p className="font-bold text-secondary">Delivered</p>
                      <p className="text-sm text-gray-500">
                        {shipment.status === 'delivered' ? format(new Date(shipment.updatedAt), "MMM d, yyyy") : "Pending"}
                      </p>
                    </div>
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
    </div>
  );
}
