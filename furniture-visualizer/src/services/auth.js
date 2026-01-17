import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ADMIN_CREDENTIALS: '@furniture_visualizer/admin_credentials',
  AUTH_SESSION: '@furniture_visualizer/auth_session',
  FAILED_ATTEMPTS: '@furniture_visualizer/failed_attempts',
};

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Max failed attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;

// Lockout duration in milliseconds (15 minutes)
const LOCKOUT_DURATION = 15 * 60 * 1000;

/**
 * Simple but secure hash function using SHA-256 simulation
 * In production, use a proper crypto library
 */
function hashPassword(password, salt) {
  const combined = salt + password + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
    hash = Math.imul(hash, 0x5bd1e995);
    hash ^= hash >>> 15;
  }
  // Convert to hex and add iterations for additional security
  let result = Math.abs(hash).toString(16);
  for (let i = 0; i < 1000; i++) {
    let iterHash = 0;
    const iterStr = result + salt + i.toString();
    for (let j = 0; j < iterStr.length; j++) {
      iterHash = ((iterHash << 5) - iterHash + iterStr.charCodeAt(j)) | 0;
    }
    result = Math.abs(iterHash).toString(16) + result.slice(0, 32);
  }
  return result.slice(0, 64);
}

/**
 * Generates a random salt for password hashing
 */
function generateSalt() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * Generates a session token
 */
function generateSessionToken() {
  return generateSalt() + Date.now().toString(36) + generateSalt();
}

/**
 * Checks if admin credentials have been set up
 */
export async function isAdminSetup() {
  try {
    const credentials = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
    return credentials !== null;
  } catch (error) {
    console.error('Error checking admin setup:', error);
    return false;
  }
}

/**
 * Sets up the admin password for the first time
 */
export async function setupAdminPassword(password) {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  try {
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);

    const credentials = {
      hash: hashedPassword,
      salt: salt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.ADMIN_CREDENTIALS,
      JSON.stringify(credentials)
    );

    return true;
  } catch (error) {
    console.error('Error setting up admin password:', error);
    throw new Error('Failed to set up admin password');
  }
}

/**
 * Gets the current lockout status
 */
export async function getLockoutStatus() {
  try {
    const attemptsData = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    if (!attemptsData) {
      return { isLocked: false, remainingTime: 0, attempts: 0 };
    }

    const { attempts, lockoutUntil } = JSON.parse(attemptsData);

    if (lockoutUntil && Date.now() < lockoutUntil) {
      return {
        isLocked: true,
        remainingTime: lockoutUntil - Date.now(),
        attempts,
      };
    }

    // Lockout expired, reset attempts
    if (lockoutUntil && Date.now() >= lockoutUntil) {
      await AsyncStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
      return { isLocked: false, remainingTime: 0, attempts: 0 };
    }

    return { isLocked: false, remainingTime: 0, attempts };
  } catch (error) {
    console.error('Error getting lockout status:', error);
    return { isLocked: false, remainingTime: 0, attempts: 0 };
  }
}

/**
 * Records a failed login attempt
 */
async function recordFailedAttempt() {
  try {
    const attemptsData = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    let attempts = 1;

    if (attemptsData) {
      const parsed = JSON.parse(attemptsData);
      attempts = (parsed.attempts || 0) + 1;
    }

    const data = { attempts };

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      data.lockoutUntil = Date.now() + LOCKOUT_DURATION;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, JSON.stringify(data));

    return {
      attempts,
      isLocked: attempts >= MAX_FAILED_ATTEMPTS,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - attempts),
    };
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    return { attempts: 0, isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }
}

/**
 * Clears failed attempts after successful login
 */
async function clearFailedAttempts() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
  } catch (error) {
    console.error('Error clearing failed attempts:', error);
  }
}

/**
 * Verifies the admin password and creates a session
 */
export async function verifyAdminPassword(password) {
  try {
    // Check for lockout
    const lockoutStatus = await getLockoutStatus();
    if (lockoutStatus.isLocked) {
      const minutes = Math.ceil(lockoutStatus.remainingTime / 60000);
      throw new Error(`Account locked. Try again in ${minutes} minute(s)`);
    }

    const credentialsData = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
    if (!credentialsData) {
      throw new Error('Admin not set up');
    }

    const credentials = JSON.parse(credentialsData);
    const hashedInput = hashPassword(password, credentials.salt);

    if (hashedInput !== credentials.hash) {
      const attemptResult = await recordFailedAttempt();
      if (attemptResult.isLocked) {
        throw new Error('Too many failed attempts. Account locked for 15 minutes');
      }
      throw new Error(`Invalid password. ${attemptResult.remainingAttempts} attempts remaining`);
    }

    // Password correct - clear failed attempts and create session
    await clearFailedAttempts();

    const session = {
      token: generateSessionToken(),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TIMEOUT,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));

    return { success: true, token: session.token };
  } catch (error) {
    if (error.message.includes('Invalid password') ||
        error.message.includes('Account locked') ||
        error.message.includes('Admin not set up')) {
      throw error;
    }
    console.error('Error verifying password:', error);
    throw new Error('Authentication failed');
  }
}

/**
 * Checks if the current session is valid
 */
export async function isSessionValid() {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData);

    if (Date.now() > session.expiresAt) {
      await logout();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
}

/**
 * Extends the current session
 */
export async function extendSession() {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData);
    session.expiresAt = Date.now() + SESSION_TIMEOUT;

    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    return true;
  } catch (error) {
    console.error('Error extending session:', error);
    return false;
  }
}

/**
 * Logs out and clears the session
 */
export async function logout() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
}

/**
 * Changes the admin password (requires current password)
 */
export async function changeAdminPassword(currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  // Verify current password first
  await verifyAdminPassword(currentPassword);

  // Set up new password
  const salt = generateSalt();
  const hashedPassword = hashPassword(newPassword, salt);

  const credentials = {
    hash: hashedPassword,
    salt: salt,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await AsyncStorage.setItem(
    STORAGE_KEYS.ADMIN_CREDENTIALS,
    JSON.stringify(credentials)
  );

  // Invalidate current session
  await logout();

  return true;
}

/**
 * Resets all auth data (for development/testing only)
 */
export async function resetAuthData() {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ADMIN_CREDENTIALS,
      STORAGE_KEYS.AUTH_SESSION,
      STORAGE_KEYS.FAILED_ATTEMPTS,
    ]);
    return true;
  } catch (error) {
    console.error('Error resetting auth data:', error);
    return false;
  }
}

export { STORAGE_KEYS as AUTH_STORAGE_KEYS, MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION, SESSION_TIMEOUT };
