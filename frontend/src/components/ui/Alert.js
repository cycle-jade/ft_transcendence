const variants = {
  info: "border-accent/30 bg-accent/10 text-accent-text",
  success: "border-success/30 bg-success/10 text-success",
  danger: "border-danger/30 bg-danger/10 text-danger-hover",
};

export default function Alert({ children, variant = "info", className = "" }) {
  return (
    <div
      role="alert"
      className={`rounded-lg border px-4 py-3 text-sm ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
