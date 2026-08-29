<script lang="ts">
	import { goto } from '$app/navigation';
	import { useMutation } from 'convex-svelte';
	import { api } from '$lib/api';
	import { GENRES } from '$lib/constants';
	import Button from '$lib/components/Button.svelte';

	type Role = 'dj' | 'promoter' | 'venue' | 'management';
	let role = $state<Role>('dj');
	let name = $state('');
	let bio = $state('');
	let city = $state('Berlin');
	let country = $state('DE');
	let genres = $state<string[]>(['Techno']);
	let error = $state('');

	const saveDj = useMutation(api.djs.createOrUpdate);
	const createOrg = useMutation(api.orgs.create);
	const saveVenue = useMutation(api.venues.createOrUpdate);

	function toggleGenre(genre: string) {
		genres = genres.includes(genre) ? genres.filter((g) => g !== genre) : [...genres, genre];
	}

	async function submit(event: Event) {
		event.preventDefault();
		error = '';
		try {
			if (role === 'dj') {
				await saveDj({
					stageName: name,
					bio,
					genres,
					city,
					country,
					published: true
				});
			} else {
				const organizationId = await createOrg({
					name,
					type: role,
					bio,
					city,
					country
				});
				if (role === 'venue') {
					await saveVenue({
						organizationId,
						name,
						bio,
						address: city,
						city,
						country,
						published: true
					});
				}
			}
			await goto('/app');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
		}
	}
</script>

<h1 class="font-display text-3xl font-bold">Wer bist du auf Stagr?</h1>
<p class="mt-2 text-mute">Du kannst später weitere Rollen hinzufügen.</p>

<div class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
	{#each [
		{ id: 'dj', label: 'DJ' },
		{ id: 'promoter', label: 'Veranstalter' },
		{ id: 'venue', label: 'Location' },
		{ id: 'management', label: 'Management' }
	] as option (option.id)}
		<button
			type="button"
			class={[
				'rounded-2xl border px-3 py-4 text-left',
				role === option.id ? 'border-acid bg-acid/10' : 'border-line'
			]}
			onclick={() => (role = option.id as Role)}
		>
			{option.label}
		</button>
	{/each}
</div>

<form class="mt-8 max-w-xl space-y-4" onsubmit={submit}>
	<label>
		<span class="mb-1 block text-sm text-mute">{role === 'dj' ? 'Künstlername' : 'Name'}</span>
		<input bind:value={name} required />
	</label>
	<label>
		<span class="mb-1 block text-sm text-mute">Bio</span>
		<textarea bind:value={bio} rows="4"></textarea>
	</label>
	<div class="grid grid-cols-2 gap-3">
		<label>
			<span class="mb-1 block text-sm text-mute">Stadt</span>
			<input bind:value={city} />
		</label>
		<label>
			<span class="mb-1 block text-sm text-mute">Land</span>
			<input bind:value={country} />
		</label>
	</div>
	{#if role === 'dj'}
		<div>
			<p class="mb-2 text-sm text-mute">Genres</p>
			<div class="flex flex-wrap gap-2">
				{#each GENRES as genre (genre)}
					<button
						type="button"
						class={[
							'rounded-full border px-3 py-1 text-xs',
							genres.includes(genre) ? 'border-acid text-acid' : 'border-line text-mute'
						]}
						onclick={() => toggleGenre(genre)}>{genre}</button
					>
				{/each}
			</div>
		</div>
	{/if}
	{#if error}
		<p class="text-sm text-hot">{error}</p>
	{/if}
	<Button type="submit">Profil anlegen</Button>
</form>
