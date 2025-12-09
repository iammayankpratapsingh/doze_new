import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { addDeviceToUser, getUserDevices, validateDeviceId } from '@/services/deviceData';

type Device = {
  _id: string;
  deviceId: string;
  deviceType?: string;
  manufacturer?: string;
  status?: string;
};

type DeviceContextType = {
  devices: Device[];
  activeDevice: Device | null;
  isLoading: boolean;
  addDevice: (deviceId: string) => Promise<{ success: boolean; message?: string }>;
  refreshDevices: () => Promise<void>;
  setActiveDevice: (device: Device | null) => Promise<void>;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDevice, setActiveDeviceState] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load devices on mount
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const result = await getUserDevices();
      
      if (result.success) {
        setDevices(result.devices || []);
        
        // Set active device from result or from storage
        if (result.activeDevice) {
          const active = result.devices?.find(d => String(d._id) === String(result.activeDevice)) || null;
          setActiveDeviceState(active);
          if (active) {
            await AsyncStorage.setItem('active_device_id', active.deviceId);
          }
        } else {
          // Try to load from storage
          const storedDeviceId = await AsyncStorage.getItem('active_device_id');
          if (storedDeviceId && result.devices) {
            const active = result.devices.find(d => d.deviceId === storedDeviceId) || null;
            setActiveDeviceState(active);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDevices = async () => {
    await loadDevices();
  };

  const addDevice = async (deviceId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // First validate the device ID
      const validation = await validateDeviceId(deviceId);
      
      if (!validation.ok || !validation.exists) {
        return {
          success: false,
          message: validation.message || 'Device not found or invalid format',
        };
      }

      // Add device to user account
      const result = await addDeviceToUser(deviceId);
      
      if (result.success) {
        // Refresh device list
        await refreshDevices();
        
        // If this is the first device, set it as active
        if (devices.length === 0 && result.data) {
          const newDevice = result.data.device || { deviceId };
          await setActiveDevice(newDevice as Device);
        }
      }
      
      return result;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to add device',
      };
    }
  };

  const setActiveDevice = async (device: Device | null) => {
    setActiveDeviceState(device);
    if (device) {
      await AsyncStorage.setItem('active_device_id', device.deviceId);
    } else {
      await AsyncStorage.removeItem('active_device_id');
    }
  };

  return (
    <DeviceContext.Provider
      value={{
        devices,
        activeDevice,
        isLoading,
        addDevice,
        refreshDevices,
        setActiveDevice,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
}



