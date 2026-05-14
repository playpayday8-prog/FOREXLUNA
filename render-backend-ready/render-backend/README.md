# Forex Luna Signal Backend

Deploy this to Render.com for real MetaAPI trading.

## Quick Deploy to Render:

### Option 1: Deploy from GitHub (Recommended)
1. Push this folder to GitHub
2. Go to render.com
3. New Web Service → Connect GitHub
4. Select this repository
5. Deploy!

### Option 2: Manual Deploy
1. Go to render.com
2. New Web Service
3. Upload this folder
4. Deploy!

## Environment Variables (Set in Render Dashboard):

```
WEBHOOK_SECRET=your-secret-key-here
```

## Your Frontend URL:
https://lunasignals.netlify.app

## API Endpoints:

- GET /health
- POST /api/trade
- POST /api/webhook

## After Deployment:

Update your frontend (lunasignals.netlify.app) to use:
```
https://your-app-name.onrender.com/api/trade
```