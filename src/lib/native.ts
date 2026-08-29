import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';

function pathFromNativeUrl(url: string): string | null {
	try {
		const parsed = new URL(url);
		if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
			return `${parsed.pathname}${parsed.search}${parsed.hash}`;
		}
		const host = parsed.hostname;
		const path = parsed.pathname || '';
		if (host) {
			return `/${host}${path}${parsed.search}${parsed.hash}`.replace(/\/{2,}/g, '/');
		}
		return path ? `${path}${parsed.search}${parsed.hash}` : null;
	} catch {
		return null;
	}
}

export async function initNativeShell(registerToken: (token: string) => Promise<void>) {
	if (!Capacitor.isNativePlatform()) return;

	await StatusBar.setStyle({ style: Style.Dark });
	await StatusBar.setBackgroundColor({ color: '#0b0b0c' });

	await App.addListener('appUrlOpen', ({ url }) => {
		const path = pathFromNativeUrl(url);
		if (path?.startsWith('/')) {
			window.location.assign(path);
		}
	});

	const permission = await PushNotifications.requestPermissions();
	if (permission.receive !== 'granted') return;
	await PushNotifications.register();
	await PushNotifications.addListener('registration', (token) => {
		void registerToken(token.value);
	});
	await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
		const href = event.notification.data?.href;
		if (typeof href === 'string' && href.startsWith('/')) {
			window.location.assign(href);
		}
	});
}
