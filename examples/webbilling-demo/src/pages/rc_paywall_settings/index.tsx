import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type CustomVariableEntry,
  writeEntries,
} from "../../hooks/usePaywallSettings";

function readEntries(): CustomVariableEntry[] {
  try {
    const raw = localStorage.getItem("rc_paywall_custom_variables");
    if (!raw) return [];
    return JSON.parse(raw) as CustomVariableEntry[];
  } catch {
    return [];
  }
}

const RCPaywallSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<CustomVariableEntry[]>(readEntries);

  const updateKey = (index: number, key: string) => {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, key } : entry)),
    );
  };

  const updateValue = (index: number, value: string) => {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, value } : entry)),
    );
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleSave = () => {
    writeEntries(entries);
    navigate(-1);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        padding: 40,
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          padding: 32,
          width: "100%",
          maxWidth: 600,
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600 }}>
          Paywall Settings
        </h2>
        <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>
          Configure custom variables passed to presentPaywall. These are stored
          in localStorage and shared across all RC paywall pages.
        </p>

        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>
          Custom Variables
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entries.map((entry, index) => (
            <div
              key={index}
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <input
                type="text"
                placeholder="key"
                value={entry.key}
                onChange={(e) => updateKey(index, e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  fontSize: 14,
                }}
              />
              <input
                type="text"
                placeholder="value"
                value={entry.value}
                onChange={(e) => updateValue(index, e.target.value)}
                style={{
                  flex: 2,
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  fontSize: 14,
                }}
              />
              <button
                onClick={() => removeEntry(index)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e44",
                  borderRadius: 4,
                  backgroundColor: "#fff",
                  color: "#e44",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addEntry}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            border: "1px solid #999",
            borderRadius: 4,
            backgroundColor: "#fff",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          + Add Variable
        </button>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 22px",
              border: "1px solid #ccc",
              borderRadius: 4,
              backgroundColor: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 22px",
              border: "none",
              borderRadius: 4,
              backgroundColor: "#333",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Save & Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default RCPaywallSettingsPage;
