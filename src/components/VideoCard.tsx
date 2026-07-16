import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../theme/colors';
import { formatTimeAgo, formatViews } from '../utils/format';

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  category: string;
  views: number;
  created_at: string;
  type: 'video' | 'short';
  users?: {
    username: string;
    avatar_url: string;
  };
}

interface VideoCardProps {
  video: VideoItem;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const router = useRouter();

  // Extract author info with fallback values
  const authorName = video.users?.username || 'PlayVia Creator';
  const authorAvatar = video.users?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';

  const handlePress = () => {
    router.push(`/video/${video.id}`);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.9}>
      {/* Thumbnail Container */}
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: video.thumbnail_url }} style={styles.thumbnail} />
        {/* Play icon overlay on hover/press (simulated premium style) */}
      </View>

      {/* Info Details Section */}
      <View style={styles.infoContainer}>
        {/* Author Avatar */}
        <Image source={{ uri: authorAvatar }} style={styles.avatar} />

        {/* Title & Metadata */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.metadata} numberOfLines={1}>
            {authorName} • {formatViews(video.views)} • {formatTimeAgo(video.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: COLORS.surface,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  metadata: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
