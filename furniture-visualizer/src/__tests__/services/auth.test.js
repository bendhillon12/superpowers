import {
  isAdminSetup,
  setupAdminPassword,
  verifyAdminPassword,
  isSessionValid,
  extendSession,
  logout,
  changeAdminPassword,
  getLockoutStatus,
  resetAuthData,
  AUTH_STORAGE_KEYS,
  MAX_FAILED_ATTEMPTS,
} from '../../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AUTH_STORAGE_KEYS', () => {
    test('should have all required storage keys', () => {
      expect(AUTH_STORAGE_KEYS.ADMIN_CREDENTIALS).toBeDefined();
      expect(AUTH_STORAGE_KEYS.AUTH_SESSION).toBeDefined();
      expect(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS).toBeDefined();
    });
  });

  describe('isAdminSetup', () => {
    test('should return false when no credentials exist', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await isAdminSetup();

      expect(result).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(AUTH_STORAGE_KEYS.ADMIN_CREDENTIALS);
    });

    test('should return true when credentials exist', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ hash: 'abc', salt: 'xyz' }));

      const result = await isAdminSetup();

      expect(result).toBe(true);
    });

    test('should return false on error', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await isAdminSetup();

      expect(result).toBe(false);
    });
  });

  describe('setupAdminPassword', () => {
    test('should set up password successfully', async () => {
      const result = await setupAdminPassword('password123');

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        AUTH_STORAGE_KEYS.ADMIN_CREDENTIALS,
        expect.any(String)
      );

      // Verify the stored data has hash and salt
      const storedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(storedData.hash).toBeDefined();
      expect(storedData.salt).toBeDefined();
      expect(storedData.createdAt).toBeDefined();
    });

    test('should throw error for short password', async () => {
      await expect(setupAdminPassword('12345')).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    test('should throw error for empty password', async () => {
      await expect(setupAdminPassword('')).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    test('should throw error for null password', async () => {
      await expect(setupAdminPassword(null)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    test('should throw error on storage failure', async () => {
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      await expect(setupAdminPassword('password123')).rejects.toThrow(
        'Failed to set up admin password'
      );
    });
  });

  describe('verifyAdminPassword', () => {
    const mockCredentials = {
      hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      salt: 'testsalt12345678901234567890test',
      createdAt: Date.now(),
    };

    test('should throw error when admin not set up', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No failed attempts
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No credentials

      await expect(verifyAdminPassword('password123')).rejects.toThrow('Admin not set up');
    });

    test('should throw error for wrong password', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No failed attempts
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockCredentials));
      AsyncStorage.getItem.mockResolvedValueOnce(null); // For recordFailedAttempt

      await expect(verifyAdminPassword('wrongpassword')).rejects.toThrow(/Invalid password/);
    });

    test('should record failed attempts', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No lockout
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockCredentials));
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No previous failed attempts

      try {
        await verifyAdminPassword('wrongpassword');
      } catch (e) {
        // Expected to fail
      }

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        AUTH_STORAGE_KEYS.FAILED_ATTEMPTS,
        expect.any(String)
      );
    });

    test('should throw lockout error after max attempts', async () => {
      const failedAttempts = {
        attempts: MAX_FAILED_ATTEMPTS,
        lockoutUntil: Date.now() + 900000, // 15 minutes
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(failedAttempts));

      await expect(verifyAdminPassword('anypassword')).rejects.toThrow(/locked/i);
    });
  });

  describe('getLockoutStatus', () => {
    test('should return not locked when no failed attempts', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await getLockoutStatus();

      expect(result.isLocked).toBe(false);
      expect(result.attempts).toBe(0);
    });

    test('should return locked when lockout is active', async () => {
      const lockoutData = {
        attempts: 5,
        lockoutUntil: Date.now() + 60000,
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(lockoutData));

      const result = await getLockoutStatus();

      expect(result.isLocked).toBe(true);
      expect(result.attempts).toBe(5);
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    test('should reset lockout when expired', async () => {
      const lockoutData = {
        attempts: 5,
        lockoutUntil: Date.now() - 1000, // Expired
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(lockoutData));

      const result = await getLockoutStatus();

      expect(result.isLocked).toBe(false);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
    });

    test('should return attempts without lockout', async () => {
      const attemptData = { attempts: 2 };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(attemptData));

      const result = await getLockoutStatus();

      expect(result.isLocked).toBe(false);
      expect(result.attempts).toBe(2);
    });
  });

  describe('isSessionValid', () => {
    test('should return false when no session exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await isSessionValid();

      expect(result).toBe(false);
    });

    test('should return true for valid session', async () => {
      const session = {
        token: 'test-token',
        expiresAt: Date.now() + 60000,
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(session));

      const result = await isSessionValid();

      expect(result).toBe(true);
    });

    test('should return false and logout for expired session', async () => {
      const session = {
        token: 'test-token',
        expiresAt: Date.now() - 1000, // Expired
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(session));

      const result = await isSessionValid();

      expect(result).toBe(false);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(AUTH_STORAGE_KEYS.AUTH_SESSION);
    });

    test('should return false on error', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await isSessionValid();

      expect(result).toBe(false);
    });
  });

  describe('extendSession', () => {
    test('should extend valid session', async () => {
      const session = {
        token: 'test-token',
        expiresAt: Date.now() + 60000,
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(session));

      const result = await extendSession();

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      const updatedSession = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(updatedSession.expiresAt).toBeGreaterThan(session.expiresAt);
    });

    test('should return false when no session exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await extendSession();

      expect(result).toBe(false);
    });

    test('should return false on error', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await extendSession();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    test('should clear session', async () => {
      const result = await logout();

      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(AUTH_STORAGE_KEYS.AUTH_SESSION);
    });

    test('should return false on error', async () => {
      AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await logout();

      expect(result).toBe(false);
    });
  });

  describe('changeAdminPassword', () => {
    test('should throw error for short new password', async () => {
      await expect(changeAdminPassword('current', '12345')).rejects.toThrow(
        'New password must be at least 6 characters'
      );
    });

    test('should throw error for empty new password', async () => {
      await expect(changeAdminPassword('current', '')).rejects.toThrow(
        'New password must be at least 6 characters'
      );
    });

    test('should throw error for null new password', async () => {
      await expect(changeAdminPassword('current', null)).rejects.toThrow(
        'New password must be at least 6 characters'
      );
    });
  });

  describe('verifyAdminPassword - additional error paths', () => {
    test('should throw generic error for unexpected errors', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No lockout
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Unexpected storage error'));

      await expect(verifyAdminPassword('password123')).rejects.toThrow('Authentication failed');
    });

    test('should throw lockout error with correct minutes', async () => {
      const lockoutData = {
        attempts: 5,
        lockoutUntil: Date.now() + 120000, // 2 minutes
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(lockoutData));

      await expect(verifyAdminPassword('anypassword')).rejects.toThrow('Account locked. Try again in 2 minute(s)');
    });

    test('should record failed attempts when password is wrong', async () => {
      const mockCredentials = {
        hash: '1234567890abcdef',
        salt: 'testsalt12345678901234567890test',
        createdAt: Date.now(),
      };
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No lockout
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockCredentials)); // Credentials
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ attempts: 3 })); // Previous attempts

      try {
        await verifyAdminPassword('wrongpassword');
      } catch (e) {
        expect(e.message).toContain('Invalid password');
        expect(e.message).toContain('1 attempts remaining');
      }
    });

    test('should trigger lockout after max failed attempts', async () => {
      const mockCredentials = {
        hash: '1234567890abcdef',
        salt: 'testsalt12345678901234567890test',
        createdAt: Date.now(),
      };
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No lockout
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockCredentials)); // Credentials
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ attempts: 4 })); // 4 previous attempts

      await expect(verifyAdminPassword('wrongpassword')).rejects.toThrow('Too many failed attempts');
    });
  });

  describe('resetAuthData', () => {
    test('should clear all auth data', async () => {
      const result = await resetAuthData();

      expect(result).toBe(true);
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        AUTH_STORAGE_KEYS.ADMIN_CREDENTIALS,
        AUTH_STORAGE_KEYS.AUTH_SESSION,
        AUTH_STORAGE_KEYS.FAILED_ATTEMPTS,
      ]);
    });

    test('should return false on error', async () => {
      AsyncStorage.multiRemove.mockRejectedValueOnce(new Error('Storage error'));

      const result = await resetAuthData();

      expect(result).toBe(false);
    });
  });

  describe('Password Hashing', () => {
    test('should generate different hashes for same password with different salts', async () => {
      // Setup first password
      await setupAdminPassword('samepassword');
      const firstCall = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);

      jest.clearAllMocks();

      // Setup same password again (new salt)
      await setupAdminPassword('samepassword');
      const secondCall = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);

      expect(firstCall.hash).not.toBe(secondCall.hash);
      expect(firstCall.salt).not.toBe(secondCall.salt);
    });

    test('should produce consistent hash for same password and salt', async () => {
      await setupAdminPassword('testpassword');
      const stored = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);

      // Hash length should be consistent (40+ chars due to hash algorithm)
      expect(stored.hash.length).toBeGreaterThanOrEqual(32);
      expect(stored.salt.length).toBe(32);
    });
  });
});
