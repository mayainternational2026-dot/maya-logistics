import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChevronRight } from "lucide-react";

const WA_NUMBER = "9779744732123";
const WA_URL = `https://wa.me/${WA_NUMBER}`;

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
}

interface QuickReply {
  label: string;
  value: string;
}

const FAQS: Record<string, { answer: string; followUp?: QuickReply[] }> = {
  track: {
    answer: "You can track your shipment using the tracking ID provided when your shipment was registered. Go to the Track page and enter your Tracking ID, or visit: /track",
    followUp: [
      { label: "I don't have a tracking ID", value: "no_tracking" },
      { label: "Main menu", value: "menu" },
    ],
  },
  pricing: {
    answer: "Our freight rates depend on weight, dimensions, origin, and destination. For an accurate quote, please fill in our inquiry form or contact us on WhatsApp.",
    followUp: [
      { label: "Get a Quote", value: "quote" },
      { label: "WhatsApp Us", value: "whatsapp" },
      { label: "Main menu", value: "menu" },
    ],
  },
  services: {
    answer: "We offer:\n✈️ Air Freight — fastest option\n🚢 Sea Freight — cost-effective for bulk\n🚚 Road Freight — local and regional\n🛃 Customs Clearance assistance\n📦 Door-to-door delivery",
    followUp: [
      { label: "Get a Quote", value: "quote" },
      { label: "Main menu", value: "menu" },
    ],
  },
  contact: {
    answer: "📍 Anandamaya Marg, Dhumbarahi, Kathmandu\n📞 +977 9744732123\n✉️ mayaimportexportinternational@gmail.com\n\nOffice hours: Sun–Fri, 9 AM – 6 PM NPT",
    followUp: [
      { label: "WhatsApp Us", value: "whatsapp" },
      { label: "Main menu", value: "menu" },
    ],
  },
  no_tracking: {
    answer: "No problem! Please contact us on WhatsApp with your name and shipment details and we'll look it up for you right away.",
    followUp: [
      { label: "WhatsApp Us", value: "whatsapp" },
      { label: "Main menu", value: "menu" },
    ],
  },
  quote: {
    answer: "Fill out our online inquiry form with your product details, and we'll send you a custom quote within 24 hours!",
    followUp: [
      { label: "Open Inquiry Form", value: "open_inquiry" },
      { label: "WhatsApp Us", value: "whatsapp" },
      { label: "Main menu", value: "menu" },
    ],
  },
  whatsapp: {
    answer: "Opening WhatsApp now! Our team is available Sun–Fri, 9 AM – 6 PM NPT.",
  },
  open_inquiry: {
    answer: "Opening the inquiry form for you now!",
  },
  menu: {
    answer: "How can I help you? Choose a topic below:",
    followUp: [
      { label: "Track my shipment", value: "track" },
      { label: "Pricing & Quotes", value: "pricing" },
      { label: "Our Services", value: "services" },
      { label: "Contact Info", value: "contact" },
    ],
  },
};

const GREETING: Message = {
  id: 0,
  from: "bot",
  text: "👋 Hello! I'm Maya's support assistant. How can I help you today?",
};

const INITIAL_REPLIES: QuickReply[] = [
  { label: "Track my shipment", value: "track" },
  { label: "Pricing & Quotes", value: "pricing" },
  { label: "Our Services", value: "services" },
  { label: "Contact Info", value: "contact" },
];

export function ChatBot({ onOpenInquiry }: { onOpenInquiry?: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(INITIAL_REPLIES);
  const [input, setInput] = useState("");
  const [idCounter, setIdCounter] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const nextId = () => {
    const id = idCounter;
    setIdCounter((n) => n + 1);
    return id;
  };

  const addMessage = (from: "bot" | "user", text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), from, text }]);
  };

  const handleQuickReply = (value: string) => {
    if (value === "whatsapp") {
      addMessage("user", "Chat on WhatsApp");
      addMessage("bot", FAQS.whatsapp.answer);
      setQuickReplies([{ label: "Main menu", value: "menu" }]);
      setTimeout(() => window.open(WA_URL, "_blank"), 400);
      return;
    }
    if (value === "open_inquiry") {
      addMessage("user", "Open Inquiry Form");
      addMessage("bot", FAQS.open_inquiry.answer);
      setQuickReplies([]);
      setTimeout(() => {
        setOpen(false);
        onOpenInquiry?.();
      }, 600);
      return;
    }
    const faq = FAQS[value];
    if (!faq) return;
    const label = INITIAL_REPLIES.find((r) => r.value === value)?.label ??
      value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    addMessage("user", label);
    setTimeout(() => {
      addMessage("bot", faq.answer);
      setQuickReplies(faq.followUp ?? INITIAL_REPLIES);
    }, 300);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    addMessage("user", text);
    const lower = text.toLowerCase();
    const matched = Object.entries(FAQS).find(([key]) =>
      lower.includes(key) || lower.includes(key.replace("_", " "))
    );
    setTimeout(() => {
      if (matched) {
        addMessage("bot", matched[1].answer);
        setQuickReplies(matched[1].followUp ?? INITIAL_REPLIES);
      } else {
        addMessage(
          "bot",
          "I'm not sure about that, but our team can help! Reach us on WhatsApp or choose a topic below.",
        );
        setQuickReplies([
          { label: "WhatsApp Us", value: "whatsapp" },
          ...INITIAL_REPLIES,
        ]);
      }
    }, 350);
  };

  return (
    <>
      {/* Chat bubble toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-400/50"
        style={{ background: "#0f1f3d" }}
        aria-label="Open chat support"
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-44 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 340, maxHeight: 520, background: "#fff" }}
        >
          {/* Header */}
          <div style={{ background: "#0f1f3d" }} className="px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Maya Support</p>
              <p className="text-xs text-gray-300">● Online now</p>
            </div>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "#25D366", color: "#fff" }}
            >
              WhatsApp
            </a>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 220, maxHeight: 300 }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="rounded-2xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap"
                  style={
                    msg.from === "bot"
                      ? { background: "#f1f5f9", color: "#0f172a" }
                      : { background: "#0f1f3d", color: "#fff" }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {quickReplies.length > 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {quickReplies.map((qr) => (
                <button
                  key={qr.value}
                  onClick={() => handleQuickReply(qr.value)}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#0f1f3d", color: "#0f1f3d" }}
                >
                  {qr.label} <ChevronRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t px-3 py-2">
            <input
              className="flex-1 text-sm rounded-full border px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              className="h-8 w-8 rounded-full flex items-center justify-center text-white"
              style={{ background: "#0f1f3d" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
