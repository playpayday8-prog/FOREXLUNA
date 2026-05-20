#!/bin/bash

# Forex Luna Signal - Netlify + Render Setup Script
# This script automates the initial setup process

echo "╔════════════════════════════════════════╗"
echo "║  Forex Luna Signal Setup Assistant     ║"
echo "║  Netlify + Render Deployment           ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "✅ Found package.json"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Step 2: Create .env file
if [ ! -f ".env" ]; then
    echo "🔑 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your MetaAPI token:"
    echo "   nano .env"
    echo "   (or open .env in your editor)"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Step 3: Create public directory for Netlify
if [ ! -d "public" ]; then
    echo "📁 Creating public directory for Netlify..."
    mkdir public
    cp index-live.html public/index.html
    
    # Create _redirects file
    cat > public/_redirects << EOF
/*  /index.html  200
EOF
    
    echo "✅ Public directory created"
else
    echo "✅ Public directory already exists"
fi
echo ""

# Step 4: Initialize git (if not already)
if [ ! -d ".git" ]; then
    echo "🔗 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Forex Luna Signal"
    echo "✅ Git repository initialized"
    echo ""
    echo "📌 Next: Push to GitHub"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/forex-luna-signal.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
else
    echo "✅ Git repository already exists"
fi
echo ""

# Step 5: Display next steps
echo "╔════════════════════════════════════════╗"
echo "║         Next Steps                     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "1️⃣  Add your MetaAPI token to .env:"
echo "   METAAPI_TOKEN=your_token_here"
echo ""
echo "2️⃣  Push to GitHub (if not done):"
echo "   git remote add origin https://github.com/YOUR_USERNAME/forex-luna-signal.git"
echo "   git push -u origin main"
echo ""
echo "3️⃣  Deploy backend on Render:"
echo "   - Go to https://render.com"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect your GitHub repo"
echo "   - Use render.yaml configuration"
echo "   - Add METAAPI_TOKEN environment variable"
echo "   - Deploy!"
echo ""
echo "4️⃣  Deploy frontend on Netlify:"
echo "   - Go to https://netlify.com"
echo "   - Drag & drop 'public' folder OR connect GitHub"
echo "   - Done!"
echo ""
echo "5️⃣  Update Render URL in index-live.html:"
echo "   Line 569: const RENDER_BACKEND_URL = 'YOUR_RENDER_URL_HERE'"
echo ""
echo "6️⃣  Test connection:"
echo "   - Open your Netlify site"
echo "   - Go to Admin tab"
echo "   - Click 'Check Backend Health'"
echo ""
echo "✨ Setup complete! Happy trading! 🚀"
echo ""
