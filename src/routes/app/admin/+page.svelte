<script lang="ts">
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import Button from '$lib/components/Button.svelte';

	const me = useQuery(api.users.me, {});
	const overview = useQuery(api.admin.overview, () => (me.data?.isAdmin ? {} : 'skip'));
	const pending = useQuery(api.admin.pendingDjs, () => (me.data?.isAdmin ? {} : 'skip'));
	const orgs = useQuery(api.admin.orgs, () => (me.data?.isAdmin ? {} : 'skip'));
	const disputes = useQuery(api.admin.disputes, () => (me.data?.isAdmin ? {} : 'skip'));
	const verifyDj = useMutation(api.admin.verifyDj);
	const featureDj = useMutation(api.admin.featureDj);
	const verifyOrg = useMutation(api.admin.verifyOrg);
	const resolveDispute = useMutation(api.admin.resolveDispute);
	const setFee = useMutation(api.admin.setFeePercent);
	let feePercent = $state(10);

	$effect(() => {
		if (overview.data) feePercent = overview.data.feePercent;
	});
</script>

<h1 class="font-display text-3xl font-bold">Admin</h1>
{#if !me.data?.isAdmin}
	<p class="mt-4 text-mute">Kein Admin-Zugang. Setze ADMIN_EMAILS in Convex.</p>
{:else if overview.data}
	<div class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
		<div class="rounded-2xl border border-line p-4">
			<p class="text-xs text-mute">Users</p>
			<p class="font-display text-3xl">{overview.data.users}</p>
		</div>
		<div class="rounded-2xl border border-line p-4">
			<p class="text-xs text-mute">DJs</p>
			<p class="font-display text-3xl">{overview.data.djs}</p>
		</div>
		<div class="rounded-2xl border border-line p-4">
			<p class="text-xs text-mute">Bookings</p>
			<p class="font-display text-3xl">{overview.data.bookings}</p>
		</div>
		<div class="rounded-2xl border border-line p-4">
			<p class="text-xs text-mute">Fee %</p>
			<form
				class="mt-2 flex gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					void setFee({ feePercent });
				}}
			>
				<input type="number" bind:value={feePercent} class="w-20" />
				<Button type="submit">OK</Button>
			</form>
		</div>
	</div>

	<section class="mt-10">
		<h2 class="font-display text-xl">DJs verifizieren</h2>
		{#if pending.data}
			{#each pending.data as dj (dj._id)}
				<div class="mt-2 flex items-center justify-between rounded-2xl border border-line px-4 py-3">
					<a href="/dj/{dj.slug}">{dj.stageName}</a>
					<div class="flex gap-2">
						<Button onclick={() => verifyDj({ djProfileId: dj._id, verified: true })}>Verify</Button>
						<Button variant="ghost" onclick={() => featureDj({ djProfileId: dj._id, featured: true })}
							>Feature</Button
						>
					</div>
				</div>
			{/each}
		{/if}
	</section>

	<section class="mt-10">
		<h2 class="font-display text-xl">Organisationen</h2>
		{#if orgs.data}
			{#each orgs.data as org (org._id)}
				<div class="mt-2 flex items-center justify-between rounded-2xl border border-line px-4 py-3">
					<p>{org.name} · {org.type}</p>
					<Button variant="ghost" onclick={() => verifyOrg({ organizationId: org._id, verified: true })}
						>Verify</Button
					>
				</div>
			{/each}
		{/if}
	</section>

	<section class="mt-10">
		<h2 class="font-display text-xl">Disputes</h2>
		{#if disputes.data}
			{#each disputes.data as item (item._id)}
				<div class="mt-2 rounded-2xl border border-line px-4 py-3">
					<a href="/app/bookings/{item.bookingId}" class="font-medium">{item.eventName}</a>
					<p class="text-sm text-mute">{item.reason}</p>
					<div class="mt-2 flex gap-2">
						<Button onclick={() => resolveDispute({ disputeId: item._id, status: 'resolved' })}
							>Lösen</Button
						>
						<Button
							variant="ghost"
							onclick={() => resolveDispute({ disputeId: item._id, status: 'rejected' })}
							>Ablehnen</Button
						>
					</div>
				</div>
			{/each}
		{/if}
	</section>
{/if}
