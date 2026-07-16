import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, BellOff, CheckCheck, Heart, MessageCircle, UserPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { formatTimeAgo } from '../utils/format';

interface NotificationItem {
  id: string;
  type: 'subscribe' | 'like' | 'comment';
  message: string;
  is_read: boolean;
  created_at: string;
  video_id?: string;
  sender_id: string;
  senders?: {
    username: string;
    avatar_url: string;
  };
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, senders:sender_id(username, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);

      // Mark all fetched notifications as read
      if (data && data.length > 0) {
        const unreadIds = data.filter((n) => !n.is_read).map((n) => n.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }
    } catch (err) {
      console.warn('Error loading notifications', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.warn('Error marking notifications read', err);
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    if (item.video_id) {
      router.push(`/video/${item.video_id}`);
    } else {
      router.push('/(tabs)/profile');
    }
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return <Heart size={14} color={COLORS.primary} fill={COLORS.primary} />;
      case 'comment':
        return <MessageCircle size={14} color={COLORS.success} fill={COLORS.success} />;
      case 'subscribe':
        return <UserPlus size={14} color="#007AFF" />;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const senderAvatar = item.senders?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';
    
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: senderAvatar }} style={styles.avatar} />
          <View style={styles.badgeWrapper}>{renderIcon(item.type)}</View>
        </View>

        <View style={styles.details}>
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(item.created_at)}</Text>
        </View>

        {!item.is_read && <View style={styles.unreadMarker} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Notifications</Text>

        <TouchableOpacity 
          style={styles.markReadBtn} 
          onPress={handleMarkAllRead}
          disabled={notifications.filter((n) => !n.is_read).length === 0}
        >
          <CheckCheck size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Main logs */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.iconCircle}>
            <BellOff size={32} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyDesc}>No new notifications to display right now.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  markReadBtn: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  unreadCard: {
    backgroundColor: 'rgba(255, 43, 66, 0.02)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
  },
  badgeWrapper: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  unreadMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
});
