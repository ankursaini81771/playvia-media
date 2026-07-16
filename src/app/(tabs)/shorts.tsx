import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { ShortVideoCard } from '../../components/ShortVideoCard';
import { CommentsSection } from '../../components/CommentsSection';
import { COLORS } from '../../theme/colors';
import { supabase } from '../../services/supabase';
import { MOCK_SHORTS } from '../../utils/mockData';


const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function ShortsScreen() {
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  
  // Comments modal state
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedShortId, setSelectedShortId] = useState<string | null>(null);
  const [selectedShortOwnerId, setSelectedShortOwnerId] = useState<string>('');
  const [selectedShortTitle, setSelectedShortTitle] = useState<string>('');

  const [containerHeight, setContainerHeight] = useState<number>(0);

  const fetchShorts = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*, users(username, avatar_url)')
        .eq('type', 'short')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      let fetchedShorts = data || [];
      if (fetchedShorts.length === 0) {
        fetchedShorts = MOCK_SHORTS;
      }

      setShorts(fetchedShorts);
      if (fetchedShorts.length > 0) {
        setActiveVideoId(fetchedShorts[0].id);
      }
    } catch (err) {
      console.warn('Failed to load Shorts', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchShorts();
  };

  // Autoplay handler when view positions scroll
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveVideoId(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // Item is active when 80% is visible
  }).current;

  const handleOpenComments = (videoId: string) => {
    const selectedShort = shorts.find((s) => s.id === videoId);
    if (!selectedShort) return;

    setSelectedShortId(videoId);
    setSelectedShortOwnerId(selectedShort.user_id);
    setSelectedShortTitle(selectedShort.title);
    setCommentsVisible(true);
  };

  if (loading || containerHeight === 0) {
    return (
      <View 
        style={styles.container}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          if (height > 0) {
            setContainerHeight(height);
          }
        }}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View 
      style={styles.container}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height > 0) {
          setContainerHeight(height);
        }
      }}
    >
      {shorts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No Shorts available yet.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shorts}
          renderItem={({ item }) => (
            <ShortVideoCard
              video={item}
              isActive={item.id === activeVideoId && !commentsVisible} // Pause play when comment modal is open!
              onPressComment={handleOpenComments}
              cardHeight={containerHeight}
            />
          )}
          keyExtractor={(item) => item.id}
          pagingEnabled
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          getItemLayout={(_, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
        />
      )}

      {/* Floating Comment Sheet Modal */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Touch background to close */}
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={() => setCommentsVisible(false)} 
          />
          
          <View style={styles.commentsDrawer}>
            {selectedShortId && (
              <CommentsSection
                videoId={selectedShortId}
                videoOwnerId={selectedShortOwnerId}
                videoTitle={selectedShortTitle}
                onClose={() => setCommentsVisible(false)}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.black,
    padding: 24,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  commentsDrawer: {
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
});
