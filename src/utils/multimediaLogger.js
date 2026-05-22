
/**
 * Multimedia Logger Utility
 * Standardizes console output for multimedia operations with emojis and timestamps.
 */

export const multimediaLogger = {
  logOperation: (stage, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const emojis = {
      'connect': '🔌',
      'validate': '📝',
      'security': '🔐',
      'save': '💾',
      'link': '🔗',
      'success': '✅',
      'realtime': '📡',
      'status': '🟢',
      'error': '❌',
      'upload': '📤'
    };
    
    const emoji = emojis[stage] || 'ℹ️';
    const logMessage = `[${timestamp}] ${emoji} [hotelService] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  },

  logRealtime: (status, message) => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = status === 'SUBSCRIBED' ? '🟢' : (status === 'DISCONNECTED' ? '🔴' : '📡');
    console.log(`[${timestamp}] ${emoji} [Realtime] ${message}`);
  }
};
