<script lang="ts">
	import { page } from '$app/state';
	import { SignInButton, SignUpButton, UserButton, Show } from 'svelte-clerk';
	import { useAuth, useQuery } from 'convex-svelte';
	import { api } from '$lib/api';
	import { env } from '$env/dynamic/public';
	import { t } from '$lib/i18n';

	const clerkReady = Boolean(env.PUBLIC_CLERK_PUBLISHABLE_KEY);
	const auth = useAuth();
	const unread = useQuery(api.notifications.unreadCount, () =>
		auth.isAuthenticated ? {} : 'skip'
	);
	const me = useQuery(api.users.me, () => (auth.isAuthenticated ? {} : 'skip'));

	const homeHref = $derived(auth.isAuthenticated ? '/app' : '/sign-in');
	const links = [
		{ href: '/app/search', label: t('navSearch') },
		{ href: '/app/inbox', label: t('navInbox') },
		{ href: '/app/calendar', label: t('navCalendar') }
	];
</script>

<header class="sticky top-0 z-30 border-b border-line/80 bg-stage/80 backdrop-blur-md">
	<div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
		<a href={homeHref} class="font-display text-2xl font-extrabold tracking-tight">
			stag<span class="text-acid">r</span>
		</a>
		{#if auth.isAuthenticated}
			<nav class="hidden items-center gap-6 text-sm text-mute md:flex">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class={['hover:text-ink', page.url.pathname === link.href && 'text-ink']}
					>
						{link.label}
						{#if link.href === '/app/inbox' && unread.data}
							<span class="ml-1 rounded-full bg-hot px-1.5 text-[10px] text-white"
								>{unread.data}</span
							>
						{/if}
					</a>
				{/each}
				{#if me.data?.isAdmin}
					<a href="/app/admin" class="hover:text-ink">{t('navAdmin')}</a>
				{/if}
			</nav>
		{/if}
		<div class="flex items-center gap-3">
			{#if clerkReady}
				<Show when="signed-out">
					<SignInButton mode="redirect" forceRedirectUrl="/app">
						<span class="text-sm text-mute hover:text-ink">{t('login')}</span>
					</SignInButton>
					<SignUpButton mode="redirect" forceRedirectUrl="/app">
						<span class="rounded-full bg-acid px-4 py-2 text-sm font-semibold text-black">
							{t('getStarted')}
						</span>
					</SignUpButton>
				</Show>
				<Show when="signed-in">
					<a href="/app" class="text-sm text-mute hover:text-ink">{t('navApp')}</a>
					<UserButton />
				</Show>
			{:else}
				<a href="/sign-in" class="rounded-full bg-acid px-4 py-2 text-sm font-semibold text-black"
					>{t('login')}</a
				>
			{/if}
		</div>
	</div>
</header>
