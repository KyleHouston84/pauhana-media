#!/bin/bash
# Quick Deploy - Just build and sync (no service restart)
# Usage: ./quick-deploy.sh [pi-hostname]

PI_HOST="${1:-pauhana-pi.local}"
PI_USER="kyle"

echo "🚀 Quick deploying to ${PI_HOST}..."

npm run build && \
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    dist/ ${PI_USER}@${PI_HOST}:/home/kyle/pauhana-media/dist/

echo "✅ Dist synced. Service NOT restarted."
echo "To restart: ssh ${PI_USER}@${PI_HOST} 'sudo systemctl restart pauhana.service'"
