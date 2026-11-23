import axios from "axios";

/**
 * Pre-configured Axios instance.
 * Auth: header-based JWT (Bearer token stored in localStorage).
 * Base URL: NEXT_PUBLIC_API_URL (defaults to http://localhost:8080/api)
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Complete endpoint map — derived from full backend source analysis (July 2026).
 * See docs/integration-notes.md for full details on each endpoint.
 */
export const endpoints = {

  // --- Auth (/api/auth/...) ---
  // NOTE: Login is a 2-step process. Step 1 returns a verificationId,
  // step 2 exchanges verificationId + email code for the real token.
  auth: {
    register:        "/auth/register",           // POST { nickname, password, email, name, lastName, phone }
    loginByNickname: "/auth/login/nickname",     // POST { nickname, password } → { requiresTwoFactor, verificationId, expiresInSeconds }
    loginByEmail:    "/auth/login",              // POST { email, password }    → same
    verifyEmailCode: "/auth/verify-email-code",  // POST { verificationId, code } → { accessToken, tokenType, expiresIn }
  },

  // --- Users (/api/v1/users/...) ---
  users: {
    me:             "/v1/users/me",                              // GET current user
    all:            "/v1/users/all",                             // GET → List<UserListDto>
    byId:           (id) => `/v1/users/${id}`,                  // GET → UserDto
    byNickname:     (nickname) => `/v1/users/nickname/${nickname}`, // GET → UserDto
    allByName:      (name) => `/v1/users/allByName/${name}`,    // GET → List<UserListDto>
    update:         (id) => `/v1/users/update/${id}`,           // PUT UserDto
    markOnline:     "/v1/users/online",                         // POST, no body
    markOffline:    "/v1/users/offline",                        // POST, no body — call on logout
    changePassword: "/v1/users/me/password",                    // PUT { oldPassword, newPassword }
    searchBySkill:  (skillId) => `/v1/users/search/skill/${skillId}`, // GET → List<UserListDto>
    myStatus:       "/v1/users/me/status",                      // GET → UserStatusDto
    statusById:     (id) => `/v1/users/${id}/status`,           // GET → UserStatusDto
    block:          (id) => `/v1/users/block/${id}`,            // PUT (ADMIN only)
    unblock:        (id) => `/v1/users/unblock/${id}`,          // PUT (ADMIN only)
    changeRole:     (id, role) => `/v1/users/changeRole/${id}/${role}`, // PUT (ADMIN only) role: USER|ADMIN
  },

  // --- Profiles (/api/v1/profiles/...) ---
  // Profile is SEPARATE from User. May not exist yet — create with POST /me.
  profiles: {
    createMine:   "/v1/profiles/me",                       // POST ProfileRequest
    me:           "/v1/profiles/me",                       // GET / PUT
    byId:         (id) => `/v1/profiles/${id}`,            // GET / PUT / DELETE
    byUserId:     (userId) => `/v1/profiles/user/${userId}`,// GET — use this to view others' profiles
  },

  // --- Posts (/api/v1/posts/...) ---
  posts: {
    create:       "/v1/posts/new",                         // POST { title, content }
    all:          "/v1/posts/all",                         // GET
    byId:         (id) => `/v1/posts/${id}`,               // GET
    byUser:       (userId) => `/v1/posts/postByUser/${userId}`, // GET
    byChannel:    (channelId) => `/v1/posts/channel/${channelId}`, // GET
    edit:         (id) => `/v1/posts/edit/${id}`,          // PUT PostDto
    delete:       (id) => `/v1/posts/${id}`,               // DELETE
    // Attachments
    attachments:  (postId) => `/v1/posts/${postId}/attachments`, // GET / POST multipart
    attachment:   (postId, id) => `/v1/posts/${postId}/attachments/${id}`, // DELETE
    attachmentDownload: (postId, id) => `/v1/posts/${postId}/attachments/${id}/download`, // GET
  },

  // --- Comments (/api/v1/comments/...) ---
  comments: {
    create:       "/v1/comments/new",                      // POST { postId, content } — userId from JWT
    byPost:       (postId) => `/v1/comments/post/${postId}`, // GET
    byUser:       (userId) => `/v1/comments/user/${userId}`, // GET
    edit:         (id) => `/v1/comments/${id}`,            // PUT { content }
    delete:       (id) => `/v1/comments/${id}`,            // DELETE
  },

  // --- Likes (/api/v1/likes/...) ---
  likes: {
    likePost:       (postId) => `/v1/likes/post/${postId}`,     // POST / DELETE
    postCount:      (postId) => `/v1/likes/post/${postId}/count`, // GET → Integer
    likeComment:    (id) => `/v1/likes/comment/${id}`,          // POST / DELETE
    commentCount:   (id) => `/v1/likes/comment/${id}/count`,    // GET → Integer
  },

  // --- Dislikes (/api/v1/dislike/...) — note: singular, not plural ---
  dislikes: {
    dislikePost:    (postId) => `/v1/dislike/post/${postId}`,   // POST / DELETE
    postCount:      (postId) => `/v1/dislike/post/${postId}/count`, // GET → Long
    dislikeComment: (id) => `/v1/dislike/comment/${id}`,        // POST / DELETE
    commentCount:   (id) => `/v1/dislike/comment/${id}/count`,  // GET → Long
  },

  // --- Follow system (/api/v1/social/...) ---
  // NOTE: There is NO "friends" concept. This is follow/unfollow (Twitter-style).
  // "Add friend" / "Remove friend" in the UI maps to follow/unfollow here.
  social: {
    follow:         (targetId) => `/v1/social/follow/${targetId}`,   // POST
    unfollow:       (targetId) => `/v1/social/unfollow/${targetId}`, // DELETE
    followerCount:  "/v1/social/follower/count",  // GET → Integer (who follows me)
    followers:      "/v1/social/follower/all",    // GET → List<UserListDto>
    followingCount: "/v1/social/following/count", // GET → Integer (who I follow)
    following:      "/v1/social/following/all",   // GET → List<UserListDto>
  },

  // --- Channels (/api/v1/channels/...) ---
  // NOTE: add/remove member requires the requester to be the channel admin
  // or a system ADMIN — users cannot join channels themselves.
  channels: {
    create:     "/v1/channels/new",                              // POST { name, description }
    all:        "/v1/channels/all",                              // GET → List<ChannelListDto>
    myChannels: "/v1/channels/member",                           // GET → List<ChannelListDto>
    byId:       (id) => `/v1/channels/${id}`,                   // GET → ChannelDto
    delete:     (id) => `/v1/channels/${id}`,                   // DELETE
    members:    (id) => `/v1/channels/${id}/members`,           // GET → List<UserListDto>
    addMember:  (channelId, userId) => `/v1/channels/${channelId}/members/${userId}`,  // POST
    removeMember: (channelId, userId) => `/v1/channels/${channelId}/members/${userId}`, // DELETE
  },

  // --- Skills (/api/v1/skills/...) ---
  // Skills are their own resource — NOT a plain text field on Profile.
  skills: {
    add:    "/v1/skills/add",                              // POST { name } → SkillDto (409 if duplicate)
    remove: (skillId) => `/v1/skills/remove/${skillId}`,  // DELETE
    byUser: (userId) => `/v1/skills/${userId}`,           // GET → Set<SkillDto>
  },

  // --- Avatar (/api/v1/avatar/...) — REAL FILE UPLOAD, not URL string ---
  avatar: {
    upload:   (profileId) => `/v1/avatar/${profileId}`,             // POST multipart { file }
    download: (avatarId) => `/v1/avatar/${avatarId}/download`,      // GET → binary
    delete:   (profileId, avatarId) => `/v1/avatar/${profileId}/${avatarId}`, // DELETE
  },
};
