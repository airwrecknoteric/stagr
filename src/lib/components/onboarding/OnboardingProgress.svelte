<script lang="ts">
	type Step = 'role' | 'profile' | 'details' | 'review' | 'success';

	let { current }: { current: Step } = $props();

	const steps: Array<{ id: Step; label: string }> = [
		{ id: 'role', label: 'Rolle' },
		{ id: 'profile', label: 'Profil' },
		{ id: 'details', label: 'Details' },
		{ id: 'review', label: 'Prüfen' },
		{ id: 'success', label: 'Fertig' }
	];
	const currentIndex = $derived(steps.findIndex((step) => step.id === current));
</script>

<nav aria-label="Onboarding-Fortschritt" class="mb-8">
	<ol class="grid grid-cols-5 gap-2">
		{#each steps as step, index (step.id)}
			<li class="min-w-0">
				<div
					class={['h-1 rounded-full', index <= currentIndex ? 'bg-acid' : 'bg-line']}
					aria-hidden="true"
				></div>
				<span
					class={[
						'mt-2 hidden text-[0.7rem] sm:block',
						index === currentIndex ? 'text-ink' : 'text-mute'
					]}
					aria-current={index === currentIndex ? 'step' : undefined}
				>
					{step.label}
				</span>
			</li>
		{/each}
	</ol>
	<p class="mt-3 text-xs text-mute sm:hidden">
		Schritt {Math.max(currentIndex + 1, 1)} von {steps.length}: {steps[currentIndex]?.label}
	</p>
</nav>
