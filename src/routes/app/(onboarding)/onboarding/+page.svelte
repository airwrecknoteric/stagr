<script lang="ts">
	import { goto } from '$app/navigation';
	import { useQuery } from 'convex-svelte';
	import { onboardingApi } from '$lib/onboarding';

	const onboarding = useQuery(onboardingApi.getState, {});
	const destination = $derived(
		onboarding.data
			? `/app/onboarding/${onboarding.data.step === 'complete' ? 'success' : onboarding.data.step}`
			: null
	);

	$effect(() => {
		if (destination) {
			void goto(destination, { replaceState: true, invalidateAll: false });
		}
	});
</script>

<div class="py-8 text-center text-sm text-mute" role="status" aria-live="polite">
	Dein Fortschritt wird geladen …
</div>
