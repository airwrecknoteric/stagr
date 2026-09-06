<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import WizardStep from '$lib/components/onboarding/WizardStep.svelte';
	import { onboardingApi } from '$lib/onboarding';

	type VisibleStep = 'role' | 'profile' | 'details' | 'review' | 'success';

	const onboarding = useQuery(onboardingApi.getState, {});
	const requestedStep = $derived(page.url.pathname.split('/').at(-1));
	const step = $derived(
		(['role', 'profile', 'details', 'review', 'success'] as const).includes(
			requestedStep as VisibleStep
		)
			? (requestedStep as VisibleStep)
			: 'role'
	);
</script>

{#if onboarding.data}
	{#key step}
		<WizardStep {step} draft={onboarding.data} />
	{/key}
{:else if onboarding.error}
	<p class="rounded-xl border border-hot/40 bg-hot/10 px-4 py-3 text-sm text-hot" role="alert">
		Dein Onboarding konnte nicht geladen werden. Bitte lade die Seite erneut.
	</p>
{:else}
	<p class="py-8 text-center text-sm text-mute" role="status">Entwurf wird geladen …</p>
{/if}
