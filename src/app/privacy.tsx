import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { StatusBar } from 'expo-status-bar';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <ShieldAlert size={48} color={COLORS.primary} style={styles.introIcon} />
          <Text style={styles.title}>PlayVia Privacy Policy</Text>
          <Text style={styles.subtitle}>Last updated: July 16, 2026</Text>
          <Text style={styles.introText}>
            At PlayVia, we value your trust and are committed to protecting your privacy. This policy explains how we collect, use, and secure your information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            * **Account Data:** When you sign up, we collect your email address, username, and password using secure Supabase Authentication.
          </Text>
          <Text style={styles.paragraph}>
            * **Media Files:** When you upload content, we collect the video and thumbnail assets. Videos are hosted on unlisted channels or secure CDNs, and thumbnails are stored in Supabase Storage.
          </Text>
          <Text style={styles.paragraph}>
            * **App Usage Data:** We record view counts, likes, and comments to personalize your feed and calculate analytics metrics for advertisers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Device Permissions</Text>
          <Text style={styles.paragraph}>
            PlayVia requests access to the following device permissions to operate:
          </Text>
          <Text style={styles.bullet}>
            • **Camera:** To capture video clips directly within the app.
          </Text>
          <Text style={styles.bullet}>
            • **Microphone:** To record clear audio along with your camera video clips.
          </Text>
          <Text style={styles.bullet}>
            • **Photo Library / Storage:** To select pre-recorded videos and thumbnails from your gallery.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Information</Text>
          <Text style={styles.paragraph}>
            We use your data to provide video streaming, handle premium subscriptions, enable community comments, and display advertiser campaign metrics on the dashboard.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions regarding privacy or data deletion, please contact our support team at ankursaini81771@gmail.com.
          </Text>
        </View>
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
    padding: 24,
    paddingBottom: 40,
  },
  introContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2235',
  },
  introIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  introText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary || '#208AEF',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
    paddingLeft: 10,
    marginBottom: 6,
  },
});
