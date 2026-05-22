
/**
 * Production Logger Utility
 * Centralizes logging to allow for easy integration with external monitoring services
 * (e.g., Sentry, LogRocket) in the future, while keeping console clean in dev.
 */

const isDev = import.meta.env.DEV;

export const productionLogger = {
  /**
   * Log informational messages
   * @param {string} component - Name of the component or service
   * @param {string} message - The message to log
   * @param {object} [data] - Optional data object
   */
  logInfo: (component, message, data = null) => {
    if (isDev) {
      console.log(`%c[INFO] [${component}]`, 'color: #3b82f6; font-weight: bold;', message, data || '');
    }
    // In production, we could send this to an analytics service
  },

  /**
   * Log warnings
   * @param {string} component - Name of the component or service
   * @param {string} message - The warning message
   * @param {object} [data] - Optional data object
   */
  logWarning: (component, message, data = null) => {
    console.warn(`[WARN] [${component}] ${message}`, data || '');
  },

  /**
   * Log errors
   * @param {string} component - Name of the component or service
   * @param {any} error - The error object or message
   * @param {object} [context] - Optional context data
   */
  logError: (component, error, context = null) => {
    console.error(`%c[ERROR] [${component}]`, 'color: #ef4444; font-weight: bold;', error);
    if (context) {
      console.error('Context:', context);
    }
    // In production, this is where we would trigger Sentry/Datadog
  }
};
