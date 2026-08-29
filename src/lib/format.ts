export function formatEuro(amount: number | undefined, currency = 'EUR'): string {
	if (amount === undefined) return 'auf Anfrage';
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(amount);
}

export function formatDate(ts: number): string {
	return new Intl.DateTimeFormat('de-DE', {
		weekday: 'short',
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	}).format(new Date(ts));
}

export function formatDateTime(ts: number): string {
	return new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(ts));
}

export function feeRange(
	min: number | undefined,
	max: number | undefined,
	currency = 'EUR'
): string {
	if (min === undefined && max === undefined) return 'Fee auf Anfrage';
	if (min !== undefined && max !== undefined && min !== max) {
		return `${formatEuro(min, currency)} – ${formatEuro(max, currency)}`;
	}
	return formatEuro(min ?? max, currency);
}
