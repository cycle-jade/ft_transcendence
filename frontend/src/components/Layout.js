import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import BackgroundPanels from "./BackgroundPanels";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/posts", key: "feed" },
  { href: "/channels", key: "channels" },
  { href: "/people", key: "people" },
  { href: "/profile", key: "profile" },
  { href: "/admin", key: "admin" },
];

// `sidebar` is optional contextual content for the right-hand panel
// (e.g. channel stats, profile About/Activity, online friends list).
// Pages opt in by setting Page.sidebar = (<.../>) — see pages/posts/index.js
// for an example. If a page doesn't set it, no right panel renders.
export default function Layout({ children, sidebar }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/auth/login");
  }

  return (
    <div className="relative flex min-h-screen bg-bg text-text">
      <BackgroundPanels />

      <aside className="relative z-10 flex w-48 flex-col border-r border-border bg-bg px-3 py-5">
        <Link href="/" className="mb-6 px-3 font-semibold text-text">
          {t("appName")}
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            // Admin nav item is only shown to logged-in admins — note this is
            // a UI convenience, not real route protection. The /admin page
            // itself still needs its own guard once we get there.
            if (item.key === "admin" && user?.role !== "ADMIN") return null;

            const active = router.pathname === item.href || router.pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm transition-opacity ${
                  active ? "font-medium text-white" : "text-text-secondary hover:text-text"
                }`}
                style={active ? { background: "var(--accent-gradient)" } : undefined}
              >
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <LanguageSwitcher />
          <div className="flex flex-col gap-2 px-3 text-xs text-text-tertiary">
            {user ? (
              <button onClick={handleLogout} className="text-left hover:text-text-secondary">
                {t("nav.logout")} ({user.nickname})
              </button>
            ) : (
              <Link href="/auth/login" className="hover:text-text-secondary">{t("nav.login")}</Link>
            )}
            <Link href="/privacy-policy" className="hover:text-text-secondary">{t("nav.privacyPolicy")}</Link>
            <Link href="/terms-of-service" className="hover:text-text-secondary">{t("nav.termsOfService")}</Link>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex-1 px-6 py-6">{children}</main>

      {sidebar && (
        <aside className="relative z-10 w-72 px-4 py-6">
          {sidebar}
        </aside>
      )}
    </div>
  );
}
