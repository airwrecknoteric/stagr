const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function encodeGeohash(lat: number, lng: number, precision = 5): string {
	let minLat = -90;
	let maxLat = 90;
	let minLng = -180;
	let maxLng = 180;
	let hash = "";
	let bit = 0;
	let ch = 0;
	let even = true;

	while (hash.length < precision) {
		if (even) {
			const mid = (minLng + maxLng) / 2;
			if (lng >= mid) {
				ch = (ch << 1) + 1;
				minLng = mid;
			} else {
				ch <<= 1;
				maxLng = mid;
			}
		} else {
			const mid = (minLat + maxLat) / 2;
			if (lat >= mid) {
				ch = (ch << 1) + 1;
				minLat = mid;
			} else {
				ch <<= 1;
				maxLat = mid;
			}
		}
		even = !even;
		bit += 1;
		if (bit === 5) {
			hash += BASE32[ch] ?? "";
			bit = 0;
			ch = 0;
		}
	}
	return hash;
}

export function hashesForRadius(lat: number, lng: number, radiusKm: number): string[] {
	const precision = radiusKm <= 15 ? 5 : radiusKm <= 50 ? 4 : 3;
	const step = Math.max(radiusKm / 111, 0.05);
	const hashes = new Set<string>();
	for (const dLat of [-step, 0, step]) {
		for (const dLng of [-step, 0, step]) {
			hashes.add(encodeGeohash(lat + dLat, lng + dLng, precision));
		}
	}
	return [...hashes];
}

export function haversineKm(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number
): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export function slugify(value: string): string {
	const base = value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
	return base.length > 0 ? base : "stagr";
}
