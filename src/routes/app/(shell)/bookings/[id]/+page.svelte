<script lang="ts">
	import { page } from '$app/state';
	import { useAction, useMutation, usePaginatedQuery, useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import type { Id } from '$lib/api';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Button from '$lib/components/Button.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { formatDate, formatEuro } from '$lib/format';
	import { env } from '$env/dynamic/public';

	const bookingId = $derived(page.params.id as Id<'bookings'>);
	const detail = useQuery(api.bookings.get, () => ({ bookingId }));
	const offers = useQuery(api.bookings.listOffers, () => ({ bookingId }));
	const payments = useQuery(api.payments.listForBooking, () => ({ bookingId }));
	const contracts = useQuery(api.contracts.list, () => ({ bookingId }));
	const myReview = useQuery(api.reviews.mineForBooking, () => ({ bookingId }));
	const disputes = useQuery(api.bookings.listDisputes, () => ({ bookingId }));
	const messages = usePaginatedQuery(
		api.messages.list,
		() => (detail.data ? { threadId: detail.data.booking.threadId } : 'skip'),
		{ initialNumItems: 30 }
	);

	const send = useMutation(api.messages.send);
	const createOffer = useMutation(api.bookings.createOffer);
	const acceptOffer = useMutation(api.bookings.acceptOffer);
	const setStatus = useMutation(api.bookings.setStatus);
	const uploadContract = useMutation(api.contracts.upload);
	const markSigned = useMutation(api.contracts.markSigned);
	const createReview = useMutation(api.reviews.create);
	const checkout = useAction(api.stripe.createCheckout);
	const openDispute = useMutation(api.bookings.openDispute);

	let draft = $state('');
	let fee = $state(1200);
	let hospitality = $state('Hotel + Getränke');
	let rating = $state(5);
	let reviewText = $state('');
	let disputeReason = $state('');
	let error = $state('');

	async function sendMessage(event: Event) {
		event.preventDefault();
		if (!detail.data || !draft.trim()) return;
		await send({ threadId: detail.data.booking.threadId, body: draft });
		draft = '';
	}

	async function offer() {
		await createOffer({ bookingId, fee, hospitality });
	}

	async function pay(kind: 'deposit' | 'remainder') {
		const appUrl = env.PUBLIC_APP_URL ?? page.url.origin;
		try {
			const url = await checkout({
				bookingId,
				kind,
				successUrl: `${appUrl}/app/bookings/${bookingId}?paid=1`,
				cancelUrl: `${appUrl}/app/bookings/${bookingId}`
			});
			window.location.href = url;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Zahlung nicht möglich';
		}
	}
</script>

{#if detail.data}
	{@const booking = detail.data.booking}
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-xs tracking-widest text-mute uppercase">
				{detail.data.organizerName} → {detail.data.djName}
			</p>
			<h1 class="font-display text-3xl font-bold">{booking.eventName}</h1>
			<p class="text-mute">
				{formatDate(booking.eventDate)} · {booking.venueName}, {booking.venueCity}
			</p>
		</div>
		<StatusBadge status={booking.status} />
	</div>

	<div class="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
		<section>
			<h2 class="mb-3 text-sm tracking-widest text-mute uppercase">Chat</h2>
			<div
				class="max-h-[420px] space-y-2 overflow-y-auto rounded-3xl border border-line bg-panel p-4"
			>
				{#if messages.results}
					{#each [...messages.results].reverse() as message (message._id)}
						<div class="rounded-2xl bg-stage px-3 py-2 text-sm">
							<p>{message.body}</p>
						</div>
					{/each}
				{/if}
			</div>
			<form class="mt-3 flex gap-2" onsubmit={sendMessage}>
				<input bind:value={draft} placeholder="Nachricht" />
				<Button type="submit">Senden</Button>
			</form>
		</section>

		<section class="space-y-6">
			<div class="rounded-3xl border border-line p-4">
				<h2 class="text-sm tracking-widest text-mute uppercase">Angebot</h2>
				<div class="mt-3 flex gap-2">
					<input type="number" bind:value={fee} />
					<input bind:value={hospitality} />
				</div>
				<div class="mt-3 flex flex-wrap gap-2">
					<Button onclick={offer}>Angebot senden</Button>
					<Button variant="ghost" onclick={() => acceptOffer({ bookingId })}>Annehmen</Button>
				</div>
				{#if offers.data}
					<ul class="mt-3 space-y-1 text-sm text-mute">
						{#each offers.data as item (item._id)}
							<li>v{item.version}: {formatEuro(item.fee, item.currency)}</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="rounded-3xl border border-line p-4">
				<h2 class="text-sm tracking-widest text-mute uppercase">Status</h2>
				<div class="mt-3 flex flex-wrap gap-2">
					<Button variant="ghost" onclick={() => setStatus({ bookingId, status: 'declined' })}
						>Ablehnen</Button
					>
					<Button variant="ghost" onclick={() => setStatus({ bookingId, status: 'cancelled' })}
						>Absagen</Button
					>
					<Button variant="ghost" onclick={() => setStatus({ bookingId, status: 'completed' })}
						>Abschließen</Button
					>
				</div>
			</div>

			<div class="rounded-3xl border border-line p-4">
				<h2 class="text-sm tracking-widest text-mute uppercase">Vertrag</h2>
				<FileUpload
					label="PDF hochladen"
					accept="application/pdf"
					onuploaded={async ({ storageId, fileName }) => {
						await uploadContract({
							bookingId,
							storageId: storageId as Id<'_storage'>,
							fileName
						});
					}}
				/>
				{#if contracts.data}
					{#each contracts.data as contract (contract._id)}
						<div class="mt-2 flex items-center justify-between text-sm">
							<a href={contract.url ?? '#'} class="underline">{contract.fileName}</a>
							<button
								type="button"
								class="text-acid"
								onclick={() =>
									markSigned({
										contractId: contract._id,
										side: detail.data?.canActAsOrganizer ? 'organizer' : 'artist'
									})}>Signiert markieren</button
							>
						</div>
					{/each}
				{/if}
			</div>

			<div class="rounded-3xl border border-line p-4">
				<h2 class="text-sm tracking-widest text-mute uppercase">Zahlung</h2>
				<div class="mt-3 flex gap-2">
					<Button onclick={() => pay('deposit')}>30% Anzahlung</Button>
					<Button variant="ghost" onclick={() => pay('remainder')}>Rest</Button>
				</div>
				{#if payments.data}
					<ul class="mt-2 text-sm text-mute">
						{#each payments.data as payment (payment._id)}
							<li>{payment.kind}: {payment.status} · {payment.amount / 100} {payment.currency}</li>
						{/each}
					</ul>
				{/if}
				{#if error}
					<p class="mt-2 text-sm text-hot">{error}</p>
				{/if}
			</div>

			{#if booking.status === 'completed' && !myReview.data}
				<div class="rounded-3xl border border-line p-4">
					<h2 class="text-sm tracking-widest text-mute uppercase">Review</h2>
					<input type="number" min="1" max="5" bind:value={rating} />
					<textarea bind:value={reviewText} rows="3"></textarea>
					<Button
						onclick={() =>
							createReview({
								bookingId,
								rating,
								text: reviewText,
								target: detail.data?.canActAsOrganizer ? 'dj' : 'organizer'
							})}>Senden</Button
					>
				</div>
			{/if}

			<div class="rounded-3xl border border-line p-4">
				<h2 class="text-sm tracking-widest text-mute uppercase">Dispute</h2>
				{#if disputes.data}
					<ul class="mt-2 space-y-1 text-sm text-mute">
						{#each disputes.data as item (item._id)}
							<li>{item.status}: {item.reason}</li>
						{/each}
					</ul>
				{/if}
				<textarea
					bind:value={disputeReason}
					rows="2"
					placeholder="Was ist schiefgelaufen?"
					class="mt-3"></textarea>
				<Button
					variant="ghost"
					onclick={() =>
						openDispute({ bookingId, reason: disputeReason }).then(() => (disputeReason = ''))}
					>Dispute eröffnen</Button
				>
			</div>
		</section>
	</div>
{/if}
