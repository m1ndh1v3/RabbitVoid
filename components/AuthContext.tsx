import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  username: string;
  anonymous_id: string;
  created_at: string;
  pub_alias?: string;
  trust_score: number;
  device_id: string; // This is required
}

interface AuthContextType {
  user: User | null;
  isAnonymous: boolean;
  login: (username: string) => Promise<void>;
  register: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  createAnonymous: () => Promise<void>;
  loading: boolean;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkExistingUser();
    setupNetworkCheck();
  }, []);

  const setupNetworkCheck = () => {
    const checkNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com', { method: 'HEAD' });
        setIsOnline(response.ok);
      } catch (error) {
        console.log('Network check failed, assuming offline');
        setIsOnline(false);
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 30000);
    return () => clearInterval(interval);
  };

  // FIXED: Ensure device_id is always available
  const getDeviceId = async (): Promise<string> => {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
        console.log('📱 Generated new device ID:', deviceId);
      } else {
        console.log('📱 Using existing device ID:', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      // Fallback device ID
      return `fallback_device_${Date.now()}`;
    }
  };

  const checkExistingUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('void_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // FIXED: Ensure existing users have device_id
        if (!userData.device_id) {
          userData.device_id = await getDeviceId();
          await AsyncStorage.setItem('void_user', JSON.stringify(userData));
        }
        setUser(userData);
        console.log('👤 Loaded existing user with device_id:', userData.device_id);
      } else {
        await createAnonymous();
      }
    } catch (error) {
      console.error('Error checking user:', error);
      await createAnonymous();
    } finally {
      setLoading(false);
    }
  };

  const createAnonymous = async (): Promise<void> => {
    try {
      const deviceId = await getDeviceId();
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pubAlias = `VoidWalker${Math.floor(Math.random() * 10000)}`;
      
      const newUser: User = {
        id: anonymousId,
        username: 'anonymous',
        anonymous_id: anonymousId,
        created_at: new Date().toISOString(),
        pub_alias: pubAlias,
        trust_score: 50,
        device_id: deviceId // FIXED: Always include device_id
      };

      await AsyncStorage.setItem('void_user', JSON.stringify(newUser));
      setUser(newUser);
      console.log('👤 Created anonymous user with device_id:', deviceId);

    } catch (error) {
      console.error('Error creating anonymous user:', error);
      // Fallback to in-memory user with device_id
      const fallbackUser: User = {
        id: 'fallback_anon',
        username: 'anonymous',
        anonymous_id: 'fallback_anon',
        created_at: new Date().toISOString(),
        pub_alias: 'FallbackVoid',
        trust_score: 50,
        device_id: 'fallback_device'
      };
      setUser(fallbackUser);
    }
  };

  const register = async (username: string): Promise<void> => {
    try {
      setLoading(true);
      
      if (username.length < 2) {
        Alert.alert('Oops!', 'Alias too short (min 2 chars)');
        return;
      }

      if (username.length > 20) {
        Alert.alert('Oops!', 'Alias too long (max 20 chars)');
        return;
      }

      const deviceId = await getDeviceId();
      const anonymousId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser: User = {
        id: anonymousId,
        username: username,
        anonymous_id: anonymousId,
        created_at: new Date().toISOString(),
        pub_alias: username,
        trust_score: 50,
        device_id: deviceId // FIXED: Always include device_id
      };

      await AsyncStorage.setItem('void_user', JSON.stringify(newUser));
      setUser(newUser);
      console.log('👤 Registered user with device_id:', deviceId);

      Alert.alert('Welcome to The Void!', `Your underground identity "${username}" is ready.`);

    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', 'Try a different alias or go anonymous.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string): Promise<void> => {
    await register(username); // For demo, same as register
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('void_user');
      setUser(null);
      await createAnonymous();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAnonymous: user?.username === 'anonymous',
      login,
      register,
      logout,
      createAnonymous,
      loading,
      isOnline
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};