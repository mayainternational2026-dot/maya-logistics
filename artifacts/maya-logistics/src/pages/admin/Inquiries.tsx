import { useState } from "react";
import { useListInquiries, useUpdateInquiry } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Package, ExternalLink, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNPR } from "@/lib/utils";

const STATUS_OPTIONS = ["pending", "reviewing", "quoted", "closed"];

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  reviewing: "bg-blue-100 text-blue-700",
  quoted: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};

export default function Inquiries() {
  const { data: inquiries = [], isLoading, refetch } = useListInquiries();
  const update = useUpdateInquiry();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const handleStatus = (id: number, status: string) => {
    update.mutate(
      { id, data: { status } },
      {
        onSuccess: () => { toast({ title: "Status updated" }); refetch(); },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      },
    );
  };

  const handleSaveNotes = (id: number) => {
    update.mutate(
      { id, data: { adminNotes: notes[id] ?? "" } },
      {
        onSuccess: () => { toast({ title: "Notes saved" }); refetch(); },
        onError: () => toast({ title: "Save failed", variant: "destructive" }),
      },
    );
  };

  if (isLoading) return <div className="py-16 text-center text-gray-400">Loading inquiries…</div>;

  if (inquiries.length === 0) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">No inquiries yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product Inquiries</h1>
        <span className="text-sm text-gray-500">{inquiries.length} total</span>
      </div>

      {inquiries.map((inq) => {
        const isOpen = expanded === inq.id;
        let parsedImages: { name: string; dataUrl: string }[] = [];
        try { if (inq.images) parsedImages = JSON.parse(inq.images); } catch { /* ignore */ }

        return (
          <div key={inq.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Row header */}
            <button
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(isOpen ? null : inq.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{inq.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[inq.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {inq.status}
                  </span>
                  {parsedImages.length > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <ImageIcon className="h-3 w-3" /> {parsedImages.length}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">{inq.productDetails}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">{format(new Date(inq.createdAt), "MMM d, yyyy")}</p>
                {inq.estimatedCost != null && (
                  <p className="text-sm font-semibold text-gray-700">{formatNPR(inq.estimatedCost)}</p>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="border-t border-gray-100 px-6 py-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Contact</p>
                    <p className="font-medium text-gray-800">{inq.name}</p>
                    <p className="text-gray-600">{inq.email}</p>
                    {inq.phone && <p className="text-gray-600">{inq.phone}</p>}
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Product Info</p>
                    {inq.quantity != null && <p className="text-gray-700">Qty: <span className="font-medium">{inq.quantity}</span></p>}
                    {inq.estimatedCost != null && <p className="text-gray-700">Est. Value: <span className="font-semibold text-gray-900">{formatNPR(inq.estimatedCost)}</span></p>}
                    {inq.productLink && (
                      <a href={inq.productLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm mt-1">
                        <ExternalLink className="h-3 w-3" /> Product Link
                      </a>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Description</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{inq.productDetails}</p>
                  </div>
                </div>

                {/* Images */}
                {parsedImages.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Images</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedImages.map((img, i) => (
                        <a key={i} href={img.dataUrl} target="_blank" rel="noopener noreferrer">
                          <img src={img.dataUrl} alt={img.name} className="h-24 w-24 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status + Notes */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1">Update Status</p>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatus(inq.id, s)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${inq.status === s ? (statusColor[s] + " border-transparent") : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Admin Notes</p>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                    placeholder="Add internal notes…"
                    defaultValue={inq.adminNotes ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [inq.id]: e.target.value }))}
                  />
                  <Button size="sm" className="mt-2" onClick={() => handleSaveNotes(inq.id)}>
                    Save Notes
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
