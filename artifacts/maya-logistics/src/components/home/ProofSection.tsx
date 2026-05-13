import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Instagram, Facebook, Star, MessageCircle, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function ProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 bg-gray-50" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
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
            Follow our social media to see real photos and videos from our operations — warehouses, customs clearances, and deliveries.
          </p>
          <div className="w-24 h-1 bg-primary mx-auto mt-4" />
        </motion.div>

        {/* Social Proof CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-14">
          <motion.a
            href="https://www.instagram.com/mayainternational2026"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
              <Instagram className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-base">Instagram</p>
              <p className="text-sm text-gray-500 mt-0.5">@mayainternational2026</p>
              <p className="text-xs text-pink-500 mt-1 font-medium flex items-center gap-1">
                See our latest deliveries <ExternalLink className="h-3 w-3" />
              </p>
            </div>
          </motion.a>

          <motion.a
            href="https://www.facebook.com/profile.php?id=61589211686064"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group flex items-center gap-5 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Facebook className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-base">Facebook</p>
              <p className="text-sm text-gray-500 mt-0.5">Maya Import Export</p>
              <p className="text-xs text-blue-500 mt-1 font-medium flex items-center gap-1">
                Read client reviews &amp; updates <ExternalLink className="h-3 w-3" />
              </p>
            </div>
          </motion.a>
        </div>

        {/* Share your experience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-2xl mx-auto bg-secondary rounded-2xl p-8 text-center text-white"
        >
          <Star className="h-9 w-9 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Happy with our service?</h3>
          <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">
            Share your experience with us. Your feedback helps other businesses in Nepal find a reliable logistics partner.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/9779769686908?text=Hi%20Maya%20Logistics%2C%20I%20would%20like%20to%20share%20my%20feedback%20about%20my%20recent%20shipment."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-green-500 hover:bg-green-600 text-white gap-2 w-full sm:w-auto">
                <MessageCircle className="h-4 w-4" /> Send Feedback via WhatsApp
              </Button>
            </a>
            <a href="mailto:mayaimportexportinternational@gmail.com?subject=Feedback%20on%20my%20shipment">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 w-full sm:w-auto">
                <Mail className="h-4 w-4" /> Email Your Review
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
