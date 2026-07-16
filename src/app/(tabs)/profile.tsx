import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Award, Crown, Edit2, LogOut, Settings, Speaker, User as UserIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { PremiumModal } from '../../components/PremiumModal';
import { VideoCard } from '../../components/VideoCard';
import { supabase } from '../../services/supabase';
import { formatViews } from '../../utils/format';


const { width: WINDOW_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen configuration states
  const [activeTab, setActiveTab] = useState<'videos' | 'shorts' | 'about'>('videos');
  const [loadingContent, setLoadingContent] = useState(true);
  const [myVideos, setMyVideos] = useState<any[]>([]);
  const [myShorts, setMyShorts] = useState<any[]>([]);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [totalViewsCount, setTotalViewsCount] = useState(0);
  
  // Premium and editor states
  const [premiumVisible, setPremiumVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchProfileStatsAndContent = async () => {
    if (!user) return;
    setLoadingContent(true);

    try {
      // 1. Fetch total subscribers
      const { count: subs } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', user.id);

      setSubscribersCount(subs || 0);

      // 2. Fetch all user uploads
      const { data: uploads, error: uploadsError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id);

      if (uploadsError) throw uploadsError;

      const vids = (uploads || []).filter((u) => u.type === 'video');
      const shrts = (uploads || []).filter((u) => u.type === 'short');
      
      setMyVideos(vids);
      setMyShorts(shrts);

      // Calculate total views
      const views = (uploads || []).reduce((acc, curr) => acc + (curr.views || 0), 0);
      setTotalViewsCount(views);
    } catch (err) {
      console.warn('Error loading profile content', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const [seedingDB, setSeedingDB] = useState(false);

  const handleSeedDemoData = async () => {
    if (!user) return;
    setSeedingDB(true);
    try {
      const videosToSeed = [
        {
          user_id: user.id,
          title: 'Top 10 Secret Gaming Tips for Pro Players (2026)',
          description: 'Unlock your true gaming potential with these 10 pro tips. We cover movement mechanics, crosshair placement, and mindset tricks.',
          thumbnail_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          category: 'Gaming',
          views: 45200,
          type: 'video',
        },
        {
          user_id: user.id,
          title: 'Is this the Future of Smart Devices? (Hands-On)',
          description: 'We review the latest holographic wearable smart devices. Check out our detailed breakdown of the hardware specs.',
          thumbnail_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          category: 'Tech',
          views: 128000,
          type: 'video',
        },
        {
          user_id: user.id,
          title: 'A Day in Tokyo: Exploring Shibuya & Akihabara',
          description: 'Join us as we explore the bustling streets of Tokyo! We check out the famous Shibuya Crossing, eat delicious street food.',
          thumbnail_url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          category: 'Vlogs',
          views: 8900,
          type: 'video',
        }
      ];

      const shortsToSeed = [
        {
          user_id: user.id,
          title: 'Neon city vibes 🌃 #future #aesthetic',
          description: 'Exploring the neon lights of Shibuya in vertical mode.',
          video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-futuristic-city-38999-large.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop',
          category: 'Vlogs',
          views: 120500,
          type: 'short',
        },
        {
          user_id: user.id,
          title: 'Breaking it down under the neon! 🕺 #dance #neon',
          description: 'Impromptu street dancing under neon spotlights.',
          video_url: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-40011-large.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop',
          category: 'Music',
          views: 450000,
          type: 'short',
        }
      ];

      const { error: videoError } = await supabase.from('videos').insert([...videosToSeed, ...shortsToSeed]);
      if (videoError) throw videoError;

      const adToSeed = {
        advertiser_id: user.id,
        ad_type: 'banner',
        media_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop',
        target_category: 'Tech',
        budget: 1500.0,
        status: 'active',
        impressions: 5,
        clicks: 1,
      };

      const preRollAdToSeed = {
        advertiser_id: user.id,
        ad_type: 'pre-roll',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        target_category: 'Gaming',
        budget: 2000.0,
        status: 'active',
        impressions: 3,
        clicks: 0,
      };

      await supabase.from('ads').insert([adToSeed, preRollAdToSeed]);

      Alert.alert('Success', 'Seeded your database with high-quality demo content!', [
        { text: 'Awesome', onPress: fetchProfileStatsAndContent }
      ]);
    } catch (err: any) {
      Alert.alert('Failed to Seed', err.message || 'Check database permissions/schema connection.');
    } finally {
      setSeedingDB(false);
    }
  };

  useEffect(() => {
    fetchProfileStatsAndContent();
  }, [user]);

  const handleEditProfile = () => {
    if (!user) return;
    setEditUsername(user.username);
    setEditAvatarUrl(user.avatar_url);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }

    setSavingProfile(true);
    const { error } = await updateProfile({
      username: editUsername.trim(),
      avatar_url: editAvatarUrl.trim(),
    });
    setSavingProfile(false);

    if (error) {
      Alert.alert('Failed to Update', error.message);
    } else {
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          const { error } = await signOut();
          if (!error) {
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };

  const renderShortItem = ({ item }: { item: any }) => {
    const colWidth = (WINDOW_WIDTH - 32) / 3;
    return (
      <TouchableOpacity 
        style={[styles.shortItemCard, { width: colWidth }]}
        onPress={() => router.push('/(tabs)/shorts')}
      >
        <Image source={{ uri: item.thumbnail_url }} style={styles.shortThumb} />
        <View style={styles.shortMetricOverlay}>
          <Text style={styles.shortMetricText}>{formatViews(item.views)}</Text>
        </View>
        <Text style={styles.shortTitleText} numberOfLines={1}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Settings / Logout controls */}
      <View style={[styles.headerControls, { paddingTop: insets.top || 16 }]}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleEditProfile}>
          <Edit2 size={20} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleLogout}>
          <LogOut size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* User Header Details */}
      <View style={styles.userHeader}>
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        
        <View style={styles.usernameRow}>
          <Text style={styles.displayName}>{user.username}</Text>
          {user.is_premium && (
            <View style={styles.premiumBadge}>
              <Crown size={14} color={COLORS.black} fill={COLORS.black} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.emailText}>{user.email}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{subscribersCount}</Text>
            <Text style={styles.statLabel}>Subscribers</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{myVideos.length + myShorts.length}</Text>
            <Text style={styles.statLabel}>Uploads</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{formatViews(totalViewsCount).split(' ')[0]}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
        </View>
      </View>

      {/* Profile Editor Screen Component */}
      {isEditing && (
        <View style={styles.editorPanel}>
          <Text style={styles.editorTitle}>Edit Profile Settings</Text>
          
          <Text style={styles.editorLabel}>Username:</Text>
          <View style={styles.editorInputContainer}>
            <UserIcon size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Username"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.editorInput}
            />
          </View>

          <Text style={styles.editorLabel}>Avatar Image URL:</Text>
          <View style={styles.editorInputContainer}>
            <TextInput
              value={editAvatarUrl}
              onChangeText={setEditAvatarUrl}
              placeholder="https://example.com/avatar.jpg"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.editorInput}
            />
          </View>

          <View style={styles.editorActionRow}>
            <TouchableOpacity 
              style={[styles.editorBtn, styles.editorBtnCancel]}
              onPress={() => setIsEditing(false)}
              disabled={savingProfile}
            >
              <Text style={styles.editorBtnTextCancel}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.editorBtn, styles.editorBtnSave]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator size="small" color={COLORS.black} />
              ) : (
                <Text style={styles.editorBtnTextSave}>Save Updates</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Advertiser CTA - Run an Ad */}
      <TouchableOpacity 
        style={styles.adDashboardBtn}
        onPress={() => router.push('/advertiser/dashboard')}
      >
        <Speaker size={18} color={COLORS.white} style={{ marginRight: 8 }} />
        <Text style={styles.adDashboardText}>Advertiser Center: Run an Ad</Text>
      </TouchableOpacity>

      {/* PlayVia Premium CTA Banner */}
      {!user.is_premium && (
        <TouchableOpacity 
          style={styles.premiumBanner} 
          onPress={() => setPremiumVisible(true)}
          activeOpacity={0.9}
        >
          <View style={styles.premiumTextCol}>
            <View style={styles.premiumRow}>
              <Crown size={16} color={COLORS.premium} fill={COLORS.premium} style={{ marginRight: 6 }} />
              <Text style={styles.premiumBannerTitle}>Get PlayVia Premium</Text>
            </View>
            <Text style={styles.premiumBannerDesc}>Remove all pre-rolls and banners. Unlock exclusive badge.</Text>
          </View>
          <View style={styles.premiumBtn}>
            <Text style={styles.premiumBtnText}>JOIN</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Profile Navigation Tabs */}
      <View style={styles.tabsRow}>
        {(['videos', 'shorts', 'about'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Renderers */}
      {loadingContent ? (
        <View style={styles.centerContainerLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : activeTab === 'videos' ? (
        <View style={styles.tabContent}>
          {myVideos.length === 0 ? (
            <Text style={styles.noContentText}>You haven't uploaded any videos yet.</Text>
          ) : (
            myVideos.map((video) => (
              <VideoCard key={video.id} video={{ ...video, users: { username: user.username, avatar_url: user.avatar_url } }} />
            ))
          )}
        </View>
      ) : activeTab === 'shorts' ? (
        <View style={styles.tabContent}>
          {myShorts.length === 0 ? (
            <Text style={styles.noContentText}>You haven't uploaded any Shorts yet.</Text>
          ) : (
            <FlatList
              data={myShorts}
              renderItem={renderShortItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.shortsGridWrapper}
            />
          )}
        </View>
      ) : (
        <View style={styles.aboutPanel}>
          <Text style={styles.aboutHeader}>About Creator</Text>
          <Text style={styles.aboutBody}>
            Email: <Text style={{ color: COLORS.white }}>{user.email}</Text>
          </Text>
          <Text style={styles.aboutBody}>
            Member Since: <Text style={{ color: COLORS.white }}>{new Date(user.created_at).toLocaleDateString()}</Text>
          </Text>
          <Text style={styles.aboutBody}>
            Account Type: <Text style={{ color: user.is_premium ? COLORS.premium : COLORS.textSecondary, fontWeight: 'bold' }}>
              {user.is_premium ? 'PlayVia Premium Member' : 'Standard Ad-Supported User'}
            </Text>
          </Text>
          <Text style={styles.aboutBody}>
            Verified Channel: <Text style={{ color: COLORS.success, fontWeight: 'bold' }}>Active status</Text>
          </Text>
          <TouchableOpacity 
            style={styles.seedBtn} 
            onPress={handleSeedDemoData}
            disabled={seedingDB}
          >
            {seedingDB ? (
              <ActivityIndicator size="small" color={COLORS.black} />
            ) : (
              <Text style={styles.seedBtnText}>Seed Channel with Demo Content</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Upgrade paywall overlay */}
      <PremiumModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />

      {/* App Links & Legal Section */}
      <View style={styles.legalSection}>
        {user.email === 'ankursaini81771@gmail.com' && (
          <TouchableOpacity 
            style={[styles.legalBtn, styles.adminBtn]} 
            onPress={() => router.push('/admin/dashboard')}
          >
            <Crown size={14} color={COLORS.black} style={{ marginRight: 6 }} />
            <Text style={styles.adminBtnText}>Admin Dashboard</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.legalRow}>
          <TouchableOpacity style={styles.legalLink} onPress={() => router.push('/privacy')}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>|</Text>
          <TouchableOpacity style={styles.legalLink} onPress={() => router.push('/terms')}>
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  controlBtn: {
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  userHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 14,
    backgroundColor: COLORS.surface,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.premium,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 3,
  },
  emailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#333333',
  },
  adDashboardBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adDashboardText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
  premiumBanner: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1.5,
    borderColor: COLORS.premium,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumTextCol: {
    flex: 1,
    marginRight: 10,
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  premiumBannerTitle: {
    color: COLORS.premium,
    fontWeight: 'bold',
    fontSize: 14,
  },
  premiumBannerDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  premiumBtn: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumBtnText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 11,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  noContentText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 40,
  },
  shortsGridWrapper: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  shortItemCard: {
    aspectRatio: 9 / 16,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: 8,
    position: 'relative',
  },
  shortThumb: {
    width: '100%',
    height: '100%',
  },
  shortMetricOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shortMetricText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
  },
  shortTitleText: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  centerContainerLoading: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutPanel: {
    padding: 20,
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aboutHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  aboutBody: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  seedBtn: {
    backgroundColor: COLORS.primary,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  seedBtnText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
  editorPanel: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editorTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  editorLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  editorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  editorInput: {
    color: COLORS.white,
    fontSize: 13,
    flex: 1,
    height: '100%',
  },
  editorActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  editorBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorBtnCancel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  editorBtnSave: {
    backgroundColor: COLORS.primary,
  },
  editorBtnTextCancel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  editorBtnTextSave: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
  legalSection: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  legalBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  adminBtn: {
    backgroundColor: COLORS.primary || '#208AEF',
  },
  adminBtnText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 13,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  legalLink: {
    paddingVertical: 6,
  },
  legalLinkText: {
    color: COLORS.textSecondary || '#64748B',
    fontSize: 12,
  },
  legalDivider: {
    color: '#333333',
    fontSize: 12,
  },
});
