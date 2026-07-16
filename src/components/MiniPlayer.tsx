import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useMiniPlayer } from '../context/MiniPlayerContext';
import { Play, X } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import Svg, { Rect } from 'react-native-svg';

const Pause = ({ size = 18, color = '#FFF', fill }: { size?: number; color?: string; fill?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="4" width="4" height="16" rx="1" fill={color} />
    <Rect x="15" y="4" width="4" height="16" rx="1" fill={color} />
  </Svg>
);

const WINDOW_WIDTH = Dimensions.get('window').width;

export const MiniPlayer: React.FC = () => {
  const { activeVideo, isMinimized, isPlaying, maximize, closePlayer, setPlaying } = useMiniPlayer();

  if (!activeVideo || !isMinimized) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cardPress} onPress={maximize} activeOpacity={0.9}>
        {/* Left: Thumbnail */}
        <Image source={{ uri: activeVideo.thumbnail_url }} style={styles.thumbnail} />

        {/* Center: Details */}
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>
            {activeVideo.title}
          </Text>
          <Text style={styles.creator} numberOfLines={1}>
            {activeVideo.users?.username || 'PlayVia Creator'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Right: Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setPlaying(!isPlaying)}>
          {isPlaying ? (
            <Pause size={18} color={COLORS.white} fill={COLORS.white} />
          ) : (
            <Play size={18} color={COLORS.white} fill={COLORS.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={closePlayer}>
          <X size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60, // Sits right above the bottom tab navigation bar
    left: 12,
    right: 12,
    height: 56,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 9999, // Layer on top of everything!
  },
  cardPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  thumbnail: {
    width: 64,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  details: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
    paddingRight: 8,
  },
  title: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  creator: {
    color: COLORS.textSecondary || '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
