import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	let userId: string | null = null;
	try {
		userId = locals.auth()?.userId ?? null;
	} catch {
		userId = null;
	}
	if (userId) {
		redirect(302, '/app');
	}
	redirect(302, '/sign-in');
};
