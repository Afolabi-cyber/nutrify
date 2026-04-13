import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, AlertTriangle, ShoppingCart, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

const AnalysisResult = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [analysis, setAnalysis] = useState<any>(null);

  // Load real analysis from sessionStorage (saved by IngredientsScreen after /api/analyze-health)
  useEffect(() => {
    const stored = sessionStorage.getItem("nutrify_analysis");
    if (stored) {
      setAnalysis(JSON.parse(stored));
    }
  }, []);

  // Map real API response fields to the UI shape
  const goodStuff = analysis?.nutritional_highlights?.map((h: string) => ({
    nutrient: h,
    detail: "",
  })) || [];

  const watchOut = analysis?.health_concerns?.map((c: string) => ({
    nutrient: c,
    detail: "",
  })) || [];

  const supplements = analysis?.dufil_products?.map((p: any) => ({
    name: p.product_name,
    benefit: p.benefit,
    price: "",
  })) || [];

  const healthScore = analysis?.health_score ?? 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-3">
        <div className="flex items-center justify-between max-w-md md:max-w-4xl lg:max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/app")} className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-serif text-lg">Analysis</h1>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <div className="px-5 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto mt-4 md:mt-10">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-6 md:gap-10">
          <div className="space-y-5 md:space-y-8">
            {/* Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl p-6 border border-border/30"
            >
              <div className="flex items-center gap-5">
                <div
                  className="w-18 h-18 rounded-2xl nutrify-gradient flex items-center justify-center shrink-0"
                  style={{ width: 72, height: 72 }}
                >
                  <span className="text-2xl font-serif text-primary-foreground">
                    {analysis ? healthScore : "—"}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Nutrient Score</h3>
                  <p className="text-[11px] text-muted-foreground mb-2.5">
                    {analysis?.analysis || "Loading analysis..."}
                  </p>
                  <Progress
                    value={healthScore}
                    className="h-1.5 rounded-full bg-muted [&>div]:nutrify-gradient"
                  />
                </div>
              </div>
            </motion.div>

            {/* Supplement / DUFIL product suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" /> Suggested Products
              </h3>
              <div className="space-y-2">
                {supplements.length > 0 ? (
                  supplements.map((sup: any) => (
                    <div
                      key={sup.name}
                      className="bg-card rounded-xl p-4 border border-border/30 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-sm">{sup.name}</p>
                        <p className="text-[11px] text-muted-foreground">{sup.benefit}</p>
                      </div>
                      {sup.price && (
                        <span className="text-xs font-semibold text-primary whitespace-nowrap ml-3">
                          {sup.price}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No product suggestions available.</p>
                )}
              </div>
            </motion.div>
          </div>

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
                {goodStuff.length > 0 ? (
                  goodStuff.map((item: any) => (
                    <div key={item.nutrient} className="flex items-start gap-3 bg-card/70 rounded-xl p-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{item.nutrient}</p>
                        {item.detail && (
                          <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
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
                {watchOut.length > 0 ? (
                  watchOut.map((item: any) => (
                    <div key={item.nutrient} className="flex items-start gap-3 bg-card/70 rounded-xl p-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{item.nutrient}</p>
                        {item.detail && (
                          <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No concerns detected.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;