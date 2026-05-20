@echo off
REM Forex Luna Signal - Netlify + Render Setup Script (Windows)

echo.
echo ╔════════════════════════════════════════╗
echo ║  Forex Luna Signal Setup Assistant     ║
echo ║  Netlify + Render Deployment (Windows) ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo ✅ Found package.json
echo.

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Step 2: Create .env file
if not exist ".env" (
    echo 🔑 Creating .env file...
    copy .env.example .env
    echo ✅ .env file created
    echo.
    echo ⚠️  IMPORTANT: Edit .env and add your MetaAPI token:
    echo    1. Open .env in Notepad
    echo    2. Find: METAAPI_TOKEN=your_metaapi_token_here
    echo    3. Replace with your actual token
    echo.
) else (
    echo ✅ .env file already exists
    echo.
)

REM Step 3: Create public directory for Netlify
if not exist "public" (
    echo 📁 Creating public directory for Netlify...
    mkdir public
    copy index-live.html public\index.html
    
    REM Create _redirects file
    (
        echo /* /index.html 200
    ) > public\_redirects
    
    echo ✅ Public directory created
) else (
    echo ✅ Public directory already exists
)
echo.

REM Step 4: Initialize git (if not already)
if not exist ".git" (
    echo 🔗 Initializing Git repository...
    call git init
    call git add .
    call git commit -m "Initial commit - Forex Luna Signal"
    echo ✅ Git repository initialized
    echo.
    echo 📌 Next: Push to GitHub
    echo    git remote add origin https://github.com/YOUR_USERNAME/forex-luna-signal.git
    echo    git branch -M main
    echo    git push -u origin main
) else (
    echo ✅ Git repository already exists
)
echo.

REM Step 5: Display next steps
echo ╔════════════════════════════════════════╗
echo ║         Next Steps                     ║
echo ╚════════════════════════════════════════╝
echo.
echo 1️⃣  Add your MetaAPI token to .env:
echo    - Open .env file
echo    - Add: METAAPI_TOKEN=your_token_here
echo.
echo 2️⃣  Push to GitHub:
echo    git remote add origin https://github.com/YOUR_USERNAME/forex-luna-signal.git
echo    git push -u origin main
echo.
echo 3️⃣  Deploy backend on Render:
echo    - Go to https://render.com
echo    - Click 'New +' then 'Web Service'
echo    - Connect your GitHub repo
echo    - Select render.yaml as config
echo    - Add METAAPI_TOKEN environment variable
echo    - Click Deploy
echo.
echo 4️⃣  Deploy frontend on Netlify:
echo    - Go to https://netlify.com
echo    - Drag ^& drop 'public' folder
echo    - OR connect your GitHub repo
echo.
echo 5️⃣  Copy your Render backend URL and update in index-live.html:
echo    - Line 570: const RENDER_BACKEND_URL = 'YOUR_RENDER_URL'
echo    - Example: https://forex-luna-backend.onrender.com
echo.
echo 6️⃣  Test the connection:
echo    - Open your Netlify site in browser
echo    - Click Admin tab
echo    - Click 'Check Backend Health'
echo    - Should show ✅ Backend is online
echo.
echo ✨ Setup complete! Happy trading! 🚀
echo.
pause
