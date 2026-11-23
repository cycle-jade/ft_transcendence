import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation("legal");

  return (
    <article className="prose max-w-none">
      <h1 className="mb-4 text-2xl font-semibold">{t("privacy.title")}</h1>
      <p className="text-sm text-text-tertiary">{t("privacy.lastUpdated")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("privacy.section1Title")}</h2>
      <p>{t("privacy.section1Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("privacy.section2Title")}</h2>
      <p>{t("privacy.section2Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("privacy.section3Title")}</h2>
      <p>{t("privacy.section3Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("privacy.section4Title")}</h2>
      <p>{t("privacy.section4Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("privacy.section5Title")}</h2>
      <p>{t("privacy.section5Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("privacy.section6Title")}</h2>
      <p>{t("privacy.section6Body")}</p>
    </article>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "legal"])),
    },
  };
}
