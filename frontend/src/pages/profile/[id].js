import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PostList from "@/components/PostList";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

export default function OtherUserProfilePage() {
  const { t } = useTranslation(["profile", "common"]);
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [otherUser, setOtherUser]     = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [otherSkills, setOtherSkills] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [fetchError, setFetchError]   = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [toggling, setToggling]       = useState(false);
  const [followChecked, setFollowChecked] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(endpoints.users.byId(id)),
      api.get(endpoints.profiles.byUserId(id)).catch(() => ({ data: null })),
      api.get(endpoints.skills.byUser(id)).catch(() => ({ data: [] })),
    ])
      .then(([userRes, profileRes, skillsRes]) => {
        setOtherUser(userRes.data);
        setOtherProfile(profileRes.data);
        setOtherSkills(skillsRes.data || []);
      })
      .catch(() => setFetchError(true))
      .finally(() => setProfileLoading(false));

    // Poll online status every 15 seconds
    const interval = setInterval(() => {
      api.get(endpoints.users.statusById(id))
        .then((res) => setOtherUser((prev) => prev ? { ...prev, onlineStatus: res.data.onlineStatus } : prev))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [id]);

  // Check if we're already following this user
  useEffect(() => {
    if (!user || !id) return;
    api.get(endpoints.social.following)
      .then((res) => {
        setIsFollowing(res.data.some((u) => u.id === Number(id)));
      })
      .catch(() => {})
      .finally(() => setFollowChecked(true));
  }, [user, id]);

  async function toggleFollow() {
    if (!user) return;
    setToggling(true);
    try {
      if (isFollowing) {
        await api.delete(endpoints.social.unfollow(id));
        setIsFollowing(false);
      } else {
        await api.post(endpoints.social.follow(id));
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow toggle failed", err);
    } finally {
      setToggling(false);
    }
  }

  if (profileLoading) {
    return <div className="flex justify-center py-8"><Spinner /></div>;
  }

  if (fetchError || !otherUser) {
    return <p className="text-text-secondary">Could not load this profile.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar name={otherUser.nickname} src={otherProfile?.avatarUrl} size={64} />
              <span
                className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-bg ${
                  otherUser.onlineStatus === "ONLINE" ? "bg-success" : "bg-text-tertiary"
                }`}
                title={otherUser.onlineStatus === "ONLINE" ? "Online" : "Offline"}
              />
            </div>
            <div>
              <p className="font-medium">{otherProfile?.displayName || otherUser.nickname}</p>
              <p className="text-sm text-text-tertiary">@{otherUser.nickname}</p>
              {(otherUser.name || otherUser.lastName) && (
                <p className="text-sm text-text-tertiary">
                  {[otherUser.name, otherUser.lastName].filter(Boolean).join(" ")}
                </p>
              )}
              {otherUser.email && <p className="text-sm text-text-tertiary">✉️ {otherUser.email}</p>}
              {otherUser.phone && <p className="text-sm text-text-tertiary">📞 {otherUser.phone}</p>}
              {otherUser.role === "ADMIN" && (
                <Badge variant="accent" className="mt-2">{t("common:status.admin")}</Badge>
              )}
            </div>
          </div>


          {user && user.id !== Number(id) && followChecked && (
            <Button
              variant={isFollowing ? "secondary" : "primary"}
              disabled={toggling}
              onClick={toggleFollow}
            >
              {isFollowing ? t("common:actions.unfollow") : t("common:actions.follow")}
            </Button>
          )}
        </div>
      </Card>

      {/* Profile details */}
      {(otherUser.about || otherProfile?.bio || otherProfile?.location || otherProfile?.websiteUrl || otherSkills?.length > 0) && (
        <Card>
          <h2 className="mb-3 font-medium">{t("profile:about")}</h2>
          {otherUser.about && <p className="text-text-secondary">{otherUser.about}</p>}
          {otherProfile?.bio && <p className="text-text-secondary">{otherProfile.bio}</p>}
          {otherProfile?.location && <p className="mt-2 text-sm text-text-tertiary">📍 {otherProfile.location}</p>}
          {otherProfile?.websiteUrl && (
            <a href={otherProfile.websiteUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-accent hover:underline">
              🔗 {otherProfile.websiteUrl}
            </a>
          )}
          {otherSkills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {otherSkills.map((s) => (
                <Link key={s.id} href={`/skills/${s.id}?name=${encodeURIComponent(s.name)}`}>
                  <Badge className="cursor-pointer hover:opacity-80">{s.name}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-medium">{t("profile:postsBy", { username: otherUser.nickname })}</h2>
        <PostList authorUserId={id} />
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  const translations = await serverSideTranslations(locale, ["common", "profile"]);
  return { props: { ...translations } };
}
