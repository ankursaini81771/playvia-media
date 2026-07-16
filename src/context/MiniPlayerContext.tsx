import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'expo-router';

interface VideoItem {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  users?: {
    username: string;
    avatar_url: string;
  };
}

interface MiniPlayerContextType {
  activeVideo: VideoItem | null;
  isMinimized: boolean;
  isPlaying: boolean;
  playVideo: (video: VideoItem) => void;
  minimize: () => void;
  maximize: () => void;
  closePlayer: () => void;
  setPlaying: (playing: boolean) => void;
  setActiveVideo: (video: VideoItem | null) => void;
  setIsMinimized: (minimized: boolean) => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextType | undefined>(undefined);

export const MiniPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVideo = (video: VideoItem) => {
    setActiveVideo(video);
    setIsMinimized(false);
    setIsPlaying(true);
    router.push(`/video/${video.id}`);
  };

  const minimize = () => {
    if (activeVideo) {
      setIsMinimized(true);
    }
  };

  const maximize = () => {
    if (activeVideo) {
      setIsMinimized(false);
      router.push(`/video/${activeVideo.id}`);
    }
  };

  const closePlayer = () => {
    setActiveVideo(null);
    setIsMinimized(false);
    setIsPlaying(false);
  };

  const setPlaying = (playing: boolean) => {
    setIsPlaying(playing);
  };

  return (
    <MiniPlayerContext.Provider
      value={{
        activeVideo,
        isMinimized,
        isPlaying,
        playVideo,
        minimize,
        maximize,
        closePlayer,
        setPlaying,
        setActiveVideo,
        setIsMinimized,
      }}
    >
      {children}
    </MiniPlayerContext.Provider>
  );
};

export const useMiniPlayer = () => {
  const context = useContext(MiniPlayerContext);
  if (!context) {
    throw new Error('useMiniPlayer must be used within a MiniPlayerProvider');
  }
  return context;
};
