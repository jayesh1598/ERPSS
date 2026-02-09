#!/bin/bash

# Test Authentication Flow
# This script will test signup → login → dashboard access

PROJECT_ID="dhahhnqdwsncjieqydjh"
API_URL="https://${PROJECT_ID}.supabase.co/functions/v1/make-server-8eebe9eb"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYDhVYz1c"

echo "============================================"
echo "🧪 Testing ERP Authentication Flow"
echo "============================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "${API_URL}/health" -H "apikey: ${ANON_KEY}")
echo "Response: $HEALTH_RESPONSE"

if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    exit 1
fi
echo ""

# Test 2: Sign Up
echo "2️⃣  Testing Sign Up..."
SIGNUP_EMAIL="test_$(date +%s)@example.com"
SIGNUP_PASSWORD="Test123456!"

SIGNUP_RESPONSE=$(curl -s -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d "{\"email\":\"${SIGNUP_EMAIL}\",\"password\":\"${SIGNUP_PASSWORD}\",\"name\":\"Test User\"}")

echo "Response: $SIGNUP_RESPONSE"

if [[ $SIGNUP_RESPONSE == *"success"* ]]; then
    echo "✅ Sign up successful!"
else
    echo "❌ Sign up failed!"
    echo "Error details: $SIGNUP_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Sign In (using Supabase Auth API)
echo "3️⃣  Testing Sign In..."
SIGNIN_RESPONSE=$(curl -s -X POST "https://${PROJECT_ID}.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d "{\"email\":\"${SIGNUP_EMAIL}\",\"password\":\"${SIGNUP_PASSWORD}\"}")

echo "Response: $SIGNIN_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo $SIGNIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Sign in failed - no access token received!"
    echo "Full response: $SIGNIN_RESPONSE"
    exit 1
else
    echo "✅ Sign in successful!"
    echo "Access token: ${ACCESS_TOKEN:0:20}..."
fi
echo ""

# Test 4: Access Dashboard Stats (with auth)
echo "4️⃣  Testing Dashboard Access..."
DASHBOARD_RESPONSE=$(curl -s "${API_URL}/dashboard/stats" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${ANON_KEY}")

echo "Response: $DASHBOARD_RESPONSE"

if [[ $DASHBOARD_RESPONSE == *"purchase_requisitions"* ]]; then
    echo "✅ Dashboard access successful!"
else
    echo "❌ Dashboard access failed!"
    echo "Error: $DASHBOARD_RESPONSE"
fi
echo ""

echo "============================================"
echo "✅ All Tests Complete!"
echo "============================================"
echo ""
echo "📝 Test Account Created:"
echo "   Email: ${SIGNUP_EMAIL}"
echo "   Password: ${SIGNUP_PASSWORD}"
echo ""
echo "🔑 Access Token (first 50 chars):"
echo "   ${ACCESS_TOKEN:0:50}..."
echo ""
echo "🎯 You can now use these credentials to log in!"
