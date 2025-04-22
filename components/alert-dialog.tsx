"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface AlertDialogProps {
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number; // 表示時間（ミリ秒）
  onClose?: () => void;
}

// アラートの種類ごとの色設定
const alertStyles = {
  success: {
    container: "bg-green-50 border-green-500 text-green-800",
    icon: "bg-green-100 text-green-500",
  },
  error: {
    container: "bg-red-50 border-red-500 text-red-800",
    icon: "bg-red-100 text-red-500",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-500 text-yellow-800",
    icon: "bg-yellow-100 text-yellow-500",
  },
  info: {
    container: "bg-blue-50 border-blue-500 text-blue-800",
    icon: "bg-blue-100 text-blue-500",
  },
};

// アラートアイコン
const alertIcons = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

export function AlertDialog({
  title,
  message,
  type = "info",
  duration = 3000,
  onClose,
}: AlertDialogProps) {
  const [isVisible, setIsVisible] = useState(true);

  // 一定時間後に自動的に閉じる
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  // 閉じる処理
  const handleClose = () => {
    setIsVisible(false);
    // アニメーション完了後にonClose呼び出し用のタイマー
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // アニメーション時間に合わせる
  };

  const styles = alertStyles[type];
  const icon = alertIcons[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed z-50 top-4 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`flex items-center p-4 mb-4 rounded-lg border-l-4 ${styles.container} max-w-md shadow-lg`}
            role="alert"
          >
            <div
              className={`flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg ${styles.icon}`}
            >
              {icon}
            </div>
            <div className="ml-3 text-sm font-medium">
              <div className="font-bold">{title}</div>
              <div>{message}</div>
            </div>
            <button
              type="button"
              className={`ml-auto -mx-1.5 -my-1.5 ${styles.icon} rounded-lg p-1.5 inline-flex h-8 w-8`}
              onClick={handleClose}
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// グローバルアラートを管理するためのシンプルなコンテキスト
import { createContext, useContext } from "react";

interface AlertContextProps {
  showAlert: (props: Omit<AlertDialogProps, "onClose">) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertDialogProps | null>(null);

  const showAlert = (props: Omit<AlertDialogProps, "onClose">) => {
    setAlert({ ...props, onClose: () => setAlert(null) });
  };

  const closeAlert = () => {
    setAlert(null);
  };

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      {alert && <AlertDialog {...alert} />}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
