<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick, untrack } from 'svelte';
	import { useMutation } from 'convex-svelte';
	import Button from '$lib/components/Button.svelte';
	import { GENRES } from '$lib/constants';
	import {
		onboardingApi,
		type DetailsInput,
		type OnboardingRole,
		type OnboardingState
	} from '$lib/onboarding';
	import FormField from './FormField.svelte';
	import ProfilePreview from './ProfilePreview.svelte';
	import RoleCard from './RoleCard.svelte';

	type VisibleStep = 'role' | 'profile' | 'details' | 'review' | 'success';

	let { step, draft }: { step: VisibleStep; draft: OnboardingState } = $props();

	const saveRole = useMutation(onboardingApi.saveRole);
	const saveProfile = useMutation(onboardingApi.saveProfile);
	const saveDetails = useMutation(onboardingApi.saveDetails);
	const finalize = useMutation(onboardingApi.finalize);

	let role = $state<OnboardingRole | null>(untrack(() => draft.role));
	let name = $state(untrack(() => draft.name ?? ''));
	let bio = $state(untrack(() => draft.bio ?? ''));
	let city = $state(untrack(() => draft.city ?? ''));
	let country = $state(untrack(() => draft.country ?? ''));
	let genres = $state<string[]>(untrack(() => draft.genres ?? []));
	let website = $state(untrack(() => draft.website ?? ''));
	let instagram = $state(untrack(() => draft.instagram ?? ''));
	let soundcloud = $state(untrack(() => draft.soundcloud ?? ''));
	let mixUrl = $state(untrack(() => draft.mixUrl ?? ''));
	let address = $state(untrack(() => draft.address ?? ''));
	let capacity = $state<number | undefined>(untrack(() => draft.capacity));
	let busy = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	const roleOptions: Array<{
		value: OnboardingRole;
		label: string;
		description: string;
	}> = [
		{ value: 'dj', label: 'DJ', description: 'Zeige deinen Sound und werde für Events gefunden.' },
		{
			value: 'promoter',
			label: 'Veranstalter:in',
			description: 'Plane Events und finde passende Artists und Venues.'
		},
		{ value: 'venue', label: 'Venue', description: 'Präsentiere deinen Raum für kommende Events.' },
		{
			value: 'management',
			label: 'Management',
			description: 'Organisiere Artists, Anfragen und Bookings.'
		}
	];

	function clean(value: string): string | undefined {
		const trimmed = value.trim();
		return trimmed || undefined;
	}

	function toggleGenre(genre: string) {
		genres = genres.includes(genre) ? genres.filter((item) => item !== genre) : [...genres, genre];
	}

	async function showError(message: string) {
		error = message;
		await tick();
		document.querySelector<HTMLElement>('#onboarding-error')?.focus();
	}

	async function run(action: () => Promise<void>) {
		if (busy) return;
		busy = true;
		error = '';
		fieldErrors = {};
		try {
			await action();
		} catch (reason) {
			await showError(reason instanceof Error ? reason.message : 'Speichern fehlgeschlagen');
		} finally {
			busy = false;
		}
	}

	function profileErrors() {
		const next: Record<string, string> = {};
		if (name.trim().length < 2) next.name = 'Bitte gib mindestens 2 Zeichen ein.';
		if (!bio.trim()) next.bio = 'Bitte ergänze eine kurze Bio.';
		return next;
	}

	function detailsErrors() {
		const next: Record<string, string> = {};
		if (!city.trim()) next.city = 'Bitte gib eine Stadt ein.';
		if (!country.trim()) next.country = 'Bitte gib ein Land ein.';
		if (role === 'dj' && genres.length === 0) next.genres = 'Wähle mindestens ein Genre.';
		if (role === 'venue' && !address.trim()) next.address = 'Bitte gib eine Adresse ein.';
		if (role === 'venue' && capacity !== undefined && capacity <= 0) {
			next.capacity = 'Die Kapazität muss größer als 0 sein.';
		}
		return next;
	}

	async function submitRole(event: SubmitEvent) {
		event.preventDefault();
		const selectedRole = role;
		if (!selectedRole) {
			await showError('Bitte wähle eine Rolle aus.');
			return;
		}
		await run(async () => {
			await saveRole({ role: selectedRole });
			await goto('/app/onboarding/profile');
		});
	}

	async function submitProfile(event: SubmitEvent) {
		event.preventDefault();
		const nextErrors = profileErrors();
		if (Object.keys(nextErrors).length) {
			fieldErrors = nextErrors;
			await showError('Bitte prüfe die markierten Felder.');
			return;
		}
		await run(async () => {
			await saveProfile({ profile: { name: name.trim(), bio: bio.trim() } });
			await goto('/app/onboarding/details');
		});
	}

	function buildDetails(): DetailsInput | null {
		if (!role) return null;
		const common = { city: city.trim(), country: country.trim() };
		if (role === 'dj') {
			return {
				role,
				...common,
				genres,
				soundcloud: clean(soundcloud),
				instagram: clean(instagram),
				mixUrl: clean(mixUrl)
			};
		}
		if (role === 'venue') {
			return {
				role,
				...common,
				address: address.trim(),
				capacity,
				website: clean(website),
				instagram: clean(instagram)
			};
		}
		return {
			role,
			...common,
			website: clean(website),
			instagram: clean(instagram)
		};
	}

	async function submitDetails(event: SubmitEvent) {
		event.preventDefault();
		const nextErrors = detailsErrors();
		const details = buildDetails();
		if (Object.keys(nextErrors).length || !details) {
			fieldErrors = nextErrors;
			await showError('Bitte prüfe die markierten Felder.');
			return;
		}
		await run(async () => {
			await saveDetails({ details });
			await goto('/app/onboarding/review');
		});
	}

	async function submitReview(event: SubmitEvent) {
		event.preventDefault();
		await run(async () => {
			await finalize({});
			await goto('/app/onboarding/success', { replaceState: true });
		});
	}

	function previousStep() {
		const previous: Partial<Record<VisibleStep, VisibleStep>> = {
			profile: 'role',
			details: 'profile',
			review: 'details'
		};
		const target = previous[step];
		if (target) void goto(`/app/onboarding/${target}`);
	}
</script>

{#if error}
	<p
		id="onboarding-error"
		tabindex="-1"
		class="mb-5 rounded-xl border border-hot/40 bg-hot/10 px-4 py-3 text-sm text-hot outline-none"
		role="alert"
		aria-live="assertive"
	>
		{error}
	</p>
{/if}

{#if step === 'role'}
	<form onsubmit={submitRole}>
		<fieldset disabled={busy}>
			<legend class="sr-only">Deine Rolle auf Stagr</legend>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each roleOptions as option (option.value)}
					<RoleCard
						value={option.value}
						label={option.label}
						description={option.description}
						selected={role === option.value}
						onselect={(value) => (role = value as OnboardingRole)}
					/>
				{/each}
			</div>
		</fieldset>
		<div class="mt-8 flex justify-end">
			<Button type="submit" disabled={busy}>{busy ? 'Speichert …' : 'Weiter'}</Button>
		</div>
	</form>
{:else if step === 'profile'}
	<form onsubmit={submitProfile} class="space-y-5">
		<fieldset disabled={busy} class="space-y-5">
			<legend class="sr-only">Basisprofil</legend>
			<FormField
				id="profile-name"
				label={role === 'dj' ? 'Künstlername' : 'Organisationsname'}
				error={fieldErrors.name}
				required
			>
				{#snippet children({ describedBy, invalid })}
					<input
						id="profile-name"
						bind:value={name}
						aria-describedby={describedBy}
						aria-invalid={invalid}
						autocomplete="organization"
					/>
				{/snippet}
			</FormField>
			<FormField
				id="profile-bio"
				label="Kurzprofil"
				hint="Ein bis drei Sätze reichen für den Start."
				error={fieldErrors.bio}
				required
			>
				{#snippet children({ describedBy, invalid })}
					<textarea
						id="profile-bio"
						bind:value={bio}
						aria-describedby={describedBy}
						aria-invalid={invalid}
						rows="4"
						maxlength="400"></textarea>
				{/snippet}
			</FormField>
		</fieldset>
		<div class="flex items-center justify-between gap-3">
			<Button variant="ghost" onclick={previousStep} disabled={busy}>Zurück</Button>
			<Button type="submit" disabled={busy}>{busy ? 'Speichert …' : 'Weiter'}</Button>
		</div>
	</form>
{:else if step === 'details'}
	<form onsubmit={submitDetails} class="space-y-6">
		<fieldset disabled={busy} class="space-y-5">
			<legend class="sr-only">Rollenspezifische Angaben</legend>
			{#if role === 'dj'}
				<div>
					<fieldset>
						<legend class="mb-2 text-sm font-medium">
							Genres <span class="text-acid" aria-hidden="true">*</span>
						</legend>
						<div class="flex flex-wrap gap-2">
							{#each GENRES as genre (genre)}
								<button
									type="button"
									class={[
										'rounded-full border px-3 py-1.5 text-sm transition',
										genres.includes(genre)
											? 'border-acid bg-acid/10 text-acid'
											: 'border-line text-mute hover:text-ink'
									]}
									aria-pressed={genres.includes(genre)}
									onclick={() => toggleGenre(genre)}
								>
									{genre}
								</button>
							{/each}
						</div>
						{#if fieldErrors.genres}
							<p class="mt-2 text-sm text-hot">{fieldErrors.genres}</p>
						{/if}
					</fieldset>
				</div>
			{:else if role === 'venue'}
				<FormField id="venue-address" label="Adresse" error={fieldErrors.address} required>
					{#snippet children({ describedBy, invalid })}
						<input
							id="venue-address"
							bind:value={address}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							autocomplete="street-address"
						/>
					{/snippet}
				</FormField>
				<FormField
					id="venue-capacity"
					label="Kapazität"
					hint="Optional, als maximale Personenzahl."
					error={fieldErrors.capacity}
				>
					{#snippet children({ describedBy, invalid })}
						<input
							id="venue-capacity"
							type="number"
							min="1"
							bind:value={capacity}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							inputmode="numeric"
						/>
					{/snippet}
				</FormField>
			{/if}

			<div class="grid gap-4 sm:grid-cols-2">
				<FormField id="details-city" label="Stadt" error={fieldErrors.city} required>
					{#snippet children({ describedBy, invalid })}
						<input
							id="details-city"
							bind:value={city}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							autocomplete="address-level2"
						/>
					{/snippet}
				</FormField>
				<FormField id="details-country" label="Land" error={fieldErrors.country} required>
					{#snippet children({ describedBy, invalid })}
						<input
							id="details-country"
							bind:value={country}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							autocomplete="country-name"
						/>
					{/snippet}
				</FormField>
			</div>

			{#if role === 'dj'}
				<div class="grid gap-4 sm:grid-cols-2">
					<FormField id="dj-instagram" label="Instagram" hint="Optional">
						{#snippet children({ describedBy })}
							<input
								id="dj-instagram"
								bind:value={instagram}
								aria-describedby={describedBy}
								placeholder="@name oder URL"
							/>
						{/snippet}
					</FormField>
					<FormField id="dj-soundcloud" label="SoundCloud" hint="Optional">
						{#snippet children({ describedBy })}
							<input
								id="dj-soundcloud"
								bind:value={soundcloud}
								aria-describedby={describedBy}
								placeholder="Profil-URL"
							/>
						{/snippet}
					</FormField>
				</div>
				<FormField id="dj-mix" label="Mix-Link" hint="Optional">
					{#snippet children({ describedBy })}
						<input
							id="dj-mix"
							bind:value={mixUrl}
							aria-describedby={describedBy}
							placeholder="Link zu einem aktuellen Set"
						/>
					{/snippet}
				</FormField>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2">
					<FormField id="org-website" label="Website" hint="Optional">
						{#snippet children({ describedBy })}
							<input
								id="org-website"
								bind:value={website}
								aria-describedby={describedBy}
								placeholder="https://"
							/>
						{/snippet}
					</FormField>
					<FormField id="org-instagram" label="Instagram" hint="Optional">
						{#snippet children({ describedBy })}
							<input
								id="org-instagram"
								bind:value={instagram}
								aria-describedby={describedBy}
								placeholder="@name oder URL"
							/>
						{/snippet}
					</FormField>
				</div>
			{/if}
		</fieldset>
		<div class="flex items-center justify-between gap-3">
			<Button variant="ghost" onclick={previousStep} disabled={busy}>Zurück</Button>
			<Button type="submit" disabled={busy}>{busy ? 'Speichert …' : 'Weiter'}</Button>
		</div>
	</form>
{:else if step === 'review'}
	<form onsubmit={submitReview}>
		<ProfilePreview {draft} />
		<div class="mt-6 rounded-xl border border-line px-4 py-3 text-sm text-mute">
			Dein Profil wird angelegt, aber noch nicht veröffentlicht.
		</div>
		<div class="mt-8 flex items-center justify-between gap-3">
			<Button variant="ghost" onclick={previousStep} disabled={busy}>Zurück</Button>
			<Button type="submit" disabled={busy}>
				{busy ? 'Profil wird angelegt …' : 'Profil anlegen'}
			</Button>
		</div>
	</form>
{:else}
	<div class="py-4 text-center">
		<div
			class="mx-auto grid size-16 place-items-center rounded-full bg-acid text-2xl font-bold text-black"
		>
			✓
		</div>
		<p class="mx-auto mt-5 max-w-md text-sm leading-6 text-mute">
			Du kannst jetzt deine App öffnen und dein unveröffentlichtes Profil in Ruhe vervollständigen.
		</p>
		<div class="mt-7">
			<Button onclick={() => void goto('/app')}>Zur App</Button>
		</div>
	</div>
{/if}
