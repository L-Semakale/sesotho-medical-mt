// frontend/src/components/ui/Alert.js

const ALERT_STYLES = {
  success: {
    background: "#f0fdf4",
    color: "#16a34a",
    borderColor: "#bbf7d0",
  },
  error: {
    background: "#fef2f2",
    color: "#dc2626",
    borderColor: "#fecaca",
  },
  info: {
    background: "#eff6ff",
    color: "#1e40af",
    borderColor: "#bfdbfe",
  },
  warning: {
    background: "#fffbeb",
    color: "#b45309",
    borderColor: "#fde68a",
  },
};

function Alert({ type = "info", children, style = {} }) {
  const s = ALERT_STYLES[type] || ALERT_STYLES.info;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      style={{
        ...s,
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid",
        fontSize: 14,
        lineHeight: 1.6,
        marginBottom: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Alert;
