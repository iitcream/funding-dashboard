# India Funding Deals Dashboard

A warm-toned startup funding dashboard with live company research powered by **Gemini 2.0 Flash + Google Search**, deployed on Vercel.

## Project Structure

```
funding-dashboard/
├── api/
│   └── company-info.js   ← Vercel serverless function (holds Gemini key securely)
├── public/
│   └── index.html        ← The dashboard
├── vercel.json           ← Routing config
└── README.md
```

## Deploy to Vercel (Step-by-Step)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial dashboard"
git remote add origin https://github.com/YOUR_USERNAME/funding-dashboard.git
git push -u origin main
```

### 2. Import on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Leave all build settings as default — Vercel auto-detects the `api/` folder

### 3. Add the Gemini API Key (the important part)
1. In Vercel → your project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - **Environment:** Production (+ Preview if you want)
3. Click **Save**
4. Go to **Deployments** → **Redeploy** (env vars only take effect after redeploy)

### 4. Done!
Your dashboard is live. The **Company Info** button calls `/api/company-info` which securely uses the key from Vercel's environment — it is never exposed in the browser.

## Get a Free Gemini API Key
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with Google → **Create API Key**
3. Copy and paste into Vercel env vars as above

## How It Works
- `public/index.html` — static dashboard, calls `/api/company-info` via POST
- `api/company-info.js` — Edge Function that reads `GEMINI_API_KEY` from env, calls Gemini 2.0 Flash with Google Search grounding, returns structured JSON
- Key is **never** sent to or visible in the browser
