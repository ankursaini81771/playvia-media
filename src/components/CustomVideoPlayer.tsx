import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { WebView } from 'react-native-webview';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

// Helper to extract YouTube video ID
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

interface CustomVideoPlayerProps {
  videoUrl: string;
  category: string;
  onVideoEnd?: () => void;
}

interface AdCampaign {
  id: string;
  media_url: string;
  budget: number;
  impressions: number;
  clicks: number;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ videoUrl, category, onVideoEnd }) => {
  const { user } = useAuth();
  const videoRef = useRef<Video>(null);
  
  // Ad states
  const [isAd, setIsAd] = useState(false);
  const [adData, setAdData] = useState<AdCampaign | null>(null);
  const [adCountdown, setAdCountdown] = useState(5);
  const [canSkipAd, setCanSkipAd] = useState(false);
  const [adImpressionLogged, setAdImpressionLogged] = useState(false);

  // Playback states
  const [sourceUrl, setSourceUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check premium and decide to play Ad or Video
  useEffect(() => {
    const initializePlayer = async () => {
      setIsLoading(true);
      
      const hasPremium = user?.is_premium || false;
      
      if (!hasPremium) {
        // Try fetching active category ad, fallback to general ad
        try {
          const { data: ads, error } = await supabase
            .from('ads')
            .select('*')
            .eq('ad_type', 'pre-roll')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          if (!error && ads && ads.length > 0) {
            // Find category matching ad or pick the first one
            const matchedAd = ads.find((a: any) => a.target_category === category) || ads[0];
            setAdData(matchedAd);
            setSourceUrl(matchedAd.media_url);
            setIsAd(true);
            setAdCountdown(5);
            setCanSkipAd(false);
            setAdImpressionLogged(false);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Error loading pre-roll ad, playing video directly', err);
        }

        // Hardcoded Fallback Ad (For testing pre-roll ads if DB is empty)
        const fallbackAdUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
        setAdData({
          id: 'fallback-ad-uuid',
          media_url: fallbackAdUrl,
          budget: 100,
          impressions: 0,
          clicks: 0,
        });
        setSourceUrl(fallbackAdUrl);
        setIsAd(true);
        setAdCountdown(5);
        setCanSkipAd(false);
        setIsLoading(false);
      } else {
        // Premium user -> play actual video immediately
        setIsAd(false);
        setSourceUrl(videoUrl);
        setIsLoading(false);
      }
    };

    initializePlayer();
  }, [videoUrl, user?.is_premium, category]);

  // Handle ad impression tracking
  const logAdImpression = async (adId: string) => {
    if (adImpressionLogged || adId === 'fallback-ad-uuid') return;
    setAdImpressionLogged(true);
    try {
      // Fetch current impressions
      const { data } = await supabase.from('ads').select('impressions').eq('id', adId).single();
      const currentImpressions = data?.impressions || 0;
      
      // Update impressions count
      await supabase
        .from('ads')
        .update({ impressions: currentImpressions + 1 })
        .eq('id', adId);
    } catch (err) {
      console.warn('Failed to log ad impression', err);
    }
  };

  // Handle ad countdown timer
  useEffect(() => {
    if (!isAd || isLoading) return;

    const timer = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkipAd(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAd, isLoading]);

  // Skip the Ad and load the main video
  const handleSkipAd = () => {
    setIsAd(false);
    setIsLoading(true);
    setSourceUrl(videoUrl);
    setIsPlaying(true);
  };

  // Listen to video playback updates
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Video error:', status.error);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setIsLoading(status.isBuffering);

    // If ad is playing, log impression once it starts
    if (isAd && status.isPlaying && adData) {
      logAdImpression(adData.id);
    }

    // Handle end of video
    if (status.didJustFinish) {
      if (isAd) {
        // If ad finishes, automatically start the main video
        handleSkipAd();
      } else {
        // Main video finished -> invoke callback
        if (onVideoEnd) {
          onVideoEnd();
        }
      }
    }
  };

  const youtubeVideoId = !isAd ? getYoutubeVideoId(sourceUrl) : null;

  return (
    <View style={styles.container}>
      {sourceUrl ? (
        youtubeVideoId ? (
          <View style={styles.video}>
            <WebView
              style={StyleSheet.absoluteFill}
              source={{ 
                uri: `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1` 
              }}
              allowsFullscreenVideo={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
            />
            {/* Absolute Overlays to hide YouTube Logo & Title header */}
            <View style={styles.watermarkCover} />
            <View style={styles.topHeaderCover} />
          </View>
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: sourceUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={true}
            useNativeControls={!isAd} // Disable controls for ads so they cannot be scrubbed!
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        )
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* Custom Ad Overlay */}
      {isAd && !isLoading && (
        <View style={styles.adOverlay}>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>Ad</Text>
          </View>
          
          <Text style={styles.adTitleText}>
            Video will play after ad
          </Text>

          <TouchableOpacity
            style={[styles.skipButton, !canSkipAd && styles.skipButtonDisabled]}
            disabled={!canSkipAd}
            onPress={handleSkipAd}
          >
            <Text style={styles.skipButtonText}>
              {canSkipAd ? 'Skip Ad' : `Skip in ${adCountdown}s`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkCover: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 65,
    height: 40,
    backgroundColor: '#000000',
    zIndex: 99,
    pointerEvents: 'none', // Allows touches to pass through if they hit this area
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  adBadge: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  adBadgeText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: 'bold',
  },
  adTitleText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  skipButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skipButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
