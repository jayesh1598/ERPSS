#!/bin/bash

# 🚀 Edge Function Deployment Script
# This script deploys the JWT-fixed Edge Function to Supabase

set -e  # Exit on error

PROJECT_REF="dhahhnqdwsncjieqydjh"
FUNCTION_NAME="make-server-8eebe9eb"
BASE_URL="https://${PROJECT_REF}.supabase.co"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 ERP System - Edge Function Deployment                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Project ID: $PROJECT_REF"
echo "Function: $FUNCTION_NAME"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo ""
    echo "Please install it first:"
    echo ""
    echo "  macOS/Linux:"
    echo "    brew install supabase/tap/supabase"
    echo ""
    echo "  Windows:"
    echo "    scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    echo "    scoop install supabase"
    echo ""
    echo "  Or with npm:"
    echo "    npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "🔐 Checking authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase."
    echo ""
    echo "Please run: supabase login"
    echo ""
    exit 1
fi
echo "✅ Authenticated"
echo ""

# Deploy the function
echo "📦 Deploying Edge Function..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_REF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait a moment for deployment to propagate
echo "⏳ Waiting for deployment to propagate..."
sleep 3
echo ""

# Verify deployment
echo "🔍 Verifying deployment..."
echo ""

HEALTH_URL="${BASE_URL}/functions/v1/${FUNCTION_NAME}/health"
echo "Testing: $HEALTH_URL"
echo ""

RESPONSE=$(curl -s "$HEALTH_URL" 2>&1)

if [ $? -eq 0 ]; then
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Check if version is correct
    if echo "$RESPONSE" | grep -q "4.1-production-jwt-fixed"; then
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║  ✅ DEPLOYMENT SUCCESSFUL!                                ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Version: 4.1-production-jwt-fixed"
        echo "Health endpoint: ✅ Responding"
        echo ""
    else
        echo "⚠️  Edge Function deployed but version mismatch."
        echo "Expected: 4.1-production-jwt-fixed"
        echo ""
    fi
else
    echo "❌ Failed to reach health endpoint"
    echo ""
fi

# Check environment variables
echo "🔧 Checking environment variables..."
echo ""

SECRET_CHECK=$(supabase secrets list --project-ref $PROJECT_REF 2>&1)

if echo "$SECRET_CHECK" | grep -q "SUPABASE_SERVICE_ROLE_KEY"; then
    echo "✅ SUPABASE_SERVICE_ROLE_KEY: Set"
else
    echo "❌ SUPABASE_SERVICE_ROLE_KEY: Not set"
    echo ""
    echo "⚠️  WARNING: Service Role Key is required for JWT validation!"
    echo ""
    echo "To set it, run:"
    echo "  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key --project-ref $PROJECT_REF"
    echo ""
    echo "Get your key from:"
    echo "  https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
    echo ""
fi

if echo "$SECRET_CHECK" | grep -q "SUPABASE_URL"; then
    echo "✅ SUPABASE_URL: Set"
else
    echo "⚠️  SUPABASE_URL: Not set"
    echo ""
    echo "To set it, run:"
    echo "  supabase secrets set SUPABASE_URL=$BASE_URL --project-ref $PROJECT_REF"
    echo ""
fi

if echo "$SECRET_CHECK" | grep -q "SUPABASE_ANON_KEY"; then
    echo "✅ SUPABASE_ANON_KEY: Set"
else
    echo "⚠️  SUPABASE_ANON_KEY: Not set"
    echo ""
    echo "To set it, run:"
    echo "  supabase secrets set SUPABASE_ANON_KEY=your_key --project-ref $PROJECT_REF"
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Verify environment variables are set (see above)"
echo "2. Open your app and run the verification tests"
echo "3. Test login functionality"
echo "4. Test protected endpoints"
echo ""
echo "📖 For more help, see: /DEPLOY_EDGE_FUNCTION_NOW.md"
echo ""
