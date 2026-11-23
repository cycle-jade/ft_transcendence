# FT_Transcendence — Frontend

Next.js 16 (Pages Router) frontend for the FT_Transcendence social platform.
Served via nginx reverse proxy at `https://localhost`. All API traffic is proxied to the Spring Boot backend at `:8080`.

---

## Stack

| Tool | Purpose |
|------|---------|
| Next.js 16 (Pages Router) | SSR framework, file-based routing |
| React | Component model |
| Tailwind CSS | Styling (custom design system) |
| next-i18next | i18n — EN, FR, IT, DE, ES |
| Axios | HTTP client (`src/lib/api.js`) |
| JWT (localStorage) | Auth token storage |

---

## Architecture notes

### SSR vs. CSR

`getServerSideProps` is exported on **every page** and is responsible for resolving the
active locale and loading translations before the page HTML is sent to the browser.
This is real server-side rendering — the server picks the right language bundle and
pre-renders the page shell.

Dynamic data (posts, channels, user profiles) is fetched client-side via `useEffect`
because the Next.js container cannot reach `https://localhost` internally — that URL
resolves only from the outside (through nginx). The correct internal URL would be
`http://backend:8080`, but that would require environment-specific base URL configuration.
All data fetching therefore happens after hydration, with loading spinners shown during fetch.

### API client

`src/lib/api.js` — Axios instance with base URL `/api`, automatically injects
`Authorization: Bearer <token>` from `localStorage` on every request. All endpoint
paths are defined in the `endpoints` object in the same file to avoid magic strings.

### Auth context

`src/context/AuthContext.js` — React context that reads `accessToken` from
`localStorage`, decodes it (JWT), and exposes `{ user, token, login, logout }`.
Consumed by every page and most components.

---

## Directory structure

```
src/
  components/
    ui/          # Primitive design-system components (Button, Card, Avatar, Input, Spinner, Badge)
    CommentList.js
    NewPostForm.js
    PostList.js
    Navbar.js
  context/
    AuthContext.js
  lib/
    api.js       # Axios client + endpoint registry
  pages/
    auth/        # login.js, register.js, verify.js
    channels/    # index.js (list), [slug].js (detail)
    posts/       # index.js (feed), [id].js (detail)
    profile/     # index.js (own profile), [id].js (other user)
    people/      # index.js (user search)
    skills/      # [id].js (users with a given skill)
    admin/       # index.js (admin panel)
    _app.js
    index.js
  styles/
    globals.css
public/
  locales/       # en, fr, it, de, es JSON translation files
```

---

## Running locally (outside Docker)

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

The dev server proxies `/api` to `http://localhost:8080` via `next.config.js`.
The backend must be running separately.

---

## Environment

No `.env` file is required. The base URL for the API is always `/api` (relative),
which nginx rewrites to the backend container in production and Next.js rewrites
in development via `next.config.js`.

---

## i18n

Translation files are in `public/locales/{lang}/common.json` (and `posts.json`).
Language is selected via a dropdown in the Navbar. `next-i18next` is configured in
`next-i18next.config.js` with `defaultLocale: "en"`.

`getServerSideProps` on every page:
```js
export async function getServerSideProps({ locale }) {
  return { props: { ...(await serverSideTranslations(locale, ["common"])) } };
}
```
