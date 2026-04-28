import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { BASE_URL } from "@/lib/api";

import CameraModal from "@/components/app/CameraModal";

const AppHome = () => {
  const navigate = useNavigate();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notFood, setNotFood] = useState(false);
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pendingImage = sessionStorage.getItem("nutrify_pending_scan");
    if (pendingImage) {
      sessionStorage.removeItem("nutrify_pending_scan");
      handleProcessImage(pendingImage);
    }
  }, []);

  const handleProcessImage = async (imageDataUrl: string) => {
    setImagePreview(imageDataUrl);
    setIsProcessing(true);
    setNotFood(false);

    try {
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "meal.jpg", { type: blob.type });

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${BASE_URL}/api/analyze-food`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("nutrify_ingredients", JSON.stringify(data.ingredients));
        sessionStorage.setItem("nutrify_image_url", data.image_url);
        navigate("/app/ingredients");
      } else {
        if (data.error === "not_food") {
          setNotFood(true);
        }
        setIsProcessing(false);
        setImagePreview(null);
      }
    } catch (err) {
      console.error("Request failed:", err);
      setIsProcessing(false);
      setImagePreview(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleProcessImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-2">
        <div className="flex items-center justify-between max-w-md md:max-w-4xl lg:max-w-5xl mx-auto">
          <Link to="/" className="flex items-center">
            <img src={logoLight} alt="Nutrify" className="h-10 w-auto block dark:hidden" />
            <img src={logoDark} alt="Nutrify" className="h-10 w-auto hidden dark:block" />
          </Link>
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

      <div className="px-5 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto mt-6 md:mt-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center md:text-left">
            <h1 className="font-serif text-3xl md:text-5xl lg:text-[3.5rem] leading-[1.1] tracking-tight mb-4 text-foreground">
              Analyze Your Meal
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground md:max-w-md mx-auto md:mx-0">
              Snap or upload a photo to quickly discover what's inside, track your nutrition, and get personalized dietary insights.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-card dark:bg-[#1a1c23] shadow-xl rounded-[2rem] p-8 sm:p-10 border border-border/10 text-center relative overflow-hidden"
          >
            {isProcessing && imagePreview ? (
              <div className="space-y-4">
                <div className="relative w-full aspect-square sm:aspect-video rounded-xl overflow-hidden border border-border/30">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                    <div className="flex gap-1.5 mb-3">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                    <p className="text-white font-medium text-sm">Uploading & Analyzing...</p>
                  </div>
                </div>
              </div>
            ) : notFood ? (
              <div className="space-y-5 text-center py-4">
                <div className="text-5xl">🚫</div>
                <div>
                  <p className="font-semibold text-foreground text-base">That's not food!</p>
                  <p className="text-sm text-muted-foreground mt-1">Please upload a photo of a meal or food item.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="bg-[#2b5934] hover:bg-[#204427] text-white border-0 rounded-xl h-11 font-medium"
                    onClick={() => {
                      setNotFood(false);
                      setCameraOpen(true);
                    }}
                  >
                    <Camera className="mr-2 h-4 w-4" /> Scan
                  </Button>
                  <Button
                    className="bg-[#2b5934] hover:bg-[#204427] text-white border-0 rounded-xl h-11 font-medium"
                    onClick={() => {
                      setNotFood(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-[70px] h-[70px] rounded-[1rem] mx-auto mb-5 flex items-center justify-center bg-[#2b5934] shadow-[0_12px_32px_rgba(43,89,52,0.35)]">
                  <Camera className="h-9 w-9 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[1.1rem] text-foreground mb-1.5">Take a Photo or Upload</h3>
                <p className="text-[13px] text-muted-foreground mb-7">Supports JPG, PNG, HEIC</p>

                <div className="flex items-center gap-3 mb-7 opacity-70">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap">choose an option</span>
                  <div className="h-px bg-border flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="bg-[#2b5934] hover:bg-[#204427] text-white border-0 rounded-xl h-11 font-medium shadow-sm transition-all"
                    onClick={() => setCameraOpen(true)}
                  >
                    <Camera className="mr-2 h-4 w-4" opacity={0.8} /> Scan
                  </Button>
                  <Button
                    className="bg-[#2b5934] hover:bg-[#204427] text-white border-0 rounded-xl h-11 font-medium shadow-sm transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" opacity={0.8} /> Upload
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleProcessImage} />
    </div>
  );
};

export default AppHome;