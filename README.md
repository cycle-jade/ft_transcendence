*This project has been created as part of the 42 curriculum by glicciar, mabrosiu, rgabdrak, lgengler.*

---

# Transcendence — Social Platform

## Description

**Transcendence** is a full-stack social web application built by a team of four as the final Common Core project at 42 School. Users can create posts, join topic channels, follow each other, comment and vote on content, manage their profiles with avatar upload, and communicate across a full multi-language interface. An admin panel allows privileged users to manage the community.

**Key features:**
- User registration, login with optional 2FA email verification
- Feed, Channels, Posts with likes / dislikes / comments
- Profile pages with bio, skills, avatar, follower counts, online status indicator
- Following / follower social graph
- Admin panel — promote, block, view all users
- Full internationalisation: English, French, Italian, German, Spanish
- Self-contained Docker deployment (single command)

---

## Team Information

| Login | Role(s) | Responsibilities |
|-------|---------|-----------------|
| glicciar | Product Owner · Frontend Lead · DevOps | Defined product scope and priorities; led all frontend development (pages, components, state management, API integration); Docker Compose orchestration; nginx configuration; deployment pipeline |
| mabrosiu | Scrum Master · Frontend | Facilitated sprints and tracked milestones; implemented SSR locale pipeline (`next-i18next`, `getServerSideProps`); language switcher UI; translation files for all 5 locales |
| rgabdrak | Technical Lead · Backend Lead | Defined overall architecture; designed and implemented the full database schema; Spring Boot REST API; Spring Security with JWT; entity relationships and Flyway migrations |
| lgengler | Developer · Backend | Implemented backend API endpoints (posts, comments, likes, channels, skills, avatar); Spring Security configuration; 2FA verification flow; server-side input validation |

---

## Project Management

- **Work organisation:** The team split responsibilities by layer (frontend vs backend) with a shared backlog of features. Tasks were assigned each week in informal stand-ups and tracked through GitHub Issues.
- **Tools:** GitHub (version control + Issues), Discord (daily async communication), VSCode Live Share (pair debugging).
- **Communication:** Daily Discord messages for quick questions; weekly video calls to review progress and plan the next sprint.
- **Code reviews:** All significant changes were reviewed by at least one other team member before being merged to `main`.

---

## Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (v2) installed
- A `.env` file at the project root (see `.env.example` for the required variables)

### Setup

1. Create `.env` from the example and fill in your values:

```bash
cp .env.example .env
# Edit .env with your credentials
```

2. Start the full stack:

```bash
docker compose up --build
```

The initial build takes 3–5 minutes (Maven downloads Java dependencies; npm installs and builds Next.js). Subsequent starts are faster.

3. Open the app at **https://localhost** — the browser will warn about the self-signed certificate. Click **Advanced → Proceed to localhost**.

### Login (2FA test mode)

1. Register at `https://localhost/auth/register`
2. Log in at `https://localhost/auth/login` with your nickname and password
3. When prompted for the verification code enter **`000000`** (2FA email is disabled in test mode; set `TWO_FACTOR_EMAIL_ENABLED=true` in `.env` to enable real email)

### Useful commands

```bash
docker compose down          # stop and remove containers
docker compose down -v       # also wipe the database volume (fresh start)
docker compose logs -f       # stream all service logs
```

### Service URLs

| Service | URL |
|---------|-----|
| Website | https://localhost |
| API | https://localhost/api |
| API docs (Swagger) | https://localhost/swagger-ui |

---

## Technical Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend framework | **Next.js 16** (Pages Router) + React | Provides file-based routing, SSR via `getServerSideProps`, and a rich ecosystem. Pages Router was chosen over App Router for its stability and native `next-i18next` support. |
| Styling | **Tailwind CSS** | Utility-first CSS removes the overhead of custom stylesheets; the design token system (colours, spacing) ensures visual consistency across all pages. |
| Backend framework | **Spring Boot 4.1** (Java 21) | Mature, production-grade Java framework with excellent Spring Security, JPA, and OpenAPI integration; the team had prior Java experience. |
| Authentication | **Spring Security + JWT** | Stateless JWT tokens allow horizontal scaling; Spring Security handles role-based access control out of the box. |
| Database | **PostgreSQL 15** | Relational model fits the normalised entity graph (users ↔ posts ↔ channels ↔ comments); strong FK enforcement prevents orphaned rows; excellent JPA support. |
| ORM | **Spring Data JPA / Hibernate** | Eliminates boilerplate SQL; entity relationships are expressed in Java; schema migrations managed with Flyway. |
| Reverse proxy | **Nginx** | TLS termination, static file caching, and path-based routing (`/api/*` → backend, `/*` → frontend) in a single lightweight container. |
| Containerisation | **Docker Compose** | Single-command start; isolated service networking; no global dependency installation required on the host. |
| i18n | **next-i18next** | First-class Next.js integration; JSON namespace files per language; server-side locale resolution on every page load. |

---

## Database Schema

```
users                         profiles
──────────────────────        ──────────────────────
id          BIGSERIAL PK      id          BIGSERIAL PK
nickname    VARCHAR UNIQUE     user_id     FK → users(id)  CASCADE
email       VARCHAR UNIQUE     display_name VARCHAR
password    VARCHAR (bcrypt)   bio         TEXT
role        ENUM USER|ADMIN    avatar_url  VARCHAR
banned_status BOOLEAN          location    VARCHAR
online_status ENUM ONLINE|OFFLINE website_url VARCHAR
last_seen_at  TIMESTAMP

posts                         channels
──────────────────────        ──────────────────────
id          BIGSERIAL PK      id          BIGSERIAL PK
user_id     FK → users        name        VARCHAR UNIQUE
title       VARCHAR           description TEXT
content     TEXT              admin_id    FK → users  SET NULL
id_channel  FK → channels     created_at  TIMESTAMP
data_created TIMESTAMP

comments                      skills
──────────────────────        ──────────────────────
id          BIGSERIAL PK      id          BIGSERIAL PK
post_id     FK → posts        user_id     FK → users
user_id     FK → users        name        VARCHAR
content     TEXT

likes / dislikes (posts & comments)   follows
──────────────────────────────        ──────────────────────
id          BIGSERIAL PK              id            BIGSERIAL PK
user_id     FK → users                follower_id   FK → users
post_id     FK → posts  (nullable)    following_id  FK → users
comment_id  FK → comments (nullable)

avatars
──────────────────────
id          BIGSERIAL PK
profile_id  FK → profiles
url         VARCHAR
```

All foreign keys referencing `users(id)` use `ON DELETE CASCADE` (data is removed with the user) except `channels.admin_id` which uses `ON DELETE SET NULL` (channel survives its admin leaving).

---

## Features List

| Feature | Description | Author(s) |
|---------|-------------|-----------|
| Registration & Login | Email + password signup; JWT issued on login | rgabdrak, lgengler |
| 2FA verification | 6-digit code sent by email (or `000000` in test mode) on each login | lgengler |
| JWT auth middleware | Bearer token validation on all protected endpoints | rgabdrak |
| Feed page | Global post feed sorted by date; shows author nickname and channel name | glicciar |
| Channels | Create, browse, post within a channel; add members by nickname | glicciar, lgengler |
| Posts | Create (with optional channel), edit, delete, like/dislike | glicciar, lgengler |
| Comments | Thread under each post; per-comment like/dislike with toggle | glicciar, lgengler |
| Profile — own | Edit display name, bio, location, website; upload avatar; manage skills | glicciar, lgengler |
| Profile — other users | View full info, skills, follower count, online status dot; follow/unfollow | glicciar |
| Avatar upload | Multipart image upload to backend; stored and served via `/api/v1/avatar` | glicciar, lgengler |
| Skills | Add/remove skill tags on own profile; click any badge to see all users with that skill | glicciar, lgengler |
| People / search | Search users by nickname; shows avatars and links to profiles | glicciar |
| Follow system | Follow/unfollow any user; follower and following counts on profile | glicciar, lgengler |
| Online status | Heartbeat every 60 s marks user ONLINE; scheduler marks OFFLINE after 5 min idle; immediate mark-offline on logout | glicciar, rgabdrak |
| Admin panel | View all users; promote to ADMIN / demote; block / unblock accounts; 15 s polling for status updates | glicciar |
| Auto-ADMIN | First registered user is automatically assigned ADMIN role | rgabdrak |
| Block enforcement | Blocked accounts rejected at login (Spring Security `accountLocked`); existing tokens expire naturally | rgabdrak |
| i18n (5 languages) | All UI strings in EN, FR, IT, DE, ES; language switcher in nav | mabrosiu |
| SSR locale resolution | `getServerSideProps` on every page resolves locale and loads translations server-side | mabrosiu |
| Design system | 12+ Tailwind-based reusable components: Button, Card, Input, Avatar, Spinner, Badge, Modal, Navbar, Footer, PageWrapper, LanguageSwitcher, FollowButton | glicciar, mabrosiu |
| Privacy Policy & ToS | Accessible from footer on every page; relevant content for the platform | glicciar |
| Swagger API docs | Auto-generated OpenAPI docs at `/swagger-ui` | rgabdrak |
| DB auto-migration | `db/init.sql` executed by Postgres on first start; Flyway handles incremental migrations in dev | rgabdrak |

---

## Modules

**Total claimed: 14 points**

### Major modules (6 points)

| Module | Points | Implementation | Author(s) |
|--------|--------|---------------|-----------|
| **Web — Use a framework for both frontend and backend** | 2 | Frontend: Next.js 16 (Pages Router). Backend: Spring Boot 4.1. Both provide routing, dependency injection, and full ecosystem support. | glicciar (FE), rgabdrak (BE) |
| **User Management — Standard user management and authentication** | 2 | Users register with email + password (bcrypt-hashed); update profile info; upload an avatar (default initials fallback); follow other users and see their online status; dedicated profile page per user. | All members |
| **Web — Allow users to interact with other users** | 2 | Channels act as group messaging spaces (posts sent/received by members); every user has a public profile page; the follow system provides a friend-like social graph (add/remove, see followers). | glicciar, lgengler |

### Minor modules (8 points)

| Module | Points | Implementation | Author(s) |
|--------|--------|---------------|-----------|
| **Web — Use an ORM for the database** | 1 | Spring Data JPA with Hibernate. All entities mapped with `@Entity`; queries via `JpaRepository`; relationships via `@ManyToOne` / `@OneToMany`. No raw SQL in application code. | rgabdrak |
| **Web — Server-Side Rendering (SSR)** | 1 | `getServerSideProps` exported on every Next.js page; runs on the server at request time to load locale and translation namespaces before the page reaches the browser. | mabrosiu |
| **Web — Custom design system** | 1 | 12+ reusable React components (Button, Card, Input, Avatar, Spinner, Badge, Modal, Navbar, Footer, PageWrapper, LanguageSwitcher, FollowButton) with a consistent Tailwind token system (colour palette, spacing, typography). | glicciar, mabrosiu |
| **Web — File upload and management** | 1 | Multipart avatar upload (`POST /api/v1/avatar/{profileId}`); server validates file type; stored in the backend and served back via URL; displayed via the Avatar component with graceful image-error fallback. | glicciar, lgengler |
| **Accessibility & i18n — Multiple languages** | 1 | Full interface in 5 languages (EN, FR, IT, DE, ES) via `next-i18next`; language switcher in the navbar; all user-facing strings externalised to JSON namespace files; locale persisted in the URL. | mabrosiu |
| **Accessibility & i18n — Browser compatibility** | 1 | Tested and verified on Google Chrome, Mozilla Firefox, and Microsoft Edge. All features functional across all three browsers. | glicciar, mabrosiu |
| **User Management — 2FA (Two-Factor Authentication)** | 1 | 6-digit code sent to the user's email on every login via Mailgun. In test mode (`TWO_FACTOR_EMAIL_ENABLED=false`) the code is fixed at `000000` to allow evaluation without an SMTP server. | lgengler |
| **User Management — User activity analytics** | 1 | Profile page displays user activity metrics: follower count, following count, total posts, total comments, member-since date, skills count, and current online status. | glicciar, lgengler |

---

## Individual Contributions

### glicciar — Product Owner, Frontend Lead, DevOps

Built the entire Next.js frontend from scratch: all page components (`feed`, `channels`, `posts`, `profile`, `people`, `skills`, `admin`, `auth`), the `AuthContext` JWT lifecycle (login / logout / token refresh), the `api.js` Axios wrapper, and the full set of reusable UI components. Integrated every frontend page with the backend REST API. Configured Docker Compose orchestration and nginx routing/TLS. Fixed the critical logout online-status bug (fire-and-forget → awaited `markOffline` call). Rewrote the admin panel's status-polling to use `useRef` (stable interval closures). Added the online-status dot to other-user profiles and wired 15-second polling. Updated all `.gitignore` and `.env` patterns for eval compliance.

### mabrosiu — Scrum Master, Frontend (i18n & SSR)

Implemented the full internationalisation pipeline: `next-i18next` configuration, locale routing, `getServerSideProps` on every page for server-side locale resolution, and JSON translation files for all five languages (EN, FR, IT, DE, ES). Built the language switcher component. Coordinated sprint planning, tracked milestones, and ensured timely communication between backend and frontend teams. Contributed to several shared UI components and cross-browser testing.

### rgabdrak — Technical Lead, Backend Lead

Designed the complete database schema (12+ tables, FK relationships, indexes). Implemented Spring Boot project structure, all JPA entities, Flyway V1–V9 migrations, `UserRepository` and associated services. Built Spring Security configuration: JWT filter chain, `AccountLocked` enforcement, role-based method security. Exposed the `UserController` endpoints for online/offline, profile, and admin operations. Wrote the OpenAPI/Swagger annotations. Managed the `db/init.sql` automation for eval-time DB initialisation.

### lgengler — Developer, Backend

Implemented the API endpoints for posts, comments, likes/dislikes (posts and comments), channels (CRUD, membership), skills (add/remove), and avatar upload. Built the 2FA flow: code generation, Mailgun integration, verification endpoint. Added server-side input validation (`@Valid`, `@NotBlank`, custom exception handlers with proper HTTP status codes). Contributed to `UserDto` extension (`onlineStatus` field) and the `markOffline` service method. Paired with glicciar to debug frontend-backend integration issues.

---

## Security

- Passwords hashed with **BCrypt** (Spring Security default)
- **JWT** bearer tokens, 1-hour expiry, signed with a secret from `.env`
- **2FA** email verification on every login
- **HTTPS** enforced — all external traffic routed through nginx TLS (self-signed cert bundled for local eval)
- **Role-based access control** — `USER` and `ADMIN` roles; admin endpoints guarded by `@PreAuthorize`
- **Input validation** — `@Valid` + `@NotBlank` on all request DTOs; global exception handler returns structured error responses
- **Account locking** — blocked users rejected at the Spring Security `UserDetailsService` level

---

## Resources

### Technical references

- [Next.js Pages Router documentation](https://nextjs.org/docs/pages)
- [next-i18next — i18n for Next.js](https://github.com/i18next/next-i18next)
- [Spring Boot reference documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Security architecture](https://spring.io/guides/topicals/spring-security-architecture)
- [JSON Web Tokens — jwt.io introduction](https://jwt.io/introduction)
- [Flyway database migrations](https://flywaydb.org/documentation/)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [Docker Compose reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL documentation](https://www.postgresql.org/docs/15/)
- [BCrypt password hashing](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html)

### AI usage

**Claude (Anthropic)** was used extensively throughout the project as a coding and debugging assistant. Specific uses:

- **Backend architecture:** generating the initial Spring Boot project skeleton, entity relationship design, and Flyway migration scripts
- **Frontend component patterns:** React hook patterns (`useRef` for stable interval closures, `useCallback` for memoised callbacks), Next.js `getServerSideProps` structure
- **Bug diagnosis:** identifying the stale-closure issue in the admin panel polling loop; diagnosing the fire-and-forget logout race condition; tracing the nginx routing misconfiguration
- **Documentation:** generating the first drafts of this README, `docs/backend_changes.md`, and `docs/frontend_changes.md`; all content was reviewed and corrected by the team
- **SQL migrations:** drafting the V9 FK cascade migration (all 28 `ALTER TABLE` statements were individually reviewed)
- **Docker Compose:** moving credentials out of `docker-compose.yml` into `.env`, and wiring the `db/init.sql` init hook

All AI-generated code was reviewed, tested, and understood by the team members before being committed.
