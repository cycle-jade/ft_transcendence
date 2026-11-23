# Error handling audit — backend team notes

## The bug

`GlobalExceptionHandler` only ever handled one exception type (`UserNotFoundException`
→ 404). Every other business-rule failure across the app — "not found", "not your
resource", "duplicate nickname/email", "wrong password" — was a plain
`RuntimeException` or `IllegalArgumentException` with no handler. Spring's default
behavior for an uncaught exception is **HTTP 500 "Internal Server Error"**, so every
one of these expected, well-understood failures was indistinguishable from an actual
server crash: no `message` in the body, wrong status code, and a full stack trace
spammed into the logs on every routine permission check.

Two consequences for the frontend: it reads `err.response?.data?.message` to show
users a real reason, but that field never existed, so every error fell back to a
generic string ("Registration failed, please check your details" /
"Invalid or expired code" / etc.) no matter what actually went wrong. And it had no
reliable status code to branch on (401 vs 403 vs 404 vs 409 all looked like 500).

Found by running a multi-user simulation against every endpoint and reading the
`docker compose logs backend` stack traces for each unexpected status.

## The fix

Added three typed exceptions next to the existing `UserNotFoundException`, each with
a handler in `GlobalExceptionHandler`:

| Exception | HTTP status | Use for |
|---|---|---|
| `ResourceNotFoundException` | 404 | entity lookup by id/name failed |
| `ForbiddenActionException` | 403 | authenticated but not allowed to do this |
| `ConflictException` | 409 | action conflicts with existing state (duplicate) |
| `IllegalArgumentException` (built-in) | 400 | malformed/invalid input, bad state |

All handlers now return `{"message": "..."}` (new `ApiError` record) instead of a raw
string or nothing, so `err.response.data.message` on the frontend actually works.
Also added a handler for `MethodArgumentNotValidException` (bean-validation failures)
that lists which fields failed, instead of Spring's bodyless default.

Every throw site across `AuthService`, `UserService`, `ProfileService`, `PostService`,
`CommentService`, `LikeService`, `DislikeService`, `SkillService`, `FollowService`,
and `ChannelService` was reclassified into one of the four buckets above by what the
message actually meant (see table below). No behavior changed except the status code
and body — the underlying permission/ownership logic was already correct everywhere
we checked; it just reported failure wrong.

One real logic bug fixed along the way, not just a status code: `ProfileService.updateProfile`
threw `UserNotFoundException` (404) when a non-owner tried to edit someone else's
profile — that's a permissions failure, not a missing resource. Now throws
`ForbiddenActionException` (403).

## Before / after, per endpoint

| Endpoint | Scenario | Before | After |
|---|---|---|---|
| `POST /api/auth/register` | duplicate nickname/email | 401, empty body | **409**, `{"message":"Nickname is already used"}` |
| `PUT /api/v1/posts/edit/{id}` | editing someone else's post | 500 | **403**, `{"message":"You can't edit someone else's post"}` |
| `DELETE /api/v1/posts/{id}` | deleting someone else's post | 500 | **403** |
| `PUT /api/v1/comments/{id}` / `DELETE` | editing/deleting someone else's comment | 500 | **403** |
| `POST/DELETE /api/v1/channels/{id}/members/{userId}` | non-admin managing channel members | 500 | **403** |
| `DELETE /api/v1/channels/{id}` | non-owner/non-admin deleting channel | 500 | **403** |
| `PUT /api/v1/users/block/{id}` | non-admin blocking a user | 500 | **403** |
| `PUT /api/v1/users/unblock/{id}` | non-admin unblocking a user | 500 | **403** |
| `PUT /api/v1/users/changeRole/{id}/{role}` | non-admin changing roles | 500 | **403** |
| `PUT /api/v1/users/update/{id}` | updating someone else's account | 500 | **403** |
| `DELETE /api/v1/profiles/{id}` | deleting someone else's profile | 500 | **403** |
| `PUT /api/v1/profiles/{id}` | editing someone else's profile | 404 (wrong: `UserNotFoundException`) | **403** |
| `PUT /api/v1/users/me/password` | wrong old password | 500 | **400** |
| `POST /api/v1/social/follow/{id}` | following yourself | 500 | **400** |
| `DELETE /api/v1/social/unfollow/{id}` | unfollowing yourself | 500 | **400** |
| any `/{id}` lookup | post/user/comment/channel/skill/profile not found | 500 | **404** |
| `POST /api/auth/verify-email-code` | verification id not found | 500 | **404** |
| `PUT /api/v1/posts/edit/{id}` | reading an already-deleted post | 500 | **400** |

## Not fixed / needs a decision

- **No seeded ADMIN user.** A fresh DB has zero admin accounts (no migration or
  `CommandLineRunner` creates one), so `block`/`unblock`/`changeRole` can't be
  exercised without a manual `UPDATE users SET role='ADMIN' WHERE id=...`. If admin
  functionality needs to be testable/usable out of the box, add a seed migration or a
  bootstrap flag.
- **`PUT /api/v1/posts/edit/{id}` requires `dataCreated` and `userId` in the request
  body** (`@Valid` on the full `PostDto`) even though `PostService.updatePost` never
  reads either field. A real client sending just `{title, content}` gets a 400. Worth
  splitting into a dedicated `PostUpdateRequest` DTO with only the editable fields.
- **`TWO_FACTOR_EMAIL_ENABLED` / `TWO_FACTOR_TEST_CODE` env vars have no effect.**
  `application.yaml` hardcodes `security.two-factor.email-enabled: false` and
  `test-code: "000000"` instead of reading `${TWO_FACTOR_EMAIL_ENABLED}` /
  `${TWO_FACTOR_TEST_CODE}`. Currently harmless because the hardcoded defaults match
  the docker-compose values, but the env vars are dead config — either wire them up
  or remove them from `docker-compose.yml`/`.env.example` to avoid confusion.
- **`PUT /api/v1/users/me/password` returns 204** but the OpenAPI annotation says 200.
  Harmless, just a doc/impl mismatch.
