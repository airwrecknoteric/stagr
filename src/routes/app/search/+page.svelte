<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import { GENRES } from '$lib/constants';
	import DjCard from '$lib/components/DjCard.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import Button from '$lib/components/Button.svelte';
	import { env } from '$env/dynamic/public';

	let query = $state(page.url.searchParams.get('q') ?? '');
	let genre = $state(page.url.searchParams.get('genre') ?? '');
	let city = $state(page.url.searchParams.get('city') ?? '');
	let lat = $state<number | undefined>(undefined);
	let lng = $state<number | undefined>(undefined);
	let radiusKm = $state(80);
	let feeMax = $state<number | undefined>(undefined);

	const results = useQuery(api.search.djs, () => ({
		query: query.trim() || undefined,
		genre: genre || undefined,
		lat,
		lng,
		radiusKm: lat !== undefined ? radiusKm : undefined,
		feeMax,
		limit: 40
	}));

	function locate() {
		navigator.geolocation.getCurrentPosition((pos) => {
			lat = pos.coords.latitude;
			lng = pos.coords.longitude;
		});
	}

	async function geocodeCity() {
		const token = env.PUBLIC_MAPBOX_TOKEN;
		if (!city.trim() || !token) return;
		const response = await fetch(
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${token}&limit=1&language=de`
		);
		if (!response.ok) return;
		const data = (await response.json()) as {
			features?: Array<{ center: [number, number] }>;
		};
		const center = data.features?.[0]?.center;
		if (!center) return;
		lng = center[0];
		lat = center[1];
	}

	const points = $derived(
		(results.data ?? [])
			.filter((dj) => dj.lat !== undefined && dj.lng !== undefined)
			.map((dj) => ({
				id: dj._id,
				lat: dj.lat,
				lng: dj.lng,
				label: dj.stageName,
				href: `/dj/${dj.slug}`
			}))
	);
</script>

<div class="flex items-end justify-between gap-4">
	<div>
		<h1 class="font-display text-3xl font-bold">Suche</h1>
		<p class="text-mute">DJs in der Nähe oder große Names im Roster.</p>
	</div>
	<Button variant="ghost" onclick={locate}>In meiner Nähe</Button>
</div>

<div class="mt-6 grid gap-3 md:grid-cols-4">
	<input bind:value={query} placeholder="Name" />
	<select bind:value={genre}>
		<option value="">Genre</option>
		{#each GENRES as g (g)}
			<option value={g}>{g}</option>
		{/each}
	</select>
	<input
		bind:value={city}
		placeholder="Stadt (optional)"
		onblur={() => void geocodeCity()}
	/>
	<input type="number" bind:value={feeMax} placeholder="Max. Fee" />
</div>

<div class="mt-6">
	<MapView {points} />
</div>

<div class="mt-6 grid gap-4 md:grid-cols-2">
	{#if results.data}
		{#each results.data as dj (dj._id)}
			<DjCard {dj} />
		{/each}
	{/if}
</div>
