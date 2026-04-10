import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vscout.app',
  appName: 'Scout Volleyball',
  webDir: 'out',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '728215447744-ukodpj33kdcsa3tqhek374u9nvkqnbiv.apps.googleusercontent.com'
    },
  },
};

export default config;