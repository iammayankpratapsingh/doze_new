import mqtt, { MqttClient } from 'mqtt';

// MQTT Broker configuration
// React Native requires WebSocket, not raw TCP
// Try WebSocket port (common ports: 8083 for ws, 8084 for wss)
const MQTT_BROKER_WS_URL = process.env.EXPO_PUBLIC_MQTT_WS_URL || 'ws://172.105.98.123:8083';
const MQTT_BROKER_URL = process.env.EXPO_PUBLIC_MQTT_BROKER_URL || MQTT_BROKER_WS_URL;
const MQTT_USERNAME = process.env.EXPO_PUBLIC_MQTT_USERNAME || 'doze';
const MQTT_PASSWORD = process.env.EXPO_PUBLIC_MQTT_PASSWORD || 'bK67ZwBHSWkl';

let client: MqttClient | null = null;
let currentDeviceId: string | null = null;

export type MQTTMessageHandler = (data: {
  temp?: number;
  humidity?: number;
  iaq?: number;
  eco2?: number;
  tvoc?: number;
  etoh?: number;
  hrv?: number;
  stress?: number;
  respiration?: number;
  heartRate?: number;
  timestamp?: Date;
  [key: string]: any;
}) => void;

/**
 * Connect to MQTT broker
 * NOTE: React Native requires WebSocket, not raw TCP
 * If WebSocket is not available on broker, HTTP polling will be used as fallback
 */
export const connectMQTT = (deviceId: string): MqttClient | null => {
  console.log(`[MQTT] Attempting to connect to broker (React Native requires WebSocket)`);
  
  // If client exists but we have a different device, disconnect first
  if (client && currentDeviceId !== deviceId) {
    console.log('[MQTT] Disconnecting existing client for new device');
    client.end();
    client = null;
  }

  // Reuse existing connection if same device
  if (client && currentDeviceId === deviceId && client.connected) {
    console.log('[MQTT] Reusing existing MQTT connection');
    return client;
  }

  try {
    // React Native requires WebSocket, not raw TCP
    // Try different WebSocket ports (common: 8083, 9001, 1884)
    let connectionUrl = MQTT_BROKER_URL;
    
    if (connectionUrl.startsWith('mqtt://')) {
      // Extract host and port
      const hostPort = connectionUrl.replace('mqtt://', '');
      const [host, port] = hostPort.split(':');
      
      // Try WebSocket on common ports
      // Port 8083 is most common for MQTT over WebSocket
      const wsPort = '8083';
      connectionUrl = `ws://${host}:${wsPort}`;
      console.log(`[MQTT] Converted mqtt:// to WebSocket: ${connectionUrl}`);
      console.log(`[MQTT] Note: If this fails, broker may need WebSocket enabled on port ${wsPort}`);
    }

    console.log(`[MQTT] Connecting with credentials:`, {
      url: connectionUrl,
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD ? '***' : 'MISSING',
      protocol: 'WebSocket (required for React Native)',
    });

    // For React Native, we need to use WebSocket transport
    // The mqtt library will automatically use WebSocket when URL starts with ws:// or wss://
    client = mqtt.connect(connectionUrl, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      clientId: `react_native_${Math.random().toString(16).substring(2, 10)}`,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 15000, // Increased timeout for WebSocket
      keepalive: 60,
      // WebSocket-specific options
      // @ts-ignore
      transformWsUrl: (url: string, options: any, client: any) => {
        console.log('[MQTT] WebSocket URL transform:', url);
        return url;
      },
    });

    currentDeviceId = deviceId;

    client.on('connect', (connack) => {
      console.log(`[MQTT] ✅ Connected successfully for device: ${deviceId}`);
      console.log(`[MQTT] Connack:`, connack);
      
      // Subscribe after connection is established
      subscribeToDeviceTopics(deviceId);
      
      // Log that we're ready to receive messages
      console.log(`[MQTT] ✅ Ready to receive messages for device: ${deviceId}`);
    });

    client.on('error', (error) => {
      console.error('[MQTT] ❌ Connection error:', error);
      console.error('[MQTT] Error details:', {
        message: error.message,
        code: (error as any).code,
        errno: (error as any).errno,
      });
      console.error('[MQTT] ⚠️ WebSocket connection failed. This is expected if:');
      console.error('[MQTT]    1. Broker does not have WebSocket enabled');
      console.error('[MQTT]    2. WebSocket port (8083) is not open');
      console.error('[MQTT]    3. Network/firewall blocking WebSocket');
      console.error('[MQTT] App will fallback to HTTP polling for data updates.');
    });

    client.on('reconnect', () => {
      console.log('[MQTT] 🔄 Attempting to reconnect...');
    });

    client.on('offline', () => {
      console.warn('[MQTT] ⚠️ Client is offline');
    });

    client.on('close', () => {
      console.log('[MQTT] Connection closed');
    });

    client.on('end', () => {
      console.log('[MQTT] Connection ended');
    });

    // Additional event for debugging
    client.on('packetsend', (packet) => {
      console.log('[MQTT] Packet sent:', packet.cmd);
    });

    client.on('packetreceive', (packet) => {
      console.log('[MQTT] Packet received:', packet.cmd);
    });

    return client;
  } catch (error) {
    console.error('[MQTT] ❌ Failed to create client:', error);
    console.error('[MQTT] Error stack:', (error as Error).stack);
    return null;
  }
};

/**
 * Subscribe to device-specific topics (same as website)
 */
export const subscribeToDeviceTopics = (deviceId: string) => {
  if (!client || !deviceId) {
    console.warn('[MQTT] Cannot subscribe: client not initialized or deviceId missing');
    return;
  }

  const healthTopic = `/${deviceId}/health`;
  const sleepTopic = `/${deviceId}/sleep`;

  console.log(`[MQTT] Subscribing to topics for ${deviceId}:`);
  console.log(`  - Health: ${healthTopic}`);
  console.log(`  - Sleep: ${sleepTopic}`);

  client.subscribe(healthTopic, (err) => {
    if (!err) {
      console.log(`[MQTT] ✅ Subscribed to health topic: ${healthTopic}`);
    } else {
      console.error(`[MQTT] ❌ Failed to subscribe to health topic:`, err);
    }
  });

  client.subscribe(sleepTopic, (err) => {
    if (!err) {
      console.log(`[MQTT] ✅ Subscribed to sleep topic: ${sleepTopic}`);
    } else {
      console.error(`[MQTT] ❌ Failed to subscribe to sleep topic:`, err);
    }
  });
};

/**
 * Setup MQTT message handler (same pattern as website)
 * IMPORTANT: This must be called BEFORE the client connects to ensure messages are caught
 */
export const setupMQTTMessageHandler = (
  client: MqttClient,
  onMessage: MQTTMessageHandler
) => {
  // Remove any existing message handlers to avoid duplicates
  client.removeAllListeners('message');
  
  console.log('[MQTT] 🔧 Setting up message handler (before connection)...');
  console.log('[MQTT] Client state:', {
    connected: client.connected,
    disconnecting: (client as any).disconnecting,
    reconnecting: (client as any).reconnecting,
  });
  
  // Attach message handler directly to client (same as website)
  client.on('message', (topic, message) => {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
    
    try {
      const messageStr = message.toString();
      const parsedData = JSON.parse(messageStr);

      // Transform data to match our health data format (same as backend processing)
      // MQTT sends: { temp, hr, resp, humidity, iaq, etc. }
      // UI expects: { temperature, heartRate, respiration, etc. }
      const healthData = {
        // Core health metrics
        temperature: parsedData.temperature !== undefined ? parsedData.temperature : 
                     (parsedData.temp !== undefined ? parsedData.temp : undefined),
        heartRate: parsedData.heartRate !== undefined ? parsedData.heartRate : 
                   (parsedData.hr !== undefined ? parsedData.hr : undefined),
        respiration: parsedData.respiration !== undefined ? parsedData.respiration : 
                     (parsedData.resp !== undefined ? parsedData.resp : undefined),
        stress: parsedData.stress !== undefined ? parsedData.stress : undefined,
        hrv: parsedData.hrv !== undefined ? parsedData.hrv : undefined,
        
        // Environment metrics
        humidity: parsedData.humidity !== undefined ? parsedData.humidity : undefined,
        iaq: parsedData.iaq !== undefined ? parsedData.iaq : undefined,
        eco2: parsedData.eco2 !== undefined ? parsedData.eco2 : undefined,
        tvoc: parsedData.tvoc !== undefined ? parsedData.tvoc : undefined,
        etoh: parsedData.etoh !== undefined ? parsedData.etoh : undefined,
        
        // Additional fields
        metrics: parsedData.metrics || {},
        signals: parsedData.signals || {},
        raw: parsedData.raw || {},
        timestamp: new Date(),
        
        // Keep original fields for compatibility
        temp: parsedData.temp !== undefined ? parsedData.temp : parsedData.temperature,
        hr: parsedData.hr !== undefined ? parsedData.hr : parsedData.heartRate,
        resp: parsedData.resp !== undefined ? parsedData.resp : parsedData.respiration,
      };

      // Real-time data print - har 6 seconds
      console.log(`[${timestamp}] 📱 MQTT: 🌡️${healthData.temperature || 'N/A'}°C | ❤️${healthData.heartRate || 'N/A'}BPM | 🌬️${healthData.respiration || 'N/A'}RPM | 😰${healthData.stress || 'N/A'} | 💧${healthData.humidity || 'N/A'}% | 🌬️IAQ:${healthData.iaq || 'N/A'}`);
      
      onMessage(healthData);
    } catch (error) {
      console.error('[MQTT] ❌ Error parsing message:', error);
      console.error('[MQTT] Raw message:', message.toString());
      console.error('[MQTT] Error stack:', (error as Error).stack);
    }
  });
  
  console.log('[MQTT] ✅ Message handler attached to client');
};

/**
 * Disconnect from MQTT broker
 */
export const disconnectMQTT = () => {
  if (client) {
    console.log('[MQTT] Disconnecting...');
    client.end();
    client = null;
    currentDeviceId = null;
  }
};

/**
 * Check if MQTT is connected
 */
export const isMQTTConnected = (): boolean => {
  return client !== null && client.connected === true;
};

