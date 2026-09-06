<script lang="ts">
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<SiteHeader />
<div class="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr]">
	<aside class="hidden text-sm text-mute md:block">
		<nav class="sticky top-24 space-y-2" aria-label="App-Navigation">
			<a href="/app" class="block hover:text-ink">Übersicht</a>
			<a href="/app/search" class="block hover:text-ink">Suche</a>
			<a href="/app/inbox" class="block hover:text-ink">Inbox</a>
			<a href="/app/calendar" class="block hover:text-ink">Kalender</a>
			<a href="/app/roster" class="block hover:text-ink">Roster</a>
			<a href="/app/settings" class="block hover:text-ink">Settings</a>
		</nav>
	</aside>
	<div>{@render children()}</div>
</div>
