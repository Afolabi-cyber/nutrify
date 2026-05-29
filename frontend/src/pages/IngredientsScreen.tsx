import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Utensils, Sun, Moon,
  Flame, Wheat, Leaf, Droplets, Drumstick,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { BASE_URL } from "@/lib/api";

// ── Macro card ─────────────────────────────────────────────────────────────────
const MacroCard = ({ macros }: { macros: any }) => {
  if (!macros) return null;
  const items = [
    { label: "Carbs",   value: macros.carbohydrates_g ?? 0, unit: "g", color: "bg-amber-400",  icon: <Wheat    className="h-3.5 w-3.5" />, dailyMax: 300 },
    { label: "Protein", value: macros.protein_g        ?? 0, unit: "g", color: "bg-blue-500",   icon: <Drumstick className="h-3.5 w-3.5" />, dailyMax: 50  },
    { label: "Fibre",   value: macros.fibre_g          ?? 0, unit: "g", color: "bg-green-500",  icon: <Leaf     className="h-3.5 w-3.5" />, dailyMax: 30  },
    { label: "Fats",    value: macros.fats_g           ?? 0, unit: "g", color: "bg-rose-400",   icon: <Droplets className="h-3.5 w-3.5" />, dailyMax: 65  },
  ];
  const total = (macros.carbohydrates_g ?? 0) + (macros.protein_g ?? 0) + (macros.fats_g ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="bg-card rounded-2xl p-5 border border-border/30"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" /> Macronutrients
        </h4>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{macros.calories ?? "—"}</span>
          <span className="text-xs text-muted-foreground">kcal</span>
        </div>
      </div>

      {total > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden mb-4 gap-0.5">
          {items.slice(0, 3).map((m) => (
            <div
              key={m.label}
              className={`${m.color} rounded-full`}
              style={{ width: `${Math.max((m.value / total) * 100, 1)}%` }}
            />
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {items.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${m.color}`}>
              {m.icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs font-medium">{m.label}</span>
                <span className="text-xs font-semibold">
                  {m.value}<span className="text-muted-foreground font-normal">{m.unit}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${m.color}`}
                  style={{ width: `${Math.min((m.value / m.dailyMax) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">
        Bar shows % of typical daily reference (2000 kcal diet). Values are per serving estimates.
      </p>
    </motion.div>
  );
};

// ── Main screen ────────────────────────────────────────────────────────────────
const IngredientsScreen = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [foodName, setFoodName] = useState("");
  const [macronutrients, setMacronutrients] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(true);       // ingredient accordion
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const stored = sessionStorage.getItem("nutrify_ingredients");
    if (stored) setIngredients(JSON.parse(stored));

    const name = sessionStorage.getItem("nutrify_food_name");
    if (name) setFoodName(name);

    const macros = sessionStorage.getItem("nutrify_macronutrients");
    if (macros) setMacronutrients(JSON.parse(macros));
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    const imageUrl = sessionStorage.getItem("nutrify_image_url") || "";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          setError(`Service busy. Retrying… (${attempt}/${MAX_RETRIES})`);
          await sleep(delay);
        }

        const response = await fetch(`${BASE_URL}/api/analyze-health`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredients, image_url: imageUrl }),
        });

        const data = await response.json();

        if (response.status === 500 && data.error?.includes("503")) {
          if (attempt === MAX_RETRIES) {
            setError("AI service is currently overloaded. Please try again in a moment.");
            setIsAnalyzing(false);
            return;
          }
          continue;
        }

        if (data.success) {
          setError(null);
          sessionStorage.setItem("nutrify_analysis", JSON.stringify(data.analysis));
          navigate("/app/analysis");
          return;
        } else {
          setError("Analysis failed. Please try again.");
          setIsAnalyzing(false);
          return;
        }
      } catch {
        if (attempt === MAX_RETRIES) {
          setError("Request failed. Please check your connection and try again.");
          setIsAnalyzing(false);
          return;
        }
      }
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* Header */}
      <div className="px-5 pt-12 pb-3">
        <div className="flex items-center justify-between max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/app")}
              className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-serif text-lg">Ingredients</h1>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
          >
            {theme === "dark"
              ? <Sun  className="h-4 w-4 text-muted-foreground" />
              : <Moon className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      <div className="px-5 max-w-md md:max-w-2xl lg:max-w-3xl mx-auto mt-4 md:mt-8 space-y-4">

        {/* Food name */}
        {foodName && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-xl">🍽️</span>
            <div>
              <h2 className="font-serif text-lg leading-tight text-foreground">{foodName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Review before running analysis.</p>
            </div>
          </motion.div>
        )}

        {/* Macro card */}
        <MacroCard macros={macronutrients} />

        {/* Collapsible ingredient list */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card rounded-2xl border border-border/30 overflow-hidden"
        >
          {/* Accordion header */}
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">
                Detected Ingredients
              </span>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {ingredients.length}
              </span>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>

          {/* Ingredient list */}
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key="list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-1.5 border-t border-border/20 pt-3">
                  {ingredients.map((ing, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-muted/40"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm">{ing}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Analyze button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || ingredients.length === 0}
            className="w-full h-12 nutrify-gradient text-primary-foreground border-0 rounded-xl font-medium text-sm nutrify-shadow hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {isAnalyzing
              ? (error?.includes("Retrying") ? "Retrying…" : "Analyzing…")
              : "Analyze Meal"}
          </Button>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs mt-2 text-center ${
                error.includes("Retrying") ? "text-amber-500" : "text-red-500"
              }`}
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default IngredientsScreen;