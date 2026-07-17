import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing! Make sure to create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// SSR Safety: Node.js server environment during compilation has no window or localStorage
const isClient = Platform.OS !== 'web' || typeof window !== 'undefined';

const customStorage = isClient
  ? AsyncStorage
  : {
      getItem: async (key: string) => null,
      setItem: async (key: string, value: string) => {},
      removeItem: async (key: string) => {},
    };

// Use placeholder dummy values to prevent app crash-on-launch if EAS has no env variables during build
const safeUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder-project.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
