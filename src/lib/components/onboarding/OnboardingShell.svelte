<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		eyebrow,
		title,
		description,
		children
	}: {
		eyebrow: string;
		title: string;
		description: string;
		children: Snippet;
	} = $props();
</script>

<main class="relative min-h-dvh overflow-hidden bg-stage px-4 py-6 sm:px-6 sm:py-10">
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(214,255,63,0.12),transparent_68%)]"
	></div>
	<div class="relative mx-auto w-full max-w-3xl">
		<a href="/app/onboarding" class="inline-flex items-center font-display text-2xl font-extrabold">
			stag<span class="text-acid">r</span>
		</a>

		<section class="mt-8 rounded-[2rem] border border-line bg-panel/95 p-5 shadow-2xl sm:p-8">
			<p class="text-xs font-semibold tracking-[0.2em] text-acid uppercase">{eyebrow}</p>
			<h1
				class="mt-3 max-w-2xl font-display text-3xl leading-tight font-bold sm:text-4xl"
				tabindex="-1"
			>
				{title}
			</h1>
			<p class="mt-3 max-w-2xl text-sm leading-6 text-mute sm:text-base">{description}</p>
			<div class="mt-8">{@render children()}</div>
		</section>

		<p class="mt-5 text-center text-xs text-mute">
			Deine Angaben werden nach jedem Schritt sicher gespeichert.
		</p>
	</div>
</main>
