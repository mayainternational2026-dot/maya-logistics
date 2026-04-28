import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Package, Link2, DollarSign, ImagePlus, X, CheckCircle2 } from "lucide-react";

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 2;

export default function InquiryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - images.length;
    files.slice(0, remaining).forEach((file) => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({ title: "Image too large", description: `Max ${MAX_SIZE_MB}MB per image.`, variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          { name: file.name, dataUrl: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const body = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      productDetails: fd.get("productDetails") as string,
      productLink: fd.get("productLink") as string,
      quantity: fd.get("quantity") ? Number(fd.get("quantity")) : undefined,
      estimatedCost: fd.get("estimatedCost") ? Number(fd.get("estimatedCost")) : undefined,
      images: images.length > 0 ? JSON.stringify(images.map((i) => ({ name: i.name, dataUrl: i.dataUrl }))) : undefined,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      toast({ title: "Submission failed", description: "Please try again or contact us on WhatsApp.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you! We've received your inquiry and will respond within 24 hours with a custom quote.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full bg-secondary hover:bg-secondary/90">
              Back to Home
            </Button>
          </div>
        </div>
        <WhatsAppButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary mb-4">
            <Package className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Product Inquiry</h1>
          <p className="text-gray-500 mt-2">
            Tell us about your product and we'll send you a custom freight quote within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Your Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <Input name="name" required placeholder="Ram Bahadur" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input name="email" type="email" required placeholder="ram@email.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input name="phone" placeholder="+977 98XXXXXXXX" />
              </div>
            </div>
          </div>

          {/* Product info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Product Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Description *</label>
              <textarea
                name="productDetails"
                required
                rows={4}
                placeholder="Describe the product — type, brand, material, size, special handling requirements…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Link2 className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
                Product Link
              </label>
              <Input name="productLink" type="url" placeholder="https://amazon.com/product..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity / Amount</label>
                <Input name="quantity" type="number" min="0" step="any" placeholder="e.g. 10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
                  Estimated Value (NPR)
                </label>
                <Input name="estimatedCost" type="number" min="0" step="any" placeholder="e.g. 25000" />
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImagePlus className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
                Product Images (up to {MAX_IMAGES}, max {MAX_SIZE_MB}MB each)
              </label>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < MAX_IMAGES && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageAdd}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors w-full justify-center"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {images.length === 0 ? "Click to upload images" : "Add more images"}
                  </button>
                </>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-white"
          >
            {loading ? "Submitting…" : "Submit Inquiry"}
          </Button>

          <p className="text-center text-xs text-gray-400">
            We respond within 24 hours. You can also reach us on{" "}
            <a href="https://wa.me/9779768595133" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-medium">
              WhatsApp
            </a>.
          </p>
        </form>
      </div>

      <WhatsAppButton />
      <ChatBot onOpenInquiry={() => setLocation("/inquiry")} />
    </div>
  );
}
