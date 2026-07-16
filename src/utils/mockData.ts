// Mock Seed Data for PlayVia
// Loaded automatically when the Supabase database has no videos or shorts uploaded yet.

import { VideoItem } from '../components/VideoCard';

export const MOCK_VIDEOS: VideoItem[] = [
  {
    id: 'mock-vid-1',
    title: 'Top 10 Secret Gaming Tips for Pro Players (2026)',
    description: 'Unlock your true gaming potential with these 10 pro tips. We cover movement mechanics, crosshair placement, and mindset tricks that will level up your rank in any competitive shooter.',
    thumbnail_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Gaming',
    views: 45200,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    type: 'video',
    users: {
      username: 'ApexGamer',
      avatar_url: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=100&auto=format&fit=crop',
    },
  },
  {
    id: 'mock-vid-2',
    title: 'Is this the Future of Smart Devices? (Hands-On)',
    description: 'We review the latest holographic wearable smart devices. Check out our detailed breakdown of the hardware specs, display clarity, gesture inputs, and battery performance.',
    thumbnail_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'Tech',
    views: 128000,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    type: 'video',
    users: {
      username: 'TechVibe',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
    },
  },
  {
    id: 'mock-vid-3',
    title: 'A Day in Tokyo: Exploring Shibuya & Akihabara',
    description: 'Join us as we explore the bustling streets of Tokyo! We check out the famous Shibuya Crossing, eat delicious street food, and browse the anime shops in Akihabara. Subscribe for more travel vlogs!',
    thumbnail_url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'Vlogs',
    views: 8900,
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    type: 'video',
    users: {
      username: 'WanderlustVlogs',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
    },
  },
  {
    id: 'mock-vid-4',
    title: 'Slick Bass & Lo-Fi Beats for Coding / Studying',
    description: 'Grab a cup of coffee and relax to these smooth lo-fi beats. Perfect background music for coding, studying, writing, or just chilling out on a rainy day.',
    thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'Music',
    views: 254000,
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(), // 1 week ago
    type: 'video',
    users: {
      username: 'BeatChaser',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop',
    },
  },
  {
    id: 'mock-vid-5',
    title: 'Every Tech YouTuber Ever (Comedy Parody)',
    description: 'An over-the-top parody mocking all the tech reviewer cliches. Cinematic transitions, talking about the color "Space Grey", and unboxing boxes with dramatic sound effects.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'Comedy',
    views: 67100,
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), // 10 days ago
    type: 'video',
    users: {
      username: 'SiliconLaughs',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop',
    },
  }
];

export const MOCK_SHORTS = [
  {
    id: 'mock-short-1',
    user_id: 'mock-creator-1',
    title: 'Neon city vibes 🌃 #future #aesthetic',
    description: 'Exploring the neon lights of Shibuya in vertical mode.',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-futuristic-city-38999-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop',
    category: 'Vlogs',
    views: 120500,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'short',
    users: {
      username: 'CyberVlogger',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
    },
  },
  {
    id: 'mock-short-2',
    user_id: 'mock-creator-2',
    title: 'Breaking it down under the neon! 🕺 #dance #neon',
    description: 'Impromptu street dancing under neon spotlights.',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-40011-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop',
    category: 'Music',
    views: 450000,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    type: 'short',
    users: {
      username: 'NeonStepper',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop',
    },
  },
  {
    id: 'mock-short-3',
    user_id: 'mock-creator-3',
    title: 'Nature is healing... Check this waterfall! 🌲✨',
    description: 'Finding this hidden waterfall deep in the Pacific Northwest forests.',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-video-of-a-beautiful-waterfall-in-a-forest-43015-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&auto=format&fit=crop',
    category: 'Vlogs',
    views: 74200,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    type: 'short',
    users: {
      username: 'EcoExplorer',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop',
    },
  }
];
