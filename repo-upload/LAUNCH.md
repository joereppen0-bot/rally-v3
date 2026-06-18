# Launching Rally — detailed, step-by-step

A beginner-friendly walkthrough to put Rally online with **email verification** and the
**AI legitimacy check** turned on. You do **not** need a domain to start — you'll get a
free `something.vercel.app` address first and can attach a custom domain later.

**Where the project lives:** `C:\Users\Pitty\New folder\rally`
(File Explorer → This PC → `New folder` → `rally`.)

---

## Overview (what happens and why)

Rally is two pieces working together:
- the **website** (what people see) — hosted free on **Vercel**;
- the **services** behind it — **Supabase** (email sign-in + saved events) and the
  **Anthropic API** (the "What is this about?" summaries and the web-search legitimacy
  check on new events).

You'll: put the code on GitHub → connect it to Vercel → paste in 3 keys → done. Roughly
30–45 minutes. Everything except buying a domain can be done now.

---

## Part A — Put the code on GitHub

GitHub is where Vercel reads your code from. The easiest no-typing route is **GitHub
Desktop** (you already have Git installed, so the command-line route also works).

### A1. Make a GitHub account
1. Go to **github.com** → **Sign up**. Use your email, pick a username, verify the email.

### A2. Install GitHub Desktop
1. Go to **desktop.github.com** → download → install → sign in with your GitHub account.

### A3. Turn the rally folder into a repository
1. In GitHub Desktop: **File → Add local repository…**
2. Browse to `C:\Users\Pitty\New folder\rally` and select it.
3. It will say "this isn't a Git repository — create one?" → click **Create a repository**.
4. Leave defaults, click **Create repository**. (The included `.gitignore` automatically
   excludes `node_modules` and your secret `.env`, so only the real code is added.)
5. Click **Publish repository** (top right). Keep **"Keep this code private"** ticked.
   Click **Publish**.

Your code is now on GitHub. ✅

> **Command-line alternative** (Git Bash, in the rally folder):
> ```
> git init && git add . && git commit -m "Rally"
> ```
> then create an empty repo on github.com and follow its "push an existing repository"
> lines. GitHub Desktop is easier if you're not sure.

---

## Part B — Deploy to Vercel (gets you a live URL)

### B1. Make a Vercel account
1. Go to **vercel.com** → **Sign Up** → **Continue with GitHub** → authorise.

### B2. Import the project
1. Vercel dashboard → **Add New… → Project**.
2. Find your `rally` repo in the list → **Import**.
3. **Framework Preset** should auto-detect **Vite**. Leave Build Command (`npm run build`)
   and Output Directory (`dist`) as-is — they're already set by `vercel.json`.
4. Click **Deploy**. Wait ~1 minute.
5. You'll get a live link like `https://rally-xxxx.vercel.app`. Open it — the app runs in
   demo mode right now. Parts C and D switch on the real features.

---

## Part C — Turn on the AI legitimacy check + summaries

### C1. Get an Anthropic API key
1. Go to **console.anthropic.com** → sign up.
2. **Settings → Billing** → add a payment method and set a **monthly spend limit**
   (e.g. $5) so costs stay capped. *(Web search used by the legitimacy check is billed
   per search.)*
3. **Settings → API Keys → Create Key** → copy the value (starts with `sk-ant-`).

### C2. Add the key to Vercel
1. Vercel → your project → **Settings → Environment Variables**.
2. Add: **Key** = `ANTHROPIC_API_KEY`, **Value** = your `sk-ant-...`, Environments = all.
   Click **Save**.
3. **Deployments** tab → top deployment → **⋯ → Redeploy**.

Now `/api/ai` is live: it runs the cause summaries and the **web-search legitimacy check**
when someone adds an event. With Supabase connected (next), anything the AI doesn't
positively verify is held for a manual confirm before it can appear on the map.

---

## Part D — Turn on email verification (Supabase)

### D1. Create the project
1. Go to **supabase.com** → sign in with GitHub → **New project**. Pick a name and a
   strong database password (save it). Choose the region nearest your users.

### D2. Create the database tables
1. Left sidebar → **SQL Editor → New query**.
2. Open `supabase/schema.sql` from the rally folder, copy **all** of it, paste it in, and
   click **Run**. You should see "Success".

### D3. Enable email codes
1. **Authentication → Sign In / Providers → Email** → make sure it's **enabled**.
2. Turn on **"Confirm email"** / **Email OTP** (the 6-digit code option).
3. **Authentication → Emails → Templates → "Magic Link"**: make sure the body includes the
   code token so the 6-digit code is emailed. A minimal body that works with Rally:
   ```html
   <h2>Your Rally sign-in code</h2>
   <p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
   <p>Or tap the link: <a href="{{ .ConfirmationURL }}">Sign in</a></p>
   ```

### D4. Point auth at your site
1. **Authentication → URL Configuration**:
   - **Site URL** = your live URL (e.g. `https://rally-xxxx.vercel.app`, later your domain).
   - **Redirect URLs** → add the same URL.

### D5. Copy the keys into Vercel
1. Supabase → **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key (NOT the `service_role` key)
2. Vercel → **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon public key
3. **Redeploy** again.

Sign-in now emails a real 6-digit code, and adding an event requires a verified account
**and** passes the AI legitimacy check.

---

## Part E — Attach a custom domain (do this whenever you've bought one)

`rally.com` / `rally.org` are very likely taken — check at Cloudflare, Namecheap, or
Porkbun, and consider `getrally.app`, `joinrally.org`, `rally.community`, etc.

1. Buy the domain at the registrar.
2. Vercel → project → **Settings → Domains → Add** → type your domain → **Add**.
3. Vercel shows the exact DNS records. At your registrar's DNS settings, add them —
   typically an **A** record `@ → 76.76.21.21` and a **CNAME** `www → cname.vercel-dns.com`.
4. Wait for it to verify (minutes–hours). HTTPS is automatic.
5. Update Supabase **Site URL / Redirect URLs** (Part D4) to the new domain and redeploy.

---

## Part F — Test it's all working

On your live URL:
- **Email verification:** Profile → Sign in → enter your email → check inbox for the
  6-digit code → enter it → signed in.
- **AI legitimacy check:** Submit → fill a test event → you'll see "Checking the web…",
  then it's either added (verified) or you're asked to confirm an unverified one.
- The new pin shows on the map and list.

---

## Environment variables — quick reference

```
ANTHROPIC_API_KEY        # Vercel (server-side) — AI summary + legitimacy check
VITE_SUPABASE_URL        # Vercel — email verification + saved events
VITE_SUPABASE_ANON_KEY   # Vercel — email verification + saved events
```

Never prefix the Anthropic key with `VITE_` — that would expose it in the browser. It's
only read server-side by `/api/ai`.

## Common snags

- **App deployed but features off:** you forgot to **Redeploy** after adding env vars.
- **No email code arrives:** check spam; confirm Email provider enabled and `{{ .Token }}`
  is in the template (D3); free Supabase has an email rate limit — wait a minute.
- **Sign-in link bounces:** Site URL / Redirect URL (D4) must exactly match your live URL.
- **Build fails on Vercel:** ensure you published the whole `rally` folder and that
  `package.json` is at its top level.
