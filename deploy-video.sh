#!/bin/bash
# Pau Hana Media - Video Service Deployment
# Sets up looping video playback on the Raspberry Pi

set -e

PI_HOST="${1:-pauhana-pi.local}"
PI_USER="kyle"
REMOTE_DIR="/home/kyle/pauhana-media"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🎬 Pau Hana Video Service Deployment${NC}"
echo "================================================"
echo "Target: ${PI_USER}@${PI_HOST}"
echo ""

# Step 1: Check if VLC is installed on Pi
echo -e "${YELLOW}📦 Checking for VLC...${NC}"
if ssh ${PI_USER}@${PI_HOST} "which vlc" &>/dev/null; then
    echo -e "${GREEN}✅ VLC already installed${NC}"
else
    echo -e "${YELLOW}Installing VLC...${NC}"
    ssh ${PI_USER}@${PI_HOST} "sudo apt update && sudo apt install -y vlc"
    echo -e "${GREEN}✅ VLC installed${NC}"
fi
echo ""

# Step 2: Create video directory on Pi if it doesn't exist
echo -e "${YELLOW}📁 Creating video directory...${NC}"
ssh ${PI_USER}@${PI_HOST} "mkdir -p ${REMOTE_DIR}/video"
echo -e "${GREEN}✅ Directory ready${NC}"
echo ""

# Step 3: Sync video file to Pi
echo -e "${YELLOW}🎥 Syncing video file (this may take a while - 1.6GB)...${NC}"
rsync -avz --progress \
    ./video/PauHanaVideoLoop.mp4 \
    ${PI_USER}@${PI_HOST}:${REMOTE_DIR}/video/
echo -e "${GREEN}✅ Video synced${NC}"
echo ""

# Step 4: Install systemd service
echo -e "${YELLOW}⚙️  Installing systemd service...${NC}"
scp pauhana-video.service ${PI_USER}@${PI_HOST}:/tmp/
ssh ${PI_USER}@${PI_HOST} "sudo mv /tmp/pauhana-video.service /etc/systemd/system/"
ssh ${PI_USER}@${PI_HOST} "sudo systemctl daemon-reload"
echo -e "${GREEN}✅ Service installed${NC}"
echo ""

# Step 5: Enable and start service
echo -e "${YELLOW}▶️  Starting video service...${NC}"
ssh ${PI_USER}@${PI_HOST} "sudo systemctl enable pauhana-video.service"
ssh ${PI_USER}@${PI_HOST} "sudo systemctl restart pauhana-video.service"
sleep 2
ssh ${PI_USER}@${PI_HOST} "sudo systemctl status pauhana-video.service --no-pager | head -20"
echo ""

echo -e "${GREEN}🎉 Video service deployed!${NC}"
echo ""
echo "Commands:"
echo "  Start:   ssh ${PI_USER}@${PI_HOST} 'sudo systemctl start pauhana-video'"
echo "  Stop:    ssh ${PI_USER}@${PI_HOST} 'sudo systemctl stop pauhana-video'"
echo "  Status:  ssh ${PI_USER}@${PI_HOST} 'sudo systemctl status pauhana-video'"
echo "  Logs:    ssh ${PI_USER}@${PI_HOST} 'sudo journalctl -u pauhana-video -f'"
