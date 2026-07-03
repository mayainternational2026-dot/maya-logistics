import { useState } from "react";
import { useListMyInquiries } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Package, ExternalLink, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { formatNPR } from "@/lib/utils";
import { ImageLightbox, SAFE_IMAGE_DATA_URL_RE } from "@/components/ui/ImageLightbox";

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  reviewing: "bg-blue-100 text-blue-700",
  quoted: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};

export function MyInquiries() {
  const { data: inquiries = [], isLoading } = useListMyInquiries();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<{ images: { name: string; dataUrl: string }[]; index: number } | null>(null);

  if (isLoading) {
    return <div className="py-16 text-center text-gray-400">Loading your inquiries…</div>;
  }

  if (inquiries.length === 0) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">You haven't submitted any inquiries yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inq) => {
        const isOpen = expanded === inq.id;
        let parsedImages: { name: string; dataUrl: string }[] = [];
        try { if (inq.images) parsedImages = JSON.parse(inq.images); } catch { /* ignore */ }
        const safeImages = parsedImages.filter((m) => SAFE_IMAGE_DATA_URL_RE.test(m.dataUrl));

        return (
          <div key={inq.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(isOpen ? null : inq.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[inq.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {inq.status}
                  </span>
                  {safeImages.length > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <ImageIcon className="h-3 w-3" /> {safeImages.length}
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

            {isOpen && (
              <div className="border-t border-gray-100 px-6 py-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Product Info</p>
                    {inq.quantity != null && <p className="text-gray-700">Qty: <span className="font-medium">{inq.quantity}</span></p>}
                    {inq.estimatedCost != null && <p className="text-gray-700">Est. Value: <span className="font-semibold text-gray-900">{formatNPR(inq.estimatedCost)}</span></p>}
                    {inq.productLink && isSafeUrl(inq.productLink) && (
                      <a href={inq.productLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm mt-1">
                        <ExternalLink className="h-3 w-3" /> Product Link
                      </a>
                    )}
                  </div>
                  {inq.adminNotes && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Notes from us</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{inq.adminNotes}</p>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Description</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{inq.productDetails}</p>
                  </div>
                </div>

                {safeImages.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                      Your Photos <span className="normal-case font-normal text-gray-300">· click to enlarge</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {safeImages.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightbox({ images: safeImages, index: i })}
                          className="h-24 w-24 flex-shrink-0 rounded-lg border border-gray-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 hover:opacity-90 transition-opacity cursor-zoom-in"
                          aria-label={`View image ${i + 1}: ${img.name}`}
                        >
                          <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
