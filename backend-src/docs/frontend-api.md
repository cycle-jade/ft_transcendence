# Frontend API Documentation

Base URL for local development:

```text
http://localhost:8080
```

All `/api/v1/**` endpoints require a JWT access token.

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Multipart endpoints must use `multipart/form-data`.

The backend reads the current user from JWT claim `userId`. Do not send `userId` for actions owned by the logged-in user unless the endpoint explicitly asks for it.

## Auth

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "nickname": "john",
  "password": "password",
  "email": "john@example.com",
  "name": "John",
  "lastName": "Doe",
  "phone": "+10000000000"
}
```

Response `201`:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 300
}
```

### Login By Email

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "john@example.com",
  "password": "password"
}
```

Response `200`:

```json
{
  "requiresTwoFactor": true,
  "verificationId": "2f9a0c7d-0d8d-4e1f-8f4d-4fd32ef36a1f",
  "expiresInSeconds": 600
}
```

### Login By Nickname

```http
POST /api/auth/login/nickname
```

Request:

```json
{
  "nickname": "john",
  "password": "password"
}
```

Response `200` has the same shape as login by email.

### Verify Email Code

```http
POST /api/auth/verify-email-code
```

Request:

```json
{
  "verificationId": "2f9a0c7d-0d8d-4e1f-8f4d-4fd32ef36a1f",
  "code": "123456"
}
```

Response `200`:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 300
}
```

The frontend should store the access token only after this verification step.

## Users

### Get Current User

```http
GET /api/v1/users/me
```

Response:

```json
{
  "id": 1,
  "nickname": "john",
  "name": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+10000000000",
  "role": "USER",
  "postIds": [10, 11],
  "channelIds": [3],
  "about": "Hello"
}
```

### Get User By Id

```http
GET /api/v1/users/{id}
```

Response shape is the same as `GET /api/v1/users/me`.

### Update User

```http
PUT /api/v1/users/update/{id}
```

The user can update themself. Admin can update another user.

Request:

```json
{
  "id": 1,
  "nickname": "john",
  "name": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+10000000000",
  "role": "USER",
  "postIds": [],
  "channelIds": [],
  "about": "Updated bio"
}
```

### Change Current User Password

```http
PUT /api/v1/users/me/password
```

Request:

```json
{
  "oldPassword": "old-password",
  "newPassword": "new-password"
}
```

Response:

```http
204 No Content
```

### Mark Current User Online

```http
POST /api/v1/users/online
```

Updates `lastSeenAt` for the current JWT user.

Response:

```http
204 No Content
```

## Profiles

Profiles contain public profile page data. Users contain account and security data.

### Create Current User Profile

```http
POST /api/v1/profiles/me
```

Request:

```json
{
  "displayName": "John",
  "bio": "Backend developer",
  "avatarUrl": null,
  "location": "Paris",
  "websiteUrl": "https://example.com"
}
```

Response `201`:

```json
{
  "id": 1,
  "userId": 1,
  "displayName": "John",
  "bio": "Backend developer",
  "avatarUrl": null,
  "location": "Paris",
  "websiteUrl": "https://example.com",
  "createdAt": "2026-07-02T15:20:00",
  "updatedAt": "2026-07-02T15:20:00"
}
```

### Get Current User Profile

```http
GET /api/v1/profiles/me
```

### Get Profile By Profile Id

```http
GET /api/v1/profiles/{id}
```

### Get Profile By User Id

```http
GET /api/v1/profiles/user/{userId}
```

### Update Profile By Profile Id

```http
PUT /api/v1/profiles/{id}
```

Uses JWT `userId` to verify ownership.

### Update Current User Profile

```http
PUT /api/v1/profiles/me
```

Request shape is the same as profile create.

### Delete Profile

```http
DELETE /api/v1/profiles/{id}
```

Owner or admin only.

Response:

```http
204 No Content
```

## Avatar

### Upload Avatar

```http
POST /api/v1/avatar/{profileId}
Content-Type: multipart/form-data
```

Form field:

```text
file=<binary file>
```

Response `201`:

```json
{
  "id": 1,
  "profileId": 1,
  "originalFileName": "avatar.png",
  "contentType": "image/png",
  "size": 12345,
  "url": "/api/v1/avatar/1/download",
  "createdAt": "2026-07-02T15:20:00"
}
```

### Download Avatar

```http
GET /api/v1/avatar/{avatarId}/download
```

Response body is the file.

### Delete Avatar

```http
DELETE /api/v1/avatar/{profileId}/{avatarId}
```

Owner only.

Response:

```http
204 No Content
```

## Channels

### Create Channel

```http
POST /api/v1/channels/new
```

Request:

```json
{
  "name": "General",
  "description": "Main discussion channel"
}
```

Response `201`:

```json
{
  "id": 1,
  "name": "General",
  "description": "Main discussion channel",
  "adminId": 1,
  "memberCount": 0,
  "postCount": 0
}
```

### Get Channel

```http
GET /api/v1/channels/{channelId}
```

### Get Current User Channels

```http
GET /api/v1/channels/member
```

Response:

```json
[
  {
    "id": 1,
    "name": "General"
  }
]
```

### Delete Channel

```http
DELETE /api/v1/channels/{channelId}
```

Channel admin or app admin only.

Response:

```http
204 No Content
```

## Posts

### Create Post

```http
POST /api/v1/posts/new
```

Uses JWT `userId`. Frontend should not send a user id.

Request:

```json
{
  "title": "Hello",
  "content": "My first post"
}
```

Response `201`:

```json
123
```

The response body is the new post id.

### Get Post By Id

```http
GET /api/v1/posts/{id}
```

Response:

```json
{
  "userId": 1,
  "title": "Hello",
  "content": "My first post",
  "likes": null,
  "dislikes": null,
  "idComments": [5, 6],
  "idChannel": 1,
  "dataCreated": "2026-07-02T15:20:00",
  "dataEdited": null,
  "dataDeleted": null
}
```

### Get All Posts

```http
GET /api/v1/posts/all
```

Returns only posts where `dataDeleted` is null.

### Get Posts By User

```http
GET /api/v1/posts/postByUser/{userId}
```

### Get Posts By Channel

```http
GET /api/v1/posts/channel/{channelId}
```

### Update Post

```http
PUT /api/v1/posts/edit/{id}
```

Owner only.

Request:

```json
{
  "userId": 1,
  "title": "Updated title",
  "content": "Updated content",
  "likes": null,
  "dislikes": null,
  "idComments": [],
  "idChannel": 1,
  "dataCreated": "2026-07-02T15:20:00",
  "dataEdited": null,
  "dataDeleted": null
}
```

### Delete Post

```http
DELETE /api/v1/posts/{id}
```

Owner or admin only. This is a soft delete.

Response:

```http
204 No Content
```

## Post Attachments

### Upload Attachment

```http
POST /api/v1/posts/{postId}/attachments
Content-Type: multipart/form-data
```

Form field:

```text
file=<binary file>
```

Response `201`:

```json
{
  "id": 1,
  "postId": 123,
  "originalFileName": "document.pdf",
  "contentType": "application/pdf",
  "size": 45678,
  "url": "/api/v1/posts/123/attachments/1/download",
  "createdAt": "2026-07-02T15:20:00"
}
```

### List Post Attachments

```http
GET /api/v1/posts/{postId}/attachments
```

### Download Attachment

```http
GET /api/v1/posts/{postId}/attachments/{attachmentId}/download
```

Response body is the file.

### Delete Attachment

```http
DELETE /api/v1/posts/{postId}/attachments/{attachmentId}
```

Post owner only.

Response:

```http
204 No Content
```

## Comments

### Create Comment

```http
POST /api/v1/comments/new
```

Uses JWT `userId`. Frontend should not send `userId`.

Request:

```json
{
  "postId": 123,
  "content": "Nice post"
}
```

Response:

```json
{
  "id": 5,
  "postId": 123,
  "userId": 1,
  "content": "Nice post",
  "dataCreated": "2026-07-02T15:20:00",
  "dataEdited": null,
  "dataDeleted": null
}
```

### Get Comments By Post

```http
GET /api/v1/comments/post/{postId}
```

### Get Comments By User

```http
GET /api/v1/comments/user/{userId}
```

### Update Comment

```http
PUT /api/v1/comments/{commentId}
```

Owner or admin only.

Request:

```json
{
  "content": "Updated comment"
}
```

### Delete Comment

```http
DELETE /api/v1/comments/{commentId}
```

Owner or admin only. This is a soft delete.

Response:

```http
204 No Content
```

## Likes

```http
POST   /api/v1/likes/post/{postId}
DELETE /api/v1/likes/post/{postId}
GET    /api/v1/likes/post/{postId}/count
POST   /api/v1/likes/comment/{commentId}
DELETE /api/v1/likes/comment/{commentId}
GET    /api/v1/likes/comment/{commentId}/count
```

Like and dislike are mutually exclusive. Adding one removes the other.

## Dislikes

```http
POST   /api/v1/dislike/post/{postId}
DELETE /api/v1/dislike/post/{postId}
GET    /api/v1/dislike/post/{postId}/count
POST   /api/v1/dislike/comment/{commentId}
DELETE /api/v1/dislike/comment/{commentId}
GET    /api/v1/dislike/comment/{commentId}/count
```

## Social

Base path:

```http
/api/v1/social
```

Endpoints:

```http
POST   /follow/{targetId}
DELETE /unfollow/{targetId}
GET    /follower/count
GET    /follower/all
GET    /following/count
GET    /following/all
```

The follow endpoints use the current JWT user as the acting user.

## Frontend Notes

- Store `accessToken` after login/register.
- Send `Authorization: Bearer <accessToken>` on every `/api/v1/**` request.
- Use `/api/v1/users/me` for account data.
- Use `/api/v1/profiles/me` for profile data.
- Use `/api/v1/users/online` periodically if online status is needed.
- Use file endpoints with `multipart/form-data`; do not send JSON for file upload.
