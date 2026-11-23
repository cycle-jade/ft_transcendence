import { useState, useEffect } from "react";
import Card from "./ui/Card";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";
import Label from "./ui/Label";
import { useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

// Reusable post-composer. Pass `channelId` to lock the post to a specific
// channel (used on the channel detail page); omit it to show a channel
// picker (used on the main feed, where the channel is optional).
export default function NewPostForm({ channelId, onCreated }) {
  const { user } = useAuth();
  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (channelId) return; // fixed channel — no picker needed
    api.get(endpoints.channels.all)
      .then((res) => setChannels(res.data || []))
      .catch(() => {});
  }, [channelId]);

  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    setError("");
    try {
      const targetChannelId = channelId || (selectedChannelId ? Number(selectedChannelId) : null);
      const body = { title: title.trim(), content: content.trim() };
      if (targetChannelId) body.channelId = targetChannelId;

      const res = await api.post(endpoints.posts.create, body);
      setTitle("");
      setContent("");
      setSelectedChannelId("");
      onCreated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create post.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-danger">{error}</p>}
        <div>
          <Label htmlFor="new-post-title">Title</Label>
          <Input
            id="new-post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            required
          />
        </div>
        <div>
          <Label htmlFor="new-post-content">Content</Label>
          <Textarea
            id="new-post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something..."
            rows={3}
            required
          />
        </div>
        {!channelId && (
          <div>
            <Label htmlFor="new-post-channel">Channel (optional)</Label>
            <select
              id="new-post-channel"
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text outline-none focus:border-accent"
            >
              <option value="">General feed (no channel)</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={posting}>
            {posting ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
