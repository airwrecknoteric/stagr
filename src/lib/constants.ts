export const GENRES = [
	'House',
	'Techno',
	'Tech House',
	'Minimal',
	'Drum & Bass',
	'Garage',
	'Disco',
	'Funk',
	'Hip-Hop',
	'Afro',
	'Trance',
	'Hard Groove',
	'Ambient',
	'Open Format'
] as const;

export const CITIES = [
	'Berlin',
	'Hamburg',
	'München',
	'Köln',
	'Frankfurt',
	'Düsseldorf',
	'Leipzig',
	'Stuttgart',
	'Wien',
	'Zürich',
	'Amsterdam'
];

export const BOOKING_STATUS_LABEL: Record<string, string> = {
	requested: 'Angefragt',
	offered: 'Angebot',
	confirmed: 'Bestätigt',
	completed: 'Abgeschlossen',
	declined: 'Abgelehnt',
	cancelled: 'Abgesagt'
};
