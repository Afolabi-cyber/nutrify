import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Cpu, ClipboardList, Activity } from "lucide-react";

import stepScan from "@/assets/step-scan.png";
import stepAnalyze from "@/assets/step-analyze.jpg";
import stepInsights from "@/assets/step-insights.jpg";
import stepTrack from "@/assets/step-track.jpg";
import { fadeUp, fadeLeft, scaleIn, staggerContainer } from "@/lib/animations";

const steps = [
  {
    icon: Camera,
    title: "Scan or Upload",
    description: "Snap a photo of your plate or pick one from your gallery in just a tap.",
    image: stepScan,
  },
  {
    icon: Cpu,
    title: "AI Analyzes",
    description: "Our advanced vision model identifies ingredients and calculates nutrients in seconds.",
    image: stepAnalyze,
  },
  {
    icon: ClipboardList,
    title: "Get Insights",
    description: "See what's covered, what's missing, and get actionable dietary feedback.",
    image: stepInsights,
  },
  {
    icon: Activity,
    title: "Track Progress",
    description: "Monitor your daily intake, maintain streaks, and reach your health goals.",
    image: stepTrack,
  },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative z-20 bg-background py-20 sm:py-32 px-5 pb-32 overflow-hidden">
      {/* Ambient glow matching SampleAnalysis */}
      <div
        className="absolute top-1/4 left-0 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10 md:opacity-[0.15] blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/4 right-0 translate-x-1/3 w-[600px] h-[600px] rounded-full opacity-10 md:opacity-[0.15] blur-[140px] pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
      />

      <div className="container relative z-10 mx-auto max-w-6xl">
        <motion.div
           variants={fadeUp}
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, amount: 0.2 }}
           className="text-center mb-14 md:mb-20 flex flex-col items-center"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-4 text-primary font-medium">
            How It Works
          </p>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-[1.1] text-foreground mb-4">
            Get started in 4{" "}
            <span className="italic nutrify-gradient-text">simple steps</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed md:text-lg">
            Snap, analyze, learn, and track. Transform the way you understand your daily nutrition.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Side: Steps */}
          <div className="relative">
            <div className="absolute left-[26px] top-6 bottom-6 w-[2px] bg-border hidden sm:block" />

            <motion.div 
              className="space-y-6 sm:space-y-0 relative"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {steps.map((step, i) => {
                const isActive = activeStep === i;
                return (
                  <motion.div
                    variants={fadeLeft}
                    key={step.title}
                    onClick={() => setActiveStep(i)}
                    className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 cursor-pointer group sm:p-4 rounded-2xl transition-colors hover:bg-muted/30"
                  >
                    <div className="relative z-10 shrink-0 flex items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-serif text-lg
                          ${isActive
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_rgba(43,89,52,0.3)]"
                            : "border-border bg-background text-muted-foreground group-hover:border-primary/50"
                          }
                        `}
                      >
                        {i + 1}
                      </div>
                      {i !== steps.length - 1 && (
                        <div className="absolute left-6 top-12 h-6 w-[2px] bg-border sm:hidden" />
                      )}
                    </div>

                    <div className="pt-2.5 flex-1">
                      <h3
                        className={`text-xl font-medium mb-2 transition-colors duration-300 ${
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                        }`}
                      >
                        {step.title}
                      </h3>

                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="text-muted-foreground leading-relaxed pb-2">
                              {step.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Right Side: Illustration */}
          <motion.div 
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="relative w-full aspect-square sm:aspect-[4/3] lg:aspect-square bg-card rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden transform-gpu"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={steps[activeStep].image}
                  alt={steps[activeStep].title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  width={800}
                  height={800}
                />
                {/* Subtle overlay for dark mode consistency */}
                <div className="absolute inset-0 bg-black/5 dark:bg-black/20 transition-colors duration-300" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
