<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useAuth, useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import { onboardingApi } from '$lib/onboarding';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const auth = useAuth();
	const me = useQuery(api.users.me, () => (auth.isAuthenticated ? {} : 'skip'));
	const onboarding = useQuery(onboardingApi.getState, () =>
		auth.isAuthenticated && me.data ? {} : 'skip'
	);

	const onboardingPath = $derived(page.url.pathname.startsWith('/app/onboarding'));
	const hasGateError = $derived(Boolean(me.error || onboarding.error));
	const redirectTo = $derived.by(() => {
		if (hasGateError) return null;
		if (auth.isLoading) return null;
		if (!auth.isAuthenticated) return '/sign-in';
		if (me.isLoading || !me.data || onboarding.isLoading || !onboarding.data) return null;

		if (me.data.onboardingCompleted) {
			const isCompletionScreen =
				page.url.pathname.endsWith('/onboarding/success') && onboarding.data.step === 'complete';
			return onboardingPath && !isCompletionScreen ? '/app' : null;
		}

		const order = ['role', 'profile', 'details', 'review'] as const;
		const unlockedIndex = order.indexOf(
			onboarding.data.step === 'complete' ? 'review' : onboarding.data.step
		);
		const requestedStep = page.url.pathname.split('/').at(-1);
		const requestedIndex = order.indexOf(requestedStep as (typeof order)[number]);
		const validOnboardingStep =
			onboardingPath && requestedIndex >= 0 && requestedIndex <= unlockedIndex;

		return validOnboardingStep ? null : `/app/onboarding/${order[unlockedIndex] ?? 'role'}`;
	});
	const canRender = $derived.by(() => {
		if (hasGateError) return false;
		if (auth.isLoading || !auth.isAuthenticated || me.isLoading || !me.data) return false;
		if (onboarding.isLoading || !onboarding.data || redirectTo) return false;
		if (me.data.onboardingCompleted) {
			return !onboardingPath || page.url.pathname.endsWith('/onboarding/success');
		}
		return onboardingPath;
	});

	$effect(() => {
		if (redirectTo && page.url.pathname !== redirectTo) {
			void goto(redirectTo, { replaceState: true, invalidateAll: false });
		}
	});
</script>

{#if hasGateError}
	<main class="grid min-h-dvh place-items-center bg-stage px-6 py-12">
		<section
			class="w-full max-w-md rounded-3xl border border-line bg-panel p-8 text-center shadow-2xl"
			aria-labelledby="app-gate-error-title"
			aria-describedby="app-gate-error-description"
			role="alert"
		>
			<p class="font-display text-2xl font-extrabold tracking-tight">
				stag<span class="text-acid">r</span>
			</p>
			<h1 id="app-gate-error-title" class="mt-8 font-display text-xl font-bold">
				Dein Bereich konnte nicht geladen werden.
			</h1>
			<p id="app-gate-error-description" class="mt-3 text-sm text-mute">
				Bitte versuche es noch einmal.
			</p>
			<button
				type="button"
				class="mt-7 rounded-full bg-acid px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
				onclick={() => window.location.reload()}
			>
				Erneut laden
			</button>
		</section>
	</main>
{:else if canRender}
	{@render children()}
{:else}
	<main class="grid min-h-dvh place-items-center bg-stage px-6" aria-busy="true">
		<div class="text-center" role="status" aria-live="polite">
			<p class="font-display text-2xl font-extrabold tracking-tight">
				stag<span class="text-acid">r</span>
			</p>
			<p class="mt-3 text-sm text-mute">Dein Bereich wird vorbereitet …</p>
		</div>
	</main>
{/if}
