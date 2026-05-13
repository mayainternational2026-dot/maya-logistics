import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Package, Globe, Clock, Star } from "lucide-react";

const STATS = [
  { icon: Package, value: 5000, suffix: "+", label: "Shipments Delivered",  color: "text-blue-400" },
  { icon: Globe,   value: 50,   suffix: "+", label: "Countries Served",      color: "text-emerald-400" },
  { icon: Clock,   value: 3,    suffix: "+", label: "Years Experience",       color: "text-amber-400" },
  { icon: Star,    value: 24,   suffix: "/7", label: "Customer Support",      color: "text-rose-400" },
];

function AnimatedCounter({ to, suffix, isVisible }: { to: number; suffix: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = to / (duration / step);

    const timer = setInterval(() => {
      start += increment;
      if (start >= to) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [isVisible, to]);

  return <span>{count}{suffix}</span>;
}

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-secondary py-16 px-4" ref={ref}>
      <div className="container mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4 ${stat.color}`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                <AnimatedCounter to={stat.value} suffix={stat.suffix} isVisible={isInView} />
              </div>
              <p className="text-gray-400 text-sm mt-1 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
