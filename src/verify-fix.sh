#!/bin/bash

# JWT Fix Verification Script
# This script checks if the JWT authentication fix has been deployed successfully

PROJECT_ID="dhahhnqdwsncjieqydjh"
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1/make-server-8eebe9eb"

echo "🔍 JWT Fix Verification Script"
echo "================================"
echo ""

# Test 1: Health Check
echo "Test 1: Checking Edge Function Health..."
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/health")
echo "Response: $HEALTH_RESPONSE"
echo ""

# Extract version
VERSION=$(echo $HEALTH_RESPONSE | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
AUTH_METHOD=$(echo $HEALTH_RESPONSE | grep -o '"authMethod":"[^"]*"' | cut -d'"' -f4)
HAS_SERVICE_KEY=$(echo $HEALTH_RESPONSE | grep -o '"hasServiceKey":[^,}]*' | cut -d':' -f2)

echo "Version: $VERSION"
echo "Auth Method: $AUTH_METHOD"
echo "Has Service Key: $HAS_SERVICE_KEY"
echo ""

# Verify the fix
if [[ "$VERSION" == "4.1-production-jwt-fixed" ]]; then
    echo "✅ PASS: Correct version deployed"
else
    echo "❌ FAIL: Wrong version. Expected '4.1-production-jwt-fixed', got '$VERSION'"
    echo "   Action: Please redeploy the Edge Function"
fi

if [[ "$AUTH_METHOD" == *"supabaseAdmin"* ]]; then
    echo "✅ PASS: Using Service Role Key for auth"
else
    echo "❌ FAIL: Not using Service Role Key. Auth method: $AUTH_METHOD"
    echo "   Action: Code may not be deployed correctly"
fi

if [[ "$HAS_SERVICE_KEY" == "true" ]]; then
    echo "✅ PASS: Service Role Key environment variable is set"
else
    echo "❌ FAIL: Service Role Key is missing"
    echo "   Action: Set SUPABASE_SERVICE_ROLE_KEY environment variable"
    echo "   Command: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key> --project-ref $PROJECT_ID"
fi

echo ""
echo "================================"
echo "Verification Complete"
echo ""
echo "Next Steps:"
echo "1. If all tests pass ✅: Try logging into your application"
echo "2. If any test fails ❌: Follow the deployment instructions in DEPLOY_INSTRUCTIONS.md"
echo "3. After deployment: Clear browser cache and log in again"
