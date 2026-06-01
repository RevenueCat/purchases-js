import React from "react";
import { useNavigate } from "react-router-dom";
import {
  usePaywallSettingsEditor,
  type CustomVariableType,
} from "../../hooks/usePaywallSettings";

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box" as const,
    padding: "40px",
    backgroundColor: "var(--color-page-muted)",
    colorScheme: "light" as const,
  },
  card: {
    maxWidth: "640px",
    margin: "0 auto",
    padding: "32px",
    borderRadius: "16px",
    backgroundColor: "var(--color-page-surface)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "24px",
    fontWeight: 600,
  },
  description: {
    margin: "0 0 24px",
    fontSize: "14px",
    color: "var(--color-text-muted)",
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: "15px",
    fontWeight: 600,
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap" as const,
  },
  typeSelect: {
    flexShrink: 0,
    minWidth: "90px",
  },
  keyInput: {
    flex: 1,
    minWidth: "120px",
  },
  valueInput: {
    flex: 2,
    minWidth: "160px",
  },
  removeButton: {
    flexShrink: 0,
    minWidth: "44px",
    paddingInline: 0,
    fontSize: "18px",
  },
  addButton: {
    marginTop: "12px",
  },
  actions: {
    marginTop: "28px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap" as const,
  },
} satisfies Record<string, React.CSSProperties>;

const RCPaywallSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    entries,
    updateKey,
    updateValue,
    updateType,
    removeEntry,
    addEntry,
    save,
  } = usePaywallSettingsEditor();

  const handleSave = () => {
    save();
    navigate(-1);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Paywall Settings</h2>
        <p style={styles.description}>
          Configure custom variables passed to presentPaywall. These are stored
          in localStorage and shared across all RC paywall pages.
        </p>

        <h3 style={styles.sectionTitle}>Custom Variables</h3>

        <div style={styles.list}>
          {entries.map((entry, index) => (
            <div key={index} style={styles.row}>
              <select
                value={entry.type}
                onChange={(e) =>
                  updateType(index, e.target.value as CustomVariableType)
                }
                className="compact-input"
                style={styles.typeSelect}
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
              </select>
              <input
                type="text"
                placeholder="key"
                value={entry.key}
                onChange={(e) => updateKey(index, e.target.value)}
                className="compact-input"
                style={styles.keyInput}
              />
              {entry.type === "boolean" ? (
                <select
                  value={entry.value}
                  onChange={(e) => updateValue(index, e.target.value)}
                  className="compact-input"
                  style={styles.valueInput}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  type={entry.type === "number" ? "number" : "text"}
                  placeholder="value"
                  value={entry.value}
                  onChange={(e) => updateValue(index, e.target.value)}
                  className="compact-input"
                  style={styles.valueInput}
                />
              )}
              <button
                onClick={() => removeEntry(index)}
                className="compact-button compact-button--danger"
                style={styles.removeButton}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addEntry}
          className="compact-button compact-button--secondary"
          style={styles.addButton}
        >
          + Add Variable
        </button>

        <div style={styles.actions}>
          <button
            onClick={() => navigate(-1)}
            className="compact-button compact-button--secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="compact-button compact-button--primary"
          >
            Save & Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default RCPaywallSettingsPage;
