import { useState, useEffect, useRef } from "react";
import { logoUrl } from "@/lib/assets";
import { useLocation, useSearch, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateShipment,
  getListShipmentsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ArrowLeft, Printer, FileText, RefreshCw, Plus, Trash2,
  Upload, ImageIcon, Zap, CheckCircle2, ExternalLink,
  User, Package, CreditCard, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CO = {
  name: "Maya Import Export Logistic",
  address1: "Anandamaya Marg, Dhumbarahi",
  address2: "Kathmandu, Nepal",
  phone: "Tel: 014527999 | +977 9769686908",
  email: "mayaimportexportinternational@gmail.com",
  website: "www.mayaimportexport.com",
};

const BLUE = "#007bff";
const GRAY = "#555555";
const LIGHT = "#f8f9fa";
const BORDER = "#dee2e6";
const GREEN = "#198754";
const RED = "#dc3545";

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
  billToPhone: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  origin: string;
  destination: string;
  productName: string;
  productQuantity: string;
  weight: string;
  freightMode: "air" | "road" | "sea";
  estimatedDelivery: string;
  paidAmount: string;
  trackingId: string;
  extraNotes: string;
  logoUrl: string;
}

const today = format(new Date(), "yyyy-MM-dd");

const emptyForm: InvoiceForm = {
  invoiceDate: today,
  paymentTerms: "Due on Receipt",
  billToName: "",
  billToEmail: "",
  billToPhone: "",
  senderName: "",
  senderPhone: "",
  receiverName: "",
  receiverPhone: "",
  origin: "Kathmandu, Nepal",
  destination: "",
  productName: "",
  productQuantity: "1",
  weight: "",
  freightMode: "air",
  estimatedDelivery: "",
  paidAmount: "",
  trackingId: "",
  extraNotes: "",
  logoUrl: "",
};

let nextId = 2;
const defaultItems = (prefill?: { name?: string; cost?: string }): LineItem[] => [
  { id: 1, name: prefill?.name ?? "", quantity: "1", rate: prefill?.cost ?? "" },
];

function parseSearchParams(search: string) {
  const p = new URLSearchParams(search);
  const form: Partial<InvoiceForm> = {};
  const firstItem: { name?: string; cost?: string } = {};

  if (p.get("trackingId"))    form.trackingId    = p.get("trackingId")!;
  if (p.get("origin"))        form.origin         = p.get("origin")!;
  if (p.get("destination"))   form.destination    = p.get("destination")!;
  if (p.get("weight"))        form.weight         = p.get("weight")!;
  if (p.get("senderName"))    form.senderName     = p.get("senderName")!;
  if (p.get("senderPhone"))   form.senderPhone    = p.get("senderPhone")!;
  if (p.get("receiverName"))  form.receiverName   = p.get("receiverName")!;
  if (p.get("receiverPhone")) form.receiverPhone  = p.get("receiverPhone")!;
  if (p.get("billToName"))    form.billToName     = p.get("billToName")!;
  if (p.get("billToEmail"))   form.billToEmail    = p.get("billToEmail")!;
  if (p.get("date"))          form.invoiceDate    = p.get("date")!;
  if (p.get("paid") === "true")  form.paymentTerms = "Payment Received";
  if (p.get("paid") === "false") form.paymentTerms = "Due on Receipt";

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

const freightLabels: Record<string, string> = { air: "By Air", road: "By Road", sea: "By Sea" };

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const createShipment = useCreateShipment();

  const [form, setForm]               = useState<InvoiceForm>(emptyForm);
  const [items, setItems]             = useState<LineItem[]>(() => defaultItems());
  const [showPreview, setShowPreview] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const fromShipment = search.includes("trackingId=") && !search.includes("trackingId=&") && new URLSearchParams(search).get("trackingId") !== "";

  useEffect(() => {
    const { form: pf, firstItem } = parseSearchParams(search);
    if (Object.keys(pf).length > 0) {
      setForm({ ...emptyForm, ...pf });
      setItems(defaultItems(firstItem));
      setShowPreview(false);
      setGeneratedId(pf.trackingId ?? null);
    }
  }, [search]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, logoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };
  const removeLogo = () => {
    setForm((p) => ({ ...p, logoUrl: "" }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const updateItem  = (id: number, field: keyof LineItem, value: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  const addItem     = () => setItems((prev) => [...prev, { id: nextId++, name: "", quantity: "1", rate: "" }]);
  const removeItem  = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

  const subtotal    = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
  const total       = subtotal;
  const paid        = Number(form.paidAmount) || 0;
  const due         = Math.max(0, total - paid);

  const invoiceDateDisplay = form.invoiceDate
    ? format(new Date(form.invoiceDate + "T00:00:00"), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");

  const estimatedDeliveryDisplay = form.estimatedDelivery
    ? format(new Date(form.estimatedDelivery + "T00:00:00"), "MMMM d, yyyy")
    : null;

  const notesText = [
    form.senderName   ? `Sender: ${form.senderName}${form.senderPhone   ? " · " + form.senderPhone   : ""}` : "",
    form.receiverName ? `Receiver: ${form.receiverName}${form.receiverPhone ? " · " + form.receiverPhone : ""}` : "",
    "Thank you for choosing Maya Import Export Logistic.",
    form.extraNotes || "",
  ].filter(Boolean).join("\n");

  const handleGenerateTracking = () => {
    if (!form.senderName.trim() || !form.receiverName.trim() || !form.origin.trim() || !form.destination.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in Sender Name, Receiver Name, Origin and Destination before generating a tracking ID.",
        variant: "destructive",
      });
      return;
    }
    if (total <= 0) {
      toast({ title: "Missing cost", description: "Add at least one item with a rate to generate a shipment.", variant: "destructive" });
      return;
    }

    const notesParts = [
      form.extraNotes,
      items.map((i) => i.name).filter(Boolean).join(", "),
    ].filter(Boolean);

    createShipment.mutate(
      {
        data: {
          senderName:        form.senderName.trim(),
          senderPhone:       form.senderPhone.trim() || undefined,
          receiverName:      form.receiverName.trim(),
          receiverPhone:     form.receiverPhone.trim() || undefined,
          customerPhone:     form.billToPhone.trim() || undefined,
          origin:            form.origin.trim(),
          destination:       form.destination.trim(),
          productName:       form.productName.trim() || undefined,
          quantity:          Number(form.productQuantity) > 0 ? Number(form.productQuantity) : undefined,
          weight:            Number(form.weight) || 0,
          freightMode:       form.freightMode as "air" | "road" | "sea",
          cost:              total,
          paidAmount:        paid > 0 ? paid : undefined,
          estimatedDelivery: form.estimatedDelivery ? new Date(form.estimatedDelivery + "T00:00:00").toISOString() : undefined,
          notes:             notesParts.join(" | ") || undefined,
        },
      },
      {
        onSuccess: (data) => {
          const tid = (data as any).trackingId as string;
          setGeneratedId(tid);
          setForm((p) => ({ ...p, trackingId: tid, paymentTerms: paid >= total ? "Payment Received" : "Due on Receipt" }));
          setShowPreview(true);
          queryClient.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast({ title: "Tracking ID Generated!", description: `Shipment created · ${tid}` });
          setTimeout(() => document.getElementById("invoice-preview")?.scrollIntoView({ behavior: "smooth" }), 200);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.data?.error ?? err?.message ?? "Please review the form and try again.";
          toast({ title: "Failed to create shipment", description: msg, variant: "destructive" });
        },
      },
    );
  };

  const handlePrint = () => {
    setShowPreview(true);
    setTimeout(() => window.print(), 400);
  };

  const handleClear = () => {
    setForm(emptyForm);
    setItems(defaultItems());
    setShowPreview(false);
    setGeneratedId(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {text}{required && <span className="text-primary ml-0.5">*</span>}
    </label>
  );

  const SectionHeader = ({ icon: Icon, title, color = "blue" }: { icon: any; title: string; color?: string }) => (
    <div className={`flex items-center gap-2 mb-3`}>
      <Icon className={`h-4 w-4 text-${color}-600`} />
      <h2 className={`text-xs font-bold text-${color}-700 uppercase tracking-widest`}>{title}</h2>
    </div>
  );

  // ── INVOICE DOCUMENT ──
  const InvoiceDoc = () => (
    <div id="invoice-doc" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 14, color: "#212529", background: "white", maxWidth: 760, margin: "0 auto", padding: "40px 48px", border: `1px solid ${BORDER}`, borderRadius: 4 }}>

      {/* TOP */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {form.logoUrl
            ? <img src={form.logoUrl} alt="Logo" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 4 }} />
            : <img src={logoUrl} alt="Maya" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{CO.name}</div>
            <div style={{ color: GRAY, fontSize: 12, marginTop: 2 }}>{CO.address1}</div>
            <div style={{ color: GRAY, fontSize: 12 }}>{CO.address2}</div>
            <div style={{ color: GRAY, fontSize: 12 }}>{CO.phone}</div>
            <div style={{ color: GRAY, fontSize: 12 }}>{CO.email}</div>
            <div style={{ color: GRAY, fontSize: 12 }}>{CO.website}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: BLUE, letterSpacing: 1 }}>INVOICE</div>
          {form.trackingId && (
            <div style={{ fontSize: 12, color: BLUE, fontFamily: "monospace", fontWeight: 700, marginTop: 4 }}>
              #{form.trackingId}
            </div>
          )}
        </div>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, marginBottom: 24 }} />

      {/* CUSTOMER + META */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, gap: 32 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, marginBottom: 6, letterSpacing: 0.8 }}>Bill To</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{form.billToName || "—"}</div>
          {form.billToPhone && <div style={{ color: GRAY, fontSize: 13, marginTop: 2 }}>📞 {form.billToPhone}</div>}
          {form.billToEmail && <div style={{ color: GRAY, fontSize: 13, marginTop: 2 }}>✉ {form.billToEmail}</div>}
        </div>
        <div style={{ minWidth: 240 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Invoice Date</td>
                <td style={{ padding: "4px 0", fontSize: 12, textAlign: "right" as const }}>{invoiceDateDisplay}</td>
              </tr>
              {estimatedDeliveryDisplay && (
                <tr>
                  <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Est. Delivery</td>
                  <td style={{ padding: "4px 0", fontSize: 12, textAlign: "right" as const }}>{estimatedDeliveryDisplay}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Shipping Mode</td>
                <td style={{ padding: "4px 0", fontSize: 12, textAlign: "right" as const, fontWeight: 600, color: BLUE }}>{freightLabels[form.freightMode] ?? "—"}</td>
              </tr>
              {form.origin && form.destination && (
                <tr>
                  <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Route</td>
                  <td style={{ padding: "4px 0", fontSize: 12, textAlign: "right" as const }}>{form.origin} → {form.destination}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "4px 8px 4px 0", fontSize: 12, color: GRAY, fontWeight: 600 }}>Payment</td>
                <td style={{ padding: "4px 0", fontSize: 12, color: form.paymentTerms === "Payment Received" ? GREEN : "#212529", fontWeight: form.paymentTerms === "Payment Received" ? 700 : 400, textAlign: "right" as const }}>{form.paymentTerms}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCT / SHIPMENT INFO ROW */}
      {(form.productName || form.senderName || form.receiverName) && (
        <div style={{ background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 32, flexWrap: "wrap" as const }}>
          {form.productName && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, letterSpacing: 0.8, marginBottom: 2 }}>Product</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{form.productName}{form.productQuantity && Number(form.productQuantity) > 0 ? ` × ${form.productQuantity}` : ""}</div>
            </div>
          )}
          {form.senderName && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, letterSpacing: 0.8, marginBottom: 2 }}>Sender</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{form.senderName}</div>
              {form.senderPhone && <div style={{ fontSize: 12, color: GRAY }}>{form.senderPhone}</div>}
            </div>
          )}
          {form.receiverName && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, letterSpacing: 0.8, marginBottom: 2 }}>Receiver</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{form.receiverName}</div>
              {form.receiverPhone && <div style={{ fontSize: 12, color: GRAY }}>{form.receiverPhone}</div>}
            </div>
          )}
          {form.weight && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, letterSpacing: 0.8, marginBottom: 2 }}>Weight</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{form.weight} kg</div>
            </div>
          )}
        </div>
      )}

      {/* LINE ITEMS */}
      <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
        <thead>
          <tr style={{ background: BLUE, color: "white" }}>
            <th style={{ textAlign: "left" as const, padding: "10px 12px", fontWeight: 600, fontSize: 12 }}>Item / Description</th>
            <th style={{ textAlign: "center" as const, padding: "10px 12px", fontWeight: 600, fontSize: 12, width: 80 }}>Qty</th>
            <th style={{ textAlign: "right" as const, padding: "10px 12px", fontWeight: 600, fontSize: 12, width: 130 }}>Rate (NPR)</th>
            <th style={{ textAlign: "right" as const, padding: "10px 12px", fontWeight: 600, fontSize: 12, width: 130 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const lt = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
            return (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? LIGHT : "white", borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: "10px 12px", fontSize: 13 }}>{item.name || "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "center" as const }}>{item.quantity}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "right" as const }}>{formatNPR(Number(item.rate) || 0)}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "right" as const, fontWeight: 600 }}>{formatNPR(lt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* TOTALS */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <table style={{ borderCollapse: "collapse" as const, minWidth: 280 }}>
          <tbody>
            <tr style={{ borderTop: `1px solid ${BORDER}` }}>
              <td style={{ padding: "8px 12px", fontSize: 13, color: GRAY }}>Subtotal</td>
              <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" as const }}>{formatNPR(subtotal)}</td>
            </tr>
            <tr style={{ borderTop: `1px solid ${BORDER}` }}>
              <td style={{ padding: "8px 12px", fontSize: 13, color: GRAY }}>Tax</td>
              <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" as const }}>NPR 0.00</td>
            </tr>
            <tr style={{ background: BLUE }}>
              <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: "white" }}>Total</td>
              <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, textAlign: "right" as const, color: "white" }}>{formatNPR(total)}</td>
            </tr>
            {paid > 0 && (
              <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: "8px 12px", fontSize: 13, color: GREEN, fontWeight: 600 }}>Amount Paid</td>
                <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" as const, color: GREEN, fontWeight: 600 }}>{formatNPR(paid)}</td>
              </tr>
            )}
            {paid > 0 && due > 0 && (
              <tr style={{ borderTop: `1px solid ${BORDER}`, background: "#fff3cd" }}>
                <td style={{ padding: "8px 12px", fontSize: 13, color: RED, fontWeight: 700 }}>Amount Due</td>
                <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" as const, color: RED, fontWeight: 700 }}>{formatNPR(due)}</td>
              </tr>
            )}
            {paid >= total && total > 0 && (
              <tr style={{ borderTop: `1px solid ${BORDER}`, background: "#d1e7dd" }}>
                <td style={{ padding: "8px 12px", fontSize: 13, color: GREEN, fontWeight: 700 }}>PAID IN FULL</td>
                <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" as const, color: GREEN, fontWeight: 700 }}>✓</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NOTES */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, marginBottom: 6, letterSpacing: 0.8 }}>Notes</div>
        <div style={{ fontSize: 13, whiteSpace: "pre-line" as const, lineHeight: 1.6 }}>{notesText}</div>
      </div>

      {/* SIGNATURE */}
      <div style={{ marginTop: 48, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center", minWidth: 200 }}>
          <div style={{ borderTop: `1px solid #212529`, paddingTop: 8, marginTop: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#212529" }}>Authorized Signature</div>
            <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{CO.name}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="no-print space-y-6">
        {/* Header */}
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

        {/* SUCCESS BANNER */}
        {generatedId && !fromShipment && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-800">Shipment created — Tracking ID generated!</p>
              <p className="text-sm text-green-700 mt-0.5">
                Tracking ID: <span className="font-mono font-bold text-green-900 text-base">{generatedId}</span>
                <span className="mx-2 text-green-400">·</span>
                The invoice below now includes this tracking ID. Print it and share with your customer.
              </p>
            </div>
            <Link href={`/track/${generatedId}`}>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2 whitespace-nowrap">
                <ExternalLink className="h-3.5 w-3.5" /> Check Status
              </Button>
            </Link>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-8 space-y-8">

          {/* LOGO */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Company Logo</h2>
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors flex-shrink-0"
                onClick={() => logoInputRef.current?.click()}
              >
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  : <div className="text-center"><ImageIcon className="h-6 w-6 text-gray-400 mx-auto" /><p className="text-xs text-gray-400 mt-1">Click</p></div>
                }
              </div>
              <div className="space-y-2">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Choose Logo
                </Button>
                {form.logoUrl && (
                  <Button type="button" variant="ghost" size="sm" className="gap-2 text-red-500 hover:text-red-600 block" onClick={removeLogo}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
                <p className="text-xs text-gray-400">PNG, JPG or SVG</p>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>

          {/* ── CUSTOMER DETAILS ── */}
          <div className="rounded-xl border-2 border-blue-100 bg-blue-50/30 p-5">
            <SectionHeader icon={User} title="Customer Details" color="blue" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label text="Customer Name" required />
                <Input name="billToName" value={form.billToName} onChange={handleChange} placeholder="Ram Bahadur Thapa" className="h-10 bg-white" />
              </div>
              <div>
                <Label text="Phone Number" />
                <Input name="billToPhone" value={form.billToPhone} onChange={handleChange} placeholder="+977 98XXXXXXXX" className="h-10 bg-white" />
              </div>
              <div>
                <Label text="Email ID" />
                <Input name="billToEmail" type="email" value={form.billToEmail} onChange={handleChange} placeholder="customer@example.com" className="h-10 bg-white" />
              </div>
            </div>
          </div>

          {/* ── SHIPMENT ROUTE (generates tracking ID) ── */}
          <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-5">
            <SectionHeader icon={Truck} title="Shipment Route & Details" color="blue" />
            <p className="text-xs text-blue-500 mb-4">Fill these fields then click <strong>Generate Tracking ID</strong> to create the shipment and get a tracking number.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label text="Sender Name" required />
                <Input name="senderName" value={form.senderName} onChange={handleChange} placeholder="Full name" className="h-10 bg-white" />
              </div>
              <div>
                <Label text="Sender Phone" />
                <Input name="senderPhone" value={form.senderPhone} onChange={handleChange} placeholder="+977 98…" className="h-10 bg-white" />
              </div>
              <div>
                <Label text="Receiver Name" required />
                <Input name="receiverName" value={form.receiverName} onChange={handleChange} placeholder="Full name" className="h-10 bg-white" />
              </div>
              <div>
                <Label text="Receiver Phone" />
                <Input name="receiverPhone" value={form.receiverPhone} onChange={handleChange} placeholder="+81 90…" className="h-10 bg-white" />
              </div>
              <div>
                <Label text="Origin" required />
                <Input name="origin" value={form.origin} onChange={handleChange} placeholder="Kathmandu, Nepal" className="h-10 bg-white" />
              </div>
              <div>
                <Label text="Destination" required />
                <Input name="destination" value={form.destination} onChange={handleChange} placeholder="Tokyo, Japan" className="h-10 bg-white" />
              </div>
              <div>
                <Label text="Weight (kg)" />
                <Input name="weight" type="number" step="0.01" min="0" value={form.weight} onChange={handleChange} placeholder="5" className="h-10 bg-white" />
              </div>
              {/* Generate button */}
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleGenerateTracking}
                  disabled={createShipment.isPending || !!generatedId}
                  className={cn(
                    "w-full h-10 gap-2 font-bold text-sm",
                    generatedId
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700",
                    "text-white",
                  )}
                >
                  {createShipment.isPending ? (
                    <><span className="animate-spin inline-block">⏳</span> Generating…</>
                  ) : generatedId ? (
                    <><CheckCircle2 className="h-4 w-4" /> ID: {generatedId}</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Generate Tracking ID</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ── PRODUCT DETAILS ── */}
          <div className="rounded-xl border-2 border-purple-100 bg-purple-50/30 p-5">
            <SectionHeader icon={Package} title="Product Details" color="purple" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label text="Product Name" />
                <Input name="productName" value={form.productName} onChange={handleChange} placeholder="e.g. Electronics, Clothes…" className="h-10 bg-white" />
              </div>
              <div>
                <Label text="Quantity" />
                <Input name="productQuantity" type="number" min="1" value={form.productQuantity} onChange={handleChange} placeholder="1" className="h-10 bg-white" />
              </div>
            </div>
          </div>

          {/* ── SHIPPING OPTIONS ── */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Shipping Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Freight mode */}
              <div>
                <Label text="Shipping Mode" />
                <div className="flex gap-2 mt-1">
                  {(["air", "road", "sea"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, freightMode: mode }))}
                      className={cn(
                        "flex-1 h-10 rounded-lg border-2 text-sm font-semibold transition-all",
                        form.freightMode === mode
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-blue-300",
                      )}
                    >
                      {mode === "air" ? "✈ Air" : mode === "road" ? "🚛 Road" : "🚢 Sea"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Estimated delivery */}
              <div>
                <Label text="Estimated Delivery Date" />
                <Input name="estimatedDelivery" type="date" value={form.estimatedDelivery} onChange={handleChange} className="h-10" />
              </div>
            </div>
          </div>

          {/* ── INVOICE META ── */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label text="Tracking / Invoice #" />
                <Input name="trackingId" value={form.trackingId} onChange={handleChange} placeholder="Auto-filled after generation" className={cn("h-10 font-mono", generatedId ? "bg-green-50 border-green-300" : "")} readOnly={!!generatedId} />
              </div>
              <div>
                <Label text="Date of Purchase" />
                <Input name="invoiceDate" type="date" value={form.invoiceDate} onChange={handleChange} className="h-10" />
              </div>
              <div>
                <Label text="Payment Terms" />
                <select name="paymentTerms" value={form.paymentTerms} onChange={handleChange} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option>Due on Receipt</option>
                  <option>Payment Received</option>
                  <option>Net 7</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── LINE ITEMS ── */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Items / Services</h2>
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
                    const lt = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                    return (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-2">
                          <Input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder="e.g. Air Freight — Kathmandu to Tokyo" className="h-9 border-gray-200" />
                        </td>
                        <td className="px-4 py-2">
                          <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} className="h-9 text-center border-gray-200" min="1" />
                        </td>
                        <td className="px-4 py-2">
                          <Input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", e.target.value)} placeholder="0" className="h-9 text-right border-gray-200" />
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-secondary whitespace-nowrap">{formatNPR(lt)}</td>
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

          {/* ── PAYMENT SUMMARY ── */}
          <div className="rounded-xl border-2 border-green-100 bg-green-50/30 p-5">
            <SectionHeader icon={CreditCard} title="Payment Summary" color="green" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label text="Total Price (NPR)" />
                <div className="h-10 flex items-center px-3 rounded-md border border-gray-200 bg-gray-50 text-sm font-bold text-secondary">
                  {formatNPR(total)}
                </div>
              </div>
              <div>
                <Label text="Amount Paid (NPR)" />
                <Input
                  name="paidAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paidAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="h-10 bg-white"
                />
              </div>
              <div>
                <Label text="Amount Due (NPR)" />
                <div className={cn(
                  "h-10 flex items-center px-3 rounded-md border text-sm font-bold",
                  due <= 0 ? "border-green-300 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700",
                )}>
                  {due <= 0 ? "✓ Paid in Full" : formatNPR(due)}
                </div>
              </div>
            </div>
          </div>

          {/* EXTRA NOTES */}
          <div>
            <Label text="Extra Notes" />
            <textarea
              name="extraNotes"
              value={form.extraNotes}
              onChange={handleChange}
              rows={2}
              placeholder="Additional remarks…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <Button
              type="button"
              onClick={() => { setShowPreview(true); setTimeout(() => document.getElementById("invoice-preview")?.scrollIntoView({ behavior: "smooth" }), 100); }}
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" /> Preview Invoice
            </Button>
            <Button type="button" onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Printer className="h-4 w-4" /> Print / Save PDF
            </Button>
            <Button type="button" variant="ghost" onClick={handleClear} className="gap-2 text-gray-500 ml-auto">
              <RefreshCw className="h-4 w-4" /> Clear Form
            </Button>
          </div>
        </div>

        {/* PREVIEW */}
        {showPreview && (
          <div id="invoice-preview" className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 md:p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Invoice Preview</h2>
              <Button size="sm" onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </div>
            <InvoiceDoc />
          </div>
        )}
      </div>

      {/* PRINT-ONLY */}
      <div className="print-only">
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
          }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
