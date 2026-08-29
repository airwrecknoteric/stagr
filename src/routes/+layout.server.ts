import { buildClerkProps } from 'svelte-clerk/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	try {
		return {
			...buildClerkProps(locals.auth())
		};
	} catch {
		return {};
	}
};
