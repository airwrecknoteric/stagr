<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { onDestroy } from 'svelte';
	import 'mapbox-gl/dist/mapbox-gl.css';

	let {
		points = []
	}: {
		points: Array<{
			id: string;
			lat?: number;
			lng?: number;
			label: string;
			href: string;
		}>;
	} = $props();

	const token = env.PUBLIC_MAPBOX_TOKEN ?? '';
	let mapEl: HTMLDivElement | undefined = $state();
	let cleanup: (() => void) | undefined;

	$effect(() => {
		if (!token || !mapEl) return;
		const located = points.filter(
			(point): point is typeof point & { lat: number; lng: number } =>
				point.lat !== undefined && point.lng !== undefined
		);
		if (located.length === 0) return;

		let cancelled = false;
		void import('mapbox-gl').then((mapboxgl) => {
			if (cancelled || !mapEl) return;
			mapboxgl.default.accessToken = token;
			const map = new mapboxgl.default.Map({
				container: mapEl,
				style: 'mapbox://styles/mapbox/dark-v11',
				center: [located[0].lng, located[0].lat],
				zoom: 9
			});
			for (const point of located) {
				const marker = document.createElement('a');
				marker.href = point.href;
				marker.className =
					'block h-3 w-3 rounded-full bg-acid shadow-[0_0_12px_#d6ff3f]';
				marker.title = point.label;
				new mapboxgl.default.Marker({ element: marker })
					.setLngLat([point.lng, point.lat])
					.addTo(map);
			}
			cleanup = () => map.remove();
		});

		return () => {
			cancelled = true;
			cleanup?.();
		};
	});

	onDestroy(() => cleanup?.());
</script>

{#if token}
	<div bind:this={mapEl} class="h-72 w-full overflow-hidden rounded-3xl border border-line"></div>
{:else}
	<div class="rounded-3xl border border-dashed border-line p-6 text-sm text-mute">
		Karte erscheint, sobald <code>PUBLIC_MAPBOX_TOKEN</code> gesetzt ist. Die Liste rechts bleibt
		die Quelle der Wahrheit.
	</div>
{/if}
