import { useParams, useLocation } from "wouter";
import { useGetShipment, getGetShipmentQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Printer, ArrowLeft, Package } from "lucide-react";
import { formatNPR } from "@/lib/utils";

const CO = {
  name: "Maya Import Export Logistic",
  tagline: "Global Freight Forwarding · Kathmandu, Nepal",
  address: "Anandamaya Marg, Dhumbarahi, Kathmandu",
  phone: "+977 9768595133",
  email: "mayaimportexportinternational@gmail.com",
  reg: "Reg. No. MIE-2054",
};

const RED = "#c0392b";
const DARK = "#1a1a2e";

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

  const invoiceNo = `MIE-${data.trackingId}`;
  const issuedDate = format(new Date(data.createdAt), "dd MMM yyyy");
  const dueDate = format(new Date(data.createdAt), "dd MMM yyyy");
  const subtotal = Number(data.cost);
  const total = subtotal;

  const billTo = {
    name: data.customerName ?? data.receiverName,
    email: data.customerEmail ?? "",
    phone: data.receiverPhone ?? "",
  };

  return (
    <>
      {/* Controls – hidden on print */}
      <div className="no-print flex items-center gap-3 mb-8">
        <Button variant="outline" onClick={() => setLocation(`/shipments/${id}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={() => window.print()}
          className="gap-2 text-white"
          style={{ background: RED }}
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      {/* ── INVOICE DOCUMENT ── */}
      <div
        id="invoice-doc"
        className="bg-white max-w-3xl mx-auto overflow-hidden"
        style={{
          fontFamily: "'Segoe UI', Arial, sans-serif",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >

        {/* ── TOP ACCENT STRIP ── */}
        <div style={{ height: 6, background: `linear-gradient(to right, ${RED}, #e74c3c, ${DARK})` }} />

        {/* ── HEADER ── */}
        <div className="px-10 pt-8 pb-6 flex items-start justify-between gap-6">
          {/* Logo + company */}
          <div className="flex items-center gap-4">
            <div
              style={{ border: `2px solid ${RED}`, borderRadius: 10, overflow: "hidden", width: 64, height: 64, flexShrink: 0 }}
            >
              <img
                src={`${import.meta.env.BASE_URL}maya-logo.jpeg`}
                alt="Maya"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div>
              <p style={{ color: DARK, fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px" }}>
                {CO.name}
              </p>
              <p style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{CO.tagline}</p>
              <p style={{ color: "#6b7280", fontSize: 11 }}>{CO.phone} · {CO.email}</p>
            </div>
          </div>

          {/* Invoice badge */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p
              style={{
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: 3,
                color: RED,
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              Invoice
            </p>
            <p style={{ color: "#374151", fontSize: 13, fontWeight: 700, marginTop: 6, fontFamily: "monospace" }}>
              # {invoiceNo}
            </p>
            <p style={{ color: "#9ca3af", fontSize: 11, marginTop: 3 }}>Issued: {issuedDate}</p>
            {data.paidAt && (
              <p style={{ color: "#9ca3af", fontSize: 11 }}>
                Paid: {format(new Date(data.paidAt), "dd MMM yyyy")}
              </p>
            )}
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ height: 1, background: "#f3f4f6", margin: "0 40px" }} />

        {/* ── BILL TO / SHIP INFO BAND ── */}
        <div
          style={{
            margin: "24px 40px",
            borderRadius: 10,
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Bill To */}
          <div style={{ padding: "16px 20px", borderRight: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: RED, marginBottom: 8 }}>
              Bill To
            </p>
            <p style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{billTo.name}</p>
            {billTo.email && <p style={{ color: "#6b7280", fontSize: 12, marginTop: 3 }}>{billTo.email}</p>}
            {billTo.phone && <p style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{billTo.phone}</p>}
          </div>

          {/* Route */}
          <div style={{ padding: "16px 20px", borderRight: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: RED, marginBottom: 8 }}>
              Route
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: DARK, fontWeight: 600 }}>
              <span>{data.origin}</span>
              <span style={{ color: RED, fontWeight: 900 }}>→</span>
              <span>{data.destination}</span>
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Weight: <strong>{data.weight} kg</strong></p>
            <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginTop: 2 }}>{data.trackingId}</p>
          </div>

          {/* Payment status */}
          <div style={{ padding: "16px 20px", background: data.paid ? "#f0fdf4" : "#fffbeb" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: RED, marginBottom: 8 }}>
              Payment
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                background: data.paid ? "#dcfce7" : "#fef9c3",
                color: data.paid ? "#166534" : "#854d0e",
                border: `1px solid ${data.paid ? "#86efac" : "#fde047"}`,
              }}
            >
              <span style={{ fontSize: 10 }}>{data.paid ? "●" : "○"}</span>
              {data.paid ? "PAID" : "PENDING"}
            </div>
            {data.paidAt && (
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                {format(new Date(data.paidAt), "dd MMM yyyy")}
              </p>
            )}
            <p style={{ fontSize: 12, fontWeight: 700, color: DARK, marginTop: 8 }}>
              Due: {dueDate}
            </p>
          </div>
        </div>

        {/* ── SENDER / RECEIVER STRIP ── */}
        <div style={{ margin: "0 40px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px 16px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Sender</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{data.senderName}</p>
            {data.senderPhone && <p style={{ fontSize: 12, color: "#6b7280" }}>{data.senderPhone}</p>}
          </div>
          <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px 16px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Receiver</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{data.receiverName}</p>
            {data.receiverPhone && <p style={{ fontSize: 12, color: "#6b7280" }}>{data.receiverPhone}</p>}
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div style={{ margin: "0 40px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: DARK, color: "white" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", borderRadius: "8px 0 0 0", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Description
                </th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, width: 60 }}>
                  Qty
                </th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Rate
                </th>
                <th style={{ textAlign: "right", padding: "10px 14px", borderRadius: "0 8px 0 0", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "14px 14px", verticalAlign: "top" }}>
                  <p style={{ fontWeight: 600, color: DARK, fontSize: 13 }}>
                    International Freight Service
                  </p>
                  <p style={{ color: "#6b7280", fontSize: 11, marginTop: 3 }}>
                    {data.origin} → {data.destination} · {data.weight} kg
                  </p>
                  <p style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>
                    Tracking: {data.trackingId}
                  </p>
                </td>
                <td style={{ padding: "14px 14px", textAlign: "center", color: "#374151" }}>1</td>
                <td style={{ padding: "14px 14px", textAlign: "right", color: "#374151" }}>
                  {formatNPR(subtotal)}
                </td>
                <td style={{ padding: "14px 14px", textAlign: "right", fontWeight: 700, color: DARK }}>
                  {formatNPR(subtotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── TOTALS ── */}
        <div style={{ margin: "0 40px 8px", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 260, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6" }}>
              <span>Subtotal</span>
              <span>{formatNPR(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6" }}>
              <span>Tax / VAT</span>
              <span>Rs. 0.00</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 14px",
                marginTop: 6,
                borderRadius: 8,
                background: RED,
                color: "white",
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              <span>Total Due</span>
              <span>{formatNPR(total)}</span>
            </div>
          </div>
        </div>

        {/* ── NOTES ── */}
        {data.notes && (
          <div style={{ margin: "20px 40px 0", background: "#fffbeb", borderLeft: `3px solid #fbbf24`, borderRadius: 6, padding: "10px 14px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Notes</p>
            <p style={{ fontSize: 12, color: "#78350f" }}>{data.notes}</p>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div
          style={{
            margin: "28px 0 0",
            padding: "18px 40px",
            background: "#f9fafb",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: DARK }}>Thank you for your business!</p>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
              {CO.address}
            </p>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>
              {CO.phone} · {CO.email}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontSize: 10, color: "#d1d5db", fontFamily: "monospace" }}>{CO.reg}</p>
            <div
              style={{
                width: 80,
                height: 36,
                marginTop: 6,
                borderTop: "1.5px solid #d1d5db",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 4,
              }}
            >
              <p style={{ fontSize: 10, color: "#9ca3af" }}>Authorised Signature</p>
            </div>
          </div>
        </div>

        {/* ── BOTTOM ACCENT STRIP ── */}
        <div style={{ height: 4, background: `linear-gradient(to right, ${DARK}, ${RED})` }} />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
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
