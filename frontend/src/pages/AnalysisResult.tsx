import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, AlertTriangle, ShoppingCart, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "@/lib/api";

const AnalysisResult = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("nutrify_analysis");
    if (stored) setAnalysis(JSON.parse(stored));
  }, []);

  const goodStuff  = analysis?.nutritional_highlights ?? [];
  const watchOut   = analysis?.health_concerns ?? [];
  const supplements = analysis?.nutrify_products?.map((p: any) => ({
    name:       p.product_name,
    benefit:    p.benefit,
    deficiency: p.deficiency_addressed,
    image_url:  p.image_url || null,
  })) || [];

  const healthScore = analysis?.health_score ?? 0;
  const cuisineType = analysis?.cuisine_type ?? "";
  const disclaimer  = analysis?.disclaimer ??
    "This analysis is for informational and educational purposes only. It is not a substitute for professional medical or dietetic advice. Please consult a qualified healthcare provider before making changes to your diet.";

  const scoreLabel =
    healthScore >= 70 ? "Good" : healthScore >= 45 ? "Fair" : "Poor";
  const scoreColor =
    healthScore >= 70 ? "text-green-600 dark:text-green-400" :
    healthScore >= 45 ? "text-amber-500 dark:text-amber-400" :
                        "text-red-500 dark:text-red-400";

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-3">
        <div className="flex items-center justify-between max-w-md md:max-w-4xl lg:max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/app")}
              className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg">Analysis</h1>
              {cuisineType && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {cuisineType}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
          >
            {theme === "dark"
              ? <Sun className="h-4 w-4 text-muted-foreground" />
              : <Moon className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto mt-4 md:mt-10">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-6 md:gap-10">

          {/* Left column */}
          <div className="space-y-5 md:space-y-8">

            {/* Score card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl p-6 border border-border/30"
            >
              <div className="flex items-center gap-5">
                {/* Score badge */}
                <div
                  className="shrink-0 rounded-2xl nutrify-gradient flex flex-col items-center justify-center"
                  style={{ width: 72, height: 72 }}
                >
                  <span className="text-xl font-bold text-primary-foreground leading-none">
                    {analysis ? `${healthScore}%` : "—"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-semibold text-sm">Nutrient Score</h3>
                    <span className={`text-[11px] font-semibold ${scoreColor}`}>
                      {scoreLabel}
                    </span>
                  </div>
                  <Progress
                    value={healthScore}
                    className="h-1.5 rounded-full bg-muted [&>div]:nutrify-gradient mb-2"
                  />
                  {/* Deliberately small — users don't read it anyway */}
                  {analysis?.analysis && (
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                      {analysis.analysis}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Suggested products */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" /> Suggested Products
              </h3>
              <div className="space-y-2">
                {supplements.length > 0 ? (
                  supplements.map((sup: any, i: number) => (
                    <motion.div
                      key={sup.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.22 + i * 0.05 }}
                      className="bg-card rounded-xl p-4 border border-border/30 flex items-center gap-3"
                    >
                      {sup.image_url ? (
                        <img
                          src={`${BASE_URL}${sup.image_url}`}
                          alt={sup.name}
                          className="w-14 h-14 rounded-xl object-contain bg-muted/40 shrink-0 p-1"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-muted/40 shrink-0 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{sup.name}</p>
                        {sup.deficiency && (
                          <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 mb-1">
                            {sup.deficiency}
                          </span>
                        )}
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{sup.benefit}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No product suggestions available.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-5 md:space-y-8">

            {/* Good stuff */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-accent/30 rounded-2xl p-5"
            >
              <h4 className="font-semibold text-xs uppercase tracking-wider text-accent-foreground mb-3 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> The Good Stuff
              </h4>
              <div className="space-y-2">
                {goodStuff.length > 0 ? goodStuff.map((item: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="flex items-start gap-3 bg-card/70 rounded-xl p-3"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-[5px] shrink-0" />
                    <p className="text-sm leading-relaxed">{item}</p>
                  </motion.div>
                )) : (
                  <p className="text-xs text-muted-foreground">No highlights available.</p>
                )}
              </div>
            </motion.div>

            {/* Watch out */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-destructive/5 rounded-2xl p-5"
            >
              <h4 className="font-semibold text-xs uppercase tracking-wider text-destructive mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Watch Out
              </h4>
              <div className="space-y-2">
                {watchOut.length > 0 ? watchOut.map((item: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.04 }}
                    className="flex items-start gap-3 bg-card/70 rounded-xl p-3"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-[5px] shrink-0" />
                    <p className="text-sm leading-relaxed">{item}</p>
                  </motion.div>
                )) : (
                  <p className="text-xs text-muted-foreground">No concerns detected.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto mt-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">{disclaimer}</p>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="px-5 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto mt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={() => navigate("/app")}
            className="w-full sm:w-auto nutrify-gradient text-primary-foreground border-0 rounded-xl h-11 font-medium text-sm nutrify-shadow hover:opacity-90 transition-all"
          >
            Scan Another Meal
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full sm:w-auto rounded-xl h-11 text-sm font-medium"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalysisResult;