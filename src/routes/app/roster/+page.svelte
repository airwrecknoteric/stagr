<script lang="ts">
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import Button from '$lib/components/Button.svelte';

	const orgs = useQuery(api.orgs.mine, {});
	const management = $derived(
		orgs.data?.find((row) => row.organization.type === 'management')?.organization
	);
	const roster = useQuery(api.roster.mine, () =>
		management ? { organizationId: management._id } : 'skip'
	);
	const invite = useMutation(api.roster.inviteBySlug);
	let djSlug = $state('');
	let exclusive = $state(false);

	async function add(event: Event) {
		event.preventDefault();
		if (!management) return;
		await invite({
			organizationId: management._id,
			djSlug,
			exclusive,
			canNegotiate: true
		});
		djSlug = '';
	}
</script>

<h1 class="font-display text-3xl font-bold">Roster</h1>
{#if !management}
	<p class="mt-3 text-mute">
		Nur Managements haben ein Roster. Lege eines unter Settings an oder gehe durchs Onboarding.
	</p>
{:else}
	<p class="text-mute">{management.name}</p>
	<form class="mt-6 flex gap-2" onsubmit={add}>
		<input bind:value={djSlug} placeholder="DJ-Slug, z.B. nina-kraviz" />
		<label class="flex items-center gap-2 text-sm text-mute">
			<input type="checkbox" bind:checked={exclusive} class="w-auto" /> exclusive
		</label>
		<Button type="submit">Einladen</Button>
	</form>
	<div class="mt-6 space-y-2">
		{#if roster.data}
			{#each roster.data as row (row._id)}
				<a href="/dj/{row.dj.slug}" class="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
					<div>
						<p>{row.dj.stageName}</p>
						<p class="text-sm text-mute">{row.status}{row.exclusive ? ' · exclusive' : ''}</p>
					</div>
				</a>
			{/each}
		{/if}
	</div>
{/if}
