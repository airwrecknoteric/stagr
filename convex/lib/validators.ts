import { v } from 'convex/values';

export const orgType = v.union(v.literal('promoter'), v.literal('venue'), v.literal('management'));

export const onboardingRole = v.union(
	v.literal('dj'),
	v.literal('promoter'),
	v.literal('venue'),
	v.literal('management')
);

export const onboardingStep = v.union(
	v.literal('role'),
	v.literal('profile'),
	v.literal('details'),
	v.literal('review'),
	v.literal('complete')
);

export const onboardingProfileInput = v.object({
	name: v.string(),
	bio: v.string()
});

export const onboardingDetailsInput = v.union(
	v.object({
		role: v.literal('dj'),
		city: v.string(),
		country: v.string(),
		genres: v.array(v.string()),
		feeMin: v.optional(v.number()),
		feeMax: v.optional(v.number()),
		currency: v.optional(v.string()),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		soundcloud: v.optional(v.string()),
		instagram: v.optional(v.string()),
		mixUrl: v.optional(v.string())
	}),
	v.object({
		role: v.literal('promoter'),
		city: v.string(),
		country: v.string(),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		website: v.optional(v.string()),
		instagram: v.optional(v.string())
	}),
	v.object({
		role: v.literal('venue'),
		address: v.string(),
		city: v.string(),
		country: v.string(),
		capacity: v.optional(v.number()),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		website: v.optional(v.string()),
		instagram: v.optional(v.string())
	}),
	v.object({
		role: v.literal('management'),
		city: v.string(),
		country: v.string(),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		website: v.optional(v.string()),
		instagram: v.optional(v.string())
	})
);

export const publicOnboardingState = v.object({
	role: v.union(onboardingRole, v.null()),
	step: onboardingStep,
	name: v.optional(v.string()),
	bio: v.optional(v.string()),
	city: v.optional(v.string()),
	country: v.optional(v.string()),
	lat: v.optional(v.number()),
	lng: v.optional(v.number()),
	website: v.optional(v.string()),
	instagram: v.optional(v.string()),
	genres: v.optional(v.array(v.string())),
	feeMin: v.optional(v.number()),
	feeMax: v.optional(v.number()),
	currency: v.optional(v.string()),
	soundcloud: v.optional(v.string()),
	mixUrl: v.optional(v.string()),
	address: v.optional(v.string()),
	capacity: v.optional(v.number())
});

export const onboardingFinalizeResult = v.object({
	role: onboardingRole,
	djProfileId: v.union(v.id('djProfiles'), v.null()),
	organizationId: v.union(v.id('organizations'), v.null()),
	venueId: v.union(v.id('venues'), v.null())
});

export const membershipRole = v.union(v.literal('owner'), v.literal('booker'), v.literal('viewer'));

export const bookingStatus = v.union(
	v.literal('requested'),
	v.literal('offered'),
	v.literal('confirmed'),
	v.literal('completed'),
	v.literal('declined'),
	v.literal('cancelled')
);

export const rosterStatus = v.union(v.literal('pending'), v.literal('active'), v.literal('ended'));

export const paymentKind = v.union(v.literal('deposit'), v.literal('remainder'));

export const paymentStatus = v.union(
	v.literal('pending'),
	v.literal('paid'),
	v.literal('failed'),
	v.literal('refunded')
);

export const availabilityKind = v.union(v.literal('busy'), v.literal('free'));

export const disputeStatus = v.union(
	v.literal('open'),
	v.literal('resolved'),
	v.literal('rejected')
);

export const userDoc = v.object({
	_id: v.id('users'),
	_creationTime: v.number(),
	tokenIdentifier: v.string(),
	clerkUserId: v.optional(v.string()),
	name: v.string(),
	email: v.string(),
	pictureUrl: v.optional(v.string()),
	onboardingCompleted: v.boolean(),
	isAdmin: v.boolean(),
	stripeAccountId: v.optional(v.string()),
	stripeAccountReady: v.optional(v.boolean()),
	pushTokens: v.optional(v.array(v.string())),
	createdAt: v.number(),
	updatedAt: v.number()
});

export const organizationDoc = v.object({
	_id: v.id('organizations'),
	_creationTime: v.number(),
	name: v.string(),
	slug: v.string(),
	type: orgType,
	bio: v.optional(v.string()),
	city: v.optional(v.string()),
	country: v.optional(v.string()),
	lat: v.optional(v.number()),
	lng: v.optional(v.number()),
	geohash: v.optional(v.string()),
	website: v.optional(v.string()),
	instagram: v.optional(v.string()),
	verified: v.boolean(),
	featured: v.boolean(),
	stripeAccountId: v.optional(v.string()),
	stripeAccountReady: v.optional(v.boolean()),
	createdAt: v.number(),
	updatedAt: v.number()
});

export const djProfileDoc = v.object({
	_id: v.id('djProfiles'),
	_creationTime: v.number(),
	userId: v.id('users'),
	slug: v.string(),
	stageName: v.string(),
	bio: v.string(),
	genres: v.array(v.string()),
	feeMin: v.optional(v.number()),
	feeMax: v.optional(v.number()),
	currency: v.string(),
	city: v.string(),
	country: v.string(),
	lat: v.optional(v.number()),
	lng: v.optional(v.number()),
	geohash: v.optional(v.string()),
	soundcloud: v.optional(v.string()),
	instagram: v.optional(v.string()),
	mixUrl: v.optional(v.string()),
	avatarStorageId: v.optional(v.id('_storage')),
	techRiderStorageId: v.optional(v.id('_storage')),
	verified: v.boolean(),
	featured: v.boolean(),
	published: v.boolean(),
	createdAt: v.number(),
	updatedAt: v.number()
});

export const venueProfileDoc = v.object({
	_id: v.id('venues'),
	_creationTime: v.number(),
	organizationId: v.id('organizations'),
	slug: v.string(),
	name: v.string(),
	bio: v.string(),
	address: v.string(),
	city: v.string(),
	country: v.string(),
	capacity: v.optional(v.number()),
	lat: v.optional(v.number()),
	lng: v.optional(v.number()),
	geohash: v.optional(v.string()),
	website: v.optional(v.string()),
	instagram: v.optional(v.string()),
	photoStorageIds: v.array(v.id('_storage')),
	verified: v.boolean(),
	featured: v.boolean(),
	published: v.boolean(),
	createdAt: v.number(),
	updatedAt: v.number()
});

export const publicOrganization = v.object({
	_id: v.id('organizations'),
	name: v.string(),
	slug: v.string(),
	type: orgType,
	bio: v.optional(v.string()),
	city: v.optional(v.string()),
	country: v.optional(v.string()),
	lat: v.optional(v.number()),
	lng: v.optional(v.number()),
	website: v.optional(v.string()),
	instagram: v.optional(v.string()),
	verified: v.boolean(),
	featured: v.boolean()
});

export const publicDjProfile = v.object({
	_id: v.id('djProfiles'),
	slug: v.string(),
	stageName: v.string(),
	bio: v.string(),
	genres: v.array(v.string()),
	feeMin: v.optional(v.number()),
	feeMax: v.optional(v.number()),
	currency: v.string(),
	city: v.string(),
	country: v.string(),
	lat: v.optional(v.number()),
	lng: v.optional(v.number()),
	soundcloud: v.optional(v.string()),
	instagram: v.optional(v.string()),
	mixUrl: v.optional(v.string()),
	verified: v.boolean(),
	featured: v.boolean()
});

export const publicVenueProfile = v.object({
	_id: v.id('venues'),
	slug: v.string(),
	name: v.string(),
	bio: v.string(),
	address: v.string(),
	city: v.string(),
	country: v.string(),
	capacity: v.optional(v.number()),
	lat: v.optional(v.number()),
	lng: v.optional(v.number()),
	website: v.optional(v.string()),
	instagram: v.optional(v.string()),
	verified: v.boolean(),
	featured: v.boolean()
});

export const bookingDoc = v.object({
	_id: v.id('bookings'),
	_creationTime: v.number(),
	organizerUserId: v.id('users'),
	organizerOrgId: v.optional(v.id('organizations')),
	djProfileId: v.id('djProfiles'),
	managementId: v.optional(v.id('organizations')),
	venueId: v.optional(v.id('venues')),
	eventName: v.string(),
	eventDate: v.number(),
	setLengthMinutes: v.number(),
	venueName: v.string(),
	venueCity: v.string(),
	budgetMin: v.optional(v.number()),
	budgetMax: v.optional(v.number()),
	currency: v.string(),
	status: bookingStatus,
	threadId: v.id('threads'),
	createdAt: v.number(),
	updatedAt: v.number()
});

export const publicDjCard = v.object({
	_id: v.id('djProfiles'),
	slug: v.string(),
	stageName: v.string(),
	bio: v.string(),
	genres: v.array(v.string()),
	feeMin: v.optional(v.number()),
	feeMax: v.optional(v.number()),
	currency: v.string(),
	city: v.string(),
	country: v.string(),
	lat: v.optional(v.number()),
	lng: v.optional(v.number()),
	verified: v.boolean(),
	featured: v.boolean(),
	avatarUrl: v.union(v.string(), v.null()),
	distanceKm: v.optional(v.number()),
	managementName: v.optional(v.string()),
	managementSlug: v.optional(v.string())
});
