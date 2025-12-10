export const COLORS = {
  background: '#0B0A12',  // Very dark violet/black (Midnight)
  surface: '#15141F',     // Dark violet surface
  surfaceHighlight: '#232130', // Highlight for items/cards
  accent: '#A855F7',      // Vivid Purple
  primary: '#A855F7',     // Same as accent
  secondary: '#EC4899',   // Pink for gradients/secondary actions
  
  textPrimary: '#FAFAFA', // Near white
  textSecondary: '#A1A1AA', // Cool gray
  textInverse: '#0B0A12',   // Dark text for light backgrounds (like primary buttons)
  textTertiary: '#71717A',

  border: '#27272A',      // Subtle dark border
  
  success: '#10B981',     // Emerald
  error: '#EF4444',       // Red
  warning: '#F59E0B',     // Amber
  
  disabled: '#52525B',
  backdrop: 'rgba(11, 10, 18, 0.75)',
  overlay: 'rgba(11, 10, 18, 0.9)',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  regular: 'System',
  medium: 'System', // Weight 500
  bold: 'System',   // Weight 700
};

export const RADIUS = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 8,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.58,
    shadowRadius: 16.00,
    elevation: 24,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  }
};
