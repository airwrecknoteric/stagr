<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import DjCard from '$lib/components/DjCard.svelte';

	const slug = $derived(page.params.slug ?? '');
	const data = useQuery(api.roster.listPublic, () => ({ slug }));
</script>

<SiteHeader />

{#if !data.data}
	<p class="p-10 text-mute">Management nicht gefunden.</p>
{:else}
	<main class="mx-auto max-w-5xl px-4 py-12">
		<p class="text-xs uppercase tracking-[0.25em] text-hot">Management</p>
		<h1 class="font-display text-5xl font-extrabold">{data.data.organization.name}</h1>
		<p class="mt-3 max-w-2xl text-mute">{data.data.organization.bio ?? 'Roster auf Stagr.'}</p>
		<div class="mt-10 grid gap-4 md:grid-cols-2">
			{#each data.data.djs as row (row.profile._id)}
				<DjCard
					dj={{
						slug: row.profile.slug,
						stageName: row.profile.stageName,
						bio: row.profile.bio,
						genres: row.profile.genres,
						city: row.profile.city,
						feeMin: row.profile.feeMin,
						feeMax: row.profile.feeMax,
						currency: row.profile.currency,
						verified: row.profile.verified,
						avatarUrl: row.avatarUrl,
						managementName: data.data.organization.name
					}}
				/>
			{/each}
		</div>
	</main>
{/if}
