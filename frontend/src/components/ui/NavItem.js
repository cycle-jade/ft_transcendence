import Link from "next/link";

export default function NavItem({ href, children, active = false, className = "" }) {
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active ? "text-text font-medium" : "text-text-secondary hover:text-text"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
