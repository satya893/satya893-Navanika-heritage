/**
 * Professional Logging Utility
 * Integrates with Sentry in production or falls back to console in development.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

export const logError = (error: Error, context?: Record<string, any>) => {
  console.error('🔴 [Error Log]:', error.message, context || '');
  
  if (IS_PROD) {
    // Placeholder for Sentry.captureException(error, { extra: context });
    // To enable: npm install @sentry/nextjs
    console.log('📡 (Sentry would capture this in production)');
  }
};

export const logEvent = (message: string, data?: any) => {
  if (!IS_PROD) {
    console.log(`🔵 [Event]: ${message}`, data || '');
  }
};
