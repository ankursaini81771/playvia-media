import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Share, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { WebView } from 'react-native-webview';
import { Heart, MessageCircle, Share2, Plus, Check, Play, Volume2, VolumeX } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import Svg, { Rect } from 'react-native-svg';

const Pause = ({ size = 28, color = '#FFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="4" width="4" height="16" rx="1" fill={color} />
    <Rect x="15" y="4" width="4" height="16" rx="1" fill={color} />
  </Svg>
);

// Get viewport dimensions
const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// Helper to extract YouTube video ID
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

interface ShortVideoCardProps {
  video: any;
  isActive: boolean;
  onPressComment: (videoId: string) => void;
  cardHeight?: number;
}

export const ShortVideoCard: React.FC<ShortVideoCardProps> = ({ video, isActive, onPressComment, cardHeight }) => {
  const { user } = useAuth();
  const videoRef = useRef<Video>(null);
  
  // Interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingLocal, setIsPlayingLocal] = useState(true);
  const [showToggleFeedback, setShowToggleFeedback] = useState<'play' | 'pause' | null>(null);

  const handleTogglePlayPause = () => {
    const nextState = !isPlayingLocal;
    setIsPlayingLocal(nextState);
    setShowToggleFeedback(nextState ? 'play' : 'pause');
  };

  useEffect(() => {
    if (showToggleFeedback) {
      const timeout = setTimeout(() => {
        setShowToggleFeedback(null);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [showToggleFeedback]);

  const authorName = video.users?.username || 'PlayVia Creator';
  const authorAvatar = video.users?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';

  // Toggle active play state based on visibility
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isActive) {
      if (isPlayingLocal) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    } else {
      videoRef.current.pauseAsync();
      videoRef.current.setPositionAsync(0);
      setIsPlayingLocal(true); // Reset local state when swiped away!
    }
  }, [isActive, isPlayingLocal]);

  // Load interaction metrics on mount
  useEffect(() => {
    const fetchInteractions = async () => {
      if (!user) return;

      try {
        // 1. Get total likes for this short
        const { count: totalLikes } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('video_id', video.id);

        setLikeCount(totalLikes || 0);

        // 2. Check if current user liked this short
        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('video_id', video.id)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsLiked(!!userLike);

        // 3. Check subscription status
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('subscriber_id', user.id)
          .eq('channel_id', video.user_id)
          .maybeSingle();

        setIsSubscribed(!!sub);
      } catch (err) {
        console.warn('Error fetching short interactions', err);
      }
    };

    fetchInteractions();
  }, [video.id, user]);

  const handleLikeToggle = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        // Unlike
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        await supabase
          .from('likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', user.id);
      } else {
        // Like
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        await supabase
          .from('likes')
          .insert({ video_id: video.id, user_id: user.id });

        // Trigger Notification
        if (user.id !== video.user_id) {
          await supabase.from('notifications').insert({
            user_id: video.user_id, // recipient
            sender_id: user.id, // actor
            type: 'like',
            message: `${user.username} liked your Short: "${video.title}"`,
            video_id: video.id,
          });
        }
      }
    } catch (err) {
      console.warn('Error toggling short like', err);
    }
  };

  const handleSubscribeToggle = async () => {
    if (!user) return;

    try {
      if (isSubscribed) {
        setIsSubscribed(false);
        await supabase
          .from('subscriptions')
          .delete()
          .eq('subscriber_id', user.id)
          .eq('channel_id', video.user_id);
      } else {
        setIsSubscribed(true);
        await supabase
          .from('subscriptions')
          .insert({ subscriber_id: user.id, channel_id: video.user_id });

        // Trigger Notification
        if (user.id !== video.user_id) {
          await supabase.from('notifications').insert({
            user_id: video.user_id, // recipient
            sender_id: user.id, // actor
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
    try {
      await Share.share({
        message: `Check out this Short on PlayVia: ${video.title} \n${video.video_url}`,
      });
    } catch (err) {
      console.warn('Error sharing video', err);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(status.isBuffering);
    }
  };

  const youtubeVideoId = getYoutubeVideoId(video.video_url);

  return (
    <View style={[styles.container, cardHeight ? { height: cardHeight } : null]}>
      <TouchableOpacity 
        style={styles.touchArea}
        activeOpacity={1}
        onPress={handleTogglePlayPause}
      >
        {youtubeVideoId ? (
          <View style={StyleSheet.absoluteFill}>
            <WebView
              style={StyleSheet.absoluteFill}
              source={{ 
                uri: `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=${isActive ? 1 : 0}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&loop=1&playlist=${youtubeVideoId}` 
              }}
              allowsFullscreenVideo={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
            />
            {/* Mask overlays to hide watermarks in full screen vertical viewport */}
            <View style={styles.watermarkCover} />
            <View style={styles.topHeaderCover} />
          </View>
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: video.video_url }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isActive && isPlayingLocal}
            isLooping
            isMuted={isMuted}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        )}

        {/* Center Play/Pause Tap Overlay Feedback */}
        {showToggleFeedback && (
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackCircle}>
              {showToggleFeedback === 'play' ? (
                <Play size={28} color={COLORS.white} fill={COLORS.white} />
              ) : (
                <Pause size={28} color={COLORS.white} />
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Floating Volume / Mute Toggle Button */}
      <TouchableOpacity 
        style={styles.volumeBtn} 
        onPress={() => setIsMuted(!isMuted)}
      >
        {isMuted ? (
          <VolumeX size={18} color={COLORS.white} />
        ) : (
          <Volume2 size={18} color={COLORS.white} />
        )}
      </TouchableOpacity>


      {/* Buffering Indicator */}
      {isActive && isLoading && (
        <View style={styles.loadingContainer} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* Muted Indicator Overlay */}
      {isMuted && (
        <View style={styles.muteOverlay}>
          <Text style={styles.muteText}>Muted</Text>
        </View>
      )}

      {/* Bottom Information Overlay */}
      <View style={styles.bottomOverlay}>
        <View style={styles.creatorRow}>
          <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          <Text style={styles.username}>@{authorName}</Text>
          
          {user?.id !== video.user_id && (
            <TouchableOpacity 
              style={[styles.subButton, isSubscribed && styles.subButtonActive]}
              onPress={handleSubscribeToggle}
            >
              {isSubscribed ? (
                <Check size={14} color={COLORS.white} />
              ) : (
                <Text style={styles.subButtonText}>Subscribe</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        
        {video.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {video.description}
          </Text>
        ) : null}
      </View>

      {/* Right Side Buttons Overlay */}
      <View style={styles.rightOverlay}>
        {/* Like Button */}
        <TouchableOpacity style={styles.rightButton} onPress={handleLikeToggle}>
          <View style={[styles.iconWrapper, isLiked && styles.likedWrapper]}>
            <Heart size={26} color={isLiked ? COLORS.primary : COLORS.white} fill={isLiked ? COLORS.primary : 'none'} />
          </View>
          <Text style={styles.buttonLabel}>{likeCount}</Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity style={styles.rightButton} onPress={() => onPressComment(video.id)}>
          <View style={styles.iconWrapper}>
            <MessageCircle size={26} color={COLORS.white} />
          </View>
          <Text style={styles.buttonLabel}>Comments</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.rightButton} onPress={handleShare}>
          <View style={styles.iconWrapper}>
            <Share2 size={26} color={COLORS.white} />
          </View>
          <Text style={styles.buttonLabel}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT - 60, // Subtract bottom tab bar height (60px)
    backgroundColor: COLORS.black,
    position: 'relative',
  },
  touchArea: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  muteOverlay: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 5,
  },
  muteText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 80, // Leave room for right actions
    zIndex: 2,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    marginRight: 10,
  },
  username: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  subButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  subButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  title: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rightOverlay: {
    position: 'absolute',
    bottom: 40,
    right: 12,
    alignItems: 'center',
    zIndex: 2,
  },
  rightButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  likedWrapper: {
    borderColor: 'rgba(255, 43, 66, 0.2)',
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  watermarkCover: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 65,
    height: 40,
    backgroundColor: '#000000',
    zIndex: 99,
    pointerEvents: 'none',
  },
  topHeaderCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#000000',
    zIndex: 99,
    pointerEvents: 'none',
  },
  feedbackContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  feedbackCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
