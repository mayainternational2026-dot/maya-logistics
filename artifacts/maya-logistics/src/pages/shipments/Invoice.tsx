import { useParams, useLocation } from "wouter";
import { useGetShipment, getGetShipmentQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Printer, ArrowLeft, Package } from "lucide-react";
import { formatNPR } from "@/lib/utils";
import { logoUrl } from "@/lib/assets";

const CO = {
  name: "Maya Import Export Logistic",
  address1: "Anandamaya Marg, Dhumbarahi",
  address2: "Kathmandu, Nepal",
  phone: "Tel: 014527999 | +977 9744732123",
  email: "mayaimportexportinternational@gmail.com",
  website: "www.mayaimportexport.com",
};

const BLUE = "#007bff";
const GRAY = "#555555";
const LIGHT = "#f8f9fa";
const BORDER = "#dee2e6";

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
      <div className="py-16 text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 border-2 border-amber-200 mx-auto">
          <Package className="h-8 w-8 text-amber-500" />
        </div>
        <p className="font-semibold text-gray-800 text-lg">Invoice Not Yet Available</p>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Your invoice will be released once the admin confirms your payment. Please contact us on WhatsApp if you need assistance.
        </p>
        <Button variant="outline" onClick={() => setLocation(`/shipments/${id}`)} className="gap-2 mt-2">
          <ArrowLeft className="h-4 w-4" /> Back to Shipment
        </Button>
      </div>
    );
  }

  const invoiceDate = format(new Date(data.createdAt), "MMMM d, yyyy");
  const paymentTerms = data.paid ? "Payment Received" : "Due on Receipt";
  const billToName = data.customerName ?? data.receiverName;
  const billToEmail = data.customerEmail ?? "";
  const itemDescription = `Freight: ${data.origin} → ${data.destination} (${data.weight} kg · ${data.trackingId})`;
  const amount = Number(data.cost);
  const notes = `Sender: ${data.senderName}\nReceiver: ${data.receiverName}\nThank you for choosing Maya Import Export Logistic.`;

  return (
    <>
      {/* Controls — hidden on print */}
      <div
        className="no-print flex items-center gap-3 mb-8"
      >
        <Button variant="outline" onClick={() => setLocation(`/shipments/${id}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={() => window.print()} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      {/* ── INVOICE DOCUMENT ── */}
      <div
        id="invoice-doc"
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 14,
          color: "#212529",
          background: "white",
          maxWidth: 760,
          margin: "0 auto",
          padding: "40px 48px",
          border: `1px solid ${BORDER}`,
          borderRadius: 4,
        }}
      >
        {/* ── TOP ROW: Company + INVOICE title ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          {/* Logo + Company */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src={logoUrl}
              alt="Maya"
              style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#212529" }}>{CO.name}</div>
              <div style={{ color: GRAY, fontSize: 12, marginTop: 2 }}>{CO.address1}</div>
              <div style={{ color: GRAY, fontSize: 12 }}>{CO.address2}</div>
              <div style={{ color: GRAY, fontSize: 12 }}>{CO.phone}</div>
              <div style={{ color: GRAY, fontSize: 12 }}>{CO.email}</div>
              <div style={{ color: GRAY, fontSize: 12 }}>{CO.website}</div>
            </div>
          </div>

          {/* INVOICE title */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: BLUE, letterSpacing: 1 }}>INVOICE</div>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, marginBottom: 24 }} />

        {/* ── BILL TO + INVOICE META ── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, gap: 32 }}>
          {/* Bill To */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: GRAY, marginBottom: 6, letterSpacing: 0.8 }}>
              Bill To
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#212529" }}>{billToName}</div>
            {billToEmail && <div style={{ color: GRAY, fontSize: 13, marginTop: 2 }}>{billToEmail}</div>}
          </div>

          {/* Invoice meta */}
          <div style={{ minWidth: 220 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600, whiteSpace: "nowrap" }}>Invoice #</td>
                  <td style={{ padding: "4px 0", fontSize: 12, color: "#212529", textAlign: "right" }}>{data.trackingId}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Invoice Date</td>
                  <td style={{ padding: "4px 0", fontSize: 12, color: "#212529", textAlign: "right" }}>{invoiceDate}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Payment Terms</td>
                  <td style={{ padding: "4px 0", fontSize: 12, color: data.paid ? "#198754" : "#212529", fontWeight: data.paid ? 700 : 400, textAlign: "right" }}>
                    {paymentTerms}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}>
          <thead>
            <tr style={{ background: BLUE, color: "white" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: 12 }}>Item</th>
              <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, fontSize: 12, width: 70 }}>Quantity</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, fontSize: 12, width: 110 }}>Rate</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, fontSize: 12, width: 110 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: LIGHT }}>
              <td style={{ padding: "12px", fontSize: 13, color: "#212529", verticalAlign: "top" }}>
                {itemDescription}
              </td>
              <td style={{ padding: "12px", fontSize: 13, textAlign: "center", color: "#212529" }}>1</td>
              <td style={{ padding: "12px", fontSize: 13, textAlign: "right", color: "#212529" }}>
                {formatNPR(amount)}
              </td>
              <td style={{ padding: "12px", fontSize: 13, textAlign: "right", color: "#212529", fontWeight: 600 }}>
                {formatNPR(amount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── TOTALS ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 0 }}>
          <table style={{ borderCollapse: "collapse", minWidth: 240 }}>
            <tbody>
              <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: "8px 12px", fontSize: 13, color: GRAY }}>Subtotal</td>
                <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", color: "#212529" }}>
                  {formatNPR(amount)}
                </td>
              </tr>
              <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: "8px 12px", fontSize: 13, color: GRAY }}>Tax</td>
                <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", color: "#212529" }}>NPR 0.00</td>
              </tr>
              <tr style={{ borderTop: `2px solid ${BLUE}`, background: BLUE }}>
                <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: "white" }}>Total</td>
                <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, textAlign: "right", color: "white" }}>
                  {formatNPR(amount)}
                </td>
              </tr>
              {data.paid && (
                <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "8px 12px", fontSize: 13, color: "#198754", fontWeight: 600 }}>Amount Paid</td>
                  <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", color: "#198754", fontWeight: 600 }}>
                    {formatNPR(amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── NOTES ── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: GRAY, marginBottom: 6, letterSpacing: 0.8 }}>
            Notes
          </div>
          <div style={{ fontSize: 13, color: "#212529", whiteSpace: "pre-line", lineHeight: 1.6 }}>
            {notes}
          </div>
          {data.notes && (
            <div style={{ fontSize: 13, color: GRAY, marginTop: 6 }}>
              {data.notes}
            </div>
          )}
        </div>

        {/* ── SIGNATURE ── */}
        <div style={{ marginTop: 48, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ textAlign: "center", minWidth: 200 }}>
            <div style={{ borderTop: `1px solid #212529`, paddingTop: 8, marginTop: 40 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#212529" }}>Authorized Signature</div>
              <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{CO.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          #invoice-doc {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            padding: 24px 32px !important;
          }
        }
      `}</style>
    </>
  );
}
