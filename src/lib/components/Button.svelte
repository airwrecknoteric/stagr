<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		href,
		children,
		variant = 'primary',
		type = 'button',
		onclick,
		disabled = false
	}: {
		href?: string;
		children: Snippet;
		variant?: 'primary' | 'ghost' | 'hot';
		type?: 'button' | 'submit';
		onclick?: (event: MouseEvent) => void;
		disabled?: boolean;
	} = $props();

	const classes = $derived(
		[
			'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide transition disabled:opacity-50',
			variant === 'primary' && 'bg-acid text-black hover:brightness-110',
			variant === 'ghost' && 'border border-line text-ink hover:border-acid',
			variant === 'hot' && 'bg-hot text-white hover:brightness-110'
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if href}
	<a {href} class={classes}>{@render children()}</a>
{:else}
	<button {type} class={classes} {onclick} {disabled}>{@render children()}</button>
{/if}
