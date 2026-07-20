import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetShipment, getGetShipmentQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Printer, ArrowLeft, Package, Plus, Trash2 } from "lucide-react";
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

interface ProductLine {
  id: number;
  name: string;
  qty: string;
  unitPrice: string;
}

let _lineId = 1;
function newLine(): ProductLine {
  return { id: _lineId++, name: "", qty: "1", unitPrice: "0" };
}

export default function Invoice() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [productLines, setProductLines] = useState<ProductLine[]>([newLine()]);

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
  const billToName = data.customerName ?? data.senderName;
  const billToEmail = data.customerEmail ?? "";
  const freightAmount = Number(data.cost);

  const parsedLines = productLines.map((l) => ({
    ...l,
    qtyNum: Math.max(1, Number(l.qty) || 1),
    unitNum: Math.max(0, Number(l.unitPrice) || 0),
  }));
  const productTotal = parsedLines.reduce((s, l) => s + l.qtyNum * l.unitNum, 0);
  const grandTotal = freightAmount + productTotal;

  const addLine = () => setProductLines((prev) => [...prev, newLine()]);
  const removeLine = (lineId: number) =>
    setProductLines((prev) => prev.filter((l) => l.id !== lineId));
  const updateLine = (lineId: number, field: keyof Omit<ProductLine, "id">, value: string) =>
    setProductLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)),
    );

  return (
    <>
      {/* Controls — hidden on print */}
      <div className="no-print flex items-center gap-3 mb-6">
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
          fontSize: 13,
          color: "#212529",
          background: "white",
          maxWidth: 760,
          margin: "0 auto",
          padding: "28px 36px",
          border: `1px solid ${BORDER}`,
          borderRadius: 4,
        }}
      >
        {/* ── TOP ROW: Company + INVOICE title ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={logoUrl}
              alt="Maya"
              style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 4 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>{CO.name}</div>
              <div style={{ color: GRAY, fontSize: 11, marginTop: 1 }}>{CO.address1}</div>
              <div style={{ color: GRAY, fontSize: 11 }}>{CO.address2}</div>
              <div style={{ color: GRAY, fontSize: 11 }}>{CO.phone}</div>
              <div style={{ color: GRAY, fontSize: 11 }}>{CO.email}</div>
              <div style={{ color: GRAY, fontSize: 11 }}>{CO.website}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: BLUE, letterSpacing: 1 }}>INVOICE</div>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, marginBottom: 16 }} />

        {/* ── BILL TO + INVOICE META ── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: GRAY, marginBottom: 4, letterSpacing: 0.8 }}>
              Bill To
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#212529" }}>{billToName}</div>
            {billToEmail && <div style={{ color: GRAY, fontSize: 11, marginTop: 1 }}>{billToEmail}</div>}
          </div>
          <div style={{ minWidth: 210 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 8px 3px 0", fontSize: 11, color: GRAY, fontWeight: 600, whiteSpace: "nowrap" }}>Invoice #</td>
                  <td style={{ padding: "3px 0", fontSize: 11, color: "#212529", textAlign: "right" }}>{data.trackingId}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 8px 3px 0", fontSize: 11, color: GRAY, fontWeight: 600 }}>Invoice Date</td>
                  <td style={{ padding: "3px 0", fontSize: 11, color: "#212529", textAlign: "right" }}>{invoiceDate}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 8px 3px 0", fontSize: 11, color: GRAY, fontWeight: 600 }}>Payment Terms</td>
                  <td style={{ padding: "3px 0", fontSize: 11, color: data.paid ? "#198754" : "#212529", fontWeight: data.paid ? 700 : 400, textAlign: "right" }}>
                    {paymentTerms}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SHIPMENT ROUTE & DETAILS ── */}
        <div style={{ background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: GRAY, marginBottom: 6, letterSpacing: 0.8 }}>
            Shipment Route &amp; Details
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 24px" }}>
            <div>
              <div style={{ fontSize: 10, color: GRAY }}>Origin</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#212529" }}>{data.origin}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: GRAY }}>Destination</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#212529" }}>{data.destination}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: GRAY }}>Weight</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#212529" }}>{data.weight} kg</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: GRAY }}>Sender</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#212529" }}>{data.senderName}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: GRAY }}>Tracking ID</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#212529", fontFamily: "monospace" }}>{data.trackingId}</div>
            </div>
            {data.notes && (
              <div>
                <div style={{ fontSize: 10, color: GRAY }}>Notes</div>
                <div style={{ fontSize: 12, color: "#212529" }}>{data.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── FREIGHT LINE ITEM ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}>
          <thead>
            <tr style={{ background: BLUE, color: "white" }}>
              <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, fontSize: 11 }}>Item / Description</th>
              <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 600, fontSize: 11, width: 60 }}>Qty</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 600, fontSize: 11, width: 110 }}>Rate (NPR)</th>
              <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 600, fontSize: 11, width: 110 }}>Amount (NPR)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: LIGHT }}>
              <td style={{ padding: "9px 10px", fontSize: 12, color: "#212529" }}>
                Freight Charge: {data.origin} → {data.destination}
              </td>
              <td style={{ padding: "9px 10px", fontSize: 12, textAlign: "center", color: "#212529" }}>1</td>
              <td style={{ padding: "9px 10px", fontSize: 12, textAlign: "right", color: "#212529" }}>
                {formatNPR(freightAmount)}
              </td>
              <td style={{ padding: "9px 10px", fontSize: 12, textAlign: "right", color: "#212529", fontWeight: 600 }}>
                {formatNPR(freightAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── PRODUCT DETAILS ── */}
        <div style={{ marginTop: 16, marginBottom: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: GRAY, marginBottom: 6, letterSpacing: 0.8 }}>
            Product Details
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e9ecef" }}>
                <th style={{ textAlign: "left", padding: "7px 10px", fontWeight: 600, fontSize: 11, color: "#212529" }}>Product Name</th>
                <th style={{ textAlign: "center", padding: "7px 10px", fontWeight: 600, fontSize: 11, color: "#212529", width: 70 }}>Qty</th>
                <th style={{ textAlign: "right", padding: "7px 10px", fontWeight: 600, fontSize: 11, color: "#212529", width: 120 }}>Per Piece (NPR)</th>
                <th style={{ textAlign: "right", padding: "7px 10px", fontWeight: 600, fontSize: 11, color: "#212529", width: 120 }}>Total (NPR)</th>
                <th className="no-print" style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {parsedLines.map((line, idx) => (
                <tr key={line.id} style={{ background: idx % 2 === 0 ? "white" : LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                  {/* Product Name */}
                  <td style={{ padding: "5px 8px" }}>
                    <span className="no-print">
                      <Input
                        value={line.name}
                        onChange={(e) => updateLine(line.id, "name", e.target.value)}
                        placeholder="Product name"
                        style={{ fontSize: 12, height: 28, padding: "0 6px" }}
                      />
                    </span>
                    <span className="print-only" style={{ fontSize: 12, color: "#212529" }}>
                      {line.name || "—"}
                    </span>
                  </td>
                  {/* Qty */}
                  <td style={{ padding: "5px 8px", textAlign: "center" }}>
                    <span className="no-print">
                      <Input
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, "qty", e.target.value)}
                        style={{ fontSize: 12, height: 28, padding: "0 6px", textAlign: "center", width: 54 }}
                      />
                    </span>
                    <span className="print-only" style={{ fontSize: 12, color: "#212529" }}>
                      {line.qtyNum}
                    </span>
                  </td>
                  {/* Unit Price */}
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>
                    <span className="no-print" style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Input
                        type="number"
                        min={0}
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.id, "unitPrice", e.target.value)}
                        style={{ fontSize: 12, height: 28, padding: "0 6px", textAlign: "right", width: 100 }}
                      />
                    </span>
                    <span className="print-only" style={{ fontSize: 12, color: "#212529" }}>
                      {formatNPR(line.unitNum)}
                    </span>
                  </td>
                  {/* Line Total */}
                  <td style={{ padding: "5px 8px", fontSize: 12, textAlign: "right", fontWeight: 600, color: "#212529" }}>
                    {formatNPR(line.qtyNum * line.unitNum)}
                  </td>
                  {/* Remove */}
                  <td className="no-print" style={{ padding: "5px 4px", textAlign: "center" }}>
                    {parsedLines.length > 1 && (
                      <button
                        onClick={() => removeLine(line.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", padding: 2 }}
                        title="Remove row"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add new line button */}
          <div className="no-print" style={{ marginTop: 6 }}>
            <button
              onClick={addLine}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: BLUE,
                background: "none",
                border: `1px dashed ${BLUE}`,
                borderRadius: 4,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              <Plus size={13} /> Add new line
            </button>
          </div>
        </div>

        {/* ── TOTALS ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <table style={{ borderCollapse: "collapse", minWidth: 240 }}>
            <tbody>
              <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: "6px 12px", fontSize: 12, color: GRAY }}>Freight Subtotal</td>
                <td style={{ padding: "6px 12px", fontSize: 12, textAlign: "right", color: "#212529" }}>
                  {formatNPR(freightAmount)}
                </td>
              </tr>
              {productTotal > 0 && (
                <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "6px 12px", fontSize: 12, color: GRAY }}>Products Subtotal</td>
                  <td style={{ padding: "6px 12px", fontSize: 12, textAlign: "right", color: "#212529" }}>
                    {formatNPR(productTotal)}
                  </td>
                </tr>
              )}
              <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: "6px 12px", fontSize: 12, color: GRAY }}>Tax</td>
                <td style={{ padding: "6px 12px", fontSize: 12, textAlign: "right", color: "#212529" }}>NPR 0.00</td>
              </tr>
              <tr style={{ borderTop: `2px solid ${BLUE}`, background: BLUE }}>
                <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "white" }}>Total</td>
                <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 700, textAlign: "right", color: "white" }}>
                  {formatNPR(grandTotal)}
                </td>
              </tr>
              {data.paid && (
                <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "6px 12px", fontSize: 12, color: "#198754", fontWeight: 600 }}>Amount Paid</td>
                  <td style={{ padding: "6px 12px", fontSize: 12, textAlign: "right", color: "#198754", fontWeight: 600 }}>
                    {formatNPR(grandTotal)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── NOTES ── */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: GRAY, marginBottom: 4, letterSpacing: 0.8 }}>
            Notes
          </div>
          <div style={{ fontSize: 12, color: "#212529", lineHeight: 1.5 }}>
            Thank you for choosing Maya Import Export Logistic.
          </div>
        </div>

        {/* ── SIGNATURE ── */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 11, color: GRAY, fontStyle: "italic" }}>
            Generated by Maya Import Export Logistic System
          </div>
          <div style={{ textAlign: "center", minWidth: 200 }}>
            <div style={{ height: 36, borderBottom: `1px solid #212529`, marginBottom: 4 }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: "#212529" }}>Authorized Signature</div>
            <div style={{ fontSize: 11, color: GRAY, marginTop: 1 }}>{CO.name}</div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-only { display: inline !important; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          body > * { display: none !important; }
          #invoice-doc {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 198mm !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 6mm !important;
            margin: 0 !important;
            font-size: 9.5px !important;
            line-height: 1.3 !important;
            overflow: visible !important;
          }
          #invoice-doc table { page-break-inside: avoid !important; }
          #invoice-doc tr { page-break-inside: avoid !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
