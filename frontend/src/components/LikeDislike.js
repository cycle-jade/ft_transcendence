import { useState } from "react";

// Placeholder like/dislike state — replace with a real API call once wired.
// Backend's post object already has `likes`/`dislikes` fields (currently
// null in their docs), so this maps directly once that's implemented.
export default function LikeDislike({ initialLikes = 0, initialDislikes = 0 }) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [vote, setVote] = useState(null); // null | "like" | "dislike"

  function handleLike() {
    if (vote === "like") {
      setLikes((l) => l - 1);
      setVote(null);
    } else {
      setLikes((l) => l + 1);
      if (vote === "dislike") setDislikes((d) => d - 1);
      setVote("like");
    }
  }

  function handleDislike() {
    if (vote === "dislike") {
      setDislikes((d) => d - 1);
      setVote(null);
    } else {
      setDislikes((d) => d + 1);
      if (vote === "like") setLikes((l) => l - 1);
      setVote("dislike");
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        onClick={handleLike}
        className={`flex items-center gap-1 transition-colors ${
          vote === "like" ? "text-accent" : "text-text-tertiary hover:text-text-secondary"
        }`}
      >
        ▲ {likes}
      </button>
      <button
        onClick={handleDislike}
        className={`flex items-center gap-1 transition-colors ${
          vote === "dislike" ? "text-danger" : "text-text-tertiary hover:text-text-secondary"
        }`}
      >
        ▼ {dislikes}
      </button>
    </div>
  );
}
