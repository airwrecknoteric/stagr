<script lang="ts">
	import { BOOKING_STATUS_LABEL } from '$lib/constants';

	let { status }: { status: string } = $props();

	const tone = $derived(
		status === 'confirmed' || status === 'completed'
			? 'text-acid border-acid/40'
			: status === 'declined' || status === 'cancelled'
				? 'text-hot border-hot/40'
				: 'text-mute border-line'
	);
</script>

<span class={`rounded-full border px-2.5 py-0.5 text-xs uppercase tracking-wider ${tone}`}>
	{BOOKING_STATUS_LABEL[status] ?? status}
</span>
