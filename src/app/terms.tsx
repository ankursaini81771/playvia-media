import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { StatusBar } from 'expo-status-bar';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <ShieldAlert size={48} color={COLORS.primary} style={styles.introIcon} />
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.subtitle}>Last updated: July 16, 2026</Text>
          <Text style={styles.introText}>
            Welcome to PlayVia. By registering, logging in, or using our mobile application, you agree to comply with and be bound by the following terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Account Terms</Text>
          <Text style={styles.paragraph}>
            * You must be at least 13 years of age to register an account on PlayVia.
          </Text>
          <Text style={styles.paragraph}>
            * You are solely responsible for keeping your login credentials secure and for all activities that occur under your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Content Guidelines</Text>
          <Text style={styles.paragraph}>
            * Creators retain all ownership rights in their uploaded videos. However, you grant PlayVia a non-exclusive license to stream your video to users of the platform.
          </Text>
          <Text style={styles.paragraph}>
            * You agree not to upload any content that is illegal, defamatory, copyrighted without permission, or violates community guidelines. Violating uploads will be deleted immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Advertisements & Budgeting</Text>
          <Text style={styles.paragraph}>
            * Advertisers agree that campaign budgets are calculated based on registered impressions and clicks.
          </Text>
          <Text style={styles.paragraph}>
            * Ads remain in draft mode until payment check is completed. Once activated, campaigns run according to target categories.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Premium Subscriptions</Text>
          <Text style={styles.paragraph}>
            * PlayVia Premium offers ad-free streaming. Premium access checks are performed dynamically upon authentication, and renewals are charged according to pricing plans.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Contact Info</Text>
          <Text style={styles.paragraph}>
            For any queries or reporting violations, contact us at: ankursaini81771@gmail.com.
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
});
