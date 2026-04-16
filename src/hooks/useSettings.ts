import { useState, useEffect } from 'react';

export interface GhostDropSettings {
  // Settings interface kept for future expansion
  _version?: string;
}

const DEFAULT_SETTINGS: GhostDropSettings = {
  _version: '1.0',
};

export const useSettings = () => {
  const [settings, setSettings] = useState<GhostDropSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ghostdrop_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean up legacy settings
        if (parsed.emailjs) delete parsed.emailjs;
        if (parsed.notifications) delete parsed.notifications;
        if (parsed.defaults) delete parsed.defaults;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('ghostdrop_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<GhostDropSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings,
  };
};
