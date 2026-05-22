// Utility to handle Google Tag Manager, GA4, and Meta Pixel events uniformly

const GA4_MEASUREMENT_ID = 'G-VBJQPVHEET';
const IS_DEBUG = true; // Set to false in production if console logs are too noisy

/**
 * Log helper for debugging analytics
 */
const logAnalytics = (system, action, data) => {
  if (IS_DEBUG) {
    console.log(`[${system}] ${action}`, data || '');
  }
};

/**
 * Helper to push events to Google Tag Manager dataLayer
 * @param {Object} eventData 
 */
const pushToDataLayer = (eventData) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventData);
  logAnalytics('GTM', 'DataLayer Push', eventData);
};

/**
 * Helper to handle direct GA4 gtag calls (critical for SPA page views)
 * @param  {...any} args 
 */
const pushToGtag = (...args) => {
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
    logAnalytics('GA4', 'gtag call', args);
  } else {
    // Fallback if gtag function is not yet defined
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args); // Note: gtag processes arguments object, pushing array works for config
    logAnalytics('GA4', 'gtag fallback push', args);
  }
};

/**
 * Helper to track Meta Pixel events
 * @param {string} eventName 
 * @param {Object} data 
 */
const pushToMeta = (eventName, data = {}) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, data);
    logAnalytics('Meta', 'Event Tracked', { eventName, data });
  }
};

/**
 * Tracks a page view across all systems
 * @param {string} url 
 */
export const trackPageView = (url) => {
  const pageTitle = document.title;

  // 1. GTM: Custom event for triggers that rely on history change or custom events
  pushToDataLayer({
    event: 'page_view',
    page_path: url,
    page_title: pageTitle
  });

  // 2. GA4: Explicitly update the page_path for SPA navigation
  // Adding debug_mode: true ensures it appears in GA4 DebugView
  pushToGtag('config', GA4_MEASUREMENT_ID, {
    page_path: url,
    page_title: pageTitle,
    debug_mode: true 
  });
  
  // 3. Meta Pixel: Standard PageView
  // VALIDATION: This triggers the 'PageView' standard event required by Meta.
  pushToMeta('PageView');
};

/**
 * Tracks viewing a specific item (e.g., Hotel Details)
 * @param {Object} itemData - { id, name, price, category, currency }
 */
export const trackViewItem = (itemData) => {
  // GTM & GA4
  pushToGtag('event', 'view_item', {
    currency: itemData.currency || 'USD',
    value: itemData.price || 0,
    debug_mode: true,
    items: [{
      item_id: itemData.id,
      item_name: itemData.name,
      item_category: itemData.category || 'Hotel',
      price: itemData.price || 0,
      quantity: 1
    }]
  });

  // Meta Pixel
  // VALIDATION: Maps to standard 'ViewContent' event.
  pushToMeta('ViewContent', {
    content_ids: [itemData.id],
    content_name: itemData.name,
    content_category: itemData.category || 'Hotel',
    value: itemData.price || 0,
    currency: itemData.currency || 'USD',
    content_type: 'product'
  });
};

/**
 * Tracks adding items to cart
 * @param {Object} itemData - { id, name, price, category, quantity }
 */
export const trackAddToCart = (itemData) => {
  // GTM & GA4
  pushToGtag('event', 'add_to_cart', {
    currency: 'USD',
    value: (itemData.price || 0) * (itemData.quantity || 1),
    debug_mode: true,
    items: [{
      item_id: itemData.id,
      item_name: itemData.name,
      item_category: itemData.category || 'Service',
      price: itemData.price || 0,
      quantity: itemData.quantity || 1
    }]
  });

  // Meta Pixel
  // VALIDATION: Maps to standard 'AddToCart' event.
  pushToMeta('AddToCart', {
    content_ids: [itemData.id],
    content_name: itemData.name,
    content_type: 'product',
    value: (itemData.price || 0) * (itemData.quantity || 1),
    currency: 'USD'
  });
};

/**
 * Tracks beginning of checkout process
 * @param {Array} items - Array of item objects
 * @param {number} value - Total value
 */
export const trackBeginCheckout = (items = [], value = 0) => {
  // GTM & GA4
  pushToGtag('event', 'begin_checkout', {
    currency: 'USD',
    value: value,
    debug_mode: true,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  });

  // Meta Pixel
  // VALIDATION: Maps to standard 'InitiateCheckout' event.
  pushToMeta('InitiateCheckout', {
    content_ids: items.map(i => i.id),
    num_items: items.length,
    value: value,
    currency: 'USD'
  });
};

/**
 * Tracks completed purchase/reservation
 * @param {Object} orderData - { transaction_id, value, items }
 */
export const trackPurchase = (orderData) => {
  // GTM & GA4
  pushToGtag('event', 'purchase', {
    transaction_id: orderData.transaction_id,
    value: orderData.value,
    currency: 'USD',
    debug_mode: true,
    items: orderData.items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  });

  // Meta Pixel
  // VALIDATION: Maps to standard 'Purchase' event.
  pushToMeta('Purchase', {
    value: orderData.value,
    currency: 'USD',
    content_ids: orderData.items.map(i => i.id),
    content_type: 'product',
    num_items: orderData.items.length,
    order_id: orderData.transaction_id
  });
};

/**
 * Tracks lead generation (Form submit, Contact)
 * @param {string} leadType - 'Contact', 'Quote', etc.
 */
export const trackGenerateLead = (leadType = 'Contact') => {
  // GTM & GA4
  pushToGtag('event', 'generate_lead', {
    lead_type: leadType,
    debug_mode: true
  });

  // Meta Pixel
  // VALIDATION: Maps to standard 'Lead' event.
  pushToMeta('Lead', {
    content_name: leadType
  });
};

/**
 * Tracks search events
 * @param {string} searchTerm 
 */
export const trackSearch = (searchTerm) => {
  // GTM & GA4
  pushToGtag('event', 'search', {
    search_term: searchTerm,
    debug_mode: true
  });

  // Meta Pixel
  // VALIDATION: Maps to standard 'Search' event.
  pushToMeta('Search', {
    search_string: searchTerm
  });
};