import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import CommentList from "@/components/CommentList";
import { useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation(["posts", "common"]);
  const { user } = useAuth();

  const [initialPost, setInitialPost]   = useState(null);
  const [initialComments, setInitialComments] = useState([]);
  const [postLoading, setPostLoading]   = useState(true);
  const [fetchError, setFetchError]     = useState(false);

  const [editing, setEditing]           = useState(false);
  const [title, setTitle]               = useState("");
  const [content, setContent]           = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError]   = useState("");
  const [likes, setLikes]               = useState(0);
  const [dislikes, setDislikes]         = useState(0);
  const [vote, setVote]                 = useState(null); // null | "like" | "dislike"

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(endpoints.posts.byId(id)),
      api.get(endpoints.comments.byPost(id)).catch(() => ({ data: [] })),
    ])
      .then(([postRes, commentsRes]) => {
        setInitialPost(postRes.data);
        setTitle(postRes.data.title || "");
        setContent(postRes.data.content || "");
        setLikes(postRes.data.likes ?? 0);
        setDislikes(postRes.data.dislikes ?? 0);
        setInitialComments(commentsRes.data || []);
      })
      .catch(() => setFetchError(true))
      .finally(() => setPostLoading(false));
  }, [id]);

  const isAuthor = user?.id === initialPost?.userId;
  const isAdmin  = user?.role === "ADMIN";
  const canModify = isAuthor || isAdmin;

  async function handleSave() {
    try {
      await api.put(endpoints.posts.edit(id), {
        userId: initialPost.userId,
        title,
        content,
        dataCreated: initialPost.dataCreated,
      });
      setEditing(false);
    } catch (err) {
      console.error("Edit failed", err);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(endpoints.posts.delete(id));
      router.push("/posts");
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Could not delete this post.");
      setConfirmDelete(false);
    }
  }

  async function handleLike() {
    if (!user) return;
    try {
      if (vote === "like") {
        await api.delete(endpoints.likes.likePost(id));
        setLikes((l) => l - 1); setVote(null);
      } else {
        await api.post(endpoints.likes.likePost(id));
        setLikes((l) => l + 1);
        if (vote === "dislike") { setDislikes((d) => d - 1); }
        setVote("like");
      }
    } catch (err) { console.error("Like failed", err); }
  }

  async function handleDislike() {
    if (!user) return;
    try {
      if (vote === "dislike") {
        await api.delete(endpoints.dislikes.dislikePost(id));
        setDislikes((d) => d - 1); setVote(null);
      } else {
        await api.post(endpoints.dislikes.dislikePost(id));
        setDislikes((d) => d + 1);
        if (vote === "like") { setLikes((l) => l - 1); }
        setVote("dislike");
      }
    } catch (err) { console.error("Dislike failed", err); }
  }

  if (postLoading) {
    return <div className="flex justify-center py-8"><Spinner /></div>;
  }

  if (fetchError || !initialPost) {
    return <p className="text-text-secondary">Could not load this post.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        {editing ? (
          <input
            className="flex-1 rounded-md border border-border bg-bg-secondary px-3 py-2 text-xl font-semibold text-text outline-none focus:border-accent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        ) : (
          <h1 className="text-2xl font-semibold">{title}</h1>
        )}
      </div>

      <p className="text-sm text-text-tertiary">
        {new Date(initialPost.dataCreated).toLocaleDateString()} ·{" "}
        <Link href={`/profile/${initialPost.userId}`} className="hover:text-accent">
          {initialPost.userNickname || `User #${initialPost.userId}`}
        </Link>
        {initialPost.channelName && (
          <> · <Link href={`/channels/${initialPost.idChannel}`} className="hover:text-accent">{initialPost.channelName}</Link></>
        )}
      </p>

      <Card>
        {editing ? (
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
        ) : (
          <p className="text-text whitespace-pre-wrap">{content}</p>
        )}
      </Card>

      {/* Like / Dislike */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors ${
            vote === "like" ? "text-accent font-medium" : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          ▲ {likes}
        </button>
        <button
          onClick={handleDislike}
          className={`flex items-center gap-1 transition-colors ${
            vote === "dislike" ? "text-danger font-medium" : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          ▼ {dislikes}
        </button>
      </div>

      {deleteError && <p className="text-sm text-danger">{deleteError}</p>}

      {canModify && (
        <div className="flex justify-end gap-2">
          {editing ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                {t("common:actions.cancel")}
              </Button>
              <Button onClick={handleSave}>{t("common:actions.save")}</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                {t("common:actions.edit")}
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                {t("common:actions.delete")}
              </Button>
            </>
          )}
        </div>
      )}

      {isAdmin && !isAuthor && !editing && (
        <p className="text-right text-xs text-text-tertiary">{t("posts:editingAsAdmin")}</p>
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t("posts:deleteConfirmTitle")}>
        <p className="mb-4 text-sm text-text-secondary">{t("posts:deleteConfirmBody")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>{t("common:actions.cancel")}</Button>
          <Button variant="danger" onClick={handleDelete}>{t("common:actions.delete")}</Button>
        </div>
      </Modal>

      {/* Real comments — fetched server-side, submitted client-side */}
      <CommentList postId={id} initialComments={initialComments || []} />
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  const translations = await serverSideTranslations(locale, ["common", "posts"]);
  return { props: { ...translations } };
}
