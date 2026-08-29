<script lang="ts">
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { useAuth } from 'convex-svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { t } from '$lib/i18n';

	const ready = Boolean(env.PUBLIC_CLERK_PUBLISHABLE_KEY);
	const auth = useAuth();

	$effect(() => {
		if (auth.isAuthenticated) void goto('/app');
	});
</script>

<SiteHeader />
<main class="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12">
	{#if ready}
		{#await import('svelte-clerk') then clerk}
			<clerk.SignUp forceRedirectUrl="/app/onboarding" signInUrl="/sign-in" />
		{/await}
	{:else}
		<div class="rounded-3xl border border-line bg-panel p-8 text-center">
			<h1 class="font-display text-2xl font-bold">Registrieren</h1>
			<p class="mt-3 text-sm text-mute">{t('clerkMissing')} Setze die Keys in <code>.env.local</code>.</p>
		</div>
	{/if}
</main>
