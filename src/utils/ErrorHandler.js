import { ErrorLogger } from '@/services/ErrorLogger';
import { supabase } from '@/lib/customSupabaseClient';

// Configuration
const N8N_WEBHOOK_URL = 'https://n8n.webhook.url/webhook/error-handler'; // Placeholder URL as requested
const IS_DEV = import.meta.env.DEV;

export const ErrorHandler = {
  /**
   * Centralized error capture function.
   * @param {Error|string} error - The error object or message.
   * @param {Object} context - Contextual information.
   * @param {string} [context.component] - Component where error occurred.
   * @param {string} [context.action] - Action being performed (e.g., 'upload').
   * @param {string} [context.file_name] - File involved.
   * @param {string} [context.hotel_id] - Hotel ID context.
   * @param {Object} [context.metadata] - Extra data.
   */
  async captureError(error, context = {}) {
    // 1. Normalize Error
    const errorMessage = error?.message || (typeof error === 'string' ? error : 'Unknown Error');
    const stackTrace = error?.stack || '';
    
    // 2. Get Current User (if any)
    let userEmail = 'anonymous';
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) userEmail = session.user.email;
    } catch (e) { /* Ignore session fetch errors during error handling */ }

    const errorPayload = {
      error_type: context.action ? `${context.action.toUpperCase()}_ERROR` : 'RUNTIME_ERROR',
      error_message: errorMessage,
      stack_trace: stackTrace,
      user_email: userEmail,
      file_name: context.file_name || null,
      hotel_id: context.hotel_id || null,
      metadata: {
        component: context.component,
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context.metadata
      },
      timestamp: new Date().toISOString()
    };

    // 3. Local Console Log (Dev only)
    if (IS_DEV) {
      console.group('🚨 [ErrorHandler] Captured Error');
      console.error(error);
      console.table(errorPayload);
      console.groupEnd();
    }

    // 4. Send to Supabase (Async - Fire & Forget)
    ErrorLogger.logErrorToSupabase(errorPayload).catch(err => 
      console.error('Failed to log to DB:', err)
    );

    // 5. Send to N8N Webhook (Async - Fire & Forget)
    // Only fetch if URL is configured (prevent 404s on placeholder)
    if (N8N_WEBHOOK_URL && !N8N_WEBHOOK_URL.includes('n8n.webhook.url')) {
        fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorPayload)
        }).catch(err => console.error('Failed to send to N8N:', err));
    }

    return errorPayload;
  }
};