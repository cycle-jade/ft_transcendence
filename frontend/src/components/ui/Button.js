const variants = {
  primary: "text-white hover:opacity-90",
  secondary: "bg-bg-tertiary text-text hover:bg-border-light border border-border",
  danger: "bg-danger text-white hover:bg-danger-hover",
  ghost: "bg-transparent text-text-secondary hover:text-text hover:bg-bg-secondary",
};

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
}) {
  const style = variant === "primary" ? { background: "var(--accent-gradient)" } : undefined;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`rounded-md px-5 py-2.5 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
