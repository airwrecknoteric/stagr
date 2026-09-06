<script lang="ts">
	let {
		value,
		label,
		description,
		selected,
		onselect
	}: {
		value: string;
		label: string;
		description: string;
		selected: boolean;
		onselect: (value: string) => void;
	} = $props();
</script>

<button
	type="button"
	class={[
		'group min-h-32 rounded-2xl border p-4 text-left transition',
		selected
			? 'border-acid bg-acid/10 shadow-[0_0_0_1px_rgba(214,255,63,0.2)]'
			: 'border-line bg-stage/50 hover:border-mute'
	]}
	aria-pressed={selected}
	onclick={() => onselect(value)}
>
	<span class="block font-display text-lg font-bold">{label}</span>
	<span class="mt-2 block text-sm leading-5 text-mute group-hover:text-ink">{description}</span>
</button>
