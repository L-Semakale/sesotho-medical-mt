// frontend/src/components/ui/StatusPill.js

const STATUS_STYLES = {
  verified: {
    background: "#dcfce7",
    color: "#15803d",
  },
  reviewed: {
    background: "#e0f2fe",
    color: "#0369a1",
  },
  translated: {
    background: "#fef9c3",
    color: "#a16207",
  },
  raw: {
    background: "#f1f5f9",
    color: "#475569",
  },
  rejected: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  pending: {
    background: "#fef9c3",
    color: "#a16207",
  },
  evaluated: {
    background: "#dcfce7",
    color: "#15803d",
  },
  hiv: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  tb: {
    background: "#e0f2fe",
    color: "#0369a1",
  },
  medication: {
    background: "#fef3c7",
    color: "#92400e",
  },
  symptoms: {
    background: "#ede9fe",
    color: "#6d28d9",
  },
  appointment: {
    background: "#ccfbf1",
    color: "#0f766e",
  },
  maternal: {
    background: "#fce7f3",
    color: "#be185d",
  },
  general: {
    background: "#f1f5f9",
    color: "#475569",
  },
};

function StatusPill({ value = "raw", children }) {
  const key = String(value || "raw").toLowerCase();
  const style = STATUS_STYLES[key] || STATUS_STYLES.raw;

  return (
    <span
      style={{
        ...style,
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {children || value}
    </span>
  );
}

export default StatusPill;
