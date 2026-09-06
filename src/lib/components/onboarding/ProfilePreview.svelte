<script lang="ts">
	import { roleLabels, type OnboardingState } from '$lib/onboarding';

	let { draft }: { draft: OnboardingState } = $props();

	const detailRows = $derived.by(() => {
		const rows: Array<{ label: string; value: string }> = [];
		if (draft.city || draft.country) {
			rows.push({ label: 'Ort', value: [draft.city, draft.country].filter(Boolean).join(', ') });
		}
		if (draft.genres?.length) {
			rows.push({ label: 'Genres', value: draft.genres.join(', ') });
		}
		if (draft.address) rows.push({ label: 'Adresse', value: draft.address });
		if (draft.capacity) rows.push({ label: 'Kapazität', value: `${draft.capacity} Personen` });
		if (draft.website) rows.push({ label: 'Website', value: draft.website });
		if (draft.instagram) rows.push({ label: 'Instagram', value: draft.instagram });
		if (draft.soundcloud) rows.push({ label: 'SoundCloud', value: draft.soundcloud });
		if (draft.mixUrl) rows.push({ label: 'Mix', value: draft.mixUrl });
		return rows;
	});
</script>

<article class="rounded-2xl border border-line bg-stage/60 p-5">
	<div class="flex items-start gap-4">
		<div
			class="grid size-12 shrink-0 place-items-center rounded-full bg-acid font-display text-xl font-bold text-black"
		>
			{draft.name?.slice(0, 1).toUpperCase() || 'S'}
		</div>
		<div>
			<p class="text-xs font-semibold tracking-wider text-acid uppercase">
				{draft.role ? roleLabels[draft.role] : 'Profil'}
			</p>
			<h2 class="mt-1 font-display text-2xl font-bold">{draft.name}</h2>
			<p class="mt-2 text-sm leading-6 whitespace-pre-line text-mute">{draft.bio}</p>
		</div>
	</div>

	{#if detailRows.length}
		<dl class="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
			{#each detailRows as row (row.label)}
				<div>
					<dt class="text-xs tracking-wider text-mute uppercase">{row.label}</dt>
					<dd class="mt-1 text-sm break-words">{row.value}</dd>
				</div>
			{/each}
		</dl>
	{/if}
</article>
