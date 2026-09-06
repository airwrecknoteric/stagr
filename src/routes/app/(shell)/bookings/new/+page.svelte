<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import type { Id } from '$lib/api';
	import Button from '$lib/components/Button.svelte';

	const slug = $derived(page.url.searchParams.get('dj') ?? '');
	const dj = useQuery(api.djs.getBySlug, () => (slug ? { slug } : 'skip'));
	const orgs = useQuery(api.orgs.mine, {});
	const create = useMutation(api.bookings.create);

	let eventName = $state('');
	let eventDate = $state('');
	let venueName = $state('');
	let venueCity = $state('Berlin');
	let setLengthMinutes = $state(90);
	let budgetMax = $state(1500);
	let message = $state('Hey, wir würden euch gerne für unsere Night anfragen.');
	let organizerOrgId = $state('');
	let error = $state('');

	async function submit(event: Event) {
		event.preventDefault();
		if (!dj.data) return;
		error = '';
		try {
			const bookingId = await create({
				djProfileId: dj.data.profile._id,
				organizerOrgId: organizerOrgId ? (organizerOrgId as Id<'organizations'>) : undefined,
				eventName,
				eventDate: new Date(eventDate).getTime(),
				setLengthMinutes,
				venueName,
				venueCity,
				budgetMax,
				message
			});
			await goto(`/app/bookings/${bookingId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Anfrage fehlgeschlagen';
		}
	}
</script>

<h1 class="font-display text-3xl font-bold">Booking-Anfrage</h1>
{#if dj.data}
	<p class="text-mute">an {dj.data.profile.stageName}</p>
{/if}

<form class="mt-6 max-w-xl space-y-4" onsubmit={submit}>
	{#if orgs.data && orgs.data.length > 0}
		<label>
			<span class="mb-1 block text-sm text-mute">Als Organisation</span>
			<select bind:value={organizerOrgId}>
				<option value="">Privat</option>
				{#each orgs.data as row (row._id)}
					<option value={row.organization._id}>{row.organization.name}</option>
				{/each}
			</select>
		</label>
	{/if}
	<input bind:value={eventName} placeholder="Eventname" required />
	<input type="datetime-local" bind:value={eventDate} required />
	<input bind:value={venueName} placeholder="Venue" required />
	<input bind:value={venueCity} placeholder="Stadt" required />
	<input type="number" bind:value={setLengthMinutes} placeholder="Setlänge in Minuten" />
	<input type="number" bind:value={budgetMax} placeholder="Budget" />
	<textarea bind:value={message} rows="4"></textarea>
	{#if error}
		<p class="text-sm text-hot">{error}</p>
	{/if}
	<Button type="submit">Anfrage senden</Button>
</form>
