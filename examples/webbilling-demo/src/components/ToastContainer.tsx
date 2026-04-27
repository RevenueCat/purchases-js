import React from "react";
import type { Toast } from "../hooks/useToast";

const backgroundColors: Record<Toast["type"], string> = {
  info: "#0d6efd",
  success: "#198754",
  error: "#dc3545",
};

const ToastContainer: React.FC<{
  toasts: Toast[];
  onDismiss: (id: number) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 1000003,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          style={{
            pointerEvents: "auto",
            cursor: "pointer",
            backgroundColor: backgroundColors[toast.type],
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            fontSize: 14,
            maxWidth: 360,
            wordBreak: "break-word",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
