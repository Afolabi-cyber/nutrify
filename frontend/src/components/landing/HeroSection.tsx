


import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Camera,
  Upload,
  CheckCircle2,
  ChevronUp,
  Flame,
} from "lucide-react";
import alertIcon from "@/assets/alert-icon.png" 
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import jollofPlate from "@/assets/jollof-plate.png";
import CameraModal from "@/components/app/CameraModal";
import { fadeUp } from "@/lib/animations";

const HeroSection = () => {
  const navigate = useNavigate();
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const animationStart = 0.38;
  const animationEnd = 0.58;

  // Top Left Card
  const tlX = useTransform(scrollYProgress, [animationStart, animationEnd], [0, -300]);
  const tlY = useTransform(scrollYProgress, [animationStart, animationEnd], [0, -150]);
  const tlOpacity = useTransform(scrollYProgress, [animationStart, animationEnd], [1, 0]);
  const tlBlur = useTransform(scrollYProgress, [animationStart, animationEnd], [0, 14]);
  const tlFilter = useTransform(tlBlur, (v) => `blur(${v}px)`);

  // Bottom Left Card
  const blX = useTransform(scrollYProgress, [animationStart, animationEnd], [0, -300]);
  const blY = useTransform(scrollYProgress, [animationStart, animationEnd], [0, 150]);
  const blOpacity = useTransform(scrollYProgress, [animationStart, animationEnd], [1, 0]);
  const blBlur = useTransform(scrollYProgress, [animationStart, animationEnd], [0, 14]);
  const blFilter = useTransform(blBlur, (v) => `blur(${v}px)`);

  // Small Stars / Calorie Badge
  const starsX = useTransform(scrollYProgress, [animationStart, animationEnd], [0, -250]);
  const starsOpacity = useTransform(scrollYProgress, [animationStart, animationEnd], [1, 0]);
  const starsBlur = useTransform(scrollYProgress, [animationStart, animationEnd], [0, 14]);
  const starsFilter = useTransform(starsBlur, (v) => `blur(${v}px)`);

  // Top Right Card
  const trX = useTransform(scrollYProgress, [animationStart, animationEnd], [0, 300]);
  const trY = useTransform(scrollYProgress, [animationStart, animationEnd], [0, -150]);
  const trOpacity = useTransform(scrollYProgress, [animationStart, animationEnd], [1, 0]);
  const trBlur = useTransform(scrollYProgress, [animationStart, animationEnd], [0, 14]);
  const trFilter = useTransform(trBlur, (v) => `blur(${v}px)`);

  // Bottom Right Card
  const brX = useTransform(scrollYProgress, [animationStart, animationEnd], [0, 300]);
  const brY = useTransform(scrollYProgress, [animationStart, animationEnd], [0, 150]);
  const brOpacity = useTransform(scrollYProgress, [animationStart, animationEnd], [1, 0]);
  const brBlur = useTransform(scrollYProgress, [animationStart, animationEnd], [0, 14]);
  const brFilter = useTransform(brBlur, (v) => `blur(${v}px)`);

  // Phone scale
  const phoneScale = useTransform(scrollYProgress, [animationStart, animationEnd], [1, 1.05]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sessionStorage.setItem("nutrify_pending_scan", reader.result as string);
        navigate("/app");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = (imageDataUrl: string) => {
    sessionStorage.setItem("nutrify_pending_scan", imageDataUrl);
    navigate("/app");
  };

  return (
    <section ref={sectionRef} className="relative min-h-[200vh]">
      <div className="sticky -top-16 overflow-hidden flex flex-col items-center pt-24 sm:pt-28 lg:pt-32">
        {/* Background Rings */}
        <div className="absolute top-[62%] lg:top-[68%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] border border-border/60 rounded-full pointer-events-none" />
        <div className="absolute top-[62%] lg:top-[68%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] sm:w-[1200px] sm:h-[1200px] border border-border/40 rounded-full pointer-events-none" />
        <div className="absolute top-[62%] lg:top-[68%] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] sm:w-[1700px] sm:h-[1700px] border border-border/20 rounded-full pointer-events-none" />

        {/* Bottom Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-nutrify-warm/20 to-transparent blur-[80px] rounded-full pointer-events-none" />

        <div className="container relative z-10 mx-auto max-w-5xl px-5 h-full flex flex-col items-center text-center">
          {/* Headline */}
          <div className="flex flex-col items-center">
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-serif text-[2.5rem] sm:text-5xl lg:text-[4.5rem] leading-[1.05] tracking-tight mb-6 max-w-4xl text-foreground"
            >
              Scan Your Food <br className="hidden sm:block" />
              <span className="italic nutrify-gradient-text">Discover Missing Nutrient</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-base sm:text-lg text-muted-foreground w-full max-w-[600px] mx-auto mb-10 leading-relaxed"
            >
              Analyze your meals, uncover hidden nutrient gaps, and get smart recommendations instantly.
            </motion.p>
          </div>

          {/* Buttons */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center gap-4 mb-10 lg:mb-12 relative z-20"
          >
            <Button
              onClick={() => setCameraOpen(true)}
              className="rounded-full text-primary-foreground   nutrify-gradient h-14 px-8 text-[15px] font-medium shadow-xl w-full sm:w-auto transition-transform active:scale-95"
            >
              <Camera className="mr-2.5 h-4 w-4" /> Scan Your Meal
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="rounded-full bg-background border-border/80 h-14 px-8 text-[15px] font-medium shadow-sm hover:bg-muted w-full sm:w-auto transition-transform active:scale-95"
            >
              <Upload className="mr-2.5 h-4 w-4" /> Upload Photo
            </Button>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </motion.div>

          {/* Phone + floating UI */}
          <div className="relative w-full max-w-4xl mx-auto flex justify-center items-start min-h-[700px] sm:min-h-[760px] lg:min-h-[820px]">

            {/* Phone Mockup */}
            <motion.div
              style={{ scale: phoneScale }}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 100,
                delay: 0.3,
              }}
              className="relative z-20 w-[240px] h-[520px] sm:w-[280px] sm:h-[580px] lg:w-[320px] lg:h-[650px] bg-card rounded-[3rem] border-[10px] sm:border-[12px] border-b-0 border-zinc-900/90 dark:border-zinc-800 shadow-2xl overflow-hidden"
            >
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900/90 dark:bg-zinc-800 rounded-b-3xl z-30" />

              {/* Phone Screen */}
              <div className="relative w-full   h-full bg-background flex flex-col">
                <div className="relative w-full h-[60%] sm:h-[65%] rounded-b-3xl overflow-hidden">
                  <img
                    src={jollofPlate}
                    alt="Scanning Meal"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />

                  <div className="absolute top-8 left-4 right-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full pl-1.5 pr-3 py-1.5 border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center pt-[1px]">
                        <span className="text-[10px]">👤</span>
                      </div>
                      <span className="text-white text-xs font-medium">
                        Scanning...
                      </span>
                    </div>

                    <div className="bg-nutrify-red flex items-center gap-1.5 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Live
                    </div>
                  </div>

                  <motion.div
                    animate={{ y: ["0%", "300%", "0%"] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_20px_rgba(43,89,52,1)] z-10 top-[20%]"
                  />
                </div>

                <div className="flex-1 bg-background pt-5 px-5">
                  <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-5" />
                  <h3 className="font-serif text-xl mb-1">
                    Jollof Rice & Chicken
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Detected with 98% accuracy
                  </p>

                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted/60 rounded-xl p-3 flex flex-col justify-center items-center">
                      <span className="text-[10px] uppercase text-muted-foreground mb-1">
                        Protein
                      </span>
                      <span className="font-bold text-sm">32g</span>
                    </div>

                    <div className="flex-1 bg-muted/60 rounded-xl p-3 flex flex-col justify-center items-center">
                      <span className="text-[10px] uppercase text-muted-foreground mb-1">
                        Carbs
                      </span>
                      <span className="font-bold text-sm">48g</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top Left Floating Card — Nutrient Gap Alert */}
            <motion.div
              style={{ x: tlX, y: tlY, opacity: tlOpacity, filter: tlFilter }}
              className="hidden sm:flex absolute z-10 top-[8%] left-0 lg:left-8 w-48"
            >
              <motion.div
                initial={{ opacity: 0, x: -40, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ type: "spring", delay: 0.6 }}
                className="w-full bg-[#cad8f0] dark:bg-[#0c326a] rounded-[2rem] p-4 flex flex-col gap-3 shadow-2xl border border-white/20"
              >
                <div className="flex items-center gap-2">
                  <img src={alertIcon} className="w-5 h-5 text-orange-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-black/70 dark:text-white/70">
                    Nutrient Gaps
                  </span>
                </div>

                {/* Iron */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-black/60 dark:text-white/60">Iron</span>
                    <span className="text-[10px] font-bold text-orange-500">28%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[28%] bg-orange-400 rounded-full" />
                  </div>
                </div>

                {/* Vitamin D */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-black/60 dark:text-white/60">Vitamin D</span>
                    <span className="text-[10px] font-bold text-red-500">14%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[14%] bg-red-400 rounded-full" />
                  </div>
                </div>

                {/* Fiber */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-black/60 dark:text-white/60">Fiber</span>
                    <span className="text-[10px] font-bold text-yellow-600">52%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[52%] bg-yellow-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Bottom Left Floating Card */}
            <motion.div
              style={{ x: blX, y: blY, opacity: blOpacity, filter: blFilter }}
              className="hidden sm:flex absolute z-30 top-[55%] left-4 lg:-left-4 min-w-[140px]"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 0.8 }}
                className="bg-[#fadd74] dark:bg-[#c9a72b] rounded-2xl p-4 shadow-xl border border-yellow-200/50 flex-col w-full"
              >
                <span className="text-[11px] font-medium text-black/60 dark:text-black/80 mb-1 block">
                  Match Rate
                </span>

                <div className="flex items-end justify-between">
                  <span className="text-3xl font-serif text-black leading-none tracking-tight block">
                    98%
                  </span>
                  <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center shrink-0">
                    <ChevronUp className="w-3 h-3 text-yellow-400" />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Calorie Badge */}
            <motion.div
              style={{
                x: starsX,
                opacity: starsOpacity,
                filter: starsFilter,
              }}
              className="hidden sm:flex absolute z-10 top-[24%] left-[150px] lg:left-[210px]"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="bg-[#f9a8f6] dark:bg-[#bb5cb7] rounded-full px-3 py-1.5 shadow-lg border border-white/20 items-center gap-1.5 flex"
              >
                <Flame className="w-3.5 h-3.5 text-black/70" />
                <span className="text-[11px] font-bold text-black/80">620 kcal</span>
              </motion.div>
            </motion.div>

            {/* Top Right Floating Card */}
            <motion.div
              style={{ x: trX, y: trY, opacity: trOpacity, filter: trFilter }}
              className="hidden lg:block absolute z-10 top-[14%] right-[2%] w-64 h-[200px]"
            >
              <motion.div
                initial={{ opacity: 0, x: 40, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ type: "spring", delay: 0.7 }}
                className="bg-[#baf4c1] dark:bg-[#205026] rounded-3xl p-5 shadow-xl border border-green-200/50 flex flex-col relative w-full h-full overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-serif text-black dark:text-white leading-none">
                      85
                    </span>
                    <span className="text-sm font-medium text-black/70 dark:text-white/80">
                      score
                    </span>
                  </div>

                  <p className="text-[12px] text-black/60 dark:text-white/60 mb-5">
                    Excellent Meal Choice
                  </p>

                  <div className="bg-white dark:bg-background rounded-full px-3 py-1 w-fit text-xs font-bold text-black dark:text-white shadow-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-primary" /> Verified
                  </div>
                </div>

                <div className="absolute right-3 bottom-0 top-0 w-24 flex items-center justify-center transform scale-110 opacity-90 saturate-150">
                  <div className="w-16 h-32 rounded-full border-[6px] border-white/40 dark:border-white/10 flex items-center justify-center rotate-12 bg-primary/20 backdrop-blur shadow-inner">
                    <span className="font-serif text-2xl font-bold text-primary dark:text-green-300 -rotate-12 italic">
                      N
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Bottom Right Floating Card — Macro Breakdown */}
            <motion.div
              style={{ x: brX, y: brY, opacity: brOpacity, filter: brFilter }}
              className="hidden sm:flex absolute z-30 top-[60%] right-8 lg:-right-4 w-[160px]"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 0.9 }}
                className="bg-card rounded-[24px] p-4 shadow-xl border border-border/60 flex flex-col gap-3 w-full"
              >
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Macros
                </span>

                {/* Protein */}
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-muted-foreground">Protein</span>
                      <span className="text-[10px] font-bold">32g</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[64%] bg-blue-400 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Carbs */}
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-muted-foreground">Carbs</span>
                      <span className="text-[10px] font-bold">48g</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[80%] bg-amber-400 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Fat */}
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-muted-foreground">Fat</span>
                      <span className="text-[10px] font-bold">18g</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[45%] bg-rose-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
      />
    </section>
  );
};

export default HeroSection;