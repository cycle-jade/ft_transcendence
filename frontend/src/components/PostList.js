import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import Card from "./ui/Card";
import Spinner from "./ui/Spinner";
import api, { endpoints } from "@/lib/api";

const PAGE_SIZE = 10;

export default function PostList({ initialPosts = [], channelId, authorUserId, refreshKey }) {
  const { t } = useTranslation(["common", "posts"]);

  // If initialPosts came from SSR, start with those.
  // For channel/author filtered views, they're fetched client-side.
  const [posts, setPosts]         = useState(initialPosts);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [clientLoading, setClientLoading] = useState(false);
  const sentinelRef               = useRef(null);

  // Client-side fetch for filtered views (by channel or author)
  // that don't get SSR data passed in. Also refetches whenever
  // refreshKey changes (bumped by callers after creating a post).
  useEffect(() => {
    if (initialPosts.length > 0 && !channelId && !authorUserId && !refreshKey) return; // already have SSR data
    let url = "";
    if (channelId)    url = endpoints.posts.byChannel(channelId);
    else if (authorUserId) url = endpoints.posts.byUser(authorUserId);
    else url = endpoints.posts.all;

    setClientLoading(true);
    api.get(url)
      .then((res) => {
        const sorted = [...(res.data || [])].sort(
          (a, b) => new Date(b.dataCreated) - new Date(a.dataCreated)
        );
        setPosts(sorted);
      })
      .catch(() => {})
      .finally(() => setClientLoading(false));
  }, [channelId, authorUserId, refreshKey]);

  // Sort SSR posts newest first too
  const sorted = [...posts].sort(
    (a, b) => new Date(b.dataCreated) - new Date(a.dataCreated)
  );

  const hasMore = visibleCount < sorted.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sorted.length));
  }, [sorted.length]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [channelId, authorUserId]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (clientLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  if (sorted.length === 0) {
    return <p className="text-text-secondary">{t("common:actions.noPostsYet")}</p>;
  }

  const visible = sorted.slice(0, visibleCount);

  return (
    <div className="space-y-3">
      {visible.map((post) => (
        <Card key={post.id ?? `${post.userId}-${post.dataCreated}`} className="transition-colors hover:border-border-light">
          <Link href={post.id ? `/posts/${post.id}` : "#"} className="block">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium">{post.title}</span>
              {post.idChannel && (
                <Link
                  href={`/channels/${post.idChannel}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-xs text-accent hover:underline"
                >
                  {post.channelName || `#${post.idChannel}`}
                </Link>
              )}
            </div>
            {post.content && (
              <p className="mt-1 text-sm text-text-secondary line-clamp-2">{post.content}</p>
            )}
          </Link>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm text-text-tertiary">
            <Link
              href={`/profile/${post.userId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-accent"
            >
              {post.userNickname || `User #${post.userId}`}
            </Link>
            <div className="flex items-center gap-3">
              <span>▲ {post.likes ?? 0} ▼ {post.dislikes ?? 0}</span>
              <span>💬 {post.idComments?.length ?? 0}</span>
              <span>{post.dataCreated ? new Date(post.dataCreated).toLocaleDateString() : ""}</span>
            </div>
          </div>
        </Card>
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <Spinner />
        </div>
      )}
    </div>
  );
}
