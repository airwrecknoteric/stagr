<script lang="ts">
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { useAuth } from 'convex-svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { clerkAuthAppearance } from '$lib/clerkAppearance';
	import { t } from '$lib/i18n';

	const ready = Boolean(env.PUBLIC_CLERK_PUBLISHABLE_KEY);
	const auth = useAuth();

	$effect(() => {
		if (auth.isAuthenticated) void goto('/app');
	});
</script>

<AuthShell>
	{#if ready}
		{#await import('svelte-clerk') then clerk}
			<clerk.SignIn forceRedirectUrl="/app" signUpUrl="/sign-up" appearance={clerkAuthAppearance} />
		{/await}
	{:else}
		<div class="rounded-3xl border border-line bg-panel p-8 text-center">
			<h1 class="font-display text-2xl font-bold">{t('login')}</h1>
			<p class="mt-3 text-sm text-mute">
				{t('clerkMissing')} Setze <code>PUBLIC_CLERK_PUBLISHABLE_KEY</code> und
				<code>CLERK_SECRET_KEY</code>.
			</p>
		</div>
	{/if}
</AuthShell>
