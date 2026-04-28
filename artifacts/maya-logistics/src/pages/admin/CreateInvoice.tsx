import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ArrowLeft, Printer, FileText, RefreshCw } from "lucide-react";
import { formatNPR } from "@/lib/utils";

const CO = {
  name: "Maya Import Export Logistic",
  address1: "Anandamaya Marg, Dhumbarahi",
  address2: "Kathmandu, Nepal",
  phone: "Tel: 9769686908",
  email: "mayaimportexportinternational@gmail.com",
};

const BLUE = "#007bff";
const GRAY = "#555555";
const LIGHT = "#f8f9fa";
const BORDER = "#dee2e6";

interface InvoiceForm {
  invoiceDate: string;
  paymentTerms: string;
  billToName: string;
  billToEmail: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  origin: string;
  destination: string;
  weight: string;
  cost: string;
  trackingId: string;
  extraNotes: string;
}

const today = format(new Date(), "yyyy-MM-dd");

const emptyForm: InvoiceForm = {
  invoiceDate: today,
  paymentTerms: "Payment Received",
  billToName: "",
  billToEmail: "",
  senderName: "",
  senderPhone: "",
  receiverName: "",
  receiverPhone: "",
  origin: "",
  destination: "",
  weight: "",
  cost: "",
  trackingId: "",
  extraNotes: "",
};

function parseSearchParams(search: string): Partial<InvoiceForm> {
  const p = new URLSearchParams(search);
  const result: Partial<InvoiceForm> = {};
  if (p.get("trackingId")) result.trackingId = p.get("trackingId")!;
  if (p.get("origin")) result.origin = p.get("origin")!;
  if (p.get("destination")) result.destination = p.get("destination")!;
  if (p.get("weight")) result.weight = p.get("weight")!;
  if (p.get("cost")) result.cost = p.get("cost")!;
  if (p.get("senderName")) result.senderName = p.get("senderName")!;
  if (p.get("senderPhone")) result.senderPhone = p.get("senderPhone")!;
  if (p.get("receiverName")) result.receiverName = p.get("receiverName")!;
  if (p.get("receiverPhone")) result.receiverPhone = p.get("receiverPhone")!;
  if (p.get("billToName")) result.billToName = p.get("billToName")!;
  if (p.get("billToEmail")) result.billToEmail = p.get("billToEmail")!;
  if (p.get("date")) result.invoiceDate = p.get("date")!;
  if (p.get("paid") === "true") result.paymentTerms = "Payment Received";
  else if (p.get("paid") === "false") result.paymentTerms = "Due on Receipt";
  return result;
}

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [form, setForm] = useState<InvoiceForm>(() => ({
    ...emptyForm,
    ...parseSearchParams(search),
  }));
  const [showPreview, setShowPreview] = useState(false);

  // Re-parse if URL params change (e.g. navigating from a different shipment)
  useEffect(() => {
    const prefill = parseSearchParams(search);
    if (Object.keys(prefill).length > 0) {
      setForm({ ...emptyForm, ...prefill });
      setShowPreview(false);
    }
  }, [search]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const amount = Number(form.cost) || 0;
  const invoiceDateDisplay = form.invoiceDate
    ? format(new Date(form.invoiceDate + "T00:00:00"), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");

  const itemDescription =
    form.origin && form.destination
      ? `Freight: ${form.origin} → ${form.destination}${form.weight ? ` (${form.weight} kg` : ""}${form.trackingId ? ` · ${form.trackingId}` : ""}${form.weight ? ")" : ""}`
      : "Freight Service";

  const notes = [
    form.senderName
      ? `Sender: ${form.senderName}${form.senderPhone ? " · " + form.senderPhone : ""}`
      : "",
    form.receiverName
      ? `Receiver: ${form.receiverName}${form.receiverPhone ? " · " + form.receiverPhone : ""}`
      : "",
    "Thank you for choosing Maya Import Export Logistic.",
    form.extraNotes || "",
  ]
    .filter(Boolean)
    .join("\n");

  const handlePrint = () => {
    setShowPreview(true);
    setTimeout(() => window.print(), 400);
  };

  const BASE = import.meta.env.BASE_URL;
  const fromShipment = search.includes("trackingId=");

  return (
    <>
      {/* ── CONTROLS (hidden on print) ── */}
      <div className="no-print space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setLocation("/shipments")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Shipments
            </Button>
            <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              {fromShipment ? "Invoice — Edit & Print" : "Create Invoice"}
            </h1>
          </div>
          {fromShipment && (
            <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 font-medium">
              Pre-filled from shipment {form.trackingId}
            </span>
          )}
        </div>

        {/* ── FORM ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-8">

          {/* Bill To */}
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Bill To (Customer)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-primary">*</span>
                </label>
                <Input
                  name="billToName"
                  value={form.billToName}
                  onChange={handleChange}
                  placeholder="e.g. Ram Bahadur Thapa"
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email
                </label>
                <Input
                  name="billToEmail"
                  type="email"
                  value={form.billToEmail}
                  onChange={handleChange}
                  placeholder="customer@example.com"
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Invoice meta */}
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Invoice Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice # / Tracking ID
                </label>
                <Input
                  name="trackingId"
                  value={form.trackingId}
                  onChange={handleChange}
                  placeholder="e.g. MIECB487BRG"
                  className="h-10 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date
                </label>
                <Input
                  name="invoiceDate"
                  type="date"
                  value={form.invoiceDate}
                  onChange={handleChange}
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <select
                  name="paymentTerms"
                  value={form.paymentTerms}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option>Payment Received</option>
                  <option>Due on Receipt</option>
                  <option>Net 7</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                </select>
              </div>
            </div>
          </div>

          {/* Shipment details */}
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Shipment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin <span className="text-primary">*</span>
                </label>
                <Input
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  placeholder="Kathmandu"
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination <span className="text-primary">*</span>
                </label>
                <Input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="Tokyo"
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <Input
                  name="weight"
                  type="number"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="5"
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost (NPR) <span className="text-primary">*</span>
                </label>
                <Input
                  name="cost"
                  type="number"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="15000"
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Sender / Receiver */}
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Sender & Receiver
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                <Input
                  name="senderName"
                  value={form.senderName}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender Phone</label>
                <Input
                  name="senderPhone"
                  value={form.senderPhone}
                  onChange={handleChange}
                  placeholder="+977 98..."
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name</label>
                <Input
                  name="receiverName"
                  value={form.receiverName}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receiver Phone
                </label>
                <Input
                  name="receiverPhone"
                  value={form.receiverPhone}
                  onChange={handleChange}
                  placeholder="+81 90..."
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Extra notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="extraNotes"
              value={form.extraNotes}
              onChange={handleChange}
              rows={2}
              placeholder="Any extra notes to add to the invoice..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            <Button
              onClick={() => { setShowPreview(true); setTimeout(() => { document.getElementById("invoice-preview")?.scrollIntoView({ behavior: "smooth" }); }, 50); }}
              className="bg-secondary hover:bg-secondary/90 text-white gap-2"
            >
              <FileText className="h-4 w-4" /> Preview Invoice
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => { setForm(emptyForm); setShowPreview(false); }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* ── INVOICE PREVIEW ── */}
      {showPreview && (
        <div id="invoice-preview" className="mt-8">
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
            {/* TOP ROW */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 32,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <img
                  src={`${BASE}maya-logo.jpeg`}
                  alt="Maya"
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#212529" }}>
                    {CO.name}
                  </div>
                  <div style={{ color: GRAY, fontSize: 12, marginTop: 2 }}>{CO.address1}</div>
                  <div style={{ color: GRAY, fontSize: 12 }}>{CO.address2}</div>
                  <div style={{ color: GRAY, fontSize: 12 }}>{CO.phone}</div>
                  <div style={{ color: GRAY, fontSize: 12 }}>{CO.email}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: BLUE, letterSpacing: 1 }}>
                  INVOICE
                </div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, marginBottom: 24 }} />

            {/* BILL TO + META */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 32,
                gap: 32,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase" as const,
                    color: GRAY,
                    marginBottom: 6,
                    letterSpacing: 0.8,
                  }}
                >
                  Bill To
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#212529" }}>
                  {form.billToName || "—"}
                </div>
                {form.billToEmail && (
                  <div style={{ color: GRAY, fontSize: 13, marginTop: 2 }}>
                    {form.billToEmail}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 220 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                  <tbody>
                    {form.trackingId && (
                      <tr>
                        <td
                          style={{
                            padding: "4px 8px 4px 0",
                            fontSize: 12,
                            color: GRAY,
                            fontWeight: 600,
                          }}
                        >
                          Invoice #
                        </td>
                        <td
                          style={{
                            padding: "4px 0",
                            fontSize: 12,
                            color: "#212529",
                            textAlign: "right" as const,
                          }}
                        >
                          {form.trackingId}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td
                        style={{
                          padding: "4px 8px 4px 0",
                          fontSize: 12,
                          color: GRAY,
                          fontWeight: 600,
                        }}
                      >
                        Invoice Date
                      </td>
                      <td
                        style={{
                          padding: "4px 0",
                          fontSize: 12,
                          color: "#212529",
                          textAlign: "right" as const,
                        }}
                      >
                        {invoiceDateDisplay}
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "4px 8px 4px 0",
                          fontSize: 12,
                          color: GRAY,
                          fontWeight: 600,
                        }}
                      >
                        Payment Terms
                      </td>
                      <td
                        style={{
                          padding: "4px 0",
                          fontSize: 12,
                          color:
                            form.paymentTerms === "Payment Received" ? "#198754" : "#212529",
                          fontWeight: form.paymentTerms === "Payment Received" ? 700 : 400,
                          textAlign: "right" as const,
                        }}
                      >
                        {form.paymentTerms}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* LINE ITEMS */}
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ background: BLUE, color: "white" }}>
                  <th
                    style={{
                      textAlign: "left" as const,
                      padding: "10px 12px",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    Item
                  </th>
                  <th
                    style={{
                      textAlign: "center" as const,
                      padding: "10px 12px",
                      fontWeight: 600,
                      fontSize: 12,
                      width: 70,
                    }}
                  >
                    Quantity
                  </th>
                  <th
                    style={{
                      textAlign: "right" as const,
                      padding: "10px 12px",
                      fontWeight: 600,
                      fontSize: 12,
                      width: 110,
                    }}
                  >
                    Rate
                  </th>
                  <th
                    style={{
                      textAlign: "right" as const,
                      padding: "10px 12px",
                      fontWeight: 600,
                      fontSize: 12,
                      width: 110,
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: LIGHT }}>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: 13,
                      color: "#212529",
                      verticalAlign: "top" as const,
                    }}
                  >
                    {itemDescription}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: 13,
                      textAlign: "center" as const,
                      color: "#212529",
                    }}
                  >
                    1
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: 13,
                      textAlign: "right" as const,
                      color: "#212529",
                    }}
                  >
                    {formatNPR(amount)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: 13,
                      textAlign: "right" as const,
                      color: "#212529",
                      fontWeight: 600,
                    }}
                  >
                    {formatNPR(amount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* TOTALS */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <table style={{ borderCollapse: "collapse" as const, minWidth: 240 }}>
                <tbody>
                  <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: GRAY }}>Subtotal</td>
                    <td
                      style={{
                        padding: "8px 12px",
                        fontSize: 13,
                        textAlign: "right" as const,
                        color: "#212529",
                      }}
                    >
                      {formatNPR(amount)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, color: GRAY }}>Tax</td>
                    <td
                      style={{
                        padding: "8px 12px",
                        fontSize: 13,
                        textAlign: "right" as const,
                        color: "#212529",
                      }}
                    >
                      NPR 0.00
                    </td>
                  </tr>
                  <tr style={{ borderTop: `2px solid ${BLUE}`, background: BLUE }}>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "white",
                      }}
                    >
                      Total
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: 14,
                        fontWeight: 700,
                        textAlign: "right" as const,
                        color: "white",
                      }}
                    >
                      {formatNPR(amount)}
                    </td>
                  </tr>
                  {form.paymentTerms === "Payment Received" && (
                    <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontSize: 13,
                          color: "#198754",
                          fontWeight: 600,
                        }}
                      >
                        Amount Paid
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontSize: 13,
                          textAlign: "right" as const,
                          color: "#198754",
                          fontWeight: 600,
                        }}
                      >
                        {formatNPR(amount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* NOTES */}
            <div style={{ marginTop: 32 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase" as const,
                  color: GRAY,
                  marginBottom: 6,
                  letterSpacing: 0.8,
                }}
              >
                Notes
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#212529",
                  whiteSpace: "pre-line" as const,
                  lineHeight: 1.6,
                }}
              >
                {notes}
              </div>
            </div>
          </div>
        </div>
      )}

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
            margin-top: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
