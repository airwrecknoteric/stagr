<script lang="ts">
	import { useAction, useMutation, useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import { GENRES } from '$lib/constants';
	import Button from '$lib/components/Button.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import type { Id } from '$lib/api';
	import { env } from '$env/dynamic/public';
	import { page } from '$app/state';

	const me = useQuery(api.users.me, {});
	const dj = useQuery(api.djs.mine, {});
	const orgs = useQuery(api.orgs.mine, {});
	const invites = useQuery(api.roster.myInvites, {});
	const saveDj = useMutation(api.djs.createOrUpdate);
	const attachAvatar = useMutation(api.djs.attachAvatar);
	const attachRider = useMutation(api.djs.attachTechRider);
	const createOrg = useMutation(api.orgs.create);
	const respond = useMutation(api.roster.respond);
	const connect = useAction(api.stripe.createConnectLink);
	const markRead = useMutation(api.notifications.markRead);

	let stageName = $state('');
	let bio = $state('');
	let city = $state('Berlin');
	let genres = $state<string[]>([]);
	let orgName = $state('');
	let orgType = $state<'promoter' | 'venue' | 'management'>('promoter');
	let saved = $state('');

	$effect(() => {
		if (dj.data && !stageName) {
			stageName = dj.data.stageName;
			bio = dj.data.bio;
			city = dj.data.city;
			genres = dj.data.genres;
		}
	});

	async function saveProfile(event: Event) {
		event.preventDefault();
		await saveDj({ stageName, bio, genres, city, country: 'DE', published: true });
		saved = 'Profil gespeichert';
	}

	async function stripe(organizationId?: Id<'organizations'>) {
		const url = await connect({
			organizationId,
			returnUrl: `${env.PUBLIC_APP_URL ?? page.url.origin}/app/settings`
		});
		window.location.href = url;
	}
</script>

<h1 class="font-display text-3xl font-bold">Settings</h1>

{#if me.data}
	<p class="text-mute">{me.data.email}{me.data.stripeAccountReady ? ' · Stripe ready' : ''}</p>
{/if}

<section class="mt-8 max-w-xl space-y-4">
	<h2 class="font-display text-xl">DJ-Profil</h2>
	<form class="space-y-3" onsubmit={saveProfile}>
		<input bind:value={stageName} placeholder="Künstlername" />
		<textarea bind:value={bio} rows="4" placeholder="Bio"></textarea>
		<input bind:value={city} placeholder="Stadt" />
		<div class="flex flex-wrap gap-2">
			{#each GENRES as genre (genre)}
				<button
					type="button"
					class={[
						'rounded-full border px-3 py-1 text-xs',
						genres.includes(genre) ? 'border-acid text-acid' : 'border-line text-mute'
					]}
					onclick={() =>
						(genres = genres.includes(genre)
							? genres.filter((g) => g !== genre)
							: [...genres, genre])}>{genre}</button
				>
			{/each}
		</div>
		<Button type="submit">Speichern</Button>
	</form>
	<FileUpload
		label="Avatar"
		accept="image/*"
		onuploaded={async ({ storageId }) => {
			await attachAvatar({ storageId: storageId as Id<'_storage'> });
		}}
	/>
	<FileUpload
		label="Tech-Rider"
		onuploaded={async ({ storageId }) => {
			await attachRider({ storageId: storageId as Id<'_storage'> });
		}}
	/>
</section>

<section class="mt-10 max-w-xl space-y-3">
	<h2 class="font-display text-xl">Organisation anlegen</h2>
	<input bind:value={orgName} placeholder="Name" />
	<select bind:value={orgType}>
		<option value="promoter">Veranstalter</option>
		<option value="venue">Location</option>
		<option value="management">Management</option>
	</select>
	<Button
		onclick={() =>
			createOrg({
				name: orgName,
				type: orgType,
				city,
				country: 'DE'
			})}>Anlegen</Button
	>
	{#if orgs.data}
		<ul class="text-sm text-mute">
			{#each orgs.data as row (row._id)}
				<li>
					{row.organization.name} · {row.organization.type} · {row.role}
					{#if row.organization.type === 'management' || row.role === 'owner'}
						<button
							type="button"
							class="ml-2 text-acid"
							onclick={() => stripe(row.organization._id)}>Stripe</button
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="mt-10">
	<h2 class="font-display text-xl">Roster-Einladungen</h2>
	{#if invites.data}
		{#each invites.data as invite (invite._id)}
			<div class="mt-2 flex items-center justify-between rounded-2xl border border-line px-4 py-3">
				<p>{invite.organization.name} · {invite.status}</p>
				{#if invite.status === 'pending'}
					<div class="flex gap-2">
						<Button onclick={() => respond({ entryId: invite._id, accept: true })}>Annehmen</Button>
						<Button variant="ghost" onclick={() => respond({ entryId: invite._id, accept: false })}
							>Ablehnen</Button
						>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</section>

<section class="mt-10 flex gap-3">
	<Button onclick={() => stripe()}>Stripe Connect (DJ)</Button>
	<Button variant="ghost" onclick={() => markRead({})}>Notifications gelesen</Button>
</section>
<p class="mt-4 max-w-xl text-sm text-mute">
	Apple Sign-In aktivierst du im Clerk-Dashboard (Social Connections → Apple). Für den iOS-Store ist
	das Pflicht, sobald Google-Login existiert. Capacitor nutzt denselben Clerk-Flow in der WebView.
</p>
{#if saved}
	<p class="mt-3 text-acid">{saved}</p>
{/if}
