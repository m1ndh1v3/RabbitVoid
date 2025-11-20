// services/CloudService.tsx
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dqxphwretjntexcddwbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeHBod3JldGpudGV4Y2Rkd2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODQ1NTQsImV4cCI6MjA3OTE2MDU1NH0.W9xyt6ekVLdDjcX0-Hl5G_OwSL6M86hSHf5q-cs2Fno';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface VoidStatus {
  id: string;
  device_id: string;
  pub_alias: string;
  status: string;
  chaos_level: number;
  location: string;
  drinks_consumed: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  distance?: string; // For local P2P mode
}

export interface VoidUser {
  device_id: string;
  pub_alias: string;
  trust_score: number;
  total_chaos: number;
  highest_chaos: number;
  drinks_consumed: number;
  games_played: number;
  status_reports: number;
  verified_reports: number;
  last_seen: string;
  created_at: string;
}

export class CloudService {
  // Submit a new status to the cloud
  static async submitStatus(statusData: {
    device_id: string;
    pub_alias: string;
    status: string;
    chaos_level: number;
    location: string;
    drinks_consumed: number;
  }): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('void_statuses')
        .insert([{
          ...statusData,
          is_verified: true // User's own status is auto-verified
        }])
        .select();

      if (error) {
        console.error('Error submitting status:', error);
        return false;
      }

      console.log('Status submitted to cloud:', data);
      return true;
    } catch (error) {
      console.error('Exception submitting status:', error);
      return false;
    }
  }

  // Get recent statuses from cloud
  static async getRecentStatuses(limit: number = 50): Promise<VoidStatus[]> {
    try {
      const { data, error } = await supabase
        .from('void_statuses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching statuses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching statuses:', error);
      return [];
    }
  }

  // Get statuses by location
  static async getStatusesByLocation(location: string): Promise<VoidStatus[]> {
    try {
      const { data, error } = await supabase
        .from('void_statuses')
        .select('*')
        .eq('location', location)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching location statuses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching location statuses:', error);
      return [];
    }
  }

  // Sync user profile to cloud
  static async syncUserProfile(userData: {
    device_id: string;
    pub_alias: string;
    trust_score: number;
  }): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('void_users')
        .upsert({
          ...userData,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_id'
        })
        .select();

      if (error) {
        console.error('Error syncing user profile:', error);
        return false;
      }

      console.log('User profile synced to cloud:', data);
      return true;
    } catch (error) {
      console.error('Exception syncing user profile:', error);
      return false;
    }
  }

  // Get user profile from cloud
  static async getUserProfile(deviceId: string): Promise<VoidUser | null> {
    try {
      const { data, error } = await supabase
        .from('void_users')
        .select('*')
        .eq('device_id', deviceId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  }

  // Subscribe to real-time status updates
  static subscribeToStatusUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('void_statuses')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'void_statuses'
        },
        callback
      )
      .subscribe();
  }
}