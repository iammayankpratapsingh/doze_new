#!/bin/bash

# Script to enable WebSocket on Mosquitto MQTT Broker
# Run this script on the server: 172.105.98.123

echo "🔧 Enabling WebSocket on Mosquitto MQTT Broker..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Backup existing config
CONFIG_FILE="/etc/mosquitto/mosquitto.conf"
BACKUP_FILE="/etc/mosquitto/mosquitto.conf.backup.$(date +%Y%m%d_%H%M%S)"

if [ -f "$CONFIG_FILE" ]; then
    echo "📋 Backing up existing config to: $BACKUP_FILE"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
else
    echo "⚠️  Config file not found at $CONFIG_FILE"
    echo "Creating new config file..."
fi

# Check if WebSocket listener already exists
if grep -q "listener 8083" "$CONFIG_FILE" 2>/dev/null; then
    echo "✅ WebSocket listener already configured on port 8083"
else
    echo "➕ Adding WebSocket listener configuration..."
    
    # Add WebSocket listener
    cat >> "$CONFIG_FILE" << 'EOF'

# ============================================
# WebSocket Listener - Port 8083
# Added for React Native app support
# ============================================
listener 8083
protocol websockets
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF
    
    echo "✅ WebSocket listener added to config"
fi

# Restart Mosquitto
echo "🔄 Restarting Mosquitto service..."
systemctl restart mosquitto

# Wait a moment for service to start
sleep 2

# Check if Mosquitto is running
if systemctl is-active --quiet mosquitto; then
    echo "✅ Mosquitto is running"
else
    echo "❌ Mosquitto failed to start. Check logs: sudo journalctl -u mosquitto"
    exit 1
fi

# Check if port 8083 is listening
if netstat -tlnp 2>/dev/null | grep -q ":8083" || ss -tlnp 2>/dev/null | grep -q ":8083"; then
    echo "✅ WebSocket listener is active on port 8083"
else
    echo "⚠️  Port 8083 not found. Checking firewall..."
    echo "   You may need to open port 8083: sudo ufw allow 8083/tcp"
fi

# Check firewall
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "8083"; then
        echo "✅ Firewall rule for port 8083 exists"
    else
        echo "⚠️  Adding firewall rule for port 8083..."
        ufw allow 8083/tcp
        echo "✅ Firewall rule added"
    fi
fi

echo ""
echo "🎉 WebSocket setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Test connection: mosquitto_pub -h 172.105.98.123 -p 8083 -t /test -m 'test' -u doze -P bK67ZwBHSWkl --websockets"
echo "   2. Check logs: sudo tail -f /var/log/mosquitto/mosquitto.log"
echo "   3. React Native app will now connect via: ws://172.105.98.123:8083"
echo ""



