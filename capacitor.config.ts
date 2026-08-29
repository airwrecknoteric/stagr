import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

const config: CapacitorConfig = {
	appId: 'com.stagr.app',
	appName: 'Stagr',
	webDir: 'build',
	server: {
		url: appUrl,
		cleartext: true,
		androidScheme: 'https',
		iosScheme: 'https'
	},
	plugins: {
		PushNotifications: {
			presentationOptions: ['badge', 'sound', 'alert']
		},
		SplashScreen: {
			backgroundColor: '#0b0b0c'
		}
	}
};

export default config;
