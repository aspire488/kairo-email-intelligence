import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.kairo.app',
  appName: 'KAIRO',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_kairo',
      iconColor: '#263B31',
      sound: 'beep.wav',
    },
    Haptics: {},
    Preferences: {},
  },
};

export default config;
