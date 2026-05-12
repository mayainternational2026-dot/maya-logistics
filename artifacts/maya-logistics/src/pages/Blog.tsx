import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ChatBot } from "@/components/ui/ChatBot";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const POSTS = [
  {
    slug: "customs-clearance-guide-nepal",
    title: "Complete Guide to Customs Clearance in Nepal (2026)",
    excerpt: "Everything importers and exporters need to know about Nepal customs procedures, required documents, ASYCUDA World filing, and how to avoid delays at TIA and border crossings.",
    date: "2026-04-15",
    readTime: "8 min read",
    category: "Customs Clearance",
    keywords: "customs clearance Nepal, import documents Nepal, ASYCUDA Nepal",
  },
  {
    slug: "air-freight-nepal-guide",
    title: "Air Freight from Nepal: Routes, Rates & Tips (2026)",
    excerpt: "A comprehensive guide to shipping by air from Kathmandu's Tribhuvan International Airport. Compare airlines, understand IATA rates, and learn how to reduce your air cargo costs.",
    date: "2026-03-28",
    readTime: "6 min read",
    category: "Air Freight",
    keywords: "air freight Nepal, air cargo from Kathmandu, TIA cargo rates",
  },
  {
    slug: "sea-freight-nepal-india-ports",
    title: "Sea Freight from Nepal: Using Indian Seaports (Kolkata, Haldia, Mundra)",
    excerpt: "Nepal is landlocked, so all sea freight must route through India. Learn the best port options, transit times, and how to coordinate multi-modal freight from Kathmandu to any ocean port.",
    date: "2026-03-10",
    readTime: "7 min read",
    category: "Sea Freight",
    keywords: "sea freight Nepal, Kolkata port Nepal, landlocked freight Nepal",
  },
  {
    slug: "freight-forwarding-nepal-tips",
    title: "How to Choose a Freight Forwarder in Nepal: 7 Things to Check",
    excerpt: "Not all logistics companies in Nepal are equal. Here are 7 key factors to evaluate — licensing, network, customs expertise, track record, and more — before choosing your freight forwarder.",
    date: "2026-02-20",
    readTime: "5 min read",
    category: "Logistics Tips",
    keywords: "freight forwarder Nepal, logistics company Nepal, choose freight forwarder Nepal",
  },
  {
    slug: "road-freight-nepal-india-china",
    title: "Nepal Road Freight: Cross-Border Cargo to India & China",
    excerpt: "Road transport is a vital lifeline for Nepal's trade. Discover the key border crossings, trucking routes, documentation requirements, and how to move cargo between Nepal, India, and China efficiently.",
    date: "2026-02-05",
    readTime: "6 min read",
    category: "Road Freight",
    keywords: "road freight Nepal India, cross border cargo Nepal, Nepal China road freight",
  },
  {
    slug: "cargo-tracking-nepal",
    title: "How to Track Your Cargo Shipment in Nepal",
    excerpt: "Step-by-step guide to tracking your international shipment in Nepal — from getting your tracking number to understanding each stage of the delivery process.",
    date: "2026-01-18",
    readTime: "4 min read",
    category: "Tracking",
    keywords: "track cargo Nepal, shipment tracking Nepal, cargo tracking Kathmandu",
  },
];

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "Maya Import Export Logistic — Nepal Logistics Blog",
  "url": "https://www.mayaimportexport.com/blog",
  "description": "Expert logistics articles on freight forwarding, customs clearance, air cargo, sea freight, and road transport in Nepal.",
  "publisher": {
    "@type": "Organization",
    "name": "Maya Import Export Logistic",
    "url": "https://www.mayaimportexport.com"
  },
  "blogPost": POSTS.map(p => ({
    "@type": "BlogPosting",
    "headline": p.title,
    "description": p.excerpt,
    "datePublished": p.date,
    "author": { "@type": "Organization", "name": "Maya Import Export Logistic" },
    "keywords": p.keywords,
  }))
};

const categoryColors: Record<string, string> = {
  "Customs Clearance": "bg-blue-100 text-blue-700",
  "Air Freight": "bg-sky-100 text-sky-700",
  "Sea Freight": "bg-cyan-100 text-cyan-700",
  "Road Freight": "bg-orange-100 text-orange-700",
  "Logistics Tips": "bg-purple-100 text-purple-700",
  "Tracking": "bg-green-100 text-green-700",
};

export default function Blog() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead
        title="Nepal Logistics Blog — Freight, Customs & Cargo Guides"
        description="Expert articles on freight forwarding, customs clearance, air cargo, sea freight, and road transport in Nepal. Stay informed with Maya Import Export Logistic's logistics blog."
        keywords="Nepal logistics blog, freight forwarding Nepal guide, customs clearance Nepal tips, cargo Nepal news, logistics company Nepal articles"
        canonical="/blog"
        schema={blogSchema}
      />
      <Navbar />

      {/* Hero */}
      <section className="bg-secondary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Nepal Logistics Blog</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Expert guides on freight forwarding, customs clearance, air &amp; sea cargo, and logistics in Nepal.
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {POSTS.map((post) => (
              <article key={post.slug} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="bg-secondary/5 h-4 w-full"></div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryColors[post.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {post.category}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-secondary mb-3 leading-snug">{post.title}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">{post.excerpt}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-white border-t border-gray-100 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-secondary mb-3">Need Help with Freight or Customs in Nepal?</h2>
          <p className="text-gray-600 mb-6">Contact Maya Import Export Logistic — Kathmandu's trusted cargo specialists.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inquiry" className="inline-block">
              <span className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                Get a Free Quote
              </span>
            </Link>
            <Link href="/" className="inline-block">
              <span className="inline-flex items-center px-6 py-3 rounded-lg border border-secondary text-secondary font-semibold hover:bg-secondary/5 transition-colors">
                ← Back to Home
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-secondary text-gray-500 py-6 text-center text-sm border-t border-gray-800">
        <span>&copy; {new Date().getFullYear()} Maya Import Export Logistic · </span>
        <Link href="/" className="hover:text-primary transition-colors">www.mayaimportexport.com</Link>
      </footer>
      <WhatsAppButton />
      <ChatBot onOpenInquiry={() => setLocation("/inquiry")} />
    </div>
  );
}
