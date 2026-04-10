"use client"

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { initializeIAP } from '@/lib/iap';

export function IAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const platform = Capacitor.getPlatform();
    if (platform !== 'web') {
      initializeIAP();
    }
  }, []);

  return <>{children}</>;
}
