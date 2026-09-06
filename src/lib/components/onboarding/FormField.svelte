<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		label,
		hint,
		error,
		required = false,
		children
	}: {
		id: string;
		label: string;
		hint?: string;
		error?: string;
		required?: boolean;
		children: Snippet<[{ describedBy: string | undefined; invalid: boolean }]>;
	} = $props();

	const describedBy = $derived(
		[hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
	);
</script>

<div>
	<label for={id} class="mb-1.5 block text-sm font-medium">
		{label}{#if required}<span class="ml-1 text-acid" aria-hidden="true">*</span>{/if}
	</label>
	{#if hint}
		<p id={`${id}-hint`} class="mb-2 text-xs leading-5 text-mute">{hint}</p>
	{/if}
	{@render children({ describedBy, invalid: Boolean(error) })}
	{#if error}
		<p id={`${id}-error`} class="mt-1.5 text-sm text-hot">{error}</p>
	{/if}
</div>
