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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ArrowLeft, Printer, FileText, RefreshCw,
  Upload, ImageIcon, Zap, CheckCircle2, ExternalLink,
  User, Package, CreditCard, Truck, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CO = {
  name: "Maya Import Export Logistic",
  address1: "Anandamaya Marg, Dhumbarahi",
  address2: "Kathmandu, Nepal",
  phone: "Tel: 014527999 | +977 9744732123",
  email: "mayaimportexportinternational@gmail.com",
  website: "www.mayaimportexport.com",
};

const BLUE  = "#007bff";
const GRAY  = "#555555";
const LIGHT = "#f8f9fa";
const BORDER= "#dee2e6";
const GREEN = "#198754";
const RED   = "#dc3545";

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
  perPicCost: string;
  weight: string;
  freightMode: "air" | "road" | "sea";
  estimatedDelivery: string;
  shippingCost: string;
  customCost: string;
  serviceCharge: string;
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
  origin: "",
  destination: "",
  productName: "",
  productQuantity: "",
  perPicCost: "",
  weight: "",
  freightMode: "air",
  estimatedDelivery: "",
  shippingCost: "",
  customCost: "",
  serviceCharge: "",
  paidAmount: "",
  trackingId: "",
  extraNotes: "",
  logoUrl: "",
};

function parseSearchParams(search: string): Partial<InvoiceForm> {
  const p   = new URLSearchParams(search);
  const out: Partial<InvoiceForm> = {};
  if (p.get("trackingId"))    out.trackingId    = p.get("trackingId")!;
  if (p.get("origin"))        out.origin         = p.get("origin")!;
  if (p.get("destination"))   out.destination    = p.get("destination")!;
  if (p.get("weight"))        out.weight         = p.get("weight")!;
  if (p.get("senderName"))    out.senderName     = p.get("senderName")!;
  if (p.get("senderPhone"))   out.senderPhone    = p.get("senderPhone")!;
  if (p.get("receiverName"))  out.receiverName   = p.get("receiverName")!;
  if (p.get("receiverPhone")) out.receiverPhone  = p.get("receiverPhone")!;
  if (p.get("billToName"))    out.billToName     = p.get("billToName")!;
  if (p.get("billToEmail"))   out.billToEmail    = p.get("billToEmail")!;
  if (p.get("date"))          out.invoiceDate    = p.get("date")!;
  if (p.get("cost"))          out.shippingCost   = p.get("cost")!;
  if (p.get("paid") === "true")  out.paymentTerms = "Payment Received";
  if (p.get("paid") === "false") out.paymentTerms = "Due on Receipt";
  return out;
}

function n(v: string) { return Math.max(0, Number(v) || 0); }

function formatNPR(val: number) {
  if (!isFinite(val)) return "Rs. 0.00";
  return `Rs. ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
}

const freightLabel: Record<string, string> = { air: "By Air ✈", road: "By Road 🚛", sea: "By Sea 🚢" };

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const createShipment = useCreateShipment();

  const [form, setForm]               = useState<InvoiceForm>(emptyForm);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);

  /* ── Customer Details Dialog ── */
  const [cdOpen, setCdOpen] = useState(false);
  const [cd, setCd] = useState({
    name: "", whatsapp: "", email: "",
    productName: "", quantity: "", perPicCost: "",
    origin: "", destination: "",
    shippingCost: "", customCost: "", serviceCharge: "",
    paid: "",
  });
  const cdSubtotal = (Number(cd.shippingCost) || 0) + (Number(cd.customCost) || 0) + (Number(cd.serviceCharge) || 0);
  const cdDue      = Math.max(0, cdSubtotal - (Number(cd.paid) || 0));
  const setcd = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCd((p) => ({ ...p, [e.target.name]: e.target.value }));
  const openCd = () => {
    setCd({
      name:          form.billToName,
      whatsapp:      form.billToPhone,
      email:         form.billToEmail,
      productName:   form.productName,
      quantity:      form.productQuantity,
      perPicCost:    form.perPicCost,
      origin:        form.origin,
      destination:   form.destination,
      shippingCost:  form.shippingCost,
      customCost:    form.customCost,
      serviceCharge: form.serviceCharge,
      paid:          form.paidAmount,
    });
    setCdOpen(true);
  };
  const saveCd = () => {
    setForm((p) => ({
      ...p,
      billToName:      cd.name,
      billToPhone:     cd.whatsapp,
      billToEmail:     cd.email,
      /* customer is the receiver; Maya is the sender */
      receiverName:    cd.name,
      receiverPhone:   cd.whatsapp,
      senderName:      p.senderName || "Maya Import Export Logistic",
      origin:          cd.origin,
      destination:     cd.destination,
      productName:     cd.productName,
      productQuantity: cd.quantity,
      perPicCost:      cd.perPicCost,
      shippingCost:    cd.shippingCost,
      customCost:      cd.customCost,
      serviceCharge:   cd.serviceCharge,
      paidAmount:      cd.paid,
      paymentTerms:
        cd.paid && cdSubtotal > 0 && Number(cd.paid) >= cdSubtotal
          ? "Payment Received"
          : "Due on Receipt",
    }));
    setCdOpen(false);
    toast({
      title: "Customer details saved",
      description: cd.destination
        ? "All fields saved — click Generate Tracking ID to create the shipment."
        : "Saved! Add a destination then click Generate Tracking ID.",
    });
  };

  const fromShipment = (() => {
    const tid = new URLSearchParams(search).get("trackingId") ?? "";
    return search.includes("trackingId=") && tid !== "";
  })();

  useEffect(() => {
    const pf = parseSearchParams(search);
    if (Object.keys(pf).length > 0) {
      setForm({ ...emptyForm, ...pf });
      setShowPreview(false);
      setGeneratedId(pf.trackingId ?? null);
    }
  }, [search]);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, logoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };
  const removeLogo = () => { setForm((p) => ({ ...p, logoUrl: "" })); if (logoInputRef.current) logoInputRef.current.value = ""; };

  /* ── cost maths ── */
  const shipping     = n(form.shippingCost);
  const customs      = n(form.customCost);
  const service      = n(form.serviceCharge);
  const productCost  = n(form.productQuantity) * n(form.perPicCost);
  const subtotal     = shipping + customs + service + productCost;
  const total        = subtotal;
  const paid         = n(form.paidAmount);
  const due          = Math.max(0, total - paid);

  const invoiceDateDisplay = form.invoiceDate
    ? format(new Date(form.invoiceDate + "T00:00:00"), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");

  const estDeliveryDisplay = form.estimatedDelivery
    ? format(new Date(form.estimatedDelivery + "T00:00:00"), "MMMM d, yyyy")
    : null;

  /* ── Generate Tracking ID ── */
  const handleGenerateTracking = () => {
    if (!form.origin.trim() || !form.destination.trim()) {
      toast({ title: "Missing route", description: "Please fill Origin and Destination before generating.", variant: "destructive" });
      return;
    }

    /* auto-fill sender / receiver if the user skipped those fields */
    const effectiveSender   = form.senderName.trim()   || CO.name;
    const effectiveReceiver = form.receiverName.trim()  || form.billToName.trim() || form.destination.trim();

    /* keep the form in sync so the invoice preview updates too */
    if (!form.senderName.trim() || !form.receiverName.trim()) {
      setForm((p) => ({
        ...p,
        senderName:   p.senderName.trim()   || CO.name,
        receiverName: p.receiverName.trim()  || p.billToName.trim() || p.destination.trim(),
      }));
    }

    const notesParts = [
      form.productName ? `Product: ${form.productName}` : "",
      form.extraNotes,
    ].filter(Boolean);

    createShipment.mutate(
      {
        data: {
          senderName:        effectiveSender,
          senderPhone:       form.senderPhone.trim() || undefined,
          receiverName:      effectiveReceiver,
          receiverPhone:     form.receiverPhone.trim() || undefined,
          customerPhone:     form.billToPhone.trim() || undefined,
          origin:            form.origin.trim(),
          destination:       form.destination.trim(),
          productName:       form.productName.trim() || undefined,
          quantity:          Number(form.productQuantity) > 0 ? Number(form.productQuantity) : undefined,
          weight:            n(form.weight),
          freightMode:       form.freightMode,
          cost:              total > 0 ? total : 0,
          paidAmount:        paid > 0 ? paid : undefined,
          estimatedDelivery: form.estimatedDelivery
            ? new Date(form.estimatedDelivery + "T00:00:00").toISOString()
            : undefined,
          notes: notesParts.join(" | ") || undefined,
        },
      },
      {
        onSuccess: (data) => {
          const tid = (data as any).trackingId as string;
          setGeneratedId(tid);
          setForm((p) => ({
            ...p,
            trackingId: tid,
            paymentTerms: paid >= total && total > 0 ? "Payment Received" : "Due on Receipt",
          }));
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

  const handlePrint = () => { setShowPreview(true); setTimeout(() => window.print(), 400); };
  const handleClear = () => {
    setForm(emptyForm); setShowPreview(false); setGeneratedId(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  /* ── small helpers ── */
  const Lbl = ({ t, req }: { t: string; req?: boolean }) => (
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {t}{req && <span className="text-primary ml-0.5">*</span>}
    </label>
  );
  const SecHead = ({ icon: Icon, title, color = "blue" }: { icon: any; title: string; color?: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`h-4 w-4 text-${color}-600`} />
      <h2 className={`text-[11px] font-extrabold text-${color}-700 uppercase tracking-widest`}>{title}</h2>
    </div>
  );

  /* ══════════════════════════════════════════
     INVOICE DOCUMENT (screen preview + print)
  ══════════════════════════════════════════ */
  const InvoiceDoc = () => (
    <div
      id="invoice-doc"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, color: "#212529",
        background: "white", maxWidth: 760, margin: "0 auto",
        padding: "40px 48px", border: `1px solid ${BORDER}`, borderRadius: 4,
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {form.logoUrl
            ? <img src={form.logoUrl} alt="Logo" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 4 }} />
            : <img src={logoUrl}       alt="Maya" style={{ width: 64, height: 64, objectFit: "cover",    borderRadius: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{CO.name}</div>
            <div style={{ color: GRAY, fontSize: 11, marginTop: 2 }}>{CO.address1}</div>
            <div style={{ color: GRAY, fontSize: 11 }}>{CO.address2}</div>
            <div style={{ color: GRAY, fontSize: 11 }}>{CO.phone}</div>
            <div style={{ color: GRAY, fontSize: 11 }}>{CO.email}</div>
            <div style={{ color: GRAY, fontSize: 11 }}>{CO.website}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: BLUE, letterSpacing: 1 }}>INVOICE</div>
          {form.trackingId && (
            <div style={{ fontSize: 13, color: BLUE, fontFamily: "monospace", fontWeight: 700, marginTop: 4 }}>
              #{form.trackingId}
            </div>
          )}
          {!form.trackingId && (
            <div style={{ fontSize: 11, color: "#aaa", fontStyle: "italic", marginTop: 4 }}>
              No Tracking ID yet
            </div>
          )}
        </div>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, marginBottom: 22 }} />

      {/* ── BILL TO + META ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22, gap: 32 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, marginBottom: 5, letterSpacing: 0.8 }}>Bill To</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{form.billToName || "—"}</div>
          {form.billToPhone && <div style={{ color: GRAY, fontSize: 12, marginTop: 2 }}>📞 {form.billToPhone}</div>}
          {form.billToEmail && <div style={{ color: GRAY, fontSize: 12, marginTop: 2 }}>✉ {form.billToEmail}</div>}
        </div>
        <div style={{ minWidth: 240 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 8px 3px 0", fontSize: 11, color: GRAY, fontWeight: 600 }}>Invoice Date</td>
                <td style={{ padding: "3px 0", fontSize: 11, textAlign: "right" as const }}>{invoiceDateDisplay}</td>
              </tr>
              {estDeliveryDisplay && (
                <tr>
                  <td style={{ padding: "3px 8px 3px 0", fontSize: 11, color: GRAY, fontWeight: 600 }}>Est. Delivery</td>
                  <td style={{ padding: "3px 0", fontSize: 11, textAlign: "right" as const }}>{estDeliveryDisplay}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "3px 8px 3px 0", fontSize: 11, color: GRAY, fontWeight: 600 }}>Shipping Mode</td>
                <td style={{ padding: "3px 0", fontSize: 11, textAlign: "right" as const, fontWeight: 600, color: BLUE }}>{freightLabel[form.freightMode] ?? "—"}</td>
              </tr>
              {form.origin && form.destination && (
                <tr>
                  <td style={{ padding: "3px 8px 3px 0", fontSize: 11, color: GRAY, fontWeight: 600 }}>Route</td>
                  <td style={{ padding: "3px 0", fontSize: 11, textAlign: "right" as const }}>{form.origin} → {form.destination}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "3px 8px 3px 0", fontSize: 11, color: GRAY, fontWeight: 600 }}>Payment</td>
                <td style={{ padding: "3px 0", fontSize: 11, textAlign: "right" as const, fontWeight: form.paymentTerms === "Payment Received" ? 700 : 400, color: form.paymentTerms === "Payment Received" ? GREEN : "#212529" }}>
                  {form.paymentTerms}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PRODUCT / SHIPMENT INFO BAND ── */}
      {(form.productName || form.senderName || form.receiverName || form.weight) && (
        <div style={{ background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 28, flexWrap: "wrap" as const }}>
          {form.productName && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, letterSpacing: 0.8, marginBottom: 2 }}>Product</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{form.productName}{form.productQuantity && Number(form.productQuantity) > 0 ? ` × ${form.productQuantity}` : ""}</div>
            </div>
          )}
          {form.senderName && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, letterSpacing: 0.8, marginBottom: 2 }}>Sender</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{form.senderName}</div>
              {form.senderPhone && <div style={{ fontSize: 11, color: GRAY }}>{form.senderPhone}</div>}
            </div>
          )}
          {form.receiverName && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, letterSpacing: 0.8, marginBottom: 2 }}>Receiver</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{form.receiverName}</div>
              {form.receiverPhone && <div style={{ fontSize: 11, color: GRAY }}>{form.receiverPhone}</div>}
            </div>
          )}
          {form.weight && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, letterSpacing: 0.8, marginBottom: 2 }}>Weight</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{form.weight} kg</div>
            </div>
          )}
        </div>
      )}

      {/* ── COST TABLE ── */}
      <table style={{ width: "100%", borderCollapse: "collapse" as const, marginBottom: 0 }}>
        <thead>
          <tr style={{ background: BLUE, color: "white" }}>
            <th style={{ textAlign: "left" as const,  padding: "9px 12px", fontWeight: 600, fontSize: 11 }}>Description</th>
            <th style={{ textAlign: "right" as const, padding: "9px 12px", fontWeight: 600, fontSize: 11, width: 160 }}>Amount (NPR)</th>
          </tr>
        </thead>
        <tbody>
          {productCost > 0 && (
            <tr style={{ background: "white", borderBottom: `1px solid ${BORDER}` }}>
              <td style={{ padding: "9px 12px", fontSize: 12 }}>
                Product Cost
                {form.productQuantity && form.perPicCost
                  ? ` (${form.productQuantity} × Rs. ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n(form.perPicCost))})`
                  : ""}
              </td>
              <td style={{ padding: "9px 12px", fontSize: 12, textAlign: "right" as const, fontWeight: 600 }}>{formatNPR(productCost)}</td>
            </tr>
          )}
          <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
            <td style={{ padding: "9px 12px", fontSize: 12 }}>Shipping Cost</td>
            <td style={{ padding: "9px 12px", fontSize: 12, textAlign: "right" as const, fontWeight: 600 }}>{formatNPR(shipping)}</td>
          </tr>
          <tr style={{ background: "white", borderBottom: `1px solid ${BORDER}` }}>
            <td style={{ padding: "9px 12px", fontSize: 12 }}>Custom / Duties Cost</td>
            <td style={{ padding: "9px 12px", fontSize: 12, textAlign: "right" as const, fontWeight: 600 }}>{formatNPR(customs)}</td>
          </tr>
          <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
            <td style={{ padding: "9px 12px", fontSize: 12 }}>Service Charge</td>
            <td style={{ padding: "9px 12px", fontSize: 12, textAlign: "right" as const, fontWeight: 600 }}>{formatNPR(service)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style={{ borderTop: `2px solid ${BORDER}`, background: "#f0f4ff" }}>
            <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 700, color: BLUE }}>Subtotal</td>
            <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 700, color: BLUE, textAlign: "right" as const }}>{formatNPR(subtotal)}</td>
          </tr>
          <tr style={{ borderTop: `1px solid ${BORDER}` }}>
            <td style={{ padding: "7px 12px", fontSize: 12, color: GRAY }}>Tax / VAT</td>
            <td style={{ padding: "7px 12px", fontSize: 12, color: GRAY, textAlign: "right" as const }}>NPR 0.00</td>
          </tr>
          <tr style={{ background: BLUE }}>
            <td style={{ padding: "11px 12px", fontSize: 14, fontWeight: 700, color: "white" }}>Total</td>
            <td style={{ padding: "11px 12px", fontSize: 14, fontWeight: 700, color: "white", textAlign: "right" as const }}>{formatNPR(total)}</td>
          </tr>
          {paid > 0 && (
            <tr style={{ borderTop: `1px solid ${BORDER}` }}>
              <td style={{ padding: "8px 12px", fontSize: 12, color: GREEN, fontWeight: 600 }}>Amount Paid</td>
              <td style={{ padding: "8px 12px", fontSize: 12, color: GREEN, fontWeight: 600, textAlign: "right" as const }}>{formatNPR(paid)}</td>
            </tr>
          )}
          {paid > 0 && due > 0 && (
            <tr style={{ background: "#fff3cd", borderTop: `1px solid ${BORDER}` }}>
              <td style={{ padding: "8px 12px", fontSize: 13, color: RED, fontWeight: 700 }}>Amount Due</td>
              <td style={{ padding: "8px 12px", fontSize: 13, color: RED, fontWeight: 700, textAlign: "right" as const }}>{formatNPR(due)}</td>
            </tr>
          )}
          {total > 0 && paid >= total && (
            <tr style={{ background: "#d1e7dd", borderTop: `1px solid ${BORDER}` }}>
              <td style={{ padding: "8px 12px", fontSize: 13, color: GREEN, fontWeight: 700 }}>PAID IN FULL</td>
              <td style={{ padding: "8px 12px", fontSize: 13, color: GREEN, fontWeight: 700, textAlign: "right" as const }}>✓</td>
            </tr>
          )}
        </tfoot>
      </table>

      {/* ── NOTES ── */}
      {(form.senderName || form.receiverName || form.extraNotes) && (
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: GRAY, marginBottom: 5, letterSpacing: 0.8 }}>Notes</div>
          <div style={{ fontSize: 12, whiteSpace: "pre-line" as const, lineHeight: 1.7, color: "#333" }}>
            {[
              form.senderName   ? `Sender: ${form.senderName}${form.senderPhone   ? " · " + form.senderPhone   : ""}` : "",
              form.receiverName ? `Receiver: ${form.receiverName}${form.receiverPhone ? " · " + form.receiverPhone : ""}` : "",
              "Thank you for choosing Maya Import Export Logistic.",
              form.extraNotes || "",
            ].filter(Boolean).join("\n")}
          </div>
        </div>
      )}

      {/* ── SIGNATURE ── */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 11, color: GRAY, fontStyle: "italic" }}>
          Generated by Maya Import Export Logistic System
        </div>
        <div style={{ textAlign: "center", minWidth: 200 }}>
          <div style={{ height: 36, borderBottom: `1px solid #212529`, marginBottom: 4 }} />
          <div style={{ fontSize: 12, fontWeight: 700 }}>Authorized Signature</div>
          <div style={{ fontSize: 11, color: GRAY, marginTop: 1 }}>{CO.name}</div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════
     FORM UI
  ══════════════════════════════ */
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
          <div className="flex items-center gap-2">
            {fromShipment && (
              <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 font-medium">
                Pre-filled · {form.trackingId}
              </span>
            )}
            <Button
              onClick={openCd}
              className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md"
            >
              <UserPlus className="h-4 w-4" />
              Add Customer Details
            </Button>
          </div>
        </div>

        {/* Success banner */}
        {generatedId && !fromShipment && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-800">Tracking ID generated!</p>
              <p className="text-sm text-green-700 mt-0.5">
                Tracking ID: <span className="font-mono font-bold text-green-900 text-base">{generatedId}</span>
                <span className="mx-2 text-green-400">·</span>
                The invoice preview below now includes this ID. Print and share with your customer.
              </p>
            </div>
            <Link href={`/track/${generatedId}`}>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2 whitespace-nowrap">
                <ExternalLink className="h-3.5 w-3.5" /> Track
              </Button>
            </Link>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-8 space-y-8">

          {/* LOGO */}
          <div>
            <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Company Logo</h2>
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors flex-shrink-0"
                onClick={() => logoInputRef.current?.click()}
              >
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  : <div className="text-center"><ImageIcon className="h-6 w-6 text-gray-400 mx-auto" /><p className="text-[10px] text-gray-400 mt-1">Click</p></div>
                }
              </div>
              <div className="space-y-2">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Choose Logo
                </Button>
                {form.logoUrl && (
                  <Button type="button" variant="ghost" size="sm" className="gap-2 text-red-500 hover:text-red-600 block" onClick={removeLogo}>
                    Remove
                  </Button>
                )}
                <p className="text-[10px] text-gray-400">PNG, JPG or SVG</p>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>

          {/* ── CUSTOMER DETAILS ── */}
          <div className="rounded-xl border-2 border-blue-100 bg-blue-50/30 p-5">
            <SecHead icon={User} title="Customer Details" color="blue" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Lbl t="Customer Name" /><Input name="billToName" value={form.billToName} onChange={set} placeholder="Ram Bahadur Thapa" className="h-10 bg-white" autoComplete="off" /></div>
              <div><Lbl t="Phone Number" /><Input name="billToPhone" value={form.billToPhone} onChange={set} placeholder="+977 98XXXXXXXX" className="h-10 bg-white" autoComplete="off" /></div>
              <div><Lbl t="Email ID" /><Input name="billToEmail" type="email" value={form.billToEmail} onChange={set} placeholder="customer@example.com" className="h-10 bg-white" autoComplete="off" /></div>
            </div>
          </div>

          {/* ── SHIPMENT ROUTE ── */}
          <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-5">
            <SecHead icon={Truck} title="Shipment Route & Details" color="blue" />
            <p className="text-xs text-blue-500 mb-4">
              Fill these fields then click <strong>Generate Tracking ID</strong> — the ID will appear on the invoice automatically.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Lbl t="Sender Name" req /><Input name="senderName" value={form.senderName} onChange={set} placeholder="Full name" className="h-10 bg-white" autoComplete="off" /></div>
              <div><Lbl t="Sender Phone" /><Input name="senderPhone" value={form.senderPhone} onChange={set} placeholder="+977 98…" className="h-10 bg-white" autoComplete="off" /></div>
              <div><Lbl t="Receiver Name" req /><Input name="receiverName" value={form.receiverName} onChange={set} placeholder="Full name" className="h-10 bg-white" autoComplete="off" /></div>
              <div><Lbl t="Receiver Phone" /><Input name="receiverPhone" value={form.receiverPhone} onChange={set} placeholder="+81 90…" className="h-10 bg-white" autoComplete="off" /></div>
              <div><Lbl t="Origin" req /><Input name="origin" value={form.origin} onChange={set} placeholder="Kathmandu, Nepal" className="h-10 bg-white" autoComplete="off" /></div>
              <div><Lbl t="Destination" req /><Input name="destination" value={form.destination} onChange={set} placeholder="Tokyo, Japan" className="h-10 bg-white" autoComplete="off" /></div>
              <div><Lbl t="Weight (kg)" /><Input name="weight" type="number" step="0.01" min="0" value={form.weight} onChange={set} placeholder="5" className="h-10 bg-white" autoComplete="off" /></div>

              {/* Generate button */}
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleGenerateTracking}
                  disabled={createShipment.isPending || !!generatedId}
                  className={cn(
                    "w-full h-10 gap-2 font-bold text-sm text-white",
                    generatedId ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700",
                  )}
                >
                  {createShipment.isPending
                    ? <><span className="animate-spin inline-block">⏳</span> Generating…</>
                    : generatedId
                      ? <><CheckCircle2 className="h-4 w-4" /> ID: {generatedId}</>
                      : <><Zap className="h-4 w-4" /> Generate Tracking ID</>
                  }
                </Button>
              </div>

              {/* Tracking ID display */}
              <div className="md:col-span-2">
                <Lbl t="Tracking / Invoice #" />
                <div className={cn(
                  "h-10 flex items-center px-3 rounded-md border text-sm font-mono font-bold",
                  generatedId
                    ? "border-green-400 bg-green-50 text-green-800"
                    : "border-gray-200 bg-gray-50 text-gray-400",
                )}>
                  {generatedId ? `#${generatedId}` : "Will appear here after clicking Generate Tracking ID ↑"}
                </div>
              </div>
            </div>
          </div>

          {/* ── PRODUCT DETAILS ── */}
          <div className="rounded-xl border-2 border-purple-100 bg-purple-50/30 p-5">
            <SecHead icon={Package} title="Product Details" color="purple" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Lbl t="Product Name" /><Input name="productName" value={form.productName} onChange={set} placeholder="e.g. Electronics, Clothes…" className="h-10 bg-white" autoComplete="off" /></div>
              <div><Lbl t="Quantity (Pcs)" /><Input name="productQuantity" type="number" min="1" value={form.productQuantity} onChange={set} placeholder="e.g. 10" className="h-10 bg-white" autoComplete="off" /></div>
              <div>
                <Lbl t="Per Pic Cost (NPR)" />
                <Input name="perPicCost" type="number" min="0" step="0.01" value={form.perPicCost} onChange={set} placeholder="0.00" className="h-10 bg-white text-right font-mono" autoComplete="off" />
                {n(form.productQuantity) > 0 && n(form.perPicCost) > 0 && (
                  <p className="mt-1 text-xs text-purple-600 font-semibold">
                    Product Cost: {formatNPR(n(form.productQuantity) * n(form.perPicCost))}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── COST BREAKDOWN ── moved here so it's immediately visible ── */}
          <div className="rounded-xl border-2 border-orange-200 bg-orange-50/30 p-5">
            <h2 className="text-[11px] font-extrabold text-orange-700 uppercase tracking-widest mb-1 flex items-center gap-2">
              💰 Cost Breakdown
            </h2>
            <p className="text-xs text-orange-600 mb-4">Enter each charge — Total Amount is calculated automatically.</p>

            {/* Three cost input fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Lbl t="Shipping Cost (NPR)" />
                <Input name="shippingCost" type="number" min="0" step="0.01" value={form.shippingCost} onChange={set} placeholder="0.00" className="h-10 bg-white text-right font-mono text-base" autoComplete="off" />
              </div>
              <div>
                <Lbl t="Custom / Duties Cost (NPR)" />
                <Input name="customCost" type="number" min="0" step="0.01" value={form.customCost} onChange={set} placeholder="0.00" className="h-10 bg-white text-right font-mono text-base" autoComplete="off" />
              </div>
              <div>
                <Lbl t="Service Charge (NPR)" />
                <Input name="serviceCharge" type="number" min="0" step="0.01" value={form.serviceCharge} onChange={set} placeholder="0.00" className="h-10 bg-white text-right font-mono text-base" autoComplete="off" />
              </div>
            </div>

            {/* Live summary: rows + bold Total */}
            <div className="rounded-lg border border-orange-200 overflow-hidden text-sm">
              {productCost > 0 && (
                <div className="flex justify-between items-center px-4 py-2.5 bg-purple-50/40 border-b border-orange-100">
                  <span className="text-gray-600">📦 Product Cost ({form.productQuantity} × {formatNPR(n(form.perPicCost))})</span>
                  <span className="font-mono font-semibold text-gray-800">{formatNPR(productCost)}</span>
                </div>
              )}
              <div className="flex justify-between items-center px-4 py-2.5 bg-white border-b border-orange-100">
                <span className="text-gray-600">🚚 Shipping Cost</span>
                <span className="font-mono font-semibold text-gray-800">{formatNPR(shipping)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 bg-orange-50/30 border-b border-orange-100">
                <span className="text-gray-600">🛃 Custom / Duties Cost</span>
                <span className="font-mono font-semibold text-gray-800">{formatNPR(customs)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 bg-white border-b border-orange-200">
                <span className="text-gray-600">⚙️ Service Charge</span>
                <span className="font-mono font-semibold text-gray-800">{formatNPR(service)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-blue-600 text-white">
                <span className="font-bold text-base">Total Amount</span>
                <span className="font-bold font-mono text-base">{formatNPR(total)}</span>
              </div>
            </div>
          </div>

          {/* ── PAYMENT SUMMARY ── */}
          <div className="rounded-xl border-2 border-green-100 bg-green-50/30 p-5">
            <SecHead icon={CreditCard} title="Payment Summary" color="green" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Lbl t="Total Amount (NPR)" />
                <div className="h-10 flex items-center px-3 rounded-md border border-gray-200 bg-gray-50 text-sm font-bold font-mono text-secondary">
                  {formatNPR(total)}
                </div>
              </div>
              <div>
                <Lbl t="Amount Paid (NPR)" />
                <Input name="paidAmount" type="number" min="0" step="0.01" value={form.paidAmount} onChange={set} placeholder="0.00" className="h-10 bg-white text-right font-mono" />
              </div>
              <div>
                <Lbl t="Amount Due (NPR)" />
                <div className={cn(
                  "h-10 flex items-center px-3 rounded-md border text-sm font-bold font-mono",
                  due <= 0 && total > 0
                    ? "border-green-300 bg-green-50 text-green-700"
                    : due > 0
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-gray-200 bg-gray-50 text-gray-400",
                )}>
                  {total > 0 && due <= 0 ? "✓ Paid in Full" : formatNPR(due)}
                </div>
              </div>
            </div>
          </div>

          {/* ── SHIPPING OPTIONS ── */}
          <div>
            <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Shipping Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Lbl t="Shipping Mode" />
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
              <div>
                <Lbl t="Estimated Delivery Date" />
                <Input name="estimatedDelivery" type="date" value={form.estimatedDelivery} onChange={set} className="h-10" />
              </div>
            </div>
          </div>

          {/* ── INVOICE META ── */}
          <div>
            <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Lbl t="Date of Purchase" />
                <Input name="invoiceDate" type="date" value={form.invoiceDate} onChange={set} className="h-10" />
              </div>
              <div>
                <Lbl t="Payment Terms" />
                <select name="paymentTerms" value={form.paymentTerms} onChange={set} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option>Due on Receipt</option>
                  <option>Payment Received</option>
                  <option>Net 7</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                </select>
              </div>
            </div>
          </div>

          {/* EXTRA NOTES */}
          <div>
            <Lbl t="Extra Notes" />
            <textarea
              name="extraNotes"
              value={form.extraNotes}
              onChange={set}
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
              <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Invoice Preview</h2>
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

      {/* ══════════════════════════════════════════
          CUSTOMER DETAILS DIALOG
      ══════════════════════════════════════════ */}
      <Dialog open={cdOpen} onOpenChange={setCdOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Customer Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1 max-h-[72vh] overflow-y-auto pr-1">

            {/* ① Customer Info */}
            <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4 space-y-3">
              <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">1</span>
                Customer Info
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name <span className="text-primary">*</span></label>
                <Input name="name" value={cd.name} onChange={setcd} placeholder="Ram Bahadur Thapa" className="h-10 bg-white" autoComplete="off" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp Number</label>
                  <Input name="whatsapp" value={cd.whatsapp} onChange={setcd} placeholder="+977 98XXXXXXXX" className="h-10 bg-white" autoComplete="off" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Gmail / Email ID</label>
                  <Input name="email" type="email" value={cd.email} onChange={setcd} placeholder="customer@gmail.com" className="h-10 bg-white" autoComplete="off" />
                </div>
              </div>
            </div>

            {/* ② Product Info */}
            <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-4 space-y-3">
              <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold">2</span>
                Product Info
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name</label>
                  <Input name="productName" value={cd.productName} onChange={setcd} placeholder="Electronics…" className="h-10 bg-white" autoComplete="off" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity (Pcs)</label>
                  <Input name="quantity" type="number" min="1" value={cd.quantity} onChange={setcd} placeholder="e.g. 10" className="h-10 bg-white" autoComplete="off" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Per Pic Cost (NPR)</label>
                  <Input name="perPicCost" type="number" min="0" step="0.01" value={cd.perPicCost} onChange={setcd} placeholder="0.00" className="h-10 bg-white text-right font-mono" autoComplete="off" />
                </div>
              </div>
            </div>

            {/* ③ Shipment Route — required for tracking ID */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4 space-y-3">
              <p className="text-[10px] font-extrabold text-yellow-700 uppercase tracking-widest flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] font-bold">3</span>
                Shipment Route <span className="text-[9px] normal-case font-normal text-yellow-600 ml-1">(needed for Tracking ID)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Origin</label>
                  <Input name="origin" value={cd.origin} onChange={setcd} placeholder="Kathmandu, Nepal" className="h-10 bg-white" autoComplete="off" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Destination <span className="text-primary">*</span></label>
                  <Input name="destination" value={cd.destination} onChange={setcd} placeholder="Tokyo, Japan" className="h-10 bg-white" autoComplete="off" />
                </div>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="rounded-lg border border-orange-100 bg-orange-50/30 p-4 space-y-3">
              <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">Cost Breakdown</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="w-36 text-xs font-semibold text-gray-600 flex-shrink-0">🚚 Shipping Cost</label>
                  <Input name="shippingCost" type="number" min="0" step="0.01" value={cd.shippingCost} onChange={setcd} placeholder="0.00" className="h-9 bg-white text-right font-mono flex-1" />
                  <span className="text-xs text-gray-400 w-8">NPR</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-36 text-xs font-semibold text-gray-600 flex-shrink-0">🛃 Custom Cost</label>
                  <Input name="customCost" type="number" min="0" step="0.01" value={cd.customCost} onChange={setcd} placeholder="0.00" className="h-9 bg-white text-right font-mono flex-1" />
                  <span className="text-xs text-gray-400 w-8">NPR</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-36 text-xs font-semibold text-gray-600 flex-shrink-0">⚙️ Service Charge</label>
                  <Input name="serviceCharge" type="number" min="0" step="0.01" value={cd.serviceCharge} onChange={setcd} placeholder="0.00" className="h-9 bg-white text-right font-mono flex-1" />
                  <span className="text-xs text-gray-400 w-8">NPR</span>
                </div>
              </div>

              {/* Subtotal row */}
              <div className="flex items-center justify-between border-t border-orange-200 pt-2 mt-1">
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Subtotal</span>
                <span className="text-sm font-bold font-mono text-orange-800">{formatNPR(cdSubtotal)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-lg border border-green-100 bg-green-50/40 p-4 space-y-3">
              <p className="text-[11px] font-bold text-green-600 uppercase tracking-widest">Payment</p>
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs font-semibold text-gray-600 flex-shrink-0">Amount Paid</label>
                <Input name="paid" type="number" min="0" step="0.01" value={cd.paid} onChange={setcd} placeholder="0.00" className="h-9 bg-white text-right font-mono flex-1" />
                <span className="text-xs text-gray-400 w-8">NPR</span>
              </div>

              {/* Total / Due / Balance summary */}
              <div className="rounded-md border border-gray-200 overflow-hidden text-sm">
                <div className="flex justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-gray-500">Total Cost</span>
                  <span className="font-mono font-semibold">{formatNPR(cdSubtotal)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-green-600 font-medium">Amount Paid</span>
                  <span className="font-mono font-semibold text-green-700">{formatNPR(Number(cd.paid) || 0)}</span>
                </div>
                <div className={cn(
                  "flex justify-between px-3 py-2.5 font-bold",
                  cdDue <= 0 && cdSubtotal > 0 ? "bg-green-100" : "bg-red-50",
                )}>
                  <span className={cdDue <= 0 && cdSubtotal > 0 ? "text-green-700" : "text-red-700"}>
                    {cdDue <= 0 && cdSubtotal > 0 ? "✓ Paid in Full" : "Due / Remaining Balance"}
                  </span>
                  <span className={cn("font-mono", cdDue <= 0 && cdSubtotal > 0 ? "text-green-700" : "text-red-700")}>
                    {cdDue <= 0 && cdSubtotal > 0 ? "NPR 0.00" : formatNPR(cdDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCdOpen(false)}>Cancel</Button>
            <Button onClick={saveCd} className="bg-primary hover:bg-primary/90 text-white gap-2">
              <CheckCircle2 className="h-4 w-4" /> Save to Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print  { display: none !important; }
          .print-only{ display: block !important; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          body > * { display: none !important; }
          #invoice-doc {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 198mm !important;
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
