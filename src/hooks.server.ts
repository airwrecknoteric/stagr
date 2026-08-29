import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { withClerkHandler } from 'svelte-clerk/server';
import { env } from '$env/dynamic/private';

const clerkEnabled = Boolean(env.CLERK_SECRET_KEY);

const fallback: Handle = async ({ event, resolve }) => {
	if (!event.locals.auth) {
		event.locals.auth = () =>
			({
				userId: null,
				sessionId: null
			}) as ReturnType<typeof event.locals.auth>;
	}
	return resolve(event);
};

export const handle: Handle = clerkEnabled
	? sequence(withClerkHandler(), fallback)
	: fallback;
