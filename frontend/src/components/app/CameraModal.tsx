import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture?: (image: string) => void;
}

const CameraModal = ({ open, onClose, onCapture }: CameraModalProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<"live" | "preview">("live");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      setPhase("live");
      setCapturedImage(null);
      setError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    setPhase("preview");
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    stopCamera();
  };

  const retake = () => {
    setCapturedImage(null);
    setPhase("live");
    startCamera();
  };

  const usePhoto = () => {
    if (capturedImage) {
      if (onCapture) {
        onCapture(capturedImage);
        stopCamera();
        onClose();
      } else {
        sessionStorage.setItem("nutrify_scan_image", capturedImage);
        stopCamera();
        onClose();
        navigate("/app/ingredients");
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          {/* Flash overlay */}
          {flash && <div className="absolute inset-0 z-50 bg-white pointer-events-none" />}

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-5 pt-12 pb-3 z-10">
            <span className="text-white/80 text-sm font-medium tracking-wide">
              {phase === "live" ? "Position your food in frame" : "Preview"}
            </span>
            <button
              onClick={() => { stopCamera(); onClose(); }}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Camera / Preview area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Live video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${phase === "live" ? "opacity-100" : "opacity-0"}`}
            />

            {/* Captured preview */}
            {capturedImage && (
              <motion.img
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                src={capturedImage}
                alt="Captured meal"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-sm text-white/70">{error}</p>
              </div>
            )}

            {/* Corner guides for live phase */}
            {phase === "live" && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-64">
                  {/* Top-left */}
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-md" />
                  {/* Top-right */}
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-md" />
                  {/* Bottom-left */}
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-md" />
                  {/* Bottom-right */}
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-md" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="px-8 pb-12 pt-6 flex items-center justify-center gap-10">
            {phase === "live" ? (
              <>
                {/* Spacer */}
                <div className="w-14" />
                {/* Shutter button */}
                <button
                  onClick={capturePhoto}
                  disabled={!!error}
                  className="w-18 h-18 rounded-full bg-white flex items-center justify-center shadow-lg disabled:opacity-40 active:scale-95 transition-transform"
                  style={{ width: 72, height: 72 }}
                >
                  <Camera className="h-7 w-7 text-gray-900" />
                </button>
                {/* Spacer */}
                <div className="w-14" />
              </>
            ) : (
              <>
                {/* Retake */}
                <button
                  onClick={retake}
                  className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-medium">Retake</span>
                </button>

                {/* Use Photo */}
                <Button
                  onClick={usePhoto}
                  className="h-14 px-8 rounded-2xl nutrify-gradient text-white border-0 text-sm font-semibold nutrify-shadow hover:opacity-90 active:scale-95 transition-all"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Use Photo
                </Button>
              </>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CameraModal;
