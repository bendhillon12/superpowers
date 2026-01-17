// Jest setup file
// @testing-library/react-native v12.4+ includes matchers by default

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock Expo modules that aren't needed for unit tests
jest.mock('expo', () => ({
  __esModule: true,
}));
