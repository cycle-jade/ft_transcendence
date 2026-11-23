export default function Textarea({
  value,
  onChange,
  placeholder = "",
  name,
  id,
  rows = 5,
  required = false,
  disabled = false,
  className = "",
}) {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      disabled={disabled}
      className={`w-full rounded-md border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text placeholder-text-tertiary outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}
