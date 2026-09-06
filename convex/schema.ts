import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import {
	availabilityKind,
	bookingStatus,
	membershipRole,
	onboardingRole,
	onboardingStep,
	orgType,
	paymentKind,
	paymentStatus,
	rosterStatus
} from './lib/validators';

export default defineSchema({
	users: defineTable({
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
	})
		.index('by_token', ['tokenIdentifier'])
		.index('by_email', ['email'])
		.index('by_clerk', ['clerkUserId']),

	onboardingDrafts: defineTable({
		userId: v.id('users'),
		role: onboardingRole,
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
		capacity: v.optional(v.number()),
		resultDjProfileId: v.optional(v.id('djProfiles')),
		resultOrganizationId: v.optional(v.id('organizations')),
		resultVenueId: v.optional(v.id('venues')),
		createdAt: v.number(),
		updatedAt: v.number()
	}).index('by_user', ['userId']),

	organizations: defineTable({
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
	})
		.index('by_slug', ['slug'])
		.index('by_type', ['type'])
		.index('by_geohash', ['geohash']),

	memberships: defineTable({
		userId: v.id('users'),
		organizationId: v.id('organizations'),
		role: membershipRole,
		createdAt: v.number()
	})
		.index('by_user', ['userId'])
		.index('by_org', ['organizationId'])
		.index('by_org_and_user', ['organizationId', 'userId']),

	djProfiles: defineTable({
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
	})
		.index('by_user', ['userId'])
		.index('by_slug', ['slug'])
		.index('by_geohash', ['geohash'])
		.index('by_published', ['published'])
		.index('by_featured', ['featured'])
		.searchIndex('search_name', {
			searchField: 'stageName',
			filterFields: ['published']
		}),

	venues: defineTable({
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
	})
		.index('by_org', ['organizationId'])
		.index('by_slug', ['slug'])
		.index('by_geohash', ['geohash'])
		.index('by_published', ['published']),

	rosterEntries: defineTable({
		managementId: v.id('organizations'),
		djProfileId: v.id('djProfiles'),
		exclusive: v.boolean(),
		canNegotiate: v.boolean(),
		status: rosterStatus,
		createdAt: v.number()
	})
		.index('by_management', ['managementId'])
		.index('by_dj', ['djProfileId'])
		.index('by_management_and_dj', ['managementId', 'djProfileId'])
		.index('by_management_and_status', ['managementId', 'status']),

	bookings: defineTable({
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
	})
		.index('by_dj', ['djProfileId'])
		.index('by_organizer', ['organizerUserId'])
		.index('by_management', ['managementId'])
		.index('by_status', ['status'])
		.index('by_thread', ['threadId'])
		.index('by_event_date', ['eventDate']),

	bookingOffers: defineTable({
		bookingId: v.id('bookings'),
		authorUserId: v.id('users'),
		fee: v.number(),
		currency: v.string(),
		hospitality: v.optional(v.string()),
		setStart: v.optional(v.number()),
		setEnd: v.optional(v.number()),
		notes: v.optional(v.string()),
		version: v.number(),
		createdAt: v.number()
	}).index('by_booking', ['bookingId']),

	threads: defineTable({
		bookingId: v.optional(v.id('bookings')),
		createdAt: v.number()
	}).index('by_booking', ['bookingId']),

	threadParticipants: defineTable({
		threadId: v.id('threads'),
		userId: v.id('users'),
		organizationId: v.optional(v.id('organizations')),
		createdAt: v.number()
	})
		.index('by_thread', ['threadId'])
		.index('by_user', ['userId'])
		.index('by_thread_and_user', ['threadId', 'userId']),

	messages: defineTable({
		threadId: v.id('threads'),
		authorUserId: v.id('users'),
		body: v.string(),
		fileStorageId: v.optional(v.id('_storage')),
		fileName: v.optional(v.string()),
		createdAt: v.number()
	}).index('by_thread', ['threadId']),

	availability: defineTable({
		djProfileId: v.id('djProfiles'),
		start: v.number(),
		end: v.number(),
		kind: availabilityKind,
		note: v.optional(v.string()),
		createdAt: v.number()
	})
		.index('by_dj', ['djProfileId'])
		.index('by_dj_and_start', ['djProfileId', 'start']),

	contracts: defineTable({
		bookingId: v.id('bookings'),
		storageId: v.id('_storage'),
		fileName: v.string(),
		uploadedBy: v.id('users'),
		signedByOrganizer: v.boolean(),
		signedByArtist: v.boolean(),
		createdAt: v.number()
	}).index('by_booking', ['bookingId']),

	payments: defineTable({
		bookingId: v.id('bookings'),
		kind: paymentKind,
		amount: v.number(),
		currency: v.string(),
		platformFee: v.number(),
		stripePaymentIntentId: v.optional(v.string()),
		stripeCheckoutSessionId: v.optional(v.string()),
		status: paymentStatus,
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index('by_booking', ['bookingId'])
		.index('by_session', ['stripeCheckoutSessionId']),

	reviews: defineTable({
		bookingId: v.id('bookings'),
		fromUserId: v.id('users'),
		toUserId: v.optional(v.id('users')),
		toDjProfileId: v.optional(v.id('djProfiles')),
		toOrgId: v.optional(v.id('organizations')),
		rating: v.number(),
		text: v.string(),
		createdAt: v.number()
	})
		.index('by_booking', ['bookingId'])
		.index('by_dj', ['toDjProfileId'])
		.index('by_org', ['toOrgId'])
		.index('by_booking_and_from', ['bookingId', 'fromUserId']),

	notifications: defineTable({
		userId: v.id('users'),
		title: v.string(),
		body: v.string(),
		href: v.optional(v.string()),
		read: v.boolean(),
		createdAt: v.number()
	})
		.index('by_user', ['userId'])
		.index('by_user_and_read', ['userId', 'read']),

	disputes: defineTable({
		bookingId: v.id('bookings'),
		openedBy: v.id('users'),
		reason: v.string(),
		status: v.union(v.literal('open'), v.literal('resolved'), v.literal('rejected')),
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index('by_booking', ['bookingId'])
		.index('by_status', ['status']),

	platformSettings: defineTable({
		key: v.string(),
		feePercent: v.number()
	}).index('by_key', ['key'])
});
