import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import AdminLogin from '../../components/AdminLogin';
import * as auth from '../../services/auth';

// Mock the auth service
jest.mock('../../services/auth', () => ({
  isAdminSetup: jest.fn(),
  setupAdminPassword: jest.fn(),
  verifyAdminPassword: jest.fn(),
  getLockoutStatus: jest.fn(),
}));

// Helper to find clickable elements (buttons)
const findButton = (container, text) => {
  const buttons = container.querySelectorAll('button');
  return Array.from(buttons).find(el => el.textContent?.includes(text));
};

describe('AdminLogin', () => {
  const mockOnAuthenticated = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    auth.isAdminSetup.mockResolvedValue(false);
    auth.getLockoutStatus.mockResolvedValue({ isLocked: false, remainingTime: 0, attempts: 0 });
  });

  describe('Setup Mode', () => {
    test('should render setup mode when admin not set up', async () => {
      auth.isAdminSetup.mockResolvedValue(false);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Set Up Admin Access');
      });
    });

    test('should show password and confirm password inputs in setup mode', async () => {
      auth.isAdminSetup.mockResolvedValue(false);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Set Up Admin Access');
      });

      const inputs = container.querySelectorAll('input[type="password"]');
      expect(inputs.length).toBe(2);
    });

    test('should show error for short password', async () => {
      auth.isAdminSetup.mockResolvedValue(false);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Set Up Admin Access');
      });

      const inputs = container.querySelectorAll('input');
      await act(async () => {
        fireEvent.change(inputs[0], { target: { value: '12345' } });
      });

      const setButton = findButton(container, 'Set Password');
      await act(async () => {
        fireEvent.click(setButton);
      });

      await waitFor(() => {
        expect(container.textContent).toContain('at least 6 characters');
      });
    });

    test('should call setupAdminPassword on successful setup', async () => {
      auth.isAdminSetup.mockResolvedValue(false);
      auth.setupAdminPassword.mockResolvedValue(true);
      auth.verifyAdminPassword.mockResolvedValue({ success: true });

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Set Up Admin Access');
      });

      const inputs = container.querySelectorAll('input');
      await act(async () => {
        fireEvent.change(inputs[0], { target: { value: 'password123' } });
        fireEvent.change(inputs[1], { target: { value: 'password123' } });
      });

      const setButton = findButton(container, 'Set Password');
      await act(async () => {
        fireEvent.click(setButton);
      });

      await waitFor(() => {
        expect(auth.setupAdminPassword).toHaveBeenCalledWith('password123');
      });
    });
  });

  describe('Login Mode', () => {
    test('should render login mode when admin is set up', async () => {
      auth.isAdminSetup.mockResolvedValue(true);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });
    });

    test('should show single password input in login mode', async () => {
      auth.isAdminSetup.mockResolvedValue(true);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      // In login mode, there should be only one password input
      const inputs = container.querySelectorAll('input[type="password"]');
      expect(inputs.length).toBe(1);
    });

    test('should show error for empty password', async () => {
      auth.isAdminSetup.mockResolvedValue(true);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      const loginButton = findButton(container, 'Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(container.textContent).toContain('enter your password');
      });
    });

    test('should show error for invalid password', async () => {
      auth.isAdminSetup.mockResolvedValue(true);
      auth.verifyAdminPassword.mockRejectedValue(new Error('Invalid password. 4 attempts remaining'));

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      const inputs = container.querySelectorAll('input');
      await act(async () => {
        fireEvent.change(inputs[0], { target: { value: 'wrongpassword' } });
      });

      const loginButton = findButton(container, 'Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Invalid password');
      });
    });

    test('should call verifyAdminPassword on login attempt', async () => {
      auth.isAdminSetup.mockResolvedValue(true);
      auth.verifyAdminPassword.mockResolvedValue({ success: true, token: 'test-token' });

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      const inputs = container.querySelectorAll('input');
      await act(async () => {
        fireEvent.change(inputs[0], { target: { value: 'correctpassword' } });
      });

      const loginButton = findButton(container, 'Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(auth.verifyAdminPassword).toHaveBeenCalledWith('correctpassword');
      });
    });

    test('should call onAuthenticated on successful login', async () => {
      auth.isAdminSetup.mockResolvedValue(true);
      auth.verifyAdminPassword.mockResolvedValue({ success: true, token: 'test-token' });

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      const inputs = container.querySelectorAll('input');
      await act(async () => {
        fireEvent.change(inputs[0], { target: { value: 'correctpassword' } });
      });

      const loginButton = findButton(container, 'Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(mockOnAuthenticated).toHaveBeenCalled();
      });
    });
  });

  describe('Lockout', () => {
    test('should display lockout message when account is locked', async () => {
      auth.isAdminSetup.mockResolvedValue(true);
      auth.getLockoutStatus.mockResolvedValue({
        isLocked: true,
        remainingTime: 300000, // 5 minutes
        attempts: 5,
      });

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('temporarily locked');
      });
    });

    test('should not show login button when locked', async () => {
      auth.isAdminSetup.mockResolvedValue(true);
      auth.getLockoutStatus.mockResolvedValue({
        isLocked: true,
        remainingTime: 300000,
        attempts: 5,
      });

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('temporarily locked');
      });

      // Login button should not be visible when locked
      const loginButton = findButton(container, 'Login');
      expect(loginButton).toBeFalsy();
    });
  });

  describe('Cancel Button', () => {
    test('should render cancel button', async () => {
      auth.isAdminSetup.mockResolvedValue(true);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      const cancelButton = findButton(container, 'Cancel');
      expect(cancelButton).toBeTruthy();
    });

    test('should call onCancel when cancel button is clicked', async () => {
      auth.isAdminSetup.mockResolvedValue(true);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      const cancelButton = findButton(container, 'Cancel');
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('should show cancel button even when locked', async () => {
      auth.isAdminSetup.mockResolvedValue(true);
      auth.getLockoutStatus.mockResolvedValue({
        isLocked: true,
        remainingTime: 300000,
        attempts: 5,
      });

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('temporarily locked');
      });

      const cancelButton = findButton(container, 'Cancel');
      expect(cancelButton).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should have accessible labels for inputs', async () => {
      auth.isAdminSetup.mockResolvedValue(true);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      const passwordInput = container.querySelector('input[aria-label="Password input"]');
      expect(passwordInput).toBeTruthy();
    });

    test('should have accessible button labels', async () => {
      auth.isAdminSetup.mockResolvedValue(true);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      const loginButton = container.querySelector('button[aria-label="Login"]');
      const cancelButton = container.querySelector('button[aria-label="Cancel"]');

      expect(loginButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should show setup error message', async () => {
      auth.isAdminSetup.mockResolvedValue(false);
      auth.setupAdminPassword.mockRejectedValue(new Error('Setup failed'));

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Set Up Admin Access');
      });

      const inputs = container.querySelectorAll('input');
      await act(async () => {
        fireEvent.change(inputs[0], { target: { value: 'password123' } });
        fireEvent.change(inputs[1], { target: { value: 'password123' } });
      });

      const setButton = findButton(container, 'Set Password');
      await act(async () => {
        fireEvent.click(setButton);
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Setup failed');
      });
    });

    test('should handle setup check failure', async () => {
      auth.isAdminSetup.mockRejectedValue(new Error('Check failed'));

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Failed to check setup status');
      });
    });

    test('should update lockout status on failed login', async () => {
      auth.isAdminSetup.mockResolvedValue(true);
      auth.verifyAdminPassword.mockRejectedValue(new Error('Invalid password. 2 attempts remaining'));
      auth.getLockoutStatus
        .mockResolvedValueOnce({ isLocked: false, remainingTime: 0, attempts: 0 })
        .mockResolvedValueOnce({ isLocked: false, remainingTime: 0, attempts: 3 });

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Admin Login');
      });

      const inputs = container.querySelectorAll('input');
      await act(async () => {
        fireEvent.change(inputs[0], { target: { value: 'wrongpassword' } });
      });

      const loginButton = findButton(container, 'Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Invalid password');
      });
    });
  });

  describe('Password Hints', () => {
    test('should show password hint in setup mode', async () => {
      auth.isAdminSetup.mockResolvedValue(false);

      const { container } = render(
        <AdminLogin onAuthenticated={mockOnAuthenticated} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('no recovery option');
      });
    });
  });
});
