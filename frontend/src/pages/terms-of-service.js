import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function TermsOfServicePage() {
  const { t } = useTranslation("legal");

  return (
    <article className="prose max-w-none">
      <h1 className="mb-4 text-2xl font-semibold">{t("terms.title")}</h1>
      <p className="text-sm text-text-tertiary">{t("terms.lastUpdated")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("terms.section1Title")}</h2>
      <p>{t("terms.section1Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("terms.section2Title")}</h2>
      <p>{t("terms.section2Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("terms.section3Title")}</h2>
      <p>{t("terms.section3Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("terms.section4Title")}</h2>
      <p>{t("terms.section4Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("terms.section5Title")}</h2>
      <p>{t("terms.section5Body")}</p>

      <h2 className="mt-6 text-lg font-semibold">{t("terms.section6Title")}</h2>
      <p>{t("terms.section6Body")}</p>
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
