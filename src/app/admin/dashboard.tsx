import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Video, Film, Check, X, Award } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { supabase } from '../../services/supabase';
import { StatusBar } from 'expo-status-bar';

interface AdminStats {
  totalUsers: number;
  totalVideos: number;
  totalAds: number;
  totalEarnings: number;
}

interface AdCampaign {
  id: string;
  advertiser_id: string;
  ad_type: string;
  media_url: string;
  target_category: string;
  budget: number;
  status: string;
  impressions: number;
  clicks: number;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalVideos: 0, totalAds: 0, totalEarnings: 0 });
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Load overall metrics & pending campaigns
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch total users count
      const { count: usersCount, error: usersErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        
      // 2. Fetch total videos count
      const { count: videosCount, error: videosErr } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      // 3. Fetch all ads
      const { data: adsData, error: adsErr } = await supabase
        .from('ads')
        .select('*');

      if (usersErr || videosErr || adsErr) {
        throw new Error(usersErr?.message || videosErr?.message || adsErr?.message);
      }

      // Calculate stats
      const totalUsers = usersCount || 0;
      const totalVideos = videosCount || 0;
      const totalAds = adsData?.length || 0;
      const totalEarnings = adsData
        ? adsData.reduce((sum: number, ad: any) => sum + (ad.status === 'active' ? ad.budget : 0), 0)
        : 0;

      setStats({ totalUsers, totalVideos, totalAds, totalEarnings });

      // Filter pending/paused campaigns for review queue
      const pendingAds = adsData 
        ? adsData.filter((ad: any) => ad.status === 'paused' || ad.status === 'pending')
        : [];
      setCampaigns(pendingAds);

    } catch (err: any) {
      console.warn('Failed to load admin stats', err);
      Alert.alert('Error', 'Failed to retrieve admin control metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateAdStatus = async (adId: string, newStatus: 'active' | 'rejected') => {
    setApprovingId(adId);
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: newStatus })
        .eq('id', adId);

      if (error) throw error;

      Alert.alert(
        'Success', 
        `Campaign status updated to ${newStatus}!`,
        [{ text: 'OK', onPress: () => loadData() }]
      );
    } catch (err: any) {
      console.warn('Ad update failed', err);
      Alert.alert('Update Failed', err.message || 'Could not update campaign status.');
    } finally {
      setApprovingId(null);
    }
  };

  const renderAdReviewItem = ({ item }: { item: AdCampaign }) => {
    return (
      <View style={styles.campaignCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.categoryBadge}>{item.target_category.toUpperCase()}</Text>
          <Text style={styles.adBudget}>₹{item.budget}</Text>
        </View>

        <Text style={styles.advertiserId} numberOfLines={1}>
          Advertiser: {item.advertiser_id}
        </Text>

        <Text style={styles.adDetails}>
          Type: {item.ad_type === 'banner' ? 'Banner overlay' : 'Video insert'}
        </Text>

        <Image source={{ uri: item.media_url }} style={styles.adThumbnail} />

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]} 
            onPress={() => handleUpdateAdStatus(item.id, 'active')}
            disabled={approvingId !== null}
          >
            <Check size={16} color={COLORS.black} style={{ marginRight: 6 }} />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={() => handleUpdateAdStatus(item.id, 'rejected')}
            disabled={approvingId !== null}
          >
            <X size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <User size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={styles.statBox}>
            <Video size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.totalVideos}</Text>
            <Text style={styles.statLabel}>Total Videos</Text>
          </View>

          <View style={styles.statBox}>
            <Film size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.totalAds}</Text>
            <Text style={styles.statLabel}>Total Campaigns</Text>
          </View>

          <View style={styles.statBox}>
            <Award size={24} color="#EC4899" />
            <Text style={styles.statValue}>₹{stats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Ad Approvals Queue */}
        <Text style={styles.queueHeader}>Campaign Approval Queue ({campaigns.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : campaigns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Check size={40} color={COLORS.success} />
            <Text style={styles.emptyText}>All campaigns reviewed. Queue is empty!</Text>
          </View>
        ) : (
          <FlatList
            data={campaigns}
            renderItem={renderAdReviewItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#0A0E1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2235',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface || '#1A2235',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border || '#208AEF33',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary || '#64748B',
  },
  queueHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  campaignCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3748',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#1E293B',
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adBudget: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 15,
  },
  advertiserId: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  adDetails: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  adThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: COLORS.primary,
  },
  approveBtnText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 12,
  },
  rejectBtn: {
    backgroundColor: COLORS.danger || '#EF4444',
  },
  rejectBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
