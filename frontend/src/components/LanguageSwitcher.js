import { useRouter } from "next/router";

const languages = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "it", label: "IT" },
  { code: "de", label: "DE" },
  { code: "es", label: "ES" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const { locale, pathname, query, asPath } = router;

  function changeLanguage(code) {
    // Next.js's built-in i18n routing: pushing the same path with a
    // different `locale` re-renders the page with that locale's
    // translations and updates the URL prefix (e.g. /fr/profile).
    router.push({ pathname, query }, asPath, { locale: code });
  }

  return (
    <div className="flex gap-1 px-3">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
            locale === lang.code
              ? "text-white"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
          style={locale === lang.code ? { background: "var(--accent-gradient)" } : undefined}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
