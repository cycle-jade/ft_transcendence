import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import api, { endpoints } from "@/lib/api";

export default function SkillPeoplePage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { id, name } = router.query;
  const skillId = id ? Number(id) : null;

  const [people, setPeople]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!skillId) return;
    api.get(endpoints.users.searchBySkill(skillId))
      .then((res) => setPeople(res.data || []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [skillId]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {name ? `People with skill: ${name}` : "People with this skill"}
        </h1>
        <p className="text-text-secondary">Anyone who has added this skill to their profile.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : fetchError ? (
        <p className="text-text-secondary">Could not load people for this skill.</p>
      ) : people.length === 0 ? (
        <p className="text-text-secondary">Nobody has this skill yet.</p>
      ) : (
        <div className="space-y-3">
          {people.map((person) => (
            <Card key={person.id}>
              <Link href={`/profile/${person.id}`} className="flex items-center gap-3 hover:text-accent">
                <Avatar name={person.nickname} src={person.avatarUrl} size={40} />
                <span className="font-medium">{person.nickname}</span>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  const translations = await serverSideTranslations(locale, ["common"]);
  return { props: { ...translations } };
}
