# FitStack Boilerplate — Setup & Deployment Guide

**From zero to a live working app with AI. Follow every step in order.**

---

## What You're Building

A production-ready business operations system with:
- **Login/Register** (Supabase Auth)
- **Dashboard** with real-time stats
- **Contacts Module** (full CRUD — create, read, update, delete)
- **AI Assistant** powered by Claude (ask questions about your data in plain language)
- **Settings** page with profile management
- **Dark UI** with responsive sidebar navigation

**Tech:** Next.js 14 + Supabase + Claude API + TypeScript + Tailwind CSS

---

## PHASE 1: SETUP (30 minutes)

### Step 1.1 — Install Node.js

You need Node.js version 18 or higher.

**Check if installed:**
```bash
node --version
```

**If not installed:** Download from https://nodejs.org (LTS version)

### Step 1.2 — Install Git

```bash
git --version
```

If not installed: https://git-scm.com/downloads

### Step 1.3 — Create Supabase Project

1. Go to https://supabase.com and sign up (free tier is fine)
2. Click **"New Project"**
3. Fill in:
   - **Name:** `fitstack-app`
   - **Database Password:** (save this — you'll need it)
   - **Region:** pick closest to you
4. Wait 2-3 minutes for the project to provision

### Step 1.4 — Get Your Supabase Keys

In your Supabase dashboard:

1. Go to **Settings → API** (left sidebar)
2. Copy these values (you'll need them in Step 1.7):
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → this is your `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Settings → Database**
   - Scroll to **Connection string → URI**
   - Copy it and replace `[YOUR-PASSWORD]` with the password from Step 1.3
   - This is your `DATABASE_URL`

### Step 1.5 — Run the Database Setup

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase-setup.sql` from this project
4. **Copy the ENTIRE contents** and paste into the SQL editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" — that's correct

**What this creates:**
- `profiles` table (user profiles)
- `contacts` table (your CRM data)
- `activities` table (activity timeline)
- `ai_conversations` table (AI query history)
- Row-Level Security policies (users can only see their own data)
- Auto-create profile trigger (when someone signs up, a profile is auto-created)
- Performance indexes

### Step 1.6 — Disable Email Confirmation (for development)

1. In Supabase, go to **Authentication → Providers**
2. Under **Email**, toggle OFF **"Confirm email"**
3. Click **Save**

This lets you register and immediately log in without checking your email. Turn it back ON for production.

### Step 1.7 — Get Your Claude API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to **API Keys** → **Create Key**
4. Copy the key — starts with `sk-ant-...`
5. This is your `ANTHROPIC_API_KEY`

### Step 1.8 — Set Up the Project

Open your terminal and run these commands one at a time:

```bash
# 1. Navigate to the fitstack-app folder
cd fitstack-app

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local
```

### Step 1.9 — Fill In Environment Variables

Open `.env.local` in any text editor and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
DATABASE_URL=postgresql://postgres:your-password@db.abcdefgh.supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace** all the placeholder values with YOUR actual keys from Steps 1.4 and 1.7.

---

## PHASE 2: LOCAL TESTING (5 minutes)

### Step 2.1 — Start the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x
- Local:    http://localhost:3000
```

### Step 2.2 — Test Registration

1. Open http://localhost:3000 in your browser
2. You'll be redirected to the **login page** (because you're not logged in — middleware is working)
3. Click **"Create one"** to go to the register page
4. Fill in:
   - **Full Name:** Your name
   - **Email:** Any email (doesn't need to be real for dev)
   - **Password:** At least 6 characters
5. Click **"Create Account"**
6. You should be redirected to the **Dashboard**

### Step 2.3 — Test the Dashboard

After logging in, you should see:
- **Left sidebar** with: Dashboard, Contacts, AI Assistant, Settings
- **Header** with your name and Sign Out button
- **Stats cards** showing 0 contacts (empty state)
- **Recent Contacts** section (empty)
- **AI Assistant** panel on the right

### Step 2.4 — Test Adding Contacts

1. Click **"Contacts"** in the sidebar
2. Click **"Add Contact"** (coral button, top right)
3. Fill in the form with test data:
   - Name: `Ahmed Khan`
   - Email: `ahmed@example.com`
   - Phone: `+92 300 1234567`
   - Company: `ABC Consulting`
   - Tags: `client, vip`
   - Notes: `Key decision maker, interested in FitStack`
4. Click **"Add Contact"**
5. The contact should appear in the list immediately
6. Add 3-5 more contacts so the AI has data to work with

### Step 2.5 — Test the AI Assistant

1. Go back to **Dashboard** or click **"AI Assistant"** in sidebar
2. In the AI panel, type: **"How many contacts do I have?"**
3. Press Send (or Enter)
4. Claude should respond with the count and details about your contacts
5. Try more queries:
   - "Show me contacts from ABC Consulting"
   - "Which contacts have the tag vip?"
   - "Give me a summary of my contact database"
   - "Draft a follow-up email for Ahmed Khan"

### Step 2.6 — Test Settings

1. Click **"Settings"** in sidebar
2. Change your name
3. Click **"Save Changes"**
4. Verify the name updates in the header

### Step 2.7 — Test Sign Out and Login

1. Click **"Sign Out"** in the header
2. You should be redirected to the login page
3. Log back in with your email and password
4. Your contacts and data should still be there

**If all 7 tests pass → your app is working. Move to Phase 3.**

---

## PHASE 3: DEPLOYMENT (20 minutes)

### Step 3.1 — Create a GitHub Repository

```bash
# 1. Initialize git (if not already)
git init

# 2. Add all files
git add .

# 3. Create first commit
git commit -m "FitStack boilerplate - initial build"
```

Now create a repo on GitHub:
1. Go to https://github.com/new
2. **Repository name:** `fitstack-app`
3. **Visibility:** Private (recommended)
4. **Do NOT** initialize with README (you already have one)
5. Click **"Create repository"**
6. Run the commands GitHub shows you:

```bash
git remote add origin https://github.com/YOUR-USERNAME/fitstack-app.git
git branch -M main
git push -u origin main
```

### Step 3.2 — Deploy to Vercel

1. Go to https://vercel.com and sign up with your GitHub account
2. Click **"Add New → Project"**
3. Select your `fitstack-app` repository
4. Vercel auto-detects Next.js — leave the defaults
5. **BEFORE clicking Deploy**, expand **"Environment Variables"**

### Step 3.3 — Add Environment Variables in Vercel

Add each variable one by one (same values as your `.env.local`):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `DATABASE_URL` | Your Supabase database connection string |
| `ANTHROPIC_API_KEY` | Your Claude API key |
| `NEXT_PUBLIC_APP_URL` | Leave blank for now (Vercel will assign a URL) |

### Step 3.4 — Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes for the build
3. Vercel will show you your live URL: `https://fitstack-app-xxxxx.vercel.app`

### Step 3.5 — Update the App URL

1. In Vercel, go to **Settings → Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to your new Vercel URL (e.g., `https://fitstack-app-xxxxx.vercel.app`)
3. Go to **Deployments → ••• (latest) → Redeploy**

### Step 3.6 — Update Supabase Redirect URLs

1. In Supabase, go to **Authentication → URL Configuration**
2. Add your Vercel URL to **Site URL**: `https://fitstack-app-xxxxx.vercel.app`
3. Add to **Redirect URLs**: `https://fitstack-app-xxxxx.vercel.app/**`
4. Click **Save**

### Step 3.7 — Test the Live App

1. Open your Vercel URL in a browser
2. Register a new account
3. Add a contact
4. Ask the AI a question
5. Check Settings page

**If everything works → your app is live.**

---

## PHASE 4: CUSTOM DOMAIN (Optional, 10 minutes)

### Step 4.1 — Add Domain in Vercel

1. In Vercel, go to **Settings → Domains**
2. Type your domain (e.g., `app.yourcompany.com`)
3. Click **"Add"**
4. Vercel will show you DNS records to add

### Step 4.2 — Update DNS

Go to your domain registrar (Namecheap, Cloudflare, etc.) and add:
- **CNAME record:** `app` → `cname.vercel-dns.com`
- Or **A record:** `@` → `76.76.21.21`

### Step 4.3 — Update Supabase

1. In Supabase → Authentication → URL Configuration
2. Update **Site URL** to your custom domain
3. Add custom domain to **Redirect URLs**

---

## TROUBLESHOOTING

### "Module not found" error
```bash
rm -rf node_modules .next
npm install
npm run dev
```

### "Invalid API key" error from Claude
- Check that `ANTHROPIC_API_KEY` in `.env.local` starts with `sk-ant-`
- Make sure there are no spaces or line breaks in the key
- Check that your Anthropic account has credits

### "Auth error" or can't log in
- Check Supabase dashboard → Authentication → Users — does the user exist?
- Make sure you ran the SQL setup script (Step 1.5)
- Check that "Confirm email" is toggled OFF in dev (Step 1.6)

### Page shows "Unauthorized" or redirects to login
- Make sure your Supabase URL and anon key are correct in `.env.local`
- Try clearing cookies and logging in again

### Build fails on Vercel
- Check the build logs in Vercel dashboard
- Most common: missing environment variable — add ALL 5 variables
- Make sure `DATABASE_URL` uses the right password

### AI doesn't respond / times out
- Check Anthropic console — do you have API credits?
- Claude Sonnet has a rate limit — wait 60 seconds and try again
- Check Vercel function logs for detailed error messages

---

## FILE STRUCTURE REFERENCE

```
fitstack-app/
├── .env.example              ← Copy to .env.local and fill in
├── supabase-setup.sql        ← Run in Supabase SQL Editor
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── drizzle.config.ts
├── public/
├── src/
│   ├── middleware.ts          ← Auth guard (redirects unauthenticated users)
│   ├── app/
│   │   ├── layout.tsx         ← Root layout (fonts, metadata)
│   │   ├── globals.css        ← Tailwind + custom styles
│   │   ├── (auth)/            ← Login/Register (no sidebar)
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/       ← Main app (with sidebar)
│   │   │   ├── layout.tsx     ← Sidebar + Header wrapper
│   │   │   ├── page.tsx       ← Dashboard home
│   │   │   ├── contacts/page.tsx
│   │   │   ├── ai/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── ai/query/route.ts     ← Claude API endpoint
│   │       └── contacts/route.ts     ← Contacts CRUD API
│   ├── components/
│   │   ├── layout/sidebar.tsx
│   │   ├── layout/header.tsx
│   │   ├── data/stat-card.tsx
│   │   └── ai/query-panel.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── supabase/client.ts     ← Browser Supabase client
│   │   ├── supabase/server.ts     ← Server Supabase client
│   │   └── ai/client.ts          ← Claude API wrapper
│   └── db/
│       ├── schema.ts              ← Drizzle table definitions
│       └── drizzle.ts             ← Database connection
```

---

## WHAT TO BUILD NEXT

Once this is running, you can extend it by:

1. **Add more modules** — Create new folders in `src/app/(dashboard)/` (e.g., `/projects`, `/invoices`)
2. **Add more database tables** — Add to `src/db/schema.ts` and create in Supabase SQL Editor
3. **Enhance AI context** — Update `buildDataContext` in `src/lib/ai/client.ts` to include data from new modules
4. **Add WhatsApp** — Create `src/lib/whatsapp/client.ts` with the WhatsApp Business API wrapper
5. **Add real-time** — Use Supabase's real-time subscriptions for live updates

---

Built by **Ideatech** | ideatech.org/fitstack
