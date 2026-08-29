<script lang="ts">
	import { setupAuth, setupConvex, useAuth, useMutation } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk/client';
	import { env } from '$env/dynamic/public';
	import { api } from '$lib/api';
	import { initNativeShell } from '$lib/native';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const convexUrl = env.PUBLIC_CONVEX_URL || 'https://placeholder.convex.cloud';
	const configured = Boolean(env.PUBLIC_CONVEX_URL);
	setupConvex(convexUrl);

	let clerk: ReturnType<typeof useClerkContext> | null = null;
	try {
		clerk = useClerkContext();
	} catch {
		clerk = null;
	}

	setupAuth(() => ({
		isLoading: clerk ? !clerk.isLoaded : false,
		isAuthenticated: Boolean(clerk?.session),
		fetchAccessToken: async ({ forceRefreshToken }) => {
			if (!clerk?.session) return null;
			return await clerk.session.getToken({
				template: 'convex',
				skipCache: forceRefreshToken
			});
		}
	}));

	const auth = useAuth();
	const storeUser = useMutation(api.users.store);
	const registerPushToken = useMutation(api.users.registerPushToken);

	$effect(() => {
		if (configured && auth.isAuthenticated) {
			void storeUser({});
			void initNativeShell(async (token) => {
				await registerPushToken({ token });
			});
		}
	});
</script>

{#if !configured}
	<div class="bg-hot/20 px-4 py-2 text-center text-sm text-hot">
		Convex ist noch nicht verbunden. Setze <code>PUBLIC_CONVEX_URL</code> in der Umgebung.
	</div>
{/if}

{@render children()}
