import AsyncStorage from '@react-native-async-storage/async-storage';

// Thin wrapper so callers don't import AsyncStorage directly. Centralised
// here in case we later swap to expo-secure-store for tokens (future PR).
export const storage = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
  multiRemove: (keys: string[]) => AsyncStorage.multiRemove(keys),
};

export const StorageKeys = {
  accessToken: 'carelink.auth.accessToken',
  refreshToken: 'carelink.auth.refreshToken',
  user: 'carelink.auth.user',
  apiMode: 'carelink.dev.apiMode', // 'mock' | 'live'
} as const;
