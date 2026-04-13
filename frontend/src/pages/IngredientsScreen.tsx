import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, Utensils, Check, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { BASE_URL } from "@/lib/api";

const IngredientsScreen = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [ingredients, setIngredients] = useState<{ id: number; name: string }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load ingredients detected by Flask from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("nutrify_ingredients");
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      setIngredients(parsed.map((name, i) => ({ id: i + 1, name })));
    }
  }, []);

  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([
        ...ingredients,
        { id: Date.now(), name: newIngredient.trim() },
      ]);
      setNewIngredient("");
      setIsAdding(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const imageUrl = sessionStorage.getItem("nutrify_image_url") || "";
      const ingredientNames = ingredients.map((i) => i.name);

      const response = await fetch(`${BASE_URL}/api/analyze-health`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientNames, image_url: imageUrl }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("nutrify_analysis", JSON.stringify(data.analysis));
        navigate("/app/analysis");
      } else {
        console.error("API error:", data.error);
        setIsAnalyzing(false);
      }
    } catch (err) {
      console.error("Request failed:", err);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-3">
        <div className="flex items-center justify-between max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/app")} className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-serif text-lg">Ingredients</h1>
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

      <div className="px-5 max-w-md md:max-w-2xl lg:max-w-3xl mx-auto mt-4 md:mt-8 space-y-4 md:space-y-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground"
        >
          Review detected ingredients before analysis.
        </motion.p>

        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <motion.div
              key={ing.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between bg-card rounded-xl px-4 py-3.5 border border-border/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Utensils className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{ing.name}</span>
              </div>
              <div className="flex gap-1.5">
                <button className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => removeIngredient(ing.id)}
                  className="w-7 h-7 rounded-lg bg-destructive/8 flex items-center justify-center text-destructive hover:bg-destructive/15 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}

          {isAdding && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between bg-card rounded-xl px-4 py-3.5 border border-primary/50"
            >
              <div className="flex items-center gap-3 flex-1 mr-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Utensils className="h-4 w-4" />
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ingredient name..."
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addIngredient()}
                  className="bg-transparent border-none outline-none text-sm font-medium w-full flex-1 min-w-0"
                />
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={addIngredient} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setIsAdding(false); setNewIngredient(""); }}
                  className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {!isAdding && (
          <Button
            variant="outline"
            className="w-full rounded-xl h-10 border-dashed font-medium text-xs mt-2"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Ingredient
          </Button>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || ingredients.length === 0}
          className="w-full h-12 nutrify-gradient text-primary-foreground border-0 rounded-xl font-medium text-sm nutrify-shadow hover:opacity-90 mt-2"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Meal"}
        </Button>
      </div>
    </div>
  );
};

export default IngredientsScreen;