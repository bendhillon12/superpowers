import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  isAdminSetup,
  setupAdminPassword,
  verifyAdminPassword,
  getLockoutStatus,
} from '../services/auth';

export default function AdminLogin({ onAuthenticated, onCancel }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lockoutInfo, setLockoutInfo] = useState(null);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  useEffect(() => {
    let interval;
    if (lockoutInfo && lockoutInfo.isLocked) {
      interval = setInterval(() => {
        const remaining = lockoutInfo.lockoutUntil - Date.now();
        if (remaining <= 0) {
          setLockoutInfo(null);
          setError('');
        } else {
          setLockoutInfo(prev => ({
            ...prev,
            remainingTime: remaining,
          }));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutInfo]);

  const checkSetupStatus = async () => {
    try {
      const setup = await isAdminSetup();
      setIsSetupMode(!setup);

      const lockout = await getLockoutStatus();
      if (lockout.isLocked) {
        setLockoutInfo({
          isLocked: true,
          lockoutUntil: Date.now() + lockout.remainingTime,
          remainingTime: lockout.remainingTime,
        });
      }
    } catch (err) {
      setError('Failed to check setup status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async () => {
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await setupAdminPassword(password);
      const result = await verifyAdminPassword(password);
      if (result.success) {
        onAuthenticated();
      }
    } catch (err) {
      setError(err.message || 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyAdminPassword(password);
      if (result.success) {
        onAuthenticated();
      }
    } catch (err) {
      setError(err.message || 'Login failed');

      // Check if locked out
      const lockout = await getLockoutStatus();
      if (lockout.isLocked) {
        setLockoutInfo({
          isLocked: true,
          lockoutUntil: Date.now() + lockout.remainingTime,
          remainingTime: lockout.remainingTime,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading && !password) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const isLocked = lockoutInfo && lockoutInfo.isLocked;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.icon}>{isSetupMode ? '🔐' : '🔒'}</Text>
        <Text style={styles.title}>
          {isSetupMode ? 'Set Up Admin Access' : 'Admin Login'}
        </Text>

        {isSetupMode ? (
          <Text style={styles.subtitle}>
            Create a secure password to protect the admin panel
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            Enter your password to access admin features
          </Text>
        )}

        {isLocked ? (
          <View style={styles.lockoutContainer}>
            <Text style={styles.lockoutIcon}>⏱️</Text>
            <Text style={styles.lockoutText}>Account temporarily locked</Text>
            <Text style={styles.lockoutTimer}>
              Try again in {formatTime(lockoutInfo.remainingTime)}
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              accessibilityLabel="Password input"
            />

            {isSetupMode && (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                accessibilityLabel="Confirm password input"
              />
            )}

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={isSetupMode ? handleSetup : handleLogin}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={isSetupMode ? 'Set up password' : 'Login'}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSetupMode ? 'Set Password' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        {isSetupMode && (
          <Text style={styles.hint}>
            Password must be at least 6 characters. Store it securely - there is no recovery option.
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  lockoutContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    width: '100%',
  },
  lockoutIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  lockoutTimer: {
    fontSize: 24,
    fontWeight: '700',
    color: '#856404',
  },
});
