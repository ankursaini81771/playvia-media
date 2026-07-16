import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Cast, Play } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';


export const TopBar: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasUnread, setHasUnread] = useState(false);

  // Check for unread notifications
  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (!error && count !== null) {
          setHasUnread(count > 0);
        }
      } catch (err) {
        console.warn('Failed to fetch notification status', err);
      }
    };

    checkNotifications();
    
    // Subscribe to notification additions with a unique channel name to avoid cached channel conflicts
    const channelId = `notifications-${user.id}-${Math.random().toString(36).substring(7)}`;
    const subscription = supabase
      .channel(channelId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        setHasUnread(true);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleCast = () => {
    Alert.alert('Casting', 'Searching for PlayVia compatible TVs or Cast devices on your network...');
  };

  const handleNotifications = () => {
    setHasUnread(false);
    router.push('/notifications');
  };

  const handleProfile = () => {
    router.push('/(tabs)/profile');
  };

  const avatarUrl = user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';

  return (
    <View style={[styles.container, { paddingTop: insets.top, height: 56 + insets.top }]}>
      {/* Left logo section */}
      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Play size={14} color={COLORS.white} fill={COLORS.white} />
        </View>
        <Text style={styles.logoText}>
          Play<Text style={{ color: COLORS.primary }}>Via</Text>
        </Text>
      </View>

      {/* Right icons section */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.iconButton} onPress={handleCast}>
          <Cast size={22} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleNotifications}>
          <View style={styles.bellContainer}>
            <Bell size={22} color={COLORS.white} />
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatarButton} onPress={handleProfile}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    backgroundColor: COLORS.primary,
    width: 26,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    transform: [{ rotate: '45deg' }], // Cool diamond/tilted play symbol
  },
  logoText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  bellContainer: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  avatarButton: {
    marginLeft: 12,
    padding: 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
});
