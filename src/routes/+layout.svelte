<script lang="ts">
	import { ClerkProvider } from 'svelte-clerk';
	import { env } from '$env/dynamic/public';
	import favicon from '$lib/assets/favicon.svg';
	import ConvexBridge from '$lib/components/ConvexBridge.svelte';
	import './layout.css';

	let { data, children } = $props();

	const publishableKey = env.PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
</script>

<svelte:head>
	<title>Stagr — DJ Booking</title>
	<meta
		name="description"
		content="Die Plattform für DJs, Veranstalter, Clubs und Managements. Booking, Chat, Roster — an einem Ort."
	/>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Syne:wght@600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{#if publishableKey}
	<ClerkProvider
		{publishableKey}
		signInUrl="/sign-in"
		signUpUrl="/sign-up"
		signInForceRedirectUrl="/app"
		signUpForceRedirectUrl="/app/onboarding"
		{...data}
	>
		<ConvexBridge>
			{@render children()}
		</ConvexBridge>
	</ClerkProvider>
{:else}
	<ConvexBridge>
		{@render children()}
	</ConvexBridge>
{/if}
