import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Plane } from "lucide-react";

const CITIES = [
  { name: "China",        sub: "Shanghai / Beijing",     x: 78, y: 20 },
  { name: "Kathmandu",   sub: "Nepal HQ",                x: 50, y: 42 },
  { name: "UAE",          sub: "Dubai / Abu Dhabi",       x: 30, y: 55 },
  { name: "UK",           sub: "London",                  x: 15, y: 18 },
  { name: "USA",          sub: "New York / LA",           x: 5,  y: 35 },
  { name: "Australia",   sub: "Sydney / Melbourne",      x: 85, y: 75 },
];

const ROUTES = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 1, to: 5 },
];

function dot(cities: typeof CITIES, from: number, to: number) {
  const f = cities[from];
  const t = cities[to];
  return { x1: f.x, y1: f.y, x2: t.x, y2: t.y };
}

export function RouteAnimation() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-20 px-4 overflow-hidden" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Our Global Network</h2>
          <p className="text-gray-500 max-w-xl mx-auto">From Kathmandu, we connect your cargo to every corner of the world</p>
          <div className="w-24 h-1 bg-primary mx-auto mt-4" />
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          {/* World map SVG background */}
          <svg
            viewBox="0 0 100 90"
            className="w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Subtle grid */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.3" />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.8" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <rect width="100" height="90" fill="url(#grid)" rx="4" />

            {/* Route lines */}
            {ROUTES.map((r, i) => {
              const { x1, y1, x2, y2 } = dot(CITIES, r.from, r.to);
              const pathId = `route-${i}`;
              const pathD = `M ${x1} ${y1} Q ${(x1+x2)/2} ${Math.min(y1,y2) - 12} ${x2} ${y2}`;
              return (
                <g key={i}>
                  <path d={pathD} fill="none" stroke="#e2e8f0" strokeWidth="0.6" strokeDasharray="2,1.5" />
                  {isInView && (
                    <motion.path
                      id={pathId}
                      d={pathD}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="0.7"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.4, delay: 0.4 + i * 0.25, ease: "easeInOut" }}
                    />
                  )}
                  {/* Animated dot travelling along route */}
                  {isInView && (
                    <motion.circle
                      cx={x1}
                      cy={y1}
                      r="1.2"
                      fill="#dc2626"
                      filter="url(#glow)"
                      animate={{
                        cx: [x1, (x1 + x2) / 2, x2],
                        cy: [y1, Math.min(y1, y2) - 12, y2],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        delay: 1.2 + i * 0.35,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 4,
                      }}
                    />
                  )}
                </g>
              );
            })}

            {/* City dots */}
            {CITIES.map((city, i) => (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              >
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={i === 1 ? 2.5 : 1.8}
                  fill={i === 1 ? "#dc2626" : "#1e3a5f"}
                  opacity={0.9}
                />
                {i === 1 && (
                  <motion.g
                    animate={{ opacity: [0.8, 0, 0.8], scale: [1, 2, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ transformOrigin: `${city.x}px ${city.y}px` }}
                  >
                    <circle cx={city.x} cy={city.y} r={2.5} fill="none" stroke="#dc2626" strokeWidth="0.5" />
                  </motion.g>
                )}
                <text x={city.x + 3} y={city.y - 1} fontSize="3.5" fontWeight="700" fill={i === 1 ? "#dc2626" : "#1e3a5f"}>
                  {city.name}
                </text>
                <text x={city.x + 3} y={city.y + 2.5} fontSize="2.5" fill="#64748b">
                  {city.sub}
                </text>
              </motion.g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {[
            { color: "bg-secondary", label: "International Hubs" },
            { color: "bg-primary", label: "Kathmandu HQ" },
            { color: "bg-primary", label: "Active Routes", dash: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
