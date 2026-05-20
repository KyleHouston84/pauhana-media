#!/bin/bash
# Pau Hana Media - Deployment Script
# Usage: ./deploy.sh [pi-hostname-or-ip]

set -e  # Exit on error

# Configuration
PI_HOST="${1:-pauhana-pi.local}"  # Default to pauhana-pi.local
PI_USER="kyle"
REMOTE_DIR="/home/kyle/pauhana-media"
SERVICE_NAME="pauhana.service"

# SSH connection multiplexing to avoid multiple password prompts
SSH_CONTROL_PATH="/tmp/ssh-pauhana-deploy-%r@%h:%p"
SSH_OPTS="-o ControlMaster=auto -o ControlPath=${SSH_CONTROL_PATH} -o ControlPersist=300"

# Cleanup function to close SSH connection
cleanup() {
  ssh ${SSH_OPTS} -O exit ${PI_USER}@${PI_HOST} 2>/dev/null || true
}
trap cleanup EXIT

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🍹 Pau Hana Media - Deployment Script${NC}"
echo "================================================"
echo "Target: ${PI_USER}@${PI_HOST}"
echo ""

# Step 1: Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
if ! npm run test:run; then
    echo -e "${RED}❌ Tests failed! Fix them before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Tests passed${NC}"
echo ""

# Step 2: Build TypeScript locally
echo -e "${YELLOW}📦 Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 2: Check Pi connectivity
echo -e "${YELLOW}🔍 Checking Pi connectivity...${NC}"
if ! ssh ${SSH_OPTS} -o ConnectTimeout=5 ${PI_USER}@${PI_HOST} "echo 'Connected'" &>/dev/null; then
    echo -e "${RED}❌ Cannot connect to ${PI_HOST}${NC}"
    echo "Please check:"
    echo "  - Pi is powered on and connected to network"
    echo "  - Hostname/IP is correct: ${PI_HOST}"
    echo "  - SSH is enabled on the Pi"
    exit 1
fi
echo -e "${GREEN}✅ Connected to Pi${NC}"
echo ""

# Step 3: Sync files to Pi
echo -e "${YELLOW}📤 Syncing files to Pi...${NC}"
rsync -avz --delete \
    -e "ssh ${SSH_OPTS}" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude 'TYPESCRIPT_MIGRATION.md' \
    --exclude 'event-settings.json' \
    --exclude 'wled-devices.json' \
    --exclude 'effect-library.json' \
    ./ ${PI_USER}@${PI_HOST}:${REMOTE_DIR}/

echo -e "${GREEN}✅ Files synced${NC}"
echo ""

# Step 4: Install dependencies and restart service on Pi
echo -e "${YELLOW}🔧 Running remote deployment tasks...${NC}"
ssh ${SSH_OPTS} ${PI_USER}@${PI_HOST} "bash -s" << 'ENDSSH'
set -e
cd /home/kyle/pauhana-media

echo "📦 Installing dependencies..."
npm install --ignore-scripts --production

echo "🛑 Stopping service..."
sudo systemctl stop pauhana.service 2>/dev/null || echo "Service not running"

echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

echo "▶️  Starting service..."
sudo systemctl start pauhana.service

echo "✅ Checking service status..."
sleep 2
if sudo systemctl is-active --quiet pauhana.service; then
    echo "✅ Service is running"
    sudo systemctl status pauhana.service --no-pager -l | head -20
else
    echo "❌ Service failed to start"
    sudo journalctl -u pauhana.service -n 50 --no-pager
    exit 1
fi
ENDSSH

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Service status on Pi:"
ssh ${SSH_OPTS} ${PI_USER}@${PI_HOST} "sudo systemctl status pauhana.service --no-pager | head -5"
echo ""
echo "View logs: ssh ${SSH_OPTS} ${PI_USER}@${PI_HOST} 'sudo journalctl -u pauhana.service -f'"
