<script lang="ts">
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import Button from '$lib/components/Button.svelte';
	import { formatDate } from '$lib/format';

	const me = useQuery(api.users.me, {});
	const dj = useQuery(api.djs.mine, {});
	const bookings = useQuery(api.bookings.listMine, {});
	const blocks = useQuery(api.availability.list, () =>
		dj.data ? { djProfileId: dj.data._id } : 'skip'
	);
	const add = useMutation(api.availability.add);
	const remove = useMutation(api.availability.remove);

	let start = $state('');
	let end = $state('');
	let kind = $state<'busy' | 'free'>('busy');

	async function submit(event: Event) {
		event.preventDefault();
		await add({
			start: new Date(start).getTime(),
			end: new Date(end).getTime(),
			kind
		});
	}
</script>

<h1 class="font-display text-3xl font-bold">Kalender</h1>
<p class="text-mute">Busy-Blöcke und bestätigte Gigs.</p>

{#if dj.data}
	<form class="mt-6 flex flex-col gap-2 md:flex-row" onsubmit={submit}>
		<input type="datetime-local" bind:value={start} required />
		<input type="datetime-local" bind:value={end} required />
		<select bind:value={kind}>
			<option value="busy">Busy</option>
			<option value="free">Free</option>
		</select>
		<Button type="submit">Block speichern</Button>
	</form>
{/if}

<div class="mt-8 space-y-2">
	{#if blocks.data}
		{#each blocks.data as block (block._id)}
			<div
				class="flex items-center justify-between rounded-2xl border border-line px-4 py-3 text-sm"
			>
				<span>{formatDate(block.start)} – {formatDate(block.end)} · {block.kind}</span>
				<button type="button" class="text-hot" onclick={() => remove({ id: block._id })}
					>Löschen</button
				>
			</div>
		{/each}
	{/if}
	{#if bookings.data}
		{#each bookings.data.filter((row) => row.booking.status === 'confirmed') as row (row.booking._id)}
			<a
				href="/app/bookings/{row.booking._id}"
				class="block rounded-2xl border border-acid/30 px-4 py-3"
			>
				{row.booking.eventName} · {formatDate(row.booking.eventDate)}
			</a>
		{/each}
	{/if}
</div>

{#if !me.data}
	<p class="mt-4 text-mute">Bitte einloggen.</p>
{/if}
