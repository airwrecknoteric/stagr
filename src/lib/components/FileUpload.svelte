<script lang="ts">
	import { useMutation } from 'convex-svelte';
	import { api } from '$lib/api';

	let {
		label,
		accept = '*',
		onuploaded
	}: {
		label: string;
		accept?: string;
		onuploaded: (payload: { storageId: string; fileName: string }) => Promise<void> | void;
	} = $props();

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	let busy = $state(false);
	let error = $state('');

	async function onchange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		busy = true;
		error = '';
		try {
			const uploadUrl = await generateUploadUrl({});
			const result = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': file.type },
				body: file
			});
			const json = (await result.json()) as { storageId: string };
			await onuploaded({ storageId: json.storageId, fileName: file.name });
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
		} finally {
			busy = false;
			input.value = '';
		}
	}
</script>

<label class="block">
	<span class="mb-2 block text-sm text-mute">{label}</span>
	<input type="file" {accept} {onchange} disabled={busy} />
	{#if busy}
		<p class="mt-1 text-xs text-mute">Lade hoch…</p>
	{/if}
	{#if error}
		<p class="mt-1 text-xs text-hot">{error}</p>
	{/if}
</label>
