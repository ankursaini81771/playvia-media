import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Crown, Check, X, ShieldAlert } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useRazorpay } from '../hooks/useRazorpay';
import { useAuth } from '../hooks/useAuth';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ visible, onClose }) => {
  const { startPremiumPayment, processing } = useRazorpay();
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePurchase = async () => {
    setErrorMessage('');
    const result = await startPremiumPayment();
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500); // Close after showing success checkmark
    } else {
      setErrorMessage(result.error || 'Payment failed. Please try again.');
    }
  };

  const features = [
    'Ad-Free Videos: Watch uninterrupted, no pre-rolls or banners',
    'PlayVia Premium Badge: Show off your status on your profile',
    'Background Play (Coming Soon): Play audio with screen locked',
    'Support Creators: A share of your subscription goes to creators',
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={processing}>
            <X size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {success ? (
            <View style={styles.statusContainer}>
              <View style={styles.successBadge}>
                <Check size={40} color={COLORS.black} />
              </View>
              <Text style={styles.statusTitle}>Welcome to Premium!</Text>
              <Text style={styles.statusDesc}>Your subscription is active. Enjoy ad-free viewing.</Text>
            </View>
          ) : processing ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color={COLORS.premium} />
              <Text style={styles.statusTitle}>Processing Payment...</Text>
              <Text style={styles.statusDesc}>Connecting to Razorpay gateway. Please do not close the app.</Text>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Crown size={48} color={COLORS.premium} fill={COLORS.premium} />
              </View>

              <Text style={styles.title}>PlayVia Premium</Text>
              <Text style={styles.subtitle}>Unlock the ultimate viewing experience</Text>

              {/* Features List */}
              <View style={styles.featuresContainer}>
                {features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <View style={styles.checkContainer}>
                      <Check size={14} color={COLORS.success} strokeWidth={3} />
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <ShieldAlert size={16} color={COLORS.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Price Details & Checkout Button */}
              <View style={styles.checkoutContainer}>
                <Text style={styles.priceText}>
                  ₹299<Text style={styles.pricePeriod}>/month</Text>
                </Text>
                <Text style={styles.cancelText}>Cancel anytime. Recurring billing.</Text>

                <TouchableOpacity style={styles.upgradeButton} onPress={handlePurchase}>
                  <Crown size={18} color={COLORS.black} fill={COLORS.black} style={{ marginRight: 6 }} />
                  <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  featuresContainer: {
    width: '100%',
    marginVertical: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkContainer: {
    marginTop: 2,
    marginRight: 10,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 8,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#DDDDDD',
    lineHeight: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  checkoutContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  pricePeriod: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  cancelText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: COLORS.premium,
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: COLORS.premium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 15,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 10,
  },
  statusDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
});
