import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Star, Quote, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TESTIMONIALS = [
  {
    name: "Rajesh Shrestha",
    role: "Business Owner",
    company: "Shrestha Handicrafts, Kathmandu",
    text: "Maya Import Export has been shipping our handicrafts to Europe for 3 years now. Their customs clearance team is excellent — zero delays, zero stress. Highly recommended for any exporter in Nepal.",
    rating: 5,
    service: "Air Freight",
    avatar: "RS",
  },
  {
    name: "Priya Tamang",
    role: "Import Manager",
    company: "Himalayan Goods Pvt. Ltd.",
    text: "We import raw materials from China via sea freight every month. Maya's team handles all the documentation at Kolkata port seamlessly. Their pricing is transparent and staff is always available on WhatsApp.",
    rating: 5,
    service: "Sea Freight",
    avatar: "PT",
  },
  {
    name: "Sunil Gurung",
    role: "E-commerce Seller",
    company: "Kathmandu Online Store",
    text: "As an online seller shipping packages internationally, I needed a reliable freight partner. Maya Import Export gave me the best rates and their tracking system keeps me and my customers updated at every step.",
    rating: 5,
    service: "Air Freight",
    avatar: "SG",
  },
  {
    name: "Anita Poudel",
    role: "Procurement Officer",
    company: "Poudel Construction Ltd.",
    text: "We use Maya for road freight from India — heavy construction equipment. Their team coordinates pickups from Indian suppliers and delivers to our sites on time. Professional and trustworthy company.",
    rating: 5,
    service: "Road Freight",
    avatar: "AP",
  },
  {
    name: "Bikash Rai",
    role: "Garment Exporter",
    company: "Rai Garments, Bhaktapur",
    text: "Maya Import Export helped us ship our garments to the UK and US market. Their knowledge of customs regulations saved us from costly mistakes. Customer service is top notch — they respond even on holidays.",
    rating: 5,
    service: "Air Freight",
    avatar: "BR",
  },
  {
    name: "Kamala Thapa",
    role: "Director",
    company: "Himalayan Tea Exports",
    text: "Shipping Nepali tea to Japan and South Korea requires careful handling. Maya's team understands food-grade cargo requirements and ensures proper documentation every time. Our international clients are always satisfied.",
    rating: 5,
    service: "Air Freight",
    avatar: "KT",
  },
  {
    name: "Deepak Maharjan",
    role: "Logistics Coordinator",
    company: "Pashupatinath Arts & Crafts",
    text: "We've tried several freight companies in Kathmandu. Maya Import Export stands out for their honest pricing and on-time delivery. Their staff is knowledgeable and guides you through every step of the shipping process.",
    rating: 5,
    service: "Sea Freight",
    avatar: "DM",
  },
  {
    name: "Sushila Karki",
    role: "Shop Owner",
    company: "Karki Jewellery, Thamel",
    text: "I send silver jewellery to clients in the USA regularly. Maya handles all the paperwork, insurance, and customs declarations for precious items. Very reliable — my packages always arrive safely and on time.",
    rating: 5,
    service: "Air Freight",
    avatar: "SK",
  },
];

const SERVICE_COLORS: Record<string, string> = {
  "Air Freight":  "bg-blue-100 text-blue-700",
  "Sea Freight":  "bg-teal-100 text-teal-700",
  "Road Freight": "bg-orange-100 text-orange-700",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="h-11 w-11 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
      {initials}
    </div>
  );
}

export default function Testimonials() {
  const avgRating = (TESTIMONIALS.reduce((s, t) => s + t.rating, 0) / TESTIMONIALS.length).toFixed(1);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-secondary text-white py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-4">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>Trusted by businesses across Nepal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              What Our Clients Say
            </h1>
            <p className="text-white/70 text-lg">
              Real feedback from businesses that trust Maya Import Export Logistic for their cargo needs.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{avgRating}</p>
                <StarRating rating={5} />
                <p className="text-xs text-white/60 mt-1">Average Rating</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-bold">{TESTIMONIALS.length}+</p>
                <p className="text-xs text-white/60 mt-1">Happy Clients</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-bold">3+</p>
                <p className="text-xs text-white/60 mt-1">Years in Business</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="relative hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <Quote className="h-8 w-8 text-secondary/20 absolute top-4 right-4" />
                  <StarRating rating={t.rating} />
                  <p className="text-gray-700 text-sm leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Avatar initials={t.avatar} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 truncate">{t.role}</p>
                      <p className="text-xs text-gray-400 truncate">{t.company}</p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${SERVICE_COLORS[t.service] ?? ""}`}>
                      {t.service}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center bg-white rounded-2xl border p-8 max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Ship with Maya?</h2>
            <p className="text-gray-500 text-sm mb-5">
              Join hundreds of Nepali businesses who trust us with their cargo.
              Get a free quote today.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href="/inquiry"
                className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                Get Free Quote
              </a>
              <a
                href="https://wa.me/9779769686908"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>
      <WhatsAppButton />
      <ChatBot />
    </>
  );
}
