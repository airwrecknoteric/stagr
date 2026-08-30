export const clerkAuthAppearance = {
	options: {
		elevation: 'flush' as const
	},
	variables: {
		colorPrimary: '#d6ff3f',
		colorPrimaryForeground: '#111111',
		colorForeground: '#f4f1ea',
		colorMutedForeground: '#9a958c',
		colorBackground: '#0b0b0c',
		colorInput: '#0e0e0f',
		colorInputForeground: '#f4f1ea',
		colorBorder: '#2a2926',
		colorNeutral: '#9a958c',
		colorRing: 'rgba(214, 255, 63, 0.45)',
		fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
		borderRadius: '0.75rem'
	},
	elements: {
		logoBox: { display: 'none' },
		rootBox: { width: '100%' },
		cardBox: {
			boxShadow: 'none',
			backgroundColor: 'transparent'
		},
		card: {
			boxShadow: 'none',
			backgroundColor: 'transparent'
		},
		footer: {
			background: 'transparent',
			backgroundColor: 'transparent'
		}
	}
};
