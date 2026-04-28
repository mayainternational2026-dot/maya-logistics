import { useParams, useLocation } from "wouter";
import { useGetShipment, getGetShipmentQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Printer, ArrowLeft, Package } from "lucide-react";
import { formatNPR } from "@/lib/utils";

const COMPANY = {
  name: "Maya Import Export Logistic",
  address: "Anandamaya Marg, Dhumbarahi",
  city: "Kathmandu, Nepal",
  phone: "+977 9768595133",
  email: "mayaimportexportinternational@gmail.com",
};

export default function Invoice() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data, isLoading } = useGetShipment(id, {
    query: { enabled: !!id, queryKey: getGetShipmentQueryKey(id) },
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (!data) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Shipment not found.</p>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isCustomer = user?.role === "customer";

  const canViewInvoice =
    isAdmin ||
    (isStaff && (user?.permissions?.canGenerateInvoice ?? false)) ||
    (isCustomer && data.paid === true);

  if (!canViewInvoice) {
    return (
      <div className="py-16 text-center space-y-3">
        <Package className="mx-auto h-10 w-10 text-amber-400" />
        <p className="font-semibold text-gray-700">Invoice not available yet</p>
        <p className="text-sm text-gray-500">
          Your invoice will appear here once the admin confirms your payment.
        </p>
        <Button variant="outline" onClick={() => setLocation(`/shipments/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to shipment
        </Button>
      </div>
    );
  }

  const invoiceNumber = `INV-${data.trackingId}`;
  const invoiceDate = format(new Date(data.createdAt), "MMMM d, yyyy");
  const subtotal = Number(data.cost);
  const tax = 0;
  const total = subtotal + tax;

  const billTo = {
    name: data.customerName ?? data.receiverName,
    email: data.customerEmail ?? "",
    phone: data.receiverPhone ?? "",
  };

  return (
    <>
      {/* Print / back controls — hidden when printing */}
      <div className="no-print flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation(`/shipments/${id}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={() => window.print()}
          className="gap-2 bg-secondary hover:bg-secondary/90 text-white"
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Invoice document */}
      <div
        id="invoice-doc"
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl mx-auto"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header bar */}
        <div style={{ background: "#0f1f3d" }} className="px-10 py-8 text-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/maya-logo.png"
              alt="Maya Logo"
              className="h-16 w-16 rounded-xl object-contain bg-white p-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
              <p className="font-bold text-lg leading-tight">{COMPANY.name}</p>
              <p className="text-gray-300 text-sm mt-0.5">{COMPANY.address}</p>
              <p className="text-gray-300 text-sm">{COMPANY.city}</p>
              <p className="text-gray-300 text-sm">{COMPANY.phone}</p>
              <p className="text-gray-300 text-sm">{COMPANY.email}</p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="text-3xl font-extrabold tracking-tight" style={{ color: "#dc2626" }}>
              INVOICE
            </p>
            <p className="text-gray-300 text-sm mt-1">
              <span className="font-mono font-semibold text-white">{invoiceNumber}</span>
            </p>
            <p className="text-gray-300 text-sm">Date: {invoiceDate}</p>
            {data.paidAt && (
              <p className="text-gray-300 text-sm">
                Paid: {format(new Date(data.paidAt), "MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        <div className="px-10 py-8 space-y-8">
          {/* Bill To / Ship Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
              <p className="font-bold text-gray-900 text-base">{billTo.name}</p>
              {billTo.email && <p className="text-gray-600 text-sm">{billTo.email}</p>}
              {billTo.phone && <p className="text-gray-600 text-sm">{billTo.phone}</p>}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Shipment Info</p>
              <table className="text-sm w-full">
                <tbody>
                  <tr>
                    <td className="text-gray-500 pr-3 py-0.5">Tracking ID</td>
                    <td className="font-mono font-semibold text-gray-800">{data.trackingId}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 pr-3 py-0.5">Origin</td>
                    <td className="font-semibold text-gray-800">{data.origin}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 pr-3 py-0.5">Destination</td>
                    <td className="font-semibold text-gray-800">{data.destination}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 pr-3 py-0.5">Weight</td>
                    <td className="font-semibold text-gray-800">{data.weight} kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment status badge */}
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
              style={
                data.paid
                  ? { background: "#d1fae5", color: "#065f46" }
                  : { background: "#fef3c7", color: "#92400e" }
              }
            >
              {data.paid ? "✓ Payment Received" : "⏳ Payment Pending"}
            </span>
            {data.paidAt && (
              <span className="text-sm text-gray-500">
                on {format(new Date(data.paidAt), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {/* Line items table */}
          <div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "#0f1f3d" }} className="text-white">
                  <th className="text-left px-4 py-3 rounded-tl-lg font-semibold">Description</th>
                  <th className="text-center px-4 py-3 font-semibold">Qty</th>
                  <th className="text-right px-4 py-3 font-semibold">Unit Price</th>
                  <th className="text-right px-4 py-3 rounded-tr-lg font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-4 text-gray-800">
                    <p className="font-semibold">
                      Freight: {data.origin} → {data.destination}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {data.weight} kg · Tracking: {data.trackingId}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Sender: {data.senderName}{data.senderPhone ? ` · ${data.senderPhone}` : ""}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Receiver: {data.receiverName}{data.receiverPhone ? ` · ${data.receiverPhone}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-700">1</td>
                  <td className="px-4 py-4 text-right text-gray-700">{formatNPR(subtotal)}</td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-800">{formatNPR(subtotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-2 flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600 px-2">
                  <span>Subtotal</span>
                  <span>{formatNPR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 px-2">
                  <span>Tax</span>
                  <span>Rs. 0</span>
                </div>
                <div
                  className="flex justify-between font-bold text-base px-2 py-2 rounded-lg mt-1"
                  style={{ background: "#0f1f3d", color: "white" }}
                >
                  <span>Total</span>
                  <span>{formatNPR(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Notes</p>
              <p className="text-gray-700 text-sm">{data.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 pt-6 text-center">
            <p className="text-gray-500 text-sm">Thank you for choosing <strong>{COMPANY.name}</strong>.</p>
            <p className="text-gray-400 text-xs mt-1">
              {COMPANY.address}, {COMPANY.city} · {COMPANY.phone} · {COMPANY.email}
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #invoice-doc {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
