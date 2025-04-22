"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface CustomAlertProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose?: () => void;
}

export function CustomAlert({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: CustomAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const bgColor = type === "success" ? "bg-green-100" : "bg-red-100";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const borderColor =
    type === "success" ? "border-green-500" : "border-red-500";
  const icon = type === "success" ? "✅" : "❌";

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`flex items-center p-4 rounded-lg shadow-xl border-l-4 ${bgColor} ${textColor} ${borderColor}`}
            style={{ minWidth: "320px", maxWidth: "450px" }}
          >
            <div className="mr-3 text-lg">{icon}</div>
            <div className="flex-1 font-medium">{message}</div>
            <button
              onClick={handleClose}
              className="ml-4 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
