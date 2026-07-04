// Shared design tokens for EasyCare. All three modules import from here.
// Colours come straight from the design doc (Food & Medicine Log design PDF).

export const colors = {
  background: '#E5E7EB', // main app background
  card: '#FFFFFF',

  primary: '#2F6F6E', // Primary Teal
  primaryDark: '#235153', // Dark Teal
  primaryLight: '#DDEFEA', // Light Teal

  success: '#168C74',
  successBg: '#DCEFE8',

  warning: '#C94D52',
  warningBg: '#F8DCDD',

  text: '#111827',
  textSecondary: '#4B5563',
  border: '#D1D5DB', // border / divider

  white: '#FFFFFF',
};

// Generous spacing scale for a senior-friendly, low-density layout.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

// Large, high-contrast type scale for accessibility.
export const typography = {
  title: { fontSize: 30, fontWeight: '700', color: colors.primary },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  sectionLabel: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 17, color: colors.text },
  bodySecondary: { fontSize: 15, color: colors.textSecondary },
  small: { fontSize: 13, color: colors.textSecondary },
};

// Minimum touch target for buttons/rows (accessibility guideline).
export const MIN_TOUCH = 48;
