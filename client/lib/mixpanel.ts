import mixpanel from 'mixpanel-browser';

const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '';

// Initialize Mixpanel
if (token) {
  mixpanel.init(token, {
    autocapture: true,
    record_sessions_percent: 100,
    persistence: 'localStorage',
  });
}

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (token) {
    mixpanel.track(eventName, properties);
  }
};

export const setUserProperties = (properties: Record<string, any>) => {
  if (token) {
    mixpanel.people.set(properties);
  }
};

export const trackPageView = (pageName: string) => {
  trackEvent('Page View', { page_name: pageName });
};

export default mixpanel;
