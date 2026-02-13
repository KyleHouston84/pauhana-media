# Pau Hana Media - Deployment Guide

## 🚀 Deployment Options

### Option 1: Full Deployment (Recommended)
Builds, syncs, installs dependencies, and restarts service.

```bash
./deploy.sh [pi-hostname]
```

**What it does:**
1. ✅ Builds TypeScript locally
2. ✅ Checks Pi connectivity
3. ✅ Syncs all files (excluding node_modules)
4. ✅ Installs production dependencies on Pi
5. ✅ Restarts systemd service
6. ✅ Checks service status

**Examples:**
```bash
./deploy.sh                          # Uses default: pauhana-pi.local
./deploy.sh 192.168.1.100           # Deploy to specific IP
./deploy.sh my-pi.local             # Deploy to custom hostname
```

---

### Option 2: Quick Deploy
Just builds and syncs the dist/ folder. Faster but doesn't restart service.

```bash
./quick-deploy.sh [pi-hostname]
```

**When to use:**
- Testing small changes
- Don't want to restart service yet
- Multiple quick iterations

**Restart manually:**
```bash
ssh pi@pauhana-pi.local 'sudo systemctl restart pauhana.service'
```

---

### Option 3: npm Scripts
Added to package.json for convenience:

```bash
npm run deploy              # Full deployment
npm run deploy:quick        # Quick sync only
```

---

## 🔧 Initial Pi Setup

### 1. SSH into your Raspberry Pi

```bash
ssh pi@pauhana-pi.local
```

### 2. Create project directory

```bash
mkdir -p /home/pi/pauhana-media
cd /home/pi/pauhana-media
```

### 3. Clone or sync the project

**Option A: Git clone**
```bash
git clone https://github.com/KyleHouston84/pauhana-media.git .
```

**Option B: Initial rsync from your Mac**
```bash
# Run from your Mac
rsync -avz ~/Documents/dev/pauhana-media/ pi@pauhana-pi.local:/home/pi/pauhana-media/
```

### 4. Create .env file on Pi

```bash
nano /home/pi/pauhana-media/.env
```

Paste your configuration:
```env
API_KEY=your-secret-key
SONOS_MAIN_IP=192.168.1.x
SONOS_SECONDARY_IP=192.168.1.y
HUE_BRIDGE_IP=192.168.1.z
HUE_USERNAME=your-hue-username
NODE_ENV=production
```

### 5. Install Node.js (if not already installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should be v21.x or higher
```

### 6. Install dependencies

```bash
cd /home/pi/pauhana-media
npm install
```

### 7. Build TypeScript (first time)

```bash
npm run build
```

### 8. Install systemd service

```bash
# Copy service file
sudo cp pauhana.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable pauhana.service

# Start service
sudo systemctl start pauhana.service

# Check status
sudo systemctl status pauhana.service
```

---

## 📊 Service Management

### Check service status
```bash
sudo systemctl status pauhana.service
```

### View live logs
```bash
sudo journalctl -u pauhana.service -f
```

### View last 100 lines
```bash
sudo journalctl -u pauhana.service -n 100
```

### Restart service
```bash
sudo systemctl restart pauhana.service
```

### Stop service
```bash
sudo systemctl stop pauhana.service
```

### Start service
```bash
sudo systemctl start pauhana.service
```

### Disable service (stop auto-start on boot)
```bash
sudo systemctl disable pauhana.service
```

---

## 🔍 Troubleshooting

### Service won't start

1. **Check logs:**
   ```bash
   sudo journalctl -u pauhana.service -n 50
   ```

2. **Check file permissions:**
   ```bash
   ls -la /home/pi/pauhana-media
   sudo chown -R pi:pi /home/pi/pauhana-media
   ```

3. **Check .env file exists:**
   ```bash
   cat /home/pi/pauhana-media/.env
   ```

4. **Test manually:**
   ```bash
   cd /home/pi/pauhana-media
   node dist/main.js
   ```

### Can't connect to Pi

1. **Check Pi is on network:**
   ```bash
   ping pauhana-pi.local
   ```

2. **Try IP address instead:**
   ```bash
   ./deploy.sh 192.168.1.100
   ```

3. **Check SSH is enabled:**
   ```bash
   # On Pi:
   sudo systemctl status ssh
   ```

### rsync errors

1. **SSH key not set up:**
   ```bash
   ssh-copy-id pi@pauhana-pi.local
   ```

2. **Permission denied:**
   ```bash
   # On Pi:
   chmod 755 /home/pi
   chmod 755 /home/pi/pauhana-media
   ```

---

## 🔄 Development Workflow

### Recommended workflow:

1. **Make changes locally** (on your Mac)
   - Edit TypeScript files
   - Test locally if possible

2. **Build and test locally**
   ```bash
   npm run build
   npm start
   ```

3. **Deploy to Pi**
   ```bash
   ./deploy.sh
   ```

4. **Check logs on Pi**
   ```bash
   ssh pi@pauhana-pi.local 'sudo journalctl -u pauhana.service -f'
   ```

### Quick iteration workflow:

For rapid testing of small changes:

```bash
# Make change
# Quick deploy (doesn't restart service)
./quick-deploy.sh

# Restart service
ssh pi@pauhana-pi.local 'sudo systemctl restart pauhana.service'
```

---

## 🎯 Best Practices

1. **Always commit before deploying**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ./deploy.sh
   ```

2. **Test locally first**
   - Build and run on your Mac
   - Test API endpoints
   - Then deploy to Pi

3. **Monitor logs during deployment**
   ```bash
   # In one terminal:
   ./deploy.sh

   # In another terminal:
   ssh pi@pauhana-pi.local 'sudo journalctl -u pauhana.service -f'
   ```

4. **Keep .env in sync**
   - Never commit .env to git
   - Update manually on Pi when needed
   - Use .env.example as template

---

## 📝 Notes

- The deploy script automatically excludes `node_modules` and builds on Pi
- Service runs as user `pi` for GPIO access
- Logs go to systemd journal (use `journalctl`)
- Service auto-restarts on failure (10 second delay)
- Production mode is set via NODE_ENV in service file
