import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from './api';

// Get auth token from storage
async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem('auth_token');
}

// Create headers with auth token
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Validate device ID format and existence
export async function validateDeviceId(deviceId: string): Promise<{
  ok: boolean;
  exists: boolean;
  assigned: boolean;
  device?: any;
  message?: string;
}> {
  try {
    const normalizedId = deviceId.trim().toUpperCase();
    
    // Validate format: XXXX-XXXXXXXXXXXX (4 digits, hyphen, 12 hex chars)
    const formatRegex = /^\d{4}-[0-9A-F]{12}$/i;
    if (!formatRegex.test(normalizedId)) {
      return {
        ok: false,
        exists: false,
        assigned: false,
        message: 'Device ID must match format: XXXX-XXXXXXXXXXXX (4 digits, hyphen, 12 hex characters)',
      };
    }

    const response = await fetch(apiUrl(`/api/devices/validate?deviceId=${encodeURIComponent(normalizedId)}`));
    const data = await response.json();
    
    if (!response.ok) {
      return {
        ok: false,
        exists: false,
        assigned: false,
        message: data.message || 'Failed to validate device',
      };
    }

    return {
      ok: data.ok || false,
      exists: data.exists || false,
      assigned: data.assigned || false,
      device: data.device || null,
    };
  } catch (error: any) {
    return {
      ok: false,
      exists: false,
      assigned: false,
      message: error.message || 'Network error',
    };
  }
}

// Add device to user account
export async function addDeviceToUser(deviceId: string): Promise<{
  success: boolean;
  message?: string;
  data?: any;
}> {
  try {
    const normalizedId = deviceId.trim().toUpperCase();
    const headers = await getAuthHeaders();
    
    const response = await fetch(apiUrl('/api/user/devices/save'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ deviceId: normalizedId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || data.status || 'Failed to add device',
      };
    }

    return {
      success: true,
      message: 'Device added successfully',
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
}

// Get user's devices
export async function getUserDevices(): Promise<{
  success: boolean;
  devices?: any[];
  activeDevice?: any;
  message?: string;
}> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(apiUrl('/api/devices/user'), {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch devices',
      };
    }

    return {
      success: true,
      devices: data.devices || [],
      activeDevice: data.activeDevice || null,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
}

// Get device history (latest N records)
export async function getDeviceHistory(
  deviceId: string,
  options?: { limit?: number; from?: Date; to?: Date }
): Promise<{
  success: boolean;
  data?: any[];
  summary?: any;
  message?: string;
}> {
  try {
    const normalizedId = deviceId.trim().toUpperCase();
    const headers = await getAuthHeaders();
    
    const params = new URLSearchParams({
      deviceId: normalizedId,
      limit: String(options?.limit || 100),
    });
    
    if (options?.from) {
      params.append('from', options.from.toISOString());
    }
    if (options?.to) {
      params.append('to', options.to.toISOString());
    }

    const response = await fetch(apiUrl(`/api/devices/history?${params.toString()}`), {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch device history',
      };
    }

    return {
      success: true,
      data: data.data || [],
      summary: data.summary || null,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
}

// Get latest health data for a device
export async function getHealthData(
  deviceId: string,
  options?: { limit?: number; start?: Date; end?: Date }
): Promise<{
  success: boolean;
  data?: any[];
  message?: string;
}> {
  try {
    const normalizedId = deviceId.trim().toUpperCase();
    const headers = await getAuthHeaders();
    
    const params = new URLSearchParams();
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    if (options?.start) {
      params.append('start', options.start.toISOString());
    }
    if (options?.end) {
      params.append('end', options.end.toISOString());
    }

    const queryString = params.toString();
    const url = apiUrl(`/api/data/health/${normalizedId}${queryString ? `?${queryString}` : ''}`);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch health data',
      };
    }

    // Response is an array of health records
    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
}

// Get historical aggregated data
export async function getHistoricalData(
  deviceId: string,
  period: '24h' | '48h' | '72h' | '7d' | '30d' = '24h'
): Promise<{
  success: boolean;
  data?: any[];
  period?: string;
  aggregationMinutes?: number;
  message?: string;
}> {
  try {
    const normalizedId = deviceId.trim().toUpperCase();
    const headers = await getAuthHeaders();
    
    const response = await fetch(apiUrl(`/api/data/history/${normalizedId}?period=${period}`), {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch historical data',
      };
    }

    return {
      success: true,
      data: data.data || [],
      period: data.period,
      aggregationMinutes: data.aggregationMinutes,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
}

// Get live respiration data
export async function getRespirationLive(
  deviceId: string,
  options?: { windowMinutes?: number; bucketSeconds?: number }
): Promise<{
  success: boolean;
  points?: Array<{ timestamp: string; value: number }>;
  message?: string;
}> {
  try {
    const normalizedId = deviceId.trim().toUpperCase();
    const headers = await getAuthHeaders();
    
    const params = new URLSearchParams({
      deviceId: normalizedId,
      windowMinutes: String(options?.windowMinutes || 30),
      bucketSeconds: String(options?.bucketSeconds || 30),
    });

    const response = await fetch(apiUrl(`/api/devices/history/respiration?${params.toString()}`), {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch respiration data',
      };
    }

    return {
      success: true,
      points: data.points || [],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
}

// Get live stress data
export async function getStressLive(
  deviceId: string,
  options?: { windowMinutes?: number; bucketSeconds?: number; from?: Date; to?: Date }
): Promise<{
  success: boolean;
  points?: Array<{ timestamp: string; value: number }>;
  message?: string;
}> {
  try {
    const normalizedId = deviceId.trim().toUpperCase();
    const headers = await getAuthHeaders();
    
    const params = new URLSearchParams({
      deviceId: normalizedId,
      windowMinutes: String(options?.windowMinutes || 30),
      bucketSeconds: String(options?.bucketSeconds || 30),
    });
    
    if (options?.from) {
      params.append('from', options.from.toISOString());
    }
    if (options?.to) {
      params.append('to', options.to.toISOString());
    }

    const response = await fetch(apiUrl(`/api/devices/history/stress?${params.toString()}`), {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch stress data',
      };
    }

    return {
      success: true,
      points: data.points || [],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
}



