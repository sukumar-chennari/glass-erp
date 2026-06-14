/**
 * RAW DESIGN TOKENS
 * Source of truth: PDF design system document.
 * These are primitive values — no context or meaning assigned here.
 * Import from semantic.ts for use in components.
 */

export const colorPalette = {
  // Brand — Primary Purple (PDF: #7F77DD)
  purple50:  '#F0EFFC',
  purple100: '#D4D1F5',
  purple200: '#B8B3EE',
  purple300: '#9C95E6',
  purple400: '#8F87E1',
  purple500: '#7F77DD', // PDF primary
  purple600: '#6960C5',
  purple700: '#5349AD',
  purple800: '#3D3494',
  purple900: '#2A2270',

  // Brand — Accent Teal (PDF: #1D9E75)
  teal50:  '#E8F7F2',
  teal100: '#C0EBD9',
  teal200: '#90D9BE',
  teal300: '#5CC7A2',
  teal400: '#38B58C',
  teal500: '#1D9E75', // PDF accent
  teal600: '#178660',
  teal700: '#126D4E',
  teal800: '#0C533C',
  teal900: '#07382A',

  // Status — Coral (PDF: #D85A30)
  coral50:  '#FDF0EB',
  coral100: '#F9CDB9',
  coral500: '#D85A30', // PDF coral
  coral700: '#A6441F',

  // Status — Amber (PDF: #BA7517)
  amber50:  '#FDF4E3',
  amber100: '#F7DDA3',
  amber500: '#BA7517', // PDF amber
  amber700: '#8F5910',

  // Semantic status colours (standard traffic-light set)
  green50:  '#F0FDF4',
  green100: '#DCFCE7',
  green500: '#16A34A',
  green700: '#15803D',

  red50:  '#FFF1F2',
  red100: '#FFE4E6',
  red500: '#DC2626',
  red700: '#B91C1C',

  blue50:  '#EFF6FF',
  blue100: '#DBEAFE',
  blue500: '#2563EB',
  blue700: '#1D4ED8',

  // Neutral / Grays (PDF: Text #2C2C2A, BG light gray #F1EFE8)
  white:   '#FFFFFF',
  gray50:  '#F9F9F8',
  gray100: '#F1EFE8', // PDF light gray background
  gray150: '#EAE8E1',
  gray200: '#D8D6CF',
  gray300: '#C0BDB5',
  gray400: '#9B9990',
  gray500: '#78766E',
  gray600: '#5A5854',
  gray700: '#4A4A48',
  gray800: '#363634',
  gray900: '#2C2C2A', // PDF text dark
  black:   '#000000',

  // Sidebar-specific (dark, not from PDF light palette — standard admin UX)
  sidebarBg:     '#18163A',
  sidebarBorder: '#2A2755',
  sidebarHover:  '#252252',
} as const;

export const spacing = {
  px:  '1px',
  0:   '0px',
  0.5: '2px',
  1:   '4px',   // half-grid
  2:   '8px',   // PDF base grid unit
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  7:   '28px',
  8:   '32px',
  9:   '36px',
  10:  '40px',
  12:  '48px',
  14:  '56px',
  16:  '64px',
  20:  '80px',
  24:  '96px',
} as const;

export const borderRadius = {
  none: '0px',
  sm:   '4px',
  md:   '6px',  // PDF lower bound
  lg:   '8px',  // PDF upper bound
  xl:   '12px',
  '2xl':'16px',
  '3xl':'20px',
  full: '9999px',
} as const;

export const shadow = {
  none: 'none',
  xs:   '0 1px 2px rgba(0,0,0,0.06)',
  sm:   '0 1px 4px rgba(0,0,0,0.08)',
  md:   '0 2px 8px rgba(0,0,0,0.10)',   // PDF default shadow
  lg:   '0 4px 16px rgba(0,0,0,0.12)',
  xl:   '0 8px 32px rgba(0,0,0,0.15)',
  '2xl':'0 16px 48px rgba(0,0,0,0.18)',
  inner:'inset 0 1px 3px rgba(0,0,0,0.08)',
} as const;

export const typography = {
  // PDF: Helvetica Bold/Regular
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontFamilyMono: "'Courier New', Courier, monospace",

  fontSize: {
    '2xs': '10px',
    xs:    '11px',
    sm:    '12px',
    base:  '13px',
    md:    '14px',
    lg:    '16px',
    xl:    '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px',
    '5xl': '36px',
  },

  fontWeight: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    extrabold:'800',
  },

  lineHeight: {
    none:    '1',
    tight:   '1.25',
    snug:    '1.375',
    normal:  '1.5',
    relaxed: '1.625',
    loose:   '2',
  },

  letterSpacing: {
    tight:   '-0.025em',
    normal:  '0em',
    wide:    '0.025em',
    wider:   '0.05em',
    widest:  '0.1em',
  },
} as const;

export const zIndex = {
  hide:     -1,
  base:     0,
  raised:   10,
  dropdown: 100,
  sticky:   200,
  overlay:  300,
  modal:    400,
  toast:    500,
} as const;

export const breakpoints = {
  sm:   '640px',
  md:   '768px',
  lg:   '1024px',
  xl:   '1280px',
  '2xl':'1440px',
  '3xl':'1920px', // PDF web resolution
} as const;

export const transition = {
  fast:   '150ms ease',
  base:   '200ms ease',
  slow:   '300ms ease',
  slower: '500ms ease',
} as const;

export const sidebarWidth = {
  expanded:  '260px',
  collapsed: '64px',
} as const;
