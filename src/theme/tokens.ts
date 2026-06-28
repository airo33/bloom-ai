// Design tokens — sizing, radius, typography.
// Garden redesign: softer (larger) card radii and a serif/sans pairing.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  /** Standard card / list row */
  card: 22,
  /** Hero / feature cards (progress, hydration, journal cards) */
  hero: 26,
  pill: 999,
} as const;

export const fontSize = {
  micro: 10,
  caption: 11,
  small: 12,
  body: 14,
  bodyLg: 15,
  subhead: 16,
  title: 20,
  titleLg: 23,
  display: 26,
  hero: 30,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '600',
  bold: '700',
  black: '800',
} as const;

/**
 * Font family tokens — Garden pairs a serif display (Newsreader) with a
 * humanist grotesque (Hanken Grotesk).
 *
 * Where serif goes (rule of thumb):
 *   - greeting + name on Home
 *   - big numeric stats (50%, 2/4, 3.2)
 *   - screen section titles ("Today's plan", "Your progress")
 *   - date / range headers ("Jun 23 – 29", "Friday, June 27")
 *   - one-line italic encouragements ("Two more to bloom today.")
 * Everything else (labels, body, buttons, list rows, tab bar) stays Hanken.
 *
 * Falls back to system sans / serif until the @expo-google-fonts modules
 * are loaded by App.tsx — so the screens render correctly even mid-boot.
 */
export const font = {
  serif: 'Newsreader_600SemiBold',
  serifMed: 'Newsreader_500Medium',
  serifItalic: 'Newsreader_500Medium_Italic',
  body: 'HankenGrotesk_400Regular',
  bodyMed: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
  bodyBlack: 'HankenGrotesk_800ExtraBold',
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    shadowColor: '#5F9437',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
