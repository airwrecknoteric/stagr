<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import { feeRange } from '$lib/format';

	const slug = $derived(page.params.slug ?? '');
	const data = useQuery(api.djs.getBySlug, () => ({ slug }));
	const reviews = useQuery(api.reviews.listForDj, () =>
		data.data ? { djProfileId: data.data.profile._id } : 'skip'
	);
	const title = $derived(
		data.data ? `${data.data.profile.stageName} · Stagr` : 'DJ · Stagr'
	);
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<SiteHeader />

{#if data.isLoading}
	<p class="p-10 text-mute">Lade Profil…</p>
{:else if !data.data}
	<p class="p-10 text-mute">DJ nicht gefunden.</p>
{:else}
	{@const profile = data.data.profile}
	<main class="mx-auto max-w-4xl px-4 py-12">
		<div class="flex flex-col gap-6 md:flex-row">
			<div
				class="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl bg-panel font-display text-5xl text-acid"
			>
				{#if data.data.avatarUrl}
					<img src={data.data.avatarUrl} alt={profile.stageName} class="h-full w-full object-cover" />
				{:else}
					{profile.stageName.slice(0, 1)}
				{/if}
			</div>
			<div>
				<p class="text-xs uppercase tracking-[0.25em] text-mute">{profile.city}, {profile.country}</p>
				<h1 class="font-display text-5xl font-extrabold">{profile.stageName}</h1>
				<p class="mt-3 max-w-xl text-mute">{profile.bio}</p>
				<p class="mt-3 text-acid">{feeRange(profile.feeMin, profile.feeMax, profile.currency)}</p>
				{#if data.data.management}
					<p class="mt-2 text-sm">
						Vertreten von
						<a class="text-hot underline" href="/management/{data.data.management.slug}"
							>{data.data.management.name}</a
						>
					</p>
				{/if}
				<div class="mt-6 flex gap-3">
					<Button href="/app/bookings/new?dj={profile.slug}">Anfragen</Button>
					{#if profile.mixUrl}
						<Button href={profile.mixUrl} variant="ghost">Mix</Button>
					{/if}
				</div>
			</div>
		</div>
		<div class="mt-8 flex flex-wrap gap-2">
			{#each profile.genres as genre (genre)}
				<span class="rounded-full border border-line px-3 py-1 text-sm text-mute">{genre}</span>
			{/each}
		</div>
		{#if reviews.data}
			<section class="mt-12">
				<h2 class="font-display text-2xl font-bold">
					Reviews {#if reviews.data.average}· {reviews.data.average.toFixed(1)}{/if}
				</h2>
				<div class="mt-4 space-y-3">
					{#each reviews.data.items as review (review._id)}
						<article class="rounded-2xl border border-line bg-panel p-4">
							<p class="text-acid">{'★'.repeat(review.rating)}</p>
							<p class="mt-1 text-sm text-mute">{review.text}</p>
						</article>
					{/each}
				</div>
			</section>
		{/if}
	</main>
{/if}
