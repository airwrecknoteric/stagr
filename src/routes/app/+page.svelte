<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatDate } from '$lib/format';

	const bookings = useQuery(api.bookings.listMine, {});
	const inbox = useQuery(api.messages.inbox, {});
	const notifications = useQuery(api.notifications.list, {});
</script>

<h1 class="font-display text-3xl font-bold">Deine Bühne</h1>
<p class="mt-1 text-mute">Bookings, Threads und nächste Schritte an einem Ort.</p>

<section class="mt-8">
	<h2 class="mb-3 text-sm uppercase tracking-widest text-mute">Aktive Bookings</h2>
	<div class="space-y-2">
		{#if bookings.data}
			{#each bookings.data.slice(0, 8) as row (row.booking._id)}
				<a
					href="/app/bookings/{row.booking._id}"
					class="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3"
				>
					<div>
						<p class="font-medium">{row.booking.eventName}</p>
						<p class="text-sm text-mute">{row.counterparty} · {formatDate(row.booking.eventDate)}</p>
					</div>
					<StatusBadge status={row.booking.status} />
				</a>
			{/each}
		{/if}
	</div>
</section>

<section class="mt-10 grid gap-6 md:grid-cols-2">
	<div>
		<h2 class="mb-3 text-sm uppercase tracking-widest text-mute">Inbox</h2>
		{#if inbox.data}
			{#each inbox.data.slice(0, 5) as thread (thread.threadId)}
				<a href="/app/inbox" class="mb-2 block rounded-2xl border border-line px-4 py-3 text-sm">
					<p>{thread.eventName}</p>
					<p class="truncate text-mute">{thread.preview}</p>
				</a>
			{/each}
		{/if}
	</div>
	<div>
		<h2 class="mb-3 text-sm uppercase tracking-widest text-mute">Notifications</h2>
		{#if notifications.data}
			{#each notifications.data.slice(0, 5) as item (item._id)}
				<p class="mb-2 rounded-2xl border border-line px-4 py-3 text-sm">
					<span class="block">{item.title}</span>
					<span class="text-mute">{item.body}</span>
				</p>
			{/each}
		{/if}
	</div>
</section>
