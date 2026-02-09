#!/bin/bash

echo "============================================"
echo "🚀 Deploying ERP Edge Function to Supabase"
echo "============================================"
echo ""

PROJECT_REF="dhahhnqdwsncjieqydjh"
FUNCTION_NAME="make-server-8eebe9eb"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYDhVYz1c"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "📥 Install it with:"
    echo "   npm install -g supabase"
    echo ""
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check if logged in
echo "🔐 Checking authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase!"
    echo ""
    echo "Please run: supabase login"
    echo ""
    exit 1
fi

echo "✅ Authenticated with Supabase"
echo ""

# Check if project is linked
echo "🔗 Checking project link..."
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project not linked yet"
    echo ""
    echo "Linking project $PROJECT_REF..."
    supabase link --project-ref $PROJECT_REF
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to link project!"
        echo ""
        echo "Please run manually: supabase link --project-ref $PROJECT_REF"
        exit 1
    fi
    echo "✅ Project linked successfully"
else
    echo "✅ Project already linked"
fi
echo ""

# Deploy Edge Function
echo "📦 Deploying Edge Function: $FUNCTION_NAME..."
echo ""

supabase functions deploy $FUNCTION_NAME --no-verify-jwt

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Common issues:"
    echo "  1. Check your internet connection"
    echo "  2. Verify project is active (not paused)"
    echo "  3. Check for syntax errors in code"
    echo ""
    echo "Run this to see detailed logs:"
    echo "  supabase functions logs $FUNCTION_NAME --tail"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

# List deployed functions
echo "📋 Deployed functions:"
supabase functions list
echo ""

# Wait a moment for function to be ready
echo "⏳ Waiting for function to be ready..."
sleep 3
echo ""

# Test health check
echo "🧪 Testing health check..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}/health \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" 2>&1)

HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

echo "Response: $RESPONSE_BODY"
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ] && [[ $RESPONSE_BODY == *"ok"* ]]; then
    echo "✅ Health check PASSED!"
    echo ""
    echo "============================================"
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "============================================"
    echo ""
    echo "✅ Edge Function is deployed and running"
    echo "✅ Health check is responding"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Hard refresh your browser (Ctrl+Shift+R)"
    echo "  2. Clear browser cache if needed"
    echo "  3. You should see a green 'Server is healthy' banner"
    echo "  4. Try logging in!"
    echo ""
    echo "📊 Monitor logs with:"
    echo "  supabase functions logs $FUNCTION_NAME --tail"
    echo ""
    echo "🌐 Your app URL:"
    echo "  https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"
    echo ""
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Function not found (404)"
    echo ""
    echo "This means the deployment didn't register properly."
    echo "Try deploying again: supabase functions deploy $FUNCTION_NAME --no-verify-jwt"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ Function is deployed but crashed (500)"
    echo ""
    echo "Check logs for errors:"
    echo "  supabase functions logs $FUNCTION_NAME --tail"
    echo ""
    echo "Common causes:"
    echo "  - Missing environment variables"
    echo "  - Syntax error in code"
    echo "  - Import error"
elif [[ $RESPONSE_BODY == *"Failed to fetch"* ]] || [ -z "$HTTP_CODE" ]; then
    echo "❌ Cannot reach function (Network error)"
    echo ""
    echo "Possible causes:"
    echo "  1. Supabase project is paused (free tier)"
    echo "     → Go to dashboard and restore project"
    echo "  2. Network/DNS issue"
    echo "     → Check internet connection"
    echo "  3. Project URL is wrong"
    echo "     → Verify project ref: $PROJECT_REF"
    echo ""
    echo "🔗 Check project status:"
    echo "  https://supabase.com/dashboard/project/$PROJECT_REF"
else
    echo "⚠️  Unexpected response"
    echo ""
    echo "The function is deployed but returning an unexpected response."
    echo "Check logs: supabase functions logs $FUNCTION_NAME --tail"
fi

echo ""
echo "============================================"
