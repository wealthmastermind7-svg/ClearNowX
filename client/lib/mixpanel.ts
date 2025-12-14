import { Platform } from 'react-native';

const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '';

let mixpanelInstance: any = null;

const initMixpanel = async () => {
  if (!token || Platform.OS !== 'web') {
    return null;
  }
  
  try {
    const mixpanel = (await import('mixpanel-browser')).default;
    mixpanel.init(token, {
      autocapture: false,
      record_sessions_percent: 0,
      persistence: 'localStorage',
      disable_persistence: false,
      batch_requests: false,
    });
    return mixpanel;
  } catch (error) {
    console.warn('Mixpanel initialization failed:', error);
    return null;
  }
};

initMixpanel().then((mp) => {
  mixpanelInstance = mp;
});

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (mixpanelInstance) {
    try {
      mixpanelInstance.track(eventName, properties);
    } catch (e) {
      // Silently fail
    }
  }
};

export const setUserProperties = (properties: Record<string, any>) => {
  if (mixpanelInstance) {
    try {
      mixpanelInstance.people.set(properties);
    } catch (e) {
      // Silently fail
    }
  }
};

export const trackPageView = (pageName: string) => {
  trackEvent('Page View', { page_name: pageName });
};

export default { trackEvent, setUserProperties, trackPageView };
