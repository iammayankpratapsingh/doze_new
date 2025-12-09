# MQTT Authentication Configuration

## Overview

Your MQTT broker **REQUIRES authentication** - anonymous connections are not allowed.

## Current Authentication Setup

### Broker Configuration
- **Broker IP**: `172.105.98.123`
- **TCP Port**: `1883` (for backend/website)
- **WebSocket Port**: `8083` (for React Native app)
- **Authentication**: **REQUIRED** (`allow_anonymous false`)

### Shared Credentials (Used by All Clients)

All clients (backend server, website frontend, React Native app, and IoT devices) use the **same shared credentials**:

```
Username: doze
Password: bK67ZwBHSWkl
```

## Who Uses These Credentials?

### 1. **Backend Server** (`Dozemate_web/backend/routes/mqtt.js`)
```javascript
const MQTT_USERNAME = process.env.MQTT_USERNAME || "doze";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "bK67ZwBHSWkl";
```
- Connects to subscribe to all device topics
- Receives and stores device data in MongoDB
- Uses TCP connection on port 1883

### 2. **Website Frontend** (`Dozemate_web/frontend/src/mqtt/mqtt.js`)
```javascript
const MQTT_USERNAME = process.env.REACT_APP_MQTT_USERNAME || 'doze';
const MQTT_PASSWORD = process.env.REACT_APP_MQTT_PASSWORD || 'bK67ZwBHSWkl';
```
- Connects to subscribe to specific device topics for real-time display
- Uses TCP connection on port 1883

### 3. **React Native App** (`services/mqttService.ts`)
```typescript
const MQTT_USERNAME = process.env.EXPO_PUBLIC_MQTT_USERNAME || 'doze';
const MQTT_PASSWORD = process.env.EXPO_PUBLIC_MQTT_PASSWORD || 'bK67ZwBHSWkl';
```
- Connects to subscribe to device topics for real-time display
- **Requires WebSocket** connection on port 8083 (React Native limitation)

### 4. **IoT Devices** (Hardware)
- **Assumed to use the same credentials** (`doze` / `bK67ZwBHSWkl`)
- Devices publish data to topics: `/{deviceId}/health` and `/{deviceId}/sleep`
- Credentials are likely hardcoded in device firmware or provisioned during setup

## Security Considerations

### Current Setup: Shared Credentials
⚠️ **All clients use the same username/password** - this is a simple setup but has security implications:

**Pros:**
- Simple to manage
- Easy to configure
- Works for all clients

**Cons:**
- If credentials are compromised, all devices are at risk
- No per-device access control
- Cannot revoke access for a single device

### Recommended: Device-Specific Credentials (Future Enhancement)

For better security, consider:

1. **Per-Device Credentials**
   - Each device gets unique username: `device_{deviceId}`
   - Each device gets unique password (stored securely)
   - Devices can only publish to their own topics

2. **ACL (Access Control List)**
   - Device `{deviceId}` can only publish to `/{deviceId}/*`
   - Backend can subscribe to all topics
   - Users can only subscribe to their device topics

3. **Certificate-Based Authentication**
   - Use TLS/SSL certificates for device authentication
   - More secure but requires certificate management

## How Devices Connect

Based on the codebase, IoT devices:

1. **Connect to MQTT broker** using credentials (likely `doze` / `bK67ZwBHSWkl`)
2. **Publish data** to topics:
   - `/{deviceId}/health` - Health metrics (heart rate, respiration, stress, etc.)
   - `/{deviceId}/sleep` - Sleep data
3. **Data format**: JSON payload with health metrics

Example topic structure:
```
/ABC123-DEF456789012/health
/ABC123-DEF456789012/sleep
```

## Testing Authentication

### Test Backend Connection
```bash
# From backend directory
node -e "
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://172.105.98.123:1883', {
  username: 'doze',
  password: 'bK67ZwBHSWkl'
});
client.on('connect', () => console.log('✅ Connected'));
client.on('error', (err) => console.error('❌ Error:', err));
"
```

### Test WebSocket Connection (React Native)
```bash
# Using mosquitto_pub with WebSocket
mosquitto_pub -h 172.105.98.123 -p 8083 \
  -t /test -m "hello" \
  -u doze -P bK67ZwBHSWkl \
  --websockets
```

## Environment Variables

### Backend (.env)
```env
MQTT_BROKER_URL=mqtt://172.105.98.123:1883
MQTT_USERNAME=doze
MQTT_PASSWORD=bK67ZwBHSWkl
```

### React Native (.env or app.json)
```env
EXPO_PUBLIC_MQTT_BROKER_URL=ws://172.105.98.123:8083
EXPO_PUBLIC_MQTT_USERNAME=doze
EXPO_PUBLIC_MQTT_PASSWORD=bK67ZwBHSWkl
```

### Website Frontend (.env)
```env
REACT_APP_MQTT_BROKER_URL=mqtt://172.105.98.123:1883
REACT_APP_MQTT_USERNAME=doze
REACT_APP_MQTT_PASSWORD=bK67ZwBHSWkl
```

## Summary

✅ **Authentication is REQUIRED** - `allow_anonymous false`  
✅ **All clients use shared credentials**: `doze` / `bK67ZwBHSWkl`  
✅ **IoT devices likely use the same credentials** (hardcoded in firmware)  
⚠️ **Consider device-specific credentials** for better security in production



