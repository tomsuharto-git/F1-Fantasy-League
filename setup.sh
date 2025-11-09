#!/bin/bash

# F1 Fantasy League - Quick Setup Script

echo "🏎️  F1 Fantasy League - Quick Setup"
echo "===================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local with your Supabase credentials!"
    echo "   1. Go to https://supabase.com"
    echo "   2. Create a project"
    echo "   3. Copy URL and anon key to .env.local"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

echo "🎯 Next Steps:"
echo ""
echo "1. Edit .env.local with your Supabase credentials"
echo "2. Run database migration in Supabase SQL Editor (supabase/schema.sql)"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "📚 See README.md for full setup guide"
echo ""
