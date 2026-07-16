import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Share, StyleSheet, Text, TouchableOpacity, View, Image, Modal, ScrollView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CornerUpRight, Heart, HeartOff, PlusSquare, ThumbsDown, ThumbsUp, ChevronDown, Check } from 'lucide-react-native';
import { CustomVideoPlayer } from '../../components/CustomVideoPlayer';
import { CommentsSection } from '../../components/CommentsSection';
import { VideoCard, VideoItem } from '../../components/VideoCard';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { formatTimeAgo, formatViews } from '../../utils/format';
import { useMiniPlayer } from '../../context/MiniPlayerContext';

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { playVideo, minimize, activeVideo, closePlayer, setActiveVideo, setIsMinimized } = useMiniPlayer();

  // Core content states
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState<VideoItem[]>([]);
  
  // Interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false); // Local only
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  
  // Comment preview state
  const [latestComment, setLatestComment] = useState<any>(null);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentsVisible, setCommentsVisible] = useState(false);

  // Autoplay next state
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);

  const fetchVideoDetails = async () => {
    if (!id) return;
    setLoading(true);

    // Minimize transition hooks
    setActiveVideo(null);
    setIsMinimized(false);

    try {
      // 1. Fetch current video details with creator profile
      const { data: vid, error } = await supabase
        .from('videos')
        .select('*, users(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVideo(vid);

      // 2. Increment video views count asynchronously
      const currentViews = vid.views || 0;
      await supabase
        .from('videos')
        .update({ views: currentViews + 1 })
        .eq('id', id);

      // 3. Fetch recommended videos (excluding current, matching category)
      const { data: recs } = await supabase
        .from('videos')
        .select('*, users(username, avatar_url)')
        .eq('type', 'video')
        .neq('id', id)
        .eq('category', vid.category)
        .limit(6);

      setRecommended(recs || []);
      
      // Update global context active video on load without routing loop
      setActiveVideo(vid);
      setIsMinimized(false);

      // 4. Fetch subscription status and creator stats
      const { count: channelSubs } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', vid.user_id);
      setSubscribersCount(channelSubs || 0);

      if (user) {
        // Check if subscribed
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('subscriber_id', user.id)
          .eq('channel_id', vid.user_id)
          .maybeSingle();
        setIsSubscribed(!!sub);

        // Check if liked
        const { data: like } = await supabase
          .from('likes')
          .select('id')
          .eq('video_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsLiked(!!like);
      }

      // 5. Fetch total likes count
      const { count: totalLikes } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('video_id', id);
      setLikesCount(totalLikes || 0);

      // 6. Fetch comments preview & count
      const { data: comms, count: commCount } = await supabase
        .from('comments')
        .select('*, users(username, avatar_url)', { count: 'exact' })
        .eq('video_id', id)
        .order('created_at', { ascending: false });

      setCommentsCount(commCount || 0);
      if (comms && comms.length > 0) {
        setLatestComment(comms[0]);
      } else {
        setLatestComment(null);
      }

    } catch (err) {
      console.warn('Failed to load video details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoDetails();
    
    return () => {
      // Trigger global minimization when leaving the video player screen
      minimize();
    };
  }, [id, user]);

  // Handle autoplay next video trigger
  useEffect(() => {
    if (autoplayCountdown === null) return;
    if (autoplayCountdown <= 0) {
      setAutoplayCountdown(null);
      playNextVideo();
      return;
    }

    const interval = setTimeout(() => {
      setAutoplayCountdown((prev) => (prev ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(interval);
  }, [autoplayCountdown]);

  const handleLikeToggle = async () => {
    if (!user || !video) return;

    try {
      if (isLiked) {
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
        await supabase.from('likes').delete().eq('video_id', video.id).eq('user_id', user.id);
      } else {
        setIsLiked(true);
        setIsDisliked(false);
        setLikesCount((prev) => prev + 1);
        await supabase.from('likes').insert({ video_id: video.id, user_id: user.id });

        // Trigger Notification
        if (user.id !== video.user_id) {
          await supabase.from('notifications').insert({
            user_id: video.user_id,
            sender_id: user.id,
            type: 'like',
            message: `${user.username} liked your video: "${video.title}"`,
            video_id: video.id,
          });
        }
      }
    } catch (err) {
      console.warn('Error toggling like', err);
    }
  };

  const handleSubscribeToggle = async () => {
    if (!user || !video) return;

    try {
      if (isSubscribed) {
        setIsSubscribed(false);
        setSubscribersCount((prev) => Math.max(0, prev - 1));
        await supabase
          .from('subscriptions')
          .delete()
          .eq('subscriber_id', user.id)
          .eq('channel_id', video.user_id);
      } else {
        setIsSubscribed(true);
        setSubscribersCount((prev) => prev + 1);
        await supabase
          .from('subscriptions')
          .insert({ subscriber_id: user.id, channel_id: video.user_id });

        // Trigger Notification
        if (user.id !== video.user_id) {
          await supabase.from('notifications').insert({
            user_id: video.user_id,
            sender_id: user.id,
            type: 'subscribe',
            message: `${user.username} subscribed to your channel!`,
          });
        }
      }
    } catch (err) {
      console.warn('Error toggling subscription', err);
    }
  };

  const handleShare = async () => {
    if (!video) return;
    try {
      await Share.share({
        message: `Watch "${video.title}" on PlayVia: \n${video.video_url}`,
      });
    } catch (err) {
      console.warn('Error sharing video', err);
    }
  };

  const handleVideoFinished = () => {
    if (recommended.length > 0) {
      // Start 5 second countdown before playing next video
      setAutoplayCountdown(5);
    }
  };

  const playNextVideo = () => {
    if (recommended.length > 0) {
      const nextVid = recommended[0];
      router.push(`/video/${nextVid.id}`);
    }
  };

  const cancelAutoplay = () => {
    setAutoplayCountdown(null);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Video not found or was removed.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const creatorAvatar = video.users?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';
  const creatorName = video.users?.username || 'PlayVia Creator';

  return (
    <View style={styles.container}>
      {/* Back/Minimize Button overlay */}
      <TouchableOpacity 
        style={styles.minimizeBtn} 
        onPress={() => router.back()}
      >
        <ChevronDown size={20} color={COLORS.white} />
      </TouchableOpacity>

      {/* 1. Integrated Video Player */}
      <CustomVideoPlayer 
        videoUrl={video.video_url} 
        category={video.category}
        onVideoEnd={handleVideoFinished}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 2. Metadata Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{video.title}</Text>
          <Text style={styles.viewsRow}>
            {formatViews(video.views)} • {formatTimeAgo(video.created_at)}
          </Text>

          {/* Action Row: Like, Dislike, Share, Save */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, isLiked && styles.actionBtnActive]} onPress={handleLikeToggle}>
              <ThumbsUp size={16} color={isLiked ? COLORS.primary : COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>{likesCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, isDisliked && styles.actionBtnActive]} 
              onPress={() => {
                setIsDisliked(!isDisliked);
                setIsLiked(false);
              }}
            >
              <ThumbsDown size={16} color={isDisliked ? COLORS.primary : COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <CornerUpRight size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Saved', 'Video added to your library.')}>
              <PlusSquare size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Creator Channel Details */}
        <View style={styles.creatorContainer}>
          <Image source={{ uri: creatorAvatar }} style={styles.avatar} />
          
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName} numberOfLines={1}>{creatorName}</Text>
            <Text style={styles.subCount}>{formatViews(subscribersCount).split(' ')[0]} subscribers</Text>
          </View>

          {user?.id !== video.user_id && (
            <TouchableOpacity 
              style={[styles.subBtn, isSubscribed && styles.subBtnActive]}
              onPress={handleSubscribeToggle}
            >
              {isSubscribed ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Check size={14} color={COLORS.white} style={{ marginRight: 4 }} />
                  <Text style={styles.subBtnTextActive}>Subscribed</Text>
                </View>
              ) : (
                <Text style={styles.subBtnText}>Subscribe</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Description view */}
        {video.description ? (
          <View style={styles.descPanel}>
            <Text style={styles.descText}>{video.description}</Text>
          </View>
        ) : null}

        {/* 4. YouTube-inspired Collapsed Comments section */}
        <TouchableOpacity style={styles.commentsPreviewCard} onPress={() => setCommentsVisible(true)}>
          <View style={styles.commentsPreviewHeader}>
            <Text style={styles.commentsPreviewTitle}>Comments</Text>
            <Text style={styles.commentsPreviewCount}>{commentsCount}</Text>
            <ChevronDown size={16} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
          </View>

          {latestComment ? (
            <View style={styles.latestCommentRow}>
              <Image source={{ uri: latestComment.users?.avatar_url }} style={styles.latestCommentAvatar} />
              <Text style={styles.latestCommentText} numberOfLines={1}>
                {latestComment.text}
              </Text>
            </View>
          ) : (
            <Text style={styles.noCommentsPrompt}>Be the first to reply to this video...</Text>
          )}
        </TouchableOpacity>

        {/* 5. Recommended / "Up Next" feed */}
        <Text style={styles.upNextTitle}>Up Next</Text>
        {recommended.length === 0 ? (
          <Text style={styles.emptyRecText}>No recommendations found in this category.</Text>
        ) : (
          recommended.map((item) => (
            <VideoCard key={item.id} video={item} />
          ))
        )}
      </ScrollView>

      {/* Autoplay HUD Overlay */}
      {autoplayCountdown !== null && (
        <View style={styles.autoplayOverlay}>
          <Text style={styles.autoplayTitle}>Autoplay is on</Text>
          <Text style={styles.autoplayDesc}>
            Up Next: {recommended[0]?.title || 'Next Video'}
          </Text>
          <Text style={styles.autoplayTimer}>Playing in {autoplayCountdown}s...</Text>
          
          <View style={styles.autoplayActions}>
            <TouchableOpacity style={styles.autoplayCancelBtn} onPress={cancelAutoplay}>
              <Text style={styles.autoplayCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.autoplayPlayBtn} onPress={playNextVideo}>
              <Text style={styles.autoplayPlayText}>Play Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Comments Drawer Modal */}
      <Modal visible={commentsVisible} animationType="slide" transparent onRequestClose={() => setCommentsVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setCommentsVisible(false)} />
          <View style={styles.commentsDrawer}>
            <CommentsSection
              videoId={video.id}
              videoOwnerId={video.user_id}
              videoTitle={video.title}
              onClose={() => setCommentsVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    lineHeight: 22,
  },
  viewsRow: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  actionBtnActive: {
    backgroundColor: 'rgba(255, 43, 66, 0.1)',
    borderColor: 'rgba(255, 43, 66, 0.3)',
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  creatorInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  subBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  subBtnText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
  subBtnTextActive: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  descPanel: {
    backgroundColor: COLORS.surface,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  descText: {
    color: '#DDDDDD',
    fontSize: 12,
    lineHeight: 18,
  },
  commentsPreviewCard: {
    backgroundColor: COLORS.surface,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentsPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsPreviewTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  commentsPreviewCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  latestCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  latestCommentAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
    backgroundColor: COLORS.background,
  },
  latestCommentText: {
    flex: 1,
    color: '#DDDDDD',
    fontSize: 11,
  },
  noCommentsPrompt: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  upNextTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  emptyRecText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
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
  autoplayOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: 'rgba(15,15,15,0.95)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    zIndex: 10,
    alignItems: 'center',
  },
  autoplayTitle: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  autoplayDesc: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  autoplayTimer: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 12,
  },
  autoplayActions: {
    flexDirection: 'row',
    gap: 12,
  },
  autoplayCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    justifyContent: 'center',
  },
  autoplayCancelText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  autoplayPlayBtn: {
    backgroundColor: COLORS.primary,
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    justifyContent: 'center',
  },
  autoplayPlayText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: 'bold',
  },
  minimizeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 36,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 15, 15, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
