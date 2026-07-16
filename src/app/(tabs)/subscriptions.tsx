import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Heart, Tv } from 'lucide-react-native';
import { TopBar } from '../../components/TopBar';
import { BannerAd } from '../../components/BannerAd';
import { VideoCard, VideoItem } from '../../components/VideoCard';
import { PremiumModal } from '../../components/PremiumModal';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';

export default function SubscriptionsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [premiumVisible, setPremiumVisible] = useState(false);

  const fetchSubscriptionFeed = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 1. Fetch channel IDs the user is subscribed to
      const { data: subs, error: subError } = await supabase
        .from('subscriptions')
        .select('channel_id')
        .eq('subscriber_id', user.id);

      if (subError) throw subError;

      if (!subs || subs.length === 0) {
        setVideos([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const channelIds = subs.map((s: any) => s.channel_id);

      // 2. Query videos from those channels
      const { data: vids, error: vidError } = await supabase
        .from('videos')
        .select('*, users(username, avatar_url)')
        .eq('type', 'video')
        .in('user_id', channelIds)
        .order('created_at', { ascending: false });

      if (vidError) throw vidError;

      setVideos(vids || []);
    } catch (err) {
      console.warn('Error loading subscriptions feed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionFeed();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubscriptionFeed();
  };

  const renderFeedItem = ({ item }: { item: any }) => {
    if (item.type === 'ad') {
      return <BannerAd onPressPremium={() => setPremiumVisible(true)} />;
    }
    return <VideoCard video={item.data} />;
  };

  const buildFeedData = () => {
    const dataList: any[] = [];
    if (!videos || !Array.isArray(videos)) return [];
    videos.forEach((video, index) => {
      if (video && video.id) {
        dataList.push({ type: 'video', data: video, key: `sub-video-${video.id}-${index}` });
        if ((index + 1) % 3 === 0) {
          dataList.push({ type: 'ad', key: `sub-ad-${index}` });
        }
      }
    });
    return dataList;
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <TopBar />
        <View style={styles.centerContainer}>
          <Text style={styles.infoText}>Log in to check your subscriptions feed.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.iconCircle}>
            <Tv size={36} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Your Subscriptions Feed is Empty</Text>
          <Text style={styles.emptyDesc}>
            Videos from channels you subscribe to will show up here.
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.exploreButtonText}>Explore Feed</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={buildFeedData()}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.key}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.feedScroll}
        />
      )}

      {/* Premium Upgrade Modal */}
      <PremiumModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  exploreButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 13,
  },
  feedScroll: {
    paddingBottom: 20,
  },
});
