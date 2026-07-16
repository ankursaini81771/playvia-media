import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, X } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

interface BannerAdProps {
  category?: string;
  onPressPremium?: () => void;
}

interface AdCampaign {
  id: string;
  media_url: string;
  target_category?: string;
  budget: number;
  impressions: number;
  clicks: number;
}

export const BannerAd: React.FC<BannerAdProps> = ({ category, onPressPremium }) => {
  const { user } = useAuth();
  const [ad, setAd] = useState<AdCampaign | null>(null);
  const [visible, setVisible] = useState(true);
  const [impressionLogged, setImpressionLogged] = useState(false);

  // If user is premium, banner ads are completely removed!
  if (user?.is_premium) {
    return null;
  }

  // Load active banner ads
  useEffect(() => {
    const fetchBannerAd = async () => {
      try {
        const { data: ads, error } = await supabase
          .from('ads')
          .select('*')
          .eq('ad_type', 'banner')
          .eq('status', 'active');

        if (!error && ads && ads.length > 0) {
          // Attempt to find a matching target category or pick the latest one
          const matchedAd = ads.find((a: any) => a.target_category === category) || ads[0];
          setAd(matchedAd);
          setImpressionLogged(false);
        }
      } catch (err) {
        console.warn('Error loading banner ad', err);
      }
    };

    fetchBannerAd();
  }, [category]);

  // Log ad impression on mount
  useEffect(() => {
    if (!ad || impressionLogged || ad.id === 'fallback') return;
    
    const logImpression = async () => {
      setImpressionLogged(true);
      try {
        await supabase
          .from('ads')
          .update({ impressions: ad.impressions + 1 })
          .eq('id', ad.id);
      } catch (err) {
        console.warn('Failed to log banner impression', err);
      }
    };

    logImpression();
  }, [ad]);

  const handlePressAd = async () => {
    if (!ad) return;

    // If it's a fallback premium ad, open the premium modal
    if (ad.id === 'fallback') {
      if (onPressPremium) {
        onPressPremium();
      }
      return;
    }

    // Otherwise, increment clicks and open the link
    try {
      await supabase
        .from('ads')
        .update({ clicks: ad.clicks + 1 })
        .eq('id', ad.id);

      // Open a target website. We'll use a default fallback website if none is in the ad object
      const targetUrl = 'https://playvia-ads-partner.com';
      await WebBrowser.openBrowserAsync(targetUrl);
    } catch (err) {
      console.warn('Error handling ad click', err);
    }
  };

  if (!visible) return null;

  // Use local fallback Premium banner if no external advertiser campaign is fetched
  const currentAd = ad || {
    id: 'fallback',
    media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop', // Premium background art
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.adContent} onPress={handlePressAd} activeOpacity={0.9}>
        <Image source={{ uri: currentAd.media_url }} style={styles.backgroundImage} />
        
        {/* Dark Tint Overlay */}
        <View style={styles.tintOverlay} />

        <View style={styles.textContainer}>
          <View style={styles.badgeRow}>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>Ad</Text>
            </View>
            <Text style={styles.sponsorText}>
              {currentAd.id === 'fallback' ? 'Sponsored by PlayVia' : 'Partner Sponsor'}
            </Text>
          </View>

          <Text style={styles.titleText} numberOfLines={1}>
            {currentAd.id === 'fallback' 
              ? 'Get PlayVia Premium — Ad-Free!' 
              : 'Special Offer: Explore Featured Partner Products'}
          </Text>
          
          <Text style={styles.descText} numberOfLines={1}>
            {currentAd.id === 'fallback'
              ? 'Upgrade now to unlock badges, background playback, and support creators.'
              : 'Click here to visit our sponsor and support free creators!'}
          </Text>
        </View>

        <View style={styles.actionIcon}>
          <ExternalLink size={18} color={COLORS.white} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
        <X size={14} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    marginHorizontal: 12,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.25,
  },
  tintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 15, 0.75)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  adBadge: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 6,
  },
  adBadgeText: {
    color: COLORS.black,
    fontSize: 9,
    fontWeight: 'bold',
  },
  sponsorText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  titleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  descText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    zIndex: 1,
    backgroundColor: 'rgba(255, 43, 66, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
    zIndex: 2,
  },
});
