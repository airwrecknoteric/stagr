<script lang="ts">
	import { page } from '$app/state';
	import OnboardingProgress from '$lib/components/onboarding/OnboardingProgress.svelte';
	import OnboardingShell from '$lib/components/onboarding/OnboardingShell.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	type Step = 'role' | 'profile' | 'details' | 'review' | 'success';
	const copy: Record<Step, { eyebrow: string; title: string; description: string }> = {
		role: {
			eyebrow: 'Los geht’s',
			title: 'Wie möchtest du Stagr nutzen?',
			description:
				'Wähle die Rolle, mit der du starten möchtest. Deine Angaben kannst du später ergänzen.'
		},
		profile: {
			eyebrow: 'Dein Auftritt',
			title: 'Gib deinem Profil Persönlichkeit',
			description: 'Ein klarer Name und eine kurze Bio reichen für den Anfang.'
		},
		details: {
			eyebrow: 'Fast geschafft',
			title: 'Die wichtigen Details',
			description: 'Diese Angaben helfen anderen, dich und deine Arbeit richtig einzuordnen.'
		},
		review: {
			eyebrow: 'Alles im Blick',
			title: 'Prüfe deine Angaben',
			description:
				'Du kannst zu jedem früheren Schritt zurückgehen, bevor dein Profil angelegt wird.'
		},
		success: {
			eyebrow: 'Willkommen bei Stagr',
			title: 'Dein Profil ist startklar',
			description:
				'Es bleibt zunächst unveröffentlicht. Du entscheidest später, wann es sichtbar wird.'
		}
	};
	const rawStep = $derived(page.url.pathname.split('/').at(-1));
	const step = $derived(
		(['role', 'profile', 'details', 'review', 'success'] as const).includes(rawStep as Step)
			? (rawStep as Step)
			: 'role'
	);
	const content = $derived(copy[step]);
</script>

<OnboardingShell eyebrow={content.eyebrow} title={content.title} description={content.description}>
	<OnboardingProgress current={step} />
	{@render children()}
</OnboardingShell>
