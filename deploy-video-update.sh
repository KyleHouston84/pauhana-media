#!/bin/bash
# Pau Hana Media - Video Update Deployment
# Updates the video file on the Raspberry Pi without reinstalling mpv or reconfiguring service
# Usage: ./deploy-video-update.sh [pi-hostname-or-ip]

set -e

PI_HOST="${1:-pauhana-pi.local}"
PI_USER="kyle"
REMOTE_DIR="/home/kyle/pauhana-media"
VIDEO_FILE="./video/PauHanaVideoLoop.mp4"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🎬 Pau Hana Video Update Deployment${NC}"
echo "================================================"
echo "Target: ${PI_USER}@${PI_HOST}"
echo ""

# Check if video file exists locally
if [ ! -f "$VIDEO_FILE" ]; then
    echo -e "${RED}❌ Video file not found: $VIDEO_FILE${NC}"
    echo "Please place your video file at: video/PauHanaVideoLoop.mp4"
    exit 1
fi

# Get video file size
VIDEO_SIZE=$(du -h "$VIDEO_FILE" | cut -f1)
echo -e "${YELLOW}📹 Video file size: ${VIDEO_SIZE}${NC}"
echo ""

# Check Pi connectivity
echo -e "${YELLOW}🔍 Checking Pi connectivity...${NC}"
if ! ssh -o ConnectTimeout=5 ${PI_USER}@${PI_HOST} "echo 'Connected'" &>/dev/null; then
    echo -e "${RED}❌ Cannot connect to ${PI_HOST}${NC}"
    echo "Please check:"
    echo "  - Pi is powered on and connected to network"
    echo "  - Hostname/IP is correct: ${PI_HOST}"
    exit 1
fi
echo -e "${GREEN}✅ Connected to Pi${NC}"
echo ""

# Sync video file to Pi
echo -e "${YELLOW}📤 Syncing new video file (this may take a while depending on size)...${NC}"
rsync -avz --progress \
    "$VIDEO_FILE" \
    ${PI_USER}@${PI_HOST}:${REMOTE_DIR}/video/

echo -e "${GREEN}✅ Video synced${NC}"
echo ""

# Restart video service to load new file
echo -e "${YELLOW}🔄 Restarting video service...${NC}"
ssh ${PI_USER}@${PI_HOST} "sudo systemctl restart pauhana-video.service"
sleep 2

# Check service status
echo -e "${YELLOW}✅ Checking service status...${NC}"
ssh ${PI_USER}@${PI_HOST} "sudo systemctl status pauhana-video.service --no-pager | head -15"
echo ""

echo -e "${GREEN}🎉 Video update complete!${NC}"
echo ""
echo "The new video is now playing on the HDMI display."
echo ""
echo "Commands:"
echo "  Status:  ssh ${PI_USER}@${PI_HOST} 'sudo systemctl status pauhana-video'"
echo "  Logs:    ssh ${PI_USER}@${PI_HOST} 'sudo journalctl -u pauhana-video -f'"
echo "  Restart: ssh ${PI_USER}@${PI_HOST} 'sudo systemctl restart pauhana-video'"
echo ""
