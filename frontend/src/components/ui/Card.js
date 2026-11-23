export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-lg border border-border bg-bg-secondary p-6 ${className}`}
    >
      {children}
    </div>
  );
}
