import { api } from '$lib/api';

export type OnboardingRole = 'dj' | 'promoter' | 'venue' | 'management';
export type OnboardingStep = 'role' | 'profile' | 'details' | 'review' | 'complete';

export type OnboardingState = {
	role: OnboardingRole | null;
	step: OnboardingStep;
	name?: string;
	bio?: string;
	city?: string;
	country?: string;
	website?: string;
	instagram?: string;
	genres?: string[];
	feeMin?: number;
	feeMax?: number;
	currency?: string;
	soundcloud?: string;
	mixUrl?: string;
	address?: string;
	capacity?: number;
};

type CommonDetails = {
	city: string;
	country: string;
	website?: string;
	instagram?: string;
};
export type DetailsInput =
	| ({
			role: 'dj';
			genres: string[];
			soundcloud?: string;
			instagram?: string;
			mixUrl?: string;
	  } & Pick<CommonDetails, 'city' | 'country'>)
	| ({ role: 'venue'; address: string; capacity?: number } & CommonDetails)
	| ({ role: 'promoter' | 'management' } & CommonDetails);

export const onboardingApi = api.onboarding;

export const roleLabels: Record<OnboardingRole, string> = {
	dj: 'DJ',
	promoter: 'Veranstalter:in',
	venue: 'Venue',
	management: 'Management'
};
