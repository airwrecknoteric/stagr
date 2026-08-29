import 'svelte-clerk/env';

declare global {
	namespace App {
		interface Locals {
			auth: () => {
				userId: string | null;
				sessionId: string | null;
			};
		}
	}
}

export {};
