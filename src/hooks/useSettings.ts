import { useState, useEffect } from 'react';

export interface GhostDropSettings {
  notifications: {
    emailOnDrop: boolean;
    warningEmail: boolean;
    confirmationEmail: boolean;
  };
  emailjs: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  defaults: {
    checkInWindow: number;
    expiry: number;
    blobNamePrefix: string;
  };
}

const DEFAULT_SETTINGS: GhostDropSettings = {
  notifications: {
    emailOnDrop: true,
    warningEmail: true,
    confirmationEmail: false,
  },
  emailjs: {
    serviceId: '',
    templateId: '',
    publicKey: '',
  },
  defaults: {
    checkInWindow: 1,
    expiry: 365,
    blobNamePrefix: 'vault_',
  },
};

export const useSettings = () => {
  const [settings, setSettings] = useState<GhostDropSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ghostdrop_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('ghostdrop_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<GhostDropSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateNotifications = (newNotifications: Partial<GhostDropSettings['notifications']>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...newNotifications },
    }));
  };

  const updateEmailJS = (newEmailJS: Partial<GhostDropSettings['emailjs']>) => {
    setSettings((prev) => ({
      ...prev,
      emailjs: { ...prev.emailjs, ...newEmailJS },
    }));
  };

  const updateDefaults = (newDefaults: Partial<GhostDropSettings['defaults']>) => {
    setSettings((prev) => ({
      ...prev,
      defaults: { ...prev.defaults, ...newDefaults },
    }));
  };

  return {
    settings,
    updateSettings,
    updateNotifications,
    updateEmailJS,
    updateDefaults,
  };
};
