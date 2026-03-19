# Speel Support Tracker

Mobile-first shift tracker for the Speel support team. Built with Next.js 15, Tailwind CSS, and MongoDB.

## Features

- **Today view** — see active shift, who's on, tickets handled, handover notes, issues at a glance
- **Week view** — 7-day grid showing all shifts with status and quick-add
- **Shift modal** — assign, edit, or delete shifts with full detail (times, tickets, notes, issues log)
- **Issues tracking** — log recurring problems per shift (feeds into product insights)
- **Mobile-first** — bottom sheet modals, responsive layout, safe-area aware
- **PWA** — installable on iPhone/Android via browser

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd speel-tracker
npm install
```

### 2. Set up MongoDB

1. Create a free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a database user with read/write access
3. Whitelist `0.0.0.0/0` (all IPs) in Network Access for flexibility, or your specific IP
4. Get your connection string

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/speel-tracker?retryWrites=true&w=majority
NEXTAUTH_SECRET=any-random-string-here
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy to Vercel (recommended — free)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com), import your repo
3. Add environment variables in Vercel dashboard (same as `.env.local`)
4. Deploy — done ✅

Your app will be live at `https://your-project.vercel.app`

---

## Using on mobile

### iPhone
1. Open the app URL in Safari
2. Tap the Share button → **Add to Home Screen**
3. The app opens full-screen like a native app

### Android
1. Open in Chrome
2. Tap the menu → **Add to Home screen**

---

## Team Members

To add/remove team members, edit this line in `components/Dashboard.tsx`:

```ts
const TEAM_MEMBERS = ['Folashade', 'Seun']
```

---

## Shift Times

Default shift times auto-fill in the modal:

| Shift     | Default |
|-----------|---------|
| Morning   | 6AM – 2PM |
| Afternoon | 2PM – 10PM |
| Night     | 10PM – 6AM |

Edit these in `components/ShiftModal.tsx` → `SHIFT_TIMES`.

---

## Slack Slash Command Setup

Once your app is deployed to Vercel, connect it to Slack in ~10 minutes:

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → From scratch
2. Name it `Shift Tracker`, pick your Speel workspace

### 2. Add a Slash Command

1. In the left sidebar → **Slash Commands** → **Create New Command**
2. Fill in:
   - Command: `/shift`
   - Request URL: `https://your-app.vercel.app/api/slack`
   - Short Description: `Check and update support shifts`
   - Usage Hint: `[today|assign|status|notes|issue|help]`
3. Save

### 3. Install to workspace

1. **OAuth & Permissions** → **Install to Workspace** → Allow
2. Copy the **Signing Secret** from **Basic Information** → **App Credentials**

### 4. Add env variables to Vercel

```
SLACK_SIGNING_SECRET=your-signing-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Redeploy → done ✅

### Commands

| Command | What it does |
|---------|-------------|
| `/shift today` | Shows all shifts for today with status, tickets, notes |
| `/shift assign morning Folashade` | Assigns morning shift to Folashade |
| `/shift status morning active 8` | Marks morning as active, 8 tickets handled |
| `/shift status morning completed 14` | Closes out a shift with final ticket count |
| `/shift notes morning Credit refund still open for Ada` | Adds handover note |
| `/shift issue morning Magic Edit failing for 3 users` | Logs a product issue |
| `/shift help` | Shows all commands |

Sodiq can run `/shift today` any time and get a live answer. You and Seun update directly from Slack — no app needed.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/shifts?week=YYYY-MM-DD` | Fetch 7-day window of shifts |
| GET | `/api/shifts?date=YYYY-MM-DD` | Fetch shifts for one day |
| POST | `/api/shifts` | Create/upsert a shift |
| PATCH | `/api/shifts/:id` | Update a shift |
| DELETE | `/api/shifts/:id` | Delete a shift |

---

## Folder Structure

```
speel-tracker/
├── app/
│   ├── api/shifts/         # REST API routes
│   ├── globals.css         # Tailwind + custom styles
│   ├── layout.tsx          # Root layout, fonts
│   └── page.tsx            # Entry point
├── components/
│   ├── Dashboard.tsx       # Main view, week/today tabs
│   ├── ShiftCard.tsx       # Compact week-view card
│   ├── ShiftModal.tsx      # Create/edit form (bottom sheet)
│   └── TodaySummary.tsx    # Today's detailed shift view
├── lib/
│   └── mongodb.ts          # DB connection with caching
├── models/
│   └── Shift.ts            # Mongoose schema
└── public/
    └── manifest.json       # PWA config
```
