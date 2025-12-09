# MQTT WebSocket Setup Guide

## Enable WebSocket on MQTT Broker for React Native Support

React Native requires WebSocket-based MQTT connections, not raw TCP. This guide shows how to enable WebSocket on your MQTT broker.

## Current Configuration

- **Broker IP**: `172.105.98.123`
- **TCP Port**: `1883` (for backend/website)
- **WebSocket Port**: `8083` (needs to be enabled for React Native)

## Option 1: Mosquitto MQTT Broker (Most Common)

### Step 1: Edit Mosquitto Configuration

SSH into your server (`172.105.98.123`) and edit the Mosquitto config file:

```bash
sudo nano /etc/mosquitto/mosquitto.conf
```

### Step 2: Add WebSocket Listener

Add these lines to enable WebSocket on port 8083:

```conf
# Standard MQTT listener (TCP) - already exists
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd

# WebSocket listener for React Native
listener 8083
protocol websockets
allow_anonymous false
password_file /etc/mosquitto/passwd
```

### Step 3: Restart Mosquitto

```bash
sudo systemctl restart mosquitto
# or
sudo service mosquitto restart
```

### Step 4: Verify WebSocket is Running

```bash
sudo netstat -tlnp | grep 8083
# Should show: tcp6  0  0  :::8083  :::*  LISTEN
```

### Step 5: Test WebSocket Connection

```bash
# Test from command line (if mosquitto_pub is installed)
mosquitto_pub -h 172.105.98.123 -p 8083 -t /test -m "hello" -u doze -P bK67ZwBHSWkl --websockets
```

## Option 2: If Using Different MQTT Broker

### For EMQ X / EMQX:
Edit `etc/emqx.conf`:
```conf
listener.ws.external = 8083
listener.ws.external.acceptors = 16
listener.ws.external.max_connections = 1024000
```

### For HiveMQ:
Edit `conf/config.xml`:
```xml
<websocket-listener>
    <port>8083</port>
    <bind-address>0.0.0.0</bind-address>
</websocket-listener>
```

## Firewall Configuration

Make sure port 8083 is open in your firewall:

```bash
# UFW (Ubuntu)
sudo ufw allow 8083/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=8083/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 8083 -j ACCEPT
```

## Update React Native App

Once WebSocket is enabled, the React Native app will automatically use:
- `ws://172.105.98.123:8083` for WebSocket connections

The app code is already configured to use WebSocket when available.

## Verification

After enabling WebSocket:

1. **Check broker logs**:
   ```bash
   sudo tail -f /var/log/mosquitto/mosquitto.log
   ```

2. **Test from React Native app**:
   - The app will show 🟢 "MQTT Live" when connected
   - Check console logs for `[MQTT] ✅ Connected successfully`

3. **Test from browser console** (for debugging):
   ```javascript
   const mqtt = require('mqtt');
   const client = mqtt.connect('ws://172.105.98.123:8083', {
     username: 'doze',
     password: 'bK67ZwBHSWkl'
   });
   client.on('connect', () => console.log('WebSocket connected!'));
   ```

## Troubleshooting

### Port Already in Use
If port 8083 is already in use, choose another port (e.g., 9001, 1884) and update the React Native app accordingly.

### Connection Refused
- Check firewall rules
- Verify Mosquitto is running: `sudo systemctl status mosquitto`
- Check Mosquitto logs: `sudo tail -f /var/log/mosquitto/mosquitto.log`

### Authentication Failed
- Verify username/password in `/etc/mosquitto/passwd`
- Ensure `password_file` path is correct in config

## Security Notes

- WebSocket connections use the same authentication as TCP
- Consider using `wss://` (secure WebSocket) for production
- For `wss://`, you'll need SSL certificates configured



