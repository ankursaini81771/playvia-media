import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TopBar } from '../../components/TopBar';
import { BannerAd } from '../../components/BannerAd';
import { VideoCard, VideoItem } from '../../components/VideoCard';
import { PremiumModal } from '../../components/PremiumModal';
import { COLORS } from '../../theme/colors';
import { supabase } from '../../services/supabase';
import { MOCK_VIDEOS } from '../../utils/mockData';


const CATEGORIES = ['All', 'Gaming', 'Music', 'Tech', 'Vlogs', 'Comedy'];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [premiumVisible, setPremiumVisible] = useState(false);

  const ITEMS_PER_PAGE = 5;

  const fetchVideos = async (pageNum: number, isRefresh = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      
      let query = supabase
        .from('videos')
        .select('*, users(username, avatar_url)')
        .eq('type', 'video')
        .order('created_at', { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      let newVideos = data as VideoItem[];
      
      if ((!newVideos || newVideos.length === 0) && pageNum === 0) {
        // Fallback to local mock data matching category
        newVideos = selectedCategory === 'All' 
          ? MOCK_VIDEOS 
          : MOCK_VIDEOS.filter((v) => v.category === selectedCategory);
      }
      
      if (isRefresh) {
        setVideos(newVideos);
        setHasMore(newVideos.length === ITEMS_PER_PAGE);
      } else {
        setVideos((prev) => [...prev, ...newVideos]);
        setHasMore(newVideos.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.warn('Error loading videos', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Reload videos when category selection changes
  useEffect(() => {
    setPage(0);
    fetchVideos(0, true);
  }, [selectedCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchVideos(0, true);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideos(nextPage);
  };

  const renderCategoryItem = (category: string) => {
    const isSelected = category === selectedCategory;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  // FlatList builder that injects banner ads periodically in the feed
  const buildFeedData = () => {
    const dataList: any[] = [];
    if (!videos || !Array.isArray(videos)) return [];
    videos.forEach((video, index) => {
      if (video && video.id) {
        dataList.push({ type: 'video', data: video, key: `video-${video.id}-${index}` });
        
        // Inject banner ad every 3 videos
        if ((index + 1) % 3 === 0) {
          dataList.push({ type: 'ad', key: `ad-${index}` });
        }
      }
    });
    return dataList;
  };

  const renderFeedItem = ({ item }: { item: any }) => {
    if (item.type === 'ad') {
      return <BannerAd category={selectedCategory} onPressPremium={() => setPremiumVisible(true)} />;
    }
    return <VideoCard video={item.data} />;
  };

  return (
    <View style={styles.container}>
      <TopBar />
      
      {/* Horizontal Category Chips */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={({ item }) => renderCategoryItem(item)}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        />
      </View>

      {/* Main Video Feed List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No videos found in this category.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 15 }} />
            ) : null
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
  categoryContainer: {
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chipsScroll: {
    paddingHorizontal: 12,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  chipSelected: {
    backgroundColor: COLORS.white,
  },
  chipText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.black,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  feedScroll: {
    paddingBottom: 20,
  },
});
