# Netlify + Render Deployment Guide

This guide covers deploying Forex Luna Signal across two platforms:
- **Backend:** Render (Node.js server)
- **Frontend:** Netlify (Static HTML dashboard)

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Push Code to GitHub

```bash
# Initialize git repo
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Add your GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/forex-luna-signal.git
git push -u origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up (connect GitHub)
3. Click **New +** → **Web Service**
4. Select your **forex-luna-signal** repository
5. Fill in settings:

| Field | Value |
|-------|-------|
| Name | `forex-luna-backend` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | `Free` (or Paid if you need better uptime) |

### Step 3: Add Environment Variables

Click **Environment** → Add Variables:

| Key | Value |
|-----|-------|
| `METAAPI_TOKEN` | Paste your MetaAPI token from https://app.agiliumtrade.agiliumtrade.ai/api-tokens |
| `NODE_ENV` | `production` |

### Step 4: Deploy

Click **Create Web Service** and wait for deployment (2-3 minutes).

Your backend URL will be something like:
```
https://forex-luna-backend.onrender.com
```

**Save this URL** - you'll need it for the frontend.

---

## 🎨 Part 2: Deploy Frontend to Netlify

### Step 1: Create Netlify Account
1. Go to https://netlify.com
2. Sign up (connect GitHub recommended)

### Step 2: Prepare Frontend Files

Create a `public` folder with:
```
public/
├── index.html          (your dashboard)
├── _redirects          (for routing)
└── netlify.toml        (config)
```

### Step 3: Create netlify.toml

Place this in your project root:

```toml
[build]
  command = "echo 'Frontend ready'"
  publish = "public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production]
  environment = { API_BASE = "https://forex-luna-backend.onrender.com/api" }

[context.deploy-preview]
  environment = { API_BASE = "https://forex-luna-backend.onrender.com/api" }
```

### Step 4: Create _redirects

Create `public/_redirects` file:

```
/*  /index.html  200
```

This handles React Router-style navigation.

### Step 5: Deploy to Netlify

**Option A: Connect GitHub**
1. Drag & drop `public` folder to Netlify
   OR
   Click **Add new site** → **Import an existing project** → Select GitHub repo

2. Build settings:
   - Base directory: (leave blank)
   - Build command: (leave blank)
   - Publish directory: `public`

3. Click **Deploy site**

**Option B: Manual Upload (Quickest)**
1. Go to https://app.netlify.com
2. Drag & drop the `public` folder with your HTML file
3. Done! Netlify auto-generates URL like `https://forex-luna-signal.netlify.app`

---

## 🔗 Connect Frontend to Backend

### Update Your Frontend HTML

In `index-live.html`, update this line:

```javascript
// CHANGE THIS:
const API_BASE = 'http://localhost:3000/api';

// TO THIS (use your Render URL):
const API_BASE = 'https://forex-luna-backend.onrender.com/api';
```

Then redeploy to Netlify.

---

## ✅ Verification

### Test Backend
```bash
# Check if backend is running
curl https://forex-luna-backend.onrender.com/api/health

# Should return:
# {"status":"online","metaapi_token":"✅ Configured","timestamp":"..."}
```

### Test Frontend → Backend Connection
1. Open your Netlify dashboard: `https://forex-luna-signal.netlify.app`
2. Click **Admin** tab
3. Click **Check Backend Health**
4. Should show ✅ **Backend is online**

---

## 🔐 Environment Variables by Platform

### Render Dashboard Setup

1. Go to your web service on Render
2. Click **Environment**
3. Add variables:

| Key | Value | Scope |
|-----|-------|-------|
| `METAAPI_TOKEN` | Your token | Build + Runtime |
| `NODE_ENV` | `production` | Build + Runtime |

**Note:** Render automatically handles `.env` files - no need to commit secrets.

### Netlify Environment Variables (Optional)

1. Site settings → **Build & deploy** → **Environment**
2. Add variables (for analytics/monitoring, not needed for basic setup)

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Computer                        │
│        (Open index-live.html or localhost)              │
└────────────┬──────────────────────────────────────────┘
             │
             │ HTTPS requests to /api/
             │
    ┌────────▼──────────────────────────┐
    │  Netlify (Frontend)                │
    │  https://forex-luna.netlify.app    │
    │  - Serves HTML/CSS/JS              │
    │  - Redirects /api/* to Render      │
    └────────┬──────────────────────────┘
             │
             │ /api/* requests
             │
    ┌────────▼──────────────────────────┐
    │  Render (Backend)                  │
    │  https://forex-luna-backend...     │
    │  - Express server                  │
    │  - MetaAPI proxy                   │
    │  - Token storage                   │
    └────────┬──────────────────────────┘
             │
             │ auth-token: YOUR_TOKEN
             │
    ┌────────▼──────────────────────────┐
    │  MetaAPI (MT5/MT4 Live Accounts)   │
    │  agiliumtrade.agiliumtrade.ai      │
    └────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend" on Netlify

**Problem:** Frontend can't reach Render backend

**Solutions:**
```javascript
// Check if API_BASE is correct in your HTML:
const API_BASE = 'https://forex-luna-backend.onrender.com/api';

// Not:
const API_BASE = 'http://localhost:3000/api';  // ❌ This won't work

// Verify Render URL is correct:
https://your-app-name.onrender.com/api/health
```

### Render Backend Still Starting Up

**Problem:** First deploy takes 2-3 minutes, shows 503 error

**Solution:** Just wait, then refresh. Free tier spins down after 15 min of inactivity.

To keep it awake:
1. Go to Render dashboard
2. Click your service
3. Click **Settings** → **Plan** → Upgrade to Paid ($7/month)
   OR use a free uptime monitor

### CORS Errors

**Problem:** Browser blocks requests to backend

**Solution:** Already configured in `server.js` with:
```javascript
app.use(cors());
```

If still issues:
1. Check Render backend is actually running
2. Check `API_BASE` URL is correct and includes `/api`
3. Check MetaAPI token is set in Render environment

---

## 📱 Custom Domain (Optional)

### Netlify Custom Domain

1. Buy domain (e.g., GoDaddy, Namecheap)
2. Netlify dashboard → **Domain settings**
3. Add custom domain
4. Update DNS records as Netlify suggests

### Render Custom Domain

1. Render dashboard → Web service → **Custom Domain**
2. Add your domain
3. Update DNS CNAME to Render's endpoint

---

## 🔄 Auto-Updates

### When You Push to GitHub:

**Backend (Render):**
- Automatically redeploys from `main` branch
- Takes 1-2 minutes
- Old URL still works during deployment

**Frontend (Netlify):**
- Auto-deploys if connected to GitHub
- Takes 30 seconds
- Old URL still works during deployment

**No downtime!** 🎉

---

## 💰 Cost Summary

| Platform | Plan | Cost | Notes |
|----------|------|------|-------|
| **Render** | Free | $0 | Spins down after 15 min inactivity (fine for testing) |
| **Render** | Paid | $7/month | Keeps server always-on |
| **Netlify** | Free | $0 | Perfect for static sites, unlimited bandwidth |
| **Total** | Free | $0 | Good for development/testing |
| **Total** | Paid | $7/month | Good for live trading (recommended) |

**Recommendation:** Start free, upgrade Render to paid ($7/month) when going live with real accounts.

---

## 🚀 Next Steps

1. ✅ Push code to GitHub
2. ✅ Deploy backend on Render (2 min)
3. ✅ Deploy frontend on Netlify (1 min)
4. ✅ Update `API_BASE` in HTML
5. ✅ Click "Connect Live Account"
6. ✅ Paste MetaAPI account ID
7. ✅ Start trading! 🎯

---

## 📞 Support

### Render Logs
```
Render Dashboard → Web Service → Logs
Shows real-time errors, MetaAPI connection status
```

### Browser Console
```
Open DevTools (F12) → Console tab
Check for 404, CORS, network errors
```

### Test MetaAPI Token
```bash
curl -H "auth-token: YOUR_TOKEN" \
  https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current
```

---

**Your Netlify + Render setup is ready!** 🚀
