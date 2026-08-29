<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatDateTime } from '$lib/format';

	const inbox = useQuery(api.messages.inbox, {});
</script>

<h1 class="font-display text-3xl font-bold">Inbox</h1>
<p class="text-mute">Alle Booking-Threads, ohne Mail-Pingpong.</p>

<div class="mt-6 space-y-2">
	{#if inbox.data}
		{#each inbox.data as thread (thread.threadId)}
			<a
				href={thread.bookingId ? `/app/bookings/${thread.bookingId}` : '/app'}
				class="block rounded-2xl border border-line bg-panel px-4 py-4"
			>
				<div class="flex items-center justify-between">
					<p class="font-medium">{thread.eventName}</p>
					{#if thread.status}
						<StatusBadge status={thread.status} />
					{/if}
				</div>
				<p class="truncate text-sm text-mute">{thread.preview}</p>
				<p class="mt-1 text-xs text-mute">{formatDateTime(thread.updatedAt)}</p>
			</a>
		{/each}
	{/if}
</div>
