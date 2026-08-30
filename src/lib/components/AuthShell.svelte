<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<main class="flex min-h-dvh items-center justify-center bg-stage px-4 py-12">
	<div class="flex w-full max-w-sm flex-col items-center">
		<p class="font-display text-2xl font-extrabold tracking-tight">
			stag<span class="text-acid">r</span>
		</p>
		<div class="mt-10 w-full">
			{@render children()}
		</div>
	</div>
</main>
