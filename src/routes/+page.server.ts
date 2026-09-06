import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const userId = (() => {
		try {
			return locals.auth()?.userId ?? null;
		} catch {
			return null;
		}
	})();
	if (userId) {
		redirect(302, '/app');
	}
	redirect(302, '/sign-in');
};
