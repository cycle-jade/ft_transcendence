import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

export default function PeoplePage() {
  const { t } = useTranslation(["people", "common"]);
  const { user } = useAuth();

  const [allUsers, setAllUsers]     = useState([]);
  const [following, setFollowing]   = useState([]);
  const [statusMap, setStatusMap]   = useState({}); // { [userId]: { onlineStatus, blocked } }
  const [query, setQuery]           = useState("");
  const [loading, setLoading]       = useState(true);
  const [toggling, setToggling]     = useState({});

  useEffect(() => {
    const requests = [api.get(endpoints.users.all)];
    if (user) requests.push(api.get(endpoints.social.following));

    Promise.all(requests)
      .then(([usersRes, followRes]) => {
        setAllUsers(usersRes.data || []);
        if (followRes) setFollowing(followRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching]       = useState(false);

  // Search by nickname using real endpoint when query looks like a name
  // Fall back to filtering the allUsers list for instant results
  async function handleSearch(q) {
    setQuery(q);
    if (!q.trim()) { setSearchResult(null); return; }
    // If it's purely numeric treat as ID lookup
    if (/^\d+$/.test(q.trim())) { setSearchResult(null); return; }
    setSearching(true);
    try {
      const res = await api.get(endpoints.users.byNickname(q.trim()));
      setSearchResult([res.data]); // returns a single UserDto
    } catch {
      setSearchResult(null); // not found — fall back to local filter
    } finally {
      setSearching(false);
    }
  }

  const isFollowing = (id) => following.some((u) => u.id === id);

  async function toggleFollow(targetId) {
    if (!user) return;
    setToggling((prev) => ({ ...prev, [targetId]: true }));
    try {
      if (isFollowing(targetId)) {
        await api.delete(endpoints.social.unfollow(targetId));
        setFollowing((prev) => prev.filter((u) => u.id !== targetId));
      } else {
        await api.post(endpoints.social.follow(targetId));
        setFollowing((prev) => [...prev, { id: targetId }]);
      }
    } catch (err) {
      console.error("Follow toggle failed", err);
    } finally {
      setToggling((prev) => ({ ...prev, [targetId]: false }));
    }
  }

  // Use real nickname search result if available, otherwise filter local list
  const filtered = (searchResult || allUsers).filter((u) => {
    if (u.id === user?.id) return false;
    if (!query || searchResult) return true;
    const q = query.toLowerCase();
    return (
      u.nickname?.toLowerCase().includes(q) ||
      String(u.id) === q.trim()
    );
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("people:title")}</h1>

      <Input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by nickname or user ID..."
      />

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <p className="text-text-secondary">{t("people:noResults")}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((person) => {
            const followed = isFollowing(person.id);
            const status   = statusMap[person.id];
            const isOnline = status?.onlineStatus === "ONLINE";
            return (
              <Card key={person.id} className="flex items-center justify-between">
                <Link
                  href={`/profile/${person.id}`}
                  className="flex items-center gap-3 hover:text-accent"
                >
                  <div className="relative">
                    <Avatar name={person.nickname} src={person.avatarUrl} size={40} />
                    {status && (
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg ${isOnline ? "bg-success" : "bg-text-tertiary"}`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{person.nickname}</p>
                    {status && (
                      <p className="text-xs text-text-tertiary">
                        {isOnline ? "Online" : "Offline"}
                        {status.blocked ? " · Blocked" : ""}
                      </p>
                    )}
                  </div>
                </Link>
                {user && (
                  <Button
                    variant={followed ? "secondary" : "primary"}
                    disabled={!!toggling[person.id]}
                    onClick={() => toggleFollow(person.id)}
                  >
                    {followed ? t("common:actions.unfollow") : t("common:actions.follow")}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  const translations = await serverSideTranslations(locale, ["common", "people"]);
  return { props: { ...translations } };
}
