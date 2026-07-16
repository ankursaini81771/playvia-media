import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, Play, User as UserIcon } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!isLogin && !username) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }

    setAuthLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      setAuthLoading(false);
      if (error) {
        Alert.alert('Login Failed', error.message);
      } else {
        router.replace('/(tabs)');
      }
    } else {
      const { error } = await signUp(email, password, username);
      setAuthLoading(false);
      if (error) {
        Alert.alert('Registration Failed', error.message);
      } else {
        Alert.alert('Success', 'Account created! Logging you in...', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    const { error } = await signInWithGoogle();
    setAuthLoading(false);
    if (error) {
      Alert.alert('Google Sign-In Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Play size={24} color={COLORS.white} fill={COLORS.white} />
        </View>
        <Text style={styles.brandText}>
          Play<Text style={{ color: COLORS.primary }}>Via</Text>
        </Text>
        <Text style={styles.tagline}>Watch, share, and connect in premium speed</Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
        
        {!isLogin && (
          <View style={styles.inputWrapper}>
            <UserIcon size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.textInput}
              autoCapitalize="none"
            />
          </View>
        )}

        <View style={styles.inputWrapper}>
          <Mail size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.textInput}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Lock size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.textInput}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleAuth}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator size="small" color={COLORS.black} />
          ) : (
            <Text style={styles.actionButtonText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
          )}
        </TouchableOpacity>

        {/* Separator line */}
        <View style={styles.separatorRow}>
          <View style={styles.line} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* Google OAuth simulated button */}
        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleLogin}
          disabled={authLoading}
        >
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=50&auto=format&fit=crop' }} 
            style={styles.googleIcon} 
          />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      {/* Switch Screen CTA */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
        </Text>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} disabled={authLoading}>
          <Text style={styles.footerLink}>{isLogin ? 'Sign Up' : 'Log In'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    backgroundColor: COLORS.primary,
    width: 52,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    transform: [{ rotate: '45deg' }],
  },
  brandText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 15,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  separatorText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 10,
  },
  googleButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
