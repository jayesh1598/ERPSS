#!/bin/bash

# Test JWT Fix - Verify headers are working correctly

PROJECT_ID="dhahhnqdwsncjieqydjh"
API_URL="https://${PROJECT_ID}.supabase.co/functions/v1/make-server-8eebe9eb"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYDhVYz1c"

echo "============================================"
echo "🧪 Testing JWT Error Fix"
echo "============================================"
echo ""

# Test 1: Health Check with Both Headers
echo "1️⃣  Testing Health Check with BOTH headers (apikey + Authorization)..."
HEALTH_RESPONSE=$(curl -s "${API_URL}/health" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

echo "Response: $HEALTH_RESPONSE"

if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
    echo "✅ Health check PASSED with correct headers!"
else
    echo "❌ Health check FAILED!"
    echo "This means:"
    echo "  - Edge Function might not be deployed, OR"
    echo "  - Supabase project might be paused, OR"
    echo "  - Network/connectivity issue"
    exit 1
fi
echo ""

# Test 2: Health Check WITHOUT Authorization header (should still work for public endpoint)
echo "2️⃣  Testing Health Check with only apikey (no Authorization)..."
HEALTH_NO_AUTH=$(curl -s "${API_URL}/health" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}")

echo "Response: $HEALTH_NO_AUTH"

if [[ $HEALTH_NO_AUTH == *"ok"* ]]; then
    echo "✅ Health check works with just apikey too!"
else
    echo "⚠️  Health check requires Authorization header even for public endpoints"
    echo "   (This is expected with our current implementation)"
fi
echo ""

# Test 3: Protected Endpoint WITHOUT Auth (should fail with proper error)
echo "3️⃣  Testing Protected Endpoint (/dashboard/stats) without user JWT..."
STATS_NO_JWT=$(curl -s "${API_URL}/dashboard/stats" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

echo "Response: $STATS_NO_JWT"

if [[ $STATS_NO_JWT == *"Unauthorized"* ]] || [[ $STATS_NO_JWT == *"401"* ]]; then
    echo "✅ Protected endpoint correctly rejects anon key (expected behavior)"
elif [[ $STATS_NO_JWT == *"Invalid JWT"* ]]; then
    echo "❌ Still getting 'Invalid JWT' from Supabase gateway!"
    echo "   This means verify_jwt is still enabled."
    echo "   Solution: Redeploy Edge Function with supabase.toml"
else
    echo "⚠️  Unexpected response: $STATS_NO_JWT"
fi
echo ""

# Test 4: Sign Up New User
echo "4️⃣  Testing Sign Up with correct headers..."
TEST_EMAIL="test_jwt_fix_$(date +%s)@example.com"
TEST_PASSWORD="TestJWT123!"

SIGNUP_RESPONSE=$(curl -s -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"name\":\"JWT Test User\"}")

echo "Response: $SIGNUP_RESPONSE"

if [[ $SIGNUP_RESPONSE == *"success"* ]]; then
    echo "✅ Sign up PASSED!"
    echo "   Created test account: ${TEST_EMAIL}"
elif [[ $SIGNUP_RESPONSE == *"Invalid JWT"* ]]; then
    echo "❌ Still getting 'Invalid JWT' error on signup!"
    echo "   The fix might not be deployed to your Edge Function yet."
    echo "   OR your browser might be using cached old code."
else
    echo "⚠️  Signup had an issue: $SIGNUP_RESPONSE"
fi
echo ""

# Test 5: Sign In with New User
echo "5️⃣  Testing Sign In..."
SIGNIN_RESPONSE=$(curl -s -X POST "https://${PROJECT_ID}.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

# Extract access token
ACCESS_TOKEN=$(echo $SIGNIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "⚠️  Could not get access token from sign in"
    echo "   Response: $SIGNIN_RESPONSE"
else
    echo "✅ Sign in successful!"
    echo "   Access token: ${ACCESS_TOKEN:0:30}..."
    echo ""
    
    # Test 6: Access Protected Endpoint with User JWT
    echo "6️⃣  Testing Protected Endpoint with valid user JWT..."
    STATS_WITH_JWT=$(curl -s "${API_URL}/dashboard/stats" \
      -H "Content-Type: application/json" \
      -H "apikey: ${ANON_KEY}" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    echo "Response: $STATS_WITH_JWT"
    
    if [[ $STATS_WITH_JWT == *"purchase_requisitions"* ]] || [[ $STATS_WITH_JWT == *"stats"* ]]; then
        echo "✅ Dashboard access SUCCESSFUL with user JWT!"
        echo ""
        echo "🎉 ALL TESTS PASSED! JWT fix is working correctly!"
    elif [[ $STATS_WITH_JWT == *"Invalid JWT"* ]]; then
        echo "❌ Still getting 'Invalid JWT' even with valid user token!"
        echo "   This is the Supabase gateway rejecting before reaching your code."
        echo ""
        echo "🔧 ACTION REQUIRED:"
        echo "   1. Make sure supabase.toml is in your project root"
        echo "   2. Redeploy: supabase functions deploy make-server-8eebe9eb"
        echo "   3. Verify: supabase functions list"
    else
        echo "⚠️  Unexpected response: $STATS_WITH_JWT"
    fi
fi

echo ""
echo "============================================"
echo "📋 Summary"
echo "============================================"
echo ""
echo "Test Account Created:"
echo "  Email: ${TEST_EMAIL}"
echo "  Password: ${TEST_PASSWORD}"
echo ""
echo "Next Steps for Browser Testing:"
echo "  1. Hard refresh your browser (Ctrl+Shift+R)"
echo "  2. Clear browser cache (F12 → Application → Clear site data)"
echo "  3. Try logging in with your existing account"
echo "  4. Check browser console for success messages"
echo ""
