# Entity Schema

This document describes the current JPA entities and their database shape.

## ER Diagram

```mermaid
erDiagram
    USERS ||--o{ POSTS : authors
    USERS ||--o{ CHANNELS : administers
    USERS ||--|| PROFILES : owns
    USERS }o--o{ CHANNELS : joins
    USERS }o--o{ USERS : follows
    PROFILES ||--|o AVATARS : has
    CHANNELS ||--o{ POSTS : contains
    POSTS ||--o{ COMMENTS : has
    POSTS ||--o{ LIKES : receives
    POSTS ||--o{ DISLIKES : receives
    POSTS ||--o{ POST_ATTACHMENTS : has
    COMMENTS ||--o{ LIKES : receives
    COMMENTS ||--o{ DISLIKES : receives
    USERS ||--o{ LIKES : creates
    USERS ||--o{ DISLIKES : creates
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ EMAIL_VERIFICATION_CODES : receives

    USERS {
        long id PK
        string nickname UK
        string password
        string name
        string last_name
        string email UK
        string phone UK
        string role
        boolean banned_status
        string about
        string online_status
        datetime last_seen_at
    }

    PROFILES {
        long id PK
        long user_id FK
        string display_name
        string bio
        string avatar_url
        string location
        string website_url
        datetime created_at
        datetime updated_at
    }

    AVATARS {
        long id PK
        long profile_id FK
        string original_file_name
        string stored_file_name
        string content_type
        long size
        string url
        datetime created_at
    }

    CHANNELS {
        long id PK
        string name
        string description
        long admin_id FK
    }

    POSTS {
        long id PK
        long user_id FK
        long channel_id FK
        string title
        string content
        datetime data_created
        datetime data_edited
        datetime data_deleted
    }

    POST_ATTACHMENTS {
        long id PK
        long post_id FK
        string original_file_name
        string stored_file_name
        string content_type
        long size
        string url
        datetime created_at
    }

    COMMENTS {
        long id PK
        long user_id FK
        long post_id FK
        string content
        datetime data_created
        datetime data_edited
        datetime data_deleted
    }

    LIKES {
        long id PK
        long post_id FK
        long comment_id FK
        long user_id FK
    }

    DISLIKES {
        long id PK
        long post_id FK
        long comment_id FK
        long user_id FK
    }

    EMAIL_VERIFICATION_CODES {
        long id PK
        long user_id FK
        string verification_id UK
        string code_hash
        datetime expires_at
        boolean used
        datetime created_at
    }
```

## Tables

### users

Java class: `org.example.entity.User`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `nickname` | `nickname` | Required and unique in JPA |
| `password` | `password` | Required in JPA |
| `name` | `name` | Nullable |
| `lastName` | `last_name` | Nullable |
| `email` | `email` | Unique in JPA |
| `phone` | `phone` | Unique in JPA |
| `role` | `role` | Enum string: `ADMIN`, `USER` |
| `bannedStatus` | `banned_status` | Boolean |
| `about` | `about` | Nullable |
| `onlineStatus` | `online_status` | Enum string: `ONLINE`, `OFFLINE` |
| `lastSeenAt` | `last_seen_at` | Nullable |

Relationships:

| Field | Mapping |
| --- | --- |
| `posts` | `@OneToMany(mappedBy = "user")` |
| `administrativeChannels` | `@OneToMany(mappedBy = "admin")` |
| `channels` | `@ManyToMany` through `channel_members(user_id, channel_id)` |
| `following` | `@ManyToMany` through `user_following(user_id, following_id)` |
| `followers` | `@ManyToMany` through `user_followers(user_id, follower_id)` |

### profiles

Java class: `org.example.entity.Profile`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `user` | `user_id` | Required, unique FK to `users.id` |
| `displayName` | `display_name` | Max 80 |
| `bio` | `bio` | Max 500 |
| `avatarUrl` | `avatar_url` | Public avatar download URL |
| `location` | `location` | Nullable |
| `websiteUrl` | `website_url` | Nullable |
| `createdAt` | `created_at` | Nullable |
| `updatedAt` | `updated_at` | Nullable |

Relationships:

| Field | Mapping |
| --- | --- |
| `user` | `@OneToOne(fetch = LAZY)` |
| `avatar` | `@OneToOne(mappedBy = "profile", cascade = ALL, orphanRemoval = true)` |

### avatars

Java class: `org.example.entity.Avatar`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `profile` | `profile_id` | Required, unique FK to `profiles.id` |
| `originalFileName` | `original_file_name` | Original uploaded file name |
| `storedFileName` | `stored_file_name` | File name on disk |
| `contentType` | `content_type` | MIME type |
| `size` | `size` | File size in bytes |
| `url` | `url` | Download endpoint |
| `createdAt` | `created_at` | Upload time |

### channels

Java class: `org.example.entity.Channel`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `name` | `name` | Nullable |
| `description` | `description` | Nullable |
| `admin` | `admin_id` | FK to `users.id` |

Relationships:

| Field | Mapping |
| --- | --- |
| `admin` | `@ManyToOne` |
| `members` | `@ManyToMany(mappedBy = "channels")` |
| `posts` | `@OneToMany(mappedBy = "channel")` |

### posts

Java class: `org.example.entity.Post`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `user` | `user_id` | FK to `users.id` |
| `channel` | `channel_id` | FK to `channels.id` |
| `title` | `title` | Nullable in DB |
| `content` | `content` | Nullable in DB |
| `dataCreated` | `data_created` | Creation time |
| `dataEdited` | `data_edited` | Edit time |
| `dataDeleted` | `data_deleted` | Soft delete marker |

Relationships:

| Field | Mapping |
| --- | --- |
| `user` | `@ManyToOne` |
| `channel` | `@ManyToOne` |
| `likes` | `@OneToMany(mappedBy = "post")` |
| `dislikes` | `@OneToMany(mappedBy = "post")` |
| `comments` | `@OneToMany(mappedBy = "post")` |
| `attachments` | `@OneToMany(mappedBy = "post")` |

### post_attachments

Java class: `org.example.entity.PostAttachment`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `post` | `post_id` | Required FK to `posts.id` |
| `originalFileName` | `original_file_name` | Original uploaded file name |
| `storedFileName` | `stored_file_name` | File name on disk |
| `contentType` | `content_type` | MIME type |
| `size` | `size` | File size in bytes |
| `url` | `url` | Download endpoint |
| `createdAt` | `created_at` | Upload time |

### comments

Java class: `org.example.entity.Comment`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `user` | `user_id` | FK to `users.id` |
| `post` | `post_id` | FK to `posts.id` |
| `content` | `content` | Nullable in DB |
| `dataCreated` | `data_created` | Creation time |
| `dataEdited` | `data_edited` | Edit time |
| `dataDeleted` | `data_deleted` | Soft delete marker |

Relationships:

| Field | Mapping |
| --- | --- |
| `user` | `@ManyToOne` |
| `post` | `@ManyToOne` |
| `likes` | `@OneToMany` |
| `dislikes` | `@OneToMany` |

### likes

Java class: `org.example.entity.Like`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `post` | `post_id` | Nullable FK to `posts.id` |
| `comment` | `comment_id` | Nullable FK to `comments.id` |
| `user` | `user_id` | FK to `users.id` |

One like belongs either to a post or to a comment.

### dislikes

Java class: `org.example.entity.Dislike`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `post` | `post_id` | Nullable FK to `posts.id` |
| `comment` | `comment_id` | Nullable FK to `comments.id` |
| `user` | `user_id` | FK to `users.id` |

One dislike belongs either to a post or to a comment.

### email_verification_codes

Java class: `org.example.entity.EmailVerificationCode`

| Field | Column | Notes |
| --- | --- | --- |
| `id` | `id` | Primary key |
| `user` | `user_id` | Required FK to `users.id` |
| `verificationId` | `verification_id` | Unique temporary id sent to frontend |
| `codeHash` | `code_hash` | BCrypt hash of the six-digit email code |
| `expiresAt` | `expires_at` | Expiration timestamp |
| `used` | `used` | True after successful verify or expiration |
| `createdAt` | `created_at` | Creation timestamp |

## Join Tables

| Table | Purpose | Columns |
| --- | --- | --- |
| `channel_members` | Users joined to channels | `user_id`, `channel_id` |
| `user_following` | Users followed by a user | `user_id`, `following_id` |
| `user_followers` | Users following a user | `user_id`, `follower_id` |
| `comments_likes` | Legacy/unowned comment likes collection from `Comment.likes` | `comment_id`, `likes_id` |
| `comments_dislikes` | Legacy/unowned comment dislikes collection from `Comment.dislikes` | `comment_id`, `dislikes_id` |

## Enums

### UserRoles

```text
ADMIN
USER
```

Stored in `users.role`.

### UserStatus

```text
ONLINE
OFFLINE
```

Stored in `users.online_status`.

## Notes

- `posts.data_deleted` and `comments.data_deleted` are used for soft delete.
- Uploaded post files are stored on disk under `app.uploads.posts-dir`.
- Uploaded avatar files are stored on disk under `app.uploads.avatars-dir`.
- Existing Flyway migrations are append-only. Add new schema changes as a new `V...__description.sql` file.
