import React from "react";

const SettingsGearButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ style, ...props }) => (
  <button
    title="Paywall Settings"
    {...props}
    style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: "none",
      backgroundColor: "rgba(50,50,50,0.85)",
      color: "#fff",
      fontSize: 20,
      cursor: "pointer",
      zIndex: 9998,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      ...style,
    }}
  >
    ⚙
  </button>
);

export default SettingsGearButton;
