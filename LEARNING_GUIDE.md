# InternIQ Learning Guide

---

# DAY 1: Foundation — Project Setup, Supabase, Auth

## What We Accomplished Today
- Set up a Next.js 14 project from scratch
- Connected it to Supabase (database + authentication)
- Built login and signup pages
- Built a protected dashboard with a sidebar
- Learned about: App Router, Server vs Client Components, Supabase Auth, Row Level Security, Middleware

---

## 1. What is Next.js and Why We Chose It

**Next.js** is a React framework. React by itself only handles the UI — Next.js adds:
- **Routing** — each file in `src/app/` becomes a URL automatically
- **Server-Side Rendering (SSR)** — pages can render on the server before reaching the browser (faster, better SEO)
- **API Routes** — you can write backend endpoints inside the same project
- **Built-in optimizations** — image optimization, code splitting, etc.

**We're using Next.js 14 with the App Router** (the newer routing system, as opposed to the older "Pages Router").

### How the App Router Works

Every folder inside `src/app/` becomes a URL path. The file `page.tsx` inside that folder is what renders.

```
src/app/page.tsx            → http://localhost:3000/
src/app/dashboard/page.tsx  → http://localhost:3000/dashboard
src/app/login/page.tsx      → http://localhost:3000/login
src/app/signup/page.tsx     → http://localhost:3000/signup
```

**Special files:**
| File | Purpose |
|------|---------|
| `page.tsx` | The actual page content (required for a route to exist) |
| `layout.tsx` | Wraps around pages — shared UI like sidebars, navbars |
| `loading.tsx` | Shown while the page is loading |
| `error.tsx` | Shown when something crashes |
| `route.ts` | API endpoint (no UI, returns JSON) |
| `not-found.tsx` | Custom 404 page |

### Route Groups: The `(auth)` Folder

Notice our auth pages are in `src/app/(auth)/login/` — the parentheses `()` mean this is a **route group**. The folder name is NOT part of the URL.

```
src/app/(auth)/login/page.tsx  → http://localhost:3000/login  (NOT /auth/login)
src/app/(auth)/signup/page.tsx → http://localhost:3000/signup
```

**Why use route groups?** Organization. We group auth pages together in the code without affecting the URL.

---

## 2. Server Components vs Client Components

This is the **most important concept** in Next.js App Router.

### Server Components (default)
Every component is a **Server Component** by default. They:
- Run on the server only (never in the browser)
- Can directly access databases, APIs, environment variables
- Cannot use `useState`, `useEffect`, `onClick`, or any browser APIs
- Are faster because they don't ship JavaScript to the browser

**Example — our dashboard page:**
```tsx
// src/app/dashboard/page.tsx — Server Component (no "use client")
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();  // Direct database access!
  const { data: { user } } = await supabase.auth.getUser();
  // ...
}
```

### Client Components
Add `"use client"` at the top to make it a **Client Component**. They:
- Run in the browser
- Can use hooks (`useState`, `useEffect`), event handlers (`onClick`), browser APIs
- Are needed for interactivity (forms, buttons, dropdowns)

**Example — our login page:**
```tsx
"use client";  // ← This line makes it a Client Component

import { useState } from "react";  // Can use hooks now!

export default function LoginPage() {
  const [email, setEmail] = useState("");  // State!
  // ...
}
```

### When to Use Which?

| Need | Use |
|------|-----|
| Fetch data from database | Server Component |
| Display static content | Server Component |
| Form with inputs | Client Component |
| Button with onClick | Client Component |
| useState or useEffect | Client Component |
| Access cookies/headers on server | Server Component |

**Rule of thumb:** Start with Server Components. Only add `"use client"` when you need interactivity.

---

## 3. Supabase — What It Is and How We Use It

### What is Supabase?

Supabase is a "Backend as a Service." Instead of building your own server with a database, Supabase gives you:

1. **PostgreSQL Database** — a real SQL database where your data lives
2. **Authentication** — sign up, log in, sessions, password reset
3. **Row Level Security (RLS)** — database-level rules for who can access what
4. **Storage** — file uploads (avatars, resumes)
5. **Auto-generated API** — REST API for your tables

You don't run any servers. It's all hosted by Supabase.

### Our Two Supabase Clients

We created two different ways to talk to Supabase:

**Browser Client** (`src/lib/supabase/client.ts`):
```tsx
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
```
- Used in Client Components (anything with `"use client"`)
- Runs in the browser
- Has limited permissions (only what RLS allows)

**Server Client** (`src/lib/supabase/server.ts`):
```tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = () => {
  const cookieStore = cookies();
  return createServerClient(/* ... uses cookies for auth */);
};
```
- Used in Server Components and API Routes
- Runs on the server only
- Reads cookies to know which user is logged in
- Still limited by RLS (uses the user's permissions, not admin)

### Why Two Clients?

The browser and server are different environments:
- **Browser:** Has access to `localStorage`, can see cookies, runs JavaScript
- **Server:** Has access to `cookies()` from Next.js, can read environment variables securely

The `@supabase/ssr` package handles this difference for us.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://lwlqrmqnbtpkxlgfqtlx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

- `NEXT_PUBLIC_` prefix = available in both browser and server
- Without prefix = server only (never sent to browser)
- `SUPABASE_SERVICE_ROLE_KEY` has NO prefix because it's the admin key — **never expose it to the browser**

---

## 4. The Database Schema (SQL)

### What We Created

We created 7 tables in our Supabase PostgreSQL database:

```
profiles       — User info (name, bio, avatar, links)
education      — Schools, degrees, GPA
experience     — Jobs, internships
projects       — Side projects, hackathons
skills         — Programming languages, frameworks, tools
applications   — Job applications (for the Kanban board)
resumes        — Uploaded resume files
```

### How Tables Relate to Each Other

```
auth.users (Supabase built-in)
    │
    └── profiles (1-to-1: each user has exactly one profile)
            │
            ├── education (1-to-many: user has many education entries)
            ├── experience (1-to-many)
            ├── projects (1-to-many)
            ├── skills (1-to-many)
            ├── applications (1-to-many)
            └── resumes (1-to-many)
```

### Key SQL Concepts Used

**PRIMARY KEY** — uniquely identifies each row:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

**FOREIGN KEY** — links one table to another:
```sql
user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
```
`ON DELETE CASCADE` means: if a profile is deleted, all their education/experience/etc. are automatically deleted too.

**TRIGGERS** — code that runs automatically when something happens:
```sql
-- When a new user signs up, automatically create a profile for them
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**CHECK CONSTRAINTS** — enforce valid values:
```sql
status TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('saved', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'))
```

**INDEXES** — make queries faster:
```sql
CREATE INDEX idx_profiles_username ON public.profiles(username);
```
Without an index, searching for a username scans every row. With an index, it's instant.

---

## 5. Row Level Security (RLS)

This is one of the most powerful features of Supabase. **RLS enforces permissions at the database level.**

### The Problem Without RLS

Without RLS, if User A knows User B's ID, they could:
```sql
DELETE FROM applications WHERE user_id = 'user-b-id';  -- Delete someone else's data!
```

### How RLS Solves This

RLS adds rules (called "policies") to every table:

```sql
-- Only the owner can see their own applications
CREATE POLICY "Users can view own applications"
    ON public.applications FOR SELECT
    USING (auth.uid() = user_id);
```

`auth.uid()` is a Supabase function that returns the ID of the currently logged-in user. So this policy says: "You can only SELECT rows where `user_id` matches YOUR user ID."

### Public vs Private Tables

We made different rules for different tables:

**Public tables** (profiles, education, experience, projects, skills):
```sql
-- Anyone can read (for the public profile page)
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT USING (true);  -- true = everyone

-- Only the owner can edit
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)        -- Can only update rows where you're the owner
    WITH CHECK (auth.uid() = id);  -- Can only set the owner to yourself
```

**Private tables** (applications, resumes):
```sql
-- Only the owner can even SEE their own data
CREATE POLICY "Users can view own applications"
    ON public.applications FOR SELECT
    USING (auth.uid() = user_id);  -- Only your own rows
```

**Why this matters:** Even if someone hacks the frontend JavaScript, they still can't access other users' data because the DATABASE enforces the rules.

---

## 6. Authentication Flow

### How Sign Up Works

1. User fills in name, email, password on `/signup`
2. Our code calls `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
3. Supabase creates a row in `auth.users` (its built-in users table)
4. Our database trigger `on_auth_user_created` fires automatically
5. The trigger creates a row in `public.profiles` with the user's ID and name
6. Supabase returns a session (JWT token) stored in cookies
7. We redirect to `/dashboard`

### How Login Works

1. User enters email + password on `/login`
2. Our code calls `supabase.auth.signInWithPassword({ email, password })`
3. Supabase verifies credentials and returns a session
4. Session is stored in cookies automatically
5. We redirect to `/dashboard`

### How the Dashboard Stays Protected

```tsx
// src/app/dashboard/layout.tsx
export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");  // Not logged in? Go away!
  }

  return <div>{children}</div>;
}
```

Every page inside `/dashboard/*` goes through this layout first. If you're not logged in, you get sent to `/login`.

### What is a JWT?

When you log in, Supabase gives you a **JSON Web Token (JWT)**. It's a long string like `eyJhbG...` that contains:
- Your user ID
- When the token expires
- Your role (anon, authenticated, etc.)

This token is stored in cookies and sent with every request. Supabase reads it to know who you are.

---

## 7. Middleware — Session Refresh

```tsx
// src/middleware.ts
export async function middleware(request: NextRequest) {
  // ... creates a Supabase client that reads/writes cookies
  await supabase.auth.getUser();  // This refreshes the session
  return supabaseResponse;
}
```

**What middleware does:** It runs BEFORE every page request. Our middleware refreshes the Supabase session (JWT tokens expire, so they need periodic refreshing). Without this, users would get randomly logged out.

**The matcher** tells middleware which routes to run on:
```tsx
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```
This means: run on all routes EXCEPT static files and images.

---

## 8. shadcn/ui — The Component Library

### What is shadcn/ui?

Unlike traditional component libraries (Material UI, Chakra UI), shadcn/ui **copies component code directly into your project**. You own the code and can modify it.

The components live in `src/components/ui/`:
```
button.tsx, card.tsx, input.tsx, label.tsx, textarea.tsx,
dialog.tsx, select.tsx, badge.tsx, tabs.tsx, avatar.tsx,
dropdown-menu.tsx, separator.tsx, sheet.tsx, sonner.tsx
```

### How They Work

Each component uses:
- **Radix UI** — headless (unstyled) accessible primitives (handles keyboard navigation, focus, ARIA attributes)
- **Tailwind CSS** — for styling
- **class-variance-authority (CVA)** — for component variants (different sizes, colors)
- **cn() utility** — merges Tailwind classes intelligently

**Example — how the Button works:**
```tsx
// Variants define different styles
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background ...",
        ghost: "hover:bg-accent ...",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
);

// Usage:
<Button variant="outline" size="sm">Click me</Button>
```

### The cn() Utility

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

- `clsx` — combines class names, handles conditionals: `clsx("base", isActive && "active")`
- `twMerge` — resolves Tailwind conflicts: `twMerge("px-4 px-6")` → `"px-6"` (last one wins)

---

## 9. Tailwind CSS Theming

### CSS Variables for Colors

In `globals.css`, we define colors as CSS variables:
```css
:root {
  --background: 0 0% 100%;     /* white */
  --foreground: 0 0% 3.9%;     /* near-black */
  --primary: 0 0% 9%;          /* dark */
  --muted: 0 0% 96.1%;         /* light gray */
}

.dark {
  --background: 0 0% 3.9%;     /* near-black */
  --foreground: 0 0% 98%;      /* near-white */
}
```

These are **HSL values** (Hue, Saturation, Lightness) WITHOUT the `hsl()` wrapper.

In `tailwind.config.ts`, we reference them:
```ts
colors: {
  background: "hsl(var(--background))",
  primary: { DEFAULT: "hsl(var(--primary))" },
}
```

**Why?** Changing one CSS variable changes the color EVERYWHERE. And `.dark` class swaps all colors at once for dark mode.

---

## 10. The useAuth Hook

```tsx
// src/hooks/use-auth.ts
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();  // Cleanup
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return { user, loading, signOut };
};
```

**What's happening:**
1. On mount, check if user is already logged in
2. Subscribe to auth changes (so UI updates instantly on login/logout)
3. Return cleanup function to unsubscribe when component unmounts
4. Provide a `signOut` function that logs out and redirects

This is a **custom hook** — reusable logic you can use in any Client Component:
```tsx
const { user, loading, signOut } = useAuth();
```

---

## 11. File Structure Summary

```
InternIQ/
├── .cursorrules              ← Rules for Cursor AI agent
├── .cursor/rules/            ← More specific rules per file type
├── .env.local                ← Your secret keys (NEVER commit this)
├── .env.example              ← Template so others know what keys are needed
├── src/
│   ├── app/                  ← Pages and API routes (App Router)
│   │   ├── layout.tsx        ← Root layout (wraps ALL pages)
│   │   ├── page.tsx          ← Homepage (currently default Next.js boilerplate)
│   │   ├── (auth)/           ← Auth pages (route group, no /auth in URL)
│   │   │   ├── login/        ← /login
│   │   │   ├── signup/       ← /signup
│   │   │   └── callback/     ← /callback (handles email confirmation redirects)
│   │   └── dashboard/        ← /dashboard (protected by layout.tsx auth check)
│   │       ├── layout.tsx    ← Auth guard + sidebar wrapper
│   │       └── page.tsx      ← Dashboard overview
│   ├── components/
│   │   ├── ui/               ← shadcn/ui primitives (14 components)
│   │   └── dashboard/
│   │       └── sidebar.tsx   ← Navigation sidebar
│   ├── hooks/
│   │   └── use-auth.ts       ← Custom hook for auth state
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts     ← Browser Supabase client
│   │   │   └── server.ts     ← Server Supabase client
│   │   ├── utils.ts          ← cn() class merge utility
│   │   └── constants.ts      ← Status labels, colors, categories
│   ├── types/
│   │   └── database.ts       ← TypeScript interfaces for all tables
│   └── middleware.ts          ← Session refresh on every request
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← Complete database schema
├── tailwind.config.ts         ← Tailwind theme with shadcn colors
└── package.json               ← Dependencies and scripts
```

---

## Key Takeaways from Day 1

1. **Next.js App Router** = file-based routing where folders become URLs
2. **Server Components** = default, fast, can access DB directly. **Client Components** = add `"use client"` for interactivity
3. **Supabase** = your backend (database + auth + storage) without running a server
4. **RLS** = database-level security. Even if someone hacks your frontend, the database protects data
5. **Middleware** = runs before every request, keeps auth sessions alive
6. **shadcn/ui** = component code you OWN (not a black-box library)
7. **Environment variables** = `NEXT_PUBLIC_` = browser-safe, no prefix = server-only secrets
8. **Custom hooks** = reusable logic (like `useAuth`) shared across Client Components

---

## What's Coming Next (Day 2 Preview)

Tomorrow you'll build:
- **API Routes** — `src/app/api/profile/route.ts` (your own backend endpoints inside Next.js)
- **Profile Edit Form** — CRUD operations (Create, Read, Update, Delete) for profile, education, experience, projects, skills
- **Public Profile Page** — Server-rendered page at `/{username}` with SEO metadata
- **Avatar Upload** — File upload to Supabase Storage

You'll learn: how API routes work, how to do CRUD with Supabase, Server-Side Rendering for SEO, and file uploads.
