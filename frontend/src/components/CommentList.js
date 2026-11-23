import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import Avatar from "./ui/Avatar";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";
import Spinner from "./ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

export default function CommentList({ postId, initialComments = [] }) {
  const { t } = useTranslation(["posts", "common"]);
  const { user } = useAuth();
  const [comments, setComments]     = useState(initialComments);
  const [userMap, setUserMap]       = useState({}); // { [userId]: nickname }
  const [draft, setDraft]           = useState("");
  const [posting, setPosting]       = useState(false);
  const [voteMap, setVoteMap]       = useState({}); // { [commentId]: "like" | "dislike" | null }

  // Resolve userIds → nicknames by calling GET /users/{id} for each unique author.
  // We only fetch each id once, deduplicated. New comments added client-side
  // already have the current user's nickname available via useAuth().
  useEffect(() => {
    if (!comments.length) return;
    const uniqueIds = [...new Set(comments.map((c) => c.userId))];
    const missing = uniqueIds.filter((id) => !userMap[id]);
    if (!missing.length) return;

    Promise.all(
      missing.map((id) =>
        api.get(endpoints.users.byId(id))
          .then((res) => ({ id, nickname: res.data.nickname }))
          .catch(() => ({ id, nickname: `User #${id}` }))
      )
    ).then((results) => {
      setUserMap((prev) => {
        const updated = { ...prev };
        results.forEach(({ id, nickname }) => { updated[id] = nickname; });
        return updated;
      });
    });
  }, [comments]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!draft.trim() || !user) return;
    setPosting(true);
    try {
      const res = await api.post(endpoints.comments.create, {
        postId: Number(postId),
        content: draft.trim(),
      });
      // Add current user's nickname immediately without an extra fetch
      setUserMap((prev) => ({ ...prev, [user.id]: user.nickname }));
      setComments((prev) => [...prev, res.data]);
      setDraft("");
    } catch (err) {
      console.error("Comment failed", err);
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId) {
    try {
      await api.delete(endpoints.comments.delete(commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Delete comment failed", err);
    }
  }

  function bumpCount(commentId, field, delta) {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, [field]: (c[field] ?? 0) + delta } : c))
    );
  }

  async function handleLikeComment(commentId) {
    if (!user) return;
    const current = voteMap[commentId];
    try {
      if (current === "like") {
        await api.delete(endpoints.likes.likeComment(commentId));
        bumpCount(commentId, "likes", -1);
        setVoteMap((prev) => ({ ...prev, [commentId]: null }));
      } else {
        await api.post(endpoints.likes.likeComment(commentId));
        bumpCount(commentId, "likes", 1);
        if (current === "dislike") {
          await api.delete(endpoints.dislikes.dislikeComment(commentId));
          bumpCount(commentId, "dislikes", -1);
        }
        setVoteMap((prev) => ({ ...prev, [commentId]: "like" }));
      }
    } catch (err) {
      console.error("Like comment failed", err);
    }
  }

  async function handleDislikeComment(commentId) {
    if (!user) return;
    const current = voteMap[commentId];
    try {
      if (current === "dislike") {
        await api.delete(endpoints.dislikes.dislikeComment(commentId));
        bumpCount(commentId, "dislikes", -1);
        setVoteMap((prev) => ({ ...prev, [commentId]: null }));
      } else {
        await api.post(endpoints.dislikes.dislikeComment(commentId));
        bumpCount(commentId, "dislikes", 1);
        if (current === "like") {
          await api.delete(endpoints.likes.likeComment(commentId));
          bumpCount(commentId, "likes", -1);
        }
        setVoteMap((prev) => ({ ...prev, [commentId]: "dislike" }));
      }
    } catch (err) {
      console.error("Dislike comment failed", err);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-medium">
        {t("posts:comments")} ({comments.length})
      </h2>

      <div className="space-y-4">
        {comments.map((comment) => {
          const nickname = userMap[comment.userId] || `User #${comment.userId}`;
          return (
            <div key={comment.id} className="flex gap-3">
              <Avatar name={nickname} size={32} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${comment.userId}`}
                      className="text-sm font-medium hover:text-accent"
                    >
                      {nickname}
                    </Link>
                    <span className="text-xs text-text-tertiary">
                      {comment.dataCreated
                        ? new Date(comment.dataCreated).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  {user?.id === comment.userId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-text-tertiary hover:text-danger"
                    >
                      {t("common:actions.delete")}
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-secondary">{comment.content}</p>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    disabled={!user}
                    className={`flex items-center gap-1 transition-colors ${
                      voteMap[comment.id] === "like" ? "text-accent font-medium" : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    ▲ {comment.likes ?? 0}
                  </button>
                  <button
                    onClick={() => handleDislikeComment(comment.id)}
                    disabled={!user}
                    className={`flex items-center gap-1 transition-colors ${
                      voteMap[comment.id] === "dislike" ? "text-danger font-medium" : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    ▼ {comment.dislikes ?? 0}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("posts:addComment")}
            rows={2}
          />
          <Button type="submit" disabled={posting || !draft.trim()}>
            {t("common:actions.post")}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-text-tertiary">
          <Link href="/auth/login" className="text-accent hover:underline">
            {t("common:nav.login")}
          </Link>{" "}
          to comment.
        </p>
      )}
    </div>
  );
}
