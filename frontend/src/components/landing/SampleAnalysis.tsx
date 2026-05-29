import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Check, AlertTriangle, Pill } from "lucide-react";
import sampleMeal from "@/assets/jollof-plate.png";
import { fadeUp, fadeLeft, scaleIn, staggerContainer } from "@/lib/animations";
import zincImg from "@/assets/supplements/zinc.png";
import vitaminD3Img from "@/assets/supplements/vitamin-d3.png";
import fishOilImg from "@/assets/supplements/fish-oil.png";

const ease = [0.16, 1, 0.3, 1] as const;

const detectedNutrients = [
  { name: "Vitamin A", pct: 92, source: "Avocado, Greens" },
  { name: "Vitamin C", pct: 88, source: "Tomatoes, Lemon" },
  { name: "Iron", pct: 78, source: "Chicken, Spinach" },
  { name: "Folate", pct: 85, source: "Leafy greens" },
  { name: "Protein", pct: 95, source: "Grilled chicken" },
];

const missingNutrients = [
  { name: "Zinc", pct: 31 },
  { name: "Iodine", pct: 18 },
  { name: "Vitamin D", pct: 24 },
  { name: "Omega-3", pct: 22 },
];

const supplements = [
  {
    name: "Zinc Picolinate",
    reason: "Fortified defense & antioxidant support",
    image: zincImg,
  },
  {
    name: "Vitamin D3",
    reason: "Bone strength support",
    image: vitaminD3Img,
  },
  {
    name: "Amino Acids",
    reason: "Help with skin regeneration and elasticity",
    image: fishOilImg,
  },
];

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.4,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toString();
      },
    });
    return controls.stop;
  }, [value, delay]);
  return <span ref={ref}>0</span>;
}

function BarFill({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  return (
    <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-border">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: "0%" }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease, delay }}
      />
    </div>
  );
}

const SampleAnalysis = () => {
  const score = 65;

  return (
    <section className="relative w-full overflow-hidden px-5 py-20 md:py-28 max-w-5xl mx-auto bg-background">
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[140px] pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-14 md:mb-20"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-4 text-primary font-medium">
            Sample Analysis
          </p>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-[1.1] text-foreground mb-4">
            What a scan{" "}
            <span className="italic nutrify-gradient-text">reveals</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md leading-relaxed md:text-lg">
            Every scan breaks down your meal into detected nutrients, gaps to fill, and personalized supplement recommendations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Meal image card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="relative shadow-xl rounded-[20px] overflow-hidden group border border-border/50"
            >
              <img
                src={sampleMeal}
                alt="Healthy meal bowl"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
                width={640}
                height={480}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase mb-1 text-primary font-medium">
                      Nutrient Score
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl md:text-7xl font-extralight leading-none tracking-tighter text-white">
                        <AnimatedNumber value={score} delay={0.5} />
                      </span>
                      <span className="text-lg font-light text-white/60">/100</span>
                    </div>
                  </div>
                  <p className="text-xs max-w-[140px] text-right leading-snug text-white/60">
                    Covers {score}% of your daily nutritional needs
                  </p>
                </div>
                <div className="mt-4 w-full h-[2px] rounded-full overflow-hidden bg-white/20">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.6, ease, delay: 0.6 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Supplements card */}
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="rounded-[20px] shadow-xl p-6 md:p-8 bg-card border border-border/50"
            >
              <div className="flex items-center gap-2 mb-5">
                <Pill className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs tracking-[0.2em] uppercase text-primary font-medium">
                  Recommended Supplements
                </p>
              </div>

              <motion.div
                className="space-y-2.5"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                {supplements.map((s) => (
                  <motion.div
                    key={s.name}
                    variants={fadeLeft}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors duration-200"
                  >
                    {/* Supplement image */}
                    <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-background border border-border/50 shadow-sm">
                      {s.image ? (
                        <img
                          src={s.image}
                          alt={s.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <Pill className="w-4 h-4 text-primary/40" />
                        </div>
                      )}
                    </div>

                    {/* Name + reason */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">{s.name}</p>
                      <p className="text-xs mt-0.5 text-muted-foreground truncate">{s.reason}</p>
                    </div>

                    {/* Dose badge */}
                    
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Missing nutrients card */}
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="rounded-[20px] shadow-xl p-6 md:p-8 bg-card border border-border/50"
            >
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                <p className="text-xs tracking-[0.2em] uppercase text-destructive font-medium">
                  Missing Nutrients
                </p>
              </div>
              <motion.div
                className="grid grid-cols-2 gap-3"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                {missingNutrients.map((n) => (
                  <motion.div
                    key={n.name}
                    variants={scaleIn}
                    className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/40"
                  >
                    <span className="text-sm text-foreground">{n.name}</span>
                    <span className="text-xs tabular-nums font-mono text-destructive">{n.pct}%</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SampleAnalysis;