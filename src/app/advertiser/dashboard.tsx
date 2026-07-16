import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BarChart2, Plus, DollarSign, Eye, MousePointer, Image as ImageIcon, Video, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useRazorpay } from '../../hooks/useRazorpay';
import { supabase } from '../../services/supabase';


// Preset sample files for quick campaign seeding
const SAMPLE_AD_PRESETS = [
  {
    name: 'Tech Banner Ad (fallback)',
    type: 'banner' as const,
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop',
    target: 'Tech',
  },
  {
    name: 'Gaming Pre-roll video',
    type: 'pre-roll' as const,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    target: 'Gaming',
  },
];

export default function AdvertiserDashboardScreen() {
  const { user } = useAuth();
  const { startAdCampaignPayment, processing: paymentProcessing } = useRazorpay();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Campaign data states
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New campaign form states
  const [adType, setAdType] = useState<'pre-roll' | 'banner'>('pre-roll');
  const [mediaUrl, setMediaUrl] = useState('');
  const [targetCategory, setTargetCategory] = useState('Tech');
  const [budget, setBudget] = useState('1500'); // Default ₹1500
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('advertiser_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.warn('Failed to load advertiser campaigns', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const selectPresetAd = (index: number) => {
    const preset = SAMPLE_AD_PRESETS[index];
    setMediaUrl(preset.url);
    setAdType(preset.type);
    setTargetCategory(preset.target);
    setSelectedPresetIndex(index);
  };

  const handleCreateCampaign = async () => {
    if (!user) return;

    if (!mediaUrl.trim()) {
      Alert.alert('Error', 'Please configure your ad media source URL.');
      return;
    }

    const budgetVal = parseFloat(budget);
    if (isNaN(budgetVal) || budgetVal <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount.');
      return;
    }

    try {
      // 1. Insert ad draft with pending status
      const { data: newAd, error: insertError } = await supabase
        .from('ads')
        .insert({
          advertiser_id: user.id,
          ad_type: adType,
          media_url: mediaUrl.trim(),
          target_category: targetCategory,
          budget: budgetVal,
          status: 'paused', // Draft starts paused until paid!
          impressions: 0,
          clicks: 0,
        })
        .select()
        .single();

      if (insertError || !newAd) {
        throw insertError || new Error('Failed to retrieve newly created campaign.');
      }

      // 2. Trigger simulated Razorpay checkout sheet for ad payment
      const paymentResult = await startAdCampaignPayment(budgetVal, newAd.id);

      if (paymentResult.success) {
        Alert.alert('Campaign Active!', 'Payment verified. Your ad is now active in PlayVia feed pools.', [
          {
            text: 'Great',
            onPress: () => {
              // Reset form & reload
              setShowCreateForm(false);
              setMediaUrl('');
              setSelectedPresetIndex(null);
              fetchCampaigns();
            },
          },
        ]);
      } else {
        // Payment failed/cancelled
        Alert.alert('Payment Cancelled', 'The campaign remains as a paused draft. You can complete payment later.');
        setShowCreateForm(false);
        fetchCampaigns();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create campaign');
    }
  };

  // Aggregated analytics values
  const getAggregatedStats = () => {
    const active = campaigns.filter((c) => c.status === 'active').length;
    const totalImpressions = campaigns.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const totalClicks = campaigns.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    const totalBudgetSpent = campaigns.reduce((acc, curr) => {
      // Spent is calculated as a portion of impressions (e.g. ₹0.50 per impression, capped at budget)
      const cost = Math.min(curr.budget, (curr.impressions || 0) * 0.50);
      return acc + cost;
    }, 0);

    return { active, totalImpressions, totalClicks, totalBudgetSpent };
  };

  const stats = getAggregatedStats();

  const renderCampaignCard = ({ item }: { item: any }) => {
    const isBanner = item.ad_type === 'banner';
    const spent = Math.min(item.budget, (item.impressions || 0) * 0.50).toFixed(2);
    
    // CTR Calculation
    const ctr = item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(1) : '0.0';

    return (
      <View style={styles.campaignCard}>
        <View style={styles.cardHeader}>
          <View style={styles.mediaTypeRow}>
            {isBanner ? <ImageIcon size={14} color={COLORS.white} /> : <Video size={14} color={COLORS.white} />}
            <Text style={styles.mediaTypeText}>{item.ad_type.toUpperCase()}</Text>
          </View>

          <View style={[styles.statusIndicator, item.status === 'active' ? styles.statusActive : styles.statusPaused]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.cardUrl} numberOfLines={1}>
          Source: {item.media_url}
        </Text>

        <View style={styles.cardMetricsGrid}>
          <View style={styles.metricCell}>
            <Text style={styles.metricCellLabel}>Impressions</Text>
            <Text style={styles.metricCellValue}>{item.impressions || 0}</Text>
          </View>
          
          <View style={styles.metricCell}>
            <Text style={styles.metricCellLabel}>Clicks (CTR)</Text>
            <Text style={styles.metricCellValue}>
              {item.clicks || 0} <Text style={styles.ctrLabel}>({ctr}%)</Text>
            </Text>
          </View>

          <View style={styles.metricCell}>
            <Text style={styles.metricCellLabel}>Spent / Budget</Text>
            <Text style={styles.metricCellValue}>
              ₹{spent} <Text style={styles.budgetLabel}>/ ₹{item.budget}</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.targetLabel}>Target: Category {item.target_category || 'All'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={paymentProcessing}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Advertiser Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Metric Cards Row */}
        <View style={styles.dashboardSummary}>
          <Text style={styles.summaryTitle}>Campaign Summary</Text>
          
          <View style={styles.metricsRow}>
            <View style={styles.summaryCard}>
              <BarChart2 size={18} color={COLORS.primary} />
              <Text style={styles.summaryValue}>{stats.active}</Text>
              <Text style={styles.summaryLabel}>Active Ads</Text>
            </View>

            <View style={styles.summaryCard}>
              <Eye size={18} color="#007AFF" />
              <Text style={styles.summaryValue}>{stats.totalImpressions}</Text>
              <Text style={styles.summaryLabel}>Impressions</Text>
            </View>

            <View style={styles.summaryCard}>
              <MousePointer size={18} color={COLORS.success} />
              <Text style={styles.summaryValue}>{stats.totalClicks}</Text>
              <Text style={styles.summaryLabel}>Clicks</Text>
            </View>

            <View style={styles.summaryCard}>
              <DollarSign size={18} color={COLORS.premium} />
              <Text style={styles.summaryValue}>₹{stats.totalBudgetSpent.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>Spent</Text>
            </View>
          </View>
        </View>

        {/* Create Campaign Trigger */}
        {!showCreateForm ? (
          <TouchableOpacity 
            style={styles.createBtn} 
            onPress={() => setShowCreateForm(true)}
            disabled={paymentProcessing}
          >
            <Plus size={18} color={COLORS.black} style={{ marginRight: 6 }} />
            <Text style={styles.createBtnText}>Create New Ad Campaign</Text>
          </TouchableOpacity>
        ) : (
          /* Form panel */
          <View style={styles.formPanel}>
            <Text style={styles.formTitle}>New Ad Campaign</Text>

            {/* preset options */}
            <Text style={styles.inputLabel}>1. Select Ad Media Preset (For Quick Testing)</Text>
            <View style={styles.presetsRow}>
              {SAMPLE_AD_PRESETS.map((preset, idx) => {
                const isSelected = selectedPresetIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.presetItem, isSelected && styles.presetItemSelected]}
                    onPress={() => selectPresetAd(idx)}
                  >
                    <Text style={styles.presetItemText}>{preset.name}</Text>
                    {isSelected && <Check size={14} color={COLORS.success} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom URLs */}
            <Text style={styles.inputLabel}>Media URL:</Text>
            <TextInput
              value={mediaUrl}
              onChangeText={(t) => {
                setMediaUrl(t);
                setSelectedPresetIndex(null);
              }}
              placeholder="Paste image URL (Banner) or video URL (Pre-roll)"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.formInput}
            />

            {/* Ad Type */}
            <Text style={styles.inputLabel}>Campaign Type:</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeSelectBtn, adType === 'pre-roll' && styles.typeSelectBtnActive]}
                onPress={() => {
                  setAdType('pre-roll');
                  setSelectedPresetIndex(null);
                }}
              >
                <Text style={[styles.typeSelectText, adType === 'pre-roll' && styles.typeSelectTextActive]}>
                  Pre-Roll Ad (5s Countdown)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.typeSelectBtn, adType === 'banner' && styles.typeSelectBtnActive]}
                onPress={() => {
                  setAdType('banner');
                  setSelectedPresetIndex(null);
                }}
              >
                <Text style={[styles.typeSelectText, adType === 'banner' && styles.typeSelectTextActive]}>
                  In-Feed Banner (Clickable)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category targeting */}
            <Text style={styles.inputLabel}>Target Category Audience:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
              {['Tech', 'Gaming', 'Music', 'Vlogs', 'Comedy'].map((cat) => {
                const isSelected = cat === targetCategory;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, isSelected && styles.catChipActive]}
                    onPress={() => setTargetCategory(cat)}
                  >
                    <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Budget */}
            <Text style={styles.inputLabel}>Campaign Budget (₹ INR):</Text>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              placeholder="e.g. 1500"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.formInput}
            />

            <View style={styles.formActionsRow}>
              <TouchableOpacity 
                style={[styles.formBtn, styles.formBtnCancel]}
                onPress={() => setShowCreateForm(false)}
                disabled={paymentProcessing}
              >
                <Text style={styles.formBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.formBtn, styles.formBtnSubmit]}
                onPress={handleCreateCampaign}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? (
                  <ActivityIndicator size="small" color={COLORS.black} />
                ) : (
                  <Text style={styles.formBtnTextSubmit}>Pay & Activate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Existing Campaigns Logs */}
        <Text style={styles.campaignListHeader}>Campaign Campaigns ({campaigns.length})</Text>
        
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : campaigns.length === 0 ? (
          <Text style={styles.noCampaignsText}>No campaigns running. Click Create New Ad above to get started!</Text>
        ) : (
          campaigns.map((c) => (
            <View key={c.id}>
              {renderCampaignCard({ item: c })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  dashboardSummary: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  createBtn: {
    backgroundColor: COLORS.white,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  createBtnText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 13,
  },
  formPanel: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  formTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: COLORS.white,
    fontSize: 12,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  typeSelectBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#333333',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  typeSelectBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 43, 66, 0.05)',
  },
  typeSelectText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  typeSelectTextActive: {
    color: COLORS.primary,
  },
  categoryScroller: {
    marginBottom: 12,
  },
  catChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  catChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  catChipText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  catChipTextActive: {
    color: COLORS.black,
    fontWeight: 'bold',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  presetItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetItemSelected: {
    borderColor: COLORS.primary,
  },
  presetItemText: {
    color: COLORS.white,
    fontSize: 10,
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  formBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formBtnCancel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  formBtnSubmit: {
    backgroundColor: COLORS.primary,
  },
  formBtnTextCancel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  formBtnTextSubmit: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
  campaignListHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 14,
  },
  noCampaignsText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 40,
  },
  campaignCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediaTypeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  statusPaused: {
    backgroundColor: 'rgba(142, 142, 147, 0.15)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  cardUrl: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  cardMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  metricCell: {
    alignItems: 'flex-start',
  },
  metricCellLabel: {
    fontSize: 8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  metricCellValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 2,
  },
  ctrLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'normal',
  },
  budgetLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: 'normal',
  },
  targetLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});
