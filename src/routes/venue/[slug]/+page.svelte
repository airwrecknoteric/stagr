<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import Button from '$lib/components/Button.svelte';

	const slug = $derived(page.params.slug ?? '');
	const data = useQuery(api.venues.getBySlug, () => ({ slug }));
</script>

<SiteHeader />

{#if !data.data}
	<p class="p-10 text-mute">Location nicht gefunden.</p>
{:else}
	{@const venue = data.data.venue}
	<main class="mx-auto max-w-4xl px-4 py-12">
		<h1 class="font-display text-5xl font-extrabold">{venue.name}</h1>
		<p class="mt-2 text-mute">{venue.address}, {venue.city}</p>
		<p class="mt-4 max-w-xl text-mute">{venue.bio}</p>
		{#if venue.capacity}
			<p class="mt-2 text-sm text-acid">Kapazität {venue.capacity}</p>
		{/if}
		<div class="mt-6 flex gap-3">
			<Button href="/app/search?city={encodeURIComponent(venue.city)}">DJs in der Nähe</Button>
		</div>
		<div class="mt-8 grid gap-3 md:grid-cols-2">
			{#each data.data.photoUrls as url (url)}
				<img src={url} alt={venue.name} class="rounded-3xl border border-line" />
			{/each}
		</div>
	</main>
{/if}
