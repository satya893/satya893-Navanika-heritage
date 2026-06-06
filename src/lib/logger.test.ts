import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.resetModules(); // Ensure the module is re-evaluated for each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('in development', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    it('logError logs the error message and context, but not sentry placeholder', async () => {
      const { logError } = await import('./logger');
      const error = new Error('Test error');
      const context = { userId: 123 };

      logError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('🔴 [Error Log]:', 'Test error', { userId: 123 });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('logError logs empty string if no context is provided', async () => {
      const { logError } = await import('./logger');
      const error = new Error('Test error');

      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('🔴 [Error Log]:', 'Test error', '');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('logEvent logs the event message and data', async () => {
      const { logEvent } = await import('./logger');

      logEvent('User signup', { method: 'email' });

      expect(consoleLogSpy).toHaveBeenCalledWith('🔵 [Event]: User signup', { method: 'email' });
    });

    it('logEvent logs empty string if no data is provided', async () => {
      const { logEvent } = await import('./logger');

      logEvent('User signup');

      expect(consoleLogSpy).toHaveBeenCalledWith('🔵 [Event]: User signup', '');
    });
  });

  describe('in production', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('logError logs the error message, context, and sentry placeholder', async () => {
      const { logError } = await import('./logger');
      const error = new Error('Prod error');

      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('🔴 [Error Log]:', 'Prod error', '');
      expect(consoleLogSpy).toHaveBeenCalledWith('📡 (Sentry would capture this in production)');
    });

    it('logEvent does not log anything', async () => {
      const { logEvent } = await import('./logger');

      logEvent('User signup');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
