import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ArrowLeft, Printer, FileText, RefreshCw, Plus, Trash2, Upload, ImageIcon } from "lucide-react";

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

interface LineItem {
  id: number;
  name: string;
  quantity: string;
  rate: string;
}

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
  trackingId: string;
  extraNotes: string;
  logoUrl: string; // base64 data URL or empty
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
  trackingId: "",
  extraNotes: "",
  logoUrl: "",
};

let nextId = 2;
const defaultItems = (prefill?: Partial<{ name: string; cost: string }>): LineItem[] => [
  {
    id: 1,
    name: prefill?.name ?? "",
    quantity: "1",
    rate: prefill?.cost ?? "",
  },
];

function parseSearchParams(search: string): { form: Partial<InvoiceForm>; firstItem: Partial<{ name: string; cost: string }> } {
  const p = new URLSearchParams(search);
  const form: Partial<InvoiceForm> = {};
  const firstItem: Partial<{ name: string; cost: string }> = {};

  if (p.get("trackingId")) form.trackingId = p.get("trackingId")!;
  if (p.get("origin")) form.origin = p.get("origin")!;
  if (p.get("destination")) form.destination = p.get("destination")!;
  if (p.get("senderName")) form.senderName = p.get("senderName")!;
  if (p.get("senderPhone")) form.senderPhone = p.get("senderPhone")!;
  if (p.get("receiverName")) form.receiverName = p.get("receiverName")!;
  if (p.get("receiverPhone")) form.receiverPhone = p.get("receiverPhone")!;
  if (p.get("billToName")) form.billToName = p.get("billToName")!;
  if (p.get("billToEmail")) form.billToEmail = p.get("billToEmail")!;
  if (p.get("date")) form.invoiceDate = p.get("date")!;
  if (p.get("paid") === "true") form.paymentTerms = "Payment Received";
  else if (p.get("paid") === "false") form.paymentTerms = "Due on Receipt";

  // Build default line item from shipment data
  const origin = p.get("origin") ?? "";
  const destination = p.get("destination") ?? "";
  const weight = p.get("weight") ?? "";
  const trackingId = p.get("trackingId") ?? "";
  const cost = p.get("cost") ?? "";

  if (origin && destination) {
    firstItem.name = `Freight: ${origin} → ${destination}${weight ? ` (${weight} kg` : ""}${trackingId ? ` · ${trackingId}` : ""}${weight ? ")" : ""}`;
  }
  if (cost) firstItem.cost = cost;

  return { form, firstItem };
}

function formatNPR(n: number) {
  if (!isFinite(n)) return "Rs. 0.00";
  return `Rs. ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
}

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [items, setItems] = useState<LineItem[]>(() => defaultItems());
  const [showPreview, setShowPreview] = useState(false);
  const fromShipment = search.includes("trackingId=");

  useEffect(() => {
    const { form: prefillForm, firstItem } = parseSearchParams(search);
    if (Object.keys(prefillForm).length > 0) {
      setForm({ ...emptyForm, ...prefillForm });
      setItems(defaultItems(firstItem));
      setShowPreview(false);
    }
  }, [search]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm((prev) => ({ ...prev, logoUrl: "" }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  // Line item helpers
  const updateItem = (id: number, field: keyof LineItem, value: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const addItem = () => {
    setItems((prev) => [...prev, { id: nextId++, name: "", quantity: "1", rate: "" }]);
  };
  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Totals
  const subtotal = items.reduce((sum, it) => {
    const qty = Number(it.quantity) || 0;
    const rate = Number(it.rate) || 0;
    return sum + qty * rate;
  }, 0);
  const total = subtotal;

  const invoiceDateDisplay = form.invoiceDate
    ? format(new Date(form.invoiceDate + "T00:00:00"), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");

  const notes = [
    form.senderName ? `Sender: ${form.senderName}${form.senderPhone ? " · " + form.senderPhone : ""}` : "",
    form.receiverName ? `Receiver: ${form.receiverName}${form.receiverPhone ? " · " + form.receiverPhone : ""}` : "",
    "Thank you for choosing Maya Import Export Logistic.",
    form.extraNotes || "",
  ].filter(Boolean).join("\n");

  const handlePrint = () => {
    setShowPreview(true);
    setTimeout(() => window.print(), 400);
  };

  const handleClear = () => {
    setForm(emptyForm);
    setItems(defaultItems());
    setShowPreview(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const BASE = import.meta.env.BASE_URL;

  // ── INVOICE DOCUMENT (reused for preview & print) ──
  const InvoiceDoc = () => (
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        {/* Logo + company */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="Logo" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 4 }} />
          ) : (
            <img
              src={`${BASE}maya-logo.jpeg`}
              alt="Maya"
              style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#212529" }}>{CO.name}</div>
            <div style={{ color: GRAY, fontSize: 12, marginTop: 2 }}>{CO.address1}</div>
            <div style={{ color: GRAY, fontSize: 12 }}>{CO.address2}</div>
            <div style={{ color: GRAY, fontSize: 12 }}>{CO.phone}</div>
            <div style={{ color: GRAY, fontSize: 12 }}>{CO.email}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: BLUE, letterSpacing: 1 }}>INVOICE</div>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, marginBottom: 24 }} />

      {/* BILL TO + META */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, gap: 32 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, marginBottom: 6, letterSpacing: 0.8 }}>
            Bill To
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#212529" }}>{form.billToName || "—"}</div>
          {form.billToEmail && <div style={{ color: GRAY, fontSize: 13, marginTop: 2 }}>{form.billToEmail}</div>}
        </div>
        <div style={{ minWidth: 220 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <tbody>
              {form.trackingId && (
                <tr>
                  <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Invoice #</td>
                  <td style={{ padding: "4px 0", fontSize: 12, color: "#212529", textAlign: "right" as const }}>{form.trackingId}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Invoice Date</td>
                <td style={{ padding: "4px 0", fontSize: 12, color: "#212529", textAlign: "right" as const }}>{invoiceDateDisplay}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Payment Terms</td>
                <td style={{ padding: "4px 0", fontSize: 12, color: form.paymentTerms === "Payment Received" ? "#198754" : "#212529", fontWeight: form.paymentTerms === "Payment Received" ? 700 : 400, textAlign: "right" as const }}>
                  {form.paymentTerms}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* LINE ITEMS TABLE */}
      <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
        <thead>
          <tr style={{ background: BLUE, color: "white" }}>
            <th style={{ textAlign: "left" as const, padding: "10px 12px", fontWeight: 600, fontSize: 12 }}>Item</th>
            <th style={{ textAlign: "center" as const, padding: "10px 12px", fontWeight: 600, fontSize: 12, width: 80 }}>Quantity</th>
            <th style={{ textAlign: "right" as const, padding: "10px 12px", fontWeight: 600, fontSize: 12, width: 120 }}>Rate</th>
            <th style={{ textAlign: "right" as const, padding: "10px 12px", fontWeight: 600, fontSize: 12, width: 120 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
            return (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? LIGHT : "white", borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "#212529" }}>{item.name || "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "center" as const, color: "#212529" }}>{item.quantity}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "right" as const, color: "#212529" }}>{formatNPR(Number(item.rate) || 0)}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "right" as const, color: "#212529", fontWeight: 600 }}>{formatNPR(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* TOTALS */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 0 }}>
        <table style={{ borderCollapse: "collapse" as const, minWidth: 260 }}>
          <tbody>
            <tr style={{ borderTop: `1px solid ${BORDER}` }}>
              <td style={{ padding: "8px 12px", fontSize: 13, color: GRAY }}>Subtotal</td>
              <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" as const, color: "#212529" }}>{formatNPR(subtotal)}</td>
            </tr>
            <tr style={{ borderTop: `1px solid ${BORDER}` }}>
              <td style={{ padding: "8px 12px", fontSize: 13, color: GRAY }}>Tax</td>
              <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" as const, color: "#212529" }}>NPR 0.00</td>
            </tr>
            <tr style={{ borderTop: `2px solid ${BLUE}`, background: BLUE }}>
              <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: "white" }}>Total</td>
              <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, textAlign: "right" as const, color: "white" }}>{formatNPR(total)}</td>
            </tr>
            {form.paymentTerms === "Payment Received" && (
              <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: "8px 12px", fontSize: 13, color: "#198754", fontWeight: 600 }}>Amount Paid</td>
                <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" as const, color: "#198754", fontWeight: 600 }}>{formatNPR(total)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NOTES */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, marginBottom: 6, letterSpacing: 0.8 }}>Notes</div>
        <div style={{ fontSize: 13, color: "#212529", whiteSpace: "pre-line" as const, lineHeight: 1.6 }}>{notes}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── FORM (hidden on print) ── */}
      <div className="no-print space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setLocation("/shipments")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              {fromShipment ? "Invoice — Edit & Print" : "Create Invoice"}
            </h1>
          </div>
          {fromShipment && (
            <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 font-medium">
              Pre-filled · {form.trackingId}
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-8 space-y-7">

          {/* ── LOGO UPLOAD ── */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Logo</h2>
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors flex-shrink-0"
                onClick={() => logoInputRef.current?.click()}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-6 w-6 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-400 mt-1">Click to upload</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" /> Choose Logo File
                </Button>
                {form.logoUrl && (
                  <Button type="button" variant="ghost" size="sm" className="gap-2 text-red-500 hover:text-red-600" onClick={removeLogo}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
                <p className="text-xs text-gray-400">PNG, JPG or SVG. Will appear on the invoice.</p>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          {/* ── BILL TO ── */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name <span className="text-primary">*</span></label>
                <Input name="billToName" value={form.billToName} onChange={handleChange} placeholder="e.g. Ram Bahadur Thapa" className="h-10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                <Input name="billToEmail" type="email" value={form.billToEmail} onChange={handleChange} placeholder="customer@example.com" className="h-10" />
              </div>
            </div>
          </div>

          {/* ── INVOICE META ── */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice # / Tracking ID</label>
                <Input name="trackingId" value={form.trackingId} onChange={handleChange} placeholder="e.g. MIECB487BRG" className="h-10 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <Input name="invoiceDate" type="date" value={form.invoiceDate} onChange={handleChange} className="h-10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <select name="paymentTerms" value={form.paymentTerms} onChange={handleChange} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option>Payment Received</option>
                  <option>Due on Receipt</option>
                  <option>Net 7</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── LINE ITEMS ── */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Items / Products</h2>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-xs uppercase tracking-wider text-gray-500">
                    <th className="text-left px-4 py-3 font-semibold">Item / Description</th>
                    <th className="text-center px-4 py-3 font-semibold w-24">Qty</th>
                    <th className="text-right px-4 py-3 font-semibold w-32">Rate (NPR)</th>
                    <th className="text-right px-4 py-3 font-semibold w-32">Amount</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                    return (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, "name", e.target.value)}
                            placeholder="e.g. Freight: Kathmandu → Tokyo (5 kg)"
                            className="h-9 border-gray-200"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                            className="h-9 text-center border-gray-200"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, "rate", e.target.value)}
                            placeholder="0"
                            className="h-9 text-right border-gray-200"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-secondary whitespace-nowrap">
                          {formatNPR(lineTotal)}
                        </td>
                        <td className="px-2 py-2">
                          {items.length > 1 && (
                            <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-4 py-2">
                      <Button type="button" variant="ghost" size="sm" onClick={addItem} className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8">
                        <Plus className="h-3.5 w-3.5" /> Add Line Item
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-500 font-medium">Subtotal</td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-secondary">{formatNPR(subtotal)}</td>
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-500 font-medium">Tax</td>
                    <td className="px-4 py-2 text-right text-sm text-gray-500">NPR 0.00</td>
                    <td />
                  </tr>
                  <tr className="border-t border-gray-200 bg-blue-600 text-white">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-bold">{formatNPR(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── SENDER / RECEIVER ── */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sender & Receiver</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                <Input name="senderName" value={form.senderName} onChange={handleChange} placeholder="Full name" className="h-10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender Phone</label>
                <Input name="senderPhone" value={form.senderPhone} onChange={handleChange} placeholder="+977 98..." className="h-10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name</label>
                <Input name="receiverName" value={form.receiverName} onChange={handleChange} placeholder="Full name" className="h-10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Phone</label>
                <Input name="receiverPhone" value={form.receiverPhone} onChange={handleChange} placeholder="+81 90..." className="h-10" />
              </div>
            </div>
          </div>

          {/* ── NOTES ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              name="extraNotes"
              value={form.extraNotes}
              onChange={handleChange}
              rows={2}
              placeholder="Any extra notes..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* ── ACTIONS ── */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            <Button
              onClick={() => { setShowPreview(true); setTimeout(() => document.getElementById("invoice-preview")?.scrollIntoView({ behavior: "smooth" }), 50); }}
              className="bg-secondary hover:bg-secondary/90 text-white gap-2"
            >
              <FileText className="h-4 w-4" /> Preview Invoice
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Printer className="h-4 w-4" /> Print / Save PDF
            </Button>
            <Button variant="outline" onClick={handleClear} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* ── INVOICE PREVIEW ── */}
      {showPreview && (
        <div id="invoice-preview" className="mt-8 no-print">
          <InvoiceDoc />
        </div>
      )}

      {/* Print-only invoice (always rendered but hidden) */}
      <div className="print-only" style={{ display: "none" }}>
        <InvoiceDoc />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
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
