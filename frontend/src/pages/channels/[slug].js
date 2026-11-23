import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import PostList from "@/components/PostList";
import NewPostForm from "@/components/NewPostForm";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

export default function ChannelPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const router = useRouter();
  const { slug } = router.query;
  const channelId = slug ? Number(slug) : null;

  const [channel, setChannel]       = useState(null);
  const [channelLoading, setChannelLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [members, setMembers]       = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [addNickname, setAddNickname] = useState("");
  const [adding, setAdding]           = useState(false);
  const [addError, setAddError]       = useState("");
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);

  const isAdmin = user?.id === channel?.adminId || user?.role === "ADMIN";

  useEffect(() => {
    if (!channelId) return;
    api.get(endpoints.channels.byId(channelId))
      .then((res) => setChannel(res.data))
      .catch(() => setFetchError(true))
      .finally(() => setChannelLoading(false));
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;
    api.get(endpoints.channels.members(channelId))
      .then((res) => setMembers(res.data || []))
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, [channelId]);

  async function handleAddMember(e) {
    e.preventDefault();
    const nick = addNickname.trim();
    if (!nick) return;
    setAdding(true);
    setAddError("");
    try {
      // Resolve nickname → user
      const userRes = await api.get(endpoints.users.byNickname(nick));
      const targetId = userRes.data.id;
      if (members.some((m) => m.id === targetId)) {
        setAddError("That user is already a member.");
        return;
      }
      await api.post(endpoints.channels.addMember(channelId, targetId));
      setMembers((prev) => [...prev, { id: targetId, nickname: userRes.data.nickname }]);
      setAddNickname("");
    } catch (err) {
      const msg = err.response?.data?.message;
      setAddError(msg || "User not found or could not be added.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(userId) {
    try {
      await api.delete(endpoints.channels.removeMember(channelId, userId));
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch (err) {
      console.error("Remove member failed", err);
    }
  }

  if (channelLoading) {
    return <div className="flex justify-center py-8"><Spinner /></div>;
  }

  if (fetchError || !channel) {
    return <p className="text-text-secondary">Could not load this channel.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{channel.name}</h1>
        {channel.description && (
          <p className="mt-1 text-text-secondary">{channel.description}</p>
        )}
      </div>

      {/* Posts in this channel */}
      <div className="space-y-3">
        <h2 className="font-medium">Posts</h2>
        <NewPostForm channelId={channelId} onCreated={() => setPostsRefreshKey((k) => k + 1)} />
        <PostList channelId={channelId} refreshKey={postsRefreshKey} />
      </div>

      {/* Members sidebar info */}
      <Card>
        <h2 className="mb-3 font-medium">Members</h2>
        {membersLoading ? (
          <Spinner />
        ) : members.length === 0 ? (
          <p className="text-sm text-text-secondary">No members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={member.nickname} size={28} />
                  <span className="text-sm">{member.nickname}</span>
                  {member.id === channel.adminId && (
                    <span className="text-xs text-text-tertiary">(admin)</span>
                  )}
                </div>
                {isAdmin && member.id !== channel.adminId && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-xs text-text-tertiary hover:text-danger"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Admin-only: add member by nickname */}
        {isAdmin && (
          <form onSubmit={handleAddMember} className="mt-4 space-y-2">
            <p className="text-xs text-text-tertiary">Add member by nickname:</p>
            {addError && <p className="text-xs text-danger">{addError}</p>}
            <div className="flex gap-2">
              <Input
                value={addNickname}
                onChange={(e) => setAddNickname(e.target.value)}
                placeholder="Nickname"
              />
              <Button type="submit" disabled={adding}>
                {adding ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  const translations = await serverSideTranslations(locale, ["common", "posts"]);
  return { props: { ...translations } };
}
