# 🚀 Netlify + Render Quick Start

Deploy Forex Luna Signal in 10 minutes using Netlify (frontend) + Render (backend).

---

## **Step 1: Prepare Your Project** (2 min)

### On Your Computer:

```bash
# 1. Create a new folder
mkdir forex-luna-signal
cd forex-luna-signal

# 2. Download all files into this folder:
# - server.js
# - package.json
# - index-live.html
# - .env.example
# - .gitignore
# - render.yaml
# - netlify.toml

# 3. Install dependencies
npm install

# 4. Create .env file and add your MetaAPI token
cp .env.example .env
# Edit .env and add: METAAPI_TOKEN=your_token_from_agiliumtrade_ai
```

---

## **Step 2: Create Public Folder for Netlify** (1 min)

```bash
mkdir public
cp index-live.html public/index.html

# Create _redirects file
echo "/*  /index.html  200" > public/_redirects
```

---

## **Step 3: Push to GitHub** (2 min)

```bash
git init
git add .
git commit -m "Forex Luna Signal - Initial commit"
git branch -M main

# Go to https://github.com/new and create a new repo
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/forex-luna-signal.git
git push -u origin main
```

**Your GitHub repo is now ready!** ✅

---

## **Step 4: Deploy Backend on Render** (3 min)

### Go to https://render.com

1. **Sign up** (connect your GitHub)
2. Click **New +** → **Web Service**
3. **Select your repo:** `forex-luna-signal`
4. **Fill in:**
   - Name: `forex-luna-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free` (or $7/month for always-on)

5. **Click Environment** and add:
   - Key: `METAAPI_TOKEN`
   - Value: *Your token from agiliumtrade.ai*

6. **Click Deploy** and wait 2-3 minutes

**Your Render URL:** `https://forex-luna-backend.onrender.com` ✅

---

## **Step 5: Deploy Frontend on Netlify** (2 min)

### Go to https://netlify.com

**Option A: GitHub Integration (Recommended)**
1. Click **Add new site** → **Import an existing project**
2. Select your GitHub repo
3. **Build settings:**
   - Base directory: (leave blank)
   - Build command: (leave blank)
   - Publish directory: `public`
4. Click **Deploy**

**Option B: Drag & Drop (Fastest)**
1. Drag the `public` folder onto Netlify deploy area
2. Done! ✅

**Your Netlify URL:** `https://forex-luna-signal.netlify.app` (or your custom URL)

---

## **Step 6: Connect Backend & Frontend** (1 min)

In `index-live.html`, find this line (around line 569):

```javascript
const RENDER_BACKEND_URL = 'https://forex-luna-backend.onrender.com';
```

Update it with your actual Render URL, then:

```bash
git add index-live.html
git commit -m "Update Render backend URL"
git push
```

Netlify auto-redeploys! ✅

---

## **Step 7: Test It!** (1 min)

1. Open your Netlify URL
2. Click **Admin** tab
3. Click **Check Backend Health**
4. Should see ✅ **Backend is online**
5. Click **Test MetaAPI Connection**
6. Should see ✅ **MetaAPI connection successful**
7. Click **Connect Live Account** and paste your MetaAPI account ID

**You're live!** 🎉

---

## 📊 What You Have

```
Netlify (Frontend)
https://forex-luna-signal.netlify.app
├── Dashboard
├── Accounts
├── Trades
├── History
├── Journal
└── Admin
         ↓
    API calls to /api/*
         ↓
Render (Backend)
https://forex-luna-backend.onrender.com
├── /api/accounts
├── /api/accounts/:id/summary
├── /api/accounts/:id/positions
├── /api/accounts/:id/trades
└── MetaAPI Proxy
         ↓
    MetaAPI (Live Accounts)
    agiliumtrade.ai
```

---

## 🔧 Troubleshooting

### "Cannot connect to backend"
- Check Render URL is correct in `index-live.html`
- Make sure `METAAPI_TOKEN` is set in Render environment
- Render free tier might need 2-3 min to start

### "MetaAPI connection failed"
- Verify your token is valid at https://app.agiliumtrade.agiliumtrade.ai
- Token should be active/not expired
- Check your account is active on MetaAPI

### "Frontend not updating"
- Netlify auto-deploys in 30 seconds after you push to GitHub
- Check https://app.netlify.com for deployment logs

### Test MetaAPI Token Directly
```bash
curl -H "auth-token: YOUR_TOKEN" \
  https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current
```

---

## 💰 Cost

- **Netlify:** Free (unlimited static sites)
- **Render:** Free (sleeps after 15 min) or $7/month (always-on)
- **Total:** Free for testing, ~$7/month for live trading

---

## 🎯 What's Next

1. ✅ Connect your live MetaAPI account
2. ✅ Test trade execution from dashboard
3. ✅ Set up Trade Journal
4. ✅ Enable Auto-Trading mode
5. ✅ Monitor positions in real-time
6. ✅ Check Admin panel for system health

---

## 📞 Quick Reference

| What | Where | URL |
|------|-------|-----|
| Frontend | Netlify | `https://your-site.netlify.app` |
| Backend | Render | `https://your-backend.onrender.com` |
| API Health | Backend | `/api/health` |
| Dashboard | Frontend | `/` (home) |
| Admin Panel | Frontend | Click "Admin" tab |

---

**You're all set!** Deploy and start trading! 🚀
