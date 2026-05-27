// Design tokens shared across themes (sizing, radius, typography).
// Picked from prototype's repeated values: padding 22, card radius 18, button radius 14, etc.

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

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
