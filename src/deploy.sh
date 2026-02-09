#!/bin/bash

# 🚀 Edge Function Deployment Script
# This script will guide you through deploying the Edge Function to Supabase

set -e  # Exit on error

echo "============================================"
echo "🚀 Supabase Edge Function Deployment"
echo "============================================"
echo ""

PROJECT_REF="dhahhnqdwsncjieqydjh"
FUNCTION_NAME="make-server-8eebe9eb"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if Supabase CLI is installed
echo "Step 1: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or on Mac:"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Supabase CLI installed${NC}"
fi
echo ""

# Step 2: Login check
echo "Step 2: Checking authentication..."
echo "Running: supabase projects list"
if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✅ Already logged in${NC}"
else
    echo -e "${YELLOW}⚠️  Not logged in${NC}"
    echo "Running: supabase login"
    supabase login
fi
echo ""

# Step 3: Link project
echo "Step 3: Linking to project..."
echo "Running: supabase link --project-ref $PROJECT_REF"
if supabase link --project-ref $PROJECT_REF; then
    echo -e "${GREEN}✅ Project linked${NC}"
else
    echo -e "${RED}❌ Failed to link project${NC}"
    echo "Make sure you have access to project: $PROJECT_REF"
    exit 1
fi
echo ""

# Step 4: Set environment variables
echo "Step 4: Setting environment variables..."
echo ""
echo -e "${YELLOW}You need to provide 2 values:${NC}"
echo "1. SUPABASE_SERVICE_ROLE_KEY"
echo "2. SUPABASE_DB_URL"
echo ""
echo -e "${BLUE}📖 Where to find them:${NC}"
echo "• Service Role Key: Dashboard > Settings > API > service_role (click Reveal)"
echo "• DB URL: Dashboard > Settings > Database > Connection string (URI format)"
echo ""

# Set SUPABASE_URL
echo "Setting SUPABASE_URL..."
supabase secrets set SUPABASE_URL=https://${PROJECT_REF}.supabase.co

# Set SUPABASE_ANON_KEY
echo "Setting SUPABASE_ANON_KEY..."
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c

# Get SERVICE_ROLE_KEY from user
echo ""
echo -e "${YELLOW}Enter your SUPABASE_SERVICE_ROLE_KEY:${NC}"
echo "(starts with eyJ...)"
read -r SERVICE_ROLE_KEY

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Service role key cannot be empty${NC}"
    exit 1
fi

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

# Get DB_URL from user
echo ""
echo -e "${YELLOW}Enter your SUPABASE_DB_URL:${NC}"
echo "(starts with postgresql://...)"
read -r DB_URL

if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Database URL cannot be empty${NC}"
    exit 1
fi

echo "Setting SUPABASE_DB_URL..."
supabase secrets set SUPABASE_DB_URL="$DB_URL"

echo ""
echo -e "${GREEN}✅ All environment variables set${NC}"
echo ""

# Step 5: Deploy
echo "Step 5: Deploying Edge Function..."
echo "Running: supabase functions deploy $FUNCTION_NAME"
echo ""

if supabase functions deploy $FUNCTION_NAME; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check the error messages above"
    exit 1
fi
echo ""

# Step 6: Test
echo "Step 6: Testing deployment..."
echo ""
echo "Testing health endpoint..."
HEALTH_URL="https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}/health"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c"

echo "Running: curl $HEALTH_URL"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "apikey: $ANON_KEY" "$HEALTH_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
echo "Response:"
echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    echo ""
    echo "============================================"
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "============================================"
    echo ""
    echo "Next steps:"
    echo "1. Refresh your application"
    echo "2. The 'Failed to fetch' error should be gone"
    echo "3. You can now sign up and use the ERP system"
    echo ""
else
    echo -e "${YELLOW}⚠️  Health check returned $HTTP_CODE${NC}"
    echo ""
    echo "View logs with:"
    echo "  supabase functions logs $FUNCTION_NAME"
    echo ""
fi

echo "Deployment URL:"
echo "  https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"
echo ""
echo "Dashboard:"
echo "  https://supabase.com/dashboard/project/${PROJECT_REF}/functions/${FUNCTION_NAME}"
echo ""
