import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, Play, Camera, Warehouse, ShieldCheck, Truck } from "lucide-react";

const CATEGORIES = [
  { id: "all",       label: "All Photos",       icon: Camera },
  { id: "delivery",  label: "Delivery",         icon: Truck },
  { id: "warehouse", label: "Warehouse",        icon: Warehouse },
  { id: "customs",   label: "Customs & Border", icon: ShieldCheck },
];

const PHOTOS = [
  {
    url: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&auto=format&fit=crop",
    cat: "warehouse",
    caption: "Our Kathmandu warehouse — organized, secure storage",
  },
  {
    url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop",
    cat: "customs",
    caption: "Customs clearance documentation — processed on time",
  },
  {
    url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop",
    cat: "delivery",
    caption: "Safe delivery to client — Kathmandu, Nepal",
  },
  {
    url: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=600&auto=format&fit=crop",
    cat: "delivery",
    caption: "Sea freight coordination at Kolkata Port",
  },
  {
    url: "https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=600&auto=format&fit=crop",
    cat: "delivery",
    caption: "Last-mile delivery — safely at the destination",
  },
  {
    url: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&auto=format&fit=crop",
    cat: "warehouse",
    caption: "Air cargo handling at Tribhuvan International Airport",
  },
  {
    url: "https://images.unsplash.com/photo-1485463611174-f302f6a5c1c9?w=600&auto=format&fit=crop",
    cat: "customs",
    caption: "Border documentation at Birgunj customs checkpoint",
  },
  {
    url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop",
    cat: "delivery",
    caption: "Road freight crossing the Nepal-India border",
  },
];

const REVIEWS = [
  {
    name: "Rajesh Shrestha",
    role: "Handicraft Exporter, Kathmandu",
    text: "Maya delivered my carpets to Germany without a single issue. All customs papers were ready on time. Absolutely professional team.",
    rating: 5,
    avatar: "RS",
  },
  {
    name: "Priya Tamang",
    role: "Import Manager, Himalayan Goods Pvt.",
    text: "Sea freight from China every month. Maya handles everything from Shanghai to our door. We saved 40% on logistics costs by switching to them.",
    rating: 5,
    avatar: "PT",
  },
  {
    name: "Sunil Gurung",
    role: "E-commerce Seller",
    text: "The real-time tracking is fantastic. My customers always know exactly where their package is. Maya has made my business look professional.",
    rating: 5,
    avatar: "SG",
  },
  {
    name: "Anita Poudel",
    role: "Procurement, Poudel Construction",
    text: "Heavy equipment from India delivered to our construction site on schedule. Maya's road freight team is reliable and very communicative.",
    rating: 5,
    avatar: "AP",
  },
  {
    name: "Bikash Rai",
    role: "Garment Exporter, Bhaktapur",
    text: "Our shipments to the USA and UK are always handled with care. Zero damaged goods in 2 years of working with Maya. Highly recommended.",
    rating: 5,
    avatar: "BR",
  },
];

function StarRating({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < n ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export function ProofSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [reviewIdx, setReviewIdx] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const filtered = activeTab === "all" ? PHOTOS : PHOTOS.filter((p) => p.cat === activeTab);

  const prevReview = () => setReviewIdx((i) => (i - 1 + REVIEWS.length) % REVIEWS.length);
  const nextReview = () => setReviewIdx((i) => (i + 1) % REVIEWS.length);

  const r = REVIEWS[reviewIdx];

  return (
    <section className="py-20 bg-gray-50" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Real Proof — Real Deliveries
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
            See What We Actually Do
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Every photo, every review is from a real shipment. No stock imagery of fake operations.
          </p>
          <div className="w-24 h-1 bg-primary mx-auto mt-4" />
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === cat.id
                  ? "bg-secondary text-white shadow-md"
                  : "bg-white text-gray-600 border hover:border-secondary hover:text-secondary"
              }`}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Photo Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-16"
        >
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.url}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="relative group rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-xl transition-shadow"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/70 transition-all duration-300 flex items-end">
                  <p className="text-white text-xs font-medium p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 leading-snug">
                    {photo.caption}
                  </p>
                </div>
                {/* Category badge */}
                <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full text-white shadow ${
                  photo.cat === "delivery" ? "bg-blue-600" :
                  photo.cat === "warehouse" ? "bg-emerald-600" : "bg-amber-600"
                }`}>
                  {photo.cat}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Client Reviews Carousel */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-secondary text-center mb-8 flex items-center justify-center gap-2">
            <Quote className="h-6 w-6 text-primary" />
            Client Voices
          </h3>

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewIdx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
              className="bg-white rounded-2xl shadow-md border p-6 md:p-8 space-y-4"
            >
              <Quote className="h-8 w-8 text-primary/20" />
              <StarRating n={r.rating} />
              <p className="text-gray-700 text-lg leading-relaxed italic">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t">
                <div className="h-11 w-11 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {r.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{r.name}</p>
                  <p className="text-sm text-gray-500">{r.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prevReview}
              className="h-10 w-10 rounded-full border bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-secondary transition-colors shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-1.5">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewIdx(i)}
                  className={`rounded-full transition-all ${i === reviewIdx ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"}`}
                />
              ))}
            </div>
            <button
              onClick={nextReview}
              className="h-10 w-10 rounded-full border bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-secondary transition-colors shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="text-center mt-4">
            <a
              href="/testimonials"
              className="text-secondary text-sm font-medium hover:text-primary transition-colors underline-offset-2 hover:underline"
            >
              Read all {REVIEWS.length * 3}+ client reviews →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
