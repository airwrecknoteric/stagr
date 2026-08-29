<script lang="ts">
	import { page } from '$app/state';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<SiteHeader />
<main class="mx-auto max-w-xl px-4 py-24 text-center">
	<p class="text-xs uppercase tracking-[0.3em] text-hot">Fehler</p>
	<h1 class="font-display mt-3 text-4xl font-extrabold">{page.status}</h1>
	<p class="mt-3 text-mute">{page.error?.message ?? 'Etwas ist schiefgelaufen.'}</p>
	<div class="mt-8">
		<Button href="/">Zurück zur Bühne</Button>
	</div>
</main>
