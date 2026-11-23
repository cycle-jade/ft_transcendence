import { useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import PostList from "@/components/PostList";
import NewPostForm from "@/components/NewPostForm";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function FeedPage() {
  const { t } = useTranslation(["posts", "common"]);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("posts:feedTitle")}</h1>
      <p className="text-text-secondary">{t("posts:feedSubtitle")}</p>
      <NewPostForm onCreated={() => setRefreshKey((k) => k + 1)} />
      <PostList refreshKey={refreshKey} />
    </div>
  );
}

FeedPage.sidebar = function FeedSidebar() {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-3 text-sm font-medium">Channels</h2>
        <p className="text-xs text-text-tertiary">
          <Link href="/channels" className="text-accent hover:underline">Browse channels →</Link>
        </p>
      </Card>
    </div>
  );
};

export async function getServerSideProps({ locale }) {
  const translations = await serverSideTranslations(locale, ["common", "posts"]);
  return { props: { ...translations } };
}
