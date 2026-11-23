import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

export default function ChannelsPage() {
  const { t } = useTranslation(["channels", "common"]);
  const { user } = useAuth();

  const [channels, setChannels]     = useState([]);
  const [myChannelIds, setMyChannelIds] = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName]       = useState("");
  const [newDesc, setNewDesc]       = useState("");
  const [creating, setCreating]     = useState(false);

  // Fetch the full channel list, plus (if logged in) which ones the
  // current user is a member of so we can show membership status.
  useEffect(() => {
    const requests = [api.get(endpoints.channels.all)];
    if (user) requests.push(api.get(endpoints.channels.myChannels));

    Promise.all(requests)
      .then(([allRes, myRes]) => {
        setChannels(allRes.data || []);
        if (myRes) {
          setMyChannelIds(new Set((myRes.data || []).map((c) => c.id)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post(endpoints.channels.create, {
        name: newName.trim(),
        description: newDesc.trim(),
      });
      // Creator is automatically a member
      setChannels((prev) => [...prev, res.data]);
      setMyChannelIds((prev) => new Set([...prev, res.data.id]));
      setNewName(""); setNewDesc(""); setCreateOpen(false);
    } catch (err) {
      console.error("Create channel failed", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(channelId) {
    if (!user) return;
    try {
      await api.post(endpoints.channels.addMember(channelId, user.id));
      setMyChannelIds((prev) => new Set([...prev, channelId]));
    } catch (err) {
      console.error("Join channel failed", err);
    }
  }

  async function handleLeave(channelId) {
    if (!user) return;
    try {
      await api.delete(endpoints.channels.removeMember(channelId, user.id));
      setMyChannelIds((prev) => { const s = new Set(prev); s.delete(channelId); return s; });
    } catch (err) {
      console.error("Leave channel failed", err);
    }
  }

  async function handleDelete(channelId) {
    try {
      await api.delete(endpoints.channels.delete(channelId));
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setMyChannelIds((prev) => { const s = new Set(prev); s.delete(channelId); return s; });
    } catch (err) {
      console.error("Delete channel failed", err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("channels:title")}</h1>
        {user && (
          <Button onClick={() => setCreateOpen(true)}>{t("channels:createChannel")}</Button>
        )}
      </div>

      <p className="text-sm text-text-secondary">{t("channels:subtitle")}</p>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : channels.length === 0 ? (
        <p className="text-text-secondary">No channels yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {channels.map((channel) => {
            const isMember  = myChannelIds.has(channel.id);
            const isAdmin   = user?.id === channel.adminId;
            return (
              <Card key={channel.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{channel.name}</p>
                      {isMember && <Badge variant="accent">member</Badge>}
                    </div>
                    {channel.description && (
                      <p className="text-sm text-text-tertiary">{channel.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(channel.id)}
                      className="shrink-0 text-xs text-text-tertiary hover:text-danger"
                    >
                      Delete
                    </button>
                  )}
                </div>

              <div className="flex items-center justify-between">
                {isMember ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/channels/${channel.id}`}
                      className="text-sm text-accent hover:text-accent-hover"
                    >
                      View posts →
                    </Link>
                    {!isAdmin && (
                      <button
                        onClick={() => handleLeave(channel.id)}
                        className="text-xs text-text-tertiary hover:text-danger"
                      >
                        Leave
                      </button>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => handleJoin(channel.id)}
                  >
                    Join
                  </Button>
                )}
              </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("channels:createModalTitle")}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="channel-name">{t("channels:channelName")}</Label>
            <Input
              id="channel-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("channels:channelNamePlaceholder")}
              required
            />
          </div>
          <div>
            <Label htmlFor="channel-desc">Description</Label>
            <Input
              id="channel-desc"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What is this channel about?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : t("common:actions.create")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  const translations = await serverSideTranslations(locale, ["common", "channels"]);
  return { props: { ...translations } };
}
