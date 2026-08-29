<script lang="ts">
	import { feeRange } from '$lib/format';

	let {
		dj
	}: {
		dj: {
			slug: string;
			stageName: string;
			bio: string;
			genres: string[];
			city: string;
			feeMin?: number;
			feeMax?: number;
			currency: string;
			verified: boolean;
			avatarUrl: string | null;
			distanceKm?: number;
			managementName?: string;
		};
	} = $props();
</script>

<a
	href="/dj/{dj.slug}"
	class="group block rounded-3xl border border-line bg-panel p-4 transition hover:border-acid/60"
>
	<div class="flex gap-4">
		<div
			class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stage font-display text-xl text-acid"
		>
			{#if dj.avatarUrl}
				<img src={dj.avatarUrl} alt={dj.stageName} class="h-full w-full object-cover" />
			{:else}
				{dj.stageName.slice(0, 1)}
			{/if}
		</div>
		<div class="min-w-0">
			<div class="flex items-center gap-2">
				<h3 class="truncate font-display text-lg font-bold">{dj.stageName}</h3>
				{#if dj.verified}
					<span class="text-[10px] uppercase tracking-widest text-acid">verified</span>
				{/if}
			</div>
			<p class="truncate text-sm text-mute">{dj.city} · {feeRange(dj.feeMin, dj.feeMax, dj.currency)}</p>
			<p class="mt-1 line-clamp-2 text-sm text-mute">{dj.bio}</p>
			<div class="mt-2 flex flex-wrap gap-1.5">
				{#each dj.genres.slice(0, 3) as genre (genre)}
					<span class="rounded-full border border-line px-2 py-0.5 text-[11px] text-mute">{genre}</span>
				{/each}
				{#if dj.managementName}
					<span class="text-[11px] text-hot">via {dj.managementName}</span>
				{/if}
				{#if dj.distanceKm !== undefined}
					<span class="text-[11px] text-mute">{dj.distanceKm.toFixed(0)} km</span>
				{/if}
			</div>
		</div>
	</div>
</a>
