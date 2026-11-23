import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import PostList from "@/components/PostList";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

export default function ProfilePage() {
  const { t } = useTranslation(["profile", "common"]);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile]       = useState(null);
  const [skills, setSkills]         = useState([]);  // [{ id, name }]
  const [following, setFollowing]   = useState([]);  // [{ id, nickname }]
  const [followers, setFollowers]   = useState([]);
  const [myStatus, setMyStatus]     = useState(null); // { onlineStatus, blocked }
  const [profileLoading, setProfileLoading] = useState(true);

  // Edit state
  const [editing, setEditing]       = useState(false);
  const [bio, setBio]               = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation]     = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [saveError, setSaveError]   = useState("");

  // Avatar upload
  const avatarInputRef              = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Skills
  const [addingSkill, setAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [skillError, setSkillError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [authLoading, user, router]);

  // Fetch profile, skills, following, status
  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get(endpoints.profiles.me).catch(() => null),
      api.get(endpoints.skills.byUser(user.id)).catch(() => ({ data: [] })),
      api.get(endpoints.social.following).catch(() => ({ data: [] })),
      api.get(endpoints.social.followers).catch(() => ({ data: [] })),
      api.get(endpoints.users.myStatus).catch(() => null),
    ]).then(([profileRes, skillsRes, followingRes, followersRes, statusRes]) => {
      if (profileRes) {
        setProfile(profileRes.data);
        setBio(profileRes.data.bio || "");
        setDisplayName(profileRes.data.displayName || "");
        setLocation(profileRes.data.location || "");
        setWebsiteUrl(profileRes.data.websiteUrl || "");
      }
      setSkills(skillsRes.data || []);
      setFollowing(followingRes.data || []);
      setFollowers(followersRes.data || []);
      if (statusRes) setMyStatus(statusRes.data);
    }).finally(() => setProfileLoading(false));
  }, [user]);

  // Save profile — PUT /profiles/me
  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    try {
      if (profile) {
        const res = await api.put(endpoints.profiles.me, { displayName, bio, location, websiteUrl });
        setProfile(res.data);
      } else {
        const res = await api.post(endpoints.profiles.createMine, { displayName, bio, location, websiteUrl });
        setProfile(res.data);
      }
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Could not save profile.");
    }
  }

  // Upload avatar — POST /avatar/{profileId}
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !profile) return;
    setAvatarUploading(true);
    setAvatarError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Let the browser set the multipart Content-Type (with boundary) itself —
      // the api instance's default "application/json" header must be unset here.
      const res = await api.post(endpoints.avatar.upload(profile.id), formData, {
        headers: { "Content-Type": undefined },
      });
      setProfile((prev) => ({ ...prev, avatarUrl: res.data.url }));
    } catch (err) {
      setAvatarError(err.response?.data?.message || "Could not upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  }

  // Add skill — POST /skills/add
  async function handleAddSkill(e) {
    e.preventDefault();
    const name = newSkillName.trim();
    if (!name) { setAddingSkill(false); return; }
    setSkillError("");
    try {
      const res = await api.post(endpoints.skills.add, { name });
      if (res.data) {
        setSkills((prev) => [...prev, res.data]);
      } else {
        setSkillError("You already have that skill.");
      }
      setNewSkillName("");
      setAddingSkill(false);
    } catch (err) {
      setSkillError(err.response?.data?.message || "Could not add skill.");
    }
  }

  // Remove skill — DELETE /skills/remove/{id}
  async function handleRemoveSkill(skillId) {
    try {
      await api.delete(endpoints.skills.remove(skillId));
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err) {
      console.error("Remove skill failed", err);
    }
  }

  if (authLoading || !user || profileLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("profile:title")}</h1>

      {/* Identity card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            <Avatar name={user.nickname} src={profile?.avatarUrl} size={64} />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => profile && avatarInputRef.current?.click()}
              disabled={avatarUploading || !profile}
              className="text-xs text-accent hover:underline disabled:cursor-not-allowed disabled:text-text-tertiary disabled:no-underline"
              title={!profile ? "Create your profile first" : undefined}
            >
              {avatarUploading ? "Uploading..." : "Change photo"}
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  myStatus?.onlineStatus === "ONLINE" ? "bg-success" : "bg-text-tertiary"
                }`}
                title={myStatus?.onlineStatus === "ONLINE" ? "Online" : "Offline"}
              />
              <p className="font-medium">{displayName || user.nickname}</p>
            </div>
            <p className="text-sm text-text-tertiary">@{user.nickname}</p>
            <p className="text-sm text-text-tertiary">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              {user.role === "ADMIN" && <Badge variant="accent">{t("common:status.admin")}</Badge>}
            </div>
          </div>
          {/* Follow counts */}
          <div className="flex gap-4 text-center text-sm">
            <div>
              <p className="font-semibold">{following.length}</p>
              <p className="text-text-tertiary">{t("common:actions.following")}</p>
            </div>
            <div>
              <p className="font-semibold">{followers.length}</p>
              <p className="text-text-tertiary">{t("common:actions.followers")}</p>
            </div>
          </div>
        </div>
        {avatarError && <p className="mt-3 text-sm text-danger">{avatarError}</p>}
      </Card>

      {/* Editable about */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">{t("profile:about")}</h2>
          {!editing && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              {t("common:actions.edit")}
            </Button>
          )}
        </div>

        {saveError && <p className="mb-3 text-sm text-danger">{saveError}</p>}

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bio">{t("profile:bio")}</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setEditing(false)}>
                {t("common:actions.cancel")}
              </Button>
              <Button type="submit">{t("common:actions.save")}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {bio && <p className="text-text-secondary">{bio}</p>}
            {location && <p className="text-sm text-text-tertiary">📍 {location}</p>}
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                🔗 {websiteUrl}
              </a>
            )}
          </div>
        )}
      </Card>

      {/* Skills — independent of the About edit form */}
      <Card>
        <h2 className="mb-3 font-medium">{t("profile:skills")}</h2>
        {skillError && <p className="mb-2 text-sm text-danger">{skillError}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {skills.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1">
              <Link href={`/skills/${s.id}?name=${encodeURIComponent(s.name)}`}>
                <Badge className="cursor-pointer hover:opacity-80">{s.name}</Badge>
              </Link>
              <button
                type="button"
                onClick={() => handleRemoveSkill(s.id)}
                className="text-text-tertiary hover:text-danger"
                title={`Remove ${s.name}`}
              >
                ×
              </button>
            </span>
          ))}

          {addingSkill ? (
            <form onSubmit={handleAddSkill} className="flex items-center gap-1">
              <input
                autoFocus
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onBlur={() => { if (!newSkillName.trim()) setAddingSkill(false); }}
                placeholder="Skill name"
                className="w-32 rounded-full border border-border bg-bg-secondary px-3 py-1 text-xs text-text outline-none focus:border-accent"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSkill(true)}
              title="Add skill"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-tertiary text-sm text-text-secondary hover:bg-accent hover:text-accent-text"
            >
              +
            </button>
          )}
        </div>
      </Card>

      {/* Analytics */}
      <Card>
        <h2 className="mb-3 font-medium">{t("profile:activity")}</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-semibold">{user.postIds?.length ?? 0}</p>
            <p className="text-xs text-text-tertiary">{t("profile:posts")}</p>
          </div>
          <div>
            <p className="text-xl font-semibold">{user.channelIds?.length ?? 0}</p>
            <p className="text-xs text-text-tertiary">{t("profile:channels")}</p>
          </div>
          <div>
            <p className="text-xl font-semibold">{following.length}</p>
            <p className="text-xs text-text-tertiary">{t("common:actions.following")}</p>
          </div>
        </div>
      </Card>

      {/* Following list */}
      <Card>
        <h2 className="mb-3 font-medium">{t("common:actions.following")}</h2>
        {following.length === 0 ? (
          <p className="text-sm text-text-secondary">Not following anyone yet.</p>
        ) : (
          <div className="space-y-2">
            {following.map((f) => (
              <Link key={f.id} href={`/profile/${f.id}`} className="flex items-center gap-2 hover:text-accent">
                <Avatar name={f.nickname} src={f.avatarUrl} size={28} />
                <span className="text-sm">{f.nickname}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Own posts */}
      <div>
        <h2 className="mb-3 font-medium">{t("profile:postsBy", { username: user.nickname })}</h2>
        <PostList authorUserId={user.id} />
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "profile"])),
    },
  };
}
