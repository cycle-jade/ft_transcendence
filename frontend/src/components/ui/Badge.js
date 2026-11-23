const variants = {
  default: "bg-bg-tertiary text-text-secondary",
  accent: "bg-accent/15 text-accent-hover",
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger-hover",
};

export default function Badge({ children, variant = "default", onClick, className = "" }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
